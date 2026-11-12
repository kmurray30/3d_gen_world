/** Catalog chunk objects-09: the words in assign/objects-09.tsv. */
import { e, type CatalogEntry } from './types';
import { m, M, around } from '../dsl';
import { body, face, hat, held, wear, who } from '../accessories';

type V = [number, number, number];
const D = Math.PI / 180;

/** A little shop: walls, flat roof, door, two windows, a sign over the door and an optional awning. */
function shop(key: string, o: { w?: number; h?: number; d?: number; wall: string; trim?: string; sign: string; signColor?: string; awning?: string; door?: string }): M {
  const w = o.w ?? 4, h = o.h ?? 3.2, d = o.d ?? 3, f = d / 2;
  const b = m(key)
    .box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.05 })
    .box([w + 0.3, 0.25, d + 0.3], [0, h + 0.12, 0], { color: o.trim ?? 'white', round: 0.1 })
    .box([0.9, 2.0, 0.1], [0, 1.0, f + 0.04], { color: o.door ?? 'darkwood', name: 'door', pivot: [-0.45, 1.0, f + 0.04] })
    .label(o.sign, [w * 0.75, 0.6], [0, h - 0.45, f + 0.05], { color: o.signColor ?? 'white' });
  b.pair((s) => b.box([w * 0.26, 1.3, 0.08], [s * w * 0.3, 1.25, f + 0.03], { color: 'glass' }));
  if (o.awning) b.box([w * 0.95, 0.08, 0.8], [0, 2.25, f + 0.38], { color: o.awning, rot: [18, 0, 0] });
  return b;
}

/** A bottle standing at (x, z): body, shoulder, neck, cap and an optional label band. */
function bottle(b: M, x: number, z: number, h: number, d: number, color: string, cap: string, band?: string): M {
  b.cyl([d, h * 0.62, d], [x, h * 0.31, z], { color })
    .cyl([d, h * 0.18, d], [x, h * 0.71, z], { color, taper: 0.4 })
    .cyl([d * 0.4, h * 0.12, d * 0.4], [x, h * 0.86, z], { color })
    .cyl([d * 0.46, h * 0.08, d * 0.46], [x, h * 0.96, z], { color: cap });
  if (band) b.cyl([d * 1.03, h * 0.3, d * 1.03], [x, h * 0.33, z], { color: band });
  return b;
}

/** A bowl of something: foot, flaring wall, a disc of contents at the top. */
function bowl(b: M, d: number, h: number, color: string, fill: string, x = 0, z = 0): M {
  return b
    .cyl([d * 0.5, h * 0.12, d * 0.5], [x, h * 0.06, z], { color })
    .cyl([d * 0.62, h * 0.88, d * 0.62], [x, h * 0.56, z], { color, taper: 1.6 })
    .cyl([d * 0.94, h * 0.04, d * 0.94], [x, h * 0.98, z], { color: fill });
}

/** Wheels on both sides at each z: tyre ring plus hub. */
function wheels(b: M, x: number, zs: number[], d: number, t = 0.25, color = 'rubber', hub = 'silver'): M {
  for (const z of zs)
    b.pair((s) => {
      b.torus([d, d, t], [s * x, d / 2, z], { color, rot: [0, 90, 0], tube: 0.38 });
      b.cyl([d * 0.42, t * 0.7, d * 0.42], [s * x, d / 2, z], { color: hub, rot: [0, 0, 90] });
    });
  return b;
}

/** A shirt standing as if on a form: torso, sleeves (long, short or none) and a neckline. */
function shirt(key: string, color: string, sl: 'long' | 'short' | 'none', trim = color): M {
  const b = m(key).box([0.46, 0.62, 0.14], [0, 0.31, 0], { color, round: 0.35 });
  if (sl === 'none') b.pair((s) => b.box([0.07, 0.16, 0.1], [s * 0.13, 0.66, 0], { color }));
  else b.pair((s) => b.rod([s * 0.19, 0.55, 0], sl === 'long' ? [s * 0.36, 0.08, 0] : [s * 0.33, 0.38, 0], sl === 'long' ? 0.12 : 0.15, color));
  b.ball([0.16, 0.07, 0.05], [0, 0.6, 0.06], { color: trim, noInk: true });
  return b;
}

/** Trousers: waistband, hips and two legs reaching the floor. */
function trousers(key: string, color: string, len = 0.95, band = color): M {
  const b = m(key).box([0.4, 0.22, 0.18], [0, len - 0.12, 0], { color, round: 0.3 });
  b.pair((s) => b.box([0.18, len - 0.14, 0.16], [s * 0.105, (len - 0.14) / 2, 0], { color, round: 0.3, rot: [0, 0, s * 2] }));
  b.box([0.41, 0.05, 0.19], [0, len - 0.025, 0], { color: band, round: 0.3 });
  return b;
}

/** A building with a gable roof (ridge along x). */
function house(key: string, w: number, h: number, d: number, wall: string, roof: string, rh = h * 0.5): M {
  return m(key)
    .box([w, h, d], [0, h / 2, 0], { color: wall, round: 0.05 })
    .wedge([d + 0.4, rh, w + 0.4], [0, h + rh / 2, 0], { color: roof, rot: [0, 90, 0] });
}

/** A spoon standing on its handle end at (x, z), leaning sideways by r radians. */
function spoon(b: M, x: number, z: number, r: number, color: string): M {
  const p = (l: number): V => [x + Math.sin(r) * l, Math.cos(r) * l, z];
  return b
    .stick(p(0), p(0.105), 0.012, color)
    .ball([0.02, 0.035, 0.008], p(0.025), { color, rot: [0, 0, -r / D] })
    .ball([0.042, 0.058, 0.016], p(0.13), { color, rot: [0, 0, -r / D] });
}

/** A tree stump at (x, z): bark cylinder, cut top with a ring, roots. */
function stump(b: M, x: number, z: number, d: number, h: number): M {
  b.cyl([d, h, d], [x, h / 2, z], { color: 'bark', taper: 0.9 })
    .cyl([d * 0.86, 0.02, d * 0.86], [x, h + 0.005, z], { color: 'lightwood' })
    .torus([d * 0.5, d * 0.5, 0.004], [x, h + 0.016, z], { color: 'wood', rot: [90, 0, 0], tube: 0.1, noInk: true });
  for (const [dx, dz] of around(4, d * 0.5, 0.4)) b.rod([x + dx * 0.6, h * 0.25, z + dz * 0.6], [x + dx * 1.3, 0.02, z + dz * 1.3], d * 0.22, 'bark');
  return b;
}

/** A subway car centred at z0 along z: silver body, blue stripe, windows and doors on both sides, bogies. */
function subcar(b: M, z0: number, len: number, n: number): M {
  const seg = len / n;
  b.box([2.8, 2.7, len], [0, 1.95, z0], { color: 'silver', round: 0.15 })
    .box([2.82, 0.25, len - 0.1], [0, 1.45, z0], { color: 'blue', noInk: true });
  b.pair((s) => {
    for (let i = 0; i < n; i++) {
      const z = z0 - len / 2 + seg * (i + 0.5);
      b.box([0.04, 0.8, seg * 0.42], [s * 1.41, 2.4, z - seg * 0.2], { color: 'glass', noInk: true });
      b.box([0.04, 2.0, seg * 0.3], [s * 1.41, 1.7, z + seg * 0.25], { color: 'gray', noInk: true });
    }
  });
  for (const dz of [-len * 0.32, len * 0.32]) {
    b.box([2.2, 0.6, 2.4], [0, 0.3, z0 + dz], { color: 'darkgray', round: 0.2 });
    b.pair((s) => {
      for (const w of [-0.65, 0.65]) b.cyl([0.62, 0.1, 0.62], [s * 1.12, 0.31, z0 + dz + w], { color: 'iron', rot: [0, 0, 90] });
    });
  }
  return b;
}

/** Point on a circle in the x-y plane (facing you). */
const xy = (cx: number, cy: number, r: number, a: number, z = 0): V => [cx + Math.sin(a) * r, cy + Math.cos(a) * r, z];

