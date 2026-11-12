/** Catalog chunk objects-06: the words in assign/objects-06.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M } from '../dsl';

type V = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/** A bottle: body, shoulder, neck, cap, optional paper band. */
const bottle = (key: string, h: number, body: string, cap: string, o: { w?: number; band?: string; neck?: number } = {}): M => {
  const w = o.w ?? h * 0.36, bh = h * 0.62, nw = w * (o.neck ?? 0.4);
  const b = m(key)
    .cyl([w, bh, w], [0, bh / 2, 0], { color: body })
    .ball([w, h * 0.24, w], [0, bh, 0], { color: body })
    .cyl([nw, h * 0.26, nw], [0, h * 0.75, 0], { color: body })
    .cyl([nw * 1.2, h * 0.12, nw * 1.2], [0, h * 0.94, 0], { color: cap });
  if (o.band) b.cyl([w * 1.03, bh * 0.45, w * 1.03], [0, bh * 0.5, 0], { color: o.band, noInk: true });
  return b;
};

/** A jar: body in the colour of its contents and a screw lid. */
const jar = (key: string, h: number, w: number, fill: string, lid: string, band?: string): M => {
  const b = m(key)
    .cyl([w, h * 0.84, w], [0, h * 0.42, 0], { color: fill })
    .cyl([w * 0.92, h * 0.16, w * 0.92], [0, h * 0.92, 0], { color: lid, name: 'lid', pivot: [0, h * 0.84, -w * 0.46] });
  if (band) b.cyl([w * 1.03, h * 0.36, w * 1.03], [0, h * 0.42, 0], { color: band, noInk: true });
  return b;
};

/** A drink in a glass that widens to the top, with an optional straw. */
const drink = (key: string, h: number, fill: string, o: { w?: number; straw?: string; top?: string } = {}): M => {
  const w = o.w ?? h * 0.5;
  const b = m(key)
    .cyl([w, h, w], [0, h / 2, 0], { color: fill, taper: 1.2 })
    .torus([w * 1.24, w * 1.24, h * 0.05], [0, h, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.1 });
  if (o.top) b.ball([w * 1.1, h * 0.3, w * 1.1], [0, h * 1.02, 0], { color: o.top });
  if (o.straw) b.stick([w * 0.1, h * 0.5, 0], [-w * 0.25, h * 1.4, w * 0.05], w * 0.12, o.straw);
  return b;
};

