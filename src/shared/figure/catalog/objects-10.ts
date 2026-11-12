/** Catalog chunk objects-10: the words in assign/objects-10.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M } from '../dsl';
import { hat, held, wear, who } from '../accessories';

type V = [number, number, number];
/** Mannequin / dress-form colour. */
const FORM = '#e3d6c3';
const TERRA = '#c0643a';

/** A tyre seen from the side (vehicles run along z), with a hub. */
function tire(b: M, d: number, w: number, at: V, hub = 'silver', name?: string): M {
  b.torus([d, d, w], at, { color: 'rubber', rot: [0, 90, 0], tube: 0.33, name });
  return b.cyl([d * 0.5, w * 0.85, d * 0.5], at, { color: hub, rot: [0, 0, 90], parent: name });
}
/** Two tyres at +-x on one axle at z. */
function axle(b: M, d: number, w: number, x: number, z: number, hub = 'silver'): M {
  return b.pair((s) => tire(b, d, w, [s * x, d / 2, z], hub));
}

/** A building block with a door (named), a row or two of windows and an optional sign over the door. */
interface BO { w: number; h: number; d: number; wall: string; roof?: 'flat' | 'gable' | 'none'; roofC?: string; sign?: string; signC?: string; doorC?: string; win?: number }
function bldg(key: string, o: BO): M {
  const { w, h, d } = o;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.06 });
  if (o.roof === 'gable') b.wedge([w + 0.4, h * 0.4, d + 0.3], [0, h + h * 0.2, 0], { color: o.roofC ?? 'darkred' });
  else if (o.roof !== 'none') b.box([w + 0.25, 0.25, d + 0.25], [0, h + 0.1, 0], { color: o.roofC ?? 'darkgray', round: 0.1 });
  const dh = Math.min(2.2, h * 0.4), dw = Math.min(1.2, w * 0.2);
  b.box([dw, dh, 0.1], [0, dh / 2, d / 2 + 0.03], { color: o.doorC ?? 'darkwood', round: 0.1, name: 'door', pivot: [-dw / 2, dh / 2, d / 2 + 0.03] });
  const rows = o.win ?? 1;
  for (let r = 0; r < rows; r++) b.pair((s) => b.box([w * 0.18, h * 0.16, 0.08], [s * w * 0.3, h * (0.3 + ((r + 0.5) * 0.55) / rows), d / 2 + 0.02], { color: 'glass', round: 0.15 }));
  if (o.sign) {
    const sh = Math.min(0.9, h * 0.14);
    b.label(o.sign, [w * 0.4, sh], [0, dh + 0.15 + sh / 2, d / 2 + 0.06], { color: o.signC ?? 'cream' });
  }
  return b;
}

/** A little shop: shop window either side of the door, striped awning, big sign on top of the front. */
function shop(key: string, sign: string, wall: string, awn: string, signC = 'white'): M {
  const b = m(key).box([6, 4, 4], [0, 2, 0], { color: wall, round: 0.05 }).box([6.3, 0.3, 4.3], [0, 4.1, 0], { color: 'darkgray', round: 0.1 });
  b.box([1.2, 2.2, 0.1], [0, 1.1, 2.03], { color: 'darkwood', name: 'door', pivot: [-0.6, 1.1, 2.03] });
  b.pair((s) => b.box([1.9, 1.6, 0.08], [s * 1.9, 1.3, 2.02], { color: 'glass', round: 0.1 }));
  b.each(6, (i) => b.box([1.0, 0.08, 1.1], [-2.5 + i, 2.75, 2.4], { color: i % 2 ? 'white' : awn, rot: [28, 0, 0], round: 0.2 }));
  b.label(sign, [4, 0.75], [0, 3.5, 2.05], { color: signC });
  return b;
}

/** A dress form on a stand wearing a top (torso from y 1.1 down by len). */
function form(key: string, top: string, o: { sleeve?: 'short' | 'long' | 'none'; len?: number } = {}): M {
  const b = m(key).cyl([0.34, 0.035, 0.34], [0, 0.0175, 0], { color: 'darkwood' })
    .stick([0, 0.03, 0], [0, 0.62, 0], 0.035, 'darkwood')
    .cyl([0.085, 0.1, 0.085], [0, 1.13, 0], { color: FORM })
    .ball([0.11, 0.05, 0.11], [0, 1.19, 0], { color: 'darkwood' });
  const len = o.len ?? 0.5;
  b.box([0.4, len, 0.24], [0, 1.1 - len / 2, 0], { color: top, round: 0.5 });
  if (o.sleeve === 'short') b.pair((s) => b.rod([s * 0.19, 1.03, 0], [s * 0.25, 0.87, 0], 0.11, top));
  if (o.sleeve === 'long') b.pair((s) => b.rod([s * 0.19, 1.03, 0], [s * 0.27, 0.62, 0], 0.09, top));
  return b;
}

/** A full faceless mannequin wearing an outfit: legs (trousers) or a skirt to the floor. */
interface DO { top: string; legs?: string; skirt?: string; skirtW?: number; sleeve?: 'long' | 'short' | 'none'; arm?: string; shoes?: string }
function dummy(key: string, o: DO): M {
  const b = m(key);
  const arm = o.arm ?? o.top;
  if (o.skirt) b.cyl([o.skirtW ?? 0.7, 0.98, o.skirtW ?? 0.7], [0, 0.49, 0], { color: o.skirt, taper: 0.45 });
  else {
    b.pair((s) => b.rod([s * 0.1, 0.12, 0], [s * 0.1, 0.92, 0], 0.15, o.legs ?? 'navy'));
    b.pair((s) => b.ball([0.12, 0.09, 0.24], [s * 0.1, 0.045, 0.04], { color: o.shoes ?? 'black' }));
  }
  b.box([0.4, 0.2, 0.24], [0, 0.95, 0], { color: o.skirt ?? o.legs ?? 'navy', round: 0.5 });
  b.box([0.44, 0.52, 0.25], [0, 1.24, 0], { color: o.top, round: 0.5 });
  const sl = o.sleeve ?? 'long';
  b.pair((s) => {
    if (sl === 'long') b.rod([s * 0.25, 1.44, 0], [s * 0.3, 0.92, 0], 0.1, arm);
    else if (sl === 'short') b.rod([s * 0.25, 1.44, 0], [s * 0.28, 1.22, 0], 0.11, arm).rod([s * 0.28, 1.22, 0], [s * 0.3, 0.92, 0], 0.085, FORM);
    else b.rod([s * 0.25, 1.44, 0], [s * 0.3, 0.92, 0], 0.085, FORM);
    b.ball(0.09, [s * 0.305, 0.86, 0], { color: FORM });
  });
  b.cyl([0.09, 0.1, 0.09], [0, 1.53, 0], { color: FORM }).ball([0.2, 0.25, 0.21], [0, 1.66, 0], { color: FORM });
  return b;
}

/** A bottle standing at x (body, shoulder, neck, cap, optional label). */
function bottle(b: M, x: number, o: { h: number; d: number; glass: string; cap: string; label?: string; labelC?: string; z?: number }): M {
  const { h, d } = o, z = o.z ?? 0, bh = h * 0.6;
  b.cyl([d, bh, d], [x, bh / 2, z], { color: o.glass })
    .cyl([d, h * 0.14, d], [x, bh + h * 0.07, z], { color: o.glass, taper: 0.4 })
    .cyl([d * 0.4, h * 0.2, d * 0.4], [x, h * 0.84, z], { color: o.glass })
    .cyl([d * 0.46, h * 0.08, d * 0.46], [x, h * 0.96, z], { color: o.cap });
  if (o.label) b.label(o.label, [d * 0.9, bh * 0.5], [x, bh * 0.5, z + d / 2 - 0.004], { color: o.labelC ?? 'white' });
  return b;
}

/** A head form on a little stand (for wigs, hairpieces, veils). Head centre at y 0.24. */
function headForm(key: string): M {
  return m(key).cyl([0.13, 0.03, 0.13], [0, 0.015, 0], { color: 'darkwood' }).cyl([0.07, 0.13, 0.07], [0, 0.09, 0], { color: FORM }).ball([0.17, 0.21, 0.19], [0, 0.24, 0], { color: FORM });
}

/** A flowerpot (terracotta) of diameter d and height h, with soil. */
function pot(b: M, d: number, h: number, color = TERRA): M {
  return b.cyl([d, h, d], [0, h / 2, 0], { color, taper: 1.25 }).cyl([d * 1.3, h * 0.18, d * 1.3], [0, h * 0.95, 0], { color }).cyl([d * 1.15, 0.02, d * 1.15], [0, h * 1.04, 0], { color: 'dirt' });
}

/** A wind turbine: tower from y0 of height h, nacelle, three blades (named fan when `name`). */
function windTurbine(b: M, x: number, z: number, y0: number, h: number, name?: string): M {
  const top = y0 + h, hz = z + h * 0.07, hub = name ? `${name}` : undefined;
  b.cyl([h * 0.06, h, h * 0.06], [x, y0 + h / 2, z], { color: 'white', taper: 0.55 })
    .box([h * 0.06, h * 0.05, h * 0.14], [x, top, z], { color: 'white', round: 0.5 })
    .ball(h * 0.06, [x, top, hz], { color: 'lightgray', name: hub });
  b.each(3, (i) => {
    const a = (i / 3) * Math.PI * 2;
    b.box([h * 0.045, h * 0.38, h * 0.012], [x + Math.sin(a) * h * 0.2, top + Math.cos(a) * h * 0.2, hz + 0.01], { color: 'white', rot: [0, 0, (-a * 180) / Math.PI], parent: hub });
  });
  return b;
}

/** A feathered wing on side s (root at x = ox, spreading toward s), about 3 m tall. */
function wingAt(b: M, s: 1 | -1, ox: number): M {
  const X = (lx: number) => ox + s * lx;
  const boneY = (lx: number) => (lx < 0.8 ? 1.2 + lx * 1.25 : 2.2 + (lx - 0.8) * 0.83);
  b.rod([X(0), 1.2, 0], [X(0.8), 2.2, 0], 0.3, 'white').rod([X(0.8), 2.2, 0], [X(1.7), 2.95, 0], 0.25, 'white');
  for (const lx of [0.3, 0.9, 1.4]) b.ball([0.7, 0.55, 0.5], [X(lx), boneY(lx) - 0.15, 0.0], { color: 'cream' });
  for (let i = 0; i < 6; i++) {
    const lx = 0.2 + i * 0.3, py = boneY(lx), th = 8 + i * 9, L = 1.1 + i * 0.12, r = (th * Math.PI) / 180;
    b.ball([0.3, L, 0.1], [X(lx + Math.sin(r) * L * 0.45), py - Math.cos(r) * L * 0.45, -0.02 - (i % 2) * 0.05], { color: i % 2 ? 'white' : '#c9d6ea', rot: [0, 0, s * th] });
  }
  return b;
}

