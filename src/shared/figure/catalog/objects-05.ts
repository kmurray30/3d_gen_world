/** Catalog chunk objects-05: the words in assign/objects-05.tsv. */
import { e, type CatalogEntry } from './types';
import { A, around, m, withAct, withSockets, type M, type PartOpts } from '../dsl';
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

/** A hand standing on its wrist, palm facing you, thumb toward s * -x: the palm is named `n` (pivot at the wrist),
 *  fingers `${n}f1`..`${n}f4` (index to little, pivots at the knuckles, curl with rot x) and the thumb `${n}t`. */
function hand2(b: M, x: number, s: 1 | -1, skin: string, n: string, z = 0): M {
  b.box([0.085, 0.1, 0.032], [x, 0.098, z], { color: skin, round: 0.5, name: n, pivot: [x, 0.03, z] });
  b.cyl([0.055, 0.05, 0.04], [x, 0.025, z], { color: skin, parent: n });
  [0.072, 0.082, 0.076, 0.058].forEach((l, i) => {
    const fx = x + s * (-0.03 + i * 0.02), f = `${n}f${i + 1}`;
    b.capsule([0.019, l, 0.02], [fx, 0.142 + l / 2, z], { color: skin, rot: [0, 0, s * (i - 1.5) * -3], name: f, parent: n, pivot: [fx, 0.145, z] });
    b.ball([0.013, 0.015, 0.004], [fx, 0.135 + l, z + 0.009], { color: '#f4d8cc', parent: f, noInk: true });
  });
  return b.rod([x - s * 0.036, 0.075, z + 0.01], [x - s * 0.074, 0.128, z + 0.02], 0.023, skin, { name: `${n}t`, parent: n, pivot: [x - s * 0.036, 0.075, z + 0.01] });
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


interface Shop {
  w: number;
  d: number;
  floors?: number;
  wall: string;
  trim?: string;
  base?: string;
  sign: string;
  signBg?: string;
  glass?: string;
  door?: string;
  /** awning colour (and a second colour for stripes) */
  awning?: string;
  awning2?: string;
  roof?: 'flat' | 'gable' | 'side gable';
  roofColor?: string;
  /** windows per upper floor */
  cols?: number;
  /** no shop windows beside the door (offices, houses) */
  plain?: boolean;
}
/**
 * A real-size shop or public building (crisp edges): plinth, walls, a cornice or roof, double doors that open
 * outward (doorL / doorR), shop windows with frames either side, a sign band, an optional striped awning and rows of
 * framed windows with sills on the upper floors. Returns the builder and the wall height.
 */
function shop(key: string, o: Shop): { b: M; H: number; z: number } {
  const { w, d } = o;
  const fl = o.floors ?? 1, H = 3.6 + (fl - 1) * 3.1;
  const trim = o.trim ?? 'white', glass = o.glass ?? '#8fb8cc', z = d / 2;
  const b = m(key, { edge: 'sharp' });
  b.box([w, H, d], [0, H / 2, 0], { color: o.wall, round: 0.02, name: 'walls' });
  b.box([w + 0.12, 0.3, d + 0.12], [0, 0.15, 0], { color: o.base ?? '#7d7873', round: 0.05 });
  const roof = o.roof ?? 'flat';
  if (roof === 'flat') {
    b.box([w - 0.1, 0.1, d - 0.1], [0, H + 0.05, 0], { color: o.roofColor ?? '#5a5652', round: 0.1 });
    b.pair((s) => {
      b.box([w + 0.3, 0.6, 0.25], [0, H + 0.2, s * (d / 2 + 0.02)], { color: trim, round: 0.1 });
      b.box([0.25, 0.6, d + 0.3], [s * (w / 2 + 0.02), H + 0.2, 0], { color: trim, round: 0.1 });
    });
  } else {
    const side = roof === 'side gable';
    const rh = Math.min(3, (side ? d : w) * 0.38);
    b.wedge(side ? [d + 0.6, rh, w + 0.5] : [w + 0.6, rh, d + 0.5], [0, H + rh / 2, 0], { color: o.roofColor ?? 'darkred', rot: side ? [0, 90, 0] : undefined });
    b.box([w + 0.2, 0.2, d + 0.2], [0, H, 0], { color: trim, round: 0.1 });
  }
  // double doors in a frame
  b.box([1.9, 2.5, 0.1], [0, 1.25, z + 0.02], { color: trim, round: 0.1 });
  b.pair((s) => {
    const name = s > 0 ? 'doorL' : 'doorR';
    b.box([0.8, 2.25, 0.06], [s * 0.41, 1.15, z + 0.09], { color: o.door ?? glass, round: 0.1, name, pivot: [s * 0.81, 1.15, z + 0.09], mover: { kind: 'swing', axis: 'y', amount: s * 95 } });
    b.box([0.84, 0.1, 0.07], [s * 0.41, 0.06, z + 0.095], { color: trim, parent: name });
    b.box([0.04, 0.5, 0.05], [s * 0.1, 1.1, z + 0.14], { color: 'silver', parent: name });
  });
  if (!o.plain) {
    const ww = w / 2 - 1.5;
    if (ww > 0.6)
      b.pair((s) => {
        const cx = s * (1.15 + ww / 2);
        b.box([ww + 0.2, 2.0, 0.1], [cx, 1.4, z + 0.02], { color: trim, round: 0.1 });
        b.box([ww, 1.8, 0.06], [cx, 1.45, z + 0.06], { color: glass, round: 0.05 });
        b.box([ww + 0.3, 0.1, 0.25], [cx, 0.45, z + 0.12], { color: trim });
        if (ww > 1.6) b.box([0.07, 1.8, 0.08], [cx, 1.45, z + 0.09], { color: trim });
      });
  }
  b.label(o.sign, [Math.min(w - 0.6, 7), 0.6], [0, 2.95, z + 0.06], { color: o.signBg ?? 'white', depth: 0.08 });
  if (o.awning) {
    const aw = w - 0.4, n = Math.max(4, Math.round(aw / 0.6));
    for (let i = 0; i < n; i++)
      b.box([aw / n + 0.005, 0.05, 1.1], [-aw / 2 + (aw / n) * (i + 0.5), 2.45, z + 0.55], { color: i % 2 && o.awning2 ? o.awning2 : o.awning, rot: [22, 0, 0], round: 0.1 });
  }
  const cols = o.cols ?? Math.max(2, Math.floor(w / 2.2));
  for (let f = 1; f < fl; f++)
    for (let i = 0; i < cols; i++) {
      const x = -w / 2 + (w / cols) * (i + 0.5), y = 3.6 + (f - 1) * 3.1 + 1.5;
      b.box([1.15, 1.55, 0.08], [x, y, z + 0.02], { color: trim, round: 0.1 });
      b.box([0.95, 1.35, 0.06], [x, y, z + 0.05], { color: glass, round: 0.05 });
      b.box([1.3, 0.08, 0.2], [x, y - 0.82, z + 0.1], { color: trim });
    }
  return { b, H, z };
}

/* ----- entries ----- */

export const ENTRIES: CatalogEntry[] = [
  // A treadle-style grindstone: a sandstone wheel dipping in a water trough, turned by a crank on its axle.
  e('grindstone', 'workshop', 'sharpening', () => {
    const b = m('grindstone', { edge: 'sharp' });
    b.box([0.34, 0.16, 0.72], [0, 0.5, 0], { color: 'darkwood', round: 0.1 });
    b.box([0.28, 0.02, 0.64], [0, 0.575, 0], { color: 'water', noInk: true });
    b.pair((s) => {
      b.rod([s * 0.14, 0.46, 0.3], [s * 0.24, 0.02, 0.42], 0.05, 'wood');
      b.rod([s * 0.14, 0.46, -0.3], [s * 0.24, 0.02, -0.42], 0.05, 'wood');
      b.rod([s * 0.21, 0.2, 0.37], [s * 0.21, 0.2, -0.37], 0.035, 'wood');
      b.box([0.06, 0.24, 0.09], [s * 0.15, 0.7, 0], { color: 'wood' });
      b.box([0.08, 0.05, 0.11], [s * 0.15, 0.82, 0], { color: 'iron', round: 0.3 });
    });
    b.cyl([0.64, 0.1, 0.64], [0, 0.84, 0], { color: '#b9ad97', rot: [0, 0, 90], name: 'stone', edge: 'soft', mover: { kind: 'spin', axis: 'x', amount: 300 } });
    b.cyl([0.2, 0.104, 0.2], [0, 0.84, 0], { color: '#9a8f7c', rot: [0, 0, 90], parent: 'stone', noInk: true });
    b.stick([-0.21, 0.84, 0], [0.26, 0.84, 0], 0.035, 'iron', { parent: 'stone' });
    b.box([0.03, 0.2, 0.045], [0.265, 0.75, 0], { color: 'iron', parent: 'stone' });
    b.stick([0.265, 0.66, 0], [0.4, 0.66, 0], 0.04, 'wood', { parent: 'stone' });
    b.box([0.3, 0.03, 0.14], [0, 0.8, 0.38], { color: 'wood', rot: [25, 0, 0] });
    b.pair((s) => b.rod([s * 0.13, 0.78, 0.38], [s * 0.15, 0.56, 0.33], 0.025, 'iron'));
    return b
      .act({
        click: [
          [A.operate('stone', 'on'), A.par(A.effect('sparkle', { dur: 2.5 }), A.say('Shhhk... shhhk...', 2.5)), A.operate('stone', 'off')],
          [A.operate('stone', 'on'), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Splish!', 1.5)), A.wait(0.5), A.operate('stone', 'off')],
        ],
      })
      .done();
  }),
  // A foam tray of minced beef under film with a price sticker; a meatball gets rolled from it.
  e('ground beef', 'food', 'meat', () => {
    const b = m('ground beef');
    b.box([0.25, 0.024, 0.18], [0, 0.012, 0], { color: 'white', round: 0.45, edge: 'sharp' });
    b.ball([0.205, 0.058, 0.145], [0, 0.04, 0], { color: '#c64c56', name: 'mince' });
    for (let i = 0; i < 16; i++) {
      const u = ((i * 37) % 16) / 16 - 0.5, v = ((i * 11) % 8) / 8 - 0.45;
      const x = u * 0.17, z = v * 0.12, y = 0.04 + 0.027 * Math.sqrt(Math.max(0, 1 - (x / 0.1) ** 2 - (z / 0.072) ** 2));
      b.capsule([0.009, 0.026, 0.009], [x, y + 0.002, z], { color: i % 3 ? '#d8646e' : '#f0b2b4', rot: [90, i * 47, 0], noInk: true, parent: 'mince' });
    }
    b.label('BEEF', [0.07, 0.04], [0.055, 0.06, 0.055], { color: 'yellow', rot: [-55, 0, 0], depth: 0.004 });
    return b
      .act({ click: [A.par(A.anim('wobble'), A.spawn('mb', 'meatball', { rel: 'front', of: 'self', dist: 'close' })), A.say('Squish!', 1.2), A.anim('hop', 1, 'mb'), A.wait(1.2), A.remove('mb', 'pop')] })
      .done();
  }),
  // Minced meat in a mixing bowl with a wooden spoon that stirs round the bowl.
  e('ground meat', 'food', 'meat', () => {
    const b = m('ground meat');
    b.cyl([0.12, 0.014, 0.12], [0, 0.007, 0], { color: '#d6d2ca', edge: 'sharp' });
    b.dome([0.28, 0.11, 0.28], [0, 0.068, 0], { color: '#ece8e0', rot: [180, 0, 0] });
    b.torus([0.29, 0.29, 0.014], [0, 0.122, 0], { color: '#f6f3ee', rot: [90, 0, 0], tube: 0.1 });
    b.ball([0.25, 0.05, 0.25], [0, 0.125, 0], { color: '#b8443e' });
    around(9, 0.07).forEach(([x, z], i) => b.ball(0.034 - (i % 3) * 0.005, [x, 0.142 + (i % 2) * 0.006, z], { color: i % 2 ? '#c95a50' : '#a83a36', noInk: true }));
    b.ball(0.04, [0, 0.15, 0], { color: '#c95a50', noInk: true });
    b.rod([0.05, 0.14, 0.01], [0.15, 0.36, -0.06], 0.016, 'lightwood', { name: 'spoon', pivot: [0, 0.14, 0], edge: 'sharp' });
    b.ball([0.045, 0.014, 0.06], [0.045, 0.142, 0.012], { color: 'lightwood', parent: 'spoon', rot: [0, 30, 0] });
    return b
      .act({ click: [A.pose('spoon', { spin: [0, 300, 0] }), A.say('Squelch squelch...', 2), A.wait(2.4), A.pose('spoon', { spin: [0, 0, 0] }), A.pose('spoon', { rot: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // Guacamole in a three-legged stone molcajete with chips; the front chip dips, then gets taken.
  e('guacamole', 'food', 'dips', () => {
    const b = m('guacamole');
    b.cyl([0.2, 0.085, 0.2], [0, 0.07, 0], { color: '#4a4744', taper: 1.22, name: 'bowl' });
    b.torus([0.245, 0.245, 0.02], [0, 0.112, 0], { color: '#55524e', rot: [90, 0, 0], tube: 0.12 });
    around(3, 0.06, 0.5).forEach(([x, z]) => b.cyl([0.04, 0.03, 0.04], [x, 0.015, z], { color: '#4a4744', taper: 1.2 }));
    b.dome([0.22, 0.06, 0.22], [0, 0.14, 0], { color: '#86b84a', name: 'guac' });
    around(9, 0.055, 0.3).forEach(([x, z], i) => b.box([0.012, 0.01, 0.012], [x, 0.163 - Math.hypot(x, z) * 0.25, z], { color: i % 3 === 0 ? 'white' : i % 3 === 1 ? 'tomato' : '#5a8a2a', noInk: true, rot: [i * 20, i * 33, 0], round: 0.3 }));
    b.ball([0.035, 0.008, 0.025], [-0.01, 0.172, 0.01], { color: '#3d7a2a', noInk: true });
    b.wedge([0.06, 0.03, 0.012], [0.09, 0.13, 0.06], { color: '#a8d05a', rot: [0, 40, 0], edge: 'sharp' });
    b.wedge([0.062, 0.075, 0.005], [-0.05, 0.19, -0.04], { color: '#e8c060', rot: [10, 20, 190], edge: 'sharp' });
    b.wedge([0.062, 0.075, 0.005], [0.055, 0.19, -0.035], { color: '#e3b450', rot: [-10, -25, 172], edge: 'sharp' });
    b.wedge([0.062, 0.075, 0.005], [0.0, 0.195, 0.05], { color: '#ecc868', rot: [-18, 0, 180], name: 'chip', parent: 'guac', piece: true, edge: 'sharp' });
    return b
      .act({
        click: [
          [A.pose('chip', { move: [0, -0.03, 0], dur: 0.3 }), A.pose('chip', { move: [0, 0, 0], dur: 0.3 }), A.say('Crunch!', 1.2)],
          [A.detach('chip', 'chip'), A.say('Scoop!', 1.2)],
          [A.reattach('chip')],
        ],
      })
      .done();
  }),
  // A 4 m guillotine on a scaffold: tall grooved uprights, crossbeam, a slanted blade under its weight that drops
  // the length of the grooves, the lunette and the plank behind.
  e('guillotine', 'armory', 'dungeon', () => {
    const b = m('guillotine', { edge: 'sharp' });
    b.box([2.4, 0.6, 2.6], [0, 0.3, 0], { color: 'darkwood', round: 0.05 });
    b.each(6, (i) => b.box([2.42, 0.02, 0.02], [0, 0.6, -1.1 + i * 0.44], { color: '#3a2a20', noInk: true }));
    b.each(3, (i) => b.box([0.9, 0.2, 0.32], [1.4, 0.1 + i * 0.2, 0.9 - i * 0.3], { color: 'wood' }));
    b.pair((s) => {
      b.box([0.16, 3.7, 0.18], [s * 0.38, 2.45, 0], { color: 'wood' });
      b.box([0.03, 3.3, 0.06], [s * 0.3, 2.5, 0], { color: '#3a2a20' });
      b.rod([s * 0.38, 1.0, 0.02], [s * 0.85, 0.62, 0.02], 0.1, 'wood');
      b.rod([s * 0.38, 1.0, 0.02], [s * 0.38, 0.62, 0.6], 0.1, 'wood');
    });
    b.box([1.1, 0.24, 0.3], [0, 4.4, 0], { color: 'wood' });
    b.cyl([0.12, 0.08, 0.12], [0, 4.1, 0.1], { color: 'iron', rot: [90, 0, 0] });
    b.box([0.58, 0.28, 0.12], [0, 3.85, 0], { color: 'iron', name: 'blade', mover: { kind: 'slide', axis: 'y', amount: -2.05 } });
    b.wedge([0.56, 0.3, 0.025], [0, 3.56, 0], { color: 'silver', apex: -0.5, rot: [0, 0, 180], parent: 'blade' });
    b.stick([0, 3.99, 0.04], [0, 4.1, 0.04], 0.02, 'tan', { parent: 'blade' });
    b.stick([0.06, 4.1, 0.12], [0.44, 1.7, 0.12], 0.02, 'tan');
    b.box([0.6, 0.24, 0.1], [0, 1.5, 0.02], { color: 'wood' });
    b.box([0.6, 0.24, 0.1], [0, 1.26, 0.02], { color: 'wood' });
    b.cyl([0.15, 0.12, 0.15], [0, 1.38, 0.02], { color: '#1e1612', rot: [90, 0, 0] });
    b.box([0.45, 0.1, 1.6], [0, 1.12, -0.9], { color: 'wood' });
    b.pair((s) => b.box([0.08, 0.5, 0.08], [s * 0.16, 0.85, -1.5], { color: 'wood' }));
    return b
      .act({
        click: [
          [A.operate('blade', 'down'), A.par(A.effect('dust', { dur: 1 }), A.anim('shake'), A.say('THUNK!', 1.5))],
          [A.operate('blade', 'up'), A.say('Creak...', 1.5)],
        ],
      })
      .done();
  }),
  // A hard guitar case standing on its end (moulded, soft), the lid hinged along its left edge with latches and a
  // carry handle on the other; open it and the guitar stands in its plush lining.
  e('guitar case', 'music', 'music cases', () => {
    const prof: Array<[number, number, number, number]> = [[0, 0.72, 0.9, 0], [0.1, 0.97, 1, 0], [0.24, 1, 1, 0], [0.38, 0.78, 1, 0], [0.48, 0.84, 1, 0], [0.6, 0.8, 1, 0], [0.68, 0.38, 0.8, 0], [0.86, 0.33, 0.75, 0], [0.9, 0.44, 0.75, 0], [1, 0.4, 0.7, 0]];
    const b = m('guitar case');
    b.loft([0.42, 0.17, 1.08], [0, 0.54, 0], prof, { color: '#1e1e22', boxy: 0.55, cut: 'top', rot: [-90, 0, 0], name: 'base' });
    b.ball([0.34, 0.33, 0.04], [0, 0.25, 0.018], { color: 'wood' });
    b.ball([0.27, 0.26, 0.04], [0, 0.52, 0.018], { color: 'wood' });
    b.cyl([0.08, 0.01, 0.08], [0, 0.42, 0.036], { color: '#2a1d14', rot: [90, 0, 0] });
    b.box([0.1, 0.03, 0.01], [0, 0.22, 0.036], { color: 'darkwood' });
    b.box([0.05, 0.42, 0.025], [0, 0.84, 0.018], { color: 'darkwood' });
    b.box([0.08, 0.11, 0.025], [0, 1.0, 0.018], { color: 'darkwood' });
    b.loft([0.42, 0.17, 1.08], [0, 0.54, 0], prof, { color: '#2a2a30', boxy: 0.55, cut: 'bottom', rot: [-90, 0, 0], name: 'lid', pivot: [-0.2, 0.54, 0], mover: { kind: 'swing', axis: 'y', amount: -105 } });
    for (const [y, x] of [[0.22, 0.205], [0.54, 0.172], [0.86, 0.072]] as const) b.box([0.025, 0.05, 0.035], [x, y, 0], { color: 'silver', round: 0.3, edge: 'sharp' });
    b.arc([0.15, 0.06, 0.025], [0.205, 0.38, 0], { color: 'black', rot: [0, 0, -90], tube: 0.3 });
    b.box([0.2, 0.05, 0.14], [0, 0.025, 0], { color: '#1e1e22', round: 0.4 });
    return withSockets(
      b.act({ click: [[A.operate('lid', 'open'), A.effect('sparkle', { dur: 1.2 })], [A.operate('lid', 'close'), A.say('Click!', 1)]] }).done(),
      [{ name: 'inside', at: [0, 0.5, 0.03], kind: 'inside', size: 0.9 }],
    );
  }),
  // A woven guitar strap laid out flat (a strap is 1.2 m long but only a few mm thick, hence the height warning):
  // leather end tabs with their button holes, and a sliding length adjuster.
  e('guitar strap', 'music', 'music accessories', () => {
    const b = m('guitar strap');
    const pts: V[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push([-0.5 + t * 1.0, 0.004, Math.sin(t * Math.PI * 1.5) * 0.14]);
    }
    for (let i = 0; i < 12; i++) {
      const [x0, , z0] = pts[i], [x1, , z1] = pts[i + 1];
      const ang = (-Math.atan2(z1 - z0, x1 - x0) * 180) / Math.PI;
      b.box([Math.hypot(x1 - x0, z1 - z0) + 0.006, 0.006, 0.058], [(x0 + x1) / 2, 0.004, (z0 + z1) / 2], { color: '#b23a2e', rot: [0, ang, 0], round: 0.2 });
      b.box([Math.hypot(x1 - x0, z1 - z0) * 0.5, 0.007, 0.03], [(x0 + x1) / 2, 0.0045, (z0 + z1) / 2], { color: i % 2 ? '#f0c040' : '#1e1e1e', rot: [0, ang + 45 * (i % 2 ? 1 : -1), 0], round: 0.2, noInk: true });
    }
    for (const [i, s] of [[0, -1], [12, 1]] as const) {
      const [x, , z] = pts[i];
      b.box([0.13, 0.008, 0.066], [x + s * 0.05, 0.005, z], { color: 'leather', round: 0.4, edge: 'sharp' });
      b.cyl([0.014, 0.01, 0.014], [x + s * 0.08, 0.006, z], { color: '#2a1d14', noInk: true });
    }
    b.box([0.04, 0.012, 0.072], [0.25, 0.008, pts[9][2]], { color: 'silver', round: 0.3, edge: 'sharp', name: 'buckle', mover: { kind: 'slide', axis: 'x', amount: 0.12 } });
    return b.act({ click: [[A.operate('buckle', 'out'), A.say('Click!', 1)], [A.operate('buckle', 'in'), A.say('Click!', 1)]] }).done();
  }),
  // A pack of stick gum, foil-wrapped sticks showing at the top; one slides out to offer.
  e('gum', 'food', 'candy', () =>
    m('gum', { edge: 'sharp' })
      .box([0.078, 0.07, 0.022], [0, 0.035, 0], { color: '#2e9e5a', round: 0.12 })
      .box([0.079, 0.016, 0.023], [0, 0.055, 0], { color: 'white', round: 0.1, noInk: true })
      .label('MINT', [0.05, 0.014], [0, 0.055, 0.012], { color: 'white', depth: 0.002 })
      .box([0.012, 0.02, 0.018], [-0.03, 0.078, 0], { color: 'silver', round: 0.2 })
      .box([0.012, 0.02, 0.018], [-0.015, 0.078, 0], { color: 'silver', round: 0.2 })
      .box([0.012, 0.02, 0.018], [0.015, 0.078, 0], { color: 'silver', round: 0.2 })
      .box([0.012, 0.02, 0.018], [0.03, 0.078, 0], { color: 'silver', round: 0.2 })
      .box([0.012, 0.072, 0.018], [0, 0.058, 0], { color: '#f2b8c8', round: 0.2, name: 'stick', mover: { kind: 'slide', axis: 'y', amount: 0.04 } })
      .box([0.0125, 0.03, 0.0185], [0, 0.08, 0], { color: 'silver', round: 0.2, parent: 'stick' })
      .act({ click: [[A.operate('stick', 'out'), A.say('Pop!', 1)], [A.operate('stick', 'in')]] })
      .done(),
  ),
  // A few gumballs, real 2.5 cm size.
  e('gumball', 'food', 'candy', () =>
    m('gumball')
      .ball(0.026, [-0.014, 0.013, 0.004], { color: 'red' })
      .ball(0.026, [0.014, 0.013, 0.006], { color: '#3a7bd5' })
      .ball(0.026, [0, 0.013, -0.02], { color: '#4caf50' })
      .ball(0.026, [0.001, 0.035, -0.006], { color: '#f6d24a' })
      .ball(0.006, [-0.019, 0.019, 0.015], { color: 'white', noInk: true })
      .ball(0.006, [0.009, 0.019, 0.018], { color: 'white', noInk: true })
      .act({ click: [A.anim('bounce', 2), A.say('Boing!', 1)] })
      .done(),
  ),
  // A classic gumball machine on a cast stand: a glass globe of gumballs, a red head with a coin slot, a crank
  // that turns, and a chute flap a gumball rolls out of.
  e('gumball machine', 'toys', 'arcade', () => {
    const b = m('gumball machine', { edge: 'sharp' });
    b.cyl([0.42, 0.05, 0.42], [0, 0.025, 0], { color: '#c62828', round: 0.3 });
    b.cyl([0.24, 0.1, 0.24], [0, 0.1, 0], { color: '#c62828', taper: 0.5 });
    b.cyl([0.07, 0.6, 0.07], [0, 0.45, 0], { color: 'silver', edge: 'soft' });
    b.cyl([0.2, 0.06, 0.2], [0, 0.77, 0], { color: '#c62828', taper: 1.6 });
    b.box([0.34, 0.27, 0.34], [0, 0.92, 0], { color: '#d32f2f', round: 0.25, name: 'head' });
    b.box([0.15, 0.16, 0.03], [0, 0.93, 0.175], { color: 'silver', round: 0.2 });
    b.box([0.012, 0.035, 0.01], [0, 0.98, 0.192], { color: '#1e1e1e' });
    b.cyl([0.07, 0.03, 0.07], [0, 0.91, 0.2], { color: 'silver', rot: [90, 0, 0], name: 'crank', pivot: [0, 0.91, 0.2] });
    b.box([0.11, 0.022, 0.025], [0, 0.91, 0.222], { color: 'silver', parent: 'crank' });
    b.box([0.09, 0.06, 0.07], [0, 0.82, 0.19], { color: '#9e1e1e', round: 0.2 });
    b.box([0.07, 0.05, 0.012], [0, 0.82, 0.228], { color: 'silver', name: 'flap', pivot: [0, 0.845, 0.228], mover: { kind: 'swing', axis: 'x', amount: -70 } });
    b.cyl([0.3, 0.04, 0.3], [0, 1.07, 0], { color: 'silver' });
    b.ball(0.44, [0, 1.3, 0], { color: '#dff0f6', name: 'globe', edge: 'soft' });
    const cols = ['red', '#f6d24a', '#3a7bd5', '#4caf50', 'orange', 'pink', 'white', 'purple'];
    let k = 0;
    for (const lat of [-50, -25, 0, 22]) for (let j = 0; j < 7; j++) {
      const lon = j * (360 / 7) + lat * 2;
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      b.ball(0.065, [0.19 * Math.cos(la) * Math.sin(lo), 1.3 + 0.19 * Math.sin(la), 0.19 * Math.cos(la) * Math.cos(lo)], { color: cols[k++ % cols.length], noInk: true, parent: 'globe' });
    }
    b.cyl([0.17, 0.05, 0.17], [0, 1.52, 0], { color: '#d32f2f', name: 'lid', parent: 'globe', piece: true });
    b.ball(0.06, [0, 1.57, 0], { color: 'silver', parent: 'lid' });
    return withSockets(
      b
        .act({
          click: [
            A.pose('crank', { rot: [0, 0, 360], dur: 0.8 }),
            A.pose('crank', { rot: [0, 0, 0], dur: 0 }),
            A.par(A.operate('flap', 'open'), A.spawn('g', 'gumball', { rel: 'front', of: 'self', dist: 'close' })),
            A.say('Clunk!', 1.2),
            A.wait(1.5),
            A.par(A.operate('flap', 'close'), A.remove('g', 'pop')),
          ],
        })
        .done(),
      [{ name: 'slot', at: [0, 0.98, 0.19], kind: 'slot', size: 0.03 }],
    );
  }),
  // Three sugar-frosted gumdrops.
  e('gumdrop', 'food', 'candy', () => {
    const b = m('gumdrop');
    ([[-0.022, 0.006, 'red'], [0.022, 0.004, '#3faa4a'], [0, -0.03, 'orange']] as const).forEach(([x, z, c]) => {
      b.cyl([0.034, 0.024, 0.034], [x, 0.012, z], { color: c, taper: 0.7 });
      b.ball([0.025, 0.02, 0.025], [x, 0.024, z], { color: c });
      around(5, 0.01).forEach(([dx, dz]) => b.ball(0.003, [x + dx, 0.03, z + dz], { color: 'white', noInk: true }));
    });
    return b.act({ click: [A.anim('wobble', 2), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A real 2 cm gummy bear: belly, arms, legs, round ears and a snout.
  e('gummi bear', 'food', 'candy', () => {
    const c = { color: '#e8343a' };
    const b = m('gummi bear').ball([0.016, 0.017, 0.012], [0, 0.009, 0], c).ball([0.014, 0.013, 0.011], [0, 0.021, 0], c);
    b.pair((s) => {
      b.ball(0.006, [s * 0.005, 0.028, 0], c);
      b.ball([0.007, 0.006, 0.007], [s * 0.0045, 0.003, 0.003], c);
      b.ball([0.005, 0.007, 0.005], [s * 0.0085, 0.013, 0.002], c);
    });
    b.ball([0.006, 0.005, 0.005], [0, 0.019, 0.005], c);
    return b.act({ click: [A.anim('hop', 2), A.anim('wobble')] }).done();
  }),
  // A semi-automatic pistol standing on its grip, barrel to +x: the slide kicks back when it fires.
  e('gun', 'armory', 'guns', () =>
    m('gun', { edge: 'sharp' })
      .box([0.17, 0.03, 0.026], [0.03, 0.105, 0], { color: '#3a3d42', round: 0.2, name: 'frame' })
      .box([0.035, 0.115, 0.03], [-0.035, 0.052, 0], { color: '#24262a', rot: [0, 0, -12], round: 0.3 })
      .box([0.036, 0.09, 0.032], [-0.034, 0.057, 0], { color: '#4a3a2e', rot: [0, 0, -12], round: 0.4, noInk: true })
      .box([0.038, 0.01, 0.032], [-0.045, 0.004, 0], { color: '#1a1a1a', rot: [0, 0, -12] })
      .arc([0.05, 0.04, 0.008], [0.016, 0.085, 0], { color: '#3a3d42', rot: [0, 0, 180], arc: 200, tube: 0.18 })
      .box([0.006, 0.022, 0.006], [0.012, 0.085, 0], { color: 'black', rot: [0, 0, 15] })
      .box([0.185, 0.032, 0.028], [0.035, 0.134, 0], { color: '#2b2d31', round: 0.15, name: 'slide' })
      .box([0.003, 0.024, 0.029], [-0.04, 0.134, 0], { color: '#1a1a1a', parent: 'slide' })
      .box([0.003, 0.024, 0.029], [-0.032, 0.134, 0], { color: '#1a1a1a', parent: 'slide' })
      .box([0.003, 0.024, 0.029], [-0.024, 0.134, 0], { color: '#1a1a1a', parent: 'slide' })
      .box([0.008, 0.008, 0.006], [0.118, 0.153, 0], { color: 'black', parent: 'slide' })
      .box([0.012, 0.008, 0.016], [-0.05, 0.153, 0], { color: 'black', parent: 'slide' })
      .cyl([0.014, 0.004, 0.014], [0.128, 0.134, 0], { color: '#111', rot: [0, 0, 90], parent: 'slide', noInk: true })
      .act({
        click: [
          A.par(A.pose('slide', { move: [-0.03, 0, 0], dur: 0.05 }), A.effect('smoke', { dur: 1.2 }), A.say('Bang!', 1.2), A.anim('shake')),
          A.pose('slide', { move: [0, 0, 0], dur: 0.1 }),
        ],
      })
      .done(),
  ),
  // An indoor shooting range: three lanes with booths and a counter, target carriers on overhead rails that run
  // the targets in and out, a backstop wall with lane numbers, a sign header and a red "hot range" lamp.
  e('gun range', 'places', 'sports venues', () => {
    const b = m('gun range', { edge: 'sharp' });
    b.box([4.6, 0.12, 7], [0, 0.06, 0], { color: '#9a9690', round: 0.02 });
    for (const x of [-0.69, 0.69]) b.box([0.05, 0.005, 5], [x, 0.122, -0.6], { color: '#f6d24a', noInk: true });
    b.box([4.6, 3.2, 0.4], [0, 1.6, -3.3], { color: '#5a4a3a', round: 0.02 });
    b.box([4.3, 2.2, 0.2], [0, 1.3, -3.05], { color: '#3a3330', round: 0.05 });
    b.box([0.2, 3.2, 7], [-2.2, 1.6, 0], { color: '#c9c2b4', round: 0.02 });
    b.box([0.2, 3.2, 0.2], [2.2, 1.6, 3.0], { color: '#8a8580' });
    b.box([0.2, 3.2, 0.2], [2.2, 1.6, -3.3], { color: '#8a8580' });
    b.box([4.6, 0.6, 0.2], [0, 3.0, 3.1], { color: '#2f3d52' });
    b.label('SHOOTING RANGE', [3.2, 0.42], [0, 3.0, 3.22], { color: '#f6d24a', depth: 0.04 });
    b.ball([0.25, 0.25, 0.12], [1.7, 2.55, 3.2], { color: '#ff3b30', glow: true, name: 'lamp', mover: { kind: 'light' } });
    for (const x of [-2.05, -0.69, 0.69, 2.05]) b.box([0.06, 2.0, 1.1], [x, 1.1, 2.4], { color: '#5c6670' });
    b.box([4.2, 0.08, 0.55], [0, 1.0, 2.1], { color: 'lightwood' });
    b.box([4.2, 0.92, 0.06], [0, 0.52, 2.36], { color: '#5c6670' });
    [-1.38, 0, 1.38].forEach((x, i) => {
      b.box([0.08, 0.08, 5.4], [x, 2.75, -0.3], { color: 'steel' });
      const n = `target${i + 1}`;
      b.box([0.14, 0.22, 0.12], [x, 2.6, -2.7], { color: '#2b2d31', name: n, mover: { kind: 'slide', axis: 'z', amount: 4.0 } });
      b.stick([x, 2.5, -2.7], [x, 2.25, -2.7], 0.02, 'steel', { parent: n });
      b.box([0.7, 0.95, 0.02], [x, 1.75, -2.7], { color: 'white', parent: n });
      b.label(`${i + 1}`, [0.36, 0.36], [x, 2.55, -2.94], { color: '#f6d24a', depth: 0.02 });
      for (const [d, c] of [[0.58, '#1e1e1e'], [0.42, 'white'], [0.26, '#1e1e1e'], [0.1, 'red']] as const) b.cyl([d, 0.006, d], [x, 1.8, -2.685], { color: c, rot: [90, 0, 0], noInk: true, parent: n });
    });
    return b
      .act({
        click: [
          [A.operate('lamp', 'on'), A.say('Bzzzt!', 1.2), A.wait(1.2), A.par(A.effect('smoke', { dur: 1.2 }), A.say('Bang! Bang!', 1.5)), A.operate('target', 'out'), A.say('Ding!', 1.2)],
          [A.operate('target', 'in'), A.operate('lamp', 'off'), A.say('Bzzzt!', 1.2)],
        ],
      })
      .done();
  }),
  // A coopered powder keg (a loft swelling at the middle), iron hoops, a stencilled label, a wooden bung and a
  // trail of black powder with a fuse.
  e('gunpowder', 'armory', 'ammunition', () => {
    const b = m('gunpowder');
    b.loft([0.42, 0.42, 0.52], [0, 0.26, 0], [[0, 0.8, 0.8, 0], [0.5, 1, 1, 0], [1, 0.8, 0.8, 0]], { color: '#8a5a32', rot: [-90, 0, 0], name: 'keg' });
    b.each(10, (i) => {
      const a = (i / 10) * Math.PI * 2;
      b.box([0.008, 0.5, 0.004], [Math.sin(a) * 0.205, 0.26, Math.cos(a) * 0.205], { color: '#5e3c20', rot: [0, (a * 180) / Math.PI, 0], noInk: true });
    });
    for (const [y, d] of [[0.06, 0.37], [0.15, 0.405], [0.37, 0.405], [0.46, 0.37]] as const) b.torus([d, d, 0.025], [0, y, 0], { color: 'iron', rot: [90, 0, 0], tube: 0.06, edge: 'sharp' });
    b.cyl([0.33, 0.012, 0.33], [0, 0.522, 0], { color: '#6a4426', name: 'lid', parent: 'keg', piece: true });
    b.cyl([0.05, 0.02, 0.05], [0.08, 0.535, 0.04], { color: '#3a2a1e', parent: 'lid' });
    b.label('GUNPOWDER', [0.24, 0.08], [0, 0.27, 0.205], { color: 'cream', depth: 0.004 });
    b.label('XXX', [0.12, 0.05], [0, 0.18, 0.205], { color: 'cream', depth: 0.004 });
    b.dome([0.18, 0.04, 0.14], [0.2, 0.02, 0.2], { color: '#2b2b2b' });
    b.dome([0.07, 0.02, 0.06], [0.33, 0.01, 0.3], { color: '#2b2b2b' });
    b.rod([0.33, 0.01, 0.3], [0.5, 0.01, 0.42], 0.01, '#c9a36a');
    b.ball(0.02, [0.5, 0.012, 0.42], { color: '#ffb84a', glow: true, scale: 0, name: 'spark' });
    return b
      .act({
        click: [
          A.pose('spark', { scale: 1, dur: 0.1 }),
          A.par(A.effect('sparkle', { dur: 1.6 }), A.say('Fsssss...', 1.6), A.pose('spark', { move: [-0.17, 0, -0.12], dur: 1.6 })),
          A.pose('spark', { scale: 0, dur: 0 }),
          A.par(A.effect('explosion', { dur: 1 }), A.anim('hop'), A.say('BOOM!', 1.5)),
          A.par(A.effect('smoke', { dur: 2 }), A.pose('spark', { move: [0, 0, 0], dur: 0 })),
        ],
      })
      .done();
  }),
  // A corner of a house eave at its real height (the gutter itself is 15 cm deep, hence the height warning):
  // shingled roof edge, a gutter on brackets with an end cap, and a downspout to a splash block. Rain runs off.
  e('gutters', 'workshop', 'building materials', () => {
    const b = m('gutters', { edge: 'sharp' });
    b.box([1.8, 2.5, 0.2], [0, 1.25, -0.3], { color: '#e8dcc4', round: 0.02 });
    b.box([0.7, 0.9, 0.06], [-0.35, 1.5, -0.18], { color: 'white', round: 0.1 });
    b.box([0.58, 0.78, 0.06], [-0.35, 1.5, -0.16], { color: '#8fb8cc', round: 0.05 });
    b.box([0.04, 0.78, 0.07], [-0.35, 1.5, -0.15], { color: 'white' });
    b.box([0.8, 0.06, 0.14], [-0.35, 1.03, -0.14], { color: 'white' });
    b.box([2.0, 0.08, 0.9], [0, 2.62, -0.1], { color: '#5a4038', rot: [-18, 0, 0] });
    b.each(5, (i) => b.box([2.02, 0.03, 0.14], [0, 2.56 + i * 0.05, 0.28 - i * 0.16], { color: i % 2 ? '#4a3430' : '#5e443c', rot: [-18, 0, 0], noInk: true }));
    b.box([2.0, 0.2, 0.04], [0, 2.45, 0.34], { color: 'white' });
    b.box([2.0, 0.13, 0.14], [0, 2.43, 0.43], { color: '#c8ccd0', round: 0.35, name: 'gutter' });
    b.box([1.96, 0.02, 0.1], [0, 2.49, 0.43], { color: '#5a6066', noInk: true });
    b.pair((s) => b.box([0.02, 0.15, 0.15], [s * 1.0, 2.43, 0.43], { color: '#b8bcc0' }));
    b.each(3, (i) => b.box([0.03, 0.02, 0.16], [-0.7 + i * 0.7, 2.5, 0.42], { color: '#8a8e92' }));
    b.box([0.09, 0.12, 0.09], [0.82, 2.33, 0.43], { color: '#c8ccd0', round: 0.3 });
    b.box([0.09, 0.3, 0.09], [0.82, 2.12, 0.3], { color: '#c8ccd0', round: 0.3, rot: [40, 0, 0] });
    b.box([0.09, 1.9, 0.09], [0.82, 1.0, -0.15], { color: '#c8ccd0', round: 0.3 });
    b.each(2, (i) => b.box([0.12, 0.03, 0.05], [0.82, 0.6 + i * 1.0, -0.17], { color: '#8a8e92' }));
    b.box([0.09, 0.09, 0.24], [0.82, 0.1, -0.03], { color: '#c8ccd0', round: 0.3 });
    b.box([0.3, 0.05, 0.5], [0.82, 0.025, 0.2], { color: '#a8a39c', round: 0.2 });
    return b.act({ click: [A.par(A.effect('rain', { dur: 3 }), A.say('Drip... drip...', 1.5)), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Gurgle!', 1.5))] }).done();
  }),
  // The smiling mask: white face, rosy cheeks, upturned moustache, thin goatee, arched brows and slit eyes.
  e('guy fawkes mask', 'toys', 'masks', () => {
    const b = m('guy fawkes mask');
    b.ball([0.17, 0.2, 0.07], [0, 0.125, 0], { color: '#f4ead8', name: 'mask' });
    b.ball([0.11, 0.09, 0.06], [0, 0.045, 0.004], { color: '#f4ead8' });
    b.ball([0.025, 0.04, 0.03], [0, 0.115, 0.04], { color: '#f4ead8' });
    b.pair((s) => {
      b.ball([0.04, 0.026, 0.012], [s * 0.048, 0.098, 0.03], { color: '#f2a8a8', noInk: true });
      b.ball([0.034, 0.008, 0.01], [s * 0.035, 0.155, 0.032], { color: '#1e1612', rot: [0, 0, s * 14] });
      b.rod([s * 0.012, 0.18, 0.033], [s * 0.065, 0.172, 0.022], 0.007, '#1e1612');
      b.rod([s * 0.004, 0.083, 0.04], [s * 0.04, 0.077, 0.036], 0.009, '#1e1612');
      b.rod([s * 0.04, 0.077, 0.036], [s * 0.066, 0.1, 0.022], 0.008, '#1e1612');
      b.rod([s * 0.066, 0.1, 0.022], [s * 0.062, 0.115, 0.018], 0.006, '#1e1612');
    });
    b.box([0.04, 0.005, 0.01], [0, 0.064, 0.038], { color: '#a03030', noInk: true });
    b.capsule([0.008, 0.05, 0.008], [0, 0.03, 0.034], { color: '#1e1612' });
    return b.act({ click: [A.anim('spin'), A.say('Ha ha ha!', 1.5)] }).done();
  }),
  // A gym: big glass front, double doors that open, a sign band and a giant dumbbell on the roof that lifts.
  e('gym', 'places', 'sports venues', () => {
    const { b, H } = shop('gym', { w: 10, d: 7, wall: '#3f4a5c', trim: '#e8e8e8', sign: 'FITNESS GYM', signBg: '#f6d24a', glass: '#7fa8c0' });
    b.stick([-1.6, H + 1.6, 0], [1.6, H + 1.6, 0], 0.18, 'steel', { name: 'dumbbell' });
    b.pair((s) => {
      b.cyl([1.2, 0.3, 1.2], [s * 1.25, H + 1.6, 0], { color: '#1e1e1e', rot: [0, 0, 90], parent: 'dumbbell' });
      b.cyl([0.9, 0.2, 0.9], [s * 1.5, H + 1.6, 0], { color: '#2b2d31', rot: [0, 0, 90], parent: 'dumbbell' });
      b.box([0.2, 0.9, 0.2], [s * 1.0, H + 1.0, 0], { color: '#8a8e92' });
    });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Clank clank!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.pose('dumbbell', { move: [0, 0.8, 0], dur: 0.4 }), A.pose('dumbbell', { move: [0, 0, 0], dur: 0.4 }), A.pose('dumbbell', { move: [0, 0.8, 0], dur: 0.4 }), A.pose('dumbbell', { move: [0, 0, 0], dur: 0.4 }), A.say('Hup! Hup!', 1.5)],
        ],
      })
      .done();
  }),
  // A gyro in its paper wrap: warm pita round meat strips, tomato, onion, lettuce and tzatziki; the paper folds down.
  e('gyro', 'food', 'sandwiches', () => {
    const b = m('gyro');
    b.cyl([0.065, 0.09, 0.06], [0, 0.045, 0], { color: 'paper', taper: 1.45, name: 'wrap' });
    b.box([0.04, 0.03, 0.002], [0, 0.06, 0.04], { color: '#2f6fb0', rot: [-12, 0, 0], noInk: true, parent: 'wrap' });
    b.cyl([0.088, 0.06, 0.07], [0, 0.11, 0], { color: '#e6c48a', taper: 1.12 });
    b.torus([0.09, 0.07, 0.016], [0, 0.14, 0], { color: '#d4a86a', rot: [90, 0, 0], tube: 0.16 });
    b.each(5, (i) => b.capsule([0.012, 0.04, 0.012], [-0.028 + i * 0.014, 0.148, -0.008 + (i % 2) * 0.012], { color: '#8a4a28', rot: [70, 0, 15 - i * 8] }));
    b.ball([0.035, 0.016, 0.025], [0.012, 0.158, 0.018], { color: 'white' });
    b.ball(0.016, [-0.024, 0.156, 0.02], { color: 'tomato' });
    b.ball([0.03, 0.014, 0.025], [0.02, 0.157, -0.018], { color: 'lettuce' });
    b.torus([0.018, 0.018, 0.004], [-0.02, 0.163, -0.012], { color: '#b48ac0', rot: [70, 0, 0] });
    return b
      .act({ click: [[A.pose('wrap', { move: [0, -0.035, 0], dur: 0.4 }), A.effect('steam', { dur: 2 })], [A.pose('wrap', { move: [0, 0, 0], dur: 0.4 })]] })
      .done();
  }),
  // A toy gyroscope on its pedestal: two gimbal rings, the brass rotor disc spinning inside, the frame precessing.
  e('gyroscope', 'toys', 'science toys', () =>
    m('gyroscope', { edge: 'sharp' })
      .cyl([0.05, 0.008, 0.05], [0, 0.004, 0], { color: '#2b2d31' })
      .cyl([0.012, 0.022, 0.012], [0, 0.019, 0], { color: '#2b2d31', taper: 0.4 })
      .torus([0.085, 0.085, 0.006], [0, 0.072, 0], { color: 'silver', tube: 0.08, name: 'frame', pivot: [0, 0.03, 0] })
      .torus([0.085, 0.085, 0.006], [0, 0.072, 0], { color: 'silver', tube: 0.08, rot: [0, 90, 0], parent: 'frame' })
      .stick([0, 0.03, 0], [0, 0.114, 0], 0.005, 'steel', { parent: 'frame' })
      .ball(0.01, [0, 0.116, 0], { color: 'steel', parent: 'frame' })
      .cyl([0.066, 0.012, 0.066], [0, 0.072, 0], { color: 'brass', name: 'disc', parent: 'frame', mover: { kind: 'spin', axis: 'y', amount: 1440 } })
      .box([0.05, 0.013, 0.006], [0, 0.072, 0], { color: '#9a7a2a', parent: 'disc' })
      .act({
        click: [
          [A.operate('disc', 'on'), A.pose('frame', { spin: [0, 40, 0] }), A.say('Whirrr...', 2)],
          [A.operate('disc', 'off'), A.pose('frame', { spin: [0, 0, 0] }), A.pose('frame', { rot: [0, 0, 18], dur: 0.6 }), A.pose('frame', { rot: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done(),
  ),
  // A hacksaw: painted C-frame, pistol grip, a toothed blade and a wing-nut tensioner; it saws back and forth.
  e('hacksaw', 'workshop', 'hand tools', () => {
    const b = m('hacksaw', { edge: 'sharp' });
    b.box([0.36, 0.024, 0.02], [0.02, 0.14, 0], { color: '#1f5fb8', round: 0.3, name: 'saw' });
    b.box([0.02, 0.12, 0.02], [0.19, 0.085, 0], { color: '#1f5fb8', round: 0.3, parent: 'saw' });
    b.box([0.02, 0.1, 0.02], [-0.15, 0.095, 0], { color: '#1f5fb8', round: 0.3, parent: 'saw' });
    b.box([0.35, 0.013, 0.0025], [0.02, 0.035, 0], { color: 'steel', round: 0, parent: 'saw' });
    b.each(16, (i) => b.box([0.006, 0.006, 0.003], [-0.15 + i * 0.022, 0.027, 0], { color: '#8a8e92', rot: [0, 0, 45], round: 0, parent: 'saw', noInk: true }));
    b.box([0.04, 0.11, 0.032], [-0.19, 0.075, 0], { color: '#1e1e1e', rot: [0, 0, -18], round: 0.45, parent: 'saw', edge: 'soft' });
    b.cyl([0.02, 0.012, 0.02], [0.2, 0.03, 0], { color: 'steel', rot: [0, 0, 90], parent: 'saw' });
    b.box([0.03, 0.012, 0.004], [0.212, 0.03, 0], { color: 'steel', parent: 'saw' });
    return b
      .act({
        click: [
          A.par(A.effect('dust', { dur: 1.6 }), A.say('Rasp rasp!', 1.6)),
          A.pose('saw', { move: [0.05, 0, 0], dur: 0.2 }),
          A.pose('saw', { move: [-0.05, 0, 0], dur: 0.2 }),
          A.pose('saw', { move: [0.05, 0, 0], dur: 0.2 }),
          A.pose('saw', { move: [-0.05, 0, 0], dur: 0.2 }),
          A.pose('saw', { move: [0, 0, 0], dur: 0.15 }),
        ],
      })
      .done();
  }),
  // Hailstones on the ground, pea to golf-ball size, frosted white cores in clear ice.
  e('hail', 'nature', 'weather', () => {
    const b = m('hail');
    ([[0, 0.022, 0, 0.044], [-0.05, 0.012, 0.03, 0.024], [0.045, 0.014, 0.025, 0.028], [0.02, 0.01, -0.045, 0.02], [-0.035, 0.009, -0.03, 0.018], [0.07, 0.008, -0.02, 0.016], [-0.075, 0.008, -0.005, 0.015]] as const).forEach(([x, y, z, d], i) => {
      b.ball([d, d * 0.92, d], [x, y, z], { color: '#dceef6' });
      b.ball(d * 0.55, [x, y + d * 0.05, z + d * 0.12], { color: 'white', noInk: true });
      if (i === 0) b.ball(d * 0.45, [x + d * 0.3, y + d * 0.2, z], { color: '#e8f4fa' });
    });
    return b.act({ click: [A.par(A.effect('rain', { dur: 2 }), A.anim('bounce', 2)), A.say('Clack clack!', 1.2)] }).done();
  }),
  // A wig on a foam head on its stand: the wig comes off and goes back.
  e('hair', 'clinic', 'body parts', () => {
    const b = m('hair');
    b.cyl([0.16, 0.02, 0.16], [0, 0.01, 0], { color: '#3a3633', edge: 'sharp' });
    b.cyl([0.03, 0.18, 0.03], [0, 0.11, 0], { color: 'silver', edge: 'sharp' });
    b.cyl([0.09, 0.07, 0.08], [0, 0.23, 0], { color: '#e8dccc', taper: 0.8 });
    b.ball([0.16, 0.21, 0.18], [0, 0.35, 0.01], { color: '#efe4d4', name: 'head' });
    b.ball([0.03, 0.045, 0.03], [0, 0.34, 0.1], { color: '#efe4d4' });
    b.ball([0.19, 0.17, 0.2], [0, 0.4, -0.012], { color: '#7a3b1e', name: 'wig', parent: 'head', piece: true });
    b.box([0.2, 0.3, 0.09], [0, 0.29, -0.07], { color: '#7a3b1e', round: 0.6, parent: 'wig' });
    b.pair((s) => b.rod([s * 0.085, 0.4, 0.03], [s * 0.095, 0.2, 0.03], 0.05, '#7a3b1e', { parent: 'wig' }));
    b.ball([0.15, 0.05, 0.06], [0.01, 0.44, 0.07], { color: '#7a3b1e', rot: [0, 0, -8], parent: 'wig' });
    return b.act({ click: [[A.detach('wig', 'wig')], [A.reattach('wig')]] }).done();
  }),
  // A paddle hair brush standing on its handle: wooden back, black cushion and rows of ball-tipped pins.
  e('hair brush', 'home', 'grooming', () => {
    const b = m('hair brush', { edge: 'sharp' });
    b.capsule([0.032, 0.13, 0.024], [0, 0.065, 0], { color: 'darkwood', name: 'brush', pivot: [0, 0, 0], edge: 'soft' });
    b.ball([0.09, 0.13, 0.03], [0, 0.19, 0], { color: 'wood', parent: 'brush', edge: 'soft' });
    b.ball([0.072, 0.108, 0.016], [0, 0.19, 0.014], { color: '#1e1e1e', parent: 'brush', edge: 'soft' });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      const y = 0.15 + r * 0.02, xx = (c - 1) * 0.02;
      b.stick([xx, y, 0.02], [xx, y, 0.034], 0.003, '#d8d8d8', { parent: 'brush', noInk: true });
      b.ball(0.007, [xx, y, 0.035], { color: 'white', parent: 'brush', noInk: true });
    }
    return b
      .act({ click: [A.pose('brush', { rot: [0, 0, 25], dur: 0.25 }), A.pose('brush', { rot: [0, 0, -25], dur: 0.25 }), A.pose('brush', { rot: [0, 0, 0], dur: 0.2 }), A.say('Swish!', 1)] })
      .done();
  }),
  // A bow barrette lying flat: a spring clasp under a sprung top bar decorated with a polka-dot bow; the bar
  // lifts open and snaps shut.
  e('hair clip', 'wardrobe', 'hair accessories', () => {
    const b = m('hair clip', { edge: 'sharp' });
    b.box([0.08, 0.003, 0.012], [0, 0.0015, 0], { color: 'silver', round: 0.3 });
    b.box([0.012, 0.006, 0.012], [0.036, 0.004, 0], { color: 'silver', round: 0.3 });
    b.box([0.084, 0.004, 0.016], [0, 0.007, 0], { color: 'silver', round: 0.4, name: 'clip', pivot: [-0.04, 0.006, 0], mover: { kind: 'swing', axis: 'z', amount: 22 } });
    b.pair((s) => {
      b.ball([0.032, 0.024, 0.014], [s * 0.018, 0.02, 0], { color: '#f48fb1', rot: [0, 0, s * 18], parent: 'clip', edge: 'soft' });
      b.box([0.012, 0.022, 0.008], [s * 0.008, 0.01, 0.006], { color: '#f48fb1', rot: [-60, 0, s * 25], parent: 'clip', edge: 'soft' });
      b.ball(0.005, [s * 0.022, 0.024, 0.007], { color: 'white', parent: 'clip', noInk: true });
      b.ball(0.004, [s * 0.012, 0.016, 0.007], { color: 'white', parent: 'clip', noInk: true });
    });
    b.ball([0.012, 0.014, 0.013], [0, 0.02, 0.002], { color: '#d81b60', parent: 'clip', edge: 'soft' });
    return b.act({ click: [A.operate('clip', 'open'), A.wait(0.8), A.operate('clip', 'close'), A.say('Click!', 1)] }).done();
  }),
  // Three hair rollers with their pins: velcro rollers ringed with teeth; one rolls away and back.
  e('hair curlers', 'home', 'grooming', () => {
    const b = m('hair curlers');
    ([[0, 0.018, 0.02, '#f48fb1', 'r1'], [0, 0.018, -0.02, '#81d4fa', 'r2'], [0.005, 0.05, 0, '#ce93d8', 'r3']] as const).forEach(([x, y, z, c, n]) => {
      b.cyl([0.036, 0.075, 0.036], [x, y, z], { color: c, rot: [0, 0, 90], name: n });
      for (const dx of [-0.026, -0.009, 0.009, 0.026]) b.torus([0.039, 0.039, 0.005], [x + dx, y, z], { color: 'white', rot: [0, 90, 0], noInk: true, parent: n });
      b.cyl([0.016, 0.078, 0.016], [x, y, z], { color: '#555', rot: [0, 0, 90], noInk: true, parent: n });
    });
    b.box([0.07, 0.004, 0.008], [0.01, 0.002, 0.055], { color: 'silver', rot: [0, 20, 0], edge: 'sharp' });
    return b
      .act({ click: [A.pose('r1', { move: [0, 0, 0.12], rot: [380, 0, 0], dur: 0.8 }), A.wait(0.3), A.pose('r1', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.8 }), A.say('Roll!', 1)] })
      .done();
  }),
  // An aerosol can of hair spray: its cap lifts off, the nozzle presses and a mist puffs out.
  e('hair spray', 'home', 'grooming', () =>
    m('hair spray')
      .cyl([0.065, 0.17, 0.065], [0, 0.085, 0], { color: '#7b3fa0', edge: 'sharp', round: 0.2 })
      .cyl([0.0665, 0.07, 0.0665], [0, 0.09, 0], { color: '#f3c6e8', noInk: true })
      .label('HOLD', [0.04, 0.016], [0, 0.1, 0.034], { color: '#f3c6e8', depth: 0.002 })
      .cyl([0.065, 0.02, 0.065], [0, 0.18, 0], { color: 'silver', taper: 0.62, edge: 'sharp' })
      .cyl([0.016, 0.014, 0.016], [0, 0.196, 0], { color: 'silver' })
      .box([0.02, 0.016, 0.022], [0, 0.208, 0.002], { color: 'white', round: 0.4, name: 'nozzle' })
      .cyl([0.068, 0.06, 0.068], [0, 0.215, 0], { color: '#e1bee7', name: 'cap', taper: 0.95, edge: 'sharp', round: 0.3 })
      .act({
        click: [
          A.pose('cap', { move: [0.08, 0.04, 0], dur: 0.4 }),
          A.pose('cap', { move: [0.08, -0.12, 0.02], dur: 0.3 }),
          A.par(A.pose('nozzle', { move: [0, -0.005, 0], dur: 0.1 }), A.effect('steam', { dur: 1.2 }), A.say('Psssht!', 1.2)),
          A.pose('nozzle', { move: [0, 0, 0], dur: 0.1 }),
          A.wait(0.8),
          A.pose('cap', { move: [0, 0, 0], dur: 0.5 }),
        ],
      })
      .done(),
  ),
  // A soggy cat hairball, tufts sticking out; a kitten comes to see what it coughed up.
  e('hairball', 'pets', 'cat things', () => {
    const b = m('hairball');
    b.ball([0.05, 0.034, 0.04], [0, 0.017, 0], { color: '#7a6a5a' });
    around(7, 0.016).forEach(([x, z], i) => b.ball(0.02, [x * 1.4, 0.016 + (i % 3) * 0.005, z], { color: i % 2 ? '#9a8a78' : '#6f6052' }));
    around(11, 0.02, 0.3).forEach(([x, z], i) => b.rod([x, 0.02, z], [x * 2.3, 0.012 + (i % 3) * 0.01, z * 2.3], 0.0025, i % 2 ? '#6a5a4a' : '#a89480', { noInk: true }));
    b.ball([0.02, 0.003, 0.016], [0.03, 0.001, 0.02], { color: '#b8c4c8', noInk: true });
    return b
      .act({ click: [A.spawn('k', 'kitten', { rel: 'near', of: 'self', dist: 'near' }), A.face('self', 'k'), A.say('Hrrk... ptoo!', 1.5, 'k'), A.anim('hop', 1, 'k'), A.wait(1.2), A.remove('k', 'fade')] })
      .done();
  }),
  // A home hair dye kit: the box with a model's photo and colour swatch, and the applicator bottle that tips
  // and squirts.
  e('hairdye', 'home', 'grooming', () => {
    const b = m('hairdye', { edge: 'sharp' });
    b.box([0.1, 0.16, 0.045], [-0.02, 0.08, 0], { color: 'white', round: 0.08 });
    b.box([0.1, 0.03, 0.046], [-0.02, 0.145, 0], { color: '#7b1f3a', round: 0.08 });
    b.ball([0.068, 0.08, 0.008], [-0.02, 0.075, 0.023], { color: '#a0262e', edge: 'soft' });
    b.ball([0.032, 0.042, 0.008], [-0.02, 0.07, 0.026], { color: 'skin2', edge: 'soft' });
    b.box([0.025, 0.025, 0.004], [0.012, 0.025, 0.024], { color: '#a0262e' });
    b.label('COLOUR', [0.08, 0.018], [-0.02, 0.145, 0.024], { color: '#7b1f3a', depth: 0.002 });
    b.cyl([0.04, 0.09, 0.04], [0.065, 0.045, 0.01], { color: '#f5f5f5', name: 'bottle', pivot: [0.085, 0, 0.01], round: 0.3 });
    b.cyl([0.04, 0.02, 0.04], [0.065, 0.1, 0.01], { color: '#7b1f3a', taper: 0.5, parent: 'bottle' });
    b.cone([0.012, 0.03, 0.012], [0.065, 0.125, 0.01], { color: '#7b1f3a', parent: 'bottle' });
    return b
      .act({ click: [A.pose('bottle', { rot: [0, 0, -100], dur: 0.5 }), A.par(A.effect('sparkle', { dur: 1 }), A.say('Squirt!', 1)), A.pose('bottle', { rot: [0, 0, 0], dur: 0.5 })] })
      .done();
  }),
  // A bun of hair held in a fine hairnet on a display head; the net stretches and snaps back.
  e('hairnet', 'wardrobe', 'hair accessories', () => {
    const Y = 0.2, net = '#e8dcc0';
    const b = m('hairnet').cyl([0.1, 0.02, 0.1], [0, 0.01, 0], { color: '#3a3633', edge: 'sharp' }).cyl([0.03, 0.12, 0.03], [0, 0.08, 0], { color: 'silver', edge: 'sharp' });
    b.ball([0.13, 0.17, 0.14], [0, 0.205, 0.01], { color: '#efe4d4' });
    b.ball([0.145, 0.1, 0.15], [0, Y + 0.04, -0.005], { color: '#6a4028' });
    b.ball([0.08, 0.07, 0.07], [0, Y + 0.05, -0.07], { color: '#6a4028' });
    b.ball([0.09, 0.08, 0.08], [0, Y + 0.05, -0.07], { color: net, name: 'net', noInk: true, scale: 1 });
    for (const [y, r] of [[0.03, 0.074], [0.06, 0.062], [0.085, 0.042]] as const) b.torus([2 * r, 2 * r, 0.004], [0, Y + y, -0.005], { color: net, rot: [90, 0, 0], tube: 0.06, noInk: true, parent: 'net' });
    arc(b, [0, Y + 0.035, -0.005], 0.074, 0.055, 10, 170, 6, 0.004, net, 'xy', { noInk: true, parent: 'net' });
    arc(b, [0, Y + 0.035, -0.005], 0.076, 0.055, 10, 170, 6, 0.004, net, 'yz', { noInk: true, parent: 'net' });
    b.torus([0.15, 0.15, 0.012], [0, Y + 0.008, -0.005], { color: 'tan', rot: [80, 0, 0], tube: 0.12, parent: 'net' });
    return b.act({ click: [A.pose('net', { scale: 1.2, dur: 0.3 }), A.pose('net', { scale: 1, dur: 0.12 }), A.say('Snap!', 1)] }).done();
  }),
  // Two bobby pins crossed under a pearl-topped hairpin, real 6 cm size.
  e('hairpin', 'wardrobe', 'hair accessories', () => {
    const b = m('hairpin');
    const pin = (x: number, t: number) => {
      const r = (t * Math.PI) / 180, p = (dx: number, dy: number): V => [x + dx * Math.cos(r) - dy * Math.sin(r), dy * Math.cos(r) + dx * Math.sin(r) + 0.004, 0];
      b.stick(p(-0.005, 0), p(-0.005, 0.065), 0.003, '#2b2b2b');
      path(b, [p(0.005, 0), p(0.009, 0.012), p(0.003, 0.024), p(0.009, 0.036), p(0.003, 0.048), p(0.008, 0.06), p(0.005, 0.065)], 0.003, '#2b2b2b');
      b.torus([0.013, 0.01, 0.003], p(0, 0.068), { color: '#2b2b2b', rot: [0, 0, t], tube: 0.25 });
      b.ball(0.005, p(-0.005, 0), { color: '#2b2b2b' }).ball(0.005, p(0.005, 0), { color: '#2b2b2b' });
    };
    pin(-0.012, 12);
    pin(0.014, -12);
    b.stick([0.0, 0.004, 0.012], [0.0, 0.07, 0.012], 0.0025, 'gold');
    b.ball(0.014, [0, 0.078, 0.012], { color: '#f6f0e6' });
    return b.act({ click: [A.anim('hop'), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A kid trick-or-treating as a witch: pointed hat, cape, broom and a pumpkin basket.
  e('halloween costume', 'toys', 'halloween', () =>
    withAct(who('halloween costume', { h: 'kid', top: 'black', bottom: 'black', skirt: 'purple', long: true, style: 'long', hair: '#e86a1e', pose: 'hold', acc: [hat('wizard', 'black'), wear('cape', 'purple'), held('broom'), held('basket', 'orange', 'L')] }), {
      click: [
        [A.par(A.anim('arms_up'), A.say('Boo!', 1.5))],
        [A.par(A.anim('wave'), A.say('Happy Halloween!', 2))],
        [A.par(A.anim('dance'), A.say('Trick or treat!', 2)), A.spawn('c', 'candy corn', { rel: 'front', of: 'self', dist: 'close' }), A.wait(1.5), A.remove('c', 'pop')],
      ],
    }),
  ),
  // A wooden hall pass hanging on a classroom hook plaque; it swings on its cord.
  e('hallpass', 'study', 'school', () =>
    m('hallpass', { edge: 'sharp' })
      .box([0.22, 0.04, 0.03], [0, 0.42, -0.02], { color: 'darkwood', round: 0.3 })
      .box([0.04, 0.4, 0.03], [0, 0.22, -0.02], { color: 'darkwood', round: 0.2 })
      .box([0.18, 0.03, 0.12], [0, 0.015, 0.01], { color: 'darkwood', round: 0.2 })
      .rod([0, 0.4, 0.0], [0, 0.4, 0.04], 0.012, 'brass')
      .torus([0.03, 0.04, 0.006], [0, 0.38, 0.04], { color: 'red', tube: 0.3, name: 'pass', pivot: [0, 0.4, 0.04] })
      .box([0.03, 0.06, 0.02], [0, 0.33, 0.04], { color: 'lightwood', round: 0.3, parent: 'pass' })
      .box([0.13, 0.17, 0.02], [0, 0.22, 0.04], { color: 'lightwood', round: 0.2, parent: 'pass' })
      .label('HALL PASS', [0.11, 0.05], [0, 0.24, 0.052], { color: '#f6d24a', parent: 'pass', depth: 0.004 })
      .label('ROOM 5', [0.08, 0.03], [0, 0.18, 0.052], { color: 'white', parent: 'pass', depth: 0.004 })
      .act({ click: [A.pose('pass', { rot: [0, 0, 25], dur: 0.3 }), A.pose('pass', { rot: [0, 0, -20], dur: 0.4 }), A.pose('pass', { rot: [0, 0, 12], dur: 0.35 }), A.pose('pass', { rot: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // A school hallway, open at the front and top: a runner down the floor, classroom doors that open on both
  // walls, lockers, ceiling lamps that switch, and a door with a glowing EXIT sign at the end.
  e('hallway', 'places', 'rooms', () => {
    const b = m('hallway', { edge: 'sharp' });
    b.box([2.8, 0.08, 7], [0, 0.04, 0], { color: '#c9b28a', round: 0.02 });
    b.box([1.0, 0.012, 6.6], [0, 0.086, 0], { color: '#8a2a2a', noInk: true });
    b.box([3.4, 2.7, 0.25], [0, 1.35, -3.6], { color: '#efe6d4' });
    b.box([1.0, 2.1, 0.06], [0, 1.05, -3.45], { color: '#7a5a3a', round: 0.1 });
    b.ball(0.07, [0.38, 1.0, -3.4], { color: 'brass' });
    b.label('EXIT', [0.6, 0.22], [0, 2.35, -3.46], { color: '#2e9e5a', glow: true, depth: 0.05 });
    b.pair((s) => {
      b.box([0.25, 2.7, 7], [s * 1.52, 1.35, 0], { color: s > 0 ? '#e8dcc4' : '#efe6d4' });
      b.box([0.03, 0.9, 7], [s * 1.38, 0.45, 0], { color: '#5a8a9a' });
      for (const [i, z] of [[0, -1.5], [1, 1.2]] as const) {
        const n = `door${s > 0 ? 'L' : 'R'}${i}`;
        b.box([0.08, 2.15, 0.96], [s * 1.36, 1.075, z], { color: '#6a4a2e' });
        b.box([0.06, 2.05, 0.86], [s * 1.33, 1.03, z], { color: '#a0784a', round: 0.1, name: n, pivot: [s * 1.33, 1.03, z - 0.43], mover: { kind: 'swing', axis: 'y', amount: s * -80 } });
        b.box([0.07, 0.5, 0.3], [s * 1.32, 1.5, z + 0.08], { color: '#8fb8cc', parent: n });
        b.ball(0.06, [s * 1.29, 1.0, z + 0.33], { color: 'brass', parent: n });
      }
      b.each(3, (i) => b.box([0.1, 1.8, 0.4], [s * 1.34, 0.95, -0.25 + i * 0.42 - 0.2], { color: '#4a6a8a', round: 0.05 }));
    });
    [-2.2, 0, 2.2].forEach((z, i) => {
      b.box([1.2, 0.06, 0.3], [0, 2.62, z], { color: '#d8d8d8' });
      b.box([1.1, 0.04, 0.24], [0, 2.58, z], { color: '#fff6c8', glow: true, name: `lamp${i}`, mover: { kind: 'light', on: true } });
    });
    return b
      .act({
        click: [
          [A.operate('lamp', 'off'), A.say('Click.', 1), A.wait(1.5), A.operate('lamp', 'on')],
          [A.operate('doorL0', 'open'), A.say('Creak...', 1.5), A.wait(2), A.operate('doorL0', 'close')],
        ],
      })
      .done();
  }),
  // A glowing golden halo floating over the ground: it spins and sparkles, then bobs up and down.
  e('halo', 'fantasy', 'magic items', () =>
    m('halo')
      .torus([0.26, 0.26, 0.035], [0, 0.24, 0], { color: 'gold', rot: [-75, 0, 0], tube: 0.18, glow: true, name: 'ring', pivot: [0, 0.24, 0] })
      .star(0.05, [0.17, 0.3, 0.02], { color: '#fff6a0', glow: true, parent: 'ring' })
      .star(0.035, [-0.16, 0.2, 0.03], { color: '#fff6a0', glow: true, parent: 'ring' })
      .act({
        click: [
          [A.par(A.pose('ring', { spin: [0, 180, 0] }), A.effect('sparkle', { dur: 2 })), A.wait(1.5), A.pose('ring', { spin: [0, 0, 0] }), A.pose('ring', { rot: [0, 0, 0], dur: 0.3 })],
          [A.pose('ring', { move: [0, 0.12, 0], dur: 0.5 }), A.pose('ring', { move: [0, 0, 0], dur: 0.5 }), A.pose('ring', { move: [0, 0.12, 0], dur: 0.5 }), A.pose('ring', { move: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done(),
  ),
  // A glazed holiday ham on a platter: scored diamonds studded with cloves, the bone, and a pink slice that
  // comes off.
  e('ham', 'food', 'meat', () => {
    const b = m('ham');
    b.cyl([0.36, 0.016, 0.3], [0, 0.008, 0], { color: 'white', edge: 'sharp', round: 0.5 });
    b.ball([0.24, 0.17, 0.19], [0, 0.098, 0], { color: '#b9583e', name: 'ham' });
    b.ball([0.15, 0.12, 0.04], [-0.03, 0.094, 0.082], { color: '#e88a8a' });
    b.torus([0.15, 0.12, 0.01], [-0.03, 0.094, 0.085], { color: '#f4d0c0', tube: 0.08, noInk: true });
    for (let i = -2; i <= 2; i++) {
      b.rod([-0.1 + i * 0.035, 0.05, 0.075], [0.04 + i * 0.035, 0.18, 0.02], 0.004, '#8a3a24', { noInk: true });
      b.rod([0.1 + i * 0.035, 0.05, 0.06], [-0.04 + i * 0.035, 0.18, 0.02], 0.004, '#8a3a24', { noInk: true });
    }
    for (const [x, y, z] of [[0.04, 0.16, 0.05], [0.08, 0.12, 0.07], [-0.02, 0.17, 0.03], [0.0, 0.12, 0.08], [0.09, 0.07, 0.07]] as const) b.ball(0.01, [x, y, z], { color: '#3a2216', noInk: true });
    b.rod([0.07, 0.15, 0], [0.13, 0.22, 0], 0.035, 'cream').ball(0.045, [0.135, 0.23, 0], { color: 'cream' });
    b.box([0.1, 0.07, 0.014], [-0.17, 0.035, 0.07], { color: '#f0a0a0', round: 0.4, rot: [-70, 25, 0], name: 'slice', parent: 'ham', piece: true });
    b.box([0.104, 0.074, 0.01], [-0.17, 0.034, 0.07], { color: '#b9583e', round: 0.5, rot: [-70, 25, 0], parent: 'slice', noInk: true });
    return b.act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] }).done();
  }),
  // A cheeseburger: sesame bun, a seared patty, melted cheese, lettuce, tomato and pickles; the bun lifts and
  // steam rises.
  e('hamburger', 'food', 'fast food', () => {
    const b = m('hamburger')
      .cyl([0.11, 0.025, 0.11], [0, 0.0125, 0], { color: '#d9a85a', round: 0.5 })
      .cyl([0.118, 0.024, 0.118], [0, 0.037, 0], { color: '#5a3420' })
      .box([0.106, 0.005, 0.106], [0, 0.051, 0], { color: '#f6c33a', rot: [0, 45, 0], round: 0.1 })
      .cyl([0.126, 0.008, 0.126], [0, 0.057, 0], { color: '#7cc04a' })
      .cyl([0.1, 0.01, 0.1], [0, 0.065, 0], { color: '#d84a3a' });
    around(3, 0.03, 0.4).forEach(([x, z]) => b.cyl([0.026, 0.004, 0.026], [x, 0.071, z], { color: '#8aa83a', noInk: true }));
    b.dome([0.116, 0.05, 0.116], [0, 0.098, 0], { color: '#d9a85a', name: 'bun' });
    b.cyl([0.116, 0.008, 0.116], [0, 0.077, 0], { color: '#e8c070', parent: 'bun' });
    around(9, 0.032).forEach(([x, z], i) => b.ball([0.008, 0.003, 0.005], [x * (i % 2 ? 1 : 0.6), 0.12 - (i % 2 ? 0.006 : 0), z * (i % 2 ? 1 : 0.6) + 0.004], { color: 'cream', noInk: true, parent: 'bun', rot: [0, i * 40, 0] }));
    return b
      .act({ click: [[A.pose('bun', { move: [0, 0.05, 0], rot: [-20, 0, 0], dur: 0.4 }), A.effect('steam', { dur: 1.5 })], [A.pose('bun', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })]] })
      .done();
  }),
  // A claw hammer standing on its rubber grip: forged head with a striking face and a curved split claw; it
  // knocks.
  e('hammer', 'workshop', 'hand tools', () =>
    m('hammer')
      .stick([0, 0, 0], [0, 0.31, 0], 0.03, '#c8a06a', { name: 'hammer', pivot: [0, 0, 0] })
      .capsule([0.038, 0.12, 0.034], [0, 0.065, 0], { color: '#c0392b', parent: 'hammer' })
      .box([0.075, 0.04, 0.034], [0.035, 0.31, 0], { color: 'steel', round: 0.2, parent: 'hammer', edge: 'sharp' })
      .cyl([0.036, 0.03, 0.036], [0.083, 0.31, 0], { color: 'steel', rot: [0, 0, 90], parent: 'hammer', edge: 'sharp' })
      .cyl([0.04, 0.006, 0.04], [0.1, 0.31, 0], { color: '#d8dce0', rot: [0, 0, 90], parent: 'hammer', edge: 'sharp' })
      .arc([0.12, 0.08, 0.028], [-0.002, 0.27, 0], { color: 'steel', arc: 80, rot: [0, 0, 50], tube: 0.25, parent: 'hammer', edge: 'sharp' })
      .act({ click: [A.pose('hammer', { rot: [0, 0, -50], dur: 0.25 }), A.par(A.pose('hammer', { rot: [0, 0, 0], dur: 0.08 }), A.effect('dust', { dur: 0.8 }), A.say('Bang!', 1))] })
      .done(),
  ),
  // A hammock on its arched stand: rope ends to spreader bars, a sagging striped bed (someone can lie in it);
  // it sways.
  e('hammock', 'home', 'outdoor furniture', () => {
    const b = m('hammock', { edge: 'sharp' });
    b.box([2.6, 0.1, 0.12], [0, 0.05, 0], { color: 'darkwood', round: 0.2 });
    b.pair((s) => {
      b.box([0.12, 0.06, 0.9], [s * 1.35, 0.03, 0], { color: 'darkwood', round: 0.2 });
      b.rod([s * 1.1, 0.08, 0], [s * 1.55, 1.35, 0], 0.09, 'wood');
      b.rod([s * 1.2, 0.06, 0.35], [s * 1.35, 0.4, 0], 0.05, 'wood');
      b.rod([s * 1.2, 0.06, -0.35], [s * 1.35, 0.4, 0], 0.05, 'wood');
      b.cyl([0.06, 0.06, 0.06], [s * 1.52, 1.3, 0], { color: 'iron' });
    });
    b.stick([1.0, 0.9, -0.45], [1.0, 0.9, 0.45], 0.04, 'lightwood', { name: 'bed', pivot: [0, 1.3, 0] });
    b.stick([-1.0, 0.9, -0.45], [-1.0, 0.9, 0.45], 0.04, 'lightwood', { parent: 'bed' });
    b.pair((s) => {
      for (const z of [-0.4, -0.13, 0.13, 0.4]) b.rod([s * 1.0, 0.9, z], [s * 1.52, 1.3, 0], 0.012, 'cream', { parent: 'bed' });
    });
    const N = 10, f = (x: number) => 0.52 + 0.38 * x * x;
    for (let i = 0; i < N; i++) {
      const x0 = -1 + (2 * i) / N, x1 = -1 + (2 * (i + 1)) / N;
      const ang = (Math.atan2(f(x1) - f(x0), x1 - x0) * 180) / Math.PI;
      b.box([Math.hypot(x1 - x0, f(x1) - f(x0)) + 0.01, 0.025, 0.86], [(x0 + x1) / 2, (f(x0) + f(x1)) / 2, 0], { color: i % 2 ? '#f2e6c8' : '#2a8a8a', rot: [0, 0, ang], round: 0.1, parent: 'bed', edge: 'soft' });
    }
    return withSockets(
      b.act({ click: [A.pose('bed', { rot: [14, 0, 0], dur: 0.6 }), A.pose('bed', { rot: [-12, 0, 0], dur: 0.8 }), A.pose('bed', { rot: [7, 0, 0], dur: 0.7 }), A.pose('bed', { rot: [0, 0, 0], dur: 0.6 }), A.say('Creak... creak...', 1.5)] }).done(),
      [{ name: 'bed', at: [0, 0.6, 0], kind: 'seat', part: 'bed' }],
    );
  }),
  // A woven wicker laundry hamper with a lid on a hinge, rope handles, and a sleeve hanging out.
  e('hamper', 'home', 'laundry', () => {
    const b = m('hamper');
    b.cyl([0.46, 0.62, 0.38], [0, 0.31, 0], { color: '#c8a46a', taper: 1.08, segs: 8 });
    for (const y of [0.08, 0.2, 0.32, 0.44, 0.56]) b.cyl([0.48 + y * 0.06, 0.02, 0.4 + y * 0.05], [0, y, 0], { color: '#a8844a', noInk: true, segs: 8 });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      b.stick([Math.cos(a) * 0.235, 0.02, Math.sin(a) * 0.195], [Math.cos(a) * 0.25, 0.6, Math.sin(a) * 0.21], 0.012, '#9a7a42', { noInk: true });
    });
    b.cyl([0.52, 0.05, 0.43], [0, 0.645, 0], { color: '#b8945e', segs: 8, name: 'lid', pivot: [0, 0.645, -0.21], mover: { kind: 'swing', axis: 'x', amount: -95 }, edge: 'sharp' });
    b.torus([0.08, 0.05, 0.02], [0, 0.68, 0.05], { color: '#6a4a2a', rot: [90, 0, 0], parent: 'lid' });
    b.pair((s) => b.torus([0.1, 0.07, 0.02], [s * 0.25, 0.5, 0], { color: '#6a4a2a', rot: [0, 90, 0] }));
    b.rod([0.1, 0.62, 0.17], [0.13, 0.4, 0.23], 0.06, '#3a7bd5');
    b.box([0.07, 0.06, 0.05], [0.135, 0.37, 0.24], { color: '#3a7bd5', round: 0.4 });
    return withSockets(
      b.act({ click: [A.operate('lid', 'open'), A.anim('wobble'), A.wait(1.5), A.operate('lid', 'close')] }).done(),
      [{ name: 'inside', at: [0, 0.4, 0], kind: 'inside', size: 0.4 }],
    );
  }),
  // A hand standing on its wrist: palm, jointed fingers with nails, a thumb. It waves, makes a fist, opens.
  e('hand', 'clinic', 'body parts', () =>
    hand2(m('hand'), 0, 1, 'skin2', 'hand')
      .act({
        click: [
          [A.pose('hand', { rot: [0, 0, 18], dur: 0.25 }), A.pose('hand', { rot: [0, 0, -18], dur: 0.3 }), A.pose('hand', { rot: [0, 0, 18], dur: 0.3 }), A.pose('hand', { rot: [0, 0, 0], dur: 0.25 })],
          [A.par(...[1, 2, 3, 4].map((i) => A.pose(`handf${i}`, { rot: [95, 0, 0], dur: 0.4 })), A.pose('handt', { rot: [0, 60, 0], dur: 0.4 }))],
          [A.par(...[1, 2, 3, 4].map((i) => A.pose(`handf${i}`, { rot: [0, 0, 0], dur: 0.4 })), A.pose('handt', { rot: [0, 0, 0], dur: 0.4 }))],
        ],
      })
      .done(),
  ),
  // A hand-cranked winch: gearbox on a mounting plate, rope drum, gear and crank arm; both turn together.
  e('hand crank', 'workshop', 'hardware', () =>
    m('hand crank', { edge: 'sharp' })
      .box([0.24, 0.02, 0.14], [0, 0.01, -0.02], { color: '#5a6066', round: 0.2 })
      .box([0.02, 0.16, 0.12], [0.1, 0.09, -0.02], { color: '#5a6066' })
      .box([0.02, 0.16, 0.12], [-0.1, 0.09, -0.02], { color: '#5a6066' })
      .cyl([0.09, 0.18, 0.09], [0, 0.1, -0.02], { color: '#8a8e92', rot: [0, 0, 90], name: 'drum' })
      .cyl([0.1, 0.03, 0.1], [0.04 - 0.02, 0.1, -0.02], { color: '#c9a36a', rot: [0, 0, 90], parent: 'drum', noInk: true })
      .cyl([0.1, 0.03, 0.1], [-0.03, 0.1, -0.02], { color: '#c9a36a', rot: [0, 0, 90], parent: 'drum', noInk: true })
      .rod([0, 0.055, -0.02], [0, 0.03, 0.12], 0.012, '#c9a36a')
      .cyl([0.12, 0.016, 0.12], [0, 0.1, 0.06], { color: 'brass', rot: [90, 0, 0], segs: 14 })
      .stick([0, 0.1, 0.04], [0, 0.1, 0.1], 0.02, 'steel')
      .box([0.026, 0.14, 0.016], [0, 0.155, 0.1], { color: '#c0392b', round: 0.4, name: 'crank', pivot: [0, 0.1, 0.1] })
      .stick([0, 0.215, 0.1], [0, 0.215, 0.16], 0.026, 'wood', { parent: 'crank' })
      .act({ click: [A.par(A.pose('crank', { spin: [0, 0, 360] }), A.pose('drum', { spin: [360, 0, 0] }), A.say('Clack clack clack', 2)), A.wait(2), A.par(A.pose('crank', { spin: [0, 0, 0] }), A.pose('drum', { spin: [0, 0, 0] }))] })
      .done(),
  ),
  // An oval hand mirror in a gilt frame on a pink handle: it turns to show its back, and glints.
  e('hand mirror', 'home', 'grooming', () =>
    m('hand mirror')
      .capsule([0.026, 0.12, 0.02], [0, 0.06, 0], { color: '#f48fb1', name: 'mirror', pivot: [0, 0, 0] })
      .cyl([0.04, 0.02, 0.03], [0, 0.125, 0], { color: 'gold', parent: 'mirror' })
      .cyl([0.14, 0.022, 0.17], [0, 0.215, 0], { color: 'gold', rot: [90, 0, 0], parent: 'mirror' })
      .cyl([0.118, 0.012, 0.148], [0, 0.215, 0.008], { color: '#dff3fb', rot: [90, 0, 0], parent: 'mirror', edge: 'sharp' })
      .box([0.012, 0.06, 0.003], [0.02, 0.23, 0.015], { color: 'white', rot: [0, 0, -30], noInk: true, parent: 'mirror' })
      .ball([0.09, 0.1, 0.006], [0, 0.215, -0.012], { color: '#f8bbd0', parent: 'mirror', noInk: true })
      .ball(0.022, [0, 0.305, 0], { color: 'gold', parent: 'mirror' })
      .act({ click: [[A.pose('mirror', { rot: [0, 180, 0], dur: 0.6 })], [A.pose('mirror', { rot: [0, 0, 0], dur: 0.6 }), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // Steel handcuffs on their chain: each cuff a ring with its lock box; one jaw swings open and clicks shut.
  e('handcuffs', 'armory', 'police gear', () => {
    const b = m('handcuffs', { edge: 'sharp' });
    b.pair((s) => {
      b.arc([0.075, 0.075, 0.012], [s * 0.065, 0.038, 0], { color: 'steel', tube: 0.17, arc: 200, rot: [0, 0, s * 40] });
      b.box([0.03, 0.034, 0.02], [s * 0.065, 0.076, 0], { color: '#8a8e92', round: 0.3 });
      b.cyl([0.008, 0.004, 0.008], [s * 0.065, 0.078, 0.011], { color: '#2b2b2b', rot: [90, 0, 0], noInk: true });
    });
    b.arc([0.075, 0.075, 0.012], [0.065, 0.038, 0], { color: 'silver', tube: 0.17, arc: 150, rot: [0, 0, 220], name: 'jaw', pivot: [0.04, 0.066, 0], mover: { kind: 'swing', axis: 'z', amount: 40 } });
    b.arc([0.075, 0.075, 0.012], [-0.065, 0.038, 0], { color: 'silver', tube: 0.17, arc: 150, rot: [0, 0, 140] });
    for (const [x, r] of [[-0.026, 0], [0, 90], [0.026, 0]] as const) b.torus([0.026, 0.016, 0.005], [x, 0.08, 0], { color: 'silver', rot: [r, 0, 0] });
    return b.act({ click: [A.operate('jaw', 'open'), A.wait(0.8), A.operate('jaw', 'close'), A.say('Click!', 1)] }).done();
  }),
  // A brick-style handheld game console: grey case, a green screen that switches on, D-pad and A/B buttons.
  e('handheld', 'tech', 'game consoles', () =>
    m('handheld', { edge: 'sharp' })
      .box([0.09, 0.148, 0.03], [0, 0.074, 0], { color: '#c9c7c2', round: 0.15 })
      .box([0.076, 0.062, 0.006], [0, 0.11, 0.015], { color: '#5c6166', round: 0.2 })
      .box([0.05, 0.045, 0.004], [0, 0.11, 0.018], { color: '#9bbc0f', glow: true, name: 'screen', mover: { kind: 'light' } })
      .ball(0.005, [-0.033, 0.122, 0.018], { color: 'red', glow: true, noInk: true })
      .box([0.03, 0.009, 0.008], [-0.022, 0.05, 0.016], { color: '#1e1e1e' })
      .box([0.009, 0.03, 0.008], [-0.022, 0.05, 0.016], { color: '#1e1e1e' })
      .cyl([0.014, 0.008, 0.014], [0.017, 0.046, 0.016], { color: '#a0225a', rot: [90, 0, 0] })
      .cyl([0.014, 0.008, 0.014], [0.033, 0.056, 0.016], { color: '#a0225a', rot: [90, 0, 0] })
      .box([0.012, 0.004, 0.006], [-0.008, 0.022, 0.016], { color: 'gray', rot: [0, 0, 25] })
      .box([0.012, 0.004, 0.006], [0.01, 0.022, 0.016], { color: 'gray', rot: [0, 0, 25] })
      .act({ click: [[A.operate('screen', 'on'), A.say('Bleep bloop!', 1.5)], [A.anim('shake'), A.say('Game over!', 1.5)], [A.operate('screen', 'off')]] })
      .done(),
  ),
  // A reserved-parking sign on its post at real height (a 2.2 m post, so taller than the 0.3 m vocabulary size):
  // the blue wheelchair symbol plate with a "RESERVED" panel under it.
  e('handicapped sign', 'ideas', 'signs', () => {
    const w = 'white';
    const b = m('handicapped sign', { edge: 'sharp' });
    b.cyl([0.3, 0.12, 0.3], [0, 0.06, 0], { color: '#a8a39c' });
    b.box([0.06, 2.2, 0.04], [0, 1.15, -0.03], { color: 'steel', round: 0.2, name: 'post', pivot: [0, 0.1, 0] });
    b.box([0.32, 0.36, 0.02], [0, 1.95, 0], { color: '#1f5fb8', round: 0.12, parent: 'post' });
    b.ball(0.035, [-0.02, 2.05, 0.014], { color: w, parent: 'post' });
    b.rod([-0.03, 2.02, 0.014], [-0.04, 1.94, 0.014], 0.02, w, { parent: 'post' }).rod([-0.04, 1.94, 0.014], [0.03, 1.94, 0.014], 0.018, w, { parent: 'post' }).rod([0.03, 1.94, 0.014], [0.06, 1.86, 0.014], 0.018, w, { parent: 'post' });
    b.rod([-0.03, 2.0, 0.014], [0.03, 2.0, 0.014], 0.014, w, { parent: 'post' });
    b.torus([0.13, 0.13, 0.01], [-0.03, 1.9, 0.014], { color: w, tube: 0.12, parent: 'post' });
    b.label('RESERVED', [0.32, 0.12], [0, 1.68, 0], { color: w, parent: 'post', depth: 0.02 });
    return b.act({ click: [A.pose('post', { rot: [0, 0, 6], dur: 0.15 }), A.pose('post', { rot: [0, 0, -5], dur: 0.2 }), A.pose('post', { rot: [0, 0, 3], dur: 0.2 }), A.pose('post', { rot: [0, 0, 0], dur: 0.2 }), A.say('Bonk!', 1)] }).done();
  }),
  // A cotton handkerchief with a red border pegged on a little line between two posts; it flutters in the breeze.
  e('handkerchief', 'wardrobe', 'accessories', () => {
    const b = m('handkerchief');
    b.box([0.6, 0.04, 0.15], [0, 0.02, 0], { color: 'wood', edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.27, 0.04, 0], [s * 0.27, 0.52, 0], 0.025, 'wood'));
    b.stick([-0.27, 0.49, 0], [0.27, 0.49, 0], 0.005, 'tan');
    b.box([0.34, 0.34, 0.008], [0, 0.31, 0], { color: '#c62828', round: 0.05, name: 'hankie', pivot: [0, 0.49, 0], edge: 'sharp' });
    b.box([0.28, 0.28, 0.01], [0, 0.31, 0], { color: 'white', round: 0.05, noInk: true, parent: 'hankie' });
    for (const [x, y] of [[-0.08, 0.38], [0.06, 0.36], [-0.04, 0.24], [0.08, 0.22], [0.0, 0.31]] as const) b.ball([0.022, 0.022, 0.004], [x, y, 0.006], { color: '#c62828', noInk: true, parent: 'hankie' });
    b.pair((s) => b.box([0.018, 0.05, 0.02], [s * 0.14, 0.48, 0.01], { color: 'lightwood', edge: 'sharp' }));
    return b
      .act({ click: [A.pose('hankie', { rot: [-30, 0, 0], dur: 0.3 }), A.pose('hankie', { rot: [-10, 0, 0], dur: 0.25 }), A.pose('hankie', { rot: [-35, 0, 0], dur: 0.3 }), A.pose('hankie', { rot: [0, 0, 0], dur: 0.4 }), A.say('Flap flap', 1)] })
      .done();
  }),
  // A brass lever door handle on its back plate with a keyhole: press it down and it springs back.
  e('handle', 'home', 'door hardware', () =>
    m('handle', { edge: 'sharp' })
      .box([0.05, 0.2, 0.014], [0, 0.1, 0], { color: 'brass', round: 0.4 })
      .cyl([0.044, 0.02, 0.044], [0, 0.14, 0.016], { color: 'brass', rot: [90, 0, 0] })
      .stick([0, 0.14, 0.02], [0, 0.14, 0.05], 0.018, 'brass', { name: 'lever', pivot: [0, 0.14, 0.035] })
      .rod([0, 0.14, 0.05], [0.115, 0.135, 0.055], 0.02, 'brass', { parent: 'lever' })
      .ball([0.024, 0.022, 0.024], [0.118, 0.134, 0.055], { color: 'brass', parent: 'lever' })
      .cyl([0.012, 0.004, 0.012], [0, 0.055, 0.008], { color: '#1e1e1e', rot: [90, 0, 0] })
      .box([0.005, 0.014, 0.004], [0, 0.045, 0.008], { color: '#1e1e1e' })
      .act({ click: [A.pose('lever', { rot: [0, 0, -35], dur: 0.25 }), A.say('Click!', 1), A.pose('lever', { rot: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A pair of hands standing on their wrists; they turn palm to palm and clap.
  e('hands', 'clinic', 'body parts', () => {
    const b = m('hands');
    hand2(b, 0.07, 1, 'skin3', 'handL');
    hand2(b, -0.07, -1, 'skin3', 'handR');
    const clap = [A.par(A.pose('handL', { rot: [0, -80, 0], move: [-0.03, 0, 0], dur: 0.2 }), A.pose('handR', { rot: [0, 80, 0], move: [0.03, 0, 0], dur: 0.2 })), A.par(A.pose('handL', { rot: [0, -80, 0], move: [0, 0, 0], dur: 0.15 }), A.pose('handR', { rot: [0, 80, 0], move: [0, 0, 0], dur: 0.15 }))];
    return b
      .act({ click: [...clap, ...clap, A.say('Clap clap!', 1.2), A.par(A.pose('handL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('handR', { rot: [0, 0, 0], dur: 0.3 }))] })
      .done();
  }),
  // A hang glider at real size (10 m span): a delta sail with a striped leading edge on a keel, kingpost wires, the
  // A-frame control bar and the pilot lying in a harness. It lifts off and glides back.
  e('hang glider', 'garage', 'aircraft', () => {
    const b = m('hang glider', { view: 'side' });
    b.stick([0, 2.25, -1.5], [0, 2.3, 1.7], 0.06, 'silver', { name: 'wing' });
    b.wedge([10, 3.1, 0.04], [0, 2.4, 0], { color: '#f57c00', rot: [92, 0, 0], parent: 'wing', edge: 'sharp' });
    b.wedge([5, 1.55, 0.05], [0, 2.43, 0.8], { color: '#fdd835', rot: [92, 0, 0], parent: 'wing', noInk: true, edge: 'sharp' });
    b.pair((s) => {
      b.stick([0, 2.4, 1.5], [s * 5.0, 2.4, -1.45], 0.05, 'silver', { parent: 'wing' });
      b.stick([0, 2.33, 0.2], [s * 2.6, 2.35, -0.2], 0.04, 'silver', { parent: 'wing' });
      b.rod([0, 2.3, 0.2], [s * 0.7, 0.75, 0.55], 0.035, 'silver', { parent: 'wing' });
      b.rod([s * 0.7, 0.75, 0.55], [s * 2.6, 2.38, -0.2], 0.008, '#3a3a3a', { parent: 'wing' });
      b.rod([0, 3.2, 0.2], [s * 2.6, 2.45, -0.2], 0.008, '#3a3a3a', { parent: 'wing' });
    });
    b.stick([-0.7, 0.75, 0.55], [0.7, 0.75, 0.55], 0.04, 'silver', { parent: 'wing' });
    b.stick([0, 2.4, 0.2], [0, 3.25, 0.2], 0.04, 'silver', { parent: 'wing' });
    b.rod([0, 2.3, 0.0], [0, 1.45, 0.0], 0.015, '#1e1e1e', { parent: 'wing' });
    b.capsule([0.42, 1.5, 0.38], [0, 1.25, -0.25], { color: '#1f5fb8', rot: [90, 0, 0], parent: 'wing' });
    b.ball([0.26, 0.26, 0.28], [0, 1.32, 0.55], { color: '#d32f2f', parent: 'wing' });
    b.ball([0.18, 0.12, 0.08], [0, 1.27, 0.66], { color: '#2b3f66', parent: 'wing', noInk: true });
    b.pair((s) => b.rod([s * 0.18, 1.25, 0.35], [s * 0.5, 0.8, 0.55], 0.07, '#1f5fb8', { parent: 'wing' }));
    return b
      .act({ click: [A.par(A.pose('wing', { move: [0, 2.5, 3], rot: [-6, 0, 10], dur: 1.6 }), A.say('Whoosh!', 1.5)), A.pose('wing', { move: [0, 1.5, 0], rot: [0, 0, -8], dur: 1.2 }), A.pose('wing', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1.2 })] })
      .done();
  }),
  // A 3.5-inch hard drive with its lid off, standing up: the mirror platter on its spindle spins up and the
  // read arm sweeps across it.
  e('hard drive', 'tech', 'computer parts', () =>
    m('hard drive', { edge: 'sharp' })
      .box([0.102, 0.147, 0.026], [0, 0.0735, 0], { color: '#8a8e92', round: 0.08 })
      .box([0.094, 0.139, 0.004], [0, 0.0735, 0.0125], { color: '#5a5e62', round: 0.1 })
      .cyl([0.086, 0.004, 0.086], [0, 0.095, 0.016], { color: '#e4e9ef', rot: [90, 0, 0], name: 'platter', mover: { kind: 'spin', axis: 'z', amount: 1440 } })
      .cyl([0.024, 0.006, 0.024], [0, 0.095, 0.019], { color: 'silver', rot: [90, 0, 0], parent: 'platter' })
      .box([0.03, 0.003, 0.003], [0.02, 0.095, 0.019], { color: '#b8c4cc', parent: 'platter', noInk: true })
      .cyl([0.018, 0.008, 0.018], [0.036, 0.024, 0.018], { color: '#2b2d31', rot: [90, 0, 0] })
      .box([0.008, 0.07, 0.004], [0.03, 0.058, 0.021], { color: '#2b2d31', rot: [0, 0, 28], name: 'arm', pivot: [0.036, 0.024, 0.021] })
      .box([0.005, 0.01, 0.004], [0.014, 0.09, 0.022], { color: 'silver', parent: 'arm' })
      .box([0.07, 0.01, 0.02], [0, 0.005, 0], { color: '#1e6a3a' })
      .box([0.03, 0.006, 0.012], [-0.02, 0.003, 0.012], { color: 'gold', noInk: true })
      .act({
        click: [
          [A.operate('platter', 'on'), A.say('Whirrr...', 1.5), A.pose('arm', { rot: [0, 0, 30], dur: 0.3 }), A.pose('arm', { rot: [0, 0, 10], dur: 0.2 }), A.pose('arm', { rot: [0, 0, 25], dur: 0.2 }), A.say('Click click', 1)],
          [A.pose('arm', { rot: [0, 0, 0], dur: 0.3 }), A.operate('platter', 'off')],
        ],
      })
      .done(),
  ),
  // A yellow miner's hard hat: moulded shell with a centre ridge, a peak, and a headlamp that switches on.
  e('hard hat', 'wardrobe', 'hats', () =>
    m('hard hat')
      .cyl([0.29, 0.016, 0.33], [0, 0.008, 0.01], { color: '#f6c400' })
      .box([0.2, 0.014, 0.08], [0, 0.012, 0.16], { color: '#f6c400', round: 0.5, rot: [-8, 0, 0] })
      .dome([0.25, 0.16, 0.28], [0, 0.095, 0], { color: '#f6c400' })
      .box([0.04, 0.03, 0.27], [0, 0.17, 0], { color: '#f6c400', round: 0.6 })
      .box([0.07, 0.05, 0.03], [0, 0.11, 0.14], { color: '#2b2d31', round: 0.3, edge: 'sharp' })
      .cyl([0.05, 0.012, 0.05], [0, 0.11, 0.157], { color: '#fff6c8', rot: [90, 0, 0], glow: true, name: 'lamp', mover: { kind: 'light' } })
      .act({ click: [[A.operate('lamp', 'on'), A.say('Click!', 1)], [A.operate('lamp', 'off')]] })
      .done(),
  ),
  // A hardware store: orange front with shop windows, a green awning, timber stacked outside, a ladder and a
  // giant hammer sign on the roof that knocks.
  e('hardware store', 'places', 'shops', () => {
    const { b, H, z } = shop('hardware store', { w: 9, d: 7, wall: '#e07a2a', trim: '#f2ede4', sign: 'HARDWARE', signBg: '#2e7d32', awning: '#2e7d32', awning2: '#f2ede4' });
    b.box([0.3, 1.6, 0.3], [2.4, H + 0.9, 0], { color: '#5a4a3a' });
    b.stick([2.4, H + 1.6, 0], [2.4, H + 3.4, 0], 0.2, '#c8a06a', { name: 'sign', pivot: [2.4, H + 1.6, 0] });
    b.box([1.3, 0.45, 0.45], [2.4, H + 3.4, 0], { color: 'steel', parent: 'sign' });
    b.wedge([0.4, 0.3, 0.42], [1.65, H + 3.4, 0], { color: 'steel', rot: [0, 0, 90], parent: 'sign' });
    for (let i = 0; i < 4; i++) b.box([0.25, 0.12, 2.4], [-3.4 + (i % 2) * 0.27, 0.06 + Math.floor(i / 2) * 0.13, z + 1.4], { color: 'lightwood', round: 0.1 });
    b.box([0.25, 0.12, 2.4], [-3.27, 0.32, z + 1.4], { color: 'lightwood', round: 0.1 });
    b.pair((s) => b.rod([-2.4 + s * 0.22, 0.02, z + 0.5], [-2.4 + s * 0.22, 2.6, z + 0.15], 0.06, '#c0c4c8'));
    b.each(6, (i) => b.rod([-2.62, 0.35 + i * 0.4, z + 0.47 - i * 0.05], [-2.18, 0.35 + i * 0.4, z + 0.47 - i * 0.05], 0.04, '#c0c4c8'));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding-dong!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.pose('sign', { rot: [0, 0, 35], dur: 0.4 }), A.par(A.pose('sign', { rot: [0, 0, 0], dur: 0.12 }), A.say('BANG!', 1.2), A.effect('dust', { dur: 0.8 }))],
        ],
      })
      .done();
  }),
  // A diatonic harmonica: chrome cover plates, a wooden comb with its ten numbered holes; it plays a riff.
  e('harmonica', 'music', 'wind', () => {
    const b = m('harmonica', { edge: 'sharp' });
    b.box([0.1, 0.012, 0.028], [0, 0.006, 0], { color: 'silver', round: 0.3, name: 'harp' });
    b.box([0.096, 0.014, 0.026], [0, 0.019, 0], { color: '#c8a06a', round: 0.1, parent: 'harp' });
    b.box([0.1, 0.012, 0.028], [0, 0.032, 0], { color: 'silver', round: 0.3, parent: 'harp' });
    b.box([0.07, 0.004, 0.002], [0, 0.039, 0.008], { color: '#8a8e92', parent: 'harp', noInk: true });
    b.each(10, (i) => b.box([0.006, 0.008, 0.004], [-0.0405 + i * 0.009, 0.019, 0.0125], { color: '#1e1e1e', parent: 'harp' }));
    return b
      .act({ click: [A.say('Hoo-hee-hoo!', 2), A.pose('harp', { move: [0.03, 0, 0], dur: 0.4 }), A.pose('harp', { move: [-0.03, 0, 0], dur: 0.6 }), A.pose('harp', { move: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A climbing sit harness: padded waist belt with buckle, leg loops, belay loop, gear loops and a locking
  // carabiner whose gate opens.
  e('harness', 'sports', 'climbing gear', () => {
    const b = m('harness');
    b.torus([0.36, 0.3, 0.06], [0, 0.48, 0], { color: '#f57c00', rot: [90, 0, 0], tube: 0.12 });
    b.torus([0.37, 0.31, 0.02], [0, 0.48, 0], { color: '#2b2b2b', rot: [90, 0, 0], tube: 0.05, noInk: true });
    b.box([0.07, 0.045, 0.02], [0, 0.48, 0.158], { color: 'silver', round: 0.3, edge: 'sharp' });
    b.pair((s) => {
      b.torus([0.2, 0.18, 0.05], [s * 0.1, 0.12, 0.01], { color: '#f57c00', rot: [80, 0, 0], tube: 0.2 });
      b.rod([s * 0.07, 0.15, 0.1], [0, 0.32, 0.15], 0.03, '#2b2b2b');
      b.rod([s * 0.1, 0.16, -0.08], [s * 0.08, 0.45, -0.14], 0.02, '#2b2b2b');
      b.arc([0.06, 0.08, 0.012], [s * 0.15, 0.42, 0.08], { color: '#3a7bd5', rot: [0, s * 55, 180], tube: 0.25 });
    });
    b.torus([0.06, 0.16, 0.025], [0, 0.38, 0.155], { color: '#c62828', tube: 0.3 });
    b.torus([0.05, 0.08, 0.008], [0, 0.29, 0.16], { color: 'silver', tube: 0.2, edge: 'sharp' });
    b.box([0.006, 0.05, 0.006], [0.02, 0.29, 0.165], { color: '#9aa0a6', name: 'gate', pivot: [0.02, 0.315, 0.165], mover: { kind: 'swing', axis: 'z', amount: -30 }, edge: 'sharp' });
    return b.act({ click: [A.operate('gate', 'open'), A.wait(0.6), A.operate('gate', 'close'), A.say('Click!', 1)] }).done();
  }),
  // A concert pedal harp, 1.8 m: tapered soundbox with soundholes, carved column with its crown, the curved neck,
  // strings (red C strings), a base with pedals.
  e('harp', 'music', 'strings', () => {
    const b = m('harp');
    b.box([0.5, 0.14, 0.34], [0.0, 0.07, 0], { color: '#c9a040', round: 0.3, edge: 'sharp' });
    b.each(5, (i) => b.box([0.03, 0.02, 0.06], [-0.18 + i * 0.09, 0.03, 0.18], { color: 'brass', edge: 'sharp' }));
    b.cyl([0.09, 1.6, 0.09], [0.32, 0.9, 0], { color: '#d4a940', taper: 0.85 });
    b.cyl([0.16, 0.18, 0.16], [0.32, 1.78, 0], { color: '#d4a940', taper: 1.3 });
    b.ball([0.2, 0.08, 0.2], [0.32, 1.9, 0], { color: '#d4a940' });
    b.box([0.3, 1.55, 0.12], [-0.13, 0.82, 0], { color: '#a8743a', rot: [0, 0, 22], round: 0.3 });
    b.box([0.22, 1.5, 0.2], [-0.19, 0.84, -0.06], { color: '#8a5a2a', rot: [0, 0, 22], round: 0.4 });
    b.each(3, (i) => b.cyl([0.06, 0.02, 0.05], [-0.06 - i * 0.14, 0.5 + i * 0.35, 0.065], { color: '#3a2412', rot: [90, 0, 22], noInk: true }));
    const neck: V[] = [[-0.42, 1.55, 0], [-0.25, 1.62, 0], [-0.05, 1.56, 0], [0.12, 1.66, 0], [0.32, 1.72, 0]];
    path(b, neck, 0.075, '#8a5a2a');
    const ny = (x: number) => {
      for (let i = 0; i < neck.length - 1; i++) if (x <= neck[i + 1][0]) return neck[i][1] + ((x - neck[i][0]) / (neck[i + 1][0] - neck[i][0])) * (neck[i + 1][1] - neck[i][1]);
      return 1.7;
    };
    let k = 0;
    for (let x = -0.33; x < 0.27; x += 0.035) {
      const top = ny(x) - 0.04, bot = Math.max(0.16, 0.87 - 2.47 * (x + 0.13));
      if (top - bot < 0.12) continue;
      b.stick([x, top, 0.02], [x, bot, 0.02], 0.005, k % 7 === 0 ? '#c62828' : '#f2e8d0', { noInk: true });
      k++;
    }
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 2 }), A.say('Plinnng!', 2)), A.anim('pulse')] }).done();
  }),
  // A whaling harpoon, iron head with barbs on a long ash shaft, standing in its tub of coiled line; it launches.
  e('harpoon', 'armory', 'spears', () => {
    const b = m('harpoon');
    b.cyl([0.5, 0.3, 0.5], [0, 0.15, 0], { color: '#8a5a32', taper: 0.95 });
    for (const y of [0.06, 0.24]) b.torus([0.51, 0.51, 0.03], [0, y, 0], { color: 'iron', rot: [90, 0, 0], tube: 0.08 });
    for (const y of [0.26, 0.29, 0.32]) b.torus([0.38 - (y - 0.26) * 2, 0.38 - (y - 0.26) * 2, 0.05], [0, y, 0], { color: '#d9c38a', rot: [90, 0, 0], tube: 0.2 });
    b.stick([0, 0.2, 0], [0, 2.0, 0], 0.045, '#c8a06a', { name: 'harpoon', pivot: [0, 0.2, 0] });
    b.stick([0, 2.0, 0], [0, 2.25, 0], 0.025, 'iron', { parent: 'harpoon' });
    b.cone([0.08, 0.16, 0.03], [0, 2.32, 0], { color: 'steel', parent: 'harpoon', edge: 'sharp' });
    b.pair((s) => b.rod([0, 2.3, 0], [s * 0.07, 2.2, 0], 0.022, 'steel', { parent: 'harpoon' }));
    b.torus([0.06, 0.06, 0.015], [0, 1.95, 0], { color: 'iron', rot: [90, 0, 0], parent: 'harpoon' });
    path(b, [[0, 1.9, 0.03], [0.1, 1.4, 0.06], [0.08, 0.8, 0.1], [0.14, 0.33, 0.12]], 0.018, '#d9c38a');
    return b
      .act({ click: [A.pose('harpoon', { rot: [-35, 0, 0], dur: 0.4 }), A.par(A.pose('harpoon', { rot: [-55, 0, 0], move: [0, 0.6, 1.2], dur: 0.3 }), A.say('Thwump!', 1.2)), A.wait(0.8), A.pose('harpoon', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // A crispy hash brown in its paper sleeve, shredded potato on the top; it steams and crunches.
  e('hash brown', 'food', 'breakfast', () => {
    const b = m('hash brown');
    b.ball([0.1, 0.075, 0.022], [0, 0.065, 0], { color: '#d9a040' });
    b.each(7, (i) => b.rod([-0.035 + i * 0.012, 0.05 + (i % 2) * 0.01, 0.011], [-0.03 + i * 0.012, 0.09 - (i % 3) * 0.006, 0.011], 0.004, i % 2 ? '#b87a2a' : '#e8b860', { noInk: true }));
    b.box([0.106, 0.05, 0.03], [0, 0.025, 0], { color: 'white', round: 0.15, edge: 'sharp' });
    b.box([0.04, 0.02, 0.004], [0, 0.026, 0.016], { color: '#d32f2f', edge: 'sharp' });
    return b.act({ click: [A.par(A.effect('steam', { dur: 1.5 }), A.anim('wobble')), A.say('Crunch!', 1)] }).done();
  }),
  // A felt fedora: wide brim, pinched crown with its centre crease, a ribbon band and a feather; it tips itself.
  e('hat', 'wardrobe', 'hats', () =>
    m('hat')
      .cyl([0.34, 0.012, 0.3], [0, 0.006, 0], { color: '#5a4a3c', name: 'hat', pivot: [0, 0, 0] })
      .cyl([0.19, 0.12, 0.17], [0, 0.072, 0], { color: '#5a4a3c', taper: 0.82, parent: 'hat' })
      .box([0.03, 0.03, 0.11], [0, 0.128, -0.01], { color: '#4a3c30', round: 0.6, parent: 'hat' })
      .ball([0.04, 0.05, 0.03], [0.05, 0.11, 0.06], { color: '#4a3c30', parent: 'hat', noInk: true })
      .ball([0.04, 0.05, 0.03], [-0.05, 0.11, 0.06], { color: '#4a3c30', parent: 'hat', noInk: true })
      .cyl([0.193, 0.026, 0.173], [0, 0.03, 0], { color: '#1e1e1e', parent: 'hat' })
      .capsule([0.012, 0.09, 0.006], [0.085, 0.07, 0.03], { color: '#c62828', rot: [0, 0, -35], parent: 'hat' })
      .act({ click: [A.pose('hat', { move: [0, 0.08, 0], rot: [-15, 0, 0], dur: 0.3 }), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.anim('hop')] })
      .done(),
  ),
  // A turned wooden coat and hat stand, 1.8 m: tripod feet, a ring of hooks, a bowler hat that comes off and a
  // scarf hanging from a hook.
  e('hat stand', 'home', 'furniture', () => {
    const b = m('hat stand', { edge: 'sharp' });
    b.stick([0, 0, 0], [0, 1.72, 0], 0.05, 'darkwood', { name: 'pole' });
    b.ball(0.08, [0, 1.76, 0], { color: 'darkwood', parent: 'pole', edge: 'soft' });
    b.cyl([0.09, 0.06, 0.09], [0, 0.32, 0], { color: 'darkwood' });
    around(3, 0.32, 0.5).forEach(([x, z]) => b.rod([0, 0.32, 0], [x, 0.02, z], 0.04, 'darkwood'));
    around(6, 0.13).forEach(([x, z]) => b.rod([0, 1.56, 0], [x, 1.66, z], 0.022, 'darkwood', { parent: 'pole' }).ball(0.035, [x * 1.05, 1.67, z * 1.05], { color: 'darkwood', parent: 'pole', edge: 'soft' }));
    b.cyl([0.3, 0.012, 0.27], [0.12, 1.66, 0.02], { color: '#1e1e1e', rot: [0, 0, -18], name: 'bowler', parent: 'pole', piece: true, edge: 'soft' });
    b.ball([0.19, 0.15, 0.18], [0.11, 1.72, 0.02], { color: '#1e1e1e', rot: [0, 0, -18], parent: 'bowler', edge: 'soft' });
    b.cyl([0.195, 0.02, 0.185], [0.115, 1.68, 0.02], { color: '#8a2a2a', rot: [0, 0, -18], parent: 'bowler', edge: 'soft' });
    b.rod([-0.11, 1.62, 0.06], [-0.13, 1.1, 0.08], 0.07, '#2a8a8a', { edge: 'soft' });
    b.rod([-0.11, 1.62, 0.06], [-0.04, 1.2, 0.12], 0.07, '#2a8a8a', { edge: 'soft' });
    b.box([0.08, 0.06, 0.02], [-0.13, 1.06, 0.08], { color: '#f2e8d0', noInk: true });
    return b.act({ click: [[A.detach('bowler', 'bowler')], [A.reattach('bowler')]] }).done();
  }),
  // A red aloha shirt with hibiscus print, palm leaves, an open camp collar and coconut buttons.
  e('hawaiian shirt', 'wardrobe', 'shirts', () => {
    const b = shirt('hawaiian shirt', { color: '#d94a3a', len: 0.75, buttons: '#f2e8d0' });
    const fl: Array<[number, number, string]> = [[-0.12, 0.6, '#f6d24a'], [0.1, 0.5, 'white'], [-0.08, 0.3, 'white'], [0.12, 0.2, '#f6d24a'], [-0.15, 0.12, 'pink'], [0.08, 0.66, 'pink']];
    fl.forEach(([x, y, c]) => {
      around(5, 0.022).forEach(([dx, dy]) => b.ball([0.03, 0.03, 0.008], [x + dx, y + dy, 0.112], { color: c, noInk: true }));
      b.ball([0.015, 0.015, 0.01], [x, y, 0.115], { color: 'orange', noInk: true });
    });
    b.pair((s) => b.ball([0.1, 0.035, 0.012], [s * 0.15, 0.4, 0.11], { color: '#2e7d32', noInk: true, rot: [0, 0, s * 35] }));
    return b.act({ click: [A.anim('bounce', 2), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A heap of loose hay, stalks poking out every way; it rustles and puffs dust.
  e('hay', 'farm', 'hay', () => {
    const b = m('hay').ball([0.9, 0.45, 0.7], [0, 0.2, 0], { color: '#e8c860' }).ball([0.55, 0.35, 0.45], [0.05, 0.36, 0], { color: '#ecd070' }).ball([0.4, 0.25, 0.35], [-0.25, 0.25, 0.1], { color: '#dcb850' });
    const pts: Array<[number, number, number, number, number, number]> = [[-0.3, 0.3, 0.2, -0.55, 0.38, 0.3], [0.2, 0.4, 0.1, 0.45, 0.5, 0.2], [0, 0.44, 0, 0.1, 0.58, 0.05], [0.3, 0.2, 0.25, 0.55, 0.1, 0.38], [-0.1, 0.35, 0.3, -0.2, 0.45, 0.45], [0.1, 0.42, -0.1, 0.15, 0.55, -0.3], [-0.2, 0.36, -0.15, -0.45, 0.42, -0.25]];
    pts.forEach(([a, b2, c, d, e2, f]) => b.rod([a, b2, c], [d, e2, f], 0.012, '#d9b450'));
    b.rod([-0.6, 0.01, 0.3], [-0.4, 0.01, 0.45], 0.012, '#d9b450').rod([0.5, 0.01, -0.3], [0.7, 0.01, -0.1], 0.012, '#d9b450');
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('dust', { dur: 1.5 }), A.say('Rustle rustle', 1.5))] }).done();
  }),
  // A round hay bale, 1.2 m across: netting wrap bands and the rolled spiral on each end; it rolls away and back.
  e('hay bale', 'farm', 'hay', () => {
    const b = m('hay bale');
    b.cyl([1.2, 1.2, 1.2], [0, 0.6, 0], { color: '#e3c062', rot: [0, 0, 90], name: 'bale' });
    b.pair((s) => {
      for (const d of [0.95, 0.68, 0.42, 0.18]) b.torus([d, d, 0.03], [s * 0.6, 0.6, 0], { color: '#c9a040', rot: [0, 90, 0], noInk: true, parent: 'bale' });
    });
    for (const x of [-0.42, -0.14, 0.14, 0.42]) b.cyl([1.22, 0.025, 1.22], [x, 0.6, 0], { color: '#f2e2a8', rot: [0, 0, 90], noInk: true, parent: 'bale' });
    around(10, 0.6).forEach(([z, y], i) => b.rod([0.5, 0.6 + y, z], [0.66, 0.6 + y * 1.05, z * 1.05], 0.02, '#d9b450', { noInk: true, parent: 'bale', name: `straw${i}` }));
    return b
      .act({ click: [A.pose('bale', { move: [0, 0, 1.6], rot: [153, 0, 0], dur: 1.2 }), A.wait(0.5), A.pose('bale', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1.2 }), A.effect('dust', { dur: 0.8 })] })
      .done();
  }),
  // An old-fashioned haystack built round a pole, its thatched top and loose skirt, a pitchfork leaning on it; a
  // mouse runs out of it.
  e('haystack', 'farm', 'hay', () => {
    const b = m('haystack').cyl([2.5, 1.3, 2.5], [0, 0.65, 0], { color: '#e3c062', taper: 0.88 }).ball([2.25, 2.1, 2.25], [0, 1.4, 0], { color: '#e3c062' });
    b.cone([1.2, 0.8, 1.2], [0, 2.55, 0], { color: '#d9b450' });
    b.stick([0, 2.6, 0], [0, 3.25, 0], 0.08, 'wood');
    around(10, 1.2).forEach(([x, z], i) => b.rod([x, 0.15, z], [x * 1.2, 0.02 + (i % 2) * 0.1, z * 1.2], 0.04, '#d9b450'));
    around(6, 0.9, 0.3).forEach(([x, z]) => b.rod([x, 1.4, z * 1.15], [x * 1.25, 1.1, z * 1.35], 0.035, '#c9a040', { noInk: true }));
    b.rod([1.0, 0.0, 0.9], [0.75, 1.6, 0.65], 0.04, 'wood');
    b.pair((s) => b.rod([0.72 + s * 0.06, 1.58, 0.63], [0.66 + s * 0.08, 1.9, 0.6], 0.02, 'steel'));
    b.rod([0.72, 1.6, 0.63], [0.72, 1.82, 0.6], 0.02, 'steel');
    return b
      .act({
        click: [
          A.par(A.anim('wobble'), A.effect('dust', { dur: 1 })),
          A.spawn('ms', 'mouse', { rel: 'front', of: 'self', dist: 'close' }),
          A.say('Squeak!', 1.2, 'ms'),
          A.move('ms', { rel: 'away', of: 'self', dist: 'near' }, { speed: 'run' }),
          A.remove('ms', 'fade'),
        ],
      })
      .done();
  }),
  // A hazel: several stems from the ground, a broad leafy crown with catkins and nut clusters; it shakes and a
  // squirrel comes for the nuts.
  e('hazel tree', 'garden', 'trees', () => {
    const b = m('hazel tree');
    around(5, 0.18, 0.4).forEach(([x, z], i) => b.rod([x, 0, z], [x * 4.5, 2.6 + (i % 2) * 0.4, z * 4.5], 0.15, 'bark'));
    b.ball([3.4, 2.4, 3.2], [0, 3.6, 0], { color: '#5d9a45', name: 'top', pivot: [0, 0, 0] });
    for (const [x, y, z] of [[1.4, 3.1, 0.4], [-1.4, 3.2, 0.2], [0.2, 4.5, -0.3], [0.3, 3.2, 1.3], [-0.5, 3.4, -1.2]] as const) b.ball(1.7, [x, y, z], { color: '#6aab4e', parent: 'top' });
    for (const [x, z] of [[0.8, 1.4], [-0.6, 1.35], [1.6, 0.6], [-1.7, 0.5], [0.1, 1.6], [1.1, -1.2]] as const) b.capsule([0.06, 0.3, 0.06], [x, 2.5, z], { color: '#e0c050', parent: 'top' });
    for (const [x, y, z] of [[0.6, 3.0, 1.6], [-0.9, 3.4, 1.4], [1.7, 3.6, 0.9]] as const) {
      b.ball(0.13, [x, y, z], { color: '#8a5a2a', parent: 'top' });
      b.ball(0.13, [x + 0.12, y - 0.05, z], { color: '#8a5a2a', parent: 'top' });
      b.ball([0.2, 0.1, 0.16], [x + 0.06, y + 0.07, z], { color: '#9ac85a', parent: 'top', noInk: true });
    }
    return b
      .act({
        click: [
          [A.pose('top', { rot: [0, 0, 4], dur: 0.25 }), A.pose('top', { rot: [0, 0, -4], dur: 0.3 }), A.pose('top', { rot: [0, 0, 0], dur: 0.25 }), A.spawn('nut', 'acorn', { rel: 'front', of: 'self', dist: 'close' }), A.wait(1.5), A.remove('nut', 'fade')],
          [A.spawn('sq', 'squirrel', { rel: 'near', of: 'self', dist: 'near' }), A.anim('hop', 2, 'sq'), A.say('Chitter!', 1.2, 'sq'), A.move('sq', { rel: 'away', of: 'self', dist: 'near' }, { speed: 'run', style: 'hop' }), A.remove('sq', 'fade')],
        ],
      })
      .done();
  }),
  // A worker in a yellow hazmat suit: hood, goggles, respirator, air tank; points at danger, then gives the
  // all-clear.
  e('hazmat suit', 'wardrobe', 'protective gear', () =>
    withAct(who('hazmat suit', { top: 'yellow', bottom: 'yellow', shoes: 'black', long: true, build: 1.2, pose: 'point', acc: [hat('hood', 'yellow'), face('goggles', 'darkgray'), face('mask', 'gray'), wear('belt', 'black'), wear('backpack', 'gray')] }), {
      click: [
        [A.par(A.anim('point'), A.say('Stay back, it is toxic!', 2))],
        [A.par(A.anim('thumbs_up'), A.say('All clear!', 1.5))],
      ],
    }),
  ),
  // A sculpted head on its neck: hair, ears, brows, blinking eyes, a nose and lips. It nods, then looks round.
  e('head', 'clinic', 'body parts', () => {
    const sk = 'skin2';
    const b = m('head').cyl([0.1, 0.08, 0.09], [0, 0.04, 0], { color: sk }).ball([0.17, 0.22, 0.2], [0, 0.17, 0], { color: sk, name: 'head', pivot: [0, 0.07, 0] });
    b.ball([0.13, 0.08, 0.14], [0, 0.085, 0.03], { color: sk, parent: 'head' });
    b.ball([0.185, 0.13, 0.21], [0, 0.235, -0.015], { color: '#5a3a22', parent: 'head' });
    b.ball([0.15, 0.05, 0.06], [0.01, 0.265, 0.08], { color: '#5a3a22', parent: 'head', rot: [0, 0, -8] });
    b.pair((s) => {
      b.ball([0.025, 0.05, 0.03], [s * 0.088, 0.165, -0.01], { color: sk, parent: 'head' });
      b.ball([0.026, 0.018, 0.01], [s * 0.035, 0.185, 0.093], { color: 'white', parent: 'head' });
      b.ball(0.012, [s * 0.035, 0.185, 0.099], { color: '#3a2a1e', eye: true, parent: 'head' });
      b.box([0.035, 0.007, 0.01], [s * 0.036, 0.208, 0.095], { color: '#4a2a18', rot: [0, 0, s * -8], parent: 'head', noInk: true });
    });
    b.ball([0.025, 0.04, 0.03], [0, 0.16, 0.103], { color: sk, parent: 'head' });
    b.ball([0.042, 0.012, 0.012], [0, 0.12, 0.095], { color: '#c06060', parent: 'head', noInk: true });
    return b
      .act({
        click: [
          [A.pose('head', { rot: [14, 0, 0], dur: 0.25 }), A.pose('head', { rot: [0, 0, 0], dur: 0.25 }), A.pose('head', { rot: [14, 0, 0], dur: 0.25 }), A.pose('head', { rot: [0, 0, 0], dur: 0.25 })],
          [A.pose('head', { rot: [0, 35, 0], dur: 0.5 }), A.pose('head', { rot: [0, -35, 0], dur: 0.8 }), A.pose('head', { rot: [0, 0, 0], dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A patterned head scarf wrapped on a display head, knotted under the chin; its tails flutter.
  e('head scarf', 'wardrobe', 'scarves', () => {
    const b = m('head scarf').cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: '#3a3633', edge: 'sharp' }).cyl([0.07, 0.1, 0.07], [0, 0.07, 0], { color: '#efe4d4' });
    b.ball([0.19, 0.22, 0.19], [0, 0.22, -0.02], { color: '#c0392b' });
    b.ball([0.13, 0.16, 0.07], [0, 0.2, 0.065], { color: '#efe4d4' });
    b.pair((s) => b.ball([0.02, 0.01, 0.01], [s * 0.03, 0.215, 0.099], { color: '#3a2a1e' }));
    b.box([0.03, 0.006, 0.01], [0, 0.165, 0.098], { color: '#c06060', noInk: true });
    around(11, 0.088, 2).forEach(([x, z], i) => b.ball([0.022, 0.022, 0.018], [x, 0.23 + (i % 3) * 0.045, z - 0.02], { color: i % 2 ? 'white' : '#f6d24a', noInk: true }));
    b.ball(0.045, [0.0, 0.11, 0.08], { color: '#c0392b' });
    b.rod([0, 0.11, 0.09], [0.05, 0.03, 0.11], 0.035, '#c0392b', { name: 'tail1', pivot: [0, 0.11, 0.09] });
    b.rod([0, 0.11, 0.09], [-0.04, 0.04, 0.12], 0.035, '#c0392b', { name: 'tail2', pivot: [0, 0.11, 0.09] });
    return b
      .act({ click: [A.par(A.pose('tail1', { rot: [-35, 0, 15], dur: 0.3 }), A.pose('tail2', { rot: [-25, 0, -20], dur: 0.3 })), A.par(A.pose('tail1', { rot: [-10, 0, -5], dur: 0.25 }), A.pose('tail2', { rot: [-40, 0, 5], dur: 0.25 })), A.par(A.pose('tail1', { rot: [0, 0, 0], dur: 0.3 }), A.pose('tail2', { rot: [0, 0, 0], dur: 0.3 }))] })
      .done();
  }),
  // A velvet alice band standing on its ends, a bow on top; it bounces.
  e('headband', 'wardrobe', 'hair accessories', () =>
    m('headband')
      .arc([0.135, 0.15, 0.016], [0, 0.055, 0], { color: '#e05a8a', arc: 280, tube: 0.12 })
      .ball([0.04, 0.03, 0.014], [0.022, 0.135, 0.004], { color: '#ad1457', rot: [0, 0, 20] })
      .ball([0.04, 0.03, 0.014], [-0.022, 0.135, 0.004], { color: '#ad1457', rot: [0, 0, -20] })
      .ball(0.016, [0, 0.134, 0.008], { color: '#880e4f' })
      .act({ click: [A.anim('bounce', 2), A.effect('sparkle', { dur: 1 })] })
      .done(),
  ),
  // A tufted upholstered headboard on a wooden frame at the head of a made bed, with two reading lamps that switch.
  e('headboard', 'home', 'bedroom', () => {
    const b = m('headboard', { edge: 'sharp' });
    b.box([1.7, 1.25, 0.1], [0, 0.72, -1.0], { color: '#6a4a2e', round: 0.1 });
    b.box([1.5, 0.75, 0.08], [0, 0.98, -0.93], { color: '#5a6fa8', round: 0.4, edge: 'soft' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) b.ball(0.035, [-0.6 + c * 0.24 + (r % 2) * 0.12, 0.75 + r * 0.22, -0.885], { color: '#3f4f80', noInk: true });
    b.pair((s) => {
      b.box([0.1, 1.35, 0.12], [s * 0.85, 0.675, -1.0], { color: '#4a3220', round: 0.1 });
      b.ball(0.09, [s * 0.85, 1.4, -1.0], { color: '#4a3220' });
      b.rod([s * 0.7, 1.35, -0.95], [s * 0.7, 1.45, -0.75], 0.025, 'brass');
      b.cyl([0.14, 0.1, 0.14], [s * 0.7, 1.42, -0.72], { color: 'brass', taper: 0.6 });
      b.ball([0.08, 0.04, 0.08], [s * 0.7, 1.37, -0.72], { color: '#fff6c8', glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light' } });
      b.ball([0.55, 0.14, 0.32], [s * 0.36, 0.6, -0.72], { color: 'white', edge: 'soft' });
    });
    b.box([1.6, 0.25, 1.95], [0, 0.18, 0.05], { color: '#6a4a2e', round: 0.1 });
    b.box([1.5, 0.22, 1.9], [0, 0.42, 0.05], { color: '#f2efe8', round: 0.4, edge: 'soft' });
    b.box([1.56, 0.06, 1.2], [0, 0.55, 0.42], { color: '#8aa8d8', round: 0.4, edge: 'soft' });
    return b.act({ click: [[A.operate('lamp', 'on'), A.say('Click.', 1)], [A.operate('lamp', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A classic round car headlight: chrome bucket on a mounting bracket, ribbed glass lens and the lamp behind it.
  e('headlight', 'garage', 'car parts', () =>
    m('headlight', { edge: 'sharp' })
      .box([0.14, 0.025, 0.12], [0, 0.0125, 0], { color: '#3a3d42' })
      .box([0.04, 0.09, 0.04], [0, 0.07, -0.03], { color: '#3a3d42' })
      .cyl([0.2, 0.16, 0.2], [0, 0.21, -0.02], { color: 'silver', rot: [90, 0, 0], taper: 0.75, edge: 'soft' })
      .torus([0.22, 0.22, 0.03], [0, 0.21, 0.06], { color: 'silver', tube: 0.12 })
      .ball([0.19, 0.19, 0.05], [0, 0.21, 0.065], { color: '#fff3b0', glow: true, name: 'lamp', mover: { kind: 'light', on: true } })
      .box([0.16, 0.004, 0.004], [0, 0.17, 0.09], { color: '#e8e0b0', noInk: true })
      .box([0.17, 0.004, 0.004], [0, 0.21, 0.092], { color: '#e8e0b0', noInk: true })
      .box([0.16, 0.004, 0.004], [0, 0.25, 0.09], { color: '#e8e0b0', noInk: true })
      .act({ click: [[A.operate('lamp', 'off')], [A.operate('lamp', 'on'), A.say('Flash!', 1)]] })
      .done(),
  ),
  // Over-ear headphones standing on their cups: padded band, sliders, cushions; music thumps out.
  e('headphones', 'music', 'audio', () => {
    const b = m('headphones');
    b.arc([0.22, 0.24, 0.035], [0, 0.07, 0], { color: '#1e1e1e', tube: 0.12, arc: 190 });
    b.arc([0.2, 0.22, 0.045], [0, 0.07, 0], { color: '#3a3a3a', tube: 0.08, arc: 70, noInk: true });
    b.pair((s) => {
      b.stick([s * 0.105, 0.09, 0], [s * 0.112, 0.06, 0], 0.012, 'silver');
      b.cyl([0.09, 0.04, 0.1], [s * 0.115, 0.05, 0], { color: '#c62828', rot: [0, 0, 90], edge: 'sharp' });
      b.cyl([0.085, 0.03, 0.095], [s * 0.088, 0.05, 0], { color: '#1e1e1e', rot: [0, 0, 90] });
      b.cyl([0.05, 0.005, 0.05], [s * 0.137, 0.05, 0], { color: 'silver', rot: [0, 0, 90], noInk: true });
    });
    return b.act({ click: [A.par(A.anim('bounce', 3), A.say('Boom tss boom tss', 2))] }).done();
  }),
  // A behind-the-ear hearing aid: the curved beige case, its tube and the soft ear dome; it beeps.
  e('hearing aid', 'clinic', 'medical devices', () => {
    const b = m('hearing aid');
    path(b, [[0, 0.008, 0], [0.01, 0.03, 0], [0.002, 0.052, 0]], 0.016, '#d8c4a8');
    b.box([0.006, 0.006, 0.004], [0.012, 0.03, 0.007], { color: '#8a8e92', edge: 'sharp' });
    path(b, [[0.002, 0.058, 0], [-0.012, 0.064, 0], [-0.026, 0.055, 0], [-0.03, 0.035, 0]], 0.003, '#cfe8f2');
    return b.ball(0.012, [-0.03, 0.028, 0], { color: 'white' }).ball(0.004, [0.006, 0.045, 0.007], { color: '#4caf50', glow: true }).act({ click: [A.anim('wobble'), A.say('Beep!', 1)] }).done();
  }),
  // A hearse at real size (5.9 m long): a long black loft body with a tall rear compartment, curtained side
  // windows with chrome landau bars, a chrome grille and bumpers, headlights, wheels on axles and a top-hinged rear
  // door that lifts open.
  e('hearse', 'garage', 'cars', () => {
    const b = m('hearse', { view: 'side', edge: 'sharp' });
    b.loft([1.9, 0.78, 5.9], [0, 0.66, 0], [[0, 0.92, 0.85, 0.06], [0.04, 0.98, 0.95, 0], [0.5, 1, 1, 0], [0.86, 0.98, 0.92, -0.02], [1, 0.9, 0.62, -0.1]], { color: '#121214', boxy: 0.75, name: 'body', edge: 'soft' });
    b.loft([1.74, 0.78, 4.6], [0, 1.42, -0.6], [[0, 0.97, 1, 0], [0.68, 1, 1, 0], [0.76, 0.98, 0.98, 0], [0.9, 0.9, 0.78, -0.11], [1, 0.84, 0.3, -0.35]], { color: '#18181c', boxy: 0.85, edge: 'soft' });
    b.box([1.6, 0.5, 0.05], [0, 1.47, 1.42], { color: '#3a4656', rot: [-55, 0, 0] });
    b.pair((s) => {
      b.box([0.05, 0.42, 0.9], [s * 0.87, 1.45, 0.55], { color: '#3a4656', round: 0.2 });
      b.box([0.05, 0.48, 2.4], [s * 0.87, 1.42, -1.4], { color: '#3a4656', round: 0.1 });
      b.each(6, (i) => b.box([0.06, 0.4, 0.12], [s * 0.875, 1.43, -2.45 + i * 0.42], { color: '#e8e0cc', noInk: true }));
      path(b, [[s * 0.885, 1.7, -2.25], [s * 0.89, 1.45, -2.55], [s * 0.885, 1.2, -2.3]], 0.05, 'silver');
      b.box([0.03, 0.03, 4.9], [s * 0.95, 0.92, -0.1], { color: 'silver', noInk: true });
      b.box([0.03, 0.03, 0.18], [s * 0.94, 1.1, 0.4], { color: 'silver' });
      b.ball([0.36, 0.2, 0.08], [s * 0.6, 0.78, 2.94], { color: '#fff3b0', glow: true, name: s > 0 ? 'lightL' : 'lightR', mover: { kind: 'light', on: true } });
      b.box([0.3, 0.14, 0.06], [s * 0.66, 0.85, -2.95], { color: '#d32f2f', glow: true });
    });
    b.box([0.9, 0.38, 0.06], [0, 0.72, 2.95], { color: 'silver', round: 0.2 });
    b.each(7, (i) => b.box([0.03, 0.32, 0.05], [-0.36 + i * 0.12, 0.72, 2.97], { color: '#2b2b2b', noInk: true }));
    b.box([1.95, 0.16, 0.18], [0, 0.42, 2.95], { color: 'silver', round: 0.4 });
    b.box([1.95, 0.16, 0.18], [0, 0.42, -2.95], { color: 'silver', round: 0.4 });
    b.box([1.5, 0.95, 0.06], [0, 1.18, -2.94], { color: '#18181c', round: 0.15, name: 'tailgate', pivot: [0, 1.66, -2.94], mover: { kind: 'swing', axis: 'x', amount: 80 } });
    b.box([1.2, 0.45, 0.04], [0, 1.35, -2.97], { color: '#3a4656', parent: 'tailgate' });
    b.box([1.2, 0.4, 2.0], [0, 0.95, -1.7], { color: '#6a4a2e', round: 0.2 });
    b.ball([0.6, 0.18, 0.5], [0, 1.2, -1.4], { color: '#f2f2f2' });
    const wz = [1.85, -1.95];
    wz.forEach((z, i) => b.pair((s) => wheel(b, 0.7, [s * 0.86, 0.35, z], { name: `wheel${i}${s > 0 ? 'L' : 'R'}`, hub: 'silver' })));
    return b
      .act({
        click: [
          [A.operate('tailgate', 'open'), A.wait(2.5), A.operate('tailgate', 'close')],
          [A.operate('light', 'off'), A.wait(0.3), A.operate('light', 'on'), A.wait(0.3), A.operate('light', 'off'), A.wait(0.3), A.operate('light', 'on'), A.say('Honk.', 1)],
        ],
      })
      .done();
  }),
  // An anatomical heart: ventricles and atria, the aortic arch, pulmonary artery and veins, coronary vessels; it
  // beats.
  e('heart (organ)', 'clinic', 'organs', () => {
    const red = '#b0303a';
    const b = m('heart (organ)').ball([0.09, 0.11, 0.08], [0, 0.065, 0], { color: red, rot: [0, 0, -15], name: 'heart', pivot: [0, 0.06, 0] });
    b.ball([0.045, 0.045, 0.05], [-0.035, 0.11, -0.005], { color: '#9a2a34', parent: 'heart' }).ball([0.04, 0.04, 0.045], [0.035, 0.11, -0.01], { color: '#9a2a34', parent: 'heart' });
    b.arc([0.05, 0.06, 0.02], [0.0, 0.13, 0], { color: '#d04858', tube: 0.35, parent: 'heart' });
    b.stick([0.02, 0.13, 0], [0.025, 0.16, 0], 0.012, '#d04858', { parent: 'heart' }).stick([-0.005, 0.15, 0], [-0.005, 0.175, 0], 0.012, '#d04858', { parent: 'heart' });
    b.rod([0.01, 0.1, 0.03], [0.03, 0.16, 0.02], 0.02, '#4e6fc8', { parent: 'heart' });
    b.rod([-0.045, 0.08, 0], [-0.05, 0.16, -0.01], 0.022, '#4e6fc8', { parent: 'heart' });
    path(b, [[-0.01, 0.1, 0.04], [0.005, 0.07, 0.042], [0.0, 0.03, 0.03]], 0.005, '#e8c060', { noInk: true, parent: 'heart' });
    path(b, [[0.02, 0.1, 0.036], [0.03, 0.07, 0.035]], 0.004, '#4e6fc8', { noInk: true, parent: 'heart' });
    return b
      .act({ click: [A.pose('heart', { scale: 1.12, dur: 0.12 }), A.pose('heart', { scale: 1, dur: 0.18 }), A.pose('heart', { scale: 1.12, dur: 0.12 }), A.pose('heart', { scale: 1, dur: 0.3 }), A.say('Ba-dum, ba-dum', 1.5)] })
      .done();
  }),
  // A glossy red heart symbol; it beats and gives off little hearts.
  e('heart (shape)', 'ideas', 'shapes', () =>
    m('heart (shape)')
      .heart(0.09, [0, 0.055, 0], { color: '#e53935' })
      .ball([0.018, 0.012, 0.006], [0.028, 0.082, 0.014], { color: '#ffcdd2', noInk: true })
      .act({ click: [A.par(A.anim('pulse', 2), A.effect('hearts', { dur: 1.5 }))] })
      .done(),
  ),
  // A ceiling heat detector (shown on its back): mounting plate, a vented dome, the sensor tip, a test button
  // and an LED; it alarms.
  e('heat detector', 'home', 'safety', () =>
    m('heat detector', { edge: 'sharp' })
      .cyl([0.12, 0.016, 0.12], [0, 0.008, 0], { color: '#f4f4f0', round: 0.3 })
      .cyl([0.105, 0.035, 0.105], [0, 0.034, 0], { color: 'white', taper: 0.72, round: 0.3 })
      .cyl([0.04, 0.012, 0.04], [0, 0.057, 0], { color: '#e8e8e4' })
      .ball(0.018, [0, 0.067, 0], { color: '#3a3d42' })
      .box([0.02, 0.006, 0.012], [0.03, 0.05, 0.03], { color: '#d0d0cc' })
      .ball(0.008, [-0.035, 0.044, 0.03], { color: '#ff3b30', glow: true, name: 'led', mover: { kind: 'light' } })
      .act({ click: [A.operate('led', 'on'), A.par(A.anim('shake', 2), A.say('BEEP! BEEP! BEEP!', 2)), A.operate('led', 'off')] })
      .done(),
  ),
  // An oil-filled column radiator on castors: nine fins, a control box with a dial and a power light; it warms up.
  e('heater', 'home', 'heating', () => {
    const b = m('heater', { edge: 'sharp' });
    b.each(9, (i) => b.box([0.045, 0.56, 0.16], [-0.2 + i * 0.05, 0.36, 0], { color: '#efeae0', round: 0.45 }));
    b.box([0.44, 0.04, 0.08], [0, 0.66, 0], { color: '#e8e2d6', round: 0.4 });
    b.box([0.1, 0.18, 0.18], [0.27, 0.36, 0], { color: '#d8d2c6', round: 0.2 });
    b.cyl([0.06, 0.02, 0.06], [0.27, 0.4, 0.095], { color: '#3a3633', rot: [90, 0, 0], name: 'dial' });
    b.box([0.008, 0.025, 0.006], [0.27, 0.41, 0.106], { color: 'white', parent: 'dial' });
    b.ball(0.016, [0.27, 0.32, 0.092], { color: '#ff7043', glow: true, name: 'lamp', mover: { kind: 'light' } });
    b.pair((s) => {
      b.box([0.06, 0.04, 0.3], [s * 0.15, 0.06, 0], { color: '#9a9690' });
      b.pair((t) => b.ball(0.04, [s * 0.15, 0.02, t * 0.13], { color: '#2b2b2b' }));
    });
    return b
      .act({
        click: [
          [A.pose('dial', { rot: [0, 0, -120], dur: 0.4 }), A.operate('lamp', 'on'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Tick... tick...', 2))],
          [A.pose('dial', { rot: [0, 0, 0], dur: 0.4 }), A.operate('lamp', 'off')],
        ],
      })
      .done();
  }),
  // A neatly clipped privet hedge, 3 m long: dense leafy surface over woody stems at the base; a bird flies out.
  e('hedge', 'garden', 'shrubs', () => {
    const b = m('hedge').box([3.0, 1.3, 0.95], [0, 0.72, 0], { color: '#3e7a34', round: 0.45, name: 'top', pivot: [0, 0, 0] });
    for (const [x, y, z] of [[-1.1, 1.3, 0.1], [-0.4, 1.36, -0.1], [0.4, 1.32, 0.15], [1.1, 1.3, -0.05], [-0.8, 0.8, 0.42], [0.2, 0.6, 0.45], [1.0, 0.9, 0.42], [-0.3, 1.05, 0.42], [1.3, 0.5, 0.35], [-1.3, 0.55, 0.38]] as const) b.ball([0.6, 0.32, 0.36], [x, y, z], { color: (x * 10) % 2 ? '#4f8f45' : '#5a9a4a', parent: 'top' });
    for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) b.rod([x, 0, 0], [x + 0.05, 0.12, 0.05], 0.05, 'bark');
    return b
      .act({
        click: [
          A.par(A.pose('top', { rot: [0, 0, 1.5], dur: 0.15 }), A.effect('dust', { dur: 0.6 })),
          A.pose('top', { rot: [0, 0, -1.5], dur: 0.15 }),
          A.pose('top', { rot: [0, 0, 0], dur: 0.15 }),
          A.spawn('bird', 'bird', { rel: 'above', of: 'self', dist: 'touch' }),
          A.say('Tweet!', 1, 'bird'),
          A.remove('bird', 'fly_away'),
        ],
      })
      .done();
  }),
  // An electric hedge trimmer lying on its side: the toothed blade bar, orange motor housing, the wrap-round front
  // handle and the rear grip with its trigger; the blade buzzes back and forth.
  e('hedge trimmer', 'garden', 'garden tools', () => {
    const b = m('hedge trimmer', { view: 'side', edge: 'sharp' });
    b.box([0.04, 0.018, 0.6], [0, 0.12, 0.42], { color: '#8a8e92', round: 0.2 });
    b.box([0.05, 0.012, 0.6], [0, 0.12, 0.42], { color: 'steel', round: 0.1, name: 'blade' });
    b.each(12, (i) => b.box([0.1, 0.008, 0.016], [0, 0.12, 0.16 + i * 0.048], { color: '#c8ccd0', round: 0.4, parent: 'blade' }));
    b.box([0.12, 0.14, 0.34], [0, 0.12, -0.04], { color: '#f57c00', round: 0.4, edge: 'soft' });
    b.box([0.1, 0.08, 0.1], [0, 0.06, -0.22], { color: '#3a3633', round: 0.3 });
    b.arc([0.22, 0.2, 0.03], [0, 0.17, 0.1], { color: '#1e1e1e', arc: 200, tube: 0.16, rot: [0, 90, 0] });
    b.torus([0.2, 0.16, 0.035], [0, 0.18, -0.3], { color: '#1e1e1e', rot: [0, 90, 0], tube: 0.25 });
    b.box([0.02, 0.04, 0.03], [0, 0.11, -0.28], { color: '#c62828' });
    b.rod([0, 0.06, -0.38], [0, 0.02, -0.6], 0.02, '#f2e8d0');
    return b
      .act({
        click: [
          A.par(A.say('Bzzzzzz!', 2), A.anim('shake', 2)),
          A.pose('blade', { move: [0, 0, 0.02], dur: 0.08 }),
          A.pose('blade', { move: [0, 0, -0.02], dur: 0.08 }),
          A.pose('blade', { move: [0, 0, 0.02], dur: 0.08 }),
          A.pose('blade', { move: [0, 0, -0.02], dur: 0.08 }),
          A.pose('blade', { move: [0, 0, 0.02], dur: 0.08 }),
          A.pose('blade', { move: [0, 0, 0], dur: 0.08 }),
          A.effect('dust', { dur: 0.8 }),
        ],
      })
      .done();
  }),
  // A pair of red stilettos: pointed toe box, arched sole, slim heels and an inner lining; they click-clack.
  e('heels', 'wardrobe', 'shoes', () => {
    const b = m('heels', { view: 'side' });
    b.pair((s) => {
      const x = s * 0.05, n = s > 0 ? 'shoeL' : 'shoeR';
      b.ball([0.062, 0.05, 0.065], [x, 0.096, -0.085], { color: '#c62828', name: n, pivot: [x, 0.0, 0.07] });
      b.stick([x, 0.0, -0.105], [x, 0.085, -0.098], 0.012, '#1e1e1e', { parent: n, taper: 1.6, edge: 'sharp' });
      b.box([0.058, 0.012, 0.15], [x, 0.058, -0.008], { color: '#c62828', rot: [33, 0, 0], parent: n });
      b.loft([0.066, 0.045, 0.1], [x, 0.022, 0.07], [[0, 1, 1, 0], [0.6, 0.95, 0.9, -0.05], [1, 0.3, 0.3, -0.2]], { color: '#c62828', parent: n });
      b.box([0.05, 0.006, 0.12], [x, 0.067, -0.02], { color: '#f2c6c6', rot: [33, 0, 0], parent: n, noInk: true });
      b.box([0.056, 0.006, 0.06], [x, 0.003, 0.07], { color: '#1e1e1e', parent: n });
    });
    return b
      .act({ click: [A.pose('shoeL', { rot: [-15, 0, 0], dur: 0.15 }), A.pose('shoeL', { rot: [0, 0, 0], dur: 0.1 }), A.pose('shoeR', { rot: [-15, 0, 0], dur: 0.15 }), A.pose('shoeR', { rot: [0, 0, 0], dur: 0.1 }), A.say('Click clack!', 1.2)] })
      .done();
  }),
  // A family heirloom: an antique gold pocket watch, lid open, its chain draped over a velvet cushion; the lid
  // snaps shut and opens.
  e('heirloom', 'home', 'decor', () => {
    const b = m('heirloom');
    b.box([0.2, 0.045, 0.16], [0, 0.0225, 0], { color: '#7a1f2e', round: 0.7 });
    b.each(4, (i) => b.ball(0.012, [i % 2 ? 0.085 : -0.085, 0.04, i < 2 ? 0.065 : -0.065], { color: 'gold', noInk: true }));
    b.cyl([0.09, 0.022, 0.09], [0, 0.09, 0], { color: 'gold', rot: [90, 0, 0], edge: 'sharp' });
    b.cyl([0.074, 0.006, 0.074], [0, 0.09, 0.01], { color: '#f6efdc', rot: [90, 0, 0] });
    b.box([0.004, 0.028, 0.004], [0, 0.1, 0.014], { color: '#1e1e1e' }).box([0.022, 0.004, 0.004], [0.01, 0.09, 0.014], { color: '#1e1e1e' });
    b.cyl([0.014, 0.014, 0.014], [0, 0.14, 0], { color: 'gold' }).torus([0.026, 0.026, 0.005], [0, 0.157, 0], { color: 'gold' });
    b.cyl([0.09, 0.008, 0.09], [0.0, 0.09, 0.016], { color: '#d4af37', rot: [90, 0, 0], name: 'lid', pivot: [-0.045, 0.09, 0.016], mover: { kind: 'swing', axis: 'y', amount: -110, on: true }, edge: 'sharp' });
    b.cyl([0.06, 0.004, 0.06], [0.0, 0.09, 0.021], { color: '#b8962e', rot: [90, 0, 0], parent: 'lid', noInk: true });
    path(b, [[0, 0.168, 0], [0.04, 0.13, 0.01], [0.07, 0.07, 0.03], [0.08, 0.05, 0.06]], 0.005, 'gold');
    return b.act({ click: [[A.operate('lid', 'close'), A.say('Snap.', 1)], [A.operate('lid', 'open'), A.say('Tick tock', 1.5)]] }).done();
  }),
  // A light helicopter at real size (11 m with its tail): a loft fuselage with a glass nose canopy, a sliding cabin
  // door, engine cowling and mast, a tapering tail boom with fin and tail rotor, skids on struts, a beacon. The
  // rotors spin up, it lifts off, hovers and lands.
  e('helicopter', 'garage', 'aircraft', () => {
    const b = m('helicopter', { view: 'side', edge: 'sharp' });
    b.loft([2.0, 2.1, 5.2], [0, 1.6, 0.9], [[0, 0.45, 0.5, 0.18], [0.2, 0.85, 0.85, 0.05], [0.5, 1, 1, 0], [0.78, 0.96, 0.92, -0.03], [0.93, 0.75, 0.72, -0.08], [1, 0.35, 0.35, -0.12]], { color: '#c62828', name: 'body', edge: 'soft' });
    b.loft([1.84, 1.5, 2.2], [0, 1.8, 2.3], [[0, 0.95, 0.9, 0.05], [0.5, 1, 1, 0.02], [0.85, 0.8, 0.8, -0.08], [1, 0.3, 0.3, -0.2]], { color: '#5f8aa6', cut: 'top', parent: 'body', edge: 'soft' });
    b.loft([0.55, 0.6, 5.6], [0, 2.1, -3.8], [[0, 0.45, 0.45, 0.1], [1, 1, 1, 0]], { color: '#c62828', parent: 'body', edge: 'soft' });
    b.pair((s) => b.box([0.04, 0.12, 4.0], [s * 0.98, 1.3, 0.8], { color: 'white', parent: 'body', noInk: true }));
    b.box([0.06, 1.05, 1.1], [0.99, 1.75, 0.6], { color: '#b71c1c', round: 0.15, name: 'door', parent: 'body', mover: { kind: 'slide', axis: 'z', amount: -1.0 } });
    b.box([0.07, 0.5, 0.8], [1.0, 2.0, 0.6], { color: '#5f8aa6', parent: 'door' });
    b.box([0.06, 0.06, 0.15], [1.02, 1.6, 0.95], { color: 'silver', parent: 'door' });
    b.box([1.0, 0.5, 1.6], [0, 2.75, -0.1], { color: '#a31515', round: 0.4, parent: 'body', edge: 'soft' });
    b.pair((s) => b.box([0.05, 0.25, 0.6], [s * 0.5, 2.75, -0.6], { color: '#3a3633', parent: 'body' }));
    b.cyl([0.22, 0.45, 0.22], [0, 3.15, 0.2], { color: '#5a5e62', parent: 'body' });
    b.cyl([0.4, 0.15, 0.4], [0, 3.38, 0.2], { color: '#3a3d42', name: 'blades', parent: 'body', mover: { kind: 'spin', axis: 'y', amount: 900 } });
    b.box([0.28, 0.05, 11], [0, 3.42, 0.2], { color: '#2b2d31', parent: 'blades', round: 0.3 });
    b.box([11, 0.05, 0.28], [0, 3.42, 0.2], { color: '#2b2d31', parent: 'blades', round: 0.3 });
    b.wedge([1.0, 1.25, 0.12], [0, 2.75, -6.35], { color: '#c62828', rot: [0, 90, -12], apex: 0.4, parent: 'body' });
    b.box([1.4, 0.07, 0.4], [0, 2.15, -5.8], { color: '#c62828', parent: 'body' });
    b.cyl([0.14, 0.18, 0.14], [0.2, 2.6, -6.5], { color: '#3a3d42', rot: [0, 0, 90], name: 'tailrotor', parent: 'body', mover: { kind: 'spin', axis: 'x', amount: 1440 } });
    b.box([0.04, 1.5, 0.14], [0.3, 2.6, -6.5], { color: '#2b2d31', parent: 'tailrotor' });
    b.box([0.04, 0.14, 1.5], [0.3, 2.6, -6.5], { color: '#2b2d31', parent: 'tailrotor' });
    b.ball(0.18, [0, 3.05, -0.9], { color: '#ff3b30', glow: true, name: 'beacon', parent: 'body', mover: { kind: 'light' } });
    b.ball([0.25, 0.15, 0.2], [0, 0.72, 3.0], { color: '#fff6c8', glow: true, parent: 'body' });
    b.pair((s) => {
      b.stick([s * 0.85, 0.08, -1.1], [s * 0.85, 0.08, 2.3], 0.1, '#5a5e62', { parent: 'body' });
      b.rod([s * 0.85, 0.08, 2.3], [s * 0.85, 0.25, 2.65], 0.1, '#5a5e62', { parent: 'body' });
      b.rod([s * 0.85, 0.08, 1.6], [s * 0.55, 0.8, 1.5], 0.08, '#5a5e62', { parent: 'body' });
      b.rod([s * 0.85, 0.08, -0.4], [s * 0.55, 0.8, -0.4], 0.08, '#5a5e62', { parent: 'body' });
    });
    return withSockets(
      b
        .act({
          click: [
            [A.operate('beacon', 'on'), A.operate('blades', 'on'), A.operate('tailrotor', 'on'), A.say('Whup whup whup!', 2), A.wait(1), A.pose('body', { move: [0, 2.5, 0], dur: 1.5 }), A.pose('body', { move: [0, 2.8, 0.5], rot: [4, 0, 0], dur: 1 }), A.pose('body', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1.6 })],
            [A.operate('blades', 'off'), A.operate('tailrotor', 'off'), A.operate('beacon', 'off'), A.operate('door', 'open'), A.wait(2), A.operate('door', 'close')],
          ],
        })
        .done(),
      [{ name: 'seat', at: [0.4, 1.2, 1.9], kind: 'seat', part: 'body' }],
    );
  }),
  // A full-face motorcycle helmet: glossy shell with a racing stripe, chin bar and vents, and a smoked visor that
  // flips up.
  e('helmet', 'sports', 'protective gear', () =>
    m('helmet')
      .ball([0.28, 0.28, 0.32], [0, 0.16, -0.005], { color: '#d32f2f' })
      .box([0.2, 0.09, 0.12], [0, 0.055, 0.1], { color: '#d32f2f', round: 0.6 })
      .box([0.05, 0.02, 0.32], [0, 0.295, -0.01], { color: 'white', noInk: true, round: 0.5 })
      .cyl([0.21, 0.02, 0.24], [0, 0.015, -0.01], { color: '#1e1e1e' })
      .box([0.012, 0.006, 0.03], [-0.02, 0.07, 0.16], { color: '#1e1e1e', noInk: true })
      .box([0.012, 0.006, 0.03], [0.02, 0.07, 0.16], { color: '#1e1e1e', noInk: true })
      .ball([0.23, 0.11, 0.12], [0, 0.17, 0.11], { color: '#2a2f3a', name: 'visor', pivot: [0, 0.2, 0.0], mover: { kind: 'swing', axis: 'x', amount: -55 }, edge: 'sharp' })
      .cyl([0.03, 0.012, 0.03], [0.13, 0.19, 0.01], { color: '#8a8e92', rot: [0, 0, 90] })
      .cyl([0.03, 0.012, 0.03], [-0.13, 0.19, 0.01], { color: '#8a8e92', rot: [0, 0, 90] })
      .act({ click: [[A.operate('visor', 'open'), A.say('Click!', 1)], [A.operate('visor', 'close'), A.say('Click!', 1)]] })
      .done(),
  ),
  // A big half-globe (the vocabulary gives a hemisphere 12 m; a 6 m dome is the size of a playground globe): the
  // northern hemisphere in oceans and continents with lines of latitude, on a round plinth; it turns.
  e('hemisphere', 'ideas', 'shapes', () => {
    const b = m('hemisphere').cyl([6.6, 0.3, 6.6], [0, 0.15, 0], { color: '#d8d0c0', edge: 'sharp' });
    b.dome([6, 3, 6], [0, 1.8, 0], { color: '#3a7bd5', name: 'globe', pivot: [0, 0.3, 0] });
    for (const [la, lo, w] of [[20, -30, 1.6], [40, 35, 1.4], [15, 75, 1.2], [60, -10, 1.1], [25, 160, 1.5], [35, -110, 1.3], [50, 100, 1.2], [10, -150, 0.9]] as const) {
      const a = (la * Math.PI) / 180, o = (lo * Math.PI) / 180;
      b.ball([w, w * 0.4, w * 0.8], [3 * Math.cos(a) * Math.sin(o), 0.3 + 3 * Math.sin(a), 3 * Math.cos(a) * Math.cos(o)], { color: '#6aab4e', noInk: true, parent: 'globe', rot: [0, lo, -la] });
    }
    b.dome([1.4, 0.35, 1.4], [0, 3.15, 0], { color: 'white', parent: 'globe', noInk: true });
    for (const la of [30, 60]) {
      const r = 3 * Math.cos((la * Math.PI) / 180);
      b.torus([2 * r + 0.06, 2 * r + 0.06, 0.04], [0, 0.3 + 3 * Math.sin((la * Math.PI) / 180), 0], { color: '#f2ede4', rot: [90, 0, 0], tube: 0.02, parent: 'globe', noInk: true });
    }
    return b.act({ click: [A.par(A.pose('globe', { spin: [0, 40, 0] }), A.effect('sparkle', { dur: 2 })), A.wait(2.5), A.pose('globe', { spin: [0, 0, 0] })] }).done();
  }),
  // A terracotta pot of basil with a plant marker; the leaves sway and smell lovely.
  e('herbs', 'garden', 'herbs', () => {
    const b = m('herbs').cyl([0.12, 0.12, 0.12], [0, 0.06, 0], { color: '#c8643c', taper: 1.3 }).cyl([0.18, 0.03, 0.18], [0, 0.125, 0], { color: '#c8643c' });
    b.cyl([0.15, 0.01, 0.15], [0, 0.14, 0], { color: 'dirt' });
    b.ball([0.2, 0.14, 0.18], [0, 0.22, 0], { color: '#4f9a3c', name: 'top', pivot: [0, 0.14, 0] });
    for (const [x, y, z] of [[0.08, 0.25, 0.05], [-0.07, 0.27, 0.04], [0, 0.3, -0.04], [0.02, 0.21, 0.09], [-0.09, 0.2, -0.03], [0.07, 0.29, -0.05], [-0.03, 0.31, 0.06]] as const) b.ball([0.06, 0.025, 0.045], [x, y, z], { color: '#62b048', parent: 'top', rot: [x * 300, 0, x * 300] });
    b.stick([0.06, 0.13, 0.06], [0.06, 0.24, 0.06], 0.006, 'lightwood');
    b.box([0.04, 0.03, 0.004], [0.06, 0.25, 0.062], { color: 'white', edge: 'sharp' });
    return b.act({ click: [A.pose('top', { rot: [0, 0, 8], dur: 0.3 }), A.pose('top', { rot: [0, 0, -8], dur: 0.4 }), A.pose('top', { rot: [0, 0, 0], dur: 0.3 }), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A purple hexagon tile on a little stand; it spins on its pin.
  e('hexagon', 'ideas', 'shapes', () =>
    m('hexagon', { edge: 'sharp' })
      .box([0.07, 0.012, 0.04], [0, 0.006, 0], { color: 'darkwood', round: 0.3 })
      .stick([0, 0.01, 0], [0, 0.02, 0], 0.006, 'brass')
      .prism([0.1, 0.02, 0.1], [0, 0.065, 0], 6, { color: '#7b3fa0', rot: [90, 0, 0], name: 'hex', pivot: [0, 0.065, 0] })
      .act({ click: [A.pose('hex', { spin: [0, 360, 0] }), A.wait(1.5), A.pose('hex', { spin: [0, 0, 0] }), A.pose('hex', { rot: [0, 0, 0], dur: 0.2 })] })
      .done(),
  ),
  // A baby's high chair: splayed legs, padded seat at 0.55 m, backrest, armrests, a footrest and a tray that lifts
  // up; a cookie goes on the tray.
  e('high chair', 'home', 'baby things', () => {
    const b = m('high chair', { edge: 'sharp' });
    b.box([0.38, 0.05, 0.36], [0, 0.55, 0], { color: 'white', round: 0.2 });
    b.box([0.34, 0.06, 0.32], [0, 0.6, 0], { color: '#81d4fa', round: 0.5, edge: 'soft' });
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) b.rod([x * 0.15, 0.53, z * 0.14], [x * 0.27, 0.01, z * 0.28], 0.035, 'white');
    b.pair((s) => b.rod([s * 0.21, 0.2, 0.2], [s * 0.21, 0.2, -0.2], 0.025, 'white'));
    b.box([0.36, 0.48, 0.05], [0, 0.84, -0.17], { color: 'white', round: 0.3, rot: [-8, 0, 0] });
    b.box([0.3, 0.38, 0.04], [0, 0.82, -0.14], { color: '#81d4fa', round: 0.5, rot: [-8, 0, 0], edge: 'soft' });
    b.pair((s) => b.box([0.04, 0.04, 0.3], [s * 0.18, 0.72, 0.0], { color: 'white' }));
    b.box([0.38, 0.03, 0.12], [0, 0.28, 0.22], { color: 'white' });
    b.box([0.5, 0.035, 0.26], [0, 0.74, 0.25], { color: 'white', round: 0.4, name: 'tray', pivot: [0, 0.74, 0.12], mover: { kind: 'swing', axis: 'x', amount: -80 } });
    b.box([0.44, 0.012, 0.2], [0, 0.762, 0.25], { color: '#ffcc80', round: 0.3, parent: 'tray', noInk: true });
    return withSockets(
      b
        .act({
          click: [
            [A.operate('tray', 'open')],
            [A.operate('tray', 'close'), A.spawn('ck', 'cookie'), A.attach('ck', 'self', 'tray'), A.say('Yum!', 1.2), A.wait(2), A.remove('ck', 'pop')],
          ],
        })
        .done(),
      [{ name: 'tray', at: [0, 0.77, 0.27], kind: 'top', part: 'tray', size: 0.2 }, { name: 'seat', at: [0, 0.62, 0], kind: 'seat' }],
    );
  }),
  // A chisel-tip highlighter: yellow barrel with a grip band, a clip on the cap; the cap pulls off and goes back.
  e('highlighter', 'study', 'stationery', () =>
    m('highlighter', { edge: 'sharp' })
      .box([0.024, 0.1, 0.018], [0, 0.05, 0], { color: '#f6e84a', round: 0.5 })
      .box([0.025, 0.022, 0.019], [0, 0.03, 0], { color: '#3a3633', noInk: true, round: 0.5 })
      .box([0.012, 0.016, 0.008], [0, 0.106, 0], { color: '#fff176', round: 0.2 })
      .box([0.028, 0.045, 0.022], [0, 0.112, 0], { color: '#e8d020', round: 0.5, name: 'cap', mover: { kind: 'slide', axis: 'y', amount: 0.06 } })
      .box([0.006, 0.035, 0.005], [0, 0.11, 0.013], { color: '#c8b010', parent: 'cap' })
      .act({ click: [[A.operate('cap', 'out'), A.say('Pop!', 1)], [A.operate('cap', 'in'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A stretch of divided highway: four lanes of asphalt with dashed lines and edge lines, a concrete median
  // barrier, guard rails, lamp posts, an overhead sign gantry with green signs, and two cars that drive through.
  e('highway', 'places', 'roads', () => {
    const b = m('highway', { edge: 'sharp' });
    b.box([16, 0.1, 20], [0, 0.05, 0], { color: '#4a4a4e', round: 0.01 });
    b.box([0.6, 0.8, 20], [0, 0.5, 0], { color: '#bdb8ae', round: 0.2 });
    b.pair((s) => {
      for (let i = 0; i < 5; i++) b.box([0.15, 0.01, 2.5], [s * 4.0, 0.105, -8 + i * 4], { color: 'white', noInk: true });
      b.box([0.15, 0.01, 20], [s * 0.7, 0.105, 0], { color: '#f6d24a', noInk: true });
      b.box([0.15, 0.01, 20], [s * 7.3, 0.105, 0], { color: 'white', noInk: true });
      b.box([0.08, 0.35, 20], [s * 7.8, 0.75, 0], { color: '#c8ccd0' });
      for (let i = 0; i < 6; i++) b.box([0.1, 0.7, 0.1], [s * 7.85, 0.35, -9 + i * 3.6], { color: '#8a8e92' });
      b.stick([s * 7.9, 0, -5], [s * 7.9, 9, -5], 0.25, 'steel');
      b.stick([s * 7.9, 9, -5], [s * 6.5, 9.3, -5], 0.15, 'steel');
      b.box([0.6, 0.15, 0.3], [s * 6.3, 9.25, -5], { color: '#fff6c8', glow: true });
      b.stick([s * 8.2, 0, 3], [s * 8.2, 6.6, 3], 0.35, '#8a8e92');
    });
    b.box([16.8, 0.5, 0.5], [0, 6.4, 3], { color: '#8a8e92' });
    b.label('EXIT 12  Main St', [4.4, 1.6], [4, 5.4, 3.27], { color: '#2e7d32', depth: 0.1 });
    b.label('95 NORTH', [4.4, 1.6], [-4, 5.4, 3.27], { color: '#2e7d32', depth: 0.1 });
    const car = (n: string, x: number, z: number, c: string) => {
      b.box([1.8, 0.8, 4.5], [x, 0.55, z], { color: c, round: 0.3, name: n });
      b.box([1.6, 0.6, 2.4], [x, 1.2, z - 0.3], { color: '#3a4656', round: 0.3, parent: n });
      b.pair((s) => b.pair((t) => b.cyl([0.65, 0.25, 0.65], [x + s * 0.85, 0.33, z + t * 1.45], { color: '#1e1e1e', rot: [0, 0, 90], parent: n, edge: 'soft' })));
    };
    car('car1', 2.0, -4, '#1f5fb8');
    car('car2', 5.6, 3, '#f6d24a');
    return b
      .act({
        click: [
          A.par(A.pose('car1', { move: [0, 0, 9], dur: 1.6 }), A.pose('car2', { move: [0, 0, 6], dur: 1.6 }), A.say('Vroooom!', 1.5)),
          A.par(A.pose('car1', { move: [0, 0, 0], dur: 0 }), A.pose('car2', { move: [0, 0, 0], dur: 0 })),
        ],
      })
      .done();
  }),
  // A grassy hill (a 7 m hill, 24 m across): rolling slopes, a winding dirt path to an oak on top, rocks and
  // wildflowers; the tree sways and a rabbit pops out.
  e('hill', 'nature', 'landforms', () => {
    const b = m('hill');
    b.dome([24, 7, 22], [0, 3.5, 0], { color: '#7cb342' });
    b.dome([12, 3, 10], [-6, 1.5, 4], { color: '#8bc34a' });
    b.dome([10, 2.5, 9], [7, 1.25, -3], { color: '#7cb342' });
    for (const [x, y, z] of [[1.5, 6.5, 3.0], [3.0, 5.4, 6.5], [1.5, 3.8, 8.8], [-1.0, 2.0, 10.4]] as const) b.ball([1.8, 0.4, 1.5], [x, y, z], { color: '#b08a5a', noInk: true });
    b.rod([0, 6.6, -0.5], [0.2, 9.2, -0.5], 0.5, 'bark');
    b.ball([4.2, 3.4, 4.0], [0.2, 10.4, -0.5], { color: '#4f8f45', name: 'top', pivot: [0.2, 7, -0.5] });
    b.ball(2.2, [1.6, 10.0, 0.6], { color: '#5a9a4a', parent: 'top' });
    b.ball(2.2, [-1.4, 10.2, -1.0], { color: '#5a9a4a', parent: 'top' });
    for (const [x, z] of [[-6, 6], [8, 3], [5, -7]] as const) b.ball([1.4, 0.9, 1.2], [x, 2.8, z], { color: '#9a9690' });
    for (const [x, y, z, c] of [[-3, 5.4, 6.5, '#f6d24a'], [-4.5, 4.4, 7.4, 'white'], [4.5, 4.6, 6.8, 'pink'], [-8, 2.5, 6.6, '#ce93d8'], [6, 3.4, 5.5, '#f6d24a']] as const) b.ball(0.4, [x, y, z], { color: c, noInk: true });
    return b
      .act({
        click: [
          A.pose('top', { rot: [0, 0, 5], dur: 0.6 }),
          A.pose('top', { rot: [0, 0, -4], dur: 0.7 }),
          A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.6 }), A.spawn('rb', 'rabbit', { rel: 'front', of: 'self', dist: 'close' })),
          A.anim('hop', 2, 'rb'),
          A.remove('rb', 'fade'),
        ],
      })
      .done();
  }),
  // A steel butt hinge: knuckle and pin, two leaves with countersunk screws; the leaf swings open and shut.
  e('hinge', 'workshop', 'hardware', () => {
    const b = m('hinge', { edge: 'sharp' }).cyl([0.013, 0.09, 0.013], [0, 0.05, 0], { color: 'steel' });
    b.box([0.044, 0.088, 0.003], [-0.024, 0.05, 0.0], { color: 'steel', round: 0.1 });
    for (const y of [0.025, 0.075]) b.cyl([0.01, 0.003, 0.01], [-0.028, y, 0.002], { color: '#8a8e92', rot: [90, 0, 0] });
    b.box([0.044, 0.088, 0.003], [0.024, 0.05, 0.0], { color: 'steel', round: 0.1, name: 'leaf', pivot: [0, 0.05, 0], mover: { kind: 'swing', axis: 'y', amount: -120 } });
    for (const y of [0.025, 0.075]) b.cyl([0.01, 0.003, 0.01], [0.028, y, 0.002], { color: '#8a8e92', rot: [90, 0, 0], parent: 'leaf' });
    b.each(3, (i) => b.cyl([0.0135, 0.002, 0.0135], [0, 0.02 + i * 0.03, 0], { color: '#8a8e92', noInk: true }));
    return b.ball(0.014, [0, 0.096, 0], { color: 'steel' }).ball(0.014, [0, 0.004, 0], { color: 'steel' }).act({ click: [[A.operate('leaf', 'open'), A.say('Creak...', 1)], [A.operate('leaf', 'close')]] }).done();
  }),
  // A neoclassical history museum: broad steps up to a portico of eight columns, a pediment over a frieze with
  // its name, tall bronze doors that open, windowed wings and banners that flutter.
  e('history museum', 'places', 'museums', () => {
    const b = m('history museum', { edge: 'sharp' });
    b.box([22, 1.2, 14], [0, 0.6, -1], { color: '#cfc8b8', round: 0.02 });
    b.each(4, (i) => b.box([12 - i * 0.6, 0.3, 1.0], [0, 0.15 + i * 0.3, 7.0 - i * 0.5], { color: '#d8d2c4' }));
    b.box([20, 8, 10], [0, 5.2, -2.5], { color: '#ece4d2', round: 0.01 });
    b.box([12, 0.5, 4], [0, 1.45, 4.5], { color: '#ece4d2' });
    b.each(8, (i) => {
      const x = -5.25 + i * 1.5;
      b.cyl([0.9, 0.3, 0.9], [x, 1.85, 5.6], { color: '#f6f0e2', segs: 8 });
      b.cyl([0.75, 6.6, 0.75], [x, 5.2, 5.6], { color: '#f6f0e2', taper: 0.88 });
      b.box([1.0, 0.35, 1.0], [x, 8.65, 5.6], { color: '#f6f0e2' });
    });
    b.box([12.6, 1.2, 4.6], [0, 9.4, 4.0], { color: '#f6f0e2' });
    b.label('MUSEUM OF HISTORY', [9, 0.8], [0, 9.4, 6.32], { color: '#f6f0e2', depth: 0.05 });
    b.wedge([13, 2.6, 4.8], [0, 11.3, 4.0], { color: '#f6f0e2' });
    b.wedge([10, 1.8, 0.1], [0, 11.0, 6.42], { color: '#e0d6c0', noInk: true });
    b.box([21, 0.6, 11], [0, 9.5, -2.5], { color: '#d8d0bc' });
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([1.2, 4.0, 0.12], [s * 0.62, 3.6, 2.56], { color: '#8a5a2a', name: n, pivot: [s * 1.22, 3.6, 2.56], mover: { kind: 'swing', axis: 'y', amount: s * 90 } });
      b.box([0.08, 0.8, 0.06], [s * 0.15, 3.4, 2.65], { color: 'brass', parent: n });
      for (const x of [5, 8.5]) {
        b.box([1.6, 3.0, 0.08], [s * x, 4.4, 2.54], { color: '#f6f0e2' });
        b.box([1.3, 2.7, 0.06], [s * x, 4.4, 2.57], { color: '#6f8fa0' });
      }
      const fl = s > 0 ? 'bannerL' : 'bannerR';
      b.box([0.9, 3.2, 0.04], [s * 3.2, 6.0, 6.2], { color: s > 0 ? '#8a2a2a' : '#1f4f8a', name: fl, pivot: [s * 3.2, 7.6, 6.2] });
      b.label(s > 0 ? 'DINOS' : 'PHARAOHS', [0.8, 0.3], [s * 3.2, 6.6, 6.23], { color: '#f6d24a', parent: fl, depth: 0.01 });
    });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Shhh...', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.pose('bannerL', { rot: [-20, 0, 0], dur: 0.4 }), A.pose('bannerR', { rot: [-15, 0, 0], dur: 0.4 })), A.par(A.pose('bannerL', { rot: [0, 0, 0], dur: 0.5 }), A.pose('bannerR', { rot: [0, 0, 0], dur: 0.5 }))],
        ],
      })
      .done();
  }),
  // A trailer hitch: receiver tube on its cross bar, a ball mount held by a hitch pin with its clip, and the
  // chrome tow ball; the pin pulls out and back.
  e('hitch', 'garage', 'car parts', () =>
    m('hitch', { edge: 'sharp' })
      .box([0.6, 0.06, 0.06], [0, 0.035, -0.15], { color: '#1e1e1e' })
      .box([0.075, 0.075, 0.22], [0, 0.04, -0.03], { color: '#1e1e1e', round: 0.1 })
      .box([0.055, 0.055, 0.17], [0, 0.04, 0.12], { color: 'steel', round: 0.1 })
      .stick([-0.07, 0.04, 0.0], [0.06, 0.04, 0.0], 0.014, 'silver', { name: 'pin', mover: { kind: 'slide', axis: 'x', amount: -0.12 } })
      .torus([0.03, 0.03, 0.006], [0.075, 0.04, 0.0], { color: 'silver', rot: [0, 90, 0], parent: 'pin' })
      .box([0.065, 0.11, 0.05], [0, 0.07, 0.21], { color: 'steel', round: 0.2 })
      .cyl([0.028, 0.025, 0.028], [0, 0.135, 0.21], { color: 'silver' })
      .ball(0.055, [0, 0.17, 0.21], { color: 'silver', edge: 'soft' })
      .act({ click: [A.operate('pin', 'out'), A.wait(0.8), A.operate('pin', 'in'), A.say('Clunk!', 1)] })
      .done(),
  ),
  // An ice hockey goal at regulation size (1.83 m x 1.22 m): red posts and crossbar, the white base frame and a
  // mesh net; a puck flies in.
  e('hockey goal', 'sports', 'hockey', () => {
    const b = m('hockey goal', { edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.915, 0, 0.0], [s * 0.915, 1.22, 0.0], 0.06, '#d32f2f'));
    b.stick([-0.945, 1.22, 0.0], [0.945, 1.22, 0.0], 0.06, '#d32f2f');
    path(b, [[-0.915, 0.03, 0.0], [-0.85, 0.03, -0.75], [0, 0.03, -1.1], [0.85, 0.03, -0.75], [0.915, 0.03, 0.0]], 0.05, 'white');
    b.pair((s) => b.rod([s * 0.915, 1.22, 0], [s * 0.6, 0.35, -0.85], 0.03, 'white'));
    b.rod([-0.6, 0.35, -0.85], [0.6, 0.35, -0.85], 0.03, 'white');
    b.box([1.8, 1.2, 0.02], [0, 0.65, -0.55], { color: '#f2f2f2', rot: [-38, 0, 0], noInk: true, name: 'net', pivot: [0, 1.2, 0] });
    for (let i = 0; i < 9; i++) b.stick([-0.85 + i * 0.21, 1.2, 0], [-0.8 + i * 0.2, 0.05, -0.9], 0.006, '#c8c8c8', { noInk: true, parent: 'net' });
    for (let j = 1; j < 5; j++) b.stick([-0.9, 1.22 - j * 0.24, -j * 0.19], [0.9, 1.22 - j * 0.24, -j * 0.19], 0.006, '#c8c8c8', { noInk: true, parent: 'net' });
    return b
      .act({
        click: [
          A.spawn('pk', 'hockey puck', { rel: 'front', of: 'self', dist: 'near' }),
          A.move('pk', { rel: 'at', of: 'self' }, { speed: 'run', style: 'slide' }),
          A.par(A.pose('net', { rot: [-12, 0, 0], dur: 0.2 }), A.say('HOOONK!', 1.5)),
          A.pose('net', { rot: [0, 0, 0], dur: 0.3 }),
          A.remove('pk', 'fade'),
        ],
      })
      .done();
  }),
  // A real hockey puck (7.6 cm across, 2.5 cm thick) with its grippy edge and a logo; it slides off and back.
  e('hockey puck', 'sports', 'hockey', () =>
    m('hockey puck', { edge: 'sharp' })
      .cyl([0.076, 0.025, 0.076], [0, 0.0125, 0], { color: '#1e1e1e', round: 0.2, name: 'puck' })
      .cyl([0.0765, 0.012, 0.0765], [0, 0.0125, 0], { color: '#2b2b2b', segs: 16, parent: 'puck', noInk: true })
      .cyl([0.04, 0.002, 0.04], [0, 0.0255, 0], { color: '#8a8e92', parent: 'puck', noInk: true })
      .act({ click: [A.pose('puck', { move: [0, 0, 0.4], dur: 0.5 }), A.say('Swish!', 1), A.pose('puck', { move: [0, 0, 0], dur: 0.7 })] })
      .done(),
  ),
  // An ice hockey stick, 1.5 m: taped curved blade on the ice, the shaft with its knob; it takes a slapshot.
  e('hockey stick', 'sports', 'hockey', () =>
    m('hockey stick', { edge: 'sharp' })
      .stick([0.06, 0.06, 0], [-0.12, 1.52, 0], 0.035, '#d8b880', { name: 'stick', pivot: [-0.12, 1.52, 0] })
      .stick([-0.09, 1.28, 0], [-0.125, 1.53, 0], 0.04, '#1e1e1e', { parent: 'stick' })
      .box([0.3, 0.07, 0.02], [0.2, 0.04, 0.0], { color: '#d8b880', round: 0.3, rot: [0, -12, 4], parent: 'stick' })
      .box([0.2, 0.072, 0.022], [0.22, 0.04, 0.0], { color: '#1e1e1e', round: 0.3, rot: [0, -12, 4], parent: 'stick', noInk: true })
      .act({
        click: [
          A.pose('stick', { rot: [0, 0, -35], dur: 0.35 }),
          A.par(A.pose('stick', { rot: [0, 0, 8], dur: 0.12 }), A.spawn('pk', 'hockey puck', { rel: 'front', of: 'self', dist: 'close' }), A.say('Thwack!', 1.2)),
          A.par(A.move('pk', { rel: 'away', of: 'self', dist: 'far' }, { speed: 'run', style: 'slide' }), A.pose('stick', { rot: [0, 0, 0], dur: 0.4 })),
          A.remove('pk', 'fade'),
        ],
      })
      .done(),
  ),
  // A draw hoe, 1.5 m: ash handle with a ferrule, the swan neck and a flat steel blade resting on a clod of
  // earth; it chops the soil.
  e('hoe (tool)', 'garden', 'garden tools', () =>
    m('hoe (tool)')
      .ball([0.5, 0.16, 0.42], [0, 0.03, 0.05], { color: 'dirt' })
      .stick([0, 0.16, -0.05], [0, 1.5, -0.12], 0.035, '#c8a06a', { name: 'hoe', pivot: [0, 1.5, -0.12], edge: 'sharp' })
      .cyl([0.045, 0.06, 0.045], [0, 0.18, -0.05], { color: 'iron', parent: 'hoe' })
      .rod([0, 0.18, -0.05], [0, 0.17, 0.06], 0.016, 'iron', { parent: 'hoe' })
      .box([0.16, 0.11, 0.008], [0, 0.12, 0.07], { color: 'steel', round: 0.1, parent: 'hoe', edge: 'sharp' })
      .act({ click: [A.pose('hoe', { rot: [-25, 0, 0], dur: 0.3 }), A.par(A.pose('hoe', { rot: [0, 0, 0], dur: 0.12 }), A.effect('dust', { dur: 1 }), A.say('Chop!', 1))] })
      .done(),
  ),
  // A two-hole paper punch: steel base with paper guide, the punch heads and a lever that presses down; paper
  // dots lie about.
  e('hole puncher', 'study', 'office supplies', () => {
    const b = m('hole puncher', { edge: 'sharp' }).box([0.16, 0.02, 0.11], [0, 0.01, 0], { color: '#1e1e1e', round: 0.3 }).box([0.15, 0.045, 0.05], [0, 0.042, -0.025], { color: '#8a8e92', round: 0.2 });
    b.box([0.004, 0.012, 0.05], [0.07, 0.026, 0.03], { color: 'silver' });
    b.pair((s) => b.cyl([0.022, 0.03, 0.022], [s * 0.04, 0.05, 0.015], { color: 'steel' }));
    b.box([0.16, 0.022, 0.1], [0, 0.085, 0.005], { color: 'silver', rot: [-12, 0, 0], round: 0.4, name: 'lever', pivot: [0, 0.07, -0.045], mover: { kind: 'swing', axis: 'x', amount: 12 } });
    b.box([0.1, 0.012, 0.03], [0, 0.098, 0.04], { color: '#1e1e1e', rot: [-12, 0, 0], round: 0.4, parent: 'lever' });
    for (const [x, z] of [[0.1, 0.07], [0.12, 0.03], [-0.1, 0.08], [0.08, 0.1]] as const) b.cyl([0.012, 0.003, 0.012], [x, 0.0015, z], { color: 'white' });
    return b.act({ click: [A.operate('lever', 'on'), A.say('Chunk!', 1), A.operate('lever', 'off')] }).done();
  }),
  // A leather pistol holster on a belt loop with a snap strap, the pistol grip showing; the gun draws and goes
  // back.
  e('holster', 'armory', 'gun gear', () =>
    m('holster')
      .box([0.075, 0.18, 0.05], [0, 0.09, 0], { color: '#8a5a32', round: 0.4, rot: [0, 0, 8] })
      .box([0.07, 0.1, 0.02], [0.01, 0.13, -0.034], { color: '#6a4426', round: 0.2 })
      .box([0.032, 0.09, 0.03], [-0.02, 0.21, 0], { color: '#1e1e1e', rot: [0, 0, 20], round: 0.3, name: 'pistol', edge: 'sharp' })
      .box([0.07, 0.03, 0.025], [0.005, 0.25, 0], { color: '#2b2d31', rot: [0, 0, 8], parent: 'pistol', edge: 'sharp' })
      .box([0.08, 0.02, 0.04], [-0.005, 0.16, 0.014], { color: '#5a3a20', rot: [0, 0, 8], round: 0.3 })
      .ball(0.012, [0.01, 0.16, 0.036], { color: 'silver' })
      .box([0.002, 0.16, 0.002], [0.03, 0.09, 0.026], { color: '#f2e8d0', rot: [0, 0, 8], noInk: true })
      .act({ click: [A.pose('pistol', { move: [0, 0.12, 0], rot: [0, 0, -20], dur: 0.3 }), A.say('Shhk!', 1), A.wait(0.6), A.pose('pistol', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // A glass vial of holy water with a gold cross, its cork stopper; it glows and a choir sings.
  e('holy water', 'fantasy', 'magic items', () => {
    const b = m('holy water');
    b.cyl([0.08, 0.13, 0.08], [0, 0.065, 0], { color: '#bfe4f6', round: 0.3 });
    b.cyl([0.074, 0.08, 0.074], [0, 0.045, 0], { color: '#8fd0f0', noInk: true });
    b.cyl([0.08, 0.04, 0.08], [0, 0.15, 0], { color: '#bfe4f6', taper: 0.4 });
    b.cyl([0.03, 0.04, 0.03], [0, 0.185, 0], { color: '#bfe4f6' });
    b.cyl([0.026, 0.035, 0.026], [0, 0.215, 0], { color: '#c8a06a', taper: 1.2, name: 'cork' });
    b.box([0.012, 0.055, 0.006], [0, 0.07, 0.041], { color: 'gold', edge: 'sharp' }).box([0.035, 0.012, 0.006], [0, 0.08, 0.041], { color: 'gold', edge: 'sharp' });
    b.torus([0.034, 0.034, 0.006], [0, 0.198, 0], { color: 'gold', rot: [90, 0, 0] });
    return b
      .act({ click: [A.pose('cork', { move: [0, 0.04, 0], dur: 0.3 }), A.par(A.effect('sparkle', { dur: 2 }), A.say('Aaaah!', 2)), A.pose('cork', { move: [0, 0, 0], dur: 0.3 })] })
      .done();
  }),
  // A home gym station, 2.1 m: steel frame, a weight stack on guide rods with its pulley cable, a padded bench and
  // backrest, chest-press arms and a leg pad; the stack lifts and clanks.
  e('home gym', 'sports', 'gym', () => {
    const b = m('home gym', { edge: 'sharp' });
    b.box([1.5, 0.06, 1.9], [0, 0.03, 0], { color: '#3a3d42', round: 0.2 });
    b.pair((s) => {
      b.box([0.08, 2.1, 0.08], [s * 0.32, 1.11, -0.65], { color: '#1e1e1e' });
      b.stick([s * 0.12, 0.08, -0.65], [s * 0.12, 1.9, -0.65], 0.025, 'silver');
    });
    b.box([0.8, 0.08, 0.12], [0, 2.18, -0.65], { color: '#1e1e1e' });
    b.box([0.8, 0.08, 0.5], [0, 2.18, -0.4], { color: '#1e1e1e' });
    b.box([0.3, 0.6, 0.18], [0, 0.4, -0.65], { color: '#5a5e62', round: 0.05, name: 'stack', mover: { kind: 'slide', axis: 'y', amount: 0.45 } });
    b.each(7, (i) => b.box([0.31, 0.012, 0.19], [0, 0.14 + i * 0.08, -0.65], { color: '#1e1e1e', noInk: true, parent: 'stack' }));
    b.stick([0, 0.72, -0.65], [0, 2.14, -0.65], 0.012, '#c8ccd0');
    b.cyl([0.12, 0.04, 0.12], [0, 2.12, -0.3], { color: '#8a8e92', rot: [0, 0, 90] });
    b.box([0.4, 0.1, 0.9], [0, 0.5, 0.25], { color: '#c62828', round: 0.5, edge: 'soft' });
    b.box([0.4, 0.8, 0.1], [0, 0.95, -0.25], { color: '#c62828', round: 0.5, edge: 'soft' });
    b.stick([0, 0.06, 0.25], [0, 0.45, 0.25], 0.06, '#1e1e1e');
    b.stick([0, 0.06, -0.25], [0, 0.55, -0.25], 0.06, '#1e1e1e');
    b.pair((s) => {
      b.rod([s * 0.32, 1.25, -0.55], [s * 0.42, 1.25, 0.08], 0.05, '#1e1e1e');
      b.stick([s * 0.42, 1.15, 0.08], [s * 0.42, 1.35, 0.08], 0.045, '#3a3a3a');
    });
    b.stick([-0.22, 0.35, 0.72], [0.22, 0.35, 0.72], 0.03, 'silver');
    b.pair((s) => b.cyl([0.12, 0.14, 0.12], [s * 0.15, 0.35, 0.72], { color: '#c62828', rot: [0, 0, 90], edge: 'soft' }));
    return withSockets(
      b
        .act({ click: [A.operate('stack', 'up'), A.say('Hup!', 1), A.operate('stack', 'down'), A.say('Clank!', 1), A.operate('stack', 'up'), A.operate('stack', 'down'), A.say('Clank!', 1)] })
        .done(),
      [{ name: 'seat', at: [0, 0.56, 0.2], kind: 'seat' }],
    );
  }),
  // A two-storey brick community shelter: warm lit windows, a heart sign over the door, a bench out front; its
  // doors open with a welcome.
  e('homeless shelter', 'places', 'public buildings', () => {
    const { b, H, z } = shop('homeless shelter', { w: 9, d: 7, floors: 2, wall: '#a8553e', trim: '#efe6d4', sign: 'COMMUNITY SHELTER', signBg: '#efe6d4', glass: '#f6d88a', door: '#5a3a22', roof: 'side gable', roofColor: '#4a4440', cols: 3 });
    b.heart(1.0, [0, H - 0.9, z + 0.1], { color: '#e53935' });
    b.box([1.8, 0.08, 0.45], [3.1, 0.48, z + 1.2], { color: 'wood' });
    b.box([1.8, 0.45, 0.06], [3.1, 0.75, z + 1.0], { color: 'wood' });
    b.pair((s) => b.box([0.08, 0.45, 0.4], [3.1 + s * 0.8, 0.22, z + 1.2], { color: '#3a3633' }));
    b.box([1.8, 0.12, 1.2], [0, 0.06, z + 0.6], { color: '#9a9690' });
    return b.act({ click: [A.par(A.operate('door', 'open'), A.effect('hearts', { dur: 2 })), A.say('Ding-dong!', 1.5), A.wait(2), A.operate('door', 'close')] }).done();
  }),
  // A guided missile on its launch rail, real size (3.6 m): white body with red bands, a dark seeker dome, canards
  // and tail fins, an exhaust nozzle. It locks on (the seeker blinks, the canards twitch), then launches.
  e('homing missile', 'armory', 'missiles', () => {
    const b = m('homing missile', { view: 'side', edge: 'sharp' });
    b.box([0.6, 0.12, 2.6], [0, 0.95, -0.2], { color: '#556b2f' });
    b.pair((s) => b.rod([s * 0.25, 0.02, -1.2], [s * 0.2, 0.9, -1.0], 0.08, '#556b2f').rod([s * 0.25, 0.02, 0.8], [s * 0.2, 0.9, 0.6], 0.08, '#556b2f'));
    b.box([0.8, 0.06, 2.4], [0, 0.03, -0.2], { color: '#3e4f22' });
    b.loft([0.3, 0.3, 3.6], [0, 1.2, 0], [[0, 0.8, 0.8, 0], [0.05, 1, 1, 0], [0.82, 1, 1, 0], [0.95, 0.75, 0.75, 0], [1, 0.2, 0.2, 0]], { color: '#f2f2f2', name: 'missile', edge: 'soft' });
    b.dome([0.14, 0.12, 0.14], [0, 1.2, 1.79], { color: '#2b3f66', rot: [90, 0, 0], parent: 'missile' });
    b.ball(0.06, [0, 1.2, 1.8], { color: '#ff3b30', glow: true, name: 'seeker', parent: 'missile', mover: { kind: 'light' } });
    for (const zz of [0.6, -0.9]) b.cyl([0.31, 0.12, 0.31], [0, 1.2, zz], { color: '#c62828', rot: [90, 0, 0], parent: 'missile' });
    b.pair((s) => {
      b.box([0.5, 0.025, 0.4], [s * 0.3, 1.2, -1.55], { color: '#5a5e62', parent: 'missile' });
      b.box([0.22, 0.02, 0.18], [s * 0.2, 1.2, 1.25], { color: '#5a5e62', name: s > 0 ? 'canardL' : 'canardR', parent: 'missile' });
    });
    b.box([0.025, 1.0, 0.4], [0, 1.2, -1.55], { color: '#5a5e62', parent: 'missile' });
    b.cyl([0.24, 0.15, 0.24], [0, 1.2, -1.85], { color: '#3a3d42', rot: [90, 0, 0], taper: 0.8, parent: 'missile' });
    b.cone([0.22, 0.7, 0.22], [0, 1.2, -2.25], { color: '#ffb84a', rot: [-90, 0, 0], glow: true, name: 'flame', parent: 'missile', scale: 0 });
    return b
      .act({
        click: [
          [A.operate('seeker', 'on'), A.say('Beep... beep...', 1.5), A.par(A.pose('canardL', { rot: [0, 0, 15], dur: 0.2 }), A.pose('canardR', { rot: [0, 0, -15], dur: 0.2 })), A.par(A.pose('canardL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('canardR', { rot: [0, 0, 0], dur: 0.2 })), A.say('BEEEEP!', 1.5)],
          [
            A.par(A.pose('flame', { scale: 1, dur: 0.2 }), A.effect('smoke', { dur: 2 })),
            A.par(A.pose('missile', { move: [0, 4, 12], rot: [-15, 0, 0], dur: 1.2 }), A.say('WHOOSH!', 1.5)),
            A.par(A.pose('missile', { scale: 0, dur: 0 }), A.pose('flame', { scale: 0, dur: 0 }), A.operate('seeker', 'off')),
            A.pose('missile', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0 }),
            A.wait(0.6),
            A.pose('missile', { scale: 1, dur: 0.4 }),
          ],
        ],
      })
      .done();
  }),
  // A pot of golden honey with a checked cloth lid tied with string, a label, and a wooden honey dipper that lifts
  // out dripping.
  e('honey', 'food', 'sweets', () => {
    const b = m('honey');
    b.ball([0.15, 0.15, 0.15], [0, 0.075, 0], { color: '#e8a420' });
    b.cyl([0.11, 0.035, 0.11], [0, 0.15, 0], { color: '#e8a420' });
    b.cyl([0.15, 0.02, 0.15], [0, 0.17, 0], { color: '#d32f2f', taper: 0.9, round: 0.4 });
    b.each(4, (i) => b.box([0.03, 0.021, 0.03], [-0.045 + i * 0.03, 0.171, (i % 2) * 0.03 - 0.015], { color: 'white', noInk: true }));
    b.torus([0.115, 0.115, 0.01], [0, 0.158, 0], { color: '#c8a06a', rot: [90, 0, 0], tube: 0.2 });
    b.label('HONEY', [0.075, 0.035], [0, 0.075, 0.072], { color: '#f6efdc', depth: 0.004 });
    b.stick([0.04, 0.16, 0.02], [0.09, 0.32, 0.03], 0.012, 'lightwood', { name: 'dipper', pivot: [0.04, 0.16, 0.02] });
    b.each(4, (i) => b.cyl([0.036 - (i % 2) * 0.008, 0.012, 0.036 - (i % 2) * 0.008], [0.036, 0.15 - i * 0.014, 0.018], { color: '#c8a06a', parent: 'dipper', rot: [0, 0, -17] }));
    b.capsule([0.016, 0.04, 0.016], [0.037, 0.1, 0.018], { color: '#f0b040', parent: 'dipper', name: 'drip' });
    return b
      .act({ click: [A.pose('dipper', { move: [0, 0.1, 0], dur: 0.5 }), A.say('Drip...', 1.2), A.pose('drip', { move: [0, -0.03, 0], scale: 1.3, dur: 0.6 }), A.pose('drip', { move: [0, 0, 0], scale: 1, dur: 0 }), A.pose('dipper', { move: [0, 0, 0], dur: 0.5 })] })
      .done();
  }),
  // A slab of honeycomb in a wooden frame: wax cells, some capped and some brimming with honey; a bee comes buzzing.
  e('honeycomb', 'food', 'sweets', () => {
    const b = m('honeycomb'), r = 0.026, d = r * Math.sqrt(3), c: V = [0, 0.1, 0];
    b.box([0.2, 0.2, 0.025], [0, 0.1, -0.003], { color: '#c8a06a', round: 0.1, edge: 'sharp' });
    b.box([0.17, 0.17, 0.027], [0, 0.1, -0.002], { color: '#d99a20', round: 0.1 });
    const cells: V[] = [c, ...[0, 60, 120, 180, 240, 300].map((a): V => [c[0] + d * Math.cos((a * Math.PI) / 180), c[1] + d * Math.sin((a * Math.PI) / 180), 0])];
    cells.forEach((p, i) => {
      hexagon(b, r * 0.99, [p[0], p[1], 0.012], '#e8b030', 0.012);
      hexagon(b, r * 0.72, [p[0], p[1], 0.016], i % 3 ? '#c98a1a' : '#f6e0a0', 0.012, { noInk: true });
    });
    b.box([0.012, 0.03, 0.012], [0.03, 0.006, 0.02], { color: '#f0b040', round: 0.6 });
    return b.act({ click: [A.spawn('bee', 'bee', { rel: 'front', of: 'self', dist: 'close' }), A.say('Bzzzz!', 1.5, 'bee'), A.wait(1), A.remove('bee', 'fly_away')] }).done();
  }),
  // A grey hoodie on an invisible body: kangaroo pocket, ribbed cuffs, drawstrings, and a lined hood that flips up
  // and down.
  e('hood (clothes)', 'wardrobe', 'clothes', () => {
    const b = m('hood (clothes)').box([0.46, 0.5, 0.24], [0, 0.25, 0], { color: '#8a9096', round: 0.4 });
    b.pair((s) => {
      b.rod([s * 0.21, 0.46, 0], [s * 0.3, 0.12, 0.02], 0.11, '#8a9096');
      b.cyl([0.1, 0.05, 0.1], [s * 0.3, 0.08, 0.02], { color: '#7a8086' });
      b.rod([s * 0.04, 0.48, 0.13], [s * 0.05, 0.35, 0.135], 0.012, 'white');
      b.ball(0.016, [s * 0.05, 0.34, 0.135], { color: 'silver' });
    });
    b.box([0.46, 0.06, 0.245], [0, 0.03, 0], { color: '#7a8086', round: 0.4 });
    b.box([0.26, 0.12, 0.02], [0, 0.14, 0.12], { color: '#7a8086', round: 0.4 });
    b.ball([0.3, 0.32, 0.3], [0, 0.6, -0.04], { color: '#8a9096', name: 'hood', pivot: [0, 0.48, -0.08], mover: { kind: 'swing', axis: 'x', amount: -110, on: false } });
    b.ball([0.18, 0.22, 0.08], [0, 0.6, 0.085], { color: '#2e2a28', parent: 'hood' });
    b.torus([0.2, 0.27, 0.035], [0, 0.6, 0.095], { color: '#a4aab0', tube: 0.15, parent: 'hood' });
    return b.act({ click: [[A.operate('hood', 'open')], [A.operate('hood', 'close')]] }).done();
  }),
  // A galvanised hook with a swivel eye hanging from a short chain on a wall bracket; things hang on it, and it
  // swings.
  e('hook', 'workshop', 'hardware', () => {
    const b = m('hook', { edge: 'sharp' });
    b.box([0.06, 0.08, 0.012], [0, 0.17, -0.03], { color: '#8a8e92', round: 0.3 });
    b.rod([0, 0.19, -0.03], [0, 0.19, 0.01], 0.012, '#8a8e92');
    b.torus([0.025, 0.035, 0.007], [0, 0.17, 0.012], { color: 'steel', rot: [0, 90, 0], name: 'hook', pivot: [0, 0.19, 0.012] });
    b.torus([0.025, 0.035, 0.007], [0, 0.142, 0.012], { color: 'steel', parent: 'hook' });
    b.torus([0.026, 0.026, 0.008], [0, 0.112, 0.012], { color: 'steel', parent: 'hook', tube: 0.25 });
    b.stick([0, 0.1, 0.012], [0, 0.045, 0.012], 0.011, 'steel', { parent: 'hook' });
    b.arc([0.05, 0.05, 0.011], [0.022, 0.04, 0.012], { color: 'steel', arc: 200, rot: [0, 0, 180], tube: 0.25, parent: 'hook' });
    b.rod([0.046, 0.04, 0.012], [0.046, 0.062, 0.012], 0.01, 'steel', { parent: 'hook' });
    return withSockets(
      b.act({ click: [A.pose('hook', { rot: [0, 0, 25], dur: 0.3 }), A.pose('hook', { rot: [0, 0, -18], dur: 0.4 }), A.pose('hook', { rot: [0, 0, 8], dur: 0.3 }), A.pose('hook', { rot: [0, 0, 0], dur: 0.3 })] }).done(),
      [{ name: 'hook', at: [0.022, 0.02, 0.012], kind: 'hook', part: 'hook', size: 0.1 }],
    );
  }),
  // A great curved horn on a wooden plinth, pale at the base darkening to its tip; blown like a shofar it toots.
  e('horn (animal)', 'wild', 'antlers and horns', () => {
    const b = m('horn (animal)').box([0.24, 0.06, 0.16], [0, 0.03, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' });
    const pts: V[] = [[-0.06, 0.06, 0], [-0.05, 0.17, 0], [0.0, 0.28, 0.02], [0.08, 0.36, 0.03], [0.17, 0.4, 0.02], [0.25, 0.39, 0], [0.3, 0.35, -0.01]];
    const th = [0.1, 0.085, 0.07, 0.055, 0.04, 0.026, 0.012];
    const cs = ['#efe3c8', '#e6d5b0', '#d9c39a', '#c8aa80', '#a0805a', '#6a4a2a'];
    for (let i = 0; i < pts.length - 1; i++) {
      b.stick(pts[i], pts[i + 1], th[i], cs[i], { taper: th[i + 1] / th[i] });
      if (i) b.ball(th[i], pts[i], { color: cs[i] });
      if (i < 4) b.torus([th[i] * 1.02, th[i] * 1.02, 0.006], pts[i], { color: '#d0bc90', rot: [90, 0, 0], noInk: true });
    }
    return b.act({ click: [A.anim('wobble'), A.say('Toooooot!', 2)] }).done();
  }),
  // A pair of branching deer antlers mounted on a shield plaque; they rattle.
  e('horns', 'wild', 'antlers and horns', () => {
    const b = m('horns').box([0.26, 0.32, 0.05], [0, 0.16, 0], { color: 'darkwood', round: 0.4, edge: 'sharp' }).ball([0.1, 0.08, 0.08], [0, 0.26, 0.04], { color: '#e8dcc0' });
    const c = '#d9c3a0';
    b.pair((s) => {
      path(b, [[s * 0.03, 0.28, 0.05], [s * 0.12, 0.38, 0.06], [s * 0.18, 0.5, 0.05], [s * 0.16, 0.64, 0.03]], 0.028, c);
      b.rod([s * 0.12, 0.38, 0.06], [s * 0.1, 0.47, 0.1], 0.02, c);
      b.rod([s * 0.17, 0.48, 0.05], [s * 0.25, 0.58, 0.07], 0.018, c);
      b.rod([s * 0.175, 0.56, 0.04], [s * 0.12, 0.66, 0.05], 0.016, c);
      b.ball(0.035, [s * 0.04, 0.28, 0.05], { color: '#a08060' });
    });
    return b.act({ click: [A.anim('shake'), A.say('Clack clack!', 1.2)] }).done();
  }),
  // A white goalie-style horror mask with breathing holes, red chevrons and black straps; it shakes and says boo.
  e('horror mask', 'toys', 'masks', () => {
    const b = m('horror mask').ball([0.19, 0.25, 0.09], [0, 0.13, 0], { color: '#efe8d6' });
    b.pair((s) => {
      b.ball([0.045, 0.03, 0.02], [s * 0.04, 0.17, 0.035], { color: '#1e1e1e' });
      b.wedge([0.035, 0.025, 0.01], [s * 0.05, 0.11, 0.04], { color: '#d32f2f', noInk: true, rot: [0, 0, 180] });
      for (const [x, y] of [[0.02, 0.07], [0.04, 0.05], [0.06, 0.08], [0.015, 0.04], [0.07, 0.13]] as const) b.ball(0.01, [s * x, y, 0.04], { color: '#1e1e1e', noInk: true });
    });
    b.wedge([0.05, 0.03, 0.01], [0, 0.225, 0.035], { color: '#d32f2f', noInk: true, rot: [0, 0, 180] });
    b.torus([0.2, 0.08, 0.012], [0, 0.17, -0.02], { color: '#1e1e1e', rot: [90, 0, 0] });
    b.torus([0.2, 0.08, 0.012], [0, 0.08, -0.02], { color: '#1e1e1e', rot: [90, 0, 0] });
    return b.act({ click: [A.anim('shake'), A.say('BOO!', 1.5)] }).done();
  }),
  // A one-horse carriage at real size: a maroon cab with doors and windows, lanterns, the driver's box
  // up front, leaf springs, big spoked rear wheels and smaller front ones, shafts to a harnessed horse.
  e('horse carriage', 'garage', 'carriages', () => {
    const b = m('horse carriage', { view: 'side', edge: 'sharp' });
    b.box([1.35, 1.25, 1.7], [0, 1.47, -0.6], { color: '#6a1a22', round: 0.2, name: 'cab' });
    b.box([1.38, 0.1, 1.72], [0, 1.1, -0.6], { color: '#d4af37', noInk: true });
    b.box([1.5, 0.1, 1.9], [0, 2.14, -0.6], { color: '#1e1e1e', round: 0.3 });
    b.pair((s) => {
      for (const zz of [-1.4, 0.2]) b.stick([s * 0.7, 2.19, zz], [s * 0.7, 2.32, zz], 0.03, 'brass');
      b.stick([s * 0.7, 2.32, -1.42], [s * 0.7, 2.32, 0.22], 0.03, 'brass');
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([0.05, 1.0, 0.72], [s * 0.7, 1.42, -0.6], { color: '#7a2230', round: 0.15, name: n, pivot: [s * 0.7, 1.42, -0.96], mover: { kind: 'swing', axis: 'y', amount: s * 90 } });
      b.box([0.06, 0.4, 0.5], [s * 0.71, 1.65, -0.6], { color: '#5f8aa6', parent: n });
      b.box([0.06, 0.04, 0.12], [s * 0.72, 1.3, -0.35], { color: 'brass', parent: n });
      b.box([0.12, 0.25, 0.12], [s * 0.73, 1.95, 0.3], { color: '#1e1e1e' });
      b.ball(0.1, [s * 0.73, 1.95, 0.3], { color: '#ffd54f', glow: true, name: s > 0 ? 'lampL' : 'lampR', mover: { kind: 'light', on: true } });
      b.arc([0.9, 0.3, 0.08], [s * 0.45, 0.8, -1.0], { color: '#1e1e1e', rot: [0, 90, 180], arc: 120 });
      b.arc([0.7, 0.25, 0.08], [s * 0.4, 0.68, 0.75], { color: '#1e1e1e', rot: [0, 90, 180], arc: 120 });
      b.rod([s * 0.4, 0.55, 0.85], [s * 0.4, 1.15, 3.75], 0.06, '#5a3a22');
    });
    b.box([0.2, 0.12, 2.3], [0, 0.85, -0.1], { color: '#1e1e1e' });
    b.box([1.25, 0.14, 0.5], [0, 1.85, 0.55], { color: '#1e1e1e', round: 0.2 });
    b.box([1.25, 0.35, 0.08], [0, 2.05, 0.32], { color: '#1e1e1e', round: 0.2 });
    b.box([1.0, 0.06, 0.45], [0, 1.25, 0.95], { color: '#5a3a22', rot: [-25, 0, 0] });
    b.box([0.9, 0.55, 0.3], [0, 1.5, 0.55], { color: '#5a1a22', round: 0.1 });
    b.pair((s) => spoked(b, 1.4, [s * 0.82, 0.7, -1.0], '#8a2a2a', s > 0 ? 'wheel1' : 'wheel2'));
    b.pair((s) => spoked(b, 1.0, [s * 0.75, 0.5, 0.75], '#8a2a2a', s > 0 ? 'wheel3' : 'wheel4'));
    b.stick([-0.85, 0.7, -1.0], [0.85, 0.7, -1.0], 0.06, '#1e1e1e');
    b.stick([-0.78, 0.5, 0.75], [0.78, 0.5, 0.75], 0.06, '#1e1e1e');
    // the horse
    const hc = '#7a4a2a', dk = '#3a2416';
    b.ball([0.6, 0.72, 1.7], [0, 1.28, 3.2], { color: hc, edge: 'soft' });
    b.pair((s) => {
      for (const zz of [2.65, 3.75]) {
        b.rod([s * 0.17, 1.1, zz], [s * 0.17, 0.12, zz + 0.04], 0.13, hc, { edge: 'soft' });
        b.cyl([0.14, 0.12, 0.16], [s * 0.17, 0.06, zz + 0.06], { color: dk });
      }
    });
    b.rod([0, 1.5, 3.85], [0, 1.95, 4.2], 0.34, hc, { edge: 'soft' });
    b.box([0.06, 0.6, 0.2], [0, 1.9, 4.0], { color: dk, rot: [-40, 0, 0] });
    b.rod([0, 2.02, 4.25], [0, 1.72, 4.62], 0.24, hc, { name: 'horsehead', pivot: [0, 1.9, 4.15], edge: 'soft' });
    b.ball([0.2, 0.18, 0.22], [0, 1.7, 4.64], { color: '#5a3420', parent: 'horsehead', edge: 'soft' });
    b.pair((s) => {
      b.cone([0.06, 0.14, 0.05], [s * 0.07, 2.15, 4.25], { color: hc, parent: 'horsehead', edge: 'soft' });
      b.ball(0.035, [s * 0.1, 1.98, 4.45], { color: '#1e1e1e', parent: 'horsehead', eye: true });
    });
    b.torus([0.42, 0.5, 0.1], [0, 1.6, 3.85], { color: '#3a2a1e', rot: [30, 0, 0], tube: 0.25 });
    b.box([0.64, 0.08, 0.5], [0, 1.66, 3.1], { color: '#3a2a1e', round: 0.4 });
    b.rod([0, 1.45, 2.4], [0, 0.85, 2.25], 0.09, dk, { edge: 'soft' });
    return withSockets(
      b
        .act({
          click: [
            [A.pose('horsehead', { rot: [25, 0, 0], dur: 0.3 }), A.pose('horsehead', { rot: [-10, 0, 0], dur: 0.3 }), A.pose('horsehead', { rot: [0, 0, 0], dur: 0.3 }), A.say('Neigh!', 1.5)],
            [A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close'), A.say('Clip clop!', 1.5)],
          ],
        })
        .done(),
      [{ name: 'seat', at: [0, 1.92, 0.55], kind: 'seat' }],
    );
  }),
  // A horseradish root, knobbly and pale, with its leafy top; a slice cut from the end comes off.
  e('horse radish', 'food', 'vegetables', () => {
    const b = m('horse radish');
    b.loft([0.06, 0.06, 0.26], [0, 0.03, 0], [[0, 0.3, 0.3, 0], [0.3, 0.85, 0.85, 0], [0.75, 1, 1, 0], [1, 0.9, 0.9, 0]], { color: '#d8c8a0', rot: [0, 90, 0], name: 'root' });
    for (const [x, z] of [[0.03, 0.025], [-0.04, -0.025], [0.07, -0.02]] as const) b.ball([0.022, 0.018, 0.02], [x, 0.04, z], { color: '#c4b080' });
    b.cyl([0.054, 0.018, 0.054], [0.14, 0.03, 0], { color: '#f6f0dc', rot: [0, 0, 90], name: 'slice', parent: 'root', piece: true });
    b.cyl([0.058, 0.016, 0.058], [0.14, 0.03, 0], { color: '#c4b080', rot: [0, 0, 90], parent: 'slice', noInk: true });
    b.pair((s) => b.ball([0.04, 0.18, 0.012], [-0.15, 0.1, s * 0.025], { color: '#4f9a3c', rot: [s * 15, 0, 40] }));
    b.ball([0.035, 0.16, 0.012], [-0.15, 0.1, 0], { color: '#2e7d32', rot: [0, 0, 30] });
    return b.act({ click: [[A.detach('slice', 'slice'), A.say('Sniff... achoo!', 1.5)], [A.reattach('slice')]] }).done();
  }),
  // A horse's tail on a tack-room stand: braided dock bound with a red wrap, long flowing hair; it swishes.
  e('horse tail', 'farm', 'horse gear', () => {
    const b = m('horse tail').box([0.34, 0.06, 0.22], [0, 0.03, 0], { color: 'darkwood', edge: 'sharp' }).stick([-0.13, 0.06, -0.05], [-0.13, 0.86, -0.05], 0.035, 'wood');
    b.rod([-0.13, 0.84, -0.05], [-0.02, 0.84, -0.02], 0.025, 'wood');
    b.capsule([0.07, 0.14, 0.07], [0.0, 0.76, 0], { color: '#4a2e1a', name: 'tail', pivot: [0, 0.84, 0] });
    b.torus([0.08, 0.08, 0.025], [0, 0.72, 0], { color: '#c62828', rot: [90, 0, 0], parent: 'tail' });
    b.ball([0.16, 0.36, 0.1], [0.03, 0.52, 0], { color: '#5a3a22', rot: [0, 0, -8], parent: 'tail' });
    b.ball([0.2, 0.34, 0.11], [0.06, 0.26, 0.01], { color: '#4a2e1a', rot: [0, 0, 10], parent: 'tail' });
    for (let i = 0; i < 6; i++) path(b, [[0.02 + i * 0.008, 0.66, 0.02], [0.05 + i * 0.015, 0.42, 0.03 - i * 0.008], [0.0 + i * 0.03, 0.2, 0.03], [0.06 + i * 0.025, 0.07, 0.02 - i * 0.008]], 0.035, i % 2 ? '#3a2416' : '#6a4428', { parent: 'tail' });
    return b.act({ click: [A.pose('tail', { rot: [0, 0, 25], dur: 0.25 }), A.pose('tail', { rot: [0, 0, -25], dur: 0.35 }), A.pose('tail', { rot: [0, 0, 0], dur: 0.25 }), A.say('Swish!', 1)] }).done();
  }),
  // A forged iron horseshoe standing open end up for luck, with its nail holes; it spins and sparkles.
  e('horseshoe', 'farm', 'horse gear', () => {
    const b = m('horseshoe', { edge: 'sharp' });
    b.arc([0.12, 0.13, 0.014], [0, 0.065, 0], { color: '#5a5e62', arc: 290, rot: [0, 0, 180], tube: 0.3, name: 'shoe', pivot: [0, 0.065, 0] });
    for (const a of [160, 200, 235, 305, 340, 380]) b.ball(0.007, [0.05 * Math.cos((a * Math.PI) / 180), 0.065 + 0.054 * Math.sin((a * Math.PI) / 180), 0.007], { color: '#1e1e1e', noInk: true, parent: 'shoe' });
    return b.act({ click: [A.par(A.pose('shoe', { rot: [0, 360, 0], dur: 0.8 }), A.effect('sparkle', { dur: 1.2 })), A.pose('shoe', { rot: [0, 0, 0], dur: 0 }), A.say('Ting!', 1)] }).done();
  }),
  // A garden hose reel cart: a drum wound with green hose on a frame with wheels, a crank that winds it, and a
  // spray nozzle on the end; the reel winds, then the nozzle sprays.
  e('hose', 'garden', 'garden things', () => {
    const b = m('hose');
    b.pair((s) => {
      b.rod([s * 0.27, 0.12, 0.15], [s * 0.27, 0.85, -0.12], 0.035, '#2e7d32', { edge: 'sharp' });
      b.rod([s * 0.27, 0.05, -0.22], [s * 0.27, 0.5, -0.05], 0.035, '#2e7d32', { edge: 'sharp' });
    });
    b.stick([-0.27, 0.85, -0.12], [0.27, 0.85, -0.12], 0.035, '#2e7d32', { edge: 'sharp' });
    b.cyl([0.3, 0.46, 0.3], [0, 0.45, 0], { color: '#3a3d42', rot: [0, 0, 90], name: 'reel', mover: { kind: 'spin', axis: 'x', amount: 360 } });
    b.each(7, (i) => b.torus([0.46, 0.46, 0.06], [-0.15 + i * 0.05, 0.45, 0], { color: i % 2 ? '#43a047' : '#388e3c', rot: [0, 90, 0], tube: 0.25, parent: 'reel' }));
    b.pair((s) => b.cyl([0.5, 0.03, 0.5], [s * 0.24, 0.45, 0], { color: '#2e7d32', rot: [0, 0, 90], parent: 'reel', edge: 'sharp' }));
    b.box([0.03, 0.14, 0.03], [0.3, 0.45, 0.06], { color: '#1e1e1e', parent: 'reel' });
    b.stick([0.3, 0.52, 0.06], [0.38, 0.52, 0.06], 0.025, '#1e1e1e', { parent: 'reel' });
    b.pair((s) => wheel(b, 0.2, [s * 0.32, 0.1, 0.15], { color: '#1e1e1e', name: s > 0 ? 'wheelL' : 'wheelR' }));
    path(b, [[0, 0.24, 0.12], [0.05, 0.03, 0.3], [-0.15, 0.03, 0.5], [0.1, 0.03, 0.65]], 0.04, '#43a047');
    b.stick([0.1, 0.035, 0.65], [0.15, 0.04, 0.78], 0.04, '#f6d24a', { name: 'nozzle' });
    return b
      .act({
        click: [
          [A.operate('reel', 'on'), A.say('Click click click', 1.5), A.wait(1.5), A.operate('reel', 'off')],
          [A.par(A.effect('water_spray', { dur: 2 }), A.say('Pssshhh!', 1.5))],
        ],
      })
      .done();
  }),
  // A four-storey hospital: white with blue trim, rows of windows, an emergency canopy with its sign and a
  // flashing light, a red cross on the roof and a helipad.
  e('hospital', 'places', 'public buildings', () => {
    const { b, H, z } = shop('hospital', { w: 16, d: 10, floors: 4, wall: '#f4f4f0', trim: '#1f5fb8', sign: 'CITY HOSPITAL', signBg: 'white', glass: '#9fc6d8', cols: 6 });
    b.box([3.6, 0.2, 3.2], [5.6, 3.1, z + 1.6], { color: 'white', round: 0.1 });
    b.box([3.6, 0.5, 0.12], [5.6, 3.25, z + 3.2], { color: '#c62828' });
    b.label('EMERGENCY', [3.0, 0.4], [5.6, 3.25, z + 3.27], { color: '#c62828', depth: 0.04 });
    b.pair((s) => b.box([0.2, 3.0, 0.2], [5.6 + s * 1.6, 1.5, z + 3.0], { color: '#d8d8d8' }));
    b.ball([0.35, 0.3, 0.35], [5.6, 3.4, z + 2.2], { color: '#3a7bd5', glow: true, name: 'siren', mover: { kind: 'light' } });
    b.box([2.6, 0.7, 0.3], [-4, H + 1.6, 0], { color: '#e53935', glow: true });
    b.box([0.7, 2.6, 0.3], [-4, H + 1.6, 0], { color: '#e53935', glow: true });
    b.pair((s) => b.box([0.2, 1.0, 0.2], [-4 + s * 0.6, H + 0.5, 0], { color: '#8a8e92' }));
    b.cyl([5, 0.1, 5], [3.5, H + 0.15, 0], { color: '#3a3d42' });
    b.label('H', [1.6, 1.6], [3.5, H + 0.22, 0], { color: '#3a3d42', rot: [-90, 0, 0], depth: 0.02 });
    return b
      .act({
        click: [
          [A.operate('siren', 'on'), A.say('Nee-naw nee-naw!', 2), A.wait(2), A.operate('siren', 'off')],
          [A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // An adjustable hospital bed: frame on castors, mattress with a raising back section, side rails, a footboard
  // chart and an IV pole; the head end lifts and lowers.
  e('hospital bed', 'clinic', 'hospital', () => {
    const b = m('hospital bed', { view: 'side', edge: 'sharp' });
    b.box([0.95, 0.12, 2.0], [0, 0.42, 0], { color: '#8a8e92', round: 0.2 });
    for (const [x, zz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
      b.stick([x * 0.4, 0.1, zz * 0.88], [x * 0.4, 0.38, zz * 0.88], 0.04, 'silver');
      b.cyl([0.1, 0.05, 0.1], [x * 0.4, 0.05, zz * 0.88], { color: '#1e1e1e', rot: [0, 0, 90], edge: 'soft' });
    }
    b.box([0.88, 0.15, 1.25], [0, 0.55, 0.36], { color: 'white', round: 0.4, edge: 'soft' });
    b.box([0.92, 0.06, 1.1], [0, 0.645, 0.45], { color: '#81d4fa', round: 0.4, edge: 'soft' });
    b.box([0.88, 0.15, 0.75], [0, 0.55, -0.62], { color: 'white', round: 0.4, name: 'back', pivot: [0, 0.55, -0.25], mover: { kind: 'swing', axis: 'x', amount: 40 }, edge: 'soft' });
    b.ball([0.55, 0.14, 0.3], [0, 0.68, -0.8], { color: '#f2efe8', parent: 'back', edge: 'soft' });
    b.box([0.95, 0.45, 0.06], [0, 0.72, 1.0], { color: '#5a6066', round: 0.2 });
    b.box([0.3, 0.2, 0.02], [0, 0.78, 1.04], { color: 'white' });
    b.box([0.95, 0.75, 0.06], [0, 0.85, -1.0], { color: '#5a6066', round: 0.2 });
    b.pair((s) => {
      b.stick([s * 0.48, 0.78, -0.6], [s * 0.48, 0.78, 0.2], 0.03, 'silver');
      b.stick([s * 0.48, 0.5, -0.6], [s * 0.48, 0.78, -0.6], 0.025, 'silver');
      b.stick([s * 0.48, 0.5, 0.2], [s * 0.48, 0.78, 0.2], 0.025, 'silver');
    });
    b.stick([0.58, 0, -1.0], [0.58, 2.0, -1.0], 0.03, 'silver');
    b.stick([0.48, 1.95, -1.0], [0.68, 1.95, -1.0], 0.02, 'silver');
    b.box([0.12, 0.2, 0.05], [0.58, 1.78, -0.95], { color: '#bfe4f6', round: 0.4 });
    b.rod([0.58, 1.68, -0.95], [0.35, 0.8, -0.5], 0.008, '#e0f0f6', { noInk: true });
    return withSockets(
      b.act({ click: [[A.operate('back', 'up'), A.say('Whirr...', 1.5)], [A.operate('back', 'down'), A.say('Whirr...', 1.5)]] }).done(),
      [{ name: 'bed', at: [0, 0.68, 0.2], kind: 'seat' }],
    );
  }),
  // A hot-air balloon at real size (21 m): a teardrop envelope in bands of red and yellow with its load tapes, the
  // skirt, the burner and a wicker basket hung on ropes. The burner roars and it rises, then settles.
  e('hot air balloon', 'sky', 'balloons', () => {
    const b = m('hot air balloon');
    const R = (t: number) => {
      const pts = [[0, 0.3], [0.12, 0.55], [0.35, 0.88], [0.6, 1], [0.82, 0.92], [0.94, 0.62], [1, 0.12]];
      for (let i = 0; i < pts.length - 1; i++) if (t <= pts[i + 1][0]) return pts[i][1] + ((t - pts[i][0]) / (pts[i + 1][0] - pts[i][0])) * (pts[i + 1][1] - pts[i][1]);
      return 0.12;
    };
    const W = 15, L = 18, y0 = 3.4;
    const bands: Array<[number, number, string]> = [[0, 0.3, '#f6d24a'], [0.3, 0.55, '#d32f2f'], [0.55, 0.78, '#f6d24a'], [0.78, 1, '#d32f2f']];
    bands.forEach(([t0, t1, c], i) => {
      const prof: Array<[number, number, number, number]> = [0, 0.25, 0.5, 0.75, 1].map((u) => [u, R(t0 + (t1 - t0) * u), R(t0 + (t1 - t0) * u), 0]);
      b.loft([W, W, L * (t1 - t0) + 0.02], [0, y0 + L * (t0 + t1) / 2, 0], prof, { color: c, rot: [-90, 0, 0], ...(i === 0 ? { name: 'envelope', pivot: [0, 0, 0] } : { parent: 'envelope' }) });
    });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      for (let j = 0; j < 8; j++) {
        const t0 = j / 8, t1 = (j + 1) / 8;
        const p = (t: number): V => [Math.cos(a) * R(t) * W * 0.505, y0 + L * t, Math.sin(a) * R(t) * W * 0.505];
        b.rod(p(t0), p(t1), 0.12, '#f2ede4', { noInk: true, parent: 'envelope' });
      }
    }
    b.cyl([4.6, 1.2, 4.6], [0, y0 - 0.5, 0], { color: '#d32f2f', taper: 1.0, parent: 'envelope' });
    for (const [x, zz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) b.rod([x * 1.6, y0 - 1.1, zz * 1.6], [x * 0.6, 1.15, zz * 0.6], 0.04, 'tan', { parent: 'envelope' });
    b.box([0.9, 0.1, 0.9], [0, 2.1, 0], { color: '#8a8e92', parent: 'envelope', edge: 'sharp' });
    b.cyl([0.35, 0.4, 0.35], [0, 2.35, 0], { color: '#5a5e62', parent: 'envelope', edge: 'sharp' });
    b.cone([0.5, 1.4, 0.5], [0, 3.2, 0], { color: '#ffb84a', glow: true, name: 'flame', parent: 'envelope', scale: 0.35 });
    for (const [x, zz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) b.stick([x * 0.42, 1.15, zz * 0.42], [x * 0.42, 2.1, zz * 0.42], 0.035, '#5a5e62', { parent: 'envelope' });
    b.box([1.25, 1.1, 1.25], [0, 0.55, 0], { color: '#c8a46a', round: 0.15, parent: 'envelope', edge: 'sharp' });
    b.each(4, (i) => b.box([1.27, 0.03, 1.27], [0, 0.2 + i * 0.22, 0], { color: '#a8844a', parent: 'envelope', noInk: true }));
    b.box([1.32, 0.1, 1.32], [0, 1.1, 0], { color: '#6a4426', round: 0.4, parent: 'envelope' });
    return withSockets(
      b
        .act({
          click: [
            A.par(A.pose('flame', { scale: 1, dur: 0.2 }), A.effect('fire', { dur: 1.5 }), A.say('WHOOSH!', 1.5)),
            A.pose('envelope', { move: [0, 4, 0], dur: 2 }),
            A.pose('flame', { scale: 0.35, dur: 0.3 }),
            A.pose('envelope', { move: [0, 0, 0], dur: 2.2 }),
          ],
        })
        .done(),
      [{ name: 'basket', at: [0, 0.2, 0], kind: 'inside', part: 'envelope', size: 1 }],
    );
  }),
  // A mug of hot chocolate topped with whipped cream, marshmallows and a dusting of cocoa; it steams.
  e('hot chocolate', 'food', 'drinks', () => {
    const b = m('hot chocolate');
    mug(b, 0, 0, 0.1, 0.09, '#c62828', 'chocolate');
    b.ball([0.085, 0.045, 0.085], [0, 0.105, 0], { color: 'white', name: 'cream' });
    b.ball([0.05, 0.04, 0.05], [0, 0.13, 0], { color: 'white', parent: 'cream' }).ball(0.02, [0, 0.155, 0], { color: 'white', parent: 'cream' });
    for (const [x, zz] of [[0.03, 0.02], [-0.03, 0.01], [0.0, -0.03]] as const) b.box([0.014, 0.012, 0.014], [x, 0.125, zz], { color: '#f8bbd0', parent: 'cream' });
    b.each(5, (i) => b.ball(0.004, [-0.02 + i * 0.01, 0.15 - (i % 2) * 0.01, 0.015], { color: '#5a3420', noInk: true, parent: 'cream' }));
    b.box([0.07, 0.006, 0.07], [0, 0.003, 0], { color: '#f2efe8', round: 0.5 });
    return b
      .act({ click: [A.par(A.effect('steam', { dur: 2.5 }), A.pose('cream', { move: [0, 0.008, 0], dur: 0.4 })), A.pose('cream', { move: [0, 0, 0], dur: 0.4 })] })
      .done();
  }),
  // A hot dog: soft split bun, a grilled frankfurter with grill marks, a zigzag of mustard and a line of ketchup;
  // the sausage slides out and back.
  e('hot dog', 'food', 'fast food', () => {
    const b = m('hot dog');
    b.pair((s) => b.capsule([0.04, 0.17, 0.036], [0, 0.022, s * 0.017], { color: '#e0a860', rot: [0, 0, 90] }));
    b.capsule([0.03, 0.2, 0.03], [0, 0.04, 0], { color: '#a8452e', rot: [0, 0, 90], name: 'sausage' });
    b.each(4, (i) => b.box([0.004, 0.031, 0.031], [-0.045 + i * 0.03, 0.041, 0], { color: '#5a2418', rot: [20, 0, 0], parent: 'sausage', noInk: true }));
    path(b, [[-0.07, 0.056, 0], [-0.05, 0.057, 0.008], [-0.03, 0.057, -0.008], [-0.01, 0.057, 0.008], [0.01, 0.057, -0.008], [0.03, 0.057, 0.008], [0.05, 0.057, -0.008], [0.07, 0.056, 0]], 0.006, '#f6d24a', { parent: 'sausage' });
    b.rod([-0.06, 0.054, 0.004], [0.06, 0.054, 0.004], 0.005, '#c62828', { parent: 'sausage', noInk: true });
    return b.act({ click: [A.pose('sausage', { move: [0.07, 0, 0], dur: 0.4 }), A.say('Squeak!', 1), A.pose('sausage', { move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A hot dog cart at real size: a stainless steel cart on two wheels with a push handle, a striped umbrella, the
  // steam bin with a lid that opens, a griddle of franks and squeeze bottles; a hot dog comes out.
  e('hot dog stand', 'places', 'stands', () => {
    const b = m('hot dog stand', { edge: 'sharp' });
    b.box([1.8, 0.75, 0.85], [0, 0.65, 0], { color: '#c8ccd0', round: 0.08 });
    b.box([1.82, 0.05, 0.87], [0, 1.04, 0], { color: '#e8ecf0', round: 0.2 });
    b.label('HOT DOGS', [1.4, 0.3], [0, 0.8, 0.44], { color: '#f6d24a', depth: 0.02 });
    b.box([1.0, 0.06, 0.4], [0, 1.06, 0.2], { color: '#2b2b2b' });
    b.each(4, (i) => b.capsule([0.035, 0.18, 0.035], [-0.3 + i * 0.2, 1.11, 0.2], { color: '#a8452e', rot: [0, 0, 90], edge: 'soft' }));
    b.box([0.5, 0.18, 0.4], [0.55, 1.15, -0.15], { color: '#a8acb0', round: 0.2 });
    b.box([0.52, 0.04, 0.42], [0.55, 1.26, -0.15], { color: '#e8ecf0', round: 0.3, name: 'lid', pivot: [0.55, 1.26, -0.36], mover: { kind: 'swing', axis: 'x', amount: -100 } });
    b.cyl([0.07, 0.2, 0.07], [-0.6, 1.17, -0.2], { color: '#d32f2f', round: 0.3 });
    b.cyl([0.07, 0.2, 0.07], [-0.45, 1.17, -0.2], { color: '#f6d24a', round: 0.3 });
    b.pair((s) => wheel(b, 0.6, [s * 0.95, 0.3, 0.0], { name: s > 0 ? 'wheelL' : 'wheelR' }));
    b.stick([-0.95, 0.3, 0], [0.95, 0.3, 0], 0.05, '#5a5e62');
    b.pair((s) => b.stick([s * 0.6, 0, -0.35], [s * 0.6, 0.3, -0.35], 0.05, '#5a5e62'));
    b.rod([0.85, 0.9, -0.4], [1.3, 1.0, -0.7], 0.035, '#5a5e62');
    b.rod([0.85, 0.9, 0.4], [1.3, 1.0, 0.1], 0.035, '#5a5e62');
    b.stick([1.3, 1.0, -0.7], [1.3, 1.0, 0.1], 0.04, '#1e1e1e');
    b.stick([0.0, 1.06, 0], [0.0, 2.3, 0], 0.04, 'silver');
    b.each(8, (i) => b.cone([2.2, 0.55, 2.2], [0, 2.45 + i * 0.0005, 0], { color: i % 2 ? 'white' : '#d32f2f', segs: 16, rot: [0, i * 22.5, 0], noInk: i > 0, edge: 'soft' }));
    b.ball(0.08, [0, 2.75, 0], { color: '#d32f2f' });
    return b
      .act({
        click: [
          A.par(A.operate('lid', 'open'), A.effect('steam', { dur: 2 })),
          A.spawn('hd', 'hot dog', { rel: 'front', of: 'self', dist: 'close' }),
          A.say('Sizzle!', 1.2),
          A.wait(1.5),
          A.par(A.operate('lid', 'close'), A.remove('hd', 'pop')),
        ],
      })
      .done();
  }),
  // A two-ring electric hot plate: white enamel case, spiral elements that glow red when switched on, knobs and a
  // pilot light.
  e('hot plate', 'kitchen', 'appliances', () => {
    const b = m('hot plate', { edge: 'sharp' });
    b.box([0.5, 0.07, 0.3], [0, 0.035, 0], { color: '#f4f4f0', round: 0.3 });
    b.pair((s) => {
      b.cyl([0.2, 0.008, 0.2], [s * 0.12, 0.072, -0.02], { color: '#3a3633' });
      for (const d of [0.18, 0.13, 0.08]) b.torus([d, d, 0.01], [s * 0.12, 0.078, -0.02], { color: '#5a4a44', rot: [90, 0, 0], noInk: true });
      b.cyl([0.18, 0.006, 0.18], [s * 0.12, 0.08, -0.02], { color: '#ff5a2a', glow: true, name: s > 0 ? 'ringL' : 'ringR', mover: { kind: 'light' }, noInk: true });
      b.cyl([0.04, 0.02, 0.04], [s * 0.12, 0.04, 0.155], { color: '#1e1e1e', rot: [90, 0, 0], name: s > 0 ? 'knobL' : 'knobR' });
    });
    b.ball(0.012, [0, 0.045, 0.15], { color: '#ff3b30', glow: true, name: 'pilot', mover: { kind: 'light' } });
    return b
      .act({
        click: [
          [A.par(A.pose('knobL', { rot: [0, 0, -120], dur: 0.3 }), A.pose('knobR', { rot: [0, 0, -120], dur: 0.3 })), A.operate('ring', 'on'), A.operate('pilot', 'on'), A.effect('steam', { dur: 1.5 })],
          [A.par(A.pose('knobL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('knobR', { rot: [0, 0, 0], dur: 0.3 })), A.operate('ring', 'off'), A.operate('pilot', 'off')],
        ],
      })
      .done();
  }),
  // A bottle of hot sauce with a chilli on the label and a green cap; give it a shake and it breathes fire.
  e('hot sauce', 'food', 'sauces', () => {
    const b = m('hot sauce');
    bottle(b, 0, 0, 0.2, 0.05, '#8a1a1a', '#2e7d32', '#f6efdc', 0.4);
    b.capsule([0.012, 0.04, 0.01], [0, 0.06, 0.027], { color: '#d32f2f', rot: [0, 0, 60] }).ball(0.008, [-0.018, 0.071, 0.027], { color: '#2e7d32' });
    return b.act({ click: [A.anim('shake'), A.par(A.effect('fire', { dur: 1.2 }), A.say('Sizzle!', 1.5))] }).done();
  }),
  // A natural hot spring, 3 m across: a steaming turquoise pool ringed with mossy boulders and mineral-crusted
  // rocks; it bubbles.
  e('hot spring', 'nature', 'water', () => {
    const b = m('hot spring');
    b.cyl([3.0, 0.12, 2.6], [0, 0.06, 0], { color: '#e8dcc4' });
    b.cyl([2.5, 0.1, 2.1], [0, 0.12, 0], { color: '#4fc3d8' });
    b.cyl([1.4, 0.104, 1.1], [0.1, 0.122, 0], { color: '#6fd8e8', noInk: true });
    around(13, 1.35).forEach(([x, zz], i) => b.ball([0.5 + (i % 3) * 0.12, 0.3 + (i % 2) * 0.1, 0.45], [x * 1.05, 0.14, zz * 0.9], { color: i % 3 === 0 ? '#7a7570' : i % 3 === 1 ? '#8a8580' : '#6a8a4a' }));
    for (const [x, zz, r] of [[-0.3, 0.1, 0.12], [0.3, -0.2, 0.1], [0.0, 0.3, 0.08]] as const) b.ball(r, [x, 0.17, zz], { color: 'white', noInk: true });
    return b.act({ click: [A.par(A.effect('steam', { dur: 3 }), A.say('Blub... blub...', 2)), A.effect('water_spray', { dur: 1 })] }).done();
  }),
  // A square hot tub at real size (2.1 m, 0.9 m high): cedar-slat cabinet, grey coping, moulded seats round a
  // pool of lit water with jets, steps up the front; it bubbles and its lights switch.
  e('hot tub', 'home', 'outdoor furniture', () => {
    const b = m('hot tub', { edge: 'sharp' });
    b.box([2.1, 0.86, 2.1], [0, 0.43, 0], { color: '#8a5a32', round: 0.05 });
    b.pair((s) => b.each(8, (i) => {
      b.box([0.02, 0.8, 0.02], [-0.92 + i * 0.26, 0.43, s * 1.055], { color: '#6a4426', noInk: true });
      b.box([0.02, 0.8, 0.02], [s * 1.055, 0.43, -0.92 + i * 0.26], { color: '#6a4426', noInk: true });
    }));
    b.box([2.2, 0.08, 2.2], [0, 0.88, 0], { color: '#9a9690', round: 0.4 });
    b.box([1.8, 0.04, 1.8], [0, 0.86, 0], { color: '#e8e4dc', round: 0.3 });
    b.box([1.72, 0.03, 1.72], [0, 0.9, 0], { color: '#4fc3d8', glow: true, name: 'lights', mover: { kind: 'light', on: true } });
    for (const [x, zz] of [[0.3, 0.2], [-0.4, 0.4], [0.5, -0.3], [-0.2, -0.5], [0, 0]] as const) b.ball(0.08, [x, 0.92, zz], { color: 'white', noInk: true });
    b.pair((s) => b.box([0.32, 0.03, 1.4], [s * 0.72, 0.915, 0], { color: '#d8f2f8', noInk: true }));
    b.box([0.9, 0.22, 0.4], [0, 0.11, 1.32], { color: '#8a5a32', round: 0.1 });
    b.box([0.9, 0.22, 0.3], [0, 0.33, 1.25], { color: '#8a5a32', round: 0.1 });
    return withSockets(
      b
        .act({
          click: [
            [A.par(A.effect('water_spray', { dur: 2 }), A.effect('steam', { dur: 2.5 }), A.say('Blub blub bubble!', 2))],
            [A.operate('lights', 'off'), A.wait(1.5), A.operate('lights', 'on')],
          ],
        })
        .done(),
      [{ name: 'seat', at: [0, 0.55, -0.6], kind: 'seat' }],
    );
  }),
  // A ribbed rubber hot water bottle with its neck and screw stopper; unscrew it and steam rises.
  e('hot water bottle', 'home', 'bedroom', () => {
    const b = m('hot water bottle').box([0.2, 0.26, 0.05], [0, 0.13, 0], { color: '#d32f2f', round: 0.6 }).box([0.08, 0.06, 0.035], [0, 0.27, 0], { color: '#d32f2f', round: 0.3 });
    b.cyl([0.05, 0.03, 0.05], [0, 0.31, 0], { color: '#1e1e1e', name: 'stopper' });
    b.torus([0.05, 0.03, 0.01], [0, 0.34, 0], { color: '#1e1e1e', parent: 'stopper' });
    b.each(6, (i) => b.box([0.15, 0.008, 0.01], [0, 0.04 + i * 0.034, 0.024], { color: '#a01e1e', noInk: true }));
    b.box([0.1, 0.04, 0.006], [0, 0.23, 0.024], { color: '#a01e1e', round: 0.4, noInk: true });
    return b.act({ click: [A.pose('stopper', { move: [0, 0.04, 0], rot: [0, 360, 0], dur: 0.5 }), A.effect('steam', { dur: 2 }), A.pose('stopper', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A four-storey hotel: beige walls, balconies with railings on every upper window, a red canopy on brass posts
  // over the entrance, and five stars glowing on the roof.
  e('hotel', 'places', 'hotels', () => {
    const { b, H, z } = shop('hotel', { w: 14, d: 10, floors: 4, wall: '#e8d8b8', trim: '#8a2a2a', sign: 'GRAND HOTEL', signBg: '#f6efdc', glass: '#9fc6d8', door: '#d4af37', cols: 5 });
    for (let f = 1; f < 4; f++) for (let i = 0; i < 5; i++) {
      const x = -7 + 2.8 * (i + 0.5), y = 3.6 + (f - 1) * 3.1 + 0.62;
      b.box([1.6, 0.12, 0.7], [x, y, z + 0.35], { color: '#f6efdc' });
      b.box([1.6, 0.85, 0.05], [x, y + 0.5, z + 0.68], { color: '#cfe6f0', round: 0.1 });
    }
    b.box([3.4, 0.2, 2.6], [0, 2.95, z + 1.3], { color: '#8a2a2a', round: 0.3 });
    b.pair((s) => b.stick([s * 1.5, 0, z + 2.4], [s * 1.5, 2.9, z + 2.4], 0.08, 'brass'));
    b.box([1.6, 0.04, 2.4], [0, 0.02, z + 1.4], { color: '#8a2a2a' });
    b.each(5, (i) => b.star(0.9, [-2.2 + i * 1.1, H + 1.3, 0], { color: '#f6d24a', glow: true, name: `star${i}` }));
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.effect('sparkle', { dur: 2 }), A.par(...[0, 1, 2, 3, 4].map((i) => A.pose(`star${i}`, { rot: [0, 360, 0], dur: 1 }))), A.par(...[0, 1, 2, 3, 4].map((i) => A.pose(`star${i}`, { rot: [0, 0, 0], dur: 0 })))],
        ],
      })
      .done();
  }),
  // An hourglass in a turned wooden frame: two glass bulbs and the sand; it flips and the sand runs through.
  e('hourglass', 'home', 'clocks', () => {
    const b = m('hourglass');
    b.cyl([0.13, 0.02, 0.13], [0, 0.01, 0], { color: '#8a5a32', name: 'glass', pivot: [0, 0.1, 0], edge: 'sharp' });
    b.cyl([0.13, 0.02, 0.13], [0, 0.19, 0], { color: '#8a5a32', parent: 'glass', edge: 'sharp' });
    around(3, 0.055, 0.3).forEach(([x, zz]) => b.stick([x, 0.02, zz], [x, 0.18, zz], 0.011, '#5a3a22', { parent: 'glass' }));
    b.cyl([0.088, 0.08, 0.088], [0, 0.06, 0], { color: '#dff0f6', taper: 0.12, parent: 'glass' });
    b.cyl([0.088, 0.08, 0.088], [0, 0.14, 0], { color: '#dff0f6', taper: 0.12, rot: [180, 0, 0], parent: 'glass' });
    b.cyl([0.084, 0.032, 0.084], [0, 0.036, 0], { color: '#e3c27a', taper: 0.62, name: 'sandA', parent: 'glass' });
    b.cyl([0.05, 0.022, 0.05], [0, 0.118, 0], { color: '#e3c27a', taper: 0.3, rot: [180, 0, 0], name: 'sandB', parent: 'glass', scale: 0.2 });
    return b
      .act({
        click: [
          [A.pose('glass', { rot: [0, 0, 180], dur: 0.7 }), A.par(A.pose('sandA', { scale: 0.15, dur: 3 }), A.pose('sandB', { scale: 1.6, dur: 3 })), A.say('Shhhh...', 1.5)],
          [A.pose('glass', { rot: [0, 0, 0], dur: 0.7 }), A.par(A.pose('sandB', { scale: 0.2, dur: 3 }), A.pose('sandA', { scale: 1, dur: 3 })), A.say('Shhhh...', 1.5)],
        ],
      })
      .done();
  }),
  // A houseboat at real size (11 m): a pontoon hull and deck, a clapboard cabin with windows, a pitched roof, a
  // front porch with railings and a life ring, a roof deck; the door opens, and it bobs and toots.
  e('houseboat', 'garage', 'boats', () => {
    const b = m('houseboat', { view: 'side', edge: 'sharp' });
    b.loft([3.4, 1.0, 11], [0, 0.5, 0], [[0, 0.95, 1, 0], [0.5, 1, 1, 0], [0.9, 0.95, 0.95, 0], [1, 0.7, 0.6, 0.15]], { color: '#1f3f6a', boxy: 0.85, cut: 'bottom', name: 'hull', edge: 'soft' });
    b.box([3.42, 0.12, 11], [0, 0.98, 0], { color: '#f2ede4', parent: 'hull' });
    b.box([3.0, 0.08, 10.6], [0, 1.08, 0], { color: '#a8743a', parent: 'hull' });
    b.box([2.8, 2.3, 6.0], [0, 2.27, -1.6], { color: '#f6d88a', parent: 'hull' });
    b.each(9, (i) => b.box([2.82, 0.03, 6.02], [0, 1.3 + i * 0.25, -1.6], { color: '#e0c070', noInk: true, parent: 'hull' }));
    b.wedge([3.4, 1.2, 6.5], [0, 4.0, -1.6], { color: '#8a2a2a', parent: 'hull' });
    b.pair((s) => {
      for (const zz of [-3.6, -1.6, 0.2]) {
        b.box([0.06, 0.95, 1.0], [s * 1.41, 2.4, zz], { color: 'white', parent: 'hull' });
        b.box([0.07, 0.8, 0.85], [s * 1.42, 2.4, zz], { color: '#8fb8cc', parent: 'hull' });
      }
      b.stick([s * 1.5, 1.1, 1.6], [s * 1.5, 2.0, 1.6], 0.06, 'white', { parent: 'hull' });
      b.stick([s * 1.5, 1.1, 5.2], [s * 1.5, 2.0, 5.2], 0.06, 'white', { parent: 'hull' });
      b.stick([s * 1.5, 2.0, 1.4], [s * 1.5, 2.0, 5.3], 0.06, 'white', { parent: 'hull' });
      b.stick([s * 1.5, 1.55, 1.4], [s * 1.5, 1.55, 5.3], 0.04, 'white', { parent: 'hull' });
    });
    b.stick([-1.5, 2.0, 5.3], [1.5, 2.0, 5.3], 0.06, 'white', { parent: 'hull' });
    b.box([1.0, 2.0, 0.08], [0, 2.12, 1.42], { color: '#5a3a22', round: 0.1, name: 'door', parent: 'hull', pivot: [-0.5, 2.12, 1.42], mover: { kind: 'swing', axis: 'y', amount: -95 } });
    b.box([0.6, 0.5, 0.06], [0, 2.6, 1.47], { color: '#8fb8cc', parent: 'door' });
    b.torus([0.6, 0.6, 0.12], [1.0, 2.4, 1.44], { color: '#e53935', tube: 0.3, parent: 'hull' });
    b.box([2.6, 0.08, 2.0], [0, 4.0, 2.2], { color: '#a8743a', parent: 'hull' });
    b.pair((s) => b.stick([s * 1.2, 1.1, 2.2], [s * 1.2, 4.0, 2.2], 0.08, 'white', { parent: 'hull' }));
    b.box([0.5, 0.5, 0.5], [0.6, 4.3, 2.4], { color: '#2e7d32', round: 0.4, parent: 'hull' });
    b.cyl([0.6, 0.05, 0.6], [-0.5, 4.5, 2.2], { color: '#f6efdc', parent: 'hull' });
    b.stick([-0.5, 4.0, 2.2], [-0.5, 4.5, 2.2], 0.04, 'silver', { parent: 'hull' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.say('Toot toot!', 1.5), A.effect('water_spray', { dur: 1.5 })), A.pose('hull', { rot: [0, 0, 3], dur: 0.6 }), A.pose('hull', { rot: [0, 0, -3], dur: 0.8 }), A.pose('hull', { rot: [0, 0, 0], dur: 0.6 })],
        ],
      })
      .done();
  }),
  // A self-balancing hoverboard: two big wheels under arched fenders, a central deck with rubber foot pads and a
  // light strip that glows as the wheels spin.
  e('hoverboard (real)', 'garage', 'scooters', () => {
    const b = m('hoverboard (real)');
    b.box([0.4, 0.06, 0.17], [0, 0.11, 0], { color: '#f4f4f0', round: 0.4, edge: 'sharp' });
    b.pair((s) => {
      const n = s > 0 ? 'wheelL' : 'wheelR';
      b.cyl([0.17, 0.07, 0.17], [s * 0.27, 0.085, 0], { color: '#2b2b2b', rot: [0, 0, 90], name: n });
      b.cyl([0.1, 0.072, 0.1], [s * 0.27, 0.085, 0], { color: '#8a8e92', rot: [0, 0, 90], parent: n });
      b.ball([0.1, 0.14, 0.23], [s * 0.27, 0.14, 0], { color: '#f4f4f0', edge: 'sharp' });
      b.box([0.12, 0.012, 0.13], [s * 0.11, 0.145, 0], { color: '#1e1e1e', round: 0.3 });
    });
    b.box([0.22, 0.015, 0.01], [0, 0.105, 0.087], { color: '#26c6da', glow: true, name: 'leds', mover: { kind: 'light' } });
    return b
      .act({
        click: [
          [A.operate('leds', 'on'), A.par(A.pose('wheelL', { spin: [720, 0, 0] }), A.pose('wheelR', { spin: [720, 0, 0] }), A.say('Whirrr!', 1.5)), A.wait(1.5), A.par(A.pose('wheelL', { spin: [0, 0, 0] }), A.pose('wheelR', { spin: [0, 0, 0] }))],
          [A.operate('leds', 'off')],
        ],
      })
      .done();
  }),
  // A sci-fi hoverboard floating off the ground: a pink deck with a yellow stripe and glowing hover pads; it bobs.
  e('hoverboard (sci-fi)', 'toys', 'sci-fi toys', () => {
    const b = m('hoverboard (sci-fi)').box([0.75, 0.05, 0.22], [0, 0.17, 0], { color: '#f06292', round: 0.8, name: 'board' });
    b.box([0.4, 0.052, 0.06], [0, 0.172, 0], { color: '#f6d24a', round: 0.5, noInk: true, parent: 'board' });
    b.label('MATTEL', [0.14, 0.03], [0.25, 0.172, 0.11], { color: '#f6d24a', parent: 'board', depth: 0.003 });
    b.pair((s) => {
      b.box([0.14, 0.03, 0.16], [s * 0.25, 0.138, 0], { color: '#9ccc65', round: 0.4, parent: 'board' });
      b.cyl([0.12, 0.012, 0.12], [s * 0.25, 0.118, 0], { color: '#80deea', glow: true, noInk: true, parent: 'board' });
    });
    return b
      .act({ click: [A.pose('board', { move: [0, 0.15, 0], dur: 0.5 }), A.effect('sparkle', { dur: 1.5 }), A.pose('board', { move: [0, 0.04, 0], dur: 0.5 }), A.pose('board', { move: [0, 0.12, 0], rot: [0, 0, 5], dur: 0.5 }), A.pose('board', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.5 })] })
      .done();
  }),
  // A rescue hovercraft at real size (8 m): a black inflatable skirt, an orange hull and deck, a cabin with a
  // wraparound windscreen, a big ducted thrust fan with twin rudders behind it. It lifts on its cushion and roars.
  e('hovercraft', 'garage', 'boats', () => {
    const b = m('hovercraft', { view: 'side', edge: 'sharp' });
    b.loft([4.0, 0.9, 8.0], [0, 0.45, 0], [[0, 0.9, 0.9, 0], [0.1, 1, 1, 0], [0.85, 1, 1, 0], [1, 0.7, 0.8, 0]], { color: '#1e1e1e', boxy: 0.7, name: 'craft', edge: 'soft' });
    b.box([3.7, 0.35, 7.6], [0, 1.05, 0], { color: '#f57c00', round: 0.2, parent: 'craft' });
    b.box([3.6, 0.06, 7.4], [0, 1.24, 0], { color: '#d8d0c0', parent: 'craft' });
    b.label('RESCUE', [1.8, 0.3], [1.86, 1.05, 0.5], { color: '#f57c00', rot: [0, 90, 0], parent: 'craft', depth: 0.02 });
    b.box([2.6, 1.2, 2.8], [0, 1.85, 1.0], { color: '#f4f4f0', round: 0.2, parent: 'craft' });
    b.box([2.5, 0.55, 0.08], [0, 2.1, 2.42], { color: '#3a4656', rot: [-25, 0, 0], parent: 'craft' });
    b.pair((s) => b.box([0.06, 0.5, 2.2], [s * 1.31, 2.1, 1.0], { color: '#3a4656', parent: 'craft' }));
    b.box([2.7, 0.12, 2.9], [0, 2.5, 1.0], { color: '#f57c00', parent: 'craft' });
    b.ball(0.2, [0, 2.65, 1.0], { color: '#3a7bd5', glow: true, parent: 'craft' });
    b.torus([2.4, 2.4, 0.6], [0, 2.4, -2.6], { color: '#f57c00', tube: 0.12, parent: 'craft' });
    b.cyl([0.4, 0.3, 0.4], [0, 2.4, -2.6], { color: '#3a3d42', rot: [90, 0, 0], name: 'fan', parent: 'craft', mover: { kind: 'spin', axis: 'z', amount: 1440 } });
    b.box([2.1, 0.22, 0.06], [0, 2.4, -2.6], { color: '#2b2d31', parent: 'fan' });
    b.box([0.22, 2.1, 0.06], [0, 2.4, -2.6], { color: '#2b2d31', parent: 'fan' });
    b.pair((s) => {
      b.rod([s * 0.9, 1.25, -2.6], [s * 0.9, 1.4, -2.6], 0.12, '#5a5e62', { parent: 'craft' });
      b.box([0.06, 2.0, 0.6], [s * 0.45, 2.4, -3.2], { color: '#f4f4f0', name: s > 0 ? 'rudderL' : 'rudderR', parent: 'craft', pivot: [s * 0.45, 2.4, -2.95] });
    });
    return withSockets(
      b
        .act({
          click: [
            [A.operate('fan', 'on'), A.pose('craft', { move: [0, 0.35, 0], dur: 0.8 }), A.par(A.say('VRRROOOM!', 2), A.effect('water_spray', { dur: 2 })), A.par(A.pose('rudderL', { rot: [0, 20, 0], dur: 0.4 }), A.pose('rudderR', { rot: [0, 20, 0], dur: 0.4 })), A.par(A.pose('rudderL', { rot: [0, -20, 0], dur: 0.5 }), A.pose('rudderR', { rot: [0, -20, 0], dur: 0.5 })), A.par(A.pose('rudderL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('rudderR', { rot: [0, 0, 0], dur: 0.3 }))],
            [A.operate('fan', 'off'), A.pose('craft', { move: [0, 0, 0], dur: 1 }), A.say('Pffff...', 1.5)],
          ],
        })
        .done(),
      [{ name: 'seat', at: [0.5, 1.4, 1.2], kind: 'seat', part: 'craft' }],
    );
  }),
  // A chrome hubcap with five spokes round a centre badge, standing on its rim; it rolls away and back.
  e('hubcap', 'garage', 'car parts', () => {
    const b = m('hubcap', { edge: 'sharp' }).cyl([0.38, 0.04, 0.38], [0, 0.19, 0], { color: 'silver', rot: [90, 0, 0], name: 'cap' });
    b.torus([0.3, 0.3, 0.03], [0, 0.19, 0.02], { color: '#9aa0a6', parent: 'cap' });
    around(5, 0.085).forEach(([x, y], i) => b.box([0.035, 0.15, 0.02], [x, 0.19 + y, 0.025], { color: '#c8ccd0', rot: [0, 0, 90 - i * 72], parent: 'cap' }));
    b.cyl([0.08, 0.03, 0.08], [0, 0.19, 0.03], { color: '#3a3d42', rot: [90, 0, 0], parent: 'cap' });
    b.cyl([0.05, 0.032, 0.05], [0, 0.19, 0.035], { color: 'silver', rot: [90, 0, 0], parent: 'cap', noInk: true });
    return b.act({ click: [A.pose('cap', { move: [0.8, 0, 0], rot: [0, 0, -240], dur: 1 }), A.say('Clatter!', 1), A.pose('cap', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1 })] }).done();
  }),
  // A huge granite boulder, 3 m: split faces, a mossy cap, lichen and fallen stones; it rumbles.
  e('huge boulder', 'nature', 'rocks', () =>
    m('huge boulder')
      .ball([3.2, 2.5, 2.8], [0, 1.2, 0], { color: '#8a8580' })
      .ball([1.9, 1.7, 1.9], [0.9, 1.9, 0.2], { color: '#9a9590' })
      .ball([1.6, 1.2, 1.6], [-1.2, 0.6, 0.7], { color: '#7a7570' })
      .ball([1.3, 0.35, 1.1], [0.4, 2.62, 0.1], { color: '#6a8a4a', noInk: true })
      .ball([0.5, 0.3, 0.06], [-0.6, 1.6, 1.3], { color: '#c8c070', noInk: true })
      .ball(0.45, [1.7, 0.2, 1.2], { color: '#9a9590' })
      .ball(0.32, [-0.7, 0.15, 1.5], { color: '#7a7570' })
      .act({ click: [A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), A.say('Rumble...', 1.5))] })
      .done(),
  ),
  // A striped hula hoop, 0.9 m, standing on its edge; it spins like it is round a waist.
  e('hula hoop', 'toys', 'outdoor toys', () => {
    const b = m('hula hoop').torus([0.9, 0.9, 0.035], [0, 0.45, 0], { color: '#e040fb', tube: 0.078, name: 'hoop', pivot: [0, 0.45, 0] });
    b.each(12, (i) => {
      const a = (i / 12) * Math.PI * 2;
      b.ball([0.075, 0.075, 0.04], [Math.cos(a) * 0.415, 0.45 + Math.sin(a) * 0.415, 0], { color: i % 2 ? '#f6d24a' : '#26c6da', noInk: true, parent: 'hoop' });
    });
    return b.act({ click: [A.pose('hoop', { rot: [80, 0, 0], move: [0, 0.4, 0], dur: 0.4 }), A.pose('hoop', { spin: [0, 720, 0] }), A.say('Whirl whirl!', 1.5), A.wait(1.5), A.pose('hoop', { spin: [0, 0, 0] }), A.pose('hoop', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A grass hula skirt on its woven waistband with a lei of flowers; it sways.
  e('hula skirt', 'wardrobe', 'skirts', () => {
    const b = m('hula skirt').torus([0.36, 0.32, 0.065], [0, 0.75, 0], { color: '#c8a06a', rot: [90, 0, 0], tube: 0.2, name: 'skirt', pivot: [0, 0.75, 0] });
    around(22, 0.16).forEach(([x, zz], i) => b.rod([x, 0.73, zz], [x * 1.6, 0.03, zz * 1.6], 0.032, i % 3 ? '#9ac24a' : '#d9c85a', { parent: 'skirt' }));
    b.each(7, (i) => {
      const a = (-0.4 + i * 0.13) * Math.PI;
      b.ball(0.06, [Math.sin(a) * 0.17, 0.77, Math.cos(a) * 0.15], { color: ['#f6d24a', '#f48fb1', 'white', '#ff7043'][i % 4], parent: 'skirt' });
    });
    return b.act({ click: [A.pose('skirt', { rot: [0, 0, 8], dur: 0.3 }), A.pose('skirt', { rot: [0, 0, -8], dur: 0.4 }), A.pose('skirt', { rot: [0, 0, 8], dur: 0.4 }), A.pose('skirt', { rot: [0, 0, 0], dur: 0.3 }), A.say('Swish swish', 1.2)] }).done();
  }),
  // A boat hull hauled out on keel blocks (14 m): red antifouling below the waterline, black topsides with a white
  // boot stripe and a raised bow, the keel, a propeller that turns and the rudder, props holding it upright.
  e('hull', 'garage', 'boat parts', () => {
    const b = m('hull', { view: 'side', edge: 'sharp' });
    const prof: Array<[number, number, number, number]> = [[0, 0.8, 0.8, 0.05], [0.25, 1, 1, 0], [0.7, 0.95, 1, 0], [0.9, 0.6, 1, 0.02], [1, 0.08, 1, 0.08]];
    b.loft([4.2, 3.4, 14], [0, 3.0, 0], prof, { color: '#b71c1c', cut: 'bottom', boxy: 0.3, edge: 'soft' });
    b.loft([4.3, 2.6, 14.1], [0, 3.0, 0.03], prof, { color: '#1e2a3a', cut: 'top', boxy: 0.6, edge: 'soft' });
    b.loft([4.32, 0.25, 14.12], [0, 3.02, 0.04], prof, { color: 'white', boxy: 0.6, noInk: true, edge: 'soft' });
    b.loft([3.4, 1.6, 4], [0, 4.1, 4.6], [[0, 1, 0.3, -0.3], [0.6, 0.7, 0.8, 0], [1, 0.1, 1, 0.1]], { color: '#1e2a3a', cut: 'top', boxy: 0.6, edge: 'soft' });
    b.box([3.5, 0.08, 10.5], [0, 4.28, -1.2], { color: '#6a5a4a' });
    b.box([0.3, 1.0, 11], [0, 1.25, -0.8], { color: '#8a1a1a' });
    for (const zz of [-4.5, -1, 2.5, 5.5]) b.box([1.0, 0.8, 0.6], [0, 0.4, zz], { color: '#8a5a32' });
    b.pair((s) => {
      b.rod([s * 2.6, 0, 1.5], [s * 1.6, 2.4, 1.5], 0.12, '#5a5e62');
      b.rod([s * 2.6, 0, -3.5], [s * 1.6, 2.4, -3.5], 0.12, '#5a5e62');
    });
    b.stick([0, 1.6, -6.3], [0, 1.6, -6.9], 0.15, 'steel');
    b.cyl([0.3, 0.3, 0.3], [0, 1.6, -6.95], { color: '#c9a040', rot: [90, 0, 0], name: 'prop', mover: { kind: 'spin', axis: 'z', amount: 600 } });
    b.each(3, (i) => b.box([0.36, 0.7, 0.04], [Math.sin((i * 2 * Math.PI) / 3) * 0.3, 1.6 + Math.cos((i * 2 * Math.PI) / 3) * 0.3, -6.95], { color: '#c9a040', rot: [0, 25, -i * 120], parent: 'prop' }));
    b.box([0.12, 1.5, 0.8], [0, 1.75, -7.5], { color: '#8a1a1a' });
    return b.act({ click: [[A.operate('prop', 'on'), A.say('Whirr...', 1.5)], [A.operate('prop', 'off'), A.effect('sparkle', { dur: 1.2 })]] }).done();
  }),
  // A cool-mist humidifier: a translucent water tank on a white base with a blue night-light ring and a mist
  // nozzle on top; it puffs mist.
  e('humidifier', 'home', 'appliances', () =>
    m('humidifier')
      .cyl([0.25, 0.08, 0.25], [0, 0.04, 0], { color: 'white', edge: 'sharp', round: 0.3 })
      .torus([0.25, 0.25, 0.015], [0, 0.065, 0], { color: '#4fc3f7', rot: [90, 0, 0], glow: true, name: 'ring', mover: { kind: 'light' } })
      .cyl([0.23, 0.24, 0.23], [0, 0.2, 0], { color: '#bfe6f5', taper: 0.82 })
      .cyl([0.2, 0.12, 0.2], [0, 0.14, 0], { color: '#8fd0f0', taper: 0.88, noInk: true })
      .dome([0.19, 0.06, 0.19], [0, 0.35, 0], { color: 'white' })
      .cyl([0.045, 0.045, 0.045], [0, 0.4, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.03, 0.01, 0.03], [0, 0.42, 0], { color: '#3a3d42' })
      .cyl([0.03, 0.012, 0.03], [0.08, 0.06, 0.1], { color: '#3a3d42', rot: [90, 0, 0] })
      .act({ click: [[A.operate('ring', 'on'), A.par(A.effect('steam', { dur: 3 }), A.say('Psssss...', 2))], [A.operate('ring', 'off')]] })
      .done(),
  ),
  // A track hurdle at men's height (1.07 m): weighted L feet, white uprights and a striped top bar; knocked, it
  // tips over and is set back up.
  e('hurdle', 'sports', 'track', () => {
    const b = m('hurdle', { edge: 'sharp' });
    b.pair((s) => b.box([0.08, 0.08, 0.7], [s * 0.6, 0.04, 0], { color: '#3a3d42', name: s > 0 ? 'footL' : 'footR' }));
    b.pair((s) => b.stick([s * 0.6, 0.06, 0.25], [s * 0.6, 1.0, 0.25], 0.04, 'white', { name: s > 0 ? 'postL' : 'postR', pivot: [s * 0.6, 0.06, 0.25] }));
    b.box([1.26, 0.13, 0.025], [0, 1.0, 0.25], { color: 'white', parent: 'postL' });
    b.each(4, (i) => b.box([0.16, 0.132, 0.027], [-0.48 + i * 0.32, 1.0, 0.25], { color: '#1e1e1e', noInk: true, parent: 'postL' }));
    b.stick([-0.6, 0.06, 0.25], [-0.6, 0.94, 0.25], 0.04, 'white', { parent: 'postL' });
    return b
      .act({ click: [A.par(A.pose('postL', { rot: [80, 0, 0], dur: 0.35 }), A.pose('postR', { rot: [80, 0, 0], dur: 0.35 }), A.say('Clatter!', 1.2)), A.wait(1), A.par(A.pose('postL', { rot: [0, 0, 0], dur: 0.5 }), A.pose('postR', { rot: [0, 0, 0], dur: 0.5 }))] })
      .done();
  }),
  // A round thatched hut (a rondavel, 4 m across, 5 m to the top): soft mud walls 2.1 m high on a darker footing,
  // a deep layered conical thatch roof on a ring of eave poles, a 1.85 m plank door (people walk in upright) with a
  // stone step, and a small window; the door opens and smoke drifts from the roof.
  e('hut', 'places', 'houses', () => {
    const b = m('hut');
    b.cyl([4.0, 2.1, 4.0], [0, 1.05, 0], { color: '#b88a5a' });
    b.cyl([4.06, 0.25, 4.06], [0, 0.125, 0], { color: '#8a6a4a' });
    b.cone([5.4, 2.6, 5.4], [0, 3.5, 0], { color: '#c9a050' });
    b.cyl([5.45, 0.25, 5.45], [0, 2.2, 0], { color: '#b8903e', taper: 0.95 });
    for (let i = 0; i < 6; i++) b.cone([5.4 - i * 0.8, 0.06, 5.4 - i * 0.8], [0, 2.35 + i * 0.4, 0], { color: '#a8803a', noInk: true });
    b.cyl([0.35, 0.6, 0.35], [0, 4.85, 0], { color: '#a8803a', taper: 0.4 });
    around(6, 2.45, 0.3).forEach(([x, zz]) => b.stick([x, 0, zz], [x, 2.15, zz], 0.11, '#5a3a22', { edge: 'sharp' }));
    b.box([0.95, 1.95, 0.12], [0, 1.0, 1.98], { color: '#3a2416', edge: 'sharp' });
    b.box([1.1, 0.12, 0.45], [0, 0.06, 2.2], { color: 'stone', edge: 'sharp', round: 0.2 });
    b.box([0.85, 1.85, 0.08], [0, 0.97, 2.05], { color: '#8a5a32', round: 0.2, name: 'door', pivot: [-0.425, 0.97, 2.05], mover: { kind: 'swing', axis: 'y', amount: -95 }, edge: 'sharp' });
    b.each(3, (i) => b.box([0.87, 0.05, 0.02], [0, 0.4 + i * 0.6, 2.1], { color: '#5a3a22', parent: 'door', noInk: true }));
    b.box([0.55, 0.45, 0.1], [1.42, 1.4, 1.42], { color: '#3a2416', rot: [0, 45, 0], edge: 'sharp' });
    return b
      .act({ click: [[A.operate('door', 'open'), A.wait(2.5), A.operate('door', 'close')], [A.effect('smoke', { dur: 3 }), A.say('Crackle...', 1.5)]] })
      .done();
  }),
  // A few chunks of clear ice with frosty cores; tapped, they crack.
  e('ice (frozen water)', 'nature', 'ice', () => {
    const b = m('ice (frozen water)', { edge: 'sharp' });
    ([[[0.09, 0.065, 0.08], [0, 0.032, 0], [10, 20, 5]], [[0.06, 0.05, 0.06], [0.065, 0.025, 0.03], [0, 40, 15]], [[0.055, 0.05, 0.055], [-0.06, 0.025, 0.025], [20, 10, 0]], [[0.05, 0.045, 0.05], [0.01, 0.08, 0.005], [30, 30, 20]]] as Array<[V, V, V]>).forEach(([sz, at, r], i) => b.box(sz, at, { color: i % 2 ? '#bfe4f2' : '#d9f2fb', rot: r, round: 0.15 }));
    b.box([0.025, 0.004, 0.004], [-0.005, 0.045, 0.042], { color: 'white', noInk: true, rot: [0, 0, 30] });
    b.box([0.03, 0.004, 0.004], [0.06, 0.03, 0.062], { color: 'white', noInk: true, rot: [0, 0, -40] });
    return b.act({ click: [A.anim('shake'), A.par(A.say('Crack!', 1), A.effect('snow', { dur: 1 }))] }).done();
  }),
  // A sawn block of ice in its meltwater puddle, frosted on top with trapped bubbles; it slides off and back.
  e('ice block', 'nature', 'ice', () => {
    const b = m('ice block');
    b.ball([0.42, 0.012, 0.3], [0, 0.004, 0.02], { color: '#9fd4f0', noInk: true });
    b.box([0.3, 0.2, 0.2], [0, 0.105, 0], { color: '#cdeefa', round: 0.1, name: 'block', edge: 'sharp' });
    for (const [x, y] of [[-0.08, 0.06], [0.05, 0.13], [0.09, 0.05], [-0.03, 0.14]] as const) b.ball(0.015, [x, y, 0.1], { color: 'white', noInk: true, parent: 'block' });
    b.box([0.28, 0.01, 0.18], [0, 0.206, 0], { color: 'white', noInk: true, parent: 'block' });
    return b.act({ click: [A.pose('block', { move: [0.3, 0, 0.1], dur: 0.6 }), A.say('Swoosh!', 1), A.pose('block', { move: [0, 0, 0], dur: 0.8 })] }).done();
  }),
  // A waffle cone with a scoop of strawberry and one of chocolate and a cherry on top; the top scoop topples off,
  // then it is put back.
  e('ice cream', 'food', 'desserts', () => {
    const b = m('ice cream').cone([0.065, 0.13, 0.065], [0, 0.065, 0], { color: '#d9a35f', rot: [180, 0, 0], name: 'cone' });
    b.pair((s) => b.stick([s * 0.025, 0.12, 0.022], [-s * 0.005, 0.03, 0.01], 0.004, '#b07a3a', { noInk: true }));
    b.ball(0.07, [0, 0.14, 0], { color: '#f8a5c2' });
    b.ball(0.062, [0, 0.19, 0], { color: '#6a3a22', name: 'scoop', parent: 'cone', piece: true });
    b.ball(0.02, [0, 0.228, 0.005], { color: '#d32f2f', parent: 'scoop' }).rod([0, 0.235, 0.005], [0.01, 0.255, 0], 0.003, '#2e7d32', { parent: 'scoop' });
    return b.act({ click: [[A.anim('wobble'), A.detach('scoop', 'scoop'), A.say('Splat!', 1.2)], [A.reattach('scoop'), A.effect('sparkle', { dur: 1 })]] }).done();
  }),
  // A spring-lever ice cream scoop holding a ball of strawberry ice cream; squeeze the lever and the ball pops out.
  e('ice cream scoop', 'kitchen', 'utensils', () =>
    m('ice cream scoop', { edge: 'sharp' })
      .stick([0, 0, 0], [0, 0.08, 0], 0.026, '#1e1e1e', { edge: 'soft', name: 'handle' })
      .stick([0, 0.08, 0], [0, 0.15, 0], 0.02, 'silver', { parent: 'handle' })
      .ball([0.065, 0.045, 0.065], [0, 0.165, 0], { color: 'steel', edge: 'soft', parent: 'handle' })
      .rod([0.017, 0.04, 0], [0.021, 0.15, 0.0], 0.008, 'silver', { name: 'lever', pivot: [0.017, 0.04, 0] })
      .ball(0.058, [0, 0.19, 0.008], { color: '#f8a5c2', name: 'ball', parent: 'handle', piece: true })
      .act({ click: [[A.pose('lever', { rot: [0, 0, 20], dur: 0.2 }), A.detach('ball', 'ball'), A.pose('lever', { rot: [0, 0, 0], dur: 0.2 })], [A.reattach('ball')]] })
      .done(),
  ),
  // An ice cream parlour: pink walls with a striped awning, a sign, shop windows, a bench outside and a giant
  // cone on the roof that turns.
  e('ice cream store', 'places', 'shops', () => {
    const { b, H, z } = shop('ice cream store', { w: 7, d: 5, wall: '#f8bbd0', trim: 'white', sign: 'ICE CREAM', signBg: '#fff6e0', awning: '#e53935', awning2: 'white', glass: '#bfe4f6' });
    b.cone([1.1, 1.8, 1.1], [0, H + 1.6, 0], { color: '#d9a35f', rot: [180, 0, 0], name: 'cone', pivot: [0, H + 0.7, 0] });
    b.ball(1.3, [0, H + 2.7, 0], { color: '#f48fb1', parent: 'cone' });
    b.ball(0.35, [0, H + 3.4, 0.1], { color: '#d32f2f', parent: 'cone' });
    b.box([1.6, 0.08, 0.45], [2.4, 0.45, z + 1.3], { color: '#6fc8d8' });
    b.pair((s) => b.box([0.08, 0.45, 0.4], [2.4 + s * 0.7, 0.22, z + 1.3], { color: '#3a3633' }));
    b.box([0.7, 1.0, 0.08], [-2.5, 0.9, z + 0.9], { color: '#3a3633', rot: [-10, 0, 0] });
    b.label('SCOOPS', [0.55, 0.2], [-2.5, 1.2, z + 0.96], { color: '#3a3633', rot: [-10, 0, 0], depth: 0.01 });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding!', 1.2), A.wait(2.5), A.operate('door', 'close')],
          [A.pose('cone', { rot: [0, 360, 0], dur: 1.5 }), A.pose('cone', { rot: [0, 0, 0], dur: 0 }), A.effect('sparkle', { dur: 1 })],
        ],
      })
      .done();
  }),
  // An ice cream van at real size (6 m, 2.9 m tall): a cab with windscreen and headlights, a tall white body with
  // pastel stripes, a serving hatch whose awning lifts, a giant cone on the roof, a chime speaker and wheels on
  // axles. It plays its tune and opens up.
  e('ice cream truck', 'garage', 'trucks', () => {
    const b = m('ice cream truck', { view: 'side', edge: 'sharp' });
    b.box([2.1, 2.3, 4.2], [0, 1.65, -0.8], { color: '#f4f4f0', round: 0.08 });
    b.loft([2.0, 1.5, 1.8], [0, 1.25, 2.1], [[0, 1, 1, 0], [0.5, 1, 0.98, -0.01], [0.85, 0.98, 0.75, -0.12], [1, 0.95, 0.5, -0.24]], { color: '#f4f4f0', boxy: 0.85, edge: 'soft' });
    b.box([1.9, 0.6, 0.06], [0, 1.65, 2.62], { color: '#3a4656', rot: [-30, 0, 0] });
    b.pair((s) => b.box([0.06, 0.5, 0.8], [s * 1.0, 1.6, 2.0], { color: '#3a4656' }));
    b.box([2.12, 0.3, 4.22], [0, 1.0, -0.8], { color: '#f48fb1', noInk: true });
    b.box([2.12, 0.15, 4.22], [0, 1.25, -0.8], { color: '#81d4fa', noInk: true });
    b.box([0.04, 0.9, 1.8], [1.06, 1.85, -0.7], { color: '#3a4656' });
    b.box([0.25, 0.08, 1.9], [1.1, 1.38, -0.7], { color: '#c8ccd0' });
    b.box([0.05, 0.9, 1.9], [1.08, 2.35, -0.7], { color: '#f48fb1', name: 'awning', pivot: [1.08, 2.8, -0.7], mover: { kind: 'swing', axis: 'z', amount: -80 } });
    b.label('ICE CREAM', [1.6, 0.35], [0, 2.5, 1.12], { color: '#f6d24a', depth: 0.03 });
    b.cone([0.6, 1.0, 0.6], [0, 3.3, -0.8], { color: '#d9a35f', rot: [180, 0, 0] });
    b.ball(0.75, [0, 3.85, -0.8], { color: '#f48fb1' });
    b.ball(0.18, [0, 4.25, -0.75], { color: '#d32f2f' });
    b.cyl([0.3, 0.3, 0.3], [0.6, 2.95, 0.8], { color: '#c8ccd0', rot: [90, 0, 0], taper: 1.8 });
    b.pair((s) => {
      b.ball([0.3, 0.2, 0.06], [s * 0.65, 0.85, 3.0], { color: '#fff3b0', glow: true, name: s > 0 ? 'lightL' : 'lightR', mover: { kind: 'light', on: true } });
      b.box([0.25, 0.18, 0.05], [s * 0.75, 1.0, -2.92], { color: '#d32f2f', glow: true });
    });
    b.box([2.15, 0.25, 0.2], [0, 0.45, 3.0], { color: '#c8ccd0', round: 0.4 });
    b.box([2.15, 0.25, 0.2], [0, 0.45, -2.92], { color: '#c8ccd0', round: 0.4 });
    [2.0, -2.0].forEach((zz, i) => b.pair((s) => wheel(b, 0.75, [s * 0.95, 0.38, zz], { name: `wheel${i}${s > 0 ? 'L' : 'R'}`, hub: '#c8ccd0' })));
    return withSockets(
      b
        .act({
          click: [
            [A.say('Ding-a-ling-a-ling!', 2.5), A.operate('awning', 'open')],
            [A.operate('awning', 'close'), A.operate('light', 'off'), A.wait(0.3), A.operate('light', 'on'), A.say('Beep beep!', 1.2)],
          ],
        })
        .done(),
      [{ name: 'seat', at: [0.5, 1.0, 1.9], kind: 'seat' }],
    );
  }),
  // Two real-size ice cubes (3-4 cm) with frosty edges; they clink.
  e('ice cube', 'nature', 'ice', () =>
    m('ice cube', { edge: 'sharp' })
      .box([0.035, 0.035, 0.035], [0, 0.0175, 0], { color: '#d9f2fb', round: 0.3, rot: [0, 20, 0] })
      .box([0.03, 0.03, 0.03], [0.04, 0.017, 0.022], { color: '#bfe4f2', round: 0.3, rot: [10, 40, 15] })
      .box([0.015, 0.003, 0.003], [-0.004, 0.028, 0.018], { color: 'white', noInk: true, rot: [0, 20, 25] })
      .act({ click: [A.anim('hop'), A.say('Clink!', 1)] })
      .done(),
  ),
  // A blue silicone ice cube tray of twelve cubes; twisted, the cubes crack loose and settle back.
  e('ice cube tray', 'kitchen', 'kitchenware', () => {
    const b = m('ice cube tray', { edge: 'sharp' }).box([0.26, 0.03, 0.11], [0, 0.015, 0], { color: '#4fa8e0', round: 0.2 });
    b.box([0.27, 0.008, 0.12], [0, 0.032, 0], { color: '#3a98d0', round: 0.4 });
    b.box([0.2, 0.004, 0.08], [0, 0.03, 0], { color: '#bfe4f2', name: 'cubes' });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) b.box([0.032, 0.022, 0.04], [-0.1 + c * 0.04, 0.034, -0.025 + r * 0.05], { color: '#d9f2fb', round: 0.3, parent: 'cubes' });
    return b.act({ click: [A.pose('cubes', { move: [0, 0.02, 0], dur: 0.15 }), A.say('Crack!', 1), A.pose('cubes', { move: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A commercial ice maker: stainless bin on legs with a flip-up door, the ice-making head above with vents and a
  // control panel; the door opens on a heap of ice.
  e('ice machine', 'kitchen', 'appliances', () => {
    const b = m('ice machine', { edge: 'sharp' }).box([0.8, 0.85, 0.7], [0, 0.55, 0], { color: '#c8ccd0', round: 0.05 }).box([0.82, 0.42, 0.72], [0, 1.18, 0], { color: '#a8acb0', round: 0.05 });
    b.each(6, (i) => b.box([0.6, 0.02, 0.01], [0, 1.05 + i * 0.045, 0.36], { color: '#5a5e62', noInk: true }));
    b.box([0.12, 0.08, 0.02], [0.28, 1.3, 0.365], { color: '#1e1e1e' });
    b.ball(0.012, [0.32, 1.3, 0.375], { color: '#4caf50', glow: true });
    b.box([0.5, 0.25, 0.3], [0, 0.7, 0.18], { color: '#e8f4fa', round: 0.3 });
    b.box([0.6, 0.34, 0.04], [0, 0.72, 0.37], { color: '#e0e4e8', name: 'door', pivot: [0, 0.89, 0.37], mover: { kind: 'swing', axis: 'x', amount: -100 } });
    b.box([0.4, 0.04, 0.03], [0, 0.6, 0.4], { color: '#5a5e62', parent: 'door' });
    b.label('ICE', [0.3, 0.12], [0, 1.4, 0.37], { color: '#1f5fb8', depth: 0.01 });
    b.pair((s) => b.pair((t) => b.cyl([0.05, 0.12, 0.05], [s * 0.33, 0.06, t * 0.28], { color: '#5a5e62' })));
    return withSockets(
      b.act({ click: [A.operate('door', 'open'), A.spawn('ic', 'ice cube', { rel: 'front', of: 'self', dist: 'close' }), A.say('Rumble... clunk!', 1.5), A.wait(1.5), A.par(A.remove('ic', 'pop'), A.operate('door', 'close'))] }).done(),
      [{ name: 'bin', at: [0, 0.7, 0.1], kind: 'inside', size: 0.4 }],
    );
  }),
  // A rocket ice pop on its stick, red, white and blue with a pointed tip; a bite comes off, then it is whole again.
  e('ice pop', 'food', 'desserts', () =>
    m('ice pop')
      .box([0.012, 0.07, 0.005], [0, 0.035, 0], { color: 'lightwood', round: 0.5, edge: 'sharp' })
      .cyl([0.045, 0.04, 0.045], [0, 0.08, 0], { color: '#1f5fb8', round: 0.3, name: 'pop' })
      .cyl([0.043, 0.035, 0.043], [0, 0.117, 0], { color: 'white', parent: 'pop' })
      .cone([0.042, 0.05, 0.042], [0, 0.159, 0], { color: '#e53935', name: 'tip', parent: 'pop', piece: true })
      .act({ click: [[A.detach('tip', 'bite'), A.say('Chomp!', 1)], [A.reattach('tip')]] })
      .done(),
  ),
  // An outdoor ice rink at real size (12 x 24 m; the vocabulary's 0.1 m would be a puddle): rounded white dasher
  // boards, rink lines and circles, goals with their creases, four tall floodlights that switch, and a puck that
  // glides across.
  e('ice rink', 'places', 'sports venues', () => {
    const b = m('ice rink', { edge: 'sharp' });
    const prof: Array<[number, number, number, number]> = [[0, 0.62, 1, 0], [0.04, 0.88, 1, 0], [0.1, 0.98, 1, 0], [0.16, 1, 1, 0], [0.84, 1, 1, 0], [0.9, 0.98, 1, 0], [0.96, 0.88, 1, 0], [1, 0.62, 1, 0]];
    b.loft([12, 0.15, 24], [0, 0.075, 0], prof, { color: '#e6f4fa', boxy: 1 });
    const pts: Array<[number, number]> = [];
    prof.forEach(([t, w]) => pts.push([6 * w, -12 + 24 * t]));
    [...prof].reverse().forEach(([t, w]) => pts.push([-6 * w, -12 + 24 * t]));
    pts.push(pts[0]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len < 0.01) continue;
      const ang = (-Math.atan2(z1 - z0, x1 - x0) * 180) / Math.PI;
      b.box([len + 0.1, 1.1, 0.12], [(x0 + x1) / 2, 0.55, (z0 + z1) / 2], { color: 'white', rot: [0, ang, 0], round: 0.1 });
      b.box([len + 0.1, 0.2, 0.13], [(x0 + x1) / 2, 0.1, (z0 + z1) / 2], { color: '#f6d24a', rot: [0, ang, 0], noInk: true });
    }
    b.box([12, 0.01, 0.3], [0, 0.155, 0], { color: '#d32f2f', noInk: true });
    b.torus([4.5, 4.5, 0.01], [0, 0.155, 0], { color: '#1f5fb8', rot: [90, 0, 0], tube: 0.02, noInk: true });
    b.pair((s) => {
      b.box([12, 0.01, 0.3], [0, 0.155, s * 3.5], { color: '#1f5fb8', noInk: true });
      b.box([10.5, 0.01, 0.06], [0, 0.155, s * 10.0], { color: '#d32f2f', noInk: true });
      b.pair((t) => b.torus([4.5, 4.5, 0.01], [t * 3, 0.155, s * 7], { color: '#d32f2f', rot: [90, 0, 0], tube: 0.02, noInk: true }));
      b.dome([1.8, 0.02, 1.2], [0, 0.155, s * 10.0], { color: '#81d4fa', noInk: true, rot: [0, s > 0 ? 180 : 0, 0] });
      b.pair((t) => b.stick([t * 0.9, 0.15, s * 10.0 + s * 0.04], [t * 0.9, 1.37, s * 10.0 + s * 0.04], 0.06, '#d32f2f'));
      b.stick([-0.9, 1.37, s * 10.04], [0.9, 1.37, s * 10.04], 0.06, '#d32f2f');
      b.box([1.8, 1.25, 0.02], [0, 0.75, s * 10.5], { color: '#f2f2f2', noInk: true, rot: [s * 35, 0, 0] });
      b.pair((t) => {
        b.stick([s * 7.2, 0, t * 11], [s * 7.2, 10, t * 11], 0.2, '#8a8e92');
        b.box([1.0, 0.5, 0.4], [s * 6.9, 10, t * 11], { color: '#5a5e62' });
        b.box([0.9, 0.4, 0.05], [s * 6.6, 9.95, t * 11], { color: '#fff6c8', glow: true, rot: [0, 0, s * -30], name: `lamp${s > 0 ? 'L' : 'R'}${t > 0 ? 'F' : 'B'}`, mover: { kind: 'light', on: true } });
      });
    });
    return b
      .act({
        click: [
          [A.spawn('pk', 'hockey puck', { rel: 'front', of: 'self', dist: 'close' }), A.move('pk', { rel: 'at', of: 'self' }, { speed: 'run', style: 'slide' }), A.say('Swish!', 1), A.remove('pk', 'fade')],
          [A.operate('lamp', 'off'), A.wait(1.5), A.operate('lamp', 'on'), A.say('Clunk!', 1)],
        ],
      })
      .done();
  }),
  // A swan carved in ice on a silver tray: a frosted block base, the body, raised wings, a curving neck and beak;
  // it glints.
  e('ice sculpture', 'nature', 'ice', () => {
    const c = '#cdeefa';
    const b = m('ice sculpture').box([0.8, 0.03, 0.62], [0, 0.015, 0], { color: 'silver', edge: 'sharp', round: 0.4 }).box([0.6, 0.45, 0.45], [0, 0.26, 0], { color: c, round: 0.1, edge: 'sharp' });
    b.ball([0.42, 0.32, 0.62], [0, 0.64, -0.02], { color: '#b8e4f5' });
    b.pair((s) => b.ball([0.1, 0.4, 0.5], [s * 0.18, 0.85, -0.1], { color: c, rot: [-30, 0, s * 12] }));
    path(b, [[0, 0.72, 0.2], [0, 0.95, 0.25], [0, 1.15, 0.18], [0, 1.28, 0.2]], 0.09, '#b8e4f5');
    b.ball([0.1, 0.1, 0.14], [0, 1.32, 0.24], { color: c }).cone([0.05, 0.1, 0.04], [0, 1.31, 0.34], { color: c, rot: [90, 0, 0] });
    b.box([0.4, 0.004, 0.004], [0, 0.4, 0.226], { color: 'white', noInk: true });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 2 }), A.anim('pulse'))] }).done();
  }),
  // A pair of white figure skates: laced boots with padded collars, steel blades with toe picks on their stanchions;
  // they glide.
  e('ice skates', 'sports', 'skating', () => {
    const b = m('ice skates', { view: 'side' });
    b.pair((s) => {
      const x = s * 0.06, n = s > 0 ? 'skateL' : 'skateR';
      b.box([0.08, 0.025, 0.27], [x, 0.1, 0], { color: '#3a3633', name: n, edge: 'sharp' });
      b.ball([0.085, 0.08, 0.2], [x, 0.14, 0.045], { color: 'white', parent: n });
      b.box([0.09, 0.2, 0.12], [x, 0.22, -0.065], { color: 'white', round: 0.4, parent: n });
      b.torus([0.1, 0.06, 0.03], [x, 0.32, -0.065], { color: '#e8e4dc', rot: [90, 0, 0], parent: n });
      b.each(4, (i) => b.box([0.06, 0.006, 0.01], [x, 0.17 + i * 0.035, 0.0 + (i === 0 ? 0.04 : 0.003 * i)], { color: '#9a9690', noInk: true, parent: n }));
      b.box([0.006, 0.035, 0.3], [x, 0.03, 0.01], { color: 'steel', round: 0.6, parent: n, edge: 'sharp' });
      b.wedge([0.006, 0.025, 0.025], [x, 0.028, 0.165], { color: 'steel', rot: [0, 90, 0], parent: n, edge: 'sharp' });
      for (const zz of [-0.09, 0.09]) b.box([0.02, 0.06, 0.03], [x, 0.07, zz], { color: 'silver', parent: n, edge: 'sharp' });
    });
    return b
      .act({ click: [A.par(A.pose('skateL', { move: [0, 0, 0.25], dur: 0.5 }), A.pose('skateR', { move: [0, 0, -0.1], dur: 0.5 })), A.par(A.pose('skateL', { move: [0, 0, -0.1], dur: 0.5 }), A.pose('skateR', { move: [0, 0, 0.25], dur: 0.5 })), A.par(A.pose('skateL', { move: [0, 0, 0], dur: 0.4 }), A.pose('skateR', { move: [0, 0, 0], dur: 0.4 })), A.say('Swish swish', 1)] })
      .done();
  }),
  // A tall glass of iced tea with ice cubes, a lemon wheel on the rim and a striped straw; the ice clinks.
  e('iced tea', 'food', 'drinks', () =>
    m('iced tea')
      .cyl([0.072, 0.012, 0.072], [0, 0.006, 0], { color: '#dff0f6' })
      .cyl([0.07, 0.13, 0.07], [0, 0.077, 0], { color: '#c8873a', taper: 1.1 })
      .torus([0.08, 0.08, 0.008], [0, 0.148, 0], { color: '#e8f6fb', rot: [90, 0, 0], tube: 0.1 })
      .box([0.028, 0.025, 0.028], [0.01, 0.13, 0.01], { color: '#e8f6fb', rot: [10, 30, 0], name: 'ice' })
      .box([0.025, 0.025, 0.025], [-0.018, 0.128, -0.012], { color: '#e8f6fb', rot: [0, 10, 20], parent: 'ice' })
      .cyl([0.05, 0.008, 0.05], [0.04, 0.15, 0.02], { color: '#f6e84a', rot: [90, 0, 30] })
      .cyl([0.04, 0.009, 0.04], [0.04, 0.15, 0.02], { color: '#fff9c4', rot: [90, 0, 30], noInk: true })
      .stick([-0.015, 0.06, 0.01], [-0.035, 0.23, 0.01], 0.008, '#e53935')
      .act({ click: [A.pose('ice', { move: [0, 0.015, 0], dur: 0.2 }), A.pose('ice', { move: [0, 0, 0], dur: 0.2 }), A.say('Clink clink!', 1)] })
      .done(),
  ),
  // A cupcake crowned with a tall swirl of pink icing and sprinkles, the piping bag beside it; the bag squeezes and
  // the swirl grows.
  e('icing', 'food', 'desserts', () => {
    const b = m('icing').cyl([0.07, 0.045, 0.07], [0, 0.0225, 0], { color: '#f2f2f2', taper: 1.25 });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.box([0.004, 0.044, 0.004], [Math.cos(a) * 0.04, 0.023, Math.sin(a) * 0.04], { color: '#d8d8d8', noInk: true });
    });
    b.dome([0.085, 0.03, 0.085], [0, 0.06, 0], { color: '#c8864a' });
    b.cyl([0.085, 0.02, 0.085], [0, 0.072, 0], { color: '#f48fb1', name: 'swirl', pivot: [0, 0.062, 0] });
    ([[0.075, 0.084], [0.06, 0.1], [0.045, 0.114], [0.03, 0.126]] as const).forEach(([d, y]) => b.torus([d, d, 0.022], [0, y, 0], { color: '#f48fb1', rot: [90, 0, 0], tube: 0.32, parent: 'swirl' }));
    b.cone([0.022, 0.03, 0.022], [0, 0.142, 0], { color: '#f48fb1', parent: 'swirl' });
    around(7, 0.03, 0.4).forEach(([x, zz], i) => b.box([0.008, 0.003, 0.003], [x, 0.11 - Math.hypot(x, zz) * 0.3, zz + 0.012], { color: ['#f6d24a', '#4fc3f7', 'white', '#81c784'][i % 4], rot: [0, i * 50, 0], noInk: true, parent: 'swirl' }));
    b.cone([0.06, 0.16, 0.05], [0.11, 0.05, 0.06], { color: 'white', rot: [0, 0, 75], name: 'bag', pivot: [0.17, 0.05, 0.06] });
    b.cone([0.018, 0.026, 0.018], [0.03, 0.03, 0.06], { color: 'silver', rot: [0, 0, 75], parent: 'bag' });
    return b
      .act({ click: [A.pose('bag', { scale: 0.85, dur: 0.3 }), A.par(A.pose('bag', { scale: 1, dur: 0.3 }), A.pose('swirl', { scale: 1.2, dur: 0.4 })), A.effect('sparkle', { dur: 1 }), A.pose('swirl', { scale: 1, dur: 0.6 })] })
      .done();
  }),
  // An igloo at real size (2.6 m wide): a dome of snow blocks laid in rings with staggered joints, a low entrance
  // tunnel and its dark doorway; a seal pops out to say hello.
  e('igloo', 'places', 'houses', () => {
    const b = m('igloo');
    b.dome([3.0, 1.75, 3.0], [0, 0.875, 0], { color: '#f4f8fa' });
    for (const [i, y] of [0.35, 0.7, 1.05, 1.35].entries()) {
      const r = 1.5 * Math.sqrt(1 - (y / 1.75) ** 2) + 0.01;
      b.torus([2 * r, 2 * r, 0.03], [0, y, 0], { color: '#c9dce6', rot: [90, 0, 0], tube: 0.02, noInk: true });
      const n = Math.max(4, Math.round(r * 5));
      for (let k = 0; k < n; k++) {
        const a = ((k + (i % 2) * 0.5) / n) * Math.PI * 2;
        const rr = 1.5 * Math.sqrt(1 - ((y - 0.17) / 1.75) ** 2) + 0.005;
        b.box([0.025, 0.3, 0.025], [Math.cos(a) * rr, y - 0.17, Math.sin(a) * rr], { color: '#c9dce6', noInk: true });
      }
    }
    b.loft([1.1, 1.0, 1.0], [0, 0.0, 1.55], [[0, 1, 1, 0], [1, 0.95, 0.95, 0]], { color: '#f4f8fa', cut: 'top' });
    b.dome([0.7, 0.75, 0.1], [0, 0.375, 2.04], { color: '#2a3340' });
    return b.act({ click: [A.spawn('sl', 'seal', { rel: 'front', of: 'self', dist: 'close' }), A.say('Ork ork!', 1.5, 'sl'), A.anim('hop', 1, 'sl'), A.wait(1), A.remove('sl', 'sink')] }).done();
  }),
  // Three incense sticks in a brass holder on a bed of sand, their tips glowing; a thread of fragrant smoke rises.
  e('incense', 'home', 'decor', () => {
    const b = m('incense').cyl([0.1, 0.03, 0.1], [0, 0.015, 0], { color: 'brass', edge: 'sharp' }).cyl([0.085, 0.005, 0.085], [0, 0.031, 0], { color: 'sand' });
    b.each(6, (i) => b.box([0.012, 0.012, 0.004], [Math.cos(i) * 0.05, 0.015, Math.sin(i) * 0.05], { color: '#a8843a', noInk: true }));
    ([[-0.015, -0.04], [0.005, 0.0], [0.02, 0.045]] as const).forEach(([x, tx], i) => {
      b.stick([x, 0.03, 0], [tx, 0.22, 0], 0.005, '#7a4a2a');
      b.ball(0.008, [tx, 0.222, 0], { color: '#ff7043', glow: true, name: `tip${i}`, mover: { kind: 'light', on: true } });
    });
    path(b, [[0, 0.23, 0], [0.015, 0.25, 0], [-0.005, 0.27, 0], [0.01, 0.29, 0]], 0.006, '#d8d8d8', { noInk: true });
    return b.act({ click: [A.par(A.effect('smoke', { dur: 3 }), A.say('Fsss...', 1.5))] }).done();
  }),
  // A car's side indicator lamp: a black housing on its mount with an amber lens and arrow; it blinks.
  e('indicator', 'garage', 'car parts', () =>
    m('indicator', { edge: 'sharp' })
      .box([0.08, 0.02, 0.04], [0, 0.01, 0], { color: '#3a3d42' })
      .box([0.17, 0.085, 0.05], [0, 0.065, 0], { color: '#1e1e1e', round: 0.3 })
      .box([0.15, 0.068, 0.02], [0, 0.065, 0.025], { color: '#ff9800', glow: true, round: 0.3, name: 'lamp', mover: { kind: 'light' } })
      .box([0.04, 0.016, 0.01], [-0.01, 0.065, 0.038], { color: 'white' })
      .wedge([0.04, 0.035, 0.01], [0.02, 0.065, 0.038], { color: 'white', rot: [0, 0, -90] })
      .act({ click: [A.operate('lamp', 'on'), A.say('Tick', 0.6), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), A.say('Tock', 0.6), A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), A.say('Tick', 0.6), A.operate('lamp', 'off')] })
      .done(),
  ),
  // A bottle of blue-black ink with its paper label, a feather quill standing in it and a spilled blot; the quill
  // dips.
  e('ink', 'study', 'stationery', () => {
    const b = m('ink').cyl([0.07, 0.05, 0.07], [0, 0.025, 0], { color: '#1f2a5a', edge: 'sharp', round: 0.2 }).cyl([0.07, 0.015, 0.07], [0, 0.057, 0], { color: '#1f2a5a', taper: 0.5 });
    b.cyl([0.03, 0.02, 0.03], [0, 0.072, 0], { color: '#1f2a5a' }).cyl([0.072, 0.025, 0.072], [0, 0.025, 0], { color: '#f6efdc' });
    b.stick([0, 0.06, 0], [0.05, 0.2, 0], 0.006, '#f6efdc', { name: 'quill', pivot: [0.05, 0.2, 0] });
    b.ball([0.025, 0.12, 0.006], [0.04, 0.17, 0], { color: 'white', rot: [0, 0, -20], parent: 'quill' });
    b.ball([0.08, 0.006, 0.05], [0.07, 0.003, 0.04], { color: '#1f2a5a' });
    return b.act({ click: [A.pose('quill', { move: [0, -0.025, 0], dur: 0.3 }), A.pose('quill', { move: [0, 0, 0], dur: 0.3 }), A.say('Dip!', 1)] }).done();
  }),
  // A printer ink cartridge with cyan, magenta and yellow windows, its gold contacts and a latch; it clicks into
  // place.
  e('ink cartridge', 'tech', 'computer parts', () =>
    m('ink cartridge', { edge: 'sharp' })
      .box([0.05, 0.07, 0.07], [0, 0.035, 0], { color: '#1e1e1e', round: 0.1, name: 'cart' })
      .box([0.052, 0.012, 0.05], [0, 0.05, 0.01], { color: '#00bcd4', noInk: true, parent: 'cart' })
      .box([0.052, 0.012, 0.05], [0, 0.036, 0.01], { color: '#e91e63', noInk: true, parent: 'cart' })
      .box([0.052, 0.012, 0.05], [0, 0.022, 0.01], { color: '#f6d24a', noInk: true, parent: 'cart' })
      .box([0.02, 0.02, 0.004], [0, 0.015, 0.036], { color: 'gold', parent: 'cart' })
      .box([0.03, 0.01, 0.025], [0, 0.075, -0.015], { color: '#5a5e62', parent: 'cart' })
      .act({ click: [A.pose('cart', { move: [0, 0.03, 0], dur: 0.2 }), A.pose('cart', { move: [0, 0, 0], dur: 0.1 }), A.say('Click!', 1)] })
      .done(),
  ),
  // A pair of inline skates: blue moulded boots with buckles, an aluminium frame and four lime wheels each that
  // spin up.
  e('inline skates', 'sports', 'skating', () => {
    const b = m('inline skates', { view: 'side' });
    b.pair((s) => {
      const x = s * 0.065;
      b.box([0.09, 0.03, 0.27], [x, 0.11, 0], { color: '#1e1e1e', edge: 'sharp' });
      b.ball([0.09, 0.08, 0.2], [x, 0.15, 0.045], { color: '#1f5fb8' });
      b.box([0.095, 0.2, 0.13], [x, 0.23, -0.065], { color: '#1f5fb8', round: 0.4 });
      for (const y of [0.2, 0.27]) b.box([0.1, 0.015, 0.06], [x, y, -0.01], { color: '#1e1e1e', edge: 'sharp' });
      b.box([0.02, 0.03, 0.27], [x, 0.08, 0], { color: 'silver', edge: 'sharp' });
      for (const [k, zz] of [-0.1, -0.035, 0.035, 0.1].entries()) {
        const n = `wheel${s > 0 ? 'L' : 'R'}${k}`;
        b.cyl([0.072, 0.024, 0.072], [x, 0.036, zz], { color: '#9ccc65', rot: [0, 0, 90], name: n, mover: { kind: 'spin', axis: 'x', amount: 720 } });
        b.cyl([0.03, 0.026, 0.03], [x, 0.036, zz], { color: '#5a5e62', rot: [0, 0, 90], parent: n });
      }
    });
    return b.act({ click: [A.operate('wheel', 'on'), A.say('Whirrr!', 1.5), A.wait(1.5), A.operate('wheel', 'off')] }).done();
  }),
  // Two rolls of pink fibreglass insulation with kraft facing and a loose batt on top; it puffs fluff.
  e('insulation', 'workshop', 'building materials', () => {
    const b = m('insulation');
    for (const zz of [-0.17, 0.17]) {
      b.cyl([0.3, 0.6, 0.3], [0, 0.15, zz], { color: '#f4a1b8', rot: [0, 0, 90] });
      b.pair((s) => {
        for (const d of [0.22, 0.12]) b.torus([d, d, 0.02], [s * 0.3, 0.15, zz], { color: '#d97a95', rot: [0, 90, 0], noInk: true });
      });
      b.cyl([0.302, 0.4, 0.302], [0, 0.15, zz], { color: '#f6efdc', rot: [0, 0, 90], noInk: true, scale: 1 });
    }
    b.box([0.65, 0.1, 0.36], [0, 0.35, 0], { color: '#f4a1b8', round: 0.5, name: 'batt' });
    b.box([0.65, 0.012, 0.36], [0, 0.296, 0], { color: '#c9a070', noInk: true, parent: 'batt' });
    return b.act({ click: [A.pose('batt', { scale: 1.15, dur: 0.3 }), A.par(A.pose('batt', { scale: 1, dur: 0.3 }), A.effect('dust', { dur: 1.2 }), A.say('Floof!', 1))] }).done();
  }),
  // A brushed-steel door intercom: speaker grille, a camera lens, three name buttons and a call light; buzz it and
  // it answers.
  e('intercom', 'tech', 'electronics', () => {
    const b = m('intercom', { edge: 'sharp' }).box([0.14, 0.26, 0.04], [0, 0.13, 0], { color: '#c8ccd0', round: 0.2 });
    b.cyl([0.03, 0.01, 0.03], [0, 0.23, 0.02], { color: '#1e1e1e', rot: [90, 0, 0] });
    b.cyl([0.012, 0.012, 0.012], [0, 0.23, 0.024], { color: '#3a5a8a', rot: [90, 0, 0], noInk: true });
    b.each(4, (i) => b.box([0.08, 0.006, 0.006], [0, 0.17 + i * 0.012, 0.021], { color: '#5a5e62', noInk: true }));
    b.each(3, (i) => b.box([0.09, 0.022, 0.008], [0, 0.04 + i * 0.03, 0.022], { color: '#f6efdc', name: `button${i}` }));
    b.ball(0.012, [0.05, 0.13, 0.022], { color: '#4caf50', glow: true, name: 'light', mover: { kind: 'light' } });
    return b
      .act({
        click: [
          [A.pose('button0', { move: [0, 0, -0.005], dur: 0.1 }), A.pose('button0', { move: [0, 0, 0], dur: 0.1 }), A.operate('light', 'on'), A.say('Bzzzt!', 1.2)],
          [A.say('Hello? Who is it?', 2), A.wait(1), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // An anatomy model of the intestines as they sit in the belly (0.4 m; the 6 m in the vocabulary is their
  // uncoiled length): the large intestine framing the coils of the small intestine. It gurgles.
  e('intestine', 'clinic', 'organs', () => {
    const b = m('intestine');
    const big: V[] = [[0.0, 0.03, 0.02], [0.13, 0.06, 0], [0.16, 0.2, 0], [0.15, 0.36, 0], [0, 0.39, 0], [-0.15, 0.36, 0], [-0.16, 0.2, 0], [-0.12, 0.07, 0]];
    path(b, big, 0.07, '#c98a6a');
    big.forEach((p) => b.ball(0.08, p, { color: '#b9785a' }));
    b.ball([0.26, 0.26, 0.07], [0, 0.21, -0.01], { color: '#e8a0a0', name: 'coils' });
    around(8, 0.085).forEach(([x, y], i) => b.torus([0.08, 0.06, 0.035], [x, 0.21 + y, 0.03], { color: i % 2 ? '#e8a0a0' : '#f0b4b0', rot: [0, 0, i * 40], parent: 'coils' }));
    around(4, 0.04, 0.4).forEach(([x, y], i) => b.torus([0.06, 0.05, 0.03], [x, 0.21 + y, 0.045], { color: i % 2 ? '#f0b4b0' : '#e8a0a0', rot: [0, 0, i * 50], parent: 'coils' }));
    b.torus([0.08, 0.07, 0.035], [0, 0.21, 0.03], { color: '#e8a0a0', parent: 'coils' });
    b.capsule([0.035, 0.07, 0.035], [-0.1, 0.05, 0.04], { color: '#c98a6a', rot: [0, 0, -40] });
    return b.act({ click: [A.pose('coils', { scale: 1.06, dur: 0.3 }), A.pose('coils', { scale: 1, dur: 0.3 }), A.anim('wobble'), A.say('Gurgle gurgle...', 1.5)] }).done();
  }),
  // A shimmering hooded cloak standing as if worn, with a clasp and a few twinkles; it vanishes and comes back.
  e('invisibility cloak', 'fantasy', 'magic items', () => {
    const c = '#d8ecf5';
    const b = m('invisibility cloak').cyl([0.78, 1.3, 0.56], [0, 0.65, 0], { color: c, taper: 0.36, name: 'cloak' });
    b.box([0.04, 1.2, 0.02], [0, 0.6, 0.22], { color: '#9cc4d6', noInk: true, parent: 'cloak' });
    b.ball([0.32, 0.36, 0.32], [0, 1.4, -0.02], { color: c, parent: 'cloak' });
    b.ball([0.2, 0.25, 0.1], [0, 1.37, 0.12], { color: '#1e2436', parent: 'cloak' });
    b.ball(0.05, [0, 1.2, 0.12], { color: 'gold', parent: 'cloak' });
    for (const [x, y, zz, sz] of [[0.3, 1.0, 0.15, 0.08], [-0.33, 0.6, 0.12, 0.07], [0.25, 0.35, 0.22, 0.06], [-0.2, 1.3, 0.2, 0.06]] as const) b.star(sz, [x, y, zz], { color: 'white', glow: true, parent: 'cloak' });
    return b.act({ click: [A.par(A.pose('cloak', { scale: 0, dur: 0.8 }), A.effect('sparkle', { dur: 1.5 })), A.wait(1.5), A.pose('cloak', { scale: 1, dur: 0.8 }), A.say('Poof!', 1.2)] }).done();
  }),
  // A blue steam iron: pointed steel soleplate with steam holes, the body with its water window and temperature
  // dial, a closed handle and a cord; it glides and puffs steam.
  e('iron (tool)', 'home', 'laundry', () =>
    m('iron (tool)', { view: 'side' })
      .box([0.11, 0.018, 0.18], [0, 0.009, -0.03], { color: 'steel', round: 0.2, name: 'iron', edge: 'sharp' })
      .wedge([0.11, 0.09, 0.018], [0, 0.009, 0.1], { color: 'steel', rot: [90, 0, 0], parent: 'iron', edge: 'sharp' })
      .box([0.1, 0.055, 0.17], [0, 0.045, -0.02], { color: '#1f5fb8', round: 0.5, parent: 'iron' })
      .wedge([0.1, 0.08, 0.055], [0, 0.045, 0.09], { color: '#1f5fb8', rot: [90, 0, 0], parent: 'iron' })
      .box([0.07, 0.03, 0.08], [0, 0.06, 0.02], { color: '#bfe4f6', round: 0.4, parent: 'iron', noInk: true })
      .rod([0, 0.13, -0.08], [0, 0.13, 0.05], 0.03, '#1f5fb8', { parent: 'iron' })
      .rod([0, 0.07, -0.1], [0, 0.13, -0.08], 0.03, '#1f5fb8', { parent: 'iron' })
      .rod([0, 0.07, 0.07], [0, 0.13, 0.05], 0.025, '#1f5fb8', { parent: 'iron' })
      .cyl([0.04, 0.015, 0.04], [0, 0.08, -0.06], { color: 'white', parent: 'iron' })
      .rod([0, 0.08, -0.11], [0, 0.02, -0.25], 0.012, '#3a3633')
      .act({ click: [A.par(A.pose('iron', { move: [0, 0, 0.12], dur: 0.5 }), A.effect('steam', { dur: 1.5 }), A.say('Psssh!', 1)), A.pose('iron', { move: [0, 0, -0.06], dur: 0.5 }), A.pose('iron', { move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // An iron maiden, 2 m: the riveted iron sarcophagus with a stern cast face, two doors studded with spikes inside
  // that creak open and clang shut.
  e('iron maiden', 'armory', 'dungeon', () => {
    const fe = '#5a5e66';
    const b = m('iron maiden', { edge: 'sharp' }).box([0.95, 0.1, 0.75], [0, 0.05, 0], { color: '#3a3d42' }).box([0.8, 1.6, 0.6], [0, 0.9, -0.02], { color: fe, round: 0.3 });
    b.box([0.66, 1.4, 0.05], [0, 0.88, 0.27], { color: '#2a1a1a' });
    b.ball([0.5, 0.5, 0.4], [0, 1.88, 0.04], { color: '#9a9ea6', edge: 'soft' });
    b.pair((s) => b.ball([0.08, 0.035, 0.02], [s * 0.1, 1.93, 0.235], { color: '#1e1e1e' }));
    b.ball([0.05, 0.08, 0.04], [0, 1.87, 0.24], { color: '#9a9ea6' }).box([0.12, 0.02, 0.02], [0, 1.77, 0.225], { color: '#5a1a1a', noInk: true });
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([0.4, 1.45, 0.05], [s * 0.2, 0.9, 0.32], { color: '#6a6e76', round: 0.2, name: n, pivot: [s * 0.4, 0.9, 0.32], mover: { kind: 'swing', axis: 'y', amount: s * 100 } });
      b.each(4, (i) => b.cone([0.05, 0.1, 0.05], [s * 0.2, 0.4 + i * 0.33, 0.27], { color: 'silver', rot: [-90, 0, 0], parent: n }));
      b.each(5, (i) => b.ball(0.025, [s * 0.36, 0.3 + i * 0.3, 0.35], { color: '#3a3d42', parent: n }));
      b.box([0.06, 0.12, 0.04], [s * 0.05, 0.95, 0.36], { color: 'iron', parent: n });
    });
    for (const y of [0.35, 1.45]) b.box([0.84, 0.05, 0.64], [0, y, -0.02], { color: 'iron' });
    return b.act({ click: [A.operate('door', 'open'), A.say('Creeeak...', 1.5), A.wait(1.5), A.operate('door', 'close'), A.par(A.say('CLANG!', 1.2), A.anim('shake'))] }).done();
  }),
  // An ironing board at its working height (0.86 m): the padded cover on a tapered board, X legs with rubber feet,
  // an iron rest and a blue iron that glides and steams.
  e('ironing board', 'home', 'laundry', () => {
    const b = m('ironing board', { edge: 'sharp' });
    b.box([1.0, 0.03, 0.36], [-0.12, 0.86, 0], { color: '#f6efdc', round: 0.3 });
    b.ball([0.5, 0.03, 0.36], [0.38, 0.86, 0], { color: '#f6efdc' });
    for (const [x, zz] of [[-0.4, 0.05], [0.0, -0.08], [0.35, 0.06], [-0.2, -0.1]] as const) b.ball([0.06, 0.008, 0.06], [x, 0.877, zz], { color: '#81d4fa', noInk: true });
    b.pair((s) => {
      b.rod([-0.35, 0.84, s * 0.12], [0.35, 0.0, s * 0.12], 0.025, 'steel');
      b.rod([0.35, 0.84, s * 0.12], [-0.35, 0.0, s * 0.12], 0.025, 'steel');
      b.cyl([0.04, 0.03, 0.04], [0.35, 0.015, s * 0.12], { color: '#1e1e1e', rot: [0, 0, 90] });
      b.cyl([0.04, 0.03, 0.04], [-0.35, 0.015, s * 0.12], { color: '#1e1e1e', rot: [0, 0, 90] });
    });
    b.box([0.2, 0.02, 0.24], [-0.72, 0.86, 0], { color: '#8a8e92' });
    b.box([0.22, 0.08, 0.11], [-0.1, 0.915, 0], { color: '#1f5fb8', round: 0.5, name: 'iron', edge: 'soft' });
    b.rod([-0.15, 0.98, 0], [-0.05, 0.98, 0], 0.03, '#1f5fb8', { parent: 'iron' });
    b.box([0.2, 0.01, 0.1], [-0.1, 0.88, 0], { color: 'steel', parent: 'iron' });
    return withSockets(
      b.act({ click: [A.par(A.pose('iron', { move: [0.35, 0, 0], dur: 0.6 }), A.effect('steam', { dur: 1.5 })), A.pose('iron', { move: [-0.2, 0, 0], dur: 0.7 }), A.pose('iron', { move: [0, 0, 0], dur: 0.3 }), A.say('Psssh!', 1)] }).done(),
      [{ name: 'top', at: [0.1, 0.88, 0], kind: 'top', size: 0.5 }],
    );
  }),
  // A little desert island, 5 m across, in its ring of shallow sea: a sandy hump, a leaning palm with coconuts and
  // a rock; the palm sways and a coconut drops.
  e('island', 'nature', 'landforms', () => {
    const b = m('island');
    b.cyl([7, 0.1, 6.2], [0, 0.05, 0], { color: '#4fc3d8' });
    b.cyl([5.6, 0.104, 5.0], [0, 0.052, 0], { color: '#81d4e8', noInk: true });
    b.dome([4.4, 0.8, 3.8], [0, 0.45, 0], { color: '#f0d890' });
    path(b, [[-0.3, 0.8, 0], [-0.1, 1.8, 0], [0.3, 2.8, 0], [0.7, 3.4, 0]], 0.25, '#8a6a4a');
    b.ball(0.35, [0.7, 3.5, 0], { color: '#5a8a2a', name: 'top', pivot: [-0.3, 0.8, 0] });
    around(7, 1.4).forEach(([x, zz]) => b.rod([0.7, 3.5, 0], [0.7 + x, 3.05, zz], 0.22, '#4f8f3a', { parent: 'top' }));
    for (const [x, zz] of [[0.6, 0.18], [0.8, 0.12], [0.68, -0.12]] as const) b.ball(0.22, [x, 3.3, zz], { color: '#6a4a2a', parent: 'top' });
    b.ball([0.9, 0.6, 0.8], [-1.3, 0.6, 0.6], { color: '#8a8580' });
    b.ball([0.5, 0.3, 0.5], [1.4, 0.4, 1.1], { color: '#f6efdc' });
    return b
      .act({
        click: [
          A.pose('top', { rot: [0, 0, 4], dur: 0.5 }),
          A.pose('top', { rot: [0, 0, -3], dur: 0.6 }),
          A.par(A.pose('top', { rot: [0, 0, 0], dur: 0.5 }), A.spawn('cn', 'coconut', { rel: 'front', of: 'self', dist: 'close' })),
          A.say('Bonk!', 1),
          A.wait(1.5),
          A.remove('cn', 'fade'),
        ],
      })
      .done();
  }),
  // A joke-shop tin of itching powder: a yellow label with a scratching cartoon and a shaker lid; shaken, it puffs.
  e('itching powder', 'toys', 'pranks', () =>
    m('itching powder')
      .cyl([0.06, 0.08, 0.06], [0, 0.04, 0], { color: '#f6d24a', edge: 'sharp', name: 'tin' })
      .cyl([0.062, 0.035, 0.062], [0, 0.04, 0], { color: '#2e7d32', parent: 'tin' })
      .label('ITCH!', [0.04, 0.016], [0, 0.045, 0.031], { color: '#f6d24a', parent: 'tin', depth: 0.002 })
      .cyl([0.062, 0.015, 0.062], [0, 0.087, 0], { color: 'silver', parent: 'tin', edge: 'sharp' })
      .ball(0.006, [0.012, 0.096, 0], { color: '#1e1e1e', noInk: true, parent: 'tin' })
      .ball(0.006, [-0.012, 0.096, 0.005], { color: '#1e1e1e', noInk: true, parent: 'tin' })
      .ball([0.09, 0.02, 0.07], [0.07, 0.008, 0.04], { color: '#f8bbd0' })
      .act({ click: [A.pose('tin', { rot: [0, 0, 150], move: [0.03, 0.08, 0], dur: 0.3 }), A.par(A.effect('dust', { dur: 1.2 }), A.say('Puff!', 1.2)), A.pose('tin', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.3 })] })
      .done(),
  ),
  // An IV bag hanging from its little hook stand: the fluid bag with its printed label, the drip chamber, a roller
  // clamp and coiled tubing; it drips.
  e('iv bag', 'clinic', 'hospital', () =>
    m('iv bag')
      .cyl([0.14, 0.015, 0.14], [0, 0.0075, 0], { color: '#5a5e62', edge: 'sharp' })
      .stick([-0.09, 0.015, 0], [-0.09, 0.42, 0], 0.012, 'silver')
      .rod([-0.09, 0.415, 0], [0, 0.415, 0], 0.01, 'silver')
      .torus([0.02, 0.025, 0.004], [0, 0.4, 0], { color: 'silver' })
      .box([0.12, 0.17, 0.03], [0, 0.3, 0], { color: '#e6f4fb', round: 0.6 })
      .box([0.1, 0.1, 0.032], [0, 0.27, 0], { color: '#bfe2f2', round: 0.6, noInk: true })
      .box([0.06, 0.04, 0.004], [0, 0.33, 0.016], { color: 'white', edge: 'sharp' })
      .cyl([0.018, 0.04, 0.018], [0, 0.19, 0], { color: '#e8f6fb' })
      .ball(0.006, [0, 0.2, 0], { color: '#81d4fa', name: 'drop' })
      .stick([0, 0.17, 0], [0, 0.1, 0], 0.005, '#e8f6fb')
      .box([0.016, 0.03, 0.012], [0, 0.11, 0], { color: '#4fc3f7', edge: 'sharp' })
      .torus([0.07, 0.07, 0.005], [0, 0.03, 0.02], { color: '#e8f6fb', rot: [90, 0, 0] })
      .stick([0, 0.095, 0], [0.02, 0.03, 0.02], 0.005, '#e8f6fb')
      .act({ click: [A.pose('drop', { move: [0, -0.012, 0], dur: 0.4 }), A.pose('drop', { move: [0, 0, 0], dur: 0 }), A.pose('drop', { move: [0, -0.012, 0], dur: 0.4 }), A.pose('drop', { move: [0, 0, 0], dur: 0 }), A.say('Drip... drip...', 1.5)] })
      .done(),
  ),
  // A carved elephant tusk on a wooden display stand; the stand turns it and it gleams.
  e('ivory', 'wild', 'antlers and horns', () => {
    const b = m('ivory').box([0.34, 0.04, 0.14], [0, 0.02, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' });
    b.cyl([0.06, 0.02, 0.06], [0, 0.05, 0], { color: '#5a3a22', name: 'stand', pivot: [0, 0.05, 0] });
    for (const [x, y] of [[-0.08, 0.1], [0.06, 0.15]] as const) b.stick([x, 0.04, 0], [x, y, 0], 0.016, 'darkwood', { parent: 'stand' });
    const pts: V[] = [[-0.16, 0.1, 0], [-0.06, 0.12, 0], [0.04, 0.16, 0], [0.12, 0.23, 0], [0.16, 0.31, 0]];
    const th = [0.065, 0.058, 0.046, 0.032, 0.012];
    for (let i = 0; i < pts.length - 1; i++) {
      b.stick(pts[i], pts[i + 1], th[i], '#f5ecd5', { taper: th[i + 1] / th[i], parent: 'stand' });
      b.ball(th[i], pts[i], { color: i ? '#f5ecd5' : '#e0d0b0', parent: 'stand' });
    }
    return b.act({ click: [A.par(A.pose('stand', { rot: [0, 180, 0], dur: 1.2 }), A.effect('sparkle', { dur: 1.2 })), A.pose('stand', { rot: [0, 0, 0], dur: 1.2 })] }).done();
  }),
  // A jack-in-the-box: a painted tin box with a star, a crank on the side and a hinged lid; crank it and the clown
  // springs out, then he is pushed back in.
  e('jack-in-the-box', 'toys', 'classic toys', () => {
    const b = m('jack-in-the-box');
    b.box([0.2, 0.2, 0.2], [0, 0.1, 0], { color: '#d32f2f', round: 0.1, edge: 'sharp' });
    b.star(0.1, [0, 0.1, 0.105], { color: '#f6d24a' });
    b.pair((s) => b.box([0.004, 0.12, 0.12], [s * 0.101, 0.1, 0], { color: '#1f5fb8', round: 0.2 }));
    b.box([0.21, 0.02, 0.21], [0, 0.21, 0], { color: '#1f5fb8', round: 0.2, name: 'lid', pivot: [0, 0.21, -0.1], mover: { kind: 'swing', axis: 'x', amount: -115 }, edge: 'sharp' });
    b.ball(0.09, [0, 0.085, 0], { color: 'white', name: 'jack' });
    b.ball(0.022, [0, 0.075, 0.045], { color: '#d32f2f', parent: 'jack' });
    b.pair((s) => b.ball(0.012, [s * 0.018, 0.098, 0.04], { color: '#1e1e1e', eye: true, parent: 'jack' }));
    b.torus([0.1, 0.1, 0.025], [0, 0.045, 0], { color: '#f6d24a', rot: [90, 0, 0], tube: 0.3, parent: 'jack' });
    b.cone([0.07, 0.07, 0.07], [0, 0.155, 0], { color: '#43a047', parent: 'jack' }).ball(0.022, [0, 0.19, 0], { color: '#f6d24a', parent: 'jack' });
    b.stick([0.1, 0.12, 0], [0.14, 0.12, 0], 0.012, 'silver');
    b.box([0.012, 0.06, 0.012], [0.14, 0.14, 0], { color: 'silver', name: 'crank', pivot: [0.14, 0.12, 0] });
    b.ball(0.016, [0.14, 0.17, 0.0], { color: '#d32f2f', parent: 'crank' });
    return b
      .act({
        click: [
          [A.pose('crank', { rot: [720, 0, 0], dur: 2 }), A.say('Pop goes the weasel!', 2), A.par(A.operate('lid', 'open'), A.pose('jack', { move: [0, 0.22, 0], dur: 0.2 })), A.anim('wobble')],
          [A.pose('jack', { move: [0, 0, 0], dur: 0.4 }), A.operate('lid', 'close'), A.pose('crank', { rot: [0, 0, 0], dur: 0 })],
        ],
      })
      .done();
  }),
  // A carved jack-o'-lantern: ribbed orange pumpkin, a cut lid with its stem, triangle eyes and a toothy grin lit by
  // a candle; it flickers, and its lid lifts with a puff of smoke.
  e('jack-o-lantern', 'toys', 'halloween', () => {
    const b = m('jack-o-lantern').ball([0.3, 0.24, 0.28], [0, 0.12, 0], { color: '#f57c00' });
    around(6, 0.09).forEach(([x, zz]) => b.ball([0.17, 0.23, 0.17], [x, 0.12, zz], { color: '#e8822a' }));
    b.dome([0.14, 0.04, 0.13], [0, 0.235, 0], { color: '#e8822a', name: 'lid' });
    b.cyl([0.035, 0.06, 0.035], [0, 0.28, 0], { color: '#5a6a2a', rot: [0, 0, 10], parent: 'lid' });
    b.pair((s) => b.wedge([0.055, 0.045, 0.02], [s * 0.06, 0.155, 0.145], { color: '#ffd54f', glow: true, name: s > 0 ? 'glowL' : 'glowR', mover: { kind: 'light', on: true } }));
    b.wedge([0.03, 0.025, 0.02], [0, 0.115, 0.153], { color: '#ffd54f', glow: true, name: 'glowN', mover: { kind: 'light', on: true } });
    b.box([0.15, 0.035, 0.02], [0, 0.07, 0.14], { color: '#ffd54f', glow: true, round: 0.4, name: 'glowM', mover: { kind: 'light', on: true } });
    b.pair((s) => b.box([0.02, 0.016, 0.022], [s * 0.03, 0.08, 0.142], { color: '#e8822a' }));
    return b
      .act({
        click: [
          [A.operate('glow', 'off'), A.wait(0.3), A.operate('glow', 'on'), A.wait(0.2), A.operate('glow', 'off'), A.wait(0.3), A.operate('glow', 'on'), A.say('Mwahaha!', 1.5)],
          [A.pose('lid', { move: [0, 0.06, 0], rot: [0, 0, 15], dur: 0.3 }), A.effect('smoke', { dur: 1.5 }), A.pose('lid', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A pneumatic jackhammer, 1 m: T-handle with rubber grips and the throttle lever, yellow cylinder, the steel
  // chisel biting into a slab of concrete, and the air hose; it hammers away.
  e('jackhammer', 'workshop', 'power tools', () =>
    m('jackhammer')
      .box([0.5, 0.12, 0.4], [0.05, 0.06, 0.02], { color: '#a8a39c', round: 0.15, edge: 'sharp' })
      .box([0.2, 0.08, 0.15], [0.25, 0.04, 0.12], { color: '#9a958e', round: 0.3, rot: [0, 30, 0] })
      .cyl([0.15, 0.5, 0.15], [0, 0.77, 0], { color: '#f6c400', name: 'body', edge: 'sharp' })
      .stick([-0.27, 1.07, 0], [0.27, 1.07, 0], 0.04, 'steel', { parent: 'body' })
      .stick([-0.28, 1.07, 0], [-0.17, 1.07, 0], 0.055, '#1e1e1e', { parent: 'body' })
      .stick([0.17, 1.07, 0], [0.28, 1.07, 0], 0.055, '#1e1e1e', { parent: 'body' })
      .box([0.1, 0.02, 0.03], [0.2, 1.03, 0.03], { color: '#d32f2f', parent: 'body', rot: [0, 0, 10] })
      .cyl([0.16, 0.08, 0.16], [0, 0.98, 0], { color: '#3a3d42', parent: 'body' })
      .cyl([0.1, 0.18, 0.1], [0, 0.44, 0], { color: 'steel', parent: 'body' })
      .stick([0, 0.35, 0], [0, 0.1, 0], 0.035, 'silver', { parent: 'body' })
      .cone([0.035, 0.05, 0.035], [0, 0.1, 0], { color: 'silver', rot: [180, 0, 0], parent: 'body' })
      .rod([0.075, 0.85, 0], [0.2, 0.4, 0.1], 0.03, '#1e1e1e')
      .rod([0.2, 0.4, 0.1], [0.35, 0.13, 0.25], 0.03, '#1e1e1e')
      .act({
        click: [
          A.par(A.effect('dust', { dur: 1.8 }), A.say('Rat-a-tat-tat!', 1.8)),
          ...[0, 1, 2, 3, 4].flatMap(() => [A.pose('body', { move: [0, 0.03, 0], dur: 0.07 }), A.pose('body', { move: [0, 0, 0], dur: 0.07 })]),
        ],
      })
      .done(),
  ),
  // A game of jacks: six-pointed metal jacks scattered round a red rubber ball, which bounces.
  e('jacks', 'toys', 'classic toys', () => {
    const b = m('jacks').ball(0.03, [0.05, 0.015, 0.03], { color: '#e53935', name: 'ball' });
    const jack = (x: number, z: number, t: number) => {
      const r = (t * Math.PI) / 180, c = Math.cos(r) * 0.016, sn = Math.sin(r) * 0.016, y = 0.017;
      b.stick([x - c, y, z - sn], [x + c, y, z + sn], 0.004, 'silver').stick([x, y - 0.016, z], [x, y + 0.016, z], 0.004, 'silver').stick([x + sn, y, z - c], [x - sn, y, z + c], 0.004, 'silver');
      for (const p of [[x - c, y, z - sn], [x + c, y, z + sn], [x, y + 0.016, z], [x + sn, y, z - c], [x - sn, y, z + c]] as V[]) b.ball(0.008, p, { color: 'silver' });
    };
    jack(-0.03, 0.0, 20);
    jack(0.0, 0.05, 60);
    jack(-0.06, 0.05, 5);
    jack(0.03, -0.03, 40);
    jack(-0.07, -0.02, 75);
    return b
      .act({ click: [A.pose('ball', { move: [0, 0.15, 0], dur: 0.25 }), A.pose('ball', { move: [0, 0, 0], dur: 0.2 }), A.pose('ball', { move: [0, 0.08, 0], dur: 0.15 }), A.pose('ball', { move: [0, 0, 0], dur: 0.15 }), A.say('Boing!', 1)] })
      .done();
  }),
  // A 2.6 m competition javelin stuck in the turf: yellow shaft, cord grip and steel point; it flies off and is
  // back for the next throw.
  e('javelin', 'sports', 'track', () =>
    m('javelin')
      .ball([0.5, 0.12, 0.4], [0.45, 0.02, 0], { color: '#7cb342' })
      .stick([0.45, 0.06, 0], [-0.45, 2.5, 0], 0.03, '#f6d24a', { name: 'javelin', pivot: [0.0, 1.3, 0], edge: 'sharp' })
      .cone([0.032, 0.22, 0.032], [0.48, 0.0, 0], { color: 'silver', rot: [0, 0, 160], parent: 'javelin', edge: 'sharp' })
      .stick([0.07, 1.1, 0], [-0.0, 1.29, 0], 0.04, '#1e1e1e', { parent: 'javelin' })
      .act({ click: [A.pose('javelin', { rot: [0, 0, -60], move: [0, 0.5, 0], dur: 0.4 }), A.par(A.pose('javelin', { rot: [0, 0, -80], move: [8, 3, 0], dur: 0.8 }), A.say('Whoosh!', 1.2)), A.pose('javelin', { scale: 0, dur: 0 }), A.pose('javelin', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0 }), A.wait(0.5), A.pose('javelin', { scale: 1, dur: 0.4 })] })
      .done(),
  ),
  // A human jawbone with its upper teeth on a stand: the U-shaped mandible, rising rami with their condyles, rows
  // of molars and incisors; it chomps.
  e('jaw', 'clinic', 'bones', () => {
    const c = '#efe3c8';
    const b = m('jaw');
    b.box([0.14, 0.012, 0.1], [0, 0.006, -0.02], { color: 'darkwood', edge: 'sharp', round: 0.3 });
    b.stick([0, 0.012, -0.06], [0, 0.11, -0.06], 0.008, 'brass');
    arc(b, [0, 0.12, -0.02], 0.05, 0.06, 0, 180, 7, 0.022, c, 'xz');
    for (let a = 15; a <= 165; a += 15) b.box([0.009, 0.012, 0.009], [0.05 * Math.cos((a * Math.PI) / 180), 0.138, -0.02 + 0.06 * Math.sin((a * Math.PI) / 180)], { color: 'white', round: 0.4 });
    b.ball([0.03, 0.02, 0.06], [0, 0.125, 0.04], { color: c });
    b.box([0.12, 0.02, 0.04], [0, 0.11, -0.06], { color: c, round: 0.4, name: 'jaw', pivot: [0, 0.14, -0.08] });
    arc(b, [0, 0.085, -0.02], 0.05, 0.06, 0, 180, 7, 0.026, c, 'xz', { parent: 'jaw' });
    b.pair((s) => b.rod([s * 0.05, 0.085, -0.02], [s * 0.056, 0.14, -0.06], 0.022, c, { parent: 'jaw' }).ball(0.02, [s * 0.056, 0.145, -0.06], { color: c, parent: 'jaw' }));
    for (let a = 15; a <= 165; a += 15) b.box([0.009, 0.012, 0.009], [0.05 * Math.cos((a * Math.PI) / 180), 0.103, -0.02 + 0.06 * Math.sin((a * Math.PI) / 180)], { color: 'white', round: 0.4, parent: 'jaw' });
    return b.act({ click: [A.pose('jaw', { rot: [20, 0, 0], dur: 0.2 }), A.pose('jaw', { rot: [0, 0, 0], dur: 0.12 }), A.pose('jaw', { rot: [20, 0, 0], dur: 0.2 }), A.pose('jaw', { rot: [0, 0, 0], dur: 0.12 }), A.say('Chomp chomp!', 1.2)] }).done();
  }),
  // A big round jawbreaker and another cracked in half to show its rainbow layers; tapped, it does not break.
  e('jawbreaker', 'food', 'candy', () => {
    const b = m('jawbreaker').ball(0.06, [-0.035, 0.03, 0], { color: '#e53935' });
    for (const [x, y, zz, c] of [[-0.03, 0.05, 0.02, '#f6d24a'], [-0.05, 0.035, 0.022, '#1f5fb8'], [-0.015, 0.02, 0.024, 'white']] as const) b.ball(0.01, [x, y, zz], { color: c, noInk: true });
    b.dome([0.06, 0.03, 0.06], [0.04, 0.03, -0.005], { color: '#1f5fb8', rot: [90, 0, 0] });
    ([[0.06, '#1f5fb8'], [0.045, '#f6d24a'], [0.03, '#f48fb1'], [0.015, 'white']] as const).forEach(([d, c], i) => b.cyl([d, 0.004, d], [0.04, 0.03, 0.01 + i * 0.002], { color: c, rot: [90, 0, 0], noInk: i > 0 }));
    return b.act({ click: [A.anim('shake'), A.say('Clonk!', 1.2)] }).done();
  }),
  // A pair of blue jeans standing as if worn: waistband with belt loops and a brass button, front pockets and
  // orange stitching, rolled cuffs.
  e('jeans', 'wardrobe', 'pants', () => {
    const b = pants('jeans', '#3d5a8a', 1.0, '#3d5a8a', '#e8a040');
    b.pair((s) => {
      b.box([0.18, 0.05, 0.2], [s * 0.13, 0.03, 0], { color: '#6f8fc0', round: 0.4 });
      b.box([0.03, 0.06, 0.01], [s * 0.17, 0.98, 0.113], { color: '#3d5a8a', noInk: true });
      b.ball(0.012, [s * 0.15, 0.88, 0.112], { color: 'brass', noInk: true });
    });
    return b.act({ click: [A.anim('shake'), A.effect('dust', { dur: 0.8 }), A.say('Flap!', 1)] }).done();
  }),
  // A jar of grape jelly with a gingham cloth over its lid; the lid twists off and back on.
  e('jelly', 'food', 'spreads', () =>
    m('jelly')
      .cyl([0.08, 0.09, 0.08], [0, 0.045, 0], { color: '#6a1f4a', round: 0.2 })
      .cyl([0.082, 0.035, 0.082], [0, 0.045, 0], { color: '#f6efdc' })
      .ball([0.03, 0.025, 0.01], [0, 0.045, 0.042], { color: '#7b3fa0', noInk: true })
      .cyl([0.085, 0.02, 0.085], [0, 0.1, 0], { color: 'gold', name: 'lid', edge: 'sharp' })
      .cyl([0.11, 0.012, 0.11], [0, 0.112, 0], { color: '#d32f2f', parent: 'lid' })
      .torus([0.088, 0.088, 0.008], [0, 0.095, 0], { color: 'white', rot: [90, 0, 0], parent: 'lid' })
      .act({ click: [A.pose('lid', { rot: [0, 270, 0], move: [0, 0.03, 0], dur: 0.6 }), A.say('Pop!', 1), A.wait(0.6), A.pose('lid', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // A heap of jelly beans in every colour.
  e('jelly bean', 'food', 'candy', () => {
    const b = m('jelly bean');
    ([[-0.02, 0.008, 0, '#e53935', 10], [0.012, 0.008, 0.01, '#43a047', 70], [0.0, 0.008, -0.02, '#f6d24a', 30], [0.03, 0.008, -0.012, '#fb8c00', -20], [-0.01, 0.022, -0.005, '#8e24aa', 50], [0.012, 0.022, 0.0, '#f48fb1', -40], [-0.035, 0.008, -0.02, 'white', 80]] as const).forEach(([x, y, zz, c, a]) => {
      const r = (a * Math.PI) / 180;
      b.ball([0.016, 0.014, 0.014], [x + Math.cos(r) * 0.006, y, zz + Math.sin(r) * 0.006], { color: c });
      b.ball([0.016, 0.014, 0.014], [x - Math.cos(r) * 0.006, y, zz - Math.sin(r) * 0.006], { color: c });
    });
    return b.act({ click: [A.anim('hop', 2), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A resealable bag of beef jerky with its label, strips spilling out in front; one pulls out.
  e('jerky', 'food', 'meat', () => {
    const b = m('jerky').box([0.14, 0.18, 0.04], [0, 0.09, -0.05], { color: '#c9a070', round: 0.3 });
    b.label('JERKY', [0.11, 0.05], [0, 0.12, -0.028], { color: '#8a1a1a', depth: 0.004 });
    b.box([0.14, 0.012, 0.042], [0, 0.17, -0.05], { color: '#a8804a', round: 0.3 });
    for (const [x, r] of [[-0.04, 12], [0.0, -5], [0.045, -15]] as const) b.box([0.032, 0.14, 0.009], [x, 0.07, 0.02], { color: '#6a2e1e', rot: [-12, 0, r], round: 0.4 });
    b.box([0.03, 0.12, 0.008], [0.02, 0.15, -0.05], { color: '#6a2e1e', round: 0.4, name: 'strip' });
    return b.act({ click: [A.pose('strip', { move: [0, 0.08, 0.02], rot: [0, 0, 15], dur: 0.4 }), A.say('Chew chew', 1.2), A.pose('strip', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A blue sports jersey with white shoulder stripes, a V collar and a big number 10.
  e('jersey', 'wardrobe', 'shirts', () => {
    const b = shirt('jersey', { color: '#1f5fb8', len: 0.7, collar: 'white' });
    b.pair((s) => b.ball([0.1, 0.03, 0.15], [s * 0.36, 0.48, 0], { color: 'white', rot: [0, 0, s * 35] }));
    b.box([0.5, 0.04, 0.225], [0, 0.04, 0], { color: 'white', round: 0.3 });
    b.label('10', [0.2, 0.2], [0, 0.36, 0.115], { color: 'white', depth: 0.006 });
    return b.act({ click: [A.anim('bounce', 2), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A jet boat at real size (6 m): a deep-V white hull with a red racing stripe, a windscreen, bench seats, a
  // stern jet nozzle; it guns it, bow up, throwing a rooster tail.
  e('jet boat', 'garage', 'boats', () => {
    const b = m('jet boat', { view: 'side', edge: 'sharp' });
    const prof: Array<[number, number, number, number]> = [[0, 0.9, 1, 0.05], [0.4, 1, 1, 0], [0.75, 0.9, 1, 0], [0.92, 0.55, 0.9, 0.08], [1, 0.08, 0.6, 0.3]];
    b.loft([2.3, 1.4, 6.0], [0, 0.7, 0], prof, { color: '#f4f4f0', cut: 'bottom', boxy: 0.35, name: 'boat', pivot: [0, 0.4, -2.5], edge: 'soft' });
    b.loft([2.32, 0.18, 6.02], [0, 0.45, 0.01], prof, { color: '#d32f2f', boxy: 0.35, noInk: true, parent: 'boat', edge: 'soft' });
    b.box([2.0, 0.06, 3.6], [0, 0.72, -0.8], { color: '#2b2d31', parent: 'boat' });
    b.box([1.9, 0.45, 0.06], [0, 0.98, 1.0], { color: '#3a4656', rot: [-35, 0, 0], parent: 'boat' });
    b.box([2.0, 0.05, 0.8], [0, 0.73, 1.5], { color: '#f4f4f0', parent: 'boat' });
    for (const zz of [0.2, -1.2]) {
      b.box([1.7, 0.2, 0.55], [0, 0.85, zz], { color: '#d32f2f', round: 0.4, parent: 'boat', edge: 'soft' });
      b.box([1.7, 0.45, 0.15], [0, 1.08, zz - 0.25], { color: '#d32f2f', round: 0.4, parent: 'boat', edge: 'soft' });
    }
    b.cyl([0.3, 0.3, 0.3], [0, 0.4, -3.1], { color: '#5a5e62', rot: [90, 0, 0], taper: 0.7, parent: 'boat' });
    b.stick([-0.95, 1.0, 0.6], [0.95, 1.0, 0.6], 0.03, 'silver', { parent: 'boat' });
    b.cyl([0.35, 0.05, 0.35], [-0.4, 1.0, 0.6], { color: '#1e1e1e', rot: [65, 0, 0], parent: 'boat' });
    return withSockets(
      b
        .act({
          click: [
            A.par(A.pose('boat', { rot: [-10, 0, 0], dur: 0.5 }), A.effect('water_spray', { dur: 2 }), A.say('VROOOM!', 1.5)),
            A.pose('boat', { rot: [-6, 0, 3], dur: 0.6 }),
            A.pose('boat', { rot: [0, 0, 0], dur: 0.8 }),
          ],
        })
        .done(),
      [{ name: 'seat', at: [0.4, 0.95, 0.2], kind: 'seat', part: 'boat' }],
    );
  }),
  // A jet pack on its harness: twin silver fuel tanks with domed tops, a back plate, shoulder straps, nozzles
  // whose flames roar as it lifts off and lands.
  e('jet pack', 'garage', 'aircraft', () => {
    const b = m('jet pack', { edge: 'sharp' }).box([0.32, 0.4, 0.06], [0, 0.56, 0.1], { color: '#3a3d42', round: 0.3, name: 'pack' });
    b.pair((s) => {
      b.cyl([0.14, 0.42, 0.14], [s * 0.09, 0.53, 0], { color: 'silver', parent: 'pack', edge: 'soft' });
      b.ball(0.14, [s * 0.09, 0.74, 0], { color: 'silver', parent: 'pack', edge: 'soft' });
      b.cyl([0.12, 0.08, 0.12], [s * 0.09, 0.29, 0], { color: '#3a3d42', taper: 0.7, parent: 'pack' });
      b.cone([0.1, 0.22, 0.1], [s * 0.09, 0.14, 0], { color: '#ff7043', rot: [180, 0, 0], glow: true, parent: 'pack', name: s > 0 ? 'flameL' : 'flameR', scale: 0 });
      b.torus([0.1, 0.3, 0.025], [s * 0.1, 0.58, 0.15], { color: '#1e1e1e', parent: 'pack', edge: 'soft' });
    });
    b.box([0.2, 0.06, 0.08], [0, 0.72, 0.12], { color: '#d32f2f', parent: 'pack' });
    return b
      .act({
        click: [
          A.par(A.pose('flameL', { scale: 1, dur: 0.2 }), A.pose('flameR', { scale: 1, dur: 0.2 }), A.effect('smoke', { dur: 2.5 }), A.say('FWOOSH!', 1.5)),
          A.pose('pack', { move: [0, 1.5, 0], dur: 1 }),
          A.pose('pack', { move: [0, 1.6, 0], rot: [0, 0, 8], dur: 0.6 }),
          A.pose('pack', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1 }),
          A.par(A.pose('flameL', { scale: 0, dur: 0.2 }), A.pose('flameR', { scale: 0, dur: 0.2 })),
        ],
      })
      .done();
  }),
  // A musical jewellery box, 20 cm wide, on gold ball feet: a pink case with gold trim, a little drawer with a knob
  // and a keyhole plate on the front, a padded, buttoned lid with a gold heart and a mirror underneath, a string of
  // pearls caught under the lid; inside, red velvet, a ring and pearls, and a ballerina who rises and spins when the
  // lid opens.
  e('jewelry box', 'home', 'bedroom', () => {
    const pk = '#f48fb1';
    const b = m('jewelry box', { edge: 'sharp' }).box([0.2, 0.075, 0.13], [0, 0.0515, 0], { color: pk, round: 0.2 }).box([0.18, 0.006, 0.11], [0, 0.087, 0], { color: '#8a1a3a', noInk: true });
    for (const [x, z] of [[0.088, 0.055], [-0.088, 0.055], [0.088, -0.055], [-0.088, -0.055]]) b.ball(0.018, [x, 0.009, z], { color: 'gold' });
    b.box([0.206, 0.01, 0.136], [0, 0.019, 0], { color: 'gold', round: 0.3, noInk: true })
      .box([0.202, 0.004, 0.132], [0, 0.054, 0], { color: 'gold', round: 0, noInk: true })
      .box([0.17, 0.026, 0.006], [0, 0.037, 0.066], { color: '#f8a5c2', round: 0.3 })
      .ball(0.012, [0, 0.037, 0.072], { color: 'gold' })
      .box([0.018, 0.022, 0.004], [0, 0.07, 0.066], { color: 'gold', round: 0.3 })
      .box([0.004, 0.008, 0.002], [0, 0.068, 0.069], { color: '#3a2a1a', round: 0, noInk: true });
    // the lid: a trimmed frame, the buttoned cushion and heart on top, and the mirror on its underside
    b.box([0.2, 0.018, 0.13], [0, 0.098, 0], { color: pk, round: 0.3, name: 'lid', pivot: [0, 0.089, -0.065], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .box([0.202, 0.005, 0.132], [0, 0.092, 0], { color: 'gold', parent: 'lid', noInk: true })
      .box([0.17, 0.016, 0.1], [0, 0.11, 0], { color: '#f8bbd0', round: 0.9, edge: 'soft', parent: 'lid' })
      .heart(0.03, [0, 0.122, 0.0], { color: 'gold', rot: [-90, 0, 0], parent: 'lid' })
      .box([0.15, 0.004, 0.1], [0, 0.0885, 0], { color: '#dff0f6', parent: 'lid' });
    for (const [x, z] of [[-0.05, -0.03], [0.05, -0.03], [-0.05, 0.03], [0.05, 0.03]]) b.ball(0.006, [x, 0.118, z], { color: 'gold', parent: 'lid', noInk: true });
    // a string of pearls caught under the front of the lid
    b.each(9, (i) => b.ball(0.008, [-0.075 + i * 0.0075, 0.087 - 0.028 * Math.sin((Math.PI * i) / 8), 0.068], { color: 'white' }));
    b.each(5, (i) => b.ball(0.012, [-0.07 + i * 0.016, 0.093, 0.04], { color: 'white' }));
    b.torus([0.022, 0.022, 0.006], [0.06, 0.098, 0.03], { color: 'gold' });
    b.ball(0.01, [0.06, 0.112, 0.03], { color: '#26c6da' });
    b.stick([0, 0.05, 0], [0, 0.085, 0], 0.004, 'gold', { name: 'dancer' });
    b.ball([0.014, 0.024, 0.012], [0, 0.07, 0], { color: '#f8bbd0', parent: 'dancer' });
    b.cyl([0.03, 0.008, 0.03], [0, 0.062, 0], { color: 'white', parent: 'dancer' });
    b.ball(0.008, [0, 0.087, 0], { color: 'skin2', parent: 'dancer' });
    b.rod([0, 0.08, 0], [0.012, 0.094, 0], 0.003, 'skin2', { parent: 'dancer' });
    return b
      .act({
        click: [
          [A.operate('lid', 'open'), A.pose('dancer', { move: [0, 0.03, 0], dur: 0.4 }), A.pose('dancer', { spin: [0, 180, 0] }), A.say('Tinkle tinkle...', 2)],
          [A.pose('dancer', { spin: [0, 0, 0] }), A.pose('dancer', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.4 }), A.operate('lid', 'close')],
        ],
      })
      .done();
  }),
  // A jewellery store: navy front with gold trim, glittering shop windows, a gold sign and a giant diamond on the
  // roof that turns and sparkles.
  e('jewelry store', 'places', 'shops', () => {
    const { b, H, z } = shop('jewelry store', { w: 7, d: 5, wall: '#1f2a4a', trim: '#d4af37', sign: 'JEWELRY', signBg: '#d4af37', glass: '#bfe4f6', door: '#bfe4f6' });
    b.cone([1.6, 1.0, 1.6], [0, H + 1.4, 0], { color: '#bfe8f6', rot: [180, 0, 0], segs: 8, name: 'diamond', pivot: [0, H + 1.4, 0] });
    b.cyl([1.6, 0.4, 1.6], [0, H + 2.1, 0], { color: '#e4f6fc', taper: 0.6, segs: 8, parent: 'diamond' });
    b.pair((s) => {
      b.ball(0.12, [s * 2.1, 1.3, z + 0.12], { color: 'gold' });
      b.ball(0.08, [s * 2.4, 1.1, z + 0.12], { color: '#e53935' });
      b.ball(0.08, [s * 1.8, 1.0, z + 0.12], { color: '#26c6da' });
    });
    b.box([1.2, 0.08, 1.4], [0, 0.04, z + 0.8], { color: '#8a1a3a' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.say('Ding!', 1.2), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.pose('diamond', { rot: [0, 180, 0], dur: 1.5 }), A.effect('sparkle', { dur: 1.5 })), A.pose('diamond', { rot: [0, 0, 0], dur: 0 })],
        ],
      })
      .done();
  }),
  // A cordless top-handle jigsaw (25 cm long, nose to +x) cutting along a pencil line in a board laid across two
  // blocks, so its blade shows through underneath: a steel shoe, the grey gear housing at the nose with the blade
  // clamp and the thin blade, the teal motor body, the closed D-handle with a black grip and red trigger, and the
  // battery pack at the back. The blade saws up and down as the saw runs along the line.
  e('jigsaw', 'workshop', 'power tools', () => {
    const T = '#00897b', K = '#1e1e1e', P = { parent: 'saw' };
    const b = m('jigsaw', { edge: 'sharp' });
    for (const x of [-0.14, 0.2]) b.box([0.05, 0.057, 0.2], [x, 0.0285, 0], { color: 'darkwood', round: 0.1 });
    b.box([0.42, 0.018, 0.2], [0.03, 0.066, 0], { color: 'lightwood', round: 0.05 })
      .box([0.12, 0.002, 0.003], [0.15, 0.0755, 0], { color: '#4a4a4a', round: 0, noInk: true })
      .box([0.2, 0.01, 0.075], [0, 0.08, 0], { color: 'silver', round: 0.3, name: 'saw' })
      .box([0.007, 0.13, 0.0015], [0.075, 0.0775, 0], { color: 'steel', round: 0, name: 'blade', ...P })
      .cyl([0.014, 0.012, 0.014], [0.066, 0.1, 0], { color: '#3a3d42', rot: [90, 0, 0], ...P })
      .box([0.12, 0.014, 0.05], [-0.02, 0.091, 0], { color: '#5a5f66', round: 0.3, ...P })
      .box([0.06, 0.072, 0.062], [0.07, 0.151, 0], { color: '#5a5f66', round: 0.35, ...P })
      .box([0.15, 0.092, 0.068], [-0.03, 0.142, 0], { color: T, round: 0.4, ...P })
      .arc([0.18, 0.13, 0.034], [-0.02, 0.185, 0], { color: T, tube: 0.22, ...P })
      .arc([0.184, 0.134, 0.038], [-0.02, 0.185, 0], { color: K, tube: 0.22, arc: 80, ...P })
      .box([0.012, 0.022, 0.012], [-0.005, 0.215, 0], { color: '#d32f2f', round: 0.3, ...P })
      .box([0.07, 0.06, 0.075], [-0.135, 0.13, 0], { color: K, round: 0.3, ...P })
      .box([0.072, 0.008, 0.077], [-0.135, 0.14, 0], { color: T, round: 0.3, ...P });
    for (const s of [1, -1]) b.each(3, (i) => b.box([0.03, 0.004, 0.002], [-0.07, 0.125 + i * 0.013, s * 0.034], { color: '#004d40', round: 0, noInk: true, ...P }));
    return b
      .act({
        click: [
          [
            A.par(A.say('Bzzzzt!', 1.5), A.effect('dust', { dur: 1.5 }), A.pose('saw', { move: [0.08, 0, 0], dur: 1.4 }), A.pose('blade', { move: [0, 0.015, 0], dur: 0.06, times: 11 })),
            A.pose('saw', { move: [0, 0, 0], dur: 0.6 }),
          ],
        ],
      })
      .done();
  }),
  // A jigsaw puzzle almost done on its board, the picture box lid behind; the last piece clicks into place, then is
  // taken out again.
  e('jigsaw puzzle', 'toys', 'puzzles', () => {
    const b = m('jigsaw puzzle', { edge: 'sharp' });
    b.box([0.42, 0.012, 0.32], [0, 0.006, 0], { color: '#a8743a' });
    b.box([0.3, 0.2, 0.02], [0, 0.11, -0.18], { color: '#4fc3f7', rot: [-15, 0, 0] });
    b.box([0.26, 0.12, 0.022], [0, 0.08, -0.17], { color: '#7cb342', rot: [-15, 0, 0], noInk: true });
    const cs = ['#4fc3f7', '#4fc3f7', '#81d4fa', '#7cb342', '#9ccc65', '#7cb342', '#f6d24a', '#9ccc65', '#7cb342'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) continue;
      const x = -0.08 + c * 0.08, zz = -0.06 + r * 0.08;
      b.box([0.078, 0.008, 0.078], [x, 0.016, zz], { color: cs[r * 3 + c], round: 0.1 });
      if (c < 2) b.cyl([0.026, 0.0082, 0.026], [x + 0.04, 0.016, zz], { color: cs[r * 3 + c], segs: 12 });
      if (r < 2) b.cyl([0.026, 0.0082, 0.026], [x, 0.016, zz + 0.04], { color: cs[r * 3 + c], segs: 12 });
    }
    b.box([0.078, 0.008, 0.078], [0.2, 0.016, 0.16], { color: '#7cb342', round: 0.1, name: 'piece' });
    b.cyl([0.026, 0.0082, 0.026], [0.2, 0.016, 0.12], { color: '#7cb342', segs: 12, parent: 'piece' });
    return b
      .act({
        click: [
          [A.pose('piece', { move: [-0.12, 0.04, -0.06], dur: 0.4 }), A.pose('piece', { move: [-0.12, 0, -0.06], dur: 0.2 }), A.par(A.say('Click!', 1), A.effect('sparkle', { dur: 1.2 }))],
          [A.pose('piece', { move: [0, 0, 0], dur: 0.5 })],
        ],
      })
      .done();
  }),
  // A brass sleigh bell with its slot and clapper ball, a ring at the top and a red ribbon bow; it jingles.
  e('jingle bell', 'toys', 'christmas', () =>
    m('jingle bell')
      .ball(0.07, [0, 0.036, 0], { color: 'gold' })
      .box([0.05, 0.008, 0.012], [0, 0.026, 0.031], { color: '#1e1e1e', noInk: true })
      .ball(0.01, [0, 0.026, 0.034], { color: '#1e1e1e', noInk: true })
      .torus([0.072, 0.072, 0.004], [0, 0.036, 0], { color: '#c9a040', rot: [90, 0, 0], noInk: true })
      .torus([0.025, 0.025, 0.008], [0, 0.078, 0], { color: 'gold' })
      .wedge([0.03, 0.03, 0.01], [0.018, 0.092, 0.006], { color: '#d32f2f', rot: [0, 0, 90] })
      .wedge([0.03, 0.03, 0.01], [-0.018, 0.092, 0.006], { color: '#d32f2f', rot: [0, 0, -90] })
      .ball(0.014, [0, 0.092, 0.008], { color: '#d32f2f' })
      .act({ click: [A.anim('shake', 2), A.say('Jingle jingle!', 1.5), A.effect('sparkle', { dur: 1 })] })
      .done(),
  ),
  // The Jolly Roger on a 2.2 m flagpole: a black flag with a white skull and crossed bones; it flaps in the wind.
  e('jolly roger', 'ideas', 'flags', () => {
    const b = m('jolly roger').box([0.3, 0.08, 0.3], [0, 0.04, 0], { color: 'darkwood', edge: 'sharp' }).stick([0, 0.08, 0], [0, 2.2, 0], 0.04, '#8a5a32').ball(0.06, [0, 2.23, 0], { color: 'gold' });
    b.box([0.9, 0.6, 0.012], [0.47, 1.85, 0], { color: '#1e1e1e', round: 0.1, name: 'flag', pivot: [0, 1.85, 0], edge: 'sharp' });
    b.ball([0.18, 0.18, 0.02], [0.47, 1.93, 0.01], { color: 'white', parent: 'flag' });
    b.box([0.1, 0.05, 0.02], [0.47, 1.84, 0.01], { color: 'white', parent: 'flag' });
    b.pair((s) => b.ball(0.04, [0.47 + s * 0.04, 1.94, 0.02], { color: '#1e1e1e', noInk: true, parent: 'flag' }));
    b.rod([0.3, 1.66, 0.012], [0.64, 1.78, 0.012], 0.03, 'white', { parent: 'flag' }).rod([0.3, 1.78, 0.012], [0.64, 1.66, 0.012], 0.03, 'white', { parent: 'flag' });
    return b.act({ click: [A.pose('flag', { rot: [0, 25, 0], dur: 0.4 }), A.pose('flag', { rot: [0, -15, 0], dur: 0.5 }), A.pose('flag', { rot: [0, 20, 0], dur: 0.5 }), A.pose('flag', { rot: [0, 0, 0], dur: 0.4 }), A.say('Flap flap!', 1.2)] }).done();
  }),
  // An arcade joystick: a black base with fire buttons and a red ball-top stick that waggles.
  e('joystick', 'tech', 'game consoles', () =>
    m('joystick', { edge: 'sharp' })
      .box([0.16, 0.04, 0.12], [0, 0.02, 0], { color: '#1e1e1e', round: 0.3 })
      .cone([0.04, 0.03, 0.04], [0, 0.052, 0], { color: '#3a3d42' })
      .stick([0, 0.04, 0], [0, 0.12, 0], 0.012, 'steel', { name: 'stick', pivot: [0, 0.05, 0] })
      .ball(0.036, [0, 0.13, 0], { color: '#e53935', parent: 'stick', edge: 'soft' })
      .cyl([0.022, 0.012, 0.022], [0.05, 0.045, 0.035], { color: '#e53935' })
      .cyl([0.022, 0.012, 0.022], [-0.05, 0.045, 0.035], { color: '#f6d24a' })
      .act({ click: [A.pose('stick', { rot: [0, 0, 25], dur: 0.15 }), A.pose('stick', { rot: [0, 0, -25], dur: 0.2 }), A.pose('stick', { rot: [20, 0, 0], dur: 0.15 }), A.pose('stick', { rot: [0, 0, 0], dur: 0.15 }), A.say('Pew pew!', 1)] })
      .done(),
  ),
  // A glazed blue pitcher with a white band, a pouring lip and a looped handle; it tips and pours.
  e('jug (container)', 'kitchen', 'tableware', () =>
    m('jug (container)')
      .ball([0.16, 0.18, 0.16], [0, 0.09, 0], { color: '#1f5fb8', name: 'jug', pivot: [0.07, 0, 0] })
      .cyl([0.1, 0.07, 0.1], [0, 0.19, 0], { color: '#1f5fb8', taper: 1.2, parent: 'jug' })
      .cyl([0.161, 0.03, 0.161], [0, 0.1, 0], { color: 'white', noInk: true, parent: 'jug' })
      .cone([0.05, 0.05, 0.03], [0.065, 0.215, 0], { color: '#1f5fb8', rot: [0, 0, -70], parent: 'jug' })
      .torus([0.1, 0.14, 0.022], [-0.09, 0.13, 0], { color: '#1f5fb8', parent: 'jug' })
      .act({ click: [A.pose('jug', { rot: [0, 0, -50], dur: 0.5 }), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Glug glug', 1.2)), A.pose('jug', { rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // A glass of orange juice with an orange slice on the rim and a straw, half an orange beside it; it gets sipped
  // down and refills.
  e('juice', 'food', 'drinks', () =>
    m('juice')
      .cyl([0.07, 0.01, 0.07], [0, 0.005, 0], { color: '#dff0f6' })
      .cyl([0.066, 0.115, 0.066], [0, 0.0675, 0], { color: '#fb8c00', name: 'level', pivot: [0, 0.01, 0] })
      .torus([0.074, 0.074, 0.006], [0, 0.13, 0], { color: '#e8f6fb', rot: [90, 0, 0], tube: 0.1 })
      .cyl([0.055, 0.01, 0.055], [0.035, 0.135, 0.01], { color: '#fb8c00', rot: [90, 0, 25] })
      .cyl([0.045, 0.012, 0.045], [0.035, 0.135, 0.011], { color: '#ffd28a', rot: [90, 0, 25], noInk: true })
      .stick([-0.01, 0.06, 0.01], [-0.03, 0.18, 0.01], 0.008, '#43a047')
      .dome([0.06, 0.03, 0.06], [0.08, 0.015, 0.05], { color: '#fb8c00' })
      .cyl([0.05, 0.002, 0.05], [0.08, 0.031, 0.05], { color: '#ffd28a', noInk: true })
      .act({ click: [A.par(A.pose('level', { scale: 0.4, dur: 1.2 }), A.say('Slurp!', 1.2)), A.wait(0.5), A.pose('level', { scale: 1, dur: 0.6 })] })
      .done(),
  ),
  // An electric citrus juicer: white base, a clear jug with a spout, the ridged reamer cone that spins, and an
  // orange half ready to squeeze.
  e('juicer', 'kitchen', 'appliances', () =>
    m('juicer', { edge: 'sharp' })
      .cyl([0.2, 0.12, 0.2], [0, 0.06, 0], { color: 'white', round: 0.3 })
      .box([0.03, 0.02, 0.01], [0, 0.06, 0.1], { color: '#43a047' })
      .cyl([0.17, 0.12, 0.17], [0, 0.18, 0], { color: '#e8f4fa', edge: 'soft' })
      .cyl([0.15, 0.05, 0.15], [0, 0.15, 0], { color: '#fbc02d', noInk: true })
      .box([0.04, 0.03, 0.06], [0, 0.2, 0.1], { color: '#e8f4fa' })
      .cyl([0.18, 0.02, 0.18], [0, 0.25, 0], { color: 'white' })
      .cone([0.09, 0.08, 0.09], [0, 0.3, 0], { color: '#f6f0dc', segs: 10, name: 'reamer', mover: { kind: 'spin', axis: 'y', amount: 720 } })
      .dome([0.075, 0.04, 0.075], [0.13, 0.24, 0.07], { color: '#fb8c00', rot: [180, 0, 0] })
      .cyl([0.07, 0.003, 0.07], [0.13, 0.26, 0.07], { color: '#ffd28a', noInk: true })
      .act({ click: [A.operate('reamer', 'on'), A.par(A.say('Whirrr!', 1.5), A.effect('water_spray', { dur: 1.2 })), A.wait(0.5), A.operate('reamer', 'off')] })
      .done(),
  ),
  // A 1950s jukebox, 1.5 m: wood cabinet with an arched top, glowing neon bubble tubes that light up, a window on
  // the record carousel, selection buttons and a gold speaker grille; it plays.
  e('jukebox', 'music', 'audio', () => {
    const b = m('jukebox', { edge: 'sharp' }).box([0.85, 1.05, 0.55], [0, 0.525, 0], { color: '#6a3a1e', round: 0.08 });
    b.cyl([0.85, 0.55, 0.9], [0, 1.05, 0], { color: '#6a3a1e', rot: [90, 0, 0] });
    b.arc([0.82, 0.86, 0.06], [0, 1.05, 0.28], { color: '#ff9800', glow: true, tube: 0.07, name: 'neon1', mover: { kind: 'light' } });
    b.arc([0.66, 0.7, 0.06], [0, 1.05, 0.29], { color: '#e040fb', glow: true, tube: 0.08, name: 'neon2', mover: { kind: 'light' } });
    b.box([0.5, 0.3, 0.02], [0, 1.02, 0.28], { color: '#bfe4f6' });
    b.cyl([0.3, 0.012, 0.3], [0, 1.0, 0.27], { color: '#1e1e1e', rot: [80, 0, 0], name: 'record', mover: { kind: 'spin', axis: 'z', amount: 200 } });
    b.cyl([0.1, 0.014, 0.1], [0, 1.0, 0.272], { color: '#d32f2f', rot: [80, 0, 0], parent: 'record' });
    b.box([0.6, 0.32, 0.02], [0, 0.45, 0.28], { color: '#d4af37' });
    b.each(6, (i) => b.box([0.55, 0.015, 0.022], [0, 0.33 + i * 0.045, 0.285], { color: '#5a3a20', noInk: true }));
    b.pair((s) => b.stick([s * 0.38, 0.08, 0.28], [s * 0.38, 1.05, 0.28], 0.05, '#26c6da', { glow: true, name: s > 0 ? 'tubeL' : 'tubeR', mover: { kind: 'light' } }));
    b.each(6, (i) => b.box([0.05, 0.03, 0.03], [-0.2 + i * 0.08, 0.74, 0.28], { color: i % 2 ? '#d32f2f' : '#f6efdc' }));
    b.box([0.85, 0.08, 0.55], [0, 0.04, 0], { color: '#d4af37' });
    return b
      .act({
        click: [
          [A.par(A.operate('neon', 'on'), A.operate('tube', 'on')), A.operate('record', 'on'), A.say('Doo-wop, doo-wop!', 2.5)],
          [A.operate('record', 'off'), A.par(A.operate('neon', 'off'), A.operate('tube', 'off'))],
        ],
      })
      .done();
  }),
  // A set of jumper cables, red and black, coiled on the floor (each cable is 4 m long, but coiled it lies a few
  // centimetres high), with copper-jawed clamps that spark when touched together.
  e('jumper cable', 'garage', 'car tools', () => {
    const b = m('jumper cable');
    for (const [x, c, n] of [[-0.15, '#d32f2f', 'clampR'], [0.15, '#1e1e1e', 'clampB']] as const) {
      for (let k = 0; k < 3; k++) b.torus([0.36 - k * 0.03, 0.36 - k * 0.03, 0.025], [x, 0.012 + k * 0.022, 0], { color: c, rot: [90, 0, 0], tube: 0.08 });
      const cx = x * 2.7;
      b.box([0.035, 0.022, 0.13], [cx, 0.05, 0.15], { color: c, rot: [12, 0, 0], name: n, pivot: [cx, 0.035, 0.1], edge: 'sharp' });
      b.box([0.035, 0.022, 0.13], [cx, 0.02, 0.15], { color: c, rot: [-8, 0, 0], edge: 'sharp' });
      b.box([0.04, 0.02, 0.04], [cx, 0.04, 0.22], { color: 'copper', parent: n });
      b.rod([x * 1.6, 0.03, 0.12], [cx, 0.035, 0.09], 0.02, c);
    }
    return b.act({ click: [A.par(A.pose('clampR', { rot: [-25, 0, 0], dur: 0.2 }), A.pose('clampB', { rot: [-25, 0, 0], dur: 0.2 })), A.par(A.effect('sparkle', { dur: 1 }), A.say('Zap!', 1)), A.par(A.pose('clampR', { rot: [0, 0, 0], dur: 0.2 }), A.pose('clampB', { rot: [0, 0, 0], dur: 0.2 }))] }).done();
  }),
  // A skipping rope caught mid-swing: the rope arching over between two wooden handles; it whirls round.
  e('jumprope', 'toys', 'outdoor toys', () => {
    const b = m('jumprope');
    b.arc([0.7, 1.5, 0.014], [0, 0.12, 0], { color: 'white', tube: 0.02, name: 'rope', pivot: [0, 0.12, 0] });
    b.pair((s) => b.capsule([0.04, 0.16, 0.04], [s * 0.35, 0.08, 0], { color: s > 0 ? '#d32f2f' : '#1f5fb8', rot: [0, 0, s * 20] }));
    return b.act({ click: [A.pose('rope', { rot: [360, 0, 0], dur: 0.6 }), A.pose('rope', { rot: [0, 0, 0], dur: 0 }), A.pose('rope', { rot: [360, 0, 0], dur: 0.6 }), A.pose('rope', { rot: [0, 0, 0], dur: 0 }), A.say('Skip skip!', 1)] }).done();
  }),
  // A playground climbing frame at real size: a tower of red posts with a deck at 1.2 m and a peaked roof, a ladder,
  // monkey bars across to a second frame, a yellow slide, and a swing that swings.
  e('jungle gym', 'toys', 'playground', () => {
    const b = m('jungle gym', { edge: 'sharp' });
    for (const x of [-1.6, -0.4]) for (const zz of [-0.6, 0.6]) b.stick([x, 0, zz], [x, 2.4, zz], 0.09, '#d32f2f');
    b.box([1.3, 0.08, 1.3], [-1.0, 1.2, 0], { color: '#43a047' });
    b.pair((s) => b.stick([-1.6, 1.6, s * 0.6], [-0.4, 1.6, s * 0.6], 0.05, '#1f5fb8'));
    b.wedge([1.6, 0.8, 1.6], [-1.0, 2.8, 0], { color: '#d32f2f', rot: [0, 90, 0] });
    b.pair((s) => b.stick([-1.85 + 0.0, 0, s * 0.25], [-1.6, 1.2, s * 0.25], 0.05, '#f6d24a'));
    b.each(4, (i) => b.stick([-1.81 + i * 0.05, 0.3 + i * 0.3, -0.25], [-1.81 + i * 0.05, 0.3 + i * 0.3, 0.25], 0.04, '#f6d24a'));
    for (const zz of [-0.5, 0.5]) b.stick([-0.4, 2.1, zz], [1.6, 2.1, zz], 0.06, '#1f5fb8');
    b.each(7, (i) => b.stick([-0.15 + i * 0.25, 2.1, -0.5], [-0.15 + i * 0.25, 2.1, 0.5], 0.04, '#f6d24a'));
    for (const zz of [-0.5, 0.5]) b.stick([1.6, 0, zz], [1.6, 2.1, zz], 0.08, '#d32f2f');
    b.box([0.6, 0.05, 2.0], [-1.0, 0.65, 1.45], { color: '#f6d24a', rot: [38, 0, 0], round: 0.2 });
    b.pair((s) => b.box([0.05, 0.18, 2.0], [-1.0 + s * 0.3, 0.72, 1.45], { color: '#f6d24a', rot: [38, 0, 0] }));
    b.stick([0.4, 0.0, -1.4], [0.4, 2.3, -1.0], 0.08, '#d32f2f');
    b.stick([1.6, 0.0, -1.4], [1.6, 2.3, -1.0], 0.08, '#d32f2f');
    b.stick([0.4, 2.3, -1.0], [1.6, 2.3, -1.0], 0.07, '#1f5fb8');
    b.pair((s) => b.stick([1.0 + s * 0.2, 2.28, -1.0], [1.0 + s * 0.2, 0.5, -1.0], 0.015, '#8a8e92', { name: s > 0 ? 'chainL' : 'chainR', pivot: [1.0 + s * 0.2, 2.28, -1.0] }));
    b.box([0.5, 0.04, 0.2], [1.0, 0.48, -1.0], { color: '#1e1e1e', round: 0.3, name: 'swing', pivot: [1.0, 2.28, -1.0] });
    return withSockets(
      b
        .act({
          click: [
            A.par(A.pose('swing', { rot: [35, 0, 0], dur: 0.6 }), A.pose('chainL', { rot: [35, 0, 0], dur: 0.6 }), A.pose('chainR', { rot: [35, 0, 0], dur: 0.6 })),
            A.par(A.pose('swing', { rot: [-30, 0, 0], dur: 0.9 }), A.pose('chainL', { rot: [-30, 0, 0], dur: 0.9 }), A.pose('chainR', { rot: [-30, 0, 0], dur: 0.9 })),
            A.par(A.pose('swing', { rot: [0, 0, 0], dur: 0.6 }), A.pose('chainL', { rot: [0, 0, 0], dur: 0.6 }), A.pose('chainR', { rot: [0, 0, 0], dur: 0.6 }), A.say('Creak creak!', 1.2)),
          ],
        })
        .done(),
      [{ name: 'deck', at: [-1.0, 1.25, 0], kind: 'top', size: 1 }, { name: 'swing', at: [1.0, 0.5, -1.0], kind: 'seat', part: 'swing' }],
    );
  }),
  // A scrapyard behind a corrugated fence: a stack of crushed cars, a heap of tyres, a rusting car body, scrap
  // piles, the gate with its sign, and a crane with an electromagnet that swings and drops.
  e('junkyard', 'places', 'yards', () => {
    const b = m('junkyard', { edge: 'sharp' });
    b.box([14, 0.1, 10], [0, 0.05, 0], { color: '#8a7a5a' });
    b.box([14, 2.4, 0.08], [0, 1.2, -5], { color: '#8a8f94' });
    b.each(15, (i) => b.box([0.06, 2.4, 0.12], [-7 + i, 1.2, -5], { color: '#6a6f74', noInk: true }));
    b.pair((s) => b.box([0.08, 2.4, 10], [s * 7, 1.2, 0], { color: '#8a8f94' }));
    b.pair((s) => b.box([4.6, 2.4, 0.08], [s * 4.7, 1.2, 5], { color: '#8a8f94' }));
    b.pair((s) => {
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([2.35, 2.2, 0.06], [s * 1.2, 1.15, 5.05], { color: '#5a5e62', name: n, pivot: [s * 2.4, 1.15, 5.05], mover: { kind: 'swing', axis: 'y', amount: s * 100 } });
      b.each(3, (i) => b.box([2.3, 0.05, 0.08], [s * 1.2, 0.4 + i * 0.7, 5.08], { color: '#3a3d42', parent: n }));
    });
    b.label('JUNKYARD', [3.0, 0.6], [0, 2.75, 5.1], { color: '#f6d24a', depth: 0.05 });
    b.pair((s) => b.box([0.15, 3.1, 0.15], [s * 2.45, 1.55, 5.05], { color: '#3a3d42' }));
    const cs = ['#a0522d', '#5c7a8a', '#8a3a2a', '#c9a050', '#5a7a4a'];
    b.each(5, (i) => b.box([2.4, 0.55, 1.2], [-4 + (i % 2) * 0.2, 0.38 + i * 0.56, -3.6], { color: cs[i], rot: [0, i * 6 - 12, 0], round: 0.1 }));
    b.each(6, (i) => b.torus([0.75, 0.75, 0.24], [3.5 + (i % 2) * 0.12, 0.22 + i * 0.24, -3.5], { color: '#2b2b2b', rot: [90, 0, 0], tube: 0.35, edge: 'soft' }));
    b.box([1.8, 0.7, 4.2], [-2.8, 0.55, 1.4], { color: '#7a8a5a', round: 0.3, rot: [0, 25, 4], edge: 'soft' });
    b.box([1.5, 0.55, 2.0], [-2.9, 1.1, 1.2], { color: '#6a7a4a', round: 0.3, rot: [0, 25, 4], edge: 'soft' });
    b.pair((s) => b.cyl([0.65, 0.25, 0.65], [-2.8 + s * 0.9, 0.3, 2.2 - s * 0.3], { color: '#2b2b2b', rot: [0, 25, 90], edge: 'soft' }));
    b.dome([3, 1.2, 2.4], [0.8, 0.6, -0.5], { color: '#7a6a5a' });
    b.box([1.2, 1.4, 1.2], [4.8, 0.7, 1.5], { color: '#f6c400', round: 0.1 });
    b.cyl([0.6, 0.5, 0.6], [4.8, 1.65, 1.5], { color: '#3a3d42', name: 'crane', pivot: [4.8, 1.4, 1.5] });
    b.stick([4.8, 1.8, 1.5], [1.8, 6.0, 0.2], 0.25, '#f6c400', { parent: 'crane' });
    b.stick([1.8, 6.0, 0.2], [1.8, 3.6, 0.2], 0.03, '#3a3d42', { parent: 'crane', name: 'cable' });
    b.cyl([1.1, 0.3, 1.1], [1.8, 3.45, 0.2], { color: '#5a5e62', parent: 'cable', name: 'magnet' });
    return b
      .act({
        click: [
          [A.pose('crane', { rot: [0, 40, 0], dur: 1 }), A.pose('cable', { move: [0, -1.4, 0], dur: 0.6 }), A.par(A.say('CLANK!', 1.2), A.effect('dust', { dur: 1 })), A.pose('cable', { move: [0, 0, 0], dur: 0.6 }), A.pose('crane', { rot: [0, 0, 0], dur: 1 })],
          [A.operate('door', 'open'), A.say('Creeeak...', 1.5), A.wait(2), A.operate('door', 'close')],
        ],
      })
      .done();
  }),
  // A brass-bound kaleidoscope on a little stand, its coloured end cap turning in sparkles.
  e('kaleidoscope', 'toys', 'classic toys', () => {
    const b = m('kaleidoscope').box([0.14, 0.02, 0.08], [0, 0.01, 0], { color: 'darkwood', edge: 'sharp' }).stick([0, 0.02, 0], [0, 0.07, 0], 0.015, 'darkwood');
    b.cyl([0.055, 0.24, 0.055], [0, 0.1, 0], { color: '#7b3fa0', rot: [75, 0, 0] });
    b.each(4, (i) => b.cyl([0.057, 0.02, 0.057], [0, 0.1 + (i - 1.5) * 0.05 * 0.26, (i - 1.5) * 0.05 * 0.97], { color: ['#f6d24a', '#26c6da', '#f48fb1', '#9ccc65'][i], rot: [75, 0, 0], noInk: true }));
    b.cyl([0.07, 0.04, 0.07], [0, 0.131, 0.116], { color: '#c9a040', rot: [75, 0, 0], name: 'cap', pivot: [0, 0.131, 0.116] });
    b.cyl([0.05, 0.042, 0.05], [0, 0.131, 0.117], { color: '#bfe4f6', rot: [75, 0, 0], parent: 'cap', noInk: true });
    b.cyl([0.04, 0.02, 0.04], [0, 0.068, -0.125], { color: '#1e1e1e', rot: [75, 0, 0] });
    return b.act({ click: [A.par(A.pose('cap', { rot: [0, 0, 180], dur: 1.2 }), A.effect('sparkle', { dur: 1.5 })), A.pose('cap', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A katana resting on its black lacquer stand: the curved scabbard, the cord-wrapped hilt and round guard; it is
  // drawn to show the gleaming blade, then sheathed.
  e('katana', 'armory', 'swords', () => {
    const b = m('katana', { edge: 'sharp' });
    b.box([0.7, 0.03, 0.18], [0, 0.015, 0], { color: '#1e1e1e', round: 0.3 });
    b.pair((s) => {
      b.box([0.04, 0.32, 0.1], [s * 0.28, 0.17, 0], { color: '#1e1e1e', round: 0.3 });
      b.box([0.06, 0.04, 0.1], [s * 0.28, 0.3, 0.02], { color: '#1e1e1e', round: 0.3 });
    });
    b.box([0.72, 0.035, 0.032], [0.06, 0.33, 0.03], { color: '#2a1414', round: 0.5, rot: [0, 0, 2] });
    b.box([0.02, 0.04, 0.036], [-0.3, 0.33, 0.03], { color: 'gold' });
    b.box([0.68, 0.03, 0.006], [0.04, 0.33, 0.03], { color: '#e8ecf0', round: 0.2, rot: [0, 0, 2], name: 'blade', scale: 1 });
    b.cyl([0.07, 0.012, 0.07], [-0.32, 0.33, 0.03], { color: 'gold', rot: [0, 0, 90], parent: 'blade' });
    b.box([0.24, 0.032, 0.03], [-0.45, 0.33, 0.03], { color: '#1e1e1e', round: 0.4, parent: 'blade' });
    b.each(5, (i) => b.box([0.02, 0.034, 0.032], [-0.54 + i * 0.045, 0.33, 0.03], { color: 'white', rot: [45, 0, 0], noInk: true, parent: 'blade' }));
    b.ball(0.02, [-0.57, 0.33, 0.03], { color: 'gold', parent: 'blade' });
    return b
      .act({ click: [A.pose('blade', { move: [-0.55, 0.05, 0], dur: 0.5 }), A.par(A.effect('sparkle', { dur: 1 }), A.say('Shing!', 1)), A.wait(0.8), A.pose('blade', { move: [0, 0, 0], dur: 0.5 }), A.say('Click.', 0.8)] })
      .done();
  }),
  // A sit-in touring kayak at real size (4 m long, so lying on the ground it is far lower than the 4 m the
  // vocabulary gives): a pointed loft hull, a cockpit with its coaming and seat, deck bungees, and a double-bladed
  // paddle that strokes as it rocks on the water.
  e('kayak', 'garage', 'boats', () => {
    const b = m('kayak', { view: 'side' });
    const prof: Array<[number, number, number, number]> = [[0, 0.05, 0.4, 0.1], [0.12, 0.6, 0.8, 0], [0.45, 1, 1, 0], [0.6, 1, 1, 0], [0.88, 0.6, 0.8, 0], [1, 0.05, 0.4, 0.1]];
    b.loft([0.62, 0.34, 4.0], [0, 0.17, 0], prof, { color: '#f57c00', name: 'hull', pivot: [0, 0, 0] });
    b.loft([0.6, 0.06, 3.9], [0, 0.32, 0], prof, { color: '#f6d24a', parent: 'hull', noInk: true });
    b.torus([0.46, 0.68, 0.05], [0, 0.35, -0.2], { color: '#1e1e1e', rot: [90, 0, 0], parent: 'hull', edge: 'sharp' });
    b.ball([0.38, 0.08, 0.56], [0, 0.34, -0.2], { color: '#2a2726', parent: 'hull' });
    b.box([0.3, 0.2, 0.06], [0, 0.4, -0.45], { color: '#3a3633', round: 0.4, parent: 'hull' });
    b.pair((s) => b.rod([s * 0.15, 0.34, 0.6], [-s * 0.12, 0.33, 1.1], 0.012, '#1e1e1e', { parent: 'hull' }));
    b.stick([-1.1, 0.48, 0.25], [1.1, 0.48, 0.25], 0.035, '#1e1e1e', { name: 'paddle', parent: 'hull', pivot: [0, 0.48, 0.25] });
    b.pair((s) => b.box([0.38, 0.03, 0.16], [s * 1.25, 0.48, 0.25], { color: '#f6d24a', round: 0.6, rot: [s * 60, 0, 0], parent: 'paddle', edge: 'sharp' }));
    return withSockets(
      b
        .act({
          click: [
            A.par(A.pose('paddle', { rot: [0, 0, 25], dur: 0.4 }), A.pose('hull', { rot: [0, 0, 4], dur: 0.4 }), A.effect('water_spray', { dur: 1.6 })),
            A.par(A.pose('paddle', { rot: [0, 0, -25], dur: 0.5 }), A.pose('hull', { rot: [0, 0, -4], dur: 0.5 })),
            A.par(A.pose('paddle', { rot: [0, 0, 0], dur: 0.4 }), A.pose('hull', { rot: [0, 0, 0], dur: 0.4 }), A.say('Splash!', 1)),
          ],
        })
        .done(),
      [{ name: 'seat', at: [0, 0.3, -0.25], kind: 'seat', part: 'hull' }],
    );
  }),
  // A red plastic kazoo with its round resonator top; it buzzes a tune.
  e('kazoo', 'music', 'wind', () =>
    m('kazoo')
      .cyl([0.03, 0.12, 0.03], [0, 0.02, 0], { color: '#e53935', rot: [0, 0, 90], taper: 0.65, name: 'kazoo' })
      .cyl([0.026, 0.03, 0.026], [0.015, 0.042, 0], { color: '#e53935', parent: 'kazoo' })
      .cyl([0.032, 0.008, 0.032], [0.015, 0.058, 0], { color: '#f6d24a', parent: 'kazoo' })
      .act({ click: [A.par(A.anim('wobble', 2), A.say('Bzzz-zoo-zoo!', 1.8))] })
      .done(),
  ),
  // A shish kebab propped on a plate of flatbread: chunks of grilled meat, green pepper, onion and cherry tomato on
  // a wooden skewer; it lifts off the grill sizzling.
  e('kebab', 'food', 'meat', () => {
    const b = m('kebab').cyl([0.3, 0.012, 0.2], [0, 0.006, 0], { color: 'white', edge: 'sharp', round: 0.5 });
    b.box([0.22, 0.012, 0.14], [0.0, 0.018, 0], { color: '#e8c48a', round: 0.6 });
    b.box([0.06, 0.04, 0.05], [-0.1, 0.035, 0], { color: '#f0e0f0', round: 0.6 });
    const p0: V = [-0.15, 0.04, 0], p1: V = [0.15, 0.2, 0];
    b.stick(p0, p1, 0.005, 'lightwood', { name: 'skewer', pivot: p0 });
    const items: Array<[string, 'box' | 'ball']> = [['#8a4a2a', 'box'], ['#43a047', 'box'], ['#8a4a2a', 'box'], ['#e53935', 'ball'], ['#8a4a2a', 'box'], ['#f0e0f0', 'box'], ['#8a4a2a', 'box']];
    items.forEach(([c, sh], i) => {
      const t = 0.18 + i * 0.1, at: V = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, 0];
      if (sh === 'box') b.box([0.03, 0.032, 0.032], at, { color: c, rot: [i * 25, 0, 28], round: 0.3, parent: 'skewer' });
      else b.ball(0.03, at, { color: c, parent: 'skewer' });
    });
    b.box([0.04, 0.004, 0.025], [0.09, 0.026, 0.05], { color: '#43a047', rot: [0, 30, 0] });
    return b.act({ click: [A.par(A.pose('skewer', { rot: [0, 0, 12], dur: 0.4 }), A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.5)), A.wait(1), A.pose('skewer', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A squeezy ketchup bottle with a flip cap and a tomato label; it squirts a dollop, which is wiped up next time.
  e('ketchup', 'food', 'sauces', () => {
    const b = m('ketchup');
    b.cyl([0.065, 0.15, 0.05], [0, 0.075, 0], { color: '#d32f2f', round: 0.4, name: 'bottle', pivot: [0, 0, 0] });
    b.cyl([0.06, 0.02, 0.045], [0, 0.16, 0], { color: '#d32f2f', taper: 0.6, parent: 'bottle' });
    b.cyl([0.035, 0.03, 0.035], [0, 0.182, 0], { color: 'white', parent: 'bottle', edge: 'sharp' });
    b.cone([0.014, 0.016, 0.014], [0, 0.205, 0], { color: 'white', parent: 'bottle' });
    b.cyl([0.0665, 0.06, 0.0515], [0, 0.07, 0], { color: 'white', parent: 'bottle', noInk: true });
    b.ball(0.025, [0, 0.07, 0.027], { color: '#e53935', parent: 'bottle' });
    b.ball(0.008, [0, 0.084, 0.03], { color: '#43a047', parent: 'bottle' });
    b.dome([0.05, 0.015, 0.04], [0.07, 0.0, 0.05], { color: '#c62828', name: 'dollop', scale: 0 });
    return b
      .act({
        click: [
          [A.pose('bottle', { rot: [0, 0, -100], move: [0.04, 0.1, 0.03], dur: 0.4 }), A.par(A.pose('bottle', { scale: 0.9, dur: 0.2 }), A.pose('dollop', { scale: 1, dur: 0.3 }), A.say('Splort!', 1)), A.pose('bottle', { rot: [0, 0, 0], move: [0, 0, 0], scale: 1, dur: 0.4 })],
          [A.pose('dollop', { scale: 0, dur: 0.3 })],
        ],
      })
      .done();
  }),
  // A red enamel whistling kettle: wide base, domed top with a knob, a spout with its whistle cap and a black bail
  // handle; it boils and whistles.
  e('kettle', 'kitchen', 'cookware', () => {
    const b = m('kettle').cyl([0.22, 0.12, 0.22], [0, 0.06, 0], { color: '#d32f2f', taper: 0.72 }).dome([0.16, 0.05, 0.16], [0, 0.145, 0], { color: '#d32f2f' });
    b.ball(0.03, [0, 0.18, 0], { color: '#1e1e1e' });
    b.stick([0.07, 0.06, 0], [0.16, 0.15, 0], 0.04, '#d32f2f', { taper: 0.5 });
    b.cyl([0.026, 0.02, 0.026], [0.165, 0.158, 0], { color: 'silver', rot: [0, 0, -45], name: 'whistle', pivot: [0.15, 0.15, 0] });
    b.arc([0.16, 0.16, 0.018], [0, 0.15, 0], { color: '#1e1e1e', rot: [0, 90, 0], tube: 0.12, arc: 150 });
    b.cyl([0.225, 0.006, 0.225], [0, 0.003, 0], { color: '#3a3633' });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2.5 }), A.anim('shake'), A.pose('whistle', { rot: [0, 0, 20], dur: 0.2 }), A.say('Wheeeeeee!', 2.5)), A.pose('whistle', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A brass door key standing on its tip; it turns in an imaginary lock.
  e('key', 'home', 'keys', () => {
    const b = m('key', { edge: 'sharp' });
    b.box([0.004, 0.004, 0.004], [0, 0.002, 0], { color: 'brass', name: 'key', pivot: [0, 0, 0] });
    b.torus([0.038, 0.038, 0.008], [0, 0.07, 0], { color: 'brass', tube: 0.35, parent: 'key' });
    b.stick([0, 0.052, 0], [0, 0.004, 0], 0.012, 'brass', { parent: 'key' });
    b.box([0.016, 0.02, 0.007], [0.01, 0.013, 0], { color: 'brass', round: 0.1, parent: 'key' });
    b.box([0.012, 0.008, 0.007], [0.008, 0.028, 0], { color: 'brass', round: 0.1, parent: 'key' });
    return b.act({ click: [A.pose('key', { rot: [0, 90, 0], dur: 0.4 }), A.say('Click!', 1), A.pose('key', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A keyhole in a brass escutcheon on a panel of door: the cover flap swings aside and an eye peeks through.
  e('key hole', 'home', 'keys', () =>
    m('key hole', { edge: 'sharp' })
      .box([0.16, 0.2, 0.03], [0, 0.1, -0.02], { color: '#8a5a32', round: 0.1 })
      .box([0.07, 0.12, 0.015], [0, 0.1, 0], { color: 'brass', round: 0.5 })
      .cyl([0.024, 0.017, 0.024], [0, 0.113, 0.003], { color: '#1e1e1e', rot: [90, 0, 0] })
      .wedge([0.024, 0.04, 0.017], [0, 0.087, 0.003], { color: '#1e1e1e' })
      .ball([0.02, 0.014, 0.004], [0, 0.113, 0.008], { color: 'white', name: 'eye', scale: 0 })
      .ball(0.008, [0, 0.113, 0.011], { color: '#3a6a9a', parent: 'eye' })
      .box([0.04, 0.06, 0.006], [0, 0.11, 0.012], { color: '#c9a040', round: 0.5, name: 'flap', pivot: [0, 0.14, 0.012], mover: { kind: 'swing', axis: 'z', amount: 80 } })
      .ball(0.008, [0, 0.15, 0.008], { color: '#5a3a22' })
      .ball(0.008, [0, 0.05, 0.008], { color: '#5a3a22' })
      .act({ click: [[A.operate('flap', 'open'), A.pose('eye', { scale: 1, dur: 0.3 }), A.say('Peek!', 1)], [A.pose('eye', { scale: 0, dur: 0.2 }), A.operate('flap', 'close')]] })
      .done(),
  ),
  // A key lime pie in its graham crust: pale lime filling, rosettes of whipped cream, a lime wheel, and a slice that
  // comes out.
  e('key lime pie', 'food', 'desserts', () => {
    const b = m('key lime pie').cyl([0.23, 0.045, 0.23], [0, 0.0225, 0], { color: '#c8945a', taper: 1.12, name: 'pie' });
    b.cyl([0.22, 0.012, 0.22], [0, 0.046, 0], { color: '#e4ec9a', parent: 'pie' });
    around(9, 0.085).forEach(([x, zz]) => b.cone([0.03, 0.03, 0.03], [x, 0.065, zz], { color: 'white', segs: 8, parent: 'pie' }));
    b.cyl([0.045, 0.008, 0.045], [0, 0.06, 0], { color: '#9ccc65', rot: [80, 0, 0], parent: 'pie' });
    b.wedge([0.08, 0.11, 0.035], [0.08, 0.02, 0.06], { color: '#c8945a', rot: [90, 0, 140], name: 'slice', parent: 'pie', piece: true });
    b.wedge([0.074, 0.1, 0.014], [0.08, 0.046, 0.06], { color: '#e4ec9a', rot: [90, 0, 140], parent: 'slice' });
    return b.act({ click: [[A.detach('slice', 'slice'), A.say('Yum!', 1)], [A.reattach('slice')]] }).done();
  }),
  // A full-size computer keyboard: rows of keycaps, a long space bar, an enter key and a number pad; keys clack.
  e('keyboard (computer)', 'tech', 'computer parts', () => {
    const b = m('keyboard (computer)', { edge: 'sharp' }).box([0.44, 0.03, 0.15], [0, 0.015, 0], { color: '#3a3d42', round: 0.2 });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
      if (r === 0 && c > 2 && c < 9) continue;
      b.box([0.024, 0.012, 0.023], [-0.2 + c * 0.028, 0.035, 0.055 - r * 0.026], { color: '#e8e8e4', round: 0.3, name: `k${r}${c}` });
    }
    b.box([0.16, 0.012, 0.023], [-0.045, 0.035, 0.055], { color: '#e8e8e4', round: 0.3, name: 'space' });
    b.each(3, (c) => b.each(4, (r) => b.box([0.022, 0.012, 0.022], [0.15 + c * 0.026, 0.035, 0.055 - r * 0.026], { color: '#d0d0cc', round: 0.3 })));
    b.ball(0.004, [0.19, 0.032, -0.06], { color: '#4caf50', glow: true });
    return b
      .act({ click: [A.pose('k12', { move: [0, -0.005, 0], dur: 0.06 }), A.pose('k12', { move: [0, 0, 0], dur: 0.06 }), A.pose('k25', { move: [0, -0.005, 0], dur: 0.06 }), A.pose('k25', { move: [0, 0, 0], dur: 0.06 }), A.pose('space', { move: [0, -0.005, 0], dur: 0.06 }), A.pose('space', { move: [0, 0, 0], dur: 0.06 }), A.say('Clackety clack!', 1.2)] })
      .done();
  }),
  // An electronic keyboard on its X stand at playing height (the keyboard itself is 0.1 m; on its stand it comes to
  // 0.85 m, hence the size warning): 36 white keys and their black keys, a screen, buttons and speakers; it plays.
  e('keyboard (music)', 'music', 'keys', () => {
    const b = m('keyboard (music)', { edge: 'sharp' });
    b.pair((s) => {
      b.rod([s * 0.35, 0.02, 0.25], [s * 0.35, 0.72, -0.2], 0.035, '#3a3d42');
      b.rod([s * 0.35, 0.02, -0.25], [s * 0.35, 0.72, 0.2], 0.035, '#3a3d42');
      b.box([0.08, 0.03, 0.45], [s * 0.35, 0.74, 0], { color: '#3a3d42' });
    });
    b.box([1.0, 0.1, 0.32], [0, 0.8, 0], { color: '#1e1e1e', round: 0.2 });
    const wk = 0.026;
    for (let i = 0; i < 34; i++) b.box([wk - 0.002, 0.02, 0.13], [-0.44 + i * wk, 0.86, 0.08], { color: 'white', round: 0.1, name: `w${i}` });
    for (let i = 0; i < 33; i++) {
      const n = i % 7;
      if (n === 2 || n === 6) continue;
      b.box([0.014, 0.022, 0.08], [-0.44 + i * wk + wk / 2, 0.875, 0.055], { color: '#1e1e1e', round: 0.1 });
    }
    b.box([0.14, 0.05, 0.01], [0, 0.86, -0.05], { color: '#26c6da', glow: true, name: 'screen', mover: { kind: 'light', on: true } });
    b.pair((s) => b.cyl([0.1, 0.01, 0.1], [s * 0.36, 0.851, -0.08], { color: '#3a3d42', noInk: true }));
    b.each(6, (i) => b.cyl([0.02, 0.012, 0.02], [0.12 + i * 0.03, 0.856, -0.07], { color: ['#e53935', '#f6d24a', '#43a047', '#1f5fb8', 'white', '#fb8c00'][i] }));
    return withSockets(
      b
        .act({
          click: [A.pose('w10', { move: [0, -0.008, 0], dur: 0.1 }), A.pose('w10', { move: [0, 0, 0], dur: 0.1 }), A.pose('w12', { move: [0, -0.008, 0], dur: 0.1 }), A.pose('w12', { move: [0, 0, 0], dur: 0.1 }), A.pose('w14', { move: [0, -0.008, 0], dur: 0.1 }), A.pose('w14', { move: [0, 0, 0], dur: 0.1 }), A.say('Plink plonk plink!', 1.5)],
        })
        .done(),
      [{ name: 'top', at: [0, 0.86, -0.08], kind: 'top', size: 0.3 }],
    );
  }),
  // A hotel key card and its door reader: the card swipes, the light turns from red to green and it beeps.
  e('keycard', 'tech', 'gadgets', () =>
    m('keycard', { edge: 'sharp' })
      .box([0.08, 0.13, 0.03], [0, 0.065, -0.03], { color: '#3a3d42', round: 0.2 })
      .ball(0.012, [-0.018, 0.11, -0.012], { color: '#e53935', glow: true, name: 'red', mover: { kind: 'light', on: true } })
      .ball(0.012, [0.018, 0.11, -0.012], { color: '#4caf50', glow: true, name: 'green', mover: { kind: 'light' } })
      .box([0.05, 0.006, 0.01], [0, 0.085, -0.014], { color: '#1e1e1e' })
      .box([0.086, 0.054, 0.004], [0, 0.03, 0.02], { color: 'white', round: 0.2, rot: [-12, 0, 0], name: 'card' })
      .box([0.087, 0.012, 0.005], [0, 0.042, 0.021], { color: '#1f5fb8', rot: [-12, 0, 0], noInk: true, parent: 'card' })
      .box([0.016, 0.013, 0.004], [-0.022, 0.024, 0.024], { color: 'gold', rot: [-12, 0, 0], parent: 'card' })
      .act({ click: [A.pose('card', { move: [0, 0.06, -0.025], rot: [12, 0, 0], dur: 0.3 }), A.par(A.operate('red', 'off'), A.operate('green', 'on'), A.say('Beep!', 1)), A.wait(1), A.pose('card', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.par(A.operate('green', 'off'), A.operate('red', 'on'))] })
      .done(),
  ),
  // A key ring with two keys and a pink heart fob; it jingles.
  e('keychain', 'home', 'keys', () => {
    const b = m('keychain').torus([0.04, 0.04, 0.005], [0, 0.072, 0], { color: 'silver', tube: 0.1, edge: 'sharp' });
    key(b, -0.014, 0, 'brass', 0.07, 15);
    key(b, 0.014, 0.005, 'silver', 0.07, -15);
    return b.rod([0.015, 0.06, -0.006], [0.04, 0.045, -0.006], 0.004, 'silver').heart(0.035, [0.045, 0.028, -0.006], { color: '#f48fb1' }).act({ click: [A.anim('shake', 2), A.say('Jingle jangle!', 1.2)] }).done();
  }),
  // A door access keypad: brushed steel, a green display, twelve rubber keys and status lights; a code is punched in.
  e('keypad', 'tech', 'electronics', () => {
    const b = m('keypad', { edge: 'sharp' }).box([0.09, 0.13, 0.025], [0, 0.065, 0], { color: '#c8ccd0', round: 0.2 });
    b.box([0.065, 0.02, 0.004], [0, 0.11, 0.012], { color: '#9ccc65', glow: true });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) b.box([0.018, 0.014, 0.006], [-0.022 + c * 0.022, 0.02 + r * 0.02, 0.013], { color: '#3a3d42', round: 0.3, name: `b${r}${c}` });
    b.ball(0.008, [0.035, 0.122, 0.013], { color: '#4caf50', glow: true, name: 'ok', mover: { kind: 'light' } });
    return b
      .act({ click: [A.pose('b31', { move: [0, 0, -0.003], dur: 0.08 }), A.pose('b31', { move: [0, 0, 0], dur: 0.08 }), A.pose('b20', { move: [0, 0, -0.003], dur: 0.08 }), A.pose('b20', { move: [0, 0, 0], dur: 0.08 }), A.pose('b12', { move: [0, 0, -0.003], dur: 0.08 }), A.pose('b12', { move: [0, 0, 0], dur: 0.08 }), A.operate('ok', 'on'), A.say('Beep boop beep!', 1.2), A.wait(1), A.operate('ok', 'off')] })
      .done();
  }),
  // A bunch of house keys on a split ring, brass, silver and copper; they jingle and spin.
  e('keys', 'home', 'keys', () => {
    const b = m('keys').torus([0.045, 0.045, 0.006], [0, 0.083, 0], { color: 'silver', tube: 0.1, edge: 'sharp' });
    key(b, -0.02, 0, 'brass', 0.08, 25);
    key(b, 0, 0.004, 'silver', 0.085, 0);
    key(b, 0.02, -0.004, 'copper', 0.08, -25);
    return b.act({ click: [A.anim('shake'), A.anim('spin'), A.say('Jingle!', 1)] }).done();
  }),
  // A pair of khaki chinos standing as if worn: a brown belt, slash pockets and sharp front creases.
  e('khakis', 'wardrobe', 'pants', () => {
    const b = pants('khakis', '#c8a878', 1.0, '#5a3a22', '#e8d8b8');
    b.pair((s) => b.box([0.006, 0.8, 0.005], [s * 0.115, 0.42, 0.097], { color: '#b89868', noInk: true, rot: [0, 0, s * 3] }));
    return b.act({ click: [A.anim('shake'), A.effect('dust', { dur: 0.8 })] }).done();
  }),
  // A kick scooter at real size (handlebar 0.9 m): a deck with grip tape, polyurethane wheels, the rear brake
  // fender, steering column and a T-bar with grips; it rolls forward and back.
  e('kick scooter', 'garage', 'scooters', () => {
    const b = m('kick scooter', { view: 'side', edge: 'sharp' });
    b.box([0.13, 0.04, 0.56], [0, 0.09, 0], { color: '#1f5fb8', round: 0.3, name: 'deck' });
    b.box([0.11, 0.004, 0.5], [0, 0.112, 0], { color: '#1e1e1e', parent: 'deck', noInk: true });
    wheel(b, 0.14, [0, 0.07, 0.34], { color: '#9ccc65', name: 'wheelF', w: 0.03, hub: 'silver' });
    wheel(b, 0.14, [0, 0.07, -0.34], { color: '#9ccc65', name: 'wheelB', w: 0.03, hub: 'silver' });
    b.box([0.04, 0.012, 0.16], [0, 0.15, -0.32], { color: 'silver', rot: [-15, 0, 0], parent: 'deck' });
    b.rod([0, 0.1, 0.28], [0, 0.07, 0.34], 0.03, 'silver', { parent: 'deck' });
    b.stick([0, 0.08, 0.34], [0, 0.92, 0.27], 0.035, 'silver', { parent: 'deck' });
    b.stick([-0.22, 0.92, 0.27], [0.22, 0.92, 0.27], 0.03, 'silver', { parent: 'deck' });
    b.pair((s) => b.stick([s * 0.12, 0.92, 0.27], [s * 0.23, 0.92, 0.27], 0.04, '#1e1e1e', { parent: 'deck', edge: 'soft' }));
    return b
      .act({
        click: [
          A.par(A.pose('deck', { move: [0, 0, 1.2], dur: 1 }), A.pose('wheelF', { move: [0, 0, 1.2], rot: [980, 0, 0], dur: 1 }), A.pose('wheelB', { move: [0, 0, 1.2], rot: [980, 0, 0], dur: 1 }), A.say('Whirr!', 1)),
          A.par(A.pose('deck', { move: [0, 0, 0], dur: 1 }), A.pose('wheelF', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1 }), A.pose('wheelB', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1 })),
        ],
      })
      .done();
  }),
  // A red rubber kickball with its pebbled seams; it bounces.
  e('kickball', 'sports', 'balls', () => {
    const b = m('kickball').ball(0.25, [0, 0.125, 0], { color: '#e53935', name: 'ball' });
    for (const r of [0, 60, 120]) b.torus([0.252, 0.252, 0.01], [0, 0.125, 0], { color: '#a01e1e', rot: [0, r, 0], noInk: true, tube: 0.04, parent: 'ball' });
    return b.act({ click: [A.pose('ball', { move: [0, 0.6, 0], dur: 0.35 }), A.pose('ball', { move: [0, 0, 0], dur: 0.3 }), A.pose('ball', { move: [0, 0.25, 0], dur: 0.2 }), A.pose('ball', { move: [0, 0, 0], dur: 0.2 }), A.say('Boing!', 1)] }).done();
  }),
  // A kidney: the bean-shaped organ with its renal artery, vein and ureter, a little fat at the hilum; it pulses.
  e('kidney', 'clinic', 'organs', () => {
    const c = '#8a3a3a';
    const b = m('kidney').ball([0.06, 0.065, 0.045], [0.006, 0.095, 0], { color: c }).ball([0.06, 0.065, 0.045], [0.006, 0.035, 0], { color: c }).ball([0.04, 0.06, 0.045], [0.02, 0.065, 0], { color: c });
    b.ball([0.02, 0.03, 0.03], [-0.016, 0.065, 0.004], { color: '#f0d8a0' });
    b.rod([-0.012, 0.072, 0.005], [-0.06, 0.085, 0.005], 0.012, '#d9404a').rod([-0.012, 0.062, 0], [-0.06, 0.06, 0], 0.012, '#4e6fc8');
    path(b, [[-0.01, 0.055, 0.01], [-0.03, 0.03, 0.012], [-0.035, 0.0, 0.012]], 0.008, '#e8d8a0');
    return b.act({ click: [A.anim('pulse', 2), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A white bowl of red kidney beans; they hop about.
  e('kidney bean', 'food', 'beans', () => {
    const b = m('kidney bean').cyl([0.09, 0.03, 0.09], [0, 0.015, 0], { color: 'white', taper: 1.35, edge: 'sharp', round: 0.3 });
    ([[-0.02, 0.035, 0.0, 0], [0.02, 0.035, 0.01, 60], [0.0, 0.035, -0.025, 120], [0.03, 0.036, -0.02, 30], [-0.03, 0.036, -0.02, 90], [0.0, 0.048, 0.0, 150], [-0.005, 0.034, 0.03, 20]] as const).forEach(([x, y, zz, a]) => {
      const r = (a * Math.PI) / 180;
      b.ball([0.016, 0.012, 0.012], [x + Math.cos(r) * 0.006, y, zz + Math.sin(r) * 0.006], { color: '#7a1e2a' }).ball([0.016, 0.012, 0.012], [x - Math.cos(r) * 0.006, y, zz - Math.sin(r) * 0.006], { color: '#7a1e2a' });
    });
    return b.act({ click: [A.anim('hop', 2), A.say('Pop pop!', 1)] }).done();
  }),
  // A spiky yellow-brown kidney stone in a little specimen dish; just looking at it hurts.
  e('kidney stone', 'clinic', 'medical', () => {
    const b = m('kidney stone').cyl([0.09, 0.008, 0.09], [0, 0.004, 0], { color: 'white', edge: 'sharp' }).ball([0.032, 0.026, 0.028], [0, 0.021, 0], { color: '#c9a050' });
    for (const [x, y, zz, rx, rz] of [[0.015, 0.03, 0, 0, -50], [-0.015, 0.03, 0.005, 0, 50], [0, 0.036, 0, 0, 0], [0.005, 0.022, 0.015, 60, 0], [-0.01, 0.022, -0.014, -60, 0]] as const) b.cone([0.012, 0.018, 0.012], [x, y, zz], { color: '#b8903e', rot: [rx, 0, rz] });
    return b.act({ click: [A.anim('shake'), A.say('Rattle!', 1)] }).done();
  }),
  // A tartan kilt standing as if worn: pleated red tartan with green and navy checks, a belt, a leather sporran on
  // its chain; it swishes.
  e('kilt', 'wardrobe', 'skirts', () => {
    const b = m('kilt').cyl([0.38, 0.46, 0.3], [0, 0.23, 0], { color: '#c62828', taper: 0.82, name: 'kilt', pivot: [0, 0.47, 0] });
    for (const y of [0.08, 0.2, 0.32]) b.cyl([0.37 - y * 0.15, 0.025, 0.29 - y * 0.1], [0, y, 0], { color: '#1b5e20', taper: 0.98, noInk: true, parent: 'kilt' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.box([0.012, 0.44, 0.012], [Math.sin(a) * 0.17, 0.23, Math.cos(a) * 0.135], { color: '#1a237e', noInk: true, parent: 'kilt', rot: [0, (a * 180) / Math.PI, 0] });
    });
    b.cyl([0.32, 0.04, 0.25], [0, 0.47, 0], { color: '#1e1e1e' });
    b.box([0.12, 0.13, 0.04], [0, 0.36, 0.14], { color: 'leather', round: 0.4 });
    b.pair((s) => b.rod([s * 0.025, 0.32, 0.165], [s * 0.025, 0.24, 0.165], 0.012, 'white'));
    b.box([0.006, 0.12, 0.004], [0.09, 0.4, 0.13], { color: 'silver', noInk: true });
    return b.act({ click: [A.pose('kilt', { rot: [0, 25, 0], dur: 0.3 }), A.pose('kilt', { rot: [0, -25, 0], dur: 0.4 }), A.pose('kilt', { rot: [0, 0, 0], dur: 0.3 }), A.say('Swish!', 1)] }).done();
  }),
  // A red silk kimono as if worn: wide hanging sleeves, a white collar crossing left over right, a gold obi with
  // its bow at the back, cherry blossoms; it twirls.
  e('kimono', 'wardrobe', 'robes', () => {
    const b = m('kimono').box([0.46, 1.3, 0.26], [0, 0.65, 0], { color: '#c62828', round: 0.2, name: 'robe', pivot: [0, 0, 0] });
    b.pair((s) => {
      b.box([0.3, 0.5, 0.22], [s * 0.36, 1.03, 0], { color: '#c62828', round: 0.2, parent: 'robe' });
      b.box([0.05, 0.42, 0.02], [s * 0.05, 1.12, 0.13], { color: 'white', rot: [0, 0, -s * 25], parent: 'robe' });
    });
    b.box([0.03, 0.85, 0.02], [0.06, 0.42, 0.13], { color: '#a01e1e', noInk: true, parent: 'robe' });
    for (const [x, y] of [[-0.12, 0.3], [0.1, 0.5], [-0.05, 0.15], [0.14, 0.2], [0.4, 1.0], [-0.38, 1.1], [-0.12, 1.05]] as const) {
      const zz = x > 0.3 || x < -0.3 ? 0.11 : 0.13;
      around(5, 0.022).forEach(([dx, dy]) => b.ball([0.025, 0.025, 0.01], [x + dx, y + dy, zz], { color: '#f8bbd0', noInk: true, parent: 'robe' }));
    }
    b.box([0.48, 0.18, 0.28], [0, 0.8, 0], { color: '#d4af37', round: 0.2, parent: 'robe' });
    b.ball([0.3, 0.16, 0.1], [0, 0.82, -0.17], { color: '#d4af37', parent: 'robe' });
    b.box([0.47, 0.06, 0.27], [0, 0.03, 0], { color: '#8a1a1a', round: 0.3, parent: 'robe' });
    return b.act({ click: [A.pose('robe', { rot: [0, 360, 0], dur: 1.2 }), A.pose('robe', { rot: [0, 0, 0], dur: 0 }), A.effect('sparkle', { dur: 1 })] }).done();
  }),
  // A bundle of kindling: split sticks leaning in a little teepee over a log with a twist of twine; it catches.
  e('kindling', 'nature', 'fire', () => {
    const b = m('kindling').cyl([0.09, 0.32, 0.09], [0, 0.045, -0.13], { color: 'bark', rot: [0, 0, 90] });
    around(7, 0.12).forEach(([x, zz], i) => b.stick([x, 0, zz], [x * 0.1, 0.28, zz * 0.1], 0.02, i % 2 ? 'wood' : 'lightwood', { edge: 'sharp' }));
    b.stick([0.1, 0.01, 0.15], [0.25, 0.01, 0.1], 0.015, 'wood').stick([-0.2, 0.01, 0.12], [-0.08, 0.01, 0.2], 0.015, 'lightwood');
    b.torus([0.03, 0.03, 0.01], [0.15, 0.012, 0.18], { color: 'tan', rot: [90, 0, 0] });
    b.ball([0.06, 0.04, 0.06], [0, 0.03, 0], { color: '#e8d8b0' });
    return b.act({ click: [A.par(A.effect('fire', { dur: 3 }), A.say('Crackle crackle!', 2)), A.effect('smoke', { dur: 1.5 })] }).done();
  }),
  // A newsstand kiosk, 2.8 m: a green booth with a roll-up shutter over the counter, a striped awning, racks of
  // papers and magazines and a sign on the roof; the shutter rolls up for business.
  e('kiosk', 'places', 'stands', () => {
    const b = m('kiosk', { edge: 'sharp' }).box([2.2, 2.4, 1.8], [0, 1.2, 0], { color: '#2e7d32', round: 0.05 });
    b.box([2.5, 0.2, 2.1], [0, 2.5, 0], { color: '#1b5e20' });
    b.box([1.5, 0.9, 0.05], [0, 1.45, 0.89], { color: '#3a3633' });
    b.box([1.6, 0.08, 0.4], [0, 0.98, 1.05], { color: 'lightwood' });
    b.box([1.55, 0.95, 0.04], [0, 1.45, 0.93], { color: '#9aa0a6', name: 'shutter', mover: { kind: 'slide', axis: 'y', amount: 0.85, on: false } });
    b.each(6, (i) => b.box([1.55, 0.02, 0.045], [0, 1.05 + i * 0.16, 0.935], { color: '#7a8086', noInk: true, parent: 'shutter' }));
    b.each(5, (i) => b.box([0.5, 0.06, 0.6], [-1.0 + i * 0.5, 2.1, 1.15], { color: i % 2 ? 'white' : '#d32f2f', rot: [25, 0, 0] }));
    b.label('NEWS', [1.4, 0.4], [0, 2.85, 0.0], { color: '#f6d24a', depth: 0.1 });
    b.pair((s) => b.stick([s * 0.5, 2.6, 0], [s * 0.5, 2.68, 0], 0.04, '#3a3633'));
    b.each(3, (i) => b.box([0.3, 0.4, 0.02], [-0.6 + i * 0.6, 0.55, 0.91], { color: ['#f6efdc', '#81d4fa', '#f48fb1'][i], rot: [-8, 0, 0] }));
    b.each(4, (i) => b.box([0.22, 0.3, 0.02], [1.11, 0.6 + (i % 2) * 0.4, -0.5 + Math.floor(i / 2) * 0.5], { color: ['#f6d24a', '#ef5350', '#9ccc65', '#ce93d8'][i], rot: [0, 90, 0] }));
    return b
      .act({
        click: [
          [A.operate('shutter', 'open'), A.say('Rattle rattle... Ding!', 1.8)],
          [A.operate('shutter', 'close'), A.say('Clunk.', 1)],
        ],
      })
      .done();
  }),
  // A kitchen at real size, open at the front: tiled floor, back and side walls with a window, base cabinets under a
  // worktop, a sink with its tap, a four-ring hob over an oven whose door drops open, wall cupboards and a fridge.
  e('kitchen', 'places', 'rooms', () => {
    const b = m('kitchen', { edge: 'sharp' });
    b.box([4.2, 0.08, 3.0], [0, 0.04, 0], { color: '#d9c9a8' });
    b.each(6, (i) => b.box([4.2, 0.005, 0.02], [0, 0.083, -1.25 + i * 0.5], { color: '#bfae8a', noInk: true }));
    b.box([4.2, 2.6, 0.12], [0, 1.3, -1.5], { color: '#f2ead8' });
    b.box([0.12, 2.6, 3.0], [-2.1, 1.3, 0], { color: '#e8dcc4' });
    b.box([1.0, 0.9, 0.06], [0.8, 1.75, -1.43], { color: 'white' });
    b.box([0.85, 0.75, 0.05], [0.8, 1.75, -1.41], { color: '#9fc6d8' });
    b.box([0.95, 0.04, 0.03], [0.8, 1.75, -1.39], { color: 'white' });
    b.box([3.0, 0.86, 0.62], [-0.55, 0.45, -1.15], { color: '#f6efdc', round: 0.03 });
    b.each(5, (i) => b.box([0.56, 0.7, 0.02], [-1.8 + i * 0.6, 0.47, -0.835], { color: '#e8dcc4', round: 0.1 }));
    b.each(5, (i) => b.box([0.12, 0.03, 0.03], [-1.8 + i * 0.6, 0.72, -0.82], { color: 'silver' }));
    b.box([3.05, 0.05, 0.66], [-0.55, 0.905, -1.13], { color: '#5a5e62' });
    b.box([0.55, 0.04, 0.4], [0.8, 0.92, -1.15], { color: 'steel' });
    b.rod([0.8, 0.93, -1.38], [0.8, 1.2, -1.33], 0.03, 'silver').rod([0.8, 1.2, -1.33], [0.8, 1.18, -1.18], 0.03, 'silver');
    b.box([0.62, 0.02, 0.52], [-0.6, 0.94, -1.13], { color: '#1e1e1e' });
    for (const [x, zz] of [[-0.75, -1.0], [-0.45, -1.0], [-0.75, -1.26], [-0.45, -1.26]] as const) b.torus([0.18, 0.18, 0.02], [x, 0.955, zz], { color: '#5a5e62', rot: [90, 0, 0] });
    b.box([0.6, 0.55, 0.04], [-0.6, 0.42, -0.83], { color: '#3a3d42', name: 'oven', pivot: [-0.6, 0.15, -0.83], mover: { kind: 'swing', axis: 'x', amount: 85 } });
    b.box([0.4, 0.25, 0.02], [-0.6, 0.45, -0.81], { color: '#1e1e1e', parent: 'oven' });
    b.box([0.45, 0.03, 0.04], [-0.6, 0.66, -0.8], { color: 'silver', parent: 'oven' });
    b.box([2.0, 0.7, 0.35], [-1.0, 1.95, -1.27], { color: '#e8dcc4', round: 0.03 });
    b.each(3, (i) => b.box([0.62, 0.64, 0.02], [-1.65 + i * 0.66, 1.95, -1.09], { color: '#f6efdc', round: 0.1 }));
    b.box([0.85, 1.85, 0.7], [1.65, 0.95, -1.1], { color: 'white', round: 0.08 });
    b.box([0.85, 1.25, 0.04], [1.65, 0.68, -0.73], { color: '#f4f4f0', name: 'fridge', pivot: [2.07, 0.68, -0.73], mover: { kind: 'swing', axis: 'y', amount: 100 } });
    b.box([0.03, 0.4, 0.04], [1.3, 0.9, -0.7], { color: 'silver', parent: 'fridge' });
    b.box([0.85, 0.55, 0.04], [1.65, 1.6, -0.73], { color: '#f4f4f0' });
    return b
      .act({
        click: [
          [A.operate('oven', 'open'), A.effect('steam', { dur: 1.5 }), A.say('Ding!', 1.2), A.wait(1), A.operate('oven', 'close')],
          [A.effect('water_spray', { dur: 1.5 }), A.say('Splish!', 1)],
          [A.operate('fridge', 'open'), A.say('Brrr!', 1.2), A.wait(1.8), A.operate('fridge', 'close')],
        ],
      })
      .done();
  }),
  // A diamond kite flying on its string from a reel on the grass: red and yellow sail on a cross spar, a bow tail;
  // it swoops in the wind.
  e('kite (toy)', 'sky', 'kites', () => {
    const b = m('kite (toy)', { edge: 'sharp' });
    b.cyl([0.12, 0.1, 0.12], [0.45, 0.05, 0.35], { color: 'wood', rot: [0, 0, 90] });
    b.stick([0, 0.95, 0.02], [0.45, 0.1, 0.35], 0.004, 'white', { noInk: true });
    b.wedge([0.6, 0.3, 0.02], [0, 1.1, 0], { color: '#e53935', name: 'kite', pivot: [0, 0.95, 0] });
    b.wedge([0.6, 0.6, 0.02], [0, 0.65, 0], { color: '#f6d24a', rot: [0, 0, 180], parent: 'kite' });
    b.stick([0, 0.35, 0.015], [0, 1.25, 0.015], 0.012, 'darkwood', { parent: 'kite' }).stick([-0.3, 0.95, 0.015], [0.3, 0.95, 0.015], 0.012, 'darkwood', { parent: 'kite' });
    path(b, [[0, 0.35, 0], [0.05, 0.27, 0], [-0.03, 0.19, 0], [0.04, 0.11, 0]], 0.008, '#5a5e62', { parent: 'kite' });
    for (const [x, y, c] of [[0.05, 0.27, '#1f5fb8'], [-0.03, 0.19, '#43a047'], [0.04, 0.11, '#e53935']] as const) b.pair((s) => b.wedge([0.04, 0.04, 0.01], [x + s * 0.02, y, 0], { color: c, rot: [0, 0, s * 90], parent: 'kite' }));
    return b
      .act({ click: [A.pose('kite', { rot: [0, 0, 25], move: [0.2, 0.2, 0], dur: 0.6 }), A.pose('kite', { rot: [0, 0, -20], move: [-0.2, 0.35, 0], dur: 0.8 }), A.pose('kite', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.6 }), A.say('Whoosh!', 1)] })
      .done();
  }),
  // A blue litter box filled with litter and a few clumps, a purple scoop resting on the rim; a kitten comes to dig.
  e('kitty litter', 'pets', 'cat things', () => {
    const b = m('kitty litter', { edge: 'sharp' }).box([0.45, 0.12, 0.35], [0, 0.06, 0], { color: '#6fa0c8', round: 0.2 });
    b.box([0.47, 0.03, 0.37], [0, 0.125, 0], { color: '#5a8ab0', round: 0.3 });
    b.box([0.41, 0.02, 0.31], [0, 0.115, 0], { color: '#d9ccb0', edge: 'soft' });
    for (const [x, zz] of [[-0.1, 0.05], [0.08, -0.06], [0.12, 0.08], [-0.05, -0.08], [0.0, 0.02]] as const) b.ball([0.04, 0.02, 0.035], [x, 0.125, zz], { color: '#c9bb9a', edge: 'soft' });
    b.stick([0.17, 0.13, -0.12], [0.24, 0.3, -0.16], 0.02, '#7b3fa0');
    b.box([0.09, 0.012, 0.1], [0.15, 0.135, -0.1], { color: '#7b3fa0', rot: [0, 0, 60], round: 0.2 });
    return b.act({ click: [A.spawn('k', 'kitten', { rel: 'near', of: 'self', dist: 'close' }), A.par(A.effect('dust', { dur: 1.5 }), A.say('Scratch scratch', 1.5, 'k')), A.wait(0.5), A.remove('k', 'fade')] }).done();
  }),
  // A fuzzy brown kiwi fruit and a half showing its green flesh, ring of black seeds and pale core; they hop.
  e('kiwi (fruit)', 'food', 'fruit', () => {
    const b = m('kiwi (fruit)').ball([0.072, 0.055, 0.055], [-0.04, 0.0275, -0.01], { color: '#8a6a3a' }).ball([0.056, 0.056, 0.036], [0.035, 0.028, 0], { color: '#8a6a3a' });
    b.cyl([0.052, 0.006, 0.052], [0.035, 0.028, 0.017], { color: '#8cc43a', rot: [90, 0, 0] }).cyl([0.018, 0.007, 0.018], [0.035, 0.028, 0.018], { color: '#f6f0dc', rot: [90, 0, 0], noInk: true });
    around(10, 0.014).forEach(([x, y]) => b.ball(0.004, [0.035 + x, 0.028 + y, 0.021], { color: '#1e1e1e', noInk: true }));
    return b.act({ click: [A.anim('hop', 2)] }).done();
  }),
  // A knee joint model: the femur above, the kneecap in front, the tibia below on its stand; the leg bends at the
  // knee and straightens.
  e('kneecap', 'clinic', 'bones', () => {
    const c = '#efe3c8';
    const b = m('kneecap');
    b.box([0.12, 0.012, 0.1], [0, 0.006, 0], { color: 'darkwood', edge: 'sharp' });
    b.stick([0, 0.012, -0.04], [0, 0.37, -0.04], 0.008, 'brass');
    b.stick([0, 0.37, -0.02], [0, 0.25, -0.02], 0.045, c);
    b.ball([0.08, 0.05, 0.065], [0, 0.245, -0.02], { color: c });
    b.ball([0.05, 0.06, 0.03], [0, 0.235, 0.025], { color: '#f2cf80' });
    b.box([0.08, 0.03, 0.065], [0, 0.205, -0.02], { color: c, round: 0.5, name: 'shin', pivot: [0, 0.225, -0.02] });
    b.stick([0, 0.19, -0.02], [0, 0.04, -0.02], 0.045, c, { parent: 'shin' });
    b.stick([0.03, 0.19, -0.03], [0.03, 0.05, -0.03], 0.018, c, { parent: 'shin' });
    return b.act({ click: [A.pose('shin', { rot: [-60, 0, 0], dur: 0.5 }), A.say('Creak!', 1), A.pose('shin', { rot: [0, 0, 0], dur: 0.5 })] }).done();
  }),
  // A pair of skate kneepads: hard grey caps on padded black sleeves with straps and buckles; they bounce.
  e('kneepads', 'sports', 'protective gear', () => {
    const b = m('kneepads');
    b.pair((s) => {
      const x = s * 0.09;
      b.ball([0.12, 0.17, 0.07], [x, 0.09, 0], { color: '#1e1e1e', rot: [-10, 0, 0] });
      b.ball([0.085, 0.11, 0.04], [x, 0.1, 0.03], { color: '#8a8e92', rot: [-10, 0, 0], edge: 'sharp' });
      for (const y of [0.04, 0.15]) b.stick([x - 0.065, y, -0.02], [x + 0.065, y, -0.02], 0.025, '#3a3d42');
      b.box([0.03, 0.025, 0.02], [x + 0.065, 0.15, -0.01], { color: 'silver', edge: 'sharp' });
    });
    return b.act({ click: [A.anim('bounce', 2), A.say('Thud!', 1)] }).done();
  }),
  // A chef's knife on a wooden cutting board beside a tomato: riveted black handle, bolster and a broad blade; it
  // chops.
  e('knife', 'kitchen', 'knives', () => {
    const b = m('knife', { edge: 'sharp' });
    b.box([0.4, 0.02, 0.26], [0, 0.01, 0], { color: '#c8a06a', round: 0.2 });
    b.ball(0.07, [-0.12, 0.055, -0.04], { color: '#e53935', edge: 'soft' });
    b.cyl([0.012, 0.012, 0.012], [-0.12, 0.092, -0.04], { color: '#43a047' });
    b.box([0.11, 0.022, 0.026], [0.13, 0.035, 0.05], { color: '#1e1e1e', round: 0.4, name: 'knife', pivot: [0.18, 0.035, 0.05] });
    b.ball(0.006, [0.11, 0.047, 0.05], { color: 'silver', parent: 'knife' }).ball(0.006, [0.15, 0.047, 0.05], { color: 'silver', parent: 'knife' });
    b.box([0.015, 0.032, 0.03], [0.07, 0.036, 0.05], { color: 'steel', parent: 'knife' });
    b.box([0.17, 0.045, 0.004], [-0.025, 0.04, 0.05], { color: '#e0e4e8', round: 0, parent: 'knife' });
    b.wedge([0.045, 0.05, 0.004], [-0.13, 0.04, 0.05], { color: '#e0e4e8', apex: -0.45, rot: [0, 0, 90], parent: 'knife' });
    return b
      .act({ click: [A.pose('knife', { rot: [0, 0, -20], dur: 0.15 }), A.pose('knife', { rot: [0, 0, 0], dur: 0.1 }), A.pose('knife', { rot: [0, 0, -20], dur: 0.15 }), A.pose('knife', { rot: [0, 0, 0], dur: 0.1 }), A.say('Chop chop!', 1)] })
      .done();
  }),
  // A two-sided whetstone in its rubber holder with a knife being honed across it; the knife strokes and the edge
  // glints.
  e('knife sharpener', 'kitchen', 'knives', () =>
    m('knife sharpener', { edge: 'sharp' })
      .box([0.22, 0.03, 0.08], [0, 0.015, 0], { color: '#2b2b2b', round: 0.3 })
      .box([0.2, 0.025, 0.07], [0, 0.042, 0], { color: '#7a8a9a', round: 0.05 })
      .box([0.2, 0.025, 0.07], [0, 0.067, 0], { color: '#d9773a', round: 0.05 })
      .box([0.17, 0.004, 0.045], [0.03, 0.083, 0.01], { color: 'silver', rot: [0, 25, 0], name: 'blade' })
      .box([0.1, 0.022, 0.026], [-0.1, 0.09, 0.07], { color: '#1e1e1e', rot: [0, 25, 0], round: 0.4, parent: 'blade' })
      .act({ click: [A.pose('blade', { move: [0.05, 0, 0], dur: 0.25 }), A.pose('blade', { move: [-0.03, 0, 0], dur: 0.25 }), A.pose('blade', { move: [0.05, 0, 0], dur: 0.25 }), A.pose('blade', { move: [0, 0, 0], dur: 0.2 }), A.par(A.effect('sparkle', { dur: 1 }), A.say('Shhk shhk', 1))] })
      .done(),
  ),
  // A knight's armet: rounded steel skull with a ridge, a pointed visor with eye slits and breaths that lifts on its
  // pivots, a gorget and a red plume.
  e('knight helmet', 'armory', 'armour', () => {
    const b = m('knight helmet', { edge: 'sharp' });
    b.cyl([0.24, 0.2, 0.26], [0, 0.12, 0], { color: '#9aa0a6' });
    b.dome([0.24, 0.15, 0.27], [0, 0.295, -0.005], { color: '#9aa0a6' });
    b.box([0.02, 0.05, 0.26], [0, 0.35, -0.005], { color: '#b8bcc0', round: 0.5 });
    b.cyl([0.26, 0.04, 0.28], [0, 0.02, 0], { color: '#7a8086' });
    b.box([0.22, 0.16, 0.08], [0, 0.22, 0.12], { color: '#b8bcc0', round: 0.5, name: 'visor', pivot: [0, 0.22, 0], mover: { kind: 'swing', axis: 'x', amount: -70 } });
    b.wedge([0.2, 0.08, 0.06], [0, 0.22, 0.17], { color: '#b8bcc0', rot: [-90, 0, 0], parent: 'visor' });
    b.pair((s) => b.box([0.07, 0.012, 0.012], [s * 0.05, 0.25, 0.165], { color: '#1e1e1e', parent: 'visor' }));
    for (const [x, y] of [[0.05, 0.18], [0.07, 0.17], [0.05, 0.16], [0.07, 0.19]] as const) b.ball(0.008, [x, y, 0.16], { color: '#1e1e1e', noInk: true, parent: 'visor' });
    b.pair((s) => b.cyl([0.03, 0.02, 0.03], [s * 0.12, 0.22, 0], { color: 'brass', rot: [0, 0, 90] }));
    b.ball([0.08, 0.16, 0.12], [0, 0.42, -0.04], { color: '#c62828', rot: [-25, 0, 0], edge: 'soft' });
    return b.act({ click: [[A.operate('visor', 'open'), A.say('Clank!', 1)], [A.operate('visor', 'close'), A.say('Clank!', 1)]] }).done();
  }),
  // A ball of pink yarn with two knitting needles through it and a little knitted swatch; the needles click away.
  e('knitting needle', 'home', 'crafts', () => {
    const b = m('knitting needle').ball(0.12, [0, 0.06, 0], { color: '#f48fb1' });
    for (const r of [0, 50, 100, 150]) b.torus([0.122, 0.122, 0.008], [0, 0.06, 0], { color: '#e88aa8', rot: [r, 30, 0], noInk: true, tube: 0.06 });
    b.stick([-0.03, 0.07, 0.03], [0.1, 0.3, 0.04], 0.007, 'silver', { name: 'needleL', pivot: [-0.03, 0.07, 0.03] });
    b.ball(0.018, [0.1, 0.305, 0.04], { color: '#e53935', parent: 'needleL' });
    b.stick([0.03, 0.07, 0.03], [-0.1, 0.29, 0.02], 0.007, 'silver', { name: 'needleR', pivot: [0.03, 0.07, 0.03] });
    b.ball(0.018, [-0.1, 0.295, 0.02], { color: '#1f5fb8', parent: 'needleR' });
    b.box([0.08, 0.004, 0.07], [0.12, 0.002, 0.08], { color: '#f48fb1', round: 0.3, rot: [0, 20, 0] });
    path(b, [[0.05, 0.03, 0.04], [0.1, 0.01, 0.07], [0.12, 0.004, 0.08]], 0.008, '#f48fb1');
    return b.act({ click: [A.pose('needleL', { rot: [0, 0, 12], dur: 0.15 }), A.pose('needleR', { rot: [0, 0, -12], dur: 0.15 }), A.pose('needleL', { rot: [0, 0, 0], dur: 0.15 }), A.pose('needleR', { rot: [0, 0, 0], dur: 0.15 }), A.say('Click clack', 1)] }).done();
  }),
  // A brass lion-head door knocker on a panel of door: the ring lifts and knocks.
  e('knocker', 'home', 'door hardware', () =>
    m('knocker')
      .box([0.3, 0.4, 0.04], [0, 0.2, -0.02], { color: '#3a2a1e', edge: 'sharp' })
      .ball([0.11, 0.11, 0.04], [0, 0.27, 0.02], { color: 'brass' })
      .ball(0.035, [-0.045, 0.31, 0.015], { color: 'brass' })
      .ball(0.035, [0.045, 0.31, 0.015], { color: 'brass' })
      .ball(0.012, [-0.02, 0.285, 0.04], { color: '#1e1e1e', noInk: true })
      .ball(0.012, [0.02, 0.285, 0.04], { color: '#1e1e1e', noInk: true })
      .ball([0.03, 0.02, 0.02], [0, 0.255, 0.04], { color: '#b8962e' })
      .torus([0.12, 0.12, 0.016], [0, 0.18, 0.045], { color: 'brass', rot: [15, 0, 0], name: 'ring', pivot: [0, 0.24, 0.04] })
      .ball([0.04, 0.03, 0.02], [0, 0.11, 0.01], { color: 'brass' })
      .act({ click: [A.pose('ring', { rot: [-50, 0, 0], dur: 0.2 }), A.pose('ring', { rot: [0, 0, 0], dur: 0.08 }), A.pose('ring', { rot: [-50, 0, 0], dur: 0.2 }), A.pose('ring', { rot: [0, 0, 0], dur: 0.08 }), A.say('Knock knock!', 1.2)] })
      .done(),
  ),
  // A clenched fist standing on its wrist, the knuckles in a row; it knocks.
  e('knuckle', 'clinic', 'body parts', () => {
    const sk = 'skin3';
    const b = m('knuckle').cyl([0.055, 0.03, 0.045], [0, 0.015, 0], { color: sk }).box([0.09, 0.07, 0.06], [0, 0.06, 0], { color: sk, round: 0.5, name: 'fist', pivot: [0, 0.03, 0] });
    b.each(4, (i) => b.ball(0.025, [-0.033 + i * 0.022, 0.095, 0.022], { color: sk, parent: 'fist' }));
    b.box([0.088, 0.04, 0.026], [0, 0.068, 0.035], { color: sk, round: 0.6, parent: 'fist' });
    b.rod([-0.05, 0.055, 0.02], [0.0, 0.045, 0.05], 0.022, sk, { parent: 'fist' });
    return b.act({ click: [A.pose('fist', { rot: [25, 0, 0], dur: 0.15 }), A.pose('fist', { rot: [0, 0, 0], dur: 0.1 }), A.pose('fist', { rot: [25, 0, 0], dur: 0.15 }), A.pose('fist', { rot: [0, 0, 0], dur: 0.1 }), A.say('Knock knock!', 1.2)] }).done();
  }),
  // A long white lab coat as if worn: lapels, buttons, pockets with a pen and a name badge; eureka!
  e('lab coat', 'wardrobe', 'coats', () => {
    const b = shirt('lab coat', { color: 'white', len: 1.1, long: true, buttons: '#c8c8c8' });
    b.pair((s) => b.box([0.12, 0.1, 0.01], [s * 0.13, 0.35, 0.112], { color: '#ececec' }));
    b.box([0.09, 0.07, 0.01], [0.13, 0.85, 0.112], { color: '#ececec' }).stick([0.15, 0.86, 0.118], [0.15, 0.93, 0.118], 0.012, '#1f5fb8');
    b.box([0.07, 0.03, 0.006], [-0.13, 0.9, 0.114], { color: '#1f5fb8' });
    return b.act({ click: [A.anim('bounce'), A.effect('sparkle', { dur: 1.2 })] }).done();
  }),
  // A yellow handheld label maker: keypad, little green screen and a label strip that prints out of the top.
  e('label maker', 'study', 'office supplies', () => {
    const b = m('label maker', { edge: 'sharp' }).box([0.08, 0.17, 0.04], [0, 0.085, 0], { color: '#f6d24a', round: 0.3 }).box([0.06, 0.03, 0.004], [0, 0.14, 0.02], { color: '#9bbc0f', glow: true });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b.box([0.012, 0.01, 0.005], [-0.021 + c * 0.014, 0.04 + r * 0.018, 0.021], { color: '#1e1e1e' });
    b.box([0.025, 0.04, 0.003], [0, 0.17, 0], { color: 'white', name: 'label', mover: { kind: 'slide', axis: 'y', amount: 0.05 } });
    b.box([0.015, 0.025, 0.004], [0, 0.175, 0], { color: '#1e1e1e', noInk: true, parent: 'label' });
    return b.act({ click: [[A.operate('label', 'out'), A.say('Whirr... click!', 1.2)], [A.operate('label', 'in')]] }).done();
  }),
  // A science lab at real size, open at the front: a lab bench with a black worktop, bubbling flasks that glow, a
  // test-tube rack, a microscope, a sink, shelves of bottles and a fume hood; it bubbles, then goes bang.
  e('laboratory', 'places', 'rooms', () => {
    const b = m('laboratory', { edge: 'sharp' });
    b.box([4.0, 0.08, 3.0], [0, 0.04, 0], { color: '#d8d8d4' });
    b.box([4.0, 2.6, 0.12], [0, 1.3, -1.5], { color: '#f4f4f0' });
    b.box([0.12, 2.6, 3.0], [-2.0, 1.3, 0], { color: '#e8ecf0' });
    b.box([2.6, 0.86, 0.75], [-0.3, 0.45, -0.95], { color: '#9aa0a6', round: 0.03 });
    b.box([2.7, 0.05, 0.8], [-0.3, 0.905, -0.95], { color: '#1e1e1e' });
    b.each(4, (i) => b.box([0.58, 0.7, 0.02], [-1.3 + i * 0.66, 0.47, -0.565], { color: '#b8bcc0', round: 0.1 }));
    b.cone([0.22, 0.25, 0.22], [-1.2, 1.06, -0.85], { color: '#9ccc65', glow: true, name: 'flask1' });
    b.cyl([0.06, 0.1, 0.06], [-1.2, 1.23, -0.85], { color: '#e8f6fb' });
    b.ball(0.22, [-0.75, 1.04, -0.95], { color: '#e040fb', glow: true, name: 'flask2' });
    b.cyl([0.05, 0.14, 0.05], [-0.75, 1.21, -0.95], { color: '#e8f6fb' });
    b.box([0.4, 0.06, 0.12], [-0.25, 0.95, -0.85], { color: 'wood' });
    b.each(4, (i) => b.cyl([0.035, 0.16, 0.035], [-0.38 + i * 0.09, 1.02, -0.85], { color: ['#ef5350', '#42a5f5', '#ffee58', '#26c6da'][i], glow: true }));
    b.box([0.2, 0.04, 0.2], [0.35, 0.95, -0.95], { color: '#1e1e1e' });
    b.rod([0.35, 0.95, -1.03], [0.35, 1.25, -1.0], 0.05, '#1e1e1e');
    b.stick([0.35, 1.28, -0.95], [0.35, 1.1, -0.9], 0.06, 'silver');
    b.box([0.5, 0.05, 0.4], [0.75, 0.94, -0.95], { color: 'steel' });
    b.rod([0.75, 0.95, -1.2], [0.75, 1.25, -1.15], 0.03, 'silver').rod([0.75, 1.25, -1.15], [0.75, 1.22, -1.0], 0.03, 'silver');
    b.box([1.0, 2.2, 0.8], [1.45, 1.1, -1.05], { color: '#e8ecf0', round: 0.03 });
    b.box([0.9, 0.9, 0.05], [1.45, 1.45, -0.64], { color: '#bfe4f6' });
    b.box([1.8, 0.05, 0.3], [-0.9, 1.85, -1.3], { color: 'wood' });
    b.each(6, (i) => b.cyl([0.1, 0.2, 0.1], [-1.6 + i * 0.25, 1.98, -1.3], { color: ['#26a69a', '#fb8c00', '#7b3fa0', '#43a047', '#e53935', '#8a5a32'][i] }));
    b.label('LAB 1', [0.6, 0.25], [-1.0, 2.35, -1.43], { color: 'white', depth: 0.02 });
    b.pair((s) => b.cyl([0.35, 0.65, 0.35], [-0.6 + s * 0.6, 0.33, -0.2], { color: '#3a3d42', taper: 0.6 }));
    return b
      .act({
        click: [
          [A.par(A.effect('steam', { dur: 2.5 }), A.say('Bubble bubble...', 2))],
          [A.par(A.effect('explosion', { dur: 0.8 }), A.anim('shake'), A.say('BANG!', 1.5)), A.effect('smoke', { dur: 2 })],
        ],
      })
      .done();
  }),
  // A wooden tilt maze: walls on a board inside a frame, a steel ball, holes to avoid; the board tilts and the
  // ball rolls.
  e('labyrinth', 'toys', 'puzzles', () => {
    const b = m('labyrinth', { edge: 'sharp' });
    b.box([0.36, 0.05, 0.36], [0, 0.025, 0], { color: '#a8743a', round: 0.1 });
    b.pair((s) => b.cyl([0.04, 0.03, 0.04], [s * 0.2, 0.04, 0], { color: '#5a3a22', rot: [0, 0, 90] }));
    b.box([0.3, 0.02, 0.3], [0, 0.06, 0], { color: '#e8d8b0', name: 'board', pivot: [0, 0.06, 0] });
    const h = 0.03, y = 0.085, c = '#5a3a22';
    const walls: Array<[number, number, number, number]> = [[0, -0.144, 0.3, 0.012], [-0.09, 0.144, 0.12, 0.012], [0.09, 0.144, 0.12, 0.012], [-0.144, 0, 0.012, 0.3], [0.144, 0, 0.012, 0.3], [-0.03, -0.07, 0.18, 0.012], [0.05, 0.0, 0.18, 0.012], [-0.07, 0.07, 0.14, 0.012], [-0.07, -0.02, 0.012, 0.1], [0.08, 0.08, 0.012, 0.13], [0.1, -0.09, 0.012, 0.1]];
    walls.forEach(([x, zz, w, d]) => b.box([w, h, d], [x, y, zz], { color: c, round: 0.1, parent: 'board' }));
    for (const [x, zz] of [[0.0, 0.11], [-0.11, -0.04], [0.11, 0.03]] as const) b.cyl([0.022, 0.002, 0.022], [x, 0.071, zz], { color: '#1e1e1e', parent: 'board', noInk: true });
    b.ball(0.022, [-0.11, 0.082, 0.11], { color: 'silver', name: 'ball', parent: 'board', edge: 'soft' });
    return b
      .act({ click: [A.pose('board', { rot: [0, 0, -8], dur: 0.4 }), A.pose('ball', { move: [0.08, 0, 0], dur: 0.5 }), A.pose('board', { rot: [8, 0, 0], dur: 0.4 }), A.pose('ball', { move: [0.08, 0, -0.06], dur: 0.4 }), A.pose('board', { rot: [0, 0, 0], dur: 0.3 }), A.pose('ball', { move: [0, 0, 0], dur: 0.6 }), A.say('Rattle!', 1)] })
      .done();
  }),
  // A round lace doily stretched in an embroidery hoop on a little stand: scalloped edge, rings of openwork; the
  // hoop turns.
  e('lace', 'home', 'crafts', () => {
    const b = m('lace').box([0.14, 0.03, 0.09], [0, 0.015, 0], { color: 'wood', edge: 'sharp' }).stick([0, 0.03, -0.02], [0, 0.07, -0.02], 0.015, 'wood');
    b.torus([0.22, 0.22, 0.014], [0, 0.18, 0], { color: '#c8a06a', name: 'hoop', pivot: [0, 0.18, 0] });
    b.cyl([0.2, 0.006, 0.2], [0, 0.18, 0], { color: 'white', rot: [90, 0, 0], parent: 'hoop' });
    for (const d of [0.05, 0.1, 0.15]) b.torus([d, d, 0.008], [0, 0.18, 0.004], { color: '#e8dcc8', noInk: true, tube: 0.1, parent: 'hoop' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2;
      b.ball(0.012, [Math.cos(a) * 0.063, 0.18 + Math.sin(a) * 0.063, 0.005], { color: '#cfc4b4', noInk: true, parent: 'hoop' });
    });
    return b.act({ click: [A.pose('hoop', { rot: [0, 360, 0], dur: 1.2 }), A.pose('hoop', { rot: [0, 0, 0], dur: 0 }), A.effect('sparkle', { dur: 0.8 })] }).done();
  }),
  // An aluminium step ladder, 2 m: two frames hinged at the top platform, orange treads, a spreader bar and a paint
  // bucket on the tray; the back frame folds in and out.
  e('ladder', 'workshop', 'ladders', () => {
    const b = m('ladder', { edge: 'sharp' });
    b.pair((s) => b.stick([s * 0.24, 0, 0.4], [s * 0.18, 1.9, 0.04], 0.05, 'silver'));
    for (const y of [0.4, 0.8, 1.2, 1.6]) b.box([0.42, 0.03, 0.12], [0, y, 0.4 - (0.36 * y) / 1.9], { color: '#f57c00', rot: [-10, 0, 0] });
    b.box([0.44, 0.06, 0.25], [0, 1.92, 0.02], { color: '#f57c00', round: 0.3 });
    b.box([0.4, 0.05, 0.25], [0, 1.88, -0.25], { color: '#e8e8e8', name: 'back', pivot: [0, 1.9, -0.02], mover: { kind: 'swing', axis: 'x', amount: -11, on: false } });
    b.pair((s) => b.stick([s * 0.24, 0, -0.4], [s * 0.18, 1.9, -0.04], 0.045, 'silver', { parent: 'back' }));
    b.each(3, (i) => b.stick([-0.2, 0.5 + i * 0.45, -0.4 + (0.36 * (0.5 + i * 0.45)) / 1.9], [0.2, 0.5 + i * 0.45, -0.4 + (0.36 * (0.5 + i * 0.45)) / 1.9], 0.02, 'silver', { parent: 'back' }));
    b.cyl([0.2, 0.2, 0.2], [0, 2.05, 0.02], { color: '#1f5fb8' });
    b.arc([0.18, 0.12, 0.01], [0, 2.15, 0.02], { color: 'silver', tube: 0.08 });
    b.capsule([0.03, 0.08, 0.02], [0.05, 2.0, 0.12], { color: '#81d4fa' });
    return b.act({ click: [A.operate('back', 'on'), A.say('Clack!', 1), A.wait(0.6), A.operate('back', 'off')] }).done();
  }),
  // A steel soup ladle standing on its bowl, full of tomato soup, with a hook on the handle; it tips and pours.
  e('ladle', 'kitchen', 'utensils', () => {
    const b = m('ladle', { edge: 'sharp' }).ball([0.09, 0.08, 0.09], [0, 0.04, 0], { color: 'steel', name: 'ladle', pivot: [0, 0, 0], edge: 'soft' });
    b.torus([0.09, 0.09, 0.008], [0, 0.065, 0], { color: 'steel', rot: [90, 0, 0], parent: 'ladle' });
    b.cyl([0.078, 0.008, 0.078], [0, 0.066, 0], { color: '#d84a3a', noInk: true, parent: 'ladle' });
    b.rod([-0.04, 0.065, 0], [-0.07, 0.3, 0], 0.014, 'steel', { parent: 'ladle' });
    b.arc([0.03, 0.04, 0.012], [-0.055, 0.3, 0], { color: 'steel', rot: [0, 0, 180], tube: 0.3, parent: 'ladle' });
    return b.act({ click: [A.pose('ladle', { rot: [0, 0, -45], dur: 0.4 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Slosh!', 1)), A.pose('ladle', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A dragon's lair: a craggy rock mound with a dark cave mouth, glowing eyes in the gloom, a heap of gold at the
  // entrance and scattered bones; it growls and breathes smoke.
  e('lair', 'fantasy', 'lairs', () => {
    const b = m('lair');
    b.dome([5.0, 3.4, 4.4], [0, 1.7, 0], { color: '#6a6560' });
    b.ball([2.2, 2.2, 2.0], [1.8, 0.9, 0.6], { color: '#7a7570' }).ball([1.8, 2.0, 1.8], [-1.9, 0.8, 0.7], { color: '#7a7570' });
    b.ball([1.4, 1.2, 1.2], [0.5, 2.9, -0.4], { color: '#5a5550' });
    b.dome([1.8, 2.2, 0.8], [0, 1.1, 1.85], { color: '#1a1614' });
    b.pair((s) => b.ball([0.18, 0.1, 0.06], [s * 0.24, 1.25, 2.2], { color: '#ffd54f', glow: true, name: s > 0 ? 'eyeL' : 'eyeR', mover: { kind: 'light' } }));
    b.dome([1.2, 0.35, 0.8], [1.0, 0.175, 2.4], { color: '#f6c400' });
    around(6, 0.35).forEach(([x, zz]) => b.cyl([0.12, 0.02, 0.12], [1.0 + x, 0.36, 2.4 + zz * 0.6], { color: 'gold', noInk: true }));
    b.ball(0.15, [1.2, 0.42, 2.5], { color: '#e53935' });
    b.rod([-0.9, 0.04, 2.3], [-0.4, 0.04, 2.6], 0.07, '#efe3c8').ball(0.1, [-0.92, 0.06, 2.28], { color: '#efe3c8' }).ball(0.1, [-0.38, 0.06, 2.62], { color: '#efe3c8' });
    b.ball([0.3, 0.26, 0.3], [-1.2, 0.13, 2.9], { color: '#efe3c8' });
    return b
      .act({
        click: [
          [A.operate('eye', 'on'), A.par(A.anim('shake'), A.say('GRRRRR!', 2), A.effect('smoke', { dur: 2.5 }))],
          [A.operate('eye', 'off'), A.say('...', 1)],
        ],
      })
      .done();
  }),
  // A table lamp: a ginger-jar ceramic base on a brass foot, the harp, a bulb that switches and a pleated cream
  // shade.
  e('lamp', 'home', 'lighting', () =>
    m('lamp')
      .cyl([0.16, 0.03, 0.16], [0, 0.015, 0], { color: 'brass', edge: 'sharp' })
      .ball([0.16, 0.2, 0.16], [0, 0.13, 0], { color: '#26a69a' })
      .cyl([0.06, 0.03, 0.06], [0, 0.235, 0], { color: 'brass' })
      .stick([0, 0.25, 0], [0, 0.38, 0], 0.016, 'brass')
      .arc([0.18, 0.2, 0.008], [0, 0.32, 0], { color: 'brass', tube: 0.06, arc: 140 })
      .ball(0.065, [0, 0.4, 0], { color: '#fff3b0', glow: true, name: 'bulb', mover: { kind: 'light', on: true } })
      .cyl([0.34, 0.22, 0.34], [0, 0.46, 0], { color: '#f6efdc', taper: 0.62 })
      .act({ click: [A.operate('bulb'), A.say('Click.', 0.8)] })
      .done(),
  ),
  // A tapered fabric lamp shade with gold trim and pink bobbles, a bulb glowing through it that switches.
  e('lamp shade', 'home', 'lighting', () => {
    const b = m('lamp shade').cyl([0.3, 0.22, 0.3], [0, 0.115, 0], { color: '#f2e6c8', taper: 0.6 });
    b.torus([0.31, 0.31, 0.015], [0, 0.008, 0], { color: 'gold', rot: [90, 0, 0] }).torus([0.19, 0.19, 0.012], [0, 0.225, 0], { color: 'gold', rot: [90, 0, 0] });
    around(10, 0.152).forEach(([x, zz]) => b.ball(0.022, [x, 0.0, zz], { color: '#f48fb1', noInk: true }));
    b.cyl([0.2, 0.2, 0.2], [0, 0.12, 0], { color: '#fff3b0', glow: true, name: 'glow', mover: { kind: 'light', on: true }, taper: 0.62, noInk: true });
    return b.act({ click: [A.operate('glow'), A.say('Click.', 0.8)] }).done();
  }),
  // A tilting lance, 3 m, standing in its rack: a red-and-white spiral painted shaft, the steel vamplate guard and
  // grip; it couches and charges.
  e('lance', 'armory', 'spears', () => {
    const b = m('lance', { edge: 'sharp' }).box([0.5, 0.2, 0.5], [0, 0.1, 0], { color: 'darkwood' });
    b.stick([0, 0.2, 0], [0, 0.6, 0], 0.06, 'leather', { name: 'lance', pivot: [0, 0.2, 0] });
    b.cone([0.42, 0.35, 0.42], [0, 0.66, 0], { color: 'silver', parent: 'lance' });
    b.cyl([0.18, 2.3, 0.18], [0, 1.98, 0], { color: '#efe4cc', taper: 0.3, parent: 'lance', edge: 'soft' });
    b.each(6, (i) => {
      const y = 1.0 + i * 0.36, d = 2 * (0.09 - ((y - 0.83) / 2.3) * 0.063) + 0.006;
      b.cyl([d, 0.14, d], [0, y, 0], { color: '#c62828', rot: [0, 0, 18], noInk: true, parent: 'lance' });
    });
    b.cone([0.04, 0.12, 0.04], [0, 3.18, 0], { color: 'steel', parent: 'lance' });
    return b.act({ click: [A.pose('lance', { rot: [70, 0, 0], dur: 0.6 }), A.say('Whoosh!', 1.2), A.pose('lance', { rot: [70, 0, 0], move: [0, 0, 0.6], dur: 0.3 }), A.pose('lance', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0.6 })] }).done();
  }),
  // A hurricane lantern: red tank and cap, a glass globe in its wire guard with the flame inside, and a bail handle;
  // the flame turns up and down and the handle swings.
  e('lantern', 'home', 'lighting', () => {
    const b = m('lantern').cyl([0.14, 0.05, 0.14], [0, 0.025, 0], { color: '#c62828', edge: 'sharp' }).ball([0.11, 0.15, 0.11], [0, 0.12, 0], { color: '#ffe6a0', glow: true, name: 'flame', mover: { kind: 'light', on: true } });
    for (const r of [0, 60, 120]) b.torus([0.125, 0.16, 0.006], [0, 0.12, 0], { color: '#3a3d42', rot: [0, r, 0] });
    b.cyl([0.12, 0.04, 0.12], [0, 0.21, 0], { color: '#c62828', taper: 0.6, edge: 'sharp' }).cyl([0.04, 0.03, 0.04], [0, 0.245, 0], { color: '#c62828' });
    b.cyl([0.03, 0.02, 0.03], [0.07, 0.04, 0.03], { color: 'brass', rot: [90, 0, 0] });
    b.arc([0.16, 0.18, 0.008], [0, 0.21, 0], { color: '#3a3d42', tube: 0.08, name: 'handle', pivot: [0, 0.21, 0] });
    return withSockets(
      b.act({ click: [[A.operate('flame', 'off'), A.say('Fff...', 1)], [A.operate('flame', 'on'), A.pose('handle', { rot: [30, 0, 0], dur: 0.3 }), A.pose('handle', { rot: [-20, 0, 0], dur: 0.4 }), A.pose('handle', { rot: [0, 0, 0], dur: 0.3 })]] }).done(),
      [{ name: 'handle', at: [0, 0.3, 0], kind: 'hook', part: 'handle' }],
    );
  }),
  // A silver laptop, open: a screen in its bezel on the hinge, a keyboard and trackpad; the lid closes, then opens
  // and the screen lights up. The lid is drawn shut and its hinge mover starts open, so it stands open in the town
  // (the checker measures the shut pose, 3 cm, hence the size warning).
  e('laptop', 'tech', 'computers', () => {
    const b = m('laptop', { edge: 'sharp' })
      .box([0.32, 0.018, 0.22], [0, 0.009, 0], { color: '#c8ccd0', round: 0.2 })
      .box([0.28, 0.004, 0.1], [0, 0.019, -0.03], { color: '#3a3d42' })
      .box([0.09, 0.003, 0.055], [0, 0.019, 0.065], { color: '#b0b4b8' });
    b.box([0.32, 0.01, 0.22], [0, 0.023, 0], { color: '#c8ccd0', round: 0.2, name: 'lid', pivot: [0, 0.02, -0.11], mover: { kind: 'swing', axis: 'x', amount: -105, on: true } });
    b.box([0.3, 0.003, 0.2], [0, 0.0175, 0], { color: '#1e2a3a', parent: 'lid' });
    b.box([0.27, 0.002, 0.16], [0, 0.0158, 0.005], { color: '#4e8fd6', glow: true, parent: 'lid', name: 'screen', mover: { kind: 'light', on: true } });
    b.cyl([0.02, 0.002, 0.02], [0, 0.0285, 0.02], { color: '#e8ecf0', parent: 'lid', noInk: true });
    return b.act({ click: [[A.operate('screen', 'off'), A.operate('lid', 'close'), A.say('Click.', 1)], [A.operate('lid', 'open'), A.operate('screen', 'on'), A.say('Bing!', 1)]] }).done();
  }),
  // A block of lard half unwrapped from its paper with a printed label, a slice cut off the end; it wobbles.
  e('lard', 'food', 'cooking', () =>
    m('lard')
      .box([0.12, 0.07, 0.08], [0, 0.035, 0], { color: '#f5f0e0', round: 0.15 })
      .box([0.07, 0.074, 0.084], [-0.028, 0.037, 0], { color: 'paper', round: 0.1, edge: 'sharp' })
      .label('LARD', [0.06, 0.035], [-0.028, 0.04, 0.042], { color: '#d32f2f', depth: 0.004 })
      .box([0.03, 0.004, 0.06], [0.04, 0.071, 0.0], { color: '#e8e0c8', noInk: true })
      .box([0.012, 0.06, 0.07], [0.09, 0.03, 0.01], { color: '#f5f0e0', round: 0.2, rot: [0, 15, 0] })
      .act({ click: [A.anim('wobble', 2), A.say('Squish', 1)] })
      .done(),
  ),
  // An anatomy model of the large intestine framing the belly (0.4 m; the 5 m in the vocabulary is its length laid
  // out): ascending, transverse and descending colon with their pouches and the appendix; it gurgles.
  e('large intestine', 'clinic', 'organs', () => {
    const c = '#c98a6a';
    const b = m('large intestine');
    b.box([0.2, 0.012, 0.1], [0, 0.006, -0.06], { color: 'darkwood', edge: 'sharp' });
    b.stick([0, 0.012, -0.06], [0, 0.2, -0.06], 0.008, 'brass');
    const pts: V[] = [[0.13, 0.08, 0], [0.15, 0.2, 0], [0.14, 0.34, 0], [0.04, 0.38, 0.01], [-0.06, 0.37, 0.01], [-0.15, 0.33, 0], [-0.16, 0.2, 0], [-0.13, 0.1, 0], [-0.04, 0.09, 0.02], [0, 0.04, 0.01]];
    b.ball(0.02, [0, 0.2, -0.03], { color: c, name: 'colon' });
    path(b, pts, 0.075, c, { parent: 'colon' });
    pts.forEach((p, i) => b.ball(i === pts.length - 1 ? 0.06 : 0.09, p, { color: i % 2 ? '#b9785a' : c, parent: 'colon' }));
    b.rod([0.13, 0.08, 0], [0.11, 0.02, 0.02], 0.02, '#d99a7a', { parent: 'colon' });
    return b.act({ click: [A.pose('colon', { scale: 1.05, dur: 0.3 }), A.pose('colon', { scale: 1, dur: 0.3 }), A.say('Gurgle...', 1.5)] }).done();
  }),
  // A vault-style large steel door, 2.5 m, in its frame: riveted plate, a big locking wheel that spins before the
  // door swings open on its heavy hinges, then shuts with a clang.
  e('large steel door', 'workshop', 'doors and gates', () => {
    const b = m('large steel door', { edge: 'sharp' }).box([0.22, 2.6, 0.3], [-0.8, 1.3, 0], { color: '#5a5e62' }).box([0.22, 2.6, 0.3], [0.8, 1.3, 0], { color: '#5a5e62' });
    b.box([1.82, 0.22, 0.3], [0, 2.71, 0], { color: '#5a5e62' });
    b.box([1.38, 2.5, 0.12], [0, 1.25, 0.05], { color: '#8a9096', name: 'door', pivot: [-0.69, 1.25, 0.05], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    for (let r = 0; r < 7; r++) for (const x of [-0.6, 0.6]) b.ball(0.04, [x, 0.15 + r * 0.37, 0.12], { color: '#5a5e62', parent: 'door' });
    b.pair((s) => b.box([0.1, 0.25, 0.08], [-0.72, 0.6 + (s > 0 ? 1.3 : 0), 0.1], { color: '#3a3d42', parent: 'door' }));
    b.torus([0.5, 0.5, 0.05], [0.1, 1.35, 0.16], { color: '#3a3d42', parent: 'door', name: 'handwheel', pivot: [0.1, 1.35, 0.16] });
    b.stick([-0.14, 1.35, 0.16], [0.34, 1.35, 0.16], 0.04, '#3a3d42', { parent: 'handwheel' }).stick([0.1, 1.11, 0.16], [0.1, 1.59, 0.16], 0.04, '#3a3d42', { parent: 'handwheel' });
    b.cyl([0.12, 0.1, 0.12], [0.1, 1.35, 0.14], { color: '#3a3d42', rot: [90, 0, 0], parent: 'door' });
    return b
      .act({
        click: [
          [A.pose('handwheel', { rot: [0, 0, 270], dur: 1 }), A.say('Clunk-clunk', 1), A.operate('door', 'open')],
          [A.operate('door', 'close'), A.pose('handwheel', { rot: [0, 0, 0], dur: 0.6 }), A.par(A.say('CLANG!', 1.2), A.anim('shake'))],
        ],
      })
      .done();
  }),
  // A pair of tall wrought-iron gates between stone pillars with ball caps, 4 m: spear-topped bars, cross rails and
  // scrolls; both leaves swing open and clang shut.
  e('large steel gate', 'workshop', 'doors and gates', () => {
    const b = m('large steel gate', { edge: 'sharp' });
    b.pair((s) => {
      b.box([0.5, 3.4, 0.5], [s * 2.35, 1.7, 0], { color: '#a8a39c' });
      b.box([0.6, 0.15, 0.6], [s * 2.35, 3.47, 0], { color: '#9a958e' });
      b.ball(0.4, [s * 2.35, 3.75, 0], { color: '#9a958e', edge: 'soft' });
    });
    const leaf = (s: 1 | -1, n: string) => {
      b.stick([s * 2.05, 0.15, 0], [s * 2.05, 2.9, 0], 0.08, '#2b2d31', { name: n, pivot: [s * 2.08, 1.5, 0], mover: { kind: 'swing', axis: 'y', amount: s * 100 } });
      for (let i = 0; i < 8; i++) {
        const x = s * (0.12 + i * 0.25), top = 2.6 + Math.sin((i / 8) * Math.PI) * 0.4;
        b.stick([x, 0.15, 0], [x, top, 0], 0.05, '#2b2d31', { parent: n });
        b.cone([0.09, 0.18, 0.06], [x, top + 0.09, 0], { color: '#d4af37', parent: n });
      }
      for (const y of [0.35, 1.5, 2.5]) b.stick([s * 0.05, y, 0], [s * 2.05, y, 0], 0.06, '#2b2d31', { parent: n });
      b.torus([0.3, 0.3, 0.03], [s * 1.0, 1.95, 0], { color: '#2b2d31', parent: n });
    };
    leaf(1, 'gateL');
    leaf(-1, 'gateR');
    return b
      .act({
        click: [
          [A.operate('gate', 'open'), A.say('Creeeak...', 1.5)],
          [A.operate('gate', 'close'), A.say('CLANG!', 1.2)],
        ],
      })
      .done();
  }),
  // A square of lasagna on a plate: layers of pasta, meat sauce and béchamel under a browned cheese top with basil;
  // it steams.
  e('lasagna', 'food', 'pasta', () => {
    const b = m('lasagna').cyl([0.22, 0.012, 0.22], [0, 0.006, 0], { color: 'white', edge: 'sharp' });
    b.box([0.106, 0.066, 0.126], [0, 0.045, 0], { color: '#c84a2a', round: 0.1 });
    for (const [y, c] of [[0.02, '#f0d890'], [0.036, '#f5e6b0'], [0.05, '#f0d890'], [0.066, '#f5e6b0']] as const) b.box([0.11, 0.007, 0.13], [0, y, 0], { color: c, round: 0.1, noInk: true });
    b.box([0.115, 0.012, 0.135], [0, 0.084, 0], { color: '#e8b84a', round: 0.4 });
    for (const [x, zz] of [[0.02, 0.03], [-0.03, -0.02], [0.03, -0.04]] as const) b.ball([0.015, 0.004, 0.012], [x, 0.091, zz], { color: '#8a5a2a', noInk: true });
    b.ball([0.03, 0.006, 0.02], [-0.02, 0.092, 0.03], { color: '#43a047' });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Sizzle!', 1.2))] }).done();
  }),
  // A pen-style laser pointer on a little stand: a red beam and its dot, which wiggles about, then switches off.
  e('laser pointer', 'tech', 'gadgets', () =>
    m('laser pointer', { edge: 'sharp' })
      .box([0.09, 0.025, 0.05], [0, 0.0125, 0], { color: '#3a3d42', round: 0.3 })
      .cyl([0.016, 0.14, 0.016], [0, 0.06, 0], { color: 'silver', rot: [0, 0, -60], name: 'pen', pivot: [0, 0.025, 0] })
      .ball(0.008, [0.0, 0.069, 0.007], { color: '#e53935', parent: 'pen' })
      .stick([0.062, 0.096, 0], [0.18, 0.164, 0], 0.005, '#ff1744', { glow: true, parent: 'pen', name: 'beam', scale: 0 })
      .ball(0.014, [0.18, 0.164, 0], { color: '#ff1744', glow: true, parent: 'beam' })
      .act({
        click: [
          [A.pose('beam', { scale: 1, dur: 0.1 }), A.pose('pen', { rot: [0, 0, 8], dur: 0.3 }), A.pose('pen', { rot: [0, 25, -5], dur: 0.3 }), A.pose('pen', { rot: [0, 0, 0], dur: 0.3 }), A.say('Zzzt!', 1)],
          [A.pose('beam', { scale: 0, dur: 0.1 })],
        ],
      })
      .done(),
  ),
  // A cowboy's lariat: a coil of rope on the ground and a loop held up high; the loop twirls.
  e('lasso', 'farm', 'ranch gear', () => {
    const b = m('lasso').torus([0.34, 0.34, 0.1], [0, 0.05, 0], { color: '#c8a06a', rot: [90, 0, 0], tube: 0.3 });
    b.torus([0.24, 0.24, 0.01], [0, 0.1, 0], { color: '#a8844a', rot: [90, 0, 0], noInk: true });
    path(b, [[0.15, 0.08, 0], [0.22, 0.4, 0.05], [0.18, 0.75, 0.05], [0.2, 1.0, 0.1]], 0.02, '#c8a06a');
    b.torus([0.9, 0.9, 0.03], [0.2, 1.05, 0], { color: '#c8a06a', rot: [75, 0, 0], tube: 0.06, name: 'loop', pivot: [0.2, 1.05, 0] });
    b.ball(0.05, [0.2, 1.0, 0.12], { color: '#a8844a' });
    return b.act({ click: [A.pose('loop', { spin: [0, 540, 0] }), A.say('Whirr whirr!', 1.5), A.wait(1.8), A.pose('loop', { spin: [0, 0, 0] }), A.pose('loop', { rot: [0, 0, 0], dur: 0.3 })] }).done();
  }),
  // A white garden trellis panel over a planter of earth, a climbing rose winding up it; the roses bloom bigger.
  e('lattice', 'garden', 'garden things', () => {
    const b = m('lattice').box([1.0, 0.25, 0.25], [0, 0.125, 0], { color: 'wood', edge: 'sharp' }).box([0.96, 0.02, 0.21], [0, 0.25, 0], { color: 'dirt' });
    const Y = 0.75, w = 'white';
    b.box([1.0, 0.04, 0.04], [0, Y + 0.5, 0], { color: w, edge: 'sharp' }).box([1.0, 0.04, 0.04], [0, Y - 0.5, 0], { color: w, edge: 'sharp' });
    b.pair((s) => b.box([0.04, 1.0, 0.04], [s * 0.5, Y, 0], { color: w, edge: 'sharp' }));
    for (let c = -0.75; c <= 0.76; c += 0.25)
      for (const sg of [1, -1]) {
        const x0 = Math.max(-0.5, c - 0.5), x1 = Math.min(0.5, c + 0.5);
        if (x1 - x0 < 0.05) continue;
        b.stick([x0, Y + sg * (x0 - c), 0.01], [x1, Y + sg * (x1 - c), 0.01], 0.022, w, { edge: 'sharp' });
      }
    const vine: V[] = [[-0.3, 0.26, 0.05], [-0.2, 0.55, 0.05], [-0.3, 0.8, 0.05], [-0.1, 1.05, 0.05], [0.15, 1.15, 0.05]];
    path(b, vine, 0.02, 'darkgreen');
    vine.forEach((p, i) => {
      b.ball([0.08, 0.05, 0.03], [p[0] + 0.04, p[1], 0.06], { color: 'leaf' });
      b.ball(0.05, [p[0] - 0.04, p[1] + 0.05, 0.06], { color: i % 2 ? '#f48fb1' : '#d81b60', name: `rose${i}` });
    });
    return b.act({ click: [A.par(...[0, 1, 2, 3, 4].map((i) => A.pose(`rose${i}`, { scale: 1.6, dur: 0.6 })), A.effect('sparkle', { dur: 1.2 })), A.wait(1), A.par(...[0, 1, 2, 3, 4].map((i) => A.pose(`rose${i}`, { scale: 1, dur: 0.5 })))] }).done();
  }),
  // A laundromat (9 m front, 3.8 m storey) you can see into: a sky-blue front of corner piers, a sign fascia, low
  // stall risers and big open window bays with white glazing bars and a glazed transom, glass double doors that
  // open. Inside on a tiled floor: an island of six front-loading washers on a raised base (their round doors face
  // the street), stacked dryers along the back wall, a folding table with a basket, ceiling lights and an OPEN
  // sign. The doors ding; the drums churn.
  e('laundromat', 'places', 'shops', () => {
    const W = 9, D = 7, H = 3.8, fz = D / 2, BL = '#81d4fa', TR = 'white', GL = '#b8dcec';
    const b = m('laundromat', { edge: 'sharp' })
      .box([W + 0.2, 0.3, D + 0.2], [0, 0.15, 0], { color: '#7d7873', round: 0.05 })
      .box([W - 0.5, 0.05, D - 0.5], [0, 0.325, 0], { color: '#ebe6dc', round: 0, noInk: true })
      .box([W, H, 0.25], [0, 0.3 + H / 2, -fz + 0.125], { color: '#e6f4fb', round: 0.02 })
      .box([W + 0.2, 0.3, D + 0.2], [0, 0.3 + H + 0.15, 0], { color: '#5a5652', round: 0.05 })
      .box([W + 0.4, 0.5, 0.35], [0, 0.3 + H + 0.25, fz], { color: TR, round: 0.1 })
      .box([W, 0.9, 0.3], [0, 3.65, fz - 0.15], { color: BL, round: 0.05 })
      .label('LAUNDROMAT', [5.6, 0.55], [0, 3.76, fz + 0.02], { color: 'white', depth: 0.04 })
      .label('WASH & DRY - OPEN 7 DAYS', [4.2, 0.22], [0, 3.33, fz + 0.02], { color: BL, depth: 0.02 });
    b.pair((s) => {
      // side wall, corner pier, door pier, stall riser, window bay bars, transom glass, sill
      b.box([0.25, H, D], [s * (W / 2 - 0.125), 0.3 + H / 2, 0], { color: BL, round: 0.02 })
        .box([0.45, 2.9, 0.34], [s * (W / 2 - 0.2), 1.75, fz - 0.15], { color: BL, round: 0.05 })
        .box([0.22, 2.9, 0.3], [s * 0.92, 1.75, fz - 0.15], { color: TR, round: 0.05 })
        .box([3.2, 0.42, 0.3], [s * 2.55, 0.51, fz - 0.15], { color: BL, round: 0.05 })
        .box([3.3, 0.06, 0.3], [s * 2.55, 0.74, fz - 0.08], { color: TR, round: 0.2 })
        .box([0.08, 2.46, 0.12], [s * 2.55, 1.97, fz - 0.1], { color: TR, round: 0.2 })
        .box([3.2, 0.08, 0.12], [s * 2.55, 2.62, fz - 0.1], { color: TR, round: 0.2 })
        .box([3.2, 0.52, 0.04], [s * 2.55, 2.92, fz - 0.12], { color: GL, round: 0.05 });
      // glass door on its hinge
      const dn = s > 0 ? 'doorL' : 'doorR';
      b.box([0.78, 2.25, 0.06], [s * 0.41, 1.45, fz - 0.12], { color: GL, round: 0.08, name: dn, pivot: [s * 0.8, 1.45, fz - 0.12], mover: { kind: 'swing', axis: 'y', amount: s * 95 } })
        .box([0.84, 0.1, 0.07], [s * 0.41, 0.36, fz - 0.115], { color: TR, parent: dn })
        .box([0.84, 0.08, 0.07], [s * 0.41, 2.55, fz - 0.115], { color: TR, parent: dn })
        .box([0.04, 0.5, 0.05], [s * 0.1, 1.4, fz - 0.07], { color: 'silver', parent: dn });
      // the washers: a raised base and three machines, round glass doors facing out; their drums churn
      b.box([2.5, 0.25, 0.85], [s * 2.35, 0.475, 0.9], { color: '#9da3a8', round: 0.05 });
      for (let i = 0; i < 3; i++) {
        const x = s * (1.55 + i * 0.8), n = `drum${s > 0 ? 'L' : 'R'}${i}`;
        b.box([0.72, 0.85, 0.7], [x, 1.025, 0.9], { color: 'white', round: 0.08 })
          .box([0.72, 0.13, 0.04], [x, 1.37, 1.26], { color: '#5c6166', round: 0.1 })
          .torus([0.5, 0.5, 0.06], [x, 0.97, 1.27], { color: 'silver' })
          .cyl([0.4, 0.03, 0.4], [x, 0.97, 1.27], { color: '#5f9fc8', rot: [90, 0, 0], name: n, pivot: [x, 0.97, 1.27] })
          .box([0.08, 0.26, 0.02], [x, 0.97, 1.29], { color: 'white', parent: n, noInk: true });
      }
      // stacked dryers along the back wall
      for (let i = 0; i < 2; i++)
        for (let k = 0; k < 2; k++) {
          const x = s * (1.6 + i * 0.85), y = 0.75 + k * 0.85;
          b.box([0.8, 0.82, 0.7], [x, y, -fz + 0.6], { color: '#d8dce0', round: 0.06 })
            .torus([0.52, 0.52, 0.06], [x, y - 0.05, -fz + 0.96], { color: 'silver' })
            .cyl([0.42, 0.02, 0.42], [x, y - 0.05, -fz + 0.96], { color: '#3a3d42', rot: [90, 0, 0] });
        }
      b.box([0.9, 0.06, 0.4], [s * 2.0, 0.3 + H - 0.05, 0.2], { color: '#fffbe6', glow: true, round: 0.2 });
    });
    b.box([1.6, 0.06, 0.7], [0, 0.95, -2.2], { color: '#c8a46a', round: 0.1 })
      .pair((s) => void b.box([0.06, 0.6, 0.6], [s * 0.72, 0.62, -2.2], { color: '#9da3a8', round: 0.1 }))
      .cyl([0.5, 0.3, 0.4], [0.3, 1.13, -2.2], { color: '#f4a1c0', taper: 1.15, edge: 'soft' })
      .box([0.7, 0.28, 0.04], [3.3, 2.3, fz - 0.2], { color: '#ff4fa0', glow: true, round: 0.3, name: 'open', mover: { kind: 'light', on: false } })
      .label('OPEN', [0.56, 0.2], [3.3, 2.3, fz - 0.17], { color: '#ff4fa0', parent: 'open', depth: 0.01 })
      .box([1.62, 0.56, 0.04], [0, 2.9, fz - 0.12], { color: GL, round: 0.05 })
      .box([1.62, 0.08, 0.1], [0, 2.6, fz - 0.1], { color: TR, round: 0.2 });
    const drums = ['drumL0', 'drumL1', 'drumL2', 'drumR0', 'drumR1', 'drumR2'];
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.operate('open', 'on')), A.say('Ding!', 1), A.wait(2.5), A.par(A.operate('door', 'close'), A.operate('open', 'off'))],
          [A.par(...drums.map((n) => A.pose(n, { spin: [0, 0, 300] })), A.effect('water_spray', { dur: 2 }), A.say('Swish swish...', 2)), A.wait(2), A.par(...drums.map((n) => A.pose(n, { spin: [0, 0, 0] })))],
        ],
      })
      .done();
  }),
];
