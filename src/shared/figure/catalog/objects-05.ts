/** Catalog chunk objects-05: the words in assign/objects-05.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, type M, type PartOpts } from '../dsl';
import { hat, held, face, wear, who } from '../accessories';

type V = [number, number, number];

/* ----- local helpers ----- */

/** Rods along an elliptical arc (degrees, 0 = +x, 90 = up); plane 'xy' (facing you), 'xz' (flat) or 'yz' (side). */
function arc(b: M, c: V, rx: number, ry: number, a0: number, a1: number, n: number, t: number, color: string, plane: 'xy' | 'xz' | 'yz' = 'xy', o: PartOpts = {}): M {
  const pts: V[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    const u = Math.cos(a) * rx, v = Math.sin(a) * ry;
    pts.push(plane === 'xy' ? [c[0] + u, c[1] + v, c[2]] : plane === 'xz' ? [c[0] + u, c[1], c[2] + v] : [c[0], c[1] + v, c[2] + u]);
  }
  for (let i = 0; i < n; i++) b.rod(pts[i], pts[i + 1], t, color, o);
  return b;
}

/** Rods through a list of points. */
function path(b: M, pts: V[], t: number, color: string, o: PartOpts = {}): M {
  for (let i = 0; i < pts.length - 1; i++) b.rod(pts[i], pts[i + 1], t, color, o);
  return b;
}

/** A dome (half ellipsoid) from stacked tapered slices: radius r, height h, standing at `at`. */
function dome(b: M, r: number, h: number, at: V, color: string, o: PartOpts = {}): M {
  const ys = [0, 0.3, 0.55, 0.75, 0.88];
  const rr = (f: number) => r * Math.sqrt(Math.max(0, 1 - f * f));
  for (let i = 0; i < ys.length - 1; i++) {
    const y0 = ys[i], y1 = ys[i + 1];
    b.cyl([2 * rr(y0), (y1 - y0) * h, 2 * rr(y0)], [at[0], at[1] + ((y0 + y1) / 2) * h, at[2]], { ...o, name: i === 0 ? o.name : undefined, color, taper: rr(y1) / rr(y0) });
  }
  return b.ball([2 * rr(0.88), 0.24 * h, 2 * rr(0.88)], [at[0], at[1] + 0.88 * h, at[2]], { ...o, name: undefined, color });
}

/** A side-view wheel (axle along x). */
function wheel(b: M, d: number, at: V, o: { color?: string; hub?: string; name?: string; w?: number } = {}): M {
  const w = o.w ?? d * 0.35;
  b.torus([d, d, w], at, { color: o.color ?? 'rubber', rot: [0, 90, 0], tube: 0.38, name: o.name });
  return b.cyl([d * 0.5, w * 0.9, d * 0.5], at, { color: o.hub ?? 'silver', rot: [0, 0, 90], parent: o.name });
}

/** A spoked cart wheel (axle along x). */
function spoked(b: M, d: number, at: V, color: string, name?: string): M {
  b.torus([d, d, d * 0.1], at, { color, rot: [0, 90, 0], tube: 0.12, name });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    const dy = Math.sin(a) * d * 0.45, dz = Math.cos(a) * d * 0.45;
    b.stick([at[0], at[1] - dy, at[2] - dz], [at[0], at[1] + dy, at[2] + dz], d * 0.04, color, { parent: name });
  }
  return b.cyl([d * 0.18, d * 0.14, d * 0.18], at, { color: 'darkgray', rot: [0, 0, 90], parent: name });
}

interface Bld {
  w: number;
  h: number;
  d: number;
  wall: string;
  roof?: string;
  roofH?: number;
  flat?: boolean;
  sign: string;
  signBg?: string;
  door?: string;
  win?: string;
  trim?: string;
}
/** A little building: walls, roof (gable or flat), a door that opens, rows of windows and a sign over the door. */
function bld(key: string, o: Bld): M {
  const { w, h, d } = o;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.04 });
  if (o.flat) b.box([w + 0.3, 0.3, d + 0.3], [0, h + 0.15, 0], { color: o.roof ?? 'darkgray', round: 0.1 });
  else {
    const rh = o.roofH ?? Math.min(2.5, w * 0.35);
    b.wedge([w + 0.5, rh, d + 0.4], [0, h + rh / 2, 0], { color: o.roof ?? 'darkred' });
  }
  const z = d / 2 + 0.03;
  b.box([1.0, 2.0, 0.08], [0, 1.0, z], { color: o.door ?? 'darkwood', round: 0.1, name: 'door', pivot: [-0.5, 1.0, z] });
  b.ball(0.1, [0.32, 1.0, z + 0.06], { color: 'brass', parent: 'door' });
  const win = o.win ?? 'glass';
  if (w >= 4) b.pair((s) => b.box([Math.min(1.4, w * 0.2), 1.1, 0.06], [s * w * 0.3, 1.4, z], { color: win, round: 0.1 }));
  const floors = Math.max(1, Math.round(h / 3));
  const cols = Math.max(2, Math.floor(w / 1.8));
  for (let f = 1; f < floors; f++)
    for (let i = 0; i < cols; i++) b.box([0.9, 1.1, 0.06], [-w / 2 + (w / cols) * (i + 0.5), f * 3 + 1.5, z], { color: win, round: 0.1 });
  b.label(o.sign, [Math.min(w * 0.75, 4), 0.62], [0, 2.5, z + 0.02], { color: o.signBg ?? 'white' });
  return b;
}

/** A bottle standing at (x, z): body, shoulder, neck, cap and a coloured band label. */
function bottle(b: M, x: number, z: number, h: number, d: number, color: string, cap: string, band?: string, neck = 0.35): M {
  const bh = h * 0.6;
  b.cyl([d, bh, d], [x, bh / 2, z], { color });
  b.cyl([d, h * 0.14, d], [x, bh + h * 0.07, z], { color, taper: neck + 0.05 });
  b.cyl([d * neck, h * 0.18, d * neck], [x, h * 0.83, z], { color });
  b.cyl([d * neck * 1.15, h * 0.09, d * neck * 1.15], [x, h * 0.955, z], { color: cap });
  if (band) b.cyl([d * 1.03, bh * 0.5, d * 1.03], [x, bh * 0.5, z], { color: band });
  return b;
}

/** A mug at (x, z) with a handle on its +x side; returns the builder. */
function mug(b: M, x: number, z: number, h: number, d: number, color: string, drink: string): M {
  b.cyl([d, h, d], [x, h / 2, z], { color });
  b.cyl([d * 0.86, 0.01, d * 0.86], [x, h - 0.004, z], { color: drink, noInk: true });
  return b.torus([h * 0.6, h * 0.6, d * 0.14], [x + d * 0.52, h * 0.5, z], { color, rot: [0, 0, 0] });
}

/** A hand standing on its wrist, palm facing you, thumb toward s * -x. */
function hand(b: M, x: number, s: 1 | -1, skin: string, z = 0): M {
  b.cyl([0.055, 0.05, 0.04], [x, 0.025, z], { color: skin });
  b.box([0.085, 0.095, 0.034], [x, 0.09, z], { color: skin, round: 0.5 });
  const fl = [0.068, 0.078, 0.072, 0.056];
  fl.forEach((l, i) => {
    const fx = x + s * (-0.03 + i * 0.02);
    b.capsule([0.019, l, 0.02], [fx, 0.13 + l / 2, z], { color: skin, rot: [0, 0, s * (i - 1.5) * -3] });
  });
  return b.rod([x - s * 0.035, 0.075, z + 0.01], [x - s * 0.072, 0.125, z + 0.018], 0.022, skin);
}

/** A shirt or coat on an invisible body: hem on the floor, sleeves, collar and buttons. */
function shirt(key: string, o: { color: string; len: number; long?: boolean; collar?: string; buttons?: string; w?: number }): M {
  const L = o.len, W = o.w ?? Math.min(0.55, L * 0.66), D = 0.22, top = L;
  const b = m(key).box([W, L, D], [0, L / 2, 0], { color: o.color, round: 0.25 });
  b.pair((s) => {
    if (o.long) b.rod([s * W * 0.42, top - 0.07, 0], [s * (W * 0.5 + 0.13), top - 0.55, 0], 0.13, o.color);
    else b.rod([s * W * 0.42, top - 0.07, 0], [s * (W * 0.5 + 0.13), top - 0.25, 0], 0.15, o.color);
    b.box([0.09, 0.14, 0.03], [s * 0.065, top - 0.06, D / 2 + 0.005], { color: o.collar ?? o.color, rot: [0, 0, s * 35], round: 0.3 });
  });
  b.ball([W * 0.4, 0.05, D * 0.6], [0, top, 0], { color: '#3a3330', noInk: true });
  if (o.buttons) b.each(4, (i) => b.ball(0.022, [0, top - 0.16 - i * ((L - 0.2) / 4), D / 2 + 0.005], { color: o.buttons }));
  return b;
}

/** Trousers standing on the floor. */
function pants(key: string, color: string, L: number, belt = 'leather', seam = 'gold'): M {
  const W = 0.4;
  const b = m(key).box([W, L * 0.18, 0.22], [0, L * 0.91, 0], { color, round: 0.3 });
  b.box([W + 0.01, 0.045, 0.23], [0, L - 0.02, 0], { color: belt, round: 0.3 });
  b.box([0.05, 0.04, 0.02], [0, L - 0.02, 0.115], { color: 'brass' });
  b.pair((s) => {
    b.box([0.17, L * 0.84, 0.19], [s * 0.11, L * 0.42, 0], { color, round: 0.3, rot: [0, 0, s * 3] });
    b.stick([s * W * 0.4, L * 0.92, 0.112], [s * W * 0.2, L * 0.8, 0.112], 0.01, seam, { noInk: true });
  });
  return b.stick([0, L * 0.97, 0.112], [0, L * 0.8, 0.112], 0.008, seam, { noInk: true });
}

/** A key standing on its tip at (x, z). */
function key(b: M, x: number, z: number, color: string, h = 0.08, tilt = 0): M {
  const r = (tilt * Math.PI) / 180, p = (dx: number, dy: number): V => [x + dx * Math.cos(r) - dy * Math.sin(r), dy * Math.cos(r) + dx * Math.sin(r), z];
  b.torus([h * 0.42, h * 0.42, 0.01], p(0, h * 0.78), { color, tube: 0.35, rot: [0, 0, tilt] });
  b.stick(p(0, h * 0.58), p(0, 0.004), h * 0.13, color);
  return b.box([h * 0.18, h * 0.22, 0.009], p(h * 0.11, h * 0.14), { color, round: 0.1, rot: [0, 0, tilt] });
}

/** A flat regular hexagon facing you (three overlapping bars): r = corner radius, t = thickness. */
function hexagon(b: M, r: number, at: V, color: string, t: number, o: PartOpts = {}): M {
  for (const a of [0, 60, 120]) b.box([r, r * Math.sqrt(3), t], at, { ...o, color, round: 0, rot: [0, 0, a + 30] });
  return b;
}


/* ----- entries ----- */