export const ENTRIES: CatalogEntry[] = [
  e('sledgehammer', 'workshop', 'hand tools', () =>
    m('sledgehammer')
      .stick([0, 0, 0], [0, 0.86, 0], 0.045, 'wood')
      .cyl([0.055, 0.2, 0.055], [0, 0.1, 0], { color: 'rubber' })
      .box([0.32, 0.12, 0.12], [0, 0.9, 0], { color: 'iron', round: 0.15 })
      .done(),
  ),
  e('sleeping bag', 'sports', 'camping gear', () => {
    const b = m('sleeping bag', { view: 'side' })
      .capsule([0.8, 2.0, 0.26], [0, 0.13, 0], { color: 'navy', rot: [90, 0, 0] })
      .box([0.74, 0.07, 0.45], [0, 0.26, -0.25], { color: 'orange', round: 0.5 })
      .ball([0.5, 0.14, 0.3], [0, 0.29, -0.72], { color: 'white' })
      .stick([0.4, 0.14, -0.4], [0.4, 0.14, 0.85], 0.02, 'gray', { noInk: true });
    return b.done();
  }),
  e('sleeping pill', 'clinic', 'medicine', () =>
    m('sleeping pill')
      .cyl([0.05, 0.07, 0.05], [0, 0.035, 0], { color: '#d98a2b' })
      .cyl([0.054, 0.02, 0.054], [0, 0.08, 0], { color: 'white' })
      .label('Zzz', [0.045, 0.03], [0, 0.035, 0.026], { color: 'white' })
      .capsule([0.016, 0.026, 0.016], [0.042, 0.008, 0.04], { color: 'blue', rot: [0, 0, 90] })
      .capsule([0.016, 0.026, 0.016], [0.062, 0.008, 0.04], { color: 'white', rot: [0, 0, 90] })
      .done(),
  ),
  e('sleeping powder', 'fantasy', 'magic items', () =>
    m('sleeping powder')
      .ball([0.07, 0.065, 0.07], [0, 0.032, 0], { color: 'purple' })
      .cyl([0.03, 0.012, 0.03], [0, 0.068, 0], { color: 'gold' })
      .cyl([0.028, 0.025, 0.028], [0, 0.085, 0], { color: 'purple', taper: 1.8 })
      .ball([0.07, 0.016, 0.05], [0.05, 0.006, 0.04], { color: '#d9c4f5' })
      .star(0.025, [0.035, 0.06, 0.05], { color: 'gold', glow: true })
      .ball(0.008, [0.06, 0.035, 0.05], { color: 'white', glow: true })
      .done(),
  ),
  e('slide (toy)', 'toys', 'playground', () => {
    const a = Math.atan2(1.35, 1.95) / D;
    const b = m('slide (toy)', { view: 'side' })
      .box([0.62, 0.2, 0.42], [0, 1.43, -0.55], { color: 'blue' })
      .box([0.5, 0.05, 2.37], [0, 0.83, 0.62], { color: 'yellow', rot: [a, 0, 0] })
      .box([0.5, 0.05, 0.3], [0, 0.15, 1.72], { color: 'yellow' });
    b.pair((s) => {
      b.stick([s * 0.27, 0, -1.0], [s * 0.27, 1.9, -0.75], 0.05, 'blue');
      b.stick([s * 0.27, 0, -0.35], [s * 0.27, 1.5, -0.35], 0.05, 'blue');
      b.rod([s * 0.26, 1.6, -0.36], [s * 0.26, 0.25, 1.6], 0.05, 'red');
      b.stick([s * 0.22, 0, 1.6], [s * 0.22, 0.16, 1.6], 0.05, 'blue');
    });
    b.each(5, (i) => {
      const y = 0.3 + i * 0.25;
      b.stick([-0.27, y, -1.0 + (y / 1.9) * 0.25], [0.27, y, -1.0 + (y / 1.9) * 0.25], 0.035, 'gray');
    });
    return b.done();
  }),
  e('sliding glass door', 'home', 'doors', () =>
    m('sliding glass door')
      .box([2.4, 2.2, 0.18], [0, 1.1, -0.05], { color: 'white', round: 0.1 })
      .box([1.08, 1.98, 0.04], [-0.58, 1.12, 0.05], { color: 'glass' })
      .box([1.08, 1.98, 0.04], [0.56, 1.12, 0.08], { color: 'glass' })
      .box([0.1, 2.0, 0.06], [0.0, 1.12, 0.09], { color: 'white' })
      .box([0.04, 0.22, 0.04], [0.14, 1.0, 0.12], { color: 'darkgray' })
      .box([2.4, 0.05, 0.25], [0, 0.025, 0.05], { color: 'gray' })
      .done(),
  ),
  e('sling shot', 'armory', 'ranged weapons', () =>
    m('sling shot')
      .stick([0, 0, 0], [0, 0.14, 0], 0.026, 'wood')
      .cyl([0.032, 0.07, 0.032], [0, 0.05, 0], { color: 'leather' })
      .rod([0, 0.13, 0], [0.065, 0.26, 0], 0.022, 'wood')
      .rod([0, 0.13, 0], [-0.065, 0.26, 0], 0.022, 'wood')
      .rod([0.065, 0.25, 0], [0, 0.21, -0.1], 0.008, 'red')
      .rod([-0.065, 0.25, 0], [0, 0.21, -0.1], 0.008, 'red')
      .box([0.03, 0.02, 0.015], [0, 0.21, -0.1], { color: 'leather' })
      .ball(0.018, [0, 0.215, -0.108], { color: 'gray' })
      .done(),
  ),
  e('slippers', 'wardrobe', 'shoes', () => {
    const b = m('slippers');
    b.pair((s) => {
      const x = s * 0.075;
      b.box([0.1, 0.022, 0.27], [x, 0.011, 0], { color: 'cream', round: 0.6 });
      b.ball([0.1, 0.085, 0.17], [x, 0.04, 0.045], { color: 'pink' });
      b.box([0.1, 0.035, 0.1], [x, 0.03, -0.08], { color: 'pink', round: 0.6 });
      b.ball(0.04, [x, 0.08, 0.1], { color: 'white' });
    });
    return b.done();
  }),
  e('slop', 'farm', 'farm things', () =>
    m('slop')
      .cyl([0.24, 0.24, 0.24], [0, 0.12, 0], { color: 'metal', taper: 1.2 })
      .torus([0.3, 0.3, 0.02], [0, 0.24, 0], { color: 'steel', rot: [90, 0, 0], tube: 0.08 })
      .ball([0.27, 0.06, 0.27], [0, 0.245, 0], { color: '#8a7a4a' })
      .ball([0.035, 0.07, 0.02], [0.07, 0.21, 0.125], { color: '#8a7a4a' })
      .ball([0.03, 0.05, 0.02], [-0.09, 0.22, 0.115], { color: '#8a7a4a' })
      .ball(0.035, [0.04, 0.27, 0.03], { color: '#6b5a3a' })
      .ball(0.03, [-0.05, 0.265, -0.02], { color: 'orange' })
      .torus([0.3, 0.3, 0.015], [0, 0.25, 0], { color: 'steel', tube: 0.08 })
      .done(),
  ),
  e('slot machine', 'toys', 'casino games', () => {
    const b = m('slot machine')
      .box([0.7, 1.2, 0.55], [0, 0.6, 0], { color: 'red', round: 0.1 })
      .box([0.7, 0.36, 0.5], [0, 1.38, -0.02], { color: 'darkred', round: 0.15 })
      .label('JACKPOT', [0.6, 0.18], [0, 1.38, 0.24], { color: 'gold' })
      .ball([0.2, 0.16, 0.2], [0, 1.58, 0], { color: 'yellow', glow: true })
      .box([0.58, 0.34, 0.04], [0, 1.0, 0.28], { color: 'black' })
      .ball(0.035, [-0.2, 1.0, 0.315], { color: 'red' })
      .ball(0.035, [-0.16, 1.01, 0.315], { color: 'red' })
      .star(0.08, [0, 1.0, 0.32], { color: 'gold' })
      .label('7', [0.1, 0.12], [0.18, 1.0, 0.315], { color: 'white' })
      .box([0.5, 0.08, 0.15], [0, 0.45, 0.33], { color: 'silver' })
      .cyl([0.1, 0.1, 0.1], [0.38, 0.95, 0], { color: 'steel', rot: [0, 0, 90] })
      .stick([0.42, 0.95, 0], [0.43, 1.45, 0], 0.035, 'steel')
      .ball(0.09, [0.43, 1.48, 0], { color: 'red' });
    b.each(3, (i) => b.box([0.15, 0.27, 0.02], [-0.18 + i * 0.18, 1.0, 0.3], { color: 'white' }));
    b.each(3, (i) => b.box([0.1, 0.05, 0.05], [-0.2 + i * 0.2, 0.72, 0.29], { color: ['yellow', 'lime', 'cyan'][i], glow: true }));
    return b.done();
  }),
  e('slotted spoon', 'kitchen', 'utensils', () => {
    const b = m('slotted spoon')
      .stick([0, 0, 0], [0, 0.17, 0], 0.022, 'black')
      .stick([0, 0.16, 0], [0, 0.21, 0], 0.012, 'steel')
      .ball([0.085, 0.1, 0.022], [0, 0.25, 0], { color: 'steel' });
    b.each(3, (i) => b.box([0.008, 0.055, 0.01], [-0.022 + i * 0.022, 0.25, 0.009], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('slush', 'nature', 'snow and ice', () =>
    m('slush')
      .cyl([0.5, 0.02, 0.36], [0, 0.01, 0], { color: '#8aa0b0' })
      .ball([0.22, 0.1, 0.18], [-0.08, 0.045, 0], { color: '#c9cfcf' })
      .ball([0.14, 0.08, 0.12], [0.12, 0.035, 0.06], { color: '#b8bfc0' })
      .ball([0.12, 0.07, 0.1], [0.04, 0.03, -0.1], { color: '#d6dcdc' })
      .ball(0.015, [-0.06, 0.09, 0.04], { color: '#6b5a3a', noInk: true })
      .ball(0.012, [0.12, 0.07, 0.09], { color: '#6b5a3a', noInk: true })
      .done(),
  ),
  e('slushy', 'food', 'drinks', () =>
    m('slushy')
      .cyl([0.064, 0.05, 0.064], [0, 0.025, 0], { color: 'blue', taper: 1.12 })
      .cyl([0.072, 0.065, 0.072], [0, 0.082, 0], { color: 'red', taper: 1.12 })
      .cyl([0.074, 0.03, 0.074], [0, 0.06, 0], { color: 'white', taper: 1.05 })
      .ball([0.082, 0.06, 0.082], [0, 0.115, 0], { color: '#ff6a7a' })
      .stick([0.01, 0.08, 0], [0.03, 0.19, 0.0], 0.012, 'yellow')
      .done(),
  ),
  e('small bullet', 'armory', 'ammunition', () => {
    const b = m('small bullet');
    b.each(2, (i) => {
      const x = -0.012 + i * 0.024;
      b.cyl([0.012, 0.03, 0.012], [x, 0.015, 0], { color: 'brass' })
        .cyl([0.0125, 0.003, 0.0125], [x, 0.0015, 0], { color: 'brass' })
        .cyl([0.011, 0.008, 0.011], [x, 0.034, 0], { color: 'copper' })
        .ball([0.011, 0.024, 0.011], [x, 0.04, 0], { color: 'copper' });
    });
    return b.done();
  }),
  e('small rocket', 'toys', 'flying toys', () => {
    const b = m('small rocket')
      .cyl([0.04, 0.2, 0.04], [0, 0.12, 0], { color: 'white' })
      .cone([0.04, 0.07, 0.04], [0, 0.255, 0], { color: 'red' })
      .cyl([0.041, 0.02, 0.041], [0, 0.17, 0], { color: 'red' })
      .cyl([0.014, 0.004, 0.014], [0, 0.2, 0.02], { color: 'skyblue', rot: [90, 0, 0] });
    for (const [x, z] of around(3, 0.03, Math.PI / 2)) b.box([0.04, 0.06, 0.004], [x, 0.03, z], { color: 'red', rot: [0, -Math.atan2(z, x) / D, 0] });
    return b.done();
  }),
  e('smart phone', 'tech', 'phones', () => {
    const b = m('smart phone')
      .box([0.075, 0.155, 0.013], [0, 0.0775, 0], { color: 'black', round: 0.4 })
      .box([0.066, 0.135, 0.002], [0, 0.0775, 0.007], { color: '#3a7bd5', glow: true })
      .ball(0.006, [0, 0.148, 0.005], { color: 'darkgray' });
    b.each(6, (i) => b.box([0.014, 0.014, 0.002], [-0.018 + (i % 3) * 0.018, 0.12 - Math.floor(i / 3) * 0.022, 0.0085], { color: ['red', 'lime', 'yellow', 'orange', 'pink', 'white'][i], noInk: true }));
    return b.done();
  }),
  e('smart watch', 'tech', 'gadgets', () =>
    m('smart watch')
      .torus([0.075, 0.09, 0.024], [0, 0.045, 0], { color: 'black', rot: [0, 90, 0], tube: 0.18 })
      .box([0.042, 0.05, 0.014], [0, 0.045, 0.04], { color: 'darkgray', round: 0.4 })
      .box([0.034, 0.042, 0.002], [0, 0.045, 0.048], { color: 'teal', glow: true })
      .cyl([0.008, 0.006, 0.008], [0.024, 0.05, 0.04], { color: 'silver', rot: [0, 0, 90] })
      .done(),
  ),
  e('smoke bomb', 'toys', 'fireworks', () =>
    m('smoke bomb')
      .cyl([0.045, 0.06, 0.045], [0, 0.03, 0], { color: 'darkgreen' })
      .cyl([0.047, 0.01, 0.047], [0, 0.064, 0], { color: 'gray' })
      .torus([0.025, 0.025, 0.004], [0.015, 0.075, 0], { color: 'silver', tube: 0.2 })
      .ball(0.05, [0, 0.1, 0], { color: '#c8cfcf' })
      .ball(0.06, [0.03, 0.14, 0.01], { color: '#dfe3e3' })
      .ball(0.07, [-0.02, 0.19, 0], { color: '#eef0f0' })
      .done(),
  ),
  e('smoke detector', 'home', 'safety', () =>
    m('smoke detector')
      .cyl([0.13, 0.035, 0.13], [0, 0.065, 0], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.1, 0.02, 0.1], [0, 0.065, 0.025], { color: 'white', rot: [90, 0, 0], taper: 0.85 })
      .torus([0.112, 0.112, 0.005], [0, 0.065, 0.019], { color: 'lightgray', tube: 0.08, noInk: true })
      .ball(0.01, [0.032, 0.09, 0.034], { color: 'red', glow: true })
      .cyl([0.022, 0.008, 0.022], [0, 0.065, 0.038], { color: 'lightgray', rot: [90, 0, 0] })
      .done(),
  ),
  e('smore', 'food', 'desserts', () =>
    m('smore')
      .box([0.07, 0.012, 0.07], [0, 0.006, 0], { color: '#d4a05a', round: 0.2 })
      .box([0.055, 0.008, 0.055], [0, 0.016, 0], { color: 'chocolate', round: 0.2 })
      .cyl([0.06, 0.03, 0.06], [0, 0.035, 0], { color: '#f6ead0' })
      .ball([0.02, 0.025, 0.012], [0.028, 0.018, 0.022], { color: '#f6ead0' })
      .box([0.07, 0.012, 0.07], [0, 0.056, 0], { color: '#d4a05a', round: 0.2, rot: [0, 15, 4] })
      .done(),
  ),
  e('snorkeler (mask)', 'sports', 'swim gear', () =>
    m('snorkeler (mask)')
      .box([0.17, 0.08, 0.04], [0, 0.08, 0], { color: 'black', round: 0.5 })
      .box([0.15, 0.064, 0.02], [0, 0.082, 0.02], { color: 'glass', round: 0.4 })
      .ball([0.05, 0.05, 0.04], [0, 0.035, 0.012], { color: 'black' })
      .torus([0.19, 0.2, 0.02], [0, 0.08, -0.08], { color: 'black', rot: [90, 0, 0], tube: 0.08 })
      .stick([0.11, 0.02, 0.0], [0.11, 0.27, -0.02], 0.024, 'orange')
      .rod([0.11, 0.02, 0.0], [0.06, 0.015, 0.05], 0.02, 'orange')
      .cyl([0.032, 0.03, 0.032], [0.11, 0.28, -0.02], { color: 'yellow' })
      .done(),
  ),
  e('snorkeling fins', 'sports', 'swim gear', () => {
    const b = m('snorkeling fins');
    b.pair((s) => {
      const x = s * 0.13;
      const r = -s * 12, t = (y: number): V => [x - Math.sin(r * D) * y, Math.cos(r * D) * y, 0];
      b.ball([0.11, 0.2, 0.11], t(0.1), { color: 'black', rot: [0, 0, r] })
        .cyl([0.15, 0.48, 0.024], t(0.43), { color: 'yellow', taper: 1.7, rot: [0, 0, r] })
        .stick(t(0.2), t(0.66), 0.02, 'gold', { noInk: true });
    });
    return b.done();
  }),
  e('snow', 'nature', 'snow and ice', () =>
    m('snow')
      .ball([0.55, 0.4, 0.5], [0, 0.17, 0], { color: 'snow' })
      .ball([0.32, 0.22, 0.3], [0.18, 0.1, 0.12], { color: 'snow' })
      .ball([0.34, 0.2, 0.3], [-0.2, 0.09, 0.1], { color: '#e8f0f6' })
      .ball(0.03, [0.1, 0.32, 0.1], { color: 'white' })
      .ball(0.025, [-0.15, 0.28, 0.0], { color: 'white' })
      .ball(0.025, [0.2, 0.26, -0.1], { color: 'white' })
      .done(),
  ),
  e('snow blower', 'garden', 'garden machines', () => {
    const b = m('snow blower', { view: 'side' })
      .box([0.62, 0.45, 0.4], [0, 0.3, 0.35], { color: 'red', round: 0.2 })
      .cyl([0.42, 0.58, 0.42], [0, 0.28, 0.5], { color: 'darkgray', rot: [0, 0, 90] })
      .torus([0.36, 0.36, 0.06], [0, 0.28, 0.52], { color: 'yellow', rot: [0, 90, 0], tube: 0.25 })
      .stick([0.12, 0.5, 0.3], [0.12, 0.85, 0.42], 0.11, 'red')
      .box([0.15, 0.06, 0.18], [0.12, 0.88, 0.48], { color: 'red', rot: [30, 0, 0] })
      .box([0.4, 0.3, 0.35], [0, 0.48, 0.0], { color: 'darkgray', round: 0.2 })
      .cyl([0.06, 0.04, 0.06], [-0.08, 0.65, 0.0], { color: 'black' })
      .stick([-0.22, 1.1, -0.6], [0.22, 1.1, -0.6], 0.035, 'black');
    b.pair((s) => {
      b.torus([0.36, 0.36, 0.12], [s * 0.3, 0.18, -0.1], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 });
      b.rod([s * 0.2, 0.5, -0.1], [s * 0.22, 1.1, -0.6], 0.03, 'black');
    });
    return b.done();
  }),
  e('snow globe', 'home', 'keepsakes', () =>
    m('snow globe')
      .cyl([0.11, 0.045, 0.11], [0, 0.0225, 0], { color: 'darkwood', taper: 0.85 })
      .label('NOEL', [0.05, 0.018], [0, 0.022, 0.05], { color: 'gold' })
      .ball(0.12, [0, 0.1, 0], { color: 'glass' })
      .cone([0.055, 0.07, 0.04], [0, 0.1, 0.045], { color: 'darkgreen' })
      .ball([0.09, 0.02, 0.06], [0, 0.055, 0.02], { color: 'snow' })
      .ball(0.008, [0.025, 0.15, 0.045], { color: 'white', noInk: true })
      .ball(0.008, [-0.03, 0.13, 0.05], { color: 'white', noInk: true })
      .done(),
  ),
  e('snow pants', 'wardrobe', 'snow gear', () => {
    const b = trousers('snow pants', '#d64545', 0.92, 'black')
      .box([0.3, 0.24, 0.06], [0, 1.0, 0.05], { color: '#d64545', round: 0.3 });
    b.pair((s) => {
      b.box([0.05, 0.22, 0.04], [s * 0.12, 1.2, 0.04], { color: 'black' });
      b.box([0.18, 0.04, 0.17], [s * 0.11, 0.06, 0], { color: 'silver', noInk: true });
    });
    return b.done();
  }),
  e('snow sculpture', 'nature', 'snow and ice', () => {
    const b = m('snow sculpture')
      .box([1.4, 0.5, 1.0], [0, 0.25, 0], { color: 'snow', round: 0.15 })
      .ball([0.8, 0.9, 0.7], [0, 0.9, 0], { color: '#e6f2f8' })
      .ball(0.5, [0, 1.55, 0.08], { color: 'snow' })
      .ball([0.2, 0.15, 0.2], [0, 1.5, 0.33], { color: '#e6f2f8' })
      .ball(0.05, [0, 1.53, 0.43], { color: 'skyblue' });
    b.pair((s) => {
      b.ball(0.16, [s * 0.18, 1.78, 0.04], { color: 'snow' });
      b.ball([0.2, 0.32, 0.2], [s * 0.3, 0.95, 0.25], { color: 'snow' });
      b.ball([0.24, 0.18, 0.3], [s * 0.22, 0.58, 0.35], { color: '#e6f2f8' });
    });
    return b.done();
  }),
  e('snowball', 'nature', 'snow and ice', () =>
    m('snowball')
      .ball(0.09, [0, 0.045, 0], { color: 'snow' })
      .ball(0.04, [0.03, 0.07, 0.02], { color: 'snow' })
      .ball(0.035, [-0.03, 0.06, 0.025], { color: '#e8f0f6' })
      .done(),
  ),
  e('snowboard', 'sports', 'winter sports', () =>
    m('snowboard')
      .capsule([0.28, 1.5, 0.03], [0, 0.8, 0], { color: 'blue' })
      .box([0.26, 0.2, 0.004], [0, 1.0, 0.016], { color: 'orange', noInk: true, round: 0.5 })
      .box([0.2, 0.1, 0.06], [0, 0.6, 0.04], { color: 'black' })
      .box([0.2, 0.1, 0.06], [0, 1.2, 0.04], { color: 'black' })
      .ball([0.55, 0.22, 0.4], [0, 0.08, 0], { color: 'snow' })
      .done(),
  ),
  e('snowflake', 'nature', 'snow and ice', () => {
    const c: V = [0, 0.06, 0];
    const b = m('snowflake').cyl([0.018, 0.008, 0.018], c, { color: '#cfeaff', rot: [90, 0, 0], segs: 6 });
    b.each(6, (i) => {
      const a = (i * Math.PI) / 3;
      b.rod(c, xy(0, 0.06, 0.05, a), 0.008, '#cfeaff');
      const q = xy(0, 0.06, 0.032, a);
      for (const k of [-1, 1]) b.rod(q, xy(q[0], q[1], 0.018, a + k * 0.8), 0.006, '#cfeaff');
    });
    return b.done();
  }),
  e('snowmobile', 'garage', 'snow vehicles', () => {
    const b = m('snowmobile', { view: 'side' })
      .ball([0.72, 0.46, 0.85], [0, 0.45, 0.65], { color: 'red' })
      .box([0.62, 0.36, 1.2], [0, 0.42, -0.45], { color: 'darkred', round: 0.3 })
      .box([0.46, 0.3, 1.3], [0, 0.17, -0.55], { color: 'rubber', round: 0.6 })
      .box([0.48, 0.15, 0.9], [0, 0.66, -0.45], { color: 'black', round: 0.5 })
      .box([0.5, 0.26, 0.04], [0, 0.8, 0.28], { color: 'glass', rot: [-25, 0, 0] })
      .stick([-0.32, 0.78, 0.12], [0.32, 0.78, 0.12], 0.035, 'black')
      .ball([0.2, 0.1, 0.06], [0, 0.55, 1.07], { color: 'yellow', glow: true });
    b.pair((s) => {
      b.box([0.12, 0.03, 0.95], [s * 0.36, 0.015, 0.55], { color: 'black' });
      b.box([0.12, 0.03, 0.2], [s * 0.36, 0.07, 1.08], { color: 'black', rot: [-40, 0, 0] });
      b.stick([s * 0.36, 0.03, 0.6], [s * 0.3, 0.4, 0.6], 0.05, 'darkgray');
    });
    return b.done();
  }),
  e('snowplow', 'garage', 'trucks', () => {
    const b = m('snowplow', { view: 'side' })
      .box([2.2, 0.5, 6.8], [0, 1.0, 0.4], { color: 'darkgray' })
      .box([2.3, 1.5, 1.8], [0, 2.0, 2.2], { color: 'orange', round: 0.15 })
      .box([2.0, 0.65, 0.05], [0, 2.4, 3.12], { color: 'glass' })
      .box([2.2, 0.95, 1.5], [0, 1.6, 3.85], { color: 'orange', round: 0.15 })
      .box([2.3, 1.4, 3.4], [0, 1.95, -1.2], { color: '#c9701f', round: 0.1 })
      .ball(0.3, [0, 2.85, 2.2], { color: 'orange', glow: true })
      .box([3.2, 1.0, 0.15], [0, 0.6, 5.2], { color: 'yellow', rot: [-12, 22, 0] })
      .stick([0, 0.9, 4.5], [0, 0.7, 5.1], 0.2, 'darkgray');
    wheels(b, 1.05, [3.6, -0.5, -2.1], 1.1, 0.4);
    return b.done();
  }),
  e('soap', 'home', 'bathroom', () =>
    m('soap')
      .box([0.09, 0.035, 0.06], [0, 0.0175, 0], { color: 'pink', round: 0.7 })
      .ball(0.03, [0.03, 0.05, 0.01], { color: 'ice' })
      .ball(0.02, [-0.02, 0.07, 0.0], { color: 'ice' })
      .ball(0.015, [0.0, 0.092, 0.02], { color: 'ice' })
      .done(),
  ),
  e('soap dish', 'home', 'bathroom', () =>
    m('soap dish')
      .cyl([0.12, 0.025, 0.09], [0, 0.0125, 0], { color: 'white', taper: 1.15 })
      .box([0.08, 0.03, 0.055], [0, 0.038, 0], { color: 'lime', round: 0.7 })
      .done(),
  ),
  e('soccer ball', 'sports', 'balls', () => {
    const r = 0.11, c: V = [0, r, 0], p = 1.618;
    const b = m('soccer ball').ball(r * 2, c, { color: 'white' });
    const dirs: V[] = [];
    for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) dirs.push([0, s1, s2 * p], [s1, s2 * p, 0], [s2 * p, 0, s1]);
    for (const d of dirs) {
      const l = Math.hypot(...d), u = d.map((v) => v / l);
      b.stick([c[0] + u[0] * r * 0.9, c[1] + u[1] * r * 0.9, c[2] + u[2] * r * 0.9], [c[0] + u[0] * r * 1.01, c[1] + u[1] * r * 1.01, c[2] + u[2] * r * 1.01], 0.07, 'black', { segs: 5, noInk: true });
    }
    return b.done();
  }),
  e('socks', 'wardrobe', 'socks', () => {
    const b = m('socks');
    b.pair((s) => {
      const x = s * 0.07;
      b.cyl([0.08, 0.22, 0.07], [x, 0.15, 0], { color: 'white' })
        .capsule([0.075, 0.18, 0.06], [x, 0.035, 0.06], { color: 'white', rot: [90, 0, 0] })
        .ball([0.07, 0.07, 0.06], [x, 0.04, -0.01], { color: 'red' })
        .ball([0.07, 0.06, 0.06], [x, 0.035, 0.13], { color: 'red' })
        .cyl([0.083, 0.02, 0.073], [x, 0.22, 0], { color: 'red' })
        .cyl([0.083, 0.02, 0.073], [x, 0.25, 0], { color: 'blue' });
    });
    return b.done();
  }),
  e('soda', 'food', 'drinks', () => bottle(m('soda'), 0, 0, 0.32, 0.08, '#4a2a1a', 'red', 'red').label('COLA', [0.06, 0.04], [0, 0.11, 0.042], { color: 'red' }).done()),
  e('soda machine', 'tech', 'machines', () => {
    const b = m('soda machine')
      .box([0.9, 1.8, 0.7], [0, 0.9, 0], { color: 'red', round: 0.08 })
      .box([0.56, 1.1, 0.03], [-0.1, 1.15, 0.36], { color: '#f05a4a', glow: true })
      .label('SODA', [0.5, 0.2], [-0.1, 1.55, 0.385], { color: 'white' })
      .cyl([0.14, 0.45, 0.04], [-0.1, 1.05, 0.38], { color: 'white', noInk: true })
      .cyl([0.06, 0.12, 0.04], [-0.1, 1.33, 0.38], { color: 'white', noInk: true, taper: 0.6 })
      .box([0.5, 0.2, 0.05], [-0.1, 0.35, 0.36], { color: 'black' })
      .box([0.03, 0.1, 0.03], [0.32, 0.85, 0.36], { color: 'black' });
    b.each(5, (i) => b.box([0.12, 0.07, 0.04], [0.32, 1.5 - i * 0.1, 0.36], { color: ['white', 'yellow', 'lime', 'orange', 'skyblue'][i] }));
    return b.done();
  }),
  e('sofa', 'home', 'seating', () => {
    const b = m('sofa')
      .box([2.0, 0.4, 0.9], [0, 0.3, 0], { color: 'teal', round: 0.2 })
      .box([1.8, 0.4, 0.25], [0, 0.65, -0.33], { color: 'teal', round: 0.4 });
    b.pair((s) => {
      b.box([0.8, 0.15, 0.68], [s * 0.42, 0.55, 0.08], { color: '#4fbab3', round: 0.5 });
      b.box([0.8, 0.36, 0.14], [s * 0.42, 0.7, -0.18], { color: '#4fbab3', round: 0.5 });
      b.box([0.22, 0.6, 0.9], [s * 0.99, 0.39, 0], { color: 'teal', round: 0.4 });
      for (const z of [0.38, -0.38]) b.cyl([0.06, 0.1, 0.06], [s * 0.9, 0.05, z], { color: 'darkwood' });
    });
    return b.done();
  }),
  e('solar panel', 'tech', 'power', () => {
    const t = 35 * D, cy = 1.0;
    const P = (x: number, zl: number, up = 0.025): V => [x, cy + up * Math.cos(t) - zl * Math.sin(t), up * Math.sin(t) + zl * Math.cos(t)];
    const b = m('solar panel')
      .box([1.64, 0.04, 1.04], [0, cy, 0], { color: 'silver', rot: [35, 0, 0] })
      .box([1.58, 0.02, 0.98], P(0, 0, 0.015), { color: 'navy', rot: [35, 0, 0] });
    b.each(3, (i) => b.box([0.012, 0.01, 0.98], P(-0.4 + i * 0.4, 0), { color: '#7da3d8', rot: [35, 0, 0], noInk: true }));
    b.each(2, (i) => b.box([1.58, 0.01, 0.012], P(0, -0.17 + i * 0.34), { color: '#7da3d8', rot: [35, 0, 0], noInk: true }));
    b.pair((s) => {
      b.stick([s * 0.6, 0, 0.35], [s * 0.6, 0.74, 0.35], 0.05, 'steel');
      b.box([0.16, 0.12, 0.9], [s * 0.6, 0.06, 0], { color: 'stone' });
      b.stick([s * 0.6, 0, -0.35], [s * 0.6, 1.24, -0.35], 0.05, 'steel');
    });
    return b.done();
  }),
  e('sombrero', 'wardrobe', 'hats', () => {
    const b = m('sombrero')
      .cyl([0.7, 0.03, 0.7], [0, 0.015, 0], { color: '#e8c77a' })
      .torus([0.72, 0.72, 0.05], [0, 0.035, 0], { color: '#e8c77a', rot: [90, 0, 0], tube: 0.07 })
      .cyl([0.24, 0.22, 0.24], [0, 0.14, 0], { color: '#e8c77a', taper: 0.55 })
      .ball([0.135, 0.06, 0.135], [0, 0.25, 0], { color: '#e8c77a' })
      .cyl([0.245, 0.045, 0.245], [0, 0.06, 0], { color: 'red', taper: 0.92 });
    for (const [x, z] of around(8, 0.27)) b.ball([0.04, 0.012, 0.04], [x, 0.034, z], { color: 'green', noInk: true });
    return b.done();
  }),
  e('soup', 'food', 'soups', () =>
    bowl(m('soup'), 0.16, 0.08, 'white', '#e0603b')
      .torus([0.05, 0.05, 0.004], [0, 0.082, 0], { color: 'cream', rot: [90, 0, 0], tube: 0.15, noInk: true })
      .ball([0.02, 0.006, 0.02], [0.03, 0.083, 0.02], { color: 'green', noInk: true })
      .rod([-0.03, 0.07, 0.01], [-0.09, 0.15, 0.02], 0.012, 'silver')
      .done(),
  ),
  e('sour cream', 'food', 'dairy', () =>
    m('sour cream')
      .cyl([0.1, 0.07, 0.1], [0, 0.035, 0], { color: 'white', taper: 1.15 })
      .cyl([0.107, 0.035, 0.107], [0, 0.035, 0], { color: 'green', taper: 1.07 })
      .cyl([0.11, 0.008, 0.11], [0, 0.072, 0], { color: 'milk' })
      .ball([0.06, 0.035, 0.06], [0, 0.08, 0], { color: 'milk' })
      .cone([0.025, 0.025, 0.025], [0.005, 0.1, 0], { color: 'milk' })
      .cyl([0.12, 0.01, 0.12], [0, 0.065, -0.075], { color: 'green', rot: [70, 0, 0] })
      .done(),
  ),
  e('sour milk', 'food', 'dairy', () => {
    const b = m('sour milk')
      .box([0.07, 0.15, 0.07], [0, 0.075, 0], { color: 'white', round: 0.1 })
      .wedge([0.07, 0.035, 0.07], [0, 0.1675, 0], { color: 'white' })
      .box([0.072, 0.06, 0.072], [0, 0.07, 0], { color: '#9bbf5a', round: 0.1 })
      .label('MILK', [0.055, 0.025], [0, 0.07, 0.037], { color: 'white' });
    b.each(3, (i) => {
      const x = -0.03 + i * 0.03;
      b.rod([x, 0.2, 0], [x + 0.015, 0.235, 0], 0.008, '#8fbf3a');
      b.rod([x + 0.015, 0.235, 0], [x, 0.27, 0], 0.008, '#8fbf3a');
    });
    return b.done();
  }),
  e('souvenir', 'home', 'keepsakes', () => {
    const b = m('souvenir')
      .box([0.08, 0.016, 0.08], [0, 0.008, 0], { color: 'darkwood' })
      .label('PARIS', [0.06, 0.012], [0, 0.008, 0.041], { color: 'gold' })
      .box([0.046, 0.005, 0.046], [0, 0.05, 0], { color: 'bronze' })
      .box([0.026, 0.005, 0.026], [0, 0.09, 0], { color: 'bronze' })
      .stick([0, 0.09, 0], [0, 0.15, 0], 0.006, 'bronze');
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.rod([x * 0.03, 0.016, z * 0.03], [0, 0.115, 0], 0.008, 'bronze');
    return b.done();
  }),
  e('souvenir shop', 'places', 'shops', () => {
    const b = shop('souvenir shop', { wall: 'cream', sign: 'SOUVENIRS', signColor: 'yellow', awning: 'red', trim: 'teal' })
      .heart(0.9, [0, 4.0, 0], { color: 'red' })
      .stick([1.6, 0, 2.2], [1.6, 1.4, 2.2], 0.05, 'steel');
    b.each(4, (i) => b.box([0.25, 0.18, 0.02], [1.6 + (i % 2 ? 0.14 : -0.14), 0.9 + Math.floor(i / 2) * 0.25, 2.22], { color: ['skyblue', 'yellow', 'pink', 'lime'][i] }));
    return b.done();
  }),
  e('soy sauce', 'food', 'sauces', () =>
    m('soy sauce')
      .cyl([0.07, 0.13, 0.07], [0, 0.065, 0], { color: '#3a1f12', taper: 0.85 })
      .cyl([0.06, 0.03, 0.06], [0, 0.145, 0], { color: '#3a1f12', taper: 0.5 })
      .cyl([0.04, 0.04, 0.04], [0, 0.175, 0], { color: 'red' })
      .cone([0.026, 0.03, 0.026], [0, 0.208, 0], { color: 'red' })
      .rod([0, 0.2, 0], [0.026, 0.205, 0], 0.01, 'red')
      .label('SOY', [0.05, 0.04], [0, 0.07, 0.034], { color: 'white' })
      .done(),
  ),
  e('spa (place)', 'places', 'wellness', () =>
    shop('spa (place)', { wall: '#e6f2ee', trim: '#7fb8a8', sign: 'SPA', signColor: 'white', door: 'lightwood' })
      .cyl([1.6, 0.5, 1.6], [-3.1, 0.25, 0.8], { color: 'lightwood' })
      .cyl([1.4, 0.04, 1.4], [-3.1, 0.5, 0.8], { color: 'water' })
      .ball(0.4, [-3.2, 0.85, 0.8], { color: 'white' })
      .ball(0.3, [-2.9, 1.15, 0.7], { color: 'white' })
      .ball([0.5, 0.35, 0.5], [0, 3.55, 0], { color: 'pink' })
      .ball([0.25, 0.4, 0.25], [0, 3.75, 0], { color: 'magenta' })
      .done(),
  ),
  e('space station', 'garage', 'spacecraft', () => {
    const y = 3;
    const b = m('space station')
      .box([10, 0.3, 0.3], [0, y, 0], { color: 'silver' })
      .cyl([1.0, 4.4, 1.0], [0, y, 0], { color: 'white', rot: [90, 0, 0] })
      .cyl([1.2, 1.2, 1.2], [0, y + 0.7, 0.8], { color: 'white' })
      .cyl([0.9, 2.2, 0.9], [-1.4, y, 1.2], { color: 'lightgray', rot: [0, 0, 90] })
      .box([1.6, 0.06, 0.7], [0.9, y - 0.8, 0], { color: 'white' });
    b.pair((s) => {
      for (const x of [3.7, 5.0]) {
        b.box([1.0, 4.4, 0.06], [s * x, y, 0], { color: 'navy' });
        b.box([1.02, 0.06, 0.08], [s * x, y, 0], { color: 'gold', noInk: true });
      }
    });
    return b.done();
  }),
  e('space suit', 'wardrobe', 'costumes', () =>
    who('space suit', { top: 'white', bottom: 'white', shoes: 'white', long: true, style: 'none', acc: [hat('astronaut'), body('jetpack', 'white'), wear('badge', 'blue'), wear('belt', 'gray')] }),
  ),
  e('spaceship', 'garage', 'spacecraft', () => {
    const b = m('spaceship', { view: 'side' })
      .capsule([2.0, 10, 1.7], [0, 2.2, 0], { color: 'silver', rot: [90, 0, 0] })
      .ball([1.2, 0.9, 2.2], [0, 2.95, 2.8], { color: 'glass' })
      .box([0.2, 1.8, 2.0], [0, 3.6, -3.7], { color: 'blue', rot: [-30, 0, 0] })
      .box([2.06, 0.25, 6], [0, 2.2, -0.5], { color: 'blue', noInk: true });
    b.pair((s) => {
      b.box([4.0, 0.2, 2.4], [s * 2.6, 1.9, -1.5], { color: 'silver', rot: [0, s * 25, 0] });
      b.box([0.6, 0.3, 1.2], [s * 4.3, 1.9, -2.6], { color: 'red', rot: [0, s * 25, 0] });
      b.cyl([1.0, 1.6, 1.0], [s * 1.0, 1.9, -4.5], { color: 'darkgray', rot: [90, 0, 0] });
      b.cyl([0.8, 0.1, 0.8], [s * 1.0, 1.9, -5.32], { color: 'cyan', rot: [90, 0, 0], glow: true });
      b.stick([s * 0.9, 0, 2.0], [s * 0.6, 1.6, 2.0], 0.15, 'darkgray');
      b.stick([s * 1.4, 0, -2.0], [s * 0.9, 1.6, -2.0], 0.15, 'darkgray');
    });
    return b.done();
  }),
  e('spade', 'garden', 'garden tools', () =>
    m('spade')
      .box([0.2, 0.28, 0.025], [0, 0.14, 0], { color: 'steel', round: 0.2 })
      .box([0.22, 0.02, 0.05], [0, 0.285, 0], { color: 'steel' })
      .cyl([0.05, 0.12, 0.04], [0, 0.34, 0], { color: 'steel', taper: 0.8 })
      .stick([0, 0.38, 0], [0, 1.0, 0], 0.04, 'wood')
      .torus([0.16, 0.14, 0.035], [0, 1.06, 0], { color: 'black', tube: 0.22 })
      .ball([0.32, 0.14, 0.26], [0, 0.03, 0], { color: 'dirt' })
      .done(),
  ),
  e('spare ribs', 'food', 'meat', () => {
    const b = m('spare ribs')
      .box([0.3, 0.02, 0.2], [0, 0.01, 0], { color: 'lightwood' })
      .box([0.24, 0.045, 0.13], [0, 0.042, 0], { color: '#8a3a1e', round: 0.6 });
    b.each(5, (i) => {
      const x = -0.09 + i * 0.045;
      b.stick([x, 0.04, 0.05], [x, 0.04, 0.095], 0.014, 'cream');
      b.box([0.006, 0.004, 0.12], [x + 0.022, 0.065, 0], { color: '#4a1a0a', noInk: true });
    });
    return b.done();
  }),
  e('spark plugs', 'garage', 'car parts', () => {
    const b = m('spark plugs');
    b.pair((s) => {
      const x = s * 0.022;
      b.cyl([0.014, 0.02, 0.014], [x, 0.012, 0], { color: 'steel' })
        .cyl([0.024, 0.012, 0.024], [x, 0.028, 0], { color: 'silver', segs: 6 })
        .cyl([0.017, 0.045, 0.017], [x, 0.056, 0], { color: 'white', taper: 0.75 })
        .cyl([0.008, 0.016, 0.008], [x, 0.086, 0], { color: 'silver' })
        .stick([x, 0.002, 0], [x, -0.0, 0.006], 0.003, 'steel');
    });
    return b.done();
  }),
  e('sparklers', 'toys', 'fireworks', () => {
    const b = m('sparklers').cyl([0.08, 0.05, 0.08], [0, 0.025, 0], { color: 'sand' });
    b.each(3, (i) => {
      const a = (i - 1) * 0.3, tip = (l: number): V => [Math.sin(a) * l, 0.04 + Math.cos(a) * l, (i - 1) * 0.01];
      b.stick(tip(0), tip(0.28), 0.005, 'steel');
      b.stick(tip(0.12), tip(0.26), 0.012, 'gray');
      if (i !== 1) b.star(0.05, tip(0.27), { color: 'flame', glow: true });
      else b.star(0.07, tip(0.27), { color: 'yellow', glow: true });
    });
    return b.done();
  }),
  e('spatula', 'kitchen', 'utensils', () => {
    const b = m('spatula')
      .stick([0, 0, 0], [0, 0.15, 0], 0.026, 'black')
      .stick([0, 0.14, 0], [0, 0.205, 0], 0.012, 'steel')
      .box([0.08, 0.1, 0.008], [0, 0.25, 0], { color: 'steel', round: 0.3 });
    b.each(3, (i) => b.box([0.008, 0.06, 0.01], [-0.02 + i * 0.02, 0.255, 0.002], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('speaker', 'music', 'audio', () =>
    m('speaker')
      .box([0.2, 0.32, 0.2], [0, 0.16, 0], { color: 'black', round: 0.1 })
      .cyl([0.15, 0.03, 0.15], [0, 0.11, 0.1], { color: 'darkgray', rot: [90, 0, 0] })
      .torus([0.15, 0.15, 0.02], [0, 0.11, 0.112], { color: 'gray', tube: 0.12 })
      .ball([0.06, 0.06, 0.03], [0, 0.11, 0.112], { color: 'gray' })
      .cyl([0.06, 0.02, 0.06], [0, 0.25, 0.1], { color: 'darkgray', rot: [90, 0, 0] })
      .ball([0.03, 0.03, 0.02], [0, 0.25, 0.11], { color: 'silver' })
      .done(),
  ),
  e('spear', 'armory', 'polearms', () =>
    m('spear')
      .box([0.3, 0.14, 0.3], [0, 0.07, 0], { color: 'stone', round: 0.2 })
      .stick([0, 0, 0], [0, 1.56, 0], 0.035, 'wood')
      .cyl([0.04, 0.08, 0.04], [0, 1.56, 0], { color: 'iron', taper: 0.8 })
      .cyl([0.042, 0.06, 0.042], [0, 1.45, 0], { color: 'leather' })
      .ball([0.11, 0.3, 0.035], [0, 1.72, 0], { color: 'steel' })
      .cone([0.05, 0.08, 0.03], [0, 1.88, 0], { color: 'steel' })
      .done(),
  ),
  e('speech bubble', 'ideas', 'symbols', () =>
    m('speech bubble')
      .ball([0.17, 0.11, 0.035], [0, 0.1, 0], { color: 'white' })
      .cone([0.04, 0.06, 0.03], [-0.045, 0.035, 0], { color: 'white', rot: [0, 0, 160] })
      .ball(0.018, [-0.035, 0.1, 0.017], { color: 'black' })
      .ball(0.018, [0, 0.1, 0.017], { color: 'black' })
      .ball(0.018, [0.035, 0.1, 0.017], { color: 'black' })
      .done(),
  ),
  e('speed bump', 'places', 'street things', () => {
    const b = m('speed bump')
      .box([2.2, 0.16, 1.0], [0, 0.08, 0], { color: 'darkgray', round: 0.1 })
      .box([2.0, 0.08, 0.4], [0, 0.18, 0], { color: 'yellow', round: 1 });
    b.each(4, (i) => b.box([0.22, 0.012, 0.36], [-0.75 + i * 0.5, 0.218, 0], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('speed camera', 'places', 'street things', () =>
    m('speed camera')
      .box([0.3, 0.06, 0.3], [0, 0.03, 0], { color: 'gray' })
      .stick([0, 0, 0], [0, 1.62, 0], 0.1, 'gray')
      .box([0.4, 0.5, 0.36], [0, 1.85, 0], { color: 'yellow', round: 0.1 })
      .box([0.44, 0.04, 0.46], [0, 2.12, 0.04], { color: 'darkgray' })
      .cyl([0.13, 0.06, 0.13], [0, 1.92, 0.19], { color: 'black', rot: [90, 0, 0] })
      .box([0.16, 0.08, 0.02], [0, 1.72, 0.185], { color: 'white', glow: true })
      .done(),
  ),
  e('speedway', 'places', 'sports venues', () =>
    m('speedway')
      .torus([4, 2.6, 0.1], [0, 0.05, 0], { color: 'darkgray', rot: [90, 0, 0], tube: 0.2 })
      .cyl([2.5, 0.06, 1.62], [0, 0.03, 0], { color: 'grass' })
      .box([2.2, 0.35, 0.45], [0, 0.175, -1.75], { color: 'gray', round: 0.1 })
      .box([2.0, 0.1, 0.2], [0, 0.3, -1.6], { color: 'red', noInk: true })
      .box([0.08, 0.012, 0.52], [0, 0.1, 1.04], { color: 'white', noInk: true })
      .box([0.16, 0.08, 0.26], [1.6, 0.14, 0.1], { color: 'red' })
      .box([0.16, 0.08, 0.26], [-1.6, 0.14, -0.2], { color: 'blue' })
      .stick([0.35, 0, 1.4], [0.35, 0.3, 1.4], 0.02, 'gray')
      .box([0.14, 0.09, 0.01], [0.42, 0.26, 1.4], { color: 'white' })
      .box([0.035, 0.045, 0.012], [0.385, 0.282, 1.402], { color: 'black', noInk: true })
      .box([0.035, 0.045, 0.012], [0.455, 0.238, 1.402], { color: 'black', noInk: true })
      .done(),
  ),
  e('sphere', 'ideas', 'shapes', () =>
    m('sphere')
      .cyl([0.06, 0.01, 0.06], [0, 0.005, 0], { color: 'gray' })
      .ball(0.1, [0, 0.058, 0], { color: 'blue' })
      .done(),
  ),
  e('sphinx (structure)', 'places', 'landmarks', () => {
    const stone = '#d9b77a', head = '#cfa96a';
    const b = m('sphinx (structure)', { view: 'side' })
      .box([4, 0.3, 11.5], [0, 0.15, 0.3], { color: '#c9a46a' })
      .box([3, 2.6, 7], [0, 1.6, -1.8], { color: stone, round: 0.5 })
      .ball([3, 2.8, 2.8], [0, 1.8, -4.4], { color: stone })
      .box([2.8, 3.0, 2.2], [0, 2.0, 1.8], { color: stone, round: 0.4 })
      .box([2.4, 2.0, 1.4], [0, 4.0, 1.9], { color: head, round: 0.3 })
      .box([1.5, 1.8, 1.4], [0, 4.4, 2.3], { color: stone, round: 0.4 })
      .ball([1.6, 0.9, 1.5], [0, 5.3, 2.1], { color: head })
      .box([0.25, 0.4, 0.3], [0, 4.3, 3.05], { color: stone })
      .box([0.6, 0.6, 0.4], [0, 3.35, 2.9], { color: head });
    b.pair((s) => {
      b.box([0.9, 0.7, 4.2], [s * 1.0, 0.65, 3.8], { color: stone, round: 0.5 });
      b.box([0.5, 1.6, 0.6], [s * 1.0, 3.6, 2.4], { color: head, round: 0.3 });
      b.box([0.3, 0.12, 0.05], [s * 0.35, 4.75, 3.0], { color: 'darkbrown', noInk: true });
      b.each(3, (i) => b.box([0.52, 0.06, 0.62], [s * 1.0, 3.1 + i * 0.45, 2.4], { color: stone, noInk: true }));
    });
    return b.done();
  }),
  e('spice rack', 'kitchen', 'storage', () => {
    const b = m('spice rack')
      .box([0.42, 0.32, 0.02], [0, 0.16, -0.06], { color: 'wood' })
      .box([0.42, 0.015, 0.12], [0, 0.0075, 0], { color: 'wood' })
      .box([0.42, 0.015, 0.12], [0, 0.155, 0], { color: 'wood' });
    b.pair((s) => b.box([0.02, 0.32, 0.12], [s * 0.21, 0.16, 0], { color: 'wood' }));
    const cols = ['red', 'yellow', 'green', 'brown', 'orange', 'tan', 'darkred', 'olive'];
    b.each(8, (i) => {
      const x = -0.15 + (i % 4) * 0.1, y = i < 4 ? 0.015 : 0.1625;
      b.cyl([0.05, 0.07, 0.05], [x, y + 0.035, 0], { color: cols[i] });
      b.cyl([0.052, 0.018, 0.052], [x, y + 0.079, 0], { color: i % 2 ? 'black' : 'silver' });
    });
    b.each(2, (i) => b.stick([-0.2, 0.05 + i * 0.148, 0.05], [0.2, 0.05 + i * 0.148, 0.05], 0.01, 'darkwood'));
    return b.done();
  }),
  e('spike', 'workshop', 'hardware', () =>
    m('spike')
      .box([0.02, 0.12, 0.02], [0, 0.08, 0], { color: 'iron', round: 0.1 })
      .cone([0.02, 0.03, 0.02], [0, 0.015, 0], { color: 'iron', rot: [180, 0, 0], segs: 4 })
      .box([0.038, 0.014, 0.03], [0, 0.145, 0.006], { color: 'iron', round: 0.2 })
      .done(),
  ),
  e('spinach', 'food', 'vegetables', () => {
    const b = m('spinach').cyl([0.045, 0.08, 0.045], [0, 0.04, 0], { color: '#8fc45a' }).cyl([0.05, 0.02, 0.05], [0, 0.04, 0], { color: 'tan' });
    b.each(6, (i) => {
      const a = (i * Math.PI) / 3 + 0.3;
      b.rod([0, 0.07, 0], [Math.sin(a) * 0.04, 0.11, Math.cos(a) * 0.04], 0.012, 'lime');
      b.ball([0.1, 0.16, 0.025], [Math.sin(a) * 0.07, 0.18, Math.cos(a) * 0.07], { color: 'darkgreen', rot: [22, a / D, 0] });
    });
    return b.done();
  }),
  e('spine', 'clinic', 'bones', () => {
    const b = m('spine')
      .box([0.14, 0.04, 0.12], [0, 0.02, 0], { color: 'darkwood' })
      .stick([0, 0.02, -0.06], [0, 0.44, -0.06], 0.01, 'steel');
    b.each(12, (i) => {
      const y = 0.06 + i * 0.032, z = 0.012 * Math.sin(i * 0.55), w = 0.07 - i * 0.002;
      b.cyl([w, 0.022, w * 0.8], [0, y, z], { color: 'cream' });
      b.cyl([w * 0.85, 0.008, w * 0.7], [0, y + 0.016, z], { color: 'tan', noInk: true });
      b.rod([0, y, z - 0.015], [0, y - 0.008, z - 0.045], 0.012, 'cream');
    });
    return b.done();
  }),
  e('spinning top', 'toys', 'classic toys', () =>
    m('spinning top')
      .cyl([0.08, 0.03, 0.08], [0, 0.045, 0], { color: 'red', name: 'rotor' })
      .cone([0.08, 0.035, 0.08], [0, 0.0175, 0], { color: 'red', rot: [180, 0, 0], parent: 'rotor' })
      .torus([0.084, 0.084, 0.012], [0, 0.045, 0], { color: 'yellow', rot: [90, 0, 0], parent: 'rotor', tube: 0.1 })
      .cyl([0.08, 0.025, 0.08], [0, 0.072, 0], { color: 'blue', taper: 0.3, parent: 'rotor' })
      .stick([0, 0.08, 0], [0, 0.11, 0], 0.012, 'wood', { parent: 'rotor' })
      .done(),
  ),
  e('spinning wheel', 'home', 'crafts', () => {
    const b = m('spinning wheel')
      .box([0.95, 0.08, 0.28], [0.05, 0.38, 0], { color: 'wood' })
      .torus([0.7, 0.7, 0.04], [-0.1, 0.76, 0], { color: 'wood', name: 'fan', tube: 0.08 })
      .cyl([0.08, 0.08, 0.08], [-0.1, 0.76, 0], { color: 'darkwood', rot: [90, 0, 0], parent: 'fan' });
    b.each(6, (i) => b.stick([-0.1, 0.76, 0], xy(-0.1, 0.76, 0.33, (i * Math.PI) / 3), 0.022, 'darkwood', { parent: 'fan' }));
    b.pair((s) => {
      b.stick([-0.1, 0.4, s * 0.06], [-0.1, 0.8, s * 0.06], 0.035, 'darkwood');
      b.stick([0.4, 0.38, s * 0.1], [0.48, 0, s * 0.15], 0.04, 'darkwood');
      b.stick([-0.35, 0.38, s * 0.1], [-0.45, 0, s * 0.15], 0.04, 'darkwood');
    });
    b.stick([0.35, 0.4, 0], [0.35, 0.68, 0], 0.035, 'darkwood')
      .stick([0.22, 0.7, 0], [0.5, 0.7, 0], 0.025, 'darkwood')
      .ball([0.1, 0.08, 0.08], [0.36, 0.7, 0], { color: 'wool' })
      .box([0.3, 0.03, 0.2], [-0.1, 0.06, 0.22], { color: 'wood' })
      .stick([-0.1, 0.08, 0.2], [-0.1, 0.6, 0.04], 0.015, 'darkwood');
    return b.done();
  }),
  e('spiral staircase', 'home', 'stairs', () => {
    const b = m('spiral staircase')
      .cyl([0.9, 0.06, 0.9], [0, 0.03, 0], { color: 'iron' })
      .stick([0, 0, 0], [0, 3.0, 0], 0.28, 'iron');
    let last: V | null = null;
    b.each(12, (i) => {
      const a = (i * 30 * Math.PI) / 180, y = 0.22 + i * 0.22;
      const c = Math.cos(a), s = Math.sin(a);
      b.box([0.8, 0.05, 0.3], [c * 0.42, y, s * 0.42], { color: 'wood', rot: [0, -a / D, 0] });
      const top: V = [c * 0.8, y + 0.85, s * 0.8];
      b.stick([c * 0.8, y, s * 0.8], top, 0.025, 'iron');
      if (last) b.rod(last, top, 0.04, 'darkwood');
      last = top;
    });
    return b.done();
  }),
  e('spire', 'places', 'towers', () =>
    m('spire')
      .box([0.4, 0.36, 0.4], [0, 0.18, 0], { color: 'stone', round: 0.05 })
      .cyl([0.18, 0.02, 0.18], [0, 0.2, 0.2], { color: 'white', rot: [90, 0, 0] })
      .stick([0, 0.2, 0.212], [0.0, 0.26, 0.212], 0.012, 'black', { noInk: true })
      .stick([0, 0.2, 0.212], [0.04, 0.2, 0.212], 0.012, 'black', { noInk: true })
      .cyl([0.44, 0.56, 0.44], [0, 0.64, 0], { color: '#5a6a7a', segs: 8, taper: 0 })
      .ball(0.04, [0, 0.92, 0], { color: 'gold' })
      .stick([0, 0.92, 0], [0, 1.02, 0], 0.012, 'gold')
      .stick([-0.03, 0.99, 0], [0.03, 0.99, 0], 0.012, 'gold')
      .done(),
  ),
  e('spit (cooking)', 'kitchen', 'outdoor cooking', () => {
    const b = m('spit (cooking)')
      .stick([-0.65, 0.66, 0], [0.62, 0.66, 0], 0.025, 'iron', { name: 'crank' })
      .stick([0.62, 0.66, 0], [0.62, 0.56, 0], 0.02, 'iron', { parent: 'crank' })
      .stick([0.62, 0.56, 0], [0.7, 0.56, 0], 0.03, 'darkwood', { parent: 'crank' })
      .ball([0.34, 0.24, 0.24], [0, 0.66, 0], { color: '#c87a3a', parent: 'crank' })
      .ball([0.1, 0.1, 0.1], [0.04, 0.78, 0.0], { color: '#d98a4a', parent: 'crank' })
      .cone([0.26, 0.3, 0.26], [0, 0.2, 0], { color: 'fire', glow: true })
      .cone([0.14, 0.2, 0.14], [0.03, 0.17, 0.03], { color: 'flame', glow: true })
      .rod([-0.18, 0.04, -0.08], [0.18, 0.04, 0.08], 0.06, 'bark')
      .rod([-0.18, 0.04, 0.08], [0.18, 0.04, -0.08], 0.06, 'bark');
    b.pair((s) => {
      b.ball([0.1, 0.14, 0.1], [s * 0.18, 0.62, 0.06], { color: '#c87a3a', parent: 'crank' });
      b.stick([s * 0.45, 0, 0], [s * 0.45, 0.62, 0], 0.045, 'darkwood');
      b.rod([s * 0.45, 0.6, 0], [s * 0.45, 0.74, 0.06], 0.035, 'darkwood');
      b.rod([s * 0.45, 0.6, 0], [s * 0.45, 0.74, -0.06], 0.035, 'darkwood');
    });
    for (const [x, z] of around(7, 0.24)) b.ball([0.1, 0.07, 0.1], [x, 0.035, z], { color: 'rock' });
    return b.done();
  }),
  e('spitball', 'toys', 'pranks', () =>
    m('spitball')
      .ball(0.05, [0, 0.025, 0], { color: 'paper' })
      .ball(0.032, [0.016, 0.04, 0.01], { color: 'white' })
      .ball(0.03, [-0.016, 0.035, -0.01], { color: 'paper' })
      .ball(0.012, [0.0, 0.03, 0.025], { color: 'skyblue', noInk: true })
      .stick([0.05, 0.007, -0.05], [0.2, 0.007, -0.01], 0.014, 'white')
      .stick([0.12, 0.007, -0.031], [0.14, 0.007, -0.026], 0.0145, 'red', { noInk: true })
      .done(),
  ),
  e('sponge', 'home', 'cleaning', () => {
    const b = m('sponge')
      .box([0.1, 0.035, 0.065], [0, 0.0175, 0], { color: 'yellow', round: 0.3 })
      .box([0.1, 0.015, 0.065], [0, 0.042, 0], { color: 'green', round: 0.3 });
    b.each(5, (i) => b.ball(0.008, [-0.035 + i * 0.017, 0.012 + (i % 2) * 0.01, 0.033], { color: '#d9b02a', noInk: true }));
    return b.done();
  }),
  e('spoon', 'kitchen', 'cutlery', () => spoon(m('spoon'), 0, 0, 0, 'silver').done()),
  e('spoons', 'kitchen', 'cutlery', () => {
    const b = m('spoons');
    b.each(3, (i) => spoon(b, (i - 1) * 0.02, (i - 1) * 0.012, (i - 1) * 0.35, 'silver'));
    return b.done();
  }),
  e('sporting goods store', 'places', 'shops', () =>
    shop('sporting goods store', { wall: 'navy', trim: 'orange', sign: 'SPORTS', signColor: 'orange', awning: 'green' })
      .ball(1.0, [-1.0, 3.95, 0], { color: 'orange' })
      .torus([1.02, 1.02, 0.04], [-1.0, 3.95, 0], { color: 'black', tube: 0.05, rot: [0, 30, 0] })
      .ball(0.8, [1.0, 3.85, 0], { color: 'white' })
      .ball([0.25, 0.25, 0.1], [1.0, 3.88, 0.37], { color: 'black' })
      .done(),
  ),
  e('sports car', 'garage', 'cars', () => {
    const b = m('sports car', { view: 'side' })
      .box([1.85, 0.48, 4.3], [0, 0.5, 0], { color: 'red', round: 0.6 })
      .box([1.5, 0.4, 1.8], [0, 0.88, -0.3], { color: 'red', round: 0.7 })
      .box([1.52, 0.3, 1.5], [0, 0.9, -0.25], { color: 'glass', round: 0.6 })
      .box([1.7, 0.06, 0.32], [0, 1.02, -2.0], { color: 'black' })
      .box([1.2, 0.12, 0.05], [0, 0.4, 2.15], { color: 'black' });
    b.pair((s) => {
      b.stick([s * 0.6, 0.7, -1.95], [s * 0.6, 1.0, -2.0], 0.06, 'black');
      b.ball([0.35, 0.1, 0.08], [s * 0.6, 0.62, 2.12], { color: 'yellow', glow: true });
    });
    return wheels(b, 0.85, [1.35, -1.35], 0.66, 0.26, 'rubber', 'silver').done();
  }),
  e('spotlight', 'music', 'stage gear', () => {
    const t = 60 * D, c: V = [0, 0.26, 0];
    const b = m('spotlight')
      .box([0.28, 0.04, 0.28], [0, 0.02, 0], { color: 'darkgray' })
      .stick([0, 0.04, 0], [0, 0.08, 0], 0.08, 'darkgray')
      .stick([-0.14, 0.08, 0], [0.14, 0.08, 0], 0.03, 'black')
      .cyl([0.2, 0.3, 0.2], c, { color: 'black', rot: [60, 0, 0] })
      .cyl([0.17, 0.02, 0.17], [0, c[1] + 0.15 * Math.cos(t), 0.15 * Math.sin(t)], { color: 'flame', rot: [60, 0, 0], glow: true });
    b.pair((s) => b.stick([s * 0.13, 0.08, 0], [s * 0.13, 0.27, 0], 0.03, 'black'));
    return b.done();
  }),
  e('spray bottle', 'home', 'cleaning', () =>
    m('spray bottle')
      .cyl([0.08, 0.15, 0.06], [0, 0.075, 0], { color: 'skyblue' })
      .cyl([0.08, 0.03, 0.06], [0, 0.165, 0], { color: 'skyblue', taper: 0.45 })
      .cyl([0.03, 0.02, 0.03], [0, 0.19, 0], { color: 'white' })
      .box([0.04, 0.05, 0.1], [0, 0.215, 0.015], { color: 'white', round: 0.3 })
      .cyl([0.016, 0.02, 0.016], [0, 0.225, 0.07], { color: 'orange', rot: [90, 0, 0] })
      .box([0.02, 0.055, 0.016], [0, 0.175, 0.05], { color: 'white', rot: [-15, 0, 0] })
      .cyl([0.082, 0.06, 0.062], [0, 0.07, 0], { color: 'white' })
      .done(),
  ),
  e('spray paint', 'workshop', 'paint', () =>
    m('spray paint')
      .cyl([0.066, 0.18, 0.066], [0, 0.09, 0], { color: 'red' })
      .ball([0.066, 0.04, 0.066], [0, 0.18, 0], { color: 'silver' })
      .cyl([0.068, 0.06, 0.068], [0, 0.09, 0], { color: 'white' })
      .cyl([0.02, 0.022, 0.02], [0, 0.205, 0], { color: 'white' })
      .ball(0.005, [0, 0.21, 0.01], { color: 'black' })
      .cyl([0.068, 0.05, 0.068], [0.08, 0.025, 0.03], { color: 'red' })
      .done(),
  ),
  e('spring roll', 'food', 'asian food', () =>
    m('spring roll')
      .cyl([0.24, 0.012, 0.17], [0, 0.006, 0], { color: 'white' })
      .capsule([0.035, 0.13, 0.035], [-0.01, 0.03, -0.02], { color: '#d9a03a', rot: [0, 0, 90] })
      .capsule([0.035, 0.13, 0.035], [-0.01, 0.03, 0.025], { color: '#d9a03a', rot: [0, 0, 90] })
      .capsule([0.035, 0.13, 0.035], [0.0, 0.058, 0.0], { color: '#e0ad4a', rot: [0, 25, 90] })
      .cyl([0.05, 0.025, 0.05], [0.085, 0.0245, 0.04], { color: 'white' })
      .cyl([0.044, 0.004, 0.044], [0.085, 0.037, 0.04], { color: 'darkred' })
      .done(),
  ),
  e('sprinkler', 'garden', 'garden tools', () =>
    m('sprinkler')
      .cyl([0.6, 0.02, 0.6], [0, 0.01, 0], { color: 'grass' })
      .cyl([0.14, 0.06, 0.14], [0, 0.04, 0], { color: 'green' })
      .stick([0, 0.05, 0], [0, 0.26, 0], 0.025, 'brass')
      .stick([-0.13, 0.27, 0], [0.13, 0.27, 0], 0.025, 'brass', { name: 'rotor' })
      .rod([0.13, 0.27, 0], [0.22, 0.36, 0], 0.02, '#7cc4f0', { parent: 'rotor' })
      .rod([0.22, 0.36, 0], [0.3, 0.3, 0], 0.02, '#7cc4f0', { parent: 'rotor' })
      .rod([-0.13, 0.27, 0], [-0.22, 0.36, 0], 0.02, '#7cc4f0', { parent: 'rotor' })
      .rod([-0.22, 0.36, 0], [-0.3, 0.3, 0], 0.02, '#7cc4f0', { parent: 'rotor' })
      .ball(0.02, [0.32, 0.22, 0.02], { color: '#7cc4f0', parent: 'rotor' })
      .ball(0.02, [-0.32, 0.22, -0.02], { color: '#7cc4f0', parent: 'rotor' })
      .done(),
  ),
  e('sprinkles', 'food', 'baking', () => {
    const b = bowl(m('sprinkles'), 0.11, 0.05, 'white', 'cream').ball([0.1, 0.035, 0.1], [0, 0.05, 0], { color: 'cream' });
    const cols = ['red', 'yellow', 'blue', 'lime', 'pink', 'orange', 'purple', 'cyan'];
    b.each(16, (i) => {
      const a = i * 2.4, r = i < 12 ? 0.012 + (i % 4) * 0.009 : 0.075 + (i % 2) * 0.02;
      const y = i < 12 ? 0.05 + 0.0175 * Math.sqrt(Math.max(0, 1 - (r / 0.05) ** 2)) + 0.002 : 0.004;
      b.capsule([0.008, 0.02, 0.008], [Math.cos(a) * r, y, Math.sin(a) * r], { color: cols[i % 8], rot: [90, (i * 47) % 180, 0], noInk: true });
    });
    return b.done();
  }),
  e('spyglass', 'study', 'optics', () => {
    const t = 30 * D, P = (l: number): V => [0, 0.03 + l * Math.sin(t), -0.15 + l * Math.cos(t)];
    return m('spyglass', { view: 'side' })
      .stick(P(0), P(0.13), 0.055, 'brass')
      .stick(P(0.03), P(0.1), 0.06, 'leather')
      .stick(P(0.12), P(0.23), 0.043, 'brass')
      .stick(P(0.22), P(0.31), 0.033, 'brass')
      .stick(P(0.12), P(0.135), 0.05, 'gold')
      .stick(P(0.22), P(0.235), 0.04, 'gold')
      .stick(P(0.3), P(0.32), 0.03, 'darkbrown')
      .done();
  }),
  e('square (shape)', 'ideas', 'shapes', () =>
    m('square (shape)')
      .box([0.42, 0.42, 0.05], [0, 0.29, 0], { color: 'blue', round: 0.05 })
      .box([0.3, 0.08, 0.15], [0, 0.04, 0], { color: 'wood' })
      .done(),
  ),
  e('squash', 'food', 'vegetables', () =>
    m('squash')
      .ball([0.15, 0.16, 0.15], [0, 0.08, 0], { color: '#e9b56a' })
      .capsule([0.09, 0.2, 0.09], [0, 0.2, 0], { color: '#e9b56a' })
      .cyl([0.022, 0.035, 0.022], [0, 0.31, 0], { color: 'darkbrown' })
      .done(),
  ),
  e('squeegee', 'home', 'cleaning', () =>
    m('squeegee')
      .stick([0, 0, 0], [0, 0.3, 0], 0.03, 'black')
      .cyl([0.036, 0.1, 0.036], [0, 0.06, 0], { color: 'blue' })
      .box([0.35, 0.04, 0.03], [0, 0.32, 0], { color: 'steel', round: 0.2 })
      .box([0.36, 0.03, 0.012], [0, 0.35, 0], { color: 'black' })
      .done(),
  ),
  e('stable', 'places', 'farm buildings', () => {
    const b = house('stable', 5, 2.6, 3.5, 'darkred', 'darkgray', 1.4)
      .label('STABLE', [1.6, 0.4], [0, 3.05, 1.97], { color: 'white' })
      .box([0.6, 0.5, 0.6], [0, 4.2, 0], { color: 'white' })
      .cone([0.9, 0.4, 0.9], [0, 4.65, 0], { color: 'darkgray', segs: 4, rot: [0, 45, 0] })
      .ball([0.35, 0.4, 0.6], [-1.2, 1.6, 1.85], { color: 'brown' })
      .ball([0.25, 0.22, 0.3], [-1.2, 1.5, 2.15], { color: 'brown' })
      .box([1.2, 0.8, 0.8], [3.1, 0.4, 1.0], { color: 'gold', round: 0.2 });
    b.pair((s) => {
      b.box([1.0, 1.1, 0.08], [s * 1.2, 0.55, 1.78], { color: 'wood' });
      b.box([1.0, 0.9, 0.06], [s * 1.2, 1.6, 1.77], { color: 'darkbrown' });
      b.rod([s * 1.2 - 0.45, 0.08, 1.84], [s * 1.2 + 0.45, 1.02, 1.84], 0.05, 'white', { noInk: true });
      b.rod([s * 1.2 - 0.45, 1.02, 1.84], [s * 1.2 + 0.45, 0.08, 1.84], 0.05, 'white', { noInk: true });
    });
    return b.done();
  }),
  e('stable door', 'farm', 'farm things', () => {
    const b = m('stable door')
      .box([1.3, 2.25, 0.18], [0, 1.125, -0.06], { color: 'darkwood' })
      .box([1.1, 1.05, 0.08], [0, 0.56, 0.05], { color: 'red', round: 0.05 })
      .box([1.1, 1.0, 0.08], [0, 1.62, 0.05], { color: 'red', round: 0.05, name: 'door', pivot: [-0.55, 1.62, 0.05] })
      .rod([-0.48, 0.1, 0.1], [0.48, 1.0, 0.1], 0.07, 'white')
      .rod([-0.48, 1.0, 0.1], [0.48, 0.1, 0.1], 0.07, 'white')
      .rod([-0.48, 1.18, 0.1], [0.48, 2.06, 0.1], 0.07, 'white', { parent: 'door' })
      .rod([-0.48, 2.06, 0.1], [0.48, 1.18, 0.1], 0.07, 'white', { parent: 'door' })
      .box([0.08, 0.06, 0.04], [0.42, 1.3, 0.11], { color: 'black', parent: 'door' });
    b.each(4, (i) => b.box([0.22, 0.05, 0.03], [-0.48, [0.2, 0.9, 1.3, 1.95][i], 0.1], { color: 'black', parent: i > 1 ? 'door' : undefined }));
    return b.done();
  }),
  e('stadium', 'places', 'sports venues', () => {
    const b = m('stadium')
      .torus([8, 6, 2.4], [0, 1.2, 0], { color: '#b9c2ca', rot: [90, 0, 0], tube: 0.22 })
      .torus([7.6, 5.7, 1.0], [0, 2.1, 0], { color: 'red', rot: [90, 0, 0], tube: 0.15 })
      .cyl([4.7, 0.1, 3.5], [0, 0.05, 0], { color: 'grass' })
      .box([0.06, 0.02, 3.2], [0, 0.11, 0], { color: 'white', noInk: true })
      .torus([0.9, 0.9, 0.02], [0, 0.11, 0], { color: 'white', rot: [90, 0, 0], tube: 0.08, noInk: true })
      .label('STADIUM', [2.4, 0.5], [0, 1.0, 3.1], { color: 'white' });
    for (const [x, z] of [[3.6, 2.6], [-3.6, 2.6], [3.6, -2.6], [-3.6, -2.6]]) {
      b.stick([x, 0, z], [x, 4.0, z], 0.15, 'steel');
      b.box([0.7, 0.45, 0.12], [x, 4.1, z], { color: 'white', glow: true, rot: [0, Math.atan2(x, z) / D, 0] });
    }
    return b.done();
  }),
  e('staff', 'sports', 'hiking gear', () =>
    m('staff')
      .stick([0, 0, 0], [0, 1.4, 0], 0.045, 'wood')
      .cyl([0.04, 0.05, 0.04], [0, 0.025, 0], { color: 'iron' })
      .ball(0.06, [0, 0.75, 0.0], { color: 'wood' })
      .cyl([0.055, 0.2, 0.055], [0, 1.1, 0], { color: 'leather' })
      .ball([0.13, 0.15, 0.13], [0, 1.45, 0], { color: 'darkwood' })
      .done(),
  ),
  e('stage (place)', 'places', 'venues', () => {
    const b = m('stage (place)')
      .box([4, 0.8, 2.5], [0, 0.4, 0], { color: 'wood', round: 0.05 })
      .box([4.04, 0.12, 2.54], [0, 0.76, 0], { color: 'darkwood', round: 0.1 })
      .box([4, 2.6, 0.1], [0, 2.1, -1.2], { color: 'darkred' })
      .box([4.3, 0.45, 0.25], [0, 3.3, -0.9], { color: 'red', round: 0.3 })
      .label('SHOW', [1.2, 0.3], [0, 3.3, -0.76], { color: 'gold' })
      .stick([0, 0.8, 0.6], [0, 1.9, 0.6], 0.03, 'black')
      .ball([0.07, 0.1, 0.07], [0, 1.95, 0.62], { color: 'darkgray' });
    b.pair((s) => {
      b.box([0.6, 2.6, 0.25], [s * 1.75, 2.1, -0.95], { color: 'red', round: 0.5 });
      b.ball(0.15, [s * 1.0, 3.05, -0.75], { color: 'flame', glow: true });
    });
    return b.done();
  }),
  e('stained glass', 'home', 'windows', () => {
    const cols = ['red', 'blue', 'gold', 'green', 'purple', 'blue', 'red', 'gold', 'green', 'red', 'blue', 'purple'];
    const b = m('stained glass')
      .box([1.4, 2.2, 0.2], [0, 1.1, 0], { color: 'stone', round: 0.05 })
      .cyl([1.4, 0.2, 1.4], [0, 2.2, 0], { color: 'stone', rot: [90, 0, 0] })
      .box([1.12, 1.95, 0.03], [0, 1.15, 0.1], { color: 'black' })
      .cyl([1.12, 0.03, 1.12], [0, 2.2, 0.1], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.4, 0.03, 0.4], [0, 2.25, 0.115], { color: 'gold', rot: [90, 0, 0], glow: true })
      .box([1.6, 0.12, 0.3], [0, 0.06, 0.05], { color: 'stone' });
    for (let k = 0; k < 6; k++) b.ball([0.14, 0.2, 0.02], xy(0, 2.25, 0.32, (k * Math.PI) / 3, 0.115), { color: cols[k], glow: true, rot: [0, 0, -k * 60] });
    b.each(12, (i) => b.box([0.33, 0.43, 0.02], [-0.36 + (i % 3) * 0.36, 0.43 + Math.floor(i / 3) * 0.47, 0.12], { color: cols[i], glow: true }));
    return b.done();
  }),
  e('stairs', 'home', 'stairs', () => {
    const b = m('stairs');
    b.each(12, (i) => b.box([1.0, 0.25 * (i + 1), 0.29], [0, 0.125 * (i + 1), 1.6 - i * 0.28], { color: i % 2 ? 'wood' : 'lightwood', round: 0.05 }));
    b.rod([0.55, 1.15, 1.6], [0.55, 3.9, -1.48], 0.06, 'darkwood');
    for (const i of [0, 6, 11]) b.stick([0.55, 0.25 * (i + 1), 1.6 - i * 0.28], [0.55, 0.25 * (i + 1) + 0.9, 1.6 - i * 0.28], 0.05, 'darkwood');
    return b.done();
  }),
  e('stairwell', 'places', 'rooms', () => {
    const b = m('stairwell')
      .box([2.6, 0.1, 2.6], [0, 0.05, 0], { color: 'gray' })
      .box([2.6, 4.2, 0.35], [0, 2.1, -1.4], { color: 'beige' })
      .box([0.35, 4.2, 2.6], [-1.4, 2.1, 0], { color: 'beige' })
      .box([2.4, 0.15, 0.8], [0, 1.95, -0.85], { color: 'gray' })
      .box([1.15, 0.15, 0.9], [-0.62, 3.9, 0.8], { color: 'gray' })
      .label('EXIT', [0.5, 0.2], [0.6, 3.2, -1.21], { color: 'green', glow: true });
    b.each(6, (i) => b.box([1.1, 0.3, 0.3], [0.6, 0.25 + i * 0.3, 1.05 - i * 0.3], { color: 'lightgray' }));
    b.each(6, (i) => b.box([1.1, 0.3, 0.3], [-0.6, 2.15 + i * 0.3, -0.35 + i * 0.3], { color: 'lightgray' }));
    b.rod([1.15, 1.2, 1.1], [1.15, 2.9, -0.5], 0.05, 'steel').rod([-0.05, 3.1, -0.4], [-0.05, 4.8, 1.2], 0.05, 'steel');
    return b.done();
  }),
  e('stake', 'workshop', 'lumber', () =>
    m('stake')
      .cone([0.11, 0.16, 0.11], [0, 0.08, 0], { color: 'lightwood', rot: [180, 45, 0], segs: 4 })
      .box([0.08, 0.8, 0.08], [0, 0.55, 0], { color: 'lightwood', round: 0.1 })
      .box([0.084, 0.03, 0.084], [0, 0.94, 0], { color: 'wood', round: 0.2 })
      .done(),
  ),
  e('stalactite', 'nature', 'caves', () => {
    const b = m('stalactite')
      .box([2.0, 0.4, 1.0], [0, 2.2, 0], { color: 'rock', round: 0.5 })
      .cone([0.28, 1.0, 0.28], [0, 1.55, 0], { color: '#d8c8a8', rot: [180, 0, 0] })
      .cone([0.18, 0.6, 0.18], [0.35, 1.75, 0.1], { color: '#d8c8a8', rot: [180, 0, 0] })
      .cone([0.15, 0.45, 0.15], [-0.3, 1.82, -0.1], { color: '#d8c8a8', rot: [180, 0, 0] })
      .ball([0.04, 0.06, 0.04], [0, 0.9, 0], { color: 'skyblue' })
      .cone([0.2, 0.25, 0.2], [0, 0.125, 0], { color: '#d8c8a8' });
    b.pair((s) => b.box([0.45, 2.1, 0.8], [s * 0.85, 1.05, 0], { color: 'rock', round: 0.5 }));
    return b.done();
  }),
  e('stalagmite', 'nature', 'caves', () =>
    m('stalagmite')
      .ball([0.9, 0.24, 0.7], [0, 0.08, 0], { color: 'rock' })
      .cyl([0.36, 1.4, 0.36], [0, 0.75, 0], { color: '#d8c8a8', taper: 0.08 })
      .ball([0.4, 0.15, 0.4], [0, 0.35, 0], { color: '#cbb994' })
      .cyl([0.22, 0.8, 0.22], [0.26, 0.45, 0.05], { color: '#d8c8a8', taper: 0.1 })
      .cyl([0.16, 0.5, 0.16], [-0.24, 0.3, 0.06], { color: '#d8c8a8', taper: 0.1 })
      .done(),
  ),
  e('stamp (postage)', 'study', 'mail', () => {
    const b = m('stamp (postage)')
      .box([0.09, 0.02, 0.04], [0, 0.01, 0], { color: 'wood' })
      .box([0.07, 0.085, 0.008], [0, 0.065, 0], { color: 'paper', round: 0.1 })
      .box([0.055, 0.068, 0.003], [0, 0.066, 0.005], { color: 'skyblue' })
      .ball([0.06, 0.03, 0.003], [0, 0.04, 0.006], { color: 'green', noInk: true })
      .ball(0.016, [0.012, 0.08, 0.007], { color: 'red', noInk: true })
      .label('5c', [0.02, 0.012], [-0.016, 0.092, 0.008], { color: 'white' });
    b.each(5, (i) => {
      for (const s of [-1, 1]) {
        b.ball(0.008, [-0.028 + i * 0.014, 0.065 + s * 0.0425, 0], { color: 'paper' });
        b.ball(0.008, [s * 0.035, 0.037 + i * 0.014, 0], { color: 'paper' });
      }
    });
    return b.done();
  }),
  e('stands', 'study', 'classroom', () =>
    m('stands')
      .box([0.5, 0.06, 0.4], [0, 0.03, 0], { color: 'darkwood' })
      .box([0.34, 1.0, 0.26], [0, 0.56, 0], { color: 'wood', round: 0.1 })
      .box([0.62, 0.06, 0.46], [0, 1.12, 0], { color: 'darkwood', rot: [20, 0, 0] })
      .box([0.62, 0.04, 0.04], [0, 1.08, 0.24], { color: 'darkwood' })
      .box([0.4, 0.02, 0.3], [0, 1.16, 0], { color: 'paper', rot: [20, 0, 0] })
      .rod([0.22, 1.15, -0.1], [0.24, 1.35, 0.05], 0.012, 'black')
      .ball([0.03, 0.05, 0.03], [0.24, 1.37, 0.07], { color: 'black' })
      .done(),
  ),
  e('staple gun', 'workshop', 'hand tools', () =>
    m('staple gun', { view: 'side' })
      .box([0.04, 0.025, 0.19], [0, 0.0125, 0], { color: 'darkgray', round: 0.2 })
      .box([0.046, 0.1, 0.15], [0, 0.07, 0.02], { color: 'yellow', round: 0.35 })
      .box([0.036, 0.026, 0.2], [0, 0.135, -0.03], { color: 'black', rot: [-6, 0, 0], round: 0.4 })
      .box([0.052, 0.012, 0.03], [0, 0.006, 0.09], { color: 'silver' })
      .done(),
  ),
  e('stapler', 'study', 'stationery', () =>
    m('stapler', { view: 'side' })
      .box([0.045, 0.015, 0.16], [0, 0.0075, 0], { color: 'black', round: 0.3 })
      .box([0.03, 0.006, 0.04], [0, 0.017, 0.055], { color: 'silver' })
      .cyl([0.02, 0.05, 0.02], [0, 0.025, -0.07], { color: 'black', rot: [0, 0, 90] })
      .box([0.046, 0.035, 0.16], [0, 0.04, 0.0], { color: 'red', round: 0.4, name: 'lid', pivot: [0, 0.03, -0.072] })
      .done(),
  ),
  e('staples', 'study', 'stationery', () =>
    m('staples')
      .box([0.12, 0.04, 0.05], [0, 0.02, 0], { color: 'red', round: 0.1 })
      .label('STAPLES', [0.1, 0.022], [0, 0.022, 0.026], { color: 'white' })
      .box([0.1, 0.012, 0.008], [0, 0.006, 0.05], { color: 'silver' })
      .box([0.1, 0.003, 0.014], [0, 0.013, 0.05], { color: 'silver' })
      .done(),
  ),
  e('star (space)', 'sky', 'stars', () => {
    const c: V = [0, 4.5, 0];
    const b = m('star (space)').ball(5, c, { color: 'yellow' }).ball(4.6, [0, 4.6, 0.25], { color: '#ffe680', noInk: true });
    b.each(8, (i) => {
      const a = (i * Math.PI) / 4;
      b.cone([0.9, 1.4, 0.5], xy(0, 4.5, 2.9, a), { color: i % 2 ? 'orange' : 'flame', glow: true, rot: [0, 0, -a / D] });
    });
    return b.done();
  }),
  e('station wagon', 'garage', 'cars', () => {
    const b = m('station wagon', { view: 'side' })
      .box([1.8, 0.6, 4.7], [0, 0.62, 0], { color: 'teal', round: 0.4 })
      .box([1.66, 0.55, 3.1], [0, 1.18, -0.6], { color: 'teal', round: 0.3 })
      .box([1.68, 0.4, 2.9], [0, 1.2, -0.55], { color: 'glass', round: 0.3 })
      .box([1.82, 0.28, 3.6], [0, 0.6, -0.3], { color: 'wood', round: 0.3 })
      .box([1.2, 0.3, 1.6], [0, 1.6, -0.7], { color: 'darkbrown', round: 0.3 });
    b.pair((s) => {
      b.stick([s * 0.7, 1.46, -2.0], [s * 0.7, 1.46, 0.6], 0.05, 'black');
      b.ball([0.3, 0.14, 0.06], [s * 0.6, 0.72, 2.35], { color: 'yellow', glow: true });
    });
    return wheels(b, 0.82, [1.5, -1.5], 0.66).done();
  }),
  e('statue', 'places', 'monuments', () => {
    const c = '#6fa58f';
    const b = m('statue')
      .box([1.2, 1.0, 1.2], [0, 0.5, 0], { color: 'stone', round: 0.05 })
      .box([1.35, 0.12, 1.35], [0, 1.06, 0], { color: 'stone', round: 0.1 })
      .label('HERO', [0.7, 0.22], [0, 0.55, 0.61], { color: 'gold' })
      .cyl([0.6, 0.9, 0.42], [0, 1.6, 0], { color: c, taper: 0.7 })
      .box([0.44, 0.6, 0.28], [0, 2.25, 0], { color: c, round: 0.4 })
      .ball(0.3, [0, 2.72, 0], { color: c })
      .rod([0.22, 2.4, 0], [0.38, 3.0, 0.05], 0.12, c)
      .cyl([0.1, 0.18, 0.1], [0.4, 3.1, 0.05], { color: c, taper: 1.5 })
      .ball([0.12, 0.18, 0.12], [0.4, 3.26, 0.05], { color: 'gold' })
      .rod([-0.22, 2.4, 0], [-0.3, 1.9, 0.1], 0.12, c)
      .box([0.2, 0.28, 0.06], [-0.3, 1.85, 0.16], { color: c });
    return b.done();
  }),
  e('statuette', 'home', 'decor', () =>
    m('statuette')
      .cyl([0.08, 0.06, 0.08], [0, 0.03, 0], { color: 'black' })
      .cyl([0.06, 0.015, 0.06], [0, 0.0675, 0], { color: 'gold' })
      .capsule([0.032, 0.09, 0.026], [0, 0.115, 0], { color: 'gold' })
      .capsule([0.045, 0.08, 0.03], [0, 0.18, 0], { color: 'gold' })
      .ball(0.032, [0, 0.235, 0], { color: 'gold' })
      .stick([-0.018, 0.19, 0.016], [0.018, 0.19, 0.016], 0.014, 'gold')
      .stick([0.01, 0.075, 0.02], [0.01, 0.2, 0.02], 0.008, 'gold')
      .done(),
  ),
  e('steak', 'food', 'meat', () => {
    const b = m('steak')
      .cyl([0.3, 0.015, 0.22], [0, 0.0075, 0], { color: 'white' })
      .ball([0.21, 0.035, 0.15], [0.006, 0.03, -0.006], { color: 'cream' })
      .ball([0.2, 0.05, 0.14], [0, 0.038, 0], { color: '#a8452a' })
      .rod([-0.03, 0.05, -0.04], [-0.03, 0.05, 0.04], 0.012, 'cream')
      .rod([-0.07, 0.05, 0.0], [0.02, 0.05, 0.0], 0.012, 'cream')
      .ball([0.04, 0.012, 0.025], [0.1, 0.02, 0.07], { color: 'green' });
    b.each(3, (i) => b.box([0.12, 0.004, 0.008], [0.02 + i * 0.01, 0.062, -0.04 + i * 0.035], { color: '#5a2a12', noInk: true, rot: [0, 35, 0] }));
    return b.done();
  }),
  e('stealth aircraft', 'garage', 'aircraft', () => {
    const c = '#3a3f45';
    const b = m('stealth aircraft')
      .ball([3, 1.0, 5], [0, 3, 0.3], { color: c })
      .ball([1.2, 0.45, 1.4], [0, 3.45, 1.4], { color: '#5a6a7a' });
    b.pair((s) => {
      b.box([6.8, 0.35, 2.6], [s * 3.6, 3, -1.2], { color: c, rot: [0, s * 33, 0], round: 0.3 });
      b.box([0.8, 0.25, 0.8], [s * 0.7, 3.45, 0.2], { color: '#2a2e33' });
    });
    return b.done();
  }),
  e('steam', 'nature', 'water', () => {
    const b = m('steam')
      .cyl([0.08, 0.08, 0.08], [0, 0.04, 0], { color: 'white' })
      .cyl([0.072, 0.004, 0.072], [0, 0.08, 0], { color: 'coffee' })
      .torus([0.055, 0.055, 0.012], [0.045, 0.04, 0], { color: 'white', rot: [0, 90, 0], tube: 0.2 });
    b.each(3, (k) => {
      const x0 = (k - 1) * 0.025;
      let prev: V = [x0, 0.09, 0];
      for (let j = 1; j <= 4; j++) {
        const p: V = [x0 + Math.sin(j * 1.6 + k) * 0.012, 0.09 + j * 0.035, 0];
        b.rod(prev, p, 0.016, '#eef2f5');
        prev = p;
      }
    });
    return b.done();
  }),
  e('steamboat', 'garage', 'boats', () => {
    const b = m('steamboat', { view: 'side' })
      .box([3, 1.0, 9], [0, 0.5, -0.5], { color: 'white', round: 0.3 })
      .ball([3, 1.0, 3.4], [0, 0.5, 3.8], { color: 'white' })
      .box([3.04, 0.3, 9.1], [0, 0.15, -0.5], { color: 'red', round: 0.3 })
      .box([2.8, 1.0, 7], [0, 1.5, -0.6], { color: 'white', round: 0.1 })
      .box([2.82, 0.12, 7.1], [0, 1.0, -0.6], { color: 'darkred', noInk: true })
      .box([2.4, 0.9, 5], [0, 2.45, -0.6], { color: 'cream', round: 0.1 })
      .box([1.4, 0.8, 1.4], [0, 3.3, 1.2], { color: 'white', round: 0.1 })
      .box([1.42, 0.3, 1.42], [0, 3.3, 1.2], { color: 'glass', noInk: true })
      .cyl([2.6, 2.4, 2.6], [0, 1.5, -5.6], { color: 'red', rot: [0, 0, 90], name: 'wheel' });
    b.each(4, (i) => b.box([2.5, 2.7, 0.15], [0, 1.5, -5.6], { color: 'darkred', rot: [i * 45, 0, 0], parent: 'wheel' }));
    b.pair((s) => {
      b.cyl([0.42, 3.0, 0.42], [s * 0.6, 4.4, 2.4], { color: 'black' });
      b.cyl([0.42, 0.35, 0.42], [s * 0.6, 6.0, 2.4], { color: 'gold', taper: 1.6 });
    });
    return b.done();
  }),
  e('steel (material)', 'workshop', 'materials', () =>
    m('steel (material)')
      .box([0.1, 0.018, 0.25], [0, 0.009, 0], { color: 'steel', round: 0.1 })
      .box([0.1, 0.018, 0.25], [0, 0.091, 0], { color: 'steel', round: 0.1 })
      .box([0.016, 0.08, 0.25], [0, 0.05, 0], { color: 'steel', round: 0.1 })
      .cyl([0.026, 0.25, 0.026], [0.09, 0.013, 0], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.026, 0.25, 0.026], [0.118, 0.013, 0], { color: 'metal', rot: [90, 0, 0] })
      .done(),
  ),
  e('steel cage', 'places', 'structures', () => {
    const b = m('steel cage')
      .box([3, 0.25, 3], [0, 0.125, 0], { color: 'darkgray', round: 0.1 })
      .box([3, 0.08, 3], [0, 3.2, 0], { color: 'steel', round: 0.2 });
    for (const [x, z] of [[1.45, 1.45], [-1.45, 1.45], [1.45, -1.45], [-1.45, -1.45]]) b.stick([x, 0.25, z], [x, 3.2, z], 0.12, 'iron');
    b.each(5, (i) => {
      const t = -1.0 + i * 0.5;
      b.stick([t, 0.25, 1.45], [t, 3.2, 1.45], 0.04, 'steel');
      b.stick([t, 0.25, -1.45], [t, 3.2, -1.45], 0.04, 'steel');
      b.stick([1.45, 0.25, t], [1.45, 3.2, t], 0.04, 'steel');
      b.stick([-1.45, 0.25, t], [-1.45, 3.2, t], 0.04, 'steel');
    });
    b.stick([-1.45, 1.7, 1.45], [1.45, 1.7, 1.45], 0.06, 'iron').stick([1.45, 1.7, -1.45], [1.45, 1.7, 1.45], 0.06, 'iron');
    return b.done();
  }),
  e('steel gate', 'places', 'structures', () => {
    const b = m('steel gate')
      .box([1.6, 0.1, 0.06], [-0.85, 0.3, 0], { color: 'iron', name: 'door', pivot: [-1.6, 1.2, 0] })
      .box([1.6, 0.1, 0.06], [-0.85, 2.0, 0], { color: 'iron', parent: 'door' })
      .box([1.6, 0.1, 0.06], [0.85, 0.3, 0], { color: 'iron' })
      .box([1.6, 0.1, 0.06], [0.85, 2.0, 0], { color: 'iron' });
    b.pair((s) => {
      b.box([0.3, 2.6, 0.3], [s * 1.75, 1.3, 0], { color: 'darkgray', round: 0.1 });
      b.ball(0.32, [s * 1.75, 2.72, 0], { color: 'darkgray' });
      b.each(6, (i) => {
        const x = s * (0.15 + i * 0.27), o = s > 0 ? {} : { parent: 'door' };
        b.stick([x, 0.15, 0], [x, 2.2, 0], 0.045, 'iron', o);
        b.cone([0.08, 0.14, 0.08], [x, 2.27, 0], { color: 'gold', ...o });
      });
    });
    return b.done();
  }),
  e('steering wheel', 'garage', 'car parts', () => {
    const c: V = [0, 0.28, 0];
    const b = m('steering wheel')
      .torus([0.36, 0.36, 0.045], c, { color: 'black', tube: 0.14 })
      .cyl([0.1, 0.06, 0.1], c, { color: 'darkgray', rot: [90, 0, 0] })
      .cyl([0.04, 0.01, 0.04], [0, 0.28, 0.032], { color: 'silver', rot: [90, 0, 0] })
      .stick([0, 0.28, -0.03], [0, 0.0, -0.25], 0.06, 'darkgray');
    for (const a of [Math.PI / 2, -Math.PI / 2, Math.PI]) b.stick(c, xy(0, 0.28, 0.16, a), 0.035, 'darkgray');
    return b.done();
  }),
  e('stem', 'garden', 'plant parts', () =>
    m('stem')
      .ball([0.12, 0.05, 0.1], [0, 0.02, 0], { color: 'dirt' })
      .rod([0, 0.02, 0], [0.01, 0.2, 0], 0.014, 'green')
      .ball([0.07, 0.022, 0.03], [0.04, 0.1, 0], { color: 'leaf', rot: [0, 0, 25] })
      .ball([0.06, 0.02, 0.03], [-0.03, 0.14, 0], { color: 'leaf', rot: [0, 0, -25] })
      .ball([0.025, 0.035, 0.025], [0.01, 0.21, 0], { color: 'lime' })
      .done(),
  ),
  e('stencil', 'study', 'art supplies', () =>
    m('stencil')
      .box([0.32, 0.03, 0.08], [0, 0.015, 0], { color: 'wood' })
      .box([0.3, 0.22, 0.006], [0, 0.14, 0], { color: '#f2c94c' })
      .star(0.08, [-0.08, 0.16, 0.004], { color: 'white', noInk: true })
      .cyl([0.06, 0.004, 0.06], [0.0, 0.16, 0.004], { color: 'white', rot: [90, 0, 0], noInk: true })
      .heart(0.06, [0.08, 0.16, 0.004], { color: 'white', noInk: true })
      .label('ABC', [0.2, 0.04], [0, 0.07, 0.005], { color: '#f2c94c' })
      .done(),
  ),
  e('step stool', 'home', 'furniture', () =>
    m('step stool')
      .box([0.4, 0.22, 0.25], [0, 0.11, 0.12], { color: 'blue', round: 0.15 })
      .box([0.4, 0.45, 0.25], [0, 0.225, -0.13], { color: 'blue', round: 0.15 })
      .box([0.36, 0.01, 0.2], [0, 0.222, 0.12], { color: 'darkgray', noInk: true })
      .box([0.36, 0.01, 0.2], [0, 0.452, -0.13], { color: 'darkgray', noInk: true })
      .done(),
  ),
  e('stepladder', 'workshop', 'ladders', () => {
    const b = m('stepladder').box([0.5, 0.18, 0.3], [0, 2.25, -0.02], { color: 'orange', round: 0.2 });
    b.pair((s) => {
      b.stick([s * 0.25, 0, 0.45], [s * 0.2, 2.2, 0.0], 0.05, 'silver');
      b.stick([s * 0.25, 0, -0.5], [s * 0.2, 2.2, -0.05], 0.05, 'silver');
      b.stick([s * 0.23, 1.0, 0.25], [s * 0.23, 1.0, -0.28], 0.02, 'gray');
    });
    b.each(5, (i) => {
      const y = 0.4 * (i + 1);
      b.box([0.46, 0.04, 0.12], [0, y, 0.45 - (y / 2.2) * 0.45], { color: 'silver' });
    });
    return b.done();
  }),
  e('stereo', 'music', 'audio', () => {
    const b = m('stereo')
      .box([0.3, 0.25, 0.25], [0, 0.125, 0], { color: 'darkgray', round: 0.1 })
      .box([0.2, 0.05, 0.02], [0, 0.19, 0.125], { color: 'cyan', glow: true })
      .box([0.16, 0.012, 0.02], [0, 0.13, 0.125], { color: 'black' })
      .cyl([0.05, 0.02, 0.05], [-0.08, 0.07, 0.13], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.05, 0.02, 0.05], [0.08, 0.07, 0.13], { color: 'silver', rot: [90, 0, 0] });
    b.pair((s) => {
      b.box([0.18, 0.32, 0.2], [s * 0.3, 0.16, 0], { color: 'black', round: 0.1 });
      b.cyl([0.13, 0.02, 0.13], [s * 0.3, 0.11, 0.1], { color: 'gray', rot: [90, 0, 0] });
      b.cyl([0.05, 0.02, 0.05], [s * 0.3, 0.25, 0.1], { color: 'gray', rot: [90, 0, 0] });
    });
    return b.done();
  }),
  e('stethoscope', 'clinic', 'medical tools', () => {
    const b = m('stethoscope')
      .cyl([0.06, 0.05, 0.06], [0, 0.03, 0.02], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.05, 0.008, 0.05], [0, 0.03, 0.047], { color: 'white', rot: [90, 0, 0] })
      .rod([0, 0.04, 0], [0, 0.3, 0], 0.014, 'black');
    b.pair((s) => {
      b.rod([0, 0.3, 0], [s * 0.06, 0.48, 0], 0.014, 'black');
      b.rod([s * 0.06, 0.48, 0], [s * 0.05, 0.64, 0.02], 0.01, 'silver');
      b.ball(0.02, [s * 0.045, 0.655, 0.03], { color: 'black' });
    });
    return b.done();
  }),
  e('stew', 'food', 'soups', () => {
    const b = bowl(m('stew'), 0.18, 0.09, 'brown', '#8a4a22');
    const bits: Array<[number, number, string]> = [[0.03, 0.02, 'orange'], [-0.04, 0.01, 'cream'], [0.0, -0.04, '#6b3a22'], [-0.02, 0.045, 'orange'], [0.045, -0.03, 'cream'], [-0.05, -0.03, '#6b3a22']];
    for (const [x, z, c] of bits) b.ball([0.032, 0.022, 0.03], [x, 0.092, z], { color: c });
    b.ball([0.018, 0.008, 0.018], [0.01, 0.1, 0.01], { color: 'green', noInk: true });
    return b.done();
  }),
  e('stick', 'nature', 'wood', () =>
    m('stick')
      .rod([-0.13, 0.02, 0], [0.13, 0.27, 0], 0.03, 'bark')
      .rod([0.0, 0.145, 0], [-0.05, 0.24, 0.03], 0.018, 'bark')
      .ball([0.04, 0.02, 0.025], [-0.06, 0.255, 0.035], { color: 'leaf', rot: [0, 0, 30] })
      .done(),
  ),
  e('sticker', 'study', 'stationery', () =>
    m('sticker')
      .cyl([0.09, 0.01, 0.09], [0, 0.045, 0], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.075, 0.004, 0.075], [0, 0.045, 0.006], { color: 'yellow', rot: [90, 0, 0] })
      .ball(0.01, [-0.014, 0.054, 0.009], { color: 'black', noInk: true })
      .ball(0.01, [0.014, 0.054, 0.009], { color: 'black', noInk: true })
      .torus([0.04, 0.04, 0.003], [0, 0.044, 0.009], { color: 'black', tube: 0.12, noInk: true })
      .box([0.03, 0.022, 0.005], [0.026, 0.076, 0.012], { color: 'white', rot: [-30, 0, 30] })
      .done(),
  ),
  e('stilts', 'toys', 'outdoor toys', () => {
    const b = m('stilts');
    b.pair((s) => {
      const x = s * 0.22;
      b.stick([x, 0, 0], [x, 2.2, 0], 0.05, 'wood');
      b.box([0.17, 0.17, 0.2], [x, 0.62, 0.1], { color: 'darkwood', round: 0.2 });
      b.cyl([0.06, 0.25, 0.06], [x, 1.95, 0], { color: 'red' });
      b.ball(0.07, [x, 0.02, 0], { color: 'rubber' });
    });
    return b.done();
  }),
  e('stink bomb', 'toys', 'pranks', () => {
    const b = m('stink bomb')
      .capsule([0.032, 0.06, 0.032], [0, 0.03, 0], { color: '#c8e04a' })
      .cyl([0.032, 0.03, 0.032], [0, 0.065, 0], { color: 'glass', taper: 0.5 })
      .cone([0.016, 0.03, 0.016], [0, 0.093, 0], { color: 'glass' });
    b.each(3, (k) => {
      const x0 = (k - 1) * 0.03;
      b.rod([x0, 0.12, 0], [x0 + 0.015, 0.15, 0], 0.01, '#8fbf3a');
      b.rod([x0 + 0.015, 0.15, 0], [x0, 0.18, 0], 0.01, '#8fbf3a');
      b.ball(0.02, [x0 + 0.01, 0.2, 0], { color: '#b5d96a' });
    });
    return b.done();
  }),
  e('stitches (body)', 'clinic', 'first aid', () => {
    const b = m('stitches (body)')
      .box([0.15, 0.1, 0.04], [0, 0.05, 0], { color: 'skin2', round: 0.6 })
      .box([0.1, 0.006, 0.004], [0, 0.05, 0.021], { color: 'darkred', noInk: true, rot: [0, 0, 10] });
    b.each(5, (i) => {
      const x = -0.04 + i * 0.02;
      b.box([0.004, 0.03, 0.004], [x, 0.05 + x * 0.17, 0.023], { color: 'black', rot: [0, 0, 25], noInk: true });
      b.box([0.004, 0.03, 0.004], [x, 0.05 + x * 0.17, 0.024], { color: 'black', rot: [0, 0, -25], noInk: true });
    });
    return b.done();
  }),
  e('stomach', 'clinic', 'organs', () =>
    m('stomach')
      .cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'darkwood' })
      .stick([0, 0.02, -0.03], [0, 0.1, -0.03], 0.012, 'steel')
      .ball([0.17, 0.12, 0.09], [0.02, 0.14, 0], { color: '#e8919a', rot: [0, 0, 25] })
      .rod([-0.03, 0.18, 0], [-0.03, 0.27, 0], 0.03, '#e8919a')
      .rod([-0.05, 0.1, 0], [-0.08, 0.13, 0.0], 0.03, '#e8919a')
      .rod([-0.08, 0.13, 0], [-0.1, 0.09, 0.0], 0.026, '#e8a0a8')
      .done(),
  ),
  e('stonehenge', 'places', 'landmarks', () => {
    const b = m('stonehenge').cyl([9, 0.1, 9], [0, 0.05, 0], { color: 'grass' });
    const N = 10, r = 3.6;
    const pts = around(N, r);
    pts.forEach(([x, z], i) => {
      const a = Math.atan2(z, x);
      b.box([0.9, 2.8, 0.66], [x, 1.5, z], { color: 'stone', rot: [0, 90 - a / D, 0], round: 0.15 });
      if (i % 2 === 0 && i < 8) {
        const [x2, z2] = pts[i + 1], mx = (x + x2) / 2, mz = (z + z2) / 2, ta = Math.atan2(z2 - z, x2 - x);
        b.box([Math.hypot(x2 - x, z2 - z) + 0.7, 0.4, 0.55], [mx, 3.1, mz], { color: '#9a9a92', rot: [0, -ta / D, 0], round: 0.15 });
      }
    });
    b.pair((s) => b.box([0.9, 3.2, 0.6], [s * 0.6, 1.7, -1.2], { color: 'stone', round: 0.15 }));
    b.box([2.2, 0.45, 0.65], [0, 3.5, -1.2], { color: '#9a9a92', round: 0.15 });
    b.box([2.4, 0.5, 0.8], [1.0, 0.35, 1.3], { color: 'stone', rot: [0, 30, 0], round: 0.2 });
    return b.done();
  }),
  e('stool', 'home', 'seating', () => {
    const b = m('stool')
      .cyl([0.36, 0.05, 0.36], [0, 0.45, 0], { color: 'wood' })
      .torus([0.32, 0.32, 0.02], [0, 0.17, 0], { color: 'darkwood', rot: [90, 0, 0], tube: 0.1 });
    const top = around(4, 0.12, Math.PI / 4), bot = around(4, 0.18, Math.PI / 4);
    b.each(4, (i) => b.stick([top[i][0], 0.43, top[i][1]], [bot[i][0], 0, bot[i][1]], 0.035, 'darkwood'));
    return b.done();
  }),
  e('stop sign', 'places', 'street things', () =>
    m('stop sign')
      .box([0.3, 0.2, 0.3], [0, 0.1, 0], { color: 'stone' })
      .stick([0, 0.2, 0], [0, 2.0, -0.03], 0.06, 'gray')
      .cyl([0.8, 0.025, 0.8], [0, 2.1, 0], { color: 'white', rot: [90, 0, 22.5], segs: 8 })
      .cyl([0.72, 0.02, 0.72], [0, 2.1, 0.018], { color: 'red', rot: [90, 0, 22.5], segs: 8 })
      .label('STOP', [0.5, 0.18], [0, 2.1, 0.035], { color: 'red' })
      .done(),
  ),
  e('store', 'places', 'shops', () =>
    shop('store', { wall: '#f2e6cf', trim: 'red', sign: 'STORE', signColor: 'red', awning: 'red' })
      .label('OPEN', [0.5, 0.2], [1.2, 1.5, 1.58], { color: 'lime', glow: true })
      .done(),
  ),
  e('storm drain', 'places', 'street things', () => {
    const b = m('storm drain')
      .box([1.6, 0.1, 1.2], [0, 0.05, 0.1], { color: 'darkgray' })
      .box([1.6, 0.3, 0.3], [0, 0.15, -0.6], { color: 'stone' })
      .box([0.8, 0.1, 0.05], [0, 0.12, -0.44], { color: 'black' })
      .box([0.8, 0.02, 0.4], [0, 0.105, -0.2], { color: 'iron' })
      .box([0.5, 0.012, 0.15], [0.1, 0.104, 0.15], { color: 'water', noInk: true });
    b.each(5, (i) => b.box([0.04, 0.025, 0.36], [-0.3 + i * 0.15, 0.108, -0.2], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('stove', 'kitchen', 'appliances', () => {
    const b = m('stove')
      .box([0.76, 0.86, 0.65], [0, 0.43, 0], { color: 'white', round: 0.05 })
      .box([0.76, 0.02, 0.65], [0, 0.87, 0], { color: 'black' })
      .box([0.76, 0.16, 0.06], [0, 0.96, -0.3], { color: 'white' })
      .box([0.66, 0.5, 0.03], [0, 0.42, 0.33], { color: 'white', round: 0.1 })
      .box([0.46, 0.24, 0.02], [0, 0.44, 0.35], { color: 'black' })
      .stick([-0.28, 0.72, 0.37], [0.28, 0.72, 0.37], 0.025, 'silver')
      .box([0.66, 0.1, 0.02], [0, 0.08, 0.33], { color: 'lightgray' });
    for (const [x, z, i] of [[0.18, 0.15, 0], [-0.18, 0.15, 1], [0.18, -0.15, 2], [-0.18, -0.15, 3]]) b.torus([0.18, 0.18, 0.02], [x, 0.885, z], { color: i === 1 ? 'red' : 'darkgray', rot: [90, 0, 0], tube: 0.2, glow: i === 1 });
    b.each(4, (i) => b.cyl([0.04, 0.03, 0.04], [-0.27 + i * 0.18, 0.96, -0.27], { color: 'black', rot: [90, 0, 0] }));
    return b.done();
  }),
  e('straightjacket', 'clinic', 'hospital things', () => {
    const b = m('straightjacket')
      .cyl([0.35, 0.04, 0.35], [0, 0.02, 0], { color: 'darkgray' })
      .stick([0, 0.02, 0], [0, 0.65, 0], 0.04, 'darkgray')
      .box([0.46, 0.62, 0.2], [0, 0.95, 0], { color: 'white', round: 0.35 })
      .torus([0.16, 0.16, 0.04], [0, 1.25, 0], { color: 'white', rot: [90, 0, 0], tube: 0.25 })
      .rod([0.21, 1.15, 0.03], [-0.14, 0.88, 0.13], 0.11, 'white')
      .rod([-0.21, 1.15, 0.03], [0.14, 0.88, 0.13], 0.11, 'white');
    for (const y of [0.78, 1.04]) {
      b.box([0.48, 0.045, 0.22], [0, y, 0], { color: 'tan', round: 0.3 });
      b.box([0.05, 0.05, 0.02], [0.12, y, 0.115], { color: 'silver' });
    }
    return b.done();
  }),
  e('straw (drinking)', 'kitchen', 'tableware', () => {
    const b = m('straw (drinking)')
      .cyl([0.07, 0.11, 0.07], [0, 0.055, 0], { color: 'glass', taper: 1.15 })
      .cyl([0.076, 0.012, 0.076], [0, 0.1, 0], { color: 'orange' });
    b.each(4, (i) => {
      const p0: V = [0.008 + i * 0.004, 0.06 + i * 0.03, 0], p1: V = [0.012 + i * 0.004, 0.09 + i * 0.03, 0];
      b.stick(p0, p1, 0.012, i % 2 ? 'white' : 'red');
    });
    b.rod([0.025, 0.18, 0], [0.05, 0.2, 0], 0.012, 'red');
    return b.done();
  }),
  e('strawberry', 'food', 'fruit', () => {
    const b = m('strawberry')
      .cyl([0.05, 0.05, 0.05], [0, 0.028, 0], { color: 'red', rot: [180, 0, 0], taper: 0.25 })
      .ball([0.05, 0.026, 0.05], [0, 0.053, 0], { color: 'red' })
      .stick([0, 0.06, 0], [0.003, 0.08, 0], 0.005, 'green');
    for (const [x, z] of around(5, 0.014)) b.ball([0.022, 0.006, 0.022], [x, 0.064, z], { color: 'green' });
    b.each(6, (i) => b.ball(0.004, [-0.012 + (i % 3) * 0.012, 0.022 + Math.floor(i / 3) * 0.018, 0.022 - Math.floor(i / 3) * 0.002], { color: 'yellow', noInk: true }));
    return b.done();
  }),
  e('strawberry plant', 'garden', 'fruit plants', () => {
    const b = m('strawberry plant')
      .cyl([0.18, 0.12, 0.18], [0, 0.06, 0], { color: 'copper', taper: 1.2 })
      .cyl([0.2, 0.01, 0.2], [0, 0.12, 0], { color: 'dirt' });
    around(6, 0.07).forEach(([x, z], i) => {
      const a = Math.atan2(x, z);
      b.rod([0, 0.12, 0], [x, 0.2, z], 0.008, 'green');
      b.ball([0.075, 0.02, 0.065], [x * 1.1, 0.205, z * 1.1], { color: 'leaf', rot: [-15, a / D, 0] });
      if (i % 2 === 0) {
        b.rod([x * 0.5, 0.15, z * 0.5], [x * 1.55, 0.1, z * 1.55], 0.005, 'green');
        b.cyl([0.03, 0.035, 0.03], [x * 1.6, 0.075, z * 1.6], { color: 'red', rot: [180, 0, 0], taper: 0.3 });
      }
    });
    b.ball([0.03, 0.01, 0.03], [0.0, 0.24, 0.0], { color: 'white' }).ball(0.012, [0, 0.247, 0], { color: 'yellow' });
    return b.done();
  }),
  e('streamer', 'town', 'jobs', () => who('streamer', { top: 'purple', bottom: 'black', shoes: 'white', acc: [hat('headphones', 'black'), held('mic')] })),
  e('street sweeper', 'garage', 'trucks', () => {
    const b = m('street sweeper', { view: 'side' })
      .box([2.0, 0.4, 5.2], [0, 0.75, 0.2], { color: 'darkgray' })
      .box([2.0, 1.5, 1.4], [0, 1.65, 1.9], { color: 'white', round: 0.15 })
      .box([1.8, 0.7, 0.05], [0, 1.95, 2.62], { color: 'glass' })
      .box([2.2, 2.0, 3.2], [0, 1.95, -0.8], { color: 'yellow', round: 0.1 })
      .box([2.22, 0.12, 3.22], [0, 1.4, -0.8], { color: 'orange', noInk: true })
      .ball(0.28, [0, 2.5, 1.9], { color: 'orange', glow: true })
      .cyl([0.9, 0.12, 0.9], [0.8, 0.08, 2.9], { color: 'orange', name: 'rotor' })
      .cyl([0.9, 0.12, 0.9], [-0.8, 0.08, 2.9], { color: 'orange' })
      .stick([0.8, 0.12, 2.9], [0.8, 0.6, 2.5], 0.08, 'darkgray')
      .stick([-0.8, 0.12, 2.9], [-0.8, 0.6, 2.5], 0.08, 'darkgray')
      .cyl([1.6, 0.4, 0.4], [0, 0.25, 0.4], { color: 'darkgray', rot: [0, 0, 90] });
    return wheels(b, 0.95, [1.8, -1.6], 0.9, 0.35).done();
  }),
  e('stretcher', 'clinic', 'hospital things', () => {
    const b = m('stretcher', { view: 'side' })
      .box([0.62, 0.06, 1.95], [0, 0.75, 0], { color: 'silver' })
      .box([0.58, 0.15, 1.9], [0, 0.85, 0], { color: 'teal', round: 0.4 })
      .ball([0.45, 0.12, 0.3], [0, 0.96, -0.75], { color: 'white' });
    b.pair((s) => {
      b.stick([s * 0.26, 0.1, 0.8], [s * 0.26, 0.74, -0.8], 0.04, 'steel');
      b.stick([s * 0.26, 0.1, -0.8], [s * 0.26, 0.74, 0.8], 0.04, 'steel');
      b.stick([s * 0.26, 0.1, 0.85], [s * 0.26, 0.1, -0.85], 0.04, 'steel');
      b.stick([s * 0.32, 0.85, 0.6], [s * 0.32, 0.85, -0.6], 0.03, 'silver');
      for (const z of [0.85, -0.85]) b.ball(0.1, [s * 0.26, 0.05, z], { color: 'rubber' });
    });
    return b.done();
  }),
  e('string (guitar)', 'music', 'instrument parts', () =>
    m('string (guitar)')
      .box([0.14, 0.18, 0.02], [0, 0.09, -0.03], { color: 'navy', round: 0.1 })
      .label('STRINGS', [0.12, 0.04], [0, 0.14, -0.018], { color: 'gold' })
      .torus([0.12, 0.12, 0.008], [0.02, 0.07, 0.01], { color: 'silver', tube: 0.07 })
      .torus([0.11, 0.115, 0.008], [0.022, 0.07, 0.014], { color: 'silver', tube: 0.07 })
      .rod([0.075, 0.07, 0.012], [0.12, 0.02, 0.03], 0.004, 'silver')
      .cyl([0.012, 0.008, 0.012], [0.122, 0.016, 0.03], { color: 'brass' })
      .done(),
  ),
  e('string cheese', 'food', 'dairy', () =>
    m('string cheese')
      .capsule([0.032, 0.17, 0.032], [0, 0.085, 0], { color: 'milk' })
      .cyl([0.036, 0.07, 0.036], [0, 0.035, 0], { color: 'yellow' })
      .rod([0, 0.15, 0.008], [0.03, 0.2, 0.01], 0.01, 'milk')
      .rod([0, 0.15, -0.006], [-0.03, 0.195, 0], 0.01, 'milk')
      .rod([0.004, 0.15, 0], [0.006, 0.205, -0.02], 0.009, 'milk')
      .done(),
  ),
  e('strobe light', 'music', 'stage gear', () =>
    m('strobe light')
      .box([0.24, 0.14, 0.1], [0, 0.12, 0], { color: 'black', round: 0.2 })
      .box([0.2, 0.09, 0.02], [0, 0.12, 0.055], { color: 'white', glow: true })
      .box([0.2, 0.04, 0.12], [0, 0.02, 0], { color: 'darkgray' })
      .stick([-0.13, 0.04, 0], [-0.13, 0.13, 0], 0.025, 'darkgray')
      .stick([0.13, 0.04, 0], [0.13, 0.13, 0], 0.025, 'darkgray')
      .stick([0.0, 0.12, 0.07], [0.0, 0.2, 0.12], 0.012, 'skyblue', { glow: true })
      .stick([0.08, 0.12, 0.07], [0.14, 0.18, 0.12], 0.012, 'skyblue', { glow: true })
      .done(),
  ),
  e('stroller', 'home', 'baby things', () => {
    const b = m('stroller', { view: 'side' })
      .box([0.45, 0.3, 0.7], [0, 0.6, 0], { color: 'navy', round: 0.6 })
      .ball([0.47, 0.5, 0.42], [0, 0.82, -0.2], { color: 'navy' })
      .ball([0.38, 0.06, 0.4], [0, 0.76, 0.12], { color: 'skyblue' })
      .stick([-0.22, 1.0, -0.62], [0.22, 1.0, -0.62], 0.04, 'black');
    b.pair((s) => {
      b.rod([s * 0.2, 0.6, -0.3], [s * 0.21, 1.0, -0.62], 0.03, 'silver');
      b.stick([s * 0.22, 0.5, 0.25], [s * 0.25, 0.15, 0.35], 0.025, 'silver');
      b.stick([s * 0.22, 0.5, -0.25], [s * 0.25, 0.15, -0.35], 0.025, 'silver');
    });
    return wheels(b, 0.25, [0.35, -0.35], 0.3, 0.06, 'rubber', 'silver').done();
  }),
  e('strongbox', 'home', 'safes', () =>
    m('strongbox')
      .box([0.35, 0.3, 0.3], [0, 0.16, 0], { color: 'darkgray', round: 0.1 })
      .box([0.29, 0.24, 0.03], [0, 0.16, 0.155], { color: 'gray', round: 0.1, name: 'door', pivot: [-0.145, 0.16, 0.155] })
      .cyl([0.08, 0.02, 0.08], [0.04, 0.18, 0.175], { color: 'silver', rot: [90, 0, 0], parent: 'door' })
      .stick([0.04, 0.18, 0.18], [0.1, 0.18, 0.18], 0.012, 'black', { parent: 'door', noInk: true })
      .box([0.02, 0.06, 0.02], [0.1, 0.1, 0.18], { color: 'silver', parent: 'door' })
      .cyl([0.02, 0.06, 0.02], [-0.16, 0.22, 0.16], { color: 'black' })
      .cyl([0.02, 0.06, 0.02], [-0.16, 0.1, 0.16], { color: 'black' })
      .box([0.36, 0.02, 0.3], [0, 0.01, 0], { color: 'black' })
      .done(),
  ),
  e('studio', 'places', 'rooms', () => {
    const b = m('studio')
      .box([3, 0.1, 3], [0, 0.05, 0], { color: 'lightwood' })
      .box([3, 2.8, 0.25], [0, 1.4, -1.4], { color: 'cream' })
      .box([0.25, 2.8, 3], [-1.4, 1.4, 0], { color: 'cream' })
      .box([1.0, 1.0, 0.04], [0.8, 1.6, -1.26], { color: 'glass' })
      .label('STUDIO', [1.2, 0.3], [-0.4, 2.45, -1.26], { color: 'white' })
      .box([0.7, 0.9, 0.04], [0, 1.25, 0.3], { color: 'white' })
      .ball([0.25, 0.2, 0.01], [-0.1, 1.35, 0.325], { color: 'orange', noInk: true })
      .ball([0.2, 0.25, 0.01], [0.15, 1.15, 0.325], { color: 'blue', noInk: true })
      .ball([0.3, 0.1, 0.01], [0.0, 0.95, 0.325], { color: 'green', noInk: true })
      .rod([0, 0.1, 0.5], [0, 1.8, 0.26], 0.04, 'wood')
      .rod([-0.35, 0.1, 0.45], [0, 1.7, 0.26], 0.04, 'wood')
      .rod([0.35, 0.1, 0.45], [0, 1.7, 0.26], 0.04, 'wood')
      .box([0.75, 0.04, 0.08], [0, 0.78, 0.33], { color: 'wood' })
      .cyl([0.4, 0.05, 0.4], [0.9, 0.6, 0.6], { color: 'red' })
      .stick([0.9, 0.1, 0.6], [0.9, 0.58, 0.6], 0.05, 'darkgray');
    return b.done();
  }),
  e('stuffing', 'food', 'side dishes', () => {
    const b = bowl(m('stuffing'), 0.18, 0.08, 'white', '#b07a3a');
    for (const [x, z] of around(7, 0.05)) b.ball([0.035, 0.03, 0.03], [x, 0.085, z], { color: (x > 0 ? '#c08a4a' : '#9a6a3a') });
    b.ball([0.05, 0.04, 0.05], [0, 0.095, 0], { color: '#c08a4a' })
      .ball([0.015, 0.01, 0.015], [0.02, 0.11, 0.02], { color: 'green', noInk: true })
      .ball([0.015, 0.01, 0.015], [-0.03, 0.1, 0.0], { color: 'green', noInk: true });
    return b.done();
  }),
  e('stump', 'garden', 'trees', () => stump(m('stump'), 0, 0, 0.45, 0.4).ball([0.06, 0.03, 0.06], [0.2, 0.06, 0.18], { color: 'red' }).stick([0.2, 0, 0.18], [0.2, 0.05, 0.18], 0.02, 'cream').done()),
  e('stumps', 'garden', 'trees', () => {
    const b = m('stumps');
    stump(b, -0.3, 0, 0.42, 0.45);
    stump(b, 0.25, 0.15, 0.32, 0.28);
    stump(b, 0.15, -0.35, 0.26, 0.18);
    return b.done();
  }),
  e('stun gun', 'armory', 'sidearms', () =>
    m('stun gun', { view: 'side' })
      .box([0.035, 0.05, 0.14], [0, 0.11, 0], { color: 'yellow', round: 0.3 })
      .box([0.03, 0.1, 0.04], [0, 0.05, -0.045], { color: 'black', rot: [-15, 0, 0], round: 0.3 })
      .box([0.04, 0.052, 0.03], [0, 0.11, 0.08], { color: 'black', round: 0.2 })
      .torus([0.04, 0.035, 0.008], [0, 0.075, 0.0], { color: 'black', rot: [0, 90, 0], tube: 0.18 })
      .rod([0, 0.11, 0.1], [0.01, 0.13, 0.12], 0.008, 'cyan', { glow: true })
      .rod([0.01, 0.13, 0.12], [-0.01, 0.1, 0.14], 0.008, 'cyan', { glow: true })
      .rod([-0.01, 0.1, 0.14], [0.01, 0.12, 0.16], 0.008, 'cyan', { glow: true })
      .done(),
  ),
  e('stylus', 'tech', 'accessories', () =>
    m('stylus')
      .cyl([0.04, 0.015, 0.04], [0, 0.0075, 0], { color: 'darkgray' })
      .capsule([0.014, 0.13, 0.014], [0, 0.075, 0], { color: 'white' })
      .cone([0.012, 0.025, 0.012], [0, 0.15, 0], { color: 'gray' })
      .box([0.004, 0.04, 0.006], [0, 0.06, 0.009], { color: 'silver' })
      .done(),
  ),
  e('submarine (boat)', 'garage', 'boats', () => {
    const c = '#3a4a5a';
    return m('submarine (boat)', { view: 'side' })
      .capsule([2.4, 11, 2.4], [0, 1.3, 0], { color: c, rot: [90, 0, 0] })
      .box([2.42, 0.25, 9.5], [0, 0.5, 0], { color: 'darkred', noInk: true })
      .box([0.75, 1.6, 2.2], [0, 3.0, 1.6], { color: c, round: 0.4 })
      .box([2.0, 0.1, 0.5], [0, 3.1, 1.8], { color: c })
      .stick([0, 3.7, 1.9], [0, 4.5, 1.9], 0.12, 'darkgray')
      .stick([0, 4.5, 1.9], [0, 4.5, 2.2], 0.12, 'darkgray')
      .box([0.12, 2.0, 0.9], [0, 1.3, -5.0], { color: c })
      .box([2.0, 0.12, 0.9], [0, 1.3, -5.0], { color: c })
      .cone([0.5, 0.5, 0.5], [0, 1.3, -5.75], { color: 'brass', rot: [-90, 0, 0] })
      .box([0.2, 1.3, 0.06], [0, 1.3, -5.85], { color: 'brass', name: 'fan' })
      .box([1.3, 0.2, 0.06], [0, 1.3, -5.85], { color: 'brass', parent: 'fan' })
      .done();
  }),
  e('subway', 'places', 'stations', () => {
    const b = m('subway')
      .box([3, 0.26, 3], [0, 0.13, 0], { color: 'stone' })
      .box([1.2, 0.04, 1.8], [0, 0.25, 0.3], { color: 'black' })
      .box([1.6, 0.6, 0.12], [0, 1.6, -1.0], { color: 'darkgreen', round: 0.2 })
      .label('SUBWAY', [1.4, 0.4], [0, 1.6, -0.93], { color: 'white' });
    b.pair((s) => {
      b.stick([s * 0.7, 0.2, -0.6], [s * 0.7, 0.2, 1.2], 0.05, 'darkgreen');
      b.stick([s * 0.7, 1.0, -0.6], [s * 0.7, 1.0, 1.2], 0.05, 'darkgreen');
      for (const z of [-0.6, 0.3, 1.2]) b.stick([s * 0.7, 0.2, z], [s * 0.7, 1.0, z], 0.05, 'darkgreen');
      b.stick([s * 0.75, 0.2, -1.0], [s * 0.75, 1.95, -1.0], 0.08, 'darkgreen');
      b.ball(0.3, [s * 0.75, 2.1, -1.0], { color: 'lime', glow: true });
    });
    b.each(3, (i) => b.box([1.1, 0.04, 0.3], [0, 0.26, -0.3 + i * 0.4], { color: 'darkgray', noInk: true }));
    return b.done();
  }),
  e('subway car', 'garage', 'trains', () => subcar(m('subway car', { view: 'side' }), 0, 12, 5).done()),
  e('subway train', 'garage', 'trains', () => {
    const b = m('subway train', { view: 'side' });
    subcar(b, 4.3, 8.4, 3);
    subcar(b, -4.3, 8.4, 3);
    b.box([1.6, 2.2, 0.4], [0, 1.6, 0], { color: 'darkgray' })
      .box([2.0, 1.0, 0.05], [0, 2.1, 8.53], { color: 'glass' })
      .ball([0.3, 0.2, 0.06], [0.8, 1.0, 8.53], { color: 'yellow', glow: true })
      .ball([0.3, 0.2, 0.06], [-0.8, 1.0, 8.53], { color: 'yellow', glow: true });
    return b.done();
  }),
  e('suction cup', 'home', 'household', () =>
    m('suction cup')
      .cyl([0.065, 0.02, 0.065], [0, 0.01, 0], { color: 'orange', taper: 0.45 })
      .cyl([0.016, 0.03, 0.016], [0, 0.035, 0], { color: 'orange' })
      .torus([0.03, 0.03, 0.006], [0, 0.06, 0.0], { color: 'silver', tube: 0.18, rot: [0, 90, 0] })
      .done(),
  ),
  e('sugar', 'food', 'baking', () =>
    m('sugar')
      .box([0.1, 0.14, 0.06], [0, 0.07, 0], { color: 'paper', round: 0.15 })
      .box([0.1, 0.03, 0.03], [0, 0.152, 0], { color: 'paper', round: 0.3 })
      .label('SUGAR', [0.08, 0.04], [0, 0.08, 0.031], { color: 'skyblue' })
      .ball([0.07, 0.025, 0.05], [0.085, 0.008, 0.05], { color: 'white' })
      .done(),
  ),
  e('sugar cube', 'food', 'baking', () =>
    m('sugar cube')
      .box(0.03, [-0.017, 0.015, 0], { color: 'white', round: 0.15 })
      .box(0.03, [0.017, 0.015, 0.005], { color: 'white', round: 0.15 })
      .box(0.03, [0, 0.045, 0.002], { color: 'white', round: 0.15, rot: [0, 15, 0] })
      .done(),
  ),
  e('suit of armor (clothes)', 'armory', 'armour', () =>
    who('suit of armor (clothes)', { top: 'steel', bottom: 'steel', shoes: 'iron', long: true, style: 'none', acc: [hat('helmet', 'steel'), wear('armor', 'silver'), held('sword'), held('shield', 'red', 'L')] }),
  ),
  e('suit of armor (decor)', 'home', 'decor', () => {
    const b = m('suit of armor (decor)')
      .box([0.7, 0.15, 0.5], [0, 0.075, 0], { color: 'darkwood' })
      .cyl([0.4, 0.16, 0.26], [0, 0.92, 0], { color: 'silver', taper: 0.85 })
      .box([0.42, 0.5, 0.26], [0, 1.2, 0], { color: 'silver', round: 0.5 })
      .ball([0.26, 0.3, 0.28], [0, 1.62, 0], { color: 'silver' })
      .box([0.18, 0.025, 0.02], [0, 1.64, 0.135], { color: 'black', noInk: true })
      .cone([0.08, 0.2, 0.08], [0, 1.84, -0.02], { color: 'red' })
      .stick([0.42, 0.15, 0.05], [0.42, 2.05, 0.05], 0.035, 'darkwood')
      .ball([0.04, 0.22, 0.2], [0.42, 1.85, 0.12], { color: 'steel' })
      .cone([0.05, 0.14, 0.05], [0.42, 2.1, 0.05], { color: 'steel' });
    b.pair((s) => {
      b.capsule([0.14, 0.78, 0.15], [s * 0.11, 0.54, 0], { color: 'silver' });
      b.ball(0.12, [s * 0.11, 0.52, 0.04], { color: 'steel' });
      b.box([0.13, 0.07, 0.24], [s * 0.11, 0.185, 0.04], { color: 'steel', round: 0.4 });
      b.ball([0.2, 0.13, 0.22], [s * 0.27, 1.42, 0], { color: 'steel' });
      b.capsule([0.1, 0.55, 0.1], [s * 0.3, 1.12, 0], { color: 'silver' });
      b.ball(0.11, [s * 0.31, 0.83, 0.02], { color: 'steel' });
    });
    return b.done();
  }),
  e('suitcase', 'wardrobe', 'bags', () => {
    const b = m('suitcase')
      .box([0.45, 0.6, 0.25], [0, 0.34, 0], { color: 'teal', round: 0.2 })
      .stick([-0.12, 0.86, -0.08], [0.12, 0.86, -0.08], 0.03, 'black')
      .box([0.12, 0.03, 0.04], [0, 0.65, 0.0], { color: 'black' })
      .box([0.1, 0.08, 0.005], [-0.1, 0.45, 0.126], { color: 'yellow', noInk: true })
      .box([0.08, 0.1, 0.005], [0.12, 0.25, 0.126], { color: 'pink', noInk: true, rot: [0, 0, 15] });
    b.pair((s) => {
      b.stick([s * 0.12, 0.64, -0.08], [s * 0.12, 0.86, -0.08], 0.02, 'silver');
      b.ball(0.06, [s * 0.17, 0.03, -0.1], { color: 'black' });
      b.box([0.02, 0.56, 0.005], [s * 0.08, 0.34, 0.126], { color: '#2f8a84', noInk: true });
    });
    return b.done();
  }),
  e('sulfur', 'nature', 'minerals', () => {
    const b = m('sulfur').ball([0.14, 0.05, 0.11], [0, 0.02, 0], { color: 'rock' });
    const xs: Array<[number, number, number, number]> = [[0, 0, 0, 0.09], [0.03, 0.02, -25, 0.07], [-0.03, -0.01, 20, 0.07], [0.01, 0.03, -10, 0.06], [-0.02, 0.025, 30, 0.05], [0.04, -0.02, -40, 0.05]];
    for (const [x, z, r, h] of xs) b.cyl([0.03, h, 0.03], [x + Math.sin(-r * D) * h * 0.5, 0.04 + Math.cos(r * D) * h * 0.5, z], { color: 'yellow', taper: 0.35, rot: [0, 0, r] });
    return b.done();
  }),
  e('sundial', 'garden', 'garden decor', () => {
    const b = m('sundial')
      .cyl([0.22, 0.08, 0.22], [0, 0.04, 0], { color: 'stone' })
      .cyl([0.12, 0.3, 0.12], [0, 0.23, 0], { color: 'stone' })
      .cyl([0.36, 0.04, 0.36], [0, 0.4, 0], { color: 'stone' })
      .cyl([0.3, 0.01, 0.3], [0, 0.425, 0], { color: 'brass' })
      .wedge([0.14, 0.09, 0.012], [0, 0.475, 0.0], { color: 'bronze', rot: [0, 90, 0], apex: -0.5 });
    b.each(9, (i) => {
      const a = ((i - 4) * 20 * Math.PI) / 180;
      b.box([0.008, 0.004, 0.03], [Math.sin(a) * 0.12, 0.432, Math.cos(a) * 0.12], { color: 'darkbrown', rot: [0, a / D, 0], noInk: true });
    });
    return b.done();
  }),
  e('sunflower', 'garden', 'flowers', () => {
    const b = m('sunflower')
      .stick([0, 0, 0], [0, 2.3, 0], 0.06, 'green')
      .rod([0, 2.25, 0], [0, 2.42, 0.06], 0.06, 'green')
      .cyl([0.45, 0.22, 0.45], [0, 2.48, 0.12], { color: 'darkbrown', rot: [90, 0, 0], name: 'head' });
    b.each(14, (i) => {
      const a = (i * 2 * Math.PI) / 14;
      b.ball([0.11, 0.24, 0.04], xy(0, 2.48, 0.32, a, 0.14), { color: i % 2 ? 'yellow' : 'gold', rot: [0, 0, -a / D], parent: 'head' });
    });
    b.pair((s) => {
      b.ball([0.32, 0.05, 0.18], [s * 0.17, 1.0, 0], { color: 'leaf', rot: [0, 0, s * 20] });
      b.ball([0.26, 0.05, 0.16], [s * 0.14, 1.6, 0.02], { color: 'leaf', rot: [0, 0, s * 25] });
    });
    return b.done();
  }),
  e('sunflower seed', 'food', 'nuts and seeds', () => {
    const b = m('sunflower seed')
      .ball([0.024, 0.048, 0.013], [0, 0.024, 0], { color: 'black' })
      .ball([0.024, 0.048, 0.013], [0.035, 0.007, 0.01], { color: 'black', rot: [0, 30, 90] });
    for (const x of [-0.006, 0.006]) b.box([0.003, 0.034, 0.004], [x, 0.024, 0.006], { color: 'white', noInk: true });
    return b.done();
  }),
  e('sunglasses', 'wardrobe', 'eyewear', () => {
    const b = m('sunglasses').stick([-0.015, 0.042, 0], [0.015, 0.042, 0], 0.006, 'black');
    b.pair((s) => {
      b.ball([0.056, 0.046, 0.012], [s * 0.035, 0.03, 0], { color: 'black' });
      b.stick([s * 0.064, 0.038, 0], [s * 0.068, 0.034, -0.12], 0.006, 'black');
      b.stick([s * 0.068, 0.034, -0.12], [s * 0.068, 0.006, -0.14], 0.006, 'black');
    });
    return b.done();
  }),
  e('sunscreen', 'sports', 'beach gear', () =>
    m('sunscreen')
      .cyl([0.045, 0.022, 0.032], [0, 0.011, 0], { color: 'white' })
      .cyl([0.06, 0.12, 0.04], [0, 0.08, 0], { color: 'orange' })
      .ball([0.06, 0.03, 0.04], [0, 0.14, 0], { color: 'orange' })
      .label('SPF 50', [0.05, 0.025], [0, 0.065, 0.021], { color: 'white' })
      .ball([0.025, 0.025, 0.006], [0, 0.105, 0.019], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('supercomputer', 'tech', 'computers', () => {
    const b = m('supercomputer');
    b.each(3, (k) => {
      const x = (k - 1) * 0.65;
      b.box([0.6, 2.0, 0.9], [x, 1.0, 0], { color: 'black', round: 0.05 });
      b.box([0.5, 1.8, 0.02], [x, 1.0, 0.455], { color: ['blue', 'red', 'blue'][k], round: 0.2 });
      b.each(6, (i) => b.ball(0.04, [x + (i % 2 ? 0.1 : -0.1), 1.5 - Math.floor(i / 2) * 0.25, 0.47], { color: ['lime', 'yellow', 'cyan'][(i + k) % 3], glow: true }));
    });
    return b.done();
  }),
  e('superhero costume', 'wardrobe', 'costumes', () =>
    who('superhero costume', { top: 'blue', bottom: 'blue', shoes: 'red', long: true, acc: [wear('cape', 'red'), face('mask', 'black'), wear('belt', 'gold'), wear('badge', 'yellow')] }),
  ),
  e('surfboard', 'sports', 'water sports', () =>
    m('surfboard')
      .capsule([0.5, 2.3, 0.07], [0, 1.2, 0], { color: 'cyan' })
      .box([0.04, 2.1, 0.006], [0, 1.2, 0.034], { color: 'red', noInk: true })
      .box([0.48, 0.12, 0.006], [0, 1.7, 0.034], { color: 'yellow', noInk: true, round: 0.5 })
      .box([0.02, 0.18, 0.15], [0, 0.35, -0.1], { color: 'darkgray' })
      .ball([0.7, 0.26, 0.5], [0, 0.08, 0], { color: 'sand' })
      .done(),
  ),
  e('surge protector', 'tech', 'cables', () => {
    const b = m('surge protector')
      .box([0.36, 0.045, 0.07], [0, 0.0225, 0], { color: 'white', round: 0.3 })
      .box([0.03, 0.01, 0.03], [0.15, 0.048, 0], { color: 'red', glow: true })
      .rod([-0.18, 0.02, 0], [-0.26, 0.012, 0.05], 0.012, 'white')
      .rod([-0.26, 0.012, 0.05], [-0.32, 0.012, 0.1], 0.012, 'white')
      .box([0.04, 0.03, 0.04], [-0.34, 0.015, 0.12], { color: 'white' });
    b.each(5, (i) => b.box([0.036, 0.004, 0.036], [-0.13 + i * 0.055, 0.046, 0], { color: 'darkgray', noInk: true }));
    return b.done();
  }),
  e('surgical mask', 'clinic', 'medical', () => {
    const b = m('surgical mask')
      .box([0.17, 0.1, 0.03], [0, 0.055, 0], { color: 'skyblue', round: 0.5 })
      .box([0.08, 0.006, 0.006], [0, 0.098, 0.016], { color: 'white', noInk: true });
    b.each(3, (i) => b.box([0.16, 0.004, 0.004], [0, 0.03 + i * 0.022, 0.016], { color: '#8cc4ea', noInk: true }));
    b.pair((s) => b.torus([0.07, 0.08, 0.006], [s * 0.1, 0.055, -0.03], { color: 'white', rot: [0, 90, 0], tube: 0.12 }));
    return b.done();
  }),
  e('survival knife', 'armory', 'knives', () => {
    const b = m('survival knife')
      .ball(0.032, [0, 0.016, 0], { color: 'steel' })
      .capsule([0.03, 0.12, 0.026], [0, 0.07, 0], { color: 'olive' })
      .box([0.075, 0.014, 0.03], [0, 0.135, 0], { color: 'steel' })
      .box([0.045, 0.15, 0.007], [0, 0.215, 0], { color: 'steel' })
      .cone([0.045, 0.06, 0.007], [0.0, 0.32, 0], { color: 'steel', apex: 0 });
    b.each(4, (i) => b.cone([0.01, 0.012, 0.007], [-0.024, 0.17 + i * 0.022, 0], { color: 'steel', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('sushi', 'food', 'asian food', () =>
    m('sushi')
      .box([0.26, 0.02, 0.14], [0, 0.015, 0], { color: 'lightwood' })
      .box([0.07, 0.03, 0.04], [-0.06, 0.04, 0], { color: 'white', round: 0.8 })
      .box([0.08, 0.014, 0.045], [-0.06, 0.061, 0], { color: 'orange', round: 0.6 })
      .box([0.004, 0.004, 0.04], [-0.07, 0.069, 0], { color: 'white', noInk: true, rot: [0, 0, 20] })
      .box([0.004, 0.004, 0.04], [-0.05, 0.069, 0], { color: 'white', noInk: true, rot: [0, 0, 20] })
      .cyl([0.05, 0.035, 0.05], [0.04, 0.0425, 0], { color: 'black' })
      .cyl([0.044, 0.004, 0.044], [0.04, 0.06, 0], { color: 'white' })
      .cyl([0.016, 0.006, 0.016], [0.04, 0.062, 0], { color: 'orange' })
      .cyl([0.05, 0.035, 0.05], [0.095, 0.0425, 0.02], { color: 'black' })
      .cyl([0.044, 0.004, 0.044], [0.095, 0.06, 0.02], { color: 'white' })
      .cyl([0.016, 0.006, 0.016], [0.095, 0.062, 0.02], { color: 'green' })
      .ball([0.02, 0.012, 0.02], [0.1, 0.03, -0.045], { color: 'lime' })
      .done(),
  ),
  e('suspenders', 'wardrobe', 'accessories', () => {
    const b = m('suspenders')
      .cyl([0.3, 0.08, 0.3], [0, 0.04, 0], { color: 'darkwood' })
      .stick([0, 0.08, -0.05], [0, 0.85, -0.05], 0.035, 'darkwood')
      .stick([-0.2, 0.85, 0], [0.2, 0.85, 0], 0.025, 'wood')
      .torus([0.06, 0.06, 0.008], [0, 0.98, 0], { color: 'silver', rot: [0, 90, 0], tube: 0.15 });
    b.pair((s) => {
      b.rod([0, 0.95, 0], [s * 0.2, 0.85, 0], 0.025, 'wood');
      b.box([0.035, 0.68, 0.01], [s * 0.12, 0.5, 0.02], { color: 'red' });
      b.box([0.045, 0.04, 0.02], [s * 0.12, 0.15, 0.02], { color: 'silver' });
    });
    return b.done();
  }),
  e('suspension bridge', 'places', 'bridges', () => {
    const b = m('suspension bridge')
      .box([9, 0.05, 3], [0, 0.025, 0], { color: 'water' })
      .box([8.4, 0.25, 0.9], [0, 1.0, 0], { color: 'darkgray' });
    const cy = (x: number) => (Math.abs(x) <= 2.5 ? 1.4 + 2.1 * (x / 2.5) ** 2 : 3.5 - ((Math.abs(x) - 2.5) / 1.5) * 2.4);
    b.pair((s) => {
      b.box([0.7, 1.0, 0.7], [s * 4.1, 0.5, 0], { color: 'stone' });
      b.box([0.7, 0.9, 1.3], [s * 2.5, 0.45, 0], { color: 'stone' });
      for (const z of [0.4, -0.4]) b.box([0.25, 3.5, 0.25], [s * 2.5, 1.75 + 0.2, z], { color: 'red' });
      b.box([0.25, 0.2, 1.05], [s * 2.5, 3.4, 0], { color: 'red' });
      b.box([0.25, 0.2, 1.05], [s * 2.5, 2.3, 0], { color: 'red' });
      for (const z of [0.4, -0.4]) {
        const xs = [-4, -3.2, -2.5, -1.5, -0.6, 0, 0.6, 1.5, 2.5, 3.2, 4];
        for (let i = 0; i + 1 < xs.length; i++) b.rod([xs[i], cy(xs[i]), z], [xs[i + 1], cy(xs[i + 1]), z], 0.06, 'red');
        if (s > 0) for (const x of [-2, -1, 0, 1, 2]) b.stick([x, cy(x), z], [x, 1.1, z], 0.025, 'red');
      }
    });
    return b.done();
  }),
  e('suv', 'garage', 'cars', () => {
    const b = m('suv', { view: 'side' })
      .box([1.9, 0.8, 4.6], [0, 0.85, 0], { color: 'darkgreen', round: 0.3 })
      .box([1.8, 0.65, 2.9], [0, 1.55, -0.3], { color: 'darkgreen', round: 0.2 })
      .box([1.82, 0.45, 2.7], [0, 1.58, -0.25], { color: 'glass', round: 0.2 })
      .torus([0.72, 0.72, 0.24], [0, 0.95, -2.42], { color: 'rubber', tube: 0.38 })
      .box([1.95, 0.2, 0.2], [0, 0.5, 2.3], { color: 'black' });
    b.pair((s) => {
      b.stick([s * 0.75, 1.92, -1.6], [s * 0.75, 1.92, 1.0], 0.05, 'black');
      b.ball([0.3, 0.16, 0.06], [s * 0.65, 1.0, 2.3], { color: 'yellow', glow: true });
    });
    return wheels(b, 0.92, [1.45, -1.45], 0.78, 0.3).done();
  }),
  e('swat van', 'garage', 'trucks', () => {
    const b = m('swat van', { view: 'side' })
      .box([2.2, 2.2, 5.0], [0, 1.45, -0.5], { color: 'black', round: 0.1 })
      .box([2.1, 1.0, 1.1], [0, 1.0, 2.5], { color: 'black', round: 0.2 })
      .box([1.9, 0.6, 0.05], [0, 1.95, 2.0], { color: 'glass', rot: [-15, 0, 0] })
      .box([2.2, 0.35, 0.3], [0, 0.55, 3.1], { color: 'darkgray' })
      .box([0.7, 0.15, 0.3], [-0.35, 2.64, 0.8], { color: 'red', glow: true })
      .box([0.7, 0.15, 0.3], [0.35, 2.64, 0.8], { color: 'blue', glow: true })
      .label('SWAT', [1.6, 0.5], [1.11, 1.5, -0.6], { color: 'black', rot: [0, 90, 0] })
      .label('SWAT', [1.6, 0.5], [-1.11, 1.5, -0.6], { color: 'black', rot: [0, -90, 0] });
    return wheels(b, 1.0, [2.3, -1.9], 0.95, 0.35).done();
  }),
  e('sweater', 'wardrobe', 'tops', () => {
    const b = shirt('sweater', 'darkgreen', 'long', 'white')
      .box([0.47, 0.07, 0.15], [0, 0.035, 0], { color: '#2f5f2a', round: 0.4 });
    b.each(5, (i) => b.ball([0.05, 0.05, 0.01], [-0.16 + i * 0.08, 0.42, 0.072], { color: 'white', noInk: true, rot: [0, 0, 45] }));
    b.pair((s) => b.box([0.1, 0.06, 0.1], [s * 0.355, 0.07, 0], { color: '#2f5f2a', round: 0.4 }));
    return b.done();
  }),
  e('sweatpants', 'wardrobe', 'pants', () => {
    const b = trousers('sweatpants', 'gray', 0.95, 'darkgray');
    b.pair((s) => {
      b.box([0.19, 0.07, 0.17], [s * 0.105, 0.035, 0], { color: 'darkgray', round: 0.4 });
      b.rod([s * 0.03, 0.92, 0.1], [s * 0.04, 0.78, 0.1], 0.012, 'white');
    });
    return b.done();
  }),
  e('swim trunks', 'wardrobe', 'swimwear', () => {
    const b = trousers('swim trunks', 'orange', 0.5, 'white');
    b.pair((s) => b.box([0.01, 0.34, 0.165], [s * 0.2, 0.2, 0], { color: 'white', noInk: true }));
    b.each(3, (i) => b.ball([0.05, 0.05, 0.01], [-0.12 + i * 0.12, 0.25 - (i % 2) * 0.1, 0.09], { color: 'yellow', noInk: true }));
    return b.done();
  }),
  e('swimfin', 'sports', 'swim gear', () =>
    m('swimfin')
      .ball([0.11, 0.2, 0.11], [0, 0.1, 0], { color: 'black' })
      .cyl([0.15, 0.48, 0.024], [0, 0.43, 0], { color: 'blue', taper: 1.7 })
      .stick([-0.08, 0.2, 0.012], [-0.12, 0.64, 0.012], 0.02, 'navy', { noInk: true })
      .stick([0.08, 0.2, 0.012], [0.12, 0.64, 0.012], 0.02, 'navy', { noInk: true })
      .done(),
  ),
  e('swimsuit', 'wardrobe', 'swimwear', () => {
    const b = m('swimsuit')
      .box([0.3, 0.34, 0.13], [0, 0.5, 0], { color: 'magenta', round: 0.5 })
      .ball([0.32, 0.22, 0.14], [0, 0.3, 0], { color: 'magenta' })
      .cone([0.12, 0.2, 0.1], [0, 0.12, 0], { color: 'magenta', rot: [180, 0, 0] });
    b.pair((s) => b.box([0.05, 0.16, 0.06], [s * 0.1, 0.72, 0], { color: 'magenta' }));
    b.each(5, (i) => b.ball([0.03, 0.03, 0.01], [-0.09 + (i % 3) * 0.09, 0.36 + Math.floor(i / 3) * 0.16, 0.07], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('swing', 'toys', 'playground', () => {
    const b = m('swing').stick([-1.25, 2.3, 0], [1.25, 2.3, 0], 0.2, 'blue');
    b.pair((s) => {
      b.stick([s * 1.25, 0, 0.6], [s * 1.15, 2.3, 0], 0.1, 'blue');
      b.stick([s * 1.25, 0, -0.6], [s * 1.15, 2.3, 0], 0.1, 'blue');
      const x = s * 0.5;
      b.stick([x - 0.25, 2.25, 0], [x - 0.25, 0.5, 0], 0.025, 'steel');
      b.stick([x + 0.25, 2.25, 0], [x + 0.25, 0.5, 0], 0.025, 'steel');
      b.box([0.6, 0.05, 0.22], [x, 0.48, 0], { color: s > 0 ? 'red' : 'yellow' });
    });
    return b.done();
  }),
  e('swiss cheese', 'food', 'dairy', () => {
    const b = m('swiss cheese').wedge([0.22, 0.18, 0.1], [0, 0.05, 0], { color: 'cheese', rot: [90, 0, 0] });
    const hole = (p: V, n: V, d: number) => b.stick([p[0] - n[0] * 0.006, p[1] - n[1] * 0.006, p[2] - n[2] * 0.006], [p[0] + n[0] * 0.002, p[1] + n[1] * 0.002, p[2] + n[2] * 0.002], d, '#d9a830', { noInk: true });
    hole([-0.03, 0.1, -0.04], [0, 1, 0], 0.035);
    hole([0.03, 0.1, 0.0], [0, 1, 0], 0.025);
    hole([-0.005, 0.1, 0.045], [0, 1, 0], 0.018);
    hole([0.055, 0.05, 0.0], [0.85, 0, 0.52], 0.035);
    hole([0.075, 0.025, -0.04], [0.85, 0, 0.52], 0.02);
    hole([-0.06, 0.06, -0.01], [-0.85, 0, 0.52], 0.03);
    return b.done();
  }),
  e('swiss roll', 'food', 'cakes', () => {
    const b = m('swiss roll')
      .cyl([0.36, 0.012, 0.28], [0, 0.006, 0], { color: 'white' })
      .cyl([0.12, 0.25, 0.12], [0.03, 0.072, -0.04], { color: '#d9a35f', rot: [0, 0, 90] })
      .torus([0.09, 0.09, 0.008], [0.156, 0.072, -0.04], { color: 'cream', rot: [0, 90, 0], tube: 0.18 })
      .torus([0.045, 0.045, 0.008], [0.156, 0.072, -0.04], { color: 'red', rot: [0, 90, 0], tube: 0.3 })
      .cyl([0.12, 0.03, 0.12], [-0.06, 0.072, 0.09], { color: '#d9a35f', rot: [90, 0, 0] })
      .torus([0.09, 0.09, 0.008], [-0.06, 0.072, 0.106], { color: 'cream', tube: 0.18 })
      .torus([0.045, 0.045, 0.008], [-0.06, 0.072, 0.106], { color: 'red', tube: 0.3 });
    b.each(4, (i) => b.ball(0.012, [-0.06 + i * 0.06, 0.13, -0.04], { color: 'white', noInk: true }));
    return b.done();
  }),
  e('switch', 'home', 'electrical', () =>
    m('switch')
      .box([0.075, 0.12, 0.012], [0, 0.06, 0], { color: 'white', round: 0.3 })
      .box([0.03, 0.05, 0.006], [0, 0.06, 0.008], { color: 'lightgray' })
      .box([0.015, 0.03, 0.02], [0, 0.068, 0.014], { color: 'cream', rot: [-20, 0, 0] })
      .ball(0.006, [0, 0.105, 0.007], { color: 'gray' })
      .ball(0.006, [0, 0.015, 0.007], { color: 'gray' })
      .done(),
  ),
  e('synagogue', 'places', 'places of worship', () => {
    const b = m('synagogue')
      .box([6, 4, 4], [0, 2, 0], { color: 'sand', round: 0.05 })
      .wedge([6.2, 1.6, 4.2], [0, 4.8, 0], { color: '#c9a46a' })
      .box([1.2, 2.0, 0.1], [0, 1.0, 2.04], { color: 'darkwood', name: 'door', pivot: [-0.6, 1.0, 2.04] })
      .cyl([1.2, 0.1, 1.2], [0, 2.0, 2.04], { color: 'darkwood', rot: [90, 0, 0] })
      .label('SYNAGOGUE', [3, 0.4], [0, 3.3, 2.06], { color: 'white' });
    const st = (a: number): V => xy(0, 4.7, 0.6, a, 2.12);
    for (const off of [0, Math.PI]) for (let k = 0; k < 3; k++) b.rod(st(off + (k * 2 * Math.PI) / 3), st(off + ((k + 1) * 2 * Math.PI) / 3), 0.08, 'gold');
    b.pair((s) => {
      b.box([1.4, 6, 1.4], [s * 3.4, 3, 0.8], { color: 'sand', round: 0.05 });
      b.ball([1.4, 1.3, 1.4], [s * 3.4, 6.2, 0.8], { color: 'gold' });
      b.box([0.6, 1.6, 0.1], [s * 1.6, 2.0, 2.04], { color: 'glass' });
      b.cyl([0.6, 0.1, 0.6], [s * 1.6, 2.8, 2.04], { color: 'glass', rot: [90, 0, 0] });
      b.box([0.5, 1.2, 0.1], [s * 3.4, 3.8, 1.53], { color: 'glass' });
    });
    return b.done();
  }),
  e('syringe', 'clinic', 'medical tools', () =>
    m('syringe')
      .cyl([0.04, 0.006, 0.04], [0, 0.003, 0], { color: 'white' })
      .stick([0, 0, 0], [0, 0.06, 0], 0.008, 'white')
      .box([0.05, 0.006, 0.022], [0, 0.052, 0], { color: 'white' })
      .cyl([0.022, 0.045, 0.022], [0, 0.077, 0], { color: 'glass' })
      .cyl([0.023, 0.04, 0.023], [0, 0.119, 0], { color: 'cyan' })
      .cone([0.012, 0.012, 0.012], [0, 0.145, 0], { color: 'white' })
      .stick([0, 0.15, 0], [0, 0.2, 0], 0.003, 'silver')
      .done(),
  ),
  e('tablecloth', 'home', 'linens', () => {
    const b = m('tablecloth')
      .box([1.36, 0.1, 0.86], [0, 0.71, 0], { color: 'wood' })
      .box([1.42, 0.04, 0.92], [0, 0.77, 0], { color: 'red', round: 0.3 });
    b.pair((s) => {
      b.box([1.42, 0.3, 0.02], [0, 0.62, s * 0.46], { color: 'red' });
      b.box([0.02, 0.3, 0.92], [s * 0.71, 0.62, 0], { color: 'red' });
      for (const z of [0.36, -0.36]) b.stick([s * 0.6, 0, z], [s * 0.6, 0.66, z], 0.06, 'darkwood');
    });
    b.each(12, (i) => {
      if ((i + Math.floor(i / 4)) % 2) return;
      b.box([0.175, 0.006, 0.15], [-0.53 + (i % 4) * 0.355, 0.792, -0.3 + Math.floor(i / 4) * 0.3], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('tablet (electronics)', 'tech', 'computers', () => {
    const b = m('tablet (electronics)')
      .box([0.25, 0.18, 0.018], [0, 0.1, 0], { color: 'black', rot: [-15, 0, 0], round: 0.4 })
      .box([0.225, 0.155, 0.003], [0, 0.1 + 0.01 * Math.sin(15 * D), 0.01], { color: '#3a7bd5', rot: [-15, 0, 0], glow: true })
      .box([0.1, 0.12, 0.01], [0, 0.06, -0.05], { color: 'darkgray', rot: [30, 0, 0] });
    b.each(6, (i) => b.box([0.03, 0.03, 0.003], [-0.07 + (i % 3) * 0.07, 0.13 - Math.floor(i / 3) * 0.05, 0.022 + Math.floor(i / 3) * 0.012], { color: ['red', 'lime', 'yellow', 'orange', 'pink', 'white'][i], rot: [-15, 0, 0], noInk: true }));
    return b.done();
  }),
  e('tabloid', 'study', 'newspapers', () =>
    m('tabloid')
      .box([0.3, 0.4, 0.03], [0, 0.2, 0], { color: 'paper', round: 0.05 })
      .box([0.28, 0.07, 0.004], [0, 0.35, 0.016], { color: 'red' })
      .label('GOSSIP', [0.22, 0.05], [0, 0.35, 0.02], { color: 'red' })
      .label('SHOCK!', [0.26, 0.06], [0, 0.27, 0.017], { color: 'paper' })
      .box([0.12, 0.12, 0.004], [-0.07, 0.15, 0.016], { color: 'skyblue' })
      .box([0.1, 0.01, 0.004], [0.08, 0.19, 0.016], { color: 'gray', noInk: true })
      .box([0.1, 0.01, 0.004], [0.08, 0.16, 0.016], { color: 'gray', noInk: true })
      .box([0.1, 0.01, 0.004], [0.08, 0.13, 0.016], { color: 'gray', noInk: true })
      .done(),
  ),
  e('tack', 'study', 'stationery', () =>
    m('tack')
      .stick([0, 0, 0], [0, 0.028, 0], 0.003, 'silver')
      .cyl([0.032, 0.006, 0.032], [0, 0.03, 0], { color: 'red' })
      .ball([0.024, 0.008, 0.024], [0, 0.034, 0], { color: 'red' })
      .done(),
  ),
  e('tackle box', 'sports', 'fishing gear', () =>
    m('tackle box')
      .box([0.36, 0.14, 0.2], [0, 0.07, 0], { color: 'green', round: 0.15 })
      .box([0.36, 0.06, 0.2], [0, 0.17, 0], { color: 'darkgreen', round: 0.2, name: 'lid', pivot: [0, 0.14, -0.1] })
      .torus([0.14, 0.1, 0.02], [0, 0.215, 0], { color: 'black', tube: 0.15, parent: 'lid' })
      .box([0.03, 0.04, 0.015], [-0.1, 0.14, 0.105], { color: 'silver' })
      .box([0.03, 0.04, 0.015], [0.1, 0.14, 0.105], { color: 'silver' })
      .ball([0.04, 0.02, 0.02], [0.12, 0.208, 0.04], { color: 'red', parent: 'lid' })
      .done(),
  ),
  e('taco', 'food', 'mexican food', () => {
    const b = m('taco').ball([0.15, 0.03, 0.07], [0, 0.015, 0], { color: '#e8c25a' });
    b.pair((s) => b.ball([0.16, 0.11, 0.022], [0, 0.058, s * 0.032], { color: '#e8c25a', rot: [s * 12, 0, 0] }));
    const fill: Array<[number, string]> = [[-0.05, 'lettuce'], [-0.02, 'tomato'], [0.01, 'lettuce'], [0.04, 'meat'], [0.06, 'lettuce']];
    for (const [x, c] of fill) b.ball([0.04, 0.035, 0.04], [x, 0.1 - Math.abs(x) * 0.3, 0], { color: c });
    b.ball([0.02, 0.012, 0.02], [-0.03, 0.12, 0.005], { color: 'cheese' }).ball([0.02, 0.012, 0.02], [0.025, 0.115, -0.005], { color: 'cheese' });
    return b.done();
  }),
  e('taffy', 'food', 'candy', () =>
    m('taffy')
      .cyl([0.03, 0.05, 0.03], [0, 0.015, 0], { color: 'pink', rot: [0, 0, 90] })
      .cone([0.032, 0.022, 0.02], [0.036, 0.015, 0], { color: 'white', rot: [0, 0, 90] })
      .cone([0.032, 0.022, 0.02], [-0.036, 0.015, 0], { color: 'white', rot: [0, 0, -90] })
      .cyl([0.03, 0.05, 0.03], [0.01, 0.04, 0.02], { color: 'skyblue', rot: [0, 40, 90] })
      .done(),
  ),
  e('tag (clothes)', 'wardrobe', 'accessories', () =>
    m('tag (clothes)')
      .box([0.05, 0.075, 0.011], [0, 0.0375, 0], { color: 'tan', round: 0.15 })
      .label('$9', [0.036, 0.024], [0, 0.03, 0.006], { color: 'tan' })
      .torus([0.012, 0.012, 0.004], [0, 0.064, 0.004], { color: 'white', tube: 0.3 })
      .torus([0.035, 0.05, 0.004], [0, 0.095, 0], { color: 'red', tube: 0.1 })
      .done(),
  ),
  e('tail', 'wild', 'animal parts', () => {
    const b = m('tail');
    const pts: Array<[number, number, number, string]> = [[-0.12, 0.04, 0.08, 'orange'], [-0.07, 0.06, 0.09, 'orange'], [-0.02, 0.09, 0.09, 'orange'], [0.02, 0.13, 0.085, 'orange'], [0.045, 0.18, 0.075, 'orange'], [0.055, 0.23, 0.06, 'white'], [0.045, 0.27, 0.045, 'white']];
    for (const [x, y, d, c] of pts) b.ball(d, [x, y, 0], { color: c });
    return b.done();
  }),
  e('tambourine', 'music', 'percussion', () => {
    const c: V = [0, 0.125, 0];
    const b = m('tambourine')
      .torus([0.25, 0.25, 0.05], c, { color: 'wood', tube: 0.12 })
      .cyl([0.23, 0.01, 0.23], [0, 0.125, 0.018], { color: 'cream', rot: [90, 0, 0] });
    b.each(6, (i) => {
      const a = Math.PI * 0.3 + (i * Math.PI * 1.4) / 5;
      b.stick(xy(0, 0.125, 0.115, a), xy(0, 0.125, 0.135, a), 0.035, 'silver');
    });
    return b.done();
  }),
  e('tank', 'garage', 'military vehicles', () => {
    const b = m('tank', { view: 'side' })
      .box([2.6, 0.9, 6.0], [0, 1.05, 0], { color: 'olive', round: 0.2 })
      .box([2.2, 0.85, 2.8], [0, 1.9, -0.3], { color: 'olive', round: 0.6 })
      .stick([0, 1.95, 1.0], [0, 2.05, 4.4], 0.2, 'olive')
      .cyl([0.3, 0.3, 0.3], [0, 2.05, 4.4], { color: 'olive', rot: [90, 0, 0] })
      .cyl([0.6, 0.15, 0.6], [0.4, 2.38, -0.6], { color: '#6f7330' })
      .star(0.6, [0, 1.95, 1.12], { color: 'white', noInk: true });
    b.pair((s) => {
      b.box([0.7, 1.0, 6.4], [s * 1.35, 0.55, 0], { color: 'rubber', round: 0.9 });
      b.each(5, (i) => b.cyl([0.62, 0.1, 0.62], [s * 1.72, 0.45, -2.2 + i * 1.1], { color: 'darkgray', rot: [0, 0, 90] }));
    });
    return b.done();
  }),
  e('tanktop', 'wardrobe', 'tops', () => shirt('tanktop', 'orange', 'none', 'white').done()),
  e('tanning bed', 'home', 'beauty', () => {
    const b = m('tanning bed')
      .box([2.0, 0.6, 0.8], [0, 0.3, 0], { color: 'darkgray', round: 0.15 })
      .box([1.8, 0.04, 0.6], [0, 0.62, 0], { color: 'violet', glow: true })
      .box([2.0, 0.18, 0.8], [0, 0.97, -0.08], { color: 'silver', rot: [-25, 0, 0], round: 0.3, name: 'lid', pivot: [0, 0.72, -0.4] })
      .box([1.8, 0.02, 0.6], [0, 0.88, -0.04], { color: 'violet', rot: [-25, 0, 0], glow: true, parent: 'lid' });
    b.each(5, (i) => b.box([1.8, 0.01, 0.03], [0, 0.645, -0.24 + i * 0.12], { color: 'white', glow: true }));
    return b.done();
  }),
  e('tanning lotion', 'sports', 'beach gear', () => bottle(m('tanning lotion'), 0, 0, 0.2, 0.07, '#8a4a22', 'gold', 'orange').label('TAN', [0.05, 0.03], [0, 0.066, 0.037], { color: 'orange' }).done()),
  e('tape (sticky)', 'study', 'stationery', () =>
    m('tape (sticky)')
      .torus([0.1, 0.1, 0.05], [0, 0.05, 0], { color: 'silver', tube: 0.3 })
      .torus([0.07, 0.07, 0.052], [0, 0.05, 0], { color: 'tan', tube: 0.12 })
      .box([0.048, 0.035, 0.004], [0, 0.015, 0.035], { color: 'silver', rot: [-50, 0, 0] })
      .done(),
  ),
  e('tape dispenser', 'study', 'stationery', () =>
    m('tape dispenser', { view: 'side' })
      .box([0.07, 0.06, 0.17], [0, 0.03, 0], { color: 'black', round: 0.4 })
      .ball([0.07, 0.07, 0.09], [0, 0.07, -0.03], { color: 'black' })
      .torus([0.085, 0.085, 0.022], [0, 0.1, -0.02], { color: 'glass', rot: [0, 90, 0], tube: 0.25 })
      .torus([0.05, 0.05, 0.024], [0, 0.1, -0.02], { color: 'white', rot: [0, 90, 0], tube: 0.15 })
      .stick([0, 0.14, -0.015], [0, 0.1, 0.075], 0.006, 'glass')
      .box([0.03, 0.025, 0.012], [0, 0.09, 0.08], { color: 'silver' })
      .done(),
  ),
  e('tape measure', 'workshop', 'measuring', () => {
    const b = m('tape measure')
      .box([0.035, 0.07, 0.07], [0, 0.035, 0], { color: 'yellow', round: 0.5 })
      .cyl([0.04, 0.004, 0.04], [0.018, 0.038, 0], { color: 'black', rot: [0, 0, 90] })
      .box([0.012, 0.02, 0.012], [0, 0.072, 0.012], { color: 'red' })
      .box([0.022, 0.003, 0.18], [0, 0.0015, 0.12], { color: 'yellow' })
      .box([0.024, 0.012, 0.003], [0, 0.006, 0.21], { color: 'silver' });
    b.each(6, (i) => b.box([0.012, 0.0035, 0.003], [-0.004, 0.002, 0.05 + i * 0.026], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('tapestry', 'home', 'decor', () => {
    const b = m('tapestry')
      .stick([-0.65, 1.55, 0], [0.65, 1.55, 0], 0.035, 'darkwood')
      .box([1.04, 1.3, 0.025], [0, 0.88, 0], { color: 'gold' })
      .box([0.94, 1.2, 0.03], [0, 0.88, 0.005], { color: 'maroon' })
      .cyl([0.4, 0.01, 0.4], [0, 0.95, 0.022], { color: 'gold', rot: [90, 0, 0], noInk: true })
      .ball([0.26, 0.22, 0.01], [0, 1.0, 0.027], { color: 'darkgreen', noInk: true })
      .box([0.05, 0.16, 0.01], [0, 0.82, 0.027], { color: 'brown', noInk: true })
      .star(0.12, [-0.3, 1.3, 0.025], { color: 'gold', noInk: true })
      .star(0.12, [0.3, 1.3, 0.025], { color: 'gold', noInk: true });
    b.pair((s) => {
      b.stick([s * 0.62, 0, -0.04], [s * 0.62, 1.6, -0.04], 0.04, 'darkwood');
      b.box([0.12, 0.12, 0.4], [s * 0.62, 0.06, -0.04], { color: 'darkwood', round: 0.3 });
      b.ball(0.07, [s * 0.68, 1.55, 0], { color: 'gold' });
    });
    b.each(5, (i) => b.cone([0.04, 0.08, 0.02], [-0.36 + i * 0.18, 0.2, 0], { color: 'gold', rot: [180, 0, 0] }));
    return b.done();
  }),
  e('tar (material)', 'workshop', 'materials', () =>
    m('tar (material)')
      .cyl([0.2, 0.2, 0.2], [0, 0.1, 0], { color: 'iron', taper: 1.15 })
      .ball([0.23, 0.05, 0.23], [0, 0.2, 0], { color: 'black' })
      .ball([0.03, 0.08, 0.02], [0.06, 0.16, 0.1], { color: 'black' })
      .ball([0.025, 0.06, 0.02], [-0.07, 0.17, 0.09], { color: 'black' })
      .rod([0.02, 0.18, 0], [0.1, 0.34, -0.06], 0.02, 'wood')
      .rod([0.02, 0.18, 0], [0.05, 0.24, -0.025], 0.026, 'black')
      .ball(0.015, [-0.03, 0.225, 0.04], { color: 'gray', noInk: true })
      .done(),
  ),
  e('target', 'sports', 'archery', () => {
    const b = m('target')
      .rod([0.35, 0, 0.25], [0.2, 1.1, -0.06], 0.045, 'wood')
      .rod([-0.35, 0, 0.25], [-0.2, 1.1, -0.06], 0.045, 'wood')
      .rod([0, 0, -0.5], [0, 1.0, -0.08], 0.045, 'wood');
    const rings: Array<[number, string]> = [[0.8, 'white'], [0.64, 'black'], [0.48, 'blue'], [0.32, 'red'], [0.16, 'yellow']];
    rings.forEach(([d, c], i) => b.cyl([d, i ? 0.01 : 0.09, d], [0, 0.72, i ? 0.045 + i * 0.004 : 0], { color: c, rot: [90, 0, 0] }));
    b.stick([0.04, 0.76, 0.06], [0.16, 0.86, 0.5], 0.015, 'wood')
      .box([0.004, 0.04, 0.06], [0.155, 0.86, 0.47], { color: 'red', rot: [0, 15, 0] });
    return b.done();
  }),
  e('tarp', 'sports', 'camping gear', () => {
    const t = 40 * D;
    const b = m('tarp')
      .box([2.8, 0.03, 1.4], [0, 1.6 - 0.7 * Math.sin(t), 0.7 * Math.cos(t)], { color: 'blue', rot: [40, 0, 0] })
      .box([2.8, 0.03, 1.4], [0, 1.6 - 0.7 * Math.sin(t), -0.7 * Math.cos(t)], { color: 'blue', rot: [-40, 0, 0] })
      .stick([-1.45, 1.62, 0], [1.45, 1.62, 0], 0.02, 'tan')
      .box([0.4, 0.5, 0.3], [0.2, 0.25, 0], { color: 'red', round: 0.3 })
      .capsule([0.18, 0.6, 0.18], [-0.4, 0.09, 0.1], { color: 'green', rot: [0, 0, 90] });
    b.pair((s) => {
      b.stick([s * 1.42, 0, 0], [s * 1.42, 1.75, 0], 0.05, 'wood');
      b.rod([s * 1.42, 1.7, 0], [s * 2.0, 0.02, 0], 0.012, 'tan');
      b.cone([0.04, 0.1, 0.04], [s * 2.0, 0.05, 0], { color: 'silver' });
    });
    return b.done();
  }),
  e('tart', 'food', 'desserts', () => {
    const b = m('tart')
      .cyl([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'crust', taper: 1.1 })
      .torus([0.13, 0.13, 0.02], [0, 0.03, 0], { color: 'crust', rot: [90, 0, 0], tube: 0.15 })
      .cyl([0.11, 0.006, 0.11], [0, 0.032, 0], { color: 'cream' });
    for (const [x, z] of around(6, 0.035)) b.ball([0.025, 0.018, 0.02], [x, 0.04, z], { color: 'red' });
    b.ball(0.014, [0, 0.042, 0], { color: 'navy' }).ball(0.012, [0.012, 0.04, 0.01], { color: 'navy' });
    return b.done();
  }),
  e('tassel', 'home', 'decor', () => {
    const b = m('tassel')
      .torus([0.04, 0.05, 0.008], [0, 0.19, 0], { color: 'gold', tube: 0.15 })
      .ball([0.04, 0.05, 0.04], [0, 0.15, 0], { color: 'gold' })
      .cyl([0.03, 0.015, 0.03], [0, 0.12, 0], { color: 'red' })
      .cyl([0.05, 0.11, 0.05], [0, 0.06, 0], { color: 'gold', rot: [180, 0, 0], taper: 0.55 });
    b.each(5, (i) => b.stick([-0.016 + i * 0.008, 0.11, 0.022], [-0.024 + i * 0.012, 0.005, 0.026], 0.003, '#c08a2a', { noInk: true }));
    return b.done();
  }),
  e('tattoo', 'wardrobe', 'body art', () =>
    m('tattoo')
      .box([0.14, 0.03, 0.12], [0, 0.015, 0], { color: 'wood' })
      .capsule([0.09, 0.3, 0.08], [0, 0.17, 0], { color: 'skin2' })
      .ball([0.1, 0.1, 0.09], [0, 0.34, 0], { color: 'skin2' })
      .heart(0.06, [0, 0.18, 0.038], { color: 'red', noInk: true })
      .box([0.085, 0.022, 0.006], [0, 0.17, 0.042], { color: 'navy', noInk: true })
      .label('MOM', [0.06, 0.016], [0, 0.17, 0.044], { color: 'navy' })
      .done(),
  ),
  e('taxi stand', 'places', 'street things', () => {
    const b = m('taxi stand')
      .box([3, 0.22, 1.5], [0, 0.11, 0], { color: 'stone' })
      .stick([1.0, 0.2, 0.3], [1.0, 2.4, 0.3], 0.08, 'gray')
      .box([0.8, 0.42, 0.08], [1.0, 2.55, 0.3], { color: 'yellow', round: 0.2 })
      .label('TAXI', [0.7, 0.3], [1.0, 2.55, 0.35], { color: 'yellow' })
      .box([1.6, 0.08, 1.0], [-0.5, 2.3, -0.2], { color: 'yellow', round: 0.3 })
      .box([1.2, 0.1, 0.35], [-0.5, 0.65, -0.35], { color: 'darkwood' });
    for (const x of [-1.2, 0.2]) b.stick([x, 0.2, -0.6], [x, 2.28, -0.6], 0.07, 'gray');
    b.each(4, (i) => b.box([0.1, 0.05, 0.01], [0.7 + i * 0.2, 2.36, 0.345], { color: i % 2 ? 'black' : 'white', noInk: true }));
    return b.done();
  }),
  e('tea', 'food', 'drinks', () =>
    m('tea')
      .cyl([0.14, 0.01, 0.14], [0, 0.005, 0], { color: 'white' })
      .cyl([0.07, 0.055, 0.07], [0, 0.0375, 0], { color: 'white', taper: 1.3 })
      .cyl([0.086, 0.004, 0.086], [0, 0.064, 0], { color: 'tea' })
      .torus([0.04, 0.04, 0.01], [0.055, 0.04, 0], { color: 'white', tube: 0.2 })
      .rod([-0.03, 0.066, 0.01], [-0.05, 0.04, 0.03], 0.003, 'white')
      .label('TEA', [0.022, 0.02], [-0.05, 0.03, 0.035], { color: 'yellow' })
      .done(),
  ),
  e('teabag', 'food', 'drinks', () =>
    m('teabag')
      .box([0.06, 0.07, 0.012], [0, 0.035, 0], { color: 'paper', round: 0.3 })
      .box([0.045, 0.05, 0.003], [0, 0.032, 0.006], { color: 'tea', noInk: true })
      .box([0.012, 0.01, 0.014], [0, 0.068, 0], { color: 'silver' })
      .rod([0, 0.07, 0], [0.02, 0.12, 0], 0.003, 'white')
      .label('TEA', [0.026, 0.026], [0.025, 0.13, 0], { color: 'yellow' })
      .done(),
  ),
  e('tear gas', 'armory', 'grenades', () =>
    m('tear gas')
      .cyl([0.05, 0.12, 0.05], [0, 0.06, 0], { color: 'olive' })
      .cyl([0.052, 0.025, 0.052], [0, 0.06, 0], { color: 'yellow' })
      .cyl([0.03, 0.02, 0.03], [0, 0.13, 0], { color: 'gray' })
      .box([0.012, 0.09, 0.012], [0.03, 0.09, 0], { color: 'gray' })
      .torus([0.025, 0.025, 0.004], [-0.02, 0.14, 0], { color: 'silver', tube: 0.2 })
      .ball(0.1, [0.04, 0.19, 0], { color: '#e8e4c0' })
      .ball(0.14, [-0.02, 0.28, 0.02], { color: '#efeccf' })
      .ball(0.18, [0.05, 0.4, -0.02], { color: '#f4f2e0' })
      .done(),
  ),
  e('teddy bear', 'toys', 'stuffed toys', () => {
    const c = '#b07a45', l = '#e0b98a';
    const b = m('teddy bear')
      .ball([0.2, 0.22, 0.17], [0, 0.13, 0], { color: c })
      .ball([0.12, 0.13, 0.05], [0, 0.12, 0.07], { color: l })
      .ball(0.16, [0, 0.3, 0.01], { color: c })
      .ball([0.075, 0.055, 0.05], [0, 0.28, 0.08], { color: l })
      .ball(0.022, [0, 0.297, 0.105], { color: 'black' })
      .ball([0.03, 0.025, 0.02], [0.02, 0.225, 0.075], { color: 'red' })
      .ball([0.03, 0.025, 0.02], [-0.02, 0.225, 0.075], { color: 'red' });
    b.pair((s) => {
      b.ball(0.018, [s * 0.035, 0.325, 0.07], { color: 'black', eye: true });
      b.ball([0.06, 0.06, 0.035], [s * 0.065, 0.37, 0], { color: c });
      b.rod([s * 0.09, 0.2, 0.02], [s * 0.13, 0.11, 0.08], 0.06, c);
      b.rod([s * 0.06, 0.05, 0.03], [s * 0.08, 0.04, 0.14], 0.07, c);
      b.ball([0.06, 0.06, 0.02], [s * 0.08, 0.04, 0.175], { color: l });
    });
    return b.done();
  }),
  e('tee', 'sports', 'golf', () =>
    m('tee')
      .stick([0, 0, 0], [0, 0.042, 0], 0.007, 'white')
      .cyl([0.012, 0.012, 0.012], [0, 0.046, 0], { color: 'white', taper: 2 })
      .ball(0.043, [0, 0.0735, 0], { color: 'white' })
      .ball(0.005, [0.008, 0.08, 0.02], { color: 'lightgray', noInk: true })
      .ball(0.005, [-0.01, 0.07, 0.019], { color: 'lightgray', noInk: true })
      .done(),
  ),
  e('teeth', 'clinic', 'dental', () => {
    const b = m('teeth');
    b.each(7, (i) => {
      const a = ((i - 3) * 23 * Math.PI) / 180, x = Math.sin(a) * 0.045, z = Math.cos(a) * 0.045 - 0.02;
      b.ball([0.022, 0.02, 0.022], [x, 0.012, z], { color: 'pink' });
      b.box([0.016, 0.022, 0.012], [x, 0.03, z], { color: 'white', rot: [0, a / D, 0], round: 0.4 });
      b.box([0.016, 0.022, 0.012], [x, 0.054, z], { color: 'white', rot: [0, a / D, 0], round: 0.4 });
      b.ball([0.022, 0.02, 0.022], [x, 0.073, z], { color: 'pink' });
    });
    return b.done();
  }),
  e('telegraph', 'places', 'street things', () => {
    const b = m('telegraph').stick([0, 0, 0], [0, 4.2, 0], 0.3, 'darkwood');
    for (const y of [3.9, 3.4]) {
      b.box([1.6, 0.12, 0.12], [0, y, 0], { color: 'wood' });
      for (const x of [-0.7, -0.3, 0.3, 0.7]) {
        b.cyl([0.08, 0.1, 0.08], [x, y + 0.11, 0], { color: '#5fb39a' });
        b.stick([x, y + 0.15, -1.2], [x, y + 0.15, 1.2], 0.015, 'black');
      }
    }
    return b.done();
  }),
  e('telephone pole', 'places', 'street things', () => {
    const b = m('telephone pole')
      .stick([0, 0, 0], [0, 6.5, 0], 0.26, 'darkwood')
      .box([1.8, 0.14, 0.14], [0, 6.2, 0], { color: 'wood' })
      .cyl([0.5, 0.8, 0.5], [0, 5.2, 0.35], { color: 'gray' })
      .cyl([0.52, 0.08, 0.52], [0, 5.62, 0.35], { color: 'darkgray' });
    for (const x of [-0.75, 0, 0.75]) {
      b.cyl([0.09, 0.14, 0.09], [x, 6.34, 0], { color: 'white' });
      b.stick([x, 6.4, -1.6], [x, 6.4, 1.6], 0.02, 'black');
    }
    b.each(5, (i) => b.stick([0, 1.8 + i * 0.6, 0], [(i % 2 ? 1 : -1) * 0.25, 1.8 + i * 0.6, 0], 0.03, 'iron'));
    return b.done();
  }),
  e('telescope', 'study', 'optics', () => {
    const t = 50 * D, c: V = [0, 1.15, 0.05];
    const at = (l: number): V => [0, c[1] + l * Math.cos(t), c[2] + l * Math.sin(t)];
    const b = m('telescope')
      .box([0.1, 0.1, 0.1], [0, 0.95, 0], { color: 'darkgray' })
      .cyl([0.16, 0.9, 0.16], c, { color: 'white', rot: [50, 0, 0] })
      .cyl([0.19, 0.14, 0.19], at(0.42), { color: 'navy', rot: [50, 0, 0] })
      .stick(at(-0.45), at(-0.55), 0.04, 'black')
      .stick([0.09, c[1] + 0.05, c[2]], [0.09, at(0.3)[1] + 0.05, at(0.3)[2]], 0.04, 'darkgray');
    for (const [x, z] of around(3, 0.45, Math.PI / 2)) b.rod([0, 0.9, 0], [x, 0, z], 0.03, 'darkgray');
    return b.done();
  }),
  e('temple', 'places', 'places of worship', () => {
    const b = m('temple')
      .box([6, 0.3, 4], [0, 0.15, 0], { color: 'stone' })
      .box([5.6, 0.3, 3.6], [0, 0.45, 0], { color: 'lightgray' })
      .box([3.6, 2.8, 2.4], [0, 2.0, 0], { color: 'cream' })
      .box([5.6, 0.4, 3.6], [0, 3.6, 0], { color: 'white' })
      .wedge([5.8, 1.2, 3.8], [0, 4.4, 0], { color: 'white' })
      .label('TEMPLE', [2.2, 0.3], [0, 3.6, 1.82], { color: 'white' });
    b.each(6, (i) => {
      const x = -2.4 + i * 0.96;
      for (const z of [1.5, -1.5]) {
        b.cyl([0.4, 2.8, 0.4], [x, 2.0, z], { color: 'white' });
        b.box([0.5, 0.12, 0.5], [x, 3.36, z], { color: 'white' });
      }
    });
    return b.done();
  }),
  e('tenderizer', 'kitchen', 'utensils', () => {
    const b = m('tenderizer')
      .stick([0, 0, 0], [0, 0.21, 0], 0.03, 'wood')
      .box([0.1, 0.05, 0.05], [0, 0.23, 0], { color: 'silver', round: 0.1 });
    b.pair((s) => {
      for (const [y, z] of [[0.218, 0.012], [0.218, -0.012], [0.242, 0.012], [0.242, -0.012]]) b.cone([0.014, 0.014, 0.014], [s * 0.056, y, z], { color: 'silver', rot: [0, 0, -s * 90], segs: 4 });
    });
    return b.done();
  }),
  e('tennis ball', 'sports', 'balls', () =>
    m('tennis ball')
      .ball(0.067, [0, 0.0335, 0], { color: '#d4e84a' })
      .torus([0.068, 0.068, 0.004], [0, 0.0335, 0], { color: 'white', tube: 0.06, rot: [20, 30, 0], noInk: true })
      .torus([0.068, 0.068, 0.004], [0, 0.0335, 0], { color: 'white', tube: 0.06, rot: [70, -30, 0], noInk: true })
      .done(),
  ),
  e('tennis court', 'places', 'sports venues', () => {
    const b = m('tennis court')
      .box([3.6, 0.46, 6.2], [0, 0.2, 0], { color: 'darkgreen', round: 0.05 })
      .box([3.0, 0.02, 5.6], [0, 0.41, 0], { color: '#4a8a4a' })
      .box([3.1, 0.8, 0.03], [0, 0.82, 0], { color: '#3a3a3a' })
      .box([3.1, 0.06, 0.04], [0, 1.23, 0], { color: 'white' })
      .box([0.03, 0.005, 2.0], [0, 0.42, 0], { color: 'white', noInk: true });
    b.pair((s) => {
      b.stick([s * 1.55, 0.4, 0], [s * 1.55, 1.27, 0], 0.06, 'darkgray');
      b.box([0.04, 0.005, 5.4], [s * 1.35, 0.42, 0], { color: 'white', noInk: true });
      b.box([0.04, 0.005, 5.4], [s * 1.0, 0.42, 0], { color: 'white', noInk: true });
      b.box([2.74, 0.005, 0.04], [0, 0.42, s * 2.7], { color: 'white', noInk: true });
      b.box([2.0, 0.005, 0.04], [0, 0.42, s * 1.5], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('tennis net', 'sports', 'tennis', () => {
    const b = m('tennis net')
      .box([2.6, 0.9, 0.02], [0, 0.55, 0], { color: '#3a3a3a' })
      .box([2.6, 0.07, 0.03], [0, 1.0, 0], { color: 'white' });
    b.each(8, (i) => b.box([0.01, 0.88, 0.024], [-1.12 + i * 0.32, 0.55, 0], { color: 'gray', noInk: true }));
    b.each(3, (i) => b.box([2.58, 0.01, 0.024], [0, 0.3 + i * 0.22, 0], { color: 'gray', noInk: true }));
    b.pair((s) => {
      b.stick([s * 1.33, 0, 0], [s * 1.33, 1.07, 0], 0.07, 'darkgray');
      b.box([0.26, 0.24, 0.26], [s * 1.33, 0.12, 0], { color: 'stone' });
    });
    return b.done();
  }),
  e('tent', 'sports', 'camping gear', () =>
    m('tent')
      .box([2.0, 0.03, 2.5], [0, 0.015, 0], { color: 'darkgreen' })
      .wedge([1.8, 1.3, 2.2], [0, 0.68, 0], { color: 'orange' })
      .wedge([0.9, 0.95, 0.04], [0, 0.5, 1.11], { color: 'darkred', name: 'door', pivot: [-0.45, 0.5, 1.11] })
      .stick([0, 0, 1.13], [0, 1.45, 1.13], 0.03, 'gray')
      .stick([0, 0, -1.13], [0, 1.45, -1.13], 0.03, 'gray')
      .rod([0, 1.4, 1.13], [0, 0.02, 1.7], 0.012, 'tan')
      .rod([0, 1.4, -1.13], [0, 0.02, -1.7], 0.012, 'tan')
      .done(),
  ),
  e('tentacle', 'sea', 'sea creatures', () => {
    const pts: V[] = [[0, 0.04, 0], [0.02, 0.15, 0], [0.06, 0.25, 0], [0.06, 0.35, 0], [0.02, 0.42, 0], [-0.03, 0.43, 0], [-0.05, 0.39, 0]];
    const b = m('tentacle').ball([0.14, 0.08, 0.12], [0, 0.04, 0], { color: '#a05ac8' });
    for (let i = 0; i + 1 < pts.length; i++) {
      const th = 0.1 - i * 0.012;
      b.rod(pts[i], pts[i + 1], th, '#a05ac8');
      b.ball(th * 0.35, [pts[i][0], pts[i][1], th * 0.45], { color: 'pink' });
    }
    return b.done();
  }),
  e('tepee', 'places', 'homes', () => {
    const b = m('tepee')
      .cone([3.6, 4.2, 3.6], [0, 2.1, 0], { color: 'tan' })
      .torus([2.62, 2.62, 0.12], [0, 1.2, 0], { color: 'red', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .torus([1.9, 1.9, 0.12], [0, 2.0, 0], { color: 'blue', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .wedge([0.9, 1.2, 0.05], [0, 0.6, 1.5], { color: 'darkbrown', rot: [-23, 0, 0] });
    for (const [x, z] of around(5, 0.45)) b.rod([0, 3.5, 0], [x, 4.9, z], 0.08, 'darkwood');
    return b.done();
  }),
  e('test tube', 'study', 'lab', () => {
    const b = m('test tube')
      .box([0.14, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' })
      .box([0.14, 0.015, 0.05], [0, 0.08, 0], { color: 'wood' });
    b.pair((s) => b.box([0.015, 0.08, 0.05], [s * 0.065, 0.045, 0], { color: 'wood' }));
    const cols = ['lime', 'red', 'cyan'];
    b.each(3, (i) => {
      const x = (i - 1) * 0.04;
      b.cyl([0.016, 0.11, 0.016], [x, 0.085, 0], { color: 'glass' });
      b.cyl([0.017, 0.05, 0.017], [x, 0.055, 0], { color: cols[i], glow: true });
      b.ball(0.016, [x, 0.03, 0], { color: cols[i] });
    });
    return b.done();
  }),
  e('tetherball', 'sports', 'playground games', () =>
    m('tetherball')
      .cyl([0.5, 0.15, 0.5], [0, 0.075, 0], { color: 'stone' })
      .stick([0, 0.15, 0], [0, 2.6, 0], 0.07, 'silver')
      .rod([0, 2.5, 0], [0.5, 1.76, 0.2], 0.015, 'white')
      .ball(0.25, [0.58, 1.64, 0.23], { color: 'yellow' })
      .done(),
  ),
  e('textbook', 'study', 'books', () =>
    m('textbook')
      .box([0.22, 0.28, 0.05], [0, 0.14, 0], { color: 'blue', round: 0.1 })
      .box([0.2, 0.26, 0.042], [0.014, 0.14, 0], { color: 'paper' })
      .label('MATH', [0.16, 0.05], [0, 0.2, 0.026], { color: 'white' })
      .ball([0.06, 0.06, 0.004], [0, 0.1, 0.026], { color: 'yellow', noInk: true })
      .done(),
  ),
  e('theater', 'places', 'venues', () => {
    const b = m('theater')
      .box([6, 5.4, 3], [0, 2.7, 0], { color: 'beige', round: 0.03 })
      .wedge([6.2, 1.0, 3.2], [0, 5.9, 0], { color: 'darkred' })
      .box([4.6, 0.8, 1.2], [0, 3.0, 2.0], { color: 'black', round: 0.1 })
      .label('THEATER', [4.0, 0.5], [0, 3.0, 2.62], { color: 'white', glow: true })
      .box([0.6, 2.4, 0.15], [2.2, 4.4, 1.7], { color: 'red', round: 0.2 })
      .label('SHOW', [0.45, 2.0], [2.2, 4.4, 1.79], { color: 'red' })
      .box([2.0, 2.2, 0.08], [0, 1.1, 1.52], { color: 'glass' })
      .box([0.06, 2.2, 0.1], [0, 1.1, 1.55], { color: 'gold' });
    b.each(8, (i) => b.ball(0.16, [-2.1 + i * 0.6, 2.55, 2.6], { color: 'yellow', glow: true }));
    b.pair((s) => b.box([0.8, 1.2, 0.06], [s * 2.2, 1.2, 1.52], { color: s > 0 ? 'purple' : 'teal' }));
    return b.done();
  }),
  e('thermos', 'kitchen', 'drinkware', () =>
    m('thermos')
      .cyl([0.08, 0.2, 0.08], [0, 0.1, 0], { color: 'steel' })
      .cyl([0.082, 0.02, 0.082], [0, 0.01, 0], { color: 'black' })
      .cyl([0.085, 0.06, 0.085], [0, 0.23, 0], { color: 'red', taper: 1.08 })
      .torus([0.06, 0.1, 0.02], [0.05, 0.11, 0], { color: 'black', tube: 0.2 })
      .done(),
  ),
  e('thermostat', 'home', 'electrical', () =>
    m('thermostat')
      .box([0.12, 0.12, 0.012], [0, 0.06, -0.02], { color: 'cream', round: 0.3 })
      .cyl([0.1, 0.03, 0.1], [0, 0.06, 0], { color: 'white', rot: [90, 0, 0] })
      .torus([0.1, 0.1, 0.02], [0, 0.06, 0.006], { color: 'silver', tube: 0.15 })
      .cyl([0.06, 0.004, 0.06], [0, 0.06, 0.016], { color: 'orange', rot: [90, 0, 0], glow: true })
      .label('21°', [0.04, 0.02], [0, 0.06, 0.02], { color: 'orange' })
      .done(),
  ),
  e('thimble', 'home', 'sewing', () => {
    const b = m('thimble')
      .cyl([0.022, 0.026, 0.022], [0, 0.013, 0], { color: 'silver', taper: 0.85 })
      .ball([0.019, 0.01, 0.019], [0, 0.026, 0], { color: 'silver' })
      .cyl([0.03, 0.03, 0.03], [0.045, 0.0175, 0], { color: 'red' })
      .cyl([0.036, 0.005, 0.036], [0.045, 0.0025, 0], { color: 'wood' })
      .cyl([0.036, 0.005, 0.036], [0.045, 0.0325, 0], { color: 'wood' })
      .stick([-0.04, 0.002, 0.03], [0.02, 0.002, 0.04], 0.003, 'silver');
    b.each(4, (i) => b.ball(0.003, [-0.006 + (i % 2) * 0.012, 0.01 + Math.floor(i / 2) * 0.008, 0.0105], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('thong', 'wardrobe', 'shoes', () => {
    const b = m('thong');
    b.pair((s) => {
      const x = s * 0.065;
      b.box([0.09, 0.02, 0.25], [x, 0.01, 0], { color: 'blue', round: 0.8 });
      b.box([0.084, 0.006, 0.24], [x, 0.021, 0], { color: 'skyblue', round: 0.8 });
      for (const k of [-1, 1]) {
        b.rod([x, 0.02, 0.07], [x + k * 0.035, 0.036, 0.0], 0.008, 'yellow');
        b.rod([x + k * 0.035, 0.036, 0.0], [x + k * 0.042, 0.02, -0.03], 0.008, 'yellow');
      }
    });
    return b.done();
  }),
  e('thorn', 'garden', 'plant parts', () =>
    m('thorn')
      .ball([0.05, 0.02, 0.04], [0, 0.008, 0], { color: 'dirt' })
      .stick([0, 0, 0], [0, 0.1, 0], 0.014, 'darkgreen')
      .cone([0.012, 0.03, 0.012], [0.016, 0.035, 0], { color: 'darkred', rot: [0, 0, -60] })
      .cone([0.012, 0.03, 0.012], [-0.016, 0.06, 0], { color: 'darkred', rot: [0, 0, 60] })
      .cone([0.012, 0.03, 0.012], [0, 0.085, 0.016], { color: 'darkred', rot: [60, 0, 0] })
      .done(),
  ),
  e('thorn bush', 'garden', 'shrubs', () => {
    const b = m('thorn bush')
      .ball([1.0, 0.8, 0.9], [0, 0.42, 0], { color: 'darkgreen' })
      .ball([0.7, 0.6, 0.7], [0.4, 0.4, 0.1], { color: 'darkgreen' })
      .ball([0.6, 0.6, 0.6], [-0.4, 0.5, 0.05], { color: '#356a32' })
      .ball([0.6, 0.5, 0.6], [0, 0.85, 0], { color: '#356a32' })
      .rod([-0.3, 0.1, 0.3], [-0.7, 0.9, 0.3], 0.04, '#6a2a3a')
      .rod([0.3, 0.1, 0.3], [0.75, 1.05, 0.2], 0.04, '#6a2a3a')
      .cone([0.04, 0.07, 0.04], [-0.55, 0.62, 0.34], { color: '#6a2a3a', rot: [0, 0, 60] })
      .cone([0.04, 0.07, 0.04], [0.55, 0.65, 0.27], { color: '#6a2a3a', rot: [0, 0, -60] });
    const berries: V[] = [[0.2, 0.6, 0.42], [-0.15, 0.5, 0.45], [0.45, 0.35, 0.44], [-0.4, 0.75, 0.3], [0.05, 0.95, 0.25], [0.3, 0.85, 0.3]];
    berries.forEach((p, i) => b.ball(0.08, p, { color: i % 3 ? '#2a1a3a' : 'red' }));
    return b.done();
  }),
  e('three d printer', 'tech', 'machines', () => {
    const b = m('three d printer')
      .box([0.45, 0.06, 0.45], [0, 0.03, 0], { color: 'darkgray', round: 0.2 })
      .box([0.1, 0.04, 0.01], [0, 0.03, 0.226], { color: 'cyan', glow: true })
      .box([0.32, 0.02, 0.32], [0, 0.12, 0], { color: 'blue' })
      .cyl([0.08, 0.07, 0.08], [0, 0.165, 0], { color: 'orange', taper: 0.6 })
      .stick([-0.21, 0.36, 0], [0.21, 0.36, 0], 0.02, 'silver')
      .box([0.07, 0.07, 0.06], [0.02, 0.33, 0], { color: 'orange', round: 0.2 })
      .cone([0.02, 0.03, 0.02], [0.02, 0.285, 0], { color: 'brass', rot: [180, 0, 0] })
      .torus([0.18, 0.18, 0.06], [0.27, 0.35, 0], { color: 'green', rot: [0, 90, 0], tube: 0.3 })
      .rod([0.24, 0.42, 0], [0.04, 0.37, 0], 0.006, 'green');
    for (const [x, z] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) b.stick([x, 0.06, z], [x, 0.5, z], 0.03, 'black');
    b.pair((s) => {
      b.stick([s * 0.2, 0.5, -0.2], [s * 0.2, 0.5, 0.2], 0.025, 'black');
      b.stick([-0.2, 0.5, s * 0.2], [0.2, 0.5, s * 0.2], 0.025, 'black');
    });
    return b.done();
  }),
  e('three hole punch', 'study', 'stationery', () => {
    const b = m('three hole punch', { view: 'side' })
      .box([0.28, 0.025, 0.1], [0, 0.0125, 0], { color: 'darkgray', round: 0.2 })
      .box([0.3, 0.02, 0.09], [0, 0.085, -0.005], { color: 'black', rot: [-6, 0, 0], round: 0.4, name: 'lid', pivot: [0, 0.07, -0.05] });
    b.each(3, (i) => b.cyl([0.03, 0.05, 0.03], [-0.1 + i * 0.1, 0.05, 0.01], { color: 'silver' }));
    b.pair((s) => b.box([0.02, 0.06, 0.02], [s * 0.13, 0.05, -0.04], { color: 'darkgray' }));
    return b.done();
  }),
  e('throne', 'home', 'seating', () => {
    const b = m('throne')
      .box([0.8, 0.45, 0.65], [0, 0.26, 0], { color: 'gold', round: 0.1 })
      .box([0.7, 0.1, 0.6], [0, 0.52, 0.02], { color: 'red', round: 0.5 })
      .box([0.8, 1.2, 0.12], [0, 1.05, -0.28], { color: 'gold', round: 0.1 })
      .box([0.6, 0.95, 0.06], [0, 1.02, -0.21], { color: 'red', round: 0.4 })
      .cyl([0.8, 0.12, 0.8], [0, 1.62, -0.28], { color: 'gold', rot: [90, 0, 0] })
      .ball(0.12, [0, 1.7, -0.2], { color: 'red' });
    b.pair((s) => {
      b.box([0.12, 0.3, 0.6], [s * 0.42, 0.65, 0.02], { color: 'gold', round: 0.3 });
      b.ball(0.13, [s * 0.42, 0.82, 0.3], { color: 'gold' });
      b.ball([0.14, 0.1, 0.16], [s * 0.34, 0.05, 0.28], { color: 'gold' });
    });
    return b.done();
  }),
  e('thumbprint scanner', 'tech', 'gadgets', () =>
    m('thumbprint scanner')
      .box([0.08, 0.025, 0.1], [0, 0.0125, 0], { color: 'black', round: 0.3 })
      .box([0.055, 0.004, 0.065], [0, 0.027, 0.005], { color: 'teal', glow: true })
      .torus([0.012, 0.016, 0.002], [0, 0.03, 0.005], { color: 'cyan', rot: [90, 0, 0], tube: 0.3, glow: true })
      .torus([0.024, 0.032, 0.002], [0, 0.03, 0.005], { color: 'cyan', rot: [90, 0, 0], tube: 0.15, glow: true })
      .torus([0.036, 0.048, 0.002], [0, 0.03, 0.005], { color: 'cyan', rot: [90, 0, 0], tube: 0.1, glow: true })
      .ball(0.008, [0.03, 0.026, -0.042], { color: 'lime', glow: true })
      .done(),
  ),
  e('thunderbolt', 'nature', 'weather', () =>
    m('thunderbolt')
      .ball([0.22, 0.12, 0.12], [0, 0.44, 0], { color: 'gray' })
      .ball([0.14, 0.1, 0.1], [0.1, 0.41, 0], { color: 'gray' })
      .ball([0.14, 0.1, 0.1], [-0.1, 0.42, 0], { color: 'gray' })
      .rod([0.05, 0.4, 0], [-0.02, 0.24, 0], 0.05, 'yellow')
      .rod([-0.02, 0.24, 0], [0.06, 0.22, 0], 0.05, 'yellow')
      .rod([0.06, 0.22, 0], [-0.04, 0.02, 0], 0.05, 'yellow')
      .done(),
  ),
  e('tiara', 'wardrobe', 'jewellery', () => {
    const b = m('tiara').torus([0.15, 0.13, 0.015], [0, 0.0075, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.12 });
    const peaks: Array<[number, number]> = [[-0.045, 0.06], [0, 0.1], [0.045, 0.06]];
    for (const [x, h] of peaks) {
      const z = Math.sqrt(Math.max(0, 0.065 ** 2 - x * x)) * 0.87;
      b.cone([0.04, h, 0.014], [x, h / 2, z], { color: 'silver' });
      b.ball(0.016, [x, 0.02, z + 0.005], { color: x ? 'skyblue' : 'pink' });
    }
    return b.done();
  }),
  e('tide pool', 'sea', 'seaside', () => {
    const b = m('tide pool').cyl([0.8, 0.06, 0.7], [0, 0.04, 0], { color: 'water' });
    around(8, 0.45).forEach(([x, z], i) => b.ball([0.3, 0.16 + (i % 3) * 0.04, 0.25], [x, 0.09, z * 0.9], { color: i % 2 ? 'rock' : 'stone' }));
    for (const [x, z] of around(5, 0.07, Math.PI / 2)) b.rod([0.1, 0.08, 0.08], [0.1 + x, 0.08, 0.08 + z], 0.03, 'orange');
    b.cyl([0.08, 0.06, 0.08], [-0.15, 0.1, -0.05], { color: 'pink' });
    for (const [x, z] of around(6, 0.035)) b.rod([-0.15 + x * 0.5, 0.13, -0.05 + z * 0.5], [-0.15 + x, 0.17, -0.05 + z], 0.012, 'magenta');
    b.rod([0.15, 0.06, -0.15], [0.17, 0.2, -0.14], 0.02, 'green');
    return b.done();
  }),
  e('tie', 'wardrobe', 'accessories', () => {
    const b = m('tie')
      .cyl([0.3, 0.09, 0.3], [0, 0.045, 0], { color: 'darkwood' })
      .stick([0, 0.09, -0.05], [0, 1.25, -0.05], 0.04, 'darkwood')
      .cyl([0.13, 1.0, 0.03], [0, 0.68, 0.01], { color: 'red', taper: 0.33 })
      .cone([0.13, 0.09, 0.03], [0, 0.135, 0.01], { color: 'red', rot: [180, 0, 0] })
      .cyl([0.05, 0.07, 0.03], [0, 1.21, 0.0], { color: 'red', taper: 1.4 })
      .torus([0.14, 0.14, 0.014], [0, 1.25, -0.05], { color: 'red', rot: [90, 0, 0], tube: 0.1 });
    b.each(4, (i) => {
      const y = 0.32 + i * 0.2, w = 0.13 * (1 - ((y - 0.18) / 1.0) * 0.67);
      b.box([w * 1.02, 0.02, 0.004], [0, y, 0.026], { color: 'navy', rot: [0, 0, 30], noInk: true });
    });
    return b.done();
  }),
  e('tie dye shirt', 'wardrobe', 'tops', () => {
    const b = shirt('tie dye shirt', 'white', 'short', 'white');
    const rings: Array<[number, string]> = [[0.42, 'purple'], [0.33, 'blue'], [0.25, 'green'], [0.17, 'yellow'], [0.09, 'orange']];
    for (const [d, c] of rings) b.torus([d, d, 0.01], [0, 0.32, 0.072], { color: c, tube: 0.18, noInk: true });
    b.ball([0.04, 0.04, 0.01], [0, 0.32, 0.072], { color: 'red', noInk: true });
    return b.done();
  }),
  e('tilde', 'ideas', 'symbols', () => {
    const b = m('tilde').box([0.12, 0.03, 0.06], [0, 0.015, 0], { color: 'wood' }).stick([0, 0.03, 0], [0, 0.07, 0], 0.008, 'gray');
    let prev: V = [-0.055, 0.07, 0];
    for (let i = 1; i <= 6; i++) {
      const x = -0.055 + i * (0.11 / 6), p: V = [x, 0.07 + 0.016 * Math.sin((x / 0.055) * Math.PI), 0];
      b.rod(prev, p, 0.016, 'blue');
      prev = p;
    }
    return b.done();
  }),
  e('time machine', 'tech', 'machines', () => {
    const b = m('time machine')
      .box([1.2, 0.15, 1.0], [0, 0.075, 0], { color: 'brass', round: 0.2 })
      .box([0.5, 0.1, 0.45], [0, 0.6, 0.05], { color: 'red', round: 0.4 })
      .box([0.5, 0.6, 0.1], [0, 0.95, -0.2], { color: 'red', round: 0.4 })
      .cyl([1.5, 0.08, 1.5], [0, 1.05, -0.5], { color: 'brass', rot: [90, 0, 0], name: 'fan' })
      .cyl([1.1, 0.02, 1.1], [0, 1.05, -0.45], { color: 'copper', rot: [90, 0, 0], parent: 'fan', noInk: true })
      .stick([0.42, 0.15, 0.3], [0.42, 0.8, 0.3], 0.05, 'brass')
      .box([0.2, 0.12, 0.15], [0.42, 0.85, 0.3], { color: 'darkwood' })
      .cyl([0.08, 0.02, 0.08], [0.42, 0.85, 0.38], { color: 'cyan', rot: [90, 0, 0], glow: true })
      .rod([0.36, 0.9, 0.3], [0.32, 1.1, 0.4], 0.025, 'silver')
      .ball(0.05, [0.32, 1.12, 0.4], { color: 'red' });
    b.each(4, (i) => b.ball(0.08, xy(0, 1.05, 0.6, (i * Math.PI) / 2, -0.43), { color: ['cyan', 'magenta', 'lime', 'yellow'][i], parent: 'fan', glow: true }));
    b.pair((s) => {
      b.stick([s * 0.22, 0.15, 0.25], [s * 0.22, 0.55, 0.25], 0.04, 'brass');
      b.stick([s * 0.22, 0.15, -0.15], [s * 0.22, 1.25, -0.2], 0.04, 'brass');
      b.stick([s * 0.55, 0.15, 0.45], [s * 0.55, 0.6, 0.45], 0.04, 'ice', { glow: true });
    });
    return b.done();
  }),
  e('tin foil', 'kitchen', 'wraps', () =>
    m('tin foil')
      .box([0.3, 0.05, 0.05], [0, 0.025, 0], { color: 'blue', round: 0.2 })
      .label('FOIL', [0.12, 0.03], [0, 0.025, 0.026], { color: 'white' })
      .box([0.28, 0.05, 0.004], [0, 0.025, 0.03], { color: 'silver' })
      .box([0.28, 0.004, 0.12], [0, 0.002, 0.09], { color: 'silver' })
      .ball(0.05, [0.2, 0.025, 0.08], { color: 'silver' })
      .ball(0.025, [0.215, 0.045, 0.09], { color: 'silver' })
      .done(),
  ),
  e('tinsel', 'toys', 'holiday decorations', () => {
    const b = m('tinsel').stick([-0.72, 1.5, 0], [0.72, 1.5, 0], 0.05, 'wood');
    b.pair((s) => {
      b.stick([s * 0.7, 0, 0], [s * 0.7, 1.55, 0], 0.05, 'wood');
      b.box([0.14, 0.14, 0.4], [s * 0.7, 0.07, 0], { color: 'wood', round: 0.3 });
      b.each(7, (i) => {
        const t = (i + 0.5) / 7, x = s > 0 ? t * 0.7 : -0.7 + t * 0.7;
        b.ball(0.09, [x, 1.46 - 0.4 * Math.sin(Math.PI * t), 0.03], { color: s > 0 ? 'gold' : 'silver' });
      });
    });
    b.ball(0.07, [0, 1.48, 0.04], { color: 'red' });
    return b.done();
  }),
  e('tire', 'garage', 'car parts', () =>
    m('tire', { view: 'side' })
      .torus([0.65, 0.65, 0.22], [0, 0.325, 0], { color: 'rubber', rot: [0, 90, 0], tube: 0.32, name: 'wheel' })
      .cyl([0.42, 0.18, 0.42], [0, 0.325, 0], { color: 'silver', rot: [0, 0, 90], parent: 'wheel' })
      .cyl([0.12, 0.2, 0.12], [0, 0.325, 0], { color: 'gray', rot: [0, 0, 90], parent: 'wheel' })
      .done(),
  ),
  e('tire iron', 'workshop', 'hand tools', () =>
    m('tire iron')
      .stick([0, 0.03, 0], [0, 0.6, 0], 0.025, 'iron')
      .stick([-0.28, 0.315, 0], [0.28, 0.315, 0], 0.025, 'iron')
      .cyl([0.045, 0.06, 0.045], [0, 0.03, 0], { color: 'darkgray' })
      .cyl([0.045, 0.06, 0.045], [0, 0.6, 0], { color: 'darkgray' })
      .cyl([0.045, 0.06, 0.045], [-0.28, 0.315, 0], { color: 'darkgray', rot: [0, 0, 90] })
      .cyl([0.045, 0.06, 0.045], [0.28, 0.315, 0], { color: 'darkgray', rot: [0, 0, 90] })
      .done(),
  ),
  e('tire swing', 'toys', 'playground', () =>
    m('tire swing')
      .cyl([0.4, 3.0, 0.4], [-0.9, 1.5, 0], { color: 'bark', taper: 0.7 })
      .rod([-0.85, 2.6, 0], [0.6, 2.9, 0], 0.18, 'bark')
      .ball([1.6, 1.0, 1.2], [-0.4, 3.3, 0], { color: 'leaf' })
      .ball([1.0, 0.8, 1.0], [0.4, 3.25, 0.1], { color: 'darkgreen' })
      .stick([0.2, 2.82, 0], [0.2, 1.04, 0], 0.03, 'tan')
      .torus([0.6, 0.6, 0.2], [0.2, 0.75, 0], { color: 'rubber', tube: 0.32 })
      .done(),
  ),
  e('tissue', 'home', 'bathroom', () =>
    m('tissue')
      .box([0.12, 0.012, 0.1], [0, 0.006, 0], { color: 'white', round: 0.5 })
      .ball([0.09, 0.07, 0.05], [0, 0.045, 0], { color: 'white' })
      .ball([0.06, 0.05, 0.04], [0.03, 0.08, 0.01], { color: 'white', rot: [0, 0, -20] })
      .done(),
  ),
  e('tissue box', 'home', 'bathroom', () => {
    const b = m('tissue box')
      .box([0.12, 0.12, 0.12], [0, 0.06, 0], { color: 'skyblue', round: 0.1 })
      .ball([0.07, 0.07, 0.03], [0, 0.14, 0], { color: 'white' })
      .ball([0.05, 0.05, 0.02], [0.02, 0.17, 0], { color: 'white', rot: [0, 0, -25] });
    b.each(4, (i) => b.ball([0.025, 0.025, 0.004], [-0.03 + (i % 2) * 0.06, 0.04 + Math.floor(i / 2) * 0.045, 0.061], { color: 'white', noInk: true }));
    return b.done();
  }),
];
