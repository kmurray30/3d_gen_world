import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { animCue, animNoise, animalCue, effectCue, effectLoop, landCue, moverCue, removeCue, stepCue } from '../../src/client/audio/cues';
import { noiseOf, planBabble, planNoise, voiceFor } from '../../src/client/audio/babble';
import { groundSurface, materialSurface } from '../../src/shared/terrain/surface';
import { terrainField } from '../../src/shared/terrain/field';
import { generateVillage } from '../../src/shared/village';
import { EFFECTS, REMOVE_HOW } from '../../src/shared/schema';

const sources = JSON.parse(fs.readFileSync('words_and_images/audio/sources.json', 'utf8')) as { cues: Record<string, Record<string, unknown>> };
const cues = new Set(Object.keys(sources.cues));

describe('which sound fits', () => {
  it('every cue the game can ask for is in the sound catalogue, with a source', () => {
    const asked = new Set<string>();
    for (const s of ['grass', 'gravel', 'stone', 'wood', 'sand', 'water', 'metal'] as const) {
      asked.add(stepCue(s));
      for (const m of ['light', 'medium', 'heavy']) asked.add(landCue(m, s));
    }
    for (const word of ['cat', 'puppy', 'cow', 'sheep', 'duck', 'owl', 'seagull', 'dragon', 'parrot', 'frog', 'lion', 'bee', 'robin']) asked.add(animalCue(word)!);
    for (const [gen, key] of [['house', 'door_open'], ['lighthouse', 'open_door_1'], ['mailbox', 'door_open'], ['house', 'open_window_3'], ['house', 'open_shutters_2'], ['mailbox', 'open_flag'], ['trash_can', 'open_lid'], ['well', 'open_bucket'], ['lamppost', 'open_lamp'], ['fountain', 'open_water']])
      for (const v of [true, false]) asked.add(moverCue(gen, key, v)!);
    for (const e of EFFECTS) {
      const c = effectCue(e);
      if (c) asked.add(c);
      const l = effectLoop(e);
      if (l) asked.add(l);
    }
    for (const h of REMOVE_HOW) {
      const c = removeCue(h);
      if (c) asked.add(c);
    }
    for (const a of ['hop', 'bounce', 'wobble', 'spin', 'shake', 'fall_over', 'clap', 'flap', 'wave', 'bow', 'apart']) asked.add(animCue(a)!.cue);
    for (const c of ['jump', 'poke', 'paper', 'ui.send', 'ui.done', 'ui.error', 'ui.click', 'amb.birds', 'amb.crickets', 'amb.water', 'amb.waves', 'amb.wind', 'amb.fountain', 'music.dawn', 'music.day', 'music.sunset', 'music.night'])
      asked.add(c);
    for (const c of asked) expect(cues.has(c), c).toBe(true);
    for (const [name, spec] of Object.entries(sources.cues)) {
      expect(['kenney', 'freesound', 'url', 'file'].some((k) => k in spec), name).toBe(true);
      if (String(name).startsWith('music.') || String(name).startsWith('amb.')) expect(spec.loop, name).toBe(true);
    }
  });

  it("animals make their own calls; unknown ones stay quiet", () => {
    expect(animalCue('kitten')).toBe('animal.cat');
    expect(animalCue('golden_retriever')).toBe('animal.dog');
    expect(animalCue('polar bear')).toBe('animal.bear');
    expect(animalCue('T-Rex')).toBe('animal.monster');
    expect(animalCue('rooster')).toBe('animal.rooster');
    expect(animalCue('hen')).toBe('animal.chicken');
    expect(animalCue('jellyfish')).toBeNull();
  });

  it('doors creak open and shut, a mailbox door is small metal, a fountain gushes on', () => {
    expect(moverCue('house', 'door_open', true)).toBe('door.open');
    expect(moverCue('house', 'door_open', false)).toBe('door.close');
    expect(moverCue('mailbox', 'door_open', true)).toBe('metal.small');
    expect(moverCue('fountain', 'open_water', false)).toBe('water.on');
    expect(moverCue('house', 'expression', true)).toBeNull();
  });

  it('the ground under foot: plaza stone, road gravel, sand by the water, the water itself, grass', () => {
    const v = generateVillage(44, () => null, () => null, 0);
    const f = terrainField(v.terrain)!;
    const spec = f.spec;
    const plaza = spec.pads.find((p) => p.r !== undefined)!;
    expect(groundSurface(f, plaza.x, plaza.z)).toBe('stone');
    // a dry point on a road away from the plaza (roads cross the river on bridges)
    const dry = spec.roads.flatMap((r) => r.pts).find((q) => !f.isWater(q[0], q[1], 0.3) && Math.hypot(q[0] - plaza.x, q[1] - plaza.z) > plaza.r! + 1)!;
    expect(groundSurface(f, dry[0], dry[1])).toBe('gravel');
    // a point in the river or lake, and one on its bank
    const wet = spec.rivers.flatMap((r) => r.pts).find((q) => f.isWater(q[0], q[1], 0))!;
    expect(wet).toBeTruthy();
    expect(groundSurface(f, wet[0], wet[1])).toBe('water');
    let bank: [number, number] | null = null;
    for (let r = 1; r < 20 && !bank; r += 0.25)
      for (let a = 0; a < 16 && !bank; a++) {
        const x = wet[0] + Math.cos((a / 16) * Math.PI * 2) * r;
        const z = wet[1] + Math.sin((a / 16) * Math.PI * 2) * r;
        const above = f.height(x, z) - f.waterLevel;
        if (above > 0.1 && above < 0.6) bank = [x, z];
      }
    if (bank) expect(['sand', 'gravel', 'stone']).toContain(groundSurface(f, bank[0], bank[1]));
    expect(groundSurface(null, 0, 0)).toBe('grass');
    expect(materialSurface('plank')).toBe('wood');
    expect(materialSurface('stone')).toBe('stone');
    expect(materialSurface('metal')).toBe('metal');
  });
});