interface Bld { w: number; h: number; d?: number; wall: string; roof?: string; gable?: number; ridgeX?: boolean; sign: string; signCol?: string; door?: string; win?: string }
/** A small building: walls, a flat or gabled roof, a door that opens, two windows and a sign board with a label. */
const bld = (key: string, o: Bld): M => {
  const { w, h } = o, d = o.d ?? w * 0.7;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.05 });
  if (o.gable) {
    if (o.ridgeX) b.wedge([d * 1.12, o.gable, w * 1.08], [0, h + o.gable / 2, 0], { color: o.roof ?? 'darkred', rot: [0, 90, 0] });
    else b.wedge([w * 1.12, o.gable, d * 1.08], [0, h + o.gable / 2, 0], { color: o.roof ?? 'darkred' });
  } else b.box([w * 1.06, Math.max(0.15, h * 0.06), d * 1.06], [0, h + Math.max(0.075, h * 0.03), 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  const dh = Math.min(2.2, h * 0.6), dw = dh * 0.5;
  b.box([dw, dh, 0.08], [0, dh / 2, d / 2 + 0.02], { color: o.door ?? 'darkwood', name: 'door', pivot: [-dw / 2, dh / 2, d / 2 + 0.02] })
    .pair((s) => b.box([w * 0.2, h * 0.22, 0.06], [s * w * 0.3, h * 0.45, d / 2 + 0.01], { color: o.win ?? 'glass' }))
    .box([w * 0.62, h * 0.16, 0.1], [0, h * 0.8, d / 2 + 0.04], { color: o.signCol ?? 'white' })
    .label(o.sign, [w * 0.56, h * 0.12], [0, h * 0.8, d / 2 + 0.1], { color: o.signCol ?? 'white' });
  return b;
};

/** A tree: tapered trunk and a crown (round, wide, tall or a cone) that sways, with optional fruit. */
const tree = (key: string, h: number, crown: string, o: { trunk?: string; fruit?: string; fs?: number; shape?: 'round' | 'cone' | 'wide' | 'tall'; n?: number } = {}): M => {
  const t = h * 0.09;
  const b = m(key).cyl([t, h * 0.55, t], [0, h * 0.275, 0], { color: o.trunk ?? 'bark', taper: 0.6 });
  if (o.shape === 'cone') {
    b.cone([h * 0.5, h * 0.8, h * 0.5], [0, h * 0.6, 0], { color: crown, name: 'top', pivot: [0, h * 0.3, 0] });
    return b;
  }
  const cw = o.shape === 'wide' ? h * 0.85 : o.shape === 'tall' ? h * 0.42 : h * 0.62, ch = o.shape === 'tall' ? h * 0.72 : h * 0.55, cy = h - ch / 2;
  b.ball([cw, ch, cw], [0, cy, 0], { color: crown, name: 'top', pivot: [0, h * 0.5, 0] });
  b.pair((s) => b.ball([cw * 0.55, ch * 0.55, cw * 0.55], [s * cw * 0.38, cy - ch * 0.12, cw * 0.08], { color: crown, parent: 'top' }));
  if (o.fruit) around(o.n ?? 7, cw * 0.46, 0.4).forEach(([x, z], i) => b.ball(o.fs ?? h * 0.045, [x, cy - ch * (0.05 + 0.1 * (i % 3)), z], { color: o.fruit!, parent: 'top' }));
  return b;
};

/** A round "no ..." sign on a post: white disc, red ring and slash, with a symbol drawn by `sym` at (y, z). */
const banSign = (key: string, h: number, sym: (b: M, y: number, z: number, r: number) => void): M => {
  const r = h * 0.26, y = h - r;
  const b = m(key)
    .box([0.24, 0.06, 0.24], [0, 0.03, 0], { color: 'darkgray' })
    .stick([0, 0, -0.03], [0, y, -0.03], 0.04, 'steel')
    .cyl([r * 2, 0.02, r * 2], [0, y, 0], { color: 'white', rot: [90, 0, 0] })
    .torus([r * 2, r * 2, 0.035], [0, y, 0.004], { color: 'red', tube: 0.15 });
  sym(b, y, 0.02, r);
  b.box([r * 1.75, r * 0.2, 0.02], [0, y, 0.03], { color: 'red', rot: [0, 0, -45] });
  return b;
};

/** A ring buoy: thick ring with four coloured bands and a grab rope. */
const ringBuoy = (key: string, main: string, band: string): M => {
  const b = m(key).torus([0.75, 0.75, 0.18], [0, 0.375, 0], { color: main, tube: 0.26 });
  for (const a of [45, 135, 225, 315]) b.cyl([0.225, 0.13, 0.205], [Math.cos(rad(a)) * 0.278, 0.375 + Math.sin(rad(a)) * 0.278, 0], { color: band, rot: [0, 0, a] });
  return b.torus([0.79, 0.79, 0.025], [0, 0.375, 0], { color: 'tan', tube: 0.03 });
};

/** Leg from hip (top) down to a foot on the ground at x. */
const leg = (b: M, x: number, skin: string, top = 0.88) =>
  b.capsule([0.16, top - 0.44, 0.16], [x, (top + 0.44) / 2, 0], { color: skin })
    .ball(0.12, [x, 0.45, 0.015], { color: skin })
    .capsule([0.115, 0.42, 0.115], [x, 0.26, 0], { color: skin })
    .ball([0.1, 0.07, 0.24], [x, 0.035, 0.06], { color: skin });

/** Wheels in pairs at x = ±x on axles at the given z positions, with hubs; the first one is the named wheel. */
const wheels = (b: M, x: number, zs: number[], d: number, t: number, hub = 'silver'): M => {
  zs.forEach((z, i) =>
    b.pair((s) => {
      b.torus([d, d, t], [s * x, d / 2, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35, name: i === 0 && s === 1 ? 'wheel' : undefined });
      b.cyl([d * 0.42, t * 1.02, d * 0.42], [s * x, d / 2, z], { color: hub, rot: [0, 0, 90] });
    }),
  );
  return b;
};

/** A room diorama: floor and two walls (back and the right-hand side). */
const room = (key: string, w: number, d: number, h: number, floor: string, wall: string, side?: string): M =>
  m(key)
    .box([w, 0.1, d], [0, 0.05, 0], { color: floor, round: 0.1 })
    .box([w, h, 0.12], [0, h / 2 + 0.05, -d / 2 + 0.06], { color: wall, round: 0.1 })
    .box([0.12, h, d], [-w / 2 + 0.06, h / 2 + 0.05, 0], { color: side ?? wall, round: 0.1 });

export const ENTRIES: CatalogEntry[] = [
  e('laundry detergent', 'home', 'cleaning', () => {
    const b = m('laundry detergent');
    return b.box([0.17, 0.22, 0.1], [0, 0.11, 0], { color: 'orange', round: 0.4 })
      .cyl([0.045, 0.03, 0.045], [-0.045, 0.235, 0], { color: 'blue' })
      .torus([0.075, 0.07, 0.025], [0.04, 0.215, 0], { color: 'orange', tube: 0.25 })
      .box([0.13, 0.1, 0.012], [0, 0.1, 0.046], { color: 'white', noInk: true })
      .ball([0.07, 0.05, 0.01], [0, 0.1, 0.053], { color: 'blue', noInk: true })
      .done();
  }),
  e('lava', 'nature', 'elements', () =>
    m('lava')
      .ball([0.5, 0.08, 0.4], [0, 0.04, 0], { color: '#e0451c' })
      .ball([0.32, 0.06, 0.26], [0.04, 0.065, 0.03], { color: 'orange' })
      .ball([0.12, 0.04, 0.1], [-0.04, 0.09, 0.06], { color: 'flame', glow: true })
      .ball([0.14, 0.09, 0.12], [-0.2, 0.045, -0.1], { color: '#3a2a26' })
      .ball([0.1, 0.07, 0.09], [0.2, 0.035, 0.1], { color: '#3a2a26' })
      .ball(0.04, [0.08, 0.095, 0.05], { color: 'yellow' })
      .ball(0.03, [-0.1, 0.08, -0.02], { color: 'yellow' })
      .done(),
  ),
  e('lava lamp', 'home', 'lamps', () =>
    m('lava lamp')
      .cyl([0.13, 0.13, 0.13], [0, 0.065, 0], { color: 'silver', taper: 0.55 })
      .cyl([0.072, 0.08, 0.072], [0, 0.17, 0], { color: '#7a3ab8', taper: 1.4 })
      .cyl([0.1, 0.14, 0.1], [0, 0.28, 0], { color: '#7a3ab8', taper: 0.55 })
      .cyl([0.056, 0.06, 0.056], [0, 0.38, 0], { color: 'silver', taper: 0.4 })
      .ball([0.05, 0.06, 0.05], [0.012, 0.19, 0.02], { color: '#ff7a3a' })
      .ball([0.036, 0.045, 0.036], [-0.012, 0.27, 0.014], { color: '#ff7a3a' })
      .ball(0.028, [0.008, 0.325, 0.008], { color: '#ffb03a' })
      .done(),
  ),
  e('law office', 'places', 'offices', () => {
    const b = bld('law office', { w: 4, h: 3, d: 2.5, wall: 'beige', roof: 'stone', gable: 0.8, sign: 'LAW OFFICE', signCol: 'navy' });
    b.pair((s) => b.cyl([0.3, 3, 0.3], [s * 1.85, 1.5, 1.4], { color: 'white' }))
      .stick([0, 3.15, 1.45], [0, 3.65, 1.45], 0.06, 'gold')
      .stick([-0.45, 3.6, 1.45], [0.45, 3.6, 1.45], 0.05, 'gold')
      .pair((s) => b.cyl([0.3, 0.06, 0.2], [s * 0.45, 3.35, 1.45], { color: 'gold' }).stick([s * 0.45, 3.38, 1.45], [s * 0.45, 3.6, 1.45], 0.02, 'gold'));
    return b.done();
  }),
  e('lawn chair', 'home', 'outdoor furniture', () => {
    const b = m('lawn chair');
    b.box([0.5, 0.07, 0.45], [0, 0.4, 0.02], { color: 'green' })
      .box([0.5, 0.5, 0.07], [0, 0.68, -0.22], { color: 'green', rot: [-12, 0, 0] })
      .pair((s) => {
        b.box([0.08, 0.075, 0.45], [s * 0.12, 0.4, 0.02], { color: 'white', noInk: true })
          .box([0.08, 0.5, 0.075], [s * 0.12, 0.68, -0.22], { color: 'white', noInk: true, rot: [-12, 0, 0] })
          .rod([s * 0.26, 0, 0.25], [s * 0.26, 0.4, 0.2], 0.025, 'silver')
          .rod([s * 0.26, 0, -0.25], [s * 0.26, 0.95, -0.28], 0.025, 'silver')
          .rod([s * 0.26, 0.4, 0.2], [s * 0.27, 0.6, 0.22], 0.025, 'silver')
          .rod([s * 0.27, 0.6, 0.24], [s * 0.27, 0.6, -0.24], 0.04, 'white');
      });
    return b.done();
  }),
  e('lawn mower', 'garden', 'garden tools', () => {
    const b = m('lawn mower', { view: 'side' });
    b.box([0.5, 0.16, 0.55], [0, 0.18, 0], { color: 'red', round: 0.5 })
      .cyl([0.26, 0.14, 0.26], [0, 0.32, 0.03], { color: 'darkgray' })
      .cyl([0.2, 0.06, 0.2], [0, 0.42, 0.03], { color: 'red' })
      .box([0.38, 0.28, 0.32], [0, 0.3, -0.45], { color: 'darkgreen', round: 0.4 })
      .pair((s) => b.rod([s * 0.2, 0.22, -0.25], [s * 0.22, 0.95, -0.75], 0.03, 'black'))
      .stick([-0.25, 0.95, -0.75], [0.25, 0.95, -0.75], 0.04, 'black');
    let first = true;
    for (const x of [0.27, -0.27]) for (const z of [0.2, -0.22]) {
      b.torus([0.2, 0.2, 0.06], [x, 0.1, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35, name: first ? 'wheel' : undefined });
      first = false;
    }
    return b.done();
  }),
  e('lead', 'pets', 'pet supplies', () =>
    m('lead')
      .torus([0.24, 0.22, 0.03], [0, 0.015, 0], { color: 'red', rot: [90, 0, 0], tube: 0.1 })
      .torus([0.2, 0.18, 0.03], [0.01, 0.04, 0], { color: 'red', rot: [90, 0, 0], tube: 0.12 })
      .torus([0.1, 0.14, 0.025], [-0.1, 0.1, 0.03], { color: 'red', tube: 0.15, rot: [0, 30, 0] })
      .rod([0.11, 0.03, 0.05], [0.16, 0.02, 0.1], 0.02, 'red')
      .box([0.03, 0.02, 0.05], [0.17, 0.015, 0.12], { color: 'silver' })
      .torus([0.03, 0.03, 0.01], [0.17, 0.02, 0.15], { color: 'silver', rot: [90, 0, 0] })
      .done(),
  ),
  e('leaf', 'garden', 'leaves', () =>
    m('leaf')
      .ball([0.07, 0.1, 0.012], [0, 0.075, 0], { color: 'leaf' })
      .cone([0.03, 0.04, 0.012], [0, 0.135, 0], { color: 'leaf' })
      .stick([0, 0, 0], [0, 0.03, 0], 0.008, 'darkgreen')
      .rod([0, 0.03, 0.006], [0, 0.13, 0.006], 0.004, 'darkgreen', { noInk: true })
      .done(),
  ),
  e('leaf blower', 'garden', 'garden tools', () =>
    m('leaf blower', { view: 'side' })
      .box([0.18, 0.22, 0.3], [0, 0.13, -0.12], { color: 'orange', round: 0.5 })
      .cyl([0.16, 0.04, 0.16], [0, 0.13, -0.28], { color: 'darkgray', rot: [90, 0, 0] })
      .rod([0, 0.22, -0.2], [0, 0.32, -0.17], 0.035, 'black')
      .rod([0, 0.32, -0.17], [0, 0.32, -0.02], 0.035, 'black')
      .rod([0, 0.32, -0.02], [0, 0.22, 0.0], 0.035, 'black')
      .stick([0, 0.13, 0.0], [0, 0.07, 0.75], 0.09, 'orange')
      .stick([0, 0.07, 0.75], [0, 0.04, 0.95], 0.07, 'darkgray')
      .done(),
  ),
  e('leash', 'pets', 'pet supplies', () =>
    m('leash')
      .torus([0.14, 0.2, 0.03], [0, 0.8, 0], { color: 'red', tube: 0.16 })
      .capsule([0.07, 0.13, 0.07], [0, 0.88, 0], { color: 'black', rot: [0, 0, 90] })
      .rod([0, 0.7, 0], [0.06, 0.45, 0.02], 0.025, 'red')
      .rod([0.06, 0.45, 0.02], [0.02, 0.25, 0.04], 0.025, 'red')
      .rod([0.02, 0.25, 0.04], [0.06, 0.1, 0.05], 0.025, 'red')
      .box([0.03, 0.06, 0.02], [0.06, 0.07, 0.05], { color: 'silver' })
      .torus([0.22, 0.22, 0.05], [0.06, 0.025, 0.12], { color: 'blue', rot: [90, 0, 0], tube: 0.14 })
      .ball([0.035, 0.035, 0.008], [0.06, 0.03, 0.235], { color: 'gold' })
      .done(),
  ),
  e('leather', 'workshop', 'materials', () =>
    m('leather')
      .cyl([0.1, 0.5, 0.1], [0, 0.05, -0.1], { color: 'leather', rot: [0, 0, 90] })
      .cyl([0.06, 0.505, 0.06], [0, 0.05, -0.1], { color: '#6b4228', rot: [0, 0, 90] })
      .box([0.5, 0.012, 0.32], [0, 0.006, 0.1], { color: 'leather', round: 0.5 })
      .ball([0.2, 0.012, 0.12], [0.18, 0.006, 0.24], { color: 'leather' })
      .ball([0.16, 0.012, 0.1], [-0.2, 0.006, 0.25], { color: 'leather' })
      .torus([0.11, 0.11, 0.03], [0.12, 0.05, -0.1], { color: 'darkbrown', rot: [0, 90, 0] })
      .done(),
  ),
  e('leather jacket', 'wardrobe', 'coats', () => {
    const b = m('leather jacket'), j = '#2e2724', k = '#1c1816';
    b.box([0.46, 0.52, 0.24], [0, 0.36, 0], { color: j, round: 0.4 })
      .box([0.44, 0.07, 0.23], [0, 0.08, 0], { color: k })
      .box([0.26, 0.07, 0.2], [0, 0.63, -0.02], { color: k })
      .rod([0, 0.1, 0.122], [0, 0.6, 0.122], 0.014, 'silver')
      .pair((s) => {
        b.rod([s * 0.24, 0.56, 0], [s * 0.3, 0.14, 0.02], 0.12, j)
          .cyl([0.12, 0.05, 0.12], [s * 0.3, 0.1, 0.02], { color: k })
          .wedge([0.12, 0.18, 0.02], [s * 0.08, 0.53, 0.12], { color: k, rot: [0, 0, s * -20] })
          .box([0.08, 0.012, 0.01], [s * 0.13, 0.3, 0.12], { color: 'silver', noInk: true });
      });
    return b.done();
  }),
  e('led', 'tech', 'electronics', () =>
    m('led')
      .stick([0.01, 0, 0], [0.01, 0.052, 0], 0.004, 'silver')
      .stick([-0.01, 0.012, 0], [-0.01, 0.052, 0], 0.004, 'silver')
      .cyl([0.034, 0.008, 0.034], [0, 0.054, 0], { color: 'red' })
      .capsule([0.028, 0.045, 0.028], [0, 0.075, 0], { color: 'red' })
      .ball(0.01, [0, 0.085, 0.009], { color: '#ffd0c0', glow: true })
      .done(),
  ),
  e('leek', 'food', 'vegetables', () =>
    m('leek')
      .ball([0.052, 0.035, 0.052], [0, 0.018, 0], { color: 'cream' })
      .cyl([0.045, 0.14, 0.045], [0, 0.09, 0], { color: 'cream' })
      .cyl([0.045, 0.08, 0.045], [0, 0.2, 0], { color: '#b5d98a' })
      .rod([0, 0.23, 0], [-0.06, 0.37, 0.01], 0.03, '#4f7f4a')
      .rod([0, 0.23, 0], [0.05, 0.39, -0.01], 0.03, '#4f7f4a')
      .rod([0, 0.23, 0], [0.0, 0.41, 0.02], 0.03, '#5f9a52')
      .rod([0, 0.006, 0], [0.035, 0.004, 0.01], 0.006, 'tan')
      .rod([0, 0.006, 0], [-0.03, 0.004, 0.02], 0.006, 'tan')
      .done(),
  ),
  e('leg', 'clinic', 'body parts', () => {
    const b = m('leg');
    leg(b, 0, 'skin2');
    return b.cyl([0.2, 0.12, 0.2], [0, 0.86, 0], { color: 'blue' }).done();
  }),
  e('leg warmer', 'wardrobe', 'legwear', () => {
    const b = m('leg warmer');
    b.pair((s) => {
      b.cyl([0.11, 0.36, 0.11], [s * 0.08, 0.19, 0], { color: 'pink' });
      b.each(4, (i) => b.torus([0.125, 0.125, 0.035], [s * 0.08, 0.035 + i * 0.1, 0], { color: i % 2 ? 'purple' : 'magenta', rot: [90, 0, 0], tube: 0.2 }));
    });
    return b.done();
  }),
  e('legs', 'clinic', 'body parts', () => {
    const b = m('legs');
    leg(b, 0.1, 'skin3');
    leg(b, -0.1, 'skin3');
    return b.box([0.38, 0.16, 0.2], [0, 0.88, 0], { color: 'red', round: 0.4 }).done();
  }),
  e('lei', 'wardrobe', 'jewellery', () => {
    const b = m('lei'), cols = ['pink', 'yellow', 'white', 'magenta', 'orange'];
    b.each(20, (i) => {
      const a = (i / 20) * Math.PI * 2;
      b.ball([0.08, 0.08, 0.05], [Math.sin(a) * 0.2, 0.31 - Math.cos(a) * 0.27, 0], { color: cols[i % 5] });
    });
    return b.done();
  }),
  e('lemon', 'food', 'fruit', () => {
    const b = m('lemon');
    b.ball([0.09, 0.065, 0.065], [0, 0.033, 0], { color: '#f6e04a' })
      .pair((s) => b.ball([0.02, 0.018, 0.018], [s * 0.047, 0.033, 0], { color: '#f6e04a' }))
      .ball([0.04, 0.008, 0.02], [-0.022, 0.068, 0], { color: 'leaf', rot: [0, 0, 15] });
    return b.done();
  }),
  e('lemon tree', 'garden', 'fruit trees', () => tree('lemon tree', 4, 'darkgreen', { fruit: '#f6e04a', n: 9, fs: 0.2 }).done()),
  e('lemonade', 'food', 'drinks', () =>
    drink('lemonade', 0.15, '#f8ef9a', { straw: 'pink' })
      .cyl([0.06, 0.008, 0.06], [0.04, 0.15, 0.0], { color: 'yellow', rot: [90, 0, 0] })
      .box([0.025, 0.025, 0.025], [-0.01, 0.145, 0.02], { color: 'ice', rot: [10, 30, 0] })
      .done(),
  ),
  e('lemonade stand', 'places', 'stalls', () => {
    const b = m('lemonade stand');
    b.box([1.2, 0.9, 0.5], [0, 0.45, 0], { color: 'lightwood' })
      .box([1.3, 0.05, 0.6], [0, 0.92, 0], { color: 'wood' })
      .box([1.0, 0.3, 0.03], [0, 0.55, 0.26], { color: 'yellow' })
      .label('LEMONADE', [0.9, 0.22], [0, 0.55, 0.28], { color: 'yellow' })
      .pair((s) => b.stick([s * 0.58, 0.9, -0.22], [s * 0.58, 1.75, -0.22], 0.05, 'wood'))
      .box([1.4, 0.06, 0.7], [0, 1.78, 0], { color: 'yellow', rot: [12, 0, 0] })
      .each(2, (i) => b.box([0.18, 0.065, 0.7], [-0.35 + i * 0.7, 1.78, 0], { color: 'white', rot: [12, 0, 0], noInk: true }))
      .cyl([0.14, 0.22, 0.14], [-0.3, 1.05, 0.05], { color: '#f8ef9a' })
      .torus([0.1, 0.12, 0.02], [-0.39, 1.06, 0.05], { color: '#f8ef9a', rot: [0, 90, 0] })
      .each(3, (i) => b.cyl([0.06, 0.09, 0.06], [0.1 + i * 0.13, 0.99, 0.08], { color: 'white' }))
      .ball(0.08, [0.4, 0.98, -0.15], { color: '#f6e04a' })
      .ball(0.08, [0.3, 0.98, -0.18], { color: '#f6e04a' });
    return b.done();
  }),
  e('lens', 'tech', 'cameras', () =>
    m('lens')
      .cyl([0.08, 0.1, 0.08], [0, 0.04, 0], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.086, 0.03, 0.086], [0, 0.04, 0.025], { color: 'darkgray', rot: [90, 0, 0] })
      .torus([0.082, 0.082, 0.008], [0, 0.04, -0.01], { color: 'red', tube: 0.06 })
      .cyl([0.07, 0.015, 0.07], [0, 0.04, -0.055], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.062, 0.006, 0.062], [0, 0.04, 0.05], { color: '#3f5f90', rot: [90, 0, 0] })
      .ball([0.018, 0.018, 0.005], [0.012, 0.052, 0.054], { color: 'white', noInk: true })
      .done(),
  ),
  e('leotard', 'wardrobe', 'dancewear', () => {
    const b = m('leotard');
    b.box([0.32, 0.4, 0.17], [0, 0.4, 0], { color: 'magenta', round: 0.6 })
      .wedge([0.3, 0.22, 0.15], [0, 0.11, 0], { color: 'magenta', rot: [0, 0, 180] })
      .pair((s) => b.rod([s * 0.15, 0.56, 0], [s * 0.26, 0.24, 0.01], 0.07, 'magenta'))
      .ball([0.12, 0.05, 0.1], [0, 0.6, 0.03], { color: '#7a2a5a' })
      .each(5, (i) => b.ball(0.015, [-0.08 + i * 0.04, 0.42 + (i % 2) * 0.06, 0.085], { color: 'silver', noInk: true }));
    return b.done();
  }),
  e('less than sign', 'ideas', 'symbols', () =>
    m('less than sign')
      .rod([0.045, 0.12, 0], [-0.045, 0.075, 0], 0.024, 'blue')
      .rod([-0.045, 0.075, 0], [0.045, 0.03, 0], 0.024, 'blue')
      .box([0.13, 0.02, 0.06], [0, 0.01, 0], { color: 'wood' })
      .done(),
  ),
  e('letter', 'study', 'mail', () =>
    m('letter')
      .box([0.24, 0.15, 0.02], [0, 0.075, 0], { color: 'cream', round: 0.1 })
      .wedge([0.24, 0.085, 0.004], [0, 0.107, 0.011], { color: '#ecdcb8', rot: [0, 0, 180] })
      .cyl([0.032, 0.006, 0.032], [0, 0.066, 0.014], { color: 'darkred', rot: [90, 0, 0] })
      .done(),
  ),
  e('letter opener', 'study', 'desk supplies', () =>
    m('letter opener')
      .box([0.06, 0.03, 0.04], [0, 0.015, 0], { color: 'darkwood' })
      .cyl([0.018, 0.07, 0.014], [0, 0.06, 0], { color: 'leather' })
      .box([0.042, 0.008, 0.012], [0, 0.098, 0], { color: 'brass' })
      .cyl([0.018, 0.1, 0.004], [0, 0.152, 0], { color: 'silver', taper: 0.15 })
      .done(),
  ),
  e('letters', 'ideas', 'letters', () => {
    const b = m('letters'), t = 0.022;
    b.rod([-0.125, 0.008, 0], [-0.095, 0.1, 0], t, 'red').rod([-0.095, 0.1, 0], [-0.065, 0.008, 0], t, 'red').rod([-0.11, 0.045, 0], [-0.08, 0.045, 0], t, 'red');
    b.stick([-0.022, 0, 0], [-0.022, 0.1, 0], t, 'blue')
      .torus([0.05, 0.045, 0.016], [-0.005, 0.077, 0], { color: 'blue', tube: 0.3 })
      .torus([0.056, 0.055, 0.016], [-0.003, 0.028, 0], { color: 'blue', tube: 0.28 });
    const pts = [50, 110, 180, 250, 310].map((a): V => [0.095 + Math.cos(rad(a)) * 0.045, 0.053 + Math.sin(rad(a)) * 0.045, 0]);
    for (let i = 0; i < 4; i++) b.rod(pts[i], pts[i + 1], t, 'green');
    return b.done();
  }),
  e('lettuce', 'food', 'vegetables', () => {
    const b = m('lettuce').ball([0.22, 0.17, 0.22], [0, 0.1, 0], { color: '#a8d86a' });
    around(6, 0.085).forEach(([x, z], i) => b.ball([0.14, 0.15, 0.07], [x, 0.09, z], { color: i % 2 ? 'lettuce' : '#6fb04a', rot: [0, 90 - (i * 360) / 6, 0] }));
    return b.ball([0.11, 0.08, 0.11], [0, 0.18, 0], { color: '#c8eb8a' }).done();
  }),
  e('level', 'workshop', 'hand tools', () => {
    const b = m('level');
    b.box([0.45, 0.08, 0.04], [0, 0.04, 0], { color: 'yellow', round: 0.15 })
      .box([0.08, 0.045, 0.042], [0, 0.045, 0], { color: 'darkgray' })
      .capsule([0.018, 0.06, 0.018], [0, 0.045, 0.015], { color: '#b8e05a', rot: [0, 0, 90] })
      .ball(0.01, [0.005, 0.048, 0.025], { color: 'white' })
      .pair((s) => b.box([0.03, 0.085, 0.044], [s * 0.225, 0.0425, 0], { color: 'black' }).capsule([0.014, 0.035, 0.014], [s * 0.14, 0.04, 0.017], { color: '#b8e05a' }));
    return b.done();
  }),
  e('lever', 'workshop', 'hand tools', () =>
    m('lever')
      .rod([0.06, 0.018, 0], [0, 0.045, 0], 0.044, 'iron')
      .rod([0, 0.04, 0], [0, 0.42, 0], 0.044, 'red')
      .rod([0, 0.42, 0], [0.02, 0.47, 0], 0.044, 'red')
      .rod([0.02, 0.47, 0], [0.06, 0.485, 0], 0.044, 'red')
      .rod([0.06, 0.485, 0], [0.09, 0.455, 0], 0.044, 'red')
      .rod([0.09, 0.455, 0], [0.088, 0.42, 0], 0.044, 'iron')
      .done(),
  ),
  e('library', 'places', 'public buildings', () => {
    const b = m('library');
    b.box([7, 0.3, 4.8], [0, 0.15, 0], { color: 'stone' })
      .box([6.6, 0.3, 4.4], [0, 0.45, 0], { color: 'stone' })
      .box([6, 3.6, 3.6], [0, 2.4, -0.2], { color: 'beige' })
      .each(4, (i) => b.cyl([0.4, 3.6, 0.4], [[-2.6, -1.4, 1.4, 2.6][i], 2.4, 1.85], { color: 'white' }))
      .box([6.4, 0.4, 4.3], [0, 4.4, 0], { color: 'white' })
      .wedge([6.4, 1.2, 4.3], [0, 5.2, 0], { color: 'beige' })
      .box([1.2, 2.2, 0.1], [0, 1.7, 1.62], { color: 'darkwood', name: 'door', pivot: [-0.6, 1.7, 1.62] })
      .pair((s) => b.box([0.8, 1.4, 0.1], [s * 0.85, 2.3, 1.62], { color: 'glass' }))
      .box([3, 0.36, 0.06], [0, 4.4, 2.14], { color: 'navy' })
      .label('LIBRARY', [2.8, 0.3], [0, 4.4, 2.18], { color: 'navy' })
      .box([0.9, 0.5, 0.1], [0, 5.0, 2.12], { color: 'red', rot: [0, 0, 0] })
      .box([0.04, 0.5, 0.12], [0, 5.0, 2.12], { color: 'white' });
    return b.done();
  }),
  e('license', 'study', 'documents', () => {
    const b = m('license');
    b.box([0.086, 0.054, 0.005], [0, 0.031, 0], { color: '#d6ecf8', round: 0.3 })
      .box([0.086, 0.01, 0.006], [0, 0.052, 0], { color: 'navy', noInk: true })
      .box([0.022, 0.028, 0.006], [-0.026, 0.026, 0.001], { color: 'skin2', noInk: true })
      .ball([0.012, 0.012, 0.004], [-0.026, 0.03, 0.004], { color: 'brown', noInk: true })
      .each(3, (i) => b.box([0.036, 0.004, 0.006], [0.016, 0.036 - i * 0.009, 0.001], { color: 'darkgray', noInk: true }))
      .box([0.07, 0.006, 0.03], [0, 0.003, 0], { color: 'gray' });
    return b.done();
  }),
  e('license plate', 'garage', 'car parts', () => {
    const b = m('license plate');
    b.box([0.52, 0.11, 0.012], [0, 0.07, 0], { color: 'white', round: 0.2 })
      .box([0.045, 0.1, 0.014], [-0.233, 0.07, 0.001], { color: 'blue' })
      .label('ABC 123', [0.42, 0.08], [0.025, 0.07, 0.012], { color: 'white' })
      .pair((s) => b.cyl([0.014, 0.006, 0.014], [s * 0.19, 0.11, 0.008], { color: 'silver', rot: [90, 0, 0] }))
      .box([0.3, 0.04, 0.08], [0, 0.02, 0], { color: 'darkgray' });
    return b.done();
  }),
  e('lid', 'kitchen', 'cookware', () =>
    m('lid')
      .cyl([0.26, 0.03, 0.26], [0, 0.015, 0], { color: 'silver', taper: 0.75, name: 'lid', pivot: [0, 0.01, -0.13] })
      .ball([0.2, 0.05, 0.2], [0, 0.03, 0], { color: 'silver', parent: 'lid' })
      .torus([0.265, 0.265, 0.012], [0, 0.006, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.04, parent: 'lid' })
      .stick([0, 0.05, 0], [0, 0.065, 0], 0.02, 'black', { parent: 'lid' })
      .ball([0.055, 0.03, 0.055], [0, 0.072, 0], { color: 'black', parent: 'lid' })
      .done(),
  ),
  e('lie detector', 'tech', 'machines', () => {
    const b = m('lie detector');
    b.box([0.45, 0.12, 0.3], [0, 0.06, 0], { color: 'darkgray' })
      .box([0.45, 0.16, 0.06], [0, 0.2, -0.12], { color: 'gray', rot: [-15, 0, 0] })
      .box([0.3, 0.006, 0.2], [0, 0.123, 0.04], { color: 'paper' })
      .cyl([0.04, 0.32, 0.04], [0, 0.14, -0.06], { color: 'white', rot: [0, 0, 90] })
      .pair((s) => b.cyl([0.07, 0.012, 0.07], [s * 0.15, 0.22, -0.09], { color: 'white', rot: [75, 0, 0] }).rod([s * 0.15, 0.22, -0.082], [s * 0.15 + 0.02, 0.24, -0.08], 0.006, 'red'))
      .each(3, (i) => {
        const x = -0.09 + i * 0.09;
        b.rod([x, 0.2, -0.07], [x + 0.02, 0.13, 0.0], 0.008, 'black');
        b.rod([x + 0.02, 0.127, 0.0], [x - 0.015, 0.127, 0.04], 0.006, i === 1 ? 'red' : 'blue', { noInk: true });
        b.rod([x - 0.015, 0.127, 0.04], [x + 0.025, 0.127, 0.08], 0.006, i === 1 ? 'red' : 'blue', { noInk: true });
        b.rod([x + 0.025, 0.127, 0.08], [x - 0.01, 0.127, 0.12], 0.006, i === 1 ? 'red' : 'blue', { noInk: true });
      });
    return b.done();
  }),
  e('life preserver (ring)', 'sea', 'lifesaving', () => ringBuoy('life preserver (ring)', 'white', 'red').done()),
  e('life raft', 'garage', 'boats', () =>
    m('life raft')
      .cyl([1.9, 0.1, 1.9], [0, 0.05, 0], { color: 'darkgray' })
      .torus([2.2, 2.2, 0.45], [0, 0.225, 0], { color: 'orange', rot: [90, 0, 0], tube: 0.2 })
      .ball([1.85, 1.1, 1.85], [0, 0.5, 0], { color: 'orange' })
      .ball([0.75, 0.6, 0.1], [0, 0.55, 0.86], { color: '#3a2a20', noInk: true })
      .torus([2.24, 2.24, 0.06], [0, 0.32, 0], { color: 'white', rot: [90, 0, 0], tube: 0.03 })
      .ball(0.14, [0, 1.06, 0], { color: 'yellow', glow: true })
      .done(),
  ),
  e('life ring', 'sea', 'lifesaving', () => ringBuoy('life ring', 'orange', 'white').done()),
  e('lifeboat', 'garage', 'boats', () => {
    const b = m('lifeboat', { view: 'side' });
    b.box([0.4, 0.25, 5.0], [0, 0.125, 0], { color: 'darkgray' })
      .box([2.2, 1.0, 6.0], [0, 0.65, 0], { color: 'white', round: 0.7 })
      .box([2.22, 0.18, 5.6], [0, 0.85, 0], { color: 'red', noInk: true, round: 0.5 })
      .box([2.0, 1.1, 5.0], [0, 1.55, 0], { color: 'orange', round: 0.9 })
      .box([1.2, 0.6, 1.6], [0, 2.2, -1.2], { color: 'orange', round: 0.5 })
      .box([1.22, 0.25, 1.0], [0, 2.25, -0.9], { color: 'glass' })
      .pair((s) => b.each(4, (i) => b.box([0.06, 0.3, 0.45], [s * 0.99, 1.6, -1.8 + i * 1.1], { color: 'glass' })))
      .ball(0.15, [0, 2.55, -1.2], { color: 'yellow', glow: true });
    return b.done();
  }),
  e('lifeguard stand', 'sea', 'beach', () => {
    const b = m('lifeguard stand');
    for (const [x, z] of [[0.65, 0.6], [-0.65, 0.6], [0.65, -0.6], [-0.65, -0.6]]) b.stick([x, 0, z], [x * 0.7, 2.0, z * 0.7], 0.1, 'white');
    b.box([1.1, 0.12, 1.0], [0, 2.0, 0], { color: 'white' })
      .box([1.0, 0.8, 0.08], [0, 2.45, -0.45], { color: 'red' })
      .box([0.5, 0.12, 0.09], [0, 2.5, -0.4], { color: 'white', noInk: true })
      .box([0.12, 0.5, 0.09], [0, 2.5, -0.4], { color: 'white', noInk: true })
      .pair((s) => b.stick([s * 0.3, 0, 1.1], [s * 0.3, 2.0, 0.45], 0.06, 'white'))
      .each(5, (i) => {
        const y = 0.35 * (i + 1);
        b.stick([-0.3, y, 1.1 - 0.325 * y], [0.3, y, 1.1 - 0.325 * y], 0.05, 'white');
      })
      .stick([0.42, 2.0, -0.42], [0.42, 3.4, -0.42], 0.05, 'gray')
      .cone([2.0, 0.5, 2.0], [0.42, 3.55, -0.42], { color: 'red' })
      .cone([1.0, 0.25, 1.0], [0.42, 3.68, -0.42], { color: 'white' });
    return b.done();
  }),
  e('lifejacket', 'sea', 'lifesaving', () => {
    const b = m('lifejacket');
    b.box([0.5, 0.55, 0.22], [0, 0.33, -0.02], { color: 'orange', round: 0.5 })
      .ball([0.38, 0.16, 0.2], [0, 0.6, -0.06], { color: 'orange' })
      .ball([0.16, 0.08, 0.1], [0, 0.63, 0.02], { color: '#7a3a10' })
      .box([0.05, 0.48, 0.05], [0, 0.32, 0.09], { color: '#3a3633' })
      .each(2, (i) => b.box([0.52, 0.04, 0.24], [0, 0.2 + i * 0.18, -0.02], { color: 'black' }).box([0.08, 0.06, 0.04], [0, 0.2 + i * 0.18, 0.1], { color: 'gray' }))
      .pair((s) => b.box([0.05, 0.3, 0.01], [s * 0.16, 0.36, 0.093], { color: 'silver', noInk: true }).ball([0.06, 0.18, 0.18], [s * 0.24, 0.5, -0.02], { color: '#7a3a10' }));
    return b.done();
  }),
  e('light switch', 'home', 'electrics', () =>
    m('light switch')
      .box([0.16, 0.18, 0.02], [0, 0.09, -0.012], { color: 'skyblue', round: 0.1 })
      .box([0.08, 0.12, 0.012], [0, 0.1, 0.004], { color: 'white', round: 0.3 })
      .box([0.035, 0.06, 0.016], [0, 0.1, 0.012], { color: 'white', rot: [12, 0, 0] })
      .cyl([0.008, 0.004, 0.008], [0, 0.148, 0.011], { color: 'gray', rot: [90, 0, 0] })
      .cyl([0.008, 0.004, 0.008], [0, 0.052, 0.011], { color: 'gray', rot: [90, 0, 0] })
      .done(),
  ),
  e('lightbulb', 'home', 'lighting', () => {
    const b = m('lightbulb');
    b.cyl([0.012, 0.01, 0.012], [0, 0.005, 0], { color: 'black' })
      .cyl([0.032, 0.026, 0.032], [0, 0.022, 0], { color: 'silver' })
      .each(3, (i) => b.torus([0.036, 0.036, 0.005], [0, 0.013 + i * 0.008, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.2 }))
      .cyl([0.034, 0.02, 0.034], [0, 0.044, 0], { color: '#fff3b0', taper: 1.4 })
      .ball(0.066, [0, 0.083, 0], { color: '#fff3b0' })
      .rod([-0.01, 0.08, 0], [0.01, 0.08, 0], 0.004, 'flame', { glow: true });
    return b.done();
  }),
  e('lighter', 'home', 'household', () =>
    m('lighter')
      .box([0.03, 0.06, 0.014], [0, 0.03, 0], { color: 'red', round: 0.5 })
      .box([0.027, 0.016, 0.012], [0, 0.066, 0], { color: 'silver', round: 0.1 })
      .cyl([0.012, 0.01, 0.012], [-0.004, 0.077, -0.001], { color: 'darkgray', rot: [0, 0, 90] })
      .box([0.01, 0.006, 0.008], [0.007, 0.062, 0.006], { color: 'black' })
      .ball([0.012, 0.016, 0.012], [0.003, 0.084, 0], { color: 'orange', glow: true })
      .cone([0.01, 0.025, 0.01], [0.003, 0.098, 0], { color: 'flame', glow: true })
      .done(),
  ),
  e('lighthouse', 'places', 'landmarks', () => {
    const b = m('lighthouse');
    const d = (y: number) => 2.0 - ((y - 0.6) / 5.4) * 0.7;
    const band = (y0: number, y1: number) => b.cyl([d(y0) + 0.04, y1 - y0, d(y0) + 0.04], [0, (y0 + y1) / 2, 0], { color: 'red', taper: (d(y1) + 0.04) / (d(y0) + 0.04) });
    b.cyl([2.6, 0.6, 2.6], [0, 0.3, 0], { color: 'stone' })
      .cyl([2.0, 5.4, 2.0], [0, 3.3, 0], { color: 'white', taper: 0.65 });
    band(1.6, 2.6);
    band(3.6, 4.6);
    b.box([0.6, 1.2, 0.2], [0, 1.2, 0.92], { color: 'darkwood', name: 'door', pivot: [-0.3, 1.2, 0.92] })
      .cyl([1.7, 0.15, 1.7], [0, 6.07, 0], { color: 'darkgray' })
      .torus([1.7, 1.7, 0.06], [0, 6.4, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.03 })
      .cyl([1.0, 0.9, 1.0], [0, 6.6, 0], { color: '#ffe680' })
      .ball(0.6, [0, 6.6, 0.25], { color: 'flame', glow: true })
      .cone([1.25, 0.6, 1.25], [0, 7.35, 0], { color: 'red' })
      .ball(0.2, [0, 7.7, 0], { color: 'darkgray' });
    return b.done();
  }),
  e('lightning rod', 'workshop', 'building parts', () =>
    m('lightning rod')
      .box([1.2, 0.3, 1.0], [0, 0.15, 0], { color: 'beige' })
      .wedge([1.4, 0.5, 1.1], [0, 0.55, 0], { color: 'darkred' })
      .cyl([0.14, 0.08, 0.14], [0, 0.82, 0], { color: 'copper' })
      .stick([0, 0.8, 0], [0, 1.85, 0], 0.04, 'copper')
      .cone([0.06, 0.2, 0.06], [0, 1.95, 0], { color: 'copper' })
      .ball(0.2, [0, 1.3, 0], { color: '#4f8fd6' })
      .rod([0.03, 0.82, 0.02], [0.62, 0.32, 0.1], 0.02, 'copper')
      .rod([0.62, 0.32, 0.1], [0.62, 0.02, 0.1], 0.02, 'copper')
      .done(),
  ),
  e('lily (flower)', 'garden', 'flowers', () => {
    const b = m('lily (flower)'), y = 0.64;
    b.stick([0, 0, 0], [0, y - 0.03, 0], 0.025, 'green')
      .ball([0.09, 0.3, 0.035], [0.07, 0.2, 0.02], { color: 'leaf', rot: [0, 0, -30] })
      .ball([0.08, 0.26, 0.035], [-0.07, 0.36, 0.02], { color: 'leaf', rot: [0, 0, 30] })
      .ball([0.09, 0.09, 0.09], [0, y, 0.02], { color: 'green', name: 'head', pivot: [0, y - 0.03, 0] })
      .each(6, (i) => {
        const a = i * 60 + 30, c = Math.cos(rad(a + 90)), s = Math.sin(rad(a + 90));
        b.ball([0.06, 0.19, 0.03], [c * 0.085, y + s * 0.085, 0.05], { color: i % 2 ? '#f7b0c8' : '#f490b4', rot: [0, 0, a], parent: 'head' });
      })
      .each(3, (i) => b.rod([0, y, 0.06], [-0.025 + i * 0.025, y + 0.04, 0.1], 0.006, 'yellow', { parent: 'head' }).ball(0.014, [-0.025 + i * 0.025, y + 0.045, 0.1], { color: 'orange', parent: 'head' }));
    return b.done();
  }),
  e('lily of the valley', 'garden', 'flowers', () => {
    const b = m('lily of the valley');
    b.ball([0.06, 0.2, 0.025], [-0.03, 0.1, -0.015], { color: 'leaf', rot: [0, 0, 10] })
      .ball([0.06, 0.18, 0.025], [0.035, 0.09, -0.025], { color: 'darkgreen', rot: [0, 0, -12] });
    const pts: V[] = [[0, 0, 0.01], [0.005, 0.12, 0.015], [0.025, 0.17, 0.02], [0.05, 0.185, 0.025], [0.075, 0.175, 0.03], [0.095, 0.15, 0.03]];
    for (let i = 0; i < 5; i++) b.rod(pts[i], pts[i + 1], 0.006, 'green');
    for (let i = 1; i < 6; i++) b.ball([0.024, 0.022, 0.024], [pts[i][0] + 0.005, pts[i][1] - 0.022, pts[i][2] + 0.01], { color: 'white' });
    return b.done();
  }),
  e('limb', 'clinic', 'body parts', () => {
    const b = m('limb'), k = 'skin3';
    b.cyl([0.22, 0.04, 0.22], [0, 0.02, 0], { color: 'darkgray' })
      .ball([0.17, 0.15, 0.16], [0, 0.1, 0], { color: k })
      .rod([0, 0.1, 0], [0, 0.36, 0], 0.13, k)
      .ball(0.11, [0, 0.38, 0], { color: k })
      .rod([0, 0.38, 0], [0.17, 0.56, 0], 0.1, k)
      .box([0.1, 0.11, 0.05], [0.21, 0.63, 0], { color: k, round: 0.5, rot: [0, 0, -30] })
      .each(4, (i) => b.capsule([0.024, 0.07, 0.026], [0.2 + i * 0.019, 0.7 - i * 0.012, 0], { color: k, rot: [0, 0, -30] }))
      .capsule([0.028, 0.065, 0.028], [0.17, 0.66, 0.01], { color: k, rot: [0, 0, 20] });
    return b.done();
  }),
  e('lime', 'food', 'fruit', () =>
    m('lime')
      .ball([0.065, 0.058, 0.06], [-0.02, 0.029, 0], { color: '#6fb43a' })
      .ball(0.012, [-0.054, 0.03, 0], { color: '#6fb43a' })
      .cyl([0.058, 0.022, 0.058], [0.045, 0.03, 0.02], { color: '#4f9a2a', rot: [70, 0, 0] })
      .cyl([0.05, 0.024, 0.05], [0.045, 0.03, 0.021], { color: '#d4ef8a', rot: [70, 0, 0] })
      .done(),
  ),
  e('lime tree', 'garden', 'trees', () => tree('lime tree', 8, '#5f9a3a', { shape: 'tall', fruit: '#cfe07a', n: 10, fs: 0.3 }).done()),
  e('limestone', 'nature', 'rocks', () => {
    const b = m('limestone');
    b.box([0.7, 0.45, 0.5], [0, 0.225, 0], { color: '#e6dcc0', round: 0.35 })
      .each(3, (i) => b.box([0.71, 0.025, 0.51], [0, 0.1 + i * 0.12, 0], { color: '#cfc2a0', noInk: true, round: 0.3 }))
      .torus([0.1, 0.1, 0.02], [0.12, 0.25, 0.25], { color: '#bfae88', tube: 0.3 })
      .torus([0.05, 0.05, 0.022], [0.12, 0.25, 0.252], { color: '#bfae88', tube: 0.35 })
      .ball([0.3, 0.2, 0.25], [-0.25, 0.1, 0.15], { color: '#ddd2b4' });
    return b.done();
  }),
  e('limo', 'garage', 'cars', () => {
    const b = m('limo', { view: 'side' });
    b.box([1.9, 0.6, 6.4], [0, 0.62, 0], { color: 'black', round: 0.4 })
      .box([1.75, 0.5, 4.4], [0, 1.12, -0.3], { color: 'black', round: 0.4 })
      .box([1.77, 0.3, 4.2], [0, 1.14, -0.3], { color: '#3a4550', round: 0.3 })
      .box([1.92, 0.06, 6.2], [0, 0.72, 0], { color: 'silver', noInk: true })
      .box([1.0, 0.2, 0.06], [0, 0.55, 3.2], { color: 'silver' })
      .pair((s) => b.ball([0.3, 0.14, 0.06], [s * 0.62, 0.7, 3.19], { color: 'white', glow: true }).ball([0.3, 0.14, 0.06], [s * 0.62, 0.7, -3.19], { color: 'red', glow: true }));
    return wheels(b, 0.85, [2.2, -2.2], 0.68, 0.24).done();
  }),
  e('lingerie', 'wardrobe', 'underwear', () => {
    const b = m('lingerie'), c = '#f4a1c0';
    b.rod([-0.17, 0.45, 0], [0.17, 0.45, 0], 0.02, 'darkwood')
      .rod([-0.17, 0.45, 0], [0, 0.52, 0], 0.02, 'darkwood')
      .rod([0.17, 0.45, 0], [0, 0.52, 0], 0.02, 'darkwood')
      .rod([0, 0.52, 0], [0, 0.56, 0], 0.01, 'silver')
      .pair((s) => b.rod([s * 0.09, 0.45, 0], [s * 0.09, 0.34, 0.01], 0.01, c).ball([0.1, 0.09, 0.07], [s * 0.055, 0.31, 0.03], { color: c }))
      .cyl([0.2, 0.3, 0.1], [0, 0.17, 0], { color: c, taper: 0.75 })
      .torus([0.21, 0.1, 0.03], [0, 0.03, 0], { color: 'white', rot: [90, 0, 0], tube: 0.15 })
      .box([0.2, 0.025, 0.11], [0, 0.29, 0.01], { color: 'white', noInk: true })
      .ball([0.03, 0.025, 0.015], [0, 0.29, 0.065], { color: 'red' });
    return b.done();
  }),
  e('lint', 'home', 'laundry', () => {
    const b = m('lint');
    b.ball([0.2, 0.12, 0.16], [0, 0.06, 0], { color: '#b8b4bc' })
      .ball([0.12, 0.1, 0.1], [0.07, 0.1, 0.02], { color: '#c8c4cc' })
      .ball([0.1, 0.08, 0.1], [-0.07, 0.09, 0.03], { color: '#a8a4b0' })
      .rod([-0.05, 0.12, 0.05], [0.04, 0.16, 0.06], 0.008, 'blue', { noInk: true })
      .rod([0.02, 0.13, 0.06], [0.1, 0.1, 0.05], 0.008, 'red', { noInk: true })
      .cyl([0.09, 0.18, 0.09], [0.12, 0.05, -0.15], { color: 'white', rot: [0, 0, 90] })
      .rod([0.21, 0.05, -0.15], [0.25, 0.05, -0.15], 0.015, 'silver')
      .rod([0.25, 0.05, -0.15], [0.3, 0.2, -0.15], 0.035, 'blue');
    return b.done();
  }),
  e('lip balm', 'wardrobe', 'makeup', () =>
    m('lip balm')
      .cyl([0.018, 0.045, 0.018], [0, 0.0225, 0], { color: 'white' })
      .cyl([0.019, 0.025, 0.019], [0, 0.0575, 0], { color: 'blue' })
      .cyl([0.0185, 0.022, 0.0185], [0, 0.022, 0], { color: 'skyblue', noInk: true })
      .ball([0.014, 0.008, 0.014], [0, 0.07, 0], { color: 'blue' })
      .done(),
  ),
  e('lip stain', 'wardrobe', 'makeup', () =>
    m('lip stain')
      .box([0.024, 0.055, 0.016], [0, 0.0275, 0], { color: '#b8203a', round: 0.4 })
      .cyl([0.014, 0.008, 0.014], [0, 0.059, 0], { color: 'gold' })
      .cyl([0.014, 0.045, 0.014], [0, 0.085, 0], { color: 'black' })
      .ball([0.014, 0.006, 0.014], [0, 0.107, 0], { color: 'black' })
      .done(),
  ),
  e('lipstick', 'wardrobe', 'makeup', () =>
    m('lipstick')
      .cyl([0.022, 0.03, 0.022], [0, 0.015, 0], { color: 'black' })
      .cyl([0.02, 0.025, 0.02], [0, 0.0425, 0], { color: 'gold' })
      .cyl([0.015, 0.022, 0.015], [0, 0.066, 0], { color: '#d42a4a' })
      .ball([0.015, 0.014, 0.015], [0, 0.077, 0], { color: '#d42a4a', rot: [0, 0, 35] })
      .cyl([0.022, 0.045, 0.022], [0.035, 0.0225, 0], { color: 'gold' })
      .done(),
  ),
  e('liquorice', 'food', 'sweets', () => {
    const b = m('liquorice');
    b.each(4, (i) => b.torus([0.12 - i * 0.025, 0.12 - i * 0.025, 0.025], [0, 0.065, 0], { color: 'black', tube: 0.18 + i * 0.03 }))
      .cyl([0.03, 0.026, 0.03], [0, 0.065, 0.002], { color: 'pink', rot: [90, 0, 0] })
      .cyl([0.08, 0.01, 0.03], [0, 0.005, 0], { color: 'black' })
      .each(2, (i) => b.rod([0.09 + i * 0.03, 0.01, -0.02], [0.08 + i * 0.03, 0.15, -0.04], 0.02, i ? 'red' : 'black'));
    return b.done();
  }),
  e('liver', 'clinic', 'organs', () =>
    m('liver')
      .ball([0.2, 0.12, 0.13], [0.03, 0.065, 0], { color: '#8a2b2b' })
      .ball([0.14, 0.07, 0.09], [-0.09, 0.08, 0.005], { color: '#8a2b2b', rot: [0, 0, -12] })
      .ball([0.03, 0.045, 0.03], [0.03, 0.03, 0.06], { color: 'green' })
      .stick([0.01, 0.1, 0], [0.01, 0.16, -0.01], 0.022, 'blue')
      .stick([-0.02, 0.1, 0.02], [-0.03, 0.15, 0.02], 0.016, 'red')
      .done(),
  ),
  e('living room', 'places', 'rooms', () => {
    const b = room('living room', 4, 3.4, 2.5, 'wood', 'beige', 'peach');
    b.box([1.2, 0.9, 0.05], [0.9, 1.6, -1.62], { color: 'glass' })
      .box([0.8, 0.6, 0.05], [-0.9, 1.7, -1.62], { color: 'gold' })
      .box([0.65, 0.45, 0.06], [-0.9, 1.7, -1.6], { color: 'skyblue' })
      .box([2.0, 0.4, 0.8], [-0.2, 0.3, -1.1], { color: 'teal' })
      .box([2.0, 0.55, 0.25], [-0.2, 0.75, -1.4], { color: 'teal' })
      .pair((s) => b.box([0.25, 0.6, 0.85], [-0.2 + s * 1.05, 0.4, -1.1], { color: '#2f8a84' }))
      .box([2.2, 0.03, 1.4], [0, 0.11, 0.35], { color: 'red', round: 0.1 })
      .box([1.0, 0.08, 0.5], [-0.2, 0.45, 0.25], { color: 'darkwood' })
      .box([0.8, 0.3, 0.35], [-0.2, 0.26, 0.25], { color: 'wood' })
      .stick([1.55, 0.1, -1.2], [1.55, 1.45, -1.2], 0.05, 'darkgray')
      .cone([0.45, 0.35, 0.45], [1.55, 1.5, -1.2], { color: 'cream', taper: 0.6 });
    return b.done();
  }),
  e('lobster trap', 'sea', 'fishing', () => {
    const b = m('lobster trap');
    b.box([0.7, 0.05, 0.46], [0, 0.025, 0], { color: 'wood' })
      .pair((s) => b.box([0.04, 0.3, 0.46], [s * 0.33, 0.17, 0], { color: 'wood' }))
      .each(5, (i) => {
        const a = -60 + i * 30;
        b.box([0.7, 0.03, 0.07], [0, 0.12 + 0.2 * Math.cos(rad(a)), 0.2 * Math.sin(rad(a))], { color: 'lightwood', rot: [a, 0, 0] });
      })
      .each(2, (i) => b.box([0.7, 0.04, 0.03], [0, 0.09 + i * 0.1, 0.22], { color: 'lightwood' }))
      .torus([0.16, 0.16, 0.03], [0.34, 0.17, 0], { color: 'darkgreen', rot: [0, 90, 0] })
      .capsule([0.08, 0.2, 0.08], [0.05, 0.4, 0], { color: 'red', rot: [0, 0, 70] })
      .capsule([0.082, 0.07, 0.082], [0.05, 0.4, 0], { color: 'white', rot: [0, 0, 70] })
      .rod([0.0, 0.33, 0], [0.02, 0.38, 0], 0.01, 'tan');
    return b.done();
  }),
  e('locker', 'study', 'school', () => {
    const b = m('locker');
    b.box([0.82, 1.8, 0.45], [0, 0.9, 0], { color: '#3f6fb0', round: 0.05 })
      .each(2, (i) => {
        const x = -0.2 + i * 0.4, o = i ? { name: 'door', pivot: [x - 0.18, 0.95, 0.235] as V } : {};
        b.box([0.37, 1.7, 0.03], [x, 0.95, 0.235], { color: '#5a8ad0', ...o });
        const par = i ? { parent: 'door' } : {};
        b.each(4, (j) => b.box([0.2, 0.015, 0.02], [x, 1.62 - j * 0.04, 0.255], { color: '#2a4a80', ...par }));
        b.box([0.03, 0.12, 0.04], [x + 0.13, 1.0, 0.26], { color: 'silver', ...par });
        b.box([0.09, 0.05, 0.02], [x, 1.45, 0.255], { color: 'white', ...par });
      });
    return b.done();
  }),
  e('locker room', 'places', 'rooms', () => {
    const b = room('locker room', 4, 3, 2.5, '#d4d7da', '#e8eef2');
    b.each(5, (i) => {
      const x = -1.6 + i * 0.62;
      b.box([0.58, 1.9, 0.45], [x, 1.0, -1.2], { color: i % 2 ? '#3f6fb0' : '#5a8ad0' })
        .each(3, (j) => b.box([0.3, 0.02, 0.02], [x, 1.7 - j * 0.05, -0.97], { color: '#2a4a80' }));
    })
      .box([2.4, 0.08, 0.45], [0.3, 0.45, 0.2], { color: 'wood' })
      .pair((s) => b.box([0.08, 0.4, 0.35], [0.3 + s * 1.0, 0.25, 0.2], { color: 'steel' }))
      .box([0.5, 0.06, 0.3], [0.5, 0.52, 0.2], { color: 'white', round: 0.5 })
      .box([1.6, 0.3, 0.06], [0, 2.25, -1.38], { color: 'navy' })
      .label('LOCKER ROOM', [1.5, 0.24], [0, 2.25, -1.34], { color: 'navy' });
    return b.done();
  }),
  e('loft', 'places', 'rooms', () => {
    const b = room('loft', 4, 3, 3.4, 'wood', 'cream', '#e8d8c0');
    b.wedge([4, 1.0, 0.3], [0, 3.95, -1.35], { color: 'darkred' })
      .box([4, 0.15, 1.4], [0, 2.0, -0.8], { color: 'darkwood' })
      .pair((s) => b.stick([s * 1.9, 0.1, -0.15], [s * 1.9, 1.95, -0.15], 0.12, 'darkwood'))
      .stick([-1.9, 2.5, -0.12], [1.9, 2.5, -0.12], 0.06, 'darkwood')
      .each(5, (i) => b.stick([-1.6 + i * 0.8, 2.07, -0.12], [-1.6 + i * 0.8, 2.5, -0.12], 0.05, 'darkwood'))
      .box([1.6, 0.25, 0.9], [0.6, 2.2, -0.95], { color: 'white' })
      .box([0.5, 0.15, 0.3], [0.0, 2.38, -1.2], { color: 'skyblue' })
      .pair((s) => b.stick([-1.0 + s * 0.22, 0.1, 0.9], [-1.0 + s * 0.22, 2.1, -0.1], 0.06, 'wood'))
      .each(5, (i) => {
        const t = (i + 1) / 6;
        b.stick([-1.22, 0.1 + 2 * t, 0.9 - t], [-0.78, 0.1 + 2 * t, 0.9 - t], 0.045, 'wood');
      })
      .ball(0.7, [0, 3.0, -1.42], { color: 'glass' });
    return b.done();
  }),
  e('log cabin', 'places', 'houses', () => {
    const b = m('log cabin');
    b.box([4, 2.4, 3], [0, 1.2, 0], { color: '#8a5a35', round: 0.05 })
      .each(5, (i) => b.cyl([0.48, 4.3, 0.48], [0, 0.24 + i * 0.48, 1.4], { color: i % 2 ? '#a0693c' : '#946036', rot: [0, 0, 90] }))
      .pair((s) => b.each(5, (i) => b.cyl([0.48, 3.3, 0.48], [s * 1.9, 0.24 + i * 0.48, 0], { color: i % 2 ? '#946036' : '#a0693c', rot: [90, 0, 0] })))
      .wedge([4.8, 1.6, 3.6], [0, 3.2, 0], { color: '#5a3a22', rot: [0, 90, 0] })
      .box([0.4, 1.4, 0.4], [1.2, 3.6, -0.5], { color: 'stone' })
      .box([0.9, 1.8, 0.1], [0, 0.9, 1.66], { color: 'darkwood', name: 'door', pivot: [-0.45, 0.9, 1.66] })
      .pair((s) => b.box([0.7, 0.7, 0.1], [s * 1.2, 1.4, 1.66], { color: 'glass' }))
      .box([1.2, 0.35, 0.08], [0, 2.1, 1.68], { color: 'tan' })
      .label('CABIN', [1.1, 0.28], [0, 2.1, 1.73], { color: 'tan' });
    return b.done();
  }),
  e('lollipop', 'food', 'sweets', () =>
    m('lollipop')
      .stick([0, 0, 0], [0, 0.075, 0], 0.008, 'white')
      .cyl([0.065, 0.018, 0.065], [0, 0.105, 0], { color: 'magenta', rot: [90, 0, 0] })
      .torus([0.05, 0.05, 0.02], [0, 0.105, 0], { color: 'yellow', tube: 0.18 })
      .torus([0.028, 0.028, 0.021], [0, 0.105, 0], { color: 'cyan', tube: 0.3 })
      .done(),
  ),
  e('long johns', 'wardrobe', 'underwear', () => {
    const b = m('long johns'), c = '#c8322a';
    b.box([0.4, 0.5, 0.2], [0, 0.72, 0], { color: c, round: 0.4 })
      .box([0.38, 0.16, 0.2], [0, 0.5, 0], { color: c, round: 0.4 })
      .cyl([0.16, 0.05, 0.12], [0, 0.97, 0], { color: '#a82820' })
      .pair((s) => b.rod([s * 0.1, 0.48, 0], [s * 0.12, 0.06, 0], 0.14, c).cyl([0.13, 0.05, 0.13], [s * 0.12, 0.025, 0], { color: '#a82820' }).rod([s * 0.2, 0.92, 0], [s * 0.33, 0.5, 0], 0.11, c))
      .each(5, (i) => b.ball(0.025, [0, 0.92 - i * 0.08, 0.1], { color: 'white' }));
    return b.done();
  }),
  e('loom', 'workshop', 'crafts', () => {
    const b = m('loom');
    b.pair((s) => b.stick([s * 0.6, 0, 0], [s * 0.6, 1.5, 0], 0.08, 'wood').stick([s * 0.6, 0, -0.5], [s * 0.6, 1.0, -0.5], 0.08, 'wood').stick([s * 0.6, 0.9, 0], [s * 0.6, 0.9, -0.5], 0.06, 'wood'))
      .box([1.36, 0.12, 0.12], [0, 1.45, 0], { color: 'darkwood' })
      .box([1.36, 0.12, 0.14], [0, 0.78, 0.0], { color: 'darkwood' })
      .box([1.0, 0.6, 0.01], [0, 1.12, 0], { color: 'cream' })
      .each(8, (i) => b.stick([-0.44 + i * 0.125, 0.82, 0.005], [-0.44 + i * 0.125, 1.42, 0.005], 0.006, '#d9c9a0', { noInk: true }))
      .box([1.0, 0.18, 0.03], [0, 0.9, 0.01], { color: 'red' })
      .box([0.9, 0.06, 0.03], [0, 1.0, 0.01], { color: 'blue' })
      .box([1.1, 0.06, 0.05], [0, 1.25, 0.0], { color: 'darkwood' })
      .capsule([0.04, 0.3, 0.03], [0.1, 1.04, 0.04], { color: 'lightwood', rot: [0, 0, 90] })
      .each(3, (i) => b.box([0.08, 0.03, 0.4], [-0.2 + i * 0.2, 0.08, -0.15], { color: 'wood' }));
    return b.done();
  }),
  e('lotion', 'home', 'toiletries', () =>
    m('lotion')
      .box([0.07, 0.13, 0.045], [0, 0.065, 0], { color: 'cream', round: 0.6 })
      .box([0.072, 0.06, 0.047], [0, 0.065, 0], { color: 'teal', round: 0.6, noInk: true })
      .cyl([0.03, 0.015, 0.03], [0, 0.135, 0], { color: 'white' })
      .stick([0, 0.14, 0], [0, 0.17, 0], 0.01, 'white')
      .box([0.022, 0.018, 0.022], [0, 0.178, 0], { color: 'white' })
      .stick([0, 0.18, 0.008], [0, 0.18, 0.03], 0.008, 'white')
      .done(),
  ),
  e('lottery ticket', 'toys', 'games', () => {
    const b = m('lottery ticket');
    b.box([0.1, 0.06, 0.008], [0, 0.034, 0], { color: '#f6d24a', round: 0.2 })
      .box([0.1, 0.014, 0.009], [0, 0.057, 0], { color: 'red', noInk: true })
      .box([0.04, 0.025, 0.01], [0.025, 0.026, 0.001], { color: 'silver', noInk: true })
      .each(3, (i) => b.cyl([0.012, 0.004, 0.012], [-0.035 + i * 0.016, 0.032, 0.005], { color: 'white', rot: [90, 0, 0], noInk: true }))
      .label('LOTTO', [0.06, 0.012], [0, 0.057, 0.006], { color: 'red' })
      .box([0.08, 0.006, 0.03], [0, 0.003, 0], { color: 'gray' });
    return b.done();
  }),
  e('lotus', 'garden', 'flowers', () => {
    const b = m('lotus');
    b.cyl([0.9, 0.04, 0.9], [0, 0.02, 0], { color: 'water' })
      .cyl([0.45, 0.02, 0.45], [-0.12, 0.05, 0.08], { color: 'green' })
      .cyl([0.3, 0.02, 0.3], [0.25, 0.05, -0.15], { color: 'darkgreen' })
      .stick([0, 0.04, 0], [0, 0.22, 0], 0.03, 'green')
      .ball([0.12, 0.08, 0.12], [0, 0.26, 0], { color: 'yellow', name: 'head', pivot: [0, 0.2, 0] });
    around(8, 0.1).forEach(([x, z], i) => b.ball([0.11, 0.24, 0.05], [x, 0.31, z], { color: '#f490b4', rot: [38, 90 - i * 45, 0], parent: 'head' }));
    around(6, 0.055, 0.5).forEach(([x, z], i) => b.ball([0.09, 0.2, 0.045], [x, 0.33, z], { color: '#fbc8dc', rot: [14, 90 - i * 60 - 28.6, 0], parent: 'head' }));
    return b.done();
  }),
  e('lounge chair', 'home', 'outdoor furniture', () => {
    const b = m('lounge chair', { view: 'side' });
    b.box([0.65, 0.14, 1.2], [0, 0.4, 0.25], { color: 'skyblue' })
      .box([0.65, 0.14, 0.8], [0, 0.66, -0.66], { color: 'skyblue', rot: [40, 0, 0] })
      .pair((s) => {
        b.box([0.12, 0.145, 1.2], [s * 0.2, 0.4, 0.25], { color: 'white', noInk: true })
          .box([0.12, 0.145, 0.8], [s * 0.2, 0.66, -0.66], { color: 'white', noInk: true, rot: [40, 0, 0] })
          .box([0.04, 0.06, 1.9], [s * 0.34, 0.3, -0.1], { color: 'white' })
          .stick([s * 0.34, 0, 0.75], [s * 0.34, 0.3, 0.75], 0.05, 'white')
          .stick([s * 0.34, 0, -0.9], [s * 0.34, 0.3, -0.9], 0.05, 'white');
      });
    return b.done();
  }),
  e('love potion', 'fantasy', 'potions', () =>
    m('love potion')
      .ball(0.12, [0, 0.065, 0], { color: '#f06aa8' })
      .cyl([0.035, 0.06, 0.035], [0, 0.14, 0], { color: '#f7c6dc' })
      .cyl([0.04, 0.03, 0.04], [0, 0.18, 0], { color: 'wood', taper: 1.15 })
      .torus([0.05, 0.05, 0.012], [0, 0.135, 0], { color: 'red', rot: [90, 0, 0], tube: 0.2 })
      .heart(0.05, [0, 0.07, 0.058], { color: 'red' })
      .done(),
  ),
  e('lunar lander', 'garage', 'spacecraft', () => {
    const b = m('lunar lander');
    b.cyl([3.0, 1.3, 3.0], [0, 1.6, 0], { color: 'gold', segs: 8 });
    around(4, 2.0, Math.PI / 4).forEach(([x, z]) => b.rod([x * 0.5, 1.9, z * 0.5], [x, 0.2, z], 0.15, 'silver').cyl([0.6, 0.1, 0.6], [x, 0.05, z], { color: 'silver' }));
    b.cone([1.2, 0.6, 1.2], [0, 0.75, 0], { color: 'darkgray', taper: 0.5 })
      .box([2.4, 1.6, 2.2], [0, 3.05, 0], { color: 'lightgray', round: 0.15 })
      .box([1.6, 0.6, 1.6], [0, 4.1, -0.1], { color: 'silver', round: 0.2 })
      .pair((s) => b.wedge([0.5, 0.5, 0.1], [s * 0.55, 3.4, 1.11], { color: '#2a3440', rot: [0, 0, s * 15] }))
      .box([0.7, 0.8, 0.1], [0, 2.7, 1.11], { color: 'gray' })
      .stick([0.8, 3.8, -0.5], [1.0, 4.6, -0.6], 0.06, 'silver')
      .cyl([0.7, 0.18, 0.7], [1.0, 4.7, -0.6], { color: 'white', taper: 0.2, rot: [180, 0, 0] });
    return b.done();
  }),
  e('lunar rover', 'garage', 'spacecraft', () => {
    const b = m('lunar rover', { view: 'side' });
    b.box([1.8, 0.15, 3.0], [0, 0.7, 0], { color: 'silver' })
      .pair((s) => b.each(2, (i) => b.box([0.32, 0.05, 0.95], [s * 1.0, 0.86, i ? -1.1 : 1.1], { color: 'tan', round: 0.5 })))
      .pair((s) => b.box([0.5, 0.1, 0.5], [s * 0.4, 0.83, -0.2], { color: 'gray' }).box([0.5, 0.5, 0.08], [s * 0.4, 1.1, -0.45], { color: 'gray' }))
      .box([0.5, 0.45, 0.3], [0, 1.0, 0.55], { color: 'darkgray' })
      .stick([0, 0.8, 1.2], [0, 1.8, 1.2], 0.05, 'silver')
      .cyl([0.9, 0.2, 0.9], [0, 1.9, 1.2], { color: 'white', taper: 0.15, rot: [160, 0, 0] });
    return wheels(b, 1.0, [1.1, -1.1], 0.8, 0.25, 'gold').done();
  }),
  e('lunchbox', 'kitchen', 'lunch', () =>
    m('lunchbox')
      .box([0.22, 0.12, 0.1], [0, 0.06, 0], { color: 'red' })
      .box([0.222, 0.05, 0.102], [0, 0.145, 0], { color: '#c8322a', name: 'lid', pivot: [0, 0.12, -0.05] })
      .torus([0.1, 0.07, 0.022], [0, 0.18, 0], { color: 'black', parent: 'lid' })
      .box([0.03, 0.03, 0.01], [0.07, 0.12, 0.052], { color: 'silver' })
      .box([0.03, 0.03, 0.01], [-0.07, 0.12, 0.052], { color: 'silver' })
      .star(0.06, [0, 0.06, 0.052], { color: 'yellow' })
      .done(),
  ),
  e('lung', 'clinic', 'organs', () => {
    const b = m('lung'), p = '#f08a9a';
    b.pair((s) => b.ball([0.11, 0.2, 0.09], [s * 0.065, 0.1, 0], { color: p }).rod([0, 0.18, 0], [s * 0.05, 0.14, 0.01], 0.022, '#f4c0c8'))
      .cyl([0.03, 0.08, 0.03], [0, 0.22, 0], { color: '#f4c0c8' })
      .each(3, (i) => b.torus([0.034, 0.034, 0.008], [0, 0.195 + i * 0.022, 0], { color: '#e8a0b0', rot: [90, 0, 0], tube: 0.25 }));
    return b.done();
  }),
  e('macaroni and cheese', 'food', 'meals', () => {
    const b = m('macaroni and cheese');
    b.cyl([0.13, 0.05, 0.13], [0, 0.025, 0], { color: 'blue', taper: 1.4 })
      .ball([0.17, 0.06, 0.17], [0, 0.055, 0], { color: 'cheese' });
    around(7, 0.045).forEach(([x, z], i) => b.torus([0.03, 0.03, 0.013], [x, 0.077, z], { color: '#f6b83a', rot: [i * 40, i * 70, 0], tube: 0.3 }));
    return b.done();
  }),
  e('mace (weapon)', 'armory', 'medieval weapons', () => {
    const b = m('mace (weapon)');
    b.ball(0.05, [0, 0.025, 0], { color: 'iron' })
      .stick([0, 0.03, 0], [0, 0.5, 0], 0.035, 'darkwood')
      .cyl([0.045, 0.2, 0.045], [0, 0.15, 0], { color: 'leather' })
      .cyl([0.08, 0.14, 0.08], [0, 0.57, 0], { color: 'iron' })
      .cone([0.05, 0.08, 0.05], [0, 0.68, 0], { color: 'iron' });
    around(6, 0.05).forEach(([x, z], i) => b.wedge([0.07, 0.15, 0.02], [x, 0.58, z], { color: 'steel', rot: [0, -i * 60, 0] }));
    return b.done();
  }),
  e('machete', 'armory', 'blades', () =>
    m('machete')
      .capsule([0.045, 0.14, 0.04], [0, 0.07, 0], { color: 'black' })
      .box([0.07, 0.015, 0.03], [0.01, 0.145, 0], { color: 'darkgray' })
      .box([0.055, 0.35, 0.008], [0.012, 0.32, 0], { color: 'steel', round: 0.1 })
      .ball([0.075, 0.12, 0.008], [0.02, 0.48, 0], { color: 'steel' })
      .box([0.012, 0.35, 0.009], [0.035, 0.33, 0], { color: 'silver', noInk: true })
      .cyl([0.012, 0.042, 0.012], [0, 0.05, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.012, 0.042, 0.012], [0, 0.1, 0], { color: 'silver', rot: [90, 0, 0] })
      .done(),
  ),
  e('machine gun', 'armory', 'guns', () => {
    const b = m('machine gun', { view: 'side' });
    b.box([0.11, 0.16, 0.42], [0, 0.36, 0], { color: 'darkgray' })
      .cyl([0.065, 0.3, 0.065], [0, 0.38, 0.36], { color: 'iron', rot: [90, 0, 0] })
      .each(4, (i) => b.cyl([0.068, 0.02, 0.068], [0, 0.38, 0.25 + i * 0.07], { color: 'black', rot: [90, 0, 0] }))
      .stick([0, 0.38, 0.5], [0, 0.38, 0.85], 0.03, 'black')
      .box([0.055, 0.15, 0.32], [0, 0.32, -0.35], { color: 'darkwood', rot: [-8, 0, 0] })
      .box([0.045, 0.13, 0.05], [0, 0.25, -0.1], { color: 'black', rot: [15, 0, 0] })
      .box([0.05, 0.2, 0.09], [0, 0.2, 0.08], { color: 'black', rot: [-10, 0, 0] })
      .rod([0, 0.45, -0.1], [0, 0.48, 0.0], 0.02, 'black')
      .rod([0, 0.48, 0.0], [0, 0.45, 0.1], 0.02, 'black')
      .pair((s) => b.rod([0, 0.36, 0.62], [s * 0.1, 0.0, 0.66], 0.02, 'black'));
    return b.done();
  }),
  e('magazine (reading)', 'study', 'books', () =>
    m('magazine (reading)')
      .box([0.21, 0.28, 0.02], [0, 0.14, 0], { color: 'white', round: 0.1 })
      .box([0.21, 0.06, 0.021], [0, 0.245, 0.0], { color: 'red', noInk: true, round: 0.1 })
      .label('MAGAZINE', [0.19, 0.045], [0, 0.245, 0.006], { color: 'red' })
      .box([0.15, 0.13, 0.022], [0, 0.13, 0.0], { color: 'skyblue', noInk: true })
      .ball([0.06, 0.07, 0.01], [0, 0.13, 0.011], { color: 'skin2', noInk: true })
      .ball([0.07, 0.04, 0.01], [0, 0.165, 0.012], { color: 'brown', noInk: true })
      .box([0.12, 0.014, 0.022], [-0.03, 0.045, 0], { color: 'yellow', noInk: true })
      .box([0.08, 0.01, 0.022], [-0.05, 0.025, 0], { color: 'darkgray', noInk: true })
      .done(),
  ),
  e('magic bean', 'fantasy', 'magic items', () =>
    m('magic bean')
      .ball([0.06, 0.035, 0.038], [0, 0.018, 0], { color: '#4fc06a', rot: [0, 0, 10] })
      .ball([0.02, 0.012, 0.01], [-0.012, 0.024, 0.018], { color: '#9be8a8', noInk: true })
      .rod([0.015, 0.03, 0], [0.02, 0.06, 0.005], 0.007, 'lime')
      .rod([0.02, 0.06, 0.005], [0.008, 0.085, 0.005], 0.007, 'lime')
      .ball([0.025, 0.012, 0.006], [0.02, 0.08, 0.005], { color: 'lime', rot: [0, 0, -30] })
      .star(0.022, [-0.035, 0.07, 0.01], { color: 'gold', glow: true })
      .star(0.015, [0.04, 0.045, 0.01], { color: 'gold', glow: true })
      .done(),
  ),
  e('magic broomstick', 'fantasy', 'magic items', () =>
    m('magic broomstick', { view: 'side' })
      .stick([0, 0.75, -0.35], [0, 0.95, 0.75], 0.05, 'darkwood')
      .cone([0.38, 0.65, 0.38], [0, 0.7, -0.65], { color: '#d9b04a', rot: [-80, 0, 0] })
      .torus([0.12, 0.12, 0.05], [0, 0.75, -0.35], { color: 'purple', rot: [0, 0, 0], tube: 0.3 })
      .star(0.12, [0, 0.45, -0.7], { color: 'gold', glow: true })
      .star(0.08, [0, 0.35, -0.95], { color: 'gold', glow: true })
      .star(0.06, [0, 0.25, -1.15], { color: 'gold', glow: true })
      .done(),
  ),
  e('magic carpet', 'fantasy', 'magic items', () => {
    const b = m('magic carpet');
    b.box([1.2, 0.08, 0.8], [0, 0.6, 0], { color: 'darkred', round: 0.3 })
      .box([1.2, 0.08, 0.6], [0, 0.66, -0.66], { color: 'darkred', round: 0.3, rot: [-12, 0, 0] })
      .box([1.2, 0.08, 0.6], [0, 0.66, 0.66], { color: 'darkred', round: 0.3, rot: [12, 0, 0] })
      .box([0.8, 0.085, 0.6], [0, 0.6, 0], { color: 'gold', noInk: true })
      .box([0.5, 0.09, 0.35], [0, 0.6, 0], { color: 'navy', noInk: true });
    for (const x of [-0.6, 0.6]) for (const z of [-0.95, 0.95]) b.ball(0.09, [x, 0.7, z], { color: 'gold' });
    return b.ball([0.3, 0.15, 0.2], [0.2, 0.72, 0.1], { color: 'gold' })
      .rod([0.33, 0.73, 0.1], [0.45, 0.8, 0.1], 0.05, 'gold')
      .torus([0.12, 0.12, 0.03], [0.04, 0.74, 0.1], { color: 'gold' })
      .cone([0.12, 0.08, 0.12], [0.2, 0.82, 0.1], { color: 'gold' })
      .done();
  }),
  e('magicians hat', 'toys', 'magic tricks', () =>
    m('magicians hat')
      .cyl([0.2, 0.18, 0.2], [0, 0.09, 0], { color: 'black', taper: 1.05 })
      .cyl([0.212, 0.04, 0.212], [0, 0.155, 0], { color: 'red', taper: 1.05 })
      .cyl([0.34, 0.016, 0.34], [0, 0.185, 0], { color: 'black' })
      .cyl([0.19, 0.005, 0.19], [0, 0.195, 0], { color: '#1a1716' })
      .ball([0.12, 0.1, 0.1], [0, 0.22, 0], { color: 'white' })
      .capsule([0.04, 0.13, 0.025], [-0.025, 0.31, 0], { color: 'white', rot: [0, 0, 10] })
      .capsule([0.04, 0.13, 0.025], [0.025, 0.31, 0], { color: 'white', rot: [0, 0, -10] })
      .ball([0.02, 0.06, 0.005], [-0.025, 0.31, 0.012], { color: 'pink', rot: [0, 0, 10] })
      .ball([0.02, 0.06, 0.005], [0.025, 0.31, 0.012], { color: 'pink', rot: [0, 0, -10] })
      .ball(0.018, [-0.025, 0.235, 0.045], { color: 'black', eye: true })
      .ball(0.018, [0.025, 0.235, 0.045], { color: 'black', eye: true })
      .ball(0.016, [0, 0.215, 0.052], { color: 'pink' })
      .stick([0.2, 0.0, 0.1], [0.12, 0.25, 0.1], 0.02, 'black')
      .stick([0.12, 0.25, 0.1], [0.11, 0.28, 0.1], 0.021, 'white')
      .done(),
  ),
  e('magnet', 'study', 'science', () => {
    const b = m('magnet'), r = 0.04, cy = 0.05;
    const pts = [180, 225, 270, 315, 360].map((a): V => [Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r, 0]);
    for (let i = 0; i < 4; i++) b.rod(pts[i], pts[i + 1], 0.028, 'red');
    b.pair((s) => b.stick([s * r, cy, 0], [s * r, 0.1, 0], 0.028, 'red').stick([s * r, 0.1, 0], [s * r, 0.125, 0], 0.029, 'silver'));
    return b.done();
  }),
  e('magnifying glass', 'study', 'science', () =>
    m('magnifying glass')
      .capsule([0.022, 0.08, 0.022], [0, 0.04, 0], { color: 'black' })
      .stick([0, 0.075, 0], [0, 0.085, 0], 0.016, 'gold')
      .torus([0.09, 0.09, 0.016], [0, 0.13, 0], { color: 'gold', tube: 0.12 })
      .cyl([0.082, 0.008, 0.082], [0, 0.13, 0], { color: 'glass', rot: [90, 0, 0] })
      .ball([0.02, 0.02, 0.004], [0.015, 0.145, 0.005], { color: 'white', noInk: true })
      .done(),
  ),
  e('mailbox', 'home', 'outdoor', () =>
    m('mailbox')
      .box([0.1, 1.0, 0.1], [0, 0.5, -0.05], { color: 'wood' })
      .box([0.2, 0.14, 0.48], [0, 1.07, 0], { color: 'navy' })
      .cyl([0.2, 0.48, 0.2], [0, 1.14, 0], { color: 'navy', rot: [90, 0, 0] })
      .box([0.19, 0.2, 0.02], [0, 1.1, 0.24], { color: '#3a5a9a', round: 0.4 })
      .box([0.04, 0.02, 0.03], [0, 1.18, 0.255], { color: 'silver' })
      .stick([0.11, 1.0, -0.12], [0.11, 1.28, -0.12], 0.02, 'red')
      .box([0.015, 0.08, 0.12], [0.11, 1.25, -0.06], { color: 'red' })
      .done(),
  ),
  e('mailing labels', 'study', 'mail', () => {
    const b = m('mailing labels');
    b.box([0.08, 0.105, 0.008], [0, 0.0525, 0], { color: 'beige', round: 0.1 })
      .box([0.07, 0.01, 0.025], [0, 0.005, 0], { color: 'gray' });
    b.each(3, (j) => b.pair((s) => {
      b.box([0.032, 0.028, 0.009], [s * 0.018, 0.084 - j * 0.032, 0.001], { color: 'white', noInk: true })
        .box([0.022, 0.003, 0.01], [s * 0.018, 0.087 - j * 0.032, 0.001], { color: 'darkgray', noInk: true })
        .box([0.016, 0.003, 0.01], [s * 0.018, 0.08 - j * 0.032, 0.001], { color: 'darkgray', noInk: true });
    }));
    return b.done();
  }),
  e('mall (building)', 'places', 'shops', () => {
    const b = m('mall (building)');
    b.box([12, 4, 6], [0, 2, 0], { color: 'beige', round: 0.03 })
      .box([12.3, 0.3, 6.3], [0, 4.15, 0], { color: 'gray' })
      .box([3, 5, 2], [0, 2.5, 3.2], { color: 'glass' })
      .wedge([3.3, 1.2, 2.3], [0, 5.6, 3.2], { color: 'glass' })
      .box([1.6, 2.4, 0.1], [0, 1.2, 4.22], { color: 'skyblue', name: 'door', pivot: [-0.8, 1.2, 4.22] })
      .box([2.6, 0.7, 0.12], [0, 4.4, 4.28], { color: 'red' })
      .label('MALL', [2.4, 0.6], [0, 4.4, 4.35], { color: 'red' })
      .pair((s) => {
        b.box([3.2, 2.2, 0.1], [s * 3.8, 1.3, 3.02], { color: 'glass' })
          .box([2.4, 0.6, 0.12], [s * 3.8, 3.1, 3.04], { color: s > 0 ? 'orange' : 'teal' })
          .box([1.6, 0.4, 0.14], [s * 3.8, 3.1, 3.06], { color: 'white', noInk: true });
      });
    return b.done();
  }),
  e('mallet', 'workshop', 'hand tools', () =>
    m('mallet')
      .stick([0, 0, 0], [0, 0.26, 0], 0.03, 'lightwood')
      .cyl([0.09, 0.15, 0.09], [0, 0.3, 0], { color: 'wood', rot: [0, 0, 90] })
      .cyl([0.092, 0.02, 0.092], [0.065, 0.3, 0], { color: 'darkwood', rot: [0, 0, 90] })
      .cyl([0.092, 0.02, 0.092], [-0.065, 0.3, 0], { color: 'darkwood', rot: [0, 0, 90] })
      .done(),
  ),
  e('mane', 'wild', 'animal parts', () => {
    const b = m('mane');
    b.ball([0.36, 0.36, 0.12], [0, 0.2, -0.05], { color: '#b8642a' });
    around(12, 0.14).forEach(([x, y]) => b.ball(0.12, [x, 0.2 + y, -0.02], { color: '#a8551e' }));
    return b.ball([0.2, 0.2, 0.14], [0, 0.2, 0.04], { color: '#e2a95a' })
      .ball([0.1, 0.07, 0.07], [0, 0.155, 0.1], { color: 'cream' })
      .ball([0.04, 0.025, 0.02], [0, 0.18, 0.135], { color: 'darkbrown' })
      .ball(0.025, [0.045, 0.23, 0.1], { color: 'black', eye: true })
      .ball(0.025, [-0.045, 0.23, 0.1], { color: 'black', eye: true })
      .done();
  }),
  e('mango', 'food', 'fruit', () =>
    m('mango')
      .ball([0.1, 0.13, 0.08], [0, 0.065, 0], { color: '#f2a63a', rot: [0, 0, -15] })
      .ball([0.07, 0.08, 0.06], [-0.02, 0.09, 0.015], { color: '#e0553a', noInk: true, rot: [0, 0, -15] })
      .ball([0.06, 0.06, 0.05], [0.025, 0.035, 0.012], { color: '#a8c040', noInk: true })
      .stick([-0.015, 0.125, 0], [-0.02, 0.145, 0], 0.008, 'darkbrown')
      .ball([0.06, 0.012, 0.025], [0.01, 0.14, 0], { color: 'leaf', rot: [0, 0, -20] })
      .done(),
  ),
  e('mango juice', 'food', 'drinks', () =>
    drink('mango juice', 0.16, '#f6a531', { straw: 'green' })
      .ball([0.05, 0.03, 0.02], [0.045, 0.165, 0.0], { color: '#f2a63a', rot: [0, 0, 30] })
      .ball([0.05, 0.03, 0.012], [0.045, 0.165, -0.012], { color: '#7cae3a', rot: [0, 0, 30] })
      .done(),
  ),
  e('mango tree', 'garden', 'fruit trees', () => tree('mango tree', 8, 'darkgreen', { shape: 'wide', fruit: '#f2a63a', n: 9, fs: 0.32 }).done()),
  e('mangrove swamp', 'nature', 'wetlands', () => {
    const b = m('mangrove swamp');
    b.cyl([7, 0.1, 5], [0, 0.05, 0], { color: '#4f8a7a' });
    const tr = (x: number, z: number, h: number) => {
      b.cyl([h * 0.08, h * 0.45, h * 0.08], [x, h * 0.5, z], { color: 'bark', taper: 0.7 });
      around(5, h * 0.3, 0.3).forEach(([dx, dz]) => b.rod([x, h * 0.3, z], [x + dx * 0.6, h * 0.25, z + dz * 0.6], h * 0.035, 'bark').rod([x + dx * 0.6, h * 0.25, z + dz * 0.6], [x + dx, 0.05, z + dz], h * 0.035, 'bark'));
      b.ball([h * 0.6, h * 0.35, h * 0.55], [x, h * 0.85, z], { color: '#3f7a3a' });
    };
    tr(-0.8, -0.4, 4);
    tr(1.9, 0.6, 2.6);
    return b.ball([0.6, 0.15, 0.4], [-1.8, 0.1, 1.6], { color: 'darkgreen' }).done();
  }),
  e('manhole', 'places', 'street', () =>
    m('manhole')
      .box([1.4, 0.06, 1.2], [0, 0.03, 0], { color: '#55595e', round: 0.1 })
      .cyl([0.7, 0.012, 0.7], [-0.2, 0.062, 0.1], { color: '#1a1716' })
      .stick([-0.35, 0.06, 0.1], [-0.35, 0.35, 0.05], 0.035, 'steel')
      .stick([-0.05, 0.06, 0.1], [-0.05, 0.35, 0.05], 0.035, 'steel')
      .stick([-0.35, 0.3, 0.06], [-0.05, 0.3, 0.06], 0.03, 'steel')
      .cyl([0.7, 0.06, 0.7], [0.32, 0.38, -0.25], { color: 'iron', rot: [80, 0, 0] })
      .box([0.5, 0.02, 0.03], [0.32, 0.4, -0.21], { color: '#3a3d40', rot: [80, 0, 0], noInk: true })
      .box([0.03, 0.02, 0.5], [0.32, 0.38, -0.21], { color: '#3a3d40', rot: [80, 0, 0], noInk: true })
      .cone([0.25, 0.5, 0.25], [0.45, 0.31, 0.35], { color: 'orange' })
      .cyl([0.19, 0.08, 0.19], [0.45, 0.25, 0.35], { color: 'white', taper: 0.77, noInk: true })
      .done(),
  ),
  e('manor', 'places', 'houses', () => {
    const b = m('manor'), wall = '#d8c8a8';
    b.box([10, 4, 4], [0, 2, 0], { color: wall, round: 0.03 })
      .wedge([4.4, 1.6, 10.4], [0, 4.8, 0], { color: 'darkgray', rot: [0, 90, 0] })
      .box([3, 4.6, 0.8], [0, 2.3, 2.3], { color: '#e6d8bc' })
      .wedge([3.4, 1.2, 0.9], [0, 5.2, 2.3], { color: 'darkgray' })
      .box([1.0, 2.0, 0.1], [0, 1.0, 2.72], { color: 'darkwood', name: 'door', pivot: [-0.5, 1.0, 2.72] })
      .box([1.6, 0.4, 0.08], [0, 3.6, 2.72], { color: 'darkgreen' })
      .label('MANOR', [1.5, 0.32], [0, 3.6, 2.77], { color: 'darkgreen' })
      .pair((s) => {
        b.box([0.5, 1.4, 0.5], [s * 3.5, 5.0, 0], { color: 'darkred' });
        for (const x of [2.2, 4.0]) for (const y of [1.3, 3.0]) b.box([0.7, 1.0, 0.1], [s * x, y, 2.02], { color: 'glass' });
      });
    return b.done();
  }),
  e('mansion', 'places', 'houses', () => {
    const b = m('mansion');
    b.box([8, 5, 4], [0, 2.5, 0], { color: 'white', round: 0.03 })
      .box([8.3, 0.4, 4.3], [0, 5.2, 0], { color: 'lightgray' })
      .pair((s) => {
        b.box([3, 3.5, 3.6], [s * 5.5, 1.75, -0.2], { color: 'cream' })
          .box([3.1, 0.3, 3.7], [s * 5.5, 3.6, -0.2], { color: 'lightgray' })
          .ball([1.2, 1.0, 1.0], [s * 3.2, 0.5, 3.2], { color: 'darkgreen' })
          .box([0.8, 1.2, 0.1], [s * 5.5, 1.6, 1.62], { color: 'glass' })
          .box([0.7, 1.2, 0.1], [s * 3.0, 3.6, 2.02], { color: 'glass' })
          .box([0.7, 1.2, 0.1], [s * 3.0, 1.4, 2.02], { color: 'glass' });
      })
      .each(4, (i) => b.cyl([0.4, 4.6, 0.4], [-1.8 + i * 1.2, 2.3, 2.6], { color: 'white' }))
      .box([4.6, 0.4, 1.6], [0, 4.8, 2.3], { color: 'white' })
      .wedge([4.6, 1.1, 1.6], [0, 5.55, 2.3], { color: 'white' })
      .box([1.2, 2.4, 0.1], [0, 1.2, 2.02], { color: 'darkwood', name: 'door', pivot: [-0.6, 1.2, 2.02] })
      .box([1.8, 0.35, 0.06], [0, 4.8, 3.12], { color: 'navy' })
      .label('MANSION', [1.7, 0.28], [0, 4.8, 3.16], { color: 'navy' })
      .box([5, 0.2, 2.0], [0, 0.1, 2.6], { color: 'stone' });
    return b.done();
  }),
  e('map', 'study', 'maps', () =>
    m('map')
      .box([0.32, 0.25, 0.01], [0, 0.145, 0], { color: '#f2e2b8' })
      .cyl([0.04, 0.27, 0.04], [-0.17, 0.145, 0], { color: '#e6d2a0' })
      .cyl([0.04, 0.27, 0.04], [0.17, 0.145, 0], { color: '#e6d2a0' })
      .ball([0.14, 0.1, 0.01], [-0.06, 0.17, 0.006], { color: '#7cb85a', noInk: true })
      .ball([0.09, 0.07, 0.01], [0.08, 0.1, 0.006], { color: '#7cb85a', noInk: true })
      .ball([0.06, 0.05, 0.012], [0.09, 0.2, 0.006], { color: '#4f9bd6', noInk: true })
      .rod([-0.1, 0.13, 0.009], [-0.02, 0.15, 0.009], 0.006, 'red', { noInk: true })
      .rod([-0.02, 0.15, 0.009], [0.06, 0.1, 0.009], 0.006, 'red', { noInk: true })
      .rod([0.05, 0.085, 0.01], [0.075, 0.115, 0.01], 0.008, 'darkred', { noInk: true })
      .rod([0.075, 0.085, 0.01], [0.05, 0.115, 0.01], 0.008, 'darkred', { noInk: true })
      .done(),
  ),
  e('maple tree', 'garden', 'trees', () => tree('maple tree', 8, '#d9541e', { fruit: '#f0a03b', n: 7, fs: 0.8 }).done()),
  e('maraca', 'music', 'percussion', () => {
    const b = m('maraca');
    b.pair((s) => {
      b.rod([s * 0.02, 0.01, 0], [s * 0.07, 0.13, 0], 0.026, 'wood')
        .ball([0.1, 0.12, 0.1], [s * 0.1, 0.2, 0], { color: s > 0 ? 'red' : 'green', rot: [0, 0, -s * 22] })
        .torus([0.1, 0.1, 0.025], [s * 0.1, 0.2, 0], { color: 'yellow', rot: [90, 0, -s * 22], tube: 0.12 })
        .ball(0.02, [s * 0.1 + 0.02, 0.23, 0.045], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('marble (ball)', 'toys', 'marbles', () =>
    m('marble (ball)')
      .ball(0.05, [0, 0.025, 0], { color: '#8fd0f0' })
      .ball([0.03, 0.05, 0.008], [0, 0.025, 0], { color: 'orange', rot: [0, 0, 30], noInk: true })
      .ball(0.03, [0.045, 0.015, 0.02], { color: '#7cd07a' })
      .ball([0.02, 0.03, 0.006], [0.045, 0.015, 0.02], { color: 'yellow', rot: [0, 30, -30], noInk: true })
      .ball(0.028, [-0.042, 0.014, 0.025], { color: '#e86a6a' })
      .ball(0.01, [-0.01, 0.038, 0.02], { color: 'white', noInk: true })
      .done(),
  ),
  e('marble (stone)', 'nature', 'rocks', () => {
    const b = m('marble (stone)');
    b.box([1.0, 0.8, 0.7], [0, 0.4, 0], { color: '#f2f0ea', round: 0.15 })
      .box([0.7, 1.2, 0.12], [0.75, 0.6, -0.1], { color: '#ecebe6', round: 0.1, rot: [0, 0, -8] });
    const v = (a: V, c: V) => b.rod(a, c, 0.012, '#9da3a8', { noInk: true });
    v([-0.45, 0.7, 0.355], [-0.1, 0.4, 0.355]);
    v([-0.1, 0.4, 0.355], [0.2, 0.45, 0.355]);
    v([0.2, 0.45, 0.355], [0.45, 0.1, 0.355]);
    v([-0.3, 0.1, 0.355], [0.0, 0.25, 0.355]);
    v([0.6, 1.0, -0.035], [0.8, 0.6, -0.035]);
    return b.done();
  }),
  e('marble cake', 'food', 'cakes', () => {
    const b = m('marble cake');
    b.box([0.22, 0.08, 0.1], [0, 0.04, 0], { color: '#f2dca0', round: 0.2 })
      .box([0.22, 0.02, 0.1], [0, 0.085, 0], { color: 'crust', round: 0.5 })
      .ball([0.05, 0.03, 0.01], [-0.06, 0.05, 0.05], { color: 'chocolate', noInk: true, rot: [0, 0, 20] })
      .ball([0.06, 0.025, 0.01], [0.03, 0.03, 0.05], { color: 'chocolate', noInk: true, rot: [0, 0, -15] })
      .ball([0.04, 0.02, 0.01], [0.07, 0.06, 0.05], { color: 'chocolate', noInk: true })
      .box([0.02, 0.08, 0.09], [0.15, 0.04, 0.03], { color: '#f2dca0', rot: [0, 20, 0] })
      .ball([0.012, 0.04, 0.05], [0.16, 0.04, 0.035], { color: 'chocolate', noInk: true, rot: [0, 20, 0] });
    return b.done();
  }),
  e('marker (writing)', 'study', 'stationery', () =>
    m('marker (writing)')
      .cyl([0.02, 0.11, 0.02], [0, 0.055, 0], { color: 'white' })
      .cyl([0.021, 0.04, 0.021], [0, 0.05, 0], { color: 'red', noInk: true })
      .cyl([0.016, 0.01, 0.016], [0, 0.115, 0], { color: 'darkgray', taper: 0.7 })
      .cone([0.01, 0.018, 0.01], [0, 0.128, 0], { color: 'red' })
      .cyl([0.023, 0.045, 0.023], [0.035, 0.0225, 0], { color: 'red' })
      .box([0.004, 0.03, 0.006], [0.047, 0.03, 0], { color: 'red' })
      .done(),
  ),
  e('market', 'places', 'shops', () => {
    const b = m('market');
    b.pair((s) => {
      const x = s * 1.3, c = s > 0 ? 'red' : 'green';
      b.box([2.2, 0.9, 1.0], [x, 0.45, 0], { color: 'wood' })
        .stick([x - 1.0, 0, -0.45], [x - 1.0, 2.3, -0.45], 0.08, 'darkwood')
        .stick([x + 1.0, 0, -0.45], [x + 1.0, 2.3, -0.45], 0.08, 'darkwood')
        .box([2.4, 0.08, 1.4], [x, 2.3, 0.1], { color: c, rot: [14, 0, 0] })
        .each(3, (i) => b.box([0.3, 0.085, 1.4], [x - 0.8 + i * 0.8, 2.3, 0.1], { color: 'white', rot: [14, 0, 0], noInk: true }))
        .each(3, (i) => b.box([0.6, 0.2, 0.5], [x - 0.7 + i * 0.7, 1.0, 0.1], { color: 'lightwood' }).ball([0.5, 0.18, 0.4], [x - 0.7 + i * 0.7, 1.15, 0.1], { color: [['red', 'orange', 'yellow'], ['green', 'purple', 'tomato']][s > 0 ? 0 : 1][i] }));
    })
      .box([1.8, 0.5, 0.08], [0, 2.75, -0.45], { color: 'yellow' })
      .label('MARKET', [1.7, 0.4], [0, 2.75, -0.4], { color: 'yellow' });
    return b.done();
  }),
  e('marmalade', 'food', 'spreads', () =>
    jar('marmalade', 0.11, 0.085, '#f08a2a', 'red', 'white')
      .ball([0.1, 0.03, 0.1], [0, 0.11, 0], { color: 'red', parent: 'lid' })
      .torus([0.09, 0.09, 0.008], [0, 0.098, 0], { color: 'white', rot: [90, 0, 0], tube: 0.1, parent: 'lid' })
      .cyl([0.04, 0.008, 0.04], [0, 0.046, 0.045], { color: 'orange', rot: [90, 0, 0] })
      .done(),
  ),
  e('marshmallow', 'food', 'sweets', () =>
    m('marshmallow')
      .cyl([0.04, 0.035, 0.04], [-0.03, 0.0175, 0], { color: 'white', round: 0.5 })
      .cyl([0.04, 0.035, 0.04], [0.02, 0.0175, 0.02], { color: 'pink' })
      .cyl([0.04, 0.035, 0.04], [-0.005, 0.0525, 0.005], { color: 'white' })
      .stick([0.06, 0.0, -0.03], [0.09, 0.12, -0.03], 0.006, 'wood')
      .cyl([0.04, 0.035, 0.04], [0.095, 0.125, -0.03], { color: '#d9a35f', rot: [0, 0, -14] })
      .done(),
  ),
  e('mascara', 'wardrobe', 'makeup', () =>
    m('mascara')
      .cyl([0.018, 0.07, 0.018], [-0.015, 0.035, 0], { color: 'pink' })
      .cyl([0.0185, 0.012, 0.0185], [-0.015, 0.02, 0], { color: 'black', noInk: true })
      .cyl([0.016, 0.045, 0.016], [0.02, 0.0225, 0], { color: 'black' })
      .stick([0.02, 0.045, 0], [0.02, 0.085, 0], 0.004, 'silver')
      .capsule([0.012, 0.03, 0.012], [0.02, 0.1, 0], { color: '#1a1716' })
      .done(),
  ),
  e('mascot outfit', 'wardrobe', 'costumes', () => {
    const b = m('mascot outfit'), f = '#a0682a';
    b.ball([0.7, 0.8, 0.55], [0, 0.85, 0], { color: f })
      .ball([0.72, 0.45, 0.57], [0, 0.95, 0], { color: 'blue' })
      .label('1', [0.2, 0.2], [0, 0.95, 0.29], { color: 'white' })
      .ball([0.6, 0.55, 0.55], [0, 1.47, 0], { color: f })
      .ball([0.25, 0.17, 0.15], [0, 1.39, 0.25], { color: 'tan' })
      .ball([0.08, 0.05, 0.04], [0, 1.44, 0.32], { color: 'black' })
      .pair((s) => {
        b.ball(0.18, [s * 0.25, 1.72, 0], { color: f })
          .ball(0.1, [s * 0.25, 1.72, 0.06], { color: 'tan' })
          .ball([0.12, 0.13, 0.06], [s * 0.12, 1.54, 0.24], { color: 'white' })
          .ball(0.05, [s * 0.12, 1.54, 0.275], { color: 'black', eye: true })
          .rod([s * 0.32, 1.05, 0], [s * 0.48, 0.65, 0.05], 0.18, f)
          .capsule([0.22, 0.4, 0.22], [s * 0.17, 0.22, 0], { color: f })
          .ball([0.22, 0.12, 0.3], [s * 0.17, 0.06, 0.06], { color: 'tan' });
      });
    return b.done();
  }),
  e('mashed potato', 'food', 'meals', () =>
    m('mashed potato')
      .cyl([0.22, 0.015, 0.22], [0, 0.0075, 0], { color: 'white' })
      .ball([0.15, 0.08, 0.14], [0, 0.045, 0], { color: '#f3e6b8' })
      .ball([0.08, 0.05, 0.08], [0.03, 0.08, -0.01], { color: '#f3e6b8' })
      .ball([0.06, 0.04, 0.06], [-0.04, 0.07, 0.02], { color: '#f3e6b8' })
      .box([0.035, 0.015, 0.035], [0.0, 0.103, 0.01], { color: 'yellow', rot: [0, 30, 10] })
      .ball(0.01, [0.04, 0.07, 0.06], { color: 'green', noInk: true })
      .done(),
  ),
  e('mask (party)', 'toys', 'party', () => {
    const b = m('mask (party)');
    return b.pair((s) => b.ball([0.1, 0.065, 0.025], [s * 0.048, 0.22, 0], { color: 'purple', rot: [0, 0, s * 12] }).ball([0.045, 0.028, 0.01], [s * 0.05, 0.222, 0.012], { color: '#1a1716', noInk: true }))
      .ball([0.04, 0.03, 0.03], [0, 0.21, 0.005], { color: 'purple' })
      .torus([0.2, 0.08, 0.01], [0, 0.22, 0.006], { color: 'gold', tube: 0.08 })
      .capsule([0.03, 0.14, 0.01], [-0.11, 0.3, -0.01], { color: 'magenta', rot: [0, 0, 30] })
      .capsule([0.03, 0.12, 0.01], [-0.08, 0.31, -0.012], { color: 'teal', rot: [0, 0, 15] })
      .rod([0.1, 0.2, 0], [0.13, 0.0, 0], 0.014, 'gold')
      .done();
  }),
  e('mason jar', 'kitchen', 'storage', () => {
    const b = jar('mason jar', 0.15, 0.09, '#c8e0a0', 'silver');
    b.torus([0.094, 0.094, 0.012], [0, 0.128, 0], { color: 'glass', rot: [90, 0, 0], tube: 0.1 })
      .each(3, (i) => b.capsule([0.022, 0.09, 0.012], [-0.025 + i * 0.025, 0.065, 0.042], { color: '#5a8a3a', rot: [0, 0, (i - 1) * 8], noInk: true }))
      .ball([0.012, 0.05, 0.005], [0.032, 0.075, 0.042], { color: 'white', noInk: true });
    return b.done();
  }),
  e('massage parlor', 'places', 'shops', () => {
    const b = bld('massage parlor', { w: 4, h: 3, d: 2.6, wall: '#bfe0d8', roof: 'teal', sign: 'MASSAGE', signCol: 'white' });
    b.ball([0.5, 0.18, 0.4], [1.4, 0.09, 1.6], { color: 'stone' })
      .ball([0.4, 0.15, 0.32], [1.4, 0.25, 1.6], { color: 'gray' })
      .ball([0.28, 0.12, 0.24], [1.4, 0.38, 1.6], { color: 'stone' })
      .box([0.5, 0.5, 0.5], [-1.4, 0.25, 1.6], { color: 'darkwood' })
      .each(3, (i) => b.stick([-1.5 + i * 0.1, 0.5, 1.6], [-1.5 + i * 0.1, 1.4 - i * 0.15, 1.6], 0.05, 'lime'));
    return b.done();
  }),
  e('mast', 'places', 'street', () =>
    m('mast')
      .cyl([0.09, 0.03, 0.09], [0, 0.015, 0], { color: 'darkgray' })
      .stick([0, 0.03, 0], [0, 0.3, 0], 0.008, 'silver')
      .ball(0.014, [0, 0.305, 0], { color: 'gold' })
      .box([0.1, 0.065, 0.004], [0.052, 0.26, 0], { color: 'red' })
      .box([0.1, 0.02, 0.005], [0.052, 0.26, 0], { color: 'white', noInk: true })
      .done(),
  ),
  e('matchbook', 'home', 'household', () => {
    const b = m('matchbook');
    b.box([0.045, 0.05, 0.006], [0, 0.025, 0], { color: 'red' })
      .box([0.045, 0.012, 0.012], [0, 0.006, 0.006], { color: '#7a5a3a' })
      .each(5, (i) => b.box([0.006, 0.04, 0.002], [-0.016 + i * 0.008, 0.03, 0.005], { color: 'cream' }).ball([0.008, 0.008, 0.005], [-0.016 + i * 0.008, 0.052, 0.005], { color: 'darkred' }))
      .box([0.045, 0.05, 0.004], [0, 0.065, -0.03], { color: 'red', rot: [-55, 0, 0] })
      .box([0.03, 0.012, 0.005], [0, 0.07, -0.028], { color: 'white', rot: [-55, 0, 0], noInk: true });
    return b.done();
  }),
  e('matchbox', 'home', 'household', () => {
    const b = m('matchbox');
    b.box([0.06, 0.02, 0.04], [0, 0.01, 0], { color: 'yellow', round: 0.1 })
      .box([0.04, 0.021, 0.025], [0, 0.01, 0], { color: 'red', noInk: true })
      .box([0.056, 0.016, 0.038], [0.035, 0.009, 0], { color: 'lightwood', round: 0.05 })
      .each(4, (i) => b.box([0.05, 0.004, 0.004], [0.035, 0.019, -0.012 + i * 0.008], { color: 'cream' }).ball(0.007, [0.062, 0.019, -0.012 + i * 0.008], { color: 'red' }))
      .box([0.003, 0.018, 0.034], [-0.0305, 0.01, 0], { color: '#5a3a22', noInk: true })
      .stick([-0.05, 0, 0.03], [-0.05, 0.05, 0.03], 0.005, 'cream')
      .ball(0.009, [-0.05, 0.053, 0.03], { color: 'darkbrown' })
      .cone([0.012, 0.03, 0.012], [-0.05, 0.072, 0.03], { color: 'flame', glow: true });
    return b.done();
  }),
  e('mattress', 'home', 'bedroom', () => {
    const b = m('mattress');
    b.box([1.4, 0.25, 1.9], [0, 0.125, 0], { color: 'white', round: 0.4 })
      .box([1.41, 0.08, 1.91], [0, 0.125, 0], { color: '#8fb8e0', round: 0.4, noInk: true });
    for (const x of [-0.45, 0, 0.45]) for (const z of [-0.6, 0, 0.6]) b.ball([0.06, 0.02, 0.06], [x, 0.248, z], { color: '#d4d7da', noInk: true });
    return b.done();
  }),
  e('mayan pyramid', 'places', 'landmarks', () => {
    const b = m('mayan pyramid');
    b.each(5, (i) => b.box([8 - i * 1.4, 1.0, 8 - i * 1.4], [0, 0.5 + i, 0], { color: i % 2 ? '#c8bc9a' : '#b8ac8a', round: 0.05 }))
      .box([1.6, 5.73, 0.4], [0, 2.5, 2.55], { color: '#a89c7a', rot: [-29.2, 0, 0] })
      .pair((s) => b.box([0.25, 5.8, 0.5], [s * 0.92, 2.55, 2.55], { color: '#988c6a', rot: [-29.2, 0, 0] }))
      .box([2.4, 1.6, 2.4], [0, 5.8, 0], { color: '#d8ccaa' })
      .box([1.6, 0.6, 1.6], [0, 6.9, 0], { color: '#b8ac8a' })
      .box([0.7, 1.0, 0.1], [0, 5.5, 1.2], { color: '#2a2422' });
    return b.done();
  }),
  e('mayonnaise', 'food', 'sauces', () =>
    jar('mayonnaise', 0.13, 0.1, 'cream', 'blue', 'white')
      .box([0.05, 0.025, 0.02], [0, 0.06, 0.048], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('maze', 'garden', 'garden features', () => {
    const b = m('maze'), h = (w: number, dd: number, x: number, z: number) => b.box([w, 1.2, dd], [x, 0.7, z], { color: 'darkgreen', round: 0.3 });
    b.box([4.2, 0.1, 4.2], [0, 0.05, 0], { color: 'grass' });
    h(4, 0.3, 0, -1.85);
    h(0.3, 4, -1.85, 0);
    h(0.3, 4, 1.85, 0);
    h(1.6, 0.3, -1.2, 1.85);
    h(1.6, 0.3, 1.2, 1.85);
    h(2.4, 0.3, -0.4, 0.8);
    h(2.0, 0.3, 0.4, -0.8);
    h(0.3, 1.2, -0.8, -0.2);
    h(0.3, 1.0, 0.8, 0.3);
    return b.star(0.5, [0, 0.5, 0], { color: 'gold' }).done();
  }),
  e('measuring cup', 'kitchen', 'baking', () => {
    const b = m('measuring cup');
    b.cyl([0.11, 0.13, 0.11], [0, 0.065, 0], { color: 'glass', taper: 1.1 })
      .cyl([0.105, 0.07, 0.105], [0, 0.035, 0], { color: 'milk', taper: 1.05 })
      .torus([0.08, 0.1, 0.02], [-0.07, 0.07, 0], { color: 'glass', rot: [0, 90, 0], tube: 0.2 })
      .cone([0.04, 0.04, 0.03], [0.065, 0.12, 0], { color: 'glass', rot: [0, 0, -70] })
      .each(4, (i) => b.box([0.025 + (i % 2) * 0.015, 0.004, 0.004], [-0.01, 0.03 + i * 0.022, 0.058], { color: 'red', noInk: true }));
    return b.done();
  }),
  e('meat grinder', 'kitchen', 'appliances', () =>
    m('meat grinder')
      .box([0.14, 0.03, 0.1], [0, 0.015, 0], { color: 'iron' })
      .box([0.05, 0.13, 0.06], [0, 0.1, 0], { color: 'iron' })
      .cyl([0.1, 0.2, 0.1], [0, 0.2, 0], { color: 'silver', rot: [0, 0, 90] })
      .cyl([0.08, 0.1, 0.08], [0, 0.29, 0], { color: 'silver', taper: 1.6 })
      .cyl([0.11, 0.02, 0.11], [-0.11, 0.2, 0], { color: 'steel', rot: [0, 0, 90] })
      .rod([-0.12, 0.19, 0.015], [-0.16, 0.06, 0.015], 0.016, '#e8909a')
      .rod([-0.12, 0.21, -0.02], [-0.18, 0.06, -0.02], 0.016, '#e8909a')
      .stick([0.1, 0.2, 0], [0.13, 0.2, 0], 0.02, 'steel')
      .rod([0.13, 0.2, 0], [0.13, 0.33, 0], 0.022, 'steel', { name: 'crank', pivot: [0.13, 0.2, 0] })
      .capsule([0.03, 0.06, 0.03], [0.16, 0.33, 0], { color: 'wood', rot: [0, 0, 90], parent: 'crank' })
      .cyl([0.1, 0.04, 0.1], [-0.17, 0.02, 0], { color: 'white', taper: 1.3 })
      .ball([0.08, 0.04, 0.08], [-0.17, 0.045, 0], { color: '#e8909a' })
      .done(),
  ),
  e('meat locker', 'places', 'rooms', () => {
    const b = room('meat locker', 3, 2.4, 2.2, '#9da3a8', '#dfeff5');
    b.stick([-1.4, 2.0, -0.4], [1.4, 2.0, -0.4], 0.06, 'steel')
      .each(3, (i) => {
        const x = -0.8 + i * 0.8;
        b.rod([x, 2.0, -0.4], [x, 1.65, -0.4], 0.03, 'silver')
          .ball([0.38, 0.75, 0.32], [x, 1.2, -0.4], { color: i === 1 ? '#c8643a' : 'meat' })
          .ball([0.08, 0.5, 0.05], [x + 0.06, 1.2, -0.25], { color: 'cream', noInk: true })
          .capsule([0.07, 0.2, 0.07], [x, 1.62, -0.4], { color: 'white' });
      })
      .box([0.6, 0.4, 0.5], [1.0, 0.3, 0.6], { color: 'tan' })
      .box([0.5, 0.35, 0.5], [1.0, 0.68, 0.6], { color: 'tan' })
      .ball([0.5, 0.12, 0.3], [-1.0, 2.15, -1.05], { color: 'ice' })
      .box([0.6, 0.3, 0.05], [0.6, 1.9, -1.12], { color: 'skyblue' })
      .label('-18 C', [0.5, 0.22], [0.6, 1.9, -1.08], { color: 'skyblue' });
    return b.done();
  }),
  e('meat thermometer', 'kitchen', 'utensils', () =>
    m('meat thermometer')
      .ball([0.14, 0.07, 0.1], [0, 0.035, 0], { color: '#8a4a2a' })
      .ball([0.1, 0.03, 0.06], [0.01, 0.06, 0.01], { color: '#a05a32', noInk: true })
      .stick([0, 0.04, 0], [0, 0.13, 0], 0.005, 'silver')
      .cyl([0.055, 0.018, 0.055], [0, 0.155, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.045, 0.004, 0.045], [0, 0.155, 0.009], { color: 'white', rot: [90, 0, 0] })
      .rod([0, 0.155, 0.012], [0.012, 0.168, 0.012], 0.004, 'red', { noInk: true })
      .done(),
  ),
  e('meatball', 'food', 'meals', () =>
    m('meatball')
      .cyl([0.2, 0.012, 0.2], [0, 0.006, 0], { color: 'white' })
      .ball([0.15, 0.015, 0.15], [0, 0.016, 0], { color: 'tomato' })
      .ball(0.05, [-0.03, 0.04, 0.02], { color: '#7a4a2a' })
      .ball(0.05, [0.03, 0.04, 0.01], { color: '#7a4a2a' })
      .ball(0.05, [0.0, 0.04, -0.035], { color: '#6b3e26' })
      .ball(0.008, [0.03, 0.066, 0.02], { color: 'green', noInk: true })
      .ball(0.008, [-0.03, 0.066, 0.025], { color: 'green', noInk: true })
      .done(),
  ),
  e('medal', 'sports', 'awards', () =>
    m('medal')
      .cyl([0.05, 0.008, 0.05], [0, 0.025, 0], { color: 'gold', rot: [90, 0, 0] })
      .torus([0.05, 0.05, 0.01], [0, 0.025, 0], { color: '#c8962a', tube: 0.12 })
      .star(0.03, [0, 0.025, 0.005], { color: '#f6d24a' })
      .box([0.02, 0.055, 0.004], [-0.014, 0.072, 0], { color: 'red', rot: [0, 0, -20] })
      .box([0.02, 0.055, 0.004], [0.014, 0.072, 0.001], { color: 'blue', rot: [0, 0, 20] })
      .done(),
  ),
  e('medicine', 'clinic', 'medicine', () =>
    m('medicine')
      .cyl([0.045, 0.07, 0.045], [0, 0.035, 0], { color: '#e8902a' })
      .cyl([0.047, 0.035, 0.047], [0, 0.035, 0], { color: 'white', noInk: true })
      .cyl([0.05, 0.02, 0.05], [0, 0.08, 0], { color: 'white' })
      .capsule([0.014, 0.032, 0.014], [0.045, 0.007, 0.02], { color: 'red', rot: [0, 30, 90] })
      .capsule([0.0142, 0.016, 0.0142], [0.04, 0.007, 0.023], { color: 'white', rot: [0, 30, 90] })
      .cyl([0.016, 0.006, 0.016], [-0.04, 0.003, 0.025], { color: 'white' })
      .done(),
  ),
  e('medicine ball', 'sports', 'gym', () =>
    m('medicine ball')
      .ball(0.3, [0, 0.15, 0], { color: '#3a3633' })
      .torus([0.31, 0.31, 0.03], [0, 0.15, 0], { color: 'red', rot: [0, 90, 0], tube: 0.05 })
      .torus([0.31, 0.31, 0.03], [0, 0.15, 0], { color: 'red', rot: [90, 0, 0], tube: 0.05 })
      .box([0.08, 0.04, 0.02], [0, 0.17, 0.148], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('megaphone', 'tech', 'gadgets', () =>
    m('megaphone')
      .cyl([0.24, 0.3, 0.24], [0.03, 0.22, 0], { color: 'white', taper: 0.3, rot: [0, 0, 90] })
      .cyl([0.245, 0.04, 0.245], [0.16, 0.22, 0], { color: 'red', rot: [0, 0, 90] })
      .cyl([0.06, 0.06, 0.06], [-0.14, 0.22, 0], { color: 'black', rot: [0, 0, 90] })
      .box([0.045, 0.16, 0.05], [-0.06, 0.08, 0], { color: 'black', round: 0.4 })
      .box([0.015, 0.04, 0.03], [-0.03, 0.12, 0], { color: 'red' })
      .done(),
  ),
  e('melon', 'food', 'fruit', () => {
    const b = m('melon');
    b.ball([0.3, 0.22, 0.22], [-0.05, 0.11, -0.03], { color: '#3f8a3a' });
    for (const a of [0, 45, 90, 135]) b.ball([0.302, 0.226, 0.035], [-0.05, 0.11, -0.03], { color: '#2a5a26', noInk: true, rot: [a, 0, 0] });
    return b.wedge([0.16, 0.1, 0.035], [0.17, 0.065, 0.1], { color: 'red', rot: [0, -20, 0] })
      .box([0.17, 0.02, 0.04], [0.17, 0.01, 0.1], { color: '#5aa553', rot: [0, -20, 0] })
      .each(3, (i) => b.ball([0.01, 0.014, 0.006], [0.164 + (i - 1) * 0.028, 0.06 + (i % 2) * 0.015, 0.12 + (i - 1) * 0.01], { color: 'black', noInk: true }))
      .done();
  }),
  e('menorah', 'toys', 'holiday', () => {
    const b = m('menorah');
    b.cyl([0.12, 0.025, 0.12], [0, 0.0125, 0], { color: 'gold', taper: 0.7 })
      .stick([0, 0.02, 0], [0, 0.23, 0], 0.02, 'gold')
      .box([0.34, 0.02, 0.02], [0, 0.18, 0], { color: 'gold' })
      .each(9, (i) => {
        const x = -0.16 + i * 0.04, y = i === 4 ? 0.24 : 0.19;
        b.cyl([0.022, 0.015, 0.022], [x, y, 0], { color: 'gold' })
          .cyl([0.01, 0.05, 0.01], [x, y + 0.032, 0], { color: i === 4 ? 'white' : ['blue', 'white'][i % 2] })
          .ball([0.012, 0.02, 0.012], [x, y + 0.067, 0], { color: 'flame', glow: true });
      });
    return b.done();
  }),
  e('menu', 'food', 'restaurant', () => {
    const b = m('menu'), c = Math.cos(rad(25)), sn = Math.sin(rad(25));
    b.pair((s) => {
      b.box([0.15, 0.3, 0.022], [s * 0.075 * c, 0.15, 0.075 * sn], { color: 'maroon', rot: [0, -s * 25, 0] })
        .box([0.13, 0.27, 0.01], [s * 0.075 * c - s * 0.012 * sn, 0.15, 0.075 * sn + 0.012 * c], { color: 'cream', rot: [0, -s * 25, 0] })
        .each(4, (i) => b.box([0.09, 0.008, 0.012], [s * 0.075 * c - s * 0.014 * sn, 0.18 - i * 0.04, 0.075 * sn + 0.014 * c], { color: 'darkgray', rot: [0, -s * 25, 0], noInk: true }));
    })
      .label('MENU', [0.1, 0.04], [-0.075 * c + 0.02 * sn, 0.25, 0.075 * sn + 0.02 * c], { color: 'cream', rot: [0, 25, 0] });
    return b.done();
  }),
  e('mercury (material)', 'nature', 'elements', () =>
    m('mercury (material)')
      .cyl([0.2, 0.02, 0.2], [0, 0.01, 0], { color: 'glass', taper: 1.1 })
      .ball([0.08, 0.035, 0.07], [-0.02, 0.035, 0], { color: '#d8dde2' })
      .ball([0.04, 0.025, 0.04], [0.05, 0.03, 0.03], { color: '#d8dde2' })
      .ball([0.025, 0.018, 0.025], [0.04, 0.028, -0.04], { color: '#d8dde2' })
      .ball(0.014, [-0.03, 0.048, 0.015], { color: 'white', noInk: true })
      .label('Hg', [0.08, 0.05], [0, 0.07, -0.08], { color: 'white' })
      .done(),
  ),
  e('merry go round', 'places', 'fairground', () => {
    const b = m('merry go round');
    b.cyl([4.2, 0.3, 4.2], [0, 0.15, 0], { color: 'gold' })
      .cyl([3.8, 0.15, 3.8], [0, 0.37, 0], { color: 'red', name: 'rotor', pivot: [0, 0.3, 0] })
      .cyl([0.6, 3.0, 0.6], [0, 1.9, 0], { color: 'gold', parent: 'rotor' })
      .cyl([4.3, 0.35, 4.3], [0, 3.35, 0], { color: 'white', parent: 'rotor' })
      .cone([4.6, 1.3, 4.6], [0, 4.15, 0], { color: 'red', segs: 12, parent: 'rotor' })
      .stick([0, 4.7, 0], [0, 5.2, 0], 0.06, 'gold', { parent: 'rotor' })
      .box([0.4, 0.25, 0.03], [0.2, 5.05, 0], { color: 'blue', parent: 'rotor' });
    const cols = ['white', 'brown', '#3a3633', 'gray'];
    around(4, 1.4, Math.PI / 4).forEach(([x, z], i) => {
      const a = Math.atan2(z, x), tx = -Math.sin(a), tz = Math.cos(a), y = 1.3 + (i % 2) * 0.3;
      b.stick([x, 0.45, z], [x, 3.2, z], 0.06, 'gold', { parent: 'rotor' })
        .ball([0.28, 0.32, 0.75], [x, y, z], { color: cols[i], rot: [0, (-a * 180) / Math.PI, 0], parent: 'rotor' })
        .rod([x + tx * 0.28, y + 0.1, z + tz * 0.28], [x + tx * 0.4, y + 0.4, z + tz * 0.4], 0.16, cols[i], { parent: 'rotor' })
        .ball([0.16, 0.16, 0.3], [x + tx * 0.48, y + 0.45, z + tz * 0.48], { color: cols[i], rot: [0, (-a * 180) / Math.PI, 0], parent: 'rotor' })
        .rod([x - tx * 0.2, y - 0.1, z - tz * 0.2], [x - tx * 0.2, y - 0.55, z - tz * 0.2], 0.07, cols[i], { parent: 'rotor' })
        .rod([x + tx * 0.2, y - 0.1, z + tz * 0.2], [x + tx * 0.3, y - 0.5, z + tz * 0.3], 0.07, cols[i], { parent: 'rotor' });
    });
    return b.done();
  }),
  e('mesa', 'nature', 'landforms', () =>
    m('mesa')
      .cyl([8, 0.8, 6], [0, 0.4, 0], { color: '#d9a070', taper: 0.75 })
      .cyl([6, 2.4, 4.4], [0, 2.0, 0], { color: '#c8643a', taper: 0.9 })
      .cyl([5.85, 0.3, 4.3], [0, 1.6, 0], { color: '#a84a2a', taper: 0.98, noInk: true })
      .cyl([5.6, 0.25, 4.1], [0, 2.5, 0], { color: '#e08a5a', taper: 0.98, noInk: true })
      .cyl([5.4, 0.15, 3.96], [0, 3.27, 0], { color: '#b85a30' })
      .capsule([0.3, 1.2, 0.3], [3.2, 0.6, 2.4], { color: 'green' })
      .capsule([0.18, 0.5, 0.18], [3.45, 0.75, 2.4], { color: 'green' })
      .done(),
  ),
  e('messenger bag', 'wardrobe', 'bags', () => {
    const b = m('messenger bag'), c = '#6b6b3a';
    b.box([0.36, 0.28, 0.12], [0, 0.14, 0], { color: c, round: 0.3 })
      .box([0.37, 0.2, 0.02], [0, 0.18, 0.065], { color: '#55552e', round: 0.3 })
      .pair((s) => b.box([0.03, 0.08, 0.025], [s * 0.1, 0.12, 0.08], { color: 'black' }).box([0.035, 0.025, 0.03], [s * 0.1, 0.085, 0.08], { color: 'silver' }))
      .rod([-0.17, 0.26, 0], [-0.1, 0.55, 0], 0.04, 'black')
      .rod([-0.1, 0.55, 0], [0.1, 0.55, 0], 0.04, 'black')
      .rod([0.1, 0.55, 0], [0.17, 0.26, 0], 0.04, 'black');
    return b.done();
  }),
  e('metal detector', 'tech', 'gadgets', () =>
    m('metal detector')
      .cyl([0.3, 0.035, 0.22], [-0.4, 0.02, 0], { color: 'black' })
      .torus([0.26, 0.18, 0.04], [-0.4, 0.03, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.12 })
      .rod([-0.4, 0.04, 0], [-0.3, 0.12, 0], 0.03, 'darkgray')
      .stick([-0.3, 0.12, 0], [0.25, 0.9, 0], 0.03, 'silver')
      .box([0.14, 0.09, 0.07], [0.08, 0.7, 0.03], { color: 'darkgray', rot: [0, 0, -35] })
      .box([0.07, 0.04, 0.01], [0.08, 0.72, 0.068], { color: 'lime', rot: [0, 0, -35], glow: true })
      .capsule([0.04, 0.14, 0.04], [0.15, 0.82, 0.0], { color: 'black', rot: [0, 0, -35] })
      .torus([0.1, 0.08, 0.06], [0.27, 0.95, 0], { color: 'black', rot: [0, 90, 55] })
      .done(),
  ),
  e('microphone', 'music', 'audio', () =>
    m('microphone')
      .cyl([0.03, 0.14, 0.03], [0, 0.07, 0], { color: 'black', taper: 1.4 })
      .cyl([0.044, 0.012, 0.044], [0, 0.144, 0], { color: 'silver' })
      .ball(0.06, [0, 0.175, 0], { color: '#9da3a8' })
      .torus([0.061, 0.061, 0.008], [0, 0.175, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.08 })
      .box([0.012, 0.02, 0.006], [0, 0.1, 0.017], { color: 'silver' })
      .done(),
  ),
  e('microphone stand', 'music', 'audio', () => {
    const b = m('microphone stand');
    around(3, 0.35, Math.PI / 2).forEach(([x, z]) => b.rod([0, 0.15, 0], [x, 0.01, z], 0.03, 'black'));
    return b.stick([0, 0.1, 0], [0, 0.65, 0], 0.04, 'black')
      .cyl([0.06, 0.04, 0.06], [0, 0.65, 0], { color: 'darkgray' })
      .stick([0, 0.65, 0], [0, 1.1, 0], 0.025, 'black')
      .ball(0.06, [0, 1.1, 0], { color: 'darkgray' })
      .stick([-0.25, 0.98, 0], [0.38, 1.33, 0], 0.025, 'black')
      .ball(0.15, [-0.3, 0.95, 0], { color: 'black' })
      .capsule([0.04, 0.15, 0.04], [0.44, 1.38, 0], { color: 'black', rot: [0, 0, -60] })
      .ball(0.075, [0.52, 1.43, 0], { color: '#9da3a8' })
      .done();
  }),
  e('microscope', 'study', 'science', () => {
    const b = m('microscope');
    b.box([0.18, 0.04, 0.22], [0, 0.02, 0], { color: 'white', round: 0.4 })
      .box([0.06, 0.1, 0.06], [0, 0.08, -0.08], { color: 'white' })
      .rod([0, 0.12, -0.08], [0, 0.24, -0.07], 0.055, 'white')
      .rod([0, 0.24, -0.07], [0, 0.29, -0.02], 0.05, 'white')
      .box([0.14, 0.015, 0.12], [0, 0.16, 0.02], { color: 'black' })
      .box([0.07, 0.004, 0.025], [0, 0.17, 0.02], { color: 'glass' })
      .cyl([0.04, 0.012, 0.04], [0, 0.04, 0.02], { color: 'yellow', glow: true })
      .stick([0, 0.24, 0.0], [0, 0.37, -0.07], 0.04, 'white')
      .cyl([0.035, 0.04, 0.035], [0, 0.38, -0.08], { color: 'black', rot: [-28, 0, 0] })
      .cyl([0.06, 0.02, 0.06], [0, 0.235, 0.02], { color: 'black' })
      .stick([-0.012, 0.23, 0.025], [-0.012, 0.19, 0.025], 0.014, 'silver')
      .stick([0.014, 0.23, 0.015], [0.016, 0.2, 0.015], 0.012, 'silver')
      .pair((s) => b.cyl([0.05, 0.015, 0.05], [s * 0.04, 0.14, -0.08], { color: 'darkgray', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('microwave', 'kitchen', 'appliances', () =>
    m('microwave')
      .box([0.5, 0.3, 0.38], [0, 0.15, 0], { color: 'silver', round: 0.1 })
      .box([0.34, 0.26, 0.02], [-0.07, 0.15, 0.195], { color: 'darkgray', name: 'door', pivot: [-0.24, 0.15, 0.195] })
      .box([0.26, 0.18, 0.01], [-0.08, 0.15, 0.207], { color: '#3a4550', parent: 'door' })
      .box([0.02, 0.2, 0.025], [0.08, 0.15, 0.21], { color: 'silver', parent: 'door' })
      .box([0.1, 0.26, 0.015], [0.18, 0.15, 0.195], { color: 'black' })
      .box([0.07, 0.03, 0.01], [0.18, 0.25, 0.205], { color: 'lime', glow: true })
      .box([0.06, 0.025, 0.01], [0.18, 0.19, 0.205], { color: 'gray' })
      .box([0.06, 0.025, 0.01], [0.18, 0.15, 0.205], { color: 'gray' })
      .cyl([0.045, 0.015, 0.045], [0.18, 0.09, 0.205], { color: 'gray', rot: [90, 0, 0] })
      .done(),
  ),
  e('milk', 'food', 'drinks', () => {
    const b = m('milk');
    b.box([0.075, 0.13, 0.075], [0, 0.065, 0], { color: 'white', round: 0.1 })
      .wedge([0.075, 0.035, 0.075], [0, 0.1475, 0], { color: 'white', rot: [0, 90, 0] })
      .box([0.012, 0.015, 0.06], [0, 0.17, 0], { color: 'white' })
      .box([0.077, 0.03, 0.077], [0, 0.1, 0], { color: 'blue', noInk: true })
      .ball([0.03, 0.025, 0.006], [-0.015, 0.05, 0.038], { color: 'black', noInk: true })
      .ball([0.02, 0.02, 0.006], [0.02, 0.03, 0.038], { color: 'black', noInk: true })
      .ball([0.006, 0.025, 0.02], [-0.038, 0.04, 0.01], { color: 'black', noInk: true })
      .cyl([0.015, 0.012, 0.015], [0.02, 0.135, 0.03], { color: 'red', rot: [-45, 0, 0] });
    return b.done();
  }),
  e('milk bottle', 'food', 'drinks', () => bottle('milk bottle', 0.2, 'milk', 'silver', { w: 0.075, neck: 0.62, band: 'blue' }).done()),
  e('milk crate', 'kitchen', 'storage', () => {
    const b = m('milk crate');
    b.box([0.33, 0.28, 0.33], [0, 0.14, 0], { color: 'blue', round: 0.1 });
    for (const x of [-0.09, 0, 0.09]) for (const y of [0.08, 0.2]) b.box([0.06, 0.07, 0.01], [x, y, 0.163], { color: 'navy', noInk: true }).box([0.01, 0.07, 0.06], [-0.163, y, x], { color: 'navy', noInk: true });
    for (const x of [-0.07, 0.07]) for (const z of [-0.07, 0.07]) b.cyl([0.06, 0.06, 0.06], [x, 0.3, z], { color: 'milk' }).cyl([0.045, 0.012, 0.045], [x, 0.335, z], { color: 'silver' });
    return b.done();
  }),
  e('milk jug', 'food', 'drinks', () =>
    m('milk jug')
      .box([0.15, 0.2, 0.15], [0, 0.1, 0], { color: 'milk', round: 0.4 })
      .cyl([0.06, 0.04, 0.06], [-0.035, 0.2, 0], { color: 'milk', taper: 0.7 })
      .cyl([0.04, 0.02, 0.04], [-0.035, 0.225, 0], { color: 'red' })
      .torus([0.07, 0.09, 0.03], [0.04, 0.19, 0], { color: 'milk', tube: 0.25, rot: [0, 90, 0] })
      .box([0.152, 0.07, 0.152], [0, 0.09, 0], { color: 'red', noInk: true, round: 0.4 })
      .done(),
  ),
  e('milkshake', 'food', 'drinks', () =>
    drink('milkshake', 0.15, 'pink', { top: 'white', straw: 'red' })
      .ball([0.06, 0.04, 0.06], [0, 0.185, 0], { color: 'white' })
      .ball(0.028, [0.005, 0.215, 0.005], { color: 'red' })
      .rod([0.005, 0.228, 0.005], [0.015, 0.25, 0], 0.004, 'darkgreen')
      .done(),
  ),
  e('mine (explosive)', 'armory', 'explosives', () =>
    m('mine (explosive)')
      .ball([0.32, 0.05, 0.28], [0, 0.02, 0], { color: 'dirt' })
      .cyl([0.22, 0.06, 0.22], [0, 0.05, 0], { color: '#5a6a3a' })
      .cyl([0.12, 0.025, 0.12], [0, 0.09, 0], { color: '#4a5a2a' })
      .cyl([0.03, 0.03, 0.03], [0, 0.115, 0], { color: 'iron' })
      .box([0.08, 0.015, 0.012], [0, 0.05, 0.11], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('mine (place)', 'places', 'landmarks', () => {
    const b = m('mine (place)');
    b.ball([6, 4, 3.6], [0, 0.6, -0.8], { color: 'rock' })
      .ball([1.6, 2.0, 0.4], [0, 1.0, 0.95], { color: '#1a1716' })
      .pair((s) => b.box([0.25, 2.2, 0.25], [s * 0.85, 1.1, 1.05], { color: 'darkwood' }).stick([s * 0.4, 0.02, 1.2], [s * 0.4, 0.02, 3.2], 0.06, 'steel'))
      .box([2.2, 0.3, 0.3], [0, 2.25, 1.05], { color: 'darkwood' })
      .box([1.4, 0.4, 0.06], [0, 2.7, 1.1], { color: 'tan' })
      .label('MINE', [1.3, 0.34], [0, 2.7, 1.15], { color: 'tan' })
      .each(5, (i) => b.box([1.1, 0.06, 0.15], [0, 0.03, 1.4 + i * 0.4], { color: 'darkwood' }))
      .box([0.9, 0.55, 0.7], [0, 0.55, 2.5], { color: 'iron', round: 0.2 })
      .ball([0.75, 0.25, 0.55], [0, 0.85, 2.5], { color: '#2a2726' })
      .ball(0.18, [0.15, 0.95, 2.5], { color: 'gold' })
      .pair((s) => b.cyl([0.3, 0.08, 0.3], [s * 0.4, 0.17, 2.5], { color: 'darkgray', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('mini fridge', 'kitchen', 'appliances', () =>
    m('mini fridge')
      .box([0.48, 0.85, 0.5], [0, 0.435, 0], { color: 'white', round: 0.1 })
      .box([0.46, 0.8, 0.04], [0, 0.44, 0.265], { color: 'white', round: 0.2, name: 'door', pivot: [-0.23, 0.44, 0.265] })
      .box([0.03, 0.25, 0.03], [0.19, 0.6, 0.3], { color: 'silver', parent: 'door' })
      .box([0.4, 0.008, 0.01], [0, 0.66, 0.287], { color: 'lightgray', parent: 'door', noInk: true })
      .box([0.1, 0.1, 0.01], [-0.1, 0.4, 0.288], { color: 'yellow', parent: 'door', rot: [0, 0, 8] })
      .box([0.4, 0.02, 0.4], [0, 0.01, 0], { color: 'darkgray' })
      .done(),
  ),
  e('mini skirt', 'wardrobe', 'skirts', () => {
    const b = m('mini skirt');
    b.cyl([0.46, 0.2, 0.32], [0, 0.1, 0], { color: 'red', taper: 0.66 })
      .cyl([0.31, 0.04, 0.22], [0, 0.215, 0], { color: 'darkred' })
      .ball(0.02, [0, 0.215, 0.112], { color: 'gold' })
      .cyl([0.4, 0.015, 0.28], [0, 0.06, 0], { color: 'navy', noInk: true })
      .cyl([0.34, 0.015, 0.24], [0, 0.15, 0], { color: 'navy', noInk: true });
    around(8, 0.19, Math.PI / 8).forEach(([x, z], i) => b.box([0.012, 0.19, 0.012], [x, 0.1, z * 0.7], { color: '#b8302a', noInk: true, rot: [(-z / 0.19) * 12, 0, (x / 0.19) * 12] }));
    return b.done();
  }),
  e('minivan', 'garage', 'cars', () => {
    const b = m('minivan', { view: 'side' }), c = '#7a9cc0';
    b.box([1.9, 1.0, 4.9], [0, 0.8, 0], { color: c, round: 0.4 })
      .box([1.85, 0.6, 3.7], [0, 1.5, -0.55], { color: c, round: 0.4 })
      .box([1.87, 0.4, 3.5], [0, 1.52, -0.55], { color: 'glass', round: 0.3 })
      .box([1.7, 0.75, 0.08], [0, 1.45, 1.55], { color: 'glass', rot: [-55, 0, 0] })
      .pair((s) => b.box([0.02, 0.8, 0.02], [s * 0.96, 1.0, 0.3], { color: '#4a6a90', noInk: true }).box([0.06, 0.04, 0.2], [s * 0.96, 0.95, 0.0], { color: 'silver' }))
      .box([1.6, 0.25, 0.06], [0, 0.6, 2.45], { color: 'darkgray' })
      .pair((s) => b.ball([0.3, 0.15, 0.06], [s * 0.65, 0.95, 2.43], { color: 'white', glow: true }).ball([0.2, 0.3, 0.06], [s * 0.8, 1.0, -2.43], { color: 'red', glow: true }));
    return wheels(b, 0.85, [1.6, -1.6], 0.66, 0.24).done();
  }),
  e('mint', 'garden', 'herbs', () => {
    const b = m('mint'), g = '#4fae4a';
    b.cyl([0.16, 0.13, 0.16], [0, 0.065, 0], { color: '#c8643a', taper: 1.25 })
      .cyl([0.17, 0.01, 0.17], [0, 0.125, 0], { color: 'dirt' });
    const stem = (x: number, top: number, n: number) => {
      b.stick([x * 0.4, 0.12, 0], [x, top, 0], 0.012, 'darkgreen');
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / (n + 0.5), px = x * 0.4 + (x - x * 0.4) * t, py = 0.12 + (top - 0.12) * t, sz = 0.075 - i * 0.008;
        if (i % 2 === 0) b.pair((s) => b.ball([sz, 0.014, sz * 0.6], [px + s * sz * 0.5, py, 0], { color: g, rot: [0, 0, s * 25] }));
        else b.pair((s) => b.ball([sz * 0.6, 0.014, sz], [px, py, s * sz * 0.5], { color: '#5fbe5a', rot: [-s * 25, 0, 0] }));
      }
      b.ball([0.03, 0.04, 0.03], [x, top + 0.01, 0], { color: '#6fce6a' });
    };
    stem(0, 0.42, 4);
    stem(0.1, 0.32, 2);
    stem(-0.1, 0.34, 2);
    return b.done();
  }),
  e('minus sign', 'ideas', 'symbols', () =>
    m('minus sign')
      .box([0.13, 0.02, 0.06], [0, 0.01, 0], { color: 'wood' })
      .box([0.1, 0.1, 0.02], [0, 0.07, 0], { color: 'white', round: 0.2 })
      .box([0.07, 0.018, 0.022], [0, 0.07, 0.003], { color: 'red', round: 0.4 })
      .done(),
  ),
  e('mirror', 'home', 'decor', () =>
    m('mirror')
      .box([0.75, 0.14, 0.4], [0, 0.07, 0], { color: 'darkwood', round: 0.3 })
      .box([0.07, 1.2, 0.07], [0.37, 0.7, 0], { color: 'darkwood' })
      .box([0.07, 1.2, 0.07], [-0.37, 0.7, 0], { color: 'darkwood' })
      .torus([0.66, 1.26, 0.06], [0, 0.85, 0], { color: 'gold', tube: 0.1 })
      .cyl([0.6, 0.02, 1.2], [0, 0.85, 0], { color: '#cfe8f5', rot: [90, 0, 0] })
      .rod([-0.15, 1.0, 0.012], [0.05, 1.25, 0.012], 0.03, 'white', { noInk: true })
      .rod([-0.1, 0.8, 0.012], [0.12, 1.08, 0.012], 0.02, 'white', { noInk: true })
      .done(),
  ),
  e('missile', 'armory', 'missiles', () => {
    const b = m('missile');
    b.cyl([0.5, 3.6, 0.5], [0, 2.3, 0], { color: 'white' })
      .cone([0.5, 1.0, 0.5], [0, 4.6, 0], { color: 'red' })
      .cyl([0.51, 0.3, 0.51], [0, 3.4, 0], { color: 'red', noInk: true })
      .cyl([0.36, 0.5, 0.36], [0, 0.35, 0], { color: 'darkgray', taper: 0.7 })
      .cone([0.25, 0.25, 0.25], [0, 0.1, 0], { color: 'flame', glow: true, rot: [180, 0, 0] })
      .label('USA', [0.3, 0.15], [0, 2.6, 0.26], { color: 'white' });
    around(4, 0.45, Math.PI / 4).forEach(([x, z], i) => b.wedge([0.5, 0.9, 0.05], [x, 0.95, z], { color: 'red', apex: -0.5, rot: [0, -45 - i * 90, 0] }));
    around(4, 0.33, Math.PI / 4).forEach(([x, z], i) => b.wedge([0.2, 0.35, 0.04], [x, 3.0, z], { color: 'gray', apex: -0.5, rot: [0, -45 - i * 90, 0] }));
    return b.done();
  }),
  e('mistletoe', 'toys', 'holiday', () => {
    const b = m('mistletoe'), g = '#8ab84a';
    const ends: V[] = [[-0.14, 0.12, 0], [0, 0.06, 0.02], [0.14, 0.12, 0]];
    for (const [x, y, z] of ends) {
      b.rod([0, 0.36, 0], [x, y + 0.08, z], 0.014, '#7a8a3a');
      b.ball([0.04, 0.14, 0.016], [x - 0.03, y, z], { color: g, rot: [0, 0, -18] }).ball([0.04, 0.14, 0.016], [x + 0.03, y, z], { color: '#7aa83a', rot: [0, 0, 18] });
    }
    b.each(5, (i) => b.ball(0.036, [-0.05 + i * 0.025, 0.3 - (i % 2) * 0.03, 0.03], { color: 'white' }))
      .pair((s) => b.ball([0.08, 0.05, 0.03], [s * 0.04, 0.42, 0.01], { color: 'red', rot: [0, 0, s * 20] }).rod([0, 0.4, 0.02], [s * 0.05, 0.3, 0.03], 0.02, 'red'))
      .ball(0.05, [0, 0.42, 0.02], { color: 'darkred' });
    return b.done();
  }),
  e('mitten', 'wardrobe', 'gloves', () =>
    m('mitten')
      .cyl([0.12, 0.06, 0.07], [0, 0.03, 0], { color: 'white' })
      .capsule([0.12, 0.2, 0.065], [0, 0.15, 0], { color: 'red' })
      .capsule([0.045, 0.09, 0.045], [0.065, 0.13, 0], { color: 'red', rot: [0, 0, -38] })
      .box([0.121, 0.025, 0.066], [0, 0.12, 0], { color: 'white', noInk: true })
      .star(0.035, [0, 0.18, 0.033], { color: 'white', noInk: true })
      .done(),
  ),
  e('moat', 'places', 'landmarks', () => {
    const b = m('moat');
    b.box([7, 0.2, 7], [0, 0.1, 0], { color: 'grass', round: 0.05 })
      .torus([6.2, 6.2, 0.14], [0, 0.25, 0], { color: 'water', rot: [90, 0, 0], tube: 0.3 })
      .cyl([2.8, 0.3, 2.8], [0, 0.3, 0], { color: 'grass' })
      .box([2.2, 2.6, 2.2], [0, 1.75, 0], { color: 'stone' })
      .each(3, (i) => b.box([0.45, 0.4, 0.35], [-0.8 + i * 0.8, 3.2, 0.95], { color: 'stone' }))
      .cyl([1.0, 3.8, 1.0], [-1.0, 2.2, -1.0], { color: '#bdbdb5' })
      .cone([1.3, 1.0, 1.3], [-1.0, 4.6, -1.0], { color: 'darkred' })
      .box([0.8, 1.2, 0.1], [0, 1.05, 1.12], { color: '#2a2422' })
      .box([0.9, 0.1, 2.0], [0, 0.38, 2.1], { color: 'wood' });
    return b.done();
  }),
  e('mobile (baby)', 'toys', 'baby toys', () => {
    const b = m('mobile (baby)');
    b.box([0.12, 0.06, 0.12], [-0.28, 0.03, 0], { color: 'white' })
      .stick([-0.28, 0.05, 0], [-0.28, 0.62, 0], 0.025, 'white')
      .rod([-0.28, 0.62, 0], [0, 0.67, 0], 0.025, 'white')
      .ball(0.06, [0, 0.64, 0], { color: 'yellow', name: 'rotor' })
      .stick([-0.16, 0.62, 0], [0.16, 0.62, 0], 0.015, 'white', { parent: 'rotor' })
      .stick([0, 0.62, -0.16], [0, 0.62, 0.16], 0.015, 'white', { parent: 'rotor' });
    const hang: Array<[V, (at: V) => void]> = [
      [[0.15, 0.4, 0], (at) => b.star(0.1, at, { color: 'yellow', parent: 'rotor' })],
      [[-0.15, 0.4, 0], (at) => b.heart(0.09, at, { color: 'pink', parent: 'rotor' })],
      [[0, 0.4, 0.15], (at) => b.ball(0.08, at, { color: 'skyblue', parent: 'rotor' })],
      [[0, 0.4, -0.15], (at) => b.ball([0.12, 0.07, 0.06], at, { color: 'white', parent: 'rotor' })],
    ];
    for (const [at, f] of hang) {
      b.stick([at[0], 0.62, at[2]], [at[0], at[1] + 0.04, at[2]], 0.004, 'gray', { parent: 'rotor' });
      f(at);
    }
    return b.done();
  }),
  e('mobile home', 'places', 'houses', () => {
    const b = m('mobile home');
    b.box([8, 0.6, 2.9], [0, 0.3, 0], { color: '#9da3a8' })
      .box([8, 2.4, 3], [0, 1.8, 0], { color: 'beige', round: 0.05 })
      .box([8.02, 0.3, 3.02], [0, 1.5, 0], { color: '#a0693c', noInk: true })
      .box([8.1, 0.15, 3.1], [0, 3.05, 0], { color: 'lightgray' })
      .box([0.9, 1.9, 0.08], [1.5, 1.55, 1.52], { color: 'white', name: 'door', pivot: [1.05, 1.55, 1.52] })
      .each(3, (i) => b.box([1.0, 0.3, 0.6], [1.5, 0.15 + i * 0.2, 1.8 + i * -0.15], { color: 'wood' }))
      .each(3, (i) => b.box([1.0, 0.8, 0.08], [[-3, -1.4, 3.2][i], 2.0, 1.52], { color: 'glass' }))
      .box([1.6, 0.35, 0.06], [-1.4, 2.75, 1.53], { color: 'darkbrown' })
      .label('HOME', [1.5, 0.28], [-1.4, 2.75, 1.57], { color: 'darkbrown' })
      .box([0.3, 0.3, 0.6], [4.3, 0.5, 0], { color: 'iron' });
    return b.done();
  }),
  e('modem', 'tech', 'computers', () => {
    const b = m('modem');
    b.box([0.22, 0.045, 0.15], [0, 0.03, 0], { color: 'black', round: 0.3 })
      .box([0.2, 0.01, 0.13], [0, 0.005, 0], { color: 'darkgray' })
      .each(4, (i) => b.ball(0.008, [-0.06 + i * 0.03, 0.035, 0.076], { color: i === 3 ? 'orange' : 'lime', glow: true }))
      .pair((s) => b.stick([s * 0.09, 0.04, -0.06], [s * 0.11, 0.2, -0.07], 0.012, 'black'));
    return b.done();
  }),
  e('molasses', 'food', 'sweets', () =>
    bottle('molasses', 0.24, '#3a1e10', 'gold', { band: 'cream', w: 0.09 })
      .ball([0.02, 0.04, 0.02], [0.03, 0.2, 0.012], { color: '#3a1e10' })
      .done(),
  ),
  e('molding', 'workshop', 'building parts', () =>
    m('molding')
      .box([0.6, 0.05, 0.08], [0, 0.025, 0], { color: 'white', round: 0.1 })
      .box([0.6, 0.03, 0.06], [0, 0.06, -0.01], { color: 'white', round: 0.1 })
      .capsule([0.03, 0.6, 0.03], [0, 0.055, 0.035], { color: 'white', rot: [0, 0, 90] })
      .cyl([0.04, 0.6, 0.04], [0, 0.085, -0.01], { color: 'white', rot: [0, 0, 90] })
      .box([0.6, 0.015, 0.04], [0, 0.11, -0.02], { color: 'white' })
      .done(),
  ),
  e('monument', 'places', 'landmarks', () => {
    const b = m('monument'), br = '#5f8a7a';
    b.box([4, 0.5, 4], [0, 0.25, 0], { color: 'stone' })
      .box([3, 0.5, 3], [0, 0.75, 0], { color: '#b8b8b0' })
      .box([1.8, 2.4, 1.8], [0, 2.2, 0], { color: 'stone' })
      .box([1.2, 0.5, 0.06], [0, 2.2, 0.92], { color: 'bronze' })
      .label('MONUMENT', [1.1, 0.4], [0, 2.2, 0.96], { color: 'bronze' })
      .box([2.0, 0.2, 2.0], [0, 3.5, 0], { color: '#b8b8b0' })
      .capsule([0.6, 1.2, 0.5], [0, 4.35, 0], { color: br })
      .cyl([0.7, 1.0, 0.55], [0, 3.95, 0], { color: br, taper: 0.7 })
      .ball(0.42, [0, 5.15, 0], { color: br })
      .rod([0.3, 4.75, 0], [0.55, 5.6, 0.1], 0.18, br)
      .rod([-0.3, 4.75, 0], [-0.4, 4.1, 0.1], 0.18, br)
      .cyl([0.12, 0.35, 0.12], [0.58, 5.8, 0.1], { color: br })
      .cone([0.25, 0.4, 0.25], [0.58, 6.15, 0.1], { color: 'gold' });
    return b.done();
  }),
  e('moon', 'sky', 'moon and stars', () =>
    m('moon')
      .ball(3, [0, 2.5, 0], { color: '#d4d4cc' })
      .ball([0.8, 0.8, 0.2], [-0.5, 3.0, 1.4], { color: '#a8a8a0', noInk: true })
      .ball([0.5, 0.5, 0.15], [0.6, 2.2, 1.4], { color: '#b0b0a8', noInk: true })
      .ball([0.35, 0.35, 0.12], [0.2, 3.4, 1.3], { color: '#b0b0a8', noInk: true })
      .ball([0.6, 0.6, 0.15], [-0.2, 1.6, 1.38], { color: '#a8a8a0', noInk: true })
      .done(),
  ),
  e('mop', 'home', 'cleaning', () => {
    const b = m('mop');
    b.stick([0, 0.3, 0], [0, 1.5, 0], 0.04, 'wood')
      .cyl([0.1, 0.1, 0.1], [0, 0.3, 0], { color: 'blue' })
      .ball([0.26, 0.16, 0.26], [0, 0.2, 0], { color: 'lightgray' });
    around(10, 0.22, 0.2).forEach(([x, z]) => b.rod([x * 0.3, 0.22, z * 0.3], [x, 0.035, z], 0.07, '#d4d7da'));
    return b.done();
  }),
  e('morgue', 'places', 'rooms', () => {
    const b = room('morgue', 3.6, 3, 2.4, '#b8c0c0', '#d8e4e0');
    b.box([2.4, 1.8, 0.6], [-0.4, 1.0, -1.15], { color: 'steel' });
    for (const x of [-1.2, -0.4, 0.4]) for (const y of [0.45, 1.05, 1.6]) b.box([0.66, 0.5, 0.04], [x, y, -0.84], { color: '#c9ccd1' }).box([0.2, 0.04, 0.04], [x, y + 0.12, -0.8], { color: 'darkgray' });
    b.box([0.7, 0.08, 1.9], [0.9, 0.85, 0.3], { color: 'silver' })
      .pair((s) => b.stick([0.9 + s * 0.3, 0.1, 1.0], [0.9 + s * 0.3, 0.82, 1.0], 0.05, 'steel').stick([0.9 + s * 0.3, 0.1, -0.4], [0.9 + s * 0.3, 0.82, -0.4], 0.05, 'steel'))
      .capsule([0.45, 1.7, 0.3], [0.9, 1.05, 0.3], { color: 'white', rot: [90, 0, 0] })
      .box([0.08, 0.05, 0.004], [0.85, 1.0, 1.2], { color: 'cream' })
      .box([1.2, 0.3, 0.05], [0.9, 2.0, -1.42], { color: 'navy' })
      .label('MORGUE', [1.1, 0.24], [0.9, 2.0, -1.38], { color: 'navy' });
    return b.done();
  }),
  e('mortar (material)', 'workshop', 'building materials', () =>
    m('mortar (material)')
      .cyl([0.35, 0.3, 0.35], [0, 0.15, 0], { color: 'black', taper: 1.15 })
      .ball([0.38, 0.1, 0.38], [0, 0.3, 0], { color: '#a7a7a0' })
      .box([0.12, 0.008, 0.2], [0.03, 0.38, 0.0], { color: 'steel', rot: [0, 30, 60] })
      .rod([-0.02, 0.47, 0], [-0.05, 0.55, 0], 0.03, 'wood')
      .box([0.22, 0.07, 0.1], [0.3, 0.035, 0.12], { color: '#b5543c' })
      .box([0.22, 0.02, 0.1], [0.3, 0.08, 0.12], { color: '#c8c8c0' })
      .box([0.22, 0.07, 0.1], [0.3, 0.125, 0.12], { color: '#b5543c' })
      .done(),
  ),
  e('mortar (weapon)', 'armory', 'artillery', () => {
    const b = m('mortar (weapon)', { view: 'side' }), o = '#5a6a3a';
    b.cyl([0.6, 0.06, 0.6], [0, 0.03, -0.3], { color: o })
      .ball(0.16, [0, 0.1, -0.3], { color: o })
      .stick([0, 0.1, -0.3], [0, 1.1, 0.25], 0.12, o)
      .cyl([0.15, 0.06, 0.15], [0, 1.08, 0.24], { color: 'iron', rot: [-61, 0, 0] })
      .cyl([0.14, 0.08, 0.14], [0, 0.66, 0.0], { color: 'iron', rot: [-61, 0, 0] })
      .pair((s) => b.rod([0, 0.66, 0.02], [s * 0.3, 0.02, 0.35], 0.04, 'iron'))
      .stick([-0.3, 0.3, 0.3], [0.3, 0.3, 0.3], 0.03, 'iron')
      .box([0.08, 0.1, 0.08], [0.1, 0.75, 0.02], { color: 'black' })
      .capsule([0.08, 0.3, 0.08], [0.5, 0.06, -0.2], { color: o, rot: [90, 0, 0] })
      .cyl([0.1, 0.08, 0.1], [0.5, 0.06, -0.38], { color: 'iron', rot: [90, 0, 0] });
    return b.done();
  }),
  e('mosaic', 'home', 'decor', () => {
    const b = m('mosaic'), cols = ['blue', 'yellow', 'red', 'teal', 'orange', 'white', 'green', 'navy', 'gold'];
    b.box([0.5, 0.5, 0.04], [0, 0.32, 0], { color: '#9da3a8', round: 0.1 })
      .box([0.56, 0.06, 0.08], [0, 0.04, 0], { color: 'darkwood' })
      .box([0.54, 0.54, 0.03], [0, 0.32, -0.02], { color: 'darkwood' });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) b.box([0.105, 0.105, 0.012], [-0.17 + i * 0.113, 0.15 + j * 0.113, 0.02], { color: cols[(i * 3 + j * 5 + (i * j) % 4) % cols.length], round: 0.15 });
    return b.done();
  }),
  e('mosque', 'places', 'religious buildings', () => {
    const b = m('mosque');
    b.box([6, 4, 6], [0, 2, 0], { color: 'white', round: 0.03 })
      .cyl([4.4, 0.6, 4.4], [0, 4.3, 0], { color: 'white' })
      .ball([4.6, 4.2, 4.6], [0, 4.6, 0], { color: 'teal' })
      .stick([0, 6.6, 0], [0, 7.3, 0], 0.08, 'gold')
      .torus([0.5, 0.5, 0.08], [0.08, 7.45, 0], { color: 'gold', tube: 0.25 })
      .box([1.4, 2.2, 0.1], [0, 1.1, 3.02], { color: 'darkwood', name: 'door', pivot: [-0.7, 1.1, 3.02] })
      .ball([1.4, 1.2, 0.12], [0, 2.2, 3.02], { color: 'darkwood' })
      .box([1.8, 0.35, 0.06], [0, 3.3, 3.03], { color: 'teal' })
      .label('MOSQUE', [1.7, 0.28], [0, 3.3, 3.07], { color: 'teal' })
      .pair((s) => {
        b.cyl([0.7, 8, 0.7], [s * 3.8, 4, 2.6], { color: 'white' })
          .cyl([1.1, 0.25, 1.1], [s * 3.8, 6.4, 2.6], { color: 'teal' })
          .cone([0.8, 1.4, 0.8], [s * 3.8, 8.7, 2.6], { color: 'teal' })
          .box([0.7, 1.2, 0.1], [s * 1.8, 2.0, 3.02], { color: 'glass' })
          .ball([0.7, 0.6, 0.12], [s * 1.8, 2.6, 3.02], { color: 'glass' });
      });
    return b.done();
  }),
  e('mosquito net', 'home', 'bedroom', () => {
    const b = m('mosquito net');
    b.box([1.0, 0.3, 2.0], [0, 0.25, 0], { color: 'darkwood' })
      .box([0.95, 0.2, 1.95], [0, 0.48, 0], { color: 'white' })
      .box([0.7, 0.12, 0.35], [0, 0.62, -0.7], { color: 'skyblue' })
      .cone([1.6, 1.5, 2.4], [0, 1.3, 0], { color: '#eef2f4', taper: 0.06 })
      .torus([1.62, 2.42, 0.06], [0, 0.56, 0], { color: 'white', rot: [90, 0, 0], tube: 0.03 })
      .stick([0, 2.05, 0], [0, 2.3, 0], 0.02, 'gray')
      .torus([0.12, 0.12, 0.02], [0, 2.32, 0], { color: 'gray' });
    return b.done();
  }),
  e('mosquito repellent', 'home', 'household', () =>
    m('mosquito repellent')
      .cyl([0.065, 0.16, 0.065], [0, 0.08, 0], { color: '#3a9a5a' })
      .ball([0.065, 0.03, 0.065], [0, 0.16, 0], { color: '#3a9a5a' })
      .cyl([0.04, 0.03, 0.04], [0, 0.185, 0], { color: 'white' })
      .box([0.012, 0.01, 0.015], [0, 0.195, 0.015], { color: 'red' })
      .cyl([0.067, 0.07, 0.067], [0, 0.08, 0], { color: 'yellow', noInk: true })
      .ball([0.02, 0.012, 0.008], [0, 0.08, 0.033], { color: 'black', noInk: true })
      .rod([-0.018, 0.06, 0.034], [0.018, 0.1, 0.034], 0.006, 'red', { noInk: true })
      .rod([0.018, 0.06, 0.034], [-0.018, 0.1, 0.034], 0.006, 'red', { noInk: true })
      .done(),
  ),
  e('moss', 'garden', 'plants', () => {
    const b = m('moss');
    b.ball([0.3, 0.12, 0.22], [0, 0.04, 0], { color: 'rock' });
    around(6, 0.08, 0.3).forEach(([x, z], i) => b.ball([0.12, 0.06, 0.1], [x, 0.075, z], { color: i % 2 ? '#5f9a3a' : '#7ab048' }));
    return b.ball([0.12, 0.06, 0.1], [0, 0.1, 0], { color: '#6aa83f' })
      .rod([0.02, 0.12, 0.02], [0.03, 0.17, 0.03], 0.004, '#a07a3a')
      .ball(0.01, [0.03, 0.175, 0.03], { color: '#a07a3a' })
      .rod([-0.04, 0.11, 0.03], [-0.05, 0.16, 0.04], 0.004, '#a07a3a')
      .ball(0.01, [-0.05, 0.165, 0.04], { color: '#a07a3a' })
      .done();
  }),
  e('mothball', 'home', 'household', () => {
    const b = m('mothball');
    b.box([0.1, 0.05, 0.07], [0, 0.025, 0], { color: '#7a5aa8', round: 0.1 })
      .box([0.102, 0.02, 0.072], [0, 0.025, 0], { color: 'white', noInk: true });
    for (const [x, z] of [[-0.025, -0.015], [0.0, 0.0], [0.025, -0.01], [-0.02, 0.018], [0.022, 0.018]]) b.ball(0.026, [x, 0.058, z], { color: 'white' });
    return b.ball(0.026, [0.07, 0.013, 0.05], { color: 'white' }).ball(0.026, [0.045, 0.013, 0.07], { color: 'white' }).done();
  }),
  e('motherboard', 'tech', 'computers', () => {
    const b = m('motherboard');
    b.box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'darkgray' })
      .box([0.25, 0.25, 0.01], [0, 0.145, 0], { color: '#2a7a4a' })
      .box([0.055, 0.055, 0.012], [0.0, 0.18, 0.01], { color: 'silver' })
      .cyl([0.045, 0.02, 0.045], [0.0, 0.18, 0.025], { color: 'darkgray', rot: [90, 0, 0] })
      .each(2, (i) => b.box([0.012, 0.13, 0.016], [0.07 + i * 0.022, 0.18, 0.012], { color: 'black' }))
      .each(2, (i) => b.box([0.15, 0.012, 0.016], [-0.03, 0.05 + i * 0.035, 0.012], { color: i ? 'black' : 'white' }))
      .box([0.04, 0.04, 0.025], [0.07, 0.07, 0.018], { color: 'teal' })
      .box([0.03, 0.08, 0.025], [-0.105, 0.21, 0.018], { color: 'silver' })
      .each(3, (i) => b.cyl([0.012, 0.022, 0.012], [-0.06 + i * 0.016, 0.13, 0.016], { color: i % 2 ? 'gold' : 'navy', rot: [90, 0, 0] }))
      .rod([-0.11, 0.03, 0.006], [0.1, 0.03, 0.006], 0.003, 'gold', { noInk: true });
    return b.done();
  }),
  e('motion detector', 'tech', 'electronics', () =>
    m('motion detector')
      .box([0.12, 0.14, 0.015], [0, 0.08, -0.02], { color: 'beige' })
      .box([0.07, 0.1, 0.05], [0, 0.08, 0.01], { color: 'white', round: 0.4 })
      .ball([0.05, 0.045, 0.04], [0, 0.065, 0.035], { color: '#e8eef2' })
      .ball(0.008, [0.022, 0.115, 0.036], { color: 'red', glow: true })
      .box([0.06, 0.01, 0.04], [0, 0.005, -0.01], { color: 'gray' })
      .done(),
  ),
  e('motor', 'tech', 'machines', () => {
    const b = m('motor');
    b.box([0.16, 0.02, 0.12], [0, 0.01, 0], { color: 'darkgray' })
      .pair((s) => b.box([0.02, 0.04, 0.1], [s * 0.06, 0.03, 0], { color: 'darkgray' }))
      .cyl([0.12, 0.18, 0.12], [0, 0.085, 0], { color: '#3f6fb0', rot: [0, 0, 90] })
      .each(5, (i) => b.torus([0.13, 0.13, 0.012], [-0.06 + i * 0.03, 0.085, 0], { color: '#2f5f9f', rot: [0, 90, 0], tube: 0.1 }))
      .pair((s) => b.cyl([0.11, 0.02, 0.11], [s * 0.1, 0.085, 0], { color: 'silver', rot: [0, 0, 90] }))
      .stick([0.1, 0.085, 0], [0.17, 0.085, 0], 0.02, 'silver')
      .box([0.05, 0.035, 0.05], [0, 0.155, 0], { color: 'darkgray' });
    return b.done();
  }),
  e('motor home', 'garage', 'cars', () => {
    const b = m('motor home', { view: 'side' });
    b.box([2.4, 2.4, 5.6], [0, 1.8, -0.7], { color: 'white', round: 0.15 })
      .box([2.3, 1.3, 1.4], [0, 1.15, 2.6], { color: 'white', round: 0.3 })
      .box([2.2, 0.6, 0.2], [0, 1.45, 3.22], { color: 'glass', rot: [-15, 0, 0] })
      .box([2.4, 0.9, 1.3], [0, 2.5, 2.35], { color: 'white', round: 0.3 })
      .box([2.42, 0.25, 5.4], [0, 1.4, -0.7], { color: '#a0693c', noInk: true })
      .box([2.42, 0.12, 5.4], [0, 1.15, -0.7], { color: 'orange', noInk: true })
      .pair((s) => b.box([0.05, 0.6, 1.0], [s * 1.2, 2.2, -1.8], { color: 'glass' }).box([0.05, 0.6, 0.8], [s * 1.2, 2.2, 0.4], { color: 'glass' }).box([0.06, 0.5, 0.8], [s * 1.16, 1.5, 2.6], { color: 'glass' }))
      .box([0.06, 1.8, 0.7], [1.21, 1.45, 1.3], { color: 'lightgray' })
      .pair((s) => b.ball([0.3, 0.2, 0.06], [s * 0.8, 0.85, 3.3], { color: 'white', glow: true }))
      .each(5, (i) => b.stick([-0.3, 0.8 + i * 0.45, -3.52], [0.3, 0.8 + i * 0.45, -3.52], 0.04, 'silver'));
    return wheels(b, 1.0, [2.3, -2.2], 0.9, 0.3).done();
  }),
  e('motorcycle', 'garage', 'motorbikes', () => {
    const b = m('motorcycle', { view: 'side' });
    for (const z of [0.72, -0.72]) b.torus([0.64, 0.64, 0.15], [0, 0.32, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.3, name: z > 0 ? 'wheel' : undefined }).cyl([0.22, 0.16, 0.22], [0, 0.32, z], { color: 'silver', rot: [0, 0, 90] });
    return b.box([0.24, 0.3, 0.5], [0, 0.48, 0.0], { color: 'silver', round: 0.3 })
      .ball([0.3, 0.24, 0.5], [0, 0.82, 0.15], { color: 'red' })
      .box([0.24, 0.1, 0.55], [0, 0.82, -0.32], { color: 'black', round: 0.5 })
      .box([0.2, 0.12, 0.4], [0, 0.72, -0.62], { color: 'red', round: 0.5 })
      .rod([0, 0.32, -0.72], [0, 0.55, -0.15], 0.06, 'darkgray')
      .pair((s) => b.rod([s * 0.08, 0.32, 0.72], [s * 0.08, 1.0, 0.5], 0.05, 'silver'))
      .stick([-0.35, 1.05, 0.46], [0.35, 1.05, 0.46], 0.04, 'black')
      .ball([0.2, 0.2, 0.12], [0, 0.92, 0.64], { color: 'yellow', glow: true })
      .box([0.12, 0.08, 0.5], [0, 0.66, 0.68], { color: 'red', round: 0.5, rot: [-25, 0, 0] })
      .stick([0.15, 0.4, 0.1], [0.17, 0.42, -0.8], 0.09, 'silver')
      .done();
  }),
  e('mountain', 'nature', 'landforms', () =>
    m('mountain')
      .cone([8, 7, 7], [0, 3.5, 0], { color: 'stone', segs: 9 })
      .cone([3.5, 3.0, 3.06], [0, 5.5, 0], { color: 'snow', segs: 9 })
      .cone([5, 4.5, 4.5], [3, 2.25, -1], { color: 'rock', segs: 7 })
      .cone([1.9, 1.7, 1.7], [3, 3.65, -1], { color: 'snow', segs: 7 })
      .cone([1.0, 1.6, 1.0], [-2.8, 0.8, 2.6], { color: 'darkgreen' })
      .cone([0.8, 1.3, 0.8], [-2.0, 0.65, 3.1], { color: 'darkgreen' })
      .done(),
  ),
  e('mouse pad', 'tech', 'computers', () =>
    m('mouse pad')
      .box([0.26, 0.006, 0.21], [0, 0.003, 0], { color: 'blue', round: 0.5 })
      .ball([0.12, 0.004, 0.08], [-0.05, 0.006, 0.04], { color: 'skyblue', noInk: true })
      .ball([0.06, 0.035, 0.1], [0.03, 0.022, 0], { color: 'lightgray' })
      .box([0.002, 0.01, 0.04], [0.03, 0.038, 0.03], { color: 'darkgray', noInk: true })
      .rod([0.03, 0.015, -0.05], [0.04, 0.008, -0.13], 0.006, 'darkgray')
      .done(),
  ),
  e('mouse trap', 'home', 'household', () =>
    m('mouse trap')
      .box([0.1, 0.012, 0.045], [0, 0.006, 0], { color: 'lightwood' })
      .rod([-0.02, 0.016, -0.02], [-0.02, 0.016, 0.02], 0.004, 'silver')
      .rod([-0.02, 0.016, -0.02], [-0.045, 0.016, -0.02], 0.004, 'silver')
      .rod([-0.02, 0.016, 0.02], [-0.045, 0.016, 0.02], 0.004, 'silver')
      .rod([-0.045, 0.016, -0.02], [-0.045, 0.016, 0.02], 0.004, 'silver')
      .cyl([0.01, 0.012, 0.01], [-0.01, 0.018, -0.014], { color: 'silver', rot: [90, 0, 0] })
      .box([0.025, 0.003, 0.02], [0.025, 0.014, 0], { color: 'silver' })
      .wedge([0.025, 0.018, 0.02], [0.025, 0.025, 0], { color: 'cheese' })
      .done(),
  ),
  e('moustache', 'wardrobe', 'costumes', () => {
    const b = m('moustache');
    b.stick([0, 0, -0.01], [0, 0.17, -0.01], 0.008, 'black')
      .ball([0.03, 0.025, 0.02], [0, 0.18, 0], { color: 'darkbrown' })
      .pair((s) => b.ball([0.07, 0.03, 0.02], [s * 0.035, 0.177, 0], { color: 'darkbrown', rot: [0, 0, s * 12] }).torus([0.028, 0.028, 0.012], [s * 0.075, 0.195, 0], { color: 'darkbrown', tube: 0.25 }));
    return b.done();
  }),
  e('mouth guard', 'sports', 'protective gear', () => {
    const b = m('mouth guard');
    const pts = [0, 30, 60, 90, 120, 150, 180].map((a): V => [Math.cos(rad(a)) * 0.045, 0.016, Math.sin(rad(a)) * 0.05 - 0.01]);
    for (let i = 0; i < 6; i++) b.rod(pts[i], pts[i + 1], 0.03, '#4e8fd6');
    return b.ball([0.03, 0.012, 0.02], [0, 0.03, 0.035], { color: '#8fc0f0', noInk: true }).done();
  }),
  e('mouth wash', 'home', 'toiletries', () =>
    m('mouth wash')
      .box([0.08, 0.17, 0.05], [0, 0.085, 0], { color: '#3fb0a8', round: 0.5 })
      .box([0.082, 0.07, 0.052], [0, 0.08, 0], { color: 'white', noInk: true, round: 0.5 })
      .cyl([0.04, 0.03, 0.04], [0, 0.185, 0], { color: 'white' })
      .ball([0.02, 0.025, 0.006], [0, 0.08, 0.028], { color: 'teal', noInk: true })
      .done(),
  ),
  e('movie theatre', 'places', 'entertainment', () => {
    const b = m('movie theatre');
    b.box([6, 5, 4], [0, 2.5, 0], { color: 'maroon', round: 0.03 })
      .box([6.2, 0.3, 4.2], [0, 5.15, 0], { color: 'gold' })
      .box([4.6, 0.9, 1.4], [0, 3.0, 2.6], { color: 'white' })
      .label('MOVIES', [4.0, 0.6], [0, 3.0, 3.32], { color: 'white' })
      .each(7, (i) => b.ball(0.14, [-2.1 + i * 0.7, 2.5, 3.3], { color: 'yellow', glow: true }))
      .box([0.3, 2.2, 1.2], [0, 4.6, 2.3], { color: 'gold' })
      .star(0.7, [0, 6.0, 2.3], { color: 'gold' })
      .box([1.6, 2.2, 0.1], [0, 1.1, 2.02], { color: 'glass', name: 'door', pivot: [-0.8, 1.1, 2.02] })
      .pair((s) => b.box([1.0, 1.5, 0.12], [s * 2.1, 1.3, 2.02], { color: s > 0 ? 'navy' : 'darkgreen' }).box([0.8, 1.3, 0.13], [s * 2.1, 1.3, 2.02], { color: s > 0 ? 'skyblue' : 'yellow', noInk: true }));
    return b.done();
  }),
  e('moving truck', 'garage', 'trucks', () => {
    const b = m('moving truck', { view: 'side' });
    b.box([2.0, 0.3, 6.8], [0, 0.65, 0], { color: 'darkgray' })
      .box([2.4, 2.6, 5.0], [0, 2.1, -0.9], { color: 'white', round: 0.08 })
      .box([2.42, 0.9, 4.0], [0, 2.1, -0.9], { color: 'orange', noInk: true })
      .pair((s) => b.label('MOVING', [3.6, 0.7], [s * 1.22, 2.1, -0.9], { color: 'orange', rot: [0, s * 90, 0] }))
      .box([2.3, 1.8, 1.6], [0, 1.45, 2.45], { color: 'orange', round: 0.3 })
      .box([2.1, 0.7, 0.1], [0, 1.85, 3.25], { color: 'glass' })
      .pair((s) => b.box([0.06, 0.6, 0.8], [s * 1.15, 1.85, 2.55], { color: 'glass' }).ball([0.3, 0.2, 0.06], [s * 0.8, 1.0, 3.25], { color: 'white', glow: true }))
      .box([2.3, 0.25, 0.15], [0, 0.6, 3.3], { color: 'silver' })
      .box([2.0, 2.3, 0.06], [0, 2.0, -3.42], { color: 'lightgray' });
    return wheels(b, 0.95, [2.4, -1.8, -2.8], 0.9, 0.3).done();
  }),
  e('mozzarella', 'food', 'cheese', () =>
    m('mozzarella')
      .cyl([0.24, 0.015, 0.24], [0, 0.0075, 0], { color: 'white' })
      .ball([0.12, 0.09, 0.12], [-0.03, 0.06, -0.02], { color: '#fbf9f2' })
      .cyl([0.08, 0.02, 0.08], [0.06, 0.03, 0.05], { color: '#f4f0e4', rot: [20, 0, 0] })
      .cyl([0.07, 0.02, 0.07], [0.0, 0.025, 0.08], { color: 'tomato', rot: [15, 0, 0] })
      .ball([0.05, 0.012, 0.03], [-0.02, 0.105, -0.02], { color: 'green', rot: [0, 30, 0] })
      .ball([0.045, 0.012, 0.028], [-0.04, 0.102, 0.0], { color: 'darkgreen', rot: [0, -30, 0] })
      .done(),
  ),
  e('mud', 'nature', 'elements', () =>
    m('mud')
      .ball([0.5, 0.06, 0.4], [0, 0.03, 0], { color: '#6b4a2a' })
      .ball([0.2, 0.08, 0.16], [-0.1, 0.05, -0.05], { color: '#5a3a22' })
      .ball([0.14, 0.06, 0.12], [0.12, 0.05, 0.06], { color: '#7a5a3a' })
      .ball(0.04, [0.02, 0.07, 0.08], { color: '#8a6a4a' })
      .ball(0.03, [-0.15, 0.1, 0.0], { color: '#5a3a22' })
      .ball([0.08, 0.02, 0.06], [0.15, 0.06, -0.1], { color: '#4a3020', noInk: true })
      .done(),
  ),
  e('muffin', 'food', 'baked goods', () => {
    const b = m('muffin');
    b.cyl([0.065, 0.05, 0.065], [0, 0.025, 0], { color: 'pink', taper: 1.3 })
      .ball([0.095, 0.06, 0.095], [0, 0.062, 0], { color: '#c8843a' });
    around(6, 0.025).forEach(([x, z], i) => b.ball(0.013, [x * (1 + (i % 2) * 0.6), 0.088 - (i % 2) * 0.01, z * (1 + (i % 2) * 0.6)], { color: 'navy' }));
    return b.done();
  }),
  e('muffin tin', 'kitchen', 'baking', () => {
    const b = m('muffin tin');
    b.box([0.36, 0.035, 0.25], [0, 0.0175, 0], { color: 'silver', round: 0.2 });
    for (const x of [-0.11, 0, 0.11]) for (const z of [-0.06, 0.06]) b.cyl([0.08, 0.02, 0.08], [x, 0.03, z], { color: 'steel' }).ball([0.085, 0.045, 0.085], [x, 0.045, z], { color: '#c8843a' });
    return b.done();
  }),
  e('muffler', 'garage', 'car parts', () =>
    m('muffler')
      .cyl([0.25, 0.5, 0.18], [0, 0.13, 0], { color: 'steel', rot: [0, 0, 90] })
      .cyl([0.26, 0.03, 0.19], [0.24, 0.13, 0], { color: 'iron', rot: [0, 0, 90] })
      .cyl([0.26, 0.03, 0.19], [-0.24, 0.13, 0], { color: 'iron', rot: [0, 0, 90] })
      .stick([0.25, 0.13, 0], [0.48, 0.13, 0], 0.06, 'silver')
      .stick([-0.25, 0.15, 0.03], [-0.48, 0.15, 0.03], 0.06, 'silver')
      .cyl([0.07, 0.04, 0.07], [-0.5, 0.15, 0.03], { color: '#55595e', rot: [0, 0, 90] })
      .done(),
  ),
  e('mug', 'kitchen', 'tableware', () =>
    m('mug')
      .cyl([0.085, 0.1, 0.085], [0, 0.05, 0], { color: 'red' })
      .cyl([0.075, 0.005, 0.075], [0, 0.098, 0], { color: 'coffee' })
      .torus([0.06, 0.07, 0.02], [0.05, 0.05, 0], { color: 'red', rot: [0, 90, 0], tube: 0.25 })
      .heart(0.035, [0, 0.055, 0.043], { color: 'white', noInk: true })
      .done(),
  ),
  e('mug shot', 'study', 'documents', () => {
    const b = m('mug shot');
    b.box([0.12, 0.02, 0.05], [0, 0.01, 0], { color: 'darkgray' })
      .box([0.12, 0.15, 0.01], [0, 0.095, 0], { color: '#e0e2e4' })
      .each(4, (i) => b.box([0.12, 0.002, 0.011], [0, 0.04 + i * 0.03, 0.001], { color: 'darkgray', noInk: true }))
      .ball([0.05, 0.08, 0.02], [0, 0.065, 0.008], { color: 'orange' })
      .ball([0.035, 0.042, 0.02], [0, 0.125, 0.008], { color: 'skin3' })
      .ball([0.036, 0.018, 0.02], [0, 0.142, 0.006], { color: 'darkbrown' })
      .box([0.06, 0.025, 0.006], [0, 0.07, 0.02], { color: 'black' })
      .label('1234', [0.05, 0.018], [0, 0.07, 0.024], { color: 'black' });
    return b.done();
  }),
  e('mulberry tree', 'garden', 'fruit trees', () => tree('mulberry tree', 8, '#4f8a3a', { shape: 'wide', fruit: '#4a1a3a', n: 10, fs: 0.26 }).done()),
  e('munitions', 'armory', 'ammunition', () => {
    const b = m('munitions'), o = '#5a6a3a';
    b.box([0.4, 0.2, 0.25], [0, 0.1, 0], { color: o, round: 0.1 })
      .box([0.41, 0.03, 0.26], [0, 0.185, 0], { color: '#4a5a2a' })
      .box([0.2, 0.05, 0.01], [0, 0.1, 0.126], { color: 'yellow', noInk: true })
      .label('AMMO', [0.18, 0.045], [0, 0.1, 0.13], { color: o })
      .pair((s) => b.box([0.02, 0.04, 0.08], [s * 0.21, 0.13, 0], { color: 'iron' }));
    for (const x of [-0.08, 0, 0.08]) b.cyl([0.04, 0.1, 0.04], [x, 0.25, 0.02], { color: 'brass' }).cyl([0.035, 0.05, 0.035], [x, 0.325, 0.02], { color: 'copper', taper: 0.25 });
    return b.done();
  }),
  e('muscle', 'clinic', 'body parts', () => {
    const b = m('muscle'), k = 'skin3';
    return b.box([0.24, 0.03, 0.12], [0, 0.015, 0], { color: 'darkgray' })
      .ball([0.1, 0.11, 0.1], [-0.11, 0.09, 0], { color: k })
      .capsule([0.08, 0.2, 0.08], [-0.02, 0.09, 0], { color: k, rot: [0, 0, 85] })
      .ball([0.1, 0.075, 0.08], [-0.03, 0.13, 0.005], { color: k })
      .ball(0.075, [0.08, 0.09, 0], { color: k })
      .capsule([0.07, 0.18, 0.07], [0.09, 0.17, 0], { color: k, rot: [0, 0, -10] })
      .ball([0.08, 0.075, 0.075], [0.1, 0.28, 0], { color: k })
      .done();
  }),
  e('museum', 'places', 'public buildings', () => {
    const b = m('museum');
    b.box([9, 0.4, 5.4], [0, 0.2, 0], { color: 'stone' })
      .box([8, 4.4, 4], [0, 2.6, -0.4], { color: '#e8dcc0' })
      .each(6, (i) => b.cyl([0.45, 4.2, 0.45], [-3.25 + i * 1.3, 2.5, 1.95], { color: 'white' }))
      .each(2, (i) => b.box([0.5, 2.4, 0.04], [i ? 1.95 : -1.95, 2.8, 1.62], { color: i ? 'red' : 'navy' }))
      .box([8.6, 0.5, 4.8], [0, 4.85, -0.1], { color: 'white' })
      .wedge([8.6, 1.3, 4.8], [0, 5.75, -0.1], { color: '#e8dcc0' })
      .box([1.4, 2.4, 0.1], [0, 1.6, 1.62], { color: 'darkwood', name: 'door', pivot: [-0.7, 1.6, 1.62] })
      .box([3.2, 0.4, 0.06], [0, 4.85, 2.32], { color: 'darkred' })
      .label('MUSEUM', [3.0, 0.32], [0, 4.85, 2.36], { color: 'darkred' })
      .capsule([0.6, 1.4, 0.5], [3.6, 0.9, 3.4], { color: '#9da3a8', rot: [80, 0, 0] })
      .rod([3.6, 1.0, 4.0], [3.6, 2.2, 4.5], 0.25, '#9da3a8')
      .ball([0.35, 0.25, 0.45], [3.6, 2.3, 4.6], { color: '#9da3a8' })
      .rod([3.6, 0.8, 2.8], [3.6, 0.5, 2.0], 0.15, '#9da3a8')
      .pair((s) => b.stick([3.6 + s * 0.2, 0.4, 3.7], [3.6 + s * 0.2, 0.75, 3.7], 0.14, '#9da3a8').stick([3.6 + s * 0.2, 0.4, 3.1], [3.6 + s * 0.2, 0.75, 3.1], 0.14, '#9da3a8'));
    return b.done();
  }),
  e('mushroom (fungi)', 'garden', 'mushrooms', () =>
    m('mushroom (fungi)')
      .cyl([0.045, 0.09, 0.045], [0, 0.045, 0], { color: 'white', taper: 0.8 })
      .cyl([0.12, 0.01, 0.12], [0, 0.092, 0], { color: 'cream' })
      .ball([0.15, 0.09, 0.15], [0, 0.11, 0], { color: 'red' })
      .ball([0.025, 0.012, 0.025], [0.0, 0.155, 0.0], { color: 'white', noInk: true })
      .ball([0.022, 0.015, 0.015], [0.04, 0.135, 0.045], { color: 'white', noInk: true, rot: [40, 0, -20] })
      .ball([0.022, 0.015, 0.015], [-0.045, 0.13, 0.04], { color: 'white', noInk: true, rot: [40, 0, 25] })
      .ball([0.02, 0.012, 0.012], [0.0, 0.12, 0.068], { color: 'white', noInk: true, rot: [70, 0, 0] })
      .cyl([0.022, 0.04, 0.022], [0.08, 0.02, 0.04], { color: 'white' })
      .ball([0.06, 0.035, 0.06], [0.08, 0.045, 0.04], { color: 'red' })
      .done(),
  ),
  e('music stand', 'music', 'accessories', () => {
    const b = m('music stand');
    around(3, 0.3, Math.PI / 2).forEach(([x, z]) => b.rod([0, 0.2, 0], [x, 0.01, z], 0.025, 'black'));
    return b.stick([0, 0.05, 0], [0, 0.95, 0], 0.03, 'black')
      .cyl([0.09, 0.1, 0.09], [0, 0.6, 0], { color: 'darkgray' })
      .box([0.5, 0.36, 0.02], [0, 1.1, 0.0], { color: 'black', rot: [-15, 0, 0] })
      .box([0.52, 0.03, 0.07], [0, 0.93, 0.06], { color: 'black' })
      .box([0.42, 0.3, 0.012], [0, 1.1, 0.02], { color: 'paper', rot: [-15, 0, 0] })
      .each(4, (i) => b.box([0.36, 0.004, 0.014], [0, 1.18 - i * 0.05, 0.024 + i * 0.013], { color: 'darkgray', rot: [-15, 0, 0], noInk: true }))
      .done();
  }),
  e('musket', 'armory', 'guns', () =>
    m('musket')
      .box([0.45, 0.12, 0.28], [0, 0.06, 0], { color: 'darkwood', round: 0.3 })
      .box([0.1, 0.24, 0.05], [0.0, 0.22, 0], { color: 'wood', round: 0.3 })
      .box([0.05, 0.6, 0.045], [0.0, 0.6, 0], { color: 'wood', round: 0.3 })
      .stick([0.0, 0.5, 0], [0.0, 1.5, 0], 0.025, 'iron')
      .stick([0.03, 0.6, 0], [0.03, 1.4, 0], 0.01, 'darkwood')
      .box([0.03, 0.06, 0.05], [-0.03, 0.42, 0.005], { color: 'iron' })
      .rod([-0.04, 0.44, 0.02], [-0.07, 0.48, 0.02], 0.012, 'iron')
      .torus([0.05, 0.06, 0.01], [0.04, 0.38, 0], { color: 'brass', rot: [0, 90, 0] })
      .done(),
  ),
  e('mustard', 'food', 'sauces', () =>
    m('mustard')
      .cyl([0.06, 0.14, 0.06], [0, 0.07, 0], { color: 'yellow' })
      .ball([0.06, 0.03, 0.06], [0, 0.14, 0], { color: 'yellow' })
      .cyl([0.04, 0.02, 0.04], [0, 0.16, 0], { color: 'red' })
      .cone([0.025, 0.05, 0.025], [0, 0.195, 0], { color: 'red' })
      .cyl([0.062, 0.05, 0.062], [0, 0.07, 0], { color: 'red', noInk: true })
      .done(),
  ),
  e('muzzle', 'armory', 'gun parts', () =>
    m('muzzle')
      .box([0.12, 0.03, 0.18], [0, 0.015, -0.03], { color: 'darkwood' })
      .cyl([0.06, 0.18, 0.06], [0, 0.07, -0.03], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.08, 0.05, 0.08], [0, 0.07, 0.07], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.03, 0.006, 0.03], [0, 0.07, 0.096], { color: 'black', rot: [90, 0, 0] })
      .box([0.012, 0.025, 0.02], [0, 0.115, 0.06], { color: 'darkgray' })
      .done(),
  ),
  e('nail', 'workshop', 'hardware', () =>
    m('nail')
      .box([0.12, 0.05, 0.08], [0, 0.025, 0], { color: 'lightwood' })
      .stick([0, 0.05, 0], [0, 0.12, 0], 0.008, 'steel')
      .cyl([0.025, 0.006, 0.025], [0, 0.123, 0], { color: 'steel' })
      .done(),
  ),
  e('nail clipper', 'home', 'toiletries', () =>
    m('nail clipper')
      .box([0.08, 0.008, 0.016], [0, 0.004, 0], { color: 'silver', round: 0.4 })
      .box([0.075, 0.008, 0.016], [0.002, 0.016, 0], { color: 'silver', round: 0.4, rot: [0, 0, -6] })
      .box([0.07, 0.006, 0.014], [0.0, 0.03, 0], { color: 'steel', round: 0.4, rot: [0, 0, 10] })
      .stick([-0.02, 0.0, 0], [-0.02, 0.03, 0], 0.005, 'silver')
      .torus([0.015, 0.015, 0.004], [0.04, 0.035, 0], { color: 'silver', tube: 0.25 })
      .done(),
  ),
  e('nail file', 'home', 'toiletries', () =>
    m('nail file')
      .box([0.04, 0.02, 0.03], [0, 0.01, 0], { color: 'white', round: 0.3 })
      .capsule([0.022, 0.15, 0.005], [0, 0.085, 0], { color: '#c87a9a' })
      .capsule([0.023, 0.07, 0.006], [0, 0.12, 0], { color: 'black', noInk: true })
      .done(),
  ),
  e('nail gun', 'workshop', 'power tools', () =>
    m('nail gun')
      .box([0.26, 0.09, 0.07], [0.02, 0.2, 0], { color: 'yellow', round: 0.4 })
      .box([0.05, 0.13, 0.05], [0.11, 0.1, 0], { color: 'black', round: 0.4, rot: [0, 0, -10] })
      .box([0.04, 0.14, 0.04], [-0.11, 0.09, 0], { color: 'darkgray', round: 0.2 })
      .box([0.2, 0.035, 0.03], [0.0, 0.035, 0], { color: 'steel', rot: [0, 0, 8] })
      .box([0.015, 0.02, 0.012], [0.08, 0.15, 0], { color: 'red' })
      .cyl([0.025, 0.03, 0.025], [0.14, 0.03, 0], { color: 'brass' })
      .done(),
  ),
  e('nail polish', 'wardrobe', 'makeup', () =>
    m('nail polish')
      .box([0.045, 0.04, 0.035], [0, 0.02, 0], { color: '#d42a4a', round: 0.5 })
      .cyl([0.016, 0.008, 0.016], [0, 0.044, 0], { color: '#d42a4a' })
      .cyl([0.02, 0.045, 0.02], [0, 0.07, 0], { color: 'black' })
      .ball([0.012, 0.015, 0.004], [0.01, 0.025, 0.018], { color: 'white', noInk: true })
      .done(),
  ),
  e('name badge', 'study', 'office supplies', () =>
    m('name badge')
      .box([0.07, 0.008, 0.03], [0, 0.004, 0], { color: 'gray' })
      .box([0.1, 0.07, 0.008], [0, 0.043, 0], { color: 'white', round: 0.2 })
      .box([0.1, 0.022, 0.009], [0, 0.068, 0], { color: 'red', noInk: true })
      .box([0.1, 0.008, 0.009], [0, 0.011, 0], { color: 'red', noInk: true })
      .label('HELLO', [0.08, 0.016], [0, 0.068, 0.006], { color: 'red' })
      .box([0.06, 0.003, 0.009], [0, 0.035, 0.001], { color: 'navy', noInk: true })
      .box([0.03, 0.015, 0.012], [0, 0.083, -0.004], { color: 'silver' })
      .done(),
  ),
  e('napkin', 'kitchen', 'tableware', () =>
    m('napkin')
      .cyl([0.28, 0.015, 0.28], [0, 0.0075, 0], { color: 'white' })
      .wedge([0.2, 0.24, 0.06], [0, 0.135, 0], { color: 'red' })
      .wedge([0.17, 0.2, 0.062], [0, 0.125, 0], { color: 'white', noInk: true })
      .wedge([0.14, 0.17, 0.064], [0, 0.11, 0], { color: 'red', noInk: true })
      .done(),
  ),
  e('neck', 'clinic', 'body parts', () =>
    m('neck')
      .ball([0.36, 0.12, 0.2], [0, 0.06, 0], { color: 'skin2' })
      .cyl([0.11, 0.14, 0.11], [0, 0.17, 0], { color: 'skin2' })
      .ball([0.025, 0.03, 0.02], [0, 0.17, 0.05], { color: 'skin2' })
      .ball([0.16, 0.18, 0.17], [0, 0.31, 0.01], { color: 'skin2' })
      .ball([0.16, 0.08, 0.17], [0, 0.39, -0.01], { color: 'brown' })
      .ball(0.018, [0.035, 0.32, 0.08], { color: 'black', eye: true })
      .ball(0.018, [-0.035, 0.32, 0.08], { color: 'black', eye: true })
      .done(),
  ),
  e('necklace', 'wardrobe', 'jewellery', () => {
    const b = m('necklace');
    b.box([0.14, 0.03, 0.12], [0, 0.015, 0], { color: 'black' })
      .stick([0, 0.03, 0], [0, 0.1, 0], 0.03, 'black')
      .ball([0.3, 0.22, 0.1], [0, 0.2, 0], { color: '#2a2726' })
      .cyl([0.09, 0.14, 0.08], [0, 0.36, 0], { color: '#2a2726' });
    for (let i = 0; i < 11; i++) {
      const a = rad(200 + i * 14);
      b.ball(0.022, [Math.cos(a) * 0.075, 0.3 + Math.sin(a) * 0.08, 0.028 - Math.sin(a) * 0.015], { color: 'white' });
    }
    return b.ball([0.035, 0.045, 0.02], [0, 0.195, 0.05], { color: 'red' }).done();
  }),
  e('needle', 'workshop', 'crafts', () =>
    m('needle')
      .ball([0.09, 0.07, 0.09], [0, 0.035, 0], { color: 'red' })
      .ball([0.02, 0.025, 0.02], [0, 0.075, 0], { color: 'green' })
      .stick([0.01, 0.06, 0.01], [0.03, 0.13, 0.02], 0.004, 'silver')
      .torus([0.008, 0.012, 0.003], [0.031, 0.132, 0.02], { color: 'silver' })
      .rod([0.031, 0.13, 0.02], [0.055, 0.1, 0.03], 0.003, 'blue')
      .rod([0.055, 0.1, 0.03], [0.05, 0.03, 0.04], 0.003, 'blue')
      .stick([-0.02, 0.06, 0.0], [-0.035, 0.1, -0.01], 0.004, 'silver')
      .ball(0.01, [-0.036, 0.102, -0.01], { color: 'yellow' })
      .done(),
  ),
  e('neon sign', 'home', 'decor', () => {
    const b = m('neon sign'), p = '#ff4fa8';
    b.box([0.9, 0.62, 0.075], [0, 0.39, -0.045], { color: '#1a1716', round: 0.1 })
      .pair((s) => b.box([0.06, 0.08, 0.2], [s * 0.35, 0.04, 0], { color: 'darkgray' }));
    const pts: V[] = [[0, 0.22, 0.01], [-0.2, 0.42, 0.01], [-0.14, 0.58, 0.01], [0, 0.5, 0.01], [0.14, 0.58, 0.01], [0.2, 0.42, 0.01], [0, 0.22, 0.01]];
    for (let i = 0; i < 6; i++) b.rod(pts[i], pts[i + 1], 0.025, p, { glow: true });
    return b.rod([-0.3, 0.14, 0.01], [0.3, 0.14, 0.01], 0.022, 'cyan', { glow: true }).done();
  }),
  e('neptune (planet)', 'sky', 'planets', () =>
    m('neptune (planet)')
      .ball(3, [0, 2.2, 0], { color: '#3f6fd6' })
      .ball([3.02, 0.3, 3.02], [0, 2.7, 0], { color: '#5a8ae8', noInk: true })
      .ball([3.02, 0.25, 3.02], [0, 1.6, 0], { color: '#2f5fc0', noInk: true })
      .ball([0.6, 0.35, 0.15], [0.4, 1.9, 1.42], { color: '#1f3f90', noInk: true })
      .torus([4.2, 4.2, 0.03], [0, 2.2, 0], { color: '#9db8e8', rot: [80, 0, 10], tube: 0.03 })
      .done(),
  ),
  e('nest', 'aviary', 'bird things', () => {
    const b = m('nest');
    b.ball([0.24, 0.07, 0.24], [0, 0.035, 0], { color: '#7a5a30' })
      .torus([0.28, 0.28, 0.08], [0, 0.07, 0], { color: '#8a6a3a', rot: [90, 0, 0], tube: 0.32 })
      .each(3, (i) => b.ball([0.04, 0.05, 0.04], [-0.035 + i * 0.035, 0.085, (i % 2) * 0.03 - 0.01], { color: '#9fd8e8' }));
    around(5, 0.13, 0.3).forEach(([x, z]) => b.rod([x, 0.08, z], [x * 1.25, 0.11, z * 1.25], 0.008, '#6b4a26'));
    return b.done();
  }),
  e('net (fish)', 'sea', 'fishing', () => {
    const b = m('net (fish)');
    b.pair((s) => b.stick([s * 0.85, 0, 0], [s * 0.85, 1.7, 0], 0.1, 'darkwood'))
      .box([1.6, 1.2, 0.02], [0, 0.95, 0], { color: '#c8b88a' })
      .each(5, (i) => b.stick([-0.6 + i * 0.3, 0.35, 0.012], [-0.6 + i * 0.3, 1.55, 0.012], 0.012, '#8a7a5a', { noInk: true }))
      .each(4, (i) => b.stick([-0.8, 0.5 + i * 0.3, 0.012], [0.8, 0.5 + i * 0.3, 0.012], 0.012, '#8a7a5a', { noInk: true }))
      .each(5, (i) => b.ball(0.15, [-0.6 + i * 0.3, 1.58, 0.02], { color: 'orange' }))
      .ball([0.35, 0.16, 0.08], [0.15, 0.7, 0.05], { color: 'silver' })
      .cone([0.14, 0.14, 0.04], [-0.06, 0.7, 0.05], { color: 'silver', rot: [0, 0, 90] });
    return b.done();
  }),
  e('news stand', 'places', 'shops', () => {
    const b = m('news stand');
    b.box([1.6, 1.8, 1.2], [0, 0.9, 0], { color: 'darkgreen', round: 0.05 })
      .box([1.9, 0.12, 1.5], [0, 1.86, 0.1], { color: '#2a5a2a' })
      .box([1.2, 0.6, 0.06], [0, 1.25, 0.6], { color: '#1a1716' })
      .box([1.6, 0.08, 0.4], [0, 0.8, 0.78], { color: 'wood' })
      .each(5, (i) => b.box([0.22, 0.3, 0.03], [-0.6 + i * 0.3, 0.97, 0.75], { color: ['red', 'yellow', 'skyblue', 'white', 'pink'][i], rot: [-15, 0, 0] }))
      .box([1.2, 0.35, 0.08], [0, 2.15, 0.3], { color: 'white' })
      .label('NEWS', [1.1, 0.3], [0, 2.15, 0.35], { color: 'white' });
    return b.done();
  }),
  e('newspaper', 'study', 'books', () =>
    m('newspaper')
      .box([0.3, 0.4, 0.03], [0, 0.2, 0], { color: 'paper', round: 0.05 })
      .box([0.28, 0.05, 0.032], [0, 0.35, 0], { color: '#2a2726', noInk: true })
      .label('NEWS', [0.26, 0.045], [0, 0.35, 0.013], { color: 'paper' })
      .box([0.12, 0.1, 0.032], [-0.06, 0.25, 0], { color: 'gray', noInk: true })
      .box([0.1, 0.01, 0.032], [0.07, 0.29, 0], { color: 'darkgray', noInk: true })
      .box([0.1, 0.01, 0.032], [0.07, 0.26, 0], { color: 'darkgray', noInk: true })
      .box([0.1, 0.01, 0.032], [0.07, 0.23, 0], { color: 'darkgray', noInk: true })
      .box([0.26, 0.01, 0.032], [0, 0.17, 0], { color: 'darkgray', noInk: true })
      .box([0.26, 0.01, 0.032], [0, 0.13, 0], { color: 'darkgray', noInk: true })
      .box([0.26, 0.01, 0.032], [0, 0.09, 0], { color: 'darkgray', noInk: true })
      .done(),
  ),
  e('nickel', 'ideas', 'money', () =>
    m('nickel')
      .cyl([0.06, 0.008, 0.06], [0, 0.03, 0], { color: 'silver', rot: [90, 0, 0] })
      .torus([0.06, 0.06, 0.01], [0, 0.03, 0], { color: '#a8acb0', tube: 0.1 })
      .ball([0.025, 0.03, 0.004], [0.002, 0.032, 0.004], { color: '#a8acb0', noInk: true })
      .label('5', [0.012, 0.012], [0, 0.012, 0.004], { color: 'silver' })
      .done(),
  ),
  e('night light', 'home', 'lighting', () =>
    m('night light')
      .box([0.16, 0.2, 0.02], [0, 0.1, -0.02], { color: 'beige' })
      .box([0.07, 0.11, 0.015], [0, 0.1, -0.005], { color: 'white', round: 0.3 })
      .box([0.06, 0.07, 0.03], [0, 0.1, 0.015], { color: 'white', round: 0.4 })
      .ball([0.07, 0.07, 0.025], [0, 0.135, 0.03], { color: '#fff0a0' })
      .ball(0.05, [0, 0.135, 0.04], { color: 'flame', glow: true })
      .done(),
  ),
  e('night vision goggles', 'tech', 'gadgets', () =>
    m('night vision goggles')
      .box([0.16, 0.06, 0.06], [0, 0.07, 0], { color: '#3a4a2a', round: 0.4 })
      .cyl([0.045, 0.08, 0.045], [0.04, 0.07, 0.06], { color: '#2a3420', rot: [90, 0, 0] })
      .cyl([0.045, 0.08, 0.045], [-0.04, 0.07, 0.06], { color: '#2a3420', rot: [90, 0, 0] })
      .cyl([0.036, 0.004, 0.036], [0.04, 0.07, 0.101], { color: 'lime', rot: [90, 0, 0], glow: true })
      .cyl([0.036, 0.004, 0.036], [-0.04, 0.07, 0.101], { color: 'lime', rot: [90, 0, 0], glow: true })
      .torus([0.18, 0.13, 0.025], [0, 0.07, -0.08], { color: 'black', rot: [90, 0, 0], tube: 0.1 })
      .box([0.03, 0.04, 0.04], [0, 0.11, 0.0], { color: '#2a3420' })
      .box([0.1, 0.04, 0.12], [0, 0.02, -0.02], { color: 'darkgray' })
      .done(),
  ),
  e('nightcap', 'wardrobe', 'hats', () =>
    m('nightcap')
      .cyl([0.2, 0.04, 0.2], [0, 0.02, 0], { color: 'white' })
      .cyl([0.19, 0.15, 0.19], [0, 0.115, 0], { color: 'blue', taper: 0.5 })
      .cyl([0.192, 0.025, 0.192], [0, 0.09, 0], { color: 'white', taper: 0.85, noInk: true })
      .cyl([0.1, 0.13, 0.1], [0.05, 0.22, 0], { color: 'blue', taper: 0.35, rot: [0, 0, -70] })
      .ball(0.055, [0.13, 0.2, 0], { color: 'white' })
      .done(),
  ),
  e('nightclub', 'places', 'entertainment', () => {
    const b = m('nightclub');
    b.box([5, 3.5, 3.5], [0, 1.75, 0], { color: '#3a2a5a', round: 0.03 })
      .box([5.2, 0.2, 3.7], [0, 3.6, 0], { color: '#1a1716' })
      .box([1.2, 2.2, 0.1], [0, 1.1, 1.77], { color: 'black', name: 'door', pivot: [-0.6, 1.1, 1.77] })
      .box([3.2, 0.6, 0.08], [0, 2.8, 1.78], { color: '#1a1716' })
      .label('NIGHTCLUB', [3.0, 0.5], [0, 2.8, 1.83], { color: 'magenta', glow: true })
      .rod([-2.4, 3.4, 1.8], [2.4, 3.4, 1.8], 0.06, 'cyan', { glow: true })
      .ball(0.9, [1.6, 4.2, 0], { color: 'silver' })
      .stick([1.6, 3.7, 0], [1.6, 3.8, 0], 0.05, 'gray')
      .pair((s) => b.stick([s * 1.3, 0, 2.6], [s * 1.3, 0.9, 2.6], 0.06, 'gold').ball(0.1, [s * 1.3, 0.92, 2.6], { color: 'gold' }))
      .rod([-1.3, 0.85, 2.6], [0, 0.65, 2.7], 0.05, 'red')
      .rod([0, 0.65, 2.7], [1.3, 0.85, 2.6], 0.05, 'red');
    return b.done();
  }),
  e('nightgown', 'wardrobe', 'sleepwear', () => {
    const b = m('nightgown'), c = '#f7c6dc';
    b.cyl([0.62, 0.95, 0.4], [0, 0.475, 0], { color: c, taper: 0.55 })
      .box([0.42, 0.34, 0.2], [0, 1.1, 0], { color: c, round: 0.5 })
      .torus([0.63, 0.41, 0.04], [0, 0.03, 0], { color: 'white', rot: [90, 0, 0], tube: 0.08 })
      .torus([0.2, 0.12, 0.03], [0, 1.26, 0.03], { color: 'white', rot: [80, 0, 0], tube: 0.2 })
      .pair((s) => b.ball([0.2, 0.17, 0.18], [s * 0.25, 1.17, 0], { color: c }).rod([s * 0.3, 1.1, 0], [s * 0.36, 0.85, 0.02], 0.09, c).torus([0.1, 0.1, 0.03], [s * 0.36, 0.82, 0.02], { color: 'white', rot: [90, 0, 0], tube: 0.2 }))
      .each(3, (i) => b.ball(0.024, [0, 1.17 - i * 0.07, 0.1], { color: 'white' }))
      .box([0.46, 0.04, 0.26], [0, 0.95, 0], { color: 'magenta', noInk: true })
      .ball([0.08, 0.05, 0.03], [0, 0.95, 0.12], { color: 'magenta' });
    return b.done();
  }),
  e('mechanical bull', 'toys', 'rides', () => {
    const b = m('mechanical bull'), c = '#6b3e26';
    b.cyl([3, 0.3, 3], [0, 0.15, 0], { color: 'red' })
      .cyl([2.0, 0.31, 2.0], [0, 0.155, 0], { color: 'blue', noInk: true })
      .cyl([0.4, 0.7, 0.4], [0, 0.6, 0], { color: 'darkgray' })
      .capsule([0.62, 1.5, 0.56], [0, 1.15, 0], { color: c, rot: [0, 0, 90] })
      .ball([0.45, 0.42, 0.42], [0.82, 1.22, 0], { color: c })
      .ball([0.25, 0.22, 0.3], [1.02, 1.12, 0], { color: 'tan' })
      .box([0.45, 0.1, 0.64], [-0.05, 1.47, 0], { color: 'black', round: 0.4 })
      .stick([0.2, 1.47, 0], [0.22, 1.6, 0], 0.05, 'black')
      .rod([-0.72, 1.2, 0], [-0.88, 0.85, 0], 0.06, c)
      .pair((s) => {
        b.rod([0.85, 1.38, s * 0.14], [0.92, 1.58, s * 0.36], 0.07, 'cream')
          .ball(0.03, [1.12, 1.18, s * 0.06], { color: 'black', eye: true })
          .capsule([0.14, 0.32, 0.14], [0.45, 0.82, s * 0.18], { color: c })
          .capsule([0.14, 0.32, 0.14], [-0.45, 0.82, s * 0.18], { color: c });
      });
    return b.done();
  }),
  e('nightstand', 'home', 'bedroom', () => {
    const b = m('nightstand');
    b.box([0.45, 0.45, 0.38], [0, 0.32, 0], { color: 'wood', round: 0.1 })
      .box([0.41, 0.14, 0.02], [0, 0.44, 0.19], { color: 'lightwood', round: 0.2 })
      .ball(0.03, [0, 0.44, 0.21], { color: 'brass' })
      .box([0.41, 0.2, 0.02], [0, 0.22, 0.19], { color: 'lightwood', round: 0.2 })
      .ball(0.03, [0, 0.22, 0.21], { color: 'brass' });
    for (const x of [-0.19, 0.19]) for (const z of [-0.15, 0.15]) b.stick([x, 0, z], [x, 0.1, z], 0.04, 'darkwood');
    return b.cyl([0.12, 0.03, 0.12], [-0.08, 0.56, -0.04], { color: 'cream' })
      .stick([-0.08, 0.57, -0.04], [-0.08, 0.72, -0.04], 0.02, 'brass')
      .cyl([0.22, 0.16, 0.22], [-0.08, 0.78, -0.04], { color: 'cream', taper: 0.65 })
      .ball(0.08, [-0.08, 0.74, -0.04], { color: 'flame', glow: true })
      .box([0.1, 0.07, 0.05], [0.12, 0.58, 0.05], { color: 'red', round: 0.4 })
      .cyl([0.06, 0.005, 0.06], [0.12, 0.58, 0.077], { color: 'white', rot: [90, 0, 0] })
      .done();
  }),
  e('no eating sign', 'ideas', 'signs', () =>
    banSign('no eating sign', 0.75, (b, y, z, r) =>
      b.ball([r * 0.9, r * 0.35, 0.03], [0, y + r * 0.22, z], { color: 'bread' })
        .box([r * 0.95, r * 0.18, 0.03], [0, y, z], { color: 'brown', round: 0.5 })
        .box([r * 0.95, r * 0.06, 0.032], [0, y + r * 0.11, z], { color: 'green', noInk: true })
        .box([r * 0.85, r * 0.2, 0.03], [0, y - r * 0.2, z], { color: 'bread', round: 0.6 }),
    ).done(),
  ),
  e('no parking sign', 'ideas', 'signs', () =>
    banSign('no parking sign', 0.75, (b, y, z, r) =>
      b.stick([-r * 0.25, y - r * 0.55, z], [-r * 0.25, y + r * 0.55, z], r * 0.16, 'black')
        .torus([r * 0.6, r * 0.55, 0.03], [-r * 0.05, y + r * 0.27, z], { color: 'black', tube: 0.27 }),
    ).done(),
  ),
  e('noodles', 'food', 'meals', () => {
    const b = m('noodles'), n = '#f6dc8a';
    b.cyl([0.12, 0.08, 0.12], [0, 0.04, 0], { color: 'red', taper: 1.6 })
      .torus([0.2, 0.2, 0.015], [0, 0.08, 0], { color: 'darkred', rot: [90, 0, 0], tube: 0.08 })
      .cyl([0.18, 0.01, 0.18], [0, 0.075, 0], { color: '#e8b060' });
    around(5, 0.04, 0.4).forEach(([x, z], i) => b.rod([x, 0.082, z], [-z * 1.2, 0.084, x * 1.2], 0.008, n));
    return b.ball([0.045, 0.02, 0.035], [0.045, 0.085, 0.02], { color: 'white' })
      .ball(0.02, [0.045, 0.092, 0.02], { color: 'orange' })
      .ball([0.04, 0.008, 0.03], [-0.04, 0.083, -0.03], { color: 'green' })
      .stick([-0.1, 0.09, 0.06], [0.08, 0.22, -0.04], 0.008, 'darkwood')
      .stick([-0.1, 0.1, 0.07], [0.09, 0.21, -0.02], 0.008, 'darkwood')
      .rod([0.0, 0.16, 0.01], [0.0, 0.09, 0.0], 0.007, n)
      .rod([0.015, 0.165, 0.005], [0.02, 0.09, 0.0], 0.007, n)
      .done();
  }),
  e('noose', 'workshop', 'rope', () => {
    const b = m('noose'), t = '#c8a870';
    b.torus([0.12, 0.15, 0.03], [0, 0.075, 0], { color: t, tube: 0.16 })
      .cyl([0.045, 0.11, 0.045], [0, 0.2, 0], { color: t })
      .each(5, (i) => b.torus([0.05, 0.05, 0.018], [0, 0.16 + i * 0.02, 0], { color: '#a88850', rot: [90, 0, 0], tube: 0.25, noInk: true }))
      .stick([0, 0.25, 0], [0, 0.42, 0], 0.024, t);
    return b.done();
  }),
  e('nose', 'clinic', 'body parts', () => {
    const b = m('nose', { view: 'side' }), k = 'skin2';
    b.box([0.08, 0.025, 0.08], [0, 0.0125, -0.02], { color: 'darkgray' })
      .box([0.12, 0.16, 0.03], [0, 0.105, -0.03], { color: k, round: 0.5 })
      .rod([0, 0.165, -0.01], [0, 0.085, 0.045], 0.04, k)
      .ball(0.05, [0, 0.075, 0.05], { color: k })
      .pair((s) => b.ball([0.032, 0.03, 0.035], [s * 0.026, 0.068, 0.025], { color: k }))
      .ball([0.03, 0.008, 0.02], [0, 0.052, 0.045], { color: '#5a3a2a', noInk: true });
    return b.done();
  }),
  e('nose ring', 'wardrobe', 'jewellery', () => {
    const b = m('nose ring', { view: 'side' }), k = 'skin3';
    b.box([0.08, 0.025, 0.08], [0, 0.0125, -0.02], { color: 'darkgray' })
      .box([0.12, 0.16, 0.03], [0, 0.105, -0.03], { color: k, round: 0.5 })
      .rod([0, 0.165, -0.01], [0, 0.085, 0.045], 0.04, k)
      .ball(0.05, [0, 0.075, 0.05], { color: k })
      .pair((s) => b.ball([0.032, 0.03, 0.035], [s * 0.026, 0.068, 0.025], { color: k }))
      .ball([0.03, 0.008, 0.02], [0, 0.052, 0.045], { color: '#5a3a2a', noInk: true });
    b.torus([0.036, 0.036, 0.008], [0, 0.04, 0.045], { color: 'gold', tube: 0.18, rot: [0, 90, 0] })
      .ball(0.011, [0, 0.026, 0.035], { color: 'gold' })
      .ball(0.011, [0, 0.026, 0.055], { color: 'gold' });
    return b.done();
  }),
  e('note', 'study', 'stationery', () =>
    m('note')
      .box([0.08, 0.025, 0.08], [0, 0.0125, 0], { color: '#f6e04a', round: 0.05 })
      .box([0.08, 0.004, 0.08], [0, 0.032, 0.004], { color: '#fbe86a', rot: [-14, 0, 0] })
      .box([0.055, 0.003, 0.004], [0, 0.04, 0.02], { color: 'blue', rot: [-14, 0, 0], noInk: true })
      .box([0.05, 0.003, 0.004], [0, 0.036, 0.0], { color: 'blue', rot: [-14, 0, 0], noInk: true })
      .box([0.04, 0.003, 0.004], [-0.005, 0.031, -0.02], { color: 'blue', rot: [-14, 0, 0], noInk: true })
      .done(),
  ),
  e('notebook', 'study', 'books', () => {
    const b = m('notebook');
    b.box([0.18, 0.24, 0.025], [0, 0.12, 0], { color: 'blue', round: 0.1 })
      .box([0.17, 0.235, 0.02], [0.004, 0.12, -0.006], { color: 'paper' })
      .box([0.1, 0.04, 0.027], [0.01, 0.17, 0], { color: 'white', noInk: true })
      .each(8, (i) => b.torus([0.025, 0.025, 0.006], [-0.088, 0.025 + i * 0.027, 0], { color: 'silver', rot: [0, 90, 0], tube: 0.22 }));
    return b.done();
  }),
  e('nougat', 'food', 'sweets', () => {
    const b = m('nougat');
    b.box([0.14, 0.04, 0.05], [-0.02, 0.02, 0], { color: '#f6efe0', round: 0.1 })
      .box([0.025, 0.04, 0.05], [0.08, 0.025, 0.02], { color: '#f6efe0', round: 0.1, rot: [0, -20, 10] });
    const nuts: Array<[number, number, string]> = [[-0.07, 0.015, '#7cb84a'], [-0.04, 0.03, '#c89a5a'], [-0.01, 0.012, '#7cb84a'], [0.02, 0.028, '#c89a5a'], [0.04, 0.012, '#7cb84a']];
    for (const [x, y, c] of nuts) b.ball([0.014, 0.01, 0.006], [x, y, 0.025], { color: c, noInk: true });
    return b.done();
  }),
  e('nozzle', 'garden', 'garden tools', () =>
    m('nozzle')
      .torus([0.2, 0.2, 0.025], [-0.02, 0.0125, 0], { color: 'green', rot: [90, 0, 0], tube: 0.12 })
      .rod([0.06, 0.02, 0.04], [0.06, 0.05, 0.04], 0.025, 'green')
      .box([0.035, 0.11, 0.035], [0.06, 0.1, 0.04], { color: 'darkgray', round: 0.3, rot: [0, 0, -12] })
      .box([0.12, 0.04, 0.04], [0.11, 0.165, 0.04], { color: 'silver', round: 0.3 })
      .cyl([0.05, 0.03, 0.05], [0.18, 0.165, 0.04], { color: 'orange', rot: [0, 0, 90] })
      .rod([0.09, 0.14, 0.04], [0.1, 0.07, 0.04], 0.015, 'black')
      .done(),
  ),
  e('nuclear reactor', 'places', 'industry', () => {
    const b = m('nuclear reactor');
    b.box([9, 0.2, 6], [0, 0.1, 0], { color: 'gray' })
      .cyl([4.4, 4.0, 4.4], [-1.8, 2.2, -0.6], { color: '#b8bcc0', taper: 0.68 })
      .cyl([3.0, 2.2, 3.0], [-1.8, 5.3, -0.6], { color: '#b8bcc0', taper: 1.2 })
      .cyl([3.5, 0.3, 3.5], [-1.8, 3.0, -0.6], { color: 'red', noInk: true, taper: 0.97 })
      .ball([2.6, 0.9, 2.4], [-1.8, 6.75, -0.6], { color: 'white' })
      .ball([1.8, 0.8, 1.6], [-1.0, 7.4, -0.8], { color: 'white' })
      .cyl([2.4, 2.0, 2.4], [2.2, 1.2, 1.0], { color: 'white' })
      .ball([2.4, 2.0, 2.4], [2.2, 2.2, 1.0], { color: 'white' })
      .cyl([0.9, 0.06, 0.9], [2.2, 1.5, 2.22], { color: 'yellow', rot: [90, 0, 0] });
    for (const a of [90, 210, 330]) b.wedge([0.32, 0.3, 0.05], [2.2 + Math.cos(rad(a)) * 0.2, 1.5 + Math.sin(rad(a)) * 0.2, 2.25], { color: 'black', rot: [0, 0, a + 90] });
    return b.ball(0.1, [2.2, 1.5, 2.26], { color: 'black' })
      .box([2.0, 1.4, 1.6], [3.0, 0.9, -1.6], { color: '#b8b8b0' })
      .stick([3.6, 1.6, -1.6], [3.6, 3.6, -1.6], 0.3, 'darkgray')
      .done();
  }),
  e('nugget', 'nature', 'minerals', () =>
    m('nugget')
      .ball([0.07, 0.045, 0.055], [0, 0.022, 0], { color: 'gold' })
      .ball([0.045, 0.04, 0.04], [0.025, 0.035, 0.01], { color: '#f0c84a' })
      .ball([0.035, 0.03, 0.035], [-0.028, 0.03, -0.008], { color: '#c8962a' })
      .ball([0.025, 0.025, 0.025], [0.0, 0.05, -0.01], { color: 'gold' })
      .ball(0.01, [0.02, 0.052, 0.022], { color: '#fff3b0', noInk: true })
      .done(),
  ),
  e('nuke', 'armory', 'explosives', () => {
    const b = m('nuke', { view: 'side' }), y = '#c8b040';
    b.pair((s) => b.box([0.5, 0.1, 0.12], [0, 0.05, s * 0.2], { color: 'darkwood' }))
      .ball([0.44, 0.44, 0.72], [0, 0.3, 0.1], { color: y })
      .cyl([0.3, 0.3, 0.3], [0, 0.3, -0.3], { color: y, taper: 0.6, rot: [-90, 0, 0] })
      .box([0.4, 0.4, 0.22], [0, 0.3, -0.52], { color: '#a89030', round: 0.05 })
      .box([0.36, 0.36, 0.24], [0, 0.3, -0.52], { color: '#3a3633', round: 0.05 })
      .pair((s) => b.box([0.02, 0.38, 0.22], [s * 0.19, 0.3, -0.52], { color: y }))
      .box([0.45, 0.03, 0.3], [0, 0.42, 0.12], { color: '#3a3633', noInk: true });
    return b.done();
  }),
  e('nursing home', 'places', 'houses', () => {
    const b = bld('nursing home', { w: 7, h: 4, d: 4, wall: 'cream', roof: '#7a5a8a', gable: 1.5, ridgeX: true, sign: 'NURSING HOME', signCol: 'white' });
    b.pair((s) => b.box([1.1, 0.9, 0.06], [s * 2.6, 3.0, 2.01], { color: 'glass' }).box([1.1, 0.9, 0.06], [s * 2.6, 1.4, 2.01], { color: 'glass' }))
      .box([1.6, 0.1, 2.4], [-1.0, 0.35, 3.0], { color: 'stone', rot: [-8, 0, 0] })
      .box([1.6, 0.12, 0.5], [2.2, 0.45, 3.0], { color: 'wood' })
      .pair((s) => b.stick([2.2 + s * 0.7, 0, 3.0], [2.2 + s * 0.7, 0.45, 3.0], 0.08, 'darkgray'))
      .heart(0.6, [0, 3.85, 2.06], { color: 'red' });
    return b.done();
  }),
  e('nut (hardware)', 'workshop', 'hardware', () =>
    m('nut (hardware)')
      .cyl([0.06, 0.025, 0.06], [0, 0.03, 0], { color: 'steel', segs: 6, rot: [90, 0, 30] })
      .cyl([0.032, 0.026, 0.032], [0, 0.03, 0], { color: '#3a3d40', rot: [90, 0, 0] })
      .torus([0.034, 0.034, 0.027], [0, 0.03, 0], { color: 'silver', tube: 0.15 })
      .cyl([0.05, 0.02, 0.05], [0.06, 0.01, 0.03], { color: 'steel', segs: 6 })
      .cyl([0.026, 0.021, 0.026], [0.06, 0.0105, 0.03], { color: '#3a3d40' })
      .done(),
  ),
  e('nutcracker (kitchen)', 'kitchen', 'utensils', () =>
    m('nutcracker (kitchen)')
      .rod([0, 0.2, 0], [0.045, 0.01, 0], 0.016, 'silver')
      .rod([0, 0.2, 0], [-0.045, 0.01, 0], 0.016, 'silver')
      .cyl([0.022, 0.025, 0.022], [0, 0.2, 0], { color: 'steel', rot: [90, 0, 0] })
      .capsule([0.022, 0.08, 0.022], [0.04, 0.04, 0], { color: 'red', rot: [0, 0, 13] })
      .capsule([0.022, 0.08, 0.022], [-0.04, 0.04, 0], { color: 'red', rot: [0, 0, -13] })
      .ball([0.035, 0.032, 0.035], [0, 0.15, 0.0], { color: '#8a5a2a' })
      .torus([0.036, 0.033, 0.01], [0, 0.15, 0], { color: '#6b4220', rot: [0, 90, 0], tube: 0.2 })
      .done(),
  ),
  e('nutcracker (toy)', 'toys', 'holiday', () => {
    const b = m('nutcracker (toy)');
    b.box([0.12, 0.02, 0.08], [0, 0.01, 0], { color: 'darkgreen' })
      .pair((s) => b.cyl([0.035, 0.05, 0.04], [s * 0.025, 0.045, 0.005], { color: 'black' }).cyl([0.033, 0.06, 0.033], [s * 0.025, 0.1, 0], { color: 'white' }).capsule([0.03, 0.09, 0.03], [s * 0.06, 0.19, 0], { color: 'red' }).ball(0.02, [s * 0.062, 0.14, 0.005], { color: 'skin1' }))
      .box([0.09, 0.1, 0.06], [0, 0.18, 0], { color: 'red', round: 0.3 })
      .box([0.092, 0.015, 0.062], [0, 0.14, 0], { color: 'black' })
      .each(3, (i) => b.ball(0.008, [0, 0.16 + i * 0.022, 0.031], { color: 'gold' }))
      .ball([0.065, 0.07, 0.06], [0, 0.26, 0], { color: 'skin1' })
      .box([0.05, 0.03, 0.03], [0, 0.235, 0.025], { color: 'white', round: 0.5 })
      .ball([0.045, 0.015, 0.01], [0, 0.255, 0.032], { color: 'white' })
      .ball(0.01, [0.015, 0.275, 0.03], { color: 'black', eye: true })
      .ball(0.01, [-0.015, 0.275, 0.03], { color: 'black', eye: true })
      .cyl([0.07, 0.09, 0.065], [0, 0.335, 0], { color: 'black' })
      .cyl([0.072, 0.015, 0.067], [0, 0.3, 0], { color: 'gold' })
      .ball(0.025, [0, 0.385, 0], { color: 'red' });
    return b.done();
  }),
  e('nutshell', 'food', 'nuts', () =>
    m('nutshell')
      .ball([0.04, 0.035, 0.035], [-0.03, 0.0175, 0], { color: '#a87a4a' })
      .torus([0.042, 0.037, 0.006], [-0.03, 0.0175, 0], { color: '#8a5a2a', rot: [0, 90, 0], tube: 0.15 })
      .ball([0.045, 0.02, 0.04], [0.025, 0.01, 0.01], { color: '#a87a4a' })
      .cyl([0.034, 0.004, 0.03], [0.025, 0.019, 0.01], { color: '#5a3a1a', noInk: true })
      .ball([0.02, 0.015, 0.018], [0.0, 0.008, 0.035], { color: '#d8b07a' })
      .done(),
  ),
  e('oar', 'sea', 'boating', () =>
    m('oar')
      .ball([0.6, 0.2, 0.5], [0, 0.05, 0], { color: 'sand' })
      .stick([0, 0.05, 0], [0, 1.3, 0], 0.05, 'wood')
      .box([0.18, 0.45, 0.03], [0, 1.52, 0], { color: 'lightwood', round: 0.3 })
      .ball([0.18, 0.12, 0.03], [0, 1.75, 0], { color: 'red' })
      .box([0.181, 0.06, 0.031], [0, 1.7, 0], { color: 'red', noInk: true })
      .done(),
  ),
  e('oasis', 'nature', 'landforms', () => {
    const b = m('oasis');
    b.cyl([6, 0.45, 5], [0, 0.225, 0], { color: 'sand', taper: 0.85 })
      .cyl([2.6, 0.06, 2.0], [0.2, 0.46, 0.5], { color: 'water' });
    const palm = (x: number, z: number, h: number, lean: number) => {
      b.rod([x, 0.4, z], [x + lean * 0.5, h * 0.55, z], 0.18, 'bark').rod([x + lean * 0.5, h * 0.55, z], [x + lean, h, z], 0.15, 'bark');
      around(6, h * 0.3).forEach(([dx, dz]) => b.rod([x + lean, h, z], [x + lean + dx, h - h * 0.12, z + dz], 0.1, 'green'));
      b.ball(0.35, [x + lean, h, z], { color: 'darkgreen' });
    };
    palm(-1.4, -0.6, 2.6, 0.4);
    palm(1.6, -0.9, 2.0, -0.3);
    return b.ball([0.6, 0.4, 0.5], [-0.8, 0.35, 1.4], { color: 'darkgreen' }).done();
  }),
  e('oatmeal', 'food', 'breakfast', () => {
    const b = m('oatmeal');
    b.cyl([0.11, 0.06, 0.11], [0, 0.03, 0], { color: 'white', taper: 1.4 })
      .ball([0.15, 0.03, 0.15], [0, 0.065, 0], { color: '#e8d4a8' });
    around(4, 0.035).forEach(([x, z]) => b.ball(0.016, [x, 0.08, z], { color: 'navy' }));
    return b.cyl([0.028, 0.008, 0.028], [-0.03, 0.08, 0.03], { color: 'cream', rot: [10, 0, 0] })
      .cyl([0.028, 0.008, 0.028], [0.035, 0.08, -0.02], { color: 'cream', rot: [-10, 0, 0] })
      .stick([0.02, 0.075, 0.0], [0.11, 0.14, -0.03], 0.012, 'silver')
      .done();
  }),
  e('obelisk', 'places', 'landmarks', () => {
    const b = m('obelisk');
    b.box([2.4, 0.4, 2.4], [0, 0.2, 0], { color: 'stone' })
      .box([1.6, 0.6, 1.6], [0, 0.7, 0], { color: '#c8bc9a' })
      .each(4, (i) => b.box([1.3 - i * 0.12, 1.85, 1.3 - i * 0.12], [0, 1.0 + 0.925 + i * 1.8, 0], { color: '#d8ccaa', round: 0.02 }))
      .wedge([0.94, 0.9, 0.94], [0, 8.6, 0], { color: 'gold' })
      .wedge([0.94, 0.9, 0.94], [0, 8.6, 0], { color: 'gold', rot: [0, 90, 0] })
      .each(4, (i) => b.box([0.25, 0.25, 0.04], [i % 2 ? 0.12 : -0.12, 2.2 + i * 1.3, 0.65 - i * 0.06], { color: '#a89c7a', noInk: true }));
    return b.done();
  }),
  e('oboe', 'music', 'woodwinds', () => {
    const b = m('oboe');
    b.cyl([0.075, 0.09, 0.075], [0, 0.045, 0], { color: '#1a1716', taper: 0.6 })
      .cyl([0.046, 0.52, 0.046], [0, 0.35, 0], { color: '#1a1716', taper: 0.7 })
      .each(3, (i) => b.torus([0.04 - i * 0.002, 0.04 - i * 0.002, 0.012], [0, 0.1 + i * 0.2, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.2 }))
      .each(6, (i) => b.ball(0.014, [0.004, 0.16 + i * 0.07, 0.017], { color: 'silver' }))
      .rod([0.016, 0.2, 0.012], [0.016, 0.45, 0.012], 0.006, 'silver')
      .cyl([0.01, 0.04, 0.01], [0, 0.62, 0], { color: '#c8a870' })
      .box([0.012, 0.03, 0.004], [0, 0.655, 0], { color: 'tan' });
    return b.done();
  }),
  e('observatory', 'places', 'science buildings', () =>
    m('observatory')
      .cyl([6, 3, 6], [0, 1.5, 0], { color: '#e8e4dc' })
      .ball([6, 5, 6], [0, 3.0, 0], { color: 'white' })
      .box([0.9, 4.0, 1.0], [0, 4.0, 1.4], { color: '#2a3440', rot: [-50, 0, 0] })
      .stick([0, 3.4, 0.4], [0, 5.6, 2.3], 0.6, 'silver')
      .cyl([0.7, 0.2, 0.7], [0, 5.65, 2.35], { color: 'darkgray', rot: [-49, 0, 0] })
      .box([1.2, 2.0, 0.1], [0, 1.0, 3.0], { color: 'navy', name: 'door', pivot: [-0.6, 1.0, 3.0] })
      .box([2.6, 0.4, 0.08], [0, 2.4, 2.99], { color: 'navy', rot: [0, 0, 0] })
      .label('OBSERVATORY', [2.5, 0.32], [0, 2.4, 3.04], { color: 'navy' })
      .star(0.6, [2.4, 6.0, 0], { color: 'yellow', glow: true })
      .done(),
  ),
  e('obsidian', 'nature', 'rocks', () =>
    m('obsidian')
      .box([0.1, 0.07, 0.08], [0, 0.035, 0], { color: '#1a1716', round: 0.05, rot: [0, 25, 8] })
      .wedge([0.08, 0.1, 0.06], [0.04, 0.06, -0.01], { color: '#221c24', rot: [0, -20, 12] })
      .wedge([0.06, 0.06, 0.05], [-0.05, 0.04, 0.02], { color: '#2a2230', rot: [0, 40, -15] })
      .box([0.04, 0.005, 0.03], [-0.005, 0.071, 0.01], { color: '#8a7aa8', noInk: true, rot: [0, 25, 8] })
      .rod([0.02, 0.09, 0.0], [0.045, 0.05, 0.02], 0.004, 'white', { noInk: true })
      .done(),
  ),
  e('ocean', 'nature', 'water', () => {
    const b = m('ocean'), k = 2;
    b.box([7 * k, 0.5 * k, 5 * k], [0, 0.25 * k, 0], { color: 'water', round: 0.2 })
      .each(3, (r) => b.each(3, (i) => {
        const x = (-2.2 + i * 2.2 + (r % 2) * 1.1) * k, z = (-1.6 + r * 1.5) * k, h = (0.9 - r * 0.15) * k;
        b.ball([1.8 * k, h, 0.9 * k], [x, 0.45 * k, z], { color: r % 2 ? '#3f8fd0' : '#4f9bd6' })
          .ball([1.0 * k, h * 0.35, 0.5 * k], [x + 0.1 * k, 0.45 * k + h * 0.42, z + 0.12 * k], { color: 'white' });
      }))
      .box([0.12 * k, 1.4 * k, 0.12 * k], [2.2 * k, 1.0 * k, 1.5 * k], { color: 'wood' })
      .wedge([0.9 * k, 1.1 * k, 0.06 * k], [2.65 * k, 1.2 * k, 1.5 * k], { color: 'white', apex: -0.5 })
      .box([1.2 * k, 0.25 * k, 0.5 * k], [2.4 * k, 0.55 * k, 1.5 * k], { color: 'red', round: 0.5 });
    return b.done();
  }),
  e('octagon', 'ideas', 'shapes', () => {
    const b = m('octagon');
    b.box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'wood' })
      .each(4, (i) => b.box([0.1, 0.0414, 0.02], [0, 0.07, 0], { color: 'red', round: 0, rot: [0, 0, i * 45] }))
      .each(4, (i) => b.box([0.08, 0.0331, 0.022], [0, 0.07, 0], { color: 'white', round: 0, rot: [0, 0, i * 45], noInk: true }))
      .each(4, (i) => b.box([0.07, 0.029, 0.024], [0, 0.07, 0], { color: 'red', round: 0, rot: [0, 0, i * 45], noInk: true }));
    return b.done();
  }),
  e('odometer', 'garage', 'car parts', () =>
    m('odometer')
      .box([0.08, 0.02, 0.06], [0, 0.01, 0], { color: 'darkgray' })
      .cyl([0.11, 0.03, 0.11], [0, 0.075, 0], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.09, 0.005, 0.09], [0, 0.075, 0.016], { color: 'white', rot: [90, 0, 0] })
      .box([0.05, 0.014, 0.006], [0, 0.055, 0.019], { color: 'black' })
      .label('012345', [0.045, 0.01], [0, 0.055, 0.022], { color: 'black' })
      .rod([0, 0.075, 0.02], [0.028, 0.095, 0.02], 0.004, 'red')
      .ball(0.008, [0, 0.075, 0.021], { color: 'red' })
      .done(),
  ),
];

void around;
