import { describe, expect, it } from 'vitest';
import { FIGURE_KEYS, figureFor, getFigure } from '../../src/shared/figure/items';
import { Animator, clipNames, reactionsFor, samplePose } from '../../src/shared/figure/anim';
import { hull, shapePoints, solve, viewMatrix, apply, mul } from '../../src/shared/figure/math';
import { GALLERY_LOOKS, galleryWorld } from '../../src/shared/engine/presets';
import { defaultSprite } from '../../src/shared/engine/sizing';
import { generate } from '../../src/shared/structure/index';

const finite = (v: number[]) => v.every((x) => Number.isFinite(x));

describe('figure specs', () => {
  it('has a sample set of 25+ things across people, animals, nature, village and things', () => {
    expect(FIGURE_KEYS.length).toBeGreaterThanOrEqual(25);
    const groups = new Set(FIGURE_KEYS.map((k) => getFigure(k)!.group));
    expect([...groups].sort()).toEqual(['animals', 'fantasy', 'nature', 'people', 'things', 'village']);
  });

  it('every figure is a well-formed part tree with sensible size', () => {
    for (const key of FIGURE_KEYS) {
      const f = getFigure(key)!;
      const names = new Set<string>();
      for (const p of f.parts) {
        expect(names.has(p.name), `${key}: duplicate part ${p.name}`).toBe(false);
        names.add(p.name);
      }
      for (const p of f.parts) if (p.parent) expect(names.has(p.parent), `${key}: ${p.name} hangs off missing ${p.parent}`).toBe(true);
      expect(f.heightM, key).toBeGreaterThan(0.05);
      expect(f.heightM, key).toBeLessThan(6);
      // feet on the ground: nothing far below y = 0
      const frames = solve(f);
      let low = Infinity;
      for (const p of f.parts) for (const q of shapePoints(p)) low = Math.min(low, frames.get(p.name)!.T[1] + apply(frames.get(p.name)!.R, q)[1]);
      expect(low, key).toBeGreaterThan(-0.06 * f.heightM);
    }
  });

  it('people stand at their stated height with their arms, legs and face', () => {
    const man = getFigure('man')!;
    expect(man.heightM).toBeGreaterThan(1.7);
    expect(man.heightM).toBeLessThan(1.85);
    for (const j of ['hips', 'torso', 'head', 'face', 'armL', 'armR', 'foreL', 'foreR', 'handL', 'handR', 'legL', 'legR', 'shinL', 'shinR', 'footL', 'footR']) expect(man.parts.some((p) => p.name === j), j).toBe(true);
    expect(man.face).toBeDefined();
    // the left arm is on +x (your right when the figure faces you)
    const f = solve(man);
    expect(f.get('handL')!.T[0]).toBeGreaterThan(0);
    expect(f.get('handR')!.T[0]).toBeLessThan(0);
  });

  it('animals face +z (their head is in front of their tail)', () => {
    for (const k of ['dog', 'cat', 'horse', 'cow', 'pig', 'sheep']) {
      const f = solve(getFigure(k)!);
      expect(f.get('head')!.T[2], k).toBeGreaterThan(f.get('tail')!.T[2]);
    }
  });

  it('maps vocabulary words and synonyms to figures', () => {
    expect(figureFor('Dog')?.key).toBe('dog');
    expect(figureFor('a chicken')?.key).toBe('rooster');
    expect(figureFor('lamp post')?.key).toBe('lamppost');
    expect(figureFor('cart')?.key).toBe('wheelbarrow');
    expect(figureFor('spaceship')).toBeNull();
  });
});