export const ENTRIES: CatalogEntry[] = [
  e('grindstone', 'workshop', 'sharpening', () => {
    const b = m('grindstone').box([0.46, 0.1, 0.24], [0, 0.05, 0], { color: 'darkwood' }).box([0.4, 0.02, 0.18], [0, 0.1, 0], { color: 'water', noInk: true });
    b.pair((s) => b.box([0.05, 0.26, 0.04], [0, 0.22, s * 0.075], { color: 'wood' }));
    b.cyl([0.34, 0.07, 0.34], [0, 0.3, 0], { color: 'stone', rot: [90, 0, 0], name: 'wheel' });
    b.stick([0, 0.3, -0.11], [0, 0.3, 0.13], 0.025, 'iron');
    b.box([0.12, 0.022, 0.02], [0.05, 0.3, 0.13], { color: 'iron', name: 'crank', pivot: [0, 0.3, 0.13] });
    return b.stick([0.1, 0.3, 0.13], [0.1, 0.3, 0.22], 0.03, 'wood', { parent: 'crank' }).done();
  }),
  e('ground beef', 'food', 'meat', () => {
    const b = m('ground beef').box([0.26, 0.025, 0.19], [0, 0.0125, 0], { color: 'white', round: 0.4 }).ball([0.22, 0.07, 0.15], [0, 0.045, 0], { color: '#c84a55' });
    around(8, 0.055).forEach(([x, z], i) => b.ball(0.03, [x * 1.3, 0.06 + (i % 2) * 0.01, z], { color: i % 3 ? '#d9606a' : '#f0b8b8', noInk: true }));
    return b.box([0.06, 0.035, 0.01], [0.07, 0.03, 0.09], { color: 'yellow', rot: [-30, 0, 0] }).done();
  }),
  e('ground meat', 'food', 'meat', () => {
    const b = m('ground meat').box([0.3, 0.008, 0.3], [0, 0.004, 0], { color: 'paper', rot: [0, 20, 0] });
    b.ball([0.18, 0.06, 0.15], [0, 0.03, 0], { color: '#b8443e' });
    around(10, 0.06).forEach(([x, z], i) => b.ball(0.035 - (i % 3) * 0.005, [x, 0.035 + (i % 2) * 0.015, z], { color: i % 2 ? '#c95a50' : '#a83a36' }));
    return b.ball(0.04, [0, 0.07, 0], { color: '#c95a50' }).done();
  }),
  e('guacamole', 'food', 'dips', () => {
    const b = m('guacamole').cyl([0.16, 0.06, 0.16], [0, 0.04, 0], { color: '#4a4744', taper: 1.25 });
    b.each(3, (i) => b.cyl([0.03, 0.02, 0.03], [Math.cos(i * 2.1) * 0.05, 0.01, Math.sin(i * 2.1) * 0.05], { color: '#4a4744' }));
    b.ball([0.18, 0.06, 0.18], [0, 0.075, 0], { color: '#8cbf4a' });
    around(5, 0.04).forEach(([x, z], i) => b.ball(0.015, [x, 0.098, z], { color: i % 2 ? 'tomato' : 'white', noInk: true }));
    b.pair((s) => b.wedge([0.06, 0.07, 0.006], [s * 0.05, 0.12, -0.03], { color: '#e8c060', rot: [-15, 0, s * 15] }));
    return b.done();
  }),
  e('guillotine', 'armory', 'dungeon', () => {
    const b = m('guillotine').box([1.6, 0.4, 1.2], [0, 0.2, 0], { color: 'darkwood' });
    b.pair((s) => b.box([0.15, 3.3, 0.15], [s * 0.36, 2.05, 0], { color: 'wood' }));
    b.box([1.0, 0.18, 0.22], [0, 3.75, 0], { color: 'wood' });
    b.box([0.6, 0.18, 0.06], [0, 3.0, 0], { color: 'iron' });
    b.wedge([0.55, 0.32, 0.03], [0, 2.75, 0], { color: 'silver', apex: -0.5, rot: [0, 0, 180] });
    b.stick([0, 3.1, 0], [0, 3.66, 0], 0.03, 'tan');
    b.box([0.6, 0.3, 0.14], [0, 0.9, 0], { color: 'wood' });
    return b.cyl([0.14, 0.16, 0.14], [0, 0.95, 0], { color: 'black', rot: [90, 0, 0] }).done();
  }),
  e('guitar case', 'music', 'music cases', () =>
    m('guitar case')
      .ball([0.44, 0.38, 0.15], [0, 0.2, 0], { color: 'black' })
      .ball([0.34, 0.3, 0.15], [0, 0.47, 0], { color: 'black' })
      .box([0.13, 0.5, 0.12], [0, 0.82, 0], { color: 'black', round: 0.5 })
      .box([0.15, 0.17, 0.12], [0, 1.12, 0], { color: 'black', round: 0.5 })
      .box([0.24, 0.2, 0.03], [0, 0.22, 0.075], { color: 'darkgray', round: 0.5 })
      .torus([0.1, 0.06, 0.03], [0, 0.48, 0.08], { color: 'rubber' })
      .box([0.04, 0.03, 0.02], [0.17, 0.2, 0.06], { color: 'silver' })
      .box([0.04, 0.03, 0.02], [-0.17, 0.2, 0.06], { color: 'silver' })
      .done(),
  ),
  e('guitar strap', 'music', 'music accessories', () => {
    const b = m('guitar strap');
    arc(b, [0, 1.02, 0], 0.13, 0.13, 0, 180, 6, 0.085, '#c0392b');
    b.stick([0, 1.1, -0.1], [0, 1.1, 0.1], 0.03, 'wood');
    b.pair((s) => {
      b.stick([s * 0.13, 1.02, 0], [s * 0.13, 0.16, 0], 0.085, '#c0392b');
      b.each(5, (i) => b.ball([0.04, 0.05, 0.02], [s * 0.13, 0.3 + i * 0.15, 0.04], { color: 'gold', noInk: true }));
      b.box([0.1, 0.15, 0.03], [s * 0.13, 0.08, 0], { color: 'leather', round: 0.4 });
      b.cyl([0.025, 0.035, 0.025], [s * 0.13, 0.06, 0], { color: 'black', rot: [90, 0, 0] });
    });
    return b.box([0.11, 0.06, 0.1], [-0.13, 0.7, 0], { color: 'silver' }).done();
  }),
  e('gum', 'food', 'candy', () =>
    m('gum')
      .box([0.075, 0.08, 0.022], [0, 0.04, 0], { color: 'green', round: 0.15 })
      .box([0.077, 0.02, 0.024], [0, 0.04, 0], { color: 'white', noInk: true })
      .box([0.02, 0.05, 0.004], [-0.02, 0.09, 0], { color: 'silver' })
      .box([0.02, 0.035, 0.004], [0.005, 0.085, 0], { color: 'pink' })
      .ball([0.04, 0.035, 0.035], [0.065, 0.0175, 0.02], { color: 'pink' })
      .done(),
  ),
  e('gumball', 'food', 'candy', () =>
    m('gumball')
      .ball(0.032, [-0.017, 0.016, 0], { color: 'red' })
      .ball(0.032, [0.017, 0.016, 0], { color: 'blue' })
      .ball(0.032, [0, 0.016, -0.028], { color: 'green' })
      .ball(0.032, [0, 0.043, -0.01], { color: 'yellow' })
      .done(),
  ),
  e('gumball machine', 'toys', 'arcade', () => {
    const b = m('gumball machine').cyl([0.42, 0.06, 0.42], [0, 0.03, 0], { color: 'red' }).cyl([0.08, 0.82, 0.08], [0, 0.47, 0], { color: 'silver' });
    b.cyl([0.36, 0.3, 0.36], [0, 1.0, 0], { color: 'red', taper: 0.85 });
    b.box([0.12, 0.13, 0.04], [0, 1.03, 0.16], { color: 'silver' });
    b.cyl([0.06, 0.04, 0.06], [0, 1.03, 0.19], { color: 'silver', rot: [90, 0, 0], name: 'crank' });
    b.box([0.08, 0.06, 0.04], [0, 0.9, 0.16], { color: 'darkgray' });
    b.ball(0.44, [0, 1.37, 0], { color: 'glass' });
    const cols = ['red', 'yellow', 'blue', 'green', 'orange', 'pink', 'white', 'purple'];
    let k = 0;
    for (const lat of [-35, -5, 25]) for (const lon of [-75, -30, 15, 60]) {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      b.ball(0.07, [0.2 * Math.cos(la) * Math.sin(lo), 1.37 + 0.2 * Math.sin(la), 0.2 * Math.cos(la) * Math.cos(lo)], { color: cols[k++ % cols.length], noInk: true });
    }
    return b.cyl([0.16, 0.05, 0.16], [0, 1.6, 0], { color: 'red' }).ball(0.06, [0, 1.64, 0], { color: 'red' }).done();
  }),
  e('gumdrop', 'food', 'candy', () => {
    const b = m('gumdrop');
    ([[-0.024, 0, 'red'], [0.024, 0, 'green'], [0, -0.035, 'orange']] as const).forEach(([x, z, c]) => {
      b.cyl([0.042, 0.03, 0.042], [x, 0.015, z], { color: c, taper: 0.6 });
      b.ball([0.026, 0.02, 0.026], [x, 0.03, z], { color: c });
      b.ball(0.006, [x + 0.008, 0.03, z + 0.01], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('gummi bear', 'food', 'candy', () => {
    const c = { color: '#e8343a' };
    const b = m('gummi bear').ball([0.032, 0.034, 0.024], [0, 0.024, 0], c).ball([0.03, 0.026, 0.022], [0, 0.05, 0], c);
    b.pair((s) => {
      b.ball(0.012, [s * 0.01, 0.063, 0], c);
      b.ball([0.014, 0.013, 0.013], [s * 0.009, 0.0065, 0.005], c);
      b.ball([0.011, 0.014, 0.011], [s * 0.017, 0.032, 0.004], c);
    });
    return b.ball([0.013, 0.01, 0.01], [0, 0.046, 0.011], c).done();
  }),
  e('gun', 'armory', 'guns', () =>
    m('gun')
      .box([0.19, 0.036, 0.028], [0.025, 0.137, 0], { color: 'darkgray', round: 0.15 })
      .box([0.036, 0.115, 0.027], [-0.045, 0.065, 0], { color: 'black', rot: [0, 0, -14], round: 0.3 })
      .torus([0.045, 0.034, 0.008], [0.0, 0.103, 0], { color: 'darkgray' })
      .box([0.006, 0.022, 0.006], [-0.003, 0.105, 0], { color: 'black' })
      .cyl([0.014, 0.006, 0.014], [0.12, 0.137, 0], { color: 'black', rot: [0, 0, 90] })
      .box([0.008, 0.01, 0.006], [0.11, 0.16, 0], { color: 'black' })
      .box([0.014, 0.018, 0.012], [-0.07, 0.157, 0], { color: 'black', rot: [0, 0, 20] })
      .done(),
  ),
  e('gun range', 'places', 'sports venues', () => {
    const b = m('gun range').box([4, 0.3, 3], [0, 0.15, 0], { color: 'gray' }).box([4, 2.6, 0.15], [0, 1.4, -1.45], { color: 'tan' });
    b.box([3.8, 0.12, 0.5], [0, 1.0, 1.1], { color: 'wood' });
    for (const x of [-1.5, -0.5, 0.5, 1.5]) b.box([0.06, 1.8, 0.8], [x, 1.0, 1.0], { color: 'darkgray' });
    for (const x of [-1, 0, 1]) {
      b.box([0.6, 0.8, 0.03], [x, 1.5, -1.36], { color: 'white' });
      b.cyl([0.42, 0.01, 0.42], [x, 1.5, -1.34], { color: 'black', rot: [90, 0, 0], noInk: true });
      b.cyl([0.28, 0.01, 0.28], [x, 1.5, -1.33], { color: 'white', rot: [90, 0, 0], noInk: true });
      b.cyl([0.12, 0.01, 0.12], [x, 1.5, -1.32], { color: 'red', rot: [90, 0, 0], noInk: true });
    }
    return b.label('GUN RANGE', [2.4, 0.5], [0, 3.0, -1.35], { color: 'red' }).done();
  }),
  e('gunpowder', 'armory', 'ammunition', () => {
    const b = m('gunpowder').cyl([0.34, 0.44, 0.34], [0, 0.22, 0], { color: 'wood' });
    for (const y of [0.04, 0.16, 0.28, 0.4]) b.cyl([0.355, 0.025, 0.355], [0, y, 0], { color: 'iron' });
    b.cyl([0.3, 0.01, 0.3], [0, 0.445, 0], { color: 'darkwood' });
    b.label('GUNPOWDER', [0.24, 0.07], [0, 0.22, 0.17], { color: 'cream' });
    return b.ball([0.16, 0.05, 0.12], [0.22, 0.02, 0.16], { color: '#2b2b2b' }).ball([0.06, 0.03, 0.05], [0.3, 0.015, 0.25], { color: '#2b2b2b' }).done();
  }),
  e('gutters', 'workshop', 'building materials', () => {
    const b = m('gutters').box([1.2, 0.42, 0.3], [0, 0.21, -0.22], { color: 'cream', round: 0.05 }).box([1.24, 0.05, 0.45], [0, 0.45, -0.2], { color: 'darkred', rot: [15, 0, 0] });
    b.box([1.2, 0.12, 0.04], [0, 0.36, -0.05], { color: 'white' });
    b.box([1.2, 0.1, 0.11], [0, 0.35, 0.03], { color: 'metal', round: 0.4 });
    b.box([1.14, 0.015, 0.07], [0, 0.398, 0.03], { color: 'darkgray', noInk: true });
    b.box([0.06, 0.32, 0.05], [0.48, 0.17, 0.04], { color: 'metal', round: 0.3 });
    return b.box([0.06, 0.05, 0.14], [0.48, 0.025, 0.09], { color: 'metal', round: 0.3 }).done();
  }),
  e('guy fawkes mask', 'toys', 'masks', () => {
    const b = m('guy fawkes mask').ball([0.19, 0.27, 0.09], [0, 0.145, 0], { color: '#f4ead8' });
    b.pair((s) => {
      b.ball([0.045, 0.03, 0.02], [s * 0.05, 0.11, 0.032], { color: '#f0a0a0', noInk: true });
      b.ball([0.035, 0.012, 0.012], [s * 0.04, 0.185, 0.038], { color: 'black', rot: [0, 0, s * 12] });
      b.rod([s * 0.015, 0.215, 0.038], [s * 0.065, 0.2, 0.03], 0.008, 'black');
      path(b, [[s * 0.004, 0.105, 0.044], [s * 0.04, 0.1, 0.04], [s * 0.07, 0.125, 0.025]], 0.01, 'black');
    });
    b.box([0.05, 0.006, 0.01], [0, 0.085, 0.042], { color: 'darkred', noInk: true });
    b.box([0.01, 0.06, 0.012], [0, 0.04, 0.035], { color: 'black' });
    return b.ball([0.022, 0.04, 0.02], [0, 0.145, 0.045], { color: '#f4ead8' }).done();
  }),
  e('gym', 'places', 'sports venues', () => {
    const b = bld('gym', { w: 7, h: 4, d: 5, wall: '#5a6f8a', flat: true, sign: 'GYM', signBg: 'yellow' });
    b.stick([-1.3, 4.75, 0], [1.3, 4.75, 0], 0.15, 'steel');
    b.pair((s) => b.cyl([0.95, 0.3, 0.95], [s * 1.0, 4.775, 0], { color: 'black', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('gyro', 'food', 'sandwiches', () => {
    const b = m('gyro').cyl([0.055, 0.08, 0.055], [0, 0.04, 0], { color: 'paper', taper: 1.6 }).cyl([0.085, 0.045, 0.08], [0, 0.1, 0], { color: 'bread', taper: 1.15 });
    b.each(4, (i) => b.rod([-0.03 + i * 0.02, 0.115, -0.01], [-0.025 + i * 0.018, 0.145, 0.01], 0.014, 'meat'));
    b.ball([0.04, 0.02, 0.03], [0.015, 0.13, 0.02], { color: 'white' });
    b.ball(0.02, [-0.025, 0.13, 0.025], { color: 'tomato' });
    return b.ball([0.035, 0.018, 0.03], [0.02, 0.135, -0.02], { color: 'lettuce' }).ball([0.02, 0.015, 0.02], [-0.03, 0.135, -0.015], { color: 'purple' }).done();
  }),
  e('gyroscope', 'toys', 'science toys', () =>
    m('gyroscope')
      .cyl([0.05, 0.008, 0.05], [0, 0.004, 0], { color: 'darkgray' })
      .cyl([0.015, 0.02, 0.015], [0, 0.017, 0], { color: 'darkgray', taper: 0.4 })
      .torus([0.085, 0.085, 0.006], [0, 0.07, 0], { color: 'silver', tube: 0.08 })
      .torus([0.085, 0.085, 0.006], [0, 0.07, 0], { color: 'silver', tube: 0.08, rot: [0, 90, 0] })
      .stick([0, 0.027, 0], [0, 0.113, 0], 0.005, 'steel')
      .cyl([0.065, 0.014, 0.065], [0, 0.07, 0], { color: 'brass', name: 'rotor' })
      .ball(0.01, [0, 0.115, 0], { color: 'steel' })
      .done(),
  ),
  e('hacksaw', 'workshop', 'hand tools', () =>
    m('hacksaw')
      .box([0.34, 0.032, 0.032], [0.01, 0.15, 0], { color: 'blue' })
      .box([0.022, 0.13, 0.03], [0.175, 0.09, 0], { color: 'blue' })
      .box([0.022, 0.13, 0.03], [-0.155, 0.09, 0], { color: 'blue' })
      .box([0.34, 0.014, 0.003], [0.01, 0.035, 0], { color: 'steel', round: 0 })
      .box([0.048, 0.11, 0.04], [-0.19, 0.08, 0], { color: 'black', rot: [0, 0, -18], round: 0.4 })
      .ball(0.018, [0.175, 0.03, 0.008], { color: 'steel' })
      .done(),
  ),
  e('hail', 'nature', 'weather', () => {
    const b = m('hail');
    ([[-0.1, 0.3, 0.13], [0.1, 0.3, 0.13], [-0.04, 0.33, 0.15], [0.05, 0.34, 0.14]] as const).forEach(([x, y, s]) => b.ball([s, s * 0.7, s * 0.7], [x, y, 0], { color: 'gray' }));
    ([[-0.1, 0.2], [0.02, 0.17], [0.11, 0.21], [-0.05, 0.11], [0.07, 0.09]] as const).forEach(([x, y]) => b.ball(0.03, [x, y, 0.02], { color: 'ice' }));
    return b.ball(0.03, [-0.06, 0.015, 0.03], { color: 'ice' }).ball(0.026, [0.04, 0.013, 0.05], { color: 'ice' }).ball(0.028, [0.1, 0.014, -0.02], { color: 'ice' }).done();
  }),
  e('hair', 'clinic', 'body parts', () =>
    m('hair')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'darkgray' })
      .cyl([0.03, 0.2, 0.03], [0, 0.11, 0], { color: 'silver' })
      .ball([0.16, 0.2, 0.17], [0, 0.32, 0.01], { color: 'cream' })
      .ball([0.19, 0.17, 0.2], [0, 0.37, -0.01], { color: '#7a3b1e' })
      .box([0.21, 0.3, 0.1], [0, 0.25, -0.06], { color: '#7a3b1e', round: 0.6 })
      .rod([0.085, 0.37, 0.02], [0.09, 0.17, 0.02], 0.05, '#7a3b1e')
      .rod([-0.085, 0.37, 0.02], [-0.09, 0.17, 0.02], 0.05, '#7a3b1e')
      .ball([0.15, 0.05, 0.06], [0, 0.415, 0.065], { color: '#7a3b1e' })
      .done(),
  ),
  e('hair brush', 'home', 'grooming', () => {
    const b = m('hair brush').capsule([0.03, 0.12, 0.022], [0, 0.065, 0], { color: 'darkwood' }).ball([0.085, 0.12, 0.03], [0, 0.18, 0], { color: 'wood' });
    b.ball([0.068, 0.1, 0.02], [0, 0.18, 0.012], { color: 'black' });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) b.ball(0.009, [(c - 1) * 0.018, 0.15 + r * 0.02, 0.025], { color: 'white', noInk: true });
    return b.done();
  }),
  e('hair clip', 'wardrobe', 'hair accessories', () => {
    const b = m('hair clip').capsule([0.012, 0.085, 0.01], [0, 0.02, 0], { color: 'silver', rot: [0, 0, 90] });
    b.pair((s) => b.wedge([0.035, 0.04, 0.012], [s * 0.022, 0.04, 0], { color: 'pink', rot: [0, 0, s * 90] }));
    return b.ball(0.017, [0, 0.04, 0.004], { color: 'magenta' }).done();
  }),
  e('hair curlers', 'home', 'grooming', () => {
    const b = m('hair curlers');
    ([[0, 0.018, 0.02, 'pink'], [0, 0.018, -0.02, 'skyblue'], [0.005, 0.05, 0, 'purple']] as const).forEach(([x, y, z, c]) => {
      b.cyl([0.036, 0.075, 0.036], [x, y, z], { color: c, rot: [0, 0, 90] });
      for (const dx of [-0.025, 0, 0.025]) b.torus([0.04, 0.04, 0.008], [x + dx, y, z], { color: 'white', rot: [0, 90, 0], noInk: true });
      b.cyl([0.02, 0.077, 0.02], [x, y, z], { color: '#555', rot: [0, 0, 90], noInk: true });
    });
    return b.done();
  }),
  e('hair spray', 'home', 'grooming', () =>
    m('hair spray')
      .cyl([0.065, 0.16, 0.065], [0, 0.08, 0], { color: 'purple' })
      .cyl([0.067, 0.07, 0.067], [0, 0.085, 0], { color: 'pink' })
      .cyl([0.065, 0.02, 0.065], [0, 0.17, 0], { color: 'silver', taper: 0.7 })
      .cyl([0.05, 0.045, 0.05], [0, 0.2, 0], { color: 'white' })
      .box([0.012, 0.01, 0.012], [0, 0.225, 0.015], { color: 'black' })
      .ball(0.025, [0.0, 0.235, 0.05], { color: 'skyblue', noInk: true })
      .ball(0.035, [0.0, 0.24, 0.085], { color: 'skyblue', noInk: true })
      .done(),
  ),
  e('hairball', 'pets', 'cat things', () => {
    const c = { color: '#8a7a6a' };
    const b = m('hairball').ball([0.05, 0.042, 0.045], [0, 0.021, 0], c);
    around(7, 0.018).forEach(([x, z], i) => b.ball(0.022, [x, 0.02 + (i % 3) * 0.006, z], { color: i % 2 ? '#9a8a78' : '#6f6052' }));
    around(9, 0.02, 0.3).forEach(([x, z], i) => b.rod([x, 0.025, z], [x * 2.4, 0.02 + (i % 3) * 0.012, z * 2.4], 0.003, '#6a5a4a', { noInk: true }));
    return b.done();
  }),
  e('hairdye', 'home', 'grooming', () => {
    const b = m('hairdye').box([0.09, 0.14, 0.04], [0, 0.07, 0], { color: 'white', round: 0.1 });
    b.ball([0.07, 0.075, 0.015], [0, 0.07, 0.018], { color: '#a0262e' });
    b.ball([0.035, 0.045, 0.012], [0, 0.065, 0.024], { color: 'skin2' });
    b.box([0.09, 0.025, 0.042], [0, 0.125, 0], { color: 'purple', round: 0.1 });
    return b.cyl([0.035, 0.1, 0.035], [0.075, 0.05, 0.01], { color: 'white' }).cone([0.02, 0.03, 0.02], [0.075, 0.115, 0.01], { color: 'purple' }).done();
  }),
  e('hairnet', 'wardrobe', 'hair accessories', () => {
    const Y = 0.2, net = '#e8dcc0';
    const b = m('hairnet').cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: 'darkgray' }).cyl([0.03, 0.12, 0.03], [0, 0.08, 0], { color: 'silver' });
    b.ball([0.13, 0.17, 0.14], [0, 0.205, 0.01], { color: 'cream' }).ball([0.145, 0.1, 0.15], [0, Y + 0.04, -0.005], { color: '#6a4028' });
    for (const [y, r] of [[0.03, 0.074], [0.06, 0.06], [0.08, 0.04]] as const) b.torus([2 * r, 2 * r, 0.004], [0, Y + y, -0.005], { color: net, rot: [90, 0, 0], tube: 0.06, noInk: true });
    arc(b, [0, Y + 0.035, -0.005], 0.074, 0.055, 10, 170, 6, 0.004, net, 'xy', { noInk: true });
    arc(b, [0, Y + 0.035, -0.005], 0.076, 0.055, 10, 170, 6, 0.004, net, 'yz', { noInk: true });
    return b.torus([0.15, 0.15, 0.012], [0, Y + 0.008, -0.005], { color: 'tan', rot: [80, 0, 0], tube: 0.12 }).done();
  }),
  e('hairpin', 'wardrobe', 'hair accessories', () => {
    const b = m('hairpin');
    const pin = (x: number, t: number) => {
      const r = (t * Math.PI) / 180, p = (dx: number, dy: number): V => [x + dx * Math.cos(r) - dy * Math.sin(r), dy * Math.cos(r) + dx * Math.sin(r) + 0.004, 0];
      b.stick(p(-0.005, 0), p(-0.005, 0.075), 0.003, 'black');
      path(b, [p(0.005, 0), p(0.009, 0.012), p(0.003, 0.025), p(0.009, 0.038), p(0.003, 0.051), p(0.008, 0.064), p(0.005, 0.075)], 0.003, 'black');
      b.torus([0.013, 0.01, 0.003], p(0, 0.078), { color: 'black', rot: [0, 0, t], tube: 0.25 });
      b.ball(0.006, p(-0.005, 0), { color: 'black' }).ball(0.006, p(0.005, 0), { color: 'black' });
    };
    pin(-0.012, 12);
    pin(0.014, -12);
    return b.ball(0.016, [0, 0.09, 0.004], { color: 'white' }).done();
  }),
  e('halloween costume', 'toys', 'halloween', () =>
    who('halloween costume', { h: 'kid', top: 'black', bottom: 'black', skirt: 'purple', long: true, style: 'long', hair: '#e86a1e', acc: [hat('wizard', 'black'), wear('cape', 'purple'), held('broom'), held('basket', 'orange', 'L')] }),
  ),
  e('hallpass', 'study', 'school', () =>
    m('hallpass')
      .box([0.032, 0.07, 0.022], [0, 0.035, 0], { color: 'wood', round: 0.3 })
      .box([0.13, 0.19, 0.024], [0, 0.16, 0], { color: 'lightwood', round: 0.2 })
      .label('HALL PASS', [0.11, 0.06], [0, 0.17, 0.01], { color: 'yellow' })
      .torus([0.04, 0.05, 0.005], [0, 0.27, 0], { color: 'red' })
      .done(),
  ),
  e('hallway', 'places', 'rooms', () => {
    const b = m('hallway').box([2.4, 0.06, 5], [0, 0.03, 0], { color: '#c9b28a' }).box([0.8, 0.012, 4.6], [0, 0.065, 0], { color: 'darkred', noInk: true });
    b.box([3.1, 2.4, 0.4], [0, 1.2, -2.6], { color: 'cream' });
    b.pair((s) => {
      b.box([0.38, 2.4, 5], [s * 1.38, 1.2, 0], { color: 'beige' });
      for (const z of [-1.0, 1.0]) {
        b.box([0.06, 2.0, 0.9], [s * 1.17, 1.0, z], { color: 'wood', round: 0.1 });
        b.ball(0.08, [s * 1.12, 1.0, z + 0.3], { color: 'brass' });
      }
    });
    b.box([0.9, 2.0, 0.06], [0, 1.0, -2.39], { color: 'darkwood', round: 0.1 });
    return b.label('EXIT', [0.6, 0.25], [0, 2.2, -2.38], { color: 'green', glow: true }).done();
  }),
  e('halo', 'fantasy', 'magic items', () =>
    m('halo')
      .torus([0.26, 0.26, 0.035], [0, 0.24, 0], { color: 'gold', rot: [-65, 0, 0], tube: 0.2 })
      .star(0.05, [0.17, 0.29, 0.02], { color: 'yellow', glow: true })
      .star(0.035, [-0.16, 0.2, 0.03], { color: 'yellow', glow: true })
      .done(),
  ),
  e('ham', 'food', 'meat', () => {
    const b = m('ham').cyl([0.32, 0.016, 0.32], [0, 0.008, 0], { color: 'white' }).ball([0.24, 0.17, 0.19], [0, 0.095, 0], { color: '#b9583e' });
    b.ball([0.16, 0.12, 0.05], [-0.03, 0.09, 0.075], { color: '#e88a8a' });
    b.rod([0.06, 0.15, 0], [0.12, 0.21, 0], 0.035, 'cream').ball(0.045, [0.125, 0.22, 0], { color: 'cream' });
    for (const [x, y] of [[0.07, 0.13], [0.09, 0.07], [0.05, 0.17], [-0.06, 0.16], [0.0, 0.17]] as const) b.ball(0.012, [x, y, 0.07], { color: 'darkbrown', noInk: true });
    return b.done();
  }),
  e('hamburger', 'food', 'fast food', () => {
    const b = m('hamburger')
      .cyl([0.11, 0.025, 0.11], [0, 0.0125, 0], { color: 'bread' })
      .cyl([0.118, 0.022, 0.118], [0, 0.036, 0], { color: 'darkbrown' })
      .box([0.1, 0.006, 0.1], [0, 0.05, 0], { color: 'cheese', rot: [0, 45, 0], round: 0.1 })
      .cyl([0.124, 0.008, 0.124], [0, 0.056, 0], { color: 'lettuce' })
      .cyl([0.1, 0.01, 0.1], [0, 0.064, 0], { color: 'tomato' })
      .ball([0.115, 0.07, 0.115], [0, 0.068, 0], { color: 'bread' });
    around(7, 0.03).forEach(([x, z]) => b.ball([0.008, 0.004, 0.005], [x, 0.098, z + 0.01], { color: 'cream', noInk: true }));
    return b.done();
  }),
  e('hammer', 'workshop', 'hand tools', () =>
    m('hammer')
      .stick([0, 0, 0], [0, 0.31, 0], 0.028, 'wood')
      .stick([0, 0, 0], [0, 0.11, 0], 0.035, 'red')
      .box([0.12, 0.036, 0.036], [0.015, 0.31, 0], { color: 'steel', round: 0.2 })
      .cyl([0.038, 0.02, 0.038], [0.08, 0.31, 0], { color: 'steel', rot: [0, 0, 90] })
      .rod([-0.04, 0.315, 0], [-0.09, 0.29, 0], 0.024, 'steel')
      .done(),
  ),
  e('hammock', 'home', 'outdoor furniture', () => {
    const b = m('hammock').box([2.6, 0.22, 0.22], [0, 0.11, 0], { color: 'darkwood' });
    b.pair((s) => {
      b.box([0.12, 0.06, 0.8], [s * 1.3, 0.03, 0], { color: 'darkwood' });
      b.rod([s * 1.2, 0.08, 0], [s * 1.55, 1.3, 0], 0.08, 'wood');
      b.stick([s * 1.0, 0.95, -0.42], [s * 1.0, 0.95, 0.42], 0.04, 'lightwood');
      b.rod([s * 1.0, 0.95, 0.4], [s * 1.55, 1.28, 0], 0.015, 'tan');
      b.rod([s * 1.0, 0.95, -0.4], [s * 1.55, 1.28, 0], 0.015, 'tan');
    });
    const N = 8, f = (x: number) => 0.55 + 0.4 * x * x;
    for (let i = 0; i < N; i++) {
      const x0 = -1 + (2 * i) / N, x1 = -1 + (2 * (i + 1)) / N;
      const ang = (Math.atan2(f(x1) - f(x0), x1 - x0) * 180) / Math.PI;
      b.box([Math.hypot(x1 - x0, f(x1) - f(x0)) + 0.01, 0.03, 0.8], [(x0 + x1) / 2, (f(x0) + f(x1)) / 2, 0], { color: i % 2 ? 'cream' : 'teal', rot: [0, 0, ang], round: 0.1 });
    }
    return b.done();
  }),
  e('hamper', 'home', 'laundry', () => {
    const b = m('hamper').cyl([0.44, 0.6, 0.44], [0, 0.3, 0], { color: 'tan', taper: 1.08 });
    for (const y of [0.12, 0.27, 0.42]) b.cyl([0.47, 0.025, 0.47], [0, y, 0], { color: '#b8945e', noInk: true });
    b.cyl([0.5, 0.05, 0.5], [0, 0.625, 0], { color: '#b8945e', name: 'lid', pivot: [0, 0.625, -0.25] });
    b.ball(0.05, [0, 0.66, 0], { color: 'darkwood', parent: 'lid' });
    b.rod([0.08, 0.6, 0.2], [0.12, 0.42, 0.26], 0.06, 'blue');
    return b.pair((s) => b.torus([0.08, 0.06, 0.02], [s * 0.24, 0.5, 0], { color: 'darkwood', rot: [0, 90, 0] })).done();
  }),
  e('hand', 'clinic', 'body parts', () => hand(m('hand'), 0, 1, 'skin2').done()),
  e('hand crank', 'workshop', 'hardware', () =>
    m('hand crank')
      .box([0.12, 0.1, 0.1], [0, 0.05, 0], { color: 'darkgray', round: 0.15 })
      .cyl([0.1, 0.02, 0.1], [0, 0.07, 0.055], { color: 'brass', rot: [90, 0, 0], segs: 12 })
      .stick([0, 0.07, 0.05], [0, 0.07, 0.1], 0.02, 'steel')
      .box([0.025, 0.15, 0.016], [0, 0.135, 0.1], { color: 'red', round: 0.4, name: 'crank', pivot: [0, 0.07, 0.1] })
      .stick([0, 0.2, 0.1], [0, 0.2, 0.165], 0.026, 'wood', { parent: 'crank' })
      .done(),
  ),
  e('hand mirror', 'home', 'grooming', () =>
    m('hand mirror')
      .capsule([0.026, 0.11, 0.02], [0, 0.055, 0], { color: 'pink' })
      .cyl([0.135, 0.02, 0.165], [0, 0.185, 0], { color: 'gold', rot: [90, 0, 0] })
      .cyl([0.11, 0.012, 0.14], [0, 0.185, 0.008], { color: '#dff3fb', rot: [90, 0, 0] })
      .box([0.015, 0.06, 0.004], [0.02, 0.2, 0.016], { color: 'white', rot: [0, 0, -30], noInk: true })
      .ball(0.022, [0, 0.27, 0], { color: 'pink' })
      .done(),
  ),
  e('handcuffs', 'armory', 'police gear', () => {
    const b = m('handcuffs');
    b.pair((s) => {
      b.torus([0.075, 0.075, 0.014], [s * 0.065, 0.0375, 0], { color: 'steel', tube: 0.18 });
      b.box([0.032, 0.03, 0.022], [s * 0.065, 0.075, 0], { color: 'steel' });
    });
    for (const [x, r] of [[-0.026, 0], [0, 90], [0.026, 0]] as const) b.torus([0.026, 0.016, 0.005], [x, 0.08, 0], { color: 'silver', rot: [r, 0, 0] });
    return b.done();
  }),
  e('handheld', 'tech', 'game consoles', () =>
    m('handheld')
      .box([0.09, 0.148, 0.03], [0, 0.074, 0], { color: '#c9c7c2', round: 0.15 })
      .box([0.076, 0.062, 0.006], [0, 0.11, 0.015], { color: '#5c6166', round: 0.2 })
      .box([0.05, 0.045, 0.004], [0, 0.11, 0.018], { color: '#9bbc0f', glow: true })
      .box([0.03, 0.009, 0.008], [-0.022, 0.05, 0.016], { color: 'black' })
      .box([0.009, 0.03, 0.008], [-0.022, 0.05, 0.016], { color: 'black' })
      .cyl([0.014, 0.008, 0.014], [0.017, 0.046, 0.016], { color: 'magenta', rot: [90, 0, 0] })
      .cyl([0.014, 0.008, 0.014], [0.033, 0.056, 0.016], { color: 'magenta', rot: [90, 0, 0] })
      .box([0.012, 0.004, 0.006], [-0.008, 0.022, 0.016], { color: 'gray', rot: [0, 0, 25] })
      .box([0.012, 0.004, 0.006], [0.01, 0.022, 0.016], { color: 'gray', rot: [0, 0, 25] })
      .done(),
  ),
  e('handicapped sign', 'ideas', 'signs', () => {
    const w = 'white';
    const b = m('handicapped sign').box([0.14, 0.03, 0.08], [0, 0.015, 0], { color: 'darkgray' }).stick([0, 0.03, 0], [0, 0.07, 0], 0.03, 'steel');
    b.box([0.3, 0.3, 0.03], [0, 0.21, 0], { color: '#1f5fb8', round: 0.12 });
    b.ball(0.04, [-0.02, 0.31, 0.02], { color: w });
    b.rod([-0.03, 0.28, 0.02], [-0.04, 0.2, 0.02], 0.022, w).rod([-0.04, 0.2, 0.02], [0.03, 0.2, 0.02], 0.02, w).rod([0.03, 0.2, 0.02], [0.06, 0.12, 0.02], 0.02, w);
    b.rod([-0.03, 0.26, 0.02], [0.03, 0.26, 0.02], 0.016, w);
    return b.torus([0.14, 0.14, 0.012], [-0.03, 0.17, 0.02], { color: w, tube: 0.12 }).done();
  }),
  e('handkerchief', 'wardrobe', 'accessories', () => {
    const b = m('handkerchief').box([0.6, 0.05, 0.15], [0, 0.025, 0], { color: 'wood' });
    b.pair((s) => b.stick([s * 0.27, 0.05, 0], [s * 0.27, 0.5, 0], 0.025, 'wood'));
    b.stick([-0.27, 0.47, 0], [0.27, 0.47, 0], 0.006, 'tan');
    b.box([0.36, 0.36, 0.01], [0, 0.28, 0], { color: 'red', round: 0.05 });
    b.box([0.28, 0.28, 0.012], [0, 0.28, 0], { color: 'white', round: 0.05, noInk: true });
    for (const [x, y] of [[-0.08, 0.36], [0.06, 0.34], [-0.04, 0.22], [0.08, 0.2], [0.0, 0.29]] as const) b.ball([0.025, 0.025, 0.006], [x, y, 0.007], { color: 'red', noInk: true });
    b.pair((s) => b.box([0.02, 0.05, 0.02], [s * 0.15, 0.46, 0.01], { color: 'lightwood' }));
    return b.done();
  }),
  e('handle', 'home', 'door hardware', () =>
    m('handle')
      .box([0.05, 0.17, 0.016], [0, 0.085, 0], { color: 'brass', round: 0.4 })
      .cyl([0.045, 0.02, 0.045], [0, 0.12, 0.017], { color: 'brass', rot: [90, 0, 0] })
      .stick([0, 0.12, 0.02], [0, 0.12, 0.045], 0.018, 'brass')
      .rod([0, 0.12, 0.045], [0.11, 0.115, 0.05], 0.02, 'brass')
      .ball(0.012, [0, 0.05, 0.01], { color: 'black' })
      .box([0.005, 0.014, 0.006], [0, 0.04, 0.01], { color: 'black' })
      .done(),
  ),
  e('hands', 'clinic', 'body parts', () => {
    const b = m('hands');
    hand(b, 0.065, 1, 'skin3');
    return hand(b, -0.065, -1, 'skin3').done();
  }),
  e('hang glider', 'garage', 'aircraft', () => {
    const b = m('hang glider').wedge([3.0, 1.5, 0.05], [0, 2.0, 0], { color: 'orange', rot: [90, 0, 0] });
    b.wedge([1.4, 0.7, 0.055], [0, 2.005, 0.37], { color: 'yellow', rot: [90, 0, 0], noInk: true });
    b.stick([0, 1.97, -0.75], [0, 1.97, 0.8], 0.04, 'silver');
    b.rod([0, 1.97, 0.1], [0.55, 1.15, 0.2], 0.03, 'silver').rod([0, 1.97, 0.1], [-0.55, 1.15, 0.2], 0.03, 'silver').rod([-0.55, 1.15, 0.2], [0.55, 1.15, 0.2], 0.03, 'silver');
    b.rod([0, 1.97, -0.1], [0, 1.45, -0.1], 0.015, 'black');
    b.capsule([0.32, 1.3, 0.3], [0, 1.35, -0.15], { color: 'blue', rot: [90, 0, 0] });
    b.ball(0.24, [0, 1.42, 0.55], { color: 'red' });
    return b.ball([0.2, 0.12, 0.15], [0, 1.36, 0.6], { color: 'skin2' }).done();
  }),
  e('hard drive', 'tech', 'computer parts', () =>
    m('hard drive')
      .box([0.1, 0.147, 0.026], [0, 0.0735, 0], { color: 'metal', round: 0.1 })
      .cyl([0.086, 0.004, 0.086], [0, 0.095, 0.014], { color: '#e4e9ef', rot: [90, 0, 0], name: 'fan' })
      .cyl([0.022, 0.006, 0.022], [0, 0.095, 0.017], { color: 'silver', rot: [90, 0, 0], parent: 'fan' })
      .box([0.008, 0.07, 0.005], [0.03, 0.05, 0.019], { color: 'darkgray', rot: [0, 0, 28] })
      .cyl([0.016, 0.006, 0.016], [0.035, 0.022, 0.017], { color: 'darkgray', rot: [90, 0, 0] })
      .box([0.07, 0.01, 0.02], [0, 0.005, 0], { color: 'black' })
      .done(),
  ),
  e('hard hat', 'wardrobe', 'hats', () => {
    const b = m('hard hat').cyl([0.3, 0.02, 0.33], [0, 0.01, 0.01], { color: 'yellow' });
    dome(b, 0.125, 0.15, [0, 0.02, 0], 'yellow');
    arc(b, [0, 0.02, 0], 0.13, 0.155, 35, 145, 4, 0.025, 'yellow', 'yz');
    return b.box([0.18, 0.02, 0.06], [0, 0.025, 0.15], { color: 'yellow', round: 0.5 }).done();
  }),
  e('hardware store', 'places', 'shops', () => {
    const b = bld('hardware store', { w: 7, h: 4, d: 5, wall: 'orange', flat: true, sign: 'HARDWARE' });
    b.stick([2.2, 4.3, 0], [2.2, 6.1, 0], 0.22, 'wood');
    b.box([1.1, 0.4, 0.4], [2.35, 6.1, 0], { color: 'steel' });
    for (let i = 0; i < 3; i++) b.box([0.2, 0.2, 2.0], [-2.6 + i * 0.22, 0.1, 3.4], { color: 'lightwood', round: 0.1 });
    return b.box([0.2, 0.2, 2.0], [-2.38, 0.3, 3.4], { color: 'lightwood', round: 0.1 }).done();
  }),
  e('harmonica', 'music', 'wind', () => {
    const b = m('harmonica').box([0.15, 0.014, 0.034], [0, 0.007, 0], { color: 'silver', round: 0.3 }).box([0.14, 0.02, 0.03], [0, 0.024, 0], { color: 'wood', round: 0.1 });
    b.box([0.15, 0.014, 0.034], [0, 0.041, 0], { color: 'silver', round: 0.3 });
    return b.each(10, (i) => b.box([0.008, 0.01, 0.004], [-0.0585 + i * 0.013, 0.024, 0.015], { color: 'black' })).done();
  }),
  e('harness', 'sports', 'climbing gear', () => {
    const b = m('harness').torus([0.38, 0.3, 0.05], [0, 0.46, 0], { color: 'orange', rot: [90, 0, 0], tube: 0.14 });
    b.pair((s) => {
      b.torus([0.2, 0.18, 0.045], [s * 0.1, 0.03, 0.01], { color: 'orange', rot: [88, 0, 0], tube: 0.22 });
      b.rod([s * 0.06, 0.06, 0.09], [0, 0.26, 0.15], 0.03, 'black');
      b.rod([s * 0.1, 0.06, -0.08], [s * 0.08, 0.44, -0.14], 0.02, 'black');
      b.torus([0.05, 0.07, 0.012], [s * 0.17, 0.4, 0.06], { color: 'silver', rot: [0, s * 50, 0] });
    });
    b.torus([0.08, 0.2, 0.025], [0, 0.35, 0.15], { color: 'red', tube: 0.3 });
    return b.box([0.07, 0.05, 0.03], [0, 0.46, 0.155], { color: 'silver' }).done();
  }),
  e('harp', 'music', 'strings', () => {
    const b = m('harp').box([0.42, 0.12, 0.3], [-0.05, 0.06, 0], { color: 'gold', round: 0.3 });
    b.stick([-0.35, 0.1, 0], [-0.35, 1.42, 0], 0.075, 'gold').box([0.12, 0.1, 0.1], [-0.35, 1.46, 0], { color: 'gold' });
    b.stick([-0.22, 0.1, 0], [0.38, 1.2, 0], 0.24, 'wood', { taper: 0.4 });
    const neck: V[] = [[-0.35, 1.47, 0], [-0.15, 1.36, 0], [0.05, 1.4, 0], [0.22, 1.3, 0], [0.38, 1.2, 0]];
    path(b, neck, 0.07, 'darkwood');
    const ny = (x: number) => { for (let i = 0; i < neck.length - 1; i++) if (x <= neck[i + 1][0]) { const t = (x - neck[i][0]) / (neck[i + 1][0] - neck[i][0]); return neck[i][1] + t * (neck[i + 1][1] - neck[i][1]); } return 1.2; };
    for (let x = -0.27; x < 0.3; x += 0.06) b.stick([x, ny(x) - 0.03, 0], [x, 0.1 + ((x + 0.22) / 0.6) * 1.1, 0], 0.006, 'cream', { noInk: true });
    return b.done();
  }),
  e('harpoon', 'armory', 'spears', () => {
    const b = m('harpoon').box([0.3, 0.15, 0.3], [0, 0.075, 0], { color: 'darkwood' }).stick([0, 0.15, 0], [0, 1.85, 0], 0.045, 'wood');
    b.cone([0.07, 0.2, 0.05], [0, 1.95, 0], { color: 'steel' });
    b.pair((s) => b.rod([0, 1.9, 0], [s * 0.07, 1.8, 0], 0.025, 'steel'));
    b.stick([0, 1.83, 0], [0, 1.88, 0], 0.06, 'iron');
    for (const y of [0.18, 0.22, 0.26]) b.torus([0.26, 0.26, 0.04], [0, y, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.15 });
    return path(b, [[0, 1.75, 0.02], [0.08, 1.2, 0.04], [0.06, 0.6, 0.06], [0.12, 0.28, 0.06]], 0.02, 'tan').done();
  }),
  e('hash brown', 'food', 'breakfast', () => {
    const b = m('hash brown').ball([0.1, 0.085, 0.024], [0, 0.06, 0], { color: '#d9a040' }).box([0.105, 0.04, 0.03], [0, 0.02, 0], { color: 'white', round: 0.2 });
    b.each(5, (i) => b.rod([-0.03 + i * 0.015, 0.05, 0.012], [-0.025 + i * 0.015, 0.09, 0.011], 0.004, '#b87a2a', { noInk: true }));
    return b.box([0.03, 0.02, 0.004], [0, 0.02, 0.016], { color: 'red' }).done();
  }),
  e('hat', 'wardrobe', 'hats', () =>
    m('hat')
      .cyl([0.34, 0.015, 0.3], [0, 0.0075, 0], { color: '#5a4a3c' })
      .cyl([0.19, 0.12, 0.17], [0, 0.075, 0], { color: '#5a4a3c', taper: 0.85 })
      .cyl([0.193, 0.028, 0.173], [0, 0.03, 0], { color: 'black' })
      .box([0.03, 0.02, 0.1], [0, 0.135, 0], { color: '#4a3c30', round: 0.6 })
      .ball([0.02, 0.02, 0.005], [0.06, 0.035, 0.08], { color: 'red' })
      .done(),
  ),
  e('hat stand', 'home', 'furniture', () => {
    const b = m('hat stand').stick([0, 0, 0], [0, 1.72, 0], 0.05, 'darkwood').ball(0.08, [0, 1.76, 0], { color: 'darkwood' });
    around(3, 0.3, 0.5).forEach(([x, z]) => b.rod([0, 0.3, 0], [x, 0.02, z], 0.04, 'darkwood'));
    around(4, 0.15).forEach(([x, z]) => b.rod([0, 1.58, 0], [x, 1.66, z], 0.025, 'darkwood').ball(0.04, [x, 1.67, z], { color: 'darkwood' }));
    b.cyl([0.36, 0.015, 0.34], [0.17, 1.7, 0], { color: 'black', rot: [0, 0, -10] }).cyl([0.2, 0.14, 0.19], [0.17, 1.78, 0], { color: 'black', rot: [0, 0, -10] });
    b.cyl([0.205, 0.03, 0.195], [0.165, 1.73, 0], { color: 'red', rot: [0, 0, -10] });
    return b.rod([0, 1.65, 0.15], [0.02, 1.15, 0.17], 0.07, 'teal').rod([0, 1.65, 0.15], [-0.08, 1.2, 0.15], 0.07, 'teal').done();
  }),
  e('hawaiian shirt', 'wardrobe', 'shirts', () => {
    const b = shirt('hawaiian shirt', { color: '#d94a3a', len: 0.75, buttons: 'white' });
    const fl: Array<[number, number, string]> = [[-0.12, 0.6, 'yellow'], [0.1, 0.5, 'white'], [-0.08, 0.3, 'white'], [0.12, 0.2, 'yellow'], [-0.15, 0.12, 'pink'], [0.08, 0.66, 'pink']];
    fl.forEach(([x, y, c]) => {
      around(5, 0.022).forEach(([dx, dy]) => b.ball([0.03, 0.03, 0.008], [x + dx, y + dy, 0.112], { color: c, noInk: true }));
      b.ball([0.015, 0.015, 0.01], [x, y, 0.115], { color: 'orange', noInk: true });
    });
    return b.pair((s) => b.ball([0.08, 0.04, 0.02], [s * 0.15, 0.4, 0.11], { color: 'darkgreen', noInk: true, rot: [0, 0, s * 30] })).done();
  }),
  e('hay', 'farm', 'hay', () => {
    const b = m('hay').ball([0.9, 0.5, 0.7], [0, 0.22, 0], { color: '#e8c860' }).ball([0.5, 0.35, 0.45], [0.05, 0.38, 0], { color: '#e8c860' });
    const pts: Array<[number, number, number, number, number, number]> = [[-0.3, 0.3, 0.2, -0.55, 0.38, 0.3], [0.2, 0.4, 0.1, 0.45, 0.5, 0.2], [0, 0.44, 0, 0.1, 0.55, 0.05], [0.3, 0.2, 0.25, 0.55, 0.1, 0.38], [-0.1, 0.35, 0.3, -0.2, 0.45, 0.45]];
    pts.forEach(([a, b2, c, d, e2, f]) => b.rod([a, b2, c], [d, e2, f], 0.015, '#d9b450'));
    return b.rod([-0.6, 0.01, 0.3], [-0.4, 0.01, 0.45], 0.015, '#d9b450').rod([0.5, 0.01, -0.3], [0.7, 0.01, -0.1], 0.015, '#d9b450').done();
  }),
  e('hay bale', 'farm', 'hay', () => {
    const b = m('hay bale').cyl([1.2, 1.2, 1.2], [0, 0.6, 0], { color: '#e3c062', rot: [0, 0, 90] });
    b.pair((s) => { for (const d of [0.9, 0.55, 0.22]) b.torus([d, d, 0.03], [s * 0.6, 0.6, 0], { color: '#c9a040', rot: [0, 90, 0], noInk: true }); });
    for (const x of [-0.35, 0, 0.35]) b.cyl([1.22, 0.03, 1.22], [x, 0.6, 0], { color: '#f2e2a8', rot: [0, 0, 90], noInk: true });
    return b.done();
  }),
  e('haystack', 'farm', 'hay', () => {
    const b = m('haystack').cyl([2.4, 1.2, 2.4], [0, 0.6, 0], { color: '#e3c062', taper: 0.85 }).ball([2.15, 2.0, 2.15], [0, 1.3, 0], { color: '#e3c062' });
    b.stick([0, 2.2, 0], [0, 3.0, 0], 0.08, 'wood');
    around(8, 1.15).forEach(([x, z], i) => b.rod([x, 0.15, z], [x * 1.18, 0.02 + (i % 2) * 0.1, z * 1.18], 0.04, '#d9b450'));
    return b.done();
  }),
  e('hazel tree', 'garden', 'trees', () => {
    const b = m('hazel tree');
    around(4, 0.18, 0.4).forEach(([x, z]) => b.rod([x, 0, z], [x * 4, 2.8, z * 4], 0.16, 'bark'));
    b.ball([3.2, 2.4, 3.0], [0, 3.6, 0], { color: '#5d9a45', name: 'top' });
    for (const [x, y, z] of [[1.3, 3.1, 0.4], [-1.3, 3.2, 0.2], [0.2, 4.4, -0.3], [0.3, 3.2, 1.2]] as const) b.ball(1.6, [x, y, z], { color: '#6aab4e', parent: 'top' });
    for (const [x, z] of [[0.8, 1.3], [-0.6, 1.25], [1.5, 0.6], [-1.6, 0.5], [0.1, 1.5]] as const) b.capsule([0.06, 0.3, 0.06], [x, 2.55, z], { color: '#e0c050', parent: 'top' });
    for (const [x, y, z] of [[0.6, 3.0, 1.5], [-0.9, 3.4, 1.3], [1.6, 3.6, 0.9]] as const) b.ball(0.14, [x, y, z], { color: 'brown', parent: 'top' });
    return b.done();
  }),
  e('hazmat suit', 'wardrobe', 'protective gear', () =>
    who('hazmat suit', { top: 'yellow', bottom: 'yellow', shoes: 'black', long: true, build: 1.2, acc: [hat('hood', 'yellow'), face('goggles', 'darkgray'), face('mask', 'gray'), wear('belt', 'black'), wear('backpack', 'gray')] }),
  ),
  e('head', 'clinic', 'body parts', () => {
    const sk = 'skin2';
    const b = m('head').cyl([0.1, 0.07, 0.09], [0, 0.035, 0], { color: sk }).ball([0.17, 0.22, 0.2], [0, 0.165, 0], { color: sk });
    b.ball([0.18, 0.12, 0.2], [0, 0.23, -0.015], { color: '#5a3a22' });
    b.pair((s) => {
      b.ball([0.025, 0.05, 0.03], [s * 0.088, 0.16, -0.01], { color: sk });
      b.ball([0.025, 0.02, 0.01], [s * 0.035, 0.18, 0.093], { color: 'white' });
      b.ball(0.012, [s * 0.035, 0.18, 0.099], { color: 'black', eye: true });
    });
    b.ball([0.025, 0.035, 0.03], [0, 0.155, 0.1], { color: sk });
    return b.box([0.04, 0.008, 0.01], [0, 0.115, 0.092], { color: 'darkred', noInk: true }).done();
  }),
  e('head scarf', 'wardrobe', 'scarves', () => {
    const b = m('head scarf').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'darkgray' }).cyl([0.07, 0.1, 0.07], [0, 0.07, 0], { color: 'cream' });
    b.ball([0.19, 0.22, 0.19], [0, 0.22, -0.02], { color: '#c0392b' });
    b.ball([0.13, 0.16, 0.07], [0, 0.2, 0.065], { color: 'cream' });
    b.pair((s) => b.ball([0.02, 0.01, 0.01], [s * 0.03, 0.215, 0.099], { color: 'darkbrown' }));
    b.box([0.03, 0.006, 0.01], [0, 0.165, 0.098], { color: 'red', noInk: true });
    around(9, 0.085, 2).forEach(([x, z], i) => b.ball([0.025, 0.025, 0.02], [x, 0.24 + (i % 3) * 0.04, z - 0.02], { color: 'white', noInk: true }));
    b.ball(0.05, [0.0, 0.11, 0.08], { color: '#c0392b' });
    return b.rod([0, 0.11, 0.09], [0.05, 0.03, 0.11], 0.035, '#c0392b').rod([0, 0.11, 0.09], [-0.04, 0.04, 0.12], 0.035, '#c0392b').done();
  }),
  e('headband', 'wardrobe', 'hair accessories', () => {
    const b = m('headband');
    arc(b, [0, 0, 0], 0.075, 0.13, 10, 170, 8, 0.018, 'pink');
    b.pair((s) => b.wedge([0.035, 0.04, 0.014], [s * 0.022, 0.135, 0.005], { color: 'magenta', rot: [0, 0, s * 90] }));
    return b.ball(0.018, [0, 0.135, 0.008], { color: 'magenta' }).done();
  }),
  e('headboard', 'home', 'bedroom', () => {
    const b = m('headboard').box([1.6, 0.9, 0.08], [0, 0.75, -0.3], { color: 'wood' }).cyl([1.6, 0.08, 0.5], [0, 1.2, -0.3], { color: 'wood', rot: [90, 0, 0] });
    b.box([1.36, 0.7, 0.06], [0, 0.85, -0.24], { color: '#5a6fa8', round: 0.4 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) b.ball(0.03, [-0.5 + c * 0.25, 0.7 + r * 0.25, -0.2], { color: '#3f4f80', noInk: true });
    b.pair((s) => b.box([0.1, 1.2, 0.1], [s * 0.82, 0.6, -0.3], { color: 'darkwood' }));
    b.box([1.5, 0.3, 0.7], [0, 0.35, 0.1], { color: 'white' });
    return b.pair((s) => b.ball([0.55, 0.15, 0.3], [s * 0.36, 0.56, -0.05], { color: 'cream' })).done();
  }),
  e('headlight', 'garage', 'car parts', () =>
    m('headlight')
      .box([0.12, 0.03, 0.12], [0, 0.015, 0], { color: 'darkgray' })
      .box([0.04, 0.08, 0.04], [0, 0.07, -0.02], { color: 'darkgray' })
      .cyl([0.22, 0.12, 0.22], [0, 0.2, 0], { color: 'silver', rot: [90, 0, 0] })
      .torus([0.22, 0.22, 0.03], [0, 0.2, 0.06], { color: 'silver', tube: 0.12 })
      .ball([0.19, 0.19, 0.06], [0, 0.2, 0.065], { color: '#fff3b0', glow: true })
      .done(),
  ),
  e('headphones', 'music', 'audio', () => {
    const b = m('headphones');
    arc(b, [0, 0.1, 0], 0.105, 0.11, 0, 180, 8, 0.025, 'black');
    return b.pair((s) => {
      b.cyl([0.09, 0.05, 0.09], [s * 0.115, 0.06, 0], { color: 'red', rot: [0, 0, 90] });
      b.cyl([0.08, 0.03, 0.08], [s * 0.08, 0.06, 0], { color: 'black', rot: [0, 0, 90] });
      b.stick([s * 0.105, 0.1, 0], [s * 0.115, 0.08, 0], 0.012, 'silver');
    }).done();
  }),
  e('hearing aid', 'clinic', 'medical devices', () => {
    const b = m('hearing aid');
    path(b, [[0, 0.008, 0], [0.01, 0.03, 0], [0.002, 0.052, 0]], 0.016, 'beige');
    path(b, [[0.002, 0.058, 0], [-0.012, 0.064, 0], [-0.026, 0.055, 0], [-0.03, 0.035, 0]], 0.004, '#cfe8f2');
    return b.ball(0.014, [-0.03, 0.028, 0], { color: 'white' }).ball(0.005, [0.008, 0.034, 0.007], { color: 'darkgray' }).done();
  }),
  e('hearse', 'garage', 'cars', () => {
    const b = m('hearse', { view: 'side' }).box([1.9, 0.72, 5.8], [0, 0.68, 0], { color: 'black', round: 0.4 });
    b.box([1.75, 0.55, 1.4], [0, 1.28, 0.9], { color: 'black', round: 0.4 }).box([1.77, 0.38, 1.2], [0, 1.3, 1.0], { color: '#556070', round: 0.3 });
    b.box([1.8, 0.75, 2.8], [0, 1.4, -1.25], { color: 'black', round: 0.15 });
    b.box([1.82, 0.4, 1.7], [0, 1.45, -1.0], { color: '#556070', round: 0.2 });
    b.box([1.84, 0.36, 0.08], [0, 1.45, -1.0], { color: 'cream', noInk: true });
    b.pair((s) => path(b, [[s * 0.92, 1.6, -2.0], [s * 0.93, 1.45, -2.2], [s * 0.92, 1.3, -2.4]], 0.04, 'silver'));
    b.box([1.92, 0.06, 5.7], [0, 0.82, 0], { color: 'silver', noInk: true });
    for (const z of [1.8, -1.9]) b.pair((s) => wheel(b, 0.66, [s * 0.85, 0.33, z], { name: s === 1 && z > 0 ? 'wheel' : undefined }));
    return b.pair((s) => b.ball([0.3, 0.16, 0.06], [s * 0.6, 0.72, 2.9], { color: 'yellow', glow: true })).done();
  }),
  e('heart (organ)', 'clinic', 'organs', () => {
    const red = '#b0303a';
    const b = m('heart (organ)').ball([0.09, 0.11, 0.08], [0, 0.065, 0], { color: red, rot: [0, 0, -15] });
    b.ball([0.04, 0.04, 0.05], [-0.035, 0.11, -0.005], { color: '#9a2a34' }).ball([0.035, 0.035, 0.04], [0.035, 0.11, -0.01], { color: '#9a2a34' });
    arc(b, [0.0, 0.125, 0], 0.025, 0.032, 0, 180, 5, 0.022, '#c84050');
    b.stick([0.025, 0.125, 0], [0.03, 0.15, 0], 0.012, '#c84050').stick([-0.005, 0.15, 0], [-0.005, 0.175, 0], 0.012, '#c84050');
    b.rod([0.01, 0.1, 0.03], [0.03, 0.16, 0.02], 0.02, '#4e6fc8');
    b.rod([-0.045, 0.08, 0], [-0.05, 0.16, -0.01], 0.022, '#4e6fc8');
    return path(b, [[-0.01, 0.1, 0.04], [0.005, 0.07, 0.042], [0.0, 0.03, 0.03]], 0.006, '#e8c060', { noInk: true }).done();
  }),
  e('heart (shape)', 'ideas', 'shapes', () => m('heart (shape)').heart(0.09, [0, 0.055, 0], { color: 'red' }).done()),
  e('heat detector', 'home', 'safety', () =>
    m('heat detector')
      .cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'white' })
      .cyl([0.1, 0.035, 0.1], [0, 0.037, 0], { color: 'white', taper: 0.7 })
      .cyl([0.035, 0.02, 0.035], [0, 0.062, 0], { color: 'silver' })
      .ball(0.02, [0, 0.074, 0], { color: 'darkgray' })
      .ball(0.01, [0.035, 0.04, 0.03], { color: 'red', glow: true })
      .done(),
  ),
  e('heater', 'home', 'heating', () => {
    const b = m('heater').box([0.5, 0.5, 0.18], [0, 0.3, 0], { color: 'cream', round: 0.25 });
    b.pair((s) => b.box([0.08, 0.05, 0.28], [s * 0.18, 0.025, 0], { color: 'gray' }));
    b.box([0.38, 0.32, 0.01], [0, 0.31, 0.09], { color: 'darkgray', round: 0.2 });
    for (const y of [0.21, 0.31, 0.41]) b.stick([-0.16, y, 0.1], [0.16, y, 0.1], 0.025, 'fire', { glow: true });
    for (const x of [-0.12, 0, 0.12]) b.stick([x, 0.16, 0.105], [x, 0.46, 0.105], 0.008, 'silver');
    b.cyl([0.05, 0.03, 0.05], [0.15, 0.56, 0.03], { color: 'black' });
    return b.torus([0.16, 0.08, 0.025], [-0.05, 0.57, 0], { color: 'darkgray' }).done();
  }),
  e('hedge', 'garden', 'shrubs', () => {
    const b = m('hedge').box([3.0, 1.35, 1.0], [0, 0.675, 0], { color: 'darkgreen', round: 0.5 });
    for (const [x, y, z] of [[-1.1, 1.3, 0.1], [-0.4, 1.36, -0.1], [0.4, 1.32, 0.15], [1.1, 1.3, -0.05], [-0.8, 0.8, 0.45], [0.2, 0.6, 0.48], [1.0, 0.9, 0.45], [-0.3, 1.0, 0.45]] as const) b.ball([0.6, 0.35, 0.4], [x, y, z], { color: '#4f8f45' });
    return b.done();
  }),
  e('hedge trimmer', 'garden', 'garden tools', () => {
    const b = m('hedge trimmer', { view: 'side' }).box([0.06, 0.02, 0.6], [0, 0.11, 0.4], { color: 'steel', round: 0.1 });
    b.each(11, (i) => b.box([0.11, 0.012, 0.018], [0, 0.11, 0.15 + i * 0.05], { color: 'steel', round: 0.3 }));
    b.box([0.13, 0.15, 0.32], [0, 0.11, -0.05], { color: 'orange', round: 0.35 });
    b.torus([0.2, 0.18, 0.035], [0, 0.22, -0.28], { color: 'black', rot: [0, 90, 0] });
    b.torus([0.24, 0.2, 0.03], [0, 0.17, 0.08], { color: 'black', rot: [0, 0, 0] });
    return b.box([0.1, 0.08, 0.12], [0, 0.07, -0.24], { color: 'darkgray', round: 0.2 }).done();
  }),
  e('heels', 'wardrobe', 'shoes', () => {
    const b = m('heels', { view: 'side' });
    return b.pair((s) => {
      const x = s * 0.05;
      b.stick([x, 0, -0.105], [x, 0.09, -0.095], 0.012, 'black');
      b.ball([0.065, 0.055, 0.07], [x, 0.1, -0.08], { color: 'red' });
      b.box([0.062, 0.014, 0.15], [x, 0.058, -0.005], { color: 'red', rot: [33, 0, 0] });
      b.ball([0.066, 0.042, 0.085], [x, 0.022, 0.07], { color: 'red' });
      b.box([0.06, 0.008, 0.07], [x, 0.004, 0.075], { color: 'black' });
    }).done();
  }),
  e('heirloom', 'home', 'decor', () => {
    const b = m('heirloom').box([0.18, 0.04, 0.14], [0, 0.02, 0], { color: 'maroon', round: 0.6 });
    b.cyl([0.09, 0.022, 0.09], [0, 0.085, 0], { color: 'gold', rot: [90, 0, 0] }).cyl([0.074, 0.006, 0.074], [0, 0.085, 0.01], { color: 'cream', rot: [90, 0, 0] });
    b.box([0.004, 0.028, 0.004], [0, 0.096, 0.014], { color: 'black' }).box([0.022, 0.004, 0.004], [0.01, 0.085, 0.014], { color: 'black' });
    b.cyl([0.014, 0.014, 0.014], [0, 0.135, 0], { color: 'gold' }).torus([0.026, 0.026, 0.005], [0, 0.152, 0], { color: 'gold' });
    return path(b, [[0, 0.164, 0], [0.04, 0.13, 0.01], [0.07, 0.07, 0.03], [0.06, 0.045, 0.05]], 0.005, 'gold').done();
  }),
  e('helicopter', 'garage', 'aircraft', () => {
    const b = m('helicopter', { view: 'side' }).ball([1.4, 1.5, 3.0], [0, 1.25, 0.2], { color: 'red' }).ball([1.25, 1.05, 1.5], [0, 1.4, 0.95], { color: 'glass' });
    b.stick([0, 1.45, -0.9], [0, 1.75, -4.0], 0.32, 'red', { taper: 0.6 });
    b.box([0.07, 0.75, 0.5], [0, 2.0, -3.95], { color: 'red', rot: [-15, 0, 0] });
    b.box([0.04, 0.9, 0.1], [0.12, 1.85, -4.0], { color: 'darkgray' }).box([0.04, 0.1, 0.9], [0.12, 1.85, -4.0], { color: 'darkgray' });
    b.cyl([0.2, 0.35, 0.2], [0, 2.1, 0.2], { color: 'darkgray' });
    b.box([0.25, 0.05, 8.0], [0, 2.3, 0.2], { color: 'darkgray', name: 'rotor' }).box([8.0, 0.05, 0.25], [0, 2.3, 0.2], { color: 'darkgray', parent: 'rotor' });
    b.pair((s) => {
      b.stick([s * 0.6, 0.05, -1.0], [s * 0.6, 0.05, 1.3], 0.08, 'darkgray').rod([s * 0.6, 0.05, 1.3], [s * 0.6, 0.18, 1.55], 0.08, 'darkgray');
      b.rod([s * 0.6, 0.05, 0.8], [s * 0.4, 0.6, 0.7], 0.07, 'darkgray').rod([s * 0.6, 0.05, -0.5], [s * 0.4, 0.6, -0.5], 0.07, 'darkgray');
    });
    return b.done();
  }),
  e('helmet', 'sports', 'protective gear', () =>
    m('helmet')
      .ball([0.28, 0.27, 0.31], [0, 0.15, 0], { color: 'red' })
      .ball([0.22, 0.1, 0.12], [0, 0.17, 0.11], { color: '#2a2f3a' })
      .box([0.2, 0.08, 0.12], [0, 0.05, 0.1], { color: 'red', round: 0.6 })
      .box([0.05, 0.02, 0.3], [0, 0.285, -0.01], { color: 'white', noInk: true, round: 0.5 })
      .cyl([0.2, 0.02, 0.22], [0, 0.02, -0.01], { color: 'black' })
      .done(),
  ),
  e('hemisphere', 'ideas', 'shapes', () => {
    const b = m('hemisphere').cyl([6.2, 0.15, 6.2], [0, 0.075, 0], { color: 'cream' });
    dome(b, 3, 3, [0, 0.15, 0], 'water');
    for (const [la, lo, w] of [[20, -30, 1.4], [40, 35, 1.2], [15, 75, 1.0], [60, -10, 1.0], [25, 160, 1.3], [35, -110, 1.1]] as const) {
      const a = (la * Math.PI) / 180, o = (lo * Math.PI) / 180;
      b.ball([w, w * 0.45, w * 0.8], [3 * Math.cos(a) * Math.sin(o), 0.15 + 3 * Math.sin(a), 3 * Math.cos(a) * Math.cos(o)], { color: 'grass', noInk: true });
    }
    return b.done();
  }),
  e('herbs', 'garden', 'herbs', () => {
    const b = m('herbs').cyl([0.12, 0.12, 0.12], [0, 0.06, 0], { color: '#c8643c', taper: 1.3 }).cyl([0.18, 0.03, 0.18], [0, 0.125, 0], { color: '#c8643c' });
    b.cyl([0.15, 0.01, 0.15], [0, 0.14, 0], { color: 'dirt' });
    b.ball([0.2, 0.14, 0.18], [0, 0.22, 0], { color: '#4f9a3c', name: 'top' });
    for (const [x, y, z] of [[0.08, 0.25, 0.05], [-0.07, 0.27, 0.04], [0, 0.29, -0.04], [0.02, 0.21, 0.09], [-0.09, 0.2, -0.03]] as const) b.ball([0.06, 0.03, 0.05], [x, y, z], { color: '#62b048', parent: 'top', rot: [0, 0, x * 300] });
    return b.done();
  }),
  e('hexagon', 'ideas', 'shapes', () => {
    const b = m('hexagon').box([0.07, 0.015, 0.04], [0, 0.0075, 0], { color: 'darkwood' });
    return hexagon(b, 0.05, [0, 0.058, 0], 'purple', 0.025).done();
  }),
  e('high chair', 'home', 'baby things', () => {
    const b = m('high chair').box([0.36, 0.08, 0.34], [0, 0.55, 0], { color: 'skyblue' });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) b.rod([x * 0.15, 0.55, z * 0.14], [x * 0.25, 0.01, z * 0.25], 0.035, 'white');
    b.box([0.34, 0.4, 0.05], [0, 0.78, -0.16], { color: 'skyblue' });
    b.pair((s) => b.box([0.04, 0.04, 0.3], [s * 0.17, 0.68, 0.0], { color: 'white' }));
    b.box([0.48, 0.035, 0.22], [0, 0.72, 0.23], { color: 'white', round: 0.4 });
    return b.box([0.42, 0.03, 0.12], [0, 0.25, 0.2], { color: 'white' }).done();
  }),
  e('highlighter', 'study', 'stationery', () =>
    m('highlighter')
      .box([0.026, 0.09, 0.02], [0, 0.045, 0], { color: '#f6e84a', round: 0.5 })
      .box([0.028, 0.045, 0.022], [0, 0.11, 0], { color: '#e8d020', round: 0.5 })
      .box([0.006, 0.035, 0.005], [0, 0.11, 0.013], { color: '#e8d020' })
      .box([0.027, 0.02, 0.021], [0, 0.04, 0], { color: 'black', noInk: true, round: 0.5 })
      .done(),
  ),
  e('highway', 'places', 'roads', () => {
    const Y = 0.75;
    const b = m('highway').box([8, Y, 9], [0, Y / 2, 0], { color: '#4a4a4e', round: 0.05 });
    b.box([0.35, 0.6, 9], [0, Y + 0.3, 0], { color: 'stone' });
    b.pair((s) => {
      b.each(4, (i) => b.box([0.15, 0.02, 1.0], [s * 1.9, Y + 0.01, -3.3 + i * 2.2], { color: 'white', noInk: true }));
      b.box([0.15, 0.02, 9], [s * 3.7, Y + 0.01, 0], { color: 'yellow', noInk: true });
      b.stick([s * 4.2, 0, -2], [s * 4.2, 4.3, -2], 0.25, 'steel');
      b.box([0.1, 0.3, 9], [s * 3.95, Y + 0.45, 0], { color: 'silver' });
    });
    b.box([8.6, 0.3, 0.3], [0, 4.1, -2], { color: 'steel' });
    b.label('EXIT 12', [2.6, 1.1], [2, 3.4, -1.84], { color: 'darkgreen' });
    b.label('NORTH 95', [2.6, 1.1], [-2, 3.4, -1.84], { color: 'darkgreen' });
    b.box([1.5, 0.6, 3.2], [1.9, Y + 0.45, 1.5], { color: 'blue', round: 0.5 }).box([1.3, 0.45, 1.6], [1.9, Y + 0.9, 1.3], { color: 'glass', round: 0.5 });
    return b.done();
  }),
  e('hill', 'nature', 'landforms', () => {
    const b = m('hill');
    dome(b, 6, 4, [0, 0, 0], 'grass');
    b.stick([0.5, 3.7, -0.5], [0.5, 5.0, -0.5], 0.3, 'bark').ball(1.6, [0.5, 5.4, -0.5], { color: 'leaf', name: 'top' });
    for (const [x, y, z] of [[0.5, 3.2, 2.0], [1.2, 2.2, 3.6], [1.6, 1.0, 4.8]] as const) b.ball([0.9, 0.2, 0.7], [x, y, z], { color: 'dirt', noInk: true });
    for (const [x, y, z, c] of [[-2, 2.7, 3.0, 'yellow'], [-3, 2.0, 3.5, 'white'], [2.8, 2.3, 3.2, 'pink']] as const) b.ball(0.25, [x, y, z], { color: c });
    return b.done();
  }),
  e('hinge', 'workshop', 'hardware', () => {
    const b = m('hinge').cyl([0.013, 0.09, 0.013], [0, 0.05, 0], { color: 'steel' });
    b.pair((s) => {
      b.box([0.042, 0.088, 0.004], [s * 0.022, 0.05, 0.007], { color: 'steel', rot: [0, -s * 20, 0], round: 0.1 });
      for (const y of [0.025, 0.075]) b.ball([0.008, 0.008, 0.006], [s * 0.026, y, 0.012], { color: 'darkgray' });
    });
    return b.ball(0.014, [0, 0.096, 0], { color: 'steel' }).ball(0.014, [0, 0.004, 0], { color: 'steel' }).done();
  }),
  e('history museum', 'places', 'museums', () => {
    const b = m('history museum').box([8, 0.6, 5], [0, 0.3, 0], { color: 'stone' });
    b.each(3, (i) => b.box([5 - i * 0.6, 0.2, 0.5], [0, 0.1 + i * 0.2, 2.75 - i * 0.25], { color: 'stone' }));
    b.box([6.6, 3.6, 3.4], [0, 2.4, -0.5], { color: 'cream' });
    b.each(6, (i) => b.cyl([0.45, 3.6, 0.45], [-3 + i * 1.2, 2.4, 1.8], { color: 'white' }));
    b.box([7.6, 0.5, 4.6], [0, 4.45, 0], { color: 'white' });
    b.wedge([7.8, 1.4, 4.6], [0, 5.4, 0], { color: 'white' });
    b.box([1.2, 2.2, 0.08], [0, 1.7, 1.25], { color: 'darkwood', name: 'door', pivot: [-0.6, 1.7, 1.25] });
    return b.label('HISTORY MUSEUM', [4.5, 0.45], [0, 4.45, 2.32], { color: 'cream' }).done();
  }),
  e('hitch', 'garage', 'car parts', () =>
    m('hitch')
      .box([0.5, 0.06, 0.06], [0, 0.035, -0.15], { color: 'black' })
      .box([0.075, 0.075, 0.2], [0, 0.04, -0.03], { color: 'black', round: 0.1 })
      .box([0.055, 0.055, 0.15], [0, 0.04, 0.12], { color: 'steel', round: 0.1 })
      .stick([-0.06, 0.04, 0.0], [0.06, 0.04, 0.0], 0.014, 'silver')
      .box([0.065, 0.11, 0.05], [0, 0.07, 0.2], { color: 'steel', round: 0.2 })
      .cyl([0.028, 0.025, 0.028], [0, 0.135, 0.2], { color: 'silver' })
      .ball(0.055, [0, 0.17, 0.2], { color: 'silver' })
      .done(),
  ),
  e('hockey goal', 'sports', 'hockey', () => {
    const b = m('hockey goal').wedge([1.0, 1.2, 1.8], [0, 0.6, -0.5], { color: 'white', rot: [0, 90, 0], apex: -0.5 });
    for (const y of [0.3, 0.6, 0.9]) b.stick([-0.9, y, -0.5 + (1.2 - y) / 1.2 * 0.5 - 0.25], [0.9, y, -0.5 + (1.2 - y) / 1.2 * 0.5 - 0.25], 0.012, 'lightgray', { noInk: true });
    b.pair((s) => b.stick([s * 0.9, 0, 0.02], [s * 0.9, 1.22, 0.02], 0.06, 'red'));
    b.stick([-0.93, 1.2, 0.02], [0.93, 1.2, 0.02], 0.06, 'red');
    return path(b, [[-0.9, 0.03, 0.02], [-0.8, 0.03, -0.7], [0, 0.03, -1.05], [0.8, 0.03, -0.7], [0.9, 0.03, 0.02]], 0.06, 'red').done();
  }),
  e('hockey puck', 'sports', 'hockey', () =>
    m('hockey puck')
      .box([0.16, 0.012, 0.1], [0, 0.006, 0], { color: 'ice', round: 0.5 })
      .cyl([0.076, 0.025, 0.076], [0, 0.05, 0], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.04, 0.027, 0.04], [0, 0.05, 0], { color: 'darkgray', rot: [90, 0, 0], noInk: true })
      .done(),
  ),
  e('hockey stick', 'sports', 'hockey', () =>
    m('hockey stick')
      .box([0.5, 0.11, 0.25], [0.02, 0.055, 0], { color: 'darkgray', round: 0.3 })
      .stick([0.05, 0.12, 0], [-0.12, 1.5, 0], 0.035, 'lightwood')
      .stick([-0.09, 1.25, 0], [-0.125, 1.52, 0], 0.04, 'black')
      .box([0.3, 0.07, 0.022], [0.16, 0.15, 0], { color: 'black', round: 0.3, rot: [0, 0, 6] })
      .done(),
  ),
  e('hoe (tool)', 'garden', 'garden tools', () =>
    m('hoe (tool)')
      .ball([0.45, 0.2, 0.4], [0, 0.05, 0], { color: 'dirt' })
      .stick([0, 0.1, 0], [0, 1.5, 0], 0.035, 'wood')
      .rod([0, 0.18, 0], [0, 0.16, 0.08], 0.018, 'iron')
      .box([0.16, 0.13, 0.01], [0, 0.18, 0.09], { color: 'steel', round: 0.1 })
      .done(),
  ),
  e('hole puncher', 'study', 'office supplies', () => {
    const b = m('hole puncher').box([0.15, 0.02, 0.1], [0, 0.01, 0], { color: 'black', round: 0.3 }).box([0.14, 0.05, 0.05], [0, 0.045, -0.02], { color: 'gray', round: 0.2 });
    b.box([0.15, 0.022, 0.1], [0, 0.085, 0.005], { color: 'silver', rot: [-10, 0, 0], round: 0.4 });
    b.pair((s) => b.cyl([0.022, 0.03, 0.022], [s * 0.04, 0.06, 0.02], { color: 'steel' }));
    for (const [x, z] of [[0.1, 0.07], [0.12, 0.03], [-0.1, 0.08], [0.08, 0.1]] as const) b.cyl([0.012, 0.003, 0.012], [x, 0.0015, z], { color: 'white' });
    return b.done();
  }),
  e('holster', 'armory', 'gun gear', () =>
    m('holster')
      .box([0.07, 0.17, 0.045], [0, 0.085, 0], { color: 'leather', round: 0.4, rot: [0, 0, 8] })
      .box([0.032, 0.09, 0.03], [-0.02, 0.2, 0], { color: 'black', rot: [0, 0, 20], round: 0.3 })
      .box([0.075, 0.02, 0.04], [-0.005, 0.15, 0.012], { color: 'darkbrown', rot: [0, 0, 8] })
      .ball(0.012, [0.01, 0.15, 0.033], { color: 'silver' })
      .box([0.06, 0.08, 0.02], [0.01, 0.12, -0.03], { color: 'darkbrown' })
      .done(),
  ),
  e('holy water', 'fantasy', 'magic items', () => {
    const b = m('holy water');
    bottle(b, 0, 0, 0.2, 0.08, '#9fd4f0', 'gold', undefined, 0.3);
    b.box([0.012, 0.055, 0.006], [0, 0.065, 0.041], { color: 'gold' }).box([0.035, 0.012, 0.006], [0, 0.075, 0.041], { color: 'gold' });
    return b.star(0.03, [0.06, 0.17, 0.02], { color: 'yellow', glow: true }).star(0.02, [-0.055, 0.13, 0.02], { color: 'yellow', glow: true }).done();
  }),
  e('home gym', 'sports', 'gym', () => {
    const b = m('home gym').box([1.4, 0.06, 1.8], [0, 0.03, 0], { color: 'darkgray' });
    b.pair((s) => b.box([0.08, 2.1, 0.08], [s * 0.3, 1.11, -0.6], { color: 'black' }));
    b.box([0.8, 0.08, 0.1], [0, 2.18, -0.6], { color: 'black' });
    b.box([0.42, 0.55, 0.22], [0, 0.4, -0.6], { color: 'darkgray', round: 0.05 });
    b.each(6, (i) => b.box([0.44, 0.012, 0.23], [0, 0.17 + i * 0.09, -0.6], { color: 'black', noInk: true }));
    b.stick([0, 0.7, -0.6], [0, 2.14, -0.6], 0.02, 'silver');
    b.box([0.35, 0.1, 0.9], [0, 0.48, 0.25], { color: 'red', round: 0.4 }).box([0.35, 0.8, 0.1], [0, 0.95, -0.25], { color: 'red', round: 0.4 });
    b.stick([0, 0.06, 0.25], [0, 0.43, 0.25], 0.06, 'black');
    b.pair((s) => b.rod([s * 0.3, 1.2, -0.55], [s * 0.4, 1.2, 0.05], 0.05, 'black').stick([s * 0.4, 1.12, 0.05], [s * 0.4, 1.28, 0.05], 0.04, 'rubber'));
    return b.done();
  }),
  e('homeless shelter', 'places', 'public buildings', () => {
    const b = bld('homeless shelter', { w: 7, h: 4, d: 5, wall: '#d9b98a', roof: 'brown', sign: 'SHELTER' });
    b.heart(1.0, [0, 5.0, 2.6], { color: 'red' });
    return b.box([1.6, 0.1, 0.5], [2.5, 0.5, 3.2], { color: 'wood' }).pair((s) => b.stick([2.5 + s * 0.7, 0, 3.2], [2.5 + s * 0.7, 0.45, 3.2], 0.08, 'darkwood')).done();
  }),
  e('homing missile', 'armory', 'missiles', () => {
    const u: V = [0, Math.cos((70 * Math.PI) / 180), Math.sin((70 * Math.PI) / 180)];
    const P = (t: number): V => [0, 1.4 + u[1] * t, u[2] * t];
    const b = m('homing missile', { view: 'side' }).cyl([0.36, 3.2, 0.36], P(0), { color: 'white', rot: [70, 0, 0] });
    b.cyl([0.36, 0.7, 0.36], P(1.95), { color: 'white', rot: [70, 0, 0], taper: 0.15 }).ball(0.08, P(2.3), { color: 'darkgray' });
    for (const t of [0.9, -0.9]) b.cyl([0.37, 0.12, 0.37], P(t), { color: 'red', rot: [70, 0, 0] });
    b.box([1.0, 0.55, 0.04], P(-1.3), { color: 'darkgray', rot: [70, 0, 0] }).box([0.04, 0.55, 1.0], P(-1.3), { color: 'darkgray', rot: [70, 0, 0] });
    b.box([0.6, 0.25, 0.03], P(1.1), { color: 'darkgray', rot: [70, 0, 0] });
    return b.cone([0.3, 0.9, 0.3], P(-2.05), { color: 'fire', rot: [250, 0, 0], glow: true }).done();
  }),
  e('honey', 'food', 'sweets', () => {
    const b = m('honey').ball([0.16, 0.15, 0.16], [0, 0.075, 0], { color: 'honey' }).cyl([0.11, 0.03, 0.11], [0, 0.15, 0], { color: 'honey' });
    b.torus([0.115, 0.115, 0.02], [0, 0.165, 0], { color: '#d9902a', rot: [90, 0, 0] });
    b.label('HONEY', [0.08, 0.04], [0, 0.07, 0.072], { color: 'cream' });
    b.stick([0.01, 0.12, 0], [0.07, 0.3, 0], 0.014, 'wood');
    b.ball([0.035, 0.022, 0.03], [0.02, 0.16, 0], { color: 'wood' });
    return b.capsule([0.02, 0.05, 0.02], [0.055, 0.13, 0.04], { color: '#f0b040' }).done();
  }),
  e('honeycomb', 'food', 'sweets', () => {
    const b = m('honeycomb'), r = 0.03, d = r * Math.sqrt(3), c: V = [0, 0.085, 0];
    const cells: V[] = [c, ...[0, 60, 120, 180, 240, 300].map((a): V => [c[0] + d * Math.cos((a * Math.PI) / 180), c[1] + d * Math.sin((a * Math.PI) / 180), 0])];
    cells.forEach((p, i) => {
      hexagon(b, r * 0.99, p, '#e8b030', 0.03);
      hexagon(b, r * 0.72, [p[0], p[1], 0.006], i % 3 ? '#c98a1a' : '#f2d27a', 0.03, { noInk: true });
    });
    return b.done();
  }),
  e('hood (clothes)', 'wardrobe', 'clothes', () => {
    const b = m('hood (clothes)').box([0.44, 0.34, 0.24], [0, 0.17, 0], { color: 'gray', round: 0.4 });
    b.pair((s) => b.rod([s * 0.2, 0.3, 0], [s * 0.27, 0.12, 0], 0.11, 'gray'));
    b.box([0.24, 0.1, 0.02], [0, 0.08, 0.12], { color: '#8a9096', round: 0.4 });
    b.ball([0.3, 0.34, 0.3], [0, 0.44, -0.04], { color: 'gray' });
    b.ball([0.17, 0.24, 0.08], [0, 0.43, 0.085], { color: '#2e2a28' });
    b.torus([0.2, 0.28, 0.035], [0, 0.43, 0.095], { color: '#a4aab0', tube: 0.15 });
    return b.pair((s) => b.rod([s * 0.04, 0.33, 0.13], [s * 0.05, 0.2, 0.135], 0.012, 'white').ball(0.016, [s * 0.05, 0.19, 0.135], { color: 'silver' })).done();
  }),
  e('hook', 'workshop', 'hardware', () => {
    const b = m('hook').torus([0.032, 0.032, 0.01], [0, 0.133, 0], { color: 'steel', tube: 0.25 });
    b.stick([0, 0.117, 0], [0, 0.031, 0], 0.012, 'steel');
    arc(b, [0.025, 0.031, 0], 0.025, 0.025, 180, 360, 6, 0.012, 'steel');
    return b.rod([0.05, 0.031, 0], [0.05, 0.06, 0], 0.011, 'steel').rod([0.05, 0.062, 0], [0.042, 0.05, 0], 0.008, 'steel').done();
  }),
  e('horn (animal)', 'wild', 'antlers and horns', () => {
    const b = m('horn (animal)').box([0.22, 0.06, 0.15], [0, 0.03, 0], { color: 'darkwood', round: 0.3 });
    const pts: V[] = [[-0.05, 0.05, 0], [-0.03, 0.17, 0], [0.03, 0.29, 0], [0.11, 0.37, 0], [0.19, 0.41, 0], [0.25, 0.4, 0]];
    const th = [0.095, 0.08, 0.065, 0.048, 0.032, 0.016];
    const cs = ['#efe3c8', '#e6d5b0', '#d9c39a', '#b89a70', '#7a5a3a'];
    for (let i = 0; i < pts.length - 1; i++) {
      b.stick(pts[i], pts[i + 1], th[i], cs[i], { taper: th[i + 1] / th[i] });
      if (i) b.ball(th[i], pts[i], { color: cs[i] });
    }
    return b.done();
  }),
  e('horns', 'wild', 'antlers and horns', () => {
    const b = m('horns').box([0.26, 0.32, 0.05], [0, 0.16, 0], { color: 'darkwood', round: 0.4 }).ball([0.1, 0.08, 0.08], [0, 0.26, 0.04], { color: 'cream' });
    const c = '#d9c3a0';
    return b.pair((s) => {
      path(b, [[s * 0.03, 0.28, 0.05], [s * 0.12, 0.38, 0.06], [s * 0.18, 0.5, 0.05], [s * 0.16, 0.64, 0.03]], 0.028, c);
      b.rod([s * 0.12, 0.38, 0.06], [s * 0.1, 0.47, 0.09], 0.02, c);
      b.rod([s * 0.17, 0.48, 0.05], [s * 0.24, 0.58, 0.06], 0.018, c);
      b.rod([s * 0.175, 0.56, 0.04], [s * 0.12, 0.65, 0.05], 0.016, c);
    }).done();
  }),
  e('horror mask', 'toys', 'masks', () => {
    const b = m('horror mask').ball([0.19, 0.25, 0.09], [0, 0.13, 0], { color: '#efe8d6' });
    b.pair((s) => {
      b.ball([0.045, 0.03, 0.02], [s * 0.04, 0.17, 0.035], { color: 'black' });
      b.wedge([0.035, 0.025, 0.01], [s * 0.05, 0.1, 0.04], { color: 'red', noInk: true, rot: [0, 0, 180] });
      for (const [x, y] of [[0.02, 0.07], [0.04, 0.05], [0.06, 0.08], [0.015, 0.04]] as const) b.ball(0.01, [s * x, y, 0.04], { color: 'black', noInk: true });
    });
    b.wedge([0.05, 0.03, 0.01], [0, 0.225, 0.035], { color: 'red', noInk: true, rot: [0, 0, 180] });
    return b.torus([0.2, 0.08, 0.012], [0, 0.17, -0.02], { color: 'black', rot: [90, 0, 0] }).done();
  }),
  e('horse carriage', 'garage', 'carriages', () => {
    const b = m('horse carriage', { view: 'side' }).box([1.3, 1.1, 1.7], [0, 1.35, -0.4], { color: 'maroon', round: 0.3 });
    b.box([1.45, 0.1, 1.9], [0, 1.95, -0.4], { color: 'black', round: 0.3 });
    b.pair((s) => {
      b.box([0.04, 0.45, 0.6], [s * 0.66, 1.5, -0.4], { color: 'glass' });
      b.ball(0.12, [s * 0.65, 1.75, 0.5], { color: 'yellow', glow: true });
      b.rod([s * 0.4, 0.7, 0.9], [s * 0.4, 0.9, 2.4], 0.06, 'darkwood');
    });
    b.box([1.2, 0.12, 0.5], [0, 1.55, 0.75], { color: 'black' }).box([1.2, 0.35, 0.08], [0, 1.75, 0.55], { color: 'black' });
    b.box([1.0, 0.08, 0.5], [0, 0.95, 1.05], { color: 'darkwood' });
    b.box([0.2, 0.15, 2.4], [0, 0.75, 0.1], { color: 'black' });
    b.pair((s) => spoked(b, 1.3, [s * 0.75, 0.65, -0.7], 'darkred', s === 1 ? 'wheel' : undefined));
    return b.pair((s) => spoked(b, 0.9, [s * 0.7, 0.45, 0.85], 'darkred')).done();
  }),
  e('horse radish', 'food', 'vegetables', () => {
    const b = m('horse radish').cone([0.065, 0.2, 0.06], [0, 0.1, 0], { color: '#e3d3b0', rot: [180, 0, 0] });
    for (const [x, y] of [[0.025, 0.15], [-0.022, 0.12], [0.015, 0.07]] as const) b.ball([0.025, 0.02, 0.025], [x, y, 0.01], { color: '#cdb98f' });
    b.ball([0.06, 0.03, 0.055], [0, 0.2, 0], { color: '#cdb98f' });
    return b.pair((s) => b.ball([0.04, 0.16, 0.012], [s * 0.035, 0.29, 0], { color: 'leaf', rot: [0, 0, -s * 20] })).ball([0.035, 0.14, 0.012], [0, 0.29, -0.01], { color: 'darkgreen' }).done();
  }),
  e('horse tail', 'farm', 'horse gear', () => {
    const b = m('horse tail').box([0.34, 0.06, 0.22], [0, 0.03, 0], { color: 'darkwood' }).stick([-0.13, 0.06, -0.05], [-0.13, 0.86, -0.05], 0.035, 'wood');
    b.rod([-0.13, 0.84, -0.05], [-0.02, 0.84, -0.02], 0.025, 'wood');
    b.capsule([0.07, 0.14, 0.07], [0.0, 0.76, 0], { color: '#4a2e1a' }).torus([0.08, 0.08, 0.025], [0, 0.72, 0], { color: 'red', rot: [90, 0, 0] });
    b.ball([0.16, 0.36, 0.1], [0.03, 0.52, 0], { color: '#5a3a22', rot: [0, 0, -8] });
    b.ball([0.2, 0.34, 0.11], [0.06, 0.26, 0.01], { color: '#4a2e1a', rot: [0, 0, 10] });
    for (let i = 0; i < 6; i++) path(b, [[0.02 + i * 0.008, 0.66, 0.02], [0.05 + i * 0.015, 0.42, 0.03 - i * 0.008], [0.0 + i * 0.03, 0.2, 0.03], [0.06 + i * 0.025, 0.07, 0.02 - i * 0.008]], 0.04, i % 2 ? '#3a2416' : '#6a4428');
    return b.done();
  }),
  e('horseshoe', 'farm', 'horse gear', () => {
    const b = m('horseshoe');
    arc(b, [0, 0.062, 0], 0.05, 0.054, 125, 415, 12, 0.017, 'iron');
    for (const a of [160, 200, 240, 300, 340, 380]) b.ball(0.006, [0.05 * Math.cos((a * Math.PI) / 180), 0.062 + 0.054 * Math.sin((a * Math.PI) / 180), 0.008], { color: 'black', noInk: true });
    return b.done();
  }),
  e('hose', 'garden', 'garden things', () => {
    const b = m('hose');
    b.pair((s) => {
      b.rod([s * 0.25, 0.05, 0.15], [s * 0.25, 0.75, -0.1], 0.035, 'darkgreen');
      b.rod([s * 0.25, 0.05, -0.2], [s * 0.25, 0.45, -0.05], 0.035, 'darkgreen');
    });
    b.cyl([0.3, 0.44, 0.3], [0, 0.45, 0], { color: 'darkgray', rot: [0, 0, 90] });
    b.each(7, (i) => b.torus([0.44, 0.44, 0.055], [-0.15 + i * 0.05, 0.45, 0], { color: 'green', rot: [0, 90, 0], tube: 0.25 }));
    b.stick([-0.25, 0.75, -0.1], [0.25, 0.75, -0.1], 0.035, 'darkgreen');
    b.box([0.03, 0.12, 0.03], [0.29, 0.45, 0.05], { color: 'black', name: 'crank', pivot: [0.29, 0.45, 0] }).stick([0.29, 0.5, 0.06], [0.36, 0.5, 0.06], 0.025, 'black', { parent: 'crank' });
    b.pair((s) => wheel(b, 0.18, [s * 0.3, 0.09, 0.15], { color: 'black', name: s === 1 ? 'wheel' : undefined }));
    path(b, [[0, 0.24, 0.12], [0.05, 0.03, 0.3], [-0.15, 0.03, 0.5], [0.1, 0.03, 0.65]], 0.04, 'green');
    return b.stick([0.1, 0.035, 0.65], [0.15, 0.04, 0.78], 0.04, 'yellow').done();
  }),
  e('hospital', 'places', 'public buildings', () => {
    const b = bld('hospital', { w: 8, h: 9, d: 6, wall: 'white', flat: true, sign: 'HOSPITAL', door: 'glass' });
    b.box([1.8, 0.55, 0.3], [0, 10.4, 0], { color: 'red', round: 0.1 }).box([0.55, 1.8, 0.3], [0, 10.4, 0], { color: 'red', round: 0.1 });
    return b.stick([0, 9.3, 0], [0, 9.6, 0], 0.3, 'gray').done();
  }),
  e('hospital bed', 'clinic', 'hospital', () => {
    const b = m('hospital bed', { view: 'side' }).box([0.9, 0.12, 2.0], [0, 0.4, 0], { color: 'gray' });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) b.stick([x * 0.38, 0.06, z * 0.88], [x * 0.38, 0.36, z * 0.88], 0.04, 'silver').ball(0.08, [x * 0.38, 0.04, z * 0.88], { color: 'black' });
    b.box([0.85, 0.15, 1.3], [0, 0.53, 0.33], { color: 'white' });
    b.box([0.85, 0.14, 0.75], [0, 0.7, -0.6], { color: 'white', rot: [32, 0, 0] });
    b.ball([0.55, 0.14, 0.3], [0, 0.88, -0.7], { color: 'cream', rot: [32, 0, 0] });
    b.box([0.88, 0.06, 1.1], [0, 0.63, 0.4], { color: 'skyblue', round: 0.4 });
    b.box([0.9, 0.45, 0.06], [0, 0.65, 1.0], { color: 'darkgray' }).box([0.9, 0.7, 0.06], [0, 0.8, -1.0], { color: 'darkgray' });
    b.pair((s) => b.stick([s * 0.46, 0.75, -0.7], [s * 0.46, 0.75, 0.1], 0.03, 'silver'));
    b.stick([0.55, 0, -1.0], [0.55, 1.9, -1.0], 0.03, 'silver').box([0.14, 0.2, 0.05], [0.55, 1.75, -0.95], { color: 'skyblue', round: 0.4 });
    return b.done();
  }),
  e('hot air balloon', 'sky', 'balloons', () => {
    const b = m('hot air balloon').ball([6, 7, 6], [0, 5.6, 0], { color: 'red' });
    for (const a of [0, 45, 90, 135]) b.ball([1.0, 7.04, 6.04], [0, 5.6, 0], { color: 'yellow', rot: [0, a, 0], noInk: true });
    b.cyl([1.4, 1.0, 1.4], [0, 2.1, 0], { color: 'red', taper: 2.2 });
    b.cyl([0.4, 0.3, 0.4], [0, 1.45, 0], { color: 'darkgray' }).cone([0.3, 0.5, 0.3], [0, 1.75, 0], { color: 'flame', glow: true });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) b.rod([x * 0.6, 1.6, z * 0.6], [x * 0.5, 1.0, z * 0.5], 0.04, 'tan');
    b.box([1.2, 1.0, 1.2], [0, 0.5, 0], { color: 'tan', round: 0.15 });
    return b.box([1.24, 0.1, 1.24], [0, 0.98, 0], { color: 'leather', round: 0.4 }).done();
  }),
  e('hot chocolate', 'food', 'drinks', () => {
    const b = m('hot chocolate');
    mug(b, 0, 0, 0.1, 0.09, 'red', 'chocolate');
    b.ball([0.085, 0.045, 0.085], [0, 0.105, 0], { color: 'white' }).ball([0.05, 0.04, 0.05], [0, 0.13, 0], { color: 'white' }).ball(0.02, [0, 0.155, 0], { color: 'white' });
    for (const [x, z] of [[0.03, 0.02], [-0.03, 0.01], [0.0, -0.03]] as const) b.box([0.014, 0.012, 0.014], [x, 0.125, z], { color: 'pink' });
    path(b, [[-0.02, 0.17, 0], [-0.01, 0.19, 0], [-0.025, 0.21, 0]], 0.008, 'lightgray', { noInk: true });
    return path(b, [[0.02, 0.17, 0], [0.03, 0.19, 0], [0.018, 0.215, 0]], 0.008, 'lightgray', { noInk: true }).done();
  }),
  e('hot dog', 'food', 'fast food', () => {
    const b = m('hot dog');
    b.pair((s) => b.capsule([0.04, 0.16, 0.035], [0, 0.022, s * 0.016], { color: 'bread', rot: [0, 0, 90] }));
    b.capsule([0.03, 0.19, 0.03], [0, 0.04, 0], { color: '#b0503a', rot: [0, 0, 90] });
    return path(b, [[-0.07, 0.056, 0], [-0.05, 0.057, 0.008], [-0.03, 0.057, -0.008], [-0.01, 0.057, 0.008], [0.01, 0.057, -0.008], [0.03, 0.057, 0.008], [0.05, 0.057, -0.008], [0.07, 0.056, 0]], 0.007, 'yellow').done();
  }),
  e('hot dog stand', 'places', 'stands', () => {
    const b = m('hot dog stand').box([1.6, 0.9, 0.8], [0, 0.75, 0], { color: 'silver', round: 0.1 });
    b.pair((s) => wheel(b, 0.6, [s * 0.85, 0.3, 0.1], { name: s === 1 ? 'wheel' : undefined }));
    b.stick([-0.6, 0, -0.2], [-0.6, 0.3, -0.2], 0.05, 'darkgray').stick([0.6, 0, -0.2], [0.6, 0.3, -0.2], 0.05, 'darkgray');
    b.label('HOT DOGS', [1.2, 0.3], [0, 0.95, 0.41], { color: 'yellow' });
    b.pair((s) => b.capsule([0.1, 0.6, 0.06], [0, 0.6, 0.41 + s * 0.0], { color: 'bread', rot: [0, 0, 90] }));
    b.capsule([0.07, 0.75, 0.05], [0, 0.62, 0.45], { color: '#b0503a', rot: [0, 0, 90] });
    b.stick([0.3, 1.2, 0], [0.3, 2.2, 0], 0.04, 'silver');
    b.cone([2.0, 0.5, 2.0], [0.3, 2.35, 0], { color: 'red' });
    b.cone([2.02, 0.505, 0.3], [0.3, 2.351, 0], { color: 'white', noInk: true }).cone([0.3, 0.505, 2.02], [0.3, 2.351, 0], { color: 'white', noInk: true });
    return b.cyl([0.08, 0.18, 0.08], [-0.5, 1.29, 0], { color: 'red' }).cyl([0.08, 0.18, 0.08], [-0.35, 1.29, 0], { color: 'yellow' }).done();
  }),
  e('hot plate', 'kitchen', 'appliances', () =>
    m('hot plate')
      .box([0.3, 0.07, 0.25], [0, 0.035, 0], { color: 'white', round: 0.3 })
      .torus([0.18, 0.18, 0.014], [0, 0.074, -0.01], { color: '#e0503a', rot: [90, 0, 0], glow: true })
      .torus([0.12, 0.12, 0.014], [0, 0.074, -0.01], { color: '#e0503a', rot: [90, 0, 0], glow: true })
      .torus([0.06, 0.06, 0.014], [0, 0.074, -0.01], { color: '#e0503a', rot: [90, 0, 0], glow: true })
      .cyl([0.04, 0.02, 0.04], [0.09, 0.04, 0.13], { color: 'black', rot: [90, 0, 0] })
      .ball(0.012, [-0.1, 0.045, 0.125], { color: 'red', glow: true })
      .done(),
  ),
  e('hot sauce', 'food', 'sauces', () => {
    const b = m('hot sauce');
    bottle(b, 0, 0, 0.2, 0.05, 'darkred', 'green', 'cream', 0.4);
    return b.capsule([0.014, 0.04, 0.01], [0, 0.06, 0.027], { color: 'red', rot: [0, 0, 60] }).ball(0.008, [-0.018, 0.071, 0.027], { color: 'green' }).done();
  }),
  e('hot spring', 'nature', 'water', () => {
    const b = m('hot spring').cyl([1.0, 0.06, 0.8], [0, 0.04, 0], { color: '#6fc8d8' });
    around(9, 0.52).forEach(([x, z], i) => b.ball([0.24 + (i % 3) * 0.04, 0.2, 0.22], [x * 1.05, 0.08, z * 0.85], { color: i % 2 ? 'rock' : 'stone' }));
    for (const [x, y, z, r] of [[-0.1, 0.18, 0, 0.12], [0.1, 0.27, 0.05, 0.1], [-0.02, 0.35, -0.05, 0.08], [0.2, 0.2, -0.1, 0.09]] as const) b.ball(r, [x, y, z], { color: 'white', noInk: true });
    return b.done();
  }),
  e('hot tub', 'home', 'outdoor furniture', () => {
    const b = m('hot tub').box([2.0, 0.84, 2.0], [0, 0.42, 0], { color: 'darkwood', round: 0.1 });
    b.box([2.1, 0.08, 2.1], [0, 0.86, 0], { color: 'gray', round: 0.3 });
    b.box([1.7, 0.02, 1.7], [0, 0.9, 0], { color: '#5fc8e0', glow: true });
    for (const [x, z] of [[0.3, 0.2], [-0.4, 0.4], [0.5, -0.3], [-0.2, -0.5], [0, 0]] as const) b.ball(0.08, [x, 0.91, z], { color: 'white', noInk: true });
    for (let i = 0; i < 4; i++) b.box([0.02, 0.82, 0.02], [-0.6 + i * 0.4, 0.42, 1.005], { color: 'darkbrown', noInk: true });
    return b.box([0.8, 0.25, 0.4], [0, 0.125, 1.2], { color: 'wood' }).done();
  }),
  e('hot water bottle', 'home', 'bedroom', () => {
    const b = m('hot water bottle').box([0.2, 0.25, 0.05], [0, 0.125, 0], { color: 'red', round: 0.6 }).box([0.08, 0.06, 0.035], [0, 0.26, 0], { color: 'red', round: 0.3 });
    b.cyl([0.05, 0.035, 0.05], [0, 0.305, 0], { color: 'black' }).torus([0.05, 0.03, 0.01], [0, 0.335, 0], { color: 'black' });
    return b.each(5, (i) => b.box([0.15, 0.008, 0.01], [0, 0.05 + i * 0.035, 0.024], { color: 'darkred', noInk: true })).done();
  }),
  e('hotel', 'places', 'hotels', () => {
    const b = bld('hotel', { w: 8, h: 12, d: 6, wall: 'beige', flat: true, sign: 'HOTEL', signBg: 'red', door: 'glass' });
    b.box([3.0, 0.15, 1.5], [0, 2.95, 3.75], { color: 'red', round: 0.3 }).pair((s) => b.stick([s * 1.3, 0, 4.3], [s * 1.3, 2.9, 4.3], 0.08, 'gold'));
    return b.each(3, (i) => b.star(0.9, [-1.1 + i * 1.1, 12.9, 0], { color: 'gold', glow: true })).done();
  }),
  e('hourglass', 'home', 'clocks', () => {
    const b = m('hourglass').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: 'wood' }).cyl([0.12, 0.02, 0.12], [0, 0.19, 0], { color: 'wood' });
    around(3, 0.052, 0.3).forEach(([x, z]) => b.stick([x, 0.02, z], [x, 0.18, z], 0.01, 'darkwood'));
    b.cyl([0.085, 0.08, 0.085], [0, 0.06, 0], { color: 'glass', taper: 0.12 }).cyl([0.085, 0.08, 0.085], [0, 0.14, 0], { color: 'glass', taper: 0.12, rot: [180, 0, 0] });
    b.cyl([0.087, 0.03, 0.087], [0, 0.035, 0], { color: 'sand', taper: 0.65 });
    return b.cyl([0.05, 0.025, 0.05], [0, 0.118, 0], { color: 'sand', taper: 0.4, rot: [180, 0, 0] }).done();
  }),
  e('houseboat', 'garage', 'boats', () => {
    const b = m('houseboat', { view: 'side' }).box([2.2, 0.6, 7], [0, 0.3, 0], { color: 'navy', round: 0.3 }).box([2.25, 0.1, 7.05], [0, 0.6, 0], { color: 'white' });
    b.box([1.9, 1.4, 4.0], [0, 1.35, -0.4], { color: 'yellow' });
    b.wedge([2.3, 0.7, 4.4], [0, 2.4, -0.4], { color: 'red' });
    b.pair((s) => { for (const z of [-1.5, 0.2]) b.box([0.04, 0.5, 0.7], [s * 0.96, 1.5, z], { color: 'glass' }); });
    b.box([0.8, 1.2, 0.06], [0, 1.25, 1.62], { color: 'wood', name: 'door', pivot: [-0.4, 1.25, 1.62] });
    b.torus([0.45, 0.45, 0.1], [0.65, 1.4, 1.62], { color: 'red', tube: 0.3 });
    b.pair((s) => b.stick([s * 1.0, 0.65, 2.0], [s * 1.0, 0.65, 3.4], 0.04, 'silver').stick([s * 1.0, 0.65, 3.4], [s * 1.0, 1.1, 3.4], 0.04, 'silver'));
    return b.done();
  }),
  e('hoverboard (real)', 'garage', 'scooters', () => {
    const b = m('hoverboard (real)').box([0.42, 0.06, 0.16], [0, 0.1, 0], { color: 'white', round: 0.4 });
    b.pair((s) => {
      b.torus([0.17, 0.17, 0.07], [s * 0.27, 0.085, 0], { color: 'rubber', rot: [0, 90, 0], tube: 0.3, name: s === 1 ? 'wheel' : undefined });
      b.ball([0.1, 0.13, 0.22], [s * 0.27, 0.13, 0], { color: 'white' });
      b.box([0.12, 0.012, 0.12], [s * 0.11, 0.135, 0], { color: 'black', round: 0.3 });
    });
    return b.box([0.2, 0.015, 0.01], [0, 0.1, 0.08], { color: 'cyan', glow: true }).done();
  }),
  e('hoverboard (sci-fi)', 'toys', 'sci-fi toys', () => {
    const b = m('hoverboard (sci-fi)').box([0.75, 0.056, 0.2], [0, 0.15, 0], { color: 'pink', round: 0.8 });
    b.box([0.3, 0.058, 0.06], [0, 0.152, 0], { color: 'yellow', round: 0.5, noInk: true });
    return b.pair((s) => {
      b.box([0.14, 0.03, 0.15], [s * 0.25, 0.118, 0], { color: 'lime', round: 0.4 });
      b.ball([0.22, 0.02, 0.2], [s * 0.25, 0.01, 0], { color: 'cyan', glow: true, noInk: true });
      b.cyl([0.1, 0.09, 0.1], [s * 0.25, 0.06, 0], { color: 'cyan', glow: true, taper: 1.6, noInk: true });
    }).done();
  }),
  e('hovercraft', 'garage', 'boats', () => {
    const b = m('hovercraft', { view: 'side' }).box([2.4, 0.5, 4.5], [0, 0.25, 0], { color: 'black', round: 1 });
    b.box([2.2, 0.25, 4.3], [0, 0.6, 0], { color: 'orange', round: 0.3 });
    b.box([1.8, 0.9, 1.8], [0, 1.15, 0.6], { color: 'white', round: 0.3 }).box([1.82, 0.4, 1.6], [0, 1.3, 0.62], { color: 'glass', round: 0.3 });
    b.torus([1.6, 1.6, 0.4], [0, 1.5, -1.6], { color: 'orange', tube: 0.15 });
    b.box([1.3, 0.14, 0.05], [0, 1.5, -1.6], { color: 'darkgray', name: 'fan' }).box([0.14, 1.3, 0.05], [0, 1.5, -1.6], { color: 'darkgray', parent: 'fan' });
    b.stick([0, 0.7, -1.6], [0, 0.75, -1.6], 0.2, 'darkgray');
    return b.pair((s) => b.box([0.05, 1.2, 0.4], [s * 0.35, 1.5, -2.0], { color: 'white' })).done();
  }),
  e('hubcap', 'garage', 'car parts', () => {
    const b = m('hubcap').cyl([0.3, 0.04, 0.3], [0, 0.15, 0], { color: 'silver', rot: [90, 0, 0], name: 'wheel' });
    b.torus([0.22, 0.22, 0.03], [0, 0.15, 0.02], { color: 'metal', parent: 'wheel' });
    around(5, 0.065).forEach(([x, y], i) => b.box([0.03, 0.11, 0.02], [x, 0.15 + y, 0.025], { color: 'steel', rot: [0, 0, 90 - i * 72], parent: 'wheel' }));
    return b.cyl([0.06, 0.03, 0.06], [0, 0.15, 0.03], { color: 'darkgray', rot: [90, 0, 0], parent: 'wheel' }).done();
  }),
  e('huge boulder', 'nature', 'rocks', () =>
    m('huge boulder')
      .ball([3.0, 2.4, 2.6], [0, 1.15, 0], { color: 'rock' })
      .ball([1.8, 1.6, 1.8], [0.9, 1.8, 0.2], { color: 'stone' })
      .ball([1.6, 1.2, 1.6], [-1.1, 0.6, 0.7], { color: 'rock' })
      .ball([1.2, 0.3, 1.0], [0.4, 2.55, 0.1], { color: 'grass', noInk: true })
      .ball(0.4, [1.6, 0.18, 1.1], { color: 'stone' })
      .ball(0.3, [-0.6, 0.14, 1.4], { color: 'rock' })
      .done(),
  ),
  e('hula hoop', 'toys', 'outdoor toys', () => {
    const b = m('hula hoop').torus([0.9, 0.9, 0.07], [0, 0.45, 0], { color: 'magenta', tube: 0.078 });
    return b.each(12, (i) => { const a = (i / 12) * Math.PI * 2; b.ball([0.08, 0.08, 0.075], [Math.cos(a) * 0.415, 0.45 + Math.sin(a) * 0.415, 0], { color: i % 2 ? 'yellow' : 'cyan', noInk: true }); }).done();
  }),
  e('hula skirt', 'wardrobe', 'skirts', () => {
    const b = m('hula skirt').torus([0.36, 0.32, 0.065], [0, 0.75, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.2 });
    around(18, 0.16).forEach(([x, z], i) => b.rod([x, 0.73, z], [x * 1.55, 0.03, z * 1.55], 0.035, i % 3 ? '#9ac24a' : '#d9c85a'));
    return b.each(5, (i) => b.ball(0.065, [-0.12 + i * 0.06, 0.77, 0.15 - Math.abs(i - 2) * 0.02], { color: i % 2 ? 'yellow' : 'pink' })).done();
  }),
  e('hull', 'garage', 'boat parts', () => {
    const b = m('hull', { view: 'side' }).box([2.4, 1.6, 9], [0, 1.5, -0.5], { color: 'red', round: 0.6 }).box([3.0, 1.2, 9.2], [0, 2.85, -0.4], { color: 'black', round: 0.2 });
    b.wedge([2.4, 2.4, 1.6], [0, 1.5, 4.9], { color: 'red', rot: [90, 0, 0] }).wedge([3.0, 2.8, 1.4], [0, 2.95, 5.4], { color: 'black', rot: [90, 0, 0] });
    b.box([3.02, 0.14, 9.2], [0, 2.3, -0.4], { color: 'white', noInk: true });
    b.box([0.3, 0.5, 9], [0, 0.6, -0.5], { color: 'darkgray' });
    for (const z of [-3.5, 0, 3]) b.box([1.2, 0.4, 0.6], [0, 0.2, z], { color: 'wood' });
    b.box([0.12, 1.3, 0.8], [0, 1.2, -5.4], { color: 'darkgray' });
    return b.cyl([0.9, 0.12, 0.9], [0, 1.2, -5.0], { color: 'bronze', rot: [90, 0, 0], name: 'fan' }).done();
  }),
  e('humidifier', 'home', 'appliances', () =>
    m('humidifier')
      .cyl([0.24, 0.08, 0.24], [0, 0.04, 0], { color: 'white' })
      .torus([0.24, 0.24, 0.015], [0, 0.06, 0], { color: 'cyan', rot: [90, 0, 0], glow: true })
      .cyl([0.22, 0.24, 0.22], [0, 0.2, 0], { color: '#bfe6f5', taper: 0.8 })
      .ball([0.18, 0.08, 0.18], [0, 0.32, 0], { color: 'white' })
      .cyl([0.04, 0.04, 0.04], [0, 0.37, 0], { color: 'white' })
      .ball(0.05, [0.0, 0.42, 0], { color: 'white', noInk: true })
      .ball(0.04, [0.03, 0.47, 0.01], { color: 'white', noInk: true })
      .done(),
  ),
  e('hurdle', 'sports', 'track', () => {
    const b = m('hurdle');
    b.pair((s) => {
      b.box([0.1, 0.1, 0.7], [s * 0.6, 0.05, 0], { color: 'darkgray' });
      b.stick([s * 0.6, 0.1, 0.2], [s * 0.6, 0.98, 0.2], 0.04, 'white');
    });
    b.box([1.26, 0.13, 0.03], [0, 0.96, 0.2], { color: 'white' });
    return b.each(3, (i) => b.box([0.18, 0.132, 0.032], [-0.42 + i * 0.42, 0.96, 0.2], { color: 'black', noInk: true })).done();
  }),
  e('hut', 'places', 'houses', () =>
    m('hut')
      .cyl([2.6, 1.6, 2.6], [0, 0.8, 0], { color: '#c99a6a' })
      .cone([3.5, 1.9, 3.5], [0, 2.45, 0], { color: '#c9a050' })
      .torus([3.4, 3.4, 0.3], [0, 1.55, 0], { color: '#b8903e', rot: [90, 0, 0] })
      .cyl([0.15, 0.4, 0.15], [0, 3.5, 0], { color: '#b8903e' })
      .box([0.75, 1.2, 0.1], [0, 0.6, 1.28], { color: 'darkbrown', round: 0.3, name: 'door', pivot: [-0.375, 0.6, 1.28] })
      .done(),
  ),
  e('ice (frozen water)', 'nature', 'ice', () => {
    const b = m('ice (frozen water)');
    ([[[0.09, 0.065, 0.08], [0, 0.032, 0], [10, 20, 5]], [[0.06, 0.05, 0.06], [0.065, 0.025, 0.03], [0, 40, 15]], [[0.055, 0.05, 0.055], [-0.06, 0.025, 0.025], [20, 10, 0]], [[0.05, 0.045, 0.05], [0.01, 0.08, 0.005], [30, 30, 20]]] as Array<[V, V, V]>).forEach(([sz, at, r], i) => b.box(sz, at, { color: i % 2 ? '#bfe4f2' : 'ice', rot: r, round: 0.15 }));
    return b.box([0.025, 0.006, 0.004], [-0.005, 0.045, 0.042], { color: 'white', noInk: true, rot: [0, 0, 30] }).done();
  }),
  e('ice block', 'nature', 'ice', () => {
    const b = m('ice block').ball([0.36, 0.02, 0.26], [0, 0.005, 0.02], { color: 'water', noInk: true }).box([0.3, 0.18, 0.2], [0, 0.095, 0], { color: '#cdeefa', round: 0.1 });
    for (const [x, y] of [[-0.08, 0.06], [0.05, 0.12], [0.09, 0.05], [-0.03, 0.13]] as const) b.ball(0.015, [x, y, 0.1], { color: 'white', noInk: true });
    return b.box([0.28, 0.01, 0.18], [0, 0.186, 0], { color: 'white', noInk: true }).done();
  }),
  e('ice cream', 'food', 'desserts', () => {
    const b = m('ice cream').cone([0.065, 0.13, 0.065], [0, 0.065, 0], { color: '#d9a35f', rot: [180, 0, 0] });
    b.pair((s) => b.stick([s * 0.025, 0.12, 0.022], [-s * 0.005, 0.03, 0.01], 0.004, '#b07a3a', { noInk: true }));
    b.ball(0.07, [0, 0.14, 0], { color: 'pink' }).ball(0.062, [0, 0.19, 0], { color: 'chocolate' });
    return b.ball(0.02, [0, 0.228, 0.005], { color: 'red' }).rod([0, 0.235, 0.005], [0.01, 0.255, 0], 0.003, 'darkgreen').done();
  }),
  e('ice cream scoop', 'kitchen', 'utensils', () =>
    m('ice cream scoop')
      .stick([0, 0, 0], [0, 0.07, 0], 0.026, 'black')
      .stick([0, 0.07, 0], [0, 0.15, 0], 0.02, 'silver')
      .ball([0.065, 0.045, 0.065], [0, 0.165, 0], { color: 'steel' })
      .ball(0.058, [0, 0.19, 0.008], { color: 'pink' })
      .rod([0.012, 0.09, 0.0], [0.03, 0.16, 0.0], 0.008, 'silver')
      .done(),
  ),
  e('ice cream store', 'places', 'shops', () => {
    const b = bld('ice cream store', { w: 6, h: 3.5, d: 4, wall: 'pink', roof: 'white', flat: true, sign: 'ICE CREAM' });
    b.each(7, (i) => b.box([0.78, 0.08, 1.0], [-2.34 + i * 0.78, 3.1, 2.5], { color: i % 2 ? 'white' : 'red', rot: [20, 0, 0], round: 0.1 }));
    b.cone([1.0, 1.6, 1.0], [0, 4.6, 0], { color: '#d9a35f', rot: [180, 0, 0] });
    return b.ball(1.2, [0, 5.55, 0], { color: 'pink' }).ball(0.3, [0, 6.2, 0.1], { color: 'red' }).done();
  }),
  e('ice cream truck', 'garage', 'trucks', () => {
    const b = m('ice cream truck', { view: 'side' }).box([2.0, 2.0, 4.6], [0, 1.45, -0.5], { color: 'white', round: 0.15 });
    b.box([1.9, 1.3, 1.3], [0, 1.1, 2.4], { color: 'white', round: 0.3 }).box([1.85, 0.5, 0.06], [0, 1.45, 3.04], { color: 'glass' });
    b.box([2.02, 0.3, 4.6], [0, 0.95, -0.5], { color: 'pink', noInk: true });
    b.box([0.04, 0.8, 1.6], [1.01, 1.7, -0.6], { color: 'glass' }).box([0.5, 0.06, 1.8], [1.2, 2.2, -0.6], { color: 'pink', rot: [0, 0, -20] });
    b.cone([0.5, 0.8, 0.5], [0, 2.85, -0.5], { color: '#d9a35f', rot: [180, 0, 0] }).ball(0.65, [0, 3.35, -0.5], { color: 'pink' });
    b.label('ICE CREAM', [1.6, 0.35], [0, 2.2, 1.76], { color: 'yellow' });
    for (const z of [1.9, -1.9]) b.pair((s) => wheel(b, 0.75, [s * 0.9, 0.38, z], { name: s === 1 && z > 0 ? 'wheel' : undefined }));
    return b.pair((s) => b.ball([0.3, 0.2, 0.06], [s * 0.6, 0.85, 3.05], { color: 'yellow', glow: true })).done();
  }),
  e('ice cube', 'nature', 'ice', () =>
    m('ice cube')
      .box([0.045, 0.045, 0.045], [0, 0.0225, 0], { color: '#d9f2fb', round: 0.3, rot: [0, 20, 0] })
      .box([0.035, 0.035, 0.035], [0.045, 0.02, 0.025], { color: 'ice', round: 0.3, rot: [10, 40, 15] })
      .box([0.015, 0.004, 0.004], [-0.005, 0.035, 0.023], { color: 'white', noInk: true, rot: [0, 20, 25] })
      .done(),
  ),
  e('ice cube tray', 'kitchen', 'kitchenware', () => {
    const b = m('ice cube tray').box([0.26, 0.032, 0.11], [0, 0.016, 0], { color: '#4fa8e0', round: 0.2 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) b.box([0.032, 0.022, 0.04], [-0.1 + c * 0.04, 0.034, -0.025 + r * 0.05], { color: 'ice', round: 0.3 });
    return b.done();
  }),
  e('ice machine', 'kitchen', 'appliances', () => {
    const b = m('ice machine').box([0.8, 0.85, 0.7], [0, 0.45, 0], { color: 'steel', round: 0.05 }).box([0.82, 0.32, 0.72], [0, 1.03, 0], { color: 'metal', round: 0.05 });
    b.each(5, (i) => b.box([0.6, 0.02, 0.01], [0, 0.93 + i * 0.045, 0.36], { color: 'darkgray', noInk: true }));
    b.box([0.6, 0.32, 0.04], [0, 0.62, 0.36], { color: 'silver', name: 'door', pivot: [0, 0.78, 0.36] });
    b.box([0.4, 0.14, 0.02], [0, 0.62, 0.385], { color: 'ice', parent: 'door' });
    b.label('ICE', [0.3, 0.14], [0, 1.03, 0.37], { color: 'blue' });
    return b.pair((s) => b.cyl([0.06, 0.05, 0.06], [s * 0.33, 0.025, 0.28], { color: 'black' })).done();
  }),
  e('ice pop', 'food', 'desserts', () =>
    m('ice pop')
      .box([0.012, 0.065, 0.005], [0, 0.0325, 0], { color: 'lightwood', round: 0.5 })
      .box([0.05, 0.035, 0.022], [0, 0.075, 0], { color: 'blue', round: 0.4 })
      .box([0.05, 0.03, 0.022], [0, 0.105, 0], { color: 'white', round: 0.2 })
      .box([0.05, 0.04, 0.022], [0, 0.135, 0], { color: 'red', round: 0.6 })
      .done(),
  ),
  e('ice rink', 'places', 'sports venues', () => {
    const b = m('ice rink').box([2.4, 0.17, 1.2], [0, 0.085, 0], { color: 'ice', round: 0.5 });
    b.pair((s) => {
      b.box([2.2, 0.16, 0.05], [0, 0.25, s * 0.6], { color: 'white', round: 0.3 });
      b.box([0.05, 0.16, 1.0], [s * 1.2, 0.25, 0], { color: 'white', round: 0.3 });
      b.box([0.05, 0.005, 1.1], [s * 0.4, 0.172, 0], { color: 'blue', noInk: true });
      b.box([0.1, 0.08, 0.16], [s * 1.0, 0.21, 0], { color: 'red', round: 0.2 });
    });
    b.box([0.05, 0.005, 1.1], [0, 0.172, 0], { color: 'red', noInk: true });
    return b.torus([0.3, 0.3, 0.02], [0, 0.172, 0], { color: 'blue', rot: [90, 0, 0], noInk: true }).done();
  }),
  e('ice sculpture', 'nature', 'ice', () => {
    const c = '#cdeefa';
    const b = m('ice sculpture').box([0.75, 0.03, 0.6], [0, 0.015, 0], { color: 'silver' }).box([0.6, 0.5, 0.45], [0, 0.28, 0], { color: c, round: 0.1 });
    b.ball([0.42, 0.32, 0.6], [0, 0.68, -0.02], { color: '#b8e4f5' });
    b.pair((s) => b.ball([0.12, 0.34, 0.45], [s * 0.17, 0.85, -0.08], { color: c, rot: [-25, 0, s * 10] }));
    path(b, [[0, 0.75, 0.2], [0, 0.95, 0.24], [0, 1.15, 0.18], [0, 1.28, 0.2]], 0.09, '#b8e4f5');
    return b.ball([0.1, 0.1, 0.14], [0, 1.32, 0.24], { color: c }).cone([0.05, 0.1, 0.04], [0, 1.31, 0.34], { color: c, rot: [90, 0, 0] }).done();
  }),
  e('ice skates', 'sports', 'skating', () => {
    const b = m('ice skates', { view: 'side' });
    return b.pair((s) => {
      const x = s * 0.06;
      b.box([0.085, 0.03, 0.27], [x, 0.1, 0], { color: 'darkgray' });
      b.ball([0.085, 0.08, 0.2], [x, 0.14, 0.045], { color: 'white' });
      b.box([0.09, 0.2, 0.12], [x, 0.22, -0.065], { color: 'white', round: 0.4 });
      b.each(3, (i) => b.box([0.06, 0.008, 0.01], [x, 0.18 + i * 0.035, -0.004 + (i === 0 ? 0.04 : 0)], { color: 'gray', noInk: true }));
      b.box([0.008, 0.04, 0.3], [x, 0.03, 0.01], { color: 'steel', round: 0.6 });
      for (const z of [-0.09, 0.09]) b.box([0.02, 0.06, 0.03], [x, 0.07, z], { color: 'silver' });
    }).done();
  }),
  e('iced tea', 'food', 'drinks', () =>
    m('iced tea')
      .cyl([0.075, 0.15, 0.075], [0, 0.075, 0], { color: '#c8873a' })
      .cyl([0.079, 0.02, 0.079], [0, 0.152, 0], { color: 'glass' })
      .box([0.03, 0.025, 0.03], [0.01, 0.16, 0.01], { color: 'ice', rot: [10, 30, 0] })
      .box([0.025, 0.025, 0.025], [-0.018, 0.158, -0.012], { color: 'ice', rot: [0, 10, 20] })
      .cyl([0.05, 0.008, 0.05], [0.038, 0.15, 0.02], { color: 'yellow', rot: [90, 0, 30] })
      .stick([-0.015, 0.1, 0.01], [-0.035, 0.23, 0.01], 0.008, 'red')
      .done(),
  ),
  e('icing', 'food', 'desserts', () => {
    const b = m('icing').cyl([0.22, 0.012, 0.22], [0, 0.006, 0], { color: 'white' });
    ([[0.11, 0.028], [0.085, 0.052], [0.06, 0.074], [0.035, 0.092]] as const).forEach(([d, y]) => b.torus([d, d, 0.03], [0, y, 0], { color: 'pink', rot: [90, 0, 0], tube: 0.3 }));
    b.cone([0.03, 0.04, 0.03], [0, 0.11, 0], { color: 'pink' });
    b.cone([0.06, 0.16, 0.06], [0.06, 0.05, 0.08], { color: 'white', rot: [0, 0, 75] });
    return b.cone([0.02, 0.03, 0.02], [-0.03, 0.03, 0.08], { color: 'silver', rot: [0, 0, 75] }).done();
  }),
  e('igloo', 'places', 'houses', () => {
    const b = m('igloo');
    dome(b, 1.4, 1.6, [0, 0, 0], 'snow');
    for (const y of [0.4, 0.8, 1.15]) {
      const r = 1.4 * Math.sqrt(1 - (y / 1.6) ** 2) + 0.01;
      b.torus([2 * r, 2 * r, 0.03], [0, y, 0], { color: '#c9dce6', rot: [90, 0, 0], tube: 0.02, noInk: true });
    }
    b.cyl([0.95, 0.9, 0.95], [0, 0.48, 1.35], { color: 'snow', rot: [90, 0, 0] });
    return b.cyl([0.6, 0.05, 0.62], [0, 0.4, 1.8], { color: '#2a3340', rot: [90, 0, 0] }).done();
  }),
  e('incense', 'home', 'decor', () => {
    const b = m('incense').cyl([0.1, 0.03, 0.1], [0, 0.015, 0], { color: 'brass' }).cyl([0.085, 0.005, 0.085], [0, 0.031, 0], { color: 'sand' });
    for (const [x, tx] of [[-0.015, -0.04], [0.005, 0.0], [0.02, 0.045]] as const) {
      b.stick([x, 0.03, 0], [tx, 0.22, 0], 0.005, 'brown');
      b.ball(0.008, [tx, 0.222, 0], { color: 'fire', glow: true });
    }
    return path(b, [[0, 0.23, 0], [0.015, 0.25, 0], [-0.005, 0.27, 0], [0.01, 0.29, 0]], 0.008, 'lightgray', { noInk: true }).done();
  }),
  e('indicator', 'garage', 'car parts', () =>
    m('indicator')
      .box([0.08, 0.02, 0.04], [0, 0.01, 0], { color: 'darkgray' })
      .box([0.17, 0.085, 0.05], [0, 0.065, 0], { color: 'black', round: 0.3 })
      .box([0.15, 0.068, 0.02], [0, 0.065, 0.025], { color: 'orange', glow: true, round: 0.3 })
      .box([0.04, 0.016, 0.01], [-0.01, 0.065, 0.038], { color: 'white' })
      .wedge([0.04, 0.035, 0.01], [0.02, 0.065, 0.038], { color: 'white', rot: [0, 0, -90] })
      .done(),
  ),
  e('ink', 'study', 'stationery', () => {
    const b = m('ink').cyl([0.07, 0.05, 0.07], [0, 0.025, 0], { color: '#1f2a5a' }).cyl([0.07, 0.015, 0.07], [0, 0.057, 0], { color: '#1f2a5a', taper: 0.5 });
    b.cyl([0.03, 0.02, 0.03], [0, 0.072, 0], { color: '#1f2a5a' }).cyl([0.072, 0.025, 0.072], [0, 0.025, 0], { color: 'cream' });
    b.stick([0, 0.06, 0], [0.05, 0.2, 0], 0.006, 'cream');
    b.ball([0.025, 0.12, 0.006], [0.04, 0.17, 0], { color: 'white', rot: [0, 0, -20] });
    return b.ball([0.08, 0.008, 0.05], [0.07, 0.004, 0.04], { color: '#1f2a5a' }).done();
  }),
  e('ink cartridge', 'tech', 'computer parts', () =>
    m('ink cartridge')
      .box([0.05, 0.07, 0.07], [0, 0.035, 0], { color: 'black', round: 0.1 })
      .box([0.052, 0.012, 0.05], [0, 0.05, 0.01], { color: 'cyan', noInk: true })
      .box([0.052, 0.012, 0.05], [0, 0.036, 0.01], { color: 'magenta', noInk: true })
      .box([0.052, 0.012, 0.05], [0, 0.022, 0.01], { color: 'yellow', noInk: true })
      .box([0.02, 0.02, 0.004], [0, 0.015, 0.036], { color: 'gold' })
      .box([0.03, 0.01, 0.025], [0, 0.075, -0.015], { color: 'darkgray' })
      .done(),
  ),
  e('inline skates', 'sports', 'skating', () => {
    const b = m('inline skates', { view: 'side' });
    return b.pair((s) => {
      const x = s * 0.065;
      b.box([0.09, 0.03, 0.27], [x, 0.11, 0], { color: 'black' });
      b.ball([0.09, 0.08, 0.2], [x, 0.15, 0.045], { color: 'blue' });
      b.box([0.095, 0.2, 0.13], [x, 0.23, -0.065], { color: 'blue', round: 0.4 });
      for (const y of [0.2, 0.27]) b.box([0.1, 0.015, 0.06], [x, y, -0.01], { color: 'black' });
      b.box([0.02, 0.03, 0.26], [x, 0.08, 0], { color: 'silver' });
      for (const z of [-0.09, -0.03, 0.03, 0.09]) b.torus([0.075, 0.075, 0.024], [x, 0.04, z], { color: 'lime', rot: [0, 90, 0], tube: 0.35, name: s === 1 && z === 0.09 ? 'wheel' : undefined });
    }).done();
  }),
  e('insulation', 'workshop', 'building materials', () => {
    const b = m('insulation');
    for (const z of [-0.17, 0.17]) {
      b.cyl([0.3, 0.6, 0.3], [0, 0.15, z], { color: '#f4a1b8', rot: [0, 0, 90] });
      b.pair((s) => { for (const d of [0.22, 0.12]) b.torus([d, d, 0.02], [s * 0.3, 0.15, z], { color: '#d97a95', rot: [0, 90, 0], noInk: true }); });
    }
    return b.box([0.65, 0.1, 0.36], [0, 0.35, 0], { color: '#f4a1b8', round: 0.5 }).box([0.65, 0.012, 0.36], [0, 0.296, 0], { color: '#c9a070', noInk: true }).done();
  }),
  e('intercom', 'tech', 'electronics', () => {
    const b = m('intercom').box([0.14, 0.26, 0.04], [0, 0.13, 0], { color: 'silver', round: 0.2 });
    b.cyl([0.03, 0.01, 0.03], [0, 0.23, 0.02], { color: 'black', rot: [90, 0, 0] });
    b.each(4, (i) => b.box([0.08, 0.006, 0.006], [0, 0.17 + i * 0.012, 0.021], { color: 'darkgray', noInk: true }));
    b.each(3, (i) => b.box([0.09, 0.022, 0.008], [0, 0.04 + i * 0.03, 0.022], { color: 'cream' }));
    return b.ball(0.016, [0.05, 0.04, 0.022], { color: 'green', glow: true }).done();
  }),
  e('intestine', 'clinic', 'organs', () => {
    const b = m('intestine');
    const big: V[] = [[0.0, 0.03, 0.02], [0.13, 0.06, 0], [0.16, 0.2, 0], [0.15, 0.36, 0], [0, 0.39, 0], [-0.15, 0.36, 0], [-0.16, 0.2, 0], [-0.12, 0.07, 0]];
    path(b, big, 0.07, '#c98a6a');
    big.forEach((p) => b.ball(0.08, p, { color: '#b9785a' }));
    b.ball([0.26, 0.26, 0.07], [0, 0.21, -0.01], { color: '#e8a0a0' });
    around(8, 0.085).forEach(([x, y], i) => b.torus([0.08, 0.06, 0.035], [x, 0.21 + y, 0.03], { color: i % 2 ? '#e8a0a0' : '#f0b4b0', rot: [0, 0, i * 40] }));
    around(4, 0.04, 0.4).forEach(([x, y], i) => b.torus([0.06, 0.05, 0.03], [x, 0.21 + y, 0.045], { color: i % 2 ? '#f0b4b0' : '#e8a0a0', rot: [0, 0, i * 50] }));
    return b.torus([0.08, 0.07, 0.035], [0, 0.21, 0.03], { color: '#e8a0a0' }).done();
  }),
  e('invisibility cloak', 'fantasy', 'magic items', () => {
    const c = '#d8ecf5';
    const b = m('invisibility cloak').cyl([0.78, 1.3, 0.56], [0, 0.65, 0], { color: c, taper: 0.36 });
    b.box([0.04, 1.2, 0.02], [0, 0.6, 0.22], { color: '#9cc4d6', noInk: true });
    b.ball([0.32, 0.36, 0.32], [0, 1.4, -0.02], { color: c });
    b.ball([0.2, 0.25, 0.1], [0, 1.37, 0.12], { color: '#1e2436' });
    b.ball(0.05, [0, 1.2, 0.12], { color: 'gold' });
    for (const [x, y, z, sz] of [[0.3, 1.0, 0.15, 0.08], [-0.33, 0.6, 0.12, 0.07], [0.25, 0.35, 0.22, 0.06], [-0.2, 1.3, 0.2, 0.06]] as const) b.star(sz, [x, y, z], { color: 'white', glow: true });
    return b.done();
  }),
  e('iron (tool)', 'home', 'laundry', () =>
    m('iron (tool)', { view: 'side' })
      .box([0.11, 0.02, 0.18], [0, 0.01, -0.03], { color: 'steel', round: 0.2 })
      .wedge([0.11, 0.09, 0.02], [0, 0.01, 0.1], { color: 'steel', rot: [90, 0, 0] })
      .box([0.1, 0.055, 0.17], [0, 0.045, -0.02], { color: 'blue', round: 0.5 })
      .wedge([0.1, 0.08, 0.055], [0, 0.045, 0.09], { color: 'blue', rot: [90, 0, 0] })
      .rod([0, 0.13, -0.08], [0, 0.13, 0.05], 0.03, 'blue')
      .rod([0, 0.07, -0.1], [0, 0.13, -0.08], 0.03, 'blue')
      .rod([0, 0.07, 0.07], [0, 0.13, 0.05], 0.025, 'blue')
      .cyl([0.04, 0.015, 0.04], [0, 0.08, -0.06], { color: 'white' })
      .ball(0.025, [0, 0.01, 0.17], { color: 'white', noInk: true })
      .ball(0.018, [0.01, 0.02, 0.2], { color: 'white', noInk: true })
      .done(),
  ),
  e('iron maiden', 'armory', 'dungeon', () => {
    const fe = '#5a5e66';
    const b = m('iron maiden').box([0.9, 0.1, 0.7], [0, 0.05, 0], { color: 'darkgray' }).box([0.8, 1.6, 0.6], [0, 0.9, 0], { color: fe, round: 0.3 });
    b.ball([0.5, 0.5, 0.4], [0, 1.88, 0.04], { color: '#9a9ea6' });
    b.pair((s) => b.ball([0.08, 0.035, 0.02], [s * 0.1, 1.93, 0.235], { color: 'black' }));
    b.ball([0.05, 0.08, 0.04], [0, 1.87, 0.24], { color: '#9a9ea6' }).box([0.12, 0.02, 0.02], [0, 1.77, 0.225], { color: 'darkred', noInk: true });
    b.box([0.38, 1.4, 0.04], [0.2, 0.9, 0.295], { color: '#2a2726' });
    b.each(4, (i) => b.cone([0.05, 0.1, 0.05], [0.2, 0.4 + i * 0.33, 0.33], { color: 'silver', rot: [90, 0, 0] }));
    b.box([0.4, 1.45, 0.05], [-0.2, 0.9, 0.31], { color: '#6a6e76', round: 0.2 });
    b.box([0.4, 1.45, 0.05], [0.47, 0.9, 0.5], { color: '#6a6e76', round: 0.2, rot: [0, 110, 0] });
    b.each(4, (i) => b.cone([0.05, 0.1, 0.05], [0.41, 0.4 + i * 0.33, 0.52], { color: 'silver', rot: [0, 0, 90] }));
    for (const y of [0.35, 1.45]) b.box([0.84, 0.05, 0.64], [0, y, 0], { color: 'iron' });
    return b.done();
  }),
  e('ironing board', 'home', 'laundry', () => {
    const b = m('ironing board').box([1.1, 0.03, 0.36], [-0.1, 0.86, 0], { color: 'cream', round: 0.3 }).ball([0.5, 0.03, 0.36], [0.45, 0.86, 0], { color: 'cream' });
    for (const [x, z] of [[-0.4, 0.05], [0.0, -0.08], [0.35, 0.06], [-0.2, -0.1]] as const) b.ball([0.06, 0.01, 0.06], [x, 0.876, z], { color: 'skyblue', noInk: true });
    b.pair((s) => {
      b.rod([-0.35, 0.84, s * 0.12], [0.35, 0.0, s * 0.12], 0.025, 'steel');
      b.rod([0.35, 0.84, s * 0.12], [-0.35, 0.0, s * 0.12], 0.025, 'steel');
    });
    b.box([0.22, 0.1, 0.11], [-0.35, 0.93, 0], { color: 'blue', round: 0.5 }).rod([-0.4, 1.0, 0], [-0.3, 1.0, 0], 0.03, 'blue');
    return b.done();
  }),
  e('island', 'nature', 'landforms', () => {
    const b = m('island').cyl([1.3, 0.1, 1.1], [0, 0.05, 0], { color: 'water' });
    dome(b, 0.4, 0.16, [0, 0.08, 0], 'sand');
    path(b, [[-0.05, 0.18, 0], [0.0, 0.45, 0], [0.08, 0.7, 0], [0.14, 0.85, 0]], 0.055, 'bark');
    b.ball(0.08, [0.14, 0.88, 0], { color: 'leaf', name: 'top' });
    around(6, 0.28).forEach(([x, z]) => b.rod([0.14, 0.88, 0], [0.14 + x, 0.76, z], 0.06, 'leaf', { parent: 'top' }));
    return b.ball(0.05, [0.12, 0.83, 0.05], { color: 'brown', parent: 'top' }).ball(0.05, [0.18, 0.83, 0.03], { color: 'brown', parent: 'top' }).done();
  }),
  e('itching powder', 'toys', 'pranks', () =>
    m('itching powder')
      .cyl([0.06, 0.08, 0.06], [0, 0.04, 0], { color: 'yellow' })
      .cyl([0.062, 0.035, 0.062], [0, 0.04, 0], { color: 'green' })
      .cyl([0.062, 0.015, 0.062], [0, 0.087, 0], { color: 'silver' })
      .ball(0.006, [0.012, 0.096, 0], { color: 'black', noInk: true })
      .ball(0.006, [-0.012, 0.096, 0.005], { color: 'black', noInk: true })
      .ball([0.09, 0.025, 0.07], [0.07, 0.0125, 0.04], { color: 'pink' })
      .ball(0.008, [0.06, 0.025, 0.05], { color: 'red', noInk: true })
      .ball(0.008, [0.08, 0.024, 0.03], { color: 'red', noInk: true })
      .done(),
  ),
  e('iv bag', 'clinic', 'hospital', () =>
    m('iv bag')
      .cyl([0.25, 0.05, 0.25], [0, 0.025, 0], { color: 'darkgray' })
      .stick([0, 0.05, 0], [0, 0.58, 0], 0.025, 'silver')
      .rod([0, 0.57, 0], [0.08, 0.57, 0], 0.015, 'silver')
      .box([0.13, 0.18, 0.035], [0.08, 0.45, 0], { color: '#e6f4fb', round: 0.6 })
      .box([0.11, 0.11, 0.037], [0.08, 0.42, 0], { color: '#bfe2f2', round: 0.6, noInk: true })
      .box([0.06, 0.04, 0.005], [0.08, 0.47, 0.02], { color: 'white' })
      .cyl([0.022, 0.05, 0.022], [0.08, 0.33, 0], { color: 'glass' })
      .stick([0.08, 0.3, 0], [0.08, 0.06, 0.03], 0.006, 'glass')
      .done(),
  ),
  e('ivory', 'wild', 'antlers and horns', () => {
    const b = m('ivory').box([0.32, 0.05, 0.12], [0, 0.025, 0], { color: 'darkwood', round: 0.3 });
    for (const [x, y] of [[-0.08, 0.1], [0.06, 0.15]] as const) b.stick([x, 0.05, 0], [x, y, 0], 0.02, 'darkwood');
    const pts: V[] = [[-0.16, 0.1, 0], [-0.06, 0.12, 0], [0.04, 0.16, 0], [0.12, 0.23, 0], [0.16, 0.31, 0]];
    const th = [0.065, 0.058, 0.046, 0.032, 0.012];
    for (let i = 0; i < pts.length - 1; i++) {
      b.stick(pts[i], pts[i + 1], th[i], '#f5ecd5', { taper: th[i + 1] / th[i] });
      b.ball(th[i], pts[i], { color: '#f5ecd5' });
    }
    return b.done();
  }),
  e('jack-in-the-box', 'toys', 'classic toys', () => {
    const b = m('jack-in-the-box').box([0.2, 0.2, 0.2], [0, 0.1, 0], { color: 'red', round: 0.1 });
    b.star(0.1, [0, 0.1, 0.105], { color: 'yellow' });
    b.box([0.2, 0.2, 0.02], [0, 0.3, -0.11], { color: 'blue', round: 0.1, name: 'lid', pivot: [0, 0.2, -0.1] });
    b.each(4, (i) => b.torus([0.06, 0.06, 0.012], [0, 0.22 + i * 0.03, 0], { color: 'silver', rot: [90, 0, 0] }));
    b.torus([0.12, 0.12, 0.03], [0, 0.34, 0], { color: 'yellow', rot: [90, 0, 0], tube: 0.3 });
    b.ball(0.12, [0, 0.41, 0], { color: 'white' }).ball(0.03, [0, 0.4, 0.06], { color: 'red' });
    b.pair((s) => b.ball(0.016, [s * 0.025, 0.43, 0.052], { color: 'black', eye: true }));
    b.cone([0.09, 0.14, 0.09], [0, 0.52, 0], { color: 'green' }).ball(0.03, [0, 0.6, 0], { color: 'yellow' });
    return b.stick([0.1, 0.12, 0], [0.14, 0.12, 0], 0.012, 'silver').box([0.012, 0.06, 0.012], [0.14, 0.14, 0], { color: 'silver', name: 'crank', pivot: [0.14, 0.12, 0] }).done();
  }),
  e('jack-o-lantern', 'toys', 'halloween', () => {
    const b = m('jack-o-lantern').ball([0.3, 0.24, 0.28], [0, 0.12, 0], { color: 'orange' });
    around(6, 0.09).forEach(([x, z]) => b.ball([0.17, 0.23, 0.17], [x, 0.12, z], { color: '#e8822a' }));
    b.cyl([0.035, 0.06, 0.035], [0, 0.26, 0], { color: '#5a6a2a', rot: [0, 0, 10] });
    b.pair((s) => b.wedge([0.055, 0.045, 0.02], [s * 0.06, 0.155, 0.145], { color: 'yellow', glow: true }));
    b.wedge([0.03, 0.025, 0.02], [0, 0.115, 0.153], { color: 'yellow', glow: true });
    b.box([0.15, 0.035, 0.02], [0, 0.07, 0.14], { color: 'yellow', glow: true, round: 0.4 });
    return b.pair((s) => b.box([0.02, 0.016, 0.022], [s * 0.03, 0.08, 0.142], { color: '#e8822a' })).done();
  }),
  e('jackhammer', 'workshop', 'power tools', () =>
    m('jackhammer')
      .stick([-0.26, 1.05, 0], [0.26, 1.05, 0], 0.04, 'steel')
      .stick([-0.27, 1.05, 0], [-0.17, 1.05, 0], 0.055, 'black')
      .stick([0.17, 1.05, 0], [0.27, 1.05, 0], 0.055, 'black')
      .cyl([0.15, 0.5, 0.15], [0, 0.75, 0], { color: 'yellow' })
      .cyl([0.155, 0.08, 0.155], [0, 0.95, 0], { color: 'darkgray' })
      .cyl([0.09, 0.2, 0.09], [0, 0.4, 0], { color: 'steel' })
      .stick([0, 0.3, 0], [0, 0.04, 0], 0.035, 'silver')
      .cone([0.035, 0.04, 0.035], [0, 0.02, 0], { color: 'silver', rot: [180, 0, 0] })
      .rod([0.075, 0.85, 0], [0.2, 0.4, 0.1], 0.03, 'black')
      .rod([0.2, 0.4, 0.1], [0.35, 0.02, 0.2], 0.03, 'black')
      .done(),
  ),
  e('jacks', 'toys', 'classic toys', () => {
    const b = m('jacks').ball(0.03, [0.05, 0.015, 0.03], { color: 'red' });
    const jack = (x: number, z: number, t: number) => {
      const r = (t * Math.PI) / 180, c = Math.cos(r) * 0.016, sn = Math.sin(r) * 0.016, y = 0.017;
      b.stick([x - c, y, z - sn], [x + c, y, z + sn], 0.004, 'silver').stick([x, y - 0.016, z], [x, y + 0.016, z], 0.004, 'silver').stick([x + sn, y, z - c], [x - sn, y, z + c], 0.004, 'silver');
      for (const p of [[x - c, y, z - sn], [x + c, y, z + sn], [x, y + 0.016, z], [x + sn, y, z - c], [x - sn, y, z + c]] as V[]) b.ball(0.008, p, { color: 'silver' });
    };
    jack(-0.03, 0.0, 20);
    jack(0.0, 0.05, 60);
    jack(-0.06, 0.05, 5);
    jack(0.03, -0.03, 40);
    return b.done();
  }),
  e('javelin', 'sports', 'track', () =>
    m('javelin')
      .ball([0.5, 0.2, 0.4], [0.45, 0.03, 0], { color: 'grass' })
      .stick([0.45, 0.06, 0], [-0.4, 2.3, 0], 0.03, 'yellow')
      .cone([0.04, 0.2, 0.04], [0.47, 0.06, 0], { color: 'silver', rot: [0, 0, 159] })
      .stick([0.07, 1.06, 0], [-0.0, 1.24, 0], 0.04, 'black')
      .done(),
  ),
  e('jaw', 'clinic', 'bones', () => {
    const c = '#efe3c8';
    const b = m('jaw');
    arc(b, [0, 0.03, -0.02], 0.05, 0.06, 0, 180, 7, 0.026, c, 'xz');
    b.pair((s) => b.rod([s * 0.05, 0.03, -0.02], [s * 0.056, 0.1, -0.04], 0.024, c).ball(0.022, [s * 0.056, 0.105, -0.04], { color: c }));
    for (let a = 15; a <= 165; a += 15) b.box([0.009, 0.014, 0.009], [0.05 * Math.cos((a * Math.PI) / 180), 0.05, -0.02 + 0.06 * Math.sin((a * Math.PI) / 180)], { color: 'white', round: 0.4 });
    return b.done();
  }),
  e('jawbreaker', 'food', 'candy', () => {
    const b = m('jawbreaker').ball(0.06, [-0.035, 0.03, 0], { color: 'red' });
    for (const [x, y, z, c] of [[-0.03, 0.05, 0.02, 'yellow'], [-0.05, 0.035, 0.022, 'blue'], [-0.015, 0.02, 0.024, 'white']] as const) b.ball(0.01, [x, y, z], { color: c, noInk: true });
    b.ball([0.06, 0.06, 0.04], [0.04, 0.03, -0.005], { color: 'blue' });
    ([[0.06, 'blue'], [0.045, 'yellow'], [0.03, 'pink'], [0.015, 'white']] as const).forEach(([d, c], i) => b.cyl([d, 0.004, d], [0.04, 0.03, 0.016 + i * 0.002], { color: c, rot: [90, 0, 0], noInk: i > 0 }));
    return b.done();
  }),
  e('jeans', 'wardrobe', 'pants', () => {
    const b = pants('jeans', 'denim', 1.0);
    return b.pair((s) => b.box([0.18, 0.05, 0.2], [s * 0.13, 0.03, 0], { color: '#6f8fc0', round: 0.4 })).done();
  }),
  e('jelly', 'food', 'spreads', () =>
    m('jelly')
      .cyl([0.08, 0.09, 0.08], [0, 0.045, 0], { color: '#7a2a5a' })
      .cyl([0.085, 0.02, 0.085], [0, 0.1, 0], { color: 'gold' })
      .cyl([0.11, 0.012, 0.11], [0, 0.112, 0], { color: 'red' })
      .cyl([0.1, 0.02, 0.1], [0, 0.1, 0], { color: 'red', taper: 1.1 })
      .torus([0.088, 0.088, 0.008], [0, 0.093, 0], { color: 'white', rot: [90, 0, 0] })
      .cyl([0.082, 0.035, 0.082], [0, 0.045, 0], { color: 'cream' })
      .ball([0.03, 0.025, 0.01], [0, 0.045, 0.042], { color: 'purple', noInk: true })
      .done(),
  ),
  e('jelly bean', 'food', 'candy', () => {
    const b = m('jelly bean');
    ([[-0.02, 0.008, 0, 'red', 10], [0.012, 0.008, 0.01, 'green', 70], [0.0, 0.008, -0.02, 'yellow', 30], [0.03, 0.008, -0.012, 'orange', -20], [-0.01, 0.022, -0.005, 'purple', 50], [0.012, 0.022, 0.0, 'pink', -40]] as const).forEach(([x, y, z, c, a]) => {
      const r = (a * Math.PI) / 180;
      b.ball([0.016, 0.014, 0.014], [x + Math.cos(r) * 0.006, y, z + Math.sin(r) * 0.006], { color: c });
      b.ball([0.016, 0.014, 0.014], [x - Math.cos(r) * 0.006, y, z - Math.sin(r) * 0.006], { color: c });
    });
    return b.done();
  }),
  e('jerky', 'food', 'meat', () => {
    const b = m('jerky').box([0.14, 0.18, 0.04], [0, 0.09, -0.05], { color: '#c9a070', round: 0.3 });
    b.label('JERKY', [0.11, 0.05], [0, 0.11, -0.03], { color: 'darkred' });
    for (const [x, r] of [[-0.04, 12], [0.0, -5], [0.045, -15]] as const) b.box([0.032, 0.14, 0.009], [x, 0.07, 0.02], { color: '#6a2e1e', rot: [-12, 0, r], round: 0.4 });
    return b.done();
  }),
  e('jersey', 'wardrobe', 'shirts', () => {
    const b = shirt('jersey', { color: 'blue', len: 0.7, collar: 'white' });
    b.pair((s) => b.ball([0.1, 0.03, 0.15], [s * 0.36, 0.48, 0], { color: 'white', rot: [0, 0, s * 35] }));
    return b.label('10', [0.2, 0.2], [0, 0.38, 0.115], { color: 'white' }).done();
  }),
  e('jet boat', 'garage', 'boats', () => {
    const b = m('jet boat', { view: 'side' }).box([1.6, 0.55, 3.6], [0, 0.4, -0.4], { color: 'white', round: 0.4 });
    b.wedge([1.6, 1.4, 0.55], [0, 0.4, 2.0], { color: 'white', rot: [90, 0, 0] });
    b.box([1.62, 0.12, 3.6], [0, 0.35, -0.4], { color: 'red', noInk: true });
    b.box([1.4, 0.3, 0.06], [0, 0.85, 0.6], { color: 'glass', rot: [-30, 0, 0] });
    b.pair((s) => b.box([0.5, 0.35, 0.5], [s * 0.35, 0.8, -0.4], { color: 'darkgray', round: 0.4 }));
    return b.ball([0.6, 0.5, 0.6], [0, 0.6, -2.4], { color: 'skyblue', noInk: true }).ball([0.4, 0.4, 0.4], [0, 0.95, -2.7], { color: 'white', noInk: true }).done();
  }),
  e('jet pack', 'garage', 'aircraft', () => {
    const b = m('jet pack').box([0.32, 0.4, 0.06], [0, 0.56, 0.1], { color: 'darkgray', round: 0.3 });
    b.pair((s) => {
      b.cyl([0.14, 0.42, 0.14], [s * 0.09, 0.53, 0], { color: 'silver' }).ball(0.14, [s * 0.09, 0.74, 0], { color: 'silver' });
      b.cyl([0.12, 0.08, 0.12], [s * 0.09, 0.29, 0], { color: 'darkgray', taper: 0.7 });
      b.cone([0.1, 0.22, 0.1], [s * 0.09, 0.14, 0], { color: 'fire', rot: [180, 0, 0], glow: true });
      b.cone([0.05, 0.12, 0.05], [s * 0.09, 0.2, 0], { color: 'flame', rot: [180, 0, 0], glow: true });
      b.torus([0.1, 0.3, 0.025], [s * 0.1, 0.58, 0.15], { color: 'black' });
    });
    return b.done();
  }),
  e('jewelry box', 'home', 'bedroom', () => {
    const b = m('jewelry box').box([0.2, 0.09, 0.14], [0, 0.045, 0], { color: 'pink', round: 0.2 }).box([0.18, 0.006, 0.12], [0, 0.091, 0], { color: 'darkred', noInk: true });
    b.box([0.202, 0.012, 0.142], [0, 0.02, 0], { color: 'gold', noInk: true });
    b.box([0.2, 0.14, 0.015], [0, 0.16, -0.075], { color: 'pink', round: 0.2, name: 'lid', pivot: [0, 0.09, -0.07] });
    b.box([0.15, 0.1, 0.005], [0, 0.16, -0.065], { color: '#e4f0f6', parent: 'lid' });
    b.each(7, (i) => b.ball(0.014, [-0.06 + i * 0.02, 0.095 - Math.abs(i - 3) * 0.004 * (3 - Math.abs(i - 3)), 0.04 + (3 - Math.abs(i - 3)) * 0.007], { color: 'white' }));
    return b.torus([0.025, 0.025, 0.006], [0.05, 0.105, -0.02], { color: 'gold' }).ball(0.012, [0.05, 0.12, -0.02], { color: 'cyan' }).done();
  }),
  e('jewelry store', 'places', 'shops', () => {
    const b = bld('jewelry store', { w: 6, h: 4, d: 4, wall: 'navy', flat: true, sign: 'JEWELRY', signBg: 'gold' });
    b.cone([1.4, 0.9, 1.4], [0, 4.75, 0], { color: 'ice', rot: [180, 0, 0] }).cyl([1.4, 0.35, 1.4], [0, 5.37, 0], { color: '#e4f6fc', taper: 0.6 });
    return b.pair((s) => b.ball(0.18, [s * 1.8, 1.3, 2.08], { color: 'gold' })).done();
  }),
  e('jigsaw', 'workshop', 'power tools', () =>
    m('jigsaw')
      .box([0.32, 0.02, 0.16], [0, 0.01, 0], { color: 'lightwood' })
      .box([0.2, 0.012, 0.08], [0, 0.026, 0], { color: 'silver' })
      .box([0.008, 0.06, 0.004], [0.07, 0.02, 0], { color: 'steel', round: 0 })
      .box([0.22, 0.08, 0.07], [0, 0.072, 0], { color: 'teal', round: 0.4 })
      .torus([0.17, 0.1, 0.03], [-0.01, 0.13, 0], { color: 'black' })
      .box([0.05, 0.03, 0.06], [-0.11, 0.07, 0], { color: 'black', round: 0.3 })
      .done(),
  ),
  e('jigsaw puzzle', 'toys', 'puzzles', () => {
    const b = m('jigsaw puzzle').box([0.26, 0.03, 0.08], [0, 0.015, 0], { color: 'wood' });
    const cs = ['blue', 'red', 'yellow', 'green'];
    ([[-0.05, 0.27], [0.05, 0.27], [-0.05, 0.17], [0.05, 0.17]] as const).forEach(([x, y], i) => b.box([0.1, 0.1, 0.012], [x, y, 0], { color: cs[i], round: 0.1 }));
    const knob = (x: number, y: number, c: string) => b.cyl([0.032, 0.013, 0.032], [x, y, 0], { color: c, rot: [90, 0, 0] });
    knob(0, 0.27, 'blue');
    knob(-0.05, 0.22, 'blue');
    knob(0.05, 0.22, 'red');
    knob(0, 0.17, 'yellow');
    return b.box([0.09, 0.012, 0.09], [0.12, 0.006, 0.1], { color: 'purple', rot: [0, 20, 0] }).cyl([0.03, 0.013, 0.03], [0.17, 0.006, 0.1], { color: 'purple' }).done();
  }),
  e('jingle bell', 'toys', 'christmas', () =>
    m('jingle bell')
      .ball(0.07, [0, 0.036, 0], { color: 'gold' })
      .box([0.05, 0.008, 0.012], [0, 0.026, 0.031], { color: 'black', noInk: true })
      .ball(0.01, [0, 0.026, 0.034], { color: 'black', noInk: true })
      .torus([0.025, 0.025, 0.008], [0, 0.078, 0], { color: 'gold' })
      .wedge([0.03, 0.03, 0.01], [0.018, 0.09, 0.006], { color: 'red', rot: [0, 0, 90] })
      .wedge([0.03, 0.03, 0.01], [-0.018, 0.09, 0.006], { color: 'red', rot: [0, 0, -90] })
      .ball(0.014, [0, 0.09, 0.008], { color: 'red' })
      .done(),
  ),
  e('jolly roger', 'ideas', 'flags', () => {
    const b = m('jolly roger').box([0.25, 0.08, 0.25], [0, 0.04, 0], { color: 'darkwood' }).stick([0, 0.08, 0], [0, 1.0, 0], 0.03, 'wood').ball(0.05, [0, 1.02, 0], { color: 'gold' });
    b.box([0.5, 0.34, 0.012], [0.265, 0.8, 0], { color: 'black', round: 0.1 });
    b.ball([0.1, 0.1, 0.02], [0.265, 0.85, 0.01], { color: 'white' }).box([0.06, 0.03, 0.02], [0.265, 0.8, 0.01], { color: 'white' });
    b.pair((s) => b.ball(0.022, [0.265 + s * 0.022, 0.855, 0.02], { color: 'black', noInk: true }));
    b.rod([0.17, 0.7, 0.012], [0.36, 0.77, 0.012], 0.018, 'white').rod([0.17, 0.77, 0.012], [0.36, 0.7, 0.012], 0.018, 'white');
    return b.done();
  }),
  e('joystick', 'tech', 'game consoles', () =>
    m('joystick')
      .box([0.14, 0.04, 0.12], [0, 0.02, 0], { color: 'black', round: 0.3 })
      .cone([0.04, 0.03, 0.04], [0, 0.052, 0], { color: 'darkgray' })
      .stick([0, 0.04, 0], [0, 0.12, 0], 0.012, 'steel')
      .ball(0.036, [0, 0.13, 0], { color: 'red' })
      .cyl([0.022, 0.012, 0.022], [0.04, 0.045, 0.035], { color: 'red' })
      .cyl([0.022, 0.012, 0.022], [-0.04, 0.045, 0.035], { color: 'yellow' })
      .done(),
  ),
  e('jug (container)', 'kitchen', 'tableware', () =>
    m('jug (container)')
      .ball([0.16, 0.18, 0.16], [0, 0.09, 0], { color: 'blue' })
      .cyl([0.1, 0.07, 0.1], [0, 0.19, 0], { color: 'blue', taper: 1.2 })
      .cyl([0.161, 0.03, 0.161], [0, 0.1, 0], { color: 'white', noInk: true })
      .cone([0.05, 0.05, 0.03], [0.065, 0.215, 0], { color: 'blue', rot: [0, 0, -70] })
      .torus([0.1, 0.14, 0.022], [-0.09, 0.13, 0], { color: 'blue' })
      .done(),
  ),
  e('juice', 'food', 'drinks', () =>
    m('juice')
      .cyl([0.07, 0.13, 0.07], [0, 0.065, 0], { color: 'orange' })
      .cyl([0.074, 0.02, 0.074], [0, 0.13, 0], { color: 'glass' })
      .cyl([0.055, 0.01, 0.055], [0.035, 0.135, 0.01], { color: 'orange', rot: [90, 0, 25] })
      .cyl([0.045, 0.012, 0.045], [0.035, 0.135, 0.011], { color: '#ffd28a', rot: [90, 0, 25], noInk: true })
      .stick([-0.01, 0.08, 0.01], [-0.03, 0.18, 0.01], 0.008, 'green')
      .ball([0.06, 0.03, 0.06], [0.08, 0.015, 0.05], { color: 'orange' })
      .done(),
  ),
  e('juicer', 'kitchen', 'appliances', () =>
    m('juicer')
      .cyl([0.2, 0.12, 0.2], [0, 0.06, 0], { color: 'white' })
      .cyl([0.17, 0.15, 0.17], [0, 0.195, 0], { color: 'glass' })
      .cyl([0.18, 0.03, 0.18], [0, 0.285, 0], { color: 'white' })
      .cyl([0.065, 0.1, 0.065], [0.03, 0.34, 0], { color: 'white' })
      .cyl([0.05, 0.05, 0.05], [0.03, 0.41, 0], { color: 'black' })
      .box([0.04, 0.03, 0.06], [0, 0.15, 0.1], { color: 'white' })
      .cyl([0.07, 0.08, 0.07], [0, 0.04, 0.16], { color: 'orange' })
      .done(),
  ),
  e('jukebox', 'music', 'audio', () => {
    const b = m('jukebox').box([0.8, 1.0, 0.5], [0, 0.5, 0], { color: 'darkwood', round: 0.1 }).cyl([0.8, 0.5, 0.9], [0, 1.0, 0], { color: 'darkwood', rot: [90, 0, 0] });
    arc(b, [0, 1.0, 0.26], 0.36, 0.41, 0, 180, 8, 0.05, 'orange', 'xy', { glow: true });
    arc(b, [0, 1.0, 0.27], 0.28, 0.33, 0, 180, 8, 0.04, 'magenta', 'xy', { glow: true });
    b.box([0.46, 0.28, 0.02], [0, 0.95, 0.26], { color: 'glass' });
    b.box([0.55, 0.3, 0.02], [0, 0.45, 0.26], { color: 'gold' });
    b.each(5, (i) => b.box([0.5, 0.015, 0.022], [0, 0.34 + i * 0.05, 0.265], { color: 'darkbrown', noInk: true }));
    b.pair((s) => b.stick([s * 0.36, 0.08, 0.26], [s * 0.36, 1.0, 0.26], 0.05, 'cyan', { glow: true }));
    return b.each(5, (i) => b.box([0.05, 0.03, 0.03], [-0.16 + i * 0.08, 0.72, 0.26], { color: i % 2 ? 'red' : 'cream' })).done();
  }),
  e('jumper cable', 'garage', 'car tools', () => {
    const b = m('jumper cable');
    for (const [x, c] of [[-0.15, 'red'], [0.15, 'black']] as const) {
      b.torus([0.36, 0.36, 0.07], [x, 0.035, 0], { color: c, rot: [90, 0, 0], tube: 0.2 });
      const cx = x * 2.7;
      b.box([0.035, 0.025, 0.13], [cx, 0.05, 0.15], { color: c, rot: [12, 0, 0] }).box([0.035, 0.025, 0.13], [cx, 0.02, 0.15], { color: c, rot: [-8, 0, 0] });
      b.box([0.04, 0.02, 0.04], [cx, 0.04, 0.22], { color: 'copper' });
      b.rod([x * 1.6, 0.03, 0.12], [cx, 0.035, 0.09], 0.02, c);
    }
    return b.done();
  }),
  e('jumprope', 'toys', 'outdoor toys', () => {
    const b = m('jumprope');
    arc(b, [0, 0.15, 0], 0.35, 0.8, 0, 180, 10, 0.014, 'white');
    return b.pair((s) => b.capsule([0.07, 0.16, 0.07], [s * 0.35, 0.08, 0], { color: s === 1 ? 'red' : 'blue' })).done();
  }),
  e('jungle gym', 'toys', 'playground', () => {
    const b = m('jungle gym');
    for (const x of [-1, 0, 1]) for (const z of [-0.6, 0.6]) b.stick([x, 0, z], [x, 2.0, z], 0.07, 'red');
    for (const y of [1.0, 2.0]) {
      for (const z of [-0.6, 0.6]) b.stick([-1, y, z], [1, y, z], 0.06, 'blue');
      for (const x of [-1, 0, 1]) b.stick([x, y, -0.6], [x, y, 0.6], 0.06, 'yellow');
    }
    b.box([1.0, 0.08, 1.2], [-0.5, 1.0, 0], { color: 'green' });
    b.wedge([1.2, 0.6, 1.4], [-0.5, 2.3, 0], { color: 'red' });
    return b.box([0.5, 0.04, 1.6], [1.25, 0.55, 0.0], { color: 'yellow', rot: [0, 0, -38] }).done();
  }),
  e('junkyard', 'places', 'yards', () => {
    const b = m('junkyard').box([6, 0.12, 4], [0, 0.06, 0], { color: 'dirt' });
    b.box([6, 2.0, 0.12], [0, 1.0, -1.95], { color: '#8a8f94' });
    b.each(6, (i) => b.box([0.06, 2.0, 0.14], [-2.5 + i, 1.0, -1.95], { color: 'darkgray', noInk: true }));
    b.label('JUNKYARD', [2.2, 0.5], [0, 1.6, -1.87], { color: 'yellow' });
    const cs = ['#a0522d', '#5c7a8a', '#8a3a2a', '#c9a050'];
    b.each(4, (i) => b.box([1.3, 0.5, 0.85], [-1.6 + (i % 2) * 0.15, 0.37 + i * 0.5, -0.9], { color: cs[i], rot: [0, i * 8, 0], round: 0.1 }));
    b.each(4, (i) => b.torus([0.7, 0.7, 0.22], [1.8, 0.23 + i * 0.22, -0.7], { color: 'rubber', rot: [90, 0, 0], tube: 0.35 }));
    b.box([1.5, 0.6, 2.4], [0.5, 0.55, 0.8], { color: '#7a8a5a', round: 0.4, rot: [0, 25, 4] });
    return b.ball(0.5, [-1.0, 0.3, 1.2], { color: '#a0522d' }).done();
  }),
  e('kaleidoscope', 'toys', 'classic toys', () => {
    const b = m('kaleidoscope').box([0.14, 0.02, 0.08], [0, 0.01, 0], { color: 'darkwood' }).stick([0, 0.02, 0], [0, 0.07, 0], 0.015, 'darkwood');
    b.cyl([0.055, 0.24, 0.055], [0, 0.1, 0], { color: 'purple', rot: [75, 0, 0] });
    b.each(4, (i) => b.cyl([0.057, 0.02, 0.057], [0, 0.1 + (i - 1.5) * 0.05 * 0.26, (i - 1.5) * 0.05 * 0.97], { color: ['yellow', 'cyan', 'pink', 'lime'][i], rot: [75, 0, 0], noInk: true }));
    b.cyl([0.07, 0.04, 0.07], [0, 0.131, 0.116], { color: 'glass', rot: [75, 0, 0] });
    return b.cyl([0.04, 0.02, 0.04], [0, 0.068, -0.125], { color: 'black', rot: [75, 0, 0] }).done();
  }),
  e('katana', 'armory', 'swords', () => {
    const b = m('katana').box([0.25, 0.08, 0.2], [0, 0.04, 0], { color: 'black', round: 0.2 });
    b.stick([0, 0.08, 0], [0, 0.33, 0], 0.035, 'black');
    b.each(5, (i) => b.box([0.037, 0.012, 0.037], [0, 0.11 + i * 0.045, 0], { color: 'white', rot: [0, 45, 0], noInk: true }));
    b.cyl([0.08, 0.012, 0.07], [0, 0.336, 0], { color: 'gold' });
    b.box([0.03, 0.36, 0.008], [0.004, 0.52, 0], { color: 'silver', round: 0.2, rot: [0, 0, -1.5] });
    b.box([0.028, 0.34, 0.008], [0.016, 0.86, 0], { color: 'silver', round: 0.2, rot: [0, 0, -3] });
    return b.wedge([0.028, 0.05, 0.008], [0.025, 1.05, 0], { color: 'silver', apex: 0.4 }).done();
  }),
  e('kayak', 'garage', 'boats', () => {
    const b = m('kayak', { view: 'side' }).ball([0.6, 0.36, 4.0], [0, 0.2, 0], { color: 'orange' });
    b.ball([0.4, 0.08, 3.0], [0, 0.36, 0], { color: 'yellow', noInk: true });
    b.torus([0.46, 0.62, 0.06], [0, 0.38, -0.2], { color: 'black', rot: [90, 0, 0] }).ball([0.36, 0.08, 0.5], [0, 0.38, -0.2], { color: '#2a2726' });
    b.stick([-0.85, 0.3, 0.3], [0.85, 1.2, 0.3], 0.035, 'black');
    return b.box([0.16, 0.35, 0.03], [0.9, 1.24, 0.3], { color: 'yellow', rot: [0, 0, -62], round: 0.6 }).box([0.16, 0.35, 0.03], [-0.9, 0.27, 0.3], { color: 'yellow', rot: [0, 0, -62], round: 0.6 }).done();
  }),
  e('kazoo', 'music', 'wind', () =>
    m('kazoo')
      .cyl([0.03, 0.13, 0.03], [0, 0.02, 0], { color: 'red', rot: [0, 0, 90], taper: 0.65 })
      .cyl([0.026, 0.03, 0.026], [0.015, 0.042, 0], { color: 'red' })
      .cyl([0.032, 0.008, 0.032], [0.015, 0.058, 0], { color: 'yellow' })
      .done(),
  ),
  e('kebab', 'food', 'meat', () => {
    const b = m('kebab').cyl([0.14, 0.01, 0.14], [0, 0.005, 0], { color: 'white' }).stick([0, 0.01, 0], [0, 0.27, 0], 0.005, 'lightwood');
    const items: Array<[string, 'box' | 'ball']> = [['#8a4a2a', 'box'], ['green', 'box'], ['#8a4a2a', 'box'], ['tomato', 'ball'], ['#8a4a2a', 'box'], ['#f0e0f0', 'box'], ['#8a4a2a', 'box']];
    items.forEach(([c, sh], i) => (sh === 'box' ? b.box([0.032, 0.026, 0.032], [0, 0.035 + i * 0.028, 0], { color: c, rot: [0, i * 25, 0], round: 0.3 }) : b.ball(0.03, [0, 0.035 + i * 0.028, 0], { color: c })));
    return b.done();
  }),
  e('ketchup', 'food', 'sauces', () => {
    const b = m('ketchup');
    bottle(b, 0, 0, 0.2, 0.065, 'red', 'white', 'white', 0.45);
    return b.ball(0.025, [0, 0.06, 0.034], { color: 'tomato' }).ball(0.008, [0, 0.074, 0.034], { color: 'green' }).done();
  }),
  e('kettle', 'kitchen', 'cookware', () => {
    const b = m('kettle').cyl([0.22, 0.12, 0.22], [0, 0.06, 0], { color: 'red', taper: 0.72 }).ball([0.16, 0.06, 0.16], [0, 0.12, 0], { color: 'red' });
    b.ball(0.03, [0, 0.155, 0], { color: 'black' });
    b.stick([0.07, 0.06, 0], [0.16, 0.15, 0], 0.04, 'red', { taper: 0.5 }).ball(0.022, [0.165, 0.155, 0], { color: 'silver' });
    return arc(b, [0, 0.14, 0], 0.075, 0.08, 15, 165, 6, 0.018, 'black').done();
  }),
  e('key', 'home', 'keys', () => key(m('key'), 0, 0, 'brass', 0.09).done()),
  e('key hole', 'home', 'keys', () =>
    m('key hole')
      .box([0.12, 0.17, 0.02], [0, 0.085, -0.02], { color: 'wood' })
      .box([0.07, 0.12, 0.015], [0, 0.085, 0], { color: 'brass', round: 0.5 })
      .cyl([0.024, 0.017, 0.024], [0, 0.098, 0.003], { color: 'black', rot: [90, 0, 0] })
      .wedge([0.024, 0.04, 0.017], [0, 0.072, 0.003], { color: 'black' })
      .ball(0.008, [0, 0.135, 0.008], { color: 'darkbrown' })
      .ball(0.008, [0, 0.035, 0.008], { color: 'darkbrown' })
      .done(),
  ),
  e('key lime pie', 'food', 'desserts', () => {
    const b = m('key lime pie').cyl([0.2, 0.04, 0.2], [0, 0.02, 0], { color: 'crust', taper: 1.12 }).cyl([0.2, 0.012, 0.2], [0, 0.041, 0], { color: '#e4ec9a' });
    around(8, 0.075).forEach(([x, z]) => b.ball([0.03, 0.025, 0.03], [x, 0.05, z], { color: 'white' }));
    b.cyl([0.04, 0.008, 0.04], [0, 0.052, 0], { color: 'lime', rot: [80, 0, 0] });
    b.wedge([0.08, 0.1, 0.03], [0.14, 0.015, 0.14], { color: 'crust', rot: [90, 0, 0] }).wedge([0.075, 0.095, 0.016], [0.14, 0.038, 0.14], { color: '#e4ec9a', rot: [90, 0, 0] });
    return b.done();
  }),
  e('keyboard (computer)', 'tech', 'computer parts', () => {
    const b = m('keyboard (computer)').box([0.44, 0.036, 0.15], [0, 0.018, 0], { color: 'darkgray', round: 0.2 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) b.box([0.025, 0.012, 0.024], [-0.165 + c * 0.03, 0.039, -0.05 + r * 0.03], { color: 'lightgray', round: 0.3 });
    return b.box([0.15, 0.012, 0.024], [0, 0.039, 0.068], { color: 'lightgray', round: 0.3 }).done();
  }),
  e('keyboard (music)', 'music', 'keys', () => {
    const b = m('keyboard (music)').box([1.0, 0.1, 0.32], [0, 0.05, 0], { color: 'black', round: 0.2 });
    b.box([0.84, 0.03, 0.14], [0, 0.105, 0.07], { color: 'white', round: 0.1 });
    b.each(21, (i) => b.box([0.003, 0.031, 0.14], [-0.42 + i * 0.04, 0.106, 0.07], { color: 'gray', noInk: true }));
    for (let i = 0; i < 20; i++) if (![2, 6, 9, 13, 16].includes(i % 21) && i % 7 !== 2 && i % 7 !== 6) b.box([0.022, 0.025, 0.08], [-0.4 + i * 0.04, 0.13, 0.04], { color: 'black', round: 0.1 });
    b.box([0.12, 0.04, 0.01], [0, 0.08, -0.04], { color: 'cyan', glow: true });
    return b.each(6, (i) => b.cyl([0.025, 0.012, 0.025], [0.15 + i * 0.05, 0.105, -0.07], { color: ['red', 'yellow', 'green', 'blue', 'white', 'orange'][i] })).done();
  }),
  e('keycard', 'tech', 'gadgets', () =>
    m('keycard')
      .box([0.08, 0.13, 0.03], [0, 0.065, -0.03], { color: 'darkgray', round: 0.2 })
      .ball(0.014, [0, 0.11, -0.012], { color: 'lime', glow: true })
      .box([0.05, 0.006, 0.01], [0, 0.085, -0.014], { color: 'black' })
      .box([0.086, 0.054, 0.006], [0, 0.03, 0.02], { color: 'white', round: 0.2, rot: [-12, 0, 0] })
      .box([0.087, 0.012, 0.007], [0, 0.042, 0.021], { color: 'blue', rot: [-12, 0, 0], noInk: true })
      .box([0.016, 0.013, 0.004], [-0.022, 0.024, 0.025], { color: 'gold', rot: [-12, 0, 0] })
      .done(),
  ),
  e('keychain', 'home', 'keys', () => {
    const b = m('keychain').torus([0.04, 0.04, 0.005], [0, 0.072, 0], { color: 'silver', tube: 0.1 });
    key(b, -0.014, 0, 'brass', 0.07, 15);
    key(b, 0.014, 0.005, 'silver', 0.07, -15);
    return b.rod([0.015, 0.06, -0.006], [0.04, 0.045, -0.006], 0.004, 'silver').heart(0.035, [0.045, 0.028, -0.006], { color: 'pink' }).done();
  }),
  e('keypad', 'tech', 'electronics', () => {
    const b = m('keypad').box([0.09, 0.13, 0.025], [0, 0.065, 0], { color: 'silver', round: 0.2 });
    b.box([0.065, 0.02, 0.004], [0, 0.11, 0.012], { color: 'lime', glow: true });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) b.box([0.018, 0.014, 0.006], [-0.022 + c * 0.022, 0.02 + r * 0.02, 0.013], { color: 'darkgray', round: 0.3 });
    return b.ball(0.008, [0.035, 0.11, 0.013], { color: 'red', glow: true }).done();
  }),
  e('keys', 'home', 'keys', () => {
    const b = m('keys').torus([0.045, 0.045, 0.006], [0, 0.083, 0], { color: 'silver', tube: 0.1 });
    key(b, -0.02, 0, 'brass', 0.08, 25);
    key(b, 0, 0.004, 'silver', 0.085, 0);
    return key(b, 0.02, -0.004, 'copper', 0.08, -25).done();
  }),
  e('khakis', 'wardrobe', 'pants', () => {
    const b = pants('khakis', 'tan', 1.0, 'darkbrown', 'beige');
    return b.pair((s) => b.box([0.006, 0.8, 0.005], [s * 0.115, 0.42, 0.097], { color: '#c9a876', noInk: true, rot: [0, 0, s * 3] })).done();
  }),
  e('kick scooter', 'garage', 'scooters', () => {
    const b = m('kick scooter', { view: 'side' }).box([0.13, 0.066, 0.56], [0, 0.08, 0], { color: 'blue', round: 0.3 });
    wheel(b, 0.14, [0, 0.07, 0.33], { color: 'rubber', name: 'wheel', w: 0.03 });
    wheel(b, 0.14, [0, 0.07, -0.33], { color: 'rubber', w: 0.03 });
    b.box([0.04, 0.03, 0.14], [0, 0.12, -0.3], { color: 'silver', rot: [-15, 0, 0] });
    b.stick([0, 0.08, 0.33], [0, 0.92, 0.27], 0.035, 'silver');
    return b.stick([-0.2, 0.92, 0.27], [0.2, 0.92, 0.27], 0.03, 'silver').stick([-0.2, 0.92, 0.27], [-0.12, 0.92, 0.27], 0.04, 'black').stick([0.12, 0.92, 0.27], [0.2, 0.92, 0.27], 0.04, 'black').done();
  }),
  e('kickball', 'sports', 'balls', () => {
    const b = m('kickball').ball(0.25, [0, 0.125, 0], { color: 'red' });
    for (const r of [0, 60, 120]) b.torus([0.252, 0.252, 0.01], [0, 0.125, 0], { color: 'darkred', rot: [0, r, 0], noInk: true, tube: 0.04 });
    return b.done();
  }),
  e('kidney', 'clinic', 'organs', () => {
    const c = '#8a3a3a';
    const b = m('kidney').ball([0.06, 0.065, 0.045], [0.006, 0.095, 0], { color: c }).ball([0.06, 0.065, 0.045], [0.006, 0.035, 0], { color: c }).ball([0.04, 0.06, 0.045], [0.02, 0.065, 0], { color: c });
    b.rod([-0.012, 0.072, 0.005], [-0.06, 0.085, 0.005], 0.012, '#d9404a').rod([-0.012, 0.062, 0], [-0.06, 0.06, 0], 0.012, '#4e6fc8');
    return path(b, [[-0.01, 0.055, 0.01], [-0.03, 0.03, 0.012], [-0.035, 0.0, 0.012]], 0.008, '#e8d8a0').done();
  }),
  e('kidney bean', 'food', 'beans', () => {
    const b = m('kidney bean').cyl([0.09, 0.03, 0.09], [0, 0.015, 0], { color: 'white', taper: 1.35 });
    ([[-0.02, 0.035, 0.0, 0], [0.02, 0.035, 0.01, 60], [0.0, 0.035, -0.025, 120], [0.03, 0.036, -0.02, 30], [-0.03, 0.036, -0.02, 90], [0.0, 0.048, 0.0, 150], [-0.005, 0.034, 0.03, 20]] as const).forEach(([x, y, z, a]) => {
      const r = (a * Math.PI) / 180;
      b.ball([0.016, 0.012, 0.012], [x + Math.cos(r) * 0.006, y, z + Math.sin(r) * 0.006], { color: '#7a1e2a' }).ball([0.016, 0.012, 0.012], [x - Math.cos(r) * 0.006, y, z - Math.sin(r) * 0.006], { color: '#7a1e2a' });
    });
    return b.done();
  }),
  e('kidney stone', 'clinic', 'medical', () => {
    const b = m('kidney stone').cyl([0.09, 0.008, 0.09], [0, 0.004, 0], { color: 'white' }).ball([0.032, 0.026, 0.028], [0, 0.021, 0], { color: '#c9a050' });
    for (const [x, y, z, rx, rz] of [[0.015, 0.03, 0, 0, -50], [-0.015, 0.03, 0.005, 0, 50], [0, 0.036, 0, 0, 0], [0.005, 0.022, 0.015, 60, 0], [-0.01, 0.022, -0.014, -60, 0]] as const) b.cone([0.012, 0.018, 0.012], [x, y, z], { color: '#b8903e', rot: [rx, 0, rz] });
    return b.done();
  }),
  e('kilt', 'wardrobe', 'skirts', () => {
    const b = m('kilt').cyl([0.38, 0.46, 0.3], [0, 0.23, 0], { color: 'red', taper: 0.82 });
    for (const y of [0.08, 0.2, 0.32]) b.cyl([0.37 - y * 0.15, 0.025, 0.29 - y * 0.1], [0, y, 0], { color: 'darkgreen', taper: 0.98, noInk: true });
    for (const x of [-0.1, 0, 0.1]) b.box([0.02, 0.44, 0.012], [x, 0.23, 0.13 + Math.abs(x) * -0.2], { color: 'navy', noInk: true });
    b.cyl([0.32, 0.04, 0.25], [0, 0.47, 0], { color: 'black' });
    b.box([0.12, 0.13, 0.04], [0, 0.36, 0.14], { color: 'leather', round: 0.4 });
    return b.pair((s) => b.rod([s * 0.025, 0.32, 0.165], [s * 0.025, 0.24, 0.165], 0.012, 'white')).done();
  }),
  e('kimono', 'wardrobe', 'robes', () => {
    const b = m('kimono').box([0.46, 1.3, 0.26], [0, 0.65, 0], { color: 'red', round: 0.2 });
    b.pair((s) => {
      b.box([0.3, 0.46, 0.22], [s * 0.36, 1.05, 0], { color: 'red', round: 0.2 });
      b.box([0.05, 0.4, 0.02], [s * 0.05, 1.12, 0.13], { color: 'white', rot: [0, 0, -s * 25] });
    });
    for (const [x, y] of [[-0.12, 0.3], [0.1, 0.5], [-0.05, 0.15], [0.14, 0.2], [0.4, 1.0], [-0.38, 1.1]] as const) b.ball([0.06, 0.06, 0.02], [x, y, x > 0.3 || x < -0.3 ? 0.11 : 0.13], { color: 'pink', noInk: true });
    b.box([0.48, 0.18, 0.28], [0, 0.8, 0], { color: 'gold', round: 0.2 });
    return b.box([0.47, 0.06, 0.27], [0, 0.03, 0], { color: 'darkred', round: 0.3 }).done();
  }),
  e('kindling', 'nature', 'fire', () => {
    const b = m('kindling').cyl([0.09, 0.32, 0.09], [0, 0.045, -0.13], { color: 'bark', rot: [0, 0, 90] });
    around(6, 0.12).forEach(([x, z], i) => b.stick([x, 0, z], [x * 0.1, 0.28, z * 0.1], 0.02, i % 2 ? 'wood' : 'lightwood'));
    b.stick([0.1, 0.01, 0.15], [0.25, 0.01, 0.1], 0.015, 'wood').stick([-0.2, 0.01, 0.12], [-0.08, 0.01, 0.2], 0.015, 'lightwood');
    return b.torus([0.03, 0.03, 0.01], [0.15, 0.012, 0.18], { color: 'tan', rot: [90, 0, 0] }).done();
  }),
  e('kiosk', 'places', 'stands', () => {
    const b = m('kiosk').box([2.0, 2.2, 1.6], [0, 1.1, 0], { color: 'teal', round: 0.05 }).box([2.3, 0.2, 1.9], [0, 2.3, 0], { color: 'darkgreen' });
    b.box([1.4, 0.8, 0.05], [0, 1.35, 0.79], { color: '#2a3a3a' }).box([1.5, 0.08, 0.35], [0, 0.95, 0.95], { color: 'wood' });
    b.each(5, (i) => b.box([0.46, 0.08, 0.6], [-0.92 + i * 0.46, 1.9, 1.05], { color: i % 2 ? 'white' : 'red', rot: [25, 0, 0] }));
    b.label('KIOSK', [1.4, 0.35], [0, 2.58, 0.82], { color: 'yellow' });
    return b.each(3, (i) => b.box([0.3, 0.4, 0.02], [-0.5 + i * 0.5, 0.5, 0.82], { color: ['cream', 'skyblue', 'pink'][i] })).done();
  }),
  e('kitchen', 'places', 'rooms', () => {
    const b = m('kitchen').box([3.4, 0.08, 2.0], [0, 0.04, 0], { color: '#d9c9a8' }).box([3.4, 2.4, 0.15], [0, 1.2, -1.0], { color: 'cream' });
    b.box([1.8, 0.88, 0.6], [-0.6, 0.48, -0.62], { color: 'wood', round: 0.05 }).box([1.9, 0.05, 0.66], [-0.6, 0.94, -0.6], { color: 'darkgray' });
    b.each(3, (i) => b.box([0.55, 0.7, 0.02], [-1.2 + i * 0.6, 0.48, -0.31], { color: 'lightwood', round: 0.1 }));
    b.box([0.5, 0.04, 0.36], [-1.1, 0.96, -0.6], { color: 'steel' }).rod([-1.1, 0.96, -0.85], [-1.1, 1.18, -0.8], 0.03, 'silver').rod([-1.1, 1.18, -0.8], [-1.1, 1.16, -0.65], 0.03, 'silver');
    b.box([0.6, 0.02, 0.5], [0.0, 0.97, -0.62], { color: 'black' });
    for (const [x, z] of [[-0.13, -0.5], [0.13, -0.5], [-0.13, -0.74], [0.13, -0.74]] as const) b.torus([0.16, 0.16, 0.02], [x, 0.985, z], { color: 'darkgray', rot: [90, 0, 0] });
    b.box([1.8, 0.6, 0.35], [-0.6, 1.85, -0.75], { color: 'wood', round: 0.05 });
    b.box([0.8, 1.9, 0.7], [1.0, 1.0, -0.6], { color: 'white', round: 0.1 }).stick([0.7, 1.1, -0.24], [0.7, 1.6, -0.24], 0.04, 'silver');
    return b.done();
  }),
  e('kite (toy)', 'sky', 'kites', () => {
    const b = m('kite (toy)').wedge([0.6, 0.3, 0.025], [0, 1.1, 0], { color: 'red' }).wedge([0.6, 0.6, 0.025], [0, 0.65, 0], { color: 'yellow', rot: [0, 0, 180] });
    b.stick([0, 0.35, 0.015], [0, 1.25, 0.015], 0.012, 'darkwood').stick([-0.3, 0.95, 0.015], [0.3, 0.95, 0.015], 0.012, 'darkwood');
    path(b, [[0, 0.35, 0], [0.05, 0.27, 0], [-0.03, 0.19, 0], [0.04, 0.11, 0]], 0.008, 'darkgray');
    for (const [x, y, c] of [[0.05, 0.27, 'blue'], [-0.03, 0.19, 'green'], [0.04, 0.11, 'red']] as const) b.pair((s) => b.wedge([0.04, 0.04, 0.01], [x + s * 0.02, y, 0], { color: c, rot: [0, 0, s * 90] }));
    b.stick([0, 0.95, 0.02], [0.45, 0.1, 0.35], 0.004, 'white', { noInk: true });
    return b.cyl([0.12, 0.1, 0.12], [0.45, 0.05, 0.35], { color: 'wood', rot: [0, 0, 90] }).done();
  }),
  e('kitty litter', 'pets', 'cat things', () => {
    const b = m('kitty litter').box([0.45, 0.12, 0.35], [0, 0.06, 0], { color: '#6fa0c8', round: 0.2 }).box([0.41, 0.02, 0.31], [0, 0.115, 0], { color: '#d9ccb0' });
    for (const [x, z] of [[-0.1, 0.05], [0.08, -0.06], [0.12, 0.08], [-0.05, -0.08], [0.0, 0.02]] as const) b.ball([0.04, 0.02, 0.035], [x, 0.125, z], { color: '#c9bb9a' });
    b.stick([0.17, 0.12, -0.12], [0.24, 0.3, -0.16], 0.02, 'purple');
    return b.box([0.09, 0.012, 0.1], [0.15, 0.13, -0.1], { color: 'purple', rot: [0, 0, 60], round: 0.2 }).done();
  }),
  e('kiwi (fruit)', 'food', 'fruit', () => {
    const b = m('kiwi (fruit)').ball([0.072, 0.055, 0.055], [-0.04, 0.0275, -0.01], { color: '#8a6a3a' }).ball([0.056, 0.056, 0.036], [0.035, 0.028, 0], { color: '#8a6a3a' });
    b.cyl([0.052, 0.006, 0.052], [0.035, 0.028, 0.017], { color: '#8cc43a', rot: [90, 0, 0] }).cyl([0.018, 0.007, 0.018], [0.035, 0.028, 0.018], { color: 'cream', rot: [90, 0, 0], noInk: true });
    around(10, 0.014).forEach(([x, y]) => b.ball(0.004, [0.035 + x, 0.028 + y, 0.021], { color: 'black', noInk: true }));
    return b.done();
  }),
  e('kneecap', 'clinic', 'bones', () => {
    const c = '#efe3c8';
    return m('kneecap')
      .stick([0, 0.32, -0.02], [0, 0.17, -0.02], 0.045, c)
      .ball([0.08, 0.05, 0.065], [0, 0.165, -0.02], { color: c })
      .box([0.08, 0.03, 0.065], [0, 0.125, -0.02], { color: c, round: 0.5 })
      .stick([0, 0.11, -0.02], [0, 0.0, -0.02], 0.045, c)
      .ball([0.05, 0.06, 0.03], [0, 0.16, 0.025], { color: '#f2cf80' })
      .done();
  }),
  e('kneepads', 'sports', 'protective gear', () => {
    const b = m('kneepads');
    return b.pair((s) => {
      const x = s * 0.09;
      b.ball([0.12, 0.17, 0.07], [x, 0.09, 0], { color: 'black', rot: [-10, 0, 0] });
      b.ball([0.085, 0.11, 0.04], [x, 0.1, 0.03], { color: 'gray', rot: [-10, 0, 0] });
      for (const y of [0.04, 0.15]) b.stick([x - 0.065, y, -0.02], [x + 0.065, y, -0.02], 0.025, 'darkgray');
      b.box([0.03, 0.025, 0.02], [x + 0.065, 0.15, -0.01], { color: 'silver' });
    }).done();
  }),
  e('knife', 'kitchen', 'knives', () =>
    m('knife')
      .box([0.028, 0.11, 0.024], [0, 0.055, 0], { color: 'black', round: 0.4 })
      .ball(0.007, [0, 0.035, 0.012], { color: 'silver' })
      .ball(0.007, [0, 0.075, 0.012], { color: 'silver' })
      .box([0.03, 0.014, 0.02], [0.004, 0.117, 0], { color: 'steel' })
      .box([0.045, 0.11, 0.004], [0.008, 0.178, 0], { color: 'silver', round: 0 })
      .wedge([0.045, 0.07, 0.004], [0.008, 0.268, 0], { color: 'silver', apex: -0.45 })
      .done(),
  ),
  e('knife sharpener', 'kitchen', 'knives', () =>
    m('knife sharpener')
      .box([0.22, 0.03, 0.08], [0, 0.015, 0], { color: 'rubber', round: 0.3 })
      .box([0.2, 0.025, 0.07], [0, 0.042, 0], { color: '#7a8a9a', round: 0.05 })
      .box([0.2, 0.025, 0.07], [0, 0.067, 0], { color: '#d9773a', round: 0.05 })
      .box([0.17, 0.004, 0.045], [0.03, 0.083, 0.01], { color: 'silver', rot: [0, 25, 0] })
      .box([0.1, 0.022, 0.026], [-0.1, 0.09, 0.07], { color: 'black', rot: [0, 25, 0], round: 0.4 })
      .done(),
  ),
  e('knight helmet', 'armory', 'armour', () => {
    const b = m('knight helmet').cyl([0.24, 0.3, 0.26], [0, 0.15, 0], { color: 'steel' }).cyl([0.24, 0.05, 0.26], [0, 0.325, 0], { color: 'steel', taper: 0.75 });
    b.pair((s) => b.box([0.08, 0.016, 0.012], [s * 0.05, 0.22, 0.128], { color: 'black' }));
    b.box([0.03, 0.26, 0.012], [0, 0.15, 0.13], { color: 'gold' }).box([0.24, 0.025, 0.012], [0, 0.245, 0.124], { color: 'gold' });
    for (const [x, y] of [[0.07, 0.1], [0.09, 0.08], [0.07, 0.06], [0.09, 0.12]] as const) b.ball(0.01, [x, y, 0.12], { color: 'black', noInk: true });
    return b.ball([0.08, 0.14, 0.1], [0, 0.42, -0.02], { color: 'red', rot: [-20, 0, 0] }).done();
  }),
  e('knitting needle', 'home', 'crafts', () => {
    const b = m('knitting needle').ball(0.12, [0, 0.06, 0], { color: 'pink' });
    for (const r of [0, 50, 100, 150]) b.torus([0.122, 0.122, 0.008], [0, 0.06, 0], { color: '#e88aa8', rot: [r, 30, 0], noInk: true, tube: 0.06 });
    b.stick([-0.03, 0.07, 0.03], [0.1, 0.3, 0.04], 0.007, 'silver').ball(0.018, [0.1, 0.305, 0.04], { color: 'red' });
    b.stick([0.03, 0.07, 0.03], [-0.1, 0.29, 0.02], 0.007, 'silver').ball(0.018, [-0.1, 0.295, 0.02], { color: 'blue' });
    return path(b, [[0.05, 0.03, 0.04], [0.1, 0.01, 0.07], [0.14, 0.004, 0.05]], 0.008, 'pink').done();
  }),
  e('knocker', 'home', 'door hardware', () =>
    m('knocker')
      .box([0.3, 0.4, 0.04], [0, 0.2, -0.02], { color: 'darkwood' })
      .ball([0.11, 0.11, 0.04], [0, 0.27, 0.02], { color: 'brass' })
      .ball(0.035, [-0.045, 0.31, 0.015], { color: 'brass' })
      .ball(0.035, [0.045, 0.31, 0.015], { color: 'brass' })
      .ball(0.012, [-0.02, 0.285, 0.04], { color: 'black', noInk: true })
      .ball(0.012, [0.02, 0.285, 0.04], { color: 'black', noInk: true })
      .torus([0.12, 0.12, 0.016], [0, 0.18, 0.045], { color: 'brass', rot: [15, 0, 0] })
      .ball([0.04, 0.03, 0.02], [0, 0.11, 0.01], { color: 'brass' })
      .done(),
  ),
  e('knuckle', 'clinic', 'body parts', () => {
    const sk = 'skin3';
    const b = m('knuckle').cyl([0.055, 0.03, 0.045], [0, 0.015, 0], { color: sk }).box([0.09, 0.07, 0.06], [0, 0.06, 0], { color: sk, round: 0.5 });
    b.each(4, (i) => b.ball(0.025, [-0.033 + i * 0.022, 0.095, 0.022], { color: sk }));
    b.box([0.088, 0.04, 0.026], [0, 0.068, 0.035], { color: sk, round: 0.6 });
    return b.rod([-0.05, 0.055, 0.02], [0.0, 0.045, 0.05], 0.022, sk).done();
  }),
  e('lab coat', 'wardrobe', 'coats', () => {
    const b = shirt('lab coat', { color: 'white', len: 1.1, long: true, buttons: 'lightgray' });
    b.pair((s) => b.box([0.12, 0.1, 0.01], [s * 0.13, 0.35, 0.112], { color: '#ececec' }));
    return b.box([0.09, 0.07, 0.01], [0.13, 0.85, 0.112], { color: '#ececec' }).stick([0.15, 0.86, 0.118], [0.15, 0.93, 0.118], 0.012, 'blue').done();
  }),
  e('label maker', 'study', 'office supplies', () => {
    const b = m('label maker').box([0.08, 0.17, 0.04], [0, 0.085, 0], { color: 'yellow', round: 0.3 }).box([0.06, 0.03, 0.004], [0, 0.14, 0.02], { color: '#9bbc0f', glow: true });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b.box([0.012, 0.01, 0.005], [-0.021 + c * 0.014, 0.04 + r * 0.018, 0.021], { color: 'black' });
    return b.box([0.025, 0.07, 0.004], [0, 0.2, 0], { color: 'white' }).box([0.015, 0.04, 0.005], [0, 0.205, 0], { color: 'black', noInk: true }).done();
  }),
  e('laboratory', 'places', 'rooms', () => {
    const b = m('laboratory').box([3, 0.1, 2], [0, 0.05, 0], { color: 'lightgray' }).box([3, 2.4, 0.15], [0, 1.2, -1.0], { color: 'white' });
    b.box([2.4, 0.9, 0.7], [0, 0.5, -0.5], { color: 'gray', round: 0.05 }).box([2.5, 0.05, 0.75], [0, 0.97, -0.5], { color: 'black' });
    b.cyl([0.2, 0.25, 0.2], [-0.8, 1.12, -0.4], { color: 'lime', taper: 0.25, glow: true }).cyl([0.06, 0.1, 0.06], [-0.8, 1.29, -0.4], { color: 'glass' });
    b.ball(0.22, [-0.35, 1.11, -0.5], { color: 'magenta', glow: true }).cyl([0.05, 0.14, 0.05], [-0.35, 1.28, -0.5], { color: 'glass' });
    b.box([0.4, 0.06, 0.12], [0.2, 1.03, -0.4], { color: 'wood' });
    b.each(4, (i) => b.cyl([0.04, 0.16, 0.04], [0.07 + i * 0.09, 1.1, -0.4], { color: ['red', 'blue', 'yellow', 'cyan'][i], glow: true }));
    b.box([0.2, 0.04, 0.2], [0.8, 1.02, -0.5], { color: 'black' }).rod([0.8, 1.02, -0.58], [0.8, 1.3, -0.55], 0.05, 'black').stick([0.8, 1.32, -0.5], [0.8, 1.15, -0.45], 0.06, 'silver');
    b.box([1.6, 0.06, 0.3], [0.4, 1.8, -0.85], { color: 'wood' });
    b.each(5, (i) => b.cyl([0.1, 0.2, 0.1], [-0.2 + i * 0.25, 1.93, -0.85], { color: ['teal', 'orange', 'purple', 'green', 'red'][i] }));
    return b.label('LAB', [0.6, 0.3], [-1.0, 1.9, -0.92], { color: 'white' }).done();
  }),
  e('labyrinth', 'toys', 'puzzles', () => {
    const b = m('labyrinth').box([0.3, 0.025, 0.3], [0, 0.0125, 0], { color: 'lightwood' });
    const h = 0.03, y = 0.04, c = 'darkwood';
    const walls: Array<[number, number, number, number]> = [[0, -0.144, 0.3, 0.012], [-0.09, 0.144, 0.12, 0.012], [0.09, 0.144, 0.12, 0.012], [-0.144, 0, 0.012, 0.3], [0.144, 0, 0.012, 0.3], [-0.03, -0.07, 0.18, 0.012], [0.05, 0.0, 0.18, 0.012], [-0.07, 0.07, 0.14, 0.012], [-0.07, -0.02, 0.012, 0.1], [0.08, 0.08, 0.012, 0.13], [0.1, -0.09, 0.012, 0.1]];
    walls.forEach(([x, z, w, d]) => b.box([w, h, d], [x, y, z], { color: c, round: 0.1 }));
    return b.ball(0.025, [-0.11, 0.038, 0.11], { color: 'silver' }).done();
  }),
  e('lace', 'home', 'crafts', () => {
    const b = m('lace').box([0.14, 0.03, 0.09], [0, 0.015, 0], { color: 'wood' }).stick([0, 0.03, -0.02], [0, 0.12, -0.04], 0.015, 'wood');
    b.cyl([0.2, 0.01, 0.2], [0, 0.15, 0], { color: 'white', rot: [90, 0, 0] });
    for (const d of [0.05, 0.1, 0.15]) b.torus([d, d, 0.008], [0, 0.15, 0.005], { color: '#e8dcc8', noInk: true, tube: 0.1 });
    around(14, 0.105).forEach(([x, y]) => b.ball([0.035, 0.035, 0.01], [x, 0.15 + y, 0], { color: 'white' }));
    return b.each(8, (i) => { const a = (i / 8) * Math.PI * 2; b.ball(0.012, [Math.cos(a) * 0.063, 0.15 + Math.sin(a) * 0.063, 0.007], { color: '#cfc4b4', noInk: true }); }).done();
  }),
  e('ladder', 'workshop', 'ladders', () => {
    const b = m('ladder');
    b.pair((s) => {
      b.stick([s * 0.24, 0, 0.36], [s * 0.18, 1.9, 0.02], 0.05, 'silver');
      b.stick([s * 0.24, 0, -0.36], [s * 0.18, 1.9, -0.02], 0.05, 'silver');
      b.stick([s * 0.22, 0.6, 0.25], [s * 0.22, 0.6, -0.25], 0.02, 'gray');
    });
    for (const y of [0.4, 0.8, 1.2, 1.6]) b.box([0.42, 0.03, 0.1], [0, y, 0.36 - (0.34 * y) / 1.9], { color: 'orange', rot: [-10, 0, 0] });
    b.box([0.44, 0.06, 0.25], [0, 1.92, 0], { color: 'orange', round: 0.3 });
    b.cyl([0.2, 0.2, 0.2], [0, 2.05, 0], { color: 'blue' }).torus([0.18, 0.12, 0.01], [0, 2.18, 0], { color: 'silver' });
    return b.capsule([0.03, 0.08, 0.02], [0.05, 2.0, 0.1], { color: 'skyblue' }).done();
  }),
  e('ladle', 'kitchen', 'utensils', () => {
    const b = m('ladle').ball([0.09, 0.08, 0.09], [0, 0.04, 0], { color: 'steel' }).torus([0.09, 0.09, 0.008], [0, 0.065, 0], { color: 'steel', rot: [90, 0, 0] });
    b.cyl([0.078, 0.008, 0.078], [0, 0.066, 0], { color: 'tomato', noInk: true });
    b.rod([-0.04, 0.065, 0], [-0.07, 0.3, 0], 0.014, 'steel');
    return arc(b, [-0.055, 0.3, 0], 0.015, 0.02, 180, 360, 3, 0.012, 'steel').done();
  }),
  e('lair', 'fantasy', 'lairs', () => {
    const b = m('lair');
    dome(b, 1.6, 2.2, [0, 0, 0], 'rock');
    b.ball([1.0, 1.0, 1.0], [1.3, 0.4, 0.5], { color: 'stone' }).ball([0.8, 0.9, 0.8], [-1.3, 0.35, 0.6], { color: 'stone' });
    b.ball([1.2, 1.5, 0.4], [0, 0.65, 1.38], { color: '#1a1614' });
    b.pair((s) => b.ball([0.12, 0.08, 0.05], [s * 0.18, 0.85, 1.56], { color: 'yellow', glow: true }));
    b.rod([-0.4, 0.04, 1.9], [0.0, 0.04, 2.1], 0.06, 'cream').ball(0.08, [-0.42, 0.05, 1.9], { color: 'cream' }).ball(0.08, [0.02, 0.05, 2.12], { color: 'cream' });
    return b.ball([0.22, 0.2, 0.22], [0.6, 0.1, 1.9], { color: 'cream' }).done();
  }),
  e('lamp', 'home', 'lighting', () =>
    m('lamp')
      .cyl([0.16, 0.03, 0.16], [0, 0.015, 0], { color: 'brass' })
      .ball([0.14, 0.17, 0.14], [0, 0.11, 0], { color: 'teal' })
      .stick([0, 0.19, 0], [0, 0.33, 0], 0.016, 'brass')
      .ball(0.06, [0, 0.33, 0], { color: '#fff3b0', glow: true })
      .cyl([0.32, 0.2, 0.32], [0, 0.4, 0], { color: 'cream', taper: 0.6 })
      .done(),
  ),
  e('lamp shade', 'home', 'lighting', () => {
    const b = m('lamp shade').cyl([0.3, 0.22, 0.3], [0, 0.115, 0], { color: 'beige', taper: 0.6 });
    b.torus([0.31, 0.31, 0.015], [0, 0.008, 0], { color: 'gold', rot: [90, 0, 0] }).torus([0.19, 0.19, 0.012], [0, 0.225, 0], { color: 'gold', rot: [90, 0, 0] });
    around(10, 0.125).forEach(([x, z]) => b.ball(0.022, [x, 0.11, z], { color: 'pink', noInk: true }));
    return b.done();
  }),
  e('lance', 'armory', 'spears', () => {
    const b = m('lance').box([0.4, 0.2, 0.4], [0, 0.1, 0], { color: 'darkwood' }).stick([0, 0.2, 0], [0, 0.6, 0], 0.06, 'leather');
    b.cone([0.42, 0.35, 0.42], [0, 0.66, 0], { color: 'silver' });
    b.cyl([0.18, 1.75, 0.18], [0, 1.65, 0], { color: 'white', taper: 0.08 });
    return b.each(4, (i) => b.cyl([0.17 - i * 0.034, 0.15, 0.17 - i * 0.034], [0, 0.95 + i * 0.36, 0], { color: 'red', rot: [0, 0, 18], noInk: true })).done();
  }),
  e('lantern', 'home', 'lighting', () => {
    const b = m('lantern').cyl([0.14, 0.04, 0.14], [0, 0.02, 0], { color: 'red' }).ball([0.11, 0.15, 0.11], [0, 0.115, 0], { color: '#ffe6a0', glow: true });
    for (const r of [0, 90]) b.torus([0.125, 0.16, 0.008], [0, 0.115, 0], { color: 'darkgray', rot: [0, r, 0] });
    b.cyl([0.12, 0.04, 0.12], [0, 0.205, 0], { color: 'red', taper: 0.6 }).cyl([0.04, 0.03, 0.04], [0, 0.24, 0], { color: 'red' });
    return arc(b, [0, 0.21, 0], 0.075, 0.09, 0, 180, 6, 0.008, 'darkgray').done();
  }),
  e('laptop', 'tech', 'computers', () =>
    m('laptop')
      .box([0.32, 0.025, 0.22], [0, 0.0125, 0], { color: 'silver', round: 0.2 })
      .box([0.28, 0.004, 0.1], [0, 0.026, -0.03], { color: 'darkgray' })
      .box([0.08, 0.004, 0.05], [0, 0.026, 0.065], { color: 'gray' })
      .box([0.32, 0.21, 0.012], [0, 0.126, -0.137], { color: 'silver', rot: [-15, 0, 0], round: 0.2 })
      .box([0.29, 0.18, 0.004], [0, 0.128, -0.129], { color: '#4e8fd6', rot: [-15, 0, 0], glow: true })
      .done(),
  ),
  e('lard', 'food', 'cooking', () =>
    m('lard')
      .box([0.12, 0.07, 0.08], [0, 0.035, 0], { color: '#f5f0e0', round: 0.15 })
      .box([0.07, 0.074, 0.084], [-0.028, 0.037, 0], { color: 'paper', round: 0.1 })
      .label('LARD', [0.06, 0.035], [-0.028, 0.04, 0.042], { color: 'red' })
      .box([0.03, 0.004, 0.06], [0.04, 0.071, 0.0], { color: '#e8e0c8', noInk: true })
      .done(),
  ),
  e('large intestine', 'clinic', 'organs', () => {
    const c = '#c98a6a';
    const b = m('large intestine');
    const pts: V[] = [[0.13, 0.08, 0], [0.15, 0.2, 0], [0.14, 0.34, 0], [0.04, 0.38, 0.01], [-0.06, 0.37, 0.01], [-0.15, 0.33, 0], [-0.16, 0.2, 0], [-0.13, 0.1, 0], [-0.04, 0.09, 0.02], [0, 0.04, 0.01]];
    path(b, pts, 0.075, c);
    pts.forEach((p, i) => b.ball(i === pts.length - 1 ? 0.06 : 0.09, p, { color: i % 2 ? '#b9785a' : c }));
    return b.rod([0.13, 0.08, 0], [0.11, 0.0, 0.02], 0.02, '#d99a7a').done();
  }),
  e('large steel door', 'workshop', 'doors and gates', () => {
    const b = m('large steel door').box([0.2, 2.5, 0.25], [-0.78, 1.25, 0], { color: 'darkgray' }).box([0.2, 2.5, 0.25], [0.78, 1.25, 0], { color: 'darkgray' });
    b.box([1.76, 0.2, 0.25], [0, 2.6, 0], { color: 'darkgray' });
    b.box([1.36, 2.45, 0.1], [0, 1.23, 0.04], { color: 'steel', name: 'door', pivot: [-0.68, 1.23, 0.04] });
    for (let r = 0; r < 6; r++) for (const x of [-0.6, 0.6]) b.ball(0.04, [x, 0.2 + r * 0.42, 0.1], { color: 'iron', parent: 'door' });
    b.torus([0.5, 0.5, 0.05], [0, 1.35, 0.13], { color: 'iron', parent: 'door' });
    b.stick([-0.24, 1.35, 0.13], [0.24, 1.35, 0.13], 0.04, 'iron', { parent: 'door' }).stick([0, 1.11, 0.13], [0, 1.59, 0.13], 0.04, 'iron', { parent: 'door' });
    return b.cyl([0.12, 0.1, 0.12], [0, 1.35, 0.12], { color: 'iron', rot: [90, 0, 0], parent: 'door' }).done();
  }),
  e('large steel gate', 'workshop', 'doors and gates', () => {
    const b = m('large steel gate');
    b.pair((s) => {
      b.box([0.35, 3.2, 0.35], [s * 2.2, 1.6, 0], { color: 'stone' });
      b.cone([0.42, 0.3, 0.42], [s * 2.2, 3.35, 0], { color: 'darkgray' });
    });
    const leaf = (s: 1 | -1, o: PartOpts) => {
      for (let i = 0; i < 8; i++) {
        const x = s * (0.12 + i * 0.25);
        b.stick([x, 0.1, 0], [x, 2.8, 0], 0.05, 'iron', o);
        b.cone([0.08, 0.16, 0.08], [x, 2.88, 0], { ...o, name: undefined, color: 'iron' });
      }
      for (const y of [0.3, 1.5, 2.7]) b.stick([s * 0.05, y, 0], [s * 2.0, y, 0], 0.06, 'iron', o);
    };
    b.stick([1.98, 0.3, 0.0], [1.98, 2.7, 0.0], 0.07, 'iron', { name: 'door', pivot: [2.0, 1.5, 0] });
    leaf(1, { parent: 'door' });
    leaf(-1, {});
    return b.done();
  }),
  e('lasagna', 'food', 'pasta', () => {
    const b = m('lasagna').cyl([0.22, 0.012, 0.22], [0, 0.006, 0], { color: 'white' });
    b.box([0.106, 0.066, 0.126], [0, 0.045, 0], { color: 'tomato', round: 0.1 });
    for (const [y, c] of [[0.02, '#f0d890'], [0.036, '#f5e6b0'], [0.05, '#f0d890'], [0.066, '#f5e6b0']] as const) b.box([0.11, 0.007, 0.13], [0, y, 0], { color: c, round: 0.1, noInk: true });
    b.box([0.115, 0.012, 0.135], [0, 0.084, 0], { color: '#e8b84a', round: 0.4 });
    for (const [x, z] of [[0.02, 0.03], [-0.03, -0.02], [0.03, -0.04]] as const) b.ball([0.015, 0.004, 0.012], [x, 0.091, z], { color: 'brown', noInk: true });
    return b.ball([0.03, 0.006, 0.02], [-0.02, 0.092, 0.03], { color: 'leaf' }).done();
  }),
  e('laser pointer', 'tech', 'gadgets', () =>
    m('laser pointer')
      .box([0.09, 0.025, 0.05], [0, 0.0125, 0], { color: 'darkgray', round: 0.3 })
      .cyl([0.016, 0.14, 0.016], [0, 0.06, 0], { color: 'silver', rot: [0, 0, -60] })
      .ball(0.008, [0.0, 0.069, 0.007], { color: 'red' })
      .stick([0.062, 0.096, 0], [0.18, 0.164, 0], 0.005, 'red', { glow: true })
      .ball(0.014, [0.18, 0.164, 0], { color: 'red', glow: true })
      .done(),
  ),
  e('lasso', 'farm', 'ranch gear', () => {
    const b = m('lasso').torus([0.34, 0.34, 0.1], [0, 0.05, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.3 });
    b.torus([0.24, 0.24, 0.01], [0, 0.1, 0], { color: '#b8945e', rot: [90, 0, 0], noInk: true });
    path(b, [[0.15, 0.08, 0], [0.22, 0.4, 0.05], [0.18, 0.75, 0.05], [0.2, 1.0, 0.1]], 0.02, 'tan');
    return b.torus([0.9, 0.9, 0.03], [0.2, 1.05, 0], { color: 'tan', rot: [75, 0, 0], tube: 0.06 }).ball(0.05, [0.2, 1.0, 0.12], { color: '#b8945e' }).done();
  }),
  e('lattice', 'garden', 'garden things', () => {
    const b = m('lattice').box([1.0, 0.25, 0.25], [0, 0.125, 0], { color: 'wood' }).box([0.96, 0.02, 0.21], [0, 0.25, 0], { color: 'dirt' });
    const Y = 0.75, w = 'white';
    b.box([1.0, 0.04, 0.04], [0, Y + 0.5, 0], { color: w }).box([1.0, 0.04, 0.04], [0, Y - 0.5, 0], { color: w });
    b.pair((s) => b.box([0.04, 1.0, 0.04], [s * 0.5, Y, 0], { color: w }));
    for (let c = -0.75; c <= 0.76; c += 0.25)
      for (const sg of [1, -1]) {
        const x0 = Math.max(-0.5, c - 0.5), x1 = Math.min(0.5, c + 0.5);
        if (x1 - x0 < 0.05) continue;
        b.stick([x0, Y + sg * (x0 - c), 0.01], [x1, Y + sg * (x1 - c), 0.01], 0.022, w);
      }
    const vine: V[] = [[-0.3, 0.26, 0.05], [-0.2, 0.55, 0.05], [-0.3, 0.8, 0.05], [-0.1, 1.05, 0.05], [0.15, 1.15, 0.05]];
    path(b, vine, 0.02, 'darkgreen');
    return b.each(vine.length, (i) => b.ball([0.08, 0.05, 0.03], [vine[i][0] + 0.04, vine[i][1], 0.06], { color: 'leaf' }).ball(0.05, [vine[i][0] - 0.04, vine[i][1] + 0.05, 0.06], { color: i % 2 ? 'pink' : 'magenta' })).done();
  }),
  e('laundromat', 'places', 'shops', () => {
    const b = bld('laundromat', { w: 6, h: 3.5, d: 4, wall: 'skyblue', flat: true, sign: 'LAUNDROMAT', door: 'glass' });
    return b.pair((s) => {
      b.box([0.95, 0.95, 0.12], [s * 1.8, 1.3, 2.08], { color: 'white', round: 0.1 });
      b.torus([0.6, 0.6, 0.06], [s * 1.8, 1.25, 2.15], { color: 'silver' });
      b.cyl([0.5, 0.03, 0.5], [s * 1.8, 1.25, 2.15], { color: '#7fb6d9', rot: [90, 0, 0] });
    }).done();
  }),
];