export const ENTRIES: CatalogEntry[] = [
  e('toadstool', 'garden', 'mushrooms', () => {
    const b = m('toadstool').cyl([0.035, 0.09, 0.035], [0, 0.045, 0], { color: 'cream', taper: 0.8 })
      .torus([0.045, 0.045, 0.012], [0, 0.06, 0], { color: 'white', rot: [90, 0, 0], tube: 0.35 })
      .ball([0.14, 0.075, 0.14], [0, 0.1, 0], { color: 'red' })
      .ball([0.022, 0.01, 0.022], [0, 0.137, 0], { color: 'white', noInk: true });
    for (const [x, z] of around(6, 0.045)) b.ball([0.02, 0.012, 0.02], [x, 0.128, z], { color: 'white', noInk: true });
    return b.done();
  }),
  e('toast', 'food', 'bread', () => {
    const b = m('toast').box([0.12, 0.09, 0.016], [0, 0.045, 0], { color: '#9a5a22', round: 0.3 })
      .box([0.104, 0.078, 0.004], [0, 0.047, 0.008], { color: '#e0a24e', round: 0.3, noInk: true })
      .box([0.035, 0.028, 0.008], [0.01, 0.055, 0.012], { color: 'yellow', rot: [0, 0, 15] });
    b.pair((s) => b.ball([0.07, 0.05, 0.016], [s * 0.027, 0.09, 0], { color: '#9a5a22' }).ball([0.058, 0.038, 0.004], [s * 0.027, 0.088, 0.008], { color: '#e0a24e', noInk: true }));
    return b.done();
  }),
  e('toaster', 'kitchen', 'appliances', () => {
    const b = m('toaster').box([0.28, 0.18, 0.16], [0, 0.1, 0], { color: 'silver', round: 0.5 }).box([0.3, 0.02, 0.17], [0, 0.01, 0], { color: 'black', round: 0.3 });
    b.pair((s) => b.box([0.2, 0.012, 0.028], [0, 0.19, s * 0.035], { color: 'darkgray', round: 0.3 }).box([0.13, 0.07, 0.014], [0, 0.205, s * 0.035], { color: '#d9a050', round: 0.4 }));
    return b.box([0.012, 0.03, 0.04], [0.145, 0.13, 0.03], { color: 'black' }).cyl([0.03, 0.012, 0.03], [0.142, 0.07, 0], { color: 'black', rot: [0, 0, 90] }).done();
  }),
  e('toaster pastry', 'food', 'snacks', () => {
    const b = m('toaster pastry').box([0.08, 0.11, 0.014], [0, 0.055, 0], { color: '#dcae6c', round: 0.3 }).box([0.064, 0.09, 0.004], [0, 0.056, 0.008], { color: 'pink', round: 0.4 });
    const sp: Array<[number, number, string]> = [[-0.02, 0.08, 'red'], [0.015, 0.09, 'yellow'], [0.02, 0.06, 'blue'], [-0.015, 0.05, 'lime'], [0.005, 0.03, 'purple'], [-0.02, 0.025, 'orange'], [0.02, 0.025, 'white']];
    sp.forEach(([x, y, c], i) => b.box([0.012, 0.004, 0.004], [x, y, 0.011], { color: c, noInk: true, rot: [0, 0, i * 47] }));
    return b.done();
  }),
  e('toe', 'clinic', 'body parts', () => {
    const b = m('toe').ball([0.12, 0.04, 0.08], [-0.005, 0.02, -0.03], { color: 'skin2' })
      .ball([0.042, 0.042, 0.05], [0.036, 0.021, 0.025], { color: 'skin2' })
      .ball([0.028, 0.01, 0.024], [0.036, 0.04, 0.036], { color: '#f6d6cc' });
    [[0.003, 0.03], [-0.023, 0.027], [-0.045, 0.024], [-0.063, 0.02]].forEach(([x, s]) => b.ball([s, s, s * 1.2], [x, s * 0.5, 0.018], { color: 'skin2' }).ball([s * 0.6, s * 0.25, s * 0.5], [x, s * 0.95, s * 0.5 + 0.02], { color: '#f6d6cc' }));
    return b.done();
  }),
  e('toenail', 'clinic', 'body parts', () =>
    m('toenail').capsule([0.046, 0.08, 0.042], [0, 0.04, 0], { color: 'skin2' }).ball([0.038, 0.036, 0.014], [0, 0.066, 0.017], { color: 'red', rot: [-15, 0, 0] }).ball([0.06, 0.02, 0.05], [0, 0.008, -0.004], { color: 'skin2' }).done(),
  ),
  e('toffee', 'food', 'sweets', () => {
    const b = m('toffee').ball([0.05, 0.032, 0.032], [0, 0.016, 0.02], { color: 'gold' });
    b.pair((s) => b.cone([0.03, 0.025, 0.026], [s * 0.035, 0.016, 0.02], { color: 'gold', rot: [0, 0, s * 90] }));
    return b.box([0.03, 0.022, 0.03], [-0.016, 0.011, -0.03], { color: '#a0612a', round: 0.3 }).box([0.03, 0.022, 0.03], [0.02, 0.011, -0.026], { color: '#a0612a', round: 0.3, rot: [0, 20, 0] }).box([0.03, 0.022, 0.03], [0.002, 0.033, -0.028], { color: '#b8733a', round: 0.3, rot: [0, 40, 0] }).done();
  }),
  e('tofu', 'food', 'ingredients', () =>
    m('tofu').cyl([0.17, 0.012, 0.17], [0, 0.006, 0], { color: '#3b3b4a' })
      .box([0.09, 0.065, 0.075], [-0.01, 0.0445, -0.01], { color: '#f4efdc', round: 0.12 })
      .box([0.09, 0.065, 0.018], [-0.01, 0.044, 0.05], { color: '#f4efdc', round: 0.12, rot: [-12, 0, 0] })
      .cyl([0.01, 0.006, 0.01], [-0.02, 0.08, -0.01], { color: 'lime', noInk: true })
      .cyl([0.01, 0.006, 0.01], [0.005, 0.08, -0.02], { color: 'lime', noInk: true })
      .cyl([0.01, 0.006, 0.01], [-0.03, 0.08, -0.03], { color: 'green', noInk: true })
      .done(),
  ),
  e('toga', 'wardrobe', 'clothes', () =>
    dummy('toga', { top: 'white', skirt: 'white', skirtW: 0.62, sleeve: 'none' })
      .rod([0.2, 1.47, 0.08], [-0.22, 0.98, 0.13], 0.09, '#f3eee0')
      .rod([0.2, 1.47, -0.08], [-0.22, 0.98, -0.13], 0.09, '#f3eee0')
      .rod([0.22, 1.42, 0.13], [-0.2, 0.93, 0.15], 0.03, 'purple', { noInk: true })
      .ball(0.06, [0.21, 1.47, 0.1], { color: 'gold' })
      .done(),
  ),
  e('toilet', 'home', 'bathroom', () =>
    m('toilet').cyl([0.22, 0.28, 0.3], [0, 0.14, 0.05], { color: 'white', taper: 1.3 })
      .ball([0.38, 0.22, 0.5], [0, 0.33, 0.1], { color: 'white' })
      .torus([0.38, 0.48, 0.035], [0, 0.42, 0.1], { color: 'white', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.38, 0.03, 0.46], [0, 0.45, 0.1], { color: 'white', name: 'lid', pivot: [0, 0.45, -0.12] })
      .box([0.42, 0.36, 0.18], [0, 0.62, -0.2], { color: 'white', round: 0.2 })
      .box([0.44, 0.04, 0.2], [0, 0.81, -0.2], { color: 'white', round: 0.4 })
      .box([0.05, 0.015, 0.02], [0.15, 0.74, -0.105], { color: 'silver' })
      .done(),
  ),
  e('toilet paper', 'home', 'bathroom', () =>
    m('toilet paper').cyl([0.11, 0.1, 0.11], [0, 0.055, 0], { color: 'white', rot: [0, 0, 90] })
      .cyl([0.04, 0.102, 0.04], [0, 0.055, 0], { color: '#b08a5a', rot: [0, 0, 90] })
      .box([0.098, 0.05, 0.004], [0, 0.03, 0.054], { color: 'white', round: 0.1 })
      .box([0.098, 0.004, 0.09], [0, 0.002, 0.1], { color: 'white', round: 0.1 })
      .box([0.098, 0.001, 0.002], [0, 0.005, 0.09], { color: 'lightgray', noInk: true })
      .done(),
  ),
  e('toilet roll tube', 'home', 'bathroom', () =>
    m('toilet roll tube').cyl([0.045, 0.1, 0.045], [0, 0.05, 0], { color: '#c39a6b' })
      .cyl([0.036, 0.004, 0.036], [0, 0.1, 0], { color: '#5c3d20', noInk: true })
      .torus([0.046, 0.046, 0.006], [0, 0.1, 0], { color: '#a87f50', rot: [90, 0, 0], tube: 0.12 })
      .stick([-0.02, 0.01, 0.012], [0.02, 0.09, 0.012], 0.003, '#a87f50', { noInk: true })
      .done(),
  ),
  e('toilet seat', 'home', 'bathroom', () =>
    m('toilet seat').torus([0.38, 0.46, 0.055], [0, 0.03, 0.03], { color: 'white', rot: [90, 0, 0], tube: 0.24 })
      .box([0.3, 0.03, 0.04], [0, 0.03, -0.2], { color: 'silver' })
      .cyl([0.34, 0.03, 0.38], [0, 0.2, -0.31], { color: 'white', rot: [60, 0, 0] })
      .done(),
  ),
  e('toilet seat cover', 'home', 'bathroom', () =>
    m('toilet seat cover').torus([0.38, 0.46, 0.04], [0, 0.025, 0.03], { color: 'white', rot: [90, 0, 0], tube: 0.22 })
      .ball([0.39, 0.06, 0.47], [0, 0.06, 0.03], { color: 'pink' })
      .torus([0.3, 0.37, 0.02], [0, 0.085, 0.03], { color: '#f7b6cf', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .box([0.3, 0.03, 0.04], [0, 0.03, -0.21], { color: 'silver' })
      .done(),
  ),
  e('toiletbrush', 'home', 'bathroom', () =>
    m('toiletbrush').cyl([0.11, 0.15, 0.11], [0, 0.075, 0], { color: 'white', taper: 0.85 })
      .torus([0.1, 0.1, 0.015], [0, 0.15, 0], { color: 'lightgray', rot: [90, 0, 0] })
      .ball([0.08, 0.05, 0.08], [0, 0.16, 0], { color: 'gray' })
      .stick([0, 0.17, 0], [0, 0.36, 0], 0.018, 'white')
      .ball(0.03, [0, 0.365, 0], { color: 'skyblue' })
      .done(),
  ),
  e('toll booth', 'places', 'roadside', () => {
    const b = m('toll booth').box([5, 0.25, 3], [0, 0.125, 0], { color: 'gray' })
      .box([1.6, 2.3, 1.4], [0, 1.4, 0], { color: 'white' })
      .box([1.3, 0.9, 0.06], [0, 1.65, 0.72], { color: 'glass' })
      .box([0.06, 0.9, 1.0], [0.82, 1.65, 0], { color: 'glass' })
      .box([1.7, 0.25, 1.5], [0, 2.65, 0], { color: 'red' })
      .box([5.2, 0.35, 3.4], [0, 3.8, 0], { color: 'navy' })
      .label('TOLL', [2, 0.5], [0, 3.8, 1.72], { color: 'yellow' })
      .box([0.3, 1.0, 0.3], [1.2, 0.75, 1.1], { color: 'yellow' });
    b.pair((s) => b.stick([s * 2.3, 0.25, -1.2], [s * 2.3, 3.65, -1.2], 0.25, 'lightgray'));
    b.each(4, (i) => b.stick([1.3 + i * 0.6, 1.15, 1.1], [1.9 + i * 0.6, 1.15, 1.1], 0.1, i % 2 ? 'white' : 'red'));
    return b.done();
  }),
  e('tomahawk', 'armory', 'axes', () =>
    m('tomahawk', { view: 'side' }).stick([0, 0, 0], [0, 0.6, 0], 0.035, 'wood')
      .box([0.045, 0.055, 0.11], [0, 0.55, 0.05], { color: 'steel', round: 0.2 })
      .box([0.025, 0.14, 0.05], [0, 0.55, 0.12], { color: 'steel', round: 0.45 })
      .cone([0.025, 0.06, 0.025], [0, 0.55, -0.04], { color: 'steel', rot: [-90, 0, 0] })
      .cyl([0.046, 0.12, 0.046], [0, 0.09, 0], { color: 'leather' })
      .rod([0, 0.42, -0.016], [0, 0.34, -0.03], 0.006, 'brown')
      .ball([0.012, 0.07, 0.01], [0, 0.3, -0.035], { color: 'white' })
      .ball([0.012, 0.06, 0.01], [0.012, 0.31, -0.03], { color: 'red' })
      .done(),
  ),
  e('tomato', 'food', 'vegetables', () => {
    const b = m('tomato').ball([0.09, 0.075, 0.09], [0, 0.0375, 0], { color: 'tomato' });
    for (const [x, z] of around(5, 0.024)) b.rod([0, 0.075, 0], [x, 0.071, z], 0.009, 'leaf');
    return b.stick([0, 0.07, 0], [0.004, 0.09, 0], 0.007, 'green').done();
  }),
  e('tomato juice', 'food', 'drinks', () =>
    m('tomato juice').cyl([0.072, 0.12, 0.072], [0, 0.06, 0], { color: 'tomato', taper: 1.1 })
      .cyl([0.079, 0.035, 0.079], [0, 0.1375, 0], { color: 'glass', taper: 1.05 })
      .stick([0.01, 0.06, 0], [0.028, 0.2, 0.01], 0.014, 'lime')
      .ball([0.035, 0.028, 0.03], [0.03, 0.205, 0.01], { color: 'leaf' })
      .done(),
  ),
  e('tomato plant', 'garden', 'vegetable plants', () => {
    const b = pot(m('tomato plant'), 0.3, 0.28).stick([0.05, 0.2, -0.05], [0.05, 1.3, -0.05], 0.025, 'wood');
    b.rod([0, 0.29, 0], [-0.03, 0.6, 0.02], 0.025, 'green').rod([-0.03, 0.6, 0.02], [0.03, 0.9, 0], 0.022, 'green').rod([0.03, 0.9, 0], [-0.02, 1.15, 0.02], 0.02, 'green')
      .rod([-0.03, 0.6, 0.02], [-0.22, 0.75, 0.05], 0.018, 'green').rod([0.03, 0.9, 0], [0.22, 1.0, 0.05], 0.018, 'green');
    b.ball([0.24, 0.13, 0.18], [-0.22, 0.78, 0.04], { color: 'leaf' }).ball([0.24, 0.13, 0.18], [0.22, 1.03, 0.04], { color: 'leaf' }).ball([0.22, 0.16, 0.18], [-0.02, 1.2, 0.02], { color: 'leaf' }).ball([0.2, 0.12, 0.16], [0.08, 0.6, 0.0], { color: 'darkgreen' });
    for (const [x, y, z] of [[-0.2, 0.68, 0.1], [-0.12, 0.66, 0.12], [0.2, 0.92, 0.1], [0.08, 0.5, 0.1], [0.0, 1.08, 0.1]] as V[]) b.ball(0.065, [x, y, z], { color: 'tomato' });
    return b.done();
  }),
  e('tomb', 'places', 'graveyard', () => {
    const b = m('tomb').box([3.2, 0.3, 2.6], [0, 0.15, 0], { color: 'stone' })
      .box([2.6, 1.6, 2.0], [0, 1.1, -0.1], { color: 'lightgray' })
      .box([0.8, 1.2, 0.08], [0, 0.9, 0.92], { color: 'darkgray', name: 'door', pivot: [-0.4, 0.9, 0.92] })
      .box([3.0, 0.2, 2.4], [0, 2.0, 0], { color: 'stone' })
      .wedge([3.0, 0.6, 2.4], [0, 2.4, 0], { color: 'lightgray' })
      .label('RIP', [1.0, 0.3], [0, 1.72, 0.95], { color: 'stone' });
    b.pair((s) => b.cyl([0.3, 1.6, 0.3], [s * 1.05, 1.1, 0.95], { color: 'white' }));
    return b.done();
  }),
  e('tommy gun', 'armory', 'guns', () =>
    m('tommy gun', { view: 'side' }).box([0.075, 0.09, 0.3], [0, 0.2, 0], { color: 'darkgray' })
      .cyl([0.03, 0.36, 0.03], [0, 0.21, 0.32], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.05, 0.16, 0.05], [0, 0.21, 0.22], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.04, 0.05, 0.04], [0, 0.21, 0.5], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.2, 0.05, 0.2], [0, 0.1, 0.06], { color: 'darkgray', rot: [0, 0, 90] })
      .box([0.04, 0.1, 0.04], [0, 0.14, 0.24], { color: 'wood', rot: [-10, 0, 0] })
      .box([0.035, 0.11, 0.045], [0, 0.13, -0.1], { color: 'wood', rot: [15, 0, 0] })
      .box([0.04, 0.08, 0.28], [0, 0.17, -0.29], { color: 'wood', rot: [-8, 0, 0] })
      .box([0.045, 0.13, 0.04], [0, 0.15, -0.43], { color: 'darkwood' })
      .done(),
  ),
  e('tongs', 'kitchen', 'utensils', () => {
    const b = m('tongs').torus([0.05, 0.05, 0.026], [0, 0.262, 0], { color: 'silver', tube: 0.3 });
    b.pair((s) => b.rod([s * 0.006, 0.25, 0], [s * 0.03, 0.02, 0], 0.012, 'silver').rod([s * 0.009, 0.23, 0], [s * 0.017, 0.15, 0], 0.017, 'black').box([0.012, 0.035, 0.03], [s * 0.032, 0.018, 0], { color: 'silver', rot: [0, 0, s * -6] }));
    return b.done();
  }),
  e('tongue', 'clinic', 'body parts', () =>
    m('tongue').ball([0.1, 0.05, 0.04], [0, 0.08, 0], { color: '#5a1a1a' })
      .ball([0.115, 0.03, 0.045], [0, 0.102, 0.01], { color: '#d9455a' })
      .ball([0.105, 0.028, 0.045], [0, 0.058, 0.01], { color: '#d9455a' })
      .ball([0.062, 0.078, 0.032], [0, 0.042, 0.03], { color: '#f07a8a', rot: [20, 0, 0] })
      .stick([0, 0.066, 0.045], [0, 0.022, 0.052], 0.004, '#d05a6a', { noInk: true })
      .done(),
  ),
  e('tonic', 'food', 'drinks', () =>
    bottle(m('tonic'), -0.04, { h: 0.25, d: 0.07, glass: '#7fbf8f', cap: 'gold', label: 'TONIC', labelC: 'white' })
      .cyl([0.07, 0.1, 0.07], [0.05, 0.05, 0.04], { color: 'glass' })
      .cyl([0.045, 0.01, 0.045], [0.065, 0.1, 0.04], { color: 'lime', rot: [90, 0, 0] })
      .done(),
  ),
  e('toolbox', 'workshop', 'tool storage', () => {
    const b = m('toolbox').box([0.45, 0.2, 0.22], [0, 0.1, 0], { color: 'red', round: 0.15 })
      .box([0.46, 0.06, 0.23], [0, 0.23, 0], { color: 'darkred', round: 0.2, name: 'lid', pivot: [0, 0.2, -0.115] })
      .stick([-0.13, 0.31, 0], [0.13, 0.31, 0], 0.03, 'black', { parent: 'lid' });
    b.pair((s) => b.stick([s * 0.12, 0.26, 0], [s * 0.12, 0.31, 0], 0.02, 'black', { parent: 'lid' }).box([0.04, 0.05, 0.02], [s * 0.15, 0.2, 0.115], { color: 'silver' }));
    return b.done();
  }),
  e('tooth', 'clinic', 'dental', () => {
    const b = m('tooth').box([0.075, 0.055, 0.065], [0, 0.07, 0], { color: 'white', round: 0.8 });
    b.pair((s) => b.ball([0.035, 0.03, 0.035], [s * 0.018, 0.095, 0], { color: 'white' }).cone([0.03, 0.06, 0.035], [s * 0.02, 0.03, 0], { color: 'white', rot: [180, 0, s * -10] }));
    return b.done();
  }),
  e('toothbrush', 'home', 'bathroom', () =>
    m('toothbrush').capsule([0.022, 0.15, 0.014], [-0.03, 0.012, 0], { color: 'skyblue', rot: [0, 0, 90] })
      .box([0.05, 0.01, 0.018], [0.075, 0.012, 0], { color: 'skyblue', round: 0.5 })
      .box([0.045, 0.022, 0.016], [0.075, 0.028, 0], { color: 'white', round: 0.2 })
      .capsule([0.018, 0.05, 0.016], [0.075, 0.047, 0], { color: 'white', rot: [0, 0, 90] })
      .capsule([0.008, 0.045, 0.017], [0.075, 0.05, 0], { color: 'teal', rot: [0, 0, 90], noInk: true })
      .done(),
  ),
  e('toothpaste', 'home', 'bathroom', () =>
    m('toothpaste').cyl([0.026, 0.02, 0.026], [0, 0.01, 0], { color: 'red' })
      .cyl([0.026, 0.02, 0.026], [0, 0.03, 0], { color: 'white', taper: 1.9 })
      .box([0.05, 0.12, 0.034], [0, 0.1, 0], { color: 'white', round: 0.6 })
      .box([0.051, 0.05, 0.035], [0, 0.1, 0], { color: 'blue', round: 0.6 })
      .box([0.056, 0.014, 0.008], [0, 0.165, 0], { color: 'silver' })
      .done(),
  ),
  e('toothpick', 'kitchen', 'utensils', () => {
    const b = m('toothpick').cyl([0.04, 0.05, 0.04], [0, 0.025, 0], { color: 'teal' }).cyl([0.032, 0.002, 0.032], [0, 0.05, 0], { color: '#1a4a4a', noInk: true });
    for (const [x, z] of [...around(6, 0.009), [0, 0] as [number, number]]) b.stick([x, 0.03, z], [x * 2.6, 0.095, z * 2.6], 0.003, '#e8d2a0');
    return b.done();
  }),
  e('top hat', 'wardrobe', 'hats', () =>
    m('top hat').cyl([0.3, 0.012, 0.26], [0, 0.006, 0], { color: 'black' })
      .cyl([0.17, 0.17, 0.15], [0, 0.097, 0], { color: 'black', taper: 1.08 })
      .cyl([0.174, 0.035, 0.154], [0, 0.03, 0], { color: 'darkred' })
      .done(),
  ),
  e('torch', 'tech', 'gadgets', () =>
    m('torch').cyl([0.04, 0.2, 0.04], [0, 0.1, 0], { color: 'yellow' })
      .cyl([0.043, 0.05, 0.043], [0, 0.03, 0], { color: 'black' })
      .cyl([0.04, 0.06, 0.04], [0, 0.23, 0], { color: 'black', taper: 1.8 })
      .cyl([0.076, 0.03, 0.076], [0, 0.27, 0], { color: 'black' })
      .cyl([0.064, 0.008, 0.064], [0, 0.286, 0], { color: '#fff7c0', glow: true })
      .box([0.015, 0.025, 0.01], [0, 0.14, 0.021], { color: 'black' })
      .done(),
  ),
  e('torpedo', 'armory', 'military', () => {
    const b = m('torpedo', { view: 'side' }).cyl([0.53, 3.6, 0.53], [0, 1.05, 0.2], { color: 'steel', rot: [90, 0, 0] })
      .ball([0.53, 0.53, 0.8], [0, 1.05, 2.0], { color: 'darkgray' })
      .cyl([0.53, 0.7, 0.53], [0, 1.05, -1.95], { color: 'steel', taper: 0.35, rot: [-90, 0, 0] })
      .cyl([0.54, 0.12, 0.54], [0, 1.05, 1.3], { color: 'red', rot: [90, 0, 0] })
      .box([0.03, 0.55, 0.25], [0, 1.05, -2.15], { color: 'darkgray' })
      .box([0.55, 0.03, 0.25], [0, 1.05, -2.15], { color: 'darkgray' })
      .cyl([0.1, 0.12, 0.1], [0, 1.05, -2.36], { color: 'brass', rot: [90, 0, 0], name: 'fan' })
      .box([0.07, 0.5, 0.03], [0, 1.05, -2.38], { color: 'brass', parent: 'fan' })
      .box([0.5, 0.07, 0.03], [0, 1.05, -2.38], { color: 'brass', parent: 'fan' });
    b.pair((s) => b.box([0.7, 0.8, 0.2], [0, 0.4, s * 1.0], { color: 'darkwood' }));
    return b.done();
  }),
  e('tortilla', 'food', 'bread', () => {
    const b = m('tortilla').cyl([0.232, 0.03, 0.232], [0, 0.017, 0], { color: '#efd9a6' });
    b.each(4, (i) => b.cyl([0.242 - (i % 2) * 0.006, 0.005, 0.242 - (i % 2) * 0.006], [(i % 2 ? 0.004 : -0.004), 0.004 + i * 0.0085, 0], { color: '#e6cc92' }));
    for (const [x, z] of around(7, 0.065)) b.cyl([0.02, 0.002, 0.016], [x, 0.0335, z], { color: '#b8864a', noInk: true });
    return b.cyl([0.016, 0.002, 0.02], [0.01, 0.0335, -0.01], { color: '#b8864a', noInk: true }).done();
  }),
  e('tote bag', 'wardrobe', 'bags', () => {
    const b = m('tote bag').box([0.36, 0.38, 0.08], [0, 0.19, 0], { color: 'beige', round: 0.15 }).heart(0.12, [0, 0.2, 0.042], { color: 'red', noInk: true });
    b.pair((s) => b.torus([0.18, 0.26, 0.015], [0, 0.39, s * 0.028], { color: 'beige', tube: 0.12 }));
    return b.done();
  }),
  e('toupee', 'wardrobe', 'hairpieces', () =>
    headForm('toupee').ball([0.15, 0.06, 0.17], [0, 0.335, -0.005], { color: 'brown' }).ball([0.07, 0.035, 0.06], [0.03, 0.35, 0.07], { color: 'brown', rot: [0, 0, -20] }).done(),
  ),
  e('tow truck', 'garage', 'trucks', () => {
    const b = m('tow truck', { view: 'side' }).box([2.2, 0.4, 6.5], [0, 0.75, 0], { color: 'darkgray' })
      .box([2.3, 1.7, 2.0], [0, 1.6, 2.1], { color: 'yellow', round: 0.25 })
      .box([2.2, 1.0, 1.1], [0, 1.25, 3.4], { color: 'yellow', round: 0.3 })
      .box([2.32, 0.6, 1.3], [0, 2.0, 2.3], { color: 'glass', round: 0.2 })
      .box([1.6, 0.15, 0.3], [0, 2.53, 2.1], { color: 'orange', glow: true })
      .box([2.2, 0.5, 3.6], [0, 1.2, -1.3], { color: 'orange', round: 0.1 })
      .rod([0, 1.5, -0.8], [0, 2.8, -2.6], 0.25, 'red')
      .stick([0, 2.8, -2.6], [0, 1.2, -3.0], 0.04, 'black')
      .torus([0.25, 0.3, 0.06], [0, 1.05, -3.0], { color: 'steel', rot: [0, 90, 0] });
    b.pair((s) => b.ball([0.25, 0.25, 0.08], [s * 0.8, 1.4, 3.95], { color: 'yellow', glow: true }));
    axle(b, 1.0, 0.35, 1.0, 2.6);
    axle(b, 1.0, 0.35, 1.0, -1.0);
    axle(b, 1.0, 0.35, 1.0, -2.2);
    return b.done();
  }),
  e('towel', 'home', 'bathroom', () => {
    const b = m('towel');
    ['skyblue', 'pink', 'white', 'yellow'].forEach((c, i) => b.box([0.42, 0.11, 0.3], [0, 0.055 + i * 0.115, 0], { color: c, round: 0.5, rot: [0, i * 4 - 6, 0] }).box([0.425, 0.02, 0.305], [0, 0.085 + i * 0.115, 0], { color: i === 2 ? 'navy' : 'white', round: 0.5, rot: [0, i * 4 - 6, 0], noInk: true }));
    return b.done();
  }),
  e('towel rack', 'home', 'bathroom', () => {
    const b = m('towel rack').stick([-0.35, 0.95, 0], [0.35, 0.95, 0], 0.025, 'silver').stick([-0.35, 0.55, 0], [0.35, 0.55, 0], 0.025, 'silver')
      .capsule([0.09, 0.5, 0.09], [0, 0.955, 0], { color: 'teal', rot: [0, 0, 90] })
      .box([0.5, 0.42, 0.08], [0, 0.76, 0], { color: 'teal', round: 0.3 })
      .box([0.505, 0.04, 0.082], [0, 0.62, 0], { color: 'white', noInk: true });
    b.pair((s) => b.stick([s * 0.35, 0, 0], [s * 0.35, 1.0, 0], 0.03, 'silver').stick([s * 0.35, 0.015, -0.15], [s * 0.35, 0.015, 0.15], 0.03, 'silver'));
    return b.done();
  }),
  e('tower', 'places', 'landmarks', () => {
    const b = m('tower').cyl([3, 8, 3], [0, 4, 0], { color: 'stone' }).cyl([3.6, 0.6, 3.6], [0, 8.3, 0], { color: 'rock' })
      .box([1.0, 1.8, 0.1], [0, 0.9, 1.48], { color: 'darkwood', name: 'door', pivot: [-0.5, 0.9, 1.48] })
      .box([0.5, 0.9, 0.1], [0, 3.5, 1.48], { color: 'darkgray' }).box([0.5, 0.9, 0.1], [0, 5.8, 1.48], { color: 'darkgray' })
      .stick([0, 8.6, 0], [0, 10.2, 0], 0.08, 'darkgray').box([1.0, 0.6, 0.04], [0.52, 9.85, 0], { color: 'red' });
    for (const [x, z] of around(8, 1.6, Math.PI / 8)) b.box([0.6, 0.6, 0.6], [x, 8.9, z], { color: 'rock', rot: [0, (-Math.atan2(z, x) * 180) / Math.PI, 0] });
    return b.done();
  }),
  e('town hall', 'places', 'civic buildings', () => {
    const b = m('town hall').box([10, 5, 5], [0, 2.5, 0], { color: 'cream', round: 0.04 })
      .box([10.3, 0.3, 5.3], [0, 5.1, 0], { color: 'stone' })
      .box([9, 0.3, 2.4], [0, 0.15, 3.0], { color: 'stone' })
      .box([8, 0.5, 1.8], [0, 4.55, 3.2], { color: 'white' })
      .wedge([8, 1.2, 1.8], [0, 5.4, 3.2], { color: 'white' })
      .label('TOWN HALL', [4.4, 0.42], [0, 4.55, 4.12], { color: 'navy' })
      .box([1.4, 2.6, 0.1], [0, 1.6, 2.53], { color: 'darkwood', name: 'door', pivot: [-0.7, 1.6, 2.53] })
      .box([2.6, 3, 2.6], [0, 6.6, -0.5], { color: 'cream' })
      .ball([2.7, 2.2, 2.7], [0, 8.2, -0.5], { color: 'teal' })
      .cyl([1.5, 0.1, 1.5], [0, 6.7, 0.82], { color: 'white', rot: [90, 0, 0] })
      .stick([0, 6.7, 0.88], [0, 7.2, 0.88], 0.08, 'black').stick([0, 6.7, 0.88], [0.35, 6.7, 0.88], 0.08, 'black')
      .stick([0, 9.2, -0.5], [0, 10.4, -0.5], 0.07, 'darkgray').box([0.9, 0.55, 0.04], [0.47, 10.1, -0.5], { color: 'red' });
    b.each(4, (i) => b.cyl([0.45, 4.0, 0.45], [-3 + i * 2, 2.3, 3.6], { color: 'white' }));
    b.pair((s) => b.box([1.0, 1.2, 0.08], [s * 4.2, 1.8, 2.52], { color: 'glass' }).box([1.0, 1.2, 0.08], [s * 4.2, 3.6, 2.52], { color: 'glass' }));
    return b.done();
  }),
  e('townhouse', 'places', 'houses', () => {
    const b = m('townhouse').wedge([6.4, 1.8, 6.9], [0, 7.9, 0], { color: 'darkgray', rot: [0, 90, 0] });
    ['#c0504d', '#e8c87a', '#6f9fc6'].forEach((c, i) => {
      const x = (i - 1) * 2.2;
      b.box([2.2, 7, 6], [x, 3.5, 0], { color: c, round: 0.02 }).box([2.25, 0.2, 6.1], [x, 6.9, 0], { color: 'white' })
        .box([0.9, 0.5, 0.8], [x - 0.45, 0.25, 3.3], { color: 'stone' })
        .box([0.8, 1.9, 0.08], [x - 0.45, 1.45, 3.02], { color: i === 1 ? 'darkgreen' : 'navy', name: i === 1 ? 'door' : undefined, pivot: i === 1 ? [x - 0.85, 1.45, 3.02] : undefined })
        .box([0.6, 1.0, 0.08], [x + 0.55, 1.7, 3.02], { color: 'glass' })
        .box([0.6, 1.1, 0.08], [x - 0.45, 3.9, 3.02], { color: 'glass' }).box([0.6, 1.1, 0.08], [x + 0.55, 3.9, 3.02], { color: 'glass' })
        .box([0.6, 1.0, 0.08], [x - 0.45, 5.7, 3.02], { color: 'glass' }).box([0.6, 1.0, 0.08], [x + 0.55, 5.7, 3.02], { color: 'glass' });
    });
    return b.done();
  }),
  e('toy chest', 'toys', 'toy boxes', () => {
    const b = m('toy chest').box([0.8, 0.45, 0.45], [0, 0.27, 0], { color: 'skyblue', round: 0.1 })
      .box([0.82, 0.1, 0.47], [0, 0.52, 0], { color: 'red', round: 0.3, name: 'lid', pivot: [0, 0.5, -0.23] })
      .label('ABC', [0.42, 0.16], [0, 0.29, 0.23], { color: 'yellow' })
      .star(0.1, [0.3, 0.29, 0.23], { color: 'gold', noInk: true }).star(0.1, [-0.3, 0.29, 0.23], { color: 'gold', noInk: true });
    for (const [x, z] of [[0.35, 0.18], [-0.35, 0.18], [0.35, -0.18], [-0.35, -0.18]]) b.ball(0.07, [x, 0.035, z], { color: 'yellow' });
    return b.done();
  }),
  e('toy store', 'places', 'shops', () => {
    const b = shop('toy store', 'TOYS', 'yellow', 'red')
      .ball(1.5, [0, 5.0, 0], { color: 'brown' }).ball([0.7, 0.55, 0.4], [0, 4.8, 0.65], { color: 'tan' }).ball(0.2, [0, 4.95, 0.85], { color: 'black' });
    b.pair((s) => b.ball(0.55, [s * 0.6, 5.65, 0], { color: 'brown' }).ball(0.16, [s * 0.32, 5.25, 0.68], { color: 'black' }).box([0.5, 0.5, 0.5], [s * 1.9, 0.75, 1.7], { color: s > 0 ? 'blue' : 'green' }).ball(0.5, [s * 1.6, 0.75, 1.6], { color: 'red' }));
    return b.done();
  }),
  e('tracksuit', 'wardrobe', 'sportswear', () => {
    const b = dummy('tracksuit', { top: 'blue', legs: 'blue', shoes: 'white' })
      .stick([0, 1.0, 0.128], [0, 1.48, 0.128], 0.015, 'white', { noInk: true })
      .torus([0.2, 0.08, 0.1], [0, 1.5, 0], { color: 'blue', rot: [90, 0, 0] });
    b.pair((s) => b.rod([s * 0.3, 1.43, 0], [s * 0.35, 0.94, 0], 0.025, 'white', { noInk: true }).rod([s * 0.175, 0.95, 0], [s * 0.175, 0.15, 0], 0.025, 'white', { noInk: true }));
    return b.done();
  }),
  e('tractor', 'garage', 'farm vehicles', () => {
    const b = m('tractor', { view: 'side' }).box([1.2, 0.9, 2.2], [0, 1.15, 0.6], { color: 'green', round: 0.2 })
      .box([1.4, 0.6, 1.3], [0, 1.2, -0.75], { color: 'green', round: 0.1 })
      .box([1.4, 1.2, 1.3], [0, 2.1, -0.75], { color: 'glass', round: 0.1 })
      .box([1.55, 0.14, 1.45], [0, 2.75, -0.75], { color: 'green', round: 0.3 })
      .box([1.0, 0.7, 0.1], [0, 1.15, 1.72], { color: 'darkgray' })
      .stick([0.3, 1.55, 1.2], [0.3, 2.5, 1.2], 0.1, 'black');
    b.pair((s) => b.ball([0.2, 0.15, 0.06], [s * 0.4, 1.4, 1.72], { color: 'yellow', glow: true }));
    b.pair((s) => tire(b, 1.7, 0.5, [s * 0.95, 0.85, -0.75], 'yellow'));
    b.pair((s) => tire(b, 0.9, 0.3, [s * 0.7, 0.45, 1.2], 'yellow'));
    return b.done();
  }),
  e('trading card', 'toys', 'cards', () =>
    m('trading card').box([0.08, 0.016, 0.045], [0, 0.008, 0], { color: 'glass', round: 0.3 })
      .box([0.066, 0.092, 0.004], [0, 0.062, 0], { color: 'gold', round: 0.2 })
      .box([0.056, 0.048, 0.002], [0, 0.074, 0.003], { color: 'skyblue', noInk: true })
      .star(0.03, [0, 0.074, 0.005], { color: 'red', noInk: true })
      .box([0.056, 0.022, 0.002], [0, 0.034, 0.003], { color: 'cream', noInk: true })
      .box([0.04, 0.004, 0.002], [0, 0.038, 0.0045], { color: 'gray', noInk: true })
      .box([0.04, 0.004, 0.002], [0, 0.03, 0.0045], { color: 'gray', noInk: true })
      .done(),
  ),
  e('traffic barrel', 'workshop', 'road works', () =>
    m('traffic barrel').cyl([0.62, 0.07, 0.62], [0, 0.035, 0], { color: 'black' })
      .cyl([0.5, 0.95, 0.5], [0, 0.5, 0], { color: 'orange', taper: 0.85 })
      .cyl([0.49, 0.1, 0.49], [0, 0.35, 0], { color: 'white' })
      .cyl([0.465, 0.1, 0.465], [0, 0.65, 0], { color: 'white' })
      .cyl([0.3, 0.06, 0.3], [0, 0.99, 0], { color: 'orange' })
      .done(),
  ),
  e('traffic lights', 'places', 'street furniture', () =>
    m('traffic lights').cyl([0.5, 0.1, 0.5], [0, 0.05, 0], { color: 'darkgray' })
      .stick([0, 0.1, 0], [0, 3.0, 0], 0.15, 'darkgray')
      .box([0.45, 1.25, 0.35], [0, 3.55, 0.05], { color: 'black', round: 0.2 })
      .cyl([0.28, 0.06, 0.28], [0, 3.95, 0.24], { color: 'red', rot: [90, 0, 0], glow: true })
      .cyl([0.28, 0.06, 0.28], [0, 3.55, 0.24], { color: 'orange', rot: [90, 0, 0] })
      .cyl([0.28, 0.06, 0.28], [0, 3.15, 0.24], { color: 'green', rot: [90, 0, 0] })
      .done(),
  ),
  e('trail mix', 'food', 'snacks', () => {
    const b = m('trail mix').cyl([0.15, 0.08, 0.15], [0, 0.04, 0], { color: 'wood', taper: 1.4 }).ball([0.2, 0.05, 0.2], [0, 0.08, 0], { color: '#8a5a2b' });
    const bits: Array<[number, number, string]> = [[0, 0, 'tan'], [0.05, 0, 'red'], [-0.05, 0.02, 'yellow'], [0.02, 0.05, 'darkbrown'], [-0.02, -0.05, 'blue'], [0.06, -0.04, 'cream'], [-0.06, -0.03, 'green'], [0.03, -0.025, 'tan'], [-0.03, 0.06, 'orange'], [0.065, 0.045, 'tan'], [-0.025, 0.02, 'darkbrown'], [0.025, 0.025, 'cream'], [-0.07, 0.05, 'tan'], [0.0, -0.075, 'red']];
    for (const [x, z, c] of bits) b.ball([0.03, 0.02, 0.024], [x, 0.108 - (x * x + z * z) * 3.5, z], { color: c, rot: [0, x * 900, 0] });
    return b.done();
  }),
  e('trailer', 'garage', 'trailers', () => {
    const b = m('trailer', { view: 'side' }).box([2.2, 2.2, 5.0], [0, 1.6, 0], { color: 'cream', round: 0.5 })
      .box([2.22, 0.3, 5.02], [0, 1.35, 0], { color: 'teal', round: 0.5, noInk: true })
      .box([0.08, 1.6, 0.7], [1.12, 1.35, -1.0], { color: 'teal', name: 'door', pivot: [1.12, 1.35, -0.65] })
      .box([0.08, 0.6, 1.0], [1.1, 2.0, 0.8], { color: 'glass' })
      .box([1.6, 0.6, 0.08], [0, 2.0, 2.5], { color: 'glass' })
      .box([0.8, 0.25, 0.9], [0, 2.8, -0.5], { color: 'white' })
      .rod([0, 0.7, 2.5], [0, 0.55, 3.4], 0.12, 'darkgray')
      .stick([0, 0.0, 3.0], [0, 0.6, 3.0], 0.08, 'darkgray');
    return axle(b, 0.7, 0.22, 1.0, -0.2).done();
  }),
  e('trailer park', 'places', 'neighbourhoods', () => {
    const b = m('trailer park').box([10, 0.1, 8], [0, 0.05, 0], { color: 'grass', round: 0.05 })
      .box([5, 2, 2.2], [-2.2, 1.25, -1.8], { color: 'cream', round: 0.45 }).box([5.02, 0.25, 2.22], [-2.2, 1.0, -1.8], { color: 'teal', round: 0.45, noInk: true })
      .box([1.2, 0.6, 0.08], [-3.2, 1.6, -0.68], { color: 'glass' }).box([0.7, 1.4, 0.08], [-1.0, 0.9, -0.68], { color: 'teal' })
      .box([4.5, 2, 2.2], [2.4, 1.25, 1.2], { color: 'skyblue', round: 0.45 }).box([4.52, 0.25, 2.22], [2.4, 1.0, 1.2], { color: 'white', round: 0.45, noInk: true })
      .box([1.2, 0.6, 0.08], [3.3, 1.6, 2.32], { color: 'glass' }).box([0.7, 1.4, 0.08], [1.4, 0.9, 2.32], { color: 'navy' })
      .cyl([0.3, 1.6, 0.3], [4.2, 0.8, -2.5], { color: 'bark' }).ball([2, 1.6, 2], [4.2, 2.2, -2.5], { color: 'leaf' })
      .stick([-4.2, 0.1, 3.2], [-4.2, 1.6, 3.2], 0.12, 'darkwood')
      .label('TRAILER PARK', [2.4, 0.6], [-3.4, 1.8, 3.25], { color: 'yellow' });
    return b.done();
  }),
  e('train', 'garage', 'trains', () => {
    const b = m('train', { view: 'side' }).cyl([1.5, 4.0, 1.5], [0, 2.0, 0.6], { color: 'black', rot: [90, 0, 0] })
      .cyl([1.55, 0.2, 1.55], [0, 2.0, 2.65], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.5, 0.9, 0.5], [0, 3.1, 2.0], { color: 'black', taper: 1.4 })
      .ball([0.6, 0.5, 0.6], [0, 2.8, 0.6], { color: 'gold' })
      .box([2.2, 2.2, 1.8], [0, 2.5, -2.2], { color: 'red', round: 0.1 })
      .box([2.4, 0.15, 2.0], [0, 3.65, -2.2], { color: 'black' })
      .box([2.22, 0.6, 0.7], [0, 2.9, -2.2], { color: 'glass' })
      .box([2.0, 0.5, 6.0], [0, 1.2, 0], { color: 'red' })
      .wedge([0.8, 0.8, 2.0], [0, 0.55, 3.1], { color: 'red', rot: [0, 90, 0], apex: 0.5 })
      .ball(0.35, [0, 2.95, 2.75], { color: 'yellow', glow: true });
    for (const z of [1.4, 0.1, -1.2]) b.pair((s) => tire(b, 1.2, 0.25, [s * 0.9, 0.6, z], 'red'));
    b.pair((s) => b.stick([s * 1.06, 0.6, -1.2], [s * 1.06, 0.6, 1.4], 0.08, 'silver'));
    return b.done();
  }),
  e('train car', 'garage', 'trains', () => {
    const b = m('train car', { view: 'side' }).box([2.6, 2.8, 8], [0, 2.4, 0], { color: 'darkred', round: 0.05 })
      .box([2.7, 0.15, 8.1], [0, 3.85, 0], { color: 'darkgray' })
      .box([0.06, 2.2, 1.8], [1.32, 2.3, 0], { color: 'maroon', name: 'door', pivot: [1.32, 2.3, 0.9] })
      .stick([1.36, 1.3, -1.0], [1.36, 1.3, 1.0], 0.06, 'darkgray').stick([1.36, 3.45, -1.0], [1.36, 3.45, 1.0], 0.06, 'darkgray')
      .box([2.2, 0.35, 7.6], [0, 0.85, 0], { color: 'black' })
      .label('RAIL', [2.4, 0.6], [1.31, 3.0, -2.6], { color: 'white', rot: [0, 90, 0] });
    for (const z of [2.8, -2.8]) {
      b.box([2.0, 0.3, 2.0], [0, 0.6, z], { color: 'darkgray' });
      axle(b, 0.8, 0.18, 1.0, z + 0.6, 'darkgray');
      axle(b, 0.8, 0.18, 1.0, z - 0.6, 'darkgray');
    }
    return b.done();
  }),
  e('train station', 'places', 'transport', () => {
    const b = m('train station').box([10, 4.5, 4], [0, 2.25, -1], { color: 'tan', round: 0.03 })
      .wedge([4.4, 1.6, 10.4], [0, 5.3, -1], { color: 'darkred', rot: [0, 90, 0] })
      .box([1.6, 3, 1.6], [0, 6, -1], { color: 'tan' })
      .cyl([1.1, 0.1, 1.1], [0, 6.7, -0.18], { color: 'white', rot: [90, 0, 0] })
      .stick([0, 6.7, -0.12], [0, 7.05, -0.12], 0.07, 'black').stick([0, 6.7, -0.12], [0.25, 6.7, -0.12], 0.07, 'black')
      .cone([1.9, 1.3, 1.9], [0, 8.15, -1], { color: 'darkred', segs: 4, rot: [0, 45, 0] })
      .box([12, 0.6, 2.6], [0, 0.3, 2.3], { color: 'stone' })
      .box([10, 0.15, 2.4], [0, 3.6, 2.2], { color: 'darkgreen' })
      .label('STATION', [3.5, 0.6], [0, 4.05, 1.03], { color: 'navy' })
      .box([1.2, 2.2, 0.1], [0, 1.7, 1.03], { color: 'darkwood', name: 'door', pivot: [-0.6, 1.7, 1.03] });
    b.each(4, (i) => b.stick([-4.2 + i * 2.8, 0.6, 3.2], [-4.2 + i * 2.8, 3.55, 3.2], 0.15, 'darkgreen'));
    b.pair((s) => b.box([1.6, 1.5, 0.08], [s * 3.2, 2.0, 1.02], { color: 'glass' }).stick([-6, 0.06, 4.2 + (s + 1) * 0.4], [6, 0.06, 4.2 + (s + 1) * 0.4], 0.1, 'steel'));
    b.each(6, (i) => b.box([0.25, 0.06, 1.4], [-5 + i * 2, 0.03, 4.6], { color: 'darkwood' }));
    return b.done();
  }),
  e('train whistle', 'music', 'whistles', () =>
    m('train whistle').cyl([0.045, 0.03, 0.045], [0, 0.015, 0], { color: 'brass' })
      .box([0.06, 0.045, 0.05], [0, 0.05, 0], { color: 'brass', round: 0.3 })
      .cyl([0.04, 0.02, 0.04], [0, 0.08, 0], { color: 'darkgray' })
      .cyl([0.07, 0.12, 0.07], [0, 0.15, 0], { color: 'brass' })
      .ball([0.072, 0.035, 0.072], [0, 0.21, 0], { color: 'brass' })
      .rod([0.03, 0.055, 0], [0.12, 0.08, 0], 0.01, 'iron')
      .stick([0.12, 0.08, 0], [0.12, 0.0, 0], 0.004, 'tan')
      .done(),
  ),
  e('trampoline', 'sports', 'backyard play', () => {
    const b = m('trampoline').torus([2.2, 2.2, 0.18], [0, 0.75, 0], { color: 'blue', rot: [90, 0, 0], tube: 0.08 })
      .cyl([1.95, 0.03, 1.95], [0, 0.74, 0], { color: 'black' });
    for (const [x, z] of around(6, 1.02)) b.stick([x, 0.7, z], [x * 1.02, 0, z * 1.02], 0.05, 'silver');
    return b.done();
  }),
  e('tranquilizer', 'clinic', 'medicine', () =>
    m('tranquilizer').cyl([0.06, 0.09, 0.06], [0, 0.045, 0], { color: '#d9822b' })
      .cyl([0.066, 0.025, 0.066], [0, 0.1025, 0], { color: 'white' })
      .label('Rx', [0.05, 0.04], [0, 0.045, 0.024], { color: 'white' })
      .capsule([0.014, 0.03, 0.014], [0.06, 0.007, 0.02], { color: 'skyblue', rot: [0, 30, 90] })
      .capsule([0.014, 0.03, 0.014], [0.055, 0.007, -0.02], { color: 'white', rot: [0, -20, 90] })
      .done(),
  ),
  e('transcript', 'study', 'documents', () => {
    const b = m('transcript').box([0.25, 0.03, 0.08], [0, 0.015, 0], { color: 'wood' })
      .box([0.23, 0.31, 0.012], [0, 0.18, 0], { color: 'darkwood', round: 0.1 })
      .box([0.21, 0.27, 0.004], [0, 0.17, 0.008], { color: 'white', round: 0.05 })
      .box([0.08, 0.03, 0.02], [0, 0.33, 0.01], { color: 'silver' })
      .label('TRANSCRIPT', [0.17, 0.03], [0, 0.28, 0.012], { color: 'white' })
      .torus([0.05, 0.05, 0.003], [0.06, 0.07, 0.011], { color: 'red', noInk: true });
    b.each(6, (i) => b.box([i % 3 === 2 ? 0.1 : 0.16, 0.006, 0.002], [i % 3 === 2 ? -0.03 : 0, 0.24 - i * 0.025, 0.011], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('transmission', 'garage', 'car parts', () =>
    m('transmission', { view: 'side' }).cyl([0.32, 0.18, 0.32], [0, 0.22, 0.28], { color: 'silver', rot: [-90, 0, 0], taper: 0.6 })
      .box([0.2, 0.2, 0.34], [0, 0.18, -0.02], { color: 'silver', round: 0.4 })
      .cyl([0.1, 0.22, 0.1], [0, 0.19, -0.3], { color: 'silver', rot: [-90, 0, 0], taper: 0.8 })
      .cyl([0.11, 0.03, 0.11], [0, 0.19, -0.42], { color: 'darkgray', rot: [90, 0, 0] })
      .box([0.18, 0.05, 0.3], [0, 0.04, -0.02], { color: 'darkgray', round: 0.3 })
      .stick([0, 0.27, 0.02], [0, 0.42, -0.02], 0.02, 'black')
      .ball(0.045, [0, 0.43, -0.02], { color: 'black' })
      .done(),
  ),
  e('transmission tower', 'tech', 'power', () => {
    const b = m('transmission tower').box([0.3, 0.7, 0.3], [0, 3.55, 0], { color: 'steel', round: 0.1 })
      .box([2.4, 0.1, 0.15], [0, 2.6, 0], { color: 'steel' }).box([1.8, 0.1, 0.15], [0, 3.3, 0], { color: 'steel' });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.rod([x * 0.9, 0.2, z * 0.9], [x * 0.15, 3.2, z * 0.15], 0.07, 'steel').box([0.35, 0.3, 0.35], [x * 0.9, 0.15, z * 0.9], { color: 'stone' });
    b.pair((s) => b.rod([s * 0.75, 0.6, 0.75], [-s * 0.5, 1.6, 0.5], 0.04, 'steel').rod([s * 0.45, 1.75, 0.45], [-s * 0.28, 2.6, 0.28], 0.04, 'steel')
      .rod([0.75, 0.6, s * 0.75], [0.5, 1.6, -s * 0.5], 0.04, 'steel')
      .stick([s * 1.1, 2.55, 0], [s * 1.1, 2.25, 0], 0.08, 'skyblue').stick([s * 0.8, 3.25, 0], [s * 0.8, 2.95, 0], 0.08, 'skyblue'));
    return b.done();
  }),
  e('transmitter', 'tech', 'radio gear', () =>
    m('transmitter').box([0.22, 0.14, 0.14], [0, 0.07, 0], { color: 'darkgray', round: 0.2 })
      .box([0.2, 0.11, 0.01], [0, 0.075, 0.07], { color: 'gray' })
      .cyl([0.03, 0.012, 0.03], [-0.06, 0.06, 0.078], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.03, 0.012, 0.03], [0.06, 0.06, 0.078], { color: 'black', rot: [90, 0, 0] })
      .box([0.07, 0.035, 0.006], [0, 0.1, 0.077], { color: 'lime', glow: true })
      .ball(0.012, [0.07, 0.11, 0.077], { color: 'red', glow: true })
      .stick([0.08, 0.14, -0.03], [0.08, 0.4, -0.03], 0.006, 'silver')
      .ball(0.014, [0.08, 0.405, -0.03], { color: 'silver' })
      .done(),
  ),
  e('trapdoor', 'home', 'doors', () => {
    const b = m('trapdoor').box([1.8, 0.15, 1.8], [0, 0.075, 0], { color: 'wood' })
      .box([0.9, 0.01, 0.9], [0, 0.151, 0.1], { color: 'black', noInk: true })
      .box([0.9, 0.9, 0.06], [0, 0.6, -0.42], { color: 'lightwood', rot: [-10, 0, 0] })
      .torus([0.12, 0.12, 0.025], [0, 0.75, -0.38], { color: 'iron', rot: [-10, 0, 0] })
      .stick([-0.25, 0.4, 0.35], [0.25, 0.4, 0.35], 0.04, 'wood');
    b.each(4, (i) => b.box([0.015, 0.005, 1.8], [-0.675 + i * 0.45, 0.152, 0], { color: 'darkwood', noInk: true }));
    b.pair((s) => b.box([0.08, 0.3, 0.07], [s * 0.3, 0.3, -0.45], { color: 'iron', rot: [-10, 0, 0] }).stick([s * 0.25, 0.1, 0.35], [s * 0.25, 0.48, 0.35], 0.05, 'wood'));
    return b.done();
  }),
  e('trapeze', 'sports', 'circus', () => {
    const b = m('trapeze').stick([-1.0, 2.6, 0], [1.0, 2.6, 0], 0.08, 'red')
      .stick([-0.42, 1.4, 0], [0.42, 1.4, 0], 0.05, 'silver');
    b.pair((s) => b.stick([s * 1.0, 0.1, 0], [s * 1.0, 2.65, 0], 0.08, 'red').box([0.45, 0.2, 0.6], [s * 1.0, 0.1, 0], { color: 'darkgray' }).stick([s * 0.4, 2.6, 0], [s * 0.4, 1.4, 0], 0.015, 'tan'));
    return b.done();
  }),
  e('trapezoid', 'ideas', 'shapes', () => {
    const b = m('trapezoid').box([0.12, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' }).box([0.06, 0.07, 0.025], [0, 0.055, 0], { color: 'purple', round: 0 });
    b.pair((s) => b.wedge([0.03, 0.07, 0.025], [s * 0.045, 0.055, 0], { color: 'purple', apex: -s * 0.5 }));
    return b.done();
  }),
  e('tray', 'kitchen', 'tableware', () => {
    const b = m('tray').box([0.46, 0.02, 0.32], [0, 0.01, 0], { color: 'silver', round: 0.3 })
      .cyl([0.12, 0.008, 0.12], [-0.08, 0.024, 0], { color: 'white' })
      .cyl([0.07, 0.05, 0.07], [-0.08, 0.053, 0], { color: 'white', taper: 1.25 })
      .torus([0.035, 0.035, 0.01], [-0.125, 0.055, 0], { color: 'white' })
      .cyl([0.06, 0.012, 0.06], [0.09, 0.026, 0.04], { color: '#c98a40' });
    b.pair((s) => b.box([0.02, 0.04, 0.32], [s * 0.23, 0.03, 0], { color: 'silver' }).box([0.46, 0.04, 0.02], [0, 0.03, s * 0.16], { color: 'silver' }).torus([0.08, 0.12, 0.015], [s * 0.25, 0.045, 0], { color: 'silver', rot: [90, 0, 0] }));
    return b.done();
  }),
  e('treadmill', 'sports', 'gym things', () => {
    const b = m('treadmill', { view: 'side' }).box([0.8, 0.2, 1.9], [0, 0.15, -0.1], { color: 'darkgray', round: 0.3 })
      .box([0.6, 0.04, 1.8], [0, 0.27, -0.12], { color: 'black' })
      .box([0.8, 0.25, 0.3], [0, 0.2, 0.95], { color: 'gray', round: 0.3 })
      .box([0.8, 0.3, 0.2], [0, 1.35, 0.72], { color: 'darkgray', rot: [-30, 0, 0], round: 0.3 })
      .box([0.4, 0.15, 0.02], [0, 1.37, 0.81], { color: 'skyblue', rot: [-30, 0, 0], glow: true });
    b.pair((s) => b.stick([s * 0.38, 0.2, 0.95], [s * 0.38, 1.25, 0.75], 0.07, 'silver').stick([s * 0.38, 1.05, 0.75], [s * 0.38, 1.05, 0.25], 0.05, 'silver'));
    return b.done();
  }),
  e('treasure', 'fantasy', 'treasure', () => {
    const b = m('treasure').box([0.8, 0.4, 0.5], [0, 0.2, 0], { color: 'wood' })
      .box([0.81, 0.05, 0.51], [0, 0.38, 0], { color: 'gold' })
      .ball([0.74, 0.22, 0.44], [0, 0.42, 0], { color: 'gold' })
      .box([0.82, 0.45, 0.08], [0, 0.62, -0.3], { color: 'wood', rot: [-15, 0, 0] })
      .box([0.83, 0.05, 0.09], [0, 0.83, -0.35], { color: 'gold', rot: [-15, 0, 0] })
      .box([0.08, 0.1, 0.03], [0, 0.3, 0.26], { color: 'gold' })
      .ball(0.07, [-0.15, 0.52, 0.08], { color: 'red' }).ball(0.06, [0.18, 0.5, 0.1], { color: 'green' }).ball(0.06, [0.02, 0.54, -0.05], { color: 'blue' })
      .cyl([0.08, 0.012, 0.08], [0.3, 0.006, 0.4], { color: 'gold' }).cyl([0.08, 0.012, 0.08], [0.4, 0.006, 0.3], { color: 'gold' }).cyl([0.08, 0.012, 0.08], [-0.35, 0.006, 0.38], { color: 'gold' });
    b.pair((s) => b.box([0.06, 0.41, 0.51], [s * 0.3, 0.2, 0], { color: 'gold' }));
    return b.done();
  }),
  e('tree house', 'places', 'houses', () => {
    const b = m('tree house').cyl([0.6, 3.2, 0.6], [0, 1.6, 0], { color: 'bark', taper: 0.8 })
      .ball([3.2, 1.8, 2.6], [0, 4.3, -0.6], { color: 'leaf' }).ball([1.6, 1.2, 1.4], [-1.4, 3.7, -0.3], { color: 'darkgreen' }).ball([1.5, 1.1, 1.3], [1.4, 3.8, -0.4], { color: 'darkgreen' })
      .box([2.2, 0.15, 2.0], [0, 2.2, 0.2], { color: 'wood' })
      .box([1.6, 1.2, 1.4], [0, 2.875, 0.2], { color: 'lightwood' })
      .wedge([1.9, 0.7, 1.7], [0, 3.825, 0.2], { color: 'darkred' })
      .box([0.5, 0.8, 0.06], [-0.3, 2.68, 0.92], { color: 'darkwood', name: 'door', pivot: [-0.55, 2.68, 0.92] })
      .box([0.4, 0.35, 0.06], [0.4, 2.95, 0.92], { color: 'glass' });
    b.pair((s) => b.stick([0.7 + s * 0.2, 0, 1.4], [0.7 + s * 0.2, 2.2, 1.1], 0.06, 'wood'));
    b.each(5, (i) => b.stick([0.5, 0.3 + i * 0.4, 1.36 - i * 0.055], [0.9, 0.3 + i * 0.4, 1.36 - i * 0.055], 0.05, 'wood'));
    return b.done();
  }),
  e('tree stump', 'garden', 'trees', () => {
    const b = m('tree stump').cyl([0.7, 0.5, 0.7], [0, 0.25, 0], { color: 'bark', taper: 0.92 })
      .cyl([0.6, 0.02, 0.6], [0, 0.505, 0], { color: 'lightwood' })
      .torus([0.4, 0.4, 0.01], [0, 0.516, 0], { color: 'wood', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .torus([0.2, 0.2, 0.01], [0, 0.516, 0], { color: 'wood', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .rod([0.2, 0.5, 0.2], [0.24, 0.66, 0.24], 0.025, 'green').ball([0.08, 0.04, 0.06], [0.26, 0.68, 0.24], { color: 'leaf' });
    for (const [x, z] of around(5, 0.38, 0.4)) b.rod([x * 0.6, 0.12, z * 0.6], [x * 1.3, 0.04, z * 1.3], 0.12, 'bark');
    return b.done();
  }),
  e('tree topper', 'toys', 'christmas', () =>
    m('tree topper').cone([0.06, 0.13, 0.06], [0, 0.065, 0], { color: 'gold' })
      .ball(0.05, [0, 0.13, 0], { color: 'gold' })
      .star(0.22, [0, 0.215, 0], { color: 'gold' })
      .ball(0.04, [0, 0.215, 0.02], { color: '#fff7c0', glow: true })
      .done(),
  ),
  e('tree trunk', 'garden', 'trees', () => {
    const b = m('tree trunk').cyl([0.9, 4.5, 0.9], [0, 2.25, 0], { color: 'bark', taper: 0.75 })
      .cyl([0.66, 0.03, 0.66], [0, 4.5, 0], { color: 'lightwood' })
      .rod([0.25, 2.8, 0], [0.85, 3.4, 0.1], 0.2, 'bark').rod([-0.3, 2.0, 0.05], [-0.8, 2.5, 0.15], 0.18, 'bark')
      .ball([0.2, 0.28, 0.1], [0.05, 1.6, 0.42], { color: 'darkbrown' });
    for (const [x, z] of around(5, 0.45, 0.3)) b.rod([x, 0.25, z], [x * 2, 0.05, z * 2], 0.2, 'bark');
    return b.done();
  }),
  e('triangle (music)', 'music', 'percussion', () =>
    m('triangle (music)').box([0.28, 0.025, 0.1], [0, 0.0125, 0], { color: 'darkwood' })
      .stick([-0.13, 0.02, 0], [-0.13, 0.29, 0], 0.016, 'darkwood').stick([-0.13, 0.29, 0], [0.02, 0.29, 0], 0.014, 'darkwood')
      .stick([0.02, 0.29, 0], [0.02, 0.21, 0], 0.003, 'red')
      .stick([-0.06, 0.055, 0], [0.1, 0.055, 0], 0.01, 'steel')
      .stick([-0.06, 0.055, 0], [0.02, 0.205, 0], 0.01, 'steel')
      .stick([0.1, 0.055, 0], [0.032, 0.18, 0], 0.01, 'steel')
      .stick([0.04, 0.03, 0.04], [0.13, 0.03, 0.03], 0.008, 'silver')
      .done(),
  ),
  e('triangle (shape)', 'ideas', 'shapes', () =>
    m('triangle (shape)').box([0.1, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' }).wedge([0.1, 0.09, 0.025], [0, 0.065, 0], { color: 'red' }).done(),
  ),
  e('tricycle', 'garage', 'bikes', () => {
    const b = m('tricycle', { view: 'side' });
    tire(b, 0.45, 0.07, [0, 0.225, 0.35], 'red', 'wheel');
    b.pair((s) => tire(b, 0.28, 0.06, [s * 0.25, 0.14, -0.3], 'red').box([0.03, 0.03, 0.06], [s * 0.07, 0.225, 0.35], { color: 'black' }));
    return b.rod([0, 0.42, 0.3], [0, 0.3, -0.3], 0.05, 'red')
      .stick([-0.25, 0.14, -0.3], [0.25, 0.14, -0.3], 0.03, 'red')
      .stick([0, 0.225, 0.35], [0, 0.56, 0.3], 0.035, 'red')
      .stick([-0.2, 0.58, 0.28], [0.2, 0.58, 0.28], 0.025, 'silver')
      .ball([0.04, 0.04, 0.05], [0.21, 0.58, 0.28], { color: 'white' }).ball([0.04, 0.04, 0.05], [-0.21, 0.58, 0.28], { color: 'white' })
      .stick([0, 0.3, -0.1], [0, 0.43, -0.1], 0.03, 'silver')
      .box([0.16, 0.05, 0.18], [0, 0.45, -0.1], { color: 'black', round: 0.5 })
      .box([0.5, 0.03, 0.12], [0, 0.17, -0.38], { color: 'silver' })
      .done();
  }),
  e('trident', 'armory', 'spears', () => {
    const b = m('trident').cyl([0.36, 0.14, 0.36], [0, 0.07, 0], { color: 'rock' })
      .stick([0, 0.1, 0], [0, 1.5, 0], 0.035, 'gold')
      .rod([-0.13, 1.5, 0], [0.13, 1.5, 0], 0.04, 'gold')
      .stick([0, 1.5, 0], [0, 1.74, 0], 0.03, 'gold').cone([0.06, 0.1, 0.03], [0, 1.79, 0], { color: 'gold' })
      .ball(0.06, [0, 1.48, 0], { color: 'gold' });
    b.pair((s) => b.stick([s * 0.13, 1.5, 0], [s * 0.13, 1.68, 0], 0.03, 'gold').cone([0.06, 0.1, 0.03], [s * 0.13, 1.73, 0], { color: 'gold' }));
    return b.done();
  }),
  e('tripod', 'tech', 'camera gear', () => {
    const b = m('tripod').stick([0, 1.0, 0], [0, 1.3, 0], 0.05, 'black').box([0.1, 0.06, 0.1], [0, 1.33, 0], { color: 'black' })
      .box([0.18, 0.12, 0.11], [0, 1.42, 0], { color: 'black', round: 0.2 })
      .cyl([0.08, 0.08, 0.08], [0, 1.42, 0.09], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.06, 0.01, 0.06], [0, 1.42, 0.135], { color: 'glass', rot: [90, 0, 0] });
    for (const [x, z] of around(3, 0.45, Math.PI / 2)) b.rod([0, 1.15, 0], [x, 0.02, z], 0.035, 'darkgray');
    return b.done();
  }),
  e('trojan horse', 'fantasy', 'myths', () => {
    const b = m('trojan horse', { view: 'side' }).box([1.4, 0.25, 3.0], [0, 0.55, 0], { color: 'darkwood' })
      .box([0.9, 0.8, 2.2], [0, 2.0, 0], { color: 'wood', round: 0.5 })
      .box([0.45, 1.1, 0.5], [0, 2.7, 1.05], { color: 'wood', rot: [25, 0, 0], round: 0.3 })
      .box([0.45, 0.45, 0.9], [0, 3.3, 1.45], { color: 'wood', rot: [15, 0, 0], round: 0.3 })
      .box([0.12, 1.0, 0.3], [0, 2.85, 0.85], { color: 'darkbrown', rot: [25, 0, 0] })
      .rod([0, 2.2, -1.1], [0, 1.4, -1.4], 0.15, 'darkbrown')
      .box([0.02, 0.4, 0.5], [0.46, 2.0, 0], { color: 'darkbrown' })
      .ball(0.08, [0.2, 3.42, 1.7], { color: 'black' }).ball(0.08, [-0.2, 3.42, 1.7], { color: 'black' });
    b.pair((s) => b.cone([0.12, 0.22, 0.1], [s * 0.15, 3.62, 1.2], { color: 'wood' }));
    for (const [x, z] of [[0.35, 0.8], [-0.35, 0.8], [0.35, -0.8], [-0.35, -0.8]]) b.box([0.22, 1.0, 0.22], [x, 1.17, z], { color: 'wood' });
    for (const z of [1.0, -1.0]) b.pair((s) => tire(b, 0.7, 0.15, [s * 0.75, 0.35, z], 'darkwood'));
    return b.done();
  }),
  e('trombone', 'music', 'brass', () =>
    m('trombone', { view: 'side' }).torus([0.16, 0.12, 0.025], [0, 0.06, -0.05], { color: 'brass', rot: [0, 90, 0] })
      .stick([0, 0.06, -0.12], [0, 0.75, -0.12], 0.025, 'brass')
      .cone([0.24, 0.25, 0.24], [0, 0.85, -0.12], { color: 'brass', rot: [180, 0, 0] })
      .stick([0, 0.08, 0.02], [0, 1.0, 0.02], 0.022, 'brass').stick([0, 0.15, 0.12], [0, 1.0, 0.12], 0.022, 'brass')
      .torus([0.12, 0.1, 0.025], [0, 1.0, 0.07], { color: 'brass', rot: [0, 90, 0] })
      .stick([0, 0.55, 0.02], [0, 0.55, 0.12], 0.015, 'brass').stick([0, 0.3, -0.12], [0, 0.3, 0.02], 0.015, 'brass')
      .cone([0.03, 0.05, 0.03], [0, 0.13, 0.12], { color: 'silver', rot: [180, 0, 0] })
      .done(),
  ),
  e('trophy', 'sports', 'awards', () => {
    const b = m('trophy').box([0.2, 0.08, 0.2], [0, 0.04, 0], { color: 'darkwood' }).box([0.14, 0.05, 0.14], [0, 0.105, 0], { color: 'black' })
      .label('#1', [0.1, 0.045], [0, 0.04, 0.1], { color: 'gold' })
      .cyl([0.035, 0.1, 0.035], [0, 0.18, 0], { color: 'gold' }).ball(0.06, [0, 0.24, 0], { color: 'gold' })
      .cyl([0.12, 0.2, 0.12], [0, 0.35, 0], { color: 'gold', taper: 1.6 });
    b.pair((s) => b.torus([0.12, 0.14, 0.025], [s * 0.12, 0.37, 0], { color: 'gold' }));
    return b.done();
  }),
  e('trough', 'farm', 'farm things', () => {
    const b = m('trough').box([1.4, 0.35, 0.5], [0, 0.42, 0], { color: 'wood' }).box([1.3, 0.02, 0.4], [0, 0.585, 0], { color: 'water' });
    b.pair((s) => b.stick([s * 0.6, 0, 0.22], [s * 0.6, 0.3, 0.22], 0.06, 'darkwood').stick([s * 0.6, 0, -0.22], [s * 0.6, 0.3, -0.22], 0.06, 'darkwood'));
    b.each(2, (i) => b.box([1.41, 0.01, 0.51], [0, 0.33 + i * 0.12, 0], { color: 'darkwood', noInk: true }));
    return b.done();
  }),
  e('truck', 'garage', 'trucks', () => {
    const b = m('truck', { view: 'side' }).box([2.3, 2.0, 1.8], [0, 1.65, 2.7], { color: 'red', round: 0.3 })
      .box([2.0, 0.8, 0.1], [0, 2.15, 3.58], { color: 'glass' }).box([2.32, 0.7, 0.9], [0, 2.15, 2.9], { color: 'glass' })
      .box([2.3, 0.3, 0.2], [0, 0.75, 3.65], { color: 'silver' })
      .box([2.5, 2.8, 5.0], [0, 2.1, -0.8], { color: 'white', round: 0.05 })
      .box([2.52, 0.3, 5.02], [0, 1.4, -0.8], { color: 'red', noInk: true })
      .box([2.0, 0.35, 7.0], [0, 0.65, 0], { color: 'black' });
    b.pair((s) => b.ball([0.3, 0.25, 0.08], [s * 0.8, 1.1, 3.62], { color: 'yellow', glow: true }));
    for (const z of [2.6, -1.9, -2.9]) axle(b, 1.0, 0.35, 1.05, z);
    return b.done();
  }),
  e('truffle', 'food', 'sweets', () =>
    m('truffle').cyl([0.04, 0.02, 0.04], [0, 0.01, 0], { color: '#5a3a22', taper: 1.3 })
      .torus([0.054, 0.054, 0.008], [0, 0.02, 0], { color: '#5a3a22', rot: [90, 0, 0], tube: 0.2 })
      .ball([0.044, 0.04, 0.044], [0, 0.036, 0], { color: 'chocolate' })
      .rod([-0.018, 0.048, 0.012], [0.018, 0.05, 0.014], 0.004, 'cream', { noInk: true })
      .rod([-0.018, 0.04, 0.019], [0.018, 0.042, 0.018], 0.004, 'cream', { noInk: true })
      .cyl([0.04, 0.02, 0.04], [0.05, 0.01, -0.03], { color: '#5a3a22', taper: 1.3 })
      .ball([0.044, 0.04, 0.044], [0.05, 0.036, -0.03], { color: '#7a4a2a' })
      .done(),
  ),
  e('trumpet', 'music', 'brass', () => {
    const b = m('trumpet', { view: 'side' }).stick([0, 0.025, -0.22], [0, 0.025, 0.18], 0.022, 'brass')
      .stick([0, 0.085, -0.15], [0, 0.085, 0.24], 0.022, 'brass')
      .cone([0.15, 0.16, 0.15], [0, 0.075, 0.3], { color: 'brass', rot: [-90, 0, 0] })
      .torus([0.085, 0.085, 0.022], [0, 0.055, -0.2], { color: 'brass', rot: [0, 90, 0] })
      .torus([0.085, 0.085, 0.022], [0, 0.055, 0.18], { color: 'brass', rot: [0, 90, 0] })
      .cone([0.025, 0.05, 0.025], [0, 0.025, -0.26], { color: 'silver', rot: [90, 0, 0] });
    b.each(3, (i) => b.cyl([0.032, 0.12, 0.032], [0, 0.07, -0.04 + i * 0.045], { color: 'silver' }).cyl([0.036, 0.02, 0.036], [0, 0.14, -0.04 + i * 0.045], { color: 'cream' }));
    return b.done();
  }),
  e('tuba', 'music', 'brass', () => {
    const b = m('tuba').torus([0.55, 0.6, 0.18], [0, 0.45, 0], { color: 'brass', tube: 0.3 })
      .ball([0.3, 0.2, 0.2], [0, 0.12, 0], { color: 'brass' })
      .cyl([0.2, 0.35, 0.2], [0.12, 0.62, -0.05], { color: 'brass', taper: 1.3 })
      .cone([0.5, 0.45, 0.5], [0.12, 0.95, -0.05], { color: 'brass', rot: [180, 0, 0] })
      .cyl([0.4, 0.02, 0.4], [0.12, 1.17, -0.05], { color: '#3a2a10', noInk: true })
      .rod([-0.2, 0.55, 0.1], [-0.35, 0.72, 0.15], 0.025, 'brass')
      .cone([0.05, 0.06, 0.05], [-0.36, 0.75, 0.15], { color: 'silver', rot: [180, 0, 0] });
    b.each(4, (i) => b.cyl([0.045, 0.16, 0.045], [-0.1 + i * 0.055, 0.6, 0.12], { color: 'silver' }).cyl([0.05, 0.03, 0.05], [-0.1 + i * 0.055, 0.69, 0.12], { color: 'cream' }));
    return b.done();
  }),
  e('tube', 'study', 'lab gear', () => {
    const b = m('tube').box([0.2, 0.02, 0.07], [0, 0.01, 0], { color: 'wood' }).box([0.2, 0.015, 0.07], [0, 0.09, 0], { color: 'wood' });
    b.pair((s) => b.box([0.015, 0.09, 0.07], [s * 0.095, 0.055, 0], { color: 'wood' }));
    (['red', 'lime', 'blue'] as const).forEach((c, i) => {
      const x = (i - 1) * 0.05;
      b.capsule([0.022, 0.07, 0.022], [x, 0.056, 0], { color: c }).cyl([0.022, 0.09, 0.022], [x, 0.125, 0], { color: 'glass' }).torus([0.026, 0.026, 0.006], [x, 0.17, 0], { color: 'glass', rot: [90, 0, 0] });
    });
    return b.done();
  }),
  e('tumbleweed', 'nature', 'desert', () => {
    const b = m('tumbleweed').ball([0.7, 0.62, 0.7], [0, 0.4, 0], { color: '#b08850' });
    b.each(6, (i) => b.torus([0.78, 0.72, 0.04], [0, 0.4, 0], { color: '#7a5a30', rot: [i * 30, i * 60, i * 20], tube: 0.06, noInk: true }));
    for (const [x, z] of around(5, 0.36, 0.5)) b.rod([x * 0.8, 0.45 + z * 0.3, z * 0.8], [x * 1.15, 0.5 + z * 0.5, z * 1.15], 0.02, '#7a5a30');
    return b.done();
  }),
  e('tumour', 'clinic', 'illness', () => {
    const b = m('tumour');
    const lumps: Array<[number, number, number, number]> = [[0, 0.035, 0, 0.07], [0.035, 0.03, 0.01, 0.05], [-0.032, 0.028, 0.012, 0.05], [0.01, 0.065, 0.005, 0.045], [-0.01, 0.025, -0.03, 0.05], [0.02, 0.022, 0.035, 0.04]];
    lumps.forEach(([x, y, z, s], i) => b.ball([s, s * 0.9, s], [x, y, z], { color: i % 2 ? '#d46a7a' : '#e58a8a' }));
    return b.rod([-0.02, 0.05, 0.03], [0.02, 0.06, 0.035], 0.003, 'darkred', { noInk: true }).rod([0.03, 0.04, 0.03], [0.04, 0.02, 0.03], 0.003, 'darkred', { noInk: true }).done();
  }),
  e('tuna salad', 'food', 'salads', () => {
    const b = m('tuna salad').cyl([0.12, 0.05, 0.12], [0, 0.025, 0], { color: 'white', taper: 1.4 })
      .ball([0.17, 0.035, 0.17], [0, 0.055, 0], { color: 'lettuce' })
      .ball([0.12, 0.065, 0.12], [0, 0.072, 0], { color: '#e8d6b0' })
      .ball([0.03, 0.02, 0.025], [0.06, 0.07, 0.03], { color: 'tomato' }).ball([0.03, 0.02, 0.025], [-0.06, 0.07, 0.02], { color: 'tomato' });
    for (const [x, z] of around(6, 0.03)) b.box([0.01, 0.006, 0.01], [x, 0.101, z], { color: x > 0 ? 'lime' : 'darkgray', noInk: true });
    return b.done();
  }),
  e('tuna sandwich', 'food', 'sandwiches', () =>
    m('tuna sandwich').wedge([0.124, 0.064, 0.016], [0, 0.032, 0.026], { color: 'crust' })
      .wedge([0.104, 0.05, 0.004], [0, 0.03, 0.035], { color: 'bread', noInk: true })
      .wedge([0.132, 0.068, 0.006], [0, 0.034, 0.014], { color: 'lettuce' })
      .wedge([0.12, 0.062, 0.02], [0, 0.031, 0], { color: '#e8d6b0' })
      .wedge([0.124, 0.064, 0.016], [0, 0.032, -0.02], { color: 'crust' })
      .done(),
  ),
  e('tunic', 'wardrobe', 'clothes', () =>
    form('tunic', 'darkgreen', { sleeve: 'long', len: 0.62 })
      .cyl([0.46, 0.15, 0.3], [0, 0.55, 0], { color: 'darkgreen', taper: 0.88 })
      .box([0.42, 0.05, 0.26], [0, 0.75, 0], { color: 'leather', round: 0.5 })
      .box([0.05, 0.05, 0.02], [0, 0.75, 0.13], { color: 'gold' })
      .stick([0, 1.08, 0.12], [0, 0.95, 0.125], 0.008, 'tan', { noInk: true })
      .done(),
  ),
  e('tuning fork', 'music', 'music gear', () => {
    const b = m('tuning fork').ball([0.04, 0.03, 0.04], [0, 0.015, 0], { color: 'silver' })
      .stick([0, 0.02, 0], [0, 0.085, 0], 0.009, 'silver')
      .box([0.036, 0.01, 0.009], [0, 0.085, 0], { color: 'silver', round: 0.5 });
    b.pair((s) => b.stick([s * 0.014, 0.085, 0], [s * 0.014, 0.2, 0], 0.008, 'silver'));
    return b.done();
  }),
  e('tunnel', 'places', 'roads and rails', () =>
    m('tunnel').ball([6, 3.8, 4.4], [0, 1.9, -0.5], { color: 'grass' })
      .box([2.8, 2.6, 0.5], [0, 1.3, 1.6], { color: 'stone' })
      .box([1.8, 1.4, 0.1], [0, 0.7, 1.86], { color: 'black' })
      .cyl([1.8, 0.1, 1.8], [0, 1.4, 1.86], { color: 'black', rot: [90, 0, 0] })
      .box([1.8, 0.04, 2], [0, 0.02, 2.9], { color: 'darkgray' })
      .box([0.08, 0.01, 0.5], [0, 0.045, 2.6], { color: 'yellow', noInk: true }).box([0.08, 0.01, 0.5], [0, 0.045, 3.5], { color: 'yellow', noInk: true })
      .cone([0.8, 1.4, 0.8], [-1.6, 3.5, -0.8], { color: 'darkgreen' }).cone([0.7, 1.2, 0.7], [1.4, 3.4, -0.5], { color: 'darkgreen' })
      .done(),
  ),
  e('turban', 'wardrobe', 'hats', () =>
    m('turban').ball([0.22, 0.16, 0.24], [0, 0.09, 0], { color: 'orange' })
      .torus([0.24, 0.26, 0.06], [0, 0.06, 0], { color: '#e8761a', rot: [80, 0, 10], tube: 0.18 })
      .torus([0.23, 0.25, 0.06], [0, 0.11, 0], { color: '#f59a3a', rot: [100, 0, -10], tube: 0.18 })
      .ball(0.04, [0, 0.12, 0.12], { color: 'red' })
      .rod([0, 0.14, 0.11], [0.02, 0.26, 0.09], 0.025, 'white')
      .done(),
  ),
  e('turbine', 'tech', 'power', () => {
    const b = m('turbine').cyl([2.2, 3.0, 2.2], [0, 1.6, 0], { color: 'silver', rot: [90, 0, 0] })
      .torus([2.3, 2.3, 0.3], [0, 1.6, 1.5], { color: 'silver', tube: 0.12 })
      .cyl([1.2, 0.6, 1.2], [0, 1.6, -1.75], { color: 'darkgray', rot: [-90, 0, 0], taper: 0.7 })
      .cyl([1.9, 0.1, 1.9], [0, 1.6, 1.35], { color: 'darkgray', rot: [90, 0, 0], name: 'fan' })
      .cone([0.5, 0.45, 0.5], [0, 1.6, 1.55], { color: 'white', rot: [90, 0, 0], parent: 'fan' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.box([0.2, 0.75, 0.04], [Math.sin(a) * 0.55, 1.6 + Math.cos(a) * 0.55, 1.42], { color: 'steel', rot: [0, 25, (-a * 180) / Math.PI], parent: 'fan' });
    });
    b.pair((s) => b.box([0.3, 0.6, 1.8], [s * 0.6, 0.3, 0], { color: 'yellow' }));
    return b.done();
  }),
  e('turnip', 'food', 'vegetables', () => {
    const b = m('turnip').ball([0.09, 0.08, 0.09], [0, 0.055, 0], { color: 'white' })
      .ball([0.086, 0.05, 0.086], [0, 0.075, 0], { color: 'purple' })
      .cone([0.025, 0.03, 0.025], [0, 0.015, 0], { color: 'white', rot: [180, 0, 0] });
    for (const [x, z] of [[-0.03, 0], [0.03, 0.005], [0, -0.02]]) b.rod([0, 0.095, 0], [x, 0.16, z], 0.01, 'green').ball([0.03, 0.05, 0.012], [x * 1.2, 0.18, z * 1.2], { color: 'leaf', rot: [0, 0, -x * 600] });
    return b.done();
  }),
  e('turnstile', 'places', 'street furniture', () => {
    const b = m('turnstile').box([1.6, 0.06, 1.2], [0, 0.03, 0], { color: 'gray' })
      .box([0.18, 2.1, 0.18], [-0.75, 1.05, 0], { color: 'darkgray' })
      .box([1.6, 0.12, 1.2], [0, 2.16, 0], { color: 'darkgray' })
      .cyl([0.12, 2.0, 0.12], [0, 1.06, 0], { color: 'silver', name: 'rotor' });
    for (let k = 0; k < 4; k++) for (const [x, z] of around(3, 0.55, k * 0.3)) b.stick([0, 0.4 + k * 0.45, 0], [x, 0.4 + k * 0.45, z], 0.04, 'silver', { parent: 'rotor' });
    b.each(4, (k) => b.stick([-0.75, 0.4 + k * 0.45, 0], [-0.35, 0.4 + k * 0.45, -0.3], 0.04, 'darkgray'));
    return b.done();
  }),
  e('turntable', 'music', 'audio gear', () =>
    m('turntable').box([0.45, 0.1, 0.36], [0, 0.05, 0], { color: 'darkwood', round: 0.2 })
      .cyl([0.3, 0.02, 0.3], [-0.04, 0.11, 0], { color: 'silver', name: 'rotor' })
      .cyl([0.29, 0.008, 0.29], [-0.04, 0.124, 0], { color: 'black', parent: 'rotor' })
      .cyl([0.09, 0.01, 0.09], [-0.04, 0.126, 0], { color: 'red', parent: 'rotor' })
      .cyl([0.04, 0.03, 0.04], [0.16, 0.115, -0.12], { color: 'silver' })
      .stick([0.16, 0.135, -0.12], [0.04, 0.135, 0.06], 0.008, 'silver')
      .box([0.02, 0.015, 0.03], [0.035, 0.13, 0.07], { color: 'black' })
      .cyl([0.025, 0.015, 0.025], [0.17, 0.105, 0.14], { color: 'silver' })
      .done(),
  ),
  e('turret', 'armory', 'military', () =>
    m('turret').cyl([2.8, 0.6, 2.8], [0, 0.3, 0], { color: 'darkgray' })
      .ball([2.4, 1.8, 2.4], [0, 0.9, 0], { color: 'olive' })
      .stick([0, 1.2, 0.8], [0, 1.35, 2.6], 0.25, 'darkgray')
      .cyl([0.32, 0.3, 0.32], [0, 1.36, 2.6], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.6, 0.12, 0.6], [0.3, 1.82, -0.2], { color: 'olive' })
      .box([0.2, 0.3, 0.2], [-0.4, 1.85, 0.3], { color: 'darkgray' })
      .done(),
  ),
  e('turtle neck', 'wardrobe', 'clothes', () =>
    form('turtle neck', 'darkred', { sleeve: 'long', len: 0.55 })
      .cyl([0.17, 0.12, 0.17], [0, 1.13, 0], { color: 'darkred' })
      .torus([0.2, 0.2, 0.06], [0, 1.17, 0], { color: '#9a2a2a', rot: [90, 0, 0], tube: 0.25 })
      .box([0.405, 0.05, 0.245], [0, 0.58, 0], { color: '#9a2a2a', round: 0.5, noInk: true })
      .done(),
  ),
  e('turtle shell', 'wild', 'animal parts', () => {
    const b = m('turtle shell').cyl([0.42, 0.04, 0.5], [0, 0.03, 0], { color: '#7a6a3a' }).ball([0.4, 0.22, 0.48], [0, 0.1, 0], { color: 'olive' })
      .cyl([0.11, 0.015, 0.11], [0, 0.207, 0], { color: '#5a6a2a', segs: 6, noInk: true });
    for (const [x, z] of around(6, 0.12, Math.PI / 6)) {
      const r = Math.hypot(x / 0.2, z / 0.24);
      b.cyl([0.1, 0.015, 0.1], [x, 0.1 + 0.11 * Math.sqrt(Math.max(0, 1 - r * r)) - 0.003, z], { color: '#5a6a2a', segs: 6, noInk: true, rot: [(z / 0.12) * 35, 0, (-x / 0.12) * 35] });
    }
    return b.done();
  }),
  e('tusk (bone)', 'wild', 'animal parts', () =>
    m('tusk (bone)').box([0.5, 0.15, 0.3], [0, 0.075, 0], { color: 'darkwood' })
      .rod([0, 0.15, 0], [0.05, 0.6, 0.02], 0.14, 'cream')
      .rod([0.05, 0.6, 0.02], [0, 1.0, 0.1], 0.11, 'cream')
      .rod([0, 1.0, 0.1], [-0.15, 1.3, 0.2], 0.08, 'cream')
      .rod([-0.15, 1.3, 0.2], [-0.3, 1.45, 0.28], 0.05, 'cream')
      .done(),
  ),
  e('tusks', 'wild', 'animal parts', () => {
    const b = m('tusks').box([0.9, 0.15, 0.35], [0, 0.075, 0], { color: 'darkwood' });
    b.pair((s) => b.rod([s * 0.25, 0.15, 0], [s * 0.32, 0.6, 0.03], 0.14, 'cream').rod([s * 0.32, 0.6, 0.03], [s * 0.25, 1.0, 0.08], 0.11, 'cream').rod([s * 0.25, 1.0, 0.08], [s * 0.08, 1.3, 0.12], 0.08, 'cream').rod([s * 0.08, 1.3, 0.12], [s * 0.0, 1.38, 0.13], 0.05, 'cream'));
    return b.done();
  }),
  e('tutu', 'wardrobe', 'dance wear', () =>
    form('tutu', 'pink', { len: 0.38 })
      .cyl([0.8, 0.06, 0.8], [0, 0.73, 0], { color: '#f7b6cf' })
      .cyl([0.68, 0.06, 0.68], [0, 0.78, 0], { color: 'pink' })
      .cyl([0.9, 0.03, 0.9], [0, 0.7, 0], { color: '#fbd3e2' })
      .ball(0.05, [0, 0.82, 0.12], { color: 'white' })
      .done(),
  ),
  e('tuxedo', 'wardrobe', 'formal wear', () => {
    const b = dummy('tuxedo', { top: 'black', legs: 'black', shoes: 'black' })
      .wedge([0.16, 0.32, 0.02], [0, 1.33, 0.12], { color: 'white', rot: [0, 0, 180] })
      .ball(0.035, [0, 1.47, 0.13], { color: 'black' })
      .box([0.06, 0.03, 0.02], [0.13, 1.37, 0.128], { color: 'white' });
    b.pair((s) => b.cone([0.05, 0.05, 0.03], [s * 0.035, 1.47, 0.13], { color: 'black', rot: [0, 0, s * 90] }).rod([s * 0.05, 1.47, 0.13], [s * 0.04, 1.15, 0.13], 0.035, '#2a2a2a'));
    return b.done();
  }),
  e('tv', 'tech', 'screens', () => {
    const b = m('tv').box([0.7, 0.55, 0.5], [0, 0.55, 0], { color: 'wood', round: 0.2 })
      .box([0.46, 0.4, 0.02], [-0.07, 0.56, 0.25], { color: 'skyblue', round: 0.4, glow: true })
      .cyl([0.06, 0.03, 0.06], [0.25, 0.65, 0.255], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.06, 0.03, 0.06], [0.25, 0.5, 0.255], { color: 'black', rot: [90, 0, 0] })
      .box([0.1, 0.08, 0.01], [0.25, 0.37, 0.25], { color: 'darkbrown', noInk: true })
      .ball(0.08, [0, 0.83, -0.05], { color: 'darkgray' });
    b.pair((s) => b.stick([s * 0.28, 0.28, 0.18], [s * 0.32, 0, 0.22], 0.03, 'darkwood').stick([s * 0.28, 0.28, -0.18], [s * 0.32, 0, -0.22], 0.03, 'darkwood').stick([0, 0.84, -0.05], [s * 0.22, 1.1, -0.05], 0.012, 'silver'));
    return b.done();
  }),
  e('tv stand', 'home', 'furniture', () => {
    const b = m('tv stand').box([1.4, 0.48, 0.45], [0, 0.28, 0], { color: 'darkwood', round: 0.05 })
      .box([0.6, 0.3, 0.02], [-0.33, 0.28, 0.225], { color: 'black' })
      .box([0.5, 0.06, 0.3], [-0.33, 0.17, 0.05], { color: 'darkgray' })
      .box([0.55, 0.36, 0.02], [0.35, 0.28, 0.226], { color: 'wood' })
      .ball(0.03, [0.35, 0.3, 0.24], { color: 'silver' })
      .box([0.35, 0.03, 0.2], [0, 0.535, 0], { color: 'black' }).box([0.08, 0.1, 0.04], [0, 0.59, -0.02], { color: 'black' })
      .box([1.2, 0.7, 0.05], [0, 0.98, -0.04], { color: 'black', round: 0.1 })
      .box([1.12, 0.62, 0.01], [0, 0.98, -0.012], { color: '#2a4a7a', glow: true });
    b.pair((s) => b.cyl([0.05, 0.04, 0.05], [s * 0.62, 0.02, 0.15], { color: 'black' }).cyl([0.05, 0.04, 0.05], [s * 0.62, 0.02, -0.15], { color: 'black' }));
    return b.done();
  }),
  e('tweezers', 'home', 'bathroom', () => {
    const b = m('tweezers').box([0.02, 0.022, 0.012], [0, 0.128, 0], { color: 'silver', round: 0.5 });
    b.pair((s) => b.box([0.01, 0.13, 0.006], [s * 0.013, 0.066, 0], { color: 'silver', rot: [0, 0, s * 11], round: 0.3 }).box([0.011, 0.035, 0.007], [s * 0.014, 0.075, 0], { color: 'red', rot: [0, 0, s * 11], noInk: true }));
    return b.done();
  }),
  e('typewriter', 'study', 'office', () => {
    const b = m('typewriter').box([0.4, 0.12, 0.32], [0, 0.07, -0.02], { color: 'darkgreen', round: 0.3 })
      .box([0.36, 0.03, 0.18], [0, 0.09, 0.12], { color: 'black', rot: [20, 0, 0] })
      .cyl([0.04, 0.42, 0.04], [0, 0.16, -0.1], { color: 'black', rot: [0, 0, 90] })
      .box([0.2, 0.15, 0.004], [0, 0.23, -0.11], { color: 'white', rot: [-10, 0, 0] })
      .rod([-0.22, 0.17, -0.08], [-0.3, 0.21, -0.02], 0.012, 'silver');
    b.pair((s) => b.cyl([0.05, 0.02, 0.05], [s * 0.22, 0.16, -0.1], { color: 'darkgray', rot: [0, 0, 90] }));
    for (let r = 0; r < 3; r++) b.each(6, (i) => b.cyl([0.024, 0.014, 0.024], [-0.125 + i * 0.05 + (r % 2) * 0.012, 0.12 - r * 0.02, 0.06 + r * 0.045], { color: 'cream' }));
    return b.done();
  }),
  e('ufo', 'sky', 'flying saucers', () => {
    const b = m('ufo').ball([3.0, 0.7, 3.0], [0, 1.4, 0], { color: 'silver' })
      .torus([3.1, 3.1, 0.25], [0, 1.4, 0], { color: 'gray', rot: [90, 0, 0], tube: 0.08, name: 'rotor' })
      .ball([1.3, 1.0, 1.3], [0, 1.8, 0], { color: 'glass' })
      .cone([1.6, 1.05, 1.6], [0, 0.525, 0], { color: '#c8ffb0', glow: true, noInk: true });
    for (const [x, z] of around(8, 1.4)) b.ball(0.2, [x, 1.4, z], { color: x > 0 ? 'yellow' : 'cyan', glow: true, parent: 'rotor' });
    return b.done();
  }),
  e('ukelele', 'music', 'strings', () => {
    const b = m('ukelele').ball([0.24, 0.2, 0.07], [0, 0.11, 0], { color: '#d9a066' })
      .ball([0.19, 0.16, 0.07], [0, 0.26, 0], { color: '#d9a066' })
      .cyl([0.06, 0.01, 0.06], [0, 0.22, 0.034], { color: 'black', rot: [90, 0, 0] })
      .box([0.07, 0.015, 0.01], [0, 0.09, 0.036], { color: 'darkbrown' })
      .box([0.045, 0.28, 0.03], [0, 0.46, 0], { color: 'darkwood' })
      .box([0.06, 0.08, 0.03], [0, 0.64, 0], { color: 'darkwood' });
    b.pair((s) => b.ball(0.015, [s * 0.038, 0.63, 0], { color: 'silver' }).ball(0.015, [s * 0.038, 0.66, 0], { color: 'silver' }));
    b.each(4, (i) => b.stick([-0.012 + i * 0.008, 0.09, 0.04], [-0.012 + i * 0.008, 0.6, 0.018], 0.002, 'white', { noInk: true }));
    return b.done();
  }),
  e('ultrasound machine', 'clinic', 'hospital machines', () => {
    const b = m('ultrasound machine').box([0.6, 0.12, 0.7], [0, 0.14, 0], { color: 'lightgray', round: 0.3 })
      .box([0.2, 0.7, 0.2], [0, 0.55, -0.1], { color: 'white' })
      .box([0.7, 0.12, 0.5], [0, 0.95, 0.05], { color: 'white', round: 0.3 })
      .box([0.45, 0.01, 0.25], [0, 1.012, 0.08], { color: 'darkgray', noInk: true })
      .ball(0.05, [0.17, 1.02, 0.15], { color: 'skyblue' })
      .box([0.5, 0.38, 0.06], [0, 1.3, -0.12], { color: 'black', round: 0.2 })
      .box([0.44, 0.32, 0.01], [0, 1.3, -0.088], { color: '#1a1a2a', glow: true })
      .wedge([0.22, 0.18, 0.005], [0, 1.3, -0.08], { color: '#a0b0b8', glow: true, noInk: true })
      .rod([0.35, 0.95, 0.1], [0.42, 0.75, 0.15], 0.02, 'gray').capsule([0.04, 0.1, 0.04], [0.36, 1.05, 0.12], { color: 'white' });
    for (const [x, z] of [[0.25, 0.3], [-0.25, 0.3], [0.25, -0.3], [-0.25, -0.3]]) b.ball(0.08, [x, 0.04, z], { color: 'black' });
    return b.done();
  }),
  e('umbrella', 'wardrobe', 'rain gear', () => {
    const b = m('umbrella').cone([1.0, 0.35, 1.0], [0, 0.75, 0], { color: 'red', segs: 8 })
      .stick([0, 0.92, 0], [0, 1.0, 0], 0.02, 'black')
      .stick([0, 0.08, 0], [0, 0.6, 0], 0.02, 'black')
      .rod([0, 0.1, 0], [0, 0.04, 0], 0.03, 'brown').rod([0, 0.04, 0], [0.04, 0.015, 0], 0.03, 'brown').rod([0.04, 0.015, 0], [0.08, 0.05, 0], 0.03, 'brown');
    for (const [x, z] of around(8, 0.5)) b.ball(0.025, [x, 0.575, z], { color: 'black' });
    return b.done();
  }),
  e('unicycle', 'sports', 'circus', () => {
    const b = m('unicycle', { view: 'side' });
    tire(b, 0.5, 0.07, [0, 0.25, 0], 'silver', 'wheel');
    b.pair((s) => b.stick([s * 0.045, 0.25, 0], [s * 0.045, 0.55, 0], 0.025, 'red').stick([s * 0.06, 0.25, 0], [s * 0.06, 0.15, s * 0.08], 0.02, 'silver', { parent: 'wheel' }).box([0.08, 0.02, 0.04], [s * 0.1, 0.15, s * 0.08], { color: 'black', parent: 'wheel' }));
    return b.box([0.12, 0.04, 0.05], [0, 0.56, 0], { color: 'red' }).stick([0, 0.56, 0], [0, 0.85, -0.02], 0.03, 'silver').box([0.12, 0.05, 0.26], [0, 0.88, -0.02], { color: 'black', round: 0.6 }).done();
  }),
  e('uranium', 'nature', 'minerals', () =>
    m('uranium').cyl([0.14, 0.03, 0.14], [0, 0.015, 0], { color: 'darkgray', taper: 1.15 })
      .ball([0.06, 0.05, 0.05], [0, 0.05, 0], { color: 'lime', glow: true })
      .ball([0.045, 0.04, 0.04], [0.035, 0.045, 0.02], { color: '#7dff5a', glow: true })
      .ball([0.04, 0.035, 0.04], [-0.035, 0.043, -0.01], { color: 'lime', glow: true })
      .cyl([0.06, 0.008, 0.06], [0, 0.1, -0.06], { color: 'yellow', rot: [90, 0, 0] })
      .cyl([0.018, 0.009, 0.018], [0, 0.1, -0.06], { color: 'black', rot: [90, 0, 0], segs: 3 })
      .stick([0, 0.03, -0.06], [0, 0.07, -0.06], 0.008, 'darkgray')
      .done(),
  ),
  e('urinal', 'home', 'bathroom', () => {
    const b = m('urinal').box([0.7, 1.2, 0.08], [0, 0.6, -0.04], { color: '#cfe3e8' })
      .box([0.4, 0.6, 0.32], [0, 0.75, 0.15], { color: 'white', round: 0.6 })
      .ball([0.28, 0.4, 0.1], [0, 0.7, 0.28], { color: '#dfe6ea' })
      .cyl([0.08, 0.01, 0.06], [0, 0.55, 0.27], { color: 'skyblue', noInk: true })
      .stick([0, 1.05, 0.08], [0, 1.18, 0.08], 0.03, 'silver')
      .box([0.08, 0.06, 0.06], [0, 1.12, 0.09], { color: 'silver' })
      .stick([0.03, 1.12, 0.1], [0.1, 1.14, 0.1], 0.015, 'silver');
    b.each(3, (i) => b.box([0.7, 0.008, 0.002], [0, 0.3 + i * 0.3, 0.001], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('urn', 'home', 'decor', () =>
    m('urn').cyl([0.1, 0.03, 0.1], [0, 0.015, 0], { color: 'bronze' })
      .cyl([0.06, 0.04, 0.06], [0, 0.05, 0], { color: 'bronze' })
      .ball([0.18, 0.18, 0.18], [0, 0.15, 0], { color: 'bronze' })
      .cyl([0.182, 0.02, 0.182], [0, 0.16, 0], { color: 'gold' })
      .cyl([0.09, 0.04, 0.09], [0, 0.25, 0], { color: 'bronze' })
      .ball([0.1, 0.04, 0.1], [0, 0.275, 0], { color: 'bronze', name: 'lid', pivot: [0, 0.27, -0.05] })
      .ball(0.03, [0, 0.305, 0], { color: 'gold', parent: 'lid' })
      .done(),
  ),
  e('utility belt', 'wardrobe', 'belts', () => {
    const b = m('utility belt').torus([0.36, 0.3, 0.06], [0, 0.05, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.08 })
      .box([0.08, 0.07, 0.02], [0, 0.05, 0.155], { color: 'gold' });
    for (const d of [30, 150, 205, 250, 290, 335]) {
      const a = (d * Math.PI) / 180;
      b.box([0.06, 0.07, 0.04], [Math.cos(a) * 0.19, 0.045, Math.sin(a) * 0.16], { color: 'gray', rot: [0, 90 - d, 0], round: 0.3 });
    }
    return b.done();
  }),
  e('valley', 'nature', 'landforms', () =>
    m('valley').box([5, 0.2, 3], [0, 0.1, 0], { color: 'grass', round: 0.1 })
      .cone([2.4, 2.6, 2.6], [-1.5, 1.5, -0.3], { color: 'rock' }).cone([0.8, 0.85, 0.85], [-1.5, 2.37, -0.3], { color: 'snow' })
      .cone([2.2, 2.2, 2.4], [1.6, 1.3, -0.2], { color: '#8a8f80' }).cone([0.7, 0.7, 0.76], [1.6, 2.05, -0.2], { color: 'snow' })
      .box([0.5, 0.02, 1.6], [0.05, 0.21, 0.7], { color: 'water', rot: [0, 12, 0] })
      .box([0.5, 0.02, 1.6], [-0.05, 0.21, -0.7], { color: 'water', rot: [0, -12, 0] })
      .cone([0.35, 0.6, 0.35], [0.7, 0.5, 1.0], { color: 'darkgreen' }).cone([0.3, 0.5, 0.3], [-0.6, 0.45, 1.1], { color: 'darkgreen' })
      .done(),
  ),
  e('valve', 'workshop', 'plumbing', () =>
    m('valve').cyl([0.04, 0.2, 0.04], [0, 0.03, 0], { color: 'copper', rot: [0, 0, 90] })
      .ball([0.07, 0.06, 0.06], [0, 0.035, 0], { color: 'brass' })
      .cyl([0.05, 0.025, 0.05], [0.06, 0.03, 0], { color: 'brass', rot: [0, 0, 90], segs: 6 })
      .cyl([0.05, 0.025, 0.05], [-0.06, 0.03, 0], { color: 'brass', rot: [0, 0, 90], segs: 6 })
      .stick([0, 0.06, 0], [0, 0.1, 0], 0.012, 'brass')
      .torus([0.08, 0.08, 0.012], [0, 0.1, 0], { color: 'red', rot: [90, 0, 0], tube: 0.15 })
      .stick([-0.035, 0.1, 0], [0.035, 0.1, 0], 0.008, 'red').stick([0, 0.1, -0.035], [0, 0.1, 0.035], 0.008, 'red')
      .done(),
  ),
  e('van', 'garage', 'cars', () => {
    const b = m('van', { view: 'side' }).box([1.9, 1.55, 4.3], [0, 1.2, -0.25], { color: 'white', round: 0.35 })
      .box([1.86, 0.7, 0.8], [0, 0.8, 2.1], { color: 'white', round: 0.5 })
      .box([1.92, 0.55, 3.1], [0, 1.55, -0.45], { color: 'glass', round: 0.3 })
      .box([1.7, 0.6, 0.1], [0, 1.5, 1.88], { color: 'glass', rot: [-25, 0, 0] })
      .box([1.92, 0.12, 4.4], [0, 0.85, -0.2], { color: 'blue', noInk: true })
      .stick([0.97, 0.5, 0.1], [0.97, 1.2, 0.1], 0.02, 'gray', { noInk: true });
    b.pair((s) => b.ball([0.3, 0.18, 0.08], [s * 0.65, 0.9, 2.68], { color: 'yellow', glow: true }));
    axle(b, 0.7, 0.24, 0.85, 1.6);
    return axle(b, 0.7, 0.24, 0.85, -1.6).done();
  }),
  e('vanilla', 'food', 'spices', () => {
    const b = m('vanilla').cyl([0.07, 0.1, 0.07], [0, 0.05, 0], { color: 'glass' }).label('VANILLA', [0.06, 0.03], [0, 0.045, 0.028], { color: 'cream' });
    for (const [x, z, tx] of [[-0.015, 0, -0.04], [0.01, 0.01, 0.02], [0.005, -0.012, -0.005], [0.018, -0.005, 0.05]]) b.rod([x, 0.02, z], [tx, 0.24, z], 0.009, 'darkbrown');
    b.rod([0.02, 0.1, 0], [0.07, 0.18, 0.02], 0.006, 'green').ball(0.02, [0.07, 0.19, 0.02], { color: 'yellow' });
    for (const [x, y] of around(5, 0.022)) b.ball([0.022, 0.012, 0.01], [0.07 + x, 0.19 + y, 0.025], { color: '#f3e6a0', rot: [0, 0, (Math.atan2(y, x) * 180) / Math.PI] });
    return b.done();
  }),
  e('vanilla wafer', 'food', 'cookies', () => {
    const b = m('vanilla wafer');
    for (const [x, y, z] of [[0, 0.007, 0], [0.004, 0.022, 0.003], [-0.003, 0.037, -0.002], [0.05, 0.007, 0.02]] as V[]) b.cyl([0.045, 0.012, 0.045], [x, y, z], { color: '#e8c07a' }).ball([0.042, 0.008, 0.042], [x, y + 0.006, z], { color: '#d9a85a' });
    return b.done();
  }),
  e('vanity', 'home', 'furniture', () => {
    const b = m('vanity').box([1.1, 0.05, 0.45], [0, 0.75, 0], { color: 'white' })
      .cyl([0.55, 0.03, 0.7], [0, 1.18, -0.18], { color: 'glass', rot: [90, 0, 0] })
      .torus([0.6, 0.75, 0.04], [0, 1.18, -0.18], { color: 'gold', tube: 0.08 })
      .cyl([0.05, 0.08, 0.05], [0.3, 0.815, 0.05], { color: 'pink' }).ball(0.03, [0.3, 0.87, 0.05], { color: 'gold' })
      .cyl([0.02, 0.06, 0.02], [0.4, 0.805, 0.1], { color: 'red' });
    b.pair((s) => b.box([0.35, 0.72, 0.43], [s * 0.37, 0.36, 0], { color: 'white' }).ball(0.03, [s * 0.37, 0.55, 0.22], { color: 'gold' }).ball(0.03, [s * 0.37, 0.25, 0.22], { color: 'gold' }).box([0.33, 0.006, 0.002], [s * 0.37, 0.4, 0.216], { color: 'gray', noInk: true }).stick([s * 0.28, 0.77, -0.18], [s * 0.28, 0.95, -0.18], 0.03, 'gold'));
    return b.done();
  }),
  e('vase', 'home', 'decor', () => {
    const b = m('vase').cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'blue' }).ball([0.16, 0.2, 0.16], [0, 0.11, 0], { color: 'blue' })
      .cyl([0.07, 0.08, 0.07], [0, 0.23, 0], { color: 'blue' }).cyl([0.1, 0.02, 0.1], [0, 0.27, 0], { color: 'blue' })
      .torus([0.165, 0.165, 0.03], [0, 0.12, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06, noInk: true });
    for (const [x, y, z, c] of [[-0.07, 0.42, 0.02, 'red'], [0.07, 0.41, 0.0, 'yellow'], [0, 0.46, -0.03, 'pink']] as Array<[number, number, number, string]>) b.rod([0, 0.26, 0], [x, y, z], 0.01, 'green').ball([0.07, 0.06, 0.04], [x, y, z], { color: c }).ball(0.025, [x, y, z + 0.02], { color: 'gold' });
    return b.done();
  }),
  e('vegetable stand', 'places', 'market', () => {
    const b = m('vegetable stand').box([2.4, 0.9, 1.0], [0, 0.45, 0], { color: 'wood' })
      .label('FRESH', [1.2, 0.35], [0, 0.55, 0.51], { color: 'cream' });
    (['lime', 'tomato', 'orange'] as const).forEach((c, i) => {
      const x = (i - 1) * 0.75;
      b.box([0.7, 0.2, 0.6], [x, 1.0, 0.05], { color: 'lightwood', rot: [15, 0, 0] }).ball([0.6, 0.18, 0.5], [x, 1.1, 0.05], { color: c, rot: [15, 0, 0] });
    });
    b.pair((s) => b.stick([s * 1.15, 0.9, -0.45], [s * 1.15, 2.2, -0.45], 0.08, 'wood').stick([s * 1.15, 0.9, 0.45], [s * 1.15, 2.05, 0.45], 0.08, 'wood'));
    b.each(6, (i) => b.box([0.42, 0.06, 1.3], [-1.05 + i * 0.42, 2.15, 0], { color: i % 2 ? 'white' : 'red', rot: [-8, 0, 0] }));
    return b.done();
  }),
  e('veil', 'wardrobe', 'wedding', () =>
    m('veil').cyl([0.25, 0.03, 0.25], [0, 0.015, 0], { color: 'darkwood' })
      .stick([0, 0.03, 0], [0, 0.72, 0], 0.03, 'darkwood')
      .cyl([0.08, 0.1, 0.08], [0, 0.76, 0], { color: FORM })
      .ball([0.17, 0.21, 0.19], [0, 0.9, 0], { color: FORM })
      .cyl([0.45, 0.7, 0.32], [0, 0.62, -0.06], { color: 'white', taper: 0.38 })
      .ball([0.2, 0.12, 0.2], [0, 0.97, -0.025], { color: 'white' })
      .torus([0.16, 0.16, 0.02], [0, 0.985, 0.01], { color: 'silver', rot: [70, 0, 0], tube: 0.12 })
      .ball(0.025, [0, 1.0, 0.085], { color: 'white' })
      .done(),
  ),
  e('velvet', 'home', 'fabrics', () =>
    m('velvet').cyl([0.12, 0.35, 0.12], [0, 0.06, -0.04], { color: 'purple', rot: [0, 0, 90] })
      .box([0.33, 0.012, 0.22], [0, 0.006, 0.1], { color: 'purple', round: 0.3 })
      .box([0.34, 0.02, 0.01], [0, 0.09, 0.012], { color: '#b070d0', noInk: true })
      .box([0.31, 0.004, 0.02], [0, 0.013, 0.12], { color: '#b070d0', noInk: true })
      .done(),
  ),
  e('velvet rope', 'places', 'street furniture', () => {
    const b = m('velvet rope').rod([-0.68, 0.92, 0], [-0.3, 0.72, 0], 0.05, 'darkred').rod([-0.3, 0.72, 0], [0.3, 0.72, 0], 0.05, 'darkred').rod([0.3, 0.72, 0], [0.68, 0.92, 0], 0.05, 'darkred');
    b.pair((s) => b.cyl([0.32, 0.12, 0.32], [s * 0.7, 0.06, 0], { color: 'brass', taper: 0.5 }).cyl([0.06, 0.92, 0.06], [s * 0.7, 0.5, 0], { color: 'brass' }).ball(0.1, [s * 0.7, 1.0, 0], { color: 'brass' }));
    return b.done();
  }),
  e('vending machine', 'tech', 'machines', () => {
    const b = m('vending machine').box([0.9, 1.8, 0.8], [0, 0.9, 0], { color: 'red', round: 0.1 })
      .box([0.6, 1.1, 0.04], [-0.1, 1.15, 0.4], { color: 'glass' })
      .box([0.18, 0.5, 0.04], [0.33, 1.2, 0.41], { color: 'darkgray' })
      .box([0.06, 0.02, 0.01], [0.33, 1.38, 0.435], { color: 'black' })
      .box([0.6, 0.18, 0.04], [-0.1, 0.35, 0.41], { color: 'black' })
      .label('SNACKS', [0.6, 0.15], [-0.1, 1.67, 0.41], { color: 'white' });
    const cs = ['yellow', 'blue', 'orange', 'green', 'purple', 'brown'];
    for (let r = 0; r < 4; r++) b.each(3, (i) => b.box([0.13, 0.15, 0.02], [-0.3 + i * 0.2, 1.55 - r * 0.25, 0.43], { color: cs[(r + i) % 6], noInk: true }));
    b.each(3, (i) => b.box([0.03, 0.03, 0.01], [0.3 + (i % 2) * 0.06, 1.25 - i * 0.05, 0.435], { color: 'silver', noInk: true }));
    return b.done();
  }),
  e('venison', 'food', 'meat', () =>
    m('venison').box([0.4, 0.03, 0.26], [0, 0.015, 0], { color: 'wood' })
      .ball([0.26, 0.15, 0.18], [-0.03, 0.105, 0], { color: '#6b2a1a' })
      .cyl([0.12, 0.016, 0.11], [0.13, 0.07, 0.02], { color: '#b5485a', rot: [0, 0, 70] })
      .cyl([0.12, 0.016, 0.11], [0.15, 0.065, 0.03], { color: '#b5485a', rot: [0, 0, 60] })
      .stick([-0.14, 0.11, 0], [-0.22, 0.14, 0], 0.03, 'cream').ball(0.045, [-0.225, 0.14, 0], { color: 'cream' })
      .rod([-0.05, 0.18, 0.02], [0.05, 0.17, 0.05], 0.012, 'darkgreen')
      .done(),
  ),
  e('vent', 'home', 'fixtures', () => {
    const b = m('vent').box([0.25, 0.2, 0.03], [0, 0.1, 0], { color: 'lightgray', round: 0.2 }).box([0.21, 0.16, 0.01], [0, 0.1, 0.012], { color: 'black' });
    b.each(5, (i) => b.box([0.21, 0.018, 0.02], [0, 0.04 + i * 0.03, 0.016], { color: 'gray', rot: [30, 0, 0] }));
    b.pair((s) => b.ball(0.012, [s * 0.11, 0.185, 0.016], { color: 'silver' }).ball(0.012, [s * 0.11, 0.015, 0.016], { color: 'silver' }));
    return b.done();
  }),
  e('ventilator', 'clinic', 'hospital machines', () => {
    const b = m('ventilator').box([0.6, 0.1, 0.6], [0, 0.15, 0], { color: 'lightgray', round: 0.3 })
      .box([0.12, 0.6, 0.12], [0, 0.5, 0], { color: 'silver' })
      .box([0.5, 0.45, 0.35], [0, 1.0, 0], { color: 'white', round: 0.2 })
      .box([0.36, 0.26, 0.02], [0, 1.05, 0.18], { color: '#1a2a4a', glow: true })
      .rod([-0.15, 1.05, 0.192], [-0.05, 1.1, 0.192], 0.008, 'lime', { glow: true }).rod([-0.05, 1.1, 0.192], [0.05, 1.0, 0.192], 0.008, 'lime', { glow: true }).rod([0.05, 1.0, 0.192], [0.15, 1.08, 0.192], 0.008, 'lime', { glow: true })
      .cyl([0.15, 0.22, 0.15], [-0.33, 0.95, 0], { color: 'skyblue' })
      .rod([0.2, 0.9, 0.1], [0.45, 1.2, 0.3], 0.045, 'skyblue').rod([0.45, 1.2, 0.3], [0.4, 1.45, 0.2], 0.045, 'skyblue')
      .rod([0.2, 0.85, 0.05], [0.5, 1.05, 0.2], 0.045, 'skyblue');
    b.each(3, (i) => b.torus([0.16, 0.16, 0.03], [-0.33, 0.87 + i * 0.08, 0], { color: '#7ab0d0', rot: [90, 0, 0] }));
    for (const [x, z] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) b.ball(0.08, [x, 0.04, z], { color: 'black' });
    return b.done();
  }),
  e('venus flytrap', 'garden', 'plants', () => {
    const b = pot(m('venus flytrap'), 0.08, 0.06);
    for (const [x, y, z, ry] of [[0, 0.135, 0.02, 0], [-0.045, 0.11, 0, -50], [0.048, 0.115, -0.01, 50]] as Array<[number, number, number, number]>) {
      b.rod([0, 0.06, 0], [x * 0.8, y - 0.01, z - 0.01], 0.008, 'green')
        .ball([0.045, 0.014, 0.035], [x, y, z], { color: 'lime', rot: [20, ry, 0] })
        .ball([0.045, 0.014, 0.035], [x, y + 0.024, z], { color: 'lime', rot: [-25, ry, 0] })
        .ball([0.036, 0.01, 0.026], [x, y + 0.012, z + 0.004], { color: 'red', rot: [0, ry, 0] });
    }
    return b.done();
  }),
  e('vertical blinds', 'home', 'window things', () => {
    const b = m('vertical blinds').box([1.5, 1.85, 0.15], [0, 0.925, -0.12], { color: 'white', round: 0.05 })
      .box([1.4, 1.7, 0.02], [0, 0.93, -0.04], { color: 'skyblue' })
      .box([1.4, 0.06, 0.08], [0, 1.8, 0], { color: 'white' })
      .stick([0.72, 1.78, 0.04], [0.72, 1.0, 0.04], 0.01, 'silver');
    b.each(8, (i) => b.box([0.11, 1.75, 0.014], [-0.6 + i * 0.172, 0.9, 0.01], { color: i % 2 ? 'cream' : 'beige', rot: [0, 65, 0] }));
    return b.done();
  }),
  e('vest', 'wardrobe', 'clothes', () => {
    const b = form('vest', '#7a4a2a', { len: 0.52 })
      .wedge([0.15, 0.2, 0.02], [0, 1.0, 0.118], { color: 'white', rot: [0, 0, 180] })
      .box([0.06, 0.025, 0.02], [0, 1.08, 0.12], { color: 'white' });
    b.pair((s) => b.rod([s * 0.19, 1.03, 0], [s * 0.27, 0.62, 0], 0.08, 'white').box([0.07, 0.01, 0.005], [s * 0.1, 0.78, 0.12], { color: 'darkbrown', noInk: true }));
    b.each(3, (i) => b.ball(0.02, [0, 0.85 - i * 0.07, 0.122], { color: 'gold' }));
    return b.done();
  }),
  e('vhs', 'tech', 'media', () =>
    m('vhs').box([0.19, 0.105, 0.025], [0, 0.0525, 0], { color: 'black', round: 0.1 })
      .box([0.09, 0.035, 0.002], [0, 0.055, 0.013], { color: '#3a3a4a', noInk: true })
      .cyl([0.03, 0.004, 0.03], [0.03, 0.055, 0.014], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.03, 0.004, 0.03], [-0.03, 0.055, 0.014], { color: 'white', rot: [90, 0, 0] })
      .box([0.15, 0.022, 0.002], [0, 0.09, 0.013], { color: 'white', noInk: true })
      .box([0.21, 0.125, 0.035], [0.02, 0.0625, -0.04], { color: 'navy', round: 0.1, rot: [0, -8, 0] })
      .box([0.212, 0.03, 0.036], [0.02, 0.09, -0.04], { color: 'red', noInk: true, rot: [0, -8, 0] })
      .done(),
  ),
  e('video game', 'tech', 'gaming', () => {
    const b = m('video game').box([0.14, 0.03, 0.07], [0, 0.025, 0], { color: 'darkgray', round: 0.6 })
      .box([0.03, 0.008, 0.01], [-0.04, 0.042, 0], { color: 'black' }).box([0.01, 0.008, 0.03], [-0.04, 0.042, 0], { color: 'black' });
    b.pair((s) => b.ball([0.06, 0.035, 0.09], [s * 0.06, 0.02, 0.025], { color: 'darkgray', rot: [0, s * 15, 0] }).cyl([0.018, 0.012, 0.018], [s * 0.02, 0.044, 0.02], { color: 'black' }));
    for (const [x, z, c] of [[0.04, -0.012, 'yellow'], [0.04, 0.012, 'green'], [0.028, 0, 'blue'], [0.052, 0, 'red']] as Array<[number, number, string]>) b.ball(0.011, [x, 0.041, z], { color: c });
    return b.done();
  }),
  e('video game store', 'places', 'shops', () => {
    const b = shop('video game store', 'GAMES', 'purple', 'lime')
      .box([3, 1.2, 0.5], [0, 5.0, 0], { color: 'darkgray', round: 0.5 })
      .box([0.6, 0.2, 0.1], [-0.7, 5.05, 0.27], { color: 'black' }).box([0.2, 0.6, 0.1], [-0.7, 5.05, 0.27], { color: 'black' });
    b.pair((s) => b.ball([1.0, 1.2, 0.5], [s * 1.3, 4.75, 0], { color: 'darkgray' }));
    for (const [x, y, c] of [[0.6, 5.25, 'yellow'], [0.6, 4.85, 'green'], [0.4, 5.05, 'blue'], [0.8, 5.05, 'red']] as Array<[number, number, string]>) b.ball(0.18, [x, y, 0.27], { color: c });
    return b.done();
  }),
  e('video store', 'places', 'shops', () => {
    const b = shop('video store', 'VIDEO', 'navy', 'yellow')
      .box([2.6, 1.4, 0.4], [0, 4.95, 0], { color: 'black', round: 0.1 })
      .box([1.6, 0.3, 0.05], [0, 5.35, 0.21], { color: 'white' })
      .box([1.2, 0.45, 0.05], [0, 4.85, 0.21], { color: '#3a3a4a' });
    b.pair((s) => b.cyl([0.35, 0.06, 0.35], [s * 0.3, 4.85, 0.23], { color: 'white', rot: [90, 0, 0] }).box([0.5, 0.75, 0.04], [s * 1.6, 1.35, 2.07], { color: s > 0 ? 'red' : 'orange', noInk: true }).box([0.5, 0.75, 0.04], [s * 2.25, 1.35, 2.07], { color: s > 0 ? 'teal' : 'purple', noInk: true }));
    return b.done();
  }),
  e('viking helmet', 'armory', 'helmets', () => {
    const b = m('viking helmet').ball([0.24, 0.2, 0.26], [0, 0.1, 0], { color: 'steel' })
      .cyl([0.25, 0.05, 0.27], [0, 0.06, 0], { color: 'bronze' })
      .box([0.025, 0.08, 0.015], [0, 0.04, 0.137], { color: 'bronze' })
      .torus([0.24, 0.2, 0.02], [0, 0.1, 0], { color: 'bronze', rot: [0, 90, 0], tube: 0.06 });
    b.pair((s) => b.rod([s * 0.11, 0.12, 0], [s * 0.2, 0.2, 0.02], 0.05, 'cream').rod([s * 0.2, 0.2, 0.02], [s * 0.23, 0.29, 0.04], 0.035, 'cream').cone([0.03, 0.05, 0.03], [s * 0.232, 0.32, 0.045], { color: 'cream' }));
    return b.done();
  }),
  e('vine', 'garden', 'plants', () => {
    const b = m('vine').box([0.18, 2.4, 0.18], [0, 1.2, 0], { color: 'wood' });
    let prev: V = [0.12, 0.05, 0];
    for (let i = 1; i <= 8; i++) {
      const a = i * 1.3, p: V = [Math.cos(a) * 0.14, 0.05 + i * 0.29, Math.sin(a) * 0.14];
      b.rod(prev, p, 0.035, 'green').ball([0.2, 0.14, 0.06], [Math.cos(a) * 0.24, p[1] + 0.03, Math.sin(a) * 0.24], { color: i % 2 ? 'leaf' : 'darkgreen', rot: [0, (-a * 180) / Math.PI + 90, 0] });
      prev = p;
    }
    return b.done();
  }),
  e('vinegar', 'food', 'condiments', () => bottle(m('vinegar'), 0, { h: 0.25, d: 0.075, glass: '#e8d9a0', cap: 'red', label: 'VINEGAR', labelC: 'cream' }).done()),
  e('vineyard', 'farm', 'fields', () => {
    const b = m('vineyard').box([8, 0.15, 6], [0, 0.075, 0], { color: 'dirt', round: 0.05 })
      .box([2.0, 2.4, 1.6], [2.6, 1.35, -2.0], { color: 'cream' }).wedge([2.3, 0.9, 1.8], [2.6, 3.0, -2.0], { color: 'darkred' })
      .box([0.6, 1.1, 0.05], [2.6, 0.7, -1.18], { color: 'darkwood', name: 'door', pivot: [2.3, 0.7, -1.18] });
    b.each(4, (i) => {
      const z = -1.6 + i * 1.3;
      b.box([5, 1.0, 0.45], [-0.9, 0.65, z], { color: i % 2 ? 'leaf' : 'green', round: 0.5 });
      b.each(3, (k) => b.ball([0.18, 0.26, 0.14], [-2.6 + k * 1.6, 0.5, z + 0.24], { color: 'purple' }));
      b.stick([-3.5, 0.15, z], [-3.5, 1.3, z], 0.08, 'wood');
    });
    return b.done();
  }),
  e('vintage car', 'garage', 'cars', () => {
    const b = m('vintage car', { view: 'side' }).box([1.6, 0.08, 2.6], [0, 0.55, -0.1], { color: 'black' })
      .box([1.3, 0.6, 1.6], [0, 0.95, -0.5], { color: 'black', round: 0.2 })
      .box([0.9, 0.5, 1.0], [0, 0.95, 0.8], { color: 'black', round: 0.2 })
      .box([0.9, 0.65, 0.1], [0, 1.0, 1.32], { color: 'brass' })
      .box([1.2, 0.5, 0.04], [0, 1.5, 0.25], { color: 'glass' })
      .box([1.3, 0.06, 1.4], [0, 2.0, -0.45], { color: 'black' })
      .stick([0, 1.3, 0.1], [0.15, 1.4, -0.1], 0.03, 'black');
    b.pair((s) => {
      b.stick([s * 0.62, 1.25, 0.25], [s * 0.62, 2.0, 0.25], 0.04, 'black').stick([s * 0.62, 1.25, -1.1], [s * 0.62, 2.0, -1.1], 0.04, 'black');
      b.ball([0.2, 0.2, 0.15], [s * 0.45, 1.2, 1.38], { color: 'brass' }).ball([0.14, 0.14, 0.04], [s * 0.45, 1.2, 1.46], { color: 'yellow', glow: true });
      b.ball([0.32, 0.22, 0.85], [s * 0.66, 0.78, 1.0], { color: 'black' }).ball([0.32, 0.22, 0.85], [s * 0.66, 0.78, -1.0], { color: 'black' });
      tire(b, 0.75, 0.12, [s * 0.68, 0.375, 1.0], 'cream');
      tire(b, 0.75, 0.12, [s * 0.68, 0.375, -1.0], 'cream');
    });
    return b.done();
  }),
  e('vintage radio', 'music', 'audio gear', () => {
    const b = m('vintage radio').box([0.34, 0.03, 0.19], [0, 0.015, 0], { color: 'darkwood' })
      .box([0.32, 0.26, 0.18], [0, 0.15, 0], { color: 'wood', round: 0.15 })
      .cyl([0.32, 0.18, 0.32], [0, 0.26, 0], { color: 'wood', rot: [90, 0, 0] })
      .cyl([0.22, 0.01, 0.22], [0, 0.27, 0.09], { color: '#e8d8b0', rot: [90, 0, 0] })
      .cyl([0.07, 0.01, 0.07], [0, 0.1, 0.092], { color: 'yellow', rot: [90, 0, 0], glow: true });
    b.each(3, (i) => b.stick([(i - 1) * 0.05, 0.18, 0.1], [(i - 1) * 0.05, 0.36 - Math.abs(i - 1) * 0.02, 0.1], 0.012, 'darkwood'));
    b.pair((s) => b.cyl([0.04, 0.02, 0.04], [s * 0.1, 0.08, 0.095], { color: 'darkbrown', rot: [90, 0, 0] }));
    return b.done();
  }),
  e('violin', 'music', 'strings', () => {
    const b = m('violin').ball([0.2, 0.16, 0.06], [0, 0.1, 0], { color: '#b5521f' })
      .ball([0.14, 0.1, 0.055], [0, 0.18, 0], { color: '#b5521f' })
      .ball([0.16, 0.13, 0.06], [0, 0.25, 0], { color: '#b5521f' })
      .box([0.03, 0.24, 0.02], [0, 0.32, 0.03], { color: 'black' })
      .box([0.025, 0.08, 0.025], [0, 0.48, 0], { color: '#8a3a12' })
      .ball([0.035, 0.04, 0.03], [0, 0.535, 0.005], { color: '#8a3a12' })
      .box([0.05, 0.012, 0.01], [0, 0.14, 0.035], { color: 'cream' })
      .box([0.035, 0.06, 0.008], [0, 0.07, 0.031], { color: 'black' });
    b.pair((s) => b.stick([s * 0.04, 0.12, 0.031], [s * 0.04, 0.2, 0.031], 0.006, 'black', { noInk: true }).ball(0.012, [s * 0.02, 0.47, 0], { color: 'black' }));
    return b.done();
  }),
  e('vise', 'workshop', 'bench tools', () =>
    m('vise').box([0.16, 0.03, 0.12], [0, 0.015, 0], { color: 'blue' })
      .box([0.1, 0.08, 0.2], [0, 0.07, 0], { color: 'blue', round: 0.2 })
      .box([0.14, 0.06, 0.03], [0, 0.14, -0.06], { color: 'blue' })
      .box([0.14, 0.04, 0.008], [0, 0.15, -0.042], { color: 'darkgray' })
      .box([0.14, 0.06, 0.03], [0, 0.14, 0.04], { color: 'blue' })
      .box([0.14, 0.04, 0.008], [0, 0.15, 0.022], { color: 'darkgray' })
      .stick([0, 0.09, 0.05], [0, 0.09, 0.15], 0.02, 'silver')
      .stick([-0.08, 0.09, 0.15], [0.08, 0.09, 0.15], 0.012, 'silver')
      .ball(0.022, [0.085, 0.09, 0.15], { color: 'silver' }).ball(0.022, [-0.085, 0.09, 0.15], { color: 'silver' })
      .done(),
  ),
  e('volcano', 'nature', 'landforms', () =>
    m('volcano').cyl([4, 3.2, 4], [0, 1.6, 0], { color: '#6b5a4a', taper: 0.3 })
      .cyl([1.1, 0.1, 1.1], [0, 3.2, 0], { color: 'flame', glow: true })
      .rod([0.3, 3.15, 0.3], [0.9, 1.8, 1.2], 0.25, 'orange', { glow: true })
      .rod([-0.4, 3.1, 0.35], [-1.2, 1.4, 1.1], 0.22, 'orange', { glow: true })
      .ball([0.9, 0.8, 0.9], [0.1, 3.7, 0], { color: 'gray' })
      .ball([1.3, 1.0, 1.1], [0.5, 4.4, -0.2], { color: 'lightgray' })
      .done(),
  ),
  e('volleyball', 'sports', 'balls', () =>
    m('volleyball').ball(0.21, [0, 0.105, 0], { color: 'white' })
      .torus([0.214, 0.214, 0.06], [0, 0.105, 0], { color: 'blue', tube: 0.04, noInk: true })
      .torus([0.214, 0.214, 0.06], [0, 0.105, 0], { color: 'yellow', tube: 0.04, noInk: true, rot: [0, 90, 0] })
      .torus([0.214, 0.214, 0.06], [0, 0.105, 0], { color: 'blue', tube: 0.04, noInk: true, rot: [90, 0, 0] })
      .done(),
  ),
  e('volleyball court', 'sports', 'courts', () => {
    const b = m('volleyball court').box([3.6, 0.4, 5.6], [0, 0.2, 0], { color: 'grass', round: 0.05 })
      .box([3.2, 0.06, 5.2], [0, 0.43, 0], { color: 'sand' })
      .box([3.5, 0.7, 0.03], [0, 2.3, 0], { color: 'darkgray' })
      .box([3.55, 0.08, 0.05], [0, 2.68, 0], { color: 'white' })
      .ball(0.35, [0.8, 0.635, 1.2], { color: 'yellow' })
      .box([2.8, 0.012, 0.06], [0, 0.462, 0], { color: 'white', noInk: true });
    b.pair((s) => b.cyl([0.12, 2.5, 0.12], [s * 1.75, 1.7, 0], { color: 'silver' }).box([0.06, 0.012, 4.8], [s * 1.4, 0.462, 0], { color: 'white', noInk: true }).box([2.8, 0.012, 0.06], [0, 0.462, s * 2.4], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('voodoo doll', 'fantasy', 'magic items', () => {
    const b = m('voodoo doll').capsule([0.1, 0.12, 0.06], [0, 0.12, 0], { color: '#c2a36b' })
      .ball([0.11, 0.1, 0.08], [0, 0.23, 0], { color: '#c2a36b' })
      .rod([-0.1, 0.16, 0], [0.1, 0.16, 0], 0.04, '#c2a36b')
      .stick([-0.025, 0.205, 0.04], [0.025, 0.205, 0.04], 0.005, 'darkbrown', { noInk: true })
      .stick([0, 0.08, 0.031], [0, 0.18, 0.031], 0.004, 'darkbrown', { noInk: true });
    b.pair((s) => b.rod([s * 0.03, 0.08, 0], [s * 0.05, 0.02, 0], 0.045, '#c2a36b').cyl([0.026, 0.006, 0.026], [s * 0.025, 0.24, 0.04], { color: 'black', rot: [90, 0, 0] }));
    for (const [a, c] of [[[0.03, 0.14, 0.03], 'red'], [[-0.04, 0.27, 0.03], 'yellow'], [[0.06, 0.25, -0.01], 'blue']] as Array<[V, string]>) b.stick([a[0] * 0.4, a[1] - 0.02, 0], a, 0.004, 'silver').ball(0.016, a, { color: c });
    return b.done();
  }),
  e('voucher', 'study', 'documents', () => {
    const b = m('voucher').box([0.18, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' })
      .box([0.17, 0.08, 0.004], [0, 0.065, 0], { color: 'cream', round: 0.05 })
      .box([0.035, 0.08, 0.005], [0.068, 0.065, 0], { color: 'orange', round: 0.05 })
      .label('50% OFF', [0.11, 0.04], [-0.018, 0.07, 0.006], { color: 'yellow' });
    b.each(5, (i) => b.box([0.002, 0.008, 0.006], [0.049, 0.033 + i * 0.016, 0], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('vr headset', 'tech', 'gadgets', () =>
    m('vr headset').box([0.19, 0.1, 0.1], [0, 0.05, 0], { color: 'white', round: 0.5 })
      .box([0.17, 0.08, 0.01], [0, 0.05, 0.051], { color: 'black', round: 0.4 })
      .box([0.18, 0.08, 0.03], [0, 0.05, -0.06], { color: 'darkgray', round: 0.4 })
      .torus([0.2, 0.26, 0.03], [0, 0.02, -0.17], { color: 'darkgray', rot: [90, 0, 0], tube: 0.1 })
      .ball(0.012, [0.05, 0.07, 0.057], { color: 'gray' }).ball(0.012, [-0.05, 0.07, 0.057], { color: 'gray' })
      .done(),
  ),
  e('waffle', 'food', 'breakfast', () => {
    const b = m('waffle').cyl([0.22, 0.012, 0.22], [0, 0.006, 0], { color: 'white' })
      .box([0.15, 0.025, 0.15], [0, 0.0245, 0], { color: '#d9963e', round: 0.2 })
      .box([0.15, 0.025, 0.15], [0.005, 0.05, 0], { color: '#e0a24e', round: 0.2, rot: [0, 20, 0] })
      .box([0.035, 0.02, 0.035], [0.01, 0.072, 0.005], { color: 'yellow', rot: [0, 35, 0] })
      .ball([0.08, 0.008, 0.07], [-0.01, 0.063, 0.015], { color: '#8a4a1a', noInk: true });
    const c = Math.cos((20 * Math.PI) / 180), sn = Math.sin((20 * Math.PI) / 180);
    for (const u of [-0.045, 0, 0.045]) for (const v of [-0.045, 0, 0.045]) b.box([0.03, 0.003, 0.03], [0.005 + u * c + v * sn, 0.0625, -u * sn + v * c], { color: '#b8742f', noInk: true, rot: [0, 20, 0] });
    return b.done();
  }),
  e('waffle iron', 'kitchen', 'appliances', () =>
    m('waffle iron').cyl([0.26, 0.06, 0.26], [0, 0.03, 0], { color: 'black' })
      .cyl([0.24, 0.012, 0.24], [0, 0.065, 0], { color: 'silver' })
      .cyl([0.26, 0.05, 0.26], [0, 0.095, 0], { color: 'black', name: 'lid', pivot: [0, 0.07, -0.13] })
      .box([0.04, 0.025, 0.12], [0, 0.1, 0.18], { color: 'black', parent: 'lid' })
      .box([0.16, 0.004, 0.16], [0, 0.121, 0], { color: '#3a3a3a', noInk: true, rot: [0, 45, 0], parent: 'lid' })
      .ball(0.015, [0.08, 0.035, 0.12], { color: 'red', glow: true })
      .done(),
  ),
  e('wagon (traditional)', 'garage', 'carts', () => {
    const b = m('wagon (traditional)', { view: 'side' }).box([1.4, 0.5, 3.0], [0, 0.95, 0], { color: 'wood' })
      .box([1.5, 1.0, 2.6], [0, 1.6, 0], { color: 'cream', round: 0.9 })
      .cyl([0.9, 0.05, 0.6], [0, 1.6, 1.3], { color: 'darkbrown', rot: [90, 0, 0] })
      .rod([0, 0.8, 1.5], [0, 0.5, 2.6], 0.08, 'darkwood');
    b.each(3, (i) => b.box([1.52, 1.0, 0.06], [0, 1.6, -0.8 + i * 0.8], { color: 'tan', round: 0.9, noInk: true }));
    b.pair((s) => tire(b, 1.2, 0.12, [s * 0.8, 0.6, -1.0], 'wood').cyl([0.1, 0.12, 0.1], [s * 0.8, 0.45, 1.0], { color: 'darkwood', rot: [0, 0, 90] }));
    b.pair((s) => tire(b, 0.9, 0.12, [s * 0.8, 0.45, 1.0], 'wood'));
    return b.done();
  }),
  e('walk sign', 'ideas', 'signs', () => {
    const b = m('walk sign').box([0.2, 0.03, 0.12], [0, 0.015, 0], { color: 'darkgray' })
      .box([0.3, 0.3, 0.12], [0, 0.18, 0], { color: 'black', round: 0.1 })
      .box([0.32, 0.02, 0.1], [0, 0.34, 0.06], { color: 'black' })
      .box([0.26, 0.26, 0.01], [0, 0.18, 0.061], { color: '#222222' })
      .ball(0.03, [0.01, 0.27, 0.07], { color: 'white', glow: true })
      .rod([0, 0.245, 0.07], [-0.01, 0.17, 0.07], 0.025, 'white', { glow: true });
    b.pair((s) => b.rod([-0.01, 0.17, 0.07], [-0.01 + s * 0.04, 0.09, 0.07], 0.02, 'white', { glow: true }).rod([0, 0.23, 0.07], [s * 0.045, 0.18, 0.07], 0.018, 'white', { glow: true }));
    return b.done();
  }),
  e('walk signal', 'ideas', 'signs', () => {
    const b = m('walk signal').cyl([0.2, 0.04, 0.2], [0, 0.02, 0], { color: 'darkgray' })
      .cyl([0.06, 0.7, 0.06], [0, 0.39, 0], { color: 'darkgray' })
      .box([0.28, 0.48, 0.14], [0, 0.94, 0], { color: '#d8b020', round: 0.1 })
      .box([0.22, 0.2, 0.01], [0, 1.06, 0.071], { color: '#222222' }).box([0.22, 0.2, 0.01], [0, 0.82, 0.071], { color: '#222222' })
      .ball([0.08, 0.1, 0.02], [0, 1.06, 0.078], { color: '#8a4a1a' })
      .ball(0.025, [0.005, 0.89, 0.08], { color: 'white', glow: true })
      .rod([0, 0.87, 0.08], [-0.005, 0.81, 0.08], 0.02, 'white', { glow: true })
      .box([0.1, 0.14, 0.06], [0, 0.52, 0.05], { color: '#d8b020' })
      .cyl([0.05, 0.02, 0.05], [0, 0.52, 0.085], { color: 'black', rot: [90, 0, 0] });
    b.pair((s) => b.rod([-0.005, 0.81, 0.08], [-0.005 + s * 0.035, 0.75, 0.08], 0.016, 'white', { glow: true }));
    return b.done();
  }),
  e('walker', 'clinic', 'mobility aids', () => {
    const b = m('walker').stick([-0.25, 0.75, 0.2], [0.25, 0.75, 0.2], 0.03, 'silver');
    b.pair((s) => {
      b.stick([s * 0.25, 0.08, 0.2], [s * 0.25, 0.85, 0.18], 0.03, 'silver').stick([s * 0.25, 0.08, -0.2], [s * 0.25, 0.85, -0.18], 0.03, 'silver')
        .stick([s * 0.25, 0.85, 0.2], [s * 0.25, 0.85, -0.25], 0.03, 'silver').capsule([0.045, 0.12, 0.045], [s * 0.25, 0.85, -0.2], { color: 'gray', rot: [90, 0, 0] })
        .stick([s * 0.25, 0.4, 0.2], [s * 0.25, 0.4, -0.2], 0.025, 'silver').ball(0.075, [s * 0.25, 0.0375, -0.2], { color: 'lime' });
      tire(b, 0.14, 0.04, [s * 0.25, 0.07, 0.2], 'gray');
    });
    return b.done();
  }),
  e('walkie talkie', 'tech', 'radios', () =>
    m('walkie talkie').box([0.06, 0.14, 0.035], [0, 0.07, 0], { color: 'black', round: 0.3 })
      .box([0.062, 0.03, 0.037], [0, 0.02, 0], { color: 'yellow', round: 0.3 })
      .box([0.045, 0.05, 0.004], [0, 0.05, 0.018], { color: 'darkgray', noInk: true })
      .box([0.04, 0.02, 0.004], [0, 0.11, 0.018], { color: 'lime', glow: true })
      .cyl([0.012, 0.09, 0.012], [0.017, 0.185, 0], { color: 'black' })
      .cyl([0.016, 0.015, 0.016], [-0.017, 0.147, 0], { color: 'orange' })
      .box([0.006, 0.03, 0.015], [-0.032, 0.09, 0], { color: 'gray' })
      .done(),
  ),
  e('wall', 'workshop', 'building materials', () => {
    const b = m('wall').box([2.0, 1.2, 0.3], [0, 0.6, 0], { color: '#b04a32' }).box([2.05, 0.08, 0.34], [0, 1.24, 0], { color: 'stone' });
    b.each(5, (i) => b.box([2.0, 0.015, 0.302], [0, 0.2 + i * 0.2, 0], { color: '#d8cfc4', noInk: true }));
    for (let r = 0; r < 6; r++) b.each(3, (i) => b.box([0.015, 0.2, 0.005], [-0.5 + i * 0.5 + (r % 2) * 0.25, 0.1 + r * 0.2, 0.151], { color: '#d8cfc4', noInk: true }));
    return b.done();
  }),
  e('wallet', 'wardrobe', 'bags', () =>
    m('wallet').box([0.11, 0.09, 0.02], [0, 0.045, 0], { color: 'leather', round: 0.3 })
      .box([0.1, 0.03, 0.012], [0.005, 0.09, 0], { color: '#7ab07a', round: 0.1 })
      .box([0.085, 0.02, 0.004], [-0.01, 0.092, 0.008], { color: 'gold', round: 0.2 })
      .box([0.1, 0.002, 0.002], [0, 0.03, 0.011], { color: 'darkbrown', noInk: true })
      .ball([0.015, 0.015, 0.006], [0.04, 0.06, 0.01], { color: 'silver' })
      .done(),
  ),
  e('wallpaper', 'home', 'decor', () => {
    const b = m('wallpaper').cyl([0.12, 0.55, 0.12], [-0.2, 0.275, 0], { color: 'cream' })
      .box([0.4, 0.53, 0.006], [0.06, 0.265, 0.056], { color: 'cream' })
      .cyl([0.04, 0.552, 0.04], [-0.2, 0.275, 0], { color: '#c39a6b' });
    b.each(4, (i) => b.box([0.012, 0.53, 0.002], [-0.08 + i * 0.1, 0.265, 0.06], { color: 'teal', noInk: true }));
    for (const x of [-0.03, 0.07, 0.17]) for (const y of [0.1, 0.27, 0.44]) b.ball([0.035, 0.035, 0.004], [x, y, 0.061], { color: 'pink', noInk: true });
    b.each(3, (i) => b.stick([-0.2 + Math.cos(i * 2.1) * 0.06, 0.08 + i * 0.17, Math.sin(i * 2.1) * 0.06], [-0.2 + Math.cos(i * 2.1) * 0.06, 0.12 + i * 0.17, Math.sin(i * 2.1) * 0.06], 0.012, 'teal', { noInk: true }));
    return b.done();
  }),
  e('walnut', 'food', 'nuts', () =>
    m('walnut').ball([0.042, 0.036, 0.036], [-0.015, 0.018, 0], { color: '#a87a4a' })
      .rod([-0.036, 0.034, 0], [0.006, 0.034, 0], 0.004, '#7a5a30', { noInk: true })
      .rod([-0.03, 0.026, 0.016], [-0.005, 0.03, 0.015], 0.003, '#7a5a30', { noInk: true })
      .ball([0.04, 0.02, 0.034], [0.032, 0.01, 0.012], { color: '#a87a4a' })
      .ball([0.018, 0.014, 0.026], [0.024, 0.021, 0.012], { color: '#d9b07a' })
      .ball([0.018, 0.014, 0.026], [0.04, 0.021, 0.012], { color: '#d9b07a' })
      .done(),
  ),
  e('walnut tree', 'garden', 'trees', () => {
    const b = m('walnut tree').cyl([0.6, 3.0, 0.6], [0, 1.5, 0], { color: 'bark', taper: 0.8 })
      .rod([0, 2.6, 0], [-1.0, 3.6, 0.2], 0.25, 'bark').rod([0, 2.8, 0], [1.0, 3.7, -0.1], 0.25, 'bark')
      .ball([4.5, 3.0, 4.0], [0, 4.4, 0], { color: 'darkgreen' })
      .ball([2.2, 1.8, 2.0], [-1.6, 4.0, 0.5], { color: 'leaf' }).ball([2.2, 1.8, 2.0], [1.6, 4.1, 0.4], { color: 'leaf' });
    for (const [x, y, z] of [[-1.5, 3.4, 1.3], [0.4, 3.3, 1.8], [1.9, 3.6, 1.2], [-0.6, 4.9, 1.7], [1.0, 5.2, 1.3], [-2.4, 4.3, 0.8]] as V[]) b.ball(0.28, [x, y, z], { color: '#9acd5a' });
    return b.done();
  }),
  e('wand', 'fantasy', 'magic items', () =>
    m('wand').box([0.22, 0.06, 0.12], [0, 0.03, 0], { color: 'purple', round: 0.6 })
      .stick([-0.14, 0.068, -0.02], [0.13, 0.075, 0.03], 0.014, 'black')
      .stick([0.13, 0.075, 0.03], [0.17, 0.076, 0.037], 0.015, 'white')
      .star(0.05, [0.19, 0.12, 0.04], { color: 'gold', glow: true })
      .ball(0.02, [-0.11, 0.0, 0.06], { color: 'gold' }).ball(0.02, [0.11, 0.0, 0.06], { color: 'gold' })
      .done(),
  ),
  e('wanted poster', 'ideas', 'signs', () =>
    m('wanted poster').box([0.5, 0.72, 0.06], [0, 0.36, 0], { color: 'darkwood' })
      .box([0.42, 0.62, 0.006], [0, 0.37, 0.032], { color: '#e8d4a0' })
      .label('WANTED', [0.36, 0.08], [0, 0.6, 0.034], { color: '#e8d4a0' })
      .box([0.22, 0.22, 0.004], [0, 0.4, 0.036], { color: '#c8a878' })
      .ball([0.09, 0.11, 0.006], [0, 0.39, 0.039], { color: 'darkbrown', noInk: true })
      .box([0.14, 0.03, 0.006], [0, 0.46, 0.04], { color: 'black', noInk: true })
      .box([0.08, 0.05, 0.006], [0, 0.48, 0.04], { color: 'black', noInk: true })
      .label('REWARD', [0.3, 0.06], [0, 0.19, 0.034], { color: '#e8d4a0' })
      .ball(0.02, [0.18, 0.65, 0.04], { color: 'iron' }).ball(0.02, [-0.18, 0.65, 0.04], { color: 'iron' })
      .done(),
  ),
  e('warehouse', 'places', 'industrial', () => {
    const b = m('warehouse').box([12, 6, 8], [0, 3, 0], { color: '#8a9aa8', round: 0.02 })
      .wedge([12.4, 1.6, 8.4], [0, 6.8, 0], { color: 'gray' })
      .box([1.0, 2.1, 0.1], [0, 1.05, 4.03], { color: 'darkgray', name: 'door', pivot: [-0.5, 1.05, 4.03] })
      .label('WAREHOUSE', [5, 0.8], [0, 4.8, 4.05], { color: 'navy' })
      .box([1.2, 1.0, 1.0], [5, 0.5, 5], { color: 'lightwood' }).box([1.0, 0.8, 1.0], [5, 1.4, 5], { color: 'lightwood' }).box([1.2, 1.0, 1.0], [3.6, 0.5, 5.3], { color: 'wood' });
    b.pair((s) => {
      b.box([3, 3.5, 0.1], [s * 3.2, 1.75, 4.03], { color: 'lightgray' });
      b.each(4, (i) => b.box([3, 0.04, 0.02], [s * 3.2, 0.5 + i * 0.8, 4.09], { color: 'gray', noInk: true }));
    });
    return b.done();
  }),
  e('wart', 'clinic', 'illness', () => {
    const b = m('wart').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'skin2' }).ball([0.045, 0.032, 0.045], [0, 0.026, 0], { color: '#b8907a' });
    for (const [x, z] of around(5, 0.012)) b.ball(0.016, [x, 0.038, z], { color: '#a07a68' });
    return b.rod([0.004, 0.04, 0], [0.012, 0.075, 0.01], 0.003, 'black').done();
  }),
  e('wasabi', 'food', 'condiments', () =>
    m('wasabi').box([0.1, 0.012, 0.07], [0, 0.006, 0], { color: 'white', round: 0.4 })
      .ball([0.045, 0.03, 0.04], [-0.015, 0.025, 0], { color: '#8fbf3a' })
      .cone([0.026, 0.025, 0.022], [-0.015, 0.045, 0], { color: '#8fbf3a' })
      .ball([0.032, 0.006, 0.026], [0.028, 0.015, 0.005], { color: '#f5b0a0', rot: [0, 0, 15] })
      .ball([0.032, 0.006, 0.026], [0.03, 0.019, -0.008], { color: '#f5b0a0', rot: [0, 30, 20] })
      .done(),
  ),
  e('washboard', 'home', 'laundry', () => {
    const b = m('washboard').box([0.34, 0.12, 0.05], [0, 0.56, 0], { color: 'wood' }).box([0.34, 0.04, 0.04], [0, 0.06, 0], { color: 'wood' });
    b.pair((s) => b.box([0.04, 0.6, 0.04], [s * 0.15, 0.3, 0], { color: 'wood' }));
    b.each(9, (i) => b.capsule([0.024, 0.26, 0.02], [0, 0.12 + i * 0.042, 0.005], { color: 'silver', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('washcloth', 'home', 'bathroom', () => {
    const b = m('washcloth').box([0.16, 0.025, 0.1], [0, 0.0125, 0], { color: 'wood' })
      .stick([0, 0.025, -0.03], [0, 0.31, -0.03], 0.025, 'wood').stick([0, 0.28, -0.03], [0, 0.28, 0.06], 0.015, 'wood')
      .capsule([0.03, 0.2, 0.04], [0, 0.29, 0.04], { color: 'skyblue', rot: [0, 0, 90] })
      .box([0.2, 0.2, 0.014], [0, 0.19, 0.058], { color: 'skyblue', round: 0.2 })
      .box([0.2, 0.16, 0.014], [0, 0.21, 0.022], { color: 'skyblue', round: 0.2 });
    b.each(3, (i) => b.box([0.2, 0.008, 0.002], [0, 0.12 + i * 0.05, 0.066], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('washer (appliance)', 'home', 'laundry', () =>
    m('washer (appliance)').box([0.6, 0.85, 0.6], [0, 0.425, 0], { color: 'white', round: 0.1 })
      .box([0.58, 0.12, 0.02], [0, 0.77, 0.3], { color: 'lightgray' })
      .cyl([0.08, 0.03, 0.08], [0.18, 0.77, 0.31], { color: 'silver', rot: [90, 0, 0] })
      .box([0.12, 0.05, 0.01], [-0.02, 0.77, 0.312], { color: 'skyblue', glow: true })
      .box([0.14, 0.06, 0.01], [-0.19, 0.77, 0.312], { color: 'white' })
      .torus([0.42, 0.42, 0.05], [0, 0.38, 0.31], { color: 'silver', tube: 0.12, name: 'door', pivot: [-0.21, 0.38, 0.31] })
      .cyl([0.34, 0.03, 0.34], [0, 0.38, 0.31], { color: '#7fb5d9', rot: [90, 0, 0], parent: 'door' })
      .done(),
  ),
  e('washer (hardware)', 'workshop', 'hardware', () =>
    m('washer (hardware)').torus([0.05, 0.05, 0.009], [0, 0.025, 0], { color: 'silver', tube: 0.3 })
      .torus([0.05, 0.05, 0.008], [0.045, 0.004, 0.025], { color: 'steel', tube: 0.3, rot: [90, 0, 0] })
      .done(),
  ),
  e('watch', 'wardrobe', 'jewellery', () =>
    m('watch').torus([0.09, 0.09, 0.025], [0, 0.045, -0.01], { color: 'leather', rot: [0, 90, 0], tube: 0.12 })
      .cyl([0.05, 0.016, 0.05], [0, 0.045, 0.038], { color: 'gold', rot: [90, 0, 0] })
      .cyl([0.04, 0.004, 0.04], [0, 0.045, 0.047], { color: 'white', rot: [90, 0, 0] })
      .stick([0, 0.045, 0.05], [0, 0.06, 0.05], 0.003, 'black', { noInk: true })
      .stick([0, 0.045, 0.05], [0.01, 0.045, 0.05], 0.003, 'black', { noInk: true })
      .cyl([0.008, 0.006, 0.008], [0.027, 0.045, 0.038], { color: 'gold', rot: [0, 0, 90] })
      .done(),
  ),
  e('water bomb', 'toys', 'water toys', () =>
    m('water bomb').ball([0.12, 0.13, 0.12], [0, 0.068, 0], { color: 'skyblue' })
      .cone([0.025, 0.02, 0.025], [0, 0.138, 0], { color: 'skyblue', rot: [180, 0, 0] })
      .ball([0.02, 0.012, 0.02], [0, 0.15, 0], { color: 'skyblue' })
      .cyl([0.16, 0.004, 0.11], [0.05, 0.002, 0.04], { color: 'water', noInk: true })
      .ball([0.018, 0.026, 0.018], [0.08, 0.04, 0.05], { color: 'water' })
      .done(),
  ),
  e('water bottle', 'kitchen', 'drinkware', () =>
    m('water bottle').cyl([0.075, 0.2, 0.075], [0, 0.1, 0], { color: 'teal' })
      .cyl([0.077, 0.05, 0.077], [0, 0.08, 0], { color: 'darkgray' })
      .cyl([0.06, 0.03, 0.06], [0, 0.215, 0], { color: 'black' })
      .cyl([0.02, 0.025, 0.02], [0, 0.24, 0], { color: 'black' })
      .torus([0.04, 0.04, 0.01], [0, 0.235, -0.035], { color: 'black', rot: [0, 90, 0] })
      .done(),
  ),
  e('water cooler', 'home', 'appliances', () =>
    m('water cooler').box([0.32, 0.95, 0.32], [0, 0.475, 0], { color: 'white', round: 0.1 })
      .box([0.24, 0.2, 0.01], [0, 0.72, 0.161], { color: 'darkgray' })
      .box([0.2, 0.03, 0.08], [0, 0.64, 0.18], { color: 'gray' })
      .box([0.03, 0.04, 0.04], [0.05, 0.76, 0.18], { color: 'blue' }).box([0.03, 0.04, 0.04], [-0.05, 0.76, 0.18], { color: 'red' })
      .cyl([0.27, 0.06, 0.27], [0, 0.98, 0], { color: 'skyblue', taper: 0.35, rot: [180, 0, 0] })
      .cyl([0.27, 0.32, 0.27], [0, 1.17, 0], { color: 'skyblue' })
      .torus([0.28, 0.28, 0.02], [0, 1.1, 0], { color: '#b8e0f5', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .torus([0.28, 0.28, 0.02], [0, 1.25, 0], { color: '#b8e0f5', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .done(),
  ),
  e('water fountain', 'places', 'street furniture', () =>
    m('water fountain').cyl([0.45, 0.06, 0.45], [0, 0.03, 0], { color: 'stone' })
      .cyl([0.3, 0.8, 0.3], [0, 0.46, 0], { color: 'stone', taper: 0.8 })
      .cyl([0.45, 0.12, 0.45], [0, 0.9, 0], { color: 'stone', taper: 1.3 })
      .cyl([0.4, 0.01, 0.4], [0, 0.965, 0], { color: 'water' })
      .stick([0, 0.95, -0.05], [0, 1.0, -0.05], 0.025, 'silver')
      .rod([0, 1.0, -0.05], [0, 1.08, 0.02], 0.02, 'water', { noInk: true }).rod([0, 1.08, 0.02], [0, 1.0, 0.1], 0.02, 'water', { noInk: true })
      .box([0.06, 0.04, 0.03], [0, 0.88, 0.24], { color: 'silver' })
      .done(),
  ),
  e('water gun', 'toys', 'water toys', () =>
    m('water gun', { view: 'side' }).box([0.06, 0.08, 0.3], [0, 0.12, 0], { color: 'lime', round: 0.5 })
      .cyl([0.035, 0.12, 0.035], [0, 0.14, 0.2], { color: 'orange', rot: [90, 0, 0] })
      .cyl([0.02, 0.03, 0.02], [0, 0.14, 0.27], { color: 'blue', rot: [90, 0, 0] })
      .capsule([0.09, 0.14, 0.09], [0, 0.205, -0.03], { color: 'orange', rot: [90, 0, 0] })
      .box([0.04, 0.1, 0.05], [0, 0.05, -0.1], { color: 'lime', rot: [15, 0, 0], round: 0.4 })
      .box([0.012, 0.03, 0.012], [0, 0.07, -0.05], { color: 'orange' })
      .cyl([0.05, 0.1, 0.05], [0, 0.07, 0.13], { color: 'blue', rot: [90, 0, 0] })
      .done(),
  ),
  e('water heater', 'home', 'appliances', () =>
    m('water heater').cyl([0.5, 0.05, 0.5], [0, 0.025, 0], { color: 'darkgray' })
      .cyl([0.55, 1.3, 0.55], [0, 0.7, 0], { color: 'white' })
      .cyl([0.56, 0.05, 0.56], [0, 1.36, 0], { color: 'lightgray' })
      .cyl([0.12, 0.1, 0.12], [0, 1.43, 0], { color: 'silver' })
      .stick([0.15, 1.38, 0], [0.15, 1.52, 0], 0.04, 'copper').stick([-0.15, 1.38, 0], [-0.15, 1.52, 0], 0.04, 'copper')
      .box([0.14, 0.16, 0.08], [0, 0.32, 0.27], { color: 'gray' })
      .cyl([0.05, 0.02, 0.05], [0, 0.34, 0.315], { color: 'red', rot: [90, 0, 0] })
      .box([0.06, 0.04, 0.01], [0, 0.16, 0.278], { color: 'orange', glow: true })
      .done(),
  ),
  e('water park', 'places', 'parks', () => {
    const b = m('water park').box([9, 0.3, 7], [0, 0.15, 0], { color: 'cream', round: 0.05 })
      .box([6, 0.05, 4], [0.8, 0.31, 0.8], { color: 'water' })
      .box([1.6, 3.5, 1.6], [-3.4, 1.75, -2.4], { color: 'yellow' })
      .cone([2.2, 1.0, 2.2], [-3.4, 4.0, -2.4], { color: 'red', segs: 4, rot: [0, 45, 0] })
      .rod([-2.8, 3.3, -1.6], [-1.6, 2.6, -1.8], 0.6, 'red').rod([-1.6, 2.6, -1.8], [-0.8, 1.8, -0.6], 0.6, 'red').rod([-0.8, 1.8, -0.6], [-1.6, 1.1, 0.6], 0.6, 'red').rod([-1.6, 1.1, 0.6], [-0.6, 0.5, 1.5], 0.6, 'red')
      .rod([-2.6, 3.0, -2.4], [1.5, 0.45, -0.8], 0.6, 'blue')
      .rod([3.6, 0.3, -2.8], [3.4, 2.6, -2.6], 0.25, 'bark').ball([1.6, 0.5, 1.6], [3.4, 2.7, -2.6], { color: 'leaf' })
      .stick([3.6, 0.3, 3.2], [3.6, 1.4, 3.2], 0.12, 'darkgray')
      .label('WATER PARK', [2.4, 0.6], [3.0, 1.6, 3.25], { color: 'skyblue' });
    return b.done();
  }),
  e('water pump', 'farm', 'farm things', () =>
    m('water pump').box([0.5, 0.15, 0.7], [0, 0.075, 0.1], { color: 'stone' })
      .cyl([0.12, 0.55, 0.12], [0, 0.42, 0], { color: '#3a5a3a' })
      .cyl([0.14, 0.06, 0.14], [0, 0.72, 0], { color: '#3a5a3a' }).ball(0.07, [0, 0.77, 0], { color: '#3a5a3a' })
      .rod([0, 0.55, 0.06], [0, 0.52, 0.2], 0.05, '#3a5a3a')
      .rod([0, 0.7, -0.05], [0, 0.88, -0.35], 0.035, '#3a5a3a').ball(0.05, [0, 0.89, -0.36], { color: '#3a5a3a' })
      .cyl([0.16, 0.14, 0.16], [0, 0.22, 0.27], { color: 'steel', taper: 1.2 })
      .cyl([0.17, 0.01, 0.17], [0, 0.285, 0.27], { color: 'water' })
      .done(),
  ),
  e('water ski', 'sports', 'water sports', () => {
    const b = m('water ski');
    b.pair((s) => b.box([0.17, 1.6, 0.03], [s * 0.15, 0.82, 0], { color: s > 0 ? 'red' : 'yellow', round: 0.5, rot: [0, 0, s * -3] }).box([0.17, 0.2, 0.03], [s * 0.19, 1.68, 0.05], { color: s > 0 ? 'red' : 'yellow', rot: [30, 0, s * -3], round: 0.5 }).box([0.13, 0.2, 0.13], [s * 0.15, 0.85, 0.08], { color: 'black', round: 0.4 }).box([0.172, 0.06, 0.032], [s * 0.15, 0.3, 0], { color: 'white', noInk: true, rot: [0, 0, s * -3] }));
    return b.done();
  }),
  e('water spout', 'nature', 'weather', () => {
    const b = m('water spout').cyl([3.0, 0.1, 3.0], [0, 0.05, 0], { color: 'water' }).ball([1.2, 0.4, 1.2], [0, 0.2, 0], { color: '#dff0f8' });
    const ds = [0.3, 0.45, 0.65, 0.95, 1.4];
    for (let i = 0; i < 4; i++) b.cyl([ds[i], 0.6, ds[i]], [0, 0.5 + i * 0.6, 0], { color: i % 2 ? '#b8ccd8' : '#9ab8c8', taper: ds[i + 1] / ds[i] });
    b.ball([2.6, 0.8, 1.8], [0, 2.95, 0], { color: 'gray' }).ball([1.4, 0.7, 1.2], [-1.0, 2.9, 0.3], { color: 'gray' }).ball([1.4, 0.7, 1.2], [1.1, 2.95, 0.2], { color: 'darkgray' });
    return b.done();
  }),
  e('water tower', 'places', 'landmarks', () => {
    const b = m('water tower').cyl([3, 2.4, 3], [0, 4.8, 0], { color: 'silver' })
      .cone([3.2, 1.0, 3.2], [0, 6.5, 0], { color: 'silver' }).ball(0.3, [0, 7.05, 0], { color: 'silver' })
      .torus([3.4, 3.4, 0.1], [0, 3.65, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.05 })
      .label('WATER', [1.8, 0.6], [0, 4.9, 1.5], { color: 'white' });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.rod([x * 1.05, 3.7, z * 1.05], [x * 1.5, 0, z * 1.5], 0.2, 'steel');
    b.pair((s) => b.rod([s * 1.4, 0.5, 1.4], [-s * 1.15, 3.0, 1.15], 0.08, 'steel').rod([1.4, 0.5, s * 1.4], [1.15, 3.0, -s * 1.15], 0.08, 'steel'));
    return b.done();
  }),
  e('water treatment plant', 'places', 'industrial', () => {
    const b = m('water treatment plant').box([12, 0.2, 8], [0, 0.1, 0], { color: 'gray', round: 0.05 })
      .cyl([3.5, 1.2, 3.5], [-3, 0.8, 1], { color: 'stone' }).cyl([3.1, 0.02, 3.1], [-3, 1.41, 1], { color: 'water' })
      .box([3.2, 0.12, 0.25], [-3, 1.5, 1], { color: 'yellow', name: 'rotor' })
      .cyl([3.5, 1.2, 3.5], [1.2, 0.8, 1.5], { color: 'stone' }).cyl([3.1, 0.02, 3.1], [1.2, 1.41, 1.5], { color: '#4a8a6a' })
      .box([3.2, 0.12, 0.25], [1.2, 1.5, 1.5], { color: 'yellow', rot: [0, 50, 0] })
      .box([3, 3.2, 2.5], [3.8, 1.8, -2], { color: 'cream' }).box([3.2, 0.2, 2.7], [3.8, 3.5, -2], { color: 'darkgray' })
      .label('WATER', [2, 0.5], [3.8, 2.6, -0.72], { color: 'skyblue' })
      .box([0.9, 1.6, 0.08], [3.8, 1.0, -0.72], { color: 'darkgray', name: 'door', pivot: [3.35, 1.0, -0.72] })
      .stick([-1.2, 0.5, 1.2], [-0.6, 0.5, 1.4], 0.3, 'blue').stick([2.9, 0.5, 1.0], [3.6, 0.5, -0.75], 0.3, 'blue');
    return b.done();
  }),
  e('water wheel', 'farm', 'farm things', () => {
    const b = m('water wheel').box([3.2, 0.3, 1.4], [0, 0.15, 0], { color: 'water' })
      .torus([3.6, 3.6, 0.4], [0, 2.1, 0], { color: 'wood', tube: 0.08, name: 'fan' })
      .cyl([0.5, 0.6, 0.5], [0, 2.1, 0], { color: 'darkwood', rot: [90, 0, 0], parent: 'fan' });
    b.each(4, (i) => b.box([0.12, 3.4, 0.15], [0, 2.1, 0], { color: 'wood', rot: [0, 0, i * 45], parent: 'fan' }));
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.box([0.12, 0.5, 0.5], [Math.sin(a) * 1.7, 2.1 + Math.cos(a) * 1.7, 0], { color: 'darkwood', rot: [0, 0, (-a * 180) / Math.PI], parent: 'fan' });
    });
    b.pair((s) => b.box([0.25, 2.1, 0.25], [0, 1.05, s * 0.5], { color: 'darkwood' }));
    return b.done();
  }),
  e('waterbed', 'home', 'furniture', () => {
    const b = m('waterbed').box([1.6, 0.35, 2.1], [0, 0.175, 0], { color: 'darkwood' })
      .box([1.5, 0.25, 2.0], [0, 0.4, 0], { color: 'skyblue', round: 0.7 })
      .box([1.6, 0.6, 0.08], [0, 0.6, -1.05], { color: 'darkwood' })
      .ball([0.6, 0.12, 0.3], [0, 0.56, -0.75], { color: 'white' });
    for (const z of [-0.2, 0.25, 0.7]) b.each(3, (i) => b.rod([-0.55 + i * 0.4, 0.53, z + (i % 2) * 0.05], [-0.38 + i * 0.4, 0.53, z + ((i + 1) % 2) * 0.05], 0.03, '#d0ecff', { noInk: true }));
    return b.done();
  }),
  e('waterfall', 'nature', 'water', () =>
    m('waterfall').box([2.6, 2.8, 1.2], [0, 1.4, -0.6], { color: 'rock', round: 0.3 })
      .box([2.6, 0.1, 1.2], [0, 2.85, -0.6], { color: 'grass' })
      .box([0.9, 0.06, 1.0], [0, 2.92, -0.55], { color: 'water' })
      .box([0.9, 2.6, 0.15], [0, 1.5, 0.05], { color: 'water', round: 0.3 })
      .box([0.05, 2.2, 0.02], [-0.2, 1.6, 0.13], { color: 'white', noInk: true }).box([0.05, 1.8, 0.02], [0.22, 1.8, 0.13], { color: 'white', noInk: true })
      .cyl([2.4, 0.1, 1.4], [0, 0.05, 0.6], { color: 'water' })
      .ball([0.8, 0.4, 0.5], [0.3, 0.25, 0.35], { color: 'white' }).ball([0.7, 0.35, 0.5], [-0.35, 0.22, 0.4], { color: 'white' })
      .ball([0.8, 0.6, 0.6], [-1.3, 0.3, 0.2], { color: 'stone' }).ball([0.6, 0.5, 0.5], [1.3, 0.25, 0.3], { color: 'stone' })
      .done(),
  ),
  e('watering can', 'garden', 'garden tools', () =>
    m('watering can').cyl([0.2, 0.18, 0.14], [0, 0.09, 0], { color: 'green' })
      .cyl([0.08, 0.02, 0.08], [-0.04, 0.19, 0], { color: 'darkgreen' })
      .rod([0.08, 0.06, 0], [0.24, 0.24, 0], 0.025, 'green')
      .cyl([0.05, 0.03, 0.05], [0.255, 0.255, 0], { color: 'green', rot: [0, 0, -45] })
      .cyl([0.045, 0.005, 0.045], [0.266, 0.266, 0], { color: 'silver', rot: [0, 0, -45] })
      .torus([0.16, 0.12, 0.025], [-0.04, 0.2, 0], { color: 'green' })
      .done(),
  ),
  e('watermelon', 'food', 'fruit', () => {
    const b = m('watermelon').ball([0.3, 0.24, 0.24], [-0.05, 0.12, -0.03], { color: 'green' })
      .box([0.18, 0.02, 0.035], [0.17, 0.01, 0.13], { color: 'darkgreen' })
      .wedge([0.17, 0.11, 0.035], [0.17, 0.075, 0.13], { color: 'red' });
    b.each(4, (i) => b.torus([0.304, 0.244, 0.04], [-0.05, 0.12, -0.03], { color: 'darkgreen', tube: 0.04, rot: [i * 45, 0, 0], noInk: true }));
    for (const [x, y] of [[0.14, 0.05], [0.2, 0.05], [0.17, 0.08], [0.15, 0.03], [0.19, 0.03]]) b.ball([0.008, 0.012, 0.004], [x, y, 0.149], { color: 'black', noInk: true });
    return b.done();
  }),
  e('wax', 'home', 'candles', () =>
    m('wax').box([0.1, 0.05, 0.07], [0, 0.025, 0], { color: '#f5e6a8', round: 0.2 })
      .box([0.08, 0.04, 0.06], [0.01, 0.07, 0], { color: '#f2dc8a', round: 0.2, rot: [0, 20, 0] })
      .ball([0.015, 0.02, 0.01], [0.03, 0.04, 0.035], { color: '#f5e6a8' })
      .capsule([0.02, 0.1, 0.02], [-0.02, 0.01, 0.07], { color: 'red', rot: [0, 10, 90] })
      .cyl([0.04, 0.008, 0.04], [0.07, 0.004, 0.07], { color: 'darkred' })
      .ball([0.015, 0.004, 0.015], [0.07, 0.009, 0.07], { color: 'red' })
      .done(),
  ),
  e('weather vane', 'farm', 'farm things', () => {
    const b = m('weather vane').cone([0.3, 0.2, 0.3], [0, 0.1, 0], { color: 'darkred', segs: 4, rot: [0, 45, 0] })
      .stick([0, 0.2, 0], [0, 0.95, 0], 0.025, 'black')
      .stick([-0.2, 0.55, 0], [0.2, 0.55, 0], 0.015, 'black').stick([0, 0.55, -0.2], [0, 0.55, 0.2], 0.015, 'black')
      .label('N', [0.06, 0.06], [0, 0.55, 0.23], { color: 'gold' }).label('E', [0.06, 0.06], [0.23, 0.55, 0], { color: 'gold' }).label('W', [0.06, 0.06], [-0.23, 0.55, 0], { color: 'gold' })
      .stick([-0.25, 0.8, 0], [0.25, 0.8, 0], 0.02, 'black', { name: 'rotor' })
      .cone([0.06, 0.08, 0.02], [0.28, 0.8, 0], { color: 'black', rot: [0, 0, -90], parent: 'rotor' })
      .box([0.08, 0.1, 0.012], [-0.25, 0.8, 0], { color: 'black', parent: 'rotor' })
      .ball([0.16, 0.1, 0.03], [0, 0.88, 0], { color: 'black', parent: 'rotor' })
      .ball(0.05, [0.09, 0.95, 0], { color: 'black', parent: 'rotor' })
      .wedge([0.1, 0.12, 0.012], [-0.09, 0.95, 0], { color: 'black', apex: -0.4, parent: 'rotor' })
      .cone([0.03, 0.03, 0.01], [0.09, 0.99, 0], { color: 'red', parent: 'rotor' });
    return b.done();
  }),
  e('web cam', 'tech', 'computers', () =>
    m('web cam').box([0.05, 0.015, 0.04], [0, 0.0075, 0], { color: 'black', round: 0.3 })
      .box([0.02, 0.04, 0.02], [0, 0.03, 0], { color: 'black' })
      .capsule([0.045, 0.09, 0.045], [0, 0.07, 0], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.032, 0.01, 0.032], [0, 0.07, 0.022], { color: '#223344', rot: [90, 0, 0] })
      .cyl([0.016, 0.004, 0.016], [0, 0.07, 0.028], { color: 'glass', rot: [90, 0, 0] })
      .ball(0.006, [0.03, 0.075, 0.02], { color: 'lime', glow: true })
      .done(),
  ),
  e('wedding cake', 'food', 'cakes', () => {
    const b = m('wedding cake').cyl([0.42, 0.02, 0.42], [0, 0.01, 0], { color: 'silver' });
    [[0.36, 0.14, 0.09], [0.26, 0.12, 0.22], [0.17, 0.1, 0.33]].forEach(([d, h, y]) => b.cyl([d, h, d], [0, y, 0], { color: 'white' }).torus([d + 0.01, d + 0.01, 0.025], [0, y - h / 2 + 0.01, 0], { color: 'pink', rot: [90, 0, 0], tube: 0.06 }));
    for (const [x, z] of around(5, 0.13, 0.3)) b.ball(0.035, [x, 0.17, z], { color: 'pink' });
    b.heart(0.07, [-0.025, 0.43, 0], { color: 'red' }).heart(0.06, [0.03, 0.42, -0.01], { color: 'pink' });
    return b.done();
  }),
  e('wedding dress', 'wardrobe', 'wedding', () =>
    dummy('wedding dress', { top: 'white', skirt: 'white', skirtW: 1.0, sleeve: 'none' })
      .ball([0.9, 0.08, 0.8], [0, 0.04, -0.4], { color: 'white' })
      .torus([0.44, 0.2, 0.06], [0, 1.0, 0], { color: 'cream', rot: [90, 0, 0], tube: 0.15 })
      .ball(0.06, [0, 1.0, 0.13], { color: 'pink' })
      .torus([0.18, 0.18, 0.02], [0, 1.77, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.12 })
      .done(),
  ),
  e('wedge (tool)', 'workshop', 'hand tools', () =>
    m('wedge (tool)').wedge([0.15, 0.05, 0.08], [0.04, 0.025, 0.03], { color: 'yellow', apex: 0.5 })
      .wedge([0.06, 0.2, 0.05], [-0.1, 0.1, -0.02], { color: 'steel' })
      .box([0.002, 0.03, 0.082], [0.02, 0.012, 0.03], { color: '#b8a020', noInk: true })
      .box([0.002, 0.02, 0.082], [0.06, 0.008, 0.03], { color: '#b8a020', noInk: true })
      .done(),
  ),
  e('weed', 'garden', 'plants', () => {
    const b = pot(m('weed'), 0.28, 0.26).stick([0, 0.27, 0], [0, 0.95, 0], 0.03, 'green');
    const leaf = (y: number, t: number, sc: number, n: number) => {
      for (let k = -(n - 1) / 2; k <= (n - 1) / 2; k++) {
        const a = ((t + k * 28) * Math.PI) / 180, L = sc * (1 - Math.abs(k) * 0.18);
        b.ball([0.05 * sc * 5, L, 0.014], [Math.sin(a) * L * 0.5, y + Math.cos(a) * L * 0.5, 0.01], { color: 'leaf', rot: [0, 0, (-a * 180) / Math.PI] });
      }
    };
    leaf(0.95, 0, 0.2, 7);
    leaf(0.72, 55, 0.18, 5);
    leaf(0.72, -55, 0.18, 5);
    leaf(0.5, 70, 0.16, 5);
    leaf(0.5, -70, 0.16, 5);
    return b.done();
  }),
  e('weed wacker', 'garden', 'garden tools', () =>
    m('weed wacker', { view: 'side' }).stick([0, 0.12, 0.45], [0, 1.05, -0.45], 0.03, 'silver')
      .box([0.14, 0.18, 0.25], [0, 1.1, -0.5], { color: 'orange', round: 0.4 })
      .box([0.1, 0.08, 0.1], [0, 1.22, -0.62], { color: 'black', round: 0.3 })
      .stick([-0.14, 0.75, -0.12], [0.14, 0.75, -0.12], 0.025, 'black')
      .rod([0, 0.68, -0.1], [0, 0.75, -0.12], 0.025, 'black')
      .cyl([0.12, 0.05, 0.12], [0, 0.06, 0.5], { color: 'darkgray' })
      .cyl([0.26, 0.02, 0.26], [0, 0.15, 0.44], { color: 'orange' })
      .stick([0, 0.04, 0.5], [0.14, 0.03, 0.56], 0.006, 'lime').stick([0, 0.04, 0.5], [-0.12, 0.03, 0.42], 0.006, 'lime')
      .done(),
  ),
  e('wetfloor sign', 'home', 'cleaning', () => {
    const t = (-15 * Math.PI) / 180, up: V = [0, Math.cos(t), Math.sin(t)], nz: V = [0, -Math.sin(t), Math.cos(t)];
    const at = (h: number, d: number): V => [0, 0.29 + h * up[1] + d * nz[1], 0.08 + h * up[2] + d * nz[2]];
    return m('wetfloor sign').box([0.3, 0.6, 0.02], [0, 0.29, 0.08], { color: 'yellow', rot: [-15, 0, 0] })
      .box([0.3, 0.6, 0.02], [0, 0.29, -0.08], { color: 'yellow', rot: [15, 0, 0] })
      .box([0.12, 0.08, 0.05], [0, 0.6, 0], { color: 'yellow', round: 0.3 })
      .label('CAUTION', [0.24, 0.06], at(0.2, 0.012), { color: 'yellow', rot: [-15, 0, 0] })
      .wedge([0.13, 0.11, 0.004], at(0.05, 0.012), { color: 'black', rot: [-15, 0, 0], noInk: true })
      .wedge([0.09, 0.075, 0.004], at(0.045, 0.015), { color: 'yellow', rot: [-15, 0, 0], noInk: true })
      .label('WET FLOOR', [0.26, 0.07], at(-0.12, 0.012), { color: 'yellow', rot: [-15, 0, 0] })
      .done();
  }),
  e('wetsuit', 'sports', 'water sports', () => {
    const b = dummy('wetsuit', { top: 'black', legs: 'black', shoes: 'black' }).box([0.445, 0.12, 0.255], [0, 1.42, 0], { color: 'blue', round: 0.5 });
    b.pair((s) => b.rod([s * 0.29, 1.4, 0], [s * 0.34, 0.95, 0], 0.03, 'blue', { noInk: true }).rod([s * 0.18, 0.95, 0], [s * 0.178, 0.2, 0], 0.03, 'blue', { noInk: true }).rod([s * 0.22, 1.35, 0], [s * 0.21, 1.0, 0], 0.03, 'blue', { noInk: true }));
    return b.done();
  }),
  e('wheat', 'farm', 'crops', () => {
    const b = m('wheat').torus([0.12, 0.12, 0.08], [0, 0.3, 0], { color: 'darkbrown', rot: [90, 0, 0], tube: 0.25 });
    for (const [x, z] of [[0, 0], [-0.08, 0.02], [0.08, 0.01], [-0.04, -0.06], [0.05, -0.05]]) {
      const top: V = [x * 2.2, 0.78 + (x === 0 ? 0.05 : 0), z * 2];
      b.stick([x * 0.3, 0, z * 0.3], top, 0.012, '#d9b44a').capsule([0.055, 0.2, 0.045], [top[0] * 1.1, top[1] + 0.1, top[2] * 1.1], { color: '#d9a530', rot: [z * 200, 0, -x * 200] });
      b.stick([top[0] * 1.1, top[1] + 0.12, top[2] * 1.1], [top[0] * 1.25 - 0.02, top[1] + 0.26, top[2] * 1.1], 0.004, '#d9b44a').stick([top[0] * 1.1, top[1] + 0.12, top[2] * 1.1], [top[0] * 1.25 + 0.02, top[1] + 0.26, top[2] * 1.1], 0.004, '#d9b44a');
    }
    return b.done();
  }),
  e('wheel', 'garage', 'car parts', () => {
    const b = m('wheel').torus([0.6, 0.6, 0.2], [0, 0.3, 0], { color: 'rubber', tube: 0.3, name: 'wheel' })
      .cyl([0.38, 0.18, 0.38], [0, 0.3, 0], { color: 'silver', rot: [90, 0, 0], parent: 'wheel' })
      .cyl([0.12, 0.2, 0.12], [0, 0.3, 0], { color: 'darkgray', rot: [90, 0, 0], parent: 'wheel' });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.box([0.04, 0.12, 0.02], [Math.sin(a) * 0.11, 0.3 + Math.cos(a) * 0.11, 0.095], { color: 'gray', rot: [0, 0, (-a * 180) / Math.PI], parent: 'wheel' });
    });
    return b.done();
  }),
  e('wheelchair', 'clinic', 'mobility aids', () => {
    const b = m('wheelchair', { view: 'side' });
    tire(b, 0.6, 0.05, [0.3, 0.3, -0.05], 'silver', 'wheel');
    tire(b, 0.6, 0.05, [-0.3, 0.3, -0.05], 'silver');
    b.box([0.45, 0.09, 0.42], [0, 0.5, 0.02], { color: 'blue', round: 0.4 }).box([0.45, 0.4, 0.04], [0, 0.75, -0.2], { color: 'blue', rot: [-8, 0, 0], round: 0.3 })
      .box([0.4, 0.02, 0.12], [0, 0.1, 0.38], { color: 'silver' });
    b.pair((s) => {
      tire(b, 0.12, 0.03, [s * 0.22, 0.06, 0.3], 'gray');
      b.stick([s * 0.24, 0.5, 0.2], [s * 0.22, 0.12, 0.3], 0.025, 'silver').stick([s * 0.24, 0.5, -0.2], [s * 0.24, 0.95, -0.24], 0.025, 'silver')
        .stick([s * 0.24, 0.95, -0.24], [s * 0.24, 0.97, -0.34], 0.03, 'black').box([0.05, 0.03, 0.3], [s * 0.24, 0.68, 0.0], { color: 'black' })
        .stick([s * 0.24, 0.5, 0.1], [s * 0.24, 0.67, 0.1], 0.02, 'silver').stick([s * 0.2, 0.3, 0.3], [s * 0.18, 0.1, 0.38], 0.02, 'silver');
    });
    return b.done();
  }),
  e('whip', 'armory', 'whips', () => {
    const b = m('whip');
    [[0.3, 0.0125], [0.27, 0.0375], [0.24, 0.0625]].forEach(([d, y]) => b.torus([d, d, 0.025], [0, y, 0], { color: 'leather', rot: [90, 0, 0], tube: 0.12 }));
    return b.rod([0.1, 0.07, 0.05], [0.12, 0.35, 0.1], 0.04, 'darkbrown').ball(0.05, [0.12, 0.37, 0.1], { color: 'darkbrown' })
      .rod([-0.12, 0.012, 0.08], [-0.3, 0.008, 0.2], 0.012, 'leather').rod([-0.3, 0.008, 0.2], [-0.36, 0.006, 0.16], 0.006, 'tan')
      .done();
  }),
  e('whipped cream', 'food', 'desserts', () =>
    m('whipped cream').cyl([0.14, 0.04, 0.14], [0, 0.02, 0], { color: 'glass', taper: 1.3 })
      .torus([0.13, 0.13, 0.045], [0, 0.06, 0], { color: 'white', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.1, 0.1, 0.04], [0, 0.09, 0], { color: 'white', rot: [90, 0, 0], tube: 0.3 })
      .torus([0.07, 0.07, 0.035], [0, 0.115, 0], { color: 'white', rot: [90, 0, 0], tube: 0.35 })
      .ball([0.09, 0.05, 0.09], [0, 0.08, 0], { color: 'white' })
      .cone([0.045, 0.05, 0.045], [0, 0.145, 0], { color: 'white' })
      .ball(0.03, [0.012, 0.175, 0], { color: 'red' })
      .rod([0.012, 0.19, 0], [0.025, 0.215, -0.005], 0.004, 'green')
      .done(),
  ),
  e('whirlpool', 'home', 'bathroom', () => {
    const b = m('whirlpool').cyl([1.8, 0.75, 1.8], [0, 0.375, 0], { color: 'wood' })
      .cyl([1.84, 0.06, 1.84], [0, 0.77, 0], { color: 'darkwood' })
      .cyl([1.62, 0.02, 1.62], [0, 0.785, 0], { color: '#5ab4e0' })
      .box([0.6, 0.25, 0.3], [0, 0.125, 1.0], { color: 'wood' });
    b.each(2, (i) => b.cyl([1.81, 0.05, 1.81], [0, 0.15 + i * 0.4, 0], { color: 'iron', noInk: true }));
    for (const [x, z] of [...around(6, 0.5), ...around(3, 0.2, 1)]) b.ball(0.1, [x, 0.8, z], { color: 'white', noInk: true });
    return b.done();
  }),
  e('whisk', 'kitchen', 'utensils', () => {
    const b = m('whisk').cyl([0.03, 0.12, 0.03], [0, 0.06, 0], { color: 'red' }).cyl([0.032, 0.02, 0.032], [0, 0.13, 0], { color: 'silver' });
    b.each(4, (i) => b.torus([0.09, 0.18, 0.006], [0, 0.22, 0], { color: 'silver', tube: 0.07, rot: [0, i * 45, 0] }));
    return b.done();
  }),
  e('whisker', 'wild', 'animal parts', () => {
    const b = m('whisker').ball([0.14, 0.12, 0.1], [0, 0.075, -0.02], { color: 'orange' })
      .ball([0.025, 0.018, 0.015], [0, 0.078, 0.048], { color: 'pink' });
    b.pair((s) => {
      b.ball([0.05, 0.04, 0.04], [s * 0.022, 0.055, 0.03], { color: 'white' }).cone([0.05, 0.06, 0.03], [s * 0.045, 0.14, -0.02], { color: 'orange' }).ball(0.022, [s * 0.03, 0.1, 0.025], { color: 'black', eye: true });
      for (const d of [-0.012, 0, 0.012]) b.stick([s * 0.035, 0.058 + d, 0.045], [s * 0.15, 0.062 + d * 3, 0.06], 0.003, 'black');
    });
    return b.done();
  }),
  e('whistle', 'music', 'whistles', () =>
    m('whistle').cyl([0.06, 0.04, 0.06], [0, 0.03, 0], { color: 'silver', rot: [0, 0, 90] })
      .box([0.03, 0.025, 0.07], [0, 0.0475, 0.045], { color: 'silver', round: 0.3 })
      .box([0.02, 0.004, 0.015], [0, 0.06, 0.02], { color: 'black', noInk: true })
      .torus([0.02, 0.02, 0.006], [0, 0.03, -0.035], { color: 'silver', rot: [0, 90, 0] })
      .torus([0.12, 0.14, 0.008], [0, 0.004, -0.1], { color: 'red', rot: [90, 0, 0], tube: 0.06 })
      .done(),
  ),
  e('white board', 'study', 'office', () => {
    const b = m('white board').box([1.24, 0.84, 0.03], [0, 1.35, -0.01], { color: 'silver' })
      .box([1.2, 0.8, 0.04], [0, 1.35, 0], { color: 'white' })
      .box([1.0, 0.03, 0.06], [0, 0.94, 0.04], { color: 'silver' })
      .rod([-0.45, 1.55, 0.022], [-0.15, 1.6, 0.022], 0.012, 'red', { noInk: true }).rod([-0.45, 1.45, 0.022], [-0.2, 1.45, 0.022], 0.012, 'blue', { noInk: true })
      .rod([-0.45, 1.35, 0.022], [-0.25, 1.35, 0.022], 0.012, 'blue', { noInk: true }).rod([0.1, 1.2, 0.022], [0.4, 1.55, 0.022], 0.012, 'green', { noInk: true })
      .rod([0.4, 1.55, 0.022], [0.45, 1.2, 0.022], 0.012, 'green', { noInk: true });
    ['red', 'blue', 'black'].forEach((c, i) => b.capsule([0.02, 0.12, 0.02], [-0.2 + i * 0.15, 0.965, 0.04], { color: c, rot: [0, 0, 90] }));
    b.pair((s) => b.stick([s * 0.62, 0.12, 0], [s * 0.62, 1.75, 0], 0.035, 'silver').stick([s * 0.62, 0.12, -0.25], [s * 0.62, 0.12, 0.25], 0.04, 'silver').ball(0.14, [s * 0.62, 0.07, 0.22], { color: 'black' }).ball(0.14, [s * 0.62, 0.07, -0.22], { color: 'black' }));
    return b.done();
  }),
  e('white sauce', 'food', 'sauces', () =>
    m('white sauce').cyl([0.16, 0.08, 0.16], [0, 0.04, 0], { color: 'silver' })
      .cyl([0.15, 0.01, 0.15], [0, 0.081, 0], { color: '#f8f2e0' })
      .stick([0.08, 0.06, 0], [0.22, 0.07, 0], 0.02, 'black')
      .capsule([0.016, 0.04, 0.012], [0, 0.065, 0.078], { color: '#f8f2e0' })
      .stick([-0.02, 0.07, 0], [-0.06, 0.16, -0.03], 0.012, 'lightwood').ball([0.035, 0.012, 0.03], [-0.015, 0.082, 0.005], { color: 'lightwood' })
      .done(),
  ),
  e('whoopee cushion', 'toys', 'pranks', () =>
    m('whoopee cushion').ball([0.2, 0.05, 0.2], [0, 0.025, 0], { color: 'red' })
      .cyl([0.05, 0.06, 0.02], [0, 0.012, 0.12], { color: 'red', rot: [90, 0, 0], taper: 0.6 })
      .ball([0.08, 0.012, 0.06], [-0.03, 0.045, -0.03], { color: '#ff8080', noInk: true })
      .done(),
  ),
  e('wick', 'home', 'candles', () =>
    m('wick').cyl([0.12, 0.012, 0.12], [0, 0.006, 0], { color: 'brass' })
      .cyl([0.07, 0.1, 0.07], [0, 0.06, 0], { color: 'cream' })
      .cyl([0.06, 0.005, 0.06], [0, 0.11, 0], { color: '#f5e8c8' })
      .capsule([0.012, 0.035, 0.012], [0.03, 0.09, 0.018], { color: 'cream' })
      .stick([0, 0.11, 0], [0.004, 0.145, 0], 0.006, 'black')
      .ball([0.025, 0.05, 0.025], [0.004, 0.172, 0], { color: 'orange', glow: true })
      .ball([0.012, 0.025, 0.012], [0.004, 0.165, 0.008], { color: 'yellow', glow: true })
      .done(),
  ),
  e('wig', 'wardrobe', 'hairpieces', () => {
    const b = headForm('wig').ball([0.22, 0.2, 0.23], [0, 0.27, -0.015], { color: 'gold' })
      .ball([0.2, 0.26, 0.08], [0, 0.17, -0.08], { color: 'gold' })
      .ball([0.16, 0.05, 0.07], [0, 0.32, 0.07], { color: 'gold' });
    b.pair((s) => b.capsule([0.07, 0.24, 0.07], [s * 0.085, 0.17, -0.02], { color: 'gold' }));
    return b.done();
  }),
  e('willow tree', 'garden', 'trees', () => {
    const b = m('willow tree').cyl([0.7, 3.2, 0.7], [0, 1.6, 0], { color: 'bark', taper: 0.7 }).ball([4.4, 2.2, 4.0], [0, 4.0, 0], { color: '#9acd5a' });
    for (const [x, z] of around(10, 1.9)) b.capsule([0.35, 2.4, 0.35], [x, 2.6, z * 0.9], { color: '#8cc04a' });
    for (const [x, z] of around(7, 1.1, 0.4)) b.capsule([0.35, 2.0, 0.35], [x, 2.9, z], { color: '#7ab03a' });
    return b.done();
  }),
  e('winch', 'workshop', 'machines', () => {
    const b = m('winch').box([0.4, 0.04, 0.3], [0, 0.02, 0], { color: 'darkgray' })
      .cyl([0.14, 0.28, 0.14], [0, 0.2, 0], { color: 'silver', rot: [0, 0, 90] })
      .cyl([0.16, 0.2, 0.16], [0, 0.2, 0], { color: 'steel', rot: [0, 0, 90] })
      .stick([0, 0.13, 0.05], [0, 0.03, 0.42], 0.015, 'steel')
      .torus([0.06, 0.07, 0.012], [0, 0.03, 0.46], { color: 'iron', rot: [0, 90, 0] })
      .cyl([0.2, 0.02, 0.2], [-0.175, 0.2, 0], { color: 'brass', rot: [0, 0, 90], segs: 12 })
      .cyl([0.05, 0.03, 0.05], [0.18, 0.2, 0], { color: 'black', rot: [0, 0, 90], name: 'crank' })
      .stick([0.18, 0.2, 0], [0.18, 0.34, 0.05], 0.025, 'black', { parent: 'crank' })
      .stick([0.18, 0.34, 0.05], [0.28, 0.34, 0.05], 0.025, 'red', { parent: 'crank' });
    b.pair((s) => b.box([0.03, 0.28, 0.26], [s * 0.155, 0.18, 0], { color: 'blue' }));
    return b.done();
  }),
  e('wind chime', 'garden', 'garden things', () => {
    const b = m('wind chime').box([0.3, 0.08, 0.3], [0, 0.04, 0], { color: 'stone' })
      .stick([0, 0.08, 0], [0, 1.0, 0], 0.025, 'black').rod([0, 1.0, 0], [0.15, 1.05, 0], 0.025, 'black').rod([0.15, 1.05, 0], [0.25, 0.99, 0], 0.025, 'black')
      .stick([0.25, 0.99, 0], [0.25, 0.86, 0], 0.004, 'tan')
      .cyl([0.16, 0.025, 0.16], [0.25, 0.85, 0], { color: 'wood' })
      .cyl([0.04, 0.012, 0.04], [0.25, 0.62, 0], { color: 'wood' })
      .box([0.06, 0.08, 0.006], [0.25, 0.46, 0], { color: 'wood' })
      .stick([0.25, 0.84, 0], [0.25, 0.5, 0], 0.003, 'tan');
    around(5, 0.06).forEach(([x, z], i) => {
      const L = 0.25 + i * 0.035;
      b.stick([0.25 + x, 0.84, z], [0.25 + x, 0.8, z], 0.003, 'tan').cyl([0.018, L, 0.018], [0.25 + x, 0.8 - L / 2, z], { color: 'silver' });
    });
    return b.done();
  }),
  e('wind farm', 'tech', 'power', () => {
    const b = m('wind farm').cyl([5, 0.4, 3], [0, 0.2, 0], { color: 'grass', taper: 0.9 });
    windTurbine(b, 0, 0.2, 0.4, 2.4, 'fan');
    windTurbine(b, -1.6, -0.6, 0.4, 1.9);
    windTurbine(b, 1.6, -0.4, 0.4, 1.7);
    return b.done();
  }),
  e('wind turbine', 'tech', 'power', () => windTurbine(m('wind turbine').box([0.8, 0.3, 0.8], [0, 0.15, 0], { color: 'stone' }), 0, 0, 0.3, 2.6, 'fan').done()),
  e('windmill', 'places', 'landmarks', () => {
    const b = m('windmill').cyl([3.6, 0.5, 3.6], [0, 0.25, 0], { color: 'stone' })
      .cyl([3.2, 4.5, 3.2], [0, 2.75, 0], { color: 'tan', taper: 0.65, segs: 8 })
      .ball([2.3, 1.6, 2.3], [0, 5.1, 0], { color: 'darkgray' })
      .box([0.8, 1.4, 0.1], [0, 1.2, 1.5], { color: 'darkwood', name: 'door', pivot: [-0.4, 1.2, 1.5] })
      .box([0.5, 0.6, 0.1], [0, 3.1, 1.25], { color: 'glass' })
      .cyl([0.4, 0.5, 0.4], [0, 5.0, 1.3], { color: 'darkwood', rot: [90, 0, 0], name: 'fan' });
    b.each(4, (i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a), deg = (-a * 180) / Math.PI;
      b.stick([0, 5.0, 1.45], [s * 3.0, 5.0 + c * 3.0, 1.45], 0.1, 'darkwood', { parent: 'fan' })
        .box([0.7, 2.4, 0.05], [s * 1.8 + c * 0.38, 5.0 + c * 1.8 - s * 0.38, 1.42], { color: 'cream', rot: [0, 0, deg], parent: 'fan' });
    });
    return b.done();
  }),
  e('window', 'home', 'window things', () => {
    const b = m('window').box([1.15, 0.1, 0.2], [0, 0.05, 0.03], { color: 'white' })
      .box([0.86, 1.06, 0.03], [0, 0.66, 0], { color: 'glass' })
      .box([0.86, 0.05, 0.06], [0, 0.66, 0], { color: 'white' }).box([0.05, 1.06, 0.06], [0, 0.66, 0], { color: 'white' })
      .box([1.0, 0.1, 0.1], [0, 1.24, 0], { color: 'white' });
    b.pair((s) => b.box([0.1, 1.2, 0.1], [s * 0.48, 0.68, 0], { color: 'white' }));
    return b.done();
  }),
  e('window blinds', 'home', 'window things', () => {
    const b = m('window blinds').box([1.1, 0.06, 0.2], [0, 0.03, 0.03], { color: 'white' })
      .box([1.0, 1.2, 0.1], [0, 0.66, -0.06], { color: 'white' })
      .box([0.9, 1.1, 0.02], [0, 0.66, 0.0], { color: 'skyblue' })
      .box([1.0, 0.08, 0.1], [0, 1.22, 0.06], { color: 'white' })
      .box([0.96, 0.03, 0.07], [0, 0.12, 0.06], { color: 'white' })
      .stick([0.42, 1.2, 0.12], [0.42, 0.5, 0.12], 0.008, 'gray').ball(0.03, [0.42, 0.48, 0.12], { color: 'gray' });
    b.each(14, (i) => b.box([0.94, 0.012, 0.06], [0, 0.17 + i * 0.075, 0.06], { color: 'cream', rot: [25, 0, 0] }));
    b.pair((s) => b.stick([s * 0.3, 1.2, 0.09], [s * 0.3, 0.12, 0.09], 0.004, 'lightgray'));
    return b.done();
  }),
  e('window cleaner', 'town', 'workers', () => who('window cleaner', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [hat('cap', 'blue'), wear('overalls', 'navy'), held('mop')] })),
  e('window fan', 'home', 'appliances', () => {
    const b = m('window fan').box([0.42, 0.42, 0.1], [0, 0.24, 0], { color: 'white', round: 0.2 })
      .cyl([0.37, 0.01, 0.37], [0, 0.24, 0.051], { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.07, 0.03, 0.07], [0, 0.24, 0.06], { color: 'skyblue', rot: [90, 0, 0], name: 'fan' })
      .torus([0.36, 0.36, 0.01], [0, 0.24, 0.078], { color: 'gray', tube: 0.04, noInk: true })
      .torus([0.22, 0.22, 0.01], [0, 0.24, 0.078], { color: 'gray', tube: 0.06, noInk: true })
      .box([0.12, 0.03, 0.04], [0, 0.465, 0], { color: 'gray', round: 0.4 })
      .cyl([0.03, 0.02, 0.03], [0.17, 0.42, 0.055], { color: 'gray', rot: [90, 0, 0] });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.box([0.07, 0.14, 0.01], [Math.sin(a) * 0.09, 0.24 + Math.cos(a) * 0.09, 0.065], { color: 'skyblue', rot: [0, 15, (-a * 180) / Math.PI], parent: 'fan' });
    });
    b.pair((s) => b.box([0.06, 0.03, 0.14], [s * 0.15, 0.015, 0], { color: 'gray' }));
    return b.done();
  }),
  e('window sill', 'home', 'window things', () =>
    m('window sill').box([0.9, 0.18, 0.12], [0, 0.09, -0.04], { color: 'cream' })
      .box([1.0, 0.04, 0.22], [0, 0.2, 0], { color: 'white' })
      .box([0.8, 0.12, 0.06], [0, 0.28, -0.07], { color: 'white' })
      .box([0.7, 0.07, 0.02], [0, 0.3, -0.035], { color: 'glass' })
      .cyl([0.07, 0.06, 0.07], [0.28, 0.25, 0.03], { color: TERRA, taper: 1.25 })
      .ball([0.1, 0.08, 0.1], [0.28, 0.31, 0.03], { color: 'leaf' })
      .ball([0.03, 0.03, 0.02], [0.3, 0.33, 0.08], { color: 'pink' })
      .done(),
  ),
  e('windscreens', 'garage', 'car parts', () => {
    const t = (-35 * Math.PI) / 180, up: V = [0, Math.cos(t), Math.sin(t)], nz: V = [0, -Math.sin(t), Math.cos(t)];
    const c: V = [0, 0.46, 0.0];
    const at = (u: number, v: number, d: number): V => [u, c[1] + v * up[1] + d * nz[1], c[2] + v * up[2] + d * nz[2]];
    return m('windscreens').box([1.6, 0.3, 0.8], [0, 0.15, 0.5], { color: 'red', round: 0.5 })
      .ball([0.16, 0.12, 0.2], [0.86, 0.45, 0.1], { color: 'red' }).ball([0.16, 0.12, 0.2], [-0.86, 0.45, 0.1], { color: 'red' })
      .box([1.5, 0.08, 0.35], [0, 0.8, -0.38], { color: 'red', round: 0.3 })
      .box([0.16, 0.06, 0.03], at(0, 0.3, 0.06), { color: 'black', rot: [-35, 0, 0] })
      .box([0.8, 0.12, 0.04], [0, 0.14, 0.9], { color: 'darkgray' })
      .ball([0.24, 0.12, 0.06], [0.58, 0.16, 0.9], { color: 'yellow', glow: true }).ball([0.24, 0.12, 0.06], [-0.58, 0.16, 0.9], { color: 'yellow', glow: true })
      .stick(at(0.76, -0.4, 0), at(0.72, 0.4, 0), 0.07, 'red').stick(at(-0.76, -0.4, 0), at(-0.72, 0.4, 0), 0.07, 'red')
      .box([1.46, 0.81, 0.03], c, { color: 'black', rot: [-35, 0, 0], round: 0.2 })
      .box([1.4, 0.75, 0.04], at(0, 0, 0.01), { color: 'glass', rot: [-35, 0, 0], round: 0.3 })
      .stick(at(-0.6, -0.3, 0.035), at(-0.05, -0.28, 0.035), 0.02, 'black')
      .stick(at(0.05, -0.3, 0.035), at(0.6, -0.28, 0.035), 0.02, 'black')
      .done();
  }),
  e('wing', 'aviary', 'feathers', () => wingAt(m('wing'), 1, -0.85).done()),
  e('wings', 'fantasy', 'magic items', () => {
    const b = m('wings').ball([0.4, 0.6, 0.25], [0, 1.4, -0.05], { color: '#e6ecf5' });
    b.pair((s) => wingAt(b, s, s * 0.12));
    return b.done();
  }),
  e('wire (string)', 'workshop', 'hardware', () =>
    m('wire (string)').cyl([0.1, 0.012, 0.1], [0.035, 0.05, 0], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.1, 0.012, 0.1], [-0.035, 0.05, 0], { color: 'black', rot: [0, 0, 90] })
      .cyl([0.08, 0.06, 0.08], [0, 0.05, 0], { color: 'copper', rot: [0, 0, 90] })
      .rod([0.0, 0.012, 0.04], [0.06, 0.004, 0.1], 0.006, 'copper').rod([0.06, 0.004, 0.1], [0.12, 0.004, 0.08], 0.006, 'copper')
      .done(),
  ),
  e('wire cutter', 'workshop', 'hand tools', () => {
    const b = m('wire cutter').cyl([0.026, 0.016, 0.026], [0, 0.145, 0], { color: 'silver', rot: [90, 0, 0] });
    b.pair((s) => b.rod([s * 0.005, 0.15, 0], [s * 0.012, 0.115, 0], 0.012, 'silver').rod([s * 0.012, 0.12, 0], [s * 0.042, 0.01, 0], 0.022, 'red').cone([0.02, 0.06, 0.012], [s * 0.007, 0.18, 0], { color: 'silver', rot: [0, 0, s * -8] }));
    return b.done();
  }),
  e('wishbone', 'ideas', 'good luck', () => {
    const b = m('wishbone').ball([0.022, 0.02, 0.012], [0, 0.012, 0], { color: 'cream' });
    b.pair((s) => b.rod([0, 0.015, 0], [s * 0.018, 0.05, 0], 0.009, 'cream').rod([s * 0.018, 0.05, 0], [s * 0.035, 0.1, 0], 0.008, 'cream').ball(0.012, [s * 0.036, 0.104, 0], { color: 'cream' }));
    return b.done();
  }),
  e('witch hat', 'wardrobe', 'hats', () =>
    m('witch hat').cyl([0.45, 0.015, 0.45], [0, 0.0075, 0], { color: 'black' })
      .cone([0.24, 0.3, 0.24], [0, 0.16, 0], { color: 'black' })
      .cone([0.06, 0.12, 0.06], [0.04, 0.33, 0], { color: 'black', rot: [0, 0, -35] })
      .cyl([0.225, 0.04, 0.225], [0, 0.04, 0], { color: 'purple', taper: 0.9 })
      .box([0.06, 0.045, 0.01], [0, 0.04, 0.108], { color: 'gold' })
      .box([0.03, 0.022, 0.012], [0, 0.04, 0.108], { color: 'black' })
      .done(),
  ),
  e("witch's wand", 'fantasy', 'magic items', () =>
    m("witch's wand").box([0.22, 0.05, 0.16], [0, 0.025, 0], { color: 'purple', round: 0.2 })
      .box([0.2, 0.04, 0.15], [0.006, 0.025, 0], { color: 'cream', round: 0.1 })
      .rod([-0.16, 0.06, -0.03], [-0.05, 0.065, 0.0], 0.016, 'darkbrown').rod([-0.05, 0.065, 0.0], [0.04, 0.06, 0.03], 0.013, 'darkbrown').rod([0.04, 0.06, 0.03], [0.14, 0.068, 0.02], 0.01, 'darkbrown')
      .ball(0.022, [-0.05, 0.066, 0.0], { color: 'darkbrown' })
      .ball(0.03, [0.15, 0.07, 0.02], { color: 'lime', glow: true })
      .ball(0.015, [0.17, 0.1, 0.03], { color: 'lime', glow: true }).ball(0.01, [0.19, 0.12, 0.02], { color: 'lime', glow: true })
      .done(),
  ),
  e('wizard hat', 'wardrobe', 'hats', () =>
    m('wizard hat').cyl([0.42, 0.015, 0.42], [0, 0.0075, 0], { color: 'navy' })
      .cone([0.26, 0.42, 0.26], [0, 0.22, 0], { color: 'blue' })
      .cyl([0.25, 0.035, 0.25], [0, 0.03, 0], { color: 'gold', taper: 0.92 })
      .star(0.06, [0.0, 0.12, 0.1], { color: 'gold', noInk: true })
      .star(0.045, [0.04, 0.25, 0.05], { color: 'gold', noInk: true })
      .ball([0.04, 0.05, 0.01], [-0.06, 0.18, 0.085], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('wizard staff', 'fantasy', 'magic items', () => {
    const b = m('wizard staff').rod([0, 0, 0], [0.02, 0.7, 0], 0.05, 'wood').rod([0.02, 0.7, 0], [-0.01, 1.3, 0], 0.05, 'wood')
      .ball(0.07, [0.02, 0.7, 0], { color: 'darkwood' })
      .ball(0.22, [-0.01, 1.45, 0], { color: 'cyan' })
      .star(0.08, [0.15, 1.55, 0.05], { color: 'yellow', glow: true });
    for (const [x, z] of around(3, 0.08, 0.5)) b.rod([-0.01, 1.3, 0], [x - 0.01, 1.5, z], 0.025, 'wood');
    return b.done();
  }),
  e('wood', 'workshop', 'building materials', () => {
    const b = m('wood');
    for (const [x, y] of [[-0.31, 0.15], [0, 0.15], [0.31, 0.15], [-0.155, 0.41], [0.155, 0.41], [0, 0.67]]) {
      b.cyl([0.3, 1.0, 0.3], [x, y, 0], { color: 'bark', rot: [90, 0, 0] }).cyl([0.26, 0.012, 0.26], [x, y, 0.5], { color: 'lightwood', rot: [90, 0, 0] })
        .torus([0.14, 0.14, 0.006], [x, y, 0.507], { color: 'wood', tube: 0.1, noInk: true });
    }
    return b.done();
  }),
  e('wood chip', 'garden', 'garden things', () => {
    const b = m('wood chip').cyl([0.22, 0.03, 0.2], [0, 0.015, 0], { color: '#8a5a2b', taper: 0.6 });
    b.each(12, (i) => {
      const a = i * 2.4, r = 0.015 + (i % 4) * 0.02;
      b.box([0.035, 0.008, 0.02], [Math.cos(a) * r, 0.036 - r * 0.25, Math.sin(a) * r], { color: ['#c8955a', '#a8743a', '#d9b07a'][i % 3], rot: [((i * 37) % 40) - 20, (i * 53) % 180, ((i * 29) % 40) - 20] });
    });
    return b.done();
  }),
  e('wood chipper', 'garden', 'garden tools', () => {
    const b = m('wood chipper', { view: 'side' }).box([1.0, 0.25, 2.2], [0, 0.55, 0], { color: 'darkgray' })
      .box([0.9, 0.9, 1.0], [0, 1.1, -0.2], { color: 'orange', round: 0.2 })
      .box([0.8, 0.6, 0.9], [0, 0.95, -1.0], { color: 'orange', rot: [-25, 0, 0], round: 0.1 })
      .box([0.6, 0.4, 0.05], [0, 0.82, -1.42], { color: 'black', rot: [-25, 0, 0] })
      .rod([0, 1.5, 0.0], [0, 2.3, 0.4], 0.25, 'orange')
      .box([0.3, 0.2, 0.4], [0, 2.3, 0.55], { color: 'orange', round: 0.3 })
      .box([0.7, 0.5, 0.6], [0, 1.0, 0.6], { color: 'darkgray', round: 0.2 })
      .stick([0.25, 1.25, 0.7], [0.25, 1.55, 0.7], 0.06, 'black')
      .rod([0, 0.5, 1.1], [0, 0.4, 1.8], 0.08, 'darkgray');
    return axle(b, 0.6, 0.2, 0.55, -0.2).done();
  }),
  e('wooden cage', 'pets', 'cages', () => {
    const b = m('wooden cage').box([1.2, 0.1, 0.9], [0, 0.05, 0], { color: 'wood' }).box([1.2, 0.1, 0.9], [0, 1.35, 0], { color: 'wood' })
      .box([1.1, 0.04, 0.8], [0, 0.12, 0], { color: '#e8c860' });
    for (const [x, z] of [[0.56, 0.41], [-0.56, 0.41], [0.56, -0.41], [-0.56, -0.41]]) b.box([0.08, 1.3, 0.08], [x, 0.7, z], { color: 'darkwood' });
    b.each(6, (i) => b.stick([-0.4 + i * 0.16, 0.1, 0.42], [-0.4 + i * 0.16, 1.3, 0.42], 0.04, 'wood'));
    b.pair((s) => b.each(3, (i) => b.stick([s * 0.58, 0.1, -0.2 + i * 0.2], [s * 0.58, 1.3, -0.2 + i * 0.2], 0.04, 'wood')));
    return b.done();
  }),
  e('wooden gate', 'garden', 'fences', () => {
    const b = m('wooden gate').box([0.1, 1.0, 0.05], [-0.7, 0.72, 0], { color: 'lightwood', name: 'door', pivot: [-0.75, 0.72, 0] })
      .box([0.1, 1.0, 0.05], [0.7, 0.72, 0], { color: 'lightwood', parent: 'door' })
      .rod([-0.66, 0.3, 0.03], [0.66, 1.12, 0.03], 0.07, 'lightwood', { parent: 'door' })
      .box([0.06, 0.08, 0.06], [0.78, 0.8, 0.03], { color: 'iron' });
    b.each(3, (i) => b.box([1.5, 0.1, 0.05], [0, 0.3 + i * 0.41, 0], { color: 'lightwood', parent: 'door' }));
    b.pair((s) => b.box([0.15, 1.5, 0.15], [s * 0.85, 0.75, 0], { color: 'darkwood' }).cone([0.17, 0.12, 0.17], [s * 0.85, 1.56, 0], { color: 'darkwood', segs: 4, rot: [0, 45, 0] }));
    return b.done();
  }),
  e('wooden spoon', 'kitchen', 'utensils', () =>
    m('wooden spoon').stick([0, 0, 0], [0, 0.22, 0], 0.018, 'lightwood')
      .ball([0.06, 0.085, 0.025], [0, 0.26, 0], { color: 'lightwood' })
      .ball([0.045, 0.062, 0.006], [0, 0.262, 0.011], { color: 'wood', noInk: true })
      .done(),
  ),
  e('wool', 'home', 'fabrics', () => {
    const b = m('wool').ball(0.14, [0, 0.07, 0], { color: 'pink' });
    b.each(4, (i) => b.torus([0.142, 0.142, 0.02], [0, 0.07, 0], { color: '#e87aa8', tube: 0.06, rot: [i * 45, i * 30, 20], noInk: true }));
    return b.rod([0.03, 0.01, 0.06], [0.15, 0.004, 0.12], 0.008, 'pink')
      .stick([-0.12, 0.03, -0.04], [0.1, 0.17, 0.02], 0.008, 'silver').stick([-0.1, 0.17, 0.03], [0.12, 0.04, -0.03], 0.008, 'silver')
      .ball(0.018, [-0.12, 0.03, -0.04], { color: 'red' }).ball(0.018, [-0.1, 0.17, 0.03], { color: 'red' })
      .done();
  }),
  e('workbench', 'workshop', 'workshop furniture', () => {
    const b = m('workbench').box([1.6, 0.08, 0.7], [0, 0.86, 0], { color: 'wood' })
      .box([1.5, 0.04, 0.6], [0, 0.2, 0], { color: 'wood' })
      .box([1.6, 0.6, 0.03], [0, 1.2, -0.34], { color: '#c8a878' })
      .stick([-0.5, 1.35, -0.31], [-0.5, 1.1, -0.31], 0.025, 'wood').box([0.12, 0.05, 0.04], [-0.5, 1.37, -0.3], { color: 'gray' })
      .stick([-0.2, 1.4, -0.31], [-0.15, 1.1, -0.31], 0.03, 'silver')
      .box([0.3, 0.12, 0.02], [0.3, 1.3, -0.31], { color: 'steel' }).box([0.1, 0.05, 0.03], [0.48, 1.3, -0.31], { color: 'red' })
      .box([0.12, 0.1, 0.15], [0.68, 0.95, 0.28], { color: 'blue' })
      .box([0.4, 0.18, 0.2], [-0.4, 0.31, 0.05], { color: 'red', round: 0.2 });
    for (const [x, z] of [[0.74, 0.3], [-0.74, 0.3], [0.74, -0.3], [-0.74, -0.3]]) b.box([0.08, 0.82, 0.08], [x, 0.41, z], { color: 'darkwood' });
    return b.done();
  }),
  e('wrapper', 'food', 'sweets', () =>
    m('wrapper').box([0.08, 0.14, 0.015], [0, 0.07, 0], { color: 'red', round: 0.2 })
      .box([0.082, 0.03, 0.017], [0, 0.155, 0], { color: 'silver', round: 0.3 })
      .box([0.07, 0.03, 0.012], [0, 0.18, 0], { color: 'chocolate', round: 0.2 })
      .box([0.002, 0.03, 0.013], [0, 0.18, 0], { color: '#3a2010', noInk: true })
      .label('CHOCO', [0.065, 0.03], [0, 0.08, 0.004], { color: 'yellow' })
      .done(),
  ),
  e('wrapping paper', 'toys', 'party things', () => {
    const b = m('wrapping paper').cyl([0.08, 0.5, 0.08], [-0.06, 0.25, 0], { color: 'red' })
      .cyl([0.08, 0.45, 0.08], [0.04, 0.225, -0.08], { color: 'green' })
      .box([0.14, 0.1, 0.14], [0.08, 0.05, 0.12], { color: 'blue' })
      .box([0.142, 0.102, 0.03], [0.08, 0.05, 0.12], { color: 'gold' }).box([0.03, 0.102, 0.142], [0.08, 0.05, 0.12], { color: 'gold' });
    b.pair((s) => b.ball([0.05, 0.035, 0.03], [0.08 + s * 0.025, 0.115, 0.12], { color: 'gold', rot: [0, 0, s * 25] }));
    for (let k = 0; k < 4; k++) for (const [x, z] of around(3, 0.04, k)) b.ball([0.015, 0.015, 0.004], [-0.06 + x, 0.07 + k * 0.11, z], { color: 'gold', noInk: true, rot: [0, (-Math.atan2(z, x) * 180) / Math.PI + 90, 0] });
    return b.done();
  }),
  e('wreath', 'toys', 'christmas', () => {
    const b = m('wreath').torus([0.55, 0.55, 0.12], [0, 0.3, 0], { color: 'darkgreen', tube: 0.3 });
    b.each(10, (i) => {
      const a = (i / 10) * Math.PI * 2;
      b.ball([0.1, 0.1, 0.06], [Math.sin(a) * 0.2, 0.3 + Math.cos(a) * 0.2, 0.04], { color: 'green' });
    });
    b.each(6, (i) => {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      b.ball(0.035, [Math.sin(a) * 0.22, 0.3 + Math.cos(a) * 0.22, 0.07], { color: 'red' });
    });
    b.ball(0.05, [0, 0.1, 0.08], { color: 'red' });
    b.pair((s) => b.ball([0.12, 0.08, 0.04], [s * 0.07, 0.11, 0.07], { color: 'red', rot: [0, 0, s * 15] }).rod([s * 0.01, 0.09, 0.08], [s * 0.06, 0.0, 0.08], 0.025, 'red'));
    return b.done();
  }),
  e('wrecking ball', 'workshop', 'construction', () =>
    m('wrecking ball', { view: 'side' }).box([1.6, 0.4, 2.2], [0, 0.2, -0.3], { color: 'darkgray' })
      .box([1.4, 1.2, 1.4], [0, 1.0, -0.4], { color: 'yellow', round: 0.1 })
      .box([1.2, 0.5, 0.05], [0, 1.25, 0.31], { color: 'glass' })
      .box([1.3, 0.6, 0.6], [0, 0.9, -1.3], { color: 'darkgray' })
      .rod([0, 1.2, 0.3], [0, 4.2, 2.4], 0.25, 'yellow')
      .stick([0, 4.2, 2.4], [0, 1.6, 2.4], 0.04, 'black')
      .ball(1.0, [0, 1.1, 2.4], { color: 'darkgray' })
      .done(),
  ),
  e('wrench', 'workshop', 'hand tools', () => {
    const b = m('wrench').box([0.03, 0.16, 0.018], [0, 0.11, 0], { color: 'silver', round: 0.5 })
      .torus([0.045, 0.045, 0.018], [0, 0.025, 0], { color: 'silver', tube: 0.3 })
      .box([0.055, 0.02, 0.018], [0, 0.2, 0], { color: 'silver', round: 0.3 });
    b.pair((s) => b.box([0.018, 0.04, 0.018], [s * 0.019, 0.226, 0], { color: 'silver', round: 0.3, rot: [0, 0, s * -10] }));
    return b.done();
  }),
  e('wristband', 'wardrobe', 'accessories', () =>
    m('wristband').torus([0.09, 0.09, 0.06], [0, 0.045, 0], { color: 'red', tube: 0.25 })
      .torus([0.092, 0.092, 0.01], [0, 0.045, 0.016], { color: 'white', tube: 0.2, noInk: true })
      .torus([0.092, 0.092, 0.01], [0, 0.045, -0.016], { color: 'white', tube: 0.2, noInk: true })
      .done(),
  ),
  e('x-ray (machine)', 'clinic', 'hospital machines', () =>
    m('x-ray (machine)').box([0.4, 0.76, 0.6], [0, 0.38, 0], { color: 'lightgray' })
      .box([0.7, 0.08, 2.0], [0, 0.8, 0], { color: 'white', round: 0.3 })
      .box([0.2, 1.9, 0.2], [-0.6, 0.95, -0.5], { color: 'gray' })
      .box([0.7, 0.15, 0.15], [-0.3, 1.75, -0.5], { color: 'gray' })
      .box([0.35, 0.25, 0.3], [0, 1.6, -0.5], { color: 'white', round: 0.3 })
      .box([0.2, 0.12, 0.2], [0, 1.42, -0.5], { color: 'darkgray' })
      .cyl([0.12, 0.01, 0.12], [0.18, 1.62, -0.5], { color: 'yellow', rot: [0, 0, 90] })
      .stick([0.75, 0, -0.9], [0.75, 1.2, -0.9], 0.05, 'gray')
      .box([0.5, 0.4, 0.04], [0.75, 1.4, -0.9], { color: '#cfe8ff', glow: true })
      .stick([0.75, 1.55, -0.875], [0.75, 1.25, -0.875], 0.03, 'white', { noInk: true })
      .ball([0.2, 0.025, 0.01], [0.75, 1.5, -0.875], { color: 'white', noInk: true }).ball([0.22, 0.025, 0.01], [0.75, 1.43, -0.875], { color: 'white', noInk: true }).ball([0.2, 0.025, 0.01], [0.75, 1.36, -0.875], { color: 'white', noInk: true })
      .done(),
  ),
  e('xylophone', 'music', 'percussion', () => {
    const b = m('xylophone');
    b.pair((s) => b.box([0.74, 0.07, 0.07], [0, 0.6, s * 0.13], { color: 'darkwood' }).stick([0.33, 0.58, s * 0.12], [0.36, 0, s * 0.18], 0.035, 'darkwood').stick([-0.33, 0.58, s * 0.12], [-0.36, 0, s * 0.18], 0.035, 'darkwood'));
    ['red', 'orange', 'yellow', 'lime', 'green', 'skyblue', 'blue', 'purple'].forEach((c, i) => b.box([0.07, 0.03, 0.4 - i * 0.025], [-0.31 + i * 0.088, 0.65, 0], { color: c, round: 0.3 }));
    b.stick([-0.2, 0.68, 0.24], [0.1, 0.67, 0.3], 0.012, 'wood').ball(0.04, [-0.2, 0.68, 0.24], { color: 'red' });
    b.stick([0.0, 0.68, 0.26], [0.3, 0.67, 0.34], 0.012, 'wood').ball(0.04, [0.0, 0.68, 0.26], { color: 'red' });
    return b.done();
  }),
  e('yacht', 'garage', 'boats', () =>
    m('yacht', { view: 'side' }).box([2.4, 1.2, 6.5], [0, 0.85, -0.5], { color: 'white', round: 0.5 })
      .ball([2.4, 1.2, 3.0], [0, 0.85, 2.6], { color: 'white' })
      .box([2.42, 0.2, 6.5], [0, 0.5, -0.5], { color: 'navy', round: 0.5, noInk: true })
      .box([0.2, 0.4, 1.6], [0, 0.2, 0], { color: 'darkgray' })
      .box([1.6, 0.6, 2.4], [0, 1.7, -0.6], { color: 'white', round: 0.3 })
      .box([1.62, 0.2, 2.0], [0, 1.75, -0.6], { color: 'glass', noInk: true })
      .stick([0, 1.4, 0.4], [0, 10.0, 0.4], 0.15, 'silver')
      .stick([0, 1.55, 0.4], [0, 1.55, -3.2], 0.12, 'silver')
      .wedge([3.5, 8.0, 0.05], [0, 5.6, -1.35], { color: 'white', rot: [0, 90, 0], apex: -0.5 })
      .wedge([3.0, 7.0, 0.05], [0, 5.1, 2.1], { color: 'cream', rot: [0, 90, 0], apex: 0.5 })
      .done(),
  ),
  e('yam', 'food', 'vegetables', () =>
    m('yam').capsule([0.07, 0.18, 0.065], [-0.03, 0.035, 0], { color: '#a0522d', rot: [0, 10, 80] })
      .ball(0.03, [-0.08, 0.05, 0.015], { color: '#a0522d' }).ball(0.025, [0.02, 0.055, -0.01], { color: '#8a4a2a' })
      .cyl([0.065, 0.025, 0.06], [0.1, 0.033, 0.05], { color: '#f08a3a', rot: [0, 0, 90] })
      .torus([0.068, 0.066, 0.026], [0.1, 0.033, 0.05], { color: '#a0522d', rot: [0, 90, 0], tube: 0.08 })
      .done(),
  ),
  e('yoke', 'farm', 'farm things', () => {
    const b = m('yoke').box([1.2, 0.12, 0.14], [0, 0.33, 0], { color: 'wood', round: 0.5 }).torus([0.08, 0.08, 0.02], [0, 0.42, 0.0], { color: 'iron', rot: [0, 90, 0] });
    b.pair((s) => {
      const x = s * 0.35;
      b.rod([x - 0.13, 0.32, 0], [x - 0.12, 0.12, 0], 0.035, 'darkwood').rod([x - 0.12, 0.12, 0], [x, 0.03, 0], 0.035, 'darkwood').rod([x, 0.03, 0], [x + 0.12, 0.12, 0], 0.035, 'darkwood').rod([x + 0.12, 0.12, 0], [x + 0.13, 0.32, 0], 0.035, 'darkwood');
    });
    return b.done();
  }),
  e('yolk', 'food', 'breakfast', () => {
    const b = m('yolk').cyl([0.04, 0.03, 0.04], [0, 0.015, 0], { color: 'cream', taper: 1.5 })
      .ball([0.045, 0.04, 0.045], [0, 0.045, 0], { color: '#ffb020' })
      .ball([0.012, 0.008, 0.006], [-0.01, 0.06, 0.016], { color: 'white', noInk: true });
    for (const [x, z] of around(6, 0.03)) b.cone([0.014, 0.014, 0.01], [x, 0.035, z], { color: 'cream', rot: [0, (-Math.atan2(z, x) * 180) / Math.PI, 0] });
    return b.done();
  }),
  e('zipper', 'wardrobe', 'sewing', () => {
    const b = m('zipper').box([0.026, 0.02, 0.016], [0, 0.087, 0], { color: 'silver', round: 0.3 })
      .box([0.012, 0.03, 0.004], [0, 0.068, 0.011], { color: 'silver', round: 0.3 });
    b.pair((s) => b.box([0.028, 0.085, 0.012], [s * 0.015, 0.0425, 0], { color: 'navy' }).box([0.028, 0.08, 0.012], [s * 0.025, 0.125, 0], { color: 'navy', rot: [0, 0, -s * 10] }));
    b.each(6, (i) => b.box([0.012, 0.006, 0.014], [(i % 2 ? 1 : -1) * 0.003, 0.01 + i * 0.012, 0], { color: 'silver' }));
    for (const k of [0, 1, 2]) b.pair((s) => b.box([0.01, 0.006, 0.014], [s * (0.011 + k * 0.004), 0.105 + k * 0.02, 0], { color: 'silver', rot: [0, 0, -s * 10] }));
    return b.done();
  }),
  e('zoo', 'places', 'parks', () => {
    const b = m('zoo').box([8, 0.2, 5], [0, 0.1, 0], { color: 'grass', round: 0.05 })
      .box([4.8, 0.7, 0.6], [0, 3.6, 1.8], { color: 'darkgreen' })
      .label('ZOO', [2.4, 0.6], [0, 3.6, 2.12], { color: 'yellow' })
      .ball([1.8, 1.4, 1.2], [-2.2, 1.2, -1.2], { color: 'gray' })
      .ball(0.9, [-1.25, 1.5, -0.9], { color: 'gray' })
      .rod([-0.95, 1.4, -0.6], [-0.85, 0.5, -0.4], 0.2, 'gray')
      .ball([0.1, 0.7, 0.55], [-1.5, 1.6, -0.75], { color: '#9a9a9a' })
      .rod([2.6, 0.2, -1.4], [2.4, 2.8, -1.4], 0.25, 'bark').ball([1.8, 0.5, 1.8], [2.4, 2.9, -1.4], { color: 'leaf' });
    for (const [x, z] of [[-2.7, -0.9], [-1.7, -0.9], [-2.7, -1.5], [-1.7, -1.5]]) b.cyl([0.35, 0.7, 0.35], [x, 0.55, z], { color: 'gray' });
    b.pair((s) => b.box([0.8, 3.2, 0.8], [s * 2.0, 1.8, 1.8], { color: 'stone' }).stick([s * 2.4, 0.9, 1.8], [s * 3.9, 0.9, 1.8], 0.08, 'darkwood').stick([s * 2.4, 0.5, 1.8], [s * 3.9, 0.5, 1.8], 0.08, 'darkwood').stick([s * 3.9, 0.2, 1.8], [s * 3.9, 1.1, 1.8], 0.12, 'darkwood'));
    return b.done();
  }),
  e('zucchini', 'food', 'vegetables', () =>
    m('zucchini').capsule([0.055, 0.2, 0.055], [-0.02, 0.0275, 0], { color: 'darkgreen', rot: [0, 0, 90] })
      .capsule([0.02, 0.18, 0.04], [-0.02, 0.045, 0.012], { color: '#4a8a3a', rot: [0, 0, 90], noInk: true })
      .cyl([0.02, 0.025, 0.02], [0.095, 0.03, 0], { color: '#8ab84a', rot: [0, 0, 90] })
      .cyl([0.05, 0.015, 0.05], [0.04, 0.025, 0.07], { color: '#f2f0c0', rot: [90, 0, 0] })
      .torus([0.052, 0.052, 0.016], [0.04, 0.025, 0.07], { color: 'darkgreen', tube: 0.08 })
      .done(),
  ),
  e('éclair', 'food', 'pastries', () =>
    m('éclair').cyl([0.2, 0.01, 0.12], [0, 0.005, 0], { color: 'white' })
      .capsule([0.04, 0.15, 0.035], [0, 0.03, 0], { color: '#d9a050', rot: [0, 0, 90] })
      .capsule([0.034, 0.14, 0.02], [0, 0.044, 0], { color: 'chocolate', rot: [0, 0, 90] })
      .ball([0.012, 0.012, 0.012], [0.075, 0.03, 0], { color: 'cream' })
      .done(),
  ),
];

void hat;
void held;
void wear;
void who;