describe('figure math', () => {
  it('hull keeps the outline of a point cloud', () => {
    const h = hull([[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.2, 0.8]]);
    expect(h.length).toBe(4);
  });

  it('a pose rotates joints: raising the left arm sideways lifts its hand', () => {
    const man = getFigure('man')!;
    const rest = solve(man).get('handL')!.T;
    const up = solve(man, { j: { armL: [0, 0, 160] } }).get('handL')!.T;
    expect(up[1]).toBeGreaterThan(rest[1] + 0.6);
  });

  it('profile view shows the head to the left of the tail', () => {
    const dog = getFigure('dog')!;
    const V = viewMatrix('side');
    const f = solve(dog);
    const head = apply(V, f.get('head')!.T);
    const tail = apply(V, f.get('tail')!.T);
    expect(head[0]).toBeLessThan(tail[0]);
    // and the left legs are in front (toward the viewer) of the right legs
    expect(apply(V, f.get('legFL')!.T)[2]).toBeGreaterThan(apply(V, f.get('legFR')!.T)[2]);
    void mul;
  });
});

describe('figure animation', () => {
  it('every reaction a figure can play exists for its rig and samples to finite numbers', () => {
    for (const key of FIGURE_KEYS) {
      const f = getFigure(key)!;
      const clips = clipNames(f.rig);
      for (const r of reactionsFor(f)) expect(clips, `${key}: ${r}`).toContain(r);
      for (const name of clips)
        for (const t of [0, 0.13, 0.5, 1.1, 2.3]) {
          const p = samplePose(f, name, t);
          expect(finite(p.root), `${key}/${name}`).toBe(true);
          for (const v of Object.values(p.j)) expect(finite(v), `${key}/${name}`).toBe(true);
        }
    }
  });

  it('people have a dozen-plus reactions with fitting faces', () => {
    const man = getFigure('man')!;
    const r = reactionsFor(man);
    expect(r.length).toBeGreaterThanOrEqual(12);
    for (const name of ['wave', 'cheer', 'tada', 'point', 'shrug', 'jump', 'dance', 'think', 'scared']) expect(r).toContain(name);
  });

  it('the animator walks, runs and settles, plays a reaction once, and blinks', () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const a = new Animator(getFigure('girl')!, rng);
    a.setSpeed(1.2);
    a.update(0.3);
    expect(Math.abs(a.pose().j.legL?.[0] ?? 0) + Math.abs(a.pose().j.legR?.[0] ?? 0)).toBeGreaterThan(0);
    a.setSpeed(5);
    a.update(0.3);
    expect(a.expression()).toBe('determined');
    a.setSpeed(0);
    a.update(0.5);
    expect(a.play('wave', 'happy')).toBe('wave');
    a.update(0.8);
    expect(a.reacting).toBe('wave');
    expect(a.pose().j.armR![2]).toBeLessThan(-100); // the right arm is up
    expect(a.expression()).toMatch(/happy|blink/);
    a.update(3);
    expect(a.reacting).toBeNull();
    let blinked = false;
    for (let i = 0; i < 400 && !blinked; i++) {
      a.update(1 / 60);
      blinked = a.expression() === 'blink';
    }
    expect(blinked).toBe(true);
    a.talk(1);
    const faces = new Set<string>();
    for (let i = 0; i < 30; i++) {
      a.update(1 / 30);
      faces.add(a.expression());
    }
    expect(faces.has('talk')).toBe(true);
  });
});

