import { describe, expect, it } from 'vitest';
import '../../src/shared/figure/catalog/index';
import { addEntries } from '../../src/shared/figure/catalog/registry';
import { EXAMPLES } from '../../src/shared/figure/catalog/examples';
import { Engine, type EngineEvent } from '../../src/shared/engine/index';
import { getFigure, registerFigure } from '../../src/shared/figure/items';
import { partOverrides, socketOffset, subtree } from '../../src/shared/figure/pose';
import { who } from '../../src/shared/figure/accessories';
import { Animator } from '../../src/shared/figure/anim';
import type { Entity, World } from '../../src/shared/types';

// the worked examples, over the catalog's own toaster, yam and biplane (whatever words they spawn, like toast,
// come from the catalog)
addEntries(EXAMPLES);
for (const en of EXAMPLES) registerFigure(en.f());

function thing(id: string, word: string, pos: [number, number, number], yaw = 0): Entity {
  const f = getFigure(word)!;
  return { id, word, label: word, sprite: { file: null, w: 1, h: 1 }, pos, flip: false, scale: 1, heightM: f.heightM, tilt: 0, state: {}, effects: [], kind: 'object', solid: false, massClass: 'light', huge: false, createdAt: 0, yaw };
}

function world(...entities: Entity[]): Engine {
  const w: World = { slug: 't', rev: 1, player: { pos: [0, 0, 6], yaw: 0, pitch: 0 }, entities, createdAt: 0 };
  const e = new Engine(w, 3);
  e.idle.enabled = false;
  return e;
}

const run = (e: Engine, s: number) => {
  for (let t = 0; t < s; t += 0.05) e.update(0.05);
};