describe('babble', () => {
  it('a voice for each character: children high, gruff giants low, robots square; two farmers differ', () => {
    const boy = voiceFor('boy', 'boy_1', 'human');
    const man = voiceFor('man', 'man_1', 'human');
    const ogre = voiceFor('ogre', 'ogre_1', 'humanoid');
    expect(boy.pitch).toBeGreaterThan(man.pitch);
    expect(man.pitch).toBeGreaterThan(ogre.pitch);
    expect(ogre.buzz).toBeGreaterThan(0.6);
    expect(voiceFor('robot', 'r', 'humanoid').robot).toBe(true);
    expect(voiceFor('farmer', 'farmer_1', 'human').pitch).not.toBe(voiceFor('farmer', 'farmer_2', 'human').pitch);
    // the same character always sounds the same
    expect(voiceFor('farmer', 'farmer_1', 'human')).toEqual(voiceFor('farmer', 'farmer_1', 'human'));
  });

  it('a line becomes a syllable or so a word, in order, within the time allowed', () => {
    const v = voiceFor('woman', 'w1', 'human');
    const plan = planBabble('Hello there, nice day for a walk!', v, 'neutral', 2.2, 3);
    expect(plan.length).toBeGreaterThan(6);
    for (let i = 1; i < plan.length; i++) expect(plan[i].t).toBeGreaterThan(plan[i - 1].t);
    const last = plan[plan.length - 1];
    expect(last.t + last.dur).toBeLessThanOrEqual(2.3);
    // long speeches are cut to the time allowed
    const long = planBabble('word '.repeat(80), v, 'neutral', 1.5, 3);
    expect(long[long.length - 1].t).toBeLessThan(1.5);
  });

  it('moods shape the tune: happy is higher than sad, a question rises at the end', () => {
    const v = voiceFor('man', 'm1', 'human');
    const mean = (p: ReturnType<typeof planBabble>) => p.reduce((a, s) => a + s.f, 0) / p.length;
    const happy = planBabble('What a lovely morning it is', v, 'happy', 3, 5);
    const sad = planBabble('What a lovely morning it is', v, 'sad', 3, 5);
    expect(mean(happy)).toBeGreaterThan(mean(sad) * 1.2);
    // sad talk is slower
    expect(sad[sad.length - 1].t / sad.length).toBeGreaterThan(happy[happy.length - 1].t / happy.length);
    const q = planBabble('Are you coming with me', v, 'neutral', 3, 5);
    const qq = planBabble('Are you coming with me?', v, 'neutral', 3, 5);
    expect(qq[qq.length - 1].f).toBeGreaterThan(q[q.length - 1].f * 1.15);
  });

  it('laughs, sobs, grumbles and hums are sounds, not words', () => {
    expect(noiseOf('Hahaha!')).toBe('laugh');
    expect(noiseOf('Hehe!')).toBe('laugh');
    expect(noiseOf('Hmph.')).toBe('grumble');
    expect(noiseOf('Huh?')).toBe('huh');
    expect(noiseOf('Oh!')).toBe('gasp');
    expect(noiseOf('Hello!')).toBeNull();
    const v = voiceFor('girl', 'g', 'human');
    const laugh = planNoise('laugh', v, 2);
    expect(laugh.length).toBeGreaterThanOrEqual(4);
    // a laugh runs down the scale
    expect(laugh[0].f).toBeGreaterThan(laugh[laugh.length - 1].f);
    expect(planBabble('Hahaha!', v, 'neutral', 2, 1)).toEqual(planNoise('laugh', v, 1));
    expect(animNoise('laugh')).toBe('laugh');
    expect(animNoise('cry')).toBe('sob');
    expect(animNoise('wave')).toBeNull();
  });
});