describe('the dragon', () => {
  it('has wings, a jaw, a tail and a hidden flame that does not count toward its size', () => {
    const d = getFigure('dragon')!;
    expect(d.rig).toBe('dragon');
    for (const j of ['wingL', 'wingR', 'wingTipL', 'wingTipR', 'jaw', 'tail4', 'flame']) expect(d.parts.some((p) => p.name === j), j).toBe(true);
    expect(d.parts.find((p) => p.name === 'flame')!.scale).toBe(0);
    const f = solve(d);
    const flameTip = f.get('flame')!.T[2] + 1.5;
    expect(d.halfD).toBeLessThan(flameTip + 1); // measured without the flame
    expect(figureFor('wyvern')?.key).toBe('dragon');
    // on paper the wings stand in the paper's plane
    expect(d.parts.find((p) => p.name === 'wingL')!.paperRot).toBeDefined();
    expect(d.parts.find((p) => p.name === 'wingR')!.paperFlap!.k).toBe(-1);
  });

  it('hovers with flapping wings in the air, flies when moving, and walks with folded wings on the ground', () => {
    const a = new Animator(getFigure('dragon')!, () => 0.5);
    a.setAirborne(true);
    const wing = (t: number) => {
      a.update(t);
      return a.pose().j.wingL![2];
    };
    wing(0.6);
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) seen.add(Math.round(wing(0.05)));
    expect(Math.max(...seen) - Math.min(...seen)).toBeGreaterThan(40); // the wings flap
    a.setSpeed(4);
    a.update(0.5);
    expect(a.pose().j.legBL![0]).toBeGreaterThan(50); // legs streaming behind in flight
    a.setAirborne(false);
    a.setSpeed(0);
    a.update(0.5);
    expect(a.pose().j.wingL![1]).toBeGreaterThan(40); // folded back along the body
  });

  it('breathes fire: the flame grows out of the mouth and goes away again', () => {
    const d = getFigure('dragon')!;
    expect(samplePose(d, 'breathe', 1.2).sc!.flame).toBeGreaterThan(0.6);
    expect(samplePose(d, 'breathe', 1.2).j.jaw![0]).toBeGreaterThan(20);
    expect(samplePose(d, 'breathe', 2.59).sc!.flame).toBeLessThan(0.05);
    expect(reactionsFor(d)).toContain('breathe');
  });

  it('looping clips run on continuous time (no jump once a second)', () => {
    const man = getFigure('man')!;
    const a = samplePose(man, 'idle', 0.9999).j.head!;
    const b = samplePose(man, 'idle', 1.0001).j.head!;
    for (let i = 0; i < 3; i++) expect(Math.abs(a[i] - b[i])).toBeLessThan(0.1);
  });
});

describe('visuals gallery', () => {
  it('shows every figure as sprite, paper, origami and 3D in labelled rows, without overlaps', () => {
    const w = galleryWorld('g', (_w, kind) => defaultSprite(kind), () => null, 0);
    expect(GALLERY_LOOKS).toEqual(['sprite', 'paper', 'origami', 'toon']);
    const flyers = w.entities.filter((e) => typeof e.state.orbit === 'number');
    const figs = w.entities.filter((e) => e.look && !flyers.includes(e));
    expect(figs.length).toBe(FIGURE_KEYS.length * 4);
    // three dragons circle overhead, one per code-drawn style
    expect(flyers.map((e) => e.look).sort()).toEqual(['origami', 'paper', 'toon']);
    for (const e of flyers) expect(e.pos[1]).toBeGreaterThan(5);
    // the gallery's own dragons hover off the ground
    for (const e of figs.filter((x) => x.word === 'dragon')) expect(e.pos[1]).toBeGreaterThan(1);
    expect(new Set(w.entities.map((e) => e.id)).size).toBe(w.entities.length);
    expect(w.entities.filter((e) => e.structure?.gen === 'signboard').length).toBe(7);
    for (const e of figs) {
      expect(e.state.stay).toBe(true);
      expect(e.yaw).toBe(0);
    }
    // within a row, neighbours are at least their half widths apart
    const rows = new Map<number, typeof figs>();
    for (const e of figs) rows.set(e.pos[2], [...(rows.get(e.pos[2]) ?? []), e]);
    for (const row of rows.values()) {
      const sorted = [...row].sort((a, b) => a.pos[0] - b.pos[0]);
      for (let i = 1; i < sorted.length; i++) {
        const half = (e: (typeof figs)[number]) => {
          const f = getFigure(e.word)!;
          return f.view === 'side' ? f.halfD : f.halfW;
        };
        expect(sorted[i].pos[0] - sorted[i - 1].pos[0]).toBeGreaterThanOrEqual(half(sorted[i]) + half(sorted[i - 1]) - 1e-6);
      }
    }
  });

  it('signboards carry their text', () => {
    const s = generate('signboard', { text: 'animals' }, 1, () => null)!;
    expect(s.gen).toBe('signboard');
    expect(s.parts.some((p) => p.t === 'decal' && p.text === 'ANIMALS')).toBe(true);
  });
});