describe('acts, movers, sockets and pieces', () => {
  it('the toaster: its setup puts bread in both slots, clicks toast it, burn it, and bring fresh bread', () => {
    const e = world(thing('t', 'toaster', [2, 0, 0]));
    expect(e.setupAct('t')).toBe(true);
    run(e, 3); // spawned things pop in before they are put in
    const kids = () => e.world.children('t');
    expect(kids().map((k) => [k.word, k.anchor])).toEqual([['slice of bread', '@slot1'], ['slice of bread', '@slot2']]);
    // the slices sink into their slots: below the toaster's top, sticking out above its body
    const top = getFigure('toaster')!.heightM;
    for (const k of kids()) {
      const y = e.world.worldPos(k)[1];
      expect(y).toBeLessThan(top);
      expect(y + k.heightM).toBeGreaterThan(top);
    }
    expect(e.poke('t')).toBe(true);
    run(e, 0.3);
    expect(e.world.get('t')!.pose?.lever?.t?.[1]).toBeLessThan(0);
    run(e, 6);
    expect(kids().map((k) => k.word)).toEqual(['toast', 'toast']);
    expect(e.world.get('t')!.pose).toBeUndefined(); // the lever came back up
    run(e, 1);
    e.poke('t');
    run(e, 8);
    expect(kids().map((k) => k.word)).toEqual(['burnt toast', 'burnt toast']);
    run(e, 1);
    e.poke('t');
    run(e, 6);
    expect(kids().map((k) => k.word)).toEqual(['slice of bread', 'slice of bread']);
  });

  it('a socket turns with its owner', () => {
    const f = getFigure('toaster')!;
    const a = socketOffset({ yaw: 0, flip: false, scale: 1, state: {} }, f, 'slot1')!;
    const b = socketOffset({ yaw: 90, flip: false, scale: 1, state: {} }, f, 'slot1')!;
    expect(a[2]).toBeCloseTo(0.035, 5);
    expect(b[0]).toBeCloseTo(0.035, 5); // +z turned 90 degrees points along +x
    expect(b[2]).toBeCloseTo(0, 5);
  });

  it('a piece comes off as a thing of its own where it was, and goes back', () => {
    const e = world(thing('y', 'yam', [0, 0, 0]));
    const events: EngineEvent[] = [];
    e.on((ev) => events.push(ev));
    e.poke('y');
    run(e, 2);
    const piece = e.world.list().find((x) => x.state.piece_of === 'y')!;
    expect(piece.word).toBe('yam#slice');
    expect(getFigure('yam#slice')!.parts.length).toBe(2); // the slice and the skin rim that hangs off it
    expect(e.world.get('y')!.state.off_slice).toBe(true);
    // on the yam, the slice and everything hanging off it are hidden
    const hidden = partOverrides(e.world.get('y')!, 0, getFigure('yam')!).sc;
    for (const p of subtree(getFigure('yam')!, 'slice')) expect(hidden[p.name]).toBe(0);
    expect(hidden.body).toBeUndefined();
    run(e, 1);
    e.poke('y');
    run(e, 1);
    expect(e.world.list().some((x) => x.state.piece_of === 'y')).toBe(false);
    expect(e.world.get('y')!.state.off_slice).toBeUndefined();
  });

  it('a propeller spins when the engine is on and stops when it is off; operate takes names and kinds', () => {
    const e = world(thing('p', 'biplane', [0, 0, 0]));
    e.poke('p');
    run(e, 1);
    expect(e.world.get('p')!.pose?.propeller?.w?.[2]).toBe(900);
    expect(partOverrides(e.world.get('p')!, 2).j.propeller[2]).toBeCloseTo(1800, 5);
    run(e, 1);
    e.poke('p');
    run(e, 1);
    expect(e.world.get('p')!.pose?.propeller).toBeUndefined();
    // by kind of part, the way a player says it
    expect(e.operate('p', 'engine', 'on')).toBe(true);
    run(e, 0.5);
    expect(e.world.get('p')!.state.op_propeller).toBe(true);
    expect(e.operate('p', 'wings', 'on')).toBe(false);
  });

  it('a pose step moves a part by a forgiving name and is back at rest at [0, 0, 0]', () => {
    const e = world(thing('f', 'refrigerator', [0, 0, 0]));
    e.run([{ op: 'pose', id: 'f', part: 'Door', rot: [0, 100, 0], dur: 0.2 }]);
    run(e, 0.5);
    expect(e.world.get('f')!.pose?.door?.r?.[1]).toBeCloseTo(100, 5);
    e.run([{ op: 'pose', id: 'f', part: 'door', rot: [0, 0, 0], dur: 0.2 }]);
    run(e, 0.5);
    expect(e.world.get('f')!.pose).toBeUndefined();
  });

  it('a pose with times goes there and back and ends where it started (a wag in one step)', () => {
    const e = world(thing('f', 'refrigerator', [0, 0, 0]));
    e.run([{ op: 'pose', id: 'f', part: 'door', rot: [0, 60, 0], times: 3, dur: 0.4 }]);
    let peak = 0;
    for (let t = 0; t < 1.3; t += 0.05) {
      e.update(0.05);
      peak = Math.max(peak, e.world.get('f')!.pose?.door?.r?.[1] ?? 0);
    }
    expect(peak).toBeGreaterThan(50);
    expect(e.world.get('f')!.pose).toBeUndefined();
  });

  it('a move relative to itself goes by its own front and ends (it does not chase itself)', () => {
    const e = world(thing('d', 'toaster', [0, 0, 0], 90));
    e.run([{ op: 'move', id: 'd', to: { rel: 'front', of: 'd', dist: 'near' } } as never]);
    run(e, 4);
    const p = e.world.get('d')!.pos;
    expect(p[0]).toBeGreaterThan(1.5); // yaw 90: its front is +x
    expect(Math.abs(p[2])).toBeLessThan(0.2);
    expect(e.scheduler.busy).toBe(false);
  });

  it('attach puts a thing into a socket by its name or its kind', () => {
    const e = world(thing('t', 'toaster', [0, 0, 0]), thing('b', 'slice of bread', [1, 0, 0]));
    e.run([{ op: 'attach', id: 'b', to: 't', where: 'slot' }]);
    run(e, 0.5);
    expect(e.world.get('b')!.anchor).toBe('@slot1');
    // the next one takes the free slot, and "inside" finds a slot too
    const e2 = world(thing('t', 'toaster', [0, 0, 0]), thing('b', 'slice of bread', [1, 0, 0]), thing('c', 'slice of bread', [-1, 0, 0]));
    e2.run([{ op: 'attach', id: 'b', to: 't', where: 'slot1' }]);
    run(e2, 0.5);
    e2.run([{ op: 'attach', id: 'c', to: 't', where: 'inside' }]);
    run(e2, 0.5);
    expect(e2.world.get('c')!.anchor).toBe('@slot2');
  });

  it('an act with a bad step skips it and runs the rest', () => {
    const e = world(thing('t', 'toaster', [0, 0, 0]));
    const warns: string[] = [];
    e.on((ev) => {
      if (ev.type === 'warn') warns.push(ev.msg);
    });
    const steps = e.prepareAct(e.world.get('t')!, [{ op: 'fly_to_the_moon' } as never, { op: 'say', id: 'self', text: 'Hi', dur: 1 }]);
    expect(steps).toEqual([{ op: 'say', id: 't', text: 'Hi', dur: 1 }]);
    expect(warns.length).toBe(1);
  });

  it('a gesture moves an arm from hanging down, not from its stance, unless an act holds that arm', () => {
    const fig = who('tray waiter', { pose: 'hold' });
    const a = new Animator(fig, () => 0.5);
    a.play('wave');
    for (let i = 0; i < 12; i++) a.update(0.05);
    const free = a.pose();
    a.held = ['armR', 'foreR'];
    const held = a.pose();
    // the held tray arm's forearm is bent -78 degrees: a wave takes most of that bend out first
    expect(free.j.foreR[0] - (held.j.foreR?.[0] ?? 0)).toBeGreaterThan(40);
    // nobody's stance: a hanging-armed person waves the same either way
    const plain = new Animator(who('plain person'), () => 0.5);
    plain.play('wave');
    for (let i = 0; i < 12; i++) plain.update(0.05);
    const x = plain.pose();
    plain.held = ['armR', 'foreR'];
    expect(plain.pose().j.foreR).toEqual(x.j.foreR);
  });
});
