/**
 * Catalog chunk objects-09: the words in assign/objects-09.tsv (sledgehammer .. tissue box).
 *
 * Every thing is at its real size next to a 1.7 m person, with crisp (sharp) or melted (soft) edges chosen per part,
 * named movers / pieces / sockets where the real thing has them, and an act: what it does when clicked.
 */
import { e, type CatalogEntry } from './types';
import { A, M, around, m, withAct } from '../dsl';
import { body, face, hat, held, wear, who } from '../accessories';

type V = [number, number, number];
const D = Math.PI / 180;

/** Point on a circle in the x-y plane (facing you). */
const xy = (cx: number, cy: number, r: number, a: number, z = 0): V => [cx + Math.sin(a) * r, cy + Math.cos(a) * r, z];

/**
 * A road wheel on an axle along x: a soft tyre named `name` (wheel* names roll when the thing moves) with a sharp
 * rim, spokes or dish and a hub cap riding on it. `y` defaults to resting on the ground.
 */
function wheel(b: M, name: string, x: number, z: number, d: number, w: number, o: { y?: number; rim?: string; tyre?: string; hub?: string; spokes?: number } = {}): M {
  const s = Math.sign(x) || 1, y = o.y ?? d / 2, rim = o.rim ?? 'silver';
  b.cyl([d, w, d], [x, y, z], { color: o.tyre ?? 'rubber', rot: [0, 0, 90], name, edge: 'soft', segs: 20 })
    .cyl([d * 0.64, w * 0.08, d * 0.64], [x + s * w * 0.48, y, z], { color: rim, rot: [0, 0, 90], parent: name, edge: 'sharp' })
    .cyl([d * 0.2, w * 0.14, d * 0.2], [x + s * w * 0.54, y, z], { color: o.hub ?? 'darkgray', rot: [0, 0, 90], parent: name, edge: 'sharp' });
  const n = o.spokes ?? 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    b.box([w * 0.04, d * 0.2, d * 0.07], [x + s * w * 0.53, y + Math.cos(a) * d * 0.17, z + Math.sin(a) * d * 0.17], { color: o.hub ?? 'darkgray', rot: [-a / D, 0, 0], parent: name, edge: 'sharp', noInk: true });
  }
  return b;
}

/**
 * A car: a boxy soft loft for the body and a glass greenhouse (cut top loft) on it, a body-coloured roof, wheel arch
 * shadows, sharp bumpers, grille, lights (headlights are `light` movers), mirrors, a number plate, both front doors
 * on hinges (doorL / doorR swing out) and seat sockets. Nose to +z.
 */
interface CarOpts {
  L: number; W: number; H: number; belt: number; low: number; color: string; wheel: number; wb: number;
  /** Greenhouse from the back (0) to the front (1) of the car, as fractions of L. */
  cab: [number, number];
  /** Rake of the screens: how much of the greenhouse length the glass leans over at each end (0..0.5). */
  rake?: [number, number];
  /** Body taper at the nose and tail (section height fraction at the ends). */
  nose?: number; tail?: number;
  trim?: string; glass?: string; roof?: string; plate?: string; rim?: string;
}
function car(b: M, o: CarOpts): M {
  const { L, W, H, belt, low, color } = o;
  const bh = belt - low, gl = o.glass ?? '#3d5a73', trim = o.trim ?? '#2a2726';
  const nose = o.nose ?? 0.55, tail = o.tail ?? 0.75;
  b.loft([W, bh, L], [0, low + bh / 2, 0], [[0, 0.9, tail, (tail - 1) / 2 + 0.1], [0.05, 0.98, 0.96, 0], [0.5, 1, 1, 0], [0.9, 0.98, 0.92, -0.03], [1, 0.9, nose, (nose - 1) / 2]], { color, boxy: 0.78, name: 'body', edge: 'soft' });
  const z0 = -L / 2 + o.cab[0] * L, z1 = -L / 2 + o.cab[1] * L, cl = z1 - z0, cz = (z0 + z1) / 2;
  const [rb, rf] = o.rake ?? [0.25, 0.35];
  b.loft([W * 0.88, (H - belt) * 2, cl], [0, belt - 0.01, cz], [[0, 0.82, 0.25], [rb, 0.92, 1], [1 - rf, 0.92, 1], [1, 0.84, 0.25]], { color: gl, cut: 'top', boxy: 0.7, name: 'cabin', edge: 'sharp' });
  // roof panel and pillars in body colour over the glass
  const rl = cl * (1 - rb - rf) * 0.98;
  b.box([W * 0.8, 0.05, rl], [0, H - 0.02, z0 + cl * (rb + (1 - rb - rf) / 2)], { color: o.roof ?? color, round: 0.6, parent: 'cabin' });
  b.pair((s) => {
    b.box([0.05, H - belt, 0.09], [s * W * 0.43, (H + belt) / 2, z0 + cl * (rb + (1 - rb - rf) * 0.55)], { color: o.roof ?? color, parent: 'cabin', round: 0.3 });
    // wheel arch shadows and the wheels
    for (const [k, z] of [['F', o.wb / 2], ['B', -o.wb / 2]] as const) {
      b.cyl([o.wheel * 1.14, 0.02, o.wheel * 1.14], [s * W * 0.5, o.wheel / 2 + 0.02, z], { color: '#1e1c1b', rot: [0, 0, 90], parent: 'body', noInk: true });
      wheel(b, `wheel${k}${s > 0 ? 'L' : 'R'}`, s * (W * 0.5 - 0.06), z, o.wheel, 0.22, { rim: o.rim });
    }
    // headlights (light movers), tail lights, mirrors, door
    b.ball([W * 0.2, bh * 0.22, 0.08], [s * W * 0.33, low + bh * (0.5 + nose * 0.25), L / 2 - 0.04], { color: '#fff6c8', glow: true, name: `headlight${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: false }, edge: 'sharp' });
    b.box([W * 0.18, bh * 0.16, 0.05], [s * W * 0.36, low + bh * (0.5 + tail * 0.3), -L / 2 + 0.02], { color: '#d4241c', glow: true, round: 0.4, parent: 'body', edge: 'sharp' });
    b.box([0.07, 0.09, 0.16], [s * (W * 0.5 + 0.04), belt + 0.08, z1 - cl * rf * 0.6], { color, round: 0.5, parent: 'body', edge: 'sharp' });
    const dl = Math.min(1.15, cl * 0.5), dz = z1 - cl * rf * 0.5;
    b.box([0.035, bh * 0.82, dl], [s * W * 0.5, low + bh * 0.52, dz - dl / 2], { color, round: 0.4, name: `door${s > 0 ? 'L' : 'R'}`, pivot: [s * W * 0.5, low + bh * 0.52, dz], mover: { kind: 'swing', axis: 'y', amount: -s * 65 }, edge: 'sharp' });
    b.box([0.04, 0.03, 0.14], [s * (W * 0.5 + 0.02), low + bh * 0.75, dz - dl + 0.15], { color: 'silver', parent: `door${s > 0 ? 'L' : 'R'}`, edge: 'sharp' });
  });
  // bumpers, grille, plate
  b.box([W * 0.98, bh * 0.2, 0.12], [0, low + bh * 0.12, L / 2 - 0.03], { color: trim, round: 0.5, parent: 'body', edge: 'sharp' })
    .box([W * 0.98, bh * 0.2, 0.12], [0, low + bh * 0.14, -L / 2 + 0.03], { color: trim, round: 0.5, parent: 'body', edge: 'sharp' })
    .box([W * 0.36, bh * 0.22, 0.04], [0, low + bh * (0.3 + nose * 0.2), L / 2 - 0.01], { color: '#1e1c1b', round: 0.3, parent: 'body', edge: 'sharp' })
    .label(o.plate ?? 'AB 123', [0.42, 0.11], [0, low + bh * 0.42, -L / 2 - 0.02], { color: 'white', parent: 'body', depth: 0.02 });
  b.socket('driver', [W * 0.22, belt - 0.25, cz + 0.05], 'seat').socket('passenger', [-W * 0.22, belt - 0.25, cz + 0.05], 'seat');
  return b;
}

/** Hoot, blink and open a door: the family act of the cars here (each adds its own twist). */
const carAct = (horn: string, extra: Parameters<typeof A.say>[0]) => ({
  click: [
    [A.par(A.operate('headlights', 'on'), A.anim('shake'), A.say(horn, 1.5)), A.wait(1.2), A.operate('headlights', 'off')],
    [A.operate('doorL', 'open'), A.say(extra, 1.8), A.wait(2.2), A.operate('doorL', 'close')],
  ],
});

/**
 * A shop front at real size (frontage w, height h, depth d): walls, a cornice, big display windows with glazing
 * bars, a glass door on its hinge (`door`), a sign board, an optional striped awning, a step and a lit window
 * (`window` light mover) so the shop can open and light up.
 */
function shopFront(key: string, o: { w?: number; h?: number; d?: number; wall: string; trim?: string; sign: string; signColor?: string; signText?: string; awning?: [string, string]; door?: string; upper?: boolean }): M {
  const w = o.w ?? 6, h = o.h ?? (o.upper ? 6.4 : 4.4), d = o.d ?? 5, f = d / 2, trim = o.trim ?? 'white';
  const b = m(key, { edge: 'sharp' })
    .box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.02, name: 'walls' })
    .box([w + 0.3, 0.35, d + 0.3], [0, h + 0.1, 0], { color: trim, round: 0.1 })
    .box([w + 0.1, 0.12, 0.6], [0, 0.06, f + 0.3], { color: 'stone', round: 0.2 })
    // shop front: stall riser, display windows with bars, fascia, the door
    .box([w - 0.3, 0.5, 0.12], [0, 0.37, f + 0.04], { color: trim, round: 0.2 })
    .box([w - 0.3, 0.45, 0.14], [0, 3.1, f + 0.05], { color: trim, round: 0.2 })
    .label(o.sign, [w * 0.7, 0.62], [0, 3.62, f + 0.12], { color: o.signColor ?? 'white', depth: 0.08 });
  b.pair((s) => {
    const wx = s * (w * 0.25 + 0.35), ww = w / 2 - 1.15;
    b.box([ww, 2.15, 0.06], [wx, 1.7, f + 0.03], { color: '#9fd0ea', name: s > 0 ? 'window' : 'windowB', mover: { kind: 'light', on: false }, glow: true });
    b.box([0.07, 2.2, 0.1], [wx, 1.7, f + 0.07], { color: trim });
    b.box([0.1, 2.75, 0.14], [s * (w / 2 - 0.1), 1.45, f + 0.04], { color: trim, round: 0.2 });
  });
  b.box([1.0, 2.25, 0.08], [0, 1.25, f + 0.04], { color: '#9fd0ea', name: 'door', pivot: [-0.5, 1.25, f + 0.06], mover: { kind: 'swing', axis: 'y', amount: -80 } })
    .box([0.06, 2.25, 0.1], [0.47, 1.25, f + 0.06], { color: o.door ?? 'darkwood', parent: 'door' })
    .box([0.06, 2.25, 0.1], [-0.47, 1.25, f + 0.06], { color: o.door ?? 'darkwood', parent: 'door' })
    .box([1.0, 0.08, 0.1], [0, 2.34, f + 0.06], { color: o.door ?? 'darkwood', parent: 'door' })
    .box([1.0, 0.25, 0.1], [0, 0.25, f + 0.06], { color: o.door ?? 'darkwood', parent: 'door' })
    .box([0.04, 0.35, 0.05], [0.35, 1.05, f + 0.12], { color: 'silver', parent: 'door' })
    .box([1.2, 0.1, 0.12], [0, 2.43, f + 0.05], { color: trim });
  if (o.awning) {
    const n = Math.round((w - 0.4) / 0.5);
    b.each(n, (i) => b.box([(w - 0.4) / n, 0.05, 1.2], [-(w - 0.4) / 2 + ((i + 0.5) * (w - 0.4)) / n, 2.75, f + 0.55], { color: o.awning![i % 2], rot: [20, 0, 0], round: 0.1, edge: 'soft' }));
    b.each(n, (i) => b.box([(w - 0.4) / n, 0.22, 0.03], [-(w - 0.4) / 2 + ((i + 0.5) * (w - 0.4)) / n, 2.45, f + 1.12], { color: o.awning![i % 2], round: 0.1 }));
  }
  if (o.upper)
    b.pair((s) =>
      b.each(2, (i) => {
        const xx = s * (0.9 + i * 1.6);
        b.box([1.0, 1.3, 0.08], [xx, 5.0, f + 0.02], { color: '#9fd0ea' }).box([1.2, 0.12, 0.2], [xx, 4.3, f + 0.06], { color: trim });
      }),
    );
  // side windows, a back door and a rooftop unit so the shop is a whole building, not a front
  b.pair((s) => b.box([0.06, 1.3, 1.3], [s * (w / 2 + 0.02), 1.9, -0.6], { color: '#9fd0ea' }).box([0.14, 0.1, 1.42], [s * (w / 2 + 0.05), 1.2, -0.6], { color: trim }));
  b.box([1.0, 2.1, 0.06], [w * 0.25, 1.05, -f - 0.02], { color: '#5c6166' })
    .box([1.3, 0.6, 0.9], [-w * 0.2, h + 0.55, -f * 0.4], { color: '#c9ccd1', round: 0.1 })
    .box([0.8, 0.04, 0.8], [-w * 0.2, h + 0.86, -f * 0.4], { color: '#5c6166' });
  b.socket('counter', [0, 1.0, f - 1.2], 'top', { size: 0.6 });
  return b;
}

/** The shops' act: the door opens with the shop bell, then the windows light up (and go dark again). */
const shopAct = (bell = 'Ding-a-ling!') => ({
  click: [
    [A.operate('door', 'open'), A.say(bell, 1.8), A.wait(2.5), A.operate('door', 'close')],
    [A.operate('window', 'on'), A.operate('windowB', 'on'), A.effect('sparkle', { dur: 1.2 }), A.wait(2.5), A.operate('window', 'off'), A.operate('windowB', 'off')],
  ],
});


/**
 * Clothes are shown the way a shop shows them: on a hanger hooked over a chrome valet stand. The hanger and the
 * garment are one part tree named 'garment', pivoting on the hook, so acts can sway or twirl it.
 */
function valet(b: M, top = 1.72, color = 'silver'): V {
  b.cyl([0.42, 0.03, 0.42], [0, 0.015, -0.16], { color: '#5c6166', edge: 'sharp' })
    .stick([0, 0.03, -0.24], [0, top, -0.24], 0.028, color, { edge: 'sharp' })
    .stick([0, top, -0.24], [0, top, 0], 0.022, color, { edge: 'sharp' })
    .stick([-0.2, top, 0], [0.2, top, 0], 0.022, color, { edge: 'sharp' })
    .ball(0.034, [0.2, top, 0], { color, edge: 'sharp' })
    .ball(0.034, [-0.2, top, 0], { color, edge: 'sharp' });
  return [0, top, 0];
}
/** A wooden hanger on the hook (the 'garment' root). Returns the y of the garment's neckline. */
function hanger(b: M, hook: V, w = 0.44, clip = false): number {
  const [hx, hy, hz] = hook;
  b.arc([0.06, 0.06, 0.008], [hx, hy - 0.005, hz], { color: 'silver', arc: 220, tube: 0.16, rot: [0, 90, 0], name: 'garment', pivot: [hx, hy + 0.02, hz], edge: 'sharp' })
    .stick([hx, hy - 0.03, hz], [hx, hy - 0.08, hz], 0.007, 'silver', { parent: 'garment', edge: 'sharp' });
  if (clip) {
    b.box([w, 0.03, 0.025], [hx, hy - 0.095, hz], { color: '#2a2726', parent: 'garment', edge: 'sharp', round: 0.4 });
    b.pair((s) => b.box([0.03, 0.05, 0.035], [hx + s * w * 0.4, hy - 0.125, hz], { color: 'silver', parent: 'garment', edge: 'sharp' }));
    return hy - 0.13;
  }
  b.arc([w, 0.16, 0.022], [hx, hy - 0.16, hz], { color: 'lightwood', arc: 120, tube: 0.1, parent: 'garment', edge: 'sharp' });
  return hy - 0.1;
}
/** A top hanging from the hanger, neckline at y = T: soft loft body, sleeves (long, short or none), neckband, hem. */
function topOn(b: M, T: number, z: number, o: { color: string; sleeves: 'long' | 'short' | 'none'; W?: number; L?: number; band?: string; cuff?: string }): M {
  const W = o.W ?? 0.5, L = o.L ?? 0.68, c = o.color;
  const top = o.sleeves === 'none' ? 0.5 : 0.36;
  b.loft([W, 0.16, L], [0, T - L / 2, z], [[0, 0.93, 0.75], [0.1, 0.94, 0.88], [0.62, 0.95, 1], [0.86, 1, 1], [0.95, o.sleeves === 'none' ? 0.62 : 0.84, 0.86], [1, top, 0.55]], { color: c, rot: [-90, 0, 0], parent: 'garment', boxy: 0.55, edge: 'soft' })
    .torus([0.17, 0.17, 0.035], [0, T - 0.015, z + 0.005], { color: o.band ?? c, rot: [90, 0, 0], tube: 0.18, parent: 'garment', edge: 'soft' })
    .ball([0.13, 0.03, 0.08], [0, T - 0.01, z - 0.01], { color: '#1e1c1b', parent: 'garment', noInk: true, edge: 'soft' })
    .box([W * 0.95, 0.05, 0.14], [0, T - L + 0.025, z], { color: o.band ?? c, round: 0.6, parent: 'garment', edge: 'soft' });
  if (o.sleeves === 'long')
    b.pair((s) => {
      b.rod([s * W * 0.47, T - 0.08, z], [s * W * 0.7, T - 0.6, z + 0.02], 0.12, c, { parent: 'garment', edge: 'soft' });
      b.cyl([0.11, 0.06, 0.1], [s * W * 0.71, T - 0.63, z + 0.02], { color: o.cuff ?? o.band ?? c, rot: [0, 0, s * 18], parent: 'garment', edge: 'soft' });
    });
  if (o.sleeves === 'short') b.pair((s) => b.rod([s * W * 0.46, T - 0.08, z], [s * W * 0.74, T - 0.26, z], 0.15, c, { parent: 'garment', edge: 'soft' }));
  if (o.sleeves === 'none') b.pair((s) => b.box([0.06, 0.1, 0.12], [s * 0.12, T - 0.02, z], { color: c, round: 0.5, parent: 'garment', edge: 'soft' }));
  return b;
}
/** Trousers hanging from a clip hanger by the waistband (top at y = T), legs reaching down L. */
function pantsOn(b: M, T: number, z: number, o: { color: string; L?: number; band?: string; cuff?: string; legW?: number }): M {
  const L = o.L ?? 1.0, lw = o.legW ?? 0.2, c = o.color;
  b.box([0.42, 0.07, 0.16], [0, T - 0.035, z], { color: o.band ?? c, round: 0.5, parent: 'garment', edge: 'soft' })
    .box([0.43, 0.26, 0.19], [0, T - 0.19, z], { color: c, round: 0.55, parent: 'garment', edge: 'soft' });
  b.pair((s) => {
    b.cyl([lw, L - 0.25, lw * 0.85], [s * 0.118, T - 0.25 - (L - 0.25) / 2, z], { color: c, taper: 0.82, rot: [180, 0, s * 2], parent: 'garment', edge: 'soft' });
    b.cyl([lw * 0.86, 0.06, lw * 0.76], [s * 0.128, T - L + 0.03, z], { color: o.cuff ?? c, parent: 'garment', edge: 'soft' });
  });
  return b;
}
/** The garments' act: a little sway on the hanger, then a twirl to show the back. */
const garmentAct = (first: ReturnType<typeof A.say>[], second: ReturnType<typeof A.say>[] = []) => ({
  click: [
    [A.pose('garment', { rot: [0, 0, 9], dur: 0.35 }), A.pose('garment', { rot: [0, 0, -7], dur: 0.45 }), A.pose('garment', { rot: [0, 0, 0], dur: 0.35 }), ...first],
    [A.pose('garment', { rot: [0, 180, 0], dur: 0.8 }), A.wait(0.8), A.pose('garment', { rot: [0, 360, 0], dur: 0.8 }), A.pose('garment', { rot: [0, 0, 0], dur: 0 }), ...second],
  ],
});

/** A tree stump at (x, z): a tapering bark trunk with ridges, a pale cut face (named `top`) with growth rings, roots. */
function treeStump(b: M, x: number, z: number, d: number, h: number, top = 'top'): M {
  b.cyl([d, h, d], [x, h / 2, z], { color: 'bark', taper: 0.9 })
    .cyl([d * 0.88, 0.02, d * 0.88], [x, h + 0.005, z], { color: '#e0c28a', name: top, edge: 'sharp' })
    .torus([d * 0.62, d * 0.62, 0.004], [x, h + 0.016, z], { color: '#b5814e', rot: [90, 0, 0], tube: 0.05, noInk: true, parent: top })
    .torus([d * 0.34, d * 0.34, 0.004], [x, h + 0.016, z], { color: '#b5814e', rot: [90, 0, 0], tube: 0.08, noInk: true, parent: top })
    .cyl([d * 0.08, 0.004, d * 0.08], [x, h + 0.016, z], { color: '#8c5a2b', parent: top, noInk: true });
  for (const [dx, dz] of around(5, d * 0.5, 0.4)) b.rod([x + dx * 0.7, h * 0.22, z + dz * 0.7], [x + dx * 1.45, 0.015, z + dz * 1.45], d * 0.2, 'bark');
  for (const [dx, dz] of around(6, d * 0.5, 0.1)) b.box([d * 0.06, h * 0.8, d * 0.06], [x + dx * 0.97, h * 0.45, z + dz * 0.97], { color: '#5e3d26', rot: [0, (-Math.atan2(dz, dx) * 180) / Math.PI, 0], noInk: true });
  return b;
}

/**
 * One metro car centred at z0 (length len, nose to +z): stainless body with a blue stripe, a row of windows, three
 * pairs of sliding doors a side (door* slide movers that part), bogies with wheels. cab 'front' / 'back' gives that
 * end a driving cab with a windscreen, headlights (light movers) and a route sign.
 */
function metroCar(b: M, z0: number, len: number, id: string, cab: 'front' | 'back' | null): M {
  const W = 2.9, fl = 1.1, H = 3.6, ss = '#c9ccd1';
  b.box([W, H - 0.9, len], [0, (H + 0.9) / 2, z0], { color: ss, round: 0.1 })
    .box([W * 0.86, 0.25, len - 0.4], [0, H + 0.08, z0], { color: '#b9bec2', round: 0.6 })
    .box([W + 0.02, 0.24, len - 0.1], [0, 1.6, z0], { color: '#2f6fd6', noInk: true })
    .box([W * 0.75, 0.45, len * 0.8], [0, 0.72, z0], { color: '#3a3633', round: 0.2 });
  const doorZ = [-len * 0.3, 0, len * 0.3];
  b.pair((s) => {
    const x = s * (W / 2 + 0.012), sd = s > 0 ? 'L' : 'R';
    doorZ.forEach((dz, i) => {
      for (const [k, sgn] of [['a', -1], ['b', 1]] as const) {
        const n = `door${id}${sd}${i}${k}`, zz = z0 + dz + sgn * 0.34;
        b.box([0.04, 1.95, 0.66], [x, fl + 0.98, zz], { color: '#b9bec2', round: 0.2, name: n, mover: { kind: 'slide', axis: 'z', amount: sgn * 0.62 } });
        b.box([0.05, 0.85, 0.42], [x, fl + 1.35, zz], { color: '#3d5a73', parent: n });
      }
    });
    for (const wz of [-len * 0.42, -len * 0.15, len * 0.15, len * 0.42]) {
      if (cab === 'front' && wz > len * 0.4) continue;
      if (cab === 'back' && wz < -len * 0.4) continue;
      b.box([0.04, 0.95, len * 0.17], [x, 2.45, z0 + wz], { color: '#3d5a73', round: 0.2 });
    }
  });
  for (const [k, bz] of [['F', len * 0.36], ['B', -len * 0.36]] as const) {
    b.box([2.3, 0.5, 2.6], [0, 0.45, z0 + bz], { color: '#2a2726', round: 0.2 });
    b.pair((s) => {
      for (const ax of [-0.85, 0.85]) wheel(b, `wheel${id}${k}${s > 0 ? 'L' : 'R'}${ax > 0 ? 1 : 2}`, s * 1.05, z0 + bz + ax, 0.8, 0.14, { spokes: 0, rim: '#5c6166', tyre: '#4a4744' });
    });
  }
  if (cab) {
    const e = cab === 'front' ? 1 : -1, ez = z0 + e * (len / 2 + 0.3);
    b.box([W, H - 0.9, 0.7], [0, (H + 0.9) / 2, ez], { color: ss, round: 0.45 })
      .box([W * 0.8, 1.2, 0.08], [0, 2.55, ez + e * 0.33], { color: '#3d5a73', rot: [e * -6, 0, 0], round: 0.3 })
      .label(id === 'A' ? '4 DOWNTOWN' : '4 UPTOWN', [1.4, 0.3], [0, 3.35, ez + e * 0.36], { color: '#2a2726', rot: [0, cab === 'front' ? 0 : 180, 0], depth: 0.03 });
    b.pair((s) => b.ball([0.28, 0.2, 0.08], [s * 0.95, 1.5, ez + e * 0.34], { color: '#fff6c8', name: `headlight${id}${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: false } }));
  } else {
    b.pair((e) => b.box([1.4, 2.4, 0.3], [0, 2.1, z0 + e * (len / 2 + 0.1)], { color: '#2a2726', round: 0.3 }));
  }
  return b;
}

export const ENTRIES: CatalogEntry[] = [
  // Stands on its forged head, handle up (0.9 m). Sharp steel head with struck faces, soft ash handle, rubber grip.
  // The act lifts the whole hammer and drops it: THUD.
  e('sledgehammer', 'workshop', 'hand tools', () =>
    m('sledgehammer', { edge: 'sharp' })
      .box([0.2, 0.085, 0.085], [0, 0.0425, 0], { color: 'iron', round: 0.2, name: 'head' })
      .box([0.012, 0.074, 0.074], [0.104, 0.0425, 0], { color: 'steel', round: 0.3, parent: 'head' })
      .box([0.012, 0.074, 0.074], [-0.104, 0.0425, 0], { color: 'steel', round: 0.3, parent: 'head' })
      .cyl([0.036, 0.012, 0.03], [0, 0.091, 0], { color: 'darkgray', parent: 'head' })
      .cyl([0.034, 0.72, 0.028], [0, 0.45, 0], { color: 'lightwood', parent: 'head', edge: 'soft' })
      .cyl([0.04, 0.17, 0.034], [0, 0.8, 0], { color: '#2a2726', parent: 'head', edge: 'soft' })
      .cyl([0.044, 0.02, 0.038], [0, 0.89, 0], { color: '#2a2726', parent: 'head', edge: 'soft' })
      .act({
        click: [
          [A.pose('head', { move: [0, 0.45, 0], rot: [0, 0, 25], dur: 0.6 }), A.pose('head', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.12 }), A.par(A.effect('dust', { dur: 1 }), A.anim('shake'), A.say('THUD!', 1.2))],
          [A.pose('head', { move: [0, 0.45, 0], rot: [0, 0, -25], dur: 0.6 }), A.pose('head', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.12 }), A.par(A.effect('sparkle', { dur: 0.8 }), A.say('CLANG!', 1.2))],
        ],
      })
      .done(),
  ),
  // Laid out flat: the vocabulary's 2 m is its length. A quilted mummy bag with a hood and a pillow; its top flap is
  // hinged along the zip and folds back to show the orange lining.
  e('sleeping bag', 'sports', 'camping gear', () => {
    const b = m('sleeping bag', { view: 'side' })
      .loft([0.82, 0.2, 2.05], [0, 0.1, 0], [[0, 0.55, 0.55, -0.1], [0.12, 0.72, 0.8, -0.05], [0.55, 1, 1, 0], [0.85, 0.96, 0.95, 0], [1, 0.72, 0.75, 0]], { color: 'navy', boxy: 0.4, name: 'bag' })
      .box([0.6, 0.008, 1.25], [0, 0.202, -0.05], { color: '#f0923b', round: 0.5, parent: 'bag', noInk: true })
      .ball([0.78, 0.3, 0.5], [0, 0.13, 0.82], { color: 'navy', parent: 'bag' })
      .ball([0.5, 0.06, 0.32], [0, 0.26, 0.86], { color: '#1e2f55', parent: 'bag', noInk: true })
      .ball([0.42, 0.12, 0.26], [0, 0.25, 0.86], { color: 'white', parent: 'bag' })
      .box([0.66, 0.03, 1.3], [0.0, 0.226, -0.05], { color: 'navy', round: 0.6, name: 'flap', pivot: [-0.33, 0.226, -0.05], mover: { kind: 'swing', axis: 'z', amount: 115 } })
      .stick([0.33, 0.224, -0.7], [0.33, 0.224, 0.6], 0.012, 'silver', { parent: 'flap', noInk: true });
    b.each(5, (i) => b.box([0.67, 0.008, 0.02], [0, 0.242, -0.6 + i * 0.27], { color: '#24407a', parent: 'flap', noInk: true }));
    b.each(3, (i) => b.box([0.55, 0.008, 0.02], [0, 0.17, -0.95 + i * 0.12], { color: '#24407a', parent: 'bag', noInk: true }));
    return b
      .act({ click: [[A.operate('flap', 'open'), A.say('Zzzzip!', 1.5)], [A.operate('flap', 'close'), A.say('Zzz...', 2)]] })
      .done();
  }),
  // A brown pharmacy bottle of sleeping pills with a child-proof cap that comes off, two capsules beside it.
  e('sleeping pill', 'clinic', 'medicine', () =>
    m('sleeping pill')
      .cyl([0.045, 0.07, 0.045], [0, 0.035, 0], { color: '#c06a1e', name: 'bottle' })
      .cyl([0.047, 0.042, 0.047], [0, 0.034, 0], { color: 'white', parent: 'bottle', noInk: true })
      .label('Zzz', [0.03, 0.022], [0, 0.036, 0.0235], { color: 'white', parent: 'bottle', depth: 0.002 })
      .cyl([0.034, 0.008, 0.034], [0, 0.073, 0], { color: '#c06a1e', parent: 'bottle' })
      .cyl([0.05, 0.02, 0.05], [0, 0.084, 0], { color: 'white', name: 'cap', parent: 'bottle', piece: true, edge: 'sharp', segs: 24 })
      .cyl([0.044, 0.003, 0.044], [0, 0.0955, 0], { color: '#eeeeee', parent: 'cap', noInk: true })
      .capsule([0.012, 0.022, 0.012], [0.045, 0.006, 0.03], { color: '#4e8fd6', rot: [0, 30, 90] })
      .capsule([0.012, 0.022, 0.012], [0.056, 0.006, 0.024], { color: 'white', rot: [0, 30, 90] })
      .ball([0.014, 0.006, 0.014], [0.03, 0.003, 0.05], { color: 'white' })
      .act({ click: [[A.detach('cap', 'cap'), A.say('Pop!', 1)], [A.reattach('cap'), A.say('Zzz...', 1.8)]] })
      .done(),
  ),
  // A velvet pouch of magic sleeping powder tied with gold cord; a sparkling cloud of it puffs out when clicked.
  e('sleeping powder', 'fantasy', 'magic items', () =>
    m('sleeping powder')
      .ball([0.1, 0.09, 0.1], [0, 0.045, 0], { color: '#6a3fa0', name: 'pouch' })
      .cyl([0.044, 0.025, 0.044], [0, 0.093, 0], { color: '#6a3fa0', parent: 'pouch' })
      .torus([0.05, 0.05, 0.009], [0, 0.095, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.22, parent: 'pouch' })
      .cyl([0.064, 0.028, 0.064], [0, 0.118, 0], { color: '#7d4fb8', taper: 1.5, parent: 'pouch' })
      .rod([0.024, 0.095, 0.012], [0.05, 0.06, 0.04], 0.005, 'gold')
      .ball(0.01, [0.052, 0.056, 0.043], { color: 'gold' })
      .star(0.032, [0, 0.05, 0.05], { color: 'gold' })
      .ball([0.09, 0.012, 0.06], [0.07, 0.005, 0.05], { color: '#d9c4f5' })
      .ball(0.006, [0.09, 0.012, 0.06], { color: 'white', glow: true })
      .ball(0.005, [0.05, 0.011, 0.07], { color: 'white', glow: true })
      .ball([0.22, 0.16, 0.22], [0, 0.22, 0.02], { color: '#e6d6ff', name: 'puff', scale: 0, noInk: true })
      .act({
        click: [A.par(A.pose('puff', { scale: 1, dur: 0.6 }), A.effect('sparkle', { dur: 2.2 }), A.say('Zzz...', 2.2)), A.wait(1.6), A.pose('puff', { scale: 0, dur: 0.8 })],
      })
      .done(),
  ),
  // A playground slide: platform 1.5 m up with hoop guard rails, a ladder at the back and a 30-degree U-shaped chute
  // with a run-out at the bottom. A teddy bear goes down it.
  e('slide (toy)', 'toys', 'playground', () => {
    const a = Math.atan2(1.15, 2.0) / D, sa = Math.sin(a * D), ca = Math.cos(a * D);
    const frame = '#2f6fb0', chute = '#f6c23a';
    const b = m('slide (toy)', { view: 'side', edge: 'sharp' })
      .box([0.78, 0.07, 0.66], [0, 1.5, -1.22], { color: '#e0473b', round: 0.2 })
      .box([0.52, 0.04, 2.31], [0, 0.925, 0.1], { color: chute, rot: [a, 0, 0], round: 0.4 })
      .box([0.52, 0.04, 0.55], [0, 0.34, 1.37], { color: chute, rot: [6, 0, 0], round: 0.4 });
    b.pair((s) => {
      b.box([0.04, 0.2, 2.31], [s * 0.27, 0.925 + 0.08 * ca, 0.1 + 0.08 * sa], { color: '#f0923b', rot: [a, 0, 0], round: 0.6 });
      b.box([0.04, 0.16, 0.55], [s * 0.27, 0.41, 1.37], { color: '#f0923b', rot: [6, 0, 0], round: 0.6 });
      // platform posts (front ones carry hoop rails), ladder rails, chute legs
      b.stick([s * 0.36, 0, -0.92], [s * 0.36, 2.05, -0.92], 0.06, frame, { edge: 'soft' });
      b.stick([s * 0.36, 0, -1.52], [s * 0.36, 1.53, -1.52], 0.06, frame, { edge: 'soft' });
      b.arc([0.6, 1.2, 0.04], [s * 0.36, 1.55, -1.22], { color: frame, rot: [0, 90, 0], tube: 0.12, edge: 'soft' });
      b.stick([s * 0.26, 0, -2.0], [s * 0.26, 1.55, -1.56], 0.05, frame, { edge: 'soft' });
      b.rod([s * 0.26, 1.55, -1.56], [s * 0.26, 2.15, -1.4], 0.05, frame, { edge: 'soft' });
      b.stick([s * 0.22, 0, 0.55], [s * 0.22, 0.62, 0.55], 0.05, frame, { edge: 'soft' });
    });
    b.stick([-0.36, 2.0, -0.92], [0.36, 2.0, -0.92], 0.05, frame, { edge: 'soft' });
    b.each(5, (i) => {
      const t = (i + 1) / 6;
      b.stick([-0.26, t * 1.55, -2.0 + t * 0.44], [0.26, t * 1.55, -2.0 + t * 0.44], 0.035, 'silver', { edge: 'soft' });
    });
    // an unseen sled at the top of the chute: whatever sits on it rides down the slide when it is posed
    b.box([0.2, 0.02, 0.2], [0, 1.56, -1.0], { color: chute, name: 'sled', scale: 0 });
    return b
      .socket('top', [0, 1.56, -1.0], 'top', { part: 'sled', size: 0.6 })
      .act({
        click: [
          A.spawn('bear', 'teddy bear'),
          A.attach('bear', 'self', 'top'),
          A.wait(0.6),
          A.par(A.pose('sled', { move: [0, -1.15, 2.05], dur: 1.0 }), A.say('Wheee!', 1.6, 'bear')),
          A.pose('sled', { move: [0, -1.21, 2.6], dur: 0.35 }),
          A.wait(0.8),
          A.remove('bear', 'pop'),
          A.pose('sled', { move: [0, 0, 0], dur: 0 }),
        ],
      })
      .done();
  }),
  // A patio door set in a bit of wall: aluminium frame, a fixed pane at the back and a sliding pane in front that
  // runs open along its track. A doormat outside.
  e('sliding glass door', 'home', 'doors', () => {
    const fr = '#8f99a3', gl = '#a9dcf2';
    const b = m('sliding glass door', { edge: 'sharp' })
      .box([3.5, 0.45, 0.2], [0, 2.375, 0], { color: 'cream', round: 0.05 })
      .box([2.44, 0.08, 0.16], [0, 2.11, 0], { color: fr, round: 0.2 })
      .box([2.44, 0.05, 0.22], [0, 0.025, 0], { color: 'silver', round: 0.2 })
      .box([1.17, 2.02, 0.03], [-0.58, 1.07, -0.035], { color: gl, name: 'fixed' })
      .box([1.17, 2.02, 0.03], [0.58, 1.07, 0.035], { color: gl, name: 'panel', mover: { kind: 'slide', axis: 'x', amount: -1.05 } })
      .box([0.07, 2.04, 0.05], [1.12, 1.07, 0.035], { color: fr, parent: 'panel' })
      .box([0.07, 2.04, 0.05], [0.04, 1.07, 0.035], { color: fr, parent: 'panel' })
      .box([1.17, 0.07, 0.05], [0.58, 2.06, 0.035], { color: fr, parent: 'panel' })
      .box([1.17, 0.09, 0.05], [0.58, 0.09, 0.035], { color: fr, parent: 'panel' })
      .box([0.03, 0.3, 0.04], [1.02, 1.0, 0.075], { color: '#5c6166', parent: 'panel' })
      .box([0.07, 2.04, 0.05], [-1.12, 1.07, -0.035], { color: fr, parent: 'fixed' })
      .box([0.07, 2.04, 0.05], [-0.04, 1.07, -0.035], { color: fr, parent: 'fixed' })
      .box([1.17, 0.07, 0.05], [-0.58, 2.06, -0.035], { color: fr, parent: 'fixed' })
      .box([1.17, 0.09, 0.05], [-0.58, 0.09, -0.035], { color: fr, parent: 'fixed' })
      .box([1.0, 0.02, 0.6], [0.2, 0.01, 0.45], { color: '#8c5a2b', round: 0.3, edge: 'soft' })
      .label('WELCOME', [0.7, 0.16], [0.2, 0.021, 0.45], { color: '#8c5a2b', rot: [-90, 0, 0], depth: 0.003 });
    b.pair((s) => b.box([0.5, 2.6, 0.2], [s * 1.5, 1.3, 0], { color: 'cream', round: 0.05 }).box([0.06, 2.12, 0.18], [s * 1.2, 1.06, 0], { color: fr, round: 0.2 }));
    return b.act({ click: [A.operate('panel', 'open'), A.say('Swish!', 1.2), A.wait(2.2), A.operate('panel', 'close'), A.say('Thunk.', 1)] }).done();
  }),
  // A forked-branch slingshot (20 cm) with rubber bands and a leather pouch; the bands are hinged at the fork tips, so
  // pulling them back swings the pouch, and letting go fires a pebble.
  e('sling shot', 'armory', 'ranged weapons', () =>
    m('sling shot')
      .stick([0, 0, 0], [0, 0.1, 0], 0.024, 'wood')
      .cyl([0.028, 0.06, 0.028], [0, 0.045, 0], { color: 'leather' })
      .rod([0, 0.098, 0], [0.045, 0.19, 0], 0.019, 'wood')
      .rod([0, 0.098, 0], [-0.045, 0.19, 0], 0.019, 'wood')
      .cyl([0.022, 0.012, 0.022], [0.045, 0.19, 0], { color: '#7a3a2a' })
      .cyl([0.022, 0.012, 0.022], [-0.045, 0.19, 0], { color: '#7a3a2a' })
      .stick([0.045, 0.19, 0], [0.012, 0.135, -0.02], 0.01, '#b8432f', { name: 'bandL', pivot: [0.045, 0.19, 0] })
      .stick([-0.045, 0.19, 0], [-0.012, 0.135, -0.02], 0.01, '#b8432f', { name: 'bandR', pivot: [-0.045, 0.19, 0] })
      .box([0.03, 0.02, 0.012], [0, 0.133, -0.021], { color: 'leather', parent: 'bandL', round: 0.5 })
      .ball(0.013, [0, 0.133, -0.03], { color: 'stone', parent: 'bandL' })
      .act({
        click: [
          A.par(A.pose('bandL', { rot: [70, 0, 0], dur: 0.7 }), A.pose('bandR', { rot: [70, 0, 0], dur: 0.7 })),
          A.wait(0.3),
          A.par(A.pose('bandL', { rot: [0, 0, 0], dur: 0.08 }), A.pose('bandR', { rot: [0, 0, 0], dur: 0.08 }), A.spawn('p', 'spitball', { rel: 'front', of: 'self', dist: 'touch' }), A.say('Thwack!', 1.2)),
          A.move('p', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }),
          A.remove('p', 'fade'),
        ],
      })
      .done(),
  ),
  // Fluffy bunny slippers on soft soles; they shuffle forward and back.
  e('slippers', 'wardrobe', 'shoes', () => {
    const b = m('slippers');
    b.pair((s) => {
      const x = s * 0.07, n = s > 0 ? 'slipperL' : 'slipperR';
      b.box([0.105, 0.024, 0.27], [x, 0.012, 0], { color: '#e8d9c4', round: 0.7, name: n })
        .ball([0.106, 0.085, 0.17], [x, 0.048, 0.045], { color: '#f6c6d6', parent: n })
        .box([0.104, 0.045, 0.08], [x, 0.036, -0.095], { color: '#f6c6d6', round: 0.8, parent: n })
        .ball([0.08, 0.016, 0.12], [x, 0.03, -0.045], { color: 'white', parent: n, noInk: true })
        .capsule([0.026, 0.085, 0.014], [x + 0.02, 0.12, 0.065], { color: '#f6c6d6', rot: [-25, 0, -12], parent: n })
        .capsule([0.026, 0.085, 0.014], [x - 0.02, 0.12, 0.065], { color: '#f6c6d6', rot: [-25, 0, 12], parent: n })
        .ball(0.012, [x + 0.022, 0.07, 0.125], { color: '#2a2726', parent: n, eye: true })
        .ball(0.012, [x - 0.022, 0.07, 0.125], { color: '#2a2726', parent: n, eye: true })
        .ball(0.018, [x, 0.055, 0.135], { color: '#e46a9a', parent: n });
    });
    return b
      .act({
        click: [
          [A.pose('slipperL', { move: [0, 0.03, 0.14], dur: 0.35 }), A.pose('slipperL', { move: [0, 0, 0.14], dur: 0.15 }), A.pose('slipperR', { move: [0, 0.03, 0.14], dur: 0.35 }), A.pose('slipperR', { move: [0, 0, 0.14], dur: 0.15 }), A.say('Pad, pad.', 1.2)],
          [A.pose('slipperL', { move: [0, 0.03, 0], dur: 0.35 }), A.pose('slipperL', { move: [0, 0, 0], dur: 0.15 }), A.pose('slipperR', { move: [0, 0.03, 0], dur: 0.35 }), A.pose('slipperR', { move: [0, 0, 0], dur: 0.15 }), A.say('Pad, pad.', 1.2)],
        ],
      })
      .done();
  }),
  // Pig swill in a wooden trough (1.2 m): a pig trots over for it.
  e('slop', 'farm', 'farm things', () => {
    const b = m('slop', { edge: 'sharp' })
      .box([1.2, 0.05, 0.22], [0, 0.07, 0], { color: 'darkwood', round: 0.2 })
      .box([1.08, 0.05, 0.32], [0, 0.25, 0], { color: '#8a7344', round: 0.8, edge: 'soft', name: 'swill' })
      .ball([0.09, 0.03, 0.07], [0.3, 0.28, 0.03], { color: 'orange', parent: 'swill', edge: 'soft' })
      .ball([0.07, 0.025, 0.05], [-0.2, 0.28, -0.05], { color: '#9bbf5a', parent: 'swill', edge: 'soft' })
      .ball([0.1, 0.03, 0.06], [-0.4, 0.28, 0.06], { color: '#cfa96a', parent: 'swill', edge: 'soft' })
      .ball([0.05, 0.02, 0.05], [0.05, 0.28, 0.08], { color: '#e8e0c0', parent: 'swill', edge: 'soft' })
      .ball(0.025, [0.12, 0.285, -0.06], { color: '#b8a874', parent: 'swill', edge: 'soft' });
    b.pair((s) => {
      b.box([1.2, 0.3, 0.035], [0, 0.2, s * 0.16], { color: 'wood', rot: [s * 22, 0, 0], round: 0.2 });
      b.box([0.04, 0.32, 0.46], [s * 0.6, 0.2, 0], { color: 'darkwood', round: 0.2 });
      b.box([0.08, 0.06, 0.6], [s * 0.45, 0.03, 0], { color: 'darkwood', round: 0.2 });
    });
    return b
      .act({
        click: [A.spawn('pig', 'pig', { rel: 'left', of: 'self', dist: 'near' }), A.move('pig', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'walk' }), A.par(A.say('Oink oink!', 1.8, 'pig'), A.anim('wobble')), A.wait(1.5), A.remove('pig', 'fade')],
      })
      .done();
  }),
  // A one-armed bandit (1.75 m): cabinet with a rounded topper lamp, three reels behind a bezel, a pay table, buttons,
  // a coin tray and the arm on its side. Pull the arm: the reels spin and stop on 7-7-7.
  e('slot machine', 'toys', 'casino games', () => {
    const b = m('slot machine', { edge: 'sharp' })
      .box([0.72, 0.62, 0.62], [0, 0.31, 0], { color: '#8a1f24', round: 0.08 })
      .box([0.7, 0.9, 0.55], [0, 1.07, -0.02], { color: '#d0302a', round: 0.08 })
      .cyl([0.5, 0.7, 0.5], [0, 1.52, -0.02], { color: 'gold', rot: [0, 0, 90] })
      .cyl([0.4, 0.72, 0.4], [0, 1.52, -0.02], { color: '#d0302a', rot: [0, 0, 90] })
      .label('JACKPOT', [0.6, 0.16], [0, 1.6, 0.2], { color: 'gold', rot: [-20, 0, 0], depth: 0.03 })
      .dome([0.22, 0.14, 0.22], [0, 1.76, -0.02], { color: '#ffe066', name: 'topper', mover: { kind: 'light', on: false } })
      .box([0.6, 0.36, 0.06], [0, 1.12, 0.25], { color: '#1e1c1b', round: 0.2 })
      .box([0.64, 0.05, 0.07], [0, 1.31, 0.27], { color: 'gold', round: 0.4 })
      .box([0.64, 0.05, 0.07], [0, 0.93, 0.27], { color: 'gold', round: 0.4 })
      .label('LUCKY 7s  PAY 777', [0.56, 0.16], [0, 0.8, 0.265], { color: '#2f4f8f', depth: 0.02 })
      .box([0.7, 0.08, 0.2], [0, 0.65, 0.33], { color: '#5c1a1e', round: 0.3 })
      .box([0.5, 0.12, 0.14], [0, 0.22, 0.34], { color: 'silver', round: 0.3 })
      .box([0.44, 0.06, 0.1], [0, 0.26, 0.35], { color: '#2a2726', round: 0.3 })
      .box([0.04, 0.09, 0.02], [0.25, 0.86, 0.29], { color: '#2a2726' })
      .cyl([0.13, 0.12, 0.13], [0.39, 1.0, 0.02], { color: 'silver', rot: [0, 0, 90] })
      .stick([0.42, 1.0, 0.02], [0.44, 1.52, 0.02], 0.035, 'silver', { name: 'lever', pivot: [0.42, 1.0, 0.02], mover: { kind: 'swing', axis: 'x', amount: 70 } })
      .ball(0.1, [0.44, 1.55, 0.02], { color: '#e0473b', parent: 'lever' });
    const sym = ['7', '7', '7'];
    b.each(3, (i) => {
      const xx = -0.19 + i * 0.19;
      b.cyl([0.27, 0.16, 0.27], [xx, 1.12, 0.14], { color: '#f7f5ef', rot: [0, 0, 90], name: `reel${i + 1}`, mover: { kind: 'spin', axis: 'x', amount: 900 } });
      b.label(sym[i], [0.1, 0.11], [xx, 1.12, 0.278], { color: '#f7f5ef', parent: `reel${i + 1}`, depth: 0.01 });
      b.label(['BAR', 'BAR', 'BAR'][i], [0.12, 0.06], [xx, 1.25, 0.15], { color: '#f7f5ef', rot: [-90, 0, 0], parent: `reel${i + 1}`, depth: 0.01 });
      b.box([0.11, 0.05, 0.05], [-0.2 + i * 0.2, 0.68, 0.43], { color: ['#ffd24a', '#9be34d', '#6fd3e8'][i], glow: true, round: 0.5 });
    });
    b.each(4, (i) => b.ball(0.035, [-0.3 + i * 0.2, 1.37, 0.22], { color: 'white', glow: true }));
    return b
      .socket('tray', [0, 0.27, 0.36], 'top', { size: 0.3 })
      .act({
        click: [
          [A.operate('lever', 'on'), A.par(A.operate('reels', 'on'), A.say('Clunk!', 1)), A.operate('lever', 'off'), A.wait(1.4), A.operate('reels', 'off'), A.par(A.operate('topper', 'on'), A.effect('sparkle', { dur: 2 }), A.say('7 - 7 - 7  JACKPOT!', 2.2)), A.wait(1.2), A.operate('topper', 'off')],
          [A.operate('lever', 'on'), A.par(A.operate('reels', 'on'), A.say('Clunk!', 1)), A.operate('lever', 'off'), A.wait(1.8), A.operate('reels', 'off'), A.say('Cherry, bell, lemon... no luck.', 2)],
        ],
      })
      .done();
  }),
  // A slotted serving spoon (33 cm) standing on its handle: steel bowl with three drain slots, a hanging hole.
  e('slotted spoon', 'kitchen', 'utensils', () => {
    const b = m('slotted spoon', { edge: 'sharp' })
      .box([0.028, 0.18, 0.012], [0, 0.09, 0], { color: '#2a2726', round: 0.9 })
      .torus([0.014, 0.014, 0.013], [0, 0.03, 0.0], { color: '#5c6166', tube: 0.25 })
      .box([0.014, 0.06, 0.006], [0, 0.205, 0], { color: 'steel', round: 0.6 })
      .ball([0.085, 0.105, 0.022], [0, 0.275, 0.006], { color: 'silver' });
    b.each(3, (i) => b.box([0.009, 0.06, 0.006], [-0.022 + i * 0.022, 0.275, 0.016], { color: '#3a3f45', round: 0.9, noInk: true }));
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('water_spray', { dur: 1.2 })), A.say('Drip, drip.', 1.4)] }).done();
  }),
  // A puddle of grey slush on wet tarmac: half-melted lumps of dirty snow.
  e('slush', 'nature', 'snow and ice', () => {
    const b = m('slush')
      .cyl([0.9, 0.012, 0.65], [0, 0.006, 0], { color: '#5d7584', segs: 9 })
      .cyl([0.62, 0.014, 0.42], [0.05, 0.008, 0.02], { color: '#7f98a6', segs: 7, noInk: true });
    const lumps: Array<[number, number, number, number, string]> = [[-0.18, 0.02, 0.26, 0.09, '#c9cfcf'], [0.14, 0.08, 0.18, 0.07, '#b8bfc0'], [0.05, -0.14, 0.15, 0.06, '#d6dcdc'], [0.3, -0.06, 0.12, 0.05, '#aab2b4'], [-0.32, -0.12, 0.1, 0.04, '#d0d5d6']];
    for (const [x, z, d, h, c] of lumps) b.ball([d, h, d * 0.8], [x, h * 0.35, z], { color: c });
    b.ball(0.016, [-0.12, 0.05, 0.06], { color: '#6b5a3a', noInk: true }).ball(0.012, [0.17, 0.04, 0.12], { color: '#6b5a3a', noInk: true });
    return b.act({ click: [A.par(A.effect('water_spray', { dur: 1 }), A.anim('wobble'), A.say('Splosh!', 1.2))] }).done();
  }),
  // A slushy in a tall cup (15 cm), red slush heaped over the rim with a spoon-straw; slurping takes the heap down.
  e('slushy', 'food', 'drinks', () =>
    m('slushy')
      .cyl([0.064, 0.04, 0.064], [0, 0.02, 0], { color: '#3f6fd6', taper: 1.06 })
      .cyl([0.069, 0.065, 0.069], [0, 0.0725, 0], { color: '#e0303b', taper: 1.1 })
      .cyl([0.068, 0.012, 0.068], [0, 0.045, 0], { color: 'white', taper: 1.02, noInk: true })
      .label('ICE!', [0.04, 0.022], [0, 0.075, 0.036], { color: 'white', depth: 0.002 })
      .torus([0.078, 0.078, 0.008], [0, 0.106, 0], { color: 'white', rot: [90, 0, 0], tube: 0.12 })
      .dome([0.074, 0.045, 0.074], [0, 0.1265, 0], { color: '#ff5a6a', name: 'slush', pivot: [0, 0.104, 0] })
      .stick([0.012, 0.07, 0.005], [0.03, 0.2, 0.01], 0.008, '#ffd24a', { name: 'straw' })
      .box([0.016, 0.004, 0.022], [0.012, 0.072, 0.005], { color: '#ffd24a', parent: 'straw' })
      .act({
        click: [
          [A.par(A.say('Slurrrp!', 1.6), A.pose('slush', { scale: 0.45, dur: 1.5 }), A.pose('straw', { move: [0, -0.02, 0], dur: 1.5 }))],
          [A.par(A.effect('snow', { dur: 1.2 }), A.anim('shake'), A.say('Brrrr!', 1.4)), A.par(A.pose('slush', { scale: 1, dur: 0.5 }), A.pose('straw', { move: [0, 0, 0], dur: 0.5 }))],
        ],
      })
      .done(),
  ),
  // A little box of .22 rounds (2.5 cm cartridges): brass cases, copper bullets, the box lid open on its hinge.
  e('small bullet', 'armory', 'ammunition', () => {
    const b = m('small bullet', { edge: 'sharp' })
      .box([0.07, 0.028, 0.04], [0, 0.014, 0], { color: '#2f6f3a', round: 0.1 })
      .label('.22', [0.03, 0.014], [0, 0.014, 0.0205], { color: '#2f6f3a', depth: 0.002 })
      .box([0.07, 0.004, 0.04], [0, 0.048, -0.0165], { color: '#2f6f3a', rot: [-80, 0, 0], round: 0.1, name: 'lid', pivot: [0, 0.028, -0.02], mover: { kind: 'swing', axis: 'x', amount: 80 } });
    b.each(4, (i) => {
      const x = -0.024 + i * 0.016, n = `round${i + 1}`;
      b.cyl([0.0068, 0.018, 0.0068], [x, 0.028, 0.004], { color: 'brass', name: n, edge: 'soft' })
        .cyl([0.0058, 0.006, 0.0058], [x, 0.04, 0.004], { color: 'copper', parent: n, edge: 'soft' })
        .ball([0.0058, 0.006, 0.0058], [x, 0.0435, 0.004], { color: 'copper', parent: n, edge: 'soft' });
    });
    b.cyl([0.0068, 0.018, 0.0068], [0.05, 0.0034, 0.03], { color: 'brass', rot: [0, 40, 90], edge: 'soft', name: 'loose' })
      .cyl([0.0058, 0.008, 0.0058], [0.043, 0.0034, 0.04], { color: 'copper', rot: [0, 40, 90], parent: 'loose', edge: 'soft' });
    return b.act({ click: [[A.operate('lid'), A.say('Click.', 1)], [A.operate('lid'), A.anim('hop'), A.say('Clink!', 1)]] }).done();
  }),
  // A model rocket (35 cm) on its launch pad and rod. It blasts off, pops its parachute and floats back down.
  e('small rocket', 'toys', 'flying toys', () => {
    const b = m('small rocket', { edge: 'sharp' })
      .cyl([0.22, 0.02, 0.22], [0, 0.06, 0], { color: '#5c6166', segs: 6 })
      .cyl([0.12, 0.01, 0.12], [0, 0.075, 0], { color: 'silver' })
      .stick([0, 0.07, -0.03], [0, 0.7, -0.03], 0.005, 'silver');
    for (const [x, z] of around(3, 0.12, Math.PI / 2)) b.rod([x * 0.4, 0.06, z * 0.4], [x, 0, z], 0.012, '#5c6166');
    b.cyl([0.042, 0.26, 0.042], [0, 0.22, 0], { color: 'white', name: 'rocket', edge: 'soft' })
      .cone([0.042, 0.1, 0.042], [0, 0.4, 0], { color: '#e0473b', parent: 'rocket', edge: 'soft' })
      .cyl([0.043, 0.03, 0.043], [0, 0.3, 0], { color: '#2f4f8f', parent: 'rocket' })
      .cyl([0.043, 0.012, 0.043], [0, 0.12, 0], { color: '#2a2726', parent: 'rocket' })
      .cyl([0.012, 0.015, 0.012], [0, 0.083, 0], { color: '#2a2726', parent: 'rocket' })
      .cyl([0.008, 0.02, 0.008], [0, 0.2, -0.024], { color: 'silver', parent: 'rocket' })
      .label('X-1', [0.018, 0.045], [0, 0.22, 0.0215], { color: 'white', parent: 'rocket', depth: 0.002 });
    for (const [xx, zz] of around(3, 0.042, Math.PI / 2)) b.box([0.05, 0.075, 0.004], [xx, 0.13, zz], { color: '#e0473b', rot: [0, -Math.atan2(zz, xx) / D, 0], parent: 'rocket' });
    b.dome([0.34, 0.16, 0.34], [0, 0.6, 0], { color: '#f0923b', name: 'chute', parent: 'rocket', scale: 0, edge: 'soft' });
    return b
      .act({
        click: [A.par(A.effect('smoke', { dur: 1.8 }), A.effect('fire', { dur: 0.6 })), A.par(A.pose('rocket', { move: [0, 9, 0], dur: 1.2 }), A.say('Whoosh!', 1.5)), A.pose('chute', { scale: 1, dur: 0.3 }), A.pose('rocket', { move: [0, 0, 0], dur: 3 }), A.pose('chute', { scale: 0, dur: 0.3 })],
      })
      .done();
  }),
  // A smartphone (15 cm) leaning on a desk stand: glass screen (a light) with app tiles, camera, side buttons. It
  // rings and buzzes, then its screen goes dark, then wakes.
  e('smart phone', 'tech', 'phones', () => {
    const t = -12, c = Math.cos(t * D), s = Math.sin(t * D);
    const P = (x: number, y: number, z: number): V => [x, 0.11 + y * c - z * s, 0.0 + y * s + z * c];
    const b = m('smart phone', { edge: 'sharp' })
      .box([0.09, 0.012, 0.07], [0, 0.006, 0], { color: '#5c6166', round: 0.4 })
      .box([0.08, 0.05, 0.012], [0, 0.03, -0.02], { color: '#5c6166', rot: [-12, 0, 0], round: 0.4 })
      .box([0.074, 0.154, 0.008], P(0, 0, 0), { color: '#2a2726', rot: [t, 0, 0], round: 0.5, name: 'phone' })
      .box([0.066, 0.142, 0.002], P(0, 0, 0.0045), { color: '#3a7bd5', rot: [t, 0, 0], name: 'screen', mover: { kind: 'light', on: true }, parent: 'phone' })
      .cyl([0.008, 0.002, 0.008], P(0, 0.064, 0.005), { color: '#1e1c1b', rot: [t + 90, 0, 0], parent: 'phone' })
      .box([0.003, 0.02, 0.004], P(0.0385, 0.03, 0), { color: '#5c6166', rot: [t, 0, 0], parent: 'phone' })
      .box([0.003, 0.012, 0.004], P(-0.0385, 0.04, 0), { color: '#5c6166', rot: [t, 0, 0], parent: 'phone' });
    const cols = ['#e0473b', '#9be34d', '#f6d24a', '#f0923b', '#f4a1c0', '#f7f5ef', '#6fd3e8', '#8a5fc4', '#5aa553'];
    b.box([0.013, 0.013, 0.002], P(-0.019, 0.045, 0.0062), { color: cols[0], rot: [t, 0, 0], parent: 'phone', name: 'apps', noInk: true });
    b.each(8, (i) => b.box([0.013, 0.013, 0.002], P(-0.019 + ((i + 1) % 3) * 0.019, 0.045 - Math.floor((i + 1) / 3) * 0.022, 0.0062), { color: cols[i + 1], rot: [t, 0, 0], parent: 'apps', noInk: true }));
    return b
      .act({
        click: [
          [A.par(A.anim('shake', 3), A.say('Bzzz! Ring ring!', 2))],
          [A.par(A.operate('screen', 'off'), A.pose('apps', { scale: 0, dur: 0 })), A.say('Click.', 1)],
          [A.par(A.operate('screen', 'on'), A.pose('apps', { scale: 1, dur: 0 })), A.say('Ding!', 1)],
        ],
      })
      .done();
  }),
  // A smartwatch on a shop display stand: a dark velvet pillow on a black base, the coral sport band looped round
  // it, and the crisp silver squircle case at the front with its black glass, screen (a light), crown and side
  // button. Its screen shows your heart rate.
  e('smart watch', 'tech', 'gadgets', () =>
    m('smart watch')
      .box([0.09, 0.012, 0.07], [0, 0.006, 0], { color: '#2a2726', round: 0.4, edge: 'sharp' })
      .ball([0.05, 0.052, 0.046], [0, 0.04, -0.002], { color: '#3a3633' })
      .torus([0.058, 0.064, 0.024], [0, 0.042, 0], { color: '#e8705a', rot: [0, 90, 0], tube: 0.12 })
      .box([0.027, 0.012, 0.007], [0, 0.042, -0.031], { color: '#c85a48', round: 0.4 })
      .box([0.04, 0.047, 0.012], [0, 0.043, 0.035], { color: '#c9ccd1', round: 0.55, edge: 'sharp', name: 'case' })
      .box([0.036, 0.043, 0.002], [0, 0.043, 0.0415], { color: '#14181c', round: 0.5, parent: 'case', edge: 'sharp', noInk: true })
      .box([0.03, 0.036, 0.001], [0, 0.043, 0.0428], { color: '#3fe0c8', round: 0.4, parent: 'case', name: 'screen', mover: { kind: 'light', on: false }, edge: 'sharp' })
      .cyl([0.008, 0.006, 0.008], [0.0225, 0.05, 0.034], { color: 'silver', rot: [0, 0, 90], parent: 'case', edge: 'sharp' })
      .box([0.003, 0.012, 0.005], [0.021, 0.034, 0.034], { color: 'silver', round: 0.4, parent: 'case', edge: 'sharp' })
      .act({
        click: [
          [A.operate('screen', 'on'), A.par(A.effect('hearts', { dur: 1.6 }), A.say('72 bpm', 1.8))],
          [A.par(A.anim('shake', 2), A.say('Bzz bzz! 10,000 steps!', 1.8)), A.operate('screen', 'off')],
        ],
      })
      .done(),
  ),
  // A smoke bomb: a green canister with a pull pin and ring. Pull the pin: thick smoke.
  e('smoke bomb', 'toys', 'fireworks', () =>
    m('smoke bomb')
      .cyl([0.042, 0.065, 0.042], [0, 0.0325, 0], { color: '#3f6a3a', name: 'can' })
      .cyl([0.044, 0.016, 0.044], [0, 0.034, 0], { color: '#f6d24a', parent: 'can', noInk: true })
      .label('SMOKE', [0.03, 0.01], [0, 0.034, 0.022], { color: '#f6d24a', parent: 'can', depth: 0.002 })
      .cyl([0.044, 0.012, 0.044], [0, 0.071, 0], { color: '#9da3a8', parent: 'can', edge: 'sharp' })
      .box([0.008, 0.04, 0.01], [0.022, 0.06, 0], { color: '#9da3a8', parent: 'can', edge: 'sharp' })
      .stick([-0.002, 0.077, 0], [0.012, 0.077, 0], 0.004, 'silver', { name: 'pin', parent: 'can', piece: true })
      .torus([0.022, 0.022, 0.004], [-0.014, 0.077, 0], { color: 'silver', tube: 0.18, parent: 'pin', rot: [90, 0, 0] })
      .act({ click: [[A.detach('pin', 'pin'), A.par(A.effect('smoke', { dur: 3.5 }), A.say('Fssssss...', 2.5)), A.wait(2.5)], [A.reattach('pin'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A ceiling smoke alarm shown on a square of ceiling tile, face out: vented cover, test button, red LED (a light).
  e('smoke detector', 'home', 'safety', () =>
    m('smoke detector', { edge: 'sharp' })
      .box([0.2, 0.2, 0.015], [0, 0.1, -0.03], { color: '#efece4', round: 0.2 })
      .cyl([0.13, 0.03, 0.13], [0, 0.1, -0.008], { color: 'white', rot: [90, 0, 0], edge: 'soft' })
      .cyl([0.1, 0.02, 0.1], [0, 0.1, 0.014], { color: '#f7f5ef', rot: [90, 0, 0], taper: 0.8, edge: 'soft' })
      .torus([0.106, 0.106, 0.006], [0, 0.1, 0.008], { color: '#9da3a8', tube: 0.06, noInk: true })
      .torus([0.078, 0.078, 0.004], [0, 0.1, 0.02], { color: '#c9ccd1', tube: 0.05, noInk: true })
      .cyl([0.026, 0.01, 0.026], [0, 0.1, 0.027], { color: '#d4d7da', rot: [90, 0, 0], name: 'button' })
      .ball(0.009, [0.034, 0.124, 0.022], { color: '#ff3b2f', name: 'led', mover: { kind: 'light', on: false } })
      .act({
        click: [
          [A.operate('led', 'on'), A.par(A.say('BEEP! BEEP! BEEP!', 2.5), A.anim('shake', 3)), A.operate('led', 'off')],
          [A.pose('button', { move: [0, 0, -0.005], dur: 0.12 }), A.pose('button', { move: [0, 0, 0], dur: 0.12 }), A.operate('led', 'on'), A.say('Chirp!', 1), A.operate('led', 'off')],
        ],
      })
      .done(),
  ),
  // A s'more: graham crackers, a square of chocolate and a toasted marshmallow oozing out. The top cracker lifts.
  e('smore', 'food', 'desserts', () => {
    const g = '#d49a55';
    const b = m('smore')
      .box([0.065, 0.01, 0.065], [0, 0.005, 0], { color: g, round: 0.2, edge: 'sharp' })
      .box([0.05, 0.007, 0.05], [0, 0.0135, 0], { color: 'chocolate', round: 0.15, edge: 'sharp' })
      .cyl([0.056, 0.026, 0.056], [0, 0.03, 0], { color: '#f6ead0' })
      .cyl([0.058, 0.008, 0.058], [0, 0.042, 0], { color: '#d9a35f', noInk: true })
      .ball([0.022, 0.016, 0.014], [0.03, 0.022, 0.024], { color: '#f6ead0' })
      .ball([0.016, 0.014, 0.012], [-0.028, 0.024, 0.026], { color: '#f6ead0' })
      .box([0.065, 0.01, 0.065], [0, 0.051, 0], { color: g, round: 0.2, edge: 'sharp', name: 'top' });
    for (const [xx, zz] of [[-0.016, -0.016], [0.016, -0.016], [-0.016, 0.016], [0.016, 0.016]]) b.ball(0.004, [xx, 0.0565, zz], { color: '#9a6a3a', parent: 'top', noInk: true });
    b.box([0.001, 0.0015, 0.06], [0, 0.0565, 0], { color: '#b07a40', parent: 'top', noInk: true });
    return b
      .act({ click: [[A.pose('top', { move: [0, 0.035, 0], rot: [0, 0, -22], dur: 0.5 }), A.say('Mmm, gooey!', 1.5)], [A.pose('top', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 }), A.say('Crunch!', 1)]] })
      .done();
  }),
  // A snorkel mask on a foam display head: silicone skirt, tempered glass lens in a frame, nose pocket, strap round
  // the head and the J-shaped snorkel clipped to it. Blows water out of the top.
  e('snorkeler (mask)', 'sports', 'swim gear', () =>
    m('snorkeler (mask)')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.06, 0.16, 0.06], [0, 0.1, 0], { color: '#c9c4ba' })
      .ball([0.17, 0.22, 0.19], [0, 0.29, 0], { color: '#ddd8cf' })
      .box([0.17, 0.09, 0.05], [0, 0.32, 0.085], { color: '#2a2726', round: 0.7 })
      .box([0.15, 0.064, 0.012], [0, 0.325, 0.112], { color: '#bfe6f5', round: 0.4, edge: 'sharp' })
      .box([0.16, 0.012, 0.016], [0, 0.36, 0.112], { color: '#5c6166', round: 0.4, edge: 'sharp' })
      .box([0.16, 0.012, 0.016], [0, 0.29, 0.112], { color: '#5c6166', round: 0.4, edge: 'sharp' })
      .ball([0.05, 0.045, 0.04], [0, 0.285, 0.11], { color: '#2a2726' })
      .torus([0.2, 0.21, 0.022], [0, 0.32, -0.01], { color: '#2a2726', rot: [90, 0, 0], tube: 0.08 })
      .rod([0, 0.235, 0.1], [0.05, 0.225, 0.085], 0.018, '#f0923b')
      .rod([0.05, 0.225, 0.085], [0.1, 0.25, 0.03], 0.02, '#f0923b')
      .stick([0.1, 0.25, 0.03], [0.1, 0.52, 0.0], 0.022, '#f0923b')
      .cyl([0.032, 0.035, 0.032], [0.1, 0.535, 0.0], { color: '#f6d24a', edge: 'sharp' })
      .box([0.02, 0.025, 0.02], [0.095, 0.33, 0.02], { color: '#2a2726', round: 0.4 })
      .act({ click: [A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Pfffft!', 1.5))] })
      .done(),
  ),
  // A pair of long dive fins (65 cm) standing on their heels: rubber foot pockets, ribbed blades. They kick.
  e('snorkeling fins', 'sports', 'swim gear', () => {
    const b = m('snorkeling fins');
    b.pair((s) => {
      const x = s * 0.1, n = s > 0 ? 'finL' : 'finR', r = -s * 6;
      b.ball([0.1, 0.22, 0.12], [x, 0.11, 0], { color: '#2a2726', name: n, pivot: [x, 0, 0], rot: [0, 0, r] })
        .ball([0.06, 0.05, 0.05], [x, 0.21, 0.035], { color: '#1e1c1b', parent: n, noInk: true })
        .cyl([0.15, 0.44, 0.022], [x - Math.sin(r * D) * 0.44, 0.44, 0], { color: '#f6d24a', taper: 1.55, rot: [0, 0, r], parent: n, edge: 'sharp' })
        .stick([x - 0.06, 0.2, 0.012], [x - 0.11 - Math.sin(r * D) * 0.4, 0.64, 0.012], 0.016, '#2a2726', { parent: n, noInk: true })
        .stick([x + 0.06, 0.2, 0.012], [x + 0.11 - Math.sin(r * D) * 0.4, 0.64, 0.012], 0.016, '#2a2726', { parent: n, noInk: true });
    });
    return b
      .act({
        click: [A.par(A.pose('finL', { rot: [25, 0, 0], dur: 0.3 }), A.pose('finR', { rot: [-25, 0, 0], dur: 0.3 })), A.par(A.pose('finL', { rot: [-25, 0, 0], dur: 0.3 }), A.pose('finR', { rot: [25, 0, 0], dur: 0.3 })), A.par(A.pose('finL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('finR', { rot: [0, 0, 0], dur: 0.3 }), A.effect('water_spray', { dur: 1 }), A.say('Flap flap!', 1.2))],
      })
      .done();
  }),
  // A snowdrift (1.1 m) with wind-sculpted lumps and blue shadows. It snows on it, and a snowball pops out.
  e('snow', 'nature', 'snow and ice', () => {
    const b = m('snow')
      .ball([1.1, 0.4, 0.8], [0, 0.12, 0], { color: 'snow' })
      .ball([0.6, 0.36, 0.5], [0.25, 0.18, -0.08], { color: 'snow' })
      .ball([0.5, 0.3, 0.45], [-0.3, 0.15, 0.08], { color: '#eef4f8' })
      .ball([0.3, 0.14, 0.26], [0.42, 0.06, 0.24], { color: '#dfeaf2' })
      .ball([0.26, 0.1, 0.22], [-0.48, 0.04, -0.2], { color: '#dfeaf2' });
    for (const [xx, yy, zz] of [[0.1, 0.33, 0.12], [-0.22, 0.29, 0.2], [0.33, 0.3, 0.05], [0, 0.25, 0.3]] as V[]) b.ball(0.018, [xx, yy, zz], { color: 'white', glow: true });
    return b
      .act({
        click: [
          [A.effect('snow', { dur: 2.5 }), A.say('Fwump.', 1.2)],
          [A.spawn('sb', 'snowball', { rel: 'front', of: 'self', dist: 'touch' }), A.anim('hop', 2, 'sb'), A.wait(1.2), A.remove('sb', 'pop')],
        ],
      })
      .done();
  }),
  // A walk-behind snow blower: auger housing with a spiral auger (spins), a discharge chute that swivels, a red
  // engine, handlebars with controls, wheels and a headlight. Nose (the auger) to +z.
  e('snow blower', 'garden', 'garden machines', () => {
    const red = '#d0302a';
    const b = m('snow blower', { view: 'side', edge: 'sharp' })
      .box([0.66, 0.05, 0.36], [0, 0.48, 0.3], { color: red, round: 0.3 })
      .cyl([0.46, 0.66, 0.46], [0, 0.26, 0.2], { color: red, rot: [0, 0, 90] })
      .box([0.66, 0.24, 0.24], [0, 0.18, 0.24], { color: '#2a2726', round: 0.1 })
      .box([0.7, 0.03, 0.12], [0, 0.02, 0.42], { color: '#9da3a8', round: 0.3 })
      .cyl([0.06, 0.62, 0.06], [0, 0.24, 0.36], { color: '#5c6166', rot: [0, 0, 90], name: 'auger', mover: { kind: 'spin', axis: 'x', amount: 720 } });
    b.each(4, (i) => b.torus([0.36, 0.36, 0.04], [-0.24 + i * 0.16, 0.24, 0.36], { color: '#f6d24a', rot: [0, 90, 25 * (i % 2 ? 1 : -1)], tube: 0.18, parent: 'auger' }));
    b.pair((s) => b.box([0.03, 0.46, 0.34], [s * 0.34, 0.24, 0.3], { color: red, round: 0.3 }));
    b.cyl([0.13, 0.4, 0.13], [-0.12, 0.66, 0.22], { color: red, name: 'chute', pivot: [-0.12, 0.5, 0.22], mover: { kind: 'swing', axis: 'y', amount: 120 } })
      .box([0.16, 0.04, 0.2], [-0.12, 0.87, 0.28], { color: red, rot: [-30, 0, 0], parent: 'chute' })
      .box([0.46, 0.3, 0.42], [0, 0.42, -0.12], { color: red, round: 0.2 })
      .box([0.4, 0.14, 0.3], [0, 0.63, -0.12], { color: '#2a2726', round: 0.3 })
      .cyl([0.06, 0.04, 0.06], [0.12, 0.72, -0.15], { color: '#2a2726' })
      .ball([0.12, 0.08, 0.05], [0.15, 0.56, 0.12], { color: '#fff6c8', name: 'light', mover: { kind: 'light', on: false } })
      .stick([-0.24, 1.02, -0.72], [0.24, 1.02, -0.72], 0.035, '#2a2726', { edge: 'soft' });
    b.pair((s) => {
      b.rod([s * 0.2, 0.42, -0.25], [s * 0.24, 1.02, -0.7], 0.03, '#5c6166', { edge: 'soft' });
      b.box([0.02, 0.03, 0.18], [s * 0.2, 0.98, -0.62], { color: '#2a2726', rot: [20, 0, 0] });
      wheel(b, s > 0 ? 'wheelL' : 'wheelR', s * 0.3, -0.18, 0.34, 0.1, { spokes: 0 });
    });
    return b
      .act({
        click: [
          [A.par(A.operate('auger', 'on'), A.operate('light', 'on')), A.par(A.effect('snow', { dur: 2.5 }), A.say('Brrrrrrrm!', 2.2), A.anim('shake', 2)), A.wait(1), A.operate('auger', 'off')],
          [A.operate('chute'), A.say('Clunk.', 1), A.operate('light', 'off')],
        ],
      })
      .done();
  }),
  // A snow globe (15 cm) on a wooden base with a brass plaque and a music-box key. The glass is drawn as its back
  // half and a rim so the little snowy cottage and tree inside show. Shake it: snow, and the tune plays.
  e('snow globe', 'home', 'keepsakes', () =>
    m('snow globe')
      .cyl([0.11, 0.045, 0.11], [0, 0.0225, 0], { color: 'darkwood', taper: 0.85, edge: 'sharp' })
      .label('NOEL', [0.045, 0.014], [0, 0.022, 0.049], { color: 'gold', rot: [-6, 0, 0], depth: 0.003 })
      .cyl([0.094, 0.008, 0.094], [0, 0.049, 0], { color: 'gold', edge: 'sharp' })
      .dome([0.12, 0.06, 0.12], [0, 0.112, -0.03], { color: '#bfe6f5', rot: [-90, 0, 0], noInk: true })
      .torus([0.12, 0.12, 0.004], [0, 0.112, 0], { color: '#d6f0fa', tube: 0.04 })
      .dome([0.09, 0.022, 0.07], [0, 0.052, 0], { color: 'snow' })
      .box([0.026, 0.02, 0.02], [-0.012, 0.075, 0.012], { color: '#c87a4a', edge: 'sharp' })
      .wedge([0.03, 0.014, 0.024], [-0.012, 0.092, 0.012], { color: '#a3322a', edge: 'sharp' })
      .box([0.007, 0.01, 0.002], [-0.012, 0.071, 0.023], { color: '#ffd24a', glow: true })
      .cone([0.026, 0.045, 0.026], [0.022, 0.085, 0.0], { color: 'darkgreen' })
      .ball(0.006, [0.03, 0.14, 0.02], { color: 'white', noInk: true })
      .ball(0.005, [-0.03, 0.13, 0.025], { color: 'white', noInk: true })
      .ball(0.005, [0.0, 0.155, 0.01], { color: 'white', noInk: true })
      .box([0.008, 0.03, 0.004], [0, 0.03, -0.06], { color: 'brass', name: 'crank', pivot: [0, 0.03, -0.058], mover: { kind: 'spin', axis: 'z', amount: 360 }, edge: 'sharp' })
      .act({ click: [A.par(A.anim('shake', 2), A.operate('crank', 'on')), A.par(A.effect('snow', { dur: 3 }), A.say('Tinkle, tinkle...', 2.5)), A.wait(1.5), A.operate('crank', 'off')] })
      .done(),
  ),
  // Red insulated bib snow pants on a clip hanger: bib with braces, reinforced knees, black gaiters and kick
  // patches. They swish when they swing.
  e('snow pants', 'wardrobe', 'snow gear', () => {
    const b = m('snow pants');
    const T = hanger(b, valet(b, 1.85), 0.4, true) - 0.25, z = 0, red = '#d64545';
    pantsOn(b, T, z, { color: red, L: 0.95, band: '#2a2726', cuff: '#2a2726', legW: 0.21 });
    b.box([0.32, 0.28, 0.12], [0, T + 0.13, z + 0.02], { color: red, round: 0.5, parent: 'garment', edge: 'soft' })
      .box([0.12, 0.08, 0.02], [0, T + 0.13, z + 0.08], { color: '#a33232', round: 0.4, parent: 'garment' })
      .stick([0, T + 0.02, z + 0.1], [0, T + 0.26, z + 0.085], 0.01, 'silver', { parent: 'garment' });
    b.pair((s) => {
      b.box([0.045, 0.2, 0.02], [s * 0.12, T + 0.33, z + 0.03], { color: '#2a2726', parent: 'garment', round: 0.3 });
      b.box([0.05, 0.04, 0.03], [s * 0.12, T + 0.24, z + 0.07], { color: 'silver', parent: 'garment', round: 0.3 });
      b.box([0.16, 0.14, 0.03], [s * 0.11, T - 0.55, z + 0.085], { color: '#a33232', round: 0.6, parent: 'garment' });
    });
    return b.act(garmentAct([A.par(A.effect('snow', { dur: 1.5 }), A.say('Swish, swish.', 1.4))], [A.say('Swish.', 1)])).done();
  }),
  // A snow sculpture (2 m): a polar bear sitting on a carved plinth of packed snow, with icicle trim. Its carved
  // nose drops off (a piece) and goes back.
  e('snow sculpture', 'nature', 'snow and ice', () => {
    const sn = 'snow', sh = '#e3eef5';
    const b = m('snow sculpture')
      .box([1.3, 0.5, 1.0], [0, 0.25, 0], { color: sh, round: 0.12, edge: 'sharp' })
      .box([1.4, 0.08, 1.1], [0, 0.52, 0], { color: sn, round: 0.4, edge: 'sharp' })
      .ball([0.95, 0.85, 0.75], [0, 0.95, -0.05], { color: sn, name: 'bear' })
      .ball([0.62, 0.55, 0.55], [0, 1.4, 0.08], { color: sn, parent: 'bear' })
      .ball([0.46, 0.42, 0.44], [0, 1.72, 0.18], { color: sn, parent: 'bear' })
      .ball([0.24, 0.2, 0.28], [0, 1.66, 0.42], { color: sh, parent: 'bear' })
      .ball([0.09, 0.07, 0.06], [0, 1.7, 0.555], { color: '#9fb8c8', name: 'nose', parent: 'bear', piece: true })
      .label('BRRR!', [0.6, 0.18], [0, 0.27, 0.505], { color: sh, depth: 0.02 });
    b.pair((s) => {
      b.ball(0.13, [s * 0.18, 1.92, 0.12], { color: sn, parent: 'bear' });
      b.ball(0.045, [s * 0.09, 1.8, 0.37], { color: '#5d7584', parent: 'bear', eye: true });
      b.rod([s * 0.25, 1.35, 0.25], [s * 0.22, 0.75, 0.42], 0.2, sn, { parent: 'bear' });
      b.ball([0.24, 0.16, 0.32], [s * 0.3, 0.64, 0.38], { color: sn, parent: 'bear' });
      b.each(3, (i) => b.cone([0.06, 0.16, 0.06], [s * (0.2 + i * 0.2), 0.42, 0.52], { color: '#cfeaff', rot: [180, 0, 0], edge: 'sharp' }));
    });
    return b
      .act({ click: [[A.par(A.effect('sparkle', { dur: 1 }), A.say('Crrrk...', 1.2)), A.detach('nose', 'nose')], [A.reattach('nose'), A.effect('snow', { dur: 1.5 })]] })
      .done();
  }),
  // A packed snowball (9 cm), lumpy. Thrown: splat. Rolled: it grows into a big one, then back.
  e('snowball', 'nature', 'snow and ice', () =>
    m('snowball')
      .ball(0.09, [0, 0.045, 0], { color: 'snow' })
      .ball(0.04, [0.03, 0.07, 0.02], { color: 'snow' })
      .ball(0.035, [-0.03, 0.06, 0.025], { color: '#e8f0f6' })
      .ball(0.03, [0.01, 0.03, -0.035], { color: '#e8f0f6' })
      .act({
        click: [
          [A.par(A.anim('hop'), A.effect('snow', { dur: 1 }), A.say('Splat!', 1.2))],
          [A.set({ scale: 4, dur: 1.2 }), A.say('Roll, roll, roll...', 1.5), A.wait(1), A.set({ scale: 1, dur: 0.6 })],
        ],
      })
      .done(),
  ),
  // A snowboard (1.55 m) standing on its tail in a heap of snow: twin-tip deck with turned-up nose, graphics, two
  // bindings with straps. It flips round to show its waxed base.
  e('snowboard', 'sports', 'winter sports', () => {
    const b = m('snowboard')
      .ball([0.55, 0.22, 0.4], [0, 0.06, 0], { color: 'snow' })
      .box([0.28, 1.36, 0.022], [0, 0.82, 0], { color: '#2f4f8f', round: 0.4, name: 'board', pivot: [0, 0.1, 0], edge: 'sharp' })
      .cyl([0.28, 0.022, 0.12], [0, 1.5, -0.012], { color: '#2f4f8f', rot: [-75, 0, 0], parent: 'board', edge: 'sharp' })
      .box([0.24, 1.3, 0.004], [0, 0.82, -0.013], { color: '#1e1c1b', round: 0.3, parent: 'board', noInk: true })
      .box([0.26, 0.3, 0.004], [0, 1.1, 0.013], { color: '#f0923b', round: 0.5, parent: 'board', noInk: true })
      .star(0.14, [0, 1.1, 0.016], { color: '#f6d24a', parent: 'board', noInk: true })
      .box([0.26, 0.2, 0.004], [0, 0.4, 0.013], { color: '#6fd3e8', round: 0.5, parent: 'board', noInk: true });
    for (const y of [0.62, 1.02]) {
      b.box([0.16, 0.1, 0.02], [0, y, 0.022], { color: '#2a2726', round: 0.3, parent: 'board', edge: 'sharp' })
        .box([0.15, 0.03, 0.07], [0, y - 0.06, 0.05], { color: '#2a2726', round: 0.4, parent: 'board', edge: 'sharp' })
        .box([0.16, 0.04, 0.05], [0, y + 0.02, 0.05], { color: '#5c6166', round: 0.5, parent: 'board' })
        .box([0.16, 0.035, 0.04], [0, y - 0.03, 0.06], { color: '#e0473b', round: 0.5, parent: 'board' });
    }
    return b.act({ click: [[A.pose('board', { rot: [0, 180, 0], dur: 0.6 }), A.par(A.effect('snow', { dur: 1.2 }), A.say('Shred!', 1.2))], [A.pose('board', { rot: [0, 0, 0], dur: 0.6 })]] }).done();
  }),
  // One snowflake at its real size: a 1 cm six-armed dendrite (the vocabulary's 10 cm is far too big for a flake).
  e('snowflake', 'nature', 'snow and ice', () => {
    const r = 0.005, c: V = [0, r + 0.0002, 0];
    const b = m('snowflake').prism([0.002, 0.0006, 0.002], c, 6, { color: '#cfeaff', rot: [90, 0, 0] });
    b.each(6, (i) => {
      const a = (i * Math.PI) / 3;
      b.rod(c, xy(0, c[1], r, a), 0.0006, '#cfeaff');
      for (const [k, l] of [[0.45, 0.0016], [0.7, 0.0011]] as const) {
        const q = xy(0, c[1], r * k, a);
        for (const sgn of [-1, 1]) b.rod(q, xy(q[0], q[1], l, a + sgn * 1.0), 0.0005, '#e6f6ff');
      }
    });
    return b
      .act({ click: [[A.par(A.anim('spin'), A.effect('snow', { dur: 2 }))], [A.par(A.effect('sparkle', { dur: 1.2 }), A.anim('wobble'))]] })
      .done();
  }),
  // A snowmobile (3 m): aerodynamic cowl, windscreen, handlebars, long seat, rubber track over bogie wheels with a
  // drive sprocket, two steering skis on spindles, headlight and tail light, grab bar. Starts up and revs.
  e('snowmobile', 'garage', 'snow vehicles', () => {
    const red = '#d0302a';
    const b = m('snowmobile', { view: 'side', edge: 'sharp' })
      .loft([1.1, 0.62, 1.35], [0, 0.62, 0.72], [[0, 1, 1, 0], [0.4, 0.98, 0.95, 0.02], [0.8, 0.82, 0.7, -0.08], [1, 0.4, 0.3, -0.22]], { color: red, boxy: 0.55, name: 'cowl', edge: 'soft' })
      .box([0.9, 0.42, 1.65], [0, 0.48, -0.75], { color: '#2a2726', round: 0.15 })
      .box([0.94, 0.08, 1.6], [0, 0.72, -0.72], { color: red, round: 0.4 })
      .box([0.5, 0.17, 1.15], [0, 0.85, -0.65], { color: '#1e1c1b', round: 0.6, edge: 'soft' })
      .box([0.62, 0.36, 0.03], [0, 1.08, 0.25], { color: '#a9dcf2', rot: [-35, 0, 0], round: 0.4 })
      .stick([-0.36, 0.95, 0.18], [0.36, 0.95, 0.18], 0.035, '#5c6166')
      .stick([0, 0.82, 0.25], [0, 0.95, 0.18], 0.05, '#5c6166')
      .ball([0.26, 0.14, 0.08], [0, 0.72, 1.3], { color: '#fff6c8', name: 'headlight', mover: { kind: 'light', on: false } })
      .box([0.3, 0.06, 0.04], [0, 0.66, -1.56], { color: '#d4241c', glow: true, round: 0.4 })
      .stick([-0.3, 0.75, -1.55], [0.3, 0.75, -1.55], 0.035, '#5c6166')
      .label('ARCTIC', [0.6, 0.12], [0.555, 0.62, 0.65], { color: red, rot: [0, 90, 0], depth: 0.01 })
      .label('ARCTIC', [0.6, 0.12], [-0.555, 0.62, 0.65], { color: red, rot: [0, -90, 0], depth: 0.01 })
      .box([0.4, 0.26, 2.0], [0, 0.17, -0.75], { color: '#3a3633', round: 0.5, edge: 'soft' })
      .cyl([0.38, 0.36, 0.38], [0, 0.26, -0.05], { color: '#5c6166', rot: [0, 0, 90], name: 'sprocket', mover: { kind: 'spin', axis: 'x', amount: 540 } });
    b.each(12, (i) => b.box([0.42, 0.03, 0.05], [0, 0.03, -1.65 + i * 0.16], { color: '#1e1c1b', noInk: true }));
    b.pair((s) => {
      for (const zz of [-0.5, -1.1]) b.cyl([0.2, 0.08, 0.2], [s * 0.22, 0.14, zz], { color: '#9da3a8', rot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}${zz < -1 ? 2 : 1}` });
      b.box([0.1, 0.03, 1.0], [s * 0.38, 0.015, 0.95], { color: '#2a2726', round: 0.4 });
      b.box([0.1, 0.03, 0.26], [s * 0.38, 0.08, 1.52], { color: '#2a2726', rot: [-38, 0, 0], round: 0.4 });
      b.stick([s * 0.38, 0.03, 0.9], [s * 0.32, 0.45, 0.85], 0.06, '#5c6166');
      b.box([0.03, 0.06, 0.12], [s * 0.36, 0.95, 0.18], { color: '#2a2726', round: 0.4 });
      b.box([0.12, 0.08, 0.5], [s * 0.42, 0.38, -0.55], { color: '#5c6166', round: 0.4 });
    });
    return b
      .socket('seat', [0, 0.95, -0.6], 'seat')
      .act({
        click: [
          [A.par(A.operate('headlight', 'on'), A.operate('sprocket', 'on'), A.say('Vrrrm, vrrrm!', 2), A.anim('shake', 2)), A.effect('snow', { dur: 2 }), A.wait(1.5), A.operate('sprocket', 'off')],
          [A.par(A.operate('headlight', 'off'), A.say('Putt... putt.', 1.5))],
        ],
      })
      .done();
  }),
  // A snowplough truck (9 m, cab 3.2 m): conventional bonnet cab with glass and doors, a curved orange mouldboard on
  // a hydraulic arm (it lowers), a salt body with a spinning spreader, amber beacons, three axles of big wheels.
  e('snowplow', 'garage', 'trucks', () => {
    const or = '#f0923b', y = '#f6c23a';
    const b = m('snowplow', { view: 'side', edge: 'sharp' })
      .box([0.9, 0.3, 8.0], [0, 0.95, 0], { color: '#2a2726', round: 0.2 })
      .box([2.45, 1.0, 2.0], [0, 1.65, 2.65], { color: or, round: 0.18 })
      .box([2.0, 0.3, 0.12], [0, 1.6, 3.66], { color: '#2a2726', round: 0.3 })
      .box([2.5, 1.9, 1.9], [0, 2.15, 0.9], { color: or, round: 0.12 })
      .box([2.2, 0.85, 0.05], [0, 2.55, 1.86], { color: '#3d5a73', rot: [-8, 0, 0] })
      .box([2.5, 0.12, 1.95], [0, 3.13, 0.9], { color: or, round: 0.3 })
      .box([1.4, 0.15, 0.3], [0, 3.27, 1.2], { color: '#2a2726', round: 0.3 })
      .box([2.55, 2.2, 3.8], [0, 2.15, -2.3], { color: '#c9ccd1', round: 0.06 })
      .box([2.6, 0.2, 3.85], [0, 3.2, -2.3], { color: '#9da3a8', round: 0.2 })
      .ball([2.3, 0.45, 3.5], [0, 3.25, -2.3], { color: '#e8e4dc' })
      .box([0.8, 0.5, 0.5], [0, 0.85, -4.3], { color: '#5c6166', round: 0.2 })
      .cyl([0.9, 0.06, 0.9], [0, 0.55, -4.45], { color: '#2a2726', name: 'spinner', mover: { kind: 'spin', axis: 'y', amount: 600 } })
      .box([0.8, 0.04, 0.08], [0, 0.59, -4.45], { color: or, parent: 'spinner' })
      .box([0.08, 0.04, 0.8], [0, 0.59, -4.45], { color: or, parent: 'spinner' })
      .label('SALT', [1.4, 0.4], [1.285, 2.2, -2.3], { color: '#2f4f8f', rot: [0, 90, 0], depth: 0.03 })
      .label('SALT', [1.4, 0.4], [-1.285, 2.2, -2.3], { color: '#2f4f8f', rot: [0, -90, 0], depth: 0.03 })
      // the plough on its arm: hinged at the bumper, swings down onto the road
      .box([0.4, 0.4, 0.9], [0, 1.42, 4.0], { color: '#2a2726', round: 0.2, name: 'plow', pivot: [0, 1.47, 3.6], mover: { kind: 'swing', axis: 'x', amount: 12 } })
      .box([3.4, 0.55, 0.12], [0, 0.64, 4.75], { color: y, rot: [-12, 0, 0], parent: 'plow', round: 0.2 })
      .box([3.4, 0.5, 0.12], [0, 1.14, 4.62], { color: y, rot: [12, 0, 0], parent: 'plow', round: 0.2 })
      .box([3.4, 0.4, 0.12], [0, 1.54, 4.42], { color: y, rot: [35, 0, 0], parent: 'plow', round: 0.2 })
      .box([3.44, 0.08, 0.16], [0, 0.39, 4.84], { color: '#2a2726', parent: 'plow', round: 0.3 })
      .label('PLOW', [1.2, 0.3], [0, 1.07, 4.69], { color: '#2a2726', rot: [12, 0, 0], parent: 'plow', depth: 0.03 });
    b.pair((s) => {
      b.box([0.05, 0.65, 0.9], [s * 1.25, 2.55, 0.95], { color: '#3d5a73' });
      b.box([0.05, 1.25, 1.05], [s * 1.26, 1.9, 0.85], { color: or, name: s > 0 ? 'doorL' : 'doorR', pivot: [s * 1.26, 1.9, 1.38], mover: { kind: 'swing', axis: 'y', amount: -s * 70 } });
      b.box([0.05, 0.62, 0.85], [s * 1.28, 2.55, 0.85], { color: '#3d5a73', parent: s > 0 ? 'doorL' : 'doorR' });
      b.box([0.08, 0.3, 0.2], [s * 1.38, 2.4, 1.75], { color: '#2a2726', round: 0.3 });
      b.ball([0.3, 0.22, 0.08], [s * 0.9, 1.75, 3.66], { color: '#fff6c8', name: s > 0 ? 'headlightL' : 'headlightR', mover: { kind: 'light', on: false } });
      b.dome([0.24, 0.2, 0.24], [s * 0.85, 3.35, 0.9], { color: '#ffb02a', name: s > 0 ? 'beaconL' : 'beaconR', mover: { kind: 'light', on: false } });
      b.box([0.6, 0.12, 0.6], [s * 1.25, 1.1, 2.6], { color: '#2a2726', round: 0.3 });
      b.box([0.3, 0.12, 0.5], [s * 1.0, 1.2, 0.0], { color: '#9da3a8', round: 0.3 });
      for (const [k, zz] of [['F', 2.65], ['M', -1.6], ['B', -3.0]] as const) wheel(b, `wheel${k}${s > 0 ? 'L' : 'R'}`, s * 1.08, zz, 1.1, 0.4, { rim: '#9da3a8' });
    });
    return b
      .socket('driver', [0.5, 1.9, 0.9], 'seat')
      .act({
        click: [
          [A.par(A.operate('beacons', 'on'), A.operate('headlights', 'on')), A.operate('plow', 'on'), A.par(A.effect('snow', { dur: 2 }), A.say('Rumble... scrape!', 2)), A.wait(1.5), A.operate('plow', 'off')],
          [A.operate('spinner', 'on'), A.par(A.effect('dust', { dur: 2 }), A.say('Ch-ch-ch-ch-ch...', 1.8)), A.wait(1.5), A.par(A.operate('spinner', 'off'), A.operate('beacons', 'off'), A.operate('headlights', 'off'))],
        ],
      })
      .done();
  }),
  // A pink bar of soap (9 cm) with an embossed oval and a few bubbles. A lather of suds puffs up when clicked.
  e('soap', 'home', 'bathroom', () =>
    m('soap')
      .box([0.09, 0.03, 0.06], [0, 0.015, 0], { color: '#f4a1c0', round: 0.75 })
      .cyl([0.05, 0.004, 0.03], [0, 0.031, 0], { color: '#f6b8cf', noInk: true })
      .label('SOAP', [0.034, 0.012], [0, 0.0335, 0], { color: '#f6b8cf', rot: [-90, 0, 0], depth: 0.001 })
      .ball(0.014, [0.035, 0.04, 0.02], { color: '#e8f6ff' })
      .ball(0.01, [0.046, 0.05, 0.012], { color: '#e8f6ff' })
      .ball([0.12, 0.05, 0.09], [0, 0.04, 0], { color: '#f4fbff', name: 'suds', scale: 0 })
      .act({ click: [A.par(A.pose('suds', { scale: 1, dur: 0.6 }), A.effect('sparkle', { dur: 1.5 }), A.say('Squeak, squeak!', 1.5)), A.wait(1.2), A.pose('suds', { scale: 0, dur: 0.6 })] })
      .done(),
  ),
  // A ceramic soap dish (13 cm) with drain ridges; a bar of soap sits in it and squeaks when clicked.
  e('soap dish', 'home', 'bathroom', () => {
    const b = m('soap dish', { edge: 'sharp' })
      .cyl([0.13, 0.022, 0.095], [0, 0.011, 0], { color: 'white', taper: 1.12, segs: 16 })
      .cyl([0.12, 0.004, 0.085], [0, 0.0235, 0], { color: '#dfe8ec', noInk: true });
    b.each(5, (i) => b.box([0.08, 0.006, 0.008], [0, 0.026, -0.03 + i * 0.015], { color: 'white', round: 0.5 }));
    return b
      .socket('top', [0, 0.028, 0], 'top', { size: 0.1 })
      .act({ setup: [A.spawn('s', 'soap'), A.attach('s', 'self', 'top')], click: [A.par(A.anim('hop', 2, 'self.top'), A.say('Squeak!', 1.2))] })
      .done();
  }),
  // A size-5 football (22 cm): white with black pentagons. Bounces; spins when kicked.
  e('soccer ball', 'sports', 'balls', () => {
    const r = 0.11, c: V = [0, r, 0], p = 1.618;
    const b = m('soccer ball').ball(r * 2, c, { color: 'white' });
    const dirs: V[] = [];
    for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) dirs.push([0, s1, s2 * p], [s1, s2 * p, 0], [s2 * p, 0, s1]);
    for (const d of dirs) {
      const l = Math.hypot(...d), u = d.map((v) => v / l);
      b.stick([c[0] + u[0] * r * 0.9, c[1] + u[1] * r * 0.9, c[2] + u[2] * r * 0.9], [c[0] + u[0] * r * 1.01, c[1] + u[1] * r * 1.01, c[2] + u[2] * r * 1.01], 0.07, '#2a2726', { segs: 5, noInk: true });
    }
    return b.act({ click: [[A.par(A.anim('bounce', 2), A.say('Boing!', 1))], [A.par(A.anim('spin', 2), A.say('Goal!', 1.2))]] }).done();
  }),
  // A pair of striped crew socks (28 cm) shown on sock forms: ribbed cuffs, red heels and toes. Pongy.
  e('socks', 'wardrobe', 'socks', () => {
    const b = m('socks');
    b.pair((s) => {
      const x = s * 0.07, n = s > 0 ? 'sockL' : 'sockR';
      b.cyl([0.075, 0.2, 0.068], [x, 0.17, -0.02], { color: 'white', name: n })
        .cyl([0.079, 0.04, 0.072], [x, 0.26, -0.02], { color: '#e8e4dc', parent: n })
        .cyl([0.078, 0.018, 0.071], [x, 0.215, -0.02], { color: '#e0473b', parent: n, noInk: true })
        .cyl([0.078, 0.018, 0.071], [x, 0.19, -0.02], { color: '#4e8fd6', parent: n, noInk: true })
        .capsule([0.074, 0.2, 0.06], [x, 0.035, 0.05], { color: 'white', rot: [90, 0, 0], parent: n })
        .ball([0.074, 0.075, 0.07], [x, 0.045, -0.03], { color: '#e0473b', parent: n })
        .ball([0.072, 0.06, 0.06], [x, 0.033, 0.13], { color: '#e0473b', parent: n });
    });
    return b
      .act({ click: [[A.par(A.pose('sockL', { move: [0, 0.04, 0], dur: 0.2 }), A.pose('sockR', { move: [0, 0, 0], dur: 0.2 })), A.par(A.pose('sockL', { move: [0, 0, 0], dur: 0.2 }), A.pose('sockR', { move: [0, 0.04, 0], dur: 0.2 })), A.pose('sockR', { move: [0, 0, 0], dur: 0.2 }), A.par(A.effect('dust', { dur: 1.5 }), A.say('Phew!', 1.4))]] })
      .done();
  }),
  // A glass cola bottle (33 cl, 24 cm) with the classic waisted shape and a crimped cap that pops off: fizz!
  e('soda', 'food', 'drinks', () =>
    m('soda')
      .cyl([0.062, 0.03, 0.062], [0, 0.015, 0], { color: '#4a2a1a' })
      .cyl([0.062, 0.05, 0.062], [0, 0.055, 0], { color: '#4a2a1a', taper: 0.88 })
      .cyl([0.055, 0.05, 0.055], [0, 0.105, 0], { color: '#4a2a1a', taper: 1.12 })
      .cyl([0.064, 0.026, 0.064], [0, 0.072, 0], { color: '#e0303b', noInk: true })
      .label('COLA', [0.042, 0.018], [0, 0.072, 0.032], { color: '#e0303b', depth: 0.002 })
      .cyl([0.062, 0.045, 0.062], [0, 0.152, 0], { color: '#4a2a1a', taper: 0.45, name: 'neck' })
      .cyl([0.028, 0.045, 0.028], [0, 0.196, 0], { color: '#5a3a26', taper: 0.92, parent: 'neck' })
      .cyl([0.03, 0.012, 0.03], [0, 0.224, 0], { color: '#e0473b', segs: 14, name: 'cap', parent: 'neck', piece: true, edge: 'sharp' })
      .act({ click: [[A.detach('cap', 'cap'), A.par(A.effect('water_spray', { dur: 1.2 }), A.say('Pssst! Fizz!', 1.5))], [A.reattach('cap'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A drinks vending machine (1.83 m): lit display front with a giant can, selection buttons, coin and note slots, a
  // change cup and the drop flap at the bottom. Press a button: a soda drops out.
  e('soda machine', 'tech', 'machines', () => {
    const b = m('soda machine', { edge: 'sharp' })
      .box([0.92, 1.83, 0.78], [0, 0.915, 0], { color: '#d0302a', round: 0.04 })
      .box([0.62, 1.2, 0.03], [-0.1, 1.12, 0.395], { color: '#ff6a5a', name: 'panel', mover: { kind: 'light', on: true } })
      .cyl([0.22, 0.6, 0.03], [-0.1, 1.1, 0.415], { color: 'white', parent: 'panel' })
      .label('COLA', [0.18, 0.08], [-0.1, 1.1, 0.433], { color: '#e0303b', rot: [0, 0, 90], parent: 'panel', depth: 0.01 })
      .label('ICE COLD', [0.5, 0.12], [-0.1, 1.6, 0.415], { color: 'white', parent: 'panel', depth: 0.01 })
      .box([0.2, 1.2, 0.05], [0.33, 1.12, 0.39], { color: '#2a2726', round: 0.1 })
      .box([0.08, 0.06, 0.03], [0.33, 0.62, 0.42], { color: 'silver' })
      .box([0.12, 0.03, 0.03], [0.33, 0.52, 0.42], { color: '#5c6166' })
      .label('$1', [0.1, 0.06], [0.33, 0.72, 0.425], { color: '#2a2726', depth: 0.005 })
      .box([0.6, 0.3, 0.06], [-0.1, 0.27, 0.39], { color: '#1e1c1b', round: 0.1 })
      .box([0.56, 0.24, 0.03], [-0.1, 0.27, 0.425], { color: '#3a3633', name: 'flap', pivot: [-0.1, 0.39, 0.425], mover: { kind: 'swing', axis: 'x', amount: -55 } })
      .box([0.1, 0.08, 0.06], [0.33, 0.3, 0.42], { color: '#1e1c1b', round: 0.3 });
    b.each(6, (i) => b.box([0.12, 0.08, 0.03], [0.33, 1.6 - i * 0.14, 0.42], { color: ['#f7f5ef', '#f6d24a', '#9be34d', '#f0923b', '#6fd3e8', '#f4a1c0'][i], round: 0.3, name: i === 0 ? 'button' : `btn${i}` }));
    b.pair((s) => b.box([0.05, 0.06, 0.6], [s * 0.4, 0.03, 0], { color: '#2a2726' }));
    return b
      .act({
        click: [
          A.pose('button', { move: [0, 0, -0.015], dur: 0.12 }),
          A.pose('button', { move: [0, 0, 0], dur: 0.12 }),
          A.par(A.anim('shake'), A.say('Whirr... clunk!', 1.6)),
          A.operate('flap', 'open'),
          A.spawn('can', 'soda', { rel: 'front', of: 'self', dist: 'touch' }),
          A.wait(2.5),
          A.par(A.operate('flap', 'close'), A.remove('can', 'pop')),
        ],
      })
      .done();
  }),
  // A three-seater sofa (2 m, seat 0.42 m): wooden plinth and tapered legs, a sprung base, three seat and three
  // back cushions, rolled arms and two throw pillows (one can be thrown about). Three seats.
  e('sofa', 'home', 'seating', () => {
    const c = '#3f8f8a', cu = '#4fb0a8';
    const b = m('sofa')
      .box([2.0, 0.24, 0.9], [0, 0.24, 0], { color: c, round: 0.2, name: 'frame' })
      .box([2.0, 0.5, 0.22], [0, 0.6, -0.34], { color: c, round: 0.3 })
      .box([1.98, 0.04, 0.88], [0, 0.11, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' });
    b.each(3, (i) => {
      const x = -0.55 + i * 0.55;
      b.box([0.54, 0.14, 0.66], [x, 0.43, 0.08], { color: cu, round: 0.5 });
      b.box([0.54, 0.44, 0.17], [x, 0.7, -0.17], { color: cu, round: 0.55, rot: [-10, 0, 0] });
      b.socket(`seat${i + 1}`, [x, 0.5, 0.1], 'seat');
    });
    b.pair((s) => {
      b.box([0.2, 0.42, 0.9], [s * 0.9, 0.45, 0], { color: c, round: 0.4 });
      b.capsule([0.22, 0.9, 0.22], [s * 0.9, 0.66, 0], { color: c, rot: [90, 0, 0] });
      for (const z of [0.36, -0.36]) b.cyl([0.05, 0.12, 0.05], [s * 0.92, 0.06, z], { color: 'darkwood', taper: 0.7, rot: [180, 0, 0], edge: 'sharp' });
    });
    b.box([0.36, 0.36, 0.12], [0.66, 0.68, -0.03], { color: '#f0c24a', round: 0.6, rot: [-12, 0, -12], name: 'pillow', parent: 'frame', piece: true })
      .box([0.34, 0.34, 0.12], [-0.68, 0.68, -0.03], { color: '#e0705a', round: 0.6, rot: [-12, 0, 12] });
    return b.act({ click: [[A.detach('pillow', 'pillow'), A.say('Fwump!', 1.2)], [A.reattach('pillow'), A.say('Puff.', 1)]] }).done();
  }),
  // A ground-mounted solar panel (1.7 x 1 m) tilted at 35 degrees on a steel frame: 60 dark blue cells, aluminium
  // frame, junction box and cable. It tilts to follow the sun and hums.
  e('solar panel', 'tech', 'power', () => {
    const b = m('solar panel', { edge: 'sharp' })
      .box([1.7, 0.04, 1.02], [0, 1.05, 0], { color: '#c9ccd1', rot: [35, 0, 0], round: 0.2, name: 'panel', pivot: [0, 1.05, 0], mover: { kind: 'swing', axis: 'x', amount: -20 } })
      .box([1.64, 0.012, 0.96], [0, 1.05 + 0.02 * Math.cos(35 * D), 0.02 * Math.sin(35 * D)], { color: '#1e2f55', rot: [35, 0, 0], parent: 'panel' });
    const t = 35 * D, P = (x: number, zl: number, up = 0.028): V => [x, 1.05 + up * Math.cos(t) - zl * Math.sin(t), up * Math.sin(t) + zl * Math.cos(t)];
    b.each(9, (i) => b.box([0.006, 0.006, 0.95], P(-0.82 + (i + 1) * 0.164, 0), { color: '#7da3d8', rot: [35, 0, 0], parent: 'panel', noInk: true }));
    b.each(5, (i) => b.box([1.63, 0.006, 0.006], P(0, -0.48 + (i + 1) * 0.16), { color: '#7da3d8', rot: [35, 0, 0], parent: 'panel', noInk: true }));
    b.box([0.14, 0.04, 0.1], P(0, -0.2, -0.05), { color: '#2a2726', rot: [35, 0, 0], parent: 'panel' });
    b.pair((s) => {
      b.stick([s * 0.65, 0, 0.42], [s * 0.65, 0.78, 0.38], 0.05, 'steel');
      b.stick([s * 0.65, 0, -0.42], [s * 0.65, 1.32, -0.38], 0.05, 'steel');
      b.stick([s * 0.65, 0.4, 0.42], [s * 0.65, 0.9, -0.42], 0.035, 'steel');
      b.box([0.2, 0.1, 1.0], [s * 0.65, 0.05, 0], { color: 'stone', round: 0.2 });
    });
    b.rod([0, 0.85, -0.25], [0.15, 0.05, -0.5], 0.015, '#2a2726');
    return b.act({ click: [[A.operate('panel', 'on'), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Hmmmm...', 1.5))], [A.operate('panel', 'off')]] }).done();
  }),
  // A woven straw sombrero (70 cm brim): tall rounded crown, upturned brim edge, red band with pompoms round it.
  e('sombrero', 'wardrobe', 'hats', () => {
    const st = '#e8c77a';
    const b = m('sombrero')
      .cyl([0.7, 0.025, 0.7], [0, 0.04, 0], { color: st, taper: 0.97 })
      .torus([0.74, 0.74, 0.06], [0, 0.06, 0], { color: st, rot: [90, 0, 0], tube: 0.07 })
      .cyl([0.26, 0.24, 0.26], [0, 0.17, 0], { color: st, taper: 0.62 })
      .dome([0.17, 0.06, 0.17], [0, 0.31, 0], { color: st })
      .cyl([0.27, 0.05, 0.27], [0, 0.085, 0], { color: '#d0302a', taper: 0.94 })
      .torus([0.62, 0.62, 0.012], [0, 0.056, 0], { color: '#3f7a3a', rot: [90, 0, 0], tube: 0.03, noInk: true });
    for (const [x, z] of around(12, 0.37)) b.ball(0.035, [x, 0.03, z], { color: ['#e0473b', '#f6d24a', '#5aa553'][Math.round((Math.atan2(z, x) + 4) * 2) % 3] });
    return b.act({ click: [A.par(A.anim('spin'), A.anim('hop'), A.say('Ole!', 1.2))] }).done();
  }),
  // A bowl of tomato soup (16 cm) with a swirl of cream, croutons and basil, a spoon resting in it. Steaming.
  e('soup', 'food', 'soups', () =>
    m('soup')
      .cyl([0.08, 0.012, 0.08], [0, 0.006, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.11, 0.06, 0.11], [0, 0.04, 0], { color: 'white', taper: 1.45 })
      .torus([0.16, 0.16, 0.012], [0, 0.07, 0], { color: 'white', rot: [90, 0, 0], tube: 0.06 })
      .cyl([0.15, 0.008, 0.15], [0, 0.068, 0], { color: '#d9502e' })
      .torus([0.06, 0.06, 0.004], [0.01, 0.073, 0.01], { color: 'cream', rot: [90, 0, 0], tube: 0.15, noInk: true })
      .box([0.014, 0.01, 0.014], [0.03, 0.075, -0.03], { color: 'bread', edge: 'sharp' })
      .box([0.014, 0.01, 0.014], [-0.04, 0.075, 0.01], { color: 'bread', edge: 'sharp' })
      .ball([0.02, 0.005, 0.012], [-0.01, 0.074, -0.04], { color: '#3f7a3a', noInk: true })
      .rod([-0.035, 0.072, 0.03], [-0.1, 0.13, 0.05], 0.01, 'silver')
      .ball([0.03, 0.008, 0.022], [-0.035, 0.074, 0.03], { color: 'silver' })
      .act({ click: [A.par(A.effect('steam', { dur: 2 }), A.say('Slurp!', 1.4))] })
      .done(),
  ),
  // A tub of sour cream (10 cm) with its lid on (a piece): open it to see the swirl.
  e('sour cream', 'food', 'dairy', () =>
    m('sour cream')
      .cyl([0.095, 0.07, 0.095], [0, 0.035, 0], { color: 'white', taper: 1.12, name: 'tub' })
      .cyl([0.1, 0.035, 0.1], [0, 0.035, 0], { color: '#5aa553', taper: 1.06, parent: 'tub', noInk: true })
      .label('SOUR CREAM', [0.06, 0.016], [0, 0.036, 0.052], { color: '#5aa553', rot: [-4, 0, 0], parent: 'tub', depth: 0.002 })
      .cyl([0.1, 0.004, 0.1], [0, 0.068, 0], { color: 'milk', parent: 'tub' })
      .ball([0.05, 0.022, 0.05], [0, 0.072, 0], { color: 'milk', parent: 'tub' })
      .cone([0.018, 0.016, 0.018], [0.005, 0.088, 0], { color: 'milk', parent: 'tub' })
      .cyl([0.112, 0.012, 0.112], [0, 0.078, 0], { color: '#5aa553', name: 'lid', parent: 'tub', piece: true, edge: 'sharp' })
      .cyl([0.09, 0.004, 0.09], [0, 0.086, 0], { color: '#7cc46a', parent: 'lid', noInk: true })
      .act({ click: [[A.detach('lid', 'lid'), A.say('Pop!', 1)], [A.reattach('lid')]] })
      .done(),
  ),
  // A gable-top milk carton (1 litre, 20 cm) gone sour: green-tinged label, a bulging cap and stink lines. Phew.
  e('sour milk', 'food', 'dairy', () => {
    const b = m('sour milk', { edge: 'sharp' })
      .box([0.07, 0.16, 0.07], [0, 0.08, 0], { color: 'white', round: 0.08 })
      .wedge([0.07, 0.035, 0.07], [0, 0.1775, 0], { color: 'white' })
      .box([0.072, 0.005, 0.02], [0, 0.197, 0], { color: 'white' })
      .box([0.072, 0.07, 0.072], [0, 0.075, 0], { color: '#9bbf5a', round: 0.1, noInk: true })
      .label('MILK', [0.05, 0.022], [0, 0.085, 0.037], { color: 'white', depth: 0.002 })
      .label('BEST BY MAY', [0.05, 0.01], [0, 0.055, 0.037], { color: '#9bbf5a', depth: 0.002 })
      .cyl([0.022, 0.012, 0.022], [0, 0.175, 0.024], { color: '#5aa553', rot: [-45, 0, 0] });
    b.each(3, (i) => {
      const xx = -0.03 + i * 0.03;
      b.rod([xx, 0.21, 0], [xx + 0.015, 0.24, 0], 0.007, '#8fbf3a', { edge: 'soft' });
      b.rod([xx + 0.015, 0.24, 0], [xx, 0.27, 0], 0.007, '#8fbf3a', { edge: 'soft' });
    });
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('dust', { dur: 1.5 }), A.say('Phew!', 1.4))] }).done();
  }),
  // A souvenir Eiffel Tower (15 cm) in bronze on a little plinth that says PARIS. It twirls and twinkles.
  e('souvenir', 'home', 'keepsakes', () => {
    const br = '#a8783e';
    const b = m('souvenir', { edge: 'sharp' })
      .box([0.07, 0.014, 0.07], [0, 0.007, 0], { color: 'darkwood', round: 0.2, name: 'base' })
      .label('PARIS', [0.05, 0.01], [0, 0.007, 0.0355], { color: 'gold', parent: 'base', depth: 0.002 })
      .box([0.042, 0.005, 0.042], [0, 0.045, 0], { color: br, parent: 'base' })
      .box([0.024, 0.004, 0.024], [0, 0.088, 0], { color: br, parent: 'base' })
      .cyl([0.012, 0.035, 0.012], [0, 0.11, 0], { color: br, segs: 4, taper: 0.5, parent: 'base' })
      .stick([0, 0.125, 0], [0, 0.152, 0], 0.003, br, { parent: 'base' });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      b.rod([x * 0.028, 0.014, z * 0.028], [x * 0.016, 0.045, z * 0.016], 0.007, br, { parent: 'base' });
      b.rod([x * 0.016, 0.045, z * 0.016], [x * 0.006, 0.112, z * 0.006], 0.005, br, { parent: 'base' });
    }
    b.pair((s) => b.arc([0.03, 0.024, 0.003], [0, 0.02, s * 0.021], { color: br, parent: 'base', tube: 0.15 }).arc([0.03, 0.024, 0.003], [s * 0.021, 0.02, 0], { color: br, rot: [0, 90, 0], parent: 'base', tube: 0.15 }));
    return b.act({ click: [A.par(A.anim('spin'), A.effect('sparkle', { dur: 1.2 }), A.say('Ting!', 1))] }).done();
  }),
  // A gift shop (6 m front): striped awning, a heart over the SOUVENIRS sign, T-shirts and a big snow globe in the
  // window, and a postcard spinner rack outside that turns.
  e('souvenir shop', 'places', 'shops', () => {
    const b = shopFront('souvenir shop', { wall: '#f2e6cf', trim: '#3fa7a0', sign: 'SOUVENIRS', signColor: '#f6d24a', awning: ['#e0473b', 'white'] })
      .heart(1.0, [0, 4.75, 2.6], { color: '#e0473b' })
      .stick([2.3, 0.12, 3.1], [2.3, 1.75, 3.1], 0.04, 'silver')
      .cyl([0.5, 0.04, 0.5], [2.3, 0.14, 3.1], { color: '#5c6166' })
      .box([0.42, 0.95, 0.42], [2.3, 1.2, 3.1], { color: 'silver', round: 0.05, name: 'rack', mover: { kind: 'spin', axis: 'y', amount: 180 } });
    b.each(8, (i) => {
      const side = i % 4, row = Math.floor(i / 4), a = side * 90;
      const dx = [0, 0.22, 0, -0.22][side], dz = [0.22, 0, -0.22, 0][side];
      b.box([0.3, 0.2, 0.01], [2.3 + dx, 1.45 - row * 0.45, 3.1 + dz], { color: ['#6fd3e8', '#f6d24a', '#f4a1c0', '#9be34d'][(i + row) % 4], rot: [0, a, 0], parent: 'rack' });
    });
    b.pair((s) => {
      b.box([0.45, 0.55, 0.03], [s * 2.0, 1.75, 2.42], { color: s > 0 ? '#e0473b' : '#4e8fd6', round: 0.3 });
      b.label('I <3', [0.3, 0.12], [s * 2.0, 1.8, 2.44], { color: s > 0 ? '#e0473b' : '#4e8fd6', depth: 0.01 });
    });
    b.ball(0.5, [-1.2, 1.15, 2.3], { color: '#bfe6f5' }).cyl([0.4, 0.15, 0.4], [-1.2, 0.85, 2.3], { color: 'darkwood' });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.operate('rack', 'on')), A.say('Ding-a-ling!', 1.8), A.wait(2.5), A.par(A.operate('door', 'close'), A.operate('rack', 'off'))],
          [A.operate('window', 'on'), A.operate('windowB', 'on'), A.effect('sparkle', { dur: 1.2 }), A.wait(2.5), A.operate('window', 'off'), A.operate('windowB', 'off')],
        ],
      })
      .done();
  }),
  // A soy sauce dispenser (15 cm): teardrop glass bottle, red cap with a pouring spout. It tips and pours.
  e('soy sauce', 'food', 'sauces', () =>
    m('soy sauce')
      .ball([0.068, 0.11, 0.068], [0, 0.055, 0], { color: '#3a1f12', name: 'bottle', pivot: [0, 0, 0] })
      .cyl([0.052, 0.012, 0.052], [0, 0.006, 0], { color: '#3a1f12', parent: 'bottle' })
      .cyl([0.03, 0.04, 0.03], [0, 0.115, 0], { color: '#3a1f12', taper: 0.85, parent: 'bottle' })
      .label('SOY', [0.034, 0.024], [0, 0.05, 0.034], { color: 'white', parent: 'bottle', depth: 0.002 })
      .cyl([0.034, 0.022, 0.034], [0, 0.144, 0], { color: '#d0302a', parent: 'bottle', edge: 'sharp' })
      .cone([0.026, 0.02, 0.026], [0, 0.165, 0], { color: '#d0302a', parent: 'bottle', edge: 'sharp' })
      .stick([0, 0.16, 0], [0.024, 0.168, 0], 0.008, '#d0302a', { parent: 'bottle', edge: 'sharp' })
      .act({ click: [A.pose('bottle', { rot: [0, 0, -70], dur: 0.6 }), A.say('Glug, glug.', 1.4), A.wait(0.8), A.pose('bottle', { rot: [0, 0, 0], dur: 0.5 })] })
      .done(),
  ),
  // A day spa (6 m front): calm sage walls, frosted windows with a towel stack and candles, a lotus over the SPA sign,
  // potted bamboo either side of the door. Steam drifts out when the door opens.
  e('spa (place)', 'places', 'wellness', () => {
    const b = shopFront('spa (place)', { wall: '#dfece6', trim: '#7fb8a8', sign: 'DAY SPA', signColor: '#5a8f80', door: 'lightwood' });
    b.pair((s) => {
      b.ball([0.5, 0.25, 0.25], [s * 0.35, 4.55, 2.6], { color: '#f4a1c0', rot: [0, 0, s * 40] });
      b.cyl([0.5, 0.55, 0.5], [s * 1.45, 0.4, 3.1], { color: '#5c6166', taper: 0.85 });
      b.each(4, (i) => b.stick([s * 1.45 + (i - 1.5) * 0.08, 0.6, 3.1 + (i % 2) * 0.08], [s * 1.45 + (i - 1.5) * 0.12, 2.1 + (i % 2) * 0.3, 3.1 + (i % 2) * 0.08], 0.04, '#7cc45a'));
      b.ball([0.5, 0.9, 0.4], [s * 1.45, 1.9, 3.1], { color: '#5aa553' });
      b.box([0.5, 0.1, 0.3], [s * 2.0, 0.95, 2.35], { color: 'white', round: 0.5 });
      b.box([0.5, 0.1, 0.3], [s * 2.0, 1.06, 2.35], { color: '#f4a1c0', round: 0.5 });
      b.cyl([0.08, 0.12, 0.08], [s * 1.7, 0.95, 2.35], { color: 'cream' });
    });
    b.ball([0.3, 0.32, 0.3], [0, 4.55, 2.62], { color: '#d64fa0' });
    return b
      .act({
        click: [
          [A.operate('door', 'open'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Tinkle, tinkle...', 2)), A.wait(2), A.operate('door', 'close')],
          [A.operate('window', 'on'), A.operate('windowB', 'on'), A.effect('sparkle', { dur: 1.2 }), A.wait(2.5), A.operate('window', 'off'), A.operate('windowB', 'off')],
        ],
      })
      .done();
  }),
  // An orbital station model (24 m span, on a display pylon): a long truss carrying pressurised modules, a docking
  // capsule, radiators and four big solar wings that turn to face the sun.
  e('space station', 'garage', 'spacecraft', () => {
    const y = 9;
    const b = m('space station', { edge: 'sharp' })
      .cyl([3, 0.4, 3], [0, 0.2, 0], { color: '#5c6166' })
      .cyl([0.6, y - 1.2, 0.6], [0, (y - 0.8) / 2 + 0.2, 0], { color: '#9da3a8', taper: 0.6 })
      .box([22, 0.6, 0.6], [0, y, 0], { color: '#c9ccd1', round: 0.1 })
      .cyl([1.4, 9, 1.4], [0, y - 1.0, 0], { color: '#f7f5ef', rot: [90, 0, 0], edge: 'soft' })
      .cyl([1.5, 0.3, 1.5], [0, y - 1.0, 2.5], { color: '#c9ccd1', rot: [90, 0, 0] })
      .cyl([1.5, 0.3, 1.5], [0, y - 1.0, -2.0], { color: '#c9ccd1', rot: [90, 0, 0] })
      .cyl([1.2, 3, 1.2], [-1.9, y - 1.0, 1.0], { color: '#f7f5ef', rot: [0, 0, 90], edge: 'soft' })
      .cyl([1.2, 2.4, 1.2], [1.7, y - 1.0, -1.5], { color: '#e8e4dc', rot: [0, 0, 90], edge: 'soft' })
      .cyl([1.0, 1.2, 1.0], [0, y - 1.0, 5.1], { color: '#e8e4dc', rot: [90, 0, 0], taper: 0.7 })
      .cone([1.0, 1.0, 1.0], [0, y - 1.0, 6.2], { color: '#2a2726', rot: [90, 0, 0] })
      .label('ISS', [0.8, 0.4], [0, y - 1.0, 0.71], { color: '#2f4f8f', depth: 0.02 });
    b.pair((s) => {
      b.box([0.3, 2.6, 0.06], [s * 4.5, y - 1.6, 0], { color: 'white' });
      b.box([0.3, 2.6, 0.06], [s * 5.4, y - 1.6, 0], { color: 'white' });
      for (const [k, xx] of [[1, 8.2], [2, 10.4]] as const) {
        const n = `array${s > 0 ? 'L' : 'R'}${k}`;
        b.stick([s * xx, y, 0], [s * xx, y + 0.5, 0], 0.15, '#9da3a8', { name: n, pivot: [s * xx, y, 0], mover: { kind: 'spin', axis: 'x', amount: 40 } });
        b.box([1.6, 8.0, 0.06], [s * xx, y + 4.5, 0], { color: '#2f4f8f', parent: n });
        b.box([1.6, 8.0, 0.06], [s * xx, y - 4.5, 0], { color: '#2f4f8f', parent: n });
        b.box([0.08, 8.0, 0.1], [s * xx, y + 4.5, 0], { color: 'gold', parent: n, noInk: true });
        b.box([0.08, 8.0, 0.1], [s * xx, y - 4.5, 0], { color: 'gold', parent: n, noInk: true });
      }
    });
    return b
      .act({ click: [[A.operate('arrays', 'on'), A.par(A.effect('sparkle', { dur: 2 }), A.say('Beep... beep... beep.', 2.2))], [A.operate('arrays', 'off'), A.say('Beep.', 1)]] })
      .done();
  }),
  // A person in a white EVA space suit: helmet with a gold visor, life-support backpack, mission patch, belt of
  // tools, long sleeves and boots. Waves hello from orbit; gives a thumbs-up for all systems go.
  e('space suit', 'wardrobe', 'costumes', () =>
    withAct(who('space suit', { h: 1.8, top: 'white', bottom: 'white', shoes: '#d4d7da', long: true, style: 'none', build: 1.15, acc: [hat('astronaut'), body('jetpack', 'white'), wear('badge', '#2f4f8f'), wear('belt', '#9da3a8')] }), {
      click: [
        [A.par(A.anim('wave'), A.say('Hello from orbit!', 2))],
        [A.par(A.anim('thumbs_up'), A.say('All systems go!', 2))],
      ],
    }),
  ),
  // A starship (24 m) standing on three landing legs: a lofted hull swelling from twin engines to a pointed nose, a
  // glass canopy, swept wings with fins, glowing engines (light movers) and a belly ramp that lowers to the ground
  // so crew can walk in.
  e('spaceship', 'garage', 'spacecraft', () => {
    const hull = '#e8eaee', trim = '#2f4f8f';
    const b = m('spaceship', { view: 'side', edge: 'sharp' })
      .loft([4.2, 3.6, 22], [0, 3.4, 0.5], [[0, 0.62, 0.62, 0], [0.12, 0.92, 0.9, 0], [0.55, 1, 1, 0], [0.82, 0.8, 0.76, -0.04], [0.95, 0.42, 0.42, -0.1], [1, 0.12, 0.12, -0.12]], { color: hull, boxy: 0.35, name: 'hull', edge: 'soft' })
      .loft([4.25, 0.5, 18], [0, 3.6, 0.0], [[0, 1, 1], [0.7, 1, 1], [1, 0.5, 0.8]], { color: trim, boxy: 0.5, parent: 'hull', edge: 'soft' })
      .loft([1.9, 1.3, 4.2], [0, 4.85, 6.8], [[0, 0.5, 0.3], [0.35, 0.95, 1], [0.8, 0.85, 0.85], [1, 0.3, 0.2]], { color: '#3d5a73', cut: 'top', parent: 'hull' })
      .wedge([5.0, 2.8, 0.25], [0, 6.2, -8.2], { color: hull, rot: [0, 90, 0], apex: 0.45, parent: 'hull' })
      .box([0.3, 0.6, 0.9], [0, 7.3, -10.3], { color: trim, parent: 'hull' })
      .box([2.2, 0.15, 4.2], [0, 1.62, -4.0], { color: '#c9ccd1', name: 'ramp', pivot: [0, 1.62, -1.9], mover: { kind: 'swing', axis: 'x', amount: -24 }, round: 0.2 })
      .box([1.8, 0.04, 3.8], [0, 1.71, -4.0], { color: '#5c6166', parent: 'ramp', noInk: true })
      .label('STAR-1', [2.6, 0.7], [2.06, 3.2, 3.5], { color: hull, rot: [0, 90, 0], parent: 'hull', depth: 0.05 })
      .label('STAR-1', [2.6, 0.7], [-2.06, 3.2, 3.5], { color: hull, rot: [0, -90, 0], parent: 'hull', depth: 0.05 });
    b.pair((s) => {
      b.box([7.5, 0.35, 5.0], [s * 5.2, 3.0, -3.2], { color: hull, rot: [0, s * 28, -s * 4], round: 0.3 });
      b.box([1.2, 0.36, 5.1], [s * 4.6, 3.02, -3.0], { color: trim, rot: [0, s * 28, -s * 4], round: 0.3 });
      b.box([0.25, 2.2, 2.4], [s * 8.6, 3.9, -6.0], { color: trim, rot: [-15, 0, 0], round: 0.3 });
      b.cyl([1.9, 5.0, 1.9], [s * 1.75, 3.2, -9.2], { color: '#9da3a8', rot: [90, 0, 0] });
      b.cyl([2.1, 0.7, 2.1], [s * 1.75, 3.2, -11.9], { color: '#5c6166', rot: [90, 0, 0], taper: 1.15 });
      b.cyl([1.6, 0.1, 1.6], [s * 1.75, 3.2, -12.28], { color: '#6fe8ff', rot: [90, 0, 0], name: s > 0 ? 'engineL' : 'engineR', mover: { kind: 'light', on: false } });
      b.ball([0.5, 0.3, 0.2], [s * 1.4, 2.9, 11.1], { color: '#fff6c8', glow: true });
      // rear landing legs with pads
      b.rod([s * 2.2, 2.4, -6.5], [s * 3.2, 0.25, -7.2], 0.3, '#5c6166');
      b.cyl([1.1, 0.25, 1.1], [s * 3.2, 0.125, -7.2], { color: '#3a3633' });
      b.box([0.06, 1.0, 0.8], [s * 2.1, 4.3, 7.2], { color: '#3d5a73', round: 0.3 });
    });
    b.rod([0, 2.0, 6.5], [0, 0.25, 7.0], 0.32, '#5c6166').cyl([1.0, 0.25, 1.0], [0, 0.125, 7.0], { color: '#3a3633' });
    return b
      .socket('pilot', [0, 4.6, 7.0], 'seat')
      .act({
        click: [
          [A.operate('ramp', 'open'), A.par(A.effect('steam', { dur: 2 }), A.say('Hsssss...', 1.5)), A.wait(2.5), A.operate('ramp', 'close')],
          [A.par(A.operate('engines', 'on'), A.anim('shake', 3), A.effect('smoke', { dur: 2 }), A.say('VWOOOOM!', 2)), A.wait(2), A.operate('engines', 'off')],
        ],
      })
      .done();
  }),
  // A garden spade (1 m) stuck in a heap of soil: steel blade with a tread edge, a socketed ash shaft, a D-grip.
  e('spade', 'garden', 'garden tools', () =>
    m('spade', { edge: 'sharp' })
      .ball([0.42, 0.16, 0.34], [0, 0.04, 0], { color: 'dirt', edge: 'soft' })
      .box([0.19, 0.27, 0.022], [0, 0.17, 0], { color: 'steel', round: 0.25, name: 'spade' })
      .box([0.2, 0.025, 0.05], [0, 0.31, 0], { color: '#5c6166', parent: 'spade' })
      .cyl([0.05, 0.14, 0.04], [0, 0.38, 0], { color: 'steel', taper: 0.75, parent: 'spade' })
      .cyl([0.038, 0.52, 0.038], [0, 0.71, 0], { color: 'lightwood', parent: 'spade', edge: 'soft' })
      .box([0.03, 0.12, 0.03], [0.05, 1.02, 0], { color: 'lightwood', rot: [0, 0, -25], parent: 'spade', edge: 'soft' })
      .box([0.03, 0.12, 0.03], [-0.05, 1.02, 0], { color: 'lightwood', rot: [0, 0, 25], parent: 'spade', edge: 'soft' })
      .cyl([0.034, 0.13, 0.034], [0, 1.08, 0], { color: '#2a2726', rot: [0, 0, 90], parent: 'spade', edge: 'soft' })
      .act({ click: [A.pose('spade', { move: [0, 0.18, 0.05], rot: [-25, 0, 0], dur: 0.5 }), A.pose('spade', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.2 }), A.par(A.effect('dust', { dur: 1 }), A.say('Shhk!', 1))] })
      .done(),
  ),
  // A rack of barbecue spare ribs (30 cm) on a carving board: sticky glazed meat, bone ends showing, char lines. A
  // rib can be pulled off.
  e('spare ribs', 'food', 'meat', () => {
    const b = m('spare ribs')
      .box([0.36, 0.022, 0.24], [0, 0.011, 0], { color: 'lightwood', round: 0.2, edge: 'sharp' })
      .box([0.24, 0.045, 0.14], [-0.02, 0.045, 0], { color: '#8a3a1e', round: 0.6, name: 'rack' });
    b.each(5, (i) => {
      const x = -0.115 + i * 0.045;
      b.stick([x, 0.042, 0.055], [x, 0.042, 0.1], 0.014, 'cream', { parent: 'rack' });
      b.box([0.006, 0.004, 0.12], [x + 0.022, 0.068, 0], { color: '#3a1408', noInk: true, parent: 'rack' });
    });
    b.box([0.04, 0.04, 0.13], [0.13, 0.044, -0.005], { color: '#93401f', round: 0.6, name: 'rib', parent: 'rack', piece: true })
      .stick([0.13, 0.044, 0.055], [0.13, 0.044, 0.1], 0.014, 'cream', { parent: 'rib' })
      .ball([0.03, 0.01, 0.02], [0.15, 0.025, -0.09], { color: '#7cc45a' });
    return b.act({ click: [[A.detach('rib', 'rib'), A.par(A.effect('steam', { dur: 1.2 }), A.say('Sizzle! Mmm.', 1.4))], [A.reattach('rib')]] }).done();
  }),
  // A pair of spark plugs (8 cm): threaded steel base, hex nut, white porcelain insulator with ribs, terminal on top,
  // the electrode at the bottom. They spark.
  e('spark plugs', 'garage', 'car parts', () => {
    const b = m('spark plugs', { edge: 'sharp' });
    b.pair((s) => {
      const x = s * 0.022, zz = s * 0.008;
      b.cyl([0.013, 0.02, 0.013], [x, 0.012, zz], { color: 'steel' })
        .cyl([0.0135, 0.002, 0.0135], [x, 0.008, zz], { color: '#5c6166', noInk: true })
        .cyl([0.0135, 0.002, 0.0135], [x, 0.016, zz], { color: '#5c6166', noInk: true })
        .cyl([0.022, 0.012, 0.022], [x, 0.028, zz], { color: 'silver', segs: 6 })
        .cyl([0.016, 0.045, 0.016], [x, 0.056, zz], { color: 'white', taper: 0.72, edge: 'soft' })
        .cyl([0.0165, 0.003, 0.0165], [x, 0.048, zz], { color: '#e8e4dc', noInk: true })
        .cyl([0.0155, 0.003, 0.0155], [x, 0.056, zz], { color: '#e8e4dc', noInk: true })
        .cyl([0.007, 0.012, 0.007], [x, 0.084, zz], { color: 'silver' })
        .ball(0.008, [x, 0.092, zz], { color: 'silver' })
        .stick([x, 0.002, zz], [x + 0.003, -0.0, zz], 0.002, 'steel');
    });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 0.8 }), A.anim('shake'), A.say('Zap!', 1))] }).done();
  }),
  // Three sparklers (30 cm wire) standing in a pot of sand. Light them: the tips fizz and throw sparks.
  e('sparklers', 'toys', 'fireworks', () => {
    const b = m('sparklers').cyl([0.09, 0.07, 0.09], [0, 0.035, 0], { color: '#c87a4a', taper: 1.15, edge: 'sharp' }).cyl([0.096, 0.01, 0.096], [0, 0.07, 0], { color: 'sand' });
    b.each(3, (i) => {
      const a = (i - 1) * 0.22, tip = (l: number): V => [Math.sin(a) * l, 0.07 + Math.cos(a) * l, (i - 1) * 0.012];
      b.stick(tip(0), tip(0.3), 0.003, 'steel');
      b.stick(tip(0.12), tip(0.29), 0.008, '#7a7a74');
      b.ball(0.02, tip(0.3), { color: '#ffd24a', name: `tip${i + 1}`, mover: { kind: 'light', on: false } });
    });
    return b
      .act({ click: [A.operate('tips', 'on'), A.par(A.effect('sparkle', { dur: 3 }), A.effect('fire', { dur: 0.4 }), A.say('Fzzzzzt!', 2.5)), A.wait(2.5), A.operate('tips', 'off')] })
      .done();
  }),
  // A slotted steel turner / fish slice (30 cm) standing on its handle: angled offset neck, black riveted handle.
  e('spatula', 'kitchen', 'utensils', () => {
    const b = m('spatula', { edge: 'sharp' })
      .box([0.028, 0.15, 0.016], [0, 0.075, 0], { color: '#2a2726', round: 0.9, name: 'spatula' })
      .ball(0.005, [0, 0.05, 0.009], { color: 'silver', parent: 'spatula' })
      .ball(0.005, [0, 0.1, 0.009], { color: 'silver', parent: 'spatula' })
      .box([0.014, 0.07, 0.004], [0, 0.18, 0.006], { color: 'steel', rot: [-12, 0, 0], parent: 'spatula' })
      .box([0.085, 0.11, 0.003], [0, 0.265, 0.016], { color: 'silver', round: 0.15, parent: 'spatula' });
    b.each(4, (i) => b.box([0.007, 0.07, 0.004], [-0.024 + i * 0.016, 0.27, 0.017], { color: '#3a3f45', round: 0.9, parent: 'spatula', noInk: true }));
    return b.act({ click: [A.pose('spatula', { move: [0, 0.08, 0], rot: [-50, 0, 0], dur: 0.25 }), A.pose('spatula', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 }), A.say('Flip!', 1)] }).done();
  }),
  // A bookshelf loudspeaker (32 cm): walnut cabinet, a woofer cone with its surround and dust cap (it pumps), a dome
  // tweeter, a bass port and a little badge.
  e('speaker', 'music', 'audio', () =>
    m('speaker', { edge: 'sharp' })
      .box([0.2, 0.32, 0.24], [0, 0.16, 0], { color: '#6b4226', round: 0.08 })
      .box([0.19, 0.31, 0.01], [0, 0.16, 0.12], { color: '#2a2726', round: 0.1 })
      .cyl([0.15, 0.012, 0.15], [0, 0.11, 0.126], { color: '#3a3633', rot: [90, 0, 0] })
      .torus([0.15, 0.15, 0.012], [0, 0.11, 0.128], { color: '#5c6166', tube: 0.1, edge: 'soft' })
      .cyl([0.13, 0.02, 0.13], [0, 0.11, 0.125], { color: '#4a4744', rot: [-90, 0, 0], taper: 0.4, name: 'woofer', edge: 'soft' })
      .dome([0.045, 0.02, 0.045], [0, 0.11, 0.141], { color: '#2a2726', rot: [90, 0, 0], parent: 'woofer', edge: 'soft' })
      .cyl([0.06, 0.01, 0.06], [0, 0.25, 0.126], { color: '#5c6166', rot: [90, 0, 0] })
      .dome([0.03, 0.012, 0.03], [0, 0.25, 0.136], { color: 'silver', rot: [90, 0, 0], edge: 'soft' })
      .cyl([0.04, 0.012, 0.04], [0, 0.035, 0.126], { color: '#1e1c1b', rot: [90, 0, 0] })
      .label('HI-FI', [0.04, 0.012], [0.06, 0.3, 0.127], { color: 'silver', depth: 0.002 })
      .act({
        click: [
          A.pose('woofer', { move: [0, 0, 0.012], dur: 0.12 }),
          A.pose('woofer', { move: [0, 0, 0], dur: 0.12 }),
          A.par(A.pose('woofer', { move: [0, 0, 0.012], dur: 0.12 }), A.anim('pulse', 2), A.say('Boom, boom, boom!', 1.8)),
          A.pose('woofer', { move: [0, 0, 0], dur: 0.12 }),
          A.pose('woofer', { move: [0, 0, 0.012], dur: 0.12 }),
          A.pose('woofer', { move: [0, 0, 0], dur: 0.12 }),
        ],
      })
      .done(),
  ),
  // A spear (2 m) standing in a stone stand: leaf-shaped steel head with a midrib, socket and rivet, ash shaft with a
  // leather grip, iron butt spike. It thrusts.
  e('spear', 'armory', 'polearms', () =>
    m('spear', { edge: 'sharp' })
      .box([0.34, 0.16, 0.34], [0, 0.08, 0], { color: 'stone', round: 0.2 })
      .cyl([0.034, 1.78, 0.034], [0, 0.94, 0], { color: 'lightwood', name: 'spear', pivot: [0, 0.16, 0], edge: 'soft' })
      .cone([0.036, 0.1, 0.036], [0, 0.1, 0], { color: 'iron', rot: [180, 0, 0], parent: 'spear' })
      .cyl([0.04, 0.24, 0.04], [0, 1.1, 0], { color: 'leather', parent: 'spear', edge: 'soft' })
      .cyl([0.036, 0.12, 0.036], [0, 1.88, 0], { color: 'iron', taper: 0.75, parent: 'spear' })
      .ball(0.012, [0, 1.88, 0.018], { color: 'silver', parent: 'spear' })
      .ball([0.1, 0.3, 0.025], [0, 2.07, 0], { color: 'steel', parent: 'spear' })
      .box([0.008, 0.28, 0.03], [0, 2.07, 0], { color: 'silver', parent: 'spear' })
      .cone([0.05, 0.1, 0.022], [0, 2.25, 0], { color: 'steel', parent: 'spear' })
      .act({ click: [A.pose('spear', { move: [0, 0.4, 0], rot: [-70, 0, 0], dur: 0.5 }), A.pose('spear', { move: [0, 0.4, 0.5], rot: [-80, 0, 0], dur: 0.15 }), A.say('Swish!', 1), A.pose('spear', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // A comic speech bubble (30 cm sign on a little stand) with a tail and three "typing" dots that bounce in turn.
  // It speaks.
  e('speech bubble', 'ideas', 'symbols', () =>
    m('speech bubble')
      .box([0.1, 0.012, 0.06], [0, 0.006, 0], { color: '#5c6166', round: 0.4, edge: 'sharp' })
      .stick([0, 0.01, 0], [0, 0.07, 0], 0.008, '#5c6166')
      .ball([0.3, 0.2, 0.04], [0.02, 0.2, 0], { color: 'white' })
      .cone([0.07, 0.11, 0.03], [-0.07, 0.09, 0], { color: 'white', rot: [0, 0, 150], segs: 3 })
      .ball(0.035, [-0.05, 0.2, 0.02], { color: '#2a2726', name: 'dot1' })
      .ball(0.035, [0.02, 0.2, 0.02], { color: '#2a2726', name: 'dot2' })
      .ball(0.035, [0.09, 0.2, 0.02], { color: '#2a2726', name: 'dot3' })
      .act({
        click: [
          [A.pose('dot1', { move: [0, 0.025, 0], dur: 0.15 }), A.pose('dot1', { move: [0, 0, 0], dur: 0.15 }), A.pose('dot2', { move: [0, 0.025, 0], dur: 0.15 }), A.pose('dot2', { move: [0, 0, 0], dur: 0.15 }), A.pose('dot3', { move: [0, 0.025, 0], dur: 0.15 }), A.pose('dot3', { move: [0, 0, 0], dur: 0.15 }), A.say('Hello!', 1.6)],
          [A.par(A.anim('pulse'), A.say('Psst... over here!', 1.8))],
        ],
      })
      .done(),
  ),
  // A rubber speed hump across a 3.6 m lane: bolted black and yellow segments with reflectors. Ba-dump.
  e('speed bump', 'places', 'street things', () => {
    const b = m('speed bump', { edge: 'sharp' }).box([4.0, 0.012, 1.4], [0, 0.006, 0], { color: '#4a4744', round: 0.2 });
    b.each(8, (i) => {
      const x = -1.575 + i * 0.45;
      b.cyl([0.44, 0.9, 0.18], [x, 0.0, 0], { color: i % 2 ? '#f6d24a' : '#2a2726', rot: [90, 0, 0], round: 0.1 });
      b.ball(0.025, [x - 0.12, 0.072, 0.2], { color: 'silver', noInk: true }).ball(0.025, [x + 0.12, 0.072, -0.2], { color: 'silver', noInk: true });
      if (i % 2 === 0) b.box([0.12, 0.02, 0.04], [x, 0.06, 0.36], { color: '#fff6c8', glow: true });
    });
    return b.act({ click: [A.par(A.anim('shake'), A.effect('dust', { dur: 1 }), A.say('Ba-dump!', 1.2))] }).done();
  }),
  // A roadside speed camera (3 m): grey post with a SPEED CHECK sign, a yellow housing with lens, IR window and the
  // flash (a light). Flash!
  e('speed camera', 'places', 'street things', () =>
    m('speed camera', { edge: 'sharp' })
      .box([0.5, 0.1, 0.5], [0, 0.05, 0], { color: 'stone', round: 0.1 })
      .stick([0, 0.1, 0], [0, 2.4, 0], 0.14, '#9da3a8')
      .box([0.5, 0.6, 0.6], [0, 2.7, 0], { color: '#f6d24a', round: 0.08 })
      .box([0.56, 0.06, 0.66], [0, 3.03, 0.02], { color: '#5c6166', round: 0.2 })
      .cyl([0.16, 0.06, 0.16], [0.1, 2.78, 0.31], { color: '#2a2726', rot: [90, 0, 0] })
      .cyl([0.1, 0.02, 0.1], [0.1, 2.78, 0.345], { color: '#3d5a73', rot: [90, 0, 0] })
      .box([0.14, 0.1, 0.02], [-0.13, 2.82, 0.31], { color: '#7a1f1f' })
      .box([0.36, 0.14, 0.03], [0, 2.52, 0.31], { color: 'white', name: 'flash', mover: { kind: 'light', on: false } })
      .box([0.6, 0.4, 0.04], [0, 1.6, 0.1], { color: 'white', round: 0.2 })
      .label('SPEED CHECK', [0.52, 0.12], [0, 1.66, 0.125], { color: 'white', depth: 0.01 })
      .cyl([0.14, 0.02, 0.14], [0, 1.5, 0.125], { color: '#2a2726', rot: [90, 0, 0] })
      .act({ click: [A.operate('flash', 'on'), A.par(A.effect('sparkle', { dur: 0.5 }), A.say('FLASH!', 1.2)), A.wait(0.4), A.operate('flash', 'off'), A.say('Click-click.', 1)] })
      .done(),
  ),
  // A motor speedway (60 m oval, the vocabulary's 10 cm is far too small): banked asphalt with a white edge line,
  // grass infield, a chequered start line under a starting-light gantry, a pit wall and a grandstand. The lights go
  // red, then green: GO!
  e('speedway', 'places', 'sports venues', () => {
    const b = m('speedway', { edge: 'sharp' })
      .cyl([62, 0.1, 34], [0, 0.05, 0], { color: '#5c6166' })
      .cyl([46, 0.14, 18], [0, 0.07, 0], { color: 'grass', edge: 'soft' })
      .torus([61, 33, 0.12], [0, 0.11, 0], { color: 'white', rot: [90, 0, 0], tube: 0.006, noInk: true })
      .torus([47, 19, 0.12], [0, 0.13, 0], { color: 'white', rot: [90, 0, 0], tube: 0.01, noInk: true })
      .torus([64, 36, 1.2], [0, 0.6, 0], { color: '#c9ccd1', rot: [90, 0, 0], tube: 0.03 })
      .box([16, 1.0, 0.4], [0, 0.5, 10.2], { color: '#c9ccd1', round: 0.2 })
      .label('SPEEDWAY', [12, 1.4], [0, 8.6, -21.3], { color: '#e0473b', depth: 0.2 });
    b.each(8, (i) => b.box([1.0, 0.012, 1.0], [-3.5 + i, 0.106, 13.7 + (i % 2) * 0], { color: i % 2 ? 'white' : '#2a2726' }));
    b.each(8, (i) => b.box([1.0, 0.012, 1.0], [-3.5 + i, 0.106, 14.7], { color: i % 2 ? '#2a2726' : 'white' }));
    // the grandstand along the back straight
    b.each(6, (i) => b.box([30, 0.8, 1.1], [0, 0.4 + i * 0.8, -18.5 - i * 1.0], { color: i % 2 ? '#9da3a8' : '#c9ccd1', round: 0.1 }));
    b.box([30, 0.3, 7.5], [0, 7.5, -21.0], { color: '#e0473b', round: 0.2 });
    b.pair((s) => b.stick([s * 14.5, 0, -18.0], [s * 14.5, 7.4, -18.0], 0.3, '#9da3a8').stick([s * 14.5, 0, -24.5], [s * 14.5, 7.4, -24.5], 0.3, '#9da3a8'));
    // start gantry with lights
    b.pair((s) => b.stick([s * 8.5, 0, 14.2], [s * 8.5, 6.0, 14.2], 0.3, '#5c6166'));
    b.box([17.4, 1.0, 0.6], [0, 6.2, 14.2], { color: '#2a2726', round: 0.1 });
    b.each(3, (i) => b.ball(0.7, [-2 + i * 2, 6.2, 14.55], { color: '#ff3b2f', name: `red${i + 1}`, mover: { kind: 'light', on: false } }));
    b.ball(0.7, [4.5, 6.2, 14.55], { color: '#3fe05a', name: 'green', mover: { kind: 'light', on: false } });
    return b
      .act({
        click: [A.operate('red1', 'on'), A.wait(0.6), A.operate('red2', 'on'), A.wait(0.6), A.operate('red3', 'on'), A.wait(0.8), A.par(A.operate('reds', 'off'), A.operate('green', 'on'), A.say('GO! GO! GO!', 1.8), A.effect('dust', { dur: 1.5 })), A.wait(2), A.operate('green', 'off')],
      })
      .done();
  }),
  // A geometry-model sphere (20 cm) in glossy blue on a ring stand. It bounces; it spins.
  e('sphere', 'ideas', 'shapes', () =>
    m('sphere')
      .torus([0.1, 0.1, 0.02], [0, 0.01, 0], { color: '#5c6166', rot: [90, 0, 0], tube: 0.2, edge: 'sharp' })
      .ball(0.2, [0, 0.112, 0], { color: '#4e8fd6' })
      .ball(0.04, [-0.04, 0.16, 0.07], { color: '#cfe3fb', noInk: true })
      .act({ click: [[A.par(A.anim('bounce', 2), A.say('Boing!', 1))], [A.anim('spin', 2)]] })
      .done(),
  ),
  // The Great Sphinx at its real size (73 m long, 20 m high, nose to +z): a crouching lion's body with long
  // outstretched paws on a bedrock floor, a human head in a pleated nemes headdress with its lappets, the nose long
  // gone, the tail curled along the right haunch. It sets the riddle.
  e('sphinx (structure)', 'places', 'landmarks', () => {
    const st = '#d9b77a', dk = '#c4a067', hd = '#d3ad70', ln = '#b8955e';
    const b = m('sphinx (structure)', { view: 'side' })
      .box([28, 1.2, 82], [0, 0.6, 2], { color: '#c2a06a', round: 0.02, edge: 'sharp' })
      .ball([17, 12, 22], [0, 6.2, -24], { color: st })
      .loft([16, 12.5, 40], [0, 7.4, -6], [[0, 0.85, 0.8, -0.05], [0.3, 0.95, 0.9, 0], [0.75, 1, 1, 0.02], [1, 0.95, 1, 0.02]], { color: st, boxy: 0.55 })
      .box([13, 12.5, 9], [0, 7.6, 13], { color: st, round: 0.35 })
      .box([8, 5, 7], [0, 14.5, 14], { color: dk, round: 0.3 })
      .box([5.6, 6.4, 5.2], [0, 17.2, 16.6], { color: hd, round: 0.3, name: 'head' })
      .box([10.5, 7.4, 6.5], [0, 17.6, 14.0], { color: st, round: 0.25, parent: 'head' })
      .dome([10.5, 2.2, 6.5], [0, 22.4, 14.0], { color: st, parent: 'head' })
      .box([1.0, 0.9, 0.5], [0, 16.8, 19.35], { color: dk, round: 0.5, parent: 'head' })
      .box([2.4, 0.45, 0.4], [0, 15.4, 19.25], { color: '#8a6440', round: 0.5, parent: 'head' })
      .box([2.2, 0.6, 0.4], [0, 19.0, 19.25], { color: ln, round: 0.5, parent: 'head' })
      .cyl([1.2, 2.0, 1.2], [0, 22.6, 14.3], { color: dk, parent: 'head' })
      .rod([5.5, 4.5, -32], [6.5, 1.8, -12], 1.2, dk);
    b.pair((s) => {
      b.box([4.6, 3.2, 18], [s * 4.4, 2.8, 22], { color: st, round: 0.45 });
      b.box([4.7, 1.6, 2.4], [s * 4.4, 2.2, 31], { color: dk, round: 0.5 });
      b.each(3, (i) => b.box([0.25, 1.2, 1.6], [s * 4.4 + (i - 1) * 1.2, 2.3, 32.0], { color: ln, noInk: true }));
      b.box([2.6, 7, 2.6], [s * 4.2, 14.4, 16.2], { color: st, round: 0.3, parent: 'head' });
      b.each(5, (i) => b.box([0.3, 0.3, 6.6], [s * (2.9 + i * 0.5), 15.8 + i * 1.2, 14.0], { color: ln, parent: 'head', noInk: true }));
      b.each(4, (i) => b.box([2.7, 0.25, 2.7], [s * 4.2, 11.6 + i * 1.6, 16.2], { color: ln, parent: 'head', noInk: true }));
      b.box([1.3, 0.45, 0.3], [s * 1.35, 17.8, 19.3], { color: '#6b4a2e', parent: 'head', noInk: true });
      b.box([1.5, 0.3, 0.3], [s * 1.35, 18.5, 19.3], { color: ln, parent: 'head', noInk: true });
      b.box([1.0, 2.2, 1.0], [s * 3.2, 17.4, 17.0], { color: hd, round: 0.45, parent: 'head' });
      b.box([0.6, 8, 20], [s * 8.2, 6.0, -8], { color: dk, round: 0.5 });
    });
    return b
      .act({ click: [[A.par(A.effect('dust', { dur: 2.5 }), A.say('What walks on four legs at dawn, two at noon and three at dusk?', 4))], [A.par(A.effect('sparkle', { dur: 2 }), A.say('...A person. You may pass.', 2.5))]] })
      .done();
  }),
  // A wall-mounted wooden spice rack (42 cm): two shelves with guard rails, eight glass jars of coloured spices with
  // caps and labels. Take the pepper down: achoo!
  e('spice rack', 'kitchen', 'storage', () => {
    const b = m('spice rack', { edge: 'sharp' })
      .box([0.44, 0.34, 0.02], [0, 0.17, -0.06], { color: 'wood', round: 0.1, name: 'back' })
      .box([0.44, 0.016, 0.12], [0, 0.008, 0], { color: 'wood', round: 0.2 })
      .box([0.44, 0.016, 0.12], [0, 0.17, 0], { color: 'wood', round: 0.2 })
      .arc([0.24, 0.1, 0.02], [0, 0.335, -0.06], { color: 'wood', tube: 0.3 });
    b.pair((s) => b.box([0.02, 0.34, 0.12], [s * 0.21, 0.17, 0], { color: 'darkwood', round: 0.2 }));
    b.each(2, (i) => b.stick([-0.2, 0.06 + i * 0.162, 0.05], [0.2, 0.06 + i * 0.162, 0.05], 0.01, 'darkwood'));
    const cols = ['#c0392b', '#e8b33a', '#5aa553', '#3a3633', '#f0923b', '#d9b98a', '#7a1f1f', '#8a8f3a'];
    b.each(8, (i) => {
      const x = -0.15 + (i % 4) * 0.1, y = i < 4 ? 0.178 : 0.016, n = i === 3 ? 'jar' : `jar${i}`;
      b.cyl([0.05, 0.072, 0.05], [x, y + 0.036, 0], { color: cols[i], name: n, ...(i === 3 ? { parent: 'back', piece: true } : {}) })
        .cyl([0.052, 0.02, 0.052], [x, y + 0.046, 0], { color: 'white', parent: n, noInk: true })
        .cyl([0.05, 0.012, 0.05], [x, y + 0.074, 0], { color: '#d6f0fa', parent: n })
        .cyl([0.052, 0.016, 0.052], [x, y + 0.088, 0], { color: i % 2 ? '#2a2726' : 'silver', parent: n, segs: 16 });
    });
    return b.act({ click: [[A.detach('jar', 'pepper'), A.par(A.effect('dust', { dur: 1.2 }), A.say('Achoo!', 1.4))], [A.reattach('jar')]] }).done();
  }),
  // A forged railroad spike (15 cm): square shank, chisel point, offset hooked head. Tapped in: tink, tink.
  e('spike', 'workshop', 'hardware', () =>
    m('spike', { edge: 'sharp' })
      .box([0.12, 0.012, 0.08], [0, 0.006, 0], { color: 'lightwood', round: 0.2 })
      .box([0.017, 0.13, 0.017], [0, 0.065, 0], { color: 'iron', round: 0.1, name: 'spike' })
      .cyl([0.017, 0.025, 0.017], [0, 0.0, 0], { color: 'iron', rot: [180, 0, 0], segs: 4, taper: 0.1, parent: 'spike' })
      .box([0.036, 0.014, 0.03], [0.006, 0.137, 0], { color: 'iron', round: 0.2, parent: 'spike' })
      .box([0.012, 0.008, 0.03], [0.022, 0.131, 0], { color: '#3a3633', round: 0.2, parent: 'spike' })
      .act({
        click: [
          [A.pose('spike', { move: [0, -0.02, 0], dur: 0.15 }), A.say('Tink!', 0.8), A.pose('spike', { move: [0, -0.04, 0], dur: 0.15 }), A.say('Tink!', 0.8)],
          [A.pose('spike', { move: [0, 0, 0], dur: 0.6 }), A.say('Screech...', 1)],
        ],
      })
      .done(),
  ),
  // A bunch of fresh spinach (30 cm) tied with a rubber band: dark crinkled leaves on pale stems.
  e('spinach', 'food', 'vegetables', () => {
    const b = m('spinach').cyl([0.05, 0.1, 0.05], [0, 0.05, 0], { color: '#a8d878', name: 'bunch' }).cyl([0.054, 0.015, 0.054], [0, 0.06, 0], { color: '#e0473b', parent: 'bunch' });
    b.each(7, (i) => {
      const a = (i * Math.PI * 2) / 7 + 0.3, r = 0.05 + (i % 2) * 0.02;
      b.rod([0, 0.09, 0], [Math.sin(a) * r * 0.6, 0.15, Math.cos(a) * r * 0.6], 0.012, '#a8d878', { parent: 'bunch' });
      b.ball([0.11, 0.17, 0.025], [Math.sin(a) * r, 0.22 + (i % 3) * 0.02, Math.cos(a) * r], { color: i % 2 ? '#2f6a2a' : '#3f7a3a', rot: [Math.cos(a) * 20, (a / D) % 360, -Math.sin(a) * 20], parent: 'bunch' });
    });
    return b.act({ click: [A.par(A.anim('wobble'), A.effect('sparkle', { dur: 1 }), A.say('Crunch!', 1))] }).done();
  }),
  // A teaching model of the spine (45 cm) on a stand: curved column of vertebrae with spinous processes and discs,
  // a sacrum at the base. The upper half bends.
  e('spine', 'clinic', 'bones', () => {
    const b = m('spine')
      .box([0.16, 0.025, 0.12], [0, 0.0125, 0], { color: 'darkwood', round: 0.2, edge: 'sharp' })
      .stick([0, 0.025, -0.07], [0, 0.46, -0.07], 0.01, 'steel', { edge: 'sharp' })
      .cone([0.09, 0.08, 0.05], [0, 0.07, -0.02], { color: '#e8dcc0', rot: [180, 0, 0] })
      .box([0.04, 0.03, 0.03], [0, 0.11, -0.01], { color: '#e8dcc0', name: 'lower', round: 0.4 });
    b.each(14, (i) => {
      const y = 0.13 + i * 0.024, z = 0.018 * Math.sin(i * 0.42 + 0.6), w = 0.06 - i * 0.0018, p = i < 7 ? 'lower' : 'upper';
      if (i === 7) b.box([0.04, 0.012, 0.03], [0, y - 0.01, z], { color: '#d6c8a8', name: 'upper', parent: 'lower', pivot: [0, y - 0.012, z], round: 0.4 });
      b.cyl([w, 0.016, w * 0.8], [0, y, z], { color: '#efe6cf', parent: p });
      b.cyl([w * 0.9, 0.006, w * 0.72], [0, y + 0.011, z], { color: '#d98a8a', parent: p, noInk: true });
      b.rod([0, y, z - w * 0.35], [0, y - 0.01, z - w * 0.35 - 0.028], 0.012, '#efe6cf', { parent: p });
      b.pair((s) => b.rod([s * w * 0.3, y, z - w * 0.2], [s * w * 0.75, y + 0.002, z - w * 0.3], 0.008, '#efe6cf', { parent: p }));
    });
    return b.act({ click: [[A.pose('upper', { rot: [0, 0, 14], dur: 0.6 }), A.say('Crack!', 1)], [A.pose('upper', { rot: [-12, 0, 0], dur: 0.6 }), A.pose('upper', { rot: [0, 0, 0], dur: 0.5 })]] }).done();
  }),
  // A painted wooden spinning top (8 cm): stripes, a turned peg on top and a steel tip. Spin it: it whirls.
  e('spinning top', 'toys', 'classic toys', () =>
    m('spinning top')
      .cyl([0.08, 0.028, 0.08], [0, 0.045, 0], { color: '#e0473b', name: 'body', mover: { kind: 'spin', axis: 'y', amount: 1080 } })
      .cone([0.08, 0.034, 0.08], [0, 0.014, 0], { color: '#e0473b', rot: [180, 0, 0], parent: 'body' })
      .torus([0.084, 0.084, 0.012], [0, 0.045, 0], { color: '#f6d24a', rot: [90, 0, 0], parent: 'body', tube: 0.1 })
      .cyl([0.078, 0.022, 0.078], [0, 0.07, 0], { color: '#4e8fd6', taper: 0.35, parent: 'body' })
      .stick([0, 0.075, 0], [0, 0.11, 0], 0.012, 'wood', { parent: 'body' })
      .ball(0.014, [0, 0.112, 0], { color: 'wood', parent: 'body' })
      .cone([0.008, 0.008, 0.008], [0, -0.0, 0], { color: 'steel', rot: [180, 0, 0], parent: 'body' })
      .act({ click: [A.operate('body', 'on'), A.par(A.anim('wobble', 3), A.say('Whirrrr...', 2.5)), A.wait(1), A.operate('body', 'off'), A.anim('wobble')] })
      .done(),
  ),
  // A Saxony spinning wheel (1 m): slanted bench on three turned legs, a spoked drive wheel (spins) with its drive
  // band, the flyer and bobbin, a distaff of wool and a treadle (it pumps).
  e('spinning wheel', 'home', 'crafts', () => {
    const W: V = [-0.12, 0.72, 0];
    const b = m('spinning wheel', { edge: 'sharp' })
      .box([0.95, 0.07, 0.24], [0.05, 0.4, 0], { color: 'wood', rot: [0, 0, -6], round: 0.3 })
      .torus([0.62, 0.62, 0.04], W, { color: 'wood', name: 'wheel', tube: 0.07, mover: { kind: 'spin', axis: 'z', amount: 300 } })
      .cyl([0.08, 0.08, 0.08], W, { color: 'darkwood', rot: [90, 0, 0], parent: 'wheel' });
    b.each(8, (i) => b.stick(W, xy(W[0], W[1], 0.29, (i * Math.PI) / 4), 0.018, 'darkwood', { parent: 'wheel' }));
    b.pair((s) => {
      b.stick([W[0], 0.42, s * 0.06], [W[0], 0.78, s * 0.06], 0.035, 'darkwood');
      b.stick([0.42, 0.42, s * 0.09], [0.5, 0, s * 0.14], 0.04, 'darkwood');
    });
    b.stick([-0.38, 0.38, 0], [-0.46, 0, 0], 0.04, 'darkwood')
      .stick([0.38, 0.44, 0], [0.38, 0.72, 0], 0.035, 'darkwood')
      .stick([0.24, 0.73, 0], [0.54, 0.73, 0], 0.02, 'darkwood')
      .cyl([0.06, 0.12, 0.06], [0.38, 0.73, 0], { color: 'wool', rot: [0, 0, 90] })
      .torus([0.12, 0.12, 0.02], [0.47, 0.73, 0], { color: 'darkwood', rot: [0, 90, 0], tube: 0.15 })
      .rod([0.3, 0.73, 0.04], [-0.1, 1.0, 0.04], 0.004, 'tan', { edge: 'soft' })
      .rod([0.3, 0.73, 0.04], [-0.1, 0.44, 0.04], 0.004, 'tan', { edge: 'soft' })
      .stick([0.2, 0.44, -0.08], [0.32, 1.05, -0.12], 0.025, 'darkwood')
      .ball([0.16, 0.24, 0.16], [0.33, 1.06, -0.12], { color: 'wool', edge: 'soft' })
      .box([0.3, 0.025, 0.2], [-0.12, 0.06, 0.24], { color: 'wood', name: 'treadle', pivot: [-0.12, 0.05, 0.12], mover: { kind: 'swing', axis: 'x', amount: 12 } })
      .stick([-0.12, 0.07, 0.28], [-0.12, 0.62, 0.04], 0.014, 'darkwood', { parent: 'treadle' });
    return b
      .act({ click: [A.operate('wheel', 'on'), A.operate('treadle', 'on'), A.operate('treadle', 'off'), A.par(A.operate('treadle', 'on'), A.say('Whirr, whirr...', 2)), A.operate('treadle', 'off'), A.wait(1), A.operate('wheel', 'off')] })
      .done();
  }),
  // A cast-iron spiral staircase (3 m): central column, 14 wedge treads turning round it, balusters, a curling
  // handrail and a landing at the top. A ball bounces all the way down.
  e('spiral staircase', 'home', 'stairs', () => {
    const b = m('spiral staircase', { edge: 'sharp' })
      .cyl([0.5, 0.05, 0.5], [0, 0.025, 0], { color: '#3a3633' })
      .stick([0, 0, 0], [0, 3.15, 0], 0.16, '#3a3633')
      .cyl([1.0 * Math.SQRT2, 0.06, 1.0 * Math.SQRT2], [0, 3.0, 0], { color: '#5c6166', segs: 4 }); // the 1 m square landing its rails stand on (sized corner to corner)
    let last: V | null = null;
    const N = 13;
    b.each(N, (i) => {
      const a = (i * 27 * Math.PI) / 180, y = 0.21 + i * 0.21;
      const c = Math.cos(a), s = Math.sin(a);
      b.cyl([0.95, 0.045, 0.32], [c * 0.45, y, s * 0.45], { color: '#5c6166', rot: [0, -a / D, 0], segs: 3, taper: 1 });
      b.box([0.8, 0.045, 0.26], [c * 0.42, y, s * 0.42], { color: 'wood', rot: [0, -a / D, 0], round: 0.2 });
      const top: V = [c * 0.82, y + 0.9, s * 0.82];
      b.stick([c * 0.82, y, s * 0.82], top, 0.022, '#3a3633');
      if (last) b.rod(last, top, 0.045, 'darkwood', { edge: 'soft' });
      last = top;
    });
    b.pair((s) => b.stick([s * 0.5, 3.0, 0.5], [s * 0.5, 3.9, 0.5], 0.022, '#3a3633').stick([0.5, 3.0, s * 0.5], [0.5, 3.9, s * 0.5], 0.022, '#3a3633'));
    b.stick([-0.5, 3.9, 0.5], [0.5, 3.9, 0.5], 0.04, 'darkwood').stick([0.5, 3.9, -0.5], [0.5, 3.9, 0.5], 0.04, 'darkwood');
    // an unseen carrier on the column: the ball rides it round and down
    b.box([0.1, 0.02, 0.1], [0.5, 3.03, 0.0], { color: '#5c6166', name: 'carrier', pivot: [0, 3.0, 0], scale: 0 });
    return b
      .socket('landing', [0.5, 3.03, 0.0], 'top', { part: 'carrier', size: 0.4 })
      .act({
        click: [A.spawn('ball', 'soccer ball'), A.attach('ball', 'self', 'landing'), A.wait(0.4), A.par(A.pose('carrier', { rot: [0, 330, 0], move: [0, -2.8, 0], dur: 3 }), A.say('Bonk, bonk, bonk, bonk...', 3, 'ball')), A.wait(0.6), A.remove('ball', 'pop'), A.pose('carrier', { rot: [0, 0, 0], move: [0, 0, 0], dur: 0 })],
      })
      .done();
  }),
  // A church steeple (16 m, the vocabulary's 1 m is far too small): a stone tower with a clock face on each side, a
  // louvred belfry with its bell (it swings), and a tall octagonal slate spire with a gilt cross. Dong, dong.
  e('spire', 'places', 'towers', () => {
    const b = m('spire', { edge: 'sharp' })
      .box([4.2, 0.6, 4.2], [0, 0.3, 0], { color: '#9a9a92', round: 0.05 })
      .box([3.6, 6.4, 3.6], [0, 3.8, 0], { color: 'stone', round: 0.02 })
      .box([3.9, 0.3, 3.9], [0, 7.1, 0], { color: '#9a9a92', round: 0.1 })
      .box([3.4, 2.6, 3.4], [0, 8.5, 0], { color: 'stone', round: 0.02 })
      .box([3.8, 0.3, 3.8], [0, 9.9, 0], { color: '#9a9a92', round: 0.1 })
      .cyl([3.6, 7.2, 3.6], [0, 13.65, 0], { color: '#4f5a66', segs: 8, taper: 0.04 })
      .ball(0.35, [0, 17.3, 0], { color: 'gold' })
      .stick([0, 17.3, 0], [0, 18.5, 0], 0.12, 'gold')
      .stick([-0.35, 18.1, 0], [0.35, 18.1, 0], 0.12, 'gold')
      .box([1.4, 2.6, 0.12], [0, 1.3, 1.82], { color: 'darkwood', name: 'door', pivot: [-0.7, 1.3, 1.85], mover: { kind: 'swing', axis: 'y', amount: -80 } })
      .arc([1.6, 1.0, 0.16], [0, 2.6, 1.84], { color: '#9a9a92', tube: 0.15 })
      .ball([0.9, 0.9, 0.9], [0, 8.2, 0], { color: 'bronze', name: 'bell', pivot: [0, 8.9, 0], mover: { kind: 'swing', axis: 'x', amount: 35 } })
      .cyl([1.0, 0.7, 1.0], [0, 7.95, 0], { color: 'bronze', taper: 1.3, parent: 'bell' });
    for (const [rx, ry, x, z] of [[0, 0, 0, 1], [0, 90, 1, 0], [0, 180, 0, -1], [0, -90, -1, 0]] as const) {
      const fx = x * 1.82, fz = z * 1.82;
      b.cyl([1.3, 0.08, 1.3], [fx, 5.6, fz], { color: 'white', rot: [90, ry, 0] });
      b.torus([1.4, 1.4, 0.12], [fx * 1.01, 5.6, fz * 1.01], { color: 'gold', rot: [rx, ry, 0], tube: 0.06 });
      b.box([0.08, 0.5, 0.04], [fx * 1.03 + (z ? 0 : 0), 5.8, fz * 1.03], { color: '#2a2726', rot: [0, ry, 0] });
      b.box([0.08, 0.38, 0.04], [fx * 1.03 + z * 0.14, 5.6, fz * 1.03 - x * 0.14], { color: '#2a2726', rot: [0, ry, 90] });
      b.box([1.4, 1.8, 0.1], [x * 1.71, 8.5, z * 1.71], { color: '#2a2726', rot: [0, ry, 0] });
      b.each(4, (i) => b.box([1.42, 0.08, 0.14], [x * 1.73, 7.85 + i * 0.4, z * 1.73], { color: 'darkwood', rot: [0, ry, 0] }));
    }
    return b.act({ click: [A.operate('bell', 'on'), A.par(A.operate('bell', 'off'), A.say('DONG!', 1)), A.operate('bell', 'on'), A.par(A.operate('bell', 'off'), A.say('DONG!', 1))] }).done();
  }),
  // A campfire roasting spit: forked green-wood uprights, an iron spit with a crank handle, a chicken on it, a ring of
  // stones and a fire. Turn the crank: it roasts.
  e('spit (cooking)', 'kitchen', 'outdoor cooking', () => {
    const b = m('spit (cooking)')
      .stick([-0.72, 0.8, 0], [0.62, 0.8, 0], 0.022, 'iron', { name: 'spit', mover: { kind: 'spin', axis: 'x', amount: 120 }, edge: 'sharp' })
      .stick([0.62, 0.8, 0], [0.62, 0.68, 0], 0.018, 'iron', { parent: 'spit', edge: 'sharp' })
      .stick([0.62, 0.68, 0], [0.72, 0.68, 0], 0.03, 'darkwood', { parent: 'spit', edge: 'sharp' })
      .ball([0.3, 0.2, 0.22], [0, 0.8, 0], { color: '#c87a3a', parent: 'spit' })
      .ball([0.12, 0.1, 0.12], [0.16, 0.86, 0.04], { color: '#d98a4a', parent: 'spit' })
      .ball([0.1, 0.08, 0.1], [-0.13, 0.74, 0.08], { color: '#b8692e', parent: 'spit' });
    b.pair((s) => {
      b.ball([0.09, 0.12, 0.09], [s * 0.07, 0.72, 0.1], { color: '#c87a3a', parent: 'spit' });
      b.stick([s * 0.5, 0, 0], [s * 0.5, 0.76, 0], 0.045, 'bark');
      b.rod([s * 0.5, 0.74, 0], [s * 0.5, 0.88, 0.07], 0.035, 'bark');
      b.rod([s * 0.5, 0.74, 0], [s * 0.5, 0.88, -0.07], 0.035, 'bark');
    });
    b.cone([0.3, 0.36, 0.3], [0, 0.2, 0], { color: '#ff8a2a', name: 'flames', mover: { kind: 'light', on: true } })
      .cone([0.16, 0.24, 0.16], [0.05, 0.16, 0.05], { color: '#ffd24a', glow: true })
      .rod([-0.22, 0.04, -0.1], [0.22, 0.04, 0.1], 0.07, 'bark')
      .rod([-0.22, 0.04, 0.1], [0.22, 0.04, -0.1], 0.07, 'bark');
    for (const [x, z] of around(8, 0.3)) b.ball([0.12, 0.08, 0.1], [x, 0.04, z], { color: 'rock' });
    return b
      .act({ click: [[A.operate('spit', 'on'), A.par(A.effect('fire', { dur: 2.5 }), A.effect('smoke', { dur: 2.5 }), A.say('Sizzle...', 2)), A.wait(1.5), A.operate('spit', 'off')], [A.operate('flames'), A.effect('smoke', { dur: 1.5 })]] })
      .done();
  }),
  // A spitball: a 3 cm wad of chewed-up paper, soggy and crumpled. Splat.
  e('spitball', 'toys', 'pranks', () =>
    m('spitball')
      .ball(0.03, [0, 0.015, 0], { color: '#eeeae0' })
      .ball(0.018, [0.009, 0.024, 0.006], { color: 'paper' })
      .ball(0.017, [-0.01, 0.02, -0.006], { color: '#e2ddd0' })
      .ball(0.014, [0.002, 0.012, 0.012], { color: '#dfe7ea' })
      .act({ click: [A.par(A.anim('hop'), A.say('Splat!', 1))] })
      .done(),
  ),
  // A kitchen sponge (10 cm): yellow foam with pores, green scourer on top. Squeeze it: squish, drip.
  e('sponge', 'home', 'cleaning', () => {
    const b = m('sponge')
      .box([0.1, 0.03, 0.065], [0, 0.015, 0], { color: '#f6d24a', round: 0.35 })
      .box([0.1, 0.012, 0.065], [0, 0.036, 0], { color: '#3f8f3a', round: 0.3, edge: 'sharp' });
    b.each(7, (i) => b.ball(0.007, [-0.04 + i * 0.013, 0.01 + (i % 2) * 0.01, 0.033], { color: '#d9b02a', noInk: true }));
    b.each(4, (i) => b.ball(0.006, [0.051, 0.01 + (i % 2) * 0.01, -0.024 + i * 0.016], { color: '#d9b02a', noInk: true }));
    return b.act({ click: [A.par(A.anim('pulse', 2), A.effect('water_spray', { dur: 1 }), A.say('Squish!', 1.2))] }).done();
  }),
  // A stainless tablespoon (20 cm) standing on its handle. A party trick: the bowl bends, then straightens.
  e('spoon', 'kitchen', 'cutlery', () =>
    m('spoon', { edge: 'sharp' })
      .box([0.012, 0.13, 0.004], [0, 0.065, 0], { color: 'silver', round: 0.9 })
      .ball([0.024, 0.04, 0.005], [0, 0.02, 0], { color: 'silver' })
      .box([0.008, 0.03, 0.004], [0, 0.138, 0.002], { color: 'silver', round: 0.9, rot: [-10, 0, 0] })
      .ball([0.042, 0.06, 0.012], [0, 0.18, 0.006], { color: 'silver', name: 'bowl', pivot: [0, 0.152, 0.004] })
      .ball([0.03, 0.044, 0.004], [0, 0.18, 0.012], { color: '#e6e9ec', parent: 'bowl', noInk: true })
      .act({ click: [[A.pose('bowl', { rot: [-55, 0, 0], dur: 1.2 }), A.effect('sparkle', { dur: 1 })], [A.pose('bowl', { rot: [0, 0, 0], dur: 0.6 }), A.say('Ting!', 1)]] })
      .done(),
  ),
  // A cutlery cup of spoons: table, dessert and teaspoons in a ceramic holder. Played like the spoons: clackety!
  e('spoons', 'kitchen', 'cutlery', () => {
    const b = m('spoons', { edge: 'sharp' })
      .cyl([0.08, 0.11, 0.08], [0, 0.055, 0], { color: '#4e8fd6', taper: 1.1, edge: 'soft' })
      .torus([0.088, 0.088, 0.008], [0, 0.11, 0], { color: '#4e8fd6', rot: [90, 0, 0], tube: 0.1, edge: 'soft' });
    const sp: Array<[number, number, number, number, string]> = [[-0.018, -0.008, -0.2, 0.2, 'spoonA'], [0.014, 0.01, 0.12, 0.17, 'spoonB'], [0.0, -0.016, 0.28, 0.14, 'spoonC']];
    for (const [x, z, r, l, n] of sp) {
      const P = (k: number): V => [x + Math.sin(r) * k, 0.03 + Math.cos(r) * k, z];
      b.stick(P(0), P(l * 0.72), 0.008, 'silver', { name: n, pivot: P(0.06) })
        .ball([l * 0.2, l * 0.3, 0.008], P(l * 0.86), { color: 'silver', rot: [0, 0, -r / D], parent: n });
    }
    return b
      .act({ click: [A.par(A.pose('spoonA', { rot: [0, 0, 12], dur: 0.12 }), A.pose('spoonB', { rot: [0, 0, -12], dur: 0.12 })), A.par(A.pose('spoonA', { rot: [0, 0, -8], dur: 0.12 }), A.pose('spoonB', { rot: [0, 0, 8], dur: 0.12 }), A.pose('spoonC', { rot: [0, 0, 10], dur: 0.12 })), A.par(A.pose('spoonA', { rot: [0, 0, 0], dur: 0.12 }), A.pose('spoonB', { rot: [0, 0, 0], dur: 0.12 }), A.pose('spoonC', { rot: [0, 0, 0], dur: 0.12 }), A.say('Clackety-clack!', 1.4))] })
      .done();
  }),
  // A sports shop (7 m front): green awning, a giant football over the SPORTS sign, skis and a bike in the windows, a
  // basketball hoop beside the door.
  e('sporting goods store', 'places', 'shops', () => {
    const b = shopFront('sporting goods store', { w: 7, wall: '#2f4f8f', trim: '#f0923b', sign: 'SPORTS', signColor: '#f0923b', awning: ['#3f7a3a', 'white'] })
      .ball(1.1, [-2.2, 4.95, 2.6], { color: 'white' })
      .ball(0.9, [2.3, 4.85, 2.6], { color: '#f0923b' })
      .torus([0.92, 0.92, 0.04], [2.3, 4.85, 2.6], { color: '#2a2726', rot: [0, 30, 0], tube: 0.05 })
      .stick([3.3, 0, 3.3], [3.3, 3.05, 3.3], 0.1, '#9da3a8')
      .box([1.0, 0.7, 0.04], [3.3, 3.25, 3.2], { color: 'white', round: 0.1 })
      .torus([0.46, 0.46, 0.03], [3.3, 3.0, 3.48], { color: '#e0473b', rot: [90, 0, 0], tube: 0.06 });
    b.each(4, (i) => b.ball([0.4, 0.4, 0.12], [-2.2 + (i % 2 ? 0.25 : -0.25), 4.95 + (i < 2 ? 0.25 : -0.25), 3.12], { color: '#2a2726', noInk: true }));
    b.pair((s) => {
      b.box([0.08, 1.7, 0.03], [s * 2.0 - 0.15, 1.6, 2.42], { color: '#e0473b', rot: [0, 0, 8], round: 0.4 }).box([0.08, 1.7, 0.03], [s * 2.0 + 0.15, 1.6, 2.42], { color: '#e0473b', rot: [0, 0, -8], round: 0.4 });
      b.torus([0.6, 0.6, 0.04], [s * 1.3 + (s > 0 ? 0.3 : -0.3), 0.95, 2.4], { color: '#2a2726', tube: 0.1 });
    });
    return b.act(shopAct('Ding-dong!')).done();
  }),
  // A low mid-engined sports car (4.4 m, 1.2 m tall): long nose, raked screen, side intakes, a rear wing, quad
  // exhausts, big rims. Revs; opens its door.
  e('sports car', 'garage', 'cars', () => {
    const b = m('sports car', { view: 'side' });
    car(b, { L: 4.45, W: 1.95, H: 1.2, belt: 0.8, low: 0.14, color: '#d0221c', wheel: 0.68, wb: 2.65, cab: [0.3, 0.7], rake: [0.4, 0.42], nose: 0.42, tail: 0.85, plate: 'FAST 1', rim: '#2a2726' });
    b.box([1.8, 0.05, 0.36], [0, 1.13, -2.05], { color: '#2a2726', round: 0.3, edge: 'sharp' });
    b.pair((s) => {
      b.box([0.04, 0.3, 0.06], [s * 0.7, 0.98, -2.05], { color: '#2a2726', edge: 'sharp' });
      b.box([0.04, 0.2, 0.5], [s * 0.99, 0.55, -0.85], { color: '#1e1c1b', round: 0.4, edge: 'sharp' });
      b.cyl([0.09, 0.08, 0.09], [s * 0.35, 0.3, -2.23], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' });
      b.cyl([0.09, 0.08, 0.09], [s * 0.52, 0.3, -2.23], { color: 'silver', rot: [90, 0, 0], edge: 'sharp' });
    });
    return b
      .act({
        click: [
          [A.par(A.operate('headlights', 'on'), A.anim('shake', 3), A.effect('smoke', { dur: 1.5 }), A.say('VROOOOM!', 1.8)), A.wait(1.2), A.operate('headlights', 'off')],
          [A.operate('doorL', 'open'), A.say('Beep-beep!', 1.4), A.wait(2.2), A.operate('doorL', 'close')],
        ],
      })
      .done();
  }),
  // A theatre spotlight (45 cm) on a yoke and floor stand: black can, Fresnel lens (a light), four barn doors. It
  // switches on and sweeps the stage.
  e('spotlight', 'music', 'stage gear', () => {
    const t = 20, c: V = [0, 0.32, 0];
    const b = m('spotlight', { edge: 'sharp' })
      .cyl([0.3, 0.03, 0.3], [0, 0.015, 0], { color: '#2a2726' })
      .stick([0, 0.03, 0], [0, 0.16, 0], 0.04, '#2a2726')
      .box([0.34, 0.03, 0.05], [0, 0.17, 0], { color: '#2a2726', name: 'lamp', pivot: [0, 0.17, 0], round: 0.3 });
    b.pair((s) => b.box([0.03, 0.2, 0.05], [s * 0.16, 0.27, 0], { color: '#2a2726', parent: 'lamp', round: 0.3 }));
    b.cyl([0.24, 0.34, 0.24], c, { color: '#3a3633', rot: [90 - t, 0, 0], parent: 'lamp', edge: 'soft' })
      .cyl([0.2, 0.02, 0.2], [0, c[1] + 0.17 * Math.sin(t * D), 0.17 * Math.cos(t * D)], { color: '#fff3c0', rot: [90 - t, 0, 0], name: 'lens', parent: 'lamp', mover: { kind: 'light', on: false } })
      .box([0.08, 0.08, 0.06], [0, c[1] - 0.05, -0.18], { color: '#2a2726', parent: 'lamp' });
    for (const k of [0, 1, 2, 3]) {
      const ang = k * 90, ca = Math.cos(ang * D), sa = Math.sin(ang * D);
      b.box([0.2, 0.004, 0.1], [sa * 0.13, c[1] + 0.2 * Math.sin(t * D) + ca * 0.13 * Math.cos(t * D), 0.22 * Math.cos(t * D) - ca * 0.13 * Math.sin(t * D)], { color: '#2a2726', rot: [90 - t + (ca ? -ca * 30 : 0), 0, ang], parent: 'lamp' });
    }
    return b
      .act({ click: [[A.operate('lens', 'on'), A.pose('lamp', { rot: [0, 35, 0], dur: 0.8 }), A.pose('lamp', { rot: [0, -35, 0], dur: 1.2 }), A.pose('lamp', { rot: [0, 0, 0], dur: 0.6 })], [A.operate('lens', 'off'), A.say('Click.', 1)]] })
      .done();
  }),
  // A trigger spray bottle (25 cm): translucent blue bottle, white trigger head, the trigger itself (it squeezes) and
  // an adjustable nozzle.
  e('spray bottle', 'home', 'cleaning', () =>
    m('spray bottle')
      .cyl([0.08, 0.16, 0.06], [0, 0.08, 0], { color: '#7cc4f0' })
      .cyl([0.08, 0.04, 0.06], [0, 0.18, 0], { color: '#7cc4f0', taper: 0.42 })
      .label('CLEAN', [0.05, 0.03], [0, 0.08, 0.031], { color: 'white', depth: 0.002 })
      .cyl([0.032, 0.02, 0.032], [0, 0.205, 0], { color: 'white', edge: 'sharp' })
      .box([0.042, 0.05, 0.11], [0, 0.235, 0.018], { color: 'white', round: 0.35, edge: 'sharp' })
      .cyl([0.022, 0.022, 0.022], [0, 0.245, 0.08], { color: '#f0923b', rot: [90, 0, 0], segs: 6, edge: 'sharp' })
      .box([0.02, 0.07, 0.018], [0, 0.18, 0.055], { color: 'white', rot: [-12, 0, 0], round: 0.6, name: 'trigger', pivot: [0, 0.215, 0.05], mover: { kind: 'swing', axis: 'x', amount: -18 } })
      .stick([0, 0.2, 0], [0, 0.02, 0], 0.004, 'white')
      .act({ click: [A.operate('trigger', 'on'), A.par(A.effect('water_spray', { dur: 0.8 }), A.say('Pssht!', 1)), A.operate('trigger', 'off'), A.operate('trigger', 'on'), A.par(A.effect('water_spray', { dur: 0.8 }), A.say('Pssht!', 1)), A.operate('trigger', 'off')] })
      .done(),
  ),
  // A can of spray paint (20 cm): red can with a white band and label, a domed top, a nozzle and a clear cap that comes
  // off. Shake, rattle and spray.
  e('spray paint', 'workshop', 'paint', () =>
    m('spray paint')
      .cyl([0.066, 0.17, 0.066], [0, 0.085, 0], { color: '#e0303b', name: 'can' })
      .cyl([0.068, 0.05, 0.068], [0, 0.1, 0], { color: 'white', parent: 'can', noInk: true })
      .label('RED', [0.034, 0.02], [0, 0.1, 0.034], { color: 'white', parent: 'can', depth: 0.002 })
      .cyl([0.064, 0.006, 0.064], [0, 0.003, 0], { color: 'silver', parent: 'can', edge: 'sharp' })
      .dome([0.064, 0.02, 0.064], [0, 0.18, 0], { color: 'silver', parent: 'can', edge: 'sharp' })
      .cyl([0.016, 0.014, 0.016], [0, 0.196, 0], { color: 'white', parent: 'can', edge: 'sharp' })
      .ball(0.004, [0, 0.199, 0.008], { color: '#2a2726', parent: 'can' })
      .cyl([0.068, 0.06, 0.068], [0, 0.2, 0], { color: '#f4b8b8', name: 'cap', parent: 'can', piece: true, edge: 'sharp' })
      .act({
        click: [
          [A.detach('cap', 'cap'), A.par(A.anim('shake', 2), A.say('Rattle, rattle.', 1.2)), A.par(A.effect('smoke', { dur: 1.5 }), A.say('Pssssht!', 1.4))],
          [A.reattach('cap'), A.say('Click.', 1)],
        ],
      })
      .done(),
  ),
  // Three crisp spring rolls (13 cm) on a plate with a dish of sweet chilli sauce. One can be taken.
  e('spring roll', 'food', 'asian food', () =>
    m('spring roll')
      .cyl([0.26, 0.012, 0.18], [0, 0.006, 0], { color: 'white', edge: 'sharp', name: 'plate' })
      .capsule([0.035, 0.13, 0.035], [-0.02, 0.03, -0.035], { color: '#d9a03a', rot: [0, 0, 90] })
      .capsule([0.035, 0.13, 0.035], [-0.02, 0.03, 0.005], { color: '#cf9634', rot: [0, 0, 90] })
      .capsule([0.035, 0.13, 0.035], [-0.01, 0.06, -0.015], { color: '#e0ad4a', rot: [0, 20, 90], name: 'roll', parent: 'plate', piece: true })
      .torus([0.036, 0.036, 0.004], [-0.04, 0.06, -0.022], { color: '#c08a2a', rot: [0, 110, 0], tube: 0.2, parent: 'roll', noInk: true })
      .cyl([0.055, 0.025, 0.055], [0.085, 0.0245, 0.04], { color: 'white', edge: 'sharp' })
      .cyl([0.046, 0.004, 0.046], [0.085, 0.036, 0.04], { color: '#d0302a' })
      .ball([0.04, 0.008, 0.012], [0.04, 0.015, 0.06], { color: '#7cc45a', noInk: true })
      .act({ click: [[A.detach('roll', 'roll'), A.say('Crunch!', 1)], [A.reattach('roll'), A.effect('steam', { dur: 1 })]] })
      .done(),
  ),
  // A rotating lawn sprinkler on a green sled base with its hose: two curved arms with nozzles spin and spray.
  e('sprinkler', 'garden', 'garden tools', () =>
    m('sprinkler')
      .cyl([0.7, 0.02, 0.7], [0, 0.01, 0], { color: 'grass' })
      .box([0.26, 0.04, 0.12], [0, 0.03, 0], { color: '#3f8f3a', round: 0.4, edge: 'sharp' })
      .cyl([0.08, 0.08, 0.08], [0, 0.09, 0], { color: '#3f8f3a', edge: 'sharp' })
      .stick([0, 0.12, 0], [0, 0.24, 0], 0.025, 'brass')
      .rod([-0.13, 0.04, 0], [-0.45, 0.02, 0.12], 0.025, '#3f8f3a')
      .stick([-0.13, 0.25, 0], [0.13, 0.25, 0], 0.025, 'brass', { name: 'arms', pivot: [0, 0.25, 0], mover: { kind: 'spin', axis: 'y', amount: 540 } })
      .rod([0.13, 0.25, 0], [0.2, 0.31, 0.04], 0.02, 'brass', { parent: 'arms' })
      .rod([-0.13, 0.25, 0], [-0.2, 0.31, -0.04], 0.02, 'brass', { parent: 'arms' })
      .cyl([0.025, 0.03, 0.025], [0.21, 0.32, 0.045], { color: '#2a2726', parent: 'arms' })
      .cyl([0.025, 0.03, 0.025], [-0.21, 0.32, -0.045], { color: '#2a2726', parent: 'arms' })
      .act({ click: [A.operate('arms', 'on'), A.par(A.effect('water_spray', { dur: 3 }), A.say('Tsk-tsk-tsk-tsk...', 2.5)), A.wait(1), A.operate('arms', 'off')] })
      .done(),
  ),
  // A glass shaker jar of rainbow sprinkles (12 cm) with a perforated lid, a little heap spilled beside it. Shake!
  e('sprinkles', 'food', 'baking', () => {
    const b = m('sprinkles')
      .cyl([0.06, 0.1, 0.06], [0, 0.05, 0], { color: '#f4a1c0', name: 'jar' })
      .cyl([0.062, 0.02, 0.062], [0, 0.108, 0], { color: 'white', parent: 'jar', edge: 'sharp' })
      .label('SPRINKLES', [0.05, 0.016], [0, 0.06, 0.031], { color: 'white', parent: 'jar', depth: 0.002 });
    for (const [x, z] of around(5, 0.014)) b.ball(0.006, [x, 0.119, z], { color: '#5c6166', parent: 'jar', noInk: true });
    const cols = ['#e0473b', '#f6d24a', '#4e8fd6', '#9be34d', '#f4a1c0', '#f0923b', '#8a5fc4', '#6fd3e8'];
    b.each(14, (i) => {
      const a = i * 2.4, r = 0.012 + (i % 4) * 0.008;
      b.capsule([0.004, 0.012, 0.004], [0.07 + Math.cos(a) * r, 0.004 + (i % 3) * 0.002, 0.03 + Math.sin(a) * r], { color: cols[i % 8], rot: [90, (i * 47) % 180, 0], noInk: true });
    });
    return b.act({ click: [A.pose('jar', { rot: [0, 0, -110], dur: 0.4 }), A.par(A.anim('shake', 2), A.effect('sparkle', { dur: 1.2 }), A.say('Shake, shake!', 1.2)), A.pose('jar', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A brass pirate spyglass (closed 30 cm) on a little wooden cradle: leather-wrapped barrel and two draw tubes that
  // slide out, then back in.
  e('spyglass', 'study', 'optics', () =>
    m('spyglass', { view: 'side', edge: 'sharp' })
      .box([0.08, 0.016, 0.16], [0, 0.008, -0.02], { color: 'darkwood', round: 0.3 })
      .arc([0.07, 0.07, 0.02], [0, 0.085, 0.04], { color: 'darkwood', rot: [0, 0, 180], tube: 0.25 })
      .arc([0.07, 0.07, 0.02], [0, 0.085, -0.08], { color: 'darkwood', rot: [0, 0, 180], tube: 0.25 })
      .stick([0, 0.016, 0.04], [0, 0.05, 0.04], 0.012, 'darkwood')
      .stick([0, 0.016, -0.08], [0, 0.05, -0.08], 0.012, 'darkwood')
      .cyl([0.056, 0.15, 0.056], [0, 0.085, -0.05], { color: 'brass', rot: [90, 0, 0] })
      .cyl([0.06, 0.09, 0.06], [0, 0.085, -0.05], { color: 'leather', rot: [90, 0, 0], edge: 'soft' })
      .cyl([0.064, 0.012, 0.064], [0, 0.085, 0.022], { color: 'gold', rot: [90, 0, 0] })
      .cyl([0.064, 0.012, 0.064], [0, 0.085, -0.12], { color: 'gold', rot: [90, 0, 0] })
      .cyl([0.046, 0.13, 0.046], [0, 0.085, 0.02], { color: 'brass', rot: [90, 0, 0], name: 'tube1', mover: { kind: 'slide', axis: 'z', amount: 0.1 } })
      .cyl([0.05, 0.01, 0.05], [0, 0.085, 0.084], { color: 'gold', rot: [90, 0, 0], parent: 'tube1' })
      .cyl([0.036, 0.11, 0.036], [0, 0.085, 0.04], { color: 'brass', rot: [90, 0, 0], name: 'tube2', parent: 'tube1', mover: { kind: 'slide', axis: 'z', amount: 0.09 } })
      .cyl([0.032, 0.02, 0.032], [0, 0.085, 0.1], { color: '#5a3a22', rot: [90, 0, 0], parent: 'tube2' })
      .cyl([0.05, 0.004, 0.05], [0, 0.085, -0.126], { color: '#a9dcf2', rot: [90, 0, 0] })
      .act({ click: [[A.operate('tubes', 'out'), A.par(A.effect('sparkle', { dur: 0.8 }), A.say('Click, click.', 1))], [A.operate('tubes', 'in'), A.say('Clack.', 1)]] })
      .done(),
  ),
  // A square (40 cm) cut from blue acrylic, standing in a wooden foot. Turn it a quarter: still a square.
  e('square (shape)', 'ideas', 'shapes', () =>
    m('square (shape)', { edge: 'sharp' })
      .box([0.24, 0.06, 0.12], [0, 0.03, 0], { color: 'wood', round: 0.3 })
      .box([0.4, 0.4, 0.03], [0, 0.27, 0], { color: '#4e8fd6', round: 0.06, name: 'square', pivot: [0, 0.27, 0] })
      .box([0.34, 0.34, 0.004], [0, 0.27, 0.016], { color: '#6aa6e4', round: 0.05, parent: 'square', noInk: true })
      .act({ click: [A.pose('square', { rot: [0, 0, 90], dur: 0.7 }), A.effect('sparkle', { dur: 0.8 }), A.pose('square', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A butternut squash (30 cm): bulb and neck, ribbed skin, a woody stalk; a slice is cut from the neck and comes off
  // to show the orange flesh.
  e('squash', 'food', 'vegetables', () =>
    m('squash')
      .ball([0.15, 0.16, 0.15], [0, 0.08, 0], { color: '#e9b56a', name: 'body' })
      .capsule([0.095, 0.2, 0.095], [0, 0.2, 0], { color: '#e9b56a', parent: 'body' })
      .cyl([0.092, 0.024, 0.092], [0, 0.268, 0], { color: '#f0923b', name: 'slice', parent: 'body', piece: true })
      .cyl([0.096, 0.02, 0.096], [0, 0.268, 0], { color: '#e9b56a', parent: 'slice', noInk: true })
      .cyl([0.08, 0.036, 0.08], [0, 0.29, 0], { color: '#e9b56a', parent: 'body' })
      .cyl([0.022, 0.035, 0.022], [0, 0.32, 0], { color: '#7a5a3a', parent: 'body' })
      .ball([0.05, 0.03, 0.05], [0, 0.04, 0.055], { color: '#d9a35a', parent: 'body', noInk: true })
      .act({ click: [[A.detach('slice', 'slice')], [A.reattach('slice')]] })
      .done(),
  ),
  // A window squeegee (35 cm blade) with a black rubber edge and a long handle, standing in a bucket of soapy water.
  // It wipes across: squeak.
  e('squeegee', 'home', 'cleaning', () =>
    m('squeegee')
      .cyl([0.3, 0.3, 0.3], [0, 0.15, 0], { color: '#4e8fd6', taper: 1.15, edge: 'sharp' })
      .torus([0.33, 0.33, 0.02], [0, 0.3, 0], { color: '#4e8fd6', rot: [90, 0, 0], tube: 0.08 })
      .cyl([0.3, 0.01, 0.3], [0, 0.28, 0], { color: '#dff4ff' })
      .ball(0.05, [0.08, 0.3, 0.04], { color: 'white' })
      .ball(0.04, [-0.06, 0.3, -0.05], { color: 'white' })
      .arc([0.3, 0.2, 0.01], [0, 0.3, 0], { color: 'silver', tube: 0.05 })
      .stick([0.02, 0.2, -0.02], [0.1, 0.95, -0.05], 0.03, '#f6d24a', { name: 'squeegee', pivot: [0.02, 0.2, -0.02] })
      .box([0.36, 0.05, 0.035], [0.1, 0.98, -0.05], { color: 'steel', round: 0.2, parent: 'squeegee', edge: 'sharp' })
      .box([0.37, 0.03, 0.012], [0.1, 1.015, -0.05], { color: '#2a2726', parent: 'squeegee', edge: 'sharp' })
      .act({ click: [A.pose('squeegee', { rot: [0, 0, 25], dur: 0.4 }), A.par(A.pose('squeegee', { rot: [0, 0, -25], dur: 0.7 }), A.say('Squeeeak!', 1.2)), A.pose('squeegee', { rot: [0, 0, 0], dur: 0.4 }), A.effect('water_spray', { dur: 0.8 })] })
      .done(),
  ),
  // A horse stable (8 m): red board-and-batten walls, a shingled gable roof with a cupola and a spinning weathervane,
  // three stalls with Dutch doors (the middle top half opens), a hay loft door and a hay bale. A horse looks out.
  e('stable', 'places', 'farm buildings', () => {
    const w = 8, d = 5, h = 3.4;
    const b = m('stable', { edge: 'sharp' })
      .box([w, h, d], [0, h / 2, 0], { color: '#a3322a', round: 0.02 })
      .wedge([d + 0.6, 2.2, w + 0.6], [0, h + 1.1, 0], { color: '#4a4744', rot: [0, 90, 0] })
      .wedge([d - 0.1, 2.1, 0.12], [0, h + 1.05, d / 2 - 0.05], { color: '#a3322a', rot: [0, 90, 0] })
      .box([w + 0.1, 0.15, d + 0.1], [0, 0.075, 0], { color: 'stone', round: 0.2 })
      .box([1.0, 1.0, 1.0], [0, h + 2.6, 0], { color: 'white', round: 0.05 })
      .pyramid([1.3 * Math.SQRT2, 0.8, 1.3 * Math.SQRT2], [0, h + 3.5, 0], 4, { color: '#4a4744' })
      .stick([0, h + 3.8, 0], [0, h + 4.5, 0], 0.04, '#2a2726')
      .box([0.9, 0.06, 0.04], [0, h + 4.4, 0], { color: '#2a2726', name: 'vane', mover: { kind: 'spin', axis: 'y', amount: 90 } })
      .wedge([0.25, 0.3, 0.04], [0.42, h + 4.4, 0], { color: '#2a2726', rot: [0, 0, -90], parent: 'vane' })
      .box([1.2, 1.0, 0.08], [0, h + 0.75, d / 2 + 0.04], { color: '#7a5230' })
      .rod([-0.55, h + 0.3, d / 2 + 0.09], [0.55, h + 1.2, d / 2 + 0.09], 0.06, 'white', { noInk: true })
      .label('STABLE', [1.8, 0.4], [0, h - 0.3, d / 2 + 0.06], { color: 'white', depth: 0.04 })
      .box([1.2, 0.7, 0.8], [w / 2 + 0.8, 0.35, 1.6], { color: '#e8c25a', round: 0.15, edge: 'soft' });
    b.each(3, (i) => {
      const x = -2.6 + i * 2.6, mid = i === 1;
      b.box([1.3, 1.15, 0.08], [x, 0.65, d / 2 + 0.04], { color: '#7a5230' });
      b.rod([x - 0.58, 0.12, d / 2 + 0.09], [x + 0.58, 1.18, d / 2 + 0.09], 0.06, 'white', { noInk: true });
      b.rod([x - 0.58, 1.18, d / 2 + 0.09], [x + 0.58, 0.12, d / 2 + 0.09], 0.06, 'white', { noInk: true });
      b.box([1.3, 0.95, 0.06], [x, 1.75, d / 2 + 0.02], { color: '#2a2726' });
      if (mid) b.box([1.3, 0.95, 0.08], [x, 1.75, d / 2 + 0.06], { color: '#7a5230', name: 'door', pivot: [x - 0.65, 1.75, d / 2 + 0.08], mover: { kind: 'swing', axis: 'y', amount: -100 } }).box([1.32, 0.07, 0.04], [x, 1.28, d / 2 + 0.1], { color: 'white', parent: 'door' });
      else b.box([1.3, 0.95, 0.08], [x, 1.75, d / 2 + 0.06], { color: '#7a5230' });
    });
    b.each(16, (i) => b.box([0.04, h, 0.02], [-w / 2 + 0.25 + i * 0.5, h / 2, d / 2 + 0.005], { color: '#8a2b24', noInk: true }));
    return b
      .socket('stall', [0, 1.0, d / 2 - 0.8], 'inside', { size: 2 })
      .act({ click: [[A.operate('door', 'open'), A.spawn('horse', 'horse', { rel: 'front', of: 'self', dist: 'touch' }), A.par(A.say('Neigh!', 1.6, 'horse'), A.operate('vane', 'on')), A.wait(2), A.remove('horse', 'fade'), A.par(A.operate('door', 'close'), A.operate('vane', 'off'))]] })
      .done();
  }),
  // A Dutch stable door (2.2 m) in its frame: the top and bottom halves open separately on strap hinges; white
  // cross-braces, a latch and a horseshoe for luck.
  e('stable door', 'farm', 'farm things', () => {
    const b = m('stable door', { edge: 'sharp' })
      .box([1.5, 2.4, 0.2], [0, 1.2, -0.08], { color: '#7a5230' })
      .box([1.1, 2.1, 0.05], [0, 1.08, -0.01], { color: '#2a2726' })
      .box([1.1, 1.05, 0.08], [0, 0.56, 0.05], { color: '#c0392b', round: 0.05, name: 'bottom', pivot: [-0.55, 0.56, 0.05], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .box([1.1, 1.0, 0.08], [0, 1.6, 0.05], { color: '#c0392b', round: 0.05, name: 'top', pivot: [-0.55, 1.6, 0.05], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .rod([-0.48, 0.12, 0.1], [0.48, 1.0, 0.1], 0.07, 'white', { parent: 'bottom' })
      .rod([-0.48, 1.0, 0.1], [0.48, 0.12, 0.1], 0.07, 'white', { parent: 'bottom' })
      .box([1.1, 0.07, 0.04], [0, 1.06, 0.11], { color: 'white', parent: 'bottom' })
      .rod([-0.48, 1.18, 0.1], [0.48, 2.04, 0.1], 0.07, 'white', { parent: 'top' })
      .rod([-0.48, 2.04, 0.1], [0.48, 1.18, 0.1], 0.07, 'white', { parent: 'top' })
      .box([0.1, 0.05, 0.05], [0.45, 1.12, 0.12], { color: '#2a2726', parent: 'top' })
      .arc([0.2, 0.22, 0.03], [0, 2.22, 0.04], { color: 'iron', arc: 250, rot: [0, 0, 180], tube: 0.25 });
    b.each(4, (i) => b.box([0.28, 0.05, 0.03], [-0.42, [0.2, 0.9, 1.3, 1.95][i], 0.1], { color: '#2a2726', parent: i > 1 ? 'top' : 'bottom' }));
    return b.act({ click: [[A.operate('top', 'open'), A.say('Creeeak...', 1.5)], [A.operate('bottom', 'open'), A.say('Creak!', 1)], [A.par(A.operate('top', 'close'), A.operate('bottom', 'close')), A.say('Clunk.', 1)]] }).done();
  }),
  // A football stadium (80 m, 18 m high): an oval bowl of tiered stands with a red roof ring, a striped pitch with
  // its markings and goals, four floodlight masts (lights), a scoreboard. Floodlights on: GOAL!
  e('stadium', 'places', 'sports venues', () => {
    const b = m('stadium', { edge: 'sharp' })
      .box([62, 0.2, 42], [0, 0.1, 0], { color: '#5aa553' })
      .box([0.25, 0.03, 34], [0, 0.215, 0], { color: 'white', noInk: true })
      .torus([9, 9, 0.25], [0, 0.22, 0], { color: 'white', rot: [90, 0, 0], tube: 0.03, noInk: true });
    b.each(6, (i) => b.box([4.0, 0.02, 34], [-21 + i * 8.4, 0.205, 0], { color: '#4f9a48', noInk: true }));
    b.pair((s) => {
      b.box([46, 0.03, 0.25], [0, 0.215, s * 17], { color: 'white', noInk: true });
      b.box([0.25, 0.03, 34], [s * 23, 0.215, 0], { color: 'white', noInk: true });
      b.box([0.15, 2.44, 0.15], [s * 23.4, 1.22, 3.66], { color: 'white' }).box([0.15, 2.44, 0.15], [s * 23.4, 1.22, -3.66], { color: 'white' }).box([0.15, 0.15, 7.47], [s * 23.4, 2.44, 0], { color: 'white' });
      // stands along the sides and the ends
      b.each(5, (i) => b.box([56 - i * 0, 1.6, 2.4], [0, 1.0 + i * 1.6, s * (23 + i * 2.4)], { color: i % 2 ? '#c9ccd1' : '#2f6fb0', round: 0.05 }));
      b.each(5, (i) => b.box([2.4, 1.6, 44], [s * (33 + i * 2.4), 1.0 + i * 1.6, 0], { color: i % 2 ? '#c9ccd1' : '#2f6fb0', round: 0.05 }));
      b.box([60, 1.2, 4], [0, 10.4, s * 33.5], { color: '#e0473b', round: 0.1 });
      b.box([4, 1.2, 50], [s * 44, 10.4, 0], { color: '#e0473b', round: 0.1 });
    });
    for (const [x, z, k] of [[40, 30, 1], [-40, 30, 2], [40, -30, 3], [-40, -30, 4]] as const) {
      b.stick([x, 0, z], [x, 17, z], 0.8, '#9da3a8');
      b.box([5, 2.4, 0.6], [x, 17.6, z], { color: '#f7f5ef', rot: [-20 * Math.sign(z), Math.sign(x) * Math.sign(z) * -35, 0], name: `flood${k}`, mover: { kind: 'light', on: false } });
    }
    b.box([12, 5, 0.6], [0, 15, -36], { color: '#2a2726', round: 0.1 }).label('HOME 2 - 1 AWAY', [10, 1.8], [0, 15, -35.65], { color: '#2a2726', depth: 0.1 });
    return b
      .act({ click: [[A.operate('floods', 'on'), A.par(A.effect('sparkle', { dur: 2.5 }), A.say('GOOOAL!', 2.2))], [A.operate('floods', 'off'), A.say('Full time!', 1.6)]] })
      .done();
  }),
  // A hiking staff (1.5 m) leaning in a stand: carved ash with a knob top, a leather grip and wrist strap, a steel tip.
  // Tok, tok.
  e('staff', 'sports', 'hiking gear', () =>
    m('staff')
      .box([0.24, 0.04, 0.24], [0, 0.02, 0], { color: 'darkwood', round: 0.3, edge: 'sharp' })
      .cyl([0.04, 1.42, 0.04], [0, 0.73, 0], { color: '#b5814e', taper: 1.1, name: 'staff', pivot: [0, 0.04, 0] })
      .cone([0.04, 0.05, 0.04], [0, 0.03, 0], { color: 'steel', rot: [180, 0, 0], parent: 'staff', edge: 'sharp' })
      .cyl([0.056, 0.22, 0.056], [0, 1.1, 0], { color: 'leather', parent: 'staff' })
      .torus([0.02, 0.2, 0.012], [0.022, 1.0, 0], { color: '#2a2726', rot: [0, 90, 0], tube: 0.2, parent: 'staff' })
      .ball([0.09, 0.11, 0.09], [0, 1.48, 0], { color: '#8c5a2b', parent: 'staff' })
      .torus([0.07, 0.07, 0.02], [0, 1.42, 0], { color: 'brass', rot: [90, 0, 0], tube: 0.2, parent: 'staff' })
      .act({ click: [A.pose('staff', { move: [0, 0.08, 0], dur: 0.2 }), A.pose('staff', { move: [0, 0, 0], dur: 0.1 }), A.say('Tok.', 0.7), A.pose('staff', { move: [0, 0.08, 0], dur: 0.2 }), A.pose('staff', { move: [0, 0, 0], dur: 0.1 }), A.say('Tok.', 0.7)] })
      .done(),
  ),
  // A theatre stage (8 m wide; the vocabulary's 1 m is the platform, the proscenium rises to 6.5 m): wooden boards on a black skirted base, a red proscenium with a gold pelmet,
  // red curtains that draw apart, footlights (lights), steps up at the side and a mic stand centre stage.
  e('stage (place)', 'places', 'venues', () => {
    const b = m('stage (place)', { edge: 'sharp' })
      .box([8, 1.0, 4.5], [0, 0.5, 0], { color: '#2a2726', round: 0.02 })
      .box([8.1, 0.08, 4.6], [0, 1.04, 0], { color: '#b5814e', round: 0.2 })
      .box([9, 0.9, 0.5], [0, 6.0, 1.9], { color: '#8a1f24', round: 0.1 })
      .box([8.2, 0.5, 0.3], [0, 5.4, 1.85], { color: 'gold', round: 0.3 })
      .label('SHOWTIME', [3.2, 0.5], [0, 6.0, 2.16], { color: '#8a1f24', depth: 0.03 })
      .box([8, 5, 0.2], [0, 3.5, -2.2], { color: '#3a1f2a' })
      .stick([0, 1.08, 0.6], [0, 2.4, 0.6], 0.04, '#2a2726')
      .ball([0.09, 0.14, 0.09], [0, 2.45, 0.62], { color: '#5c6166' })
      .cyl([0.4, 0.03, 0.4], [0, 1.1, 0.6], { color: '#2a2726' });
    b.each(16, (i) => b.box([0.02, 0.005, 4.5], [-3.75 + i * 0.5, 1.085, 0], { color: '#8c5a2b', noInk: true }));
    b.pair((s) => {
      b.box([0.6, 6.4, 0.5], [s * 4.3, 3.2, 1.9], { color: '#8a1f24', round: 0.1 });
      b.box([2.1, 4.3, 0.25], [s * 1.05, 3.25, 1.6], { color: '#c0202a', round: 0.4, name: s > 0 ? 'curtainL' : 'curtainR', mover: { kind: 'slide', axis: 'x', amount: s * 2.2 }, edge: 'soft' });
      b.each(3, (i) => b.box([0.08, 4.3, 0.06], [s * (0.3 + i * 0.7), 3.25, 1.74], { color: '#9a1820', parent: s > 0 ? 'curtainL' : 'curtainR', noInk: true }));
      b.each(3, (i) => b.dome([0.35, 0.2, 0.25], [s * (0.9 + i * 1.2), 1.18, 2.1], { color: '#ffe8a0', name: `foot${s > 0 ? 'L' : 'R'}${i}`, mover: { kind: 'light', on: false } }));
      b.each(4, (i) => b.box([1.2, 0.25, 0.32], [s * 4.7, 0.125 + i * 0.25, 1.2 - i * 0.32], { color: '#2a2726' }));
    });
    return b
      .socket('stage', [0, 1.1, 0], 'top', { size: 3 })
      .act({
        click: [
          [A.par(A.operate('curtains', 'open'), A.operate('foots', 'on')), A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Ta-daaa!', 1.8))],
          [A.par(A.say('Clap, clap, clap!', 2)), A.par(A.operate('curtains', 'close'), A.operate('foots', 'off'))],
        ],
      })
      .done();
  }),
  // A church stained-glass window (3 m): arched stone frame, a rose of coloured petals in the arch, twelve panes of
  // coloured glass in black lead. The sun comes through it (the glass is a light).
  e('stained glass', 'home', 'windows', () => {
    const cols = ['#c0392b', '#2f6fb0', '#e8b33a', '#3f8f3a', '#8a5fc4', '#2f6fb0', '#c0392b', '#e8b33a', '#3f8f3a', '#c0392b', '#2f6fb0', '#8a5fc4'];
    const b = m('stained glass', { edge: 'sharp' })
      .box([1.5, 2.3, 0.3], [0, 1.15, 0], { color: 'stone', round: 0.04 })
      .cyl([1.5, 0.3, 1.5], [0, 2.3, 0], { color: 'stone', rot: [90, 0, 0] })
      .box([1.7, 0.14, 0.4], [0, 0.07, 0.04], { color: '#9a9a92', round: 0.2 })
      .box([1.14, 2.0, 0.04], [0, 1.2, 0.14], { color: '#2a2726' })
      .cyl([1.14, 0.04, 1.14], [0, 2.3, 0.14], { color: '#2a2726', rot: [90, 0, 0] })
      .cyl([0.36, 0.04, 0.36], [0, 2.38, 0.165], { color: '#ffd24a', rot: [90, 0, 0], name: 'glass', mover: { kind: 'light', on: false } })
      .torus([1.24, 1.24, 0.1], [0, 2.3, 0.16], { color: '#9a9a92', tube: 0.06 });
    for (let k = 0; k < 6; k++) b.ball([0.15, 0.22, 0.02], xy(0, 2.38, 0.33, (k * Math.PI) / 3, 0.165), { color: cols[k], rot: [0, 0, -k * 60], name: `rose${k}`, mover: { kind: 'light', on: false } });
    b.each(12, (i) => b.box([0.34, 0.44, 0.02], [-0.37 + (i % 3) * 0.37, 0.43 + Math.floor(i / 3) * 0.47, 0.165], { color: cols[i], name: `pane${i}`, mover: { kind: 'light', on: false } }));
    return b.act({ click: [[A.par(A.operate('all', 'on'), A.effect('sparkle', { dur: 2 }))], [A.operate('all', 'off')]] }).done();
  }),
  // A straight staircase (3 m rise, 12 steps of 25 cm by 28 cm): oak treads and white risers between stringers, a
  // handrail on turned balusters. A tennis ball bounces down it.
  e('stairs', 'home', 'stairs', () => {
    const b = m('stairs', { edge: 'sharp' });
    b.each(12, (i) => {
      const y = 0.25 * (i + 1), z = 1.55 - i * 0.28;
      b.box([1.0, 0.04, 0.3], [0, y - 0.02, z], { color: 'wood', round: 0.2 });
      b.box([0.98, 0.21, 0.03], [0, y - 0.145, z + 0.135], { color: '#f7f5ef' });
    });
    const len = Math.hypot(3.0, 3.36), a = Math.atan2(3.0, 3.36) / D;
    b.pair((s) => b.box([0.06, 0.32, len], [s * 0.52, 1.4, -0.0], { color: '#f7f5ef', rot: [a, 0, 0], round: 0.1 }));
    b.box([1.0, 3.0, 0.1], [0, 1.5, -1.6], { color: '#f2e6cf' });
    b.rod([0.56, 1.25, 1.6], [0.56, 4.0, -1.45], 0.06, 'darkwood', { edge: 'soft' });
    b.each(12, (i) => b.stick([0.56, 0.25 * (i + 1), 1.55 - i * 0.28], [0.56, 0.25 * (i + 1) + 0.9, 1.55 - i * 0.28], 0.03, '#f7f5ef'));
    b.stick([0.56, 0.2, 1.6], [0.56, 1.3, 1.6], 0.09, 'darkwood').ball(0.11, [0.56, 1.33, 1.6], { color: 'darkwood' });
    b.box([0.1, 0.02, 0.1], [-0.2, 3.03, -1.4], { color: 'wood', name: 'carrier', scale: 0 });
    return b
      .socket('top', [-0.2, 3.03, -1.4], 'top', { part: 'carrier', size: 0.3 })
      .act({ click: [A.spawn('ball', 'tennis ball'), A.attach('ball', 'self', 'top'), A.wait(0.3), A.par(A.pose('carrier', { move: [0, -3.0, 3.2], dur: 2.4 }), A.say('Bip, bip, bip, bip...', 2.4, 'ball')), A.wait(0.5), A.remove('ball', 'pop'), A.pose('carrier', { move: [0, 0, 0], dur: 0 })] })
      .done();
  }),
  // A concrete stairwell (4.4 m): two flights round a half landing, steel handrails, a fire door with a push bar and a
  // glowing green EXIT sign.
  e('stairwell', 'places', 'rooms', () => {
    const b = m('stairwell', { edge: 'sharp' })
      .box([2.8, 0.15, 3.0], [0, 0.075, 0], { color: '#9da3a8' })
      .box([2.8, 4.4, 0.25], [0, 2.2, -1.62], { color: '#e8e4dc' })
      .box([0.25, 4.4, 3.0], [-1.52, 2.2, 0], { color: '#e8e4dc' })
      .box([2.6, 0.2, 0.9], [0, 2.2, -1.05], { color: '#b9bec2' })
      .box([1.2, 0.2, 1.2], [-0.7, 4.3, 0.85], { color: '#b9bec2' })
      .box([1.0, 2.1, 0.08], [0.8, 1.2, -1.47], { color: '#c0392b', name: 'door', pivot: [0.3, 1.2, -1.45], mover: { kind: 'swing', axis: 'y', amount: -90 } })
      .box([0.8, 0.06, 0.06], [0.8, 1.05, -1.4], { color: 'silver', parent: 'door' })
      .box([0.24, 0.24, 0.04], [0.8, 1.7, -1.42], { color: '#a9dcf2', parent: 'door' })
      .box([0.6, 0.25, 0.08], [0.8, 2.5, -1.46], { color: '#2fbf5a', name: 'exit', mover: { kind: 'light', on: true } })
      .label('EXIT', [0.5, 0.18], [0.8, 2.5, -1.415], { color: '#2fbf5a', parent: 'exit', depth: 0.01 });
    b.each(7, (i) => b.box([1.2, 0.3, 0.3], [0.65, 0.3 + i * 0.3, 1.2 - i * 0.3], { color: '#c9ccd1' }));
    b.each(7, (i) => b.box([1.2, 0.3, 0.3], [-0.65, 2.45 + i * 0.3, -0.45 + i * 0.3], { color: '#c9ccd1' }));
    b.rod([1.28, 1.2, 1.25], [1.28, 3.15, -0.7], 0.05, 'steel', { edge: 'soft' })
      .rod([0, 3.3, -0.55], [0, 5.3, 1.4], 0.05, 'steel', { edge: 'soft' });
    b.each(3, (i) => b.stick([1.28, 0.45 + i * 0.6, 1.05 - i * 0.6], [1.28, 1.35 + i * 0.6, 1.05 - i * 0.6], 0.03, 'steel'));
    return b.act({ click: [A.operate('door', 'open'), A.par(A.operate('exit', 'off'), A.say('Clang!', 1)), A.operate('exit', 'on'), A.wait(1.6), A.operate('door', 'close'), A.say('Thud.', 1)] }).done();
  }),
  // A sharpened wooden fence stake (1 m) driven into the soil, with a rope tied round it. A mallet drives it down.
  e('stake', 'workshop', 'lumber', () =>
    m('stake')
      .ball([0.36, 0.1, 0.3], [0, 0.02, 0], { color: 'dirt' })
      .box([0.08, 0.9, 0.08], [0, 0.48, 0], { color: 'lightwood', round: 0.1, name: 'stake', edge: 'sharp' })
      .pyramid([0.08, 0.14, 0.08], [0, -0.0, 0], 4, { color: 'lightwood', rot: [180, 45, 0], parent: 'stake', edge: 'sharp' })
      .box([0.09, 0.025, 0.09], [0, 0.93, 0], { color: '#9a7a50', round: 0.3, parent: 'stake', edge: 'sharp' })
      .torus([0.11, 0.11, 0.03], [0, 0.72, 0], { color: 'tan', rot: [90, 0, 0], tube: 0.2, parent: 'stake' })
      .rod([0.05, 0.72, 0], [0.5, 0.05, 0.1], 0.025, 'tan')
      .act({ click: [[A.pose('stake', { move: [0, -0.06, 0], dur: 0.12 }), A.par(A.effect('dust', { dur: 0.8 }), A.say('Thunk!', 1))], [A.pose('stake', { move: [0, 0, 0], dur: 0.6 }), A.say('Creak.', 1)]] })
      .done(),
  ),
  // A cave ceiling (2.2 m) held up on rock: dripstone stalactites hang from it, wet tips glinting; a drop of water
  // gathers on the longest and falls.
  e('stalactite', 'nature', 'caves', () => {
    const dr = '#d8c8a8';
    const b = m('stalactite')
      .box([2.4, 0.5, 1.2], [0, 2.2, 0], { color: 'rock', round: 0.5 })
      .ball([1.4, 0.5, 0.9], [0.2, 2.0, 0], { color: '#8a8780' })
      .cone([0.32, 1.1, 0.32], [0, 1.45, 0], { color: dr, rot: [180, 0, 0] })
      .cone([0.2, 0.7, 0.2], [0.4, 1.65, 0.15], { color: dr, rot: [180, 0, 0] })
      .cone([0.16, 0.5, 0.16], [-0.38, 1.75, -0.1], { color: dr, rot: [180, 0, 0] })
      .cone([0.12, 0.35, 0.12], [0.7, 1.85, -0.2], { color: dr, rot: [180, 0, 0] })
      .cone([0.1, 0.3, 0.1], [-0.65, 1.88, 0.2], { color: dr, rot: [180, 0, 0] })
      .ball([0.04, 0.05, 0.04], [0, 0.88, 0], { color: '#bfe6f5', name: 'drop' })
      .cone([0.26, 0.2, 0.26], [0, 0.1, 0], { color: dr })
      .cyl([0.5, 0.01, 0.4], [0, 0.005, 0], { color: '#7fa8c0', noInk: true });
    b.pair((s) => b.box([0.5, 2.3, 0.9], [s * 1.05, 1.1, 0], { color: 'rock', round: 0.5 }).ball([0.7, 0.6, 1.0], [s * 1.0, 0.25, 0], { color: '#8a8780' }));
    return b.act({ click: [A.pose('drop', { move: [0, -0.75, 0], dur: 0.5 }), A.par(A.pose('drop', { scale: 0, dur: 0.1 }), A.effect('water_spray', { dur: 0.5 }), A.say('Plink.', 1)), A.pose('drop', { move: [0, 0, 0], scale: 0, dur: 0 }), A.pose('drop', { scale: 1, dur: 1.2 })] }).done();
  }),
  // A stalagmite (1.5 m) rising from the cave floor in ringed layers of dripstone, two smaller ones beside it and a
  // drip pool. It glistens.
  e('stalagmite', 'nature', 'caves', () =>
    m('stalagmite')
      .ball([1.0, 0.24, 0.8], [0, 0.06, 0], { color: 'rock' })
      .cyl([0.4, 1.45, 0.4], [0, 0.78, 0], { color: '#d8c8a8', taper: 0.08 })
      .ball([0.46, 0.18, 0.46], [0, 0.3, 0], { color: '#cbb994' })
      .ball([0.36, 0.12, 0.36], [0, 0.65, 0], { color: '#cbb994' })
      .ball([0.26, 0.1, 0.26], [0, 0.95, 0], { color: '#cbb994' })
      .cyl([0.24, 0.8, 0.24], [0.3, 0.45, 0.06], { color: '#d8c8a8', taper: 0.1 })
      .cyl([0.17, 0.5, 0.17], [-0.28, 0.3, 0.08], { color: '#d8c8a8', taper: 0.1 })
      .cyl([0.4, 0.01, 0.3], [0.1, 0.12, 0.35], { color: '#7fa8c0', noInk: true })
      .ball(0.04, [0.02, 1.48, 0.02], { color: '#bfe6f5', glow: true })
      .act({ click: [A.par(A.effect('sparkle', { dur: 1.5 }), A.say('Plink... plink.', 1.6))] })
      .done(),
  ),
  // A postage stamp at its real size (3 cm) on a collector's clear stand: perforated edges, a picture of a hill and a
  // sun, the value. A postmark gets stamped across it.
  e('stamp (postage)', 'study', 'mail', () => {
    const b = m('stamp (postage)')
      .box([0.04, 0.004, 0.025], [0, 0.002, 0], { color: '#d6f0fa', round: 0.3, edge: 'sharp' })
      .box([0.03, 0.036, 0.0008], [0, 0.024, 0], { color: 'paper', edge: 'sharp' })
      .box([0.024, 0.029, 0.0008], [0, 0.0245, 0.0006], { color: '#a8d8f5', edge: 'sharp' })
      .ball([0.024, 0.012, 0.0006], [0, 0.013, 0.0011], { color: '#5aa553', noInk: true })
      .ball(0.006, [0.006, 0.031, 0.0011], { color: '#f6d24a', noInk: true })
      .label('5c', [0.008, 0.005], [-0.007, 0.034, 0.0012], { color: '#a8d8f5', depth: 0.0003 })
      .torus([0.03, 0.03, 0.0006], [0.008, 0.02, 0.0016], { color: '#2a2726', tube: 0.08, name: 'postmark', scale: 0, noInk: true });
    b.each(6, (i) => {
      for (const s of [-1, 1]) {
        b.ball(0.0025, [-0.0125 + i * 0.005, 0.024 + s * 0.018, 0], { color: '#efece4', noInk: true });
        b.ball(0.0025, [s * 0.015, 0.0095 + i * 0.0058, 0], { color: '#efece4', noInk: true });
      }
    });
    return b.act({ click: [[A.par(A.pose('postmark', { scale: 1, dur: 0.1 }), A.anim('shake'), A.say('Ka-chunk!', 1.2))], [A.pose('postmark', { scale: 0, dur: 0.3 })]] }).done();
  }),
  // A wooden lectern (1.2 m): sloped reading desk with a lip, a panel front with a gold emblem, a plinth base, a
  // gooseneck mic and a reading lamp (a light) over the speech.
  e('stands', 'study', 'classroom', () =>
    m('stands', { edge: 'sharp' })
      .box([0.62, 0.08, 0.5], [0, 0.04, 0], { color: 'darkwood', round: 0.2 })
      .box([0.5, 0.98, 0.36], [0, 0.57, 0], { color: 'wood', round: 0.06 })
      .box([0.44, 0.84, 0.02], [0, 0.57, 0.185], { color: '#9a6a3a', round: 0.2 })
      .cyl([0.18, 0.02, 0.18], [0, 0.72, 0.198], { color: 'gold', rot: [90, 0, 0] })
      .star(0.1, [0, 0.72, 0.21], { color: '#8a1f24' })
      .box([0.66, 0.05, 0.5], [0, 1.12, 0.02], { color: 'darkwood', rot: [18, 0, 0], round: 0.2 })
      .box([0.66, 0.05, 0.03], [0, 1.06, 0.27], { color: 'darkwood', round: 0.3 })
      .box([0.4, 0.008, 0.3], [-0.05, 1.15, 0.03], { color: 'paper', rot: [18, 0, 0] })
      .rod([0.22, 1.15, -0.12], [0.2, 1.38, 0.0], 0.012, '#2a2726', { edge: 'soft' })
      .capsule([0.035, 0.08, 0.035], [0.2, 1.4, 0.05], { color: '#2a2726', rot: [60, 0, 0], name: 'mic' })
      .rod([-0.26, 1.13, -0.14], [-0.22, 1.3, 0.0], 0.01, 'brass', { edge: 'soft' })
      .cyl([0.1, 0.05, 0.06], [-0.18, 1.31, 0.05], { color: '#3f7a3a', rot: [0, 0, 90], name: 'lamp', mover: { kind: 'light', on: false } })
      .act({ click: [[A.operate('lamp', 'on'), A.pose('mic', { move: [0, -0.01, 0], dur: 0.1 }), A.pose('mic', { move: [0, 0, 0], dur: 0.1 }), A.say('Tap, tap...', 1.4)], [A.par(A.say('Eeeeeee!', 1.2), A.anim('shake')), A.operate('lamp', 'off')]] })
      .done(),
  ),
  // A heavy-duty staple gun (20 cm, side view): a steel body with its magazine, the squeeze lever (it snaps down) and
  // a rubber grip.
  e('staple gun', 'workshop', 'hand tools', () =>
    m('staple gun', { view: 'side', edge: 'sharp' })
      .box([0.04, 0.03, 0.2], [0, 0.015, 0], { color: '#5c6166', round: 0.2 })
      .box([0.046, 0.1, 0.13], [0, 0.075, 0.035], { color: '#f6d24a', round: 0.3 })
      .box([0.03, 0.012, 0.18], [0, 0.034, -0.01], { color: 'silver', round: 0.3 })
      .box([0.05, 0.014, 0.03], [0, 0.007, 0.095], { color: '#9da3a8' })
      .label('T50', [0.04, 0.02], [0.0235, 0.08, 0.04], { color: '#f6d24a', rot: [0, 90, 0], depth: 0.002 })
      .box([0.034, 0.024, 0.19], [0, 0.135, -0.04], { color: '#2a2726', rot: [8, 0, 0], round: 0.5, name: 'lever', pivot: [0, 0.13, 0.08], mover: { kind: 'swing', axis: 'x', amount: 9 } })
      .box([0.036, 0.03, 0.1], [0, 0.14, -0.07], { color: '#e0473b', rot: [8, 0, 0], round: 0.6, parent: 'lever', edge: 'soft' })
      .act({ click: [A.operate('lever', 'on'), A.par(A.anim('shake'), A.say('Ka-CHUNK!', 1.2)), A.operate('lever', 'off')] })
      .done(),
  ),
  // A desktop stapler (16 cm, side view): black base with the anvil, red top arm on its back hinge. Open it to load;
  // press it: ka-chunk.
  e('stapler', 'study', 'stationery', () =>
    m('stapler', { view: 'side', edge: 'sharp' })
      .box([0.045, 0.014, 0.16], [0, 0.007, 0], { color: '#2a2726', round: 0.4 })
      .box([0.028, 0.004, 0.035], [0, 0.016, 0.055], { color: 'silver' })
      .cyl([0.02, 0.05, 0.02], [0, 0.026, -0.07], { color: '#2a2726', rot: [0, 0, 90] })
      .box([0.03, 0.016, 0.14], [0, 0.028, -0.005], { color: '#5c6166', round: 0.3 })
      .box([0.046, 0.024, 0.16], [0, 0.046, 0.0], { color: '#d0302a', round: 0.5, name: 'arm', pivot: [0, 0.028, -0.072], mover: { kind: 'swing', axis: 'x', amount: -65 } })
      .box([0.04, 0.006, 0.05], [0, 0.06, 0.03], { color: '#a32620', parent: 'arm', round: 0.5 })
      .act({ click: [[A.operate('arm', 'open'), A.say('Click.', 1)], [A.operate('arm', 'close'), A.pose('arm', { rot: [4, 0, 0], dur: 0.1 }), A.pose('arm', { rot: [0, 0, 0], dur: 0.1 }), A.say('Ka-chunk!', 1)]] })
      .done(),
  ),
  // A box of staples (6 cm) with a sliding lid, two strips of staples waiting beside it.
  e('staples', 'study', 'stationery', () =>
    m('staples', { edge: 'sharp' })
      .box([0.065, 0.025, 0.035], [0, 0.0125, 0], { color: '#2f4f8f', round: 0.15 })
      .box([0.066, 0.004, 0.036], [0, 0.027, 0], { color: '#4e8fd6', name: 'lid', mover: { kind: 'slide', axis: 'x', amount: 0.035 } })
      .label('26/6', [0.03, 0.012], [0, 0.0125, 0.018], { color: 'white', depth: 0.002 })
      .box([0.05, 0.006, 0.0125], [0.0, 0.003, 0.035], { color: 'silver' })
      .box([0.05, 0.0012, 0.013], [0.0, 0.0066, 0.035], { color: '#dfe3e6' })
      .box([0.05, 0.006, 0.0125], [0.012, 0.003, 0.055], { color: 'silver', rot: [0, 12, 0] })
      .act({ click: [[A.operate('lid', 'open'), A.say('Clink.', 1)], [A.operate('lid', 'close')]] })
      .done(),
  ),
  // A star, as a 2.2 m planetarium model on a stand: a glowing yellow sun with darker sunspots and solar flares that
  // can burst out. (The vocabulary's 12 m is a building; the brief shows suns and planets as models.)
  e('star (space)', 'sky', 'stars', () => {
    const c: V = [0, 2.0, 0];
    const b = m('star (space)')
      .cyl([0.8, 0.1, 0.8], [0, 0.05, 0], { color: '#2a2726', edge: 'sharp' })
      .stick([0, 0.1, 0], [0, 0.95, 0], 0.08, '#5c6166', { edge: 'sharp' })
      .ball(2.0, c, { color: '#ffcf3a', name: 'sun', mover: { kind: 'light', on: true } })
      .ball([0.3, 0.2, 0.05], [0.4, 2.3, 0.92], { color: '#e09a2a', noInk: true })
      .ball([0.2, 0.15, 0.05], [-0.5, 1.8, 0.9], { color: '#e09a2a', noInk: true });
    b.each(8, (i) => {
      const a = (i * Math.PI) / 4 + 0.2;
      b.cone([0.3, 0.45, 0.2], xy(0, 2.0, 1.12, a), { color: i % 2 ? '#ff9a2a' : '#ffd24a', glow: true, rot: [0, 0, -a / D] });
    });
    b.arc([0.9, 0.6, 0.12], xy(0, 2.0, 1.0, 0.8), { color: '#ff7a2a', rot: [0, 0, -0.8 / D], name: 'flare', scale: 0, glow: true, tube: 0.2 });
    return b.act({ click: [A.par(A.pose('flare', { scale: 1.4, dur: 0.6 }), A.effect('fire', { dur: 1.5 }), A.effect('sparkle', { dur: 2 })), A.wait(1.2), A.pose('flare', { scale: 0, dur: 0.8 })] }).done();
  }),
  // A family station wagon (4.8 m): the roof runs all the way back over the load space, wood-grain side panels, a
  // roof rack with a suitcase, and a tailgate that opens.
  e('station wagon', 'garage', 'cars', () => {
    const b = m('station wagon', { view: 'side' });
    car(b, { L: 4.85, W: 1.84, H: 1.48, belt: 0.95, low: 0.26, color: '#3fa7a0', wheel: 0.66, wb: 2.85, cab: [0.05, 0.78], rake: [0.06, 0.3], nose: 0.6, tail: 0.95, plate: 'WAGON 7' });
    b.pair((s) => {
      b.box([0.02, 0.32, 2.9], [s * 0.93, 0.62, -0.35], { color: '#8c5a2b', round: 0.3, parent: 'body', edge: 'sharp' });
      b.stick([s * 0.68, 1.5, -1.9], [s * 0.68, 1.5, 0.4], 0.04, '#2a2726', { edge: 'sharp' });
    });
    b.box([1.5, 0.05, 0.04], [0, 1.52, -1.6], { color: '#2a2726', edge: 'sharp' })
      .box([1.5, 0.05, 0.04], [0, 1.52, 0.2], { color: '#2a2726', edge: 'sharp' })
      .box([0.75, 0.32, 0.55], [0.15, 1.7, -0.7], { color: '#c0392b', round: 0.25, edge: 'sharp' })
      .box([1.6, 0.7, 0.04], [0, 1.05, -2.43], { color: '#3fa7a0', round: 0.3, name: 'tailgate', pivot: [0, 1.42, -2.42], mover: { kind: 'swing', axis: 'x', amount: -95 }, edge: 'sharp' })
      .box([1.3, 0.38, 0.03], [0, 1.18, -2.455], { color: '#3d5a73', parent: 'tailgate', edge: 'sharp' });
    return b
      .socket('boot', [0, 0.85, -1.8], 'inside', { size: 0.9 })
      .act({
        click: [
          [A.par(A.operate('headlights', 'on'), A.anim('shake'), A.say('Honk honk!', 1.5)), A.wait(1.2), A.operate('headlights', 'off')],
          [A.operate('tailgate', 'open'), A.say('Creak... thunk.', 1.5), A.wait(2.2), A.operate('tailgate', 'close')],
        ],
      })
      .done();
  }),
  // A town statue (3.6 m): a bronze hero in verdigris, sword raised and cloak flying, on a granite plinth with a gold
  // plaque. A pigeon comes and sits on its head.
  e('statue', 'places', 'monuments', () => {
    const c = '#6fa58f', dk = '#5a8f7a';
    const b = m('statue')
      .box([1.3, 1.2, 1.3], [0, 0.6, 0], { color: 'stone', round: 0.04, edge: 'sharp' })
      .box([1.5, 0.15, 1.5], [0, 1.27, 0], { color: '#9a9a92', round: 0.2, edge: 'sharp' })
      .box([1.5, 0.15, 1.5], [0, 0.075, 0], { color: '#9a9a92', round: 0.2, edge: 'sharp' })
      .box([0.7, 0.3, 0.02], [0, 0.7, 0.66], { color: 'gold', round: 0.2, edge: 'sharp' })
      .label('OUR HERO', [0.6, 0.12], [0, 0.72, 0.67], { color: 'gold', depth: 0.005 })
      .box([0.5, 0.08, 0.5], [0, 1.39, 0], { color: c, round: 0.4 })
      .capsule([0.16, 0.95, 0.18], [0.12, 1.88, 0.04], { color: c, rot: [-6, 0, 4] })
      .capsule([0.16, 0.95, 0.18], [-0.12, 1.88, -0.06], { color: c, rot: [8, 0, -4] })
      .loft([0.5, 0.3, 0.75], [0, 2.65, 0], [[0, 0.75, 0.85], [0.5, 0.85, 0.9], [0.85, 1, 1], [1, 0.55, 0.7]], { color: c, rot: [-90, 0, 0], boxy: 0.6 })
      .ball([0.26, 0.3, 0.27], [0, 3.22, 0.02], { color: c })
      .torus([0.27, 0.27, 0.05], [0, 3.27, 0.0], { color: dk, rot: [90, 0, 0], tube: 0.15 })
      .rod([0.24, 2.92, 0], [0.4, 3.3, 0.08], 0.13, c)
      .ball(0.12, [0.42, 3.38, 0.09], { color: c })
      .box([0.05, 0.9, 0.02], [0.44, 3.85, 0.1], { color: '#8fb8a8', round: 0.3, edge: 'sharp' })
      .box([0.22, 0.04, 0.06], [0.43, 3.42, 0.1], { color: dk, edge: 'sharp' })
      .rod([-0.24, 2.92, 0], [-0.32, 2.5, 0.12], 0.12, c)
      .ball([0.6, 1.3, 0.12], [-0.05, 2.35, -0.22], { color: dk, rot: [10, 0, 15] })
      .ball([0.06, 0.03, 0.02], [0.05, 3.23, 0.15], { color: dk, noInk: true });
    return b
      .socket('head', [0, 3.38, 0.02], 'top', { size: 0.3 })
      .act({ click: [A.spawn('bird', 'pigeon', { rel: 'near', of: 'self', dist: 'close' }), A.attach('bird', 'self', 'head'), A.say('Coo-coo!', 1.6, 'bird'), A.wait(1.8), A.remove('bird', 'fly_away')] })
      .done();
  }),
  // A gilt figurine award (30 cm): a slender gold figure with folded arms on a black stepped base with a plaque. It
  // turns to catch the light.
  e('statuette', 'home', 'decor', () =>
    m('statuette')
      .cyl([0.1, 0.07, 0.1], [0, 0.035, 0], { color: '#2a2726', edge: 'sharp' })
      .cyl([0.075, 0.02, 0.075], [0, 0.08, 0], { color: '#2a2726', edge: 'sharp' })
      .box([0.05, 0.02, 0.004], [0, 0.04, 0.05], { color: 'gold', edge: 'sharp' })
      .cyl([0.06, 0.012, 0.06], [0, 0.096, 0], { color: 'gold', name: 'figure', edge: 'sharp' })
      .capsule([0.04, 0.12, 0.034], [0, 0.155, 0], { color: 'gold', parent: 'figure' })
      .capsule([0.052, 0.1, 0.036], [0, 0.24, 0], { color: 'gold', parent: 'figure' })
      .ball(0.036, [0, 0.305, 0], { color: 'gold', parent: 'figure' })
      .box([0.05, 0.014, 0.03], [0, 0.245, 0.02], { color: '#d9a830', parent: 'figure', round: 0.5 })
      .stick([0.0, 0.11, 0.02], [0.0, 0.25, 0.022], 0.01, '#d9a830', { parent: 'figure' })
      .act({ click: [A.par(A.pose('figure', { rot: [0, 360, 0], dur: 1.4 }), A.effect('sparkle', { dur: 1.4 }), A.say('Ting!', 1)), A.pose('figure', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A grilled T-bone steak (25 cm) on a wooden board: the bone, a rim of fat, criss-cross char marks, a sprig of
  // rosemary and a pat of butter melting on top. Sizzle.
  e('steak', 'food', 'meat', () => {
    const b = m('steak')
      .box([0.36, 0.022, 0.26], [0, 0.011, 0], { color: 'lightwood', round: 0.2, edge: 'sharp' })
      .ball([0.23, 0.04, 0.17], [0.006, 0.036, -0.006], { color: '#f0e0c0' })
      .ball([0.22, 0.05, 0.16], [0, 0.042, 0], { color: '#8a3a22' })
      .rod([-0.03, 0.052, -0.06], [-0.03, 0.052, 0.06], 0.016, '#f0e6d0')
      .rod([-0.1, 0.052, 0.0], [0.04, 0.052, 0.0], 0.016, '#f0e6d0')
      .box([0.03, 0.012, 0.03], [0.04, 0.072, 0.03], { color: '#f6d24a', round: 0.5 })
      .rod([0.1, 0.03, 0.09], [0.16, 0.03, 0.05], 0.006, '#5a7a3a');
    b.each(4, (i) => b.box([0.15, 0.003, 0.008], [0.02, 0.0675, -0.05 + i * 0.03], { color: '#3a1408', noInk: true, rot: [0, 35, 0] }));
    b.each(3, (i) => b.box([0.12, 0.003, 0.008], [0.02, 0.068, -0.03 + i * 0.03], { color: '#3a1408', noInk: true, rot: [0, -40, 0] }));
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.anim('shake'), A.say('Tsssss!', 1.5))] }).done();
  }),
  // A stealth bomber at its real size (52 m flying wing, 21 m long, 5 m high), nose to +z: one flat charcoal
  // triangle of a wing with the W-shaped sawtooth trailing edge, a smooth centre hump with the cockpit windows, two
  // engine humps with buried intakes, a nose wheel and two main gear legs. Its bay doors open.
  e('stealth aircraft', 'garage', 'aircraft', () => {
    const c = '#3a3f45', dk = '#2a2e33', y = 3.0;
    const b = m('stealth aircraft', { view: 'side', edge: 'sharp' })
      .wedge([52, 17, 0.7], [0, y, 1.9], { color: c, rot: [90, 0, 0], name: 'body' })
      .wedge([14, 4.5, 0.6], [0, y, -8.6], { color: c, rot: [-90, 0, 0], parent: 'body' })
      .ball([8.5, 2.6, 15], [0, y + 0.2, 1.5], { color: c, parent: 'body', edge: 'soft' })
      .box([1.8, 0.4, 0.8], [0, y + 1.25, 5.6], { color: '#1e2630', rot: [-25, 0, 0], parent: 'body' })
      .box([2.8, 0.1, 4.0], [0, y - 0.45, 0.5], { color: dk, name: 'bay', pivot: [-1.4, y - 0.42, 0.5], mover: { kind: 'swing', axis: 'z', amount: -80 } })
      .rod([0, y - 0.4, 6.5], [0, 0.45, 6.5], 0.25, '#5c6166')
      .cyl([0.9, 0.35, 0.9], [0, 0.45, 6.5], { color: 'rubber', rot: [0, 0, 90], name: 'wheelN', edge: 'soft' });
    b.pair((s) => {
      b.wedge([14, 4.0, 0.6], [s * 17, y, -8.0], { color: c, rot: [-90, 0, 0], parent: 'body' });
      b.ball([5.5, 1.6, 10], [s * 4.6, y + 0.35, -0.5], { color: c, parent: 'body', edge: 'soft' });
      b.box([2.4, 0.4, 0.5], [s * 4.6, y + 0.85, 3.6], { color: dk, rot: [-15, 0, 0], parent: 'body' });
      b.box([2.6, 0.3, 1.0], [s * 4.6, y + 0.5, -5.0], { color: dk, parent: 'body' });
      b.box([0.6, 0.3, 0.4], [s * 0.7, y + 1.25, 5.3], { color: '#1e2630', rot: [-20, s * 15, 0], parent: 'body' });
      b.rod([s * 6.0, y - 0.4, -1.0], [s * 6.0, 0.55, -1.0], 0.3, '#5c6166');
      b.cyl([1.1, 0.4, 1.1], [s * 6.25, 0.55, -0.5], { color: 'rubber', rot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}1`, edge: 'soft' });
      b.cyl([1.1, 0.4, 1.1], [s * 6.25, 0.55, -1.6], { color: 'rubber', rot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}2`, edge: 'soft' });
      b.box([0.08, 0.6, 1.4], [s * 5.7, 1.9, -1.0], { color: dk });
    });
    return b
      .act({ click: [[A.operate('bay', 'open'), A.say('Hummmm...', 1.5), A.wait(2), A.operate('bay', 'close')], [A.par(A.effect('smoke', { dur: 2 }), A.anim('shake', 2), A.say('Whooooosh...', 2))]] })
      .done();
  }),
  // Steam: a wisp of white vapour (30 cm) curling up from a steaming mug. It puffs up.
  e('steam', 'nature', 'water', () => {
    const b = m('steam')
      .cyl([0.085, 0.09, 0.085], [0, 0.045, 0], { color: 'white' })
      .cyl([0.074, 0.004, 0.074], [0, 0.09, 0], { color: '#6b4226' })
      .torus([0.06, 0.06, 0.014], [0.05, 0.045, 0], { color: 'white', rot: [0, 90, 0], tube: 0.2 });
    b.each(3, (k) => {
      const x0 = (k - 1) * 0.022;
      let prev: V = [x0, 0.095, 0];
      for (let j = 1; j <= 5; j++) {
        const p: V = [x0 + Math.sin(j * 1.4 + k * 2) * 0.016, 0.095 + j * 0.042, Math.cos(j * 1.2 + k) * 0.008];
        b.rod(prev, p, 0.022 - j * 0.002, '#f2f5f7', { noInk: true });
        prev = p;
      }
    });
    b.ball([0.16, 0.14, 0.12], [0, 0.3, 0], { color: '#f2f5f7', name: 'puff', scale: 0, noInk: true });
    return b.act({ click: [A.par(A.pose('puff', { scale: 1, dur: 0.8 }), A.effect('steam', { dur: 2.5 }), A.say('Fsssss...', 1.6)), A.wait(1), A.pose('puff', { scale: 0, dur: 1 })] }).done();
  }),
  // A sternwheel paddle steamer (34 m): a white hull with a red waterline, two decks with railings and gingerbread
  // trim, a pilot house on top, twin black smokestacks with gold crowns and the big red stern paddle wheel (it turns).
  e('steamboat', 'garage', 'boats', () => {
    const b = m('steamboat', { view: 'side', edge: 'sharp' })
      .loft([10, 3.0, 34], [0, 1.5, 0], [[0, 0.95, 1, 0], [0.5, 1, 1, 0], [0.82, 0.92, 1, 0], [1, 0.25, 1, 0.05]], { color: 'white', cut: 'bottom', boxy: 0.75, name: 'hull', edge: 'soft' })
      .loft([10.1, 0.6, 34.1], [0, 0.4, 0], [[0, 0.95, 1, 0], [0.5, 1, 1, 0], [0.82, 0.92, 1, 0], [1, 0.25, 1, 0.05]], { color: '#c0392b', cut: 'bottom', boxy: 0.75, parent: 'hull', edge: 'soft' })
      .box([9.6, 0.25, 30], [0, 1.6, -1.5], { color: '#b5814e', round: 0.1 })
      .box([8.4, 3.0, 22], [0, 3.2, -2.5], { color: 'white', round: 0.03 })
      .box([9.4, 0.25, 26], [0, 4.8, -2.5], { color: '#e8e4dc', round: 0.1 })
      .box([7.0, 2.6, 14], [0, 6.2, -3.5], { color: '#f7f5ef', round: 0.03 })
      .box([8.0, 0.25, 16], [0, 7.6, -3.5], { color: '#e8e4dc', round: 0.1 })
      .box([3.6, 2.2, 3.6], [0, 8.85, 2.0], { color: 'white', round: 0.05 })
      .box([3.7, 0.9, 3.7], [0, 9.2, 2.0], { color: '#3d5a73' })
      .pyramid([5.8, 0.8, 5.8], [0, 10.35, 2.0], 4, { color: '#c0392b' }) // square to the pilot house (size is corner to corner: 4.1 m a side)
      .label('BELLE', [4, 0.9], [0, 4.0, 8.52], { color: 'white', depth: 0.05 })
      .cyl([1.0, 7.6, 1.0], [0, 3.2, -19.0], { color: '#2a2726', rot: [0, 0, 90], name: 'paddle', mover: { kind: 'spin', axis: 'x', amount: 90 } });
    b.pair((s) => b.torus([6.8, 6.8, 0.3], [s * 3.4, 3.2, -19.0], { color: '#c0392b', rot: [0, 90, 0], tube: 0.06, parent: 'paddle' }).torus([3.6, 3.6, 0.25], [s * 3.4, 3.2, -19.0], { color: '#c0392b', rot: [0, 90, 0], tube: 0.08, parent: 'paddle' }));
    b.each(10, (i) => {
      const a = (i / 10) * Math.PI * 2;
      b.box([7.0, 1.0, 0.18], [0, 3.2 + Math.cos(a) * 2.9, -19.0 + Math.sin(a) * 2.9], { color: '#e0473b', rot: [-a / D, 0, 0], parent: 'paddle' });
      b.pair((s) => b.box([0.2, 3.2, 0.15], [s * 3.4, 3.2 + Math.cos(a) * 1.6, -19.0 + Math.sin(a) * 1.6], { color: '#8a1f24', rot: [-a / D, 0, 0], parent: 'paddle' }));
    });
    b.box([0.3, 0.3, 4.5], [4.0, 3.2, -17.0], { color: '#5c6166' }).box([0.3, 0.3, 4.5], [-4.0, 3.2, -17.0], { color: '#5c6166' });
    b.pair((s) => {
      b.cyl([0.9, 7.0, 0.9], [s * 1.6, 11.2, 5.5], { color: '#2a2726' });
      b.cyl([1.4, 0.7, 1.4], [s * 1.6, 15.0, 5.5], { color: 'gold', taper: 1.3 });
      b.each(9, (i) => b.box([0.06, 2.0, 1.6], [s * 4.22, 3.3, -12 + i * 2.4], { color: '#3d5a73', round: 0.2 }));
      b.each(6, (i) => b.box([0.06, 1.6, 1.5], [s * 3.52, 6.3, -9 + i * 2.4], { color: '#3d5a73', round: 0.2 }));
      b.box([0.06, 0.8, 26], [s * 4.68, 5.35, -2.5], { color: 'white' });
      b.box([0.06, 0.8, 16], [s * 3.98, 8.15, -3.5], { color: 'white' });
      b.box([0.08, 0.15, 30], [s * 4.75, 2.1, -1.5], { color: 'white' });
      b.each(12, (i) => b.stick([s * 4.6, 1.7, -14 + i * 2.4], [s * 4.6, 4.7, -14 + i * 2.4], 0.14, 'white'));
      b.each(7, (i) => b.stick([s * 3.9, 4.9, -11 + i * 2.4], [s * 3.9, 7.5, -11 + i * 2.4], 0.12, 'white'));
    });
    b.box([1.6, 0.15, 3.5], [3.6, 1.8, 9.5], { color: '#b5814e', name: 'gangplank', pivot: [3.6, 1.8, 7.8], mover: { kind: 'swing', axis: 'x', amount: -30 }, rot: [0, 0, 0] });
    return b
      .socket('pilot', [0, 8.0, 2.0], 'seat')
      .act({
        click: [
          [A.operate('paddle', 'on'), A.par(A.effect('smoke', { dur: 3 }), A.say('Toot-toot!', 1.6)), A.effect('water_spray', { dur: 2 }), A.wait(1.5), A.operate('paddle', 'off')],
          [A.operate('gangplank', 'open'), A.say('All aboard!', 1.8), A.wait(2), A.operate('gangplank', 'close')],
        ],
      })
      .done();
  }),
  // Steel as a material: a short stack of rolled I-beams (25 cm) with a couple of round bars, mill-grey with a blue
  // mill mark. It rings when struck.
  e('steel (material)', 'workshop', 'materials', () =>
    m('steel (material)', { edge: 'sharp' })
      .box([0.1, 0.012, 0.26], [0, 0.006, 0], { color: 'steel', round: 0.1 })
      .box([0.1, 0.012, 0.26], [0, 0.074, 0], { color: 'steel', round: 0.1 })
      .box([0.012, 0.06, 0.26], [0, 0.04, 0], { color: 'steel', round: 0.1 })
      .box([0.1, 0.012, 0.26], [0, 0.086, -0.01], { color: '#9aa3ac', round: 0.1 })
      .box([0.1, 0.012, 0.26], [0, 0.154, -0.01], { color: '#9aa3ac', round: 0.1 })
      .box([0.012, 0.06, 0.26], [0, 0.12, -0.01], { color: '#9aa3ac', round: 0.1 })
      .box([0.05, 0.02, 0.002], [0, 0.04, 0.131], { color: '#4e8fd6' })
      .cyl([0.026, 0.26, 0.026], [0.085, 0.013, 0], { color: 'iron', rot: [90, 0, 0] })
      .cyl([0.026, 0.26, 0.026], [0.113, 0.013, 0], { color: 'metal', rot: [90, 0, 0] })
      .act({ click: [A.par(A.anim('shake'), A.effect('sparkle', { dur: 0.6 }), A.say('CLANG!', 1.2))] })
      .done(),
  ),
  // A steel cage (3 m cube): heavy corner posts, bars all round, a barred door on hinges with a padlock that comes off.
  e('steel cage', 'places', 'structures', () => {
    const b = m('steel cage', { edge: 'sharp' })
      .box([3.1, 0.2, 3.1], [0, 0.1, 0], { color: '#5c6166', round: 0.1 })
      .box([3.1, 0.15, 3.1], [0, 3.2, 0], { color: 'steel', round: 0.2 });
    for (const [x, z] of [[1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]]) b.box([0.14, 3.0, 0.14], [x, 1.7, z], { color: 'iron', round: 0.2 });
    b.each(9, (i) => {
      const t = -1.2 + i * 0.3;
      b.stick([t, 0.2, -1.5], [t, 3.15, -1.5], 0.045, 'steel').stick([1.5, 0.2, t], [1.5, 3.15, t], 0.045, 'steel').stick([-1.5, 0.2, t], [-1.5, 3.15, t], 0.045, 'steel');
      if (i < 3 || i > 6) b.stick([t, 0.2, 1.5], [t, 3.15, 1.5], 0.045, 'steel');
    });
    b.pair((s) => b.stick([-1.5, 1.7, s * 1.5], [1.5, 1.7, s * 1.5], 0.07, 'iron'));
    b.box([0.05, 2.5, 0.05], [-0.45, 1.45, 1.55], { color: 'iron', name: 'door', pivot: [-0.45, 1.45, 1.55], mover: { kind: 'swing', axis: 'y', amount: -100 } });
    b.each(4, (i) => b.stick([-0.3 + i * 0.25, 0.25, 1.55], [-0.3 + i * 0.25, 2.65, 1.55], 0.045, 'steel', { parent: 'door' }));
    b.stick([-0.45, 0.3, 1.55], [0.45, 0.3, 1.55], 0.06, 'iron', { parent: 'door' }).stick([-0.45, 2.65, 1.55], [0.45, 2.65, 1.55], 0.06, 'iron', { parent: 'door' }).stick([-0.45, 1.5, 1.55], [0.45, 1.5, 1.55], 0.06, 'iron', { parent: 'door' });
    b.box([0.14, 0.12, 0.05], [0.45, 1.38, 1.6], { color: 'brass', round: 0.3, name: 'padlock', parent: 'door', piece: true })
      .arc([0.1, 0.12, 0.02], [0.45, 1.44, 1.6], { color: 'silver', parent: 'padlock', tube: 0.25 });
    return b.act({ click: [[A.detach('padlock', 'lock'), A.operate('door', 'open'), A.say('Creeeak...', 1.6)], [A.operate('door', 'close'), A.reattach('padlock'), A.say('CLANG!', 1.2)]] }).done();
  }),
  // Wrought-steel double gates (3 m) between stone piers with ball finials: vertical bars with gold spear tips, rails
  // and scrolls. Both leaves swing open.
  e('steel gate', 'places', 'structures', () => {
    const b = m('steel gate', { edge: 'sharp' });
    b.pair((s) => {
      const n = s > 0 ? 'gateL' : 'gateR';
      b.box([0.5, 2.8, 0.5], [s * 2.0, 1.4, 0], { color: 'stone', round: 0.04 });
      b.box([0.6, 0.15, 0.6], [s * 2.0, 2.87, 0], { color: '#9a9a92', round: 0.2 });
      b.ball(0.4, [s * 2.0, 3.15, 0], { color: '#9a9a92' });
      b.box([1.7, 0.1, 0.06], [s * 0.88, 0.3, 0], { color: 'iron', name: n, pivot: [s * 1.74, 1.2, 0], mover: { kind: 'swing', axis: 'y', amount: s * -95 } });
      b.box([1.7, 0.1, 0.06], [s * 0.88, 2.0, 0], { color: 'iron', parent: n });
      b.box([1.7, 0.08, 0.06], [s * 0.88, 2.3, 0], { color: 'iron', parent: n });
      b.each(6, (i) => {
        const x = s * (0.12 + i * 0.29);
        b.stick([x, 0.12, 0], [x, 2.45 - Math.abs(i - 2.5) * 0.06 * (s > 0 ? 1 : 1), 0], 0.04, 'iron', { parent: n });
        b.cone([0.08, 0.16, 0.05], [x, 2.53 - Math.abs(i - 2.5) * 0.06, 0], { color: 'gold', parent: n });
      });
      b.torus([0.3, 0.3, 0.03], [s * 0.88, 2.15, 0], { color: 'iron', tube: 0.12, parent: n });
    });
    b.box([0.08, 0.2, 0.08], [0.03, 1.15, 0.06], { color: 'brass', parent: 'gateL' });
    return b.act({ click: [[A.operate('gates', 'open'), A.say('Creeeeak...', 1.8)], [A.operate('gates', 'close'), A.say('CLANG!', 1.2)]] }).done();
  }),
  // A car's leather-wrapped steering wheel (38 cm) on its column and a display pedestal: three spokes, the horn pad
  // with a badge. It turns lock to lock and honks.
  e('steering wheel', 'garage', 'car parts', () => {
    const c: V = [0, 0.62, 0.05];
    const b = m('steering wheel', { edge: 'sharp' })
      .box([0.3, 0.04, 0.3], [0, 0.02, -0.15], { color: '#2a2726', round: 0.2 })
      .stick([0, 0.04, -0.15], [0, 0.48, -0.15], 0.06, '#5c6166')
      .stick([0, 0.46, -0.15], [0, 0.62, 0.0], 0.065, '#3a3633')
      .torus([0.38, 0.38, 0.05], c, { color: '#2a2726', tube: 0.13, name: 'wheel', rot: [-20, 0, 0], edge: 'soft', mover: { kind: 'swing', axis: 'z', amount: 90 } })
      .cyl([0.12, 0.06, 0.1], c, { color: '#3a3633', rot: [70, 0, 0], parent: 'wheel' })
      .cyl([0.04, 0.01, 0.04], [0, 0.63, 0.085], { color: 'silver', rot: [70, 0, 0], parent: 'wheel' });
    for (const a of [Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const p = xy(0, 0, 0.17, a);
      b.stick(c, [p[0], c[1] + p[1] * Math.cos(20 * D), c[2] - p[1] * Math.sin(20 * D) * -1], 0.035, '#3a3633', { parent: 'wheel' });
    }
    return b.act({ click: [[A.operate('wheel', 'on'), A.say('Squeak... vroom!', 1.4), A.operate('wheel', 'off')], [A.par(A.anim('shake'), A.say('Beep beep!', 1.2))]] }).done();
  }),
  // A young plant stem (20 cm) pushing up out of a little pot of soil: leaves along it and a bud at the tip. It grows
  // taller.
  e('stem', 'garden', 'plant parts', () =>
    m('stem')
      .cyl([0.1, 0.08, 0.1], [0, 0.04, 0], { color: '#c87a4a', taper: 1.2, edge: 'sharp' })
      .cyl([0.11, 0.01, 0.11], [0, 0.08, 0], { color: 'dirt' })
      .rod([0, 0.08, 0], [0.01, 0.26, 0], 0.012, '#5aa553')
      .ball([0.07, 0.018, 0.03], [0.04, 0.14, 0], { color: 'leaf', rot: [0, 0, 25] })
      .ball([0.06, 0.016, 0.03], [-0.03, 0.19, 0.0], { color: 'leaf', rot: [0, 0, -25] })
      .ball([0.05, 0.014, 0.025], [0.03, 0.235, 0.0], { color: 'leaf', rot: [0, 0, 30] })
      .ball([0.022, 0.034, 0.022], [0.01, 0.275, 0], { color: '#9be34d' })
      .act({ click: [[A.par(A.set({ scale: 1.6, dur: 1.5 }), A.effect('sparkle', { dur: 1.5 }))], [A.par(A.set({ scale: 1, dur: 0.6 }), A.anim('wobble'))]] })
      .done(),
  ),
  // A plastic lettering stencil (30 cm) clipped upright over a sheet of paper on a little easel: star, circle, heart
  // and ABC cut out. Spray through it and the shapes appear in paint.
  e('stencil', 'study', 'art supplies', () =>
    m('stencil', { edge: 'sharp' })
      .box([0.34, 0.03, 0.1], [0, 0.015, 0], { color: 'wood', round: 0.3 })
      .box([0.32, 0.24, 0.004], [0, 0.15, -0.006], { color: 'paper' })
      .box([0.3, 0.22, 0.004], [0, 0.15, 0.002], { color: '#f2c94c' })
      .star(0.08, [-0.08, 0.17, 0.0045], { color: '#fdf3d0', noInk: true })
      .cyl([0.06, 0.003, 0.06], [0.0, 0.17, 0.0045], { color: '#fdf3d0', rot: [90, 0, 0], noInk: true })
      .heart(0.06, [0.08, 0.17, 0.0045], { color: '#fdf3d0', noInk: true })
      .label('ABC', [0.2, 0.05], [0, 0.08, 0.004], { color: '#fdf3d0', depth: 0.001 })
      .box([0.26, 0.12, 0.003], [0, 0.15, 0.006], { color: '#e0473b', name: 'paint', scale: 0, noInk: true })
      .act({ click: [[A.par(A.effect('smoke', { dur: 1 }), A.say('Pssht!', 1)), A.pose('paint', { scale: 1, dur: 0.4 })], [A.pose('paint', { scale: 0, dur: 0.4 })]] })
      .done(),
  ),
  // A two-step plastic step stool (45 cm) with anti-slip treads and a carry handle; a child climbs up on it.
  e('step stool', 'home', 'furniture', () =>
    m('step stool', { edge: 'sharp' })
      .box([0.42, 0.22, 0.26], [0, 0.11, 0.12], { color: '#4e8fd6', round: 0.15 })
      .box([0.42, 0.45, 0.25], [0, 0.225, -0.13], { color: '#4e8fd6', round: 0.15 })
      .box([0.36, 0.012, 0.2], [0, 0.226, 0.12], { color: '#2a2726', round: 0.3, noInk: true })
      .box([0.36, 0.012, 0.2], [0, 0.456, -0.13], { color: '#2a2726', round: 0.3, noInk: true })
      .box([0.16, 0.04, 0.05], [0, 0.4, -0.24], { color: '#2a2726', round: 0.5 })
      .socket('top', [0, 0.46, -0.13], 'top', { size: 0.4 })
      .act({ click: [A.spawn('kid', 'girl', { rel: 'near', of: 'self', dist: 'close' }), A.attach('kid', 'self', 'top'), A.par(A.anim('arms_up', 1, 'kid'), A.say("Look, I'm tall!", 2, 'kid')), A.wait(1.2), A.remove('kid', 'fade')] })
      .done(),
  ),
  // An aluminium A-frame stepladder (2.4 m): five treads, braced rear legs, spreader bars, a fold-down paint shelf, a
  // moulded top cap with a tool tray.
  e('stepladder', 'workshop', 'ladders', () => {
    const b = m('stepladder', { edge: 'sharp' }).box([0.52, 0.12, 0.34], [0, 2.28, -0.02], { color: '#f0923b', round: 0.25 });
    b.box([0.4, 0.03, 0.2], [0, 2.35, -0.02], { color: '#c87a2a', round: 0.3 });
    b.pair((s) => {
      b.stick([s * 0.26, 0, 0.5], [s * 0.21, 2.22, 0.02], 0.06, 'silver');
      b.stick([s * 0.26, 0, -0.55], [s * 0.21, 2.22, -0.06], 0.05, 'silver');
      b.stick([s * 0.24, 0.95, 0.29], [s * 0.24, 0.95, -0.32], 0.02, '#9da3a8');
      b.box([0.08, 0.04, 0.1], [s * 0.26, 0.02, 0.5], { color: '#2a2726', round: 0.4 });
      b.box([0.08, 0.04, 0.1], [s * 0.26, 0.02, -0.55], { color: '#2a2726', round: 0.4 });
    });
    b.each(3, (i) => b.stick([-0.25, 0.5 + i * 0.6, -0.5 + i * 0.12], [0.25, 0.5 + i * 0.6, -0.5 + i * 0.12], 0.03, 'silver'));
    b.each(5, (i) => {
      const y = 0.4 * (i + 1);
      b.box([0.48, 0.035, 0.12], [0, y, 0.5 - (y / 2.2) * 0.48], { color: '#c9ccd1', round: 0.2 });
    });
    b.box([0.4, 0.03, 0.26], [0, 1.85, -0.3], { color: '#f0923b', round: 0.3, name: 'shelf', pivot: [0, 1.85, -0.17], mover: { kind: 'swing', axis: 'x', amount: 85 } });
    return b
      .socket('top', [0, 2.36, -0.02], 'top', { size: 0.3 })
      .act({ click: [[A.operate('shelf', 'close'), A.say('Clack!', 1)], [A.operate('shelf', 'open'), A.anim('wobble'), A.say('Wobble...', 1)]] })
      .done();
  }),
  // A hi-fi stack (70 cm wide with its speakers): amplifier with glowing blue VU meters and big volume knob, a CD tray
  // that slides out, a cassette deck, two speaker cabinets.
  e('stereo', 'music', 'audio', () => {
    const b = m('stereo', { edge: 'sharp' })
      .box([0.34, 0.1, 0.26], [0, 0.05, 0], { color: '#3a3633', round: 0.15 })
      .box([0.34, 0.1, 0.26], [0, 0.155, 0], { color: '#2a2726', round: 0.15 })
      .box([0.34, 0.08, 0.26], [0, 0.25, 0], { color: '#3a3633', round: 0.15 })
      .box([0.12, 0.04, 0.01], [-0.08, 0.17, 0.131], { color: '#4ec0ff', name: 'meters', mover: { kind: 'light', on: false } })
      .cyl([0.06, 0.02, 0.06], [0.1, 0.155, 0.135], { color: 'silver', rot: [90, 0, 0], name: 'knob' })
      .box([0.012, 0.025, 0.006], [0.1, 0.17, 0.146], { color: '#2a2726', parent: 'knob' })
      .box([0.22, 0.012, 0.2], [-0.03, 0.25, 0.05], { color: '#5c6166', round: 0.2, name: 'tray', mover: { kind: 'slide', axis: 'z', amount: 0.12 } })
      .cyl([0.11, 0.003, 0.11], [-0.03, 0.258, 0.06], { color: '#dfe3e6', parent: 'tray' })
      .box([0.2, 0.05, 0.01], [-0.04, 0.05, 0.131], { color: '#1e1c1b' })
      .box([0.07, 0.035, 0.006], [-0.08, 0.05, 0.135], { color: '#5c6166' })
      .box([0.07, 0.035, 0.006], [0.0, 0.05, 0.135], { color: '#5c6166' });
    b.pair((s) => {
      b.box([0.18, 0.34, 0.22], [s * 0.3, 0.17, 0], { color: '#2a2726', round: 0.1 });
      b.cyl([0.13, 0.02, 0.13], [s * 0.3, 0.11, 0.11], { color: '#5c6166', rot: [90, 0, 0] });
      b.dome([0.05, 0.02, 0.05], [s * 0.3, 0.11, 0.125], { color: '#3a3633', rot: [90, 0, 0] });
      b.cyl([0.05, 0.02, 0.05], [s * 0.3, 0.26, 0.11], { color: '#5c6166', rot: [90, 0, 0] });
    });
    return b
      .act({
        click: [
          [A.operate('tray', 'out'), A.say('Whirr.', 1), A.wait(0.8), A.operate('tray', 'in')],
          [A.operate('meters', 'on'), A.pose('knob', { rot: [0, 0, -120], dur: 0.6 }), A.par(A.anim('pulse', 3), A.say('Boom-tss, boom-tss!', 2.2)), A.pose('knob', { rot: [0, 0, 0], dur: 0.4 }), A.operate('meters', 'off')],
        ],
      })
      .done();
  }),
  // A doctor's stethoscope (70 cm) hanging on a little hook stand: steel ear tubes with tips, the Y of tubing, and the
  // two-sided chest piece. Listen: thump-thump.
  e('stethoscope', 'clinic', 'medical tools', () => {
    const b = m('stethoscope')
      .cyl([0.2, 0.02, 0.2], [0, 0.01, 0], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.02, -0.04], [0, 0.82, -0.04], 0.018, 'silver', { edge: 'sharp' })
      .rod([0, 0.82, -0.04], [0, 0.82, 0.03], 0.016, 'silver', { edge: 'sharp' });
    b.pair((s) => {
      b.rod([0, 0.8, 0.03], [s * 0.07, 0.72, 0.05], 0.009, 'silver', { edge: 'sharp' });
      b.rod([s * 0.07, 0.72, 0.05], [s * 0.06, 0.84, 0.07], 0.008, 'silver', { edge: 'sharp' });
      b.ball(0.016, [s * 0.055, 0.85, 0.075], { color: '#2a2726' });
      b.rod([s * 0.07, 0.72, 0.05], [s * 0.03, 0.5, 0.05], 0.013, '#2a2726');
    });
    b.rod([0.03, 0.5, 0.05], [0, 0.45, 0.05], 0.013, '#2a2726')
      .rod([-0.03, 0.5, 0.05], [0, 0.45, 0.05], 0.013, '#2a2726')
      .rod([0, 0.45, 0.05], [0.02, 0.18, 0.06], 0.014, '#2a2726')
      .cyl([0.055, 0.025, 0.055], [0.02, 0.14, 0.07], { color: 'silver', rot: [90, 0, 0], name: 'chest', edge: 'sharp' })
      .cyl([0.045, 0.006, 0.045], [0.02, 0.14, 0.085], { color: '#e8e4dc', rot: [90, 0, 0], parent: 'chest', edge: 'sharp' })
      .stick([0.02, 0.17, 0.06], [0.02, 0.155, 0.065], 0.012, 'silver', { parent: 'chest' });
    return b.act({ click: [A.par(A.effect('hearts', { dur: 2 }), A.say('Thump-thump... thump-thump.', 2.2)), A.pose('chest', { rot: [0, 0, 20], dur: 0.2 }), A.pose('chest', { rot: [0, 0, 0], dur: 0.2 })] }).done();
  }),
  // A cast-iron pot of beef stew (28 cm across) with its lid tipped on and a ladle: chunks of beef, carrot and potato
  // in gravy. Lift the lid: steam.
  e('stew', 'food', 'soups', () => {
    const b = m('stew')
      .cyl([0.26, 0.15, 0.26], [0, 0.075, 0], { color: '#3a3633', name: 'pot', edge: 'sharp' })
      .torus([0.27, 0.27, 0.02], [0, 0.148, 0], { color: '#3a3633', rot: [90, 0, 0], tube: 0.06, parent: 'pot' })
      .cyl([0.24, 0.01, 0.24], [0, 0.14, 0], { color: '#7a3a1e', parent: 'pot' });
    const bits: Array<[number, number, string]> = [[0.05, 0.03, '#f0923b'], [-0.06, 0.01, '#f0e0b0'], [0.0, -0.06, '#6b3a22'], [-0.03, 0.07, '#f0923b'], [0.07, -0.04, '#f0e0b0'], [-0.07, -0.05, '#6b3a22'], [0.02, 0.07, '#6b3a22']];
    for (const [x, z, c] of bits) b.ball([0.045, 0.028, 0.04], [x, 0.148, z], { color: c, parent: 'pot' });
    b.pair((s) => b.box([0.05, 0.03, 0.04], [s * 0.15, 0.13, 0], { color: '#3a3633', round: 0.5, parent: 'pot', edge: 'sharp' }));
    b.cyl([0.27, 0.018, 0.27], [-0.03, 0.17, -0.03], { color: '#3a3633', rot: [0, 0, 6], name: 'lid', parent: 'pot', piece: true, edge: 'sharp' })
      .ball([0.05, 0.03, 0.05], [-0.032, 0.19, -0.03], { color: '#5c6166', parent: 'lid' })
      .rod([0.08, 0.15, 0.06], [0.16, 0.28, 0.1], 0.012, 'silver', { edge: 'sharp' });
    return b.act({ click: [[A.detach('lid', 'lid'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Blub, blub...', 1.8))], [A.reattach('lid'), A.say('Clank.', 1)]] }).done();
  }),
  // A forked stick (60 cm) of bare wood with a few leaves still on it, fallen across a stone. A dog comes to fetch it.
  e('stick', 'nature', 'wood', () =>
    m('stick')
      .ball([0.2, 0.13, 0.16], [0.12, 0.06, 0], { color: 'rock' })
      .rod([-0.32, 0.02, 0], [0.24, 0.15, 0.02], 0.032, 'bark')
      .rod([0.0, 0.09, 0.01], [0.12, 0.2, 0.14], 0.018, 'bark')
      .rod([-0.18, 0.05, 0], [-0.26, 0.1, -0.1], 0.014, 'bark')
      .ball([0.06, 0.012, 0.035], [0.13, 0.21, 0.16], { color: 'leaf', rot: [0, 30, 20] })
      .ball([0.045, 0.01, 0.03], [-0.27, 0.11, -0.12], { color: '#8a9a3a', rot: [0, -40, 0] })
      .act({ click: [A.spawn('dog', 'dog', { rel: 'near', of: 'self', dist: 'far' }), A.move('dog', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run' }), A.par(A.anim('wag', 2, 'dog'), A.say('Woof! Woof!', 1.6, 'dog')), A.wait(1), A.remove('dog', 'fade')] })
      .done(),
  ),
  // A sheet of stickers (14 cm) propped up: a big smiley, a star and a heart on glossy backing paper. The smiley peels
  // off (a piece) and sticks back on.
  e('sticker', 'study', 'stationery', () =>
    m('sticker')
      .box([0.1, 0.012, 0.05], [0, 0.006, -0.02], { color: '#5c6166', round: 0.3, edge: 'sharp' })
      .box([0.1, 0.14, 0.002], [0, 0.08, 0], { color: '#f2f5f7', rot: [-8, 0, 0], name: 'sheet', edge: 'sharp' })
      .cyl([0.056, 0.002, 0.056], [0, 0.11, 0.006], { color: '#f6d24a', rot: [82, 0, 0], name: 'smiley', parent: 'sheet', piece: true, edge: 'sharp' })
      .ball(0.008, [-0.012, 0.118, 0.009], { color: '#2a2726', parent: 'smiley', noInk: true })
      .ball(0.008, [0.012, 0.118, 0.009], { color: '#2a2726', parent: 'smiley', noInk: true })
      .arc([0.03, 0.03, 0.002], [0, 0.106, 0.009], { color: '#2a2726', rot: [0, 0, 180], arc: 140, tube: 0.12, parent: 'smiley', noInk: true })
      .star(0.035, [-0.025, 0.045, 0.012], { color: '#e0473b', parent: 'sheet', noInk: true })
      .heart(0.03, [0.026, 0.045, 0.012], { color: '#f4a1c0', parent: 'sheet', noInk: true })
      .act({ click: [[A.detach('smiley', 'smiley'), A.say('Peel!', 1)], [A.reattach('smiley'), A.say('Stick!', 1)]] })
      .done(),
  ),
  // A pair of wooden walking stilts (2.2 m): hand grips at the top, foot blocks 60 cm up with straps, rubber feet.
  // They clomp along.
  e('stilts', 'toys', 'outdoor toys', () => {
    const b = m('stilts');
    b.pair((s) => {
      const x = s * 0.22, n = s > 0 ? 'stiltL' : 'stiltR';
      b.box([0.05, 2.2, 0.05], [x, 1.12, 0], { color: 'lightwood', round: 0.3, name: n, edge: 'sharp' })
        .box([0.12, 0.05, 0.2], [x - s * 0.06, 0.62, 0.06], { color: 'darkwood', round: 0.2, parent: n, edge: 'sharp' })
        .box([0.05, 0.12, 0.05], [x - s * 0.02, 0.57, 0.0], { color: 'darkwood', rot: [0, 0, s * 30], round: 0.2, parent: n, edge: 'sharp' })
        .arc([0.12, 0.08, 0.04], [x - s * 0.06, 0.66, 0.08], { color: '#2a2726', parent: n, tube: 0.2 })
        .cyl([0.06, 0.25, 0.06], [x, 1.95, 0], { color: '#e0473b', parent: n })
        .ball([0.08, 0.06, 0.08], [x, 0.03, 0], { color: 'rubber', parent: n });
    });
    return b
      .act({ click: [A.pose('stiltL', { move: [0, 0.12, 0.15], dur: 0.35 }), A.pose('stiltL', { move: [0, 0, 0.15], dur: 0.2 }), A.say('Clomp!', 0.8), A.pose('stiltR', { move: [0, 0.12, 0.15], dur: 0.35 }), A.pose('stiltR', { move: [0, 0, 0.15], dur: 0.2 }), A.say('Clomp!', 0.8), A.par(A.pose('stiltL', { move: [0, 0, 0], dur: 0.5 }), A.pose('stiltR', { move: [0, 0, 0], dur: 0.5 }))] })
      .done();
  }),
  // A glass stink-bomb ampoule (6 cm) of murky green liquid with a sealed tip. Crack it: a green cloud. Pee-yew!
  e('stink bomb', 'toys', 'pranks', () =>
    m('stink bomb')
      .capsule([0.022, 0.05, 0.022], [0, 0.025, 0], { color: '#9bbf3a' })
      .cyl([0.02, 0.012, 0.02], [0, 0.056, 0], { color: '#d6f0fa', taper: 0.5 })
      .cyl([0.009, 0.02, 0.009], [0, 0.072, 0], { color: '#d6f0fa', taper: 0.5 })
      .ball([0.006, 0.006, 0.006], [0, 0.083, 0], { color: '#d6f0fa' })
      .ball([0.008, 0.004, 0.004], [0.006, 0.03, 0.01], { color: '#e6f5c0', noInk: true })
      .ball([0.4, 0.3, 0.4], [0, 0.18, 0], { color: '#a8c84a', name: 'cloud', scale: 0, noInk: true })
      .act({ click: [A.par(A.pose('cloud', { scale: 1, dur: 0.7 }), A.effect('smoke', { dur: 2 }), A.say('Crack! ...Pee-yew!', 2)), A.wait(1.5), A.pose('cloud', { scale: 0, dur: 1 })] })
      .done(),
  ),
  // Stitches on a first-aid training forearm (35 cm) lying on its block: a neat row of black sutures across a red cut.
  // A bandage wraps round to cover them, then comes off again.
  e('stitches (body)', 'clinic', 'first aid', () => {
    const b = m('stitches (body)')
      .box([0.36, 0.03, 0.14], [0, 0.015, 0], { color: '#5c6166', round: 0.3, edge: 'sharp' })
      .capsule([0.08, 0.34, 0.07], [0, 0.07, 0], { color: 'skin2', rot: [0, 0, 90] })
      .ball([0.1, 0.07, 0.09], [-0.19, 0.07, 0], { color: 'skin2' })
      .box([0.12, 0.004, 0.006], [0.02, 0.105, 0.0], { color: '#b0303a', rot: [0, 10, 0], noInk: true })
      .cyl([0.084, 0.06, 0.084], [0.02, 0.07, 0], { color: 'white', rot: [0, 0, 90], name: 'bandage', scale: 0 });
    b.each(6, (i) => {
      const x = -0.03 + i * 0.02;
      b.box([0.003, 0.003, 0.03], [x, 0.106, 0.0 - (x - 0.02) * 0.17], { color: '#1e1c1b', rot: [0, 30, 0], noInk: true });
    });
    return b.act({ click: [[A.pose('bandage', { scale: 1, dur: 0.6 }), A.effect('sparkle', { dur: 1 })], [A.pose('bandage', { scale: 0, dur: 0.5 })]] }).done();
  }),
  // An anatomical model of the stomach (30 cm) on a stand: the J-shaped bag (fundus, body, the curve of the greater
  // curvature, the antrum) with pink lining folds, the gullet coming in at the top left and the duodenum curling away
  // at the right. It gurgles.
  e('stomach', 'clinic', 'organs', () =>
    m('stomach')
      .cyl([0.14, 0.02, 0.14], [0, 0.01, 0], { color: 'darkwood', edge: 'sharp' })
      .stick([0, 0.02, -0.03], [0, 0.09, -0.03], 0.012, 'steel', { edge: 'sharp' })
      .ball([0.12, 0.17, 0.085], [-0.02, 0.18, 0], { color: '#e8919a', rot: [0, 0, -12], name: 'stomach' })
      .ball([0.09, 0.08, 0.075], [-0.04, 0.26, 0], { color: '#e8919a', parent: 'stomach' })
      .ball([0.14, 0.08, 0.08], [0.03, 0.115, 0], { color: '#e8919a', rot: [0, 0, 20], parent: 'stomach' })
      .rod([0.07, 0.12, 0], [0.11, 0.18, 0], 0.05, '#e8919a', { parent: 'stomach' })
      .rod([0.11, 0.18, 0], [0.14, 0.17, 0], 0.026, '#e8a0a8', { parent: 'stomach' })
      .rod([0.14, 0.17, 0], [0.155, 0.12, 0.005], 0.024, '#e8a0a8', { parent: 'stomach' })
      .rod([0.155, 0.12, 0.005], [0.13, 0.08, 0.01], 0.022, '#e8a0a8', { parent: 'stomach' })
      .rod([-0.02, 0.29, 0], [-0.045, 0.36, -0.01], 0.022, '#d98088', { parent: 'stomach' })
      .rod([-0.03, 0.22, 0.042], [0.03, 0.12, 0.04], 0.006, '#c86a78', { parent: 'stomach', noInk: true })
      .rod([-0.05, 0.2, 0.04], [0.0, 0.1, 0.04], 0.006, '#c86a78', { parent: 'stomach', noInk: true })
      .act({ click: [A.par(A.pose('stomach', { scale: 1.12, dur: 0.3 }), A.say('Grumble, grumble...', 1.8)), A.pose('stomach', { scale: 1, dur: 0.3 }), A.anim('wobble')] })
      .done(),
  ),
  // Stonehenge at its real size (a 30 m ring): a circle of grey sarsen uprights capped by lintels, the taller
  // trilithons in a horseshoe inside, the altar stone, and the heel stone outside on the sunrise line. The midsummer
  // sun rises over the heel stone.
  e('stonehenge', 'places', 'landmarks', () => {
    const b = m('stonehenge', { edge: 'sharp' }).cyl([40, 0.1, 40], [0, 0.05, 0], { color: 'grass', edge: 'soft' });
    const N = 20, r = 15;
    const pts = around(N, r, Math.PI / N);
    pts.forEach(([x, z], i) => {
      const a = Math.atan2(z, x);
      if (i === 12 || i === 17) return;
      b.box([2.1, 4.1, 1.1], [x, 2.15, z], { color: i % 3 ? 'stone' : '#9a9a92', rot: [0, 90 - a / D, (i % 4) - 1.5], round: 0.15 });
      if (i % 4 !== 3 && i !== 11 && i !== 16) {
        const [x2, z2] = pts[(i + 1) % N], mx = (x + x2) / 2, mz = (z + z2) / 2, ta = Math.atan2(z2 - z, x2 - x);
        b.box([Math.hypot(x2 - x, z2 - z) + 1.4, 0.8, 1.0], [mx, 4.6, mz], { color: '#8f8c86', rot: [0, -ta / D, 0], round: 0.15 });
      }
    });
    for (const [a, h] of [[-50, 6.0], [-20, 6.8], [20, 7.3], [50, 6.5], [90, 6.0]] as const) {
      const rr = 8, x = Math.sin(a * D) * rr, z = -Math.cos(a * D) * rr;
      b.pair((s) => b.box([2.2, h, 1.6], [x + Math.cos(a * D) * s * 1.3, h / 2 + 0.1, z + Math.sin(a * D) * s * 1.3], { color: 'stone', rot: [0, -a, 0], round: 0.12 }));
      b.box([5.0, 1.1, 1.6], [x, h + 0.65, z], { color: '#8f8c86', rot: [0, -a, 0], round: 0.15 });
    }
    b.box([4.8, 0.6, 1.0], [0, 0.4, -2], { color: '#9a8a7a', rot: [0, 10, 0], round: 0.2 })
      .box([1.6, 4.8, 1.4], [0, 2.4, 25], { color: '#8f8c86', rot: [5, 0, -6], round: 0.25 })
      .ball(4, [0, 2.0, 34], { color: '#ffb02a', name: 'sun', scale: 0, mover: { kind: 'light', on: false } })
      .box([3.0, 1.4, 2.0], [-8, 0.7, 10], { color: '#8f8c86', rot: [0, 30, 80], round: 0.15 });
    return b
      .act({ click: [A.par(A.pose('sun', { scale: 1, dur: 0.3 }), A.operate('sun', 'on')), A.pose('sun', { move: [0, 5, 0], dur: 2.5 }), A.effect('sparkle', { dur: 1.5 }), A.wait(1), A.par(A.pose('sun', { scale: 0, move: [0, 0, 0], dur: 0.8 }), A.operate('sun', 'off'))] })
      .done();
  }),
  // A turned beech stool (45 cm seat): a thick round seat that swivels, four splayed legs with a ring of rungs. Seat
  // for one.
  e('stool', 'home', 'seating', () => {
    const b = m('stool', { edge: 'sharp' })
      .cyl([0.36, 0.05, 0.36], [0, 0.455, 0], { color: 'wood', name: 'seat', mover: { kind: 'spin', axis: 'y', amount: 360 }, round: 0.4 })
      .cyl([0.3, 0.01, 0.3], [0, 0.481, 0], { color: '#c89a5e', parent: 'seat', noInk: true })
      .cyl([0.14, 0.04, 0.14], [0, 0.415, 0], { color: '#5c6166' })
      .torus([0.33, 0.33, 0.025], [0, 0.17, 0], { color: 'darkwood', rot: [90, 0, 0], tube: 0.08 });
    const top = around(4, 0.12, Math.PI / 4), bot = around(4, 0.19, Math.PI / 4);
    b.each(4, (i) => b.stick([top[i][0], 0.4, top[i][1]], [bot[i][0], 0, bot[i][1]], 0.035, 'darkwood', { edge: 'soft' }));
    return b.socket('seat', [0, 0.48, 0], 'seat').act({ click: [A.operate('seat', 'on'), A.say('Squeak, squeak...', 1.5), A.wait(0.6), A.operate('seat', 'off')] }).done();
  }),
  // A stop sign (2.6 m): a red octagon (75 cm) with a white border and STOP, on a galvanised post in a concrete
  // footing, with LEDs round its rim that flash.
  e('stop sign', 'places', 'street things', () => {
    const b = m('stop sign', { edge: 'sharp' })
      .cyl([0.3, 0.12, 0.3], [0, 0.06, 0], { color: 'stone' })
      .stick([0, 0.12, -0.04], [0, 2.3, -0.04], 0.06, '#9da3a8')
      .cyl([0.76, 0.02, 0.76], [0, 2.2, 0], { color: 'white', rot: [90, 0, 22.5], segs: 8 })
      .cyl([0.68, 0.02, 0.68], [0, 2.2, 0.012], { color: '#c0202a', rot: [90, 0, 22.5], segs: 8 })
      .label('STOP', [0.5, 0.17], [0, 2.2, 0.026], { color: '#c0202a', depth: 0.004 })
      .box([0.08, 0.1, 0.03], [0, 2.2, -0.03], { color: '#5c6166' });
    b.each(8, (i) => b.ball(0.035, xy(0, 2.2, 0.31, ((i + 0.5) * Math.PI) / 4, 0.025), { color: '#ffef9a', name: `led${i}`, mover: { kind: 'light', on: false } }));
    return b
      .act({ click: [A.operate('leds', 'on'), A.say('Flash!', 0.6), A.operate('leds', 'off'), A.wait(0.3), A.operate('leds', 'on'), A.say('Flash!', 0.6), A.operate('leds', 'off')] })
      .done();
  }),
  // A corner grocery store (7 m front): a red-and-cream striped awning, an OPEN sign that lights up, crates of fruit
  // and veg on a stand outside.
  e('store', 'places', 'shops', () => {
    const b = shopFront('store', { w: 7, wall: '#f2e6cf', trim: '#c0392b', sign: 'GROCERY STORE', signColor: '#c0392b', awning: ['#c0392b', '#fff3d6'] })
      .box([0.7, 0.3, 0.04], [1.7, 2.0, 2.53], { color: '#3fe05a', name: 'open', mover: { kind: 'light', on: false } })
      .label('OPEN', [0.6, 0.22], [1.7, 2.0, 2.56], { color: '#3fe05a', parent: 'open', depth: 0.01 })
      .box([2.0, 0.8, 0.7], [-2.2, 0.4, 3.0], { color: '#8c5a2b', round: 0.1 });
    b.each(3, (i) => {
      const x = -2.85 + i * 0.65;
      b.box([0.6, 0.25, 0.6], [x, 0.93, 3.0], { color: '#b5814e', round: 0.1, rot: [-12, 0, 0] });
      b.each(4, (k) => b.ball(0.13, [x - 0.15 + (k % 2) * 0.3, 1.1, 2.9 + Math.floor(k / 2) * 0.2], { color: ['#e0473b', '#f0923b', '#9be34d'][i], edge: 'soft' }));
    });
    return b
      .act({
        click: [
          [A.par(A.operate('door', 'open'), A.operate('open', 'on')), A.say('Ding-a-ling!', 1.8), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.operate('open', 'off'), A.operate('window', 'on'), A.operate('windowB', 'on')), A.effect('sparkle', { dur: 1 }), A.wait(2), A.par(A.operate('window', 'off'), A.operate('windowB', 'off'))],
        ],
      })
      .done();
  }),
  // A kerbside storm drain (1.6 m): a cast-iron grate in the gutter, the curb inlet opening below a stone kerb, the
  // pavement behind, a puddle draining into it. Gurgle.
  e('storm drain', 'places', 'street things', () => {
    const b = m('storm drain', { edge: 'sharp' })
      .box([1.8, 0.1, 1.0], [0, 0.05, 0.3], { color: '#4a4744' })
      .box([1.8, 0.25, 0.8], [0, 0.125, -0.6], { color: '#9da3a8', round: 0.05 })
      .box([1.8, 0.2, 0.25], [0, 0.2, -0.12], { color: 'stone', round: 0.1 })
      .box([0.9, 0.08, 0.04], [0, 0.11, 0.02], { color: '#1e1c1b' })
      .box([0.9, 0.03, 0.42], [0, 0.11, 0.28], { color: '#3a3633' })
      .cyl([1.1, 0.012, 0.7], [0.3, 0.104, 0.45], { color: '#5d7584', noInk: true });
    b.each(7, (i) => b.box([0.05, 0.035, 0.4], [-0.36 + i * 0.12, 0.115, 0.28], { color: '#1e1c1b', noInk: true }));
    b.label('DRAINS TO RIVER', [0.7, 0.08], [0, 0.2, 0.006], { color: 'stone', depth: 0.005 });
    return b.act({ click: [A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Gurgle, glug, glug...', 2))] }).done();
  }),
  // A kitchen range (90 cm high, 76 cm wide): four burners on a black glass top (each glows red when on), control
  // knobs on a backguard with a clock, an oven door that drops down on its bottom hinge with a window and a towel
  // bar. A pot of stew sits on the front burner.
  e('stove', 'kitchen', 'appliances', () => {
    const b = m('stove', { edge: 'sharp' })
      .box([0.76, 0.86, 0.66], [0, 0.43, 0], { color: '#f2f2ee', round: 0.04 })
      .box([0.76, 0.02, 0.66], [0, 0.87, 0], { color: '#2a2726', round: 0.3 })
      .box([0.76, 0.18, 0.06], [0, 0.97, -0.3], { color: '#f2f2ee', round: 0.2 })
      .box([0.16, 0.06, 0.01], [0, 0.98, -0.267], { color: '#3fe0c8', glow: true })
      .box([0.66, 0.5, 0.04], [0, 0.4, 0.34], { color: '#f2f2ee', round: 0.1, name: 'oven', pivot: [0, 0.15, 0.34], mover: { kind: 'swing', axis: 'x', amount: 85 } })
      .box([0.46, 0.24, 0.02], [0, 0.43, 0.362], { color: '#2a2726', parent: 'oven' })
      .stick([-0.28, 0.6, 0.39], [0.28, 0.6, 0.39], 0.025, 'silver', { parent: 'oven' })
      .box([0.66, 0.1, 0.03], [0, 0.07, 0.33], { color: '#d4d7da' });
    for (const [x, z, i] of [[0.18, 0.15, 0], [-0.18, 0.15, 1], [0.18, -0.15, 2], [-0.18, -0.15, 3]]) {
      b.torus([0.2, 0.2, 0.01], [x, 0.882, z], { color: '#ff4a2a', rot: [90, 0, 0], tube: 0.2, name: `burner${i}`, mover: { kind: 'light', on: false } });
      b.torus([0.12, 0.12, 0.008], [x, 0.882, z], { color: '#5c6166', rot: [90, 0, 0], tube: 0.25, noInk: true });
    }
    b.each(4, (i) => b.cyl([0.045, 0.03, 0.045], [-0.27 + i * 0.18, 0.96, -0.255], { color: '#2a2726', rot: [90, 0, 0], name: i === 1 ? 'knob' : `knob${i}` }));
    return b
      .socket('burner', [-0.18, 0.89, 0.15], 'top', { size: 0.3 })
      .act({
        setup: [A.spawn('pot', 'stew'), A.attach('pot', 'self', 'burner')],
        click: [
          [A.pose('knob', { rot: [0, 0, -90], dur: 0.3 }), A.operate('burner1', 'on'), A.par(A.effect('steam', { dur: 2.5 }), A.say('Click-click-whoomp!', 1.6)), A.wait(2), A.operate('burner1', 'off'), A.pose('knob', { rot: [0, 0, 0], dur: 0.3 })],
          [A.operate('oven', 'open'), A.par(A.effect('steam', { dur: 1.5 }), A.say('Ding!', 1.4)), A.wait(1.8), A.operate('oven', 'close')],
        ],
      })
      .done();
  }),
  // A canvas straitjacket on a hospital display form: a high-collared jacket whose long closed sleeves cross over the
  // chest and buckle behind, with leather belts and buckles round the body. One belt unbuckles (a piece).
  e('straightjacket', 'clinic', 'hospital things', () => {
    const cv = '#e8e2d2', lt = '#a8763e';
    const b = m('straightjacket')
      .cyl([0.4, 0.04, 0.4], [0, 0.02, 0], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.04, 0], [0, 0.78, 0], 0.04, '#5c6166', { edge: 'sharp' })
      .loft([0.46, 0.26, 0.72], [0, 1.12, 0], [[0, 0.88, 0.85], [0.3, 0.86, 0.88], [0.72, 1, 1], [0.9, 0.98, 0.95], [1, 0.45, 0.6]], { color: cv, rot: [-90, 0, 0], boxy: 0.5, name: 'jacket' })
      .cyl([0.16, 0.12, 0.14], [0, 1.5, 0], { color: cv, parent: 'jacket' })
      .ball([0.12, 0.08, 0.1], [0, 1.58, 0], { color: '#d4d7da', parent: 'jacket' })
      .stick([0, 0.85, 0.135], [0, 1.45, 0.125], 0.012, '#c9c2ae', { parent: 'jacket', noInk: true });
    b.pair((s) => {
      b.rod([s * 0.24, 1.4, 0], [s * 0.27, 1.08, 0.04], 0.1, cv, { parent: 'jacket' });
      b.rod([s * 0.27, 1.08, 0.04], [-s * 0.14, 1.03, 0.17], 0.1, cv, { parent: 'jacket' });
      b.rod([-s * 0.14, 1.03, 0.17], [-s * 0.26, 0.98, 0.0], 0.03, lt, { parent: 'jacket' });
    });
    b.torus([0.5, 0.3, 0.05], [0, 0.88, 0], { color: lt, rot: [90, 0, 0], tube: 0.05, name: 'strap', parent: 'jacket', piece: true })
      .box([0.05, 0.055, 0.02], [0.08, 0.88, 0.15], { color: 'silver', parent: 'strap', edge: 'sharp' })
      .torus([0.5, 0.3, 0.05], [0, 1.24, 0], { color: lt, rot: [90, 0, 0], tube: 0.05, parent: 'jacket' })
      .box([0.05, 0.055, 0.02], [0.08, 1.24, 0.15], { color: 'silver', parent: 'jacket', edge: 'sharp' });
    return b.act({ click: [[A.detach('strap', 'strap'), A.say('Clink!', 1)], [A.reattach('strap'), A.say('Click.', 1)]] }).done();
  }),
  // A glass of lemonade (14 cm) with ice, a lemon slice on the rim and a striped bendy straw. Slurp: the level drops.
  e('straw (drinking)', 'kitchen', 'tableware', () => {
    const b = m('straw (drinking)')
      .cyl([0.074, 0.12, 0.074], [0, 0.06, 0], { color: '#d6f0fa', taper: 1.12 })
      .cyl([0.07, 0.09, 0.07], [0, 0.048, 0], { color: '#f6e27a', taper: 1.1, name: 'drink', pivot: [0, 0.004, 0] })
      .box([0.022, 0.022, 0.022], [0.012, 0.085, 0.01], { color: '#eef8ff', rot: [20, 30, 0], parent: 'drink', edge: 'sharp' })
      .box([0.02, 0.02, 0.02], [-0.016, 0.082, -0.01], { color: '#eef8ff', rot: [10, -20, 0], parent: 'drink', edge: 'sharp' })
      .cyl([0.05, 0.008, 0.05], [0.038, 0.12, 0.0], { color: '#f6e27a', rot: [0, 0, 80] });
    b.each(5, (i) => b.stick([-0.012 + i * 0.002, 0.03 + i * 0.03, 0], [-0.01 + i * 0.002, 0.06 + i * 0.03, 0], 0.008, i % 2 ? 'white' : '#e0473b', { edge: 'sharp' }));
    b.rod([-0.002, 0.18, 0], [0.03, 0.21, 0], 0.008, '#e0473b', { edge: 'sharp' });
    return b.act({ click: [[A.par(A.pose('drink', { scale: 0.6, dur: 1.4 }), A.say('Slurrrrp!', 1.5))], [A.par(A.pose('drink', { scale: 1, dur: 0.6 }), A.effect('sparkle', { dur: 0.8 }))]] }).done();
  }),
  // A ripe strawberry (4 cm): seeds dotted over it, a leafy green hull (a piece) that pulls off.
  e('strawberry', 'food', 'fruit', () => {
    const b = m('strawberry')
      .cyl([0.04, 0.034, 0.04], [0, 0.02, 0], { color: '#e0303b', rot: [180, 0, 0], taper: 0.25, name: 'berry' })
      .ball([0.04, 0.02, 0.04], [0, 0.037, 0], { color: '#e0303b', parent: 'berry' })
      .cyl([0.014, 0.004, 0.014], [0, 0.047, 0], { color: '#3f7a3a', name: 'hull', parent: 'berry', piece: true })
      .stick([0, 0.048, 0], [0.002, 0.062, 0], 0.004, '#3f7a3a', { parent: 'hull' });
    for (const [x, z] of around(5, 0.011)) b.ball([0.018, 0.004, 0.018], [x, 0.047, z], { color: '#5aa553', parent: 'hull' });
    b.each(8, (i) => {
      const a = i * 2.2, y = 0.012 + (i % 3) * 0.009, r = 0.008 + (y - 0.005) * 0.42;
      b.ball(0.0025, [Math.cos(a) * r, y, Math.sin(a) * r], { color: '#f6d24a', parent: 'berry', noInk: true });
    });
    return b.act({ click: [[A.detach('hull', 'hull'), A.say('Pop!', 1)], [A.reattach('hull')]] }).done();
  }),
  // A strawberry plant (30 cm) in a terracotta pot: trifoliate leaves on stalks, white flowers, berries hanging over
  // the rim on runners, one still green that ripens when clicked.
  e('strawberry plant', 'garden', 'fruit plants', () => {
    const b = m('strawberry plant')
      .cyl([0.22, 0.15, 0.22], [0, 0.075, 0], { color: '#c87a4a', taper: 1.2, edge: 'sharp' })
      .torus([0.27, 0.27, 0.03], [0, 0.15, 0], { color: '#c87a4a', rot: [90, 0, 0], tube: 0.08, edge: 'sharp' })
      .cyl([0.24, 0.01, 0.24], [0, 0.155, 0], { color: 'dirt' });
    around(6, 0.08).forEach(([x, z], i) => {
      const a = Math.atan2(x, z);
      b.rod([0, 0.155, 0], [x, 0.25, z], 0.008, '#5aa553');
      for (const k of [-1, 0, 1]) b.ball([0.05, 0.012, 0.045], [x * 1.1 + Math.cos(a) * k * 0.035, 0.255 + (k ? 0 : 0.008), z * 1.1 - Math.sin(a) * k * 0.035], { color: 'leaf', rot: [-15, a / D + k * 30, 0] });
      if (i % 2 === 0) {
        b.rod([x * 0.5, 0.18, z * 0.5], [x * 1.9, 0.12, z * 1.9], 0.005, '#5aa553');
        b.cyl([0.032, 0.036, 0.032], [x * 1.95, 0.095, z * 1.95], { color: i === 4 ? '#9be34d' : '#e0303b', rot: [180, 0, 0], taper: 0.3, ...(i === 4 ? { name: 'green' } : {}) });
        if (i === 4) b.cyl([0.034, 0.038, 0.034], [x * 1.95, 0.095, z * 1.95], { color: '#e0303b', rot: [180, 0, 0], taper: 0.3, name: 'ripe', scale: 0 });
      } else {
        b.ball([0.03, 0.01, 0.03], [x * 0.9, 0.28, z * 0.9], { color: 'white' }).ball(0.01, [x * 0.9, 0.287, z * 0.9], { color: '#f6d24a' });
      }
    });
    return b.act({ click: [[A.par(A.pose('ripe', { scale: 1, dur: 1.2 }), A.effect('sparkle', { dur: 1.2 }))], [A.pose('ripe', { scale: 0, dur: 0.6 })]] }).done();
  }),
  // A live streamer with a headset and a mic: waves hello to chat, then points at the camera for the subscribe line.
  e('streamer', 'town', 'jobs', () =>
    withAct(who('streamer', { top: '#8a5fc4', bottom: '#2a2726', shoes: 'white', hair: '#3fa7a0', acc: [hat('headphones', '#2a2726'), held('mic', '#2a2726', 'L')] }), {
      click: [
        [A.par(A.anim('wave'), A.say('Hey chat, welcome back to the stream!', 2.2))],
        [A.par(A.anim('point'), A.say("Smash that subscribe button!", 2))],
      ],
    }),
  ),
  // A street sweeper truck (6 m, 3 m high): a cab-forward cab with big glass, a hopper body, two rotating gutter
  // brooms under the front, a water spray bar, an amber beacon and a rear door to empty the hopper.
  e('street sweeper', 'garage', 'trucks', () => {
    const b = m('street sweeper', { view: 'side', edge: 'sharp' })
      .box([2.1, 0.35, 5.6], [0, 0.75, 0], { color: '#3a3633', round: 0.2 })
      .box([2.2, 1.9, 1.7], [0, 1.85, 1.95], { color: 'white', round: 0.15 })
      .box([2.0, 1.1, 0.05], [0, 2.1, 2.81], { color: '#3d5a73', rot: [-6, 0, 0] })
      .box([2.0, 0.25, 0.06], [0, 1.25, 2.8], { color: '#2a2726' })
      .box([2.3, 2.3, 3.4], [0, 2.0, -0.85], { color: '#f6c23a', round: 0.1 })
      .box([2.32, 0.2, 3.42], [0, 1.3, -0.85], { color: '#f0923b', noInk: true })
      .label('CLEAN STREETS', [2.6, 0.4], [1.17, 2.3, -0.85], { color: '#f6c23a', rot: [0, 90, 0], depth: 0.02 })
      .label('CLEAN STREETS', [2.6, 0.4], [-1.17, 2.3, -0.85], { color: '#f6c23a', rot: [0, -90, 0], depth: 0.02 })
      .box([2.2, 1.9, 0.06], [0, 2.0, -2.6], { color: '#f0923b', name: 'hopper', pivot: [0, 2.95, -2.6], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .dome([0.3, 0.25, 0.3], [0, 3.0, 2.0], { color: '#ffb02a', name: 'beacon', mover: { kind: 'light', on: false } })
      .stick([-1.0, 0.45, 2.9], [1.0, 0.45, 2.9], 0.06, '#5c6166')
      .cyl([1.6, 0.3, 0.3], [0, 0.22, 0.6], { color: '#2a2726', rot: [0, 0, 90] });
    b.pair((s) => {
      b.box([0.05, 0.9, 1.0], [s * 1.1, 2.15, 1.95], { color: '#3d5a73' });
      b.stick([s * 0.85, 0.12, 2.6], [s * 0.75, 0.62, 2.3], 0.08, '#5c6166');
      b.cyl([0.9, 0.1, 0.9], [s * 0.9, 0.08, 2.75], { color: '#f0923b', name: `broom${s > 0 ? 'L' : 'R'}`, mover: { kind: 'spin', axis: 'y', amount: s * 600 } });
      b.each(6, (i) => b.box([0.04, 0.12, 0.45], [s * 0.9 + Math.cos((i * Math.PI) / 3) * 0.22, 0.04, 2.75 + Math.sin((i * Math.PI) / 3) * 0.22], { color: '#2a2726', rot: [0, -i * 60, 0], parent: `broom${s > 0 ? 'L' : 'R'}`, noInk: true }));
      b.ball([0.24, 0.16, 0.06], [s * 0.75, 1.4, 2.82], { color: '#fff6c8', glow: true });
      for (const [k, zz] of [['F', 1.75], ['B', -1.5]] as const) wheel(b, `wheel${k}${s > 0 ? 'L' : 'R'}`, s * 0.98, zz, 0.9, 0.32, { rim: '#9da3a8' });
    });
    return b
      .socket('driver', [0.5, 1.8, 1.9], 'seat')
      .act({
        click: [
          [A.par(A.operate('brooms', 'on'), A.operate('beacon', 'on')), A.par(A.effect('dust', { dur: 2.5 }), A.effect('water_spray', { dur: 2 }), A.say('Whirrr... swish, swish!', 2.2)), A.wait(1.5), A.par(A.operate('brooms', 'off'), A.operate('beacon', 'off'))],
          [A.operate('hopper', 'open'), A.say('Clunk... whoomph.', 1.6), A.wait(1.5), A.operate('hopper', 'close')],
        ],
      })
      .done();
  }),
  // A hospital gurney (2 m, mattress at 85 cm): a steel frame on four castors, a padded mattress with a raised back
  // section and pillow, folding side rails (they drop) and an IV pole with a bag.
  e('stretcher', 'clinic', 'hospital things', () => {
    const b = m('stretcher', { view: 'side', edge: 'sharp' })
      .box([0.66, 0.06, 1.98], [0, 0.72, 0], { color: 'silver', round: 0.3 })
      .box([0.6, 0.12, 1.3], [0, 0.81, -0.32], { color: '#3fa7a0', round: 0.5, edge: 'soft' })
      .box([0.6, 0.12, 0.66], [0, 0.95, 0.62], { color: '#3fa7a0', rot: [-25, 0, 0], round: 0.5, edge: 'soft' })
      .ball([0.42, 0.12, 0.26], [0, 1.08, 0.72], { color: 'white', rot: [-25, 0, 0], edge: 'soft' })
      .box([0.5, 0.25, 0.04], [0, 0.95, -1.0], { color: 'silver', round: 0.3 })
      .stick([-0.3, 0.72, 0.95], [-0.3, 1.95, 0.95], 0.025, 'silver')
      .stick([-0.42, 1.95, 0.95], [-0.18, 1.95, 0.95], 0.02, 'silver')
      .box([0.12, 0.18, 0.04], [-0.38, 1.82, 0.95], { color: '#d6f0fa', round: 0.5, edge: 'soft' })
      .box([0.6, 0.06, 1.6], [0, 0.28, 0], { color: '#9da3a8', round: 0.3 });
    b.pair((s) => {
      b.stick([s * 0.25, 0.3, 0.75], [s * 0.25, 0.7, 0.75], 0.05, 'silver').stick([s * 0.25, 0.3, -0.75], [s * 0.25, 0.7, -0.75], 0.05, 'silver');
      const n = s > 0 ? 'railL' : 'railR';
      b.box([0.03, 0.03, 1.1], [s * 0.34, 1.0, -0.1], { color: 'silver', name: n, pivot: [s * 0.34, 0.76, -0.1], mover: { kind: 'swing', axis: 'z', amount: s * 95 } });
      b.each(4, (i) => b.stick([s * 0.34, 0.77, -0.55 + i * 0.3], [s * 0.34, 0.99, -0.55 + i * 0.3], 0.018, 'silver', { parent: n }));
      for (const [k, z] of [['F', 0.75], ['B', -0.75]] as const) {
        b.stick([s * 0.25, 0.28, z], [s * 0.25, 0.16, z], 0.03, 'silver');
        wheel(b, `wheel${k}${s > 0 ? 'L' : 'R'}`, s * 0.25, z, 0.14, 0.05, { spokes: 0, rim: '#5c6166' });
      }
    });
    return b
      .socket('bed', [0, 0.9, -0.3], 'seat')
      .act({ click: [[A.operate('rails', 'open'), A.say('Clack, clack.', 1.2)], [A.operate('rails', 'close'), A.say('Click.', 1)]] })
      .done();
  }),
  // A guitar string, new in its paper packet (12 cm) with the coil of bright steel string spilling out and its ball
  // end; the packet stands on a little rest. Twang!
  e('string (guitar)', 'music', 'instrument parts', () =>
    m('string (guitar)')
      .box([0.12, 0.012, 0.05], [0, 0.006, 0], { color: '#5c6166', round: 0.3, edge: 'sharp' })
      .box([0.12, 0.16, 0.006], [0, 0.09, -0.012], { color: '#2f4f8f', rot: [-8, 0, 0], round: 0.1, edge: 'sharp' })
      .label('E 010', [0.09, 0.03], [0, 0.13, -0.003], { color: '#f6d24a', rot: [-8, 0, 0], depth: 0.002 })
      .torus([0.1, 0.1, 0.004], [0.0, 0.07, 0.006], { color: 'silver', tube: 0.04, name: 'coil' })
      .torus([0.094, 0.096, 0.004], [0.003, 0.07, 0.01], { color: 'silver', tube: 0.04, parent: 'coil' })
      .rod([0.05, 0.07, 0.008], [0.09, 0.014, 0.03], 0.003, 'silver', { parent: 'coil' })
      .cyl([0.008, 0.005, 0.008], [0.092, 0.012, 0.032], { color: 'brass', parent: 'coil' })
      .act({ click: [A.par(A.pose('coil', { scale: 1.08, dur: 0.1 }), A.say('Twaaang!', 1.4)), A.pose('coil', { scale: 1, dur: 0.1 }), A.anim('wobble')] })
      .done(),
  ),
  // A stick of string cheese (17 cm; the vocabulary's 20 cm is its length) lying on a little plate, half out of its yellow wrapper, strands peeling back
  // from the open end (one is a piece).
  e('string cheese', 'food', 'dairy', () =>
    m('string cheese')
      .cyl([0.22, 0.01, 0.12], [0, 0.005, 0], { color: 'white', edge: 'sharp', name: 'plate' })
      .capsule([0.028, 0.17, 0.028], [0, 0.024, 0], { color: '#fbf9f2', rot: [0, 0, 90], name: 'cheese', parent: 'plate' })
      .cyl([0.032, 0.08, 0.032], [-0.045, 0.024, 0], { color: '#f6d24a', rot: [0, 0, 90], parent: 'cheese' })
      .label('MOZZ', [0.04, 0.016], [-0.045, 0.024, 0.0165], { color: '#f6d24a', parent: 'cheese', depth: 0.001 })
      .box([0.035, 0.002, 0.03], [-0.005, 0.03, 0.02], { color: '#f6d24a', rot: [0, -30, 20], parent: 'cheese' })
      .rod([0.06, 0.032, 0.006], [0.1, 0.03, 0.04], 0.007, '#fbf9f2', { name: 'strand', parent: 'cheese', piece: true })
      .rod([0.06, 0.03, -0.006], [0.1, 0.022, -0.035], 0.007, '#fbf9f2', { parent: 'cheese' })
      .rod([0.065, 0.036, 0], [0.105, 0.045, 0.004], 0.006, '#fbf9f2', { parent: 'cheese' })
      .act({ click: [[A.detach('strand', 'strand'), A.say('Peel!', 1)], [A.reattach('strand')]] })
      .done(),
  ),
  // A party strobe (25 cm) on a floor bracket: a black housing with a reflector and flash tube behind a clear lens (a
  // light) and cooling fins. Flash-flash-flash!
  e('strobe light', 'music', 'stage gear', () => {
    const b = m('strobe light', { edge: 'sharp' })
      .box([0.24, 0.02, 0.14], [0, 0.01, 0], { color: '#2a2726', round: 0.3 })
      .box([0.24, 0.14, 0.11], [0, 0.13, 0], { color: '#2a2726', round: 0.2, name: 'head' })
      .box([0.2, 0.09, 0.01], [0, 0.13, 0.058], { color: '#c9ccd1', parent: 'head' })
      .box([0.18, 0.02, 0.012], [0, 0.13, 0.062], { color: '#f2fbff', name: 'tube', parent: 'head', mover: { kind: 'light', on: false } })
      .cyl([0.03, 0.01, 0.03], [0.09, 0.07, 0.056], { color: '#5c6166', rot: [90, 0, 0], parent: 'head' });
    b.pair((s) => b.stick([s * 0.13, 0.02, 0], [s * 0.13, 0.14, 0], 0.025, '#5c6166'));
    b.each(5, (i) => b.box([0.2, 0.008, 0.02], [0, 0.09 + i * 0.02, -0.06], { color: '#3a3633', parent: 'head', noInk: true }));
    return b
      .act({ click: [A.operate('tube', 'on'), A.operate('tube', 'off'), A.operate('tube', 'on'), A.par(A.operate('tube', 'off'), A.say('Flash! Flash! Flash!', 1.4)), A.operate('tube', 'on'), A.operate('tube', 'off'), A.operate('tube', 'on'), A.operate('tube', 'off')] })
      .done();
  }),
  // A pushchair (1.05 m): an aluminium frame on four wheels, a padded seat (a teddy rides in it), a folding canopy
  // that pulls forward, a handlebar and a shopping basket underneath.
  e('stroller', 'home', 'baby things', () => {
    const b = m('stroller', { view: 'side' })
      .box([0.44, 0.08, 0.42], [0, 0.48, 0.05], { color: '#2f4f8f', round: 0.6 })
      .box([0.44, 0.4, 0.08], [0, 0.68, -0.18], { color: '#2f4f8f', rot: [-15, 0, 0], round: 0.6 })
      .box([0.36, 0.1, 0.3], [0, 0.18, -0.05], { color: '#2a2726', round: 0.3, edge: 'sharp' })
      .stick([-0.25, 1.02, -0.55], [0.25, 1.02, -0.55], 0.04, '#2a2726', { edge: 'sharp' })
      .dome([0.48, 0.42, 0.5], [0, 0.88, -0.18], { color: '#2f6fb0', rot: [-20, 0, 0], name: 'canopy', pivot: [0, 0.82, -0.2], mover: { kind: 'swing', axis: 'x', amount: 45 } });
    b.pair((s) => {
      b.rod([s * 0.23, 0.42, -0.25], [s * 0.24, 1.02, -0.55], 0.03, 'silver', { edge: 'sharp' });
      b.stick([s * 0.22, 0.45, 0.15], [s * 0.24, 0.16, 0.35], 0.025, 'silver', { edge: 'sharp' });
      b.stick([s * 0.22, 0.45, -0.2], [s * 0.24, 0.16, -0.38], 0.025, 'silver', { edge: 'sharp' });
      b.box([0.03, 0.03, 0.4], [s * 0.22, 0.58, 0.05], { color: '#2a2726', round: 0.4 });
      wheel(b, `wheelF${s > 0 ? 'L' : 'R'}`, s * 0.26, 0.35, 0.24, 0.05, { spokes: 0, rim: '#5c6166' });
      wheel(b, `wheelB${s > 0 ? 'L' : 'R'}`, s * 0.27, -0.38, 0.3, 0.06, { spokes: 0, rim: '#5c6166' });
    });
    return b
      .socket('seat', [0, 0.52, 0.02], 'seat')
      .act({
        setup: [A.spawn('bear', 'teddy bear'), A.attach('bear', 'self', 'seat')],
        click: [
          [A.operate('canopy', 'open'), A.par(A.anim('hop', 1, 'self.seat'), A.say('Peekaboo!', 1.4))],
          [A.operate('canopy', 'close'), A.say('Shhh... sleepy time.', 1.6)],
        ],
      })
      .done();
  }),
  // A steel strongbox safe (35 cm): a thick door on hinges with a combination dial that spins and a T handle, bolts on
  // the edge, a gold bar waiting inside.
  e('strongbox', 'home', 'safes', () =>
    m('strongbox', { edge: 'sharp' })
      .box([0.36, 0.32, 0.32], [0, 0.17, 0], { color: '#4a4f55', round: 0.12 })
      .box([0.37, 0.02, 0.33], [0, 0.01, 0], { color: '#2a2726', round: 0.3 })
      .box([0.3, 0.24, 0.02], [0, 0.17, 0.152], { color: '#1e1c1b' })
      .box([0.12, 0.04, 0.06], [0, 0.13, 0.1], { color: 'gold', round: 0.3 })
      .box([0.3, 0.26, 0.04], [0, 0.17, 0.175], { color: '#5c6166', round: 0.15, name: 'door', pivot: [-0.15, 0.17, 0.175], mover: { kind: 'swing', axis: 'y', amount: -100 } })
      .cyl([0.09, 0.02, 0.09], [0.03, 0.2, 0.2], { color: 'silver', rot: [90, 0, 0], parent: 'door', name: 'dial' })
      .box([0.008, 0.02, 0.006], [0.03, 0.235, 0.21], { color: '#2a2726', parent: 'dial' })
      .stick([0.03, 0.2, 0.2], [0.03, 0.2, 0.215], 0.02, '#2a2726', { parent: 'dial' })
      .box([0.08, 0.015, 0.02], [0.03, 0.11, 0.205], { color: 'silver', parent: 'door' })
      .stick([0.03, 0.11, 0.195], [0.03, 0.11, 0.21], 0.015, 'silver', { parent: 'door' })
      .cyl([0.02, 0.07, 0.02], [-0.16, 0.24, 0.17], { color: '#2a2726' })
      .cyl([0.02, 0.07, 0.02], [-0.16, 0.1, 0.17], { color: '#2a2726' })
      .act({ click: [[A.pose('dial', { rot: [0, 0, 270], dur: 0.6 }), A.pose('dial', { rot: [0, 0, 90], dur: 0.4 }), A.say('Click... click... clunk!', 1.5), A.operate('door', 'open'), A.effect('sparkle', { dur: 1.2 })], [A.operate('door', 'close'), A.pose('dial', { rot: [0, 0, 0], dur: 0.4 }), A.say('Clunk.', 1)]] })
      .done(),
  ),
  // An artist's studio corner (3 m room): plank floor, two walls with a tall window, an easel with a canvas, a paint
  // table with jars and a palette, a stool and a potted plant. A painting appears on the canvas.
  e('studio', 'places', 'rooms', () => {
    const b = m('studio', { edge: 'sharp' })
      .box([3.4, 0.1, 3.4], [0, 0.05, 0], { color: 'lightwood' })
      .box([3.4, 3.0, 0.2], [0, 1.5, -1.6], { color: '#f2e6cf' })
      .box([0.2, 3.0, 3.4], [-1.6, 1.5, 0], { color: '#f2e6cf' })
      .box([1.3, 1.9, 0.04], [0.75, 1.65, -1.48], { color: '#a9dcf2' })
      .box([0.06, 1.9, 0.06], [0.75, 1.65, -1.46], { color: 'white' })
      .box([1.3, 0.06, 0.06], [0.75, 1.65, -1.46], { color: 'white' })
      .box([1.45, 0.08, 0.15], [0.75, 0.66, -1.44], { color: 'white' })
      .label('STUDIO', [1.0, 0.25], [-0.6, 2.55, -1.49], { color: '#f2e6cf', depth: 0.01 })
      .box([0.8, 0.95, 0.03], [0.1, 1.3, 0.3], { color: '#f7f5ef', round: 0.1 })
      .box([0.76, 0.9, 0.01], [0.1, 1.3, 0.318], { color: '#7fb3d5', name: 'painting', scale: 0 })
      .ball([0.3, 0.3, 0.01], [0.25, 1.5, 0.326], { color: '#f6d24a', parent: 'painting', noInk: true })
      .ball([0.6, 0.25, 0.01], [0.05, 1.0, 0.326], { color: '#5aa553', parent: 'painting', noInk: true })
      .rod([0.1, 0.1, 0.55], [0.1, 1.85, 0.25], 0.04, 'wood')
      .rod([-0.25, 0.1, 0.5], [0.1, 1.75, 0.25], 0.04, 'wood')
      .rod([0.45, 0.1, 0.5], [0.1, 1.75, 0.25], 0.04, 'wood')
      .box([0.85, 0.04, 0.1], [0.1, 0.8, 0.32], { color: 'wood' })
      .box([0.9, 0.05, 0.6], [-1.0, 0.75, -0.9], { color: 'wood' })
      .cyl([0.08, 0.12, 0.08], [-1.2, 0.84, -0.9], { color: '#e0473b' })
      .cyl([0.08, 0.12, 0.08], [-1.05, 0.84, -1.0], { color: '#4e8fd6' })
      .cyl([0.25, 0.02, 0.18], [-0.85, 0.79, -0.8], { color: '#d8b07a' })
      .cyl([0.5, 0.05, 0.5], [0.9, 0.6, 0.7], { color: '#e0473b' })
      .stick([0.9, 0.1, 0.7], [0.9, 0.58, 0.7], 0.05, '#5c6166')
      .cyl([0.4, 0.4, 0.4], [-1.1, 0.3, 1.1], { color: '#c87a4a', taper: 0.85 })
      .ball([0.7, 0.9, 0.7], [-1.1, 1.0, 1.1], { color: '#5aa553', edge: 'soft' });
    b.pair((s) => b.stick([-0.95 + s * 0.4, 0.1, -0.9 + 0.25], [-0.95 + s * 0.4, 0.73, -0.9 + 0.25], 0.04, 'wood').stick([-0.95 + s * 0.4, 0.1, -0.9 - 0.25], [-0.95 + s * 0.4, 0.73, -0.9 - 0.25], 0.04, 'wood'));
    return b.act({ click: [[A.par(A.pose('painting', { scale: 1, dur: 1.5 }), A.effect('sparkle', { dur: 1.5 }))], [A.pose('painting', { scale: 0, dur: 0.6 })]] }).done();
  }),
  // A bowl of herby bread stuffing (18 cm), golden and crisp on top with celery and parsley. Steaming.
  e('stuffing', 'food', 'side dishes', () => {
    const b = m('stuffing')
      .cyl([0.1, 0.014, 0.1], [0, 0.007, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.12, 0.07, 0.12], [0, 0.045, 0], { color: 'white', taper: 1.5 })
      .cyl([0.17, 0.01, 0.17], [0, 0.078, 0], { color: '#9a6a3a' });
    for (const [x, z] of around(9, 0.055)) b.box([0.03, 0.025, 0.03], [x, 0.088, z], { color: x > 0 ? '#c08a4a' : '#d9a35f', rot: [x * 400, z * 300, 0], round: 0.4 });
    b.ball([0.05, 0.04, 0.05], [0, 0.095, 0], { color: '#c08a4a' })
      .box([0.015, 0.012, 0.02], [0.03, 0.1, 0.02], { color: '#9bbf5a', round: 0.3 })
      .ball([0.015, 0.008, 0.015], [-0.03, 0.1, 0.0], { color: '#3f7a3a', noInk: true })
      .ball([0.015, 0.008, 0.015], [0.01, 0.105, -0.03], { color: '#3f7a3a', noInk: true });
    return b.act({ click: [A.par(A.effect('steam', { dur: 2 }), A.anim('wobble'))] }).done();
  }),
  // An old oak stump used as a chopping block (45 cm): bark, a pale cut face with growth rings, roots gripping the
  // ground, a mushroom at its foot and an axe bitten into the top (a piece that comes out).
  e('stump', 'garden', 'trees', () => {
    const b = treeStump(m('stump'), 0, 0, 0.6, 0.45);
    b.ball([0.08, 0.04, 0.08], [0.3, 0.07, 0.22], { color: '#c0392b' })
      .stick([0.3, 0, 0.22], [0.3, 0.06, 0.22], 0.025, 'cream')
      .box([0.03, 0.12, 0.16], [0.05, 0.5, 0.02], { color: 'steel', round: 0.2, rot: [0, 20, -10], name: 'axe', parent: 'top', piece: true, edge: 'sharp' })
      .stick([0.07, 0.56, 0.0], [0.16, 0.95, -0.12], 0.035, 'lightwood', { parent: 'axe' });
    return b.act({ click: [[A.detach('axe', 'axe'), A.say('Thunk!', 1)], [A.reattach('axe'), A.effect('dust', { dur: 0.8 })]] }).done();
  }),
  // A cluster of three felled tree stumps (largest 45 cm) with roots and rings; mushrooms pop up on them after rain.
  e('stumps', 'garden', 'trees', () => {
    const b = m('stumps');
    treeStump(b, -0.35, 0, 0.5, 0.45, 'top1');
    treeStump(b, 0.3, 0.2, 0.38, 0.3, 'top2');
    treeStump(b, 0.2, -0.4, 0.3, 0.2, 'top3');
    b.each(3, (i) => {
      const [x, y, z] = ([[-0.45, 0.47, 0.1], [0.36, 0.32, 0.25], [0.15, 0.22, -0.35]] as V[])[i];
      b.cyl([0.015, 0.04, 0.015], [x, y + 0.02, z], { color: 'cream', name: `shroom${i}`, scale: 0 });
      b.dome([0.07, 0.035, 0.07], [x, y + 0.05, z], { color: i === 1 ? '#c0392b' : '#b5814e', parent: `shroom${i}`, scale: 0, name: `cap${i}` });
    });
    return b
      .act({
        click: [
          [A.effect('rain', { dur: 1.2 }), A.par(A.pose('shroom0', { scale: 1, dur: 0.5 }), A.pose('cap0', { scale: 1, dur: 0.5 }), A.pose('shroom1', { scale: 1, dur: 0.7 }), A.pose('cap1', { scale: 1, dur: 0.7 }), A.pose('shroom2', { scale: 1, dur: 0.9 }), A.pose('cap2', { scale: 1, dur: 0.9 })), A.say('Pop, pop, pop!', 1.4)],
          [A.par(A.pose('shroom0', { scale: 0, dur: 0.5 }), A.pose('cap0', { scale: 0, dur: 0.5 }), A.pose('shroom1', { scale: 0, dur: 0.5 }), A.pose('cap1', { scale: 0, dur: 0.5 }), A.pose('shroom2', { scale: 0, dur: 0.5 }), A.pose('cap2', { scale: 0, dur: 0.5 }))],
        ],
      })
      .done();
  }),
  // A handheld stun gun (16 cm, side view): yellow body, black rubber grip with a trigger guard, a safety switch and
  // two electrodes that arc blue when fired.
  e('stun gun', 'armory', 'sidearms', () =>
    m('stun gun', { view: 'side', edge: 'sharp' })
      .box([0.036, 0.05, 0.14], [0, 0.115, 0], { color: '#f6d24a', round: 0.35 })
      .box([0.03, 0.1, 0.04], [0, 0.055, -0.045], { color: '#2a2726', rot: [-15, 0, 0], round: 0.4, edge: 'soft' })
      .box([0.04, 0.052, 0.03], [0, 0.115, 0.08], { color: '#2a2726', round: 0.2 })
      .torus([0.045, 0.04, 0.008], [0, 0.08, 0.0], { color: '#2a2726', rot: [0, 90, 0], tube: 0.18 })
      .box([0.012, 0.02, 0.012], [0, 0.085, 0.0], { color: '#2a2726', name: 'trigger', mover: { kind: 'slide', axis: 'z', amount: -0.008 } })
      .box([0.012, 0.008, 0.02], [0, 0.142, -0.03], { color: '#e0473b' })
      .stick([0.01, 0.12, 0.095], [0.01, 0.12, 0.11], 0.005, 'silver')
      .stick([-0.01, 0.12, 0.095], [-0.01, 0.12, 0.11], 0.005, 'silver')
      .box([0.026, 0.012, 0.006], [0, 0.12, 0.113], { color: '#6fd3ff', name: 'arc', mover: { kind: 'light', on: false } })
      .act({ click: [A.operate('trigger', 'on'), A.operate('arc', 'on'), A.par(A.effect('sparkle', { dur: 1 }), A.anim('shake', 2), A.say('Bzzzzzt!', 1.4)), A.operate('arc', 'off'), A.operate('trigger', 'off')] })
      .done(),
  ),
  // A tablet stylus (15 cm) standing on its fine tip on a little drawing tablet: white pen with a clip and button. It
  // scribbles a doodle onto the screen.
  e('stylus', 'tech', 'accessories', () =>
    m('stylus', { edge: 'sharp' })
      .box([0.14, 0.008, 0.1], [0, 0.004, 0], { color: '#2a2726', round: 0.3 })
      .box([0.12, 0.002, 0.08], [0, 0.009, 0], { color: '#3a7bd5', name: 'screen', mover: { kind: 'light', on: true } })
      .torus([0.05, 0.035, 0.002], [0.02, 0.0105, 0.0], { color: '#f6d24a', rot: [90, 0, 0], tube: 0.1, name: 'doodle', scale: 0, noInk: true })
      .cyl([0.01, 0.13, 0.01], [-0.02, 0.08, 0.0], { color: '#f7f5ef', rot: [0, 0, -12], name: 'pen', pivot: [-0.007, 0.012, 0], edge: 'soft' })
      .cone([0.01, 0.012, 0.01], [-0.007, 0.016, 0], { color: '#9da3a8', rot: [180, 0, -12], parent: 'pen' })
      .box([0.003, 0.04, 0.006], [-0.028, 0.115, 0.006], { color: 'silver', rot: [0, 0, -12], parent: 'pen' })
      .box([0.004, 0.012, 0.004], [-0.012, 0.05, 0.005], { color: '#9da3a8', rot: [0, 0, -12], parent: 'pen' })
      .act({ click: [[A.pose('pen', { rot: [0, 0, 20], dur: 0.3 }), A.pose('pen', { rot: [0, 0, -15], dur: 0.3 }), A.par(A.pose('pen', { rot: [0, 0, 0], dur: 0.3 }), A.pose('doodle', { scale: 1, dur: 0.6 }), A.say('Scribble!', 1))], [A.pose('doodle', { scale: 0, dur: 0.3 })]] })
      .done(),
  ),
  // A submarine (60 m, the vocabulary's 12 m is far too small): a long rounded black hull, the sail (conning tower)
  // with its dive planes, a periscope that rises, hatches, the cross-shaped tail fins and a propeller that turns.
  e('submarine (boat)', 'garage', 'boats', () => {
    const c = '#2f3a44';
    const b = m('submarine (boat)', { view: 'side', edge: 'sharp' })
      .loft([7.6, 7.6, 60], [0, 4.0, 0], [[0, 0.1, 0.1], [0.06, 0.45, 0.45], [0.2, 0.92, 0.92], [0.35, 1, 1], [0.85, 1, 1], [0.95, 0.85, 0.85], [1, 0.25, 0.25]], { color: c, name: 'hull', edge: 'soft' })
      .loft([7.7, 1.2, 50], [0, 1.0, 1.0], [[0, 0.4, 1], [0.2, 0.95, 1], [0.85, 1, 1], [1, 0.5, 1]], { color: '#7a1f1f', cut: 'bottom', parent: 'hull', edge: 'soft' })
      .loft([2.4, 6.0, 9.0], [0, 9.6, 12.0], [[0, 0.5, 0.95], [0.25, 1, 1], [0.8, 1, 1], [1, 0.4, 0.9]], { color: c, boxy: 0.6, parent: 'hull' })
      .box([9.0, 0.35, 2.6], [0, 10.8, 13.0], { color: c, round: 0.4, parent: 'hull' })
      .stick([0, 12.4, 13.5], [0, 15.0, 13.5], 0.3, '#5c6166', { name: 'periscope', mover: { kind: 'slide', axis: 'y', amount: 2.2 } })
      .box([0.4, 0.4, 0.7], [0, 15.1, 13.7], { color: '#5c6166', parent: 'periscope' })
      .stick([0.6, 12.4, 11.5], [0.6, 13.8, 11.5], 0.2, '#5c6166')
      .box([0.2, 4.8, 3.0], [0, 4.0, -27.5], { color: c, round: 0.3 })
      .box([7.0, 0.25, 3.0], [0, 4.0, -27.5], { color: c, round: 0.3 })
      .cyl([1.2, 0.8, 1.2], [0, 4.0, -29.8], { color: '#5c6166', rot: [90, 0, 0], name: 'propeller', mover: { kind: 'spin', axis: 'z', amount: 300 } })
      .cyl([1.4, 0.4, 1.4], [0, 7.4, 4.0], { color: '#3a4550' })
      .cyl([1.4, 0.4, 1.4], [0, 7.4, -14.0], { color: '#3a4550' })
      .label('S-60', [3.0, 1.0], [3.75, 4.6, 22.0], { color: c, rot: [0, 90, 0], depth: 0.05 })
      .label('S-60', [3.0, 1.0], [-3.75, 4.6, 22.0], { color: c, rot: [0, -90, 0], depth: 0.05 });
    b.each(5, (i) => b.box([0.5, 3.0, 0.15], [0, 4.0, -29.8], { color: 'brass', rot: [0, 0, i * 72], parent: 'propeller' }));
    b.pair((s) => b.box([0.12, 0.3, 4.0], [s * 1.3, 11.6, 12.5], { color: '#3d5a73' }));
    return b
      .act({
        click: [
          [A.operate('periscope', 'up'), A.say('Ping... ping...', 1.8), A.wait(1.8), A.operate('periscope', 'down')],
          [A.operate('propeller', 'on'), A.par(A.effect('water_spray', { dur: 2.5 }), A.say('Whum, whum, whum...', 2)), A.wait(1), A.operate('propeller', 'off')],
        ],
      })
      .done();
  }),
  // A subway entrance (4 m): green iron railings round a stair going down, two globe lamp posts (lights) and an
  // arched SUBWAY sign. A train rumbles below.
  e('subway', 'places', 'stations', () => {
    const g = '#2f6a3a';
    const b = m('subway', { edge: 'sharp' })
      .box([3.4, 0.2, 4.4], [0, 0.1, 0], { color: '#9da3a8' })
      .box([2.0, 0.02, 3.6], [0, 0.205, 0.2], { color: '#2a2726' })
      .arc([2.4, 1.2, 0.12], [0, 2.4, -1.65], { color: g, tube: 0.12 })
      .box([2.2, 0.55, 0.12], [0, 2.75, -1.65], { color: g, round: 0.2 })
      .label('SUBWAY', [1.8, 0.4], [0, 2.75, -1.58], { color: g, depth: 0.03 });
    b.each(8, (i) => b.box([1.9, 0.04, 0.42], [0, 0.18 - i * 0.015, 1.6 - i * 0.45], { color: '#5c6166', noInk: true }));
    b.pair((s) => {
      b.stick([s * 1.1, 0.2, -1.65], [s * 1.1, 1.15, -1.65], 0.06, g);
      b.stick([s * 1.1, 1.15, -1.65], [s * 1.1, 1.15, 2.0], 0.06, g);
      b.stick([s * 1.1, 0.2, 2.0], [s * 1.1, 1.15, 2.0], 0.06, g);
      b.each(9, (i) => b.stick([s * 1.1, 0.2, -1.4 + i * 0.4], [s * 1.1, 1.1, -1.4 + i * 0.4], 0.025, g));
      b.stick([s * 1.3, 0.2, -1.65], [s * 1.3, 2.3, -1.65], 0.1, g);
      b.ball(0.35, [s * 1.3, 2.45, -1.65], { color: '#b8f0a8', name: `globe${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: false } });
    });
    b.stick([-1.1, 1.15, 2.0], [1.1, 1.15, 2.0], 0.06, g);
    return b.act({ click: [A.operate('globes', 'on'), A.par(A.anim('shake', 3), A.effect('dust', { dur: 2 }), A.say('Rumble, rumble, rumble...', 2.2)), A.wait(1), A.operate('globes', 'off')] }).done();
  }),
  // One subway car (18 m long, 3.6 m high): brushed steel with a blue stripe, a row of windows, three pairs of
  // sliding doors each side (they part), gangway ends, bogies with wheels, pantograph-free third-rail shoes.
  e('subway car', 'garage', 'trains', () => {
    const b = m('subway car', { view: 'side', edge: 'sharp' });
    metroCar(b, 0, 18, 'A', null);
    return b.act({ click: [A.operate('doors', 'open'), A.say('Ding-dong! Mind the gap.', 2), A.wait(2), A.operate('doors', 'close'), A.say('Ding-dong.', 1)] }).done();
  }),
  // A two-car subway train (37 m): rounded driving cabs at both ends with a big windscreen, headlights (lights) and a
  // route sign; the same sliding doors and blue stripe along its length.
  e('subway train', 'garage', 'trains', () => {
    const b = m('subway train', { view: 'side', edge: 'sharp' });
    metroCar(b, 9.3, 18, 'A', 'front');
    metroCar(b, -9.3, 18, 'B', 'back');
    b.box([2.4, 3.0, 0.7], [0, 2.0, 0], { color: '#2a2726', round: 0.2 });
    return b
      .act({
        click: [
          [A.par(A.operate('headlights', 'on'), A.say('Hooooonk!', 1.6), A.anim('shake', 2)), A.wait(1.2), A.operate('headlights', 'off')],
          [A.operate('doors', 'open'), A.say('Stand clear of the closing doors!', 2.2), A.wait(1.6), A.operate('doors', 'close')],
        ],
      })
      .done();
  }),
  // A rubber suction cup (5 cm) with a hook, stuck to a square of bathroom tile. It pops off (a piece) and back.
  e('suction cup', 'home', 'household', () =>
    m('suction cup')
      .box([0.12, 0.12, 0.01], [0, 0.06, -0.01], { color: '#d6f0fa', round: 0.2, name: 'tile', edge: 'sharp' })
      .cyl([0.055, 0.016, 0.055], [0, 0.06, 0.003], { color: '#f0923b', rot: [-90, 0, 0], taper: 0.4, name: 'cup', parent: 'tile', piece: true })
      .cyl([0.014, 0.022, 0.014], [0, 0.06, 0.02], { color: '#f0923b', rot: [90, 0, 0], parent: 'cup' })
      .arc([0.03, 0.03, 0.005], [0, 0.05, 0.034], { color: 'silver', rot: [0, 0, 180], arc: 220, tube: 0.18, parent: 'cup' })
      .act({ click: [[A.detach('cup', 'cup'), A.say('Pop!', 1)], [A.reattach('cup'), A.say('Thwup.', 1)]] })
      .done(),
  ),
  // A 1 kg paper bag of white sugar (19 cm), its top rolled down, a little scoop and a spill of crystals beside it.
  e('sugar', 'food', 'baking', () =>
    m('sugar')
      .box([0.11, 0.16, 0.07], [0, 0.08, 0], { color: 'paper', round: 0.15, name: 'bag', pivot: [0.055, 0, 0] })
      .box([0.11, 0.025, 0.074], [0, 0.17, 0], { color: '#efe8d8', round: 0.4, parent: 'bag' })
      .label('SUGAR', [0.09, 0.03], [0, 0.1, 0.0362], { color: '#4e8fd6', parent: 'bag', depth: 0.002 })
      .box([0.09, 0.03, 0.002], [0, 0.05, 0.0362], { color: '#4e8fd6', parent: 'bag', noInk: true })
      .ball([0.08, 0.02, 0.06], [0.09, 0.008, 0.05], { color: 'white' })
      .cyl([0.04, 0.025, 0.04], [-0.09, 0.0125, 0.05], { color: 'silver', edge: 'sharp' })
      .ball([0.034, 0.014, 0.034], [-0.09, 0.027, 0.05], { color: 'white' })
      .act({ click: [A.pose('bag', { rot: [0, 0, -40], dur: 0.5 }), A.par(A.effect('sparkle', { dur: 1.2 }), A.say('Shhhhh...', 1.2)), A.pose('bag', { rot: [0, 0, 0], dur: 0.4 })] })
      .done(),
  ),
  // Three sugar cubes (1.6 cm each) stacked on a saucer; the top one comes off.
  e('sugar cube', 'food', 'baking', () =>
    m('sugar cube')
      .cyl([0.08, 0.008, 0.08], [0, 0.004, 0], { color: 'white', edge: 'sharp', name: 'saucer' })
      .box(0.016, [-0.009, 0.016, 0], { color: 'white', round: 0.15, edge: 'sharp' })
      .box(0.016, [0.009, 0.016, 0.003], { color: '#f7f5ef', round: 0.15, edge: 'sharp' })
      .box(0.016, [0, 0.032, 0.001], { color: 'white', round: 0.15, rot: [0, 15, 0], edge: 'sharp', name: 'cube', parent: 'saucer', piece: true })
      .act({ click: [[A.detach('cube', 'cube'), A.say('Plop!', 1)], [A.reattach('cube')]] })
      .done(),
  ),
  // A person in full plate armour: helmet, breastplate, sword and a red shield. Bows: at your service; points the way:
  // onward.
  e('suit of armor (clothes)', 'armory', 'armour', () =>
    withAct(who('suit of armor (clothes)', { h: 1.8, top: 'steel', bottom: 'steel', shoes: 'iron', long: true, style: 'none', build: 1.15, acc: [hat('helmet', 'steel'), wear('armor', 'silver'), held('sword'), held('shield', '#c0392b', 'L')] }), {
      click: [
        [A.par(A.anim('bow'), A.say('At your service, my liege!', 2))],
        [A.par(A.anim('point'), A.say('Onward, for the realm!', 1.8))],
      ],
    }),
  ),
  // A decorative suit of armour on its stand (1.9 m): helmet with a visor that lifts, a plume, gorget, breastplate,
  // pauldrons, gauntlets, a mail skirt, greaves and sabatons, a halberd in its hand.
  e('suit of armor (decor)', 'home', 'decor', () => {
    const st = '#c9ccd1', dk = '#8f99a3';
    const b = m('suit of armor (decor)', { edge: 'sharp' })
      .box([0.7, 0.12, 0.5], [0, 0.06, 0], { color: 'darkwood', round: 0.2 })
      .loft([0.46, 0.3, 0.55], [0, 1.25, 0], [[0, 0.75, 0.8], [0.4, 0.85, 0.9], [0.8, 1, 1], [1, 0.75, 0.75]], { color: st, rot: [-90, 0, 0], name: 'body', edge: 'soft' })
      .stick([0, 1.0, 0.14], [0, 1.5, 0.15], 0.02, dk, { parent: 'body' })
      .cyl([0.36, 0.2, 0.26], [0, 0.88, 0], { color: '#9aa3ac', taper: 0.9, edge: 'soft' })
      .cyl([0.16, 0.08, 0.16], [0, 1.55, 0], { color: dk })
      .ball([0.25, 0.3, 0.28], [0, 1.72, 0], { color: st, name: 'helm', edge: 'soft' })
      .box([0.2, 0.12, 0.08], [0, 1.72, 0.12], { color: dk, round: 0.6, name: 'visor', parent: 'helm', pivot: [0, 1.78, 0.04], mover: { kind: 'swing', axis: 'x', amount: -70 } })
      .box([0.16, 0.015, 0.02], [0, 1.73, 0.165], { color: '#1e1c1b', parent: 'visor', noInk: true })
      .cone([0.07, 0.24, 0.07], [0, 1.95, -0.04], { color: '#c0392b', parent: 'helm', edge: 'soft' })
      .stick([0.42, 0.12, 0.08], [0.42, 2.15, 0.08], 0.035, 'darkwood')
      .ball([0.04, 0.24, 0.22], [0.42, 1.95, 0.16], { color: 'steel' })
      .cone([0.05, 0.16, 0.05], [0.42, 2.22, 0.08], { color: 'steel' });
    b.pair((s) => {
      b.capsule([0.14, 0.72, 0.15], [s * 0.11, 0.5, 0], { color: st, edge: 'soft' });
      b.ball(0.12, [s * 0.11, 0.5, 0.04], { color: dk });
      b.box([0.13, 0.07, 0.25], [s * 0.11, 0.155, 0.04], { color: dk, round: 0.4 });
      b.ball([0.22, 0.14, 0.24], [s * 0.27, 1.45, 0], { color: st, edge: 'soft' });
      b.capsule([0.1, 0.5, 0.1], [s * 0.31, 1.15, 0.02], { color: st, edge: 'soft' });
      b.ball(0.11, [s * 0.33, 0.86, 0.05], { color: dk });
    });
    return b.act({ click: [[A.operate('visor', 'open'), A.par(A.anim('shake'), A.say('Clank... creeeak.', 1.6))], [A.operate('visor', 'close'), A.say('Clunk.', 1)]] }).done();
  }),
  // A hard-shell spinner suitcase (68 cm): ribbed teal shell, a telescoping handle that pulls up, a carry handle,
  // four spinner wheels, a luggage tag and travel stickers.
  e('suitcase', 'wardrobe', 'bags', () => {
    const b = m('suitcase', { edge: 'sharp' })
      .box([0.45, 0.6, 0.27], [0, 0.36, 0], { color: '#3fa7a0', round: 0.18 })
      .box([0.46, 0.012, 0.275], [0, 0.36, 0], { color: '#2a2726', noInk: true })
      .box([0.12, 0.03, 0.04], [0, 0.4, 0.14], { color: '#2a2726', round: 0.5 })
      .box([0.14, 0.035, 0.03], [0, 0.675, -0.05], { color: '#2a2726', name: 'handle', mover: { kind: 'slide', axis: 'y', amount: 0.38 } })
      .box([0.1, 0.07, 0.004], [-0.1, 0.48, 0.137], { color: '#f6d24a', round: 0.3, noInk: true })
      .box([0.08, 0.09, 0.004], [0.12, 0.25, 0.137], { color: '#f4a1c0', rot: [0, 0, 15], round: 0.3, noInk: true })
      .box([0.05, 0.07, 0.006], [0.2, 0.6, 0.0], { color: '#f7f5ef', rot: [0, 0, -15], round: 0.2 });
    b.pair((s) => {
      b.stick([s * 0.06, 0.66, -0.05], [s * 0.06, 0.4, -0.05], 0.018, 'silver', { parent: 'handle' });
      b.each(3, (i) => b.box([0.012, 0.5, 0.006], [s * (0.07 + i * 0.05), 0.36, 0.136], { color: '#358f89', noInk: true }));
      for (const z of [0.1, -0.1]) b.ball(0.05, [s * 0.18, 0.03, z], { color: '#2a2726', name: `wheel${s > 0 ? 'L' : 'R'}${z > 0 ? 'F' : 'B'}`, edge: 'soft' });
    });
    return b.act({ click: [[A.operate('handle', 'up'), A.say('Clack-clack!', 1.2)], [A.operate('handle', 'down'), A.anim('wobble'), A.say('Click.', 1)]] }).done();
  }),
  // Native sulphur (12 cm): bright yellow crystals bristling from a grey rock. It whiffs of rotten eggs.
  e('sulfur', 'nature', 'minerals', () => {
    const b = m('sulfur').ball([0.14, 0.05, 0.11], [0, 0.02, 0], { color: 'rock' });
    const xs: Array<[number, number, number, number]> = [[0, 0, 0, 0.09], [0.03, 0.02, -25, 0.07], [-0.03, -0.01, 20, 0.07], [0.01, 0.03, -10, 0.06], [-0.02, 0.025, 30, 0.05], [0.04, -0.02, -40, 0.05]];
    for (const [x, z, r, h] of xs) b.cyl([0.03, h, 0.03], [x + Math.sin(-r * D) * h * 0.5, 0.04 + Math.cos(r * D) * h * 0.5, z], { color: '#f6e03a', taper: 0.3, segs: 6, rot: [0, 0, r], edge: 'sharp' });
    return b.act({ click: [A.par(A.effect('smoke', { dur: 1.5 }), A.anim('wobble'), A.say('Pfff... phew!', 1.4))] }).done();
  }),
  // A garden sundial (1 m) on a stone pedestal: a bronze dial with hour marks and Roman numerals, a triangular gnomon,
  // and the shadow it casts, which moves round as the sun goes over.
  e('sundial', 'garden', 'garden decor', () => {
    const b = m('sundial')
      .cyl([0.42, 0.1, 0.42], [0, 0.05, 0], { color: 'stone', segs: 8, edge: 'sharp' })
      .cyl([0.2, 0.7, 0.2], [0, 0.45, 0], { color: 'stone', taper: 0.85 })
      .torus([0.26, 0.26, 0.05], [0, 0.22, 0], { color: '#9a9a92', rot: [90, 0, 0], tube: 0.2 })
      .cyl([0.46, 0.06, 0.46], [0, 0.83, 0], { color: 'stone', segs: 8, edge: 'sharp' })
      .cyl([0.38, 0.012, 0.38], [0, 0.866, 0], { color: 'bronze', edge: 'sharp' })
      .wedge([0.16, 0.11, 0.012], [0, 0.925, -0.03], { color: '#8a6a3a', rot: [0, 90, 0], apex: -0.5, edge: 'sharp' })
      .box([0.012, 0.002, 0.16], [0, 0.873, 0.06], { color: '#3a2a1a', rot: [0, 30, 0], name: 'shadow', pivot: [0, 0.873, -0.02], noInk: true });
    b.each(9, (i) => {
      const a = ((i - 4) * 20 * Math.PI) / 180;
      b.box([0.01, 0.004, 0.035], [Math.sin(a) * 0.15, 0.873, Math.cos(a) * 0.15], { color: '#3a2a1a', rot: [0, a / D, 0], noInk: true, edge: 'sharp' });
    });
    return b.act({ click: [A.par(A.pose('shadow', { rot: [0, -60, 0], dur: 2 }), A.effect('sparkle', { dur: 2 })), A.say('Tick... tock...', 1.4), A.pose('shadow', { rot: [0, 0, 0], dur: 1 })] }).done();
  }),
  // A giant sunflower (2.5 m): a thick hairy stalk with big heart-shaped leaves, the heavy head of seeds ringed with
  // golden petals. It turns to the sun, and a bee visits.
  e('sunflower', 'garden', 'flowers', () => {
    const b = m('sunflower')
      .cyl([0.07, 2.3, 0.07], [0, 1.15, 0], { color: '#5a8f3a', taper: 0.7 })
      .rod([0, 2.25, 0], [0, 2.42, 0.08], 0.05, '#5a8f3a')
      .cyl([0.48, 0.12, 0.48], [0, 2.5, 0.14], { color: '#5a3a22', rot: [80, 0, 0], name: 'head', pivot: [0, 2.42, 0.06] })
      .cyl([0.36, 0.02, 0.36], [0, 2.51, 0.2], { color: '#3a2412', rot: [80, 0, 0], parent: 'head', noInk: true });
    b.each(16, (i) => {
      const a = (i * 2 * Math.PI) / 16;
      b.ball([0.11, 0.26, 0.03], [Math.sin(a) * 0.34, 2.5 + Math.cos(a) * 0.34 * Math.cos(10 * D), 0.14 + Math.cos(a) * 0.34 * -Math.sin(10 * D) + 0.03], { color: i % 2 ? '#f6d24a' : '#e8b33a', rot: [-10, 0, -a / D], parent: 'head' });
    });
    b.pair((s) => {
      b.ball([0.4, 0.04, 0.26], [s * 0.22, 1.0, 0.02], { color: 'leaf', rot: [0, 0, s * 25] });
      b.ball([0.32, 0.04, 0.22], [s * 0.18, 1.6, 0.04], { color: 'leaf', rot: [0, 0, s * 30] });
      b.ball([0.24, 0.035, 0.17], [-s * 0.14, 2.0, 0.0], { color: 'leaf', rot: [0, 0, -s * 30] });
    });
    return b
      .act({ click: [[A.pose('head', { rot: [0, 35, 0], dur: 1.5 }), A.spawn('bee', 'bee', { rel: 'near', of: 'self', dist: 'close', height: 'high' }), A.say('Bzzzz...', 1.6, 'bee'), A.wait(1), A.remove('bee', 'fly_away')], [A.pose('head', { rot: [0, -25, 0], dur: 1.5 }), A.effect('sparkle', { dur: 1 }), A.pose('head', { rot: [0, 0, 0], dur: 1 })]] })
      .done();
  }),
  // Sunflower seeds at their real size (1.5 cm; the vocabulary's 10 cm is far too big): three striped black-and-white seeds and one shelled grey kernel. One
  // cracks open.
  e('sunflower seed', 'food', 'nuts and seeds', () => {
    const b = m('sunflower seed').cyl([0.06, 0.004, 0.05], [0, 0.002, 0], { color: '#efe8d8', edge: 'sharp', name: 'dish' });
    const seeds: Array<[number, number, number]> = [[-0.012, 0.0, 20], [0.01, 0.01, -30], [0.0, -0.014, 80]];
    seeds.forEach(([x, z, r], i) => {
      const n = i === 0 ? 'seed' : `seed${i}`;
      b.ball([0.007, 0.004, 0.015], [x, 0.007, z], { color: '#2a2726', rot: [0, r, 0], name: n, ...(i === 0 ? { parent: 'dish', piece: true } : {}) });
      b.box([0.0012, 0.0045, 0.013], [x, 0.007, z], { color: 'white', rot: [0, r, 0], parent: n, noInk: true });
    });
    b.ball([0.005, 0.003, 0.01], [0.016, 0.006, -0.008], { color: '#b9b4a8', rot: [0, 50, 0] });
    return b.act({ click: [[A.detach('seed', 'seed'), A.say('Crack!', 1)], [A.reattach('seed')]] }).done();
  }),
  // A pair of aviator sunglasses (14 cm) standing on their folded-out arms: gold wire frame, teardrop green-grey
  // lenses, nose pads. The arms fold in and out.
  e('sunglasses', 'wardrobe', 'eyewear', () => {
    const b = m('sunglasses', { edge: 'sharp' })
      .stick([-0.016, 0.052, 0.0], [0.016, 0.052, 0.0], 0.003, 'gold')
      .stick([-0.02, 0.06, 0.0], [0.02, 0.06, 0.0], 0.0025, 'gold');
    b.pair((s) => {
      b.ball([0.054, 0.046, 0.006], [s * 0.035, 0.038, 0.002], { color: '#3a4a3a', rot: [0, 0, s * 10] });
      b.torus([0.058, 0.05, 0.004], [s * 0.035, 0.038, 0.0], { color: 'gold', rot: [0, 0, s * 10], tube: 0.06 });
      b.ball(0.006, [s * 0.008, 0.035, 0.008], { color: '#d6f0fa' });
      const n = s > 0 ? 'armL' : 'armR';
      b.stick([s * 0.064, 0.05, -0.002], [s * 0.066, 0.046, -0.13], 0.003, 'gold', { name: n, pivot: [s * 0.064, 0.05, -0.002], mover: { kind: 'swing', axis: 'y', amount: s * 80 } });
      b.stick([s * 0.066, 0.046, -0.13], [s * 0.066, 0.002, -0.15], 0.004, '#2a2726', { parent: n });
    });
    return b.act({ click: [[A.operate('arms', 'close'), A.say('Click.', 1)], [A.operate('arms', 'open'), A.effect('sparkle', { dur: 0.8 })]] }).done();
  }),
  // A squeeze bottle of SPF 50 sun cream (17 cm) standing on its flip cap: orange with a sun on the label. The cap
  // flips open and out comes a splurt.
  e('sunscreen', 'sports', 'beach gear', () =>
    m('sunscreen')
      .cyl([0.05, 0.03, 0.035], [0, 0.015, 0], { color: 'white', name: 'base', edge: 'sharp' })
      .box([0.06, 0.12, 0.04], [0, 0.09, 0], { color: '#f0923b', round: 0.6 })
      .ball([0.06, 0.03, 0.04], [0, 0.152, 0], { color: '#f0923b' })
      .label('SPF 50', [0.044, 0.018], [0, 0.07, 0.0205], { color: 'white', depth: 0.002 })
      .ball([0.026, 0.026, 0.004], [0, 0.11, 0.0205], { color: '#f6d24a', noInk: true })
      .box([0.03, 0.006, 0.03], [0, 0.032, 0.0], { color: '#efece4', name: 'flip', parent: 'base', pivot: [0, 0.03, -0.015], mover: { kind: 'swing', axis: 'x', amount: 110 } })
      .act({ click: [A.operate('flip', 'open'), A.par(A.anim('pulse'), A.effect('water_spray', { dur: 0.6 }), A.say('Splurt!', 1)), A.operate('flip', 'close')] })
      .done(),
  ),
  // A supercomputer (2 m racks): a row of four black cabinets with coloured door panels, banks of blinking status
  // lights, cooling vents and a cable tray overhead. It crunches numbers.
  e('supercomputer', 'tech', 'computers', () => {
    const b = m('supercomputer', { edge: 'sharp' }).box([2.8, 0.15, 1.2], [0, 2.12, -0.1], { color: '#5c6166', round: 0.1 });
    b.each(4, (k) => {
      const x = (k - 1.5) * 0.66;
      b.box([0.62, 2.0, 1.1], [x, 1.0, 0], { color: '#1e1c1b', round: 0.04 });
      b.box([0.52, 1.6, 0.02], [x, 1.05, 0.555], { color: ['#2f4f8f', '#c0392b', '#2f4f8f', '#3f7a3a'][k], round: 0.2 });
      b.each(3, (r) => b.box([0.4, 0.02, 0.01], [x, 0.18 + r * 0.04, 0.556], { color: '#3a3633', noInk: true }));
      b.each(6, (i) => b.ball(0.035, [x + (i % 2 ? 0.1 : -0.1), 1.6 - Math.floor(i / 2) * 0.22, 0.57], { color: ['#9be34d', '#f6d24a', '#6fd3e8'][(i + k) % 3], name: `led${k}${i}`, mover: { kind: 'light', on: (i + k) % 2 === 0 } }));
    });
    b.label('HAL-9', [0.5, 0.1], [-0.99, 1.95, 0.56], { color: '#1e1c1b', depth: 0.005 });
    return b.act({ click: [A.operate('leds'), A.par(A.say('Beep-boop... 42!', 2), A.anim('pulse')), A.operate('leds'), A.wait(0.4), A.operate('leds')] }).done();
  }),
  // A person in a superhero costume: blue suit with a red cape, mask, gold belt and chest emblem. Hands on hips:
  // "Never fear!"; arms up: "Up, up and away!"
  e('superhero costume', 'wardrobe', 'costumes', () =>
    withAct(who('superhero costume', { top: '#2f6fd6', bottom: '#2f6fd6', shoes: '#c0392b', long: true, pose: 'hips', acc: [wear('cape', '#c0392b'), face('mask', '#2a2726'), wear('belt', 'gold'), wear('badge', '#f6d24a')] }), {
      click: [
        [A.par(A.anim('hands_on_hips'), A.say('Never fear, I am here!', 2))],
        [A.par(A.anim('arms_up'), A.anim('hop'), A.say('Up, up and away!', 2))],
      ],
    }),
  ),
  // A longboard surfboard (2.5 m) standing in a heap of sand: rounded nose, stringer, colour stripes, a fin and a
  // coiled leash. It rides a wave.
  e('surfboard', 'sports', 'water sports', () =>
    m('surfboard')
      .ball([0.8, 0.26, 0.6], [0, 0.07, 0], { color: 'sand' })
      .capsule([0.55, 2.5, 0.07], [0, 1.3, 0], { color: '#6fd3e8', name: 'board', pivot: [0, 0.1, 0] })
      .box([0.016, 2.3, 0.006], [0, 1.3, 0.035], { color: '#8c5a2b', parent: 'board', noInk: true })
      .box([0.52, 0.14, 0.006], [0, 1.9, 0.034], { color: '#f0923b', round: 0.5, parent: 'board', noInk: true })
      .box([0.5, 0.06, 0.006], [0, 1.75, 0.034], { color: '#f6d24a', round: 0.5, parent: 'board', noInk: true })
      .box([0.02, 0.2, 0.16], [0, 0.4, -0.11], { color: '#2a2726', parent: 'board', edge: 'sharp' })
      .torus([0.18, 0.18, 0.012], [0.12, 0.2, 0.06], { color: '#2a2726', rot: [70, 0, 0], tube: 0.08 })
      .act({ click: [A.pose('board', { rot: [20, 0, 15], dur: 0.6 }), A.par(A.effect('water_spray', { dur: 1.5 }), A.say('Whoosh... splash!', 1.6)), A.pose('board', { rot: [0, 0, 0], dur: 0.6 })] })
      .done(),
  ),
  // A six-way surge protector (36 cm): a white strip of sockets, a rocker switch that glows red when on, the cord
  // and its plug.
  e('surge protector', 'tech', 'cables', () => {
    const b = m('surge protector', { edge: 'sharp' })
      .box([0.36, 0.045, 0.07], [0, 0.0225, 0], { color: '#f2f2ee', round: 0.3 })
      .box([0.03, 0.012, 0.03], [0.15, 0.05, 0], { color: '#e0302a', name: 'switch', mover: { kind: 'light', on: false } })
      .rod([-0.18, 0.02, 0], [-0.26, 0.012, 0.05], 0.012, '#f2f2ee', { edge: 'soft' })
      .rod([-0.26, 0.012, 0.05], [-0.33, 0.012, 0.1], 0.012, '#f2f2ee', { edge: 'soft' })
      .box([0.04, 0.03, 0.045], [-0.35, 0.015, 0.12], { color: '#f2f2ee', round: 0.3 })
      .box([0.004, 0.012, 0.02], [-0.345, 0.015, 0.145], { color: 'brass' })
      .box([0.004, 0.012, 0.02], [-0.355, 0.015, 0.145], { color: 'brass' });
    b.each(5, (i) => {
      const x = -0.13 + i * 0.055;
      b.box([0.036, 0.004, 0.036], [x, 0.046, 0], { color: '#d4d7da', round: 0.3 });
      b.box([0.004, 0.003, 0.01], [x - 0.007, 0.0485, 0], { color: '#2a2726', noInk: true }).box([0.004, 0.003, 0.01], [x + 0.007, 0.0485, 0], { color: '#2a2726', noInk: true });
    });
    return b.act({ click: [[A.operate('switch', 'on'), A.say('Click.', 1)], [A.operate('switch', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // A pleated blue surgical mask (17 cm) hanging on a little stand by its ear loops, the nose wire along the top.
  e('surgical mask', 'clinic', 'medical', () => {
    const b = m('surgical mask')
      .box([0.1, 0.012, 0.06], [0, 0.006, 0], { color: '#5c6166', round: 0.3, edge: 'sharp' })
      .stick([0, 0.01, -0.02], [0, 0.2, -0.02], 0.006, 'silver', { edge: 'sharp' })
      .box([0.17, 0.1, 0.02], [0, 0.13, 0], { color: '#8cc4ea', round: 0.5, name: 'mask', pivot: [0, 0.2, 0] })
      .box([0.08, 0.005, 0.006], [0, 0.174, 0.011], { color: 'white', parent: 'mask', noInk: true });
    b.each(3, (i) => b.box([0.16, 0.004, 0.004], [0, 0.105 + i * 0.022, 0.011], { color: '#6aaedc', parent: 'mask', noInk: true }));
    b.pair((s) => b.torus([0.06, 0.08, 0.004], [s * 0.095, 0.14, -0.005], { color: 'white', rot: [0, 75, 0], tube: 0.12, parent: 'mask' }));
    return b.act({ click: [A.par(A.pose('mask', { scale: 1.08, dur: 0.15 }), A.say('Achoo!', 1)), A.pose('mask', { scale: 1, dur: 0.2 }), A.effect('sparkle', { dur: 0.8 })] }).done();
  }),
  // A survival knife (30 cm) driven point-first into a log: a broad clip-point blade with a sawback spine, a steel
  // guard, a cord-wrapped grip and a compass in the pommel. It pulls out (a piece) and goes back.
  e('survival knife', 'armory', 'knives', () => {
    const b = m('survival knife', { edge: 'sharp' })
      .cyl([0.16, 0.12, 0.16], [0, 0.06, 0], { color: 'bark', rot: [0, 0, 90], name: 'log', edge: 'soft' })
      .cyl([0.12, 0.004, 0.12], [0.06, 0.06, 0], { color: '#e0c28a', rot: [0, 0, 90], parent: 'log' })
      .box([0.04, 0.16, 0.006], [0, 0.18, 0], { color: 'steel', name: 'knife', parent: 'log', piece: true })
      .box([0.002, 0.15, 0.007], [0.019, 0.18, 0], { color: 'silver', parent: 'knife' })
      .box([0.075, 0.012, 0.024], [0, 0.265, 0], { color: '#5c6166', parent: 'knife', round: 0.3 })
      .cyl([0.03, 0.11, 0.026], [0, 0.325, 0], { color: '#3a4a2a', parent: 'knife', edge: 'soft' })
      .cyl([0.036, 0.016, 0.032], [0, 0.388, 0], { color: '#5c6166', parent: 'knife' })
      .cyl([0.022, 0.004, 0.022], [0, 0.397, 0], { color: '#f7f5ef', parent: 'knife' });
    b.each(4, (i) => b.cone([0.009, 0.012, 0.006], [-0.022, 0.2 + i * 0.016, 0], { color: 'steel', rot: [0, 0, 90], parent: 'knife' }));
    b.each(5, (i) => b.box([0.033, 0.004, 0.029], [0, 0.28 + i * 0.02, 0], { color: '#2a3a1a', parent: 'knife', noInk: true }));
    return b.act({ click: [[A.detach('knife', 'knife'), A.say('Shing!', 1)], [A.reattach('knife'), A.say('Thunk.', 1)]] }).done();
  }),
  // A sushi board (26 cm): salmon and tuna nigiri on rice, two kinds of maki roll, a mound of wasabi and pickled
  // ginger, chopsticks resting on their holder. A nigiri can be picked up.
  e('sushi', 'food', 'asian food', () => {
    const b = m('sushi')
      .box([0.28, 0.02, 0.14], [0, 0.02, 0], { color: 'lightwood', round: 0.2, name: 'board', edge: 'sharp' })
      .box([0.03, 0.01, 0.12], [0.11, 0.005, 0], { color: 'lightwood', round: 0.2, edge: 'sharp' })
      .box([0.03, 0.01, 0.12], [-0.11, 0.005, 0], { color: 'lightwood', round: 0.2, edge: 'sharp' });
    for (const [x, fish, n] of [[-0.09, '#f28a5a', 'nigiri'], [-0.04, '#c0303a', 'nigiri2']] as const) {
      b.box([0.045, 0.026, 0.028], [x, 0.043, 0], { color: 'white', round: 0.8, name: n, ...(n === 'nigiri' ? { parent: 'board', piece: true } : {}) })
        .box([0.054, 0.012, 0.034], [x, 0.061, 0], { color: fish, round: 0.6, parent: n });
      if (fish === '#f28a5a') b.each(2, (i) => b.box([0.003, 0.002, 0.034], [x - 0.01 + i * 0.02, 0.0675, 0], { color: 'white', rot: [0, 0, 20], parent: n, noInk: true }));
    }
    for (const [x, z, c] of [[0.02, -0.02, '#f28a5a'], [0.055, 0.025, '#9be34d']] as const) {
      b.cyl([0.04, 0.03, 0.04], [x, 0.045, z], { color: '#1e2a1a' }).cyl([0.034, 0.004, 0.034], [x, 0.061, z], { color: 'white' }).cyl([0.014, 0.005, 0.014], [x, 0.063, z], { color: c });
    }
    b.ball([0.022, 0.014, 0.018], [0.1, 0.037, -0.035], { color: '#9bbf3a' })
      .ball([0.03, 0.01, 0.025], [0.1, 0.034, 0.035], { color: '#f4b8c0' })
      .box([0.03, 0.01, 0.015], [0.0, 0.035, 0.07], { color: '#2a2726', round: 0.3, edge: 'sharp' })
      .stick([-0.12, 0.04, 0.065], [0.12, 0.04, 0.07], 0.006, '#b5814e')
      .stick([-0.12, 0.04, 0.078], [0.12, 0.04, 0.076], 0.006, '#b5814e');
    return b.act({ click: [[A.detach('nigiri', 'nigiri'), A.say('Nom!', 1)], [A.reattach('nigiri')]] }).done();
  }),
  // Red braces (suspenders) on a hanger: two straps over the shoulders crossing into a Y at the back, metal clips at
  // the ends and adjuster slides. They twang.
  e('suspenders', 'wardrobe', 'accessories', () => {
    const b = m('suspenders');
    const T = hanger(b, valet(b, 1.5), 0.36);
    b.pair((s) => {
      b.box([0.035, 0.7, 0.008], [s * 0.1, T - 0.38, 0.02], { color: '#c0392b', rot: [0, 0, s * 4], parent: 'garment', round: 0.3 });
      b.box([0.045, 0.04, 0.012], [s * 0.125, T - 0.74, 0.025], { color: 'silver', parent: 'garment', edge: 'sharp' });
      b.box([0.04, 0.03, 0.012], [s * 0.105, T - 0.25, 0.026], { color: 'gold', parent: 'garment', edge: 'sharp' });
      b.box([0.035, 0.42, 0.008], [s * 0.05, T - 0.2, -0.02], { color: '#a32f25', rot: [0, 0, -s * 12], parent: 'garment', round: 0.3 });
    });
    b.box([0.035, 0.32, 0.008], [0, T - 0.56, -0.02], { color: '#a32f25', parent: 'garment', round: 0.3 })
      .box([0.045, 0.04, 0.012], [0, T - 0.74, -0.025], { color: 'silver', parent: 'garment', edge: 'sharp' })
      .box([0.06, 0.06, 0.014], [0, T - 0.38, -0.025], { color: '#5c3a22', parent: 'garment', round: 0.3 });
    return b.act(garmentAct([A.say('Twang!', 1)], [A.say('Snap!', 1)])).done();
  }),
  // A pedestrian suspension bridge (60 m, the vocabulary's 1 m is far too small) over a river: two steel H towers
  // (15 m), main cables sagging between them and down to anchor blocks, a row of hangers, the deck with railings,
  // and lamps along the cables that light up at dusk.
  e('suspension bridge', 'places', 'bridges', () => {
    const red = '#c0392b', y0 = 3.2;
    const b = m('suspension bridge', { edge: 'sharp' })
      .box([70, 0.1, 18], [0, 0.05, 0], { color: '#6ab04c' })
      .box([36, 0.12, 18.2], [0, 0.07, 0], { color: '#4f9bd6', noInk: true })
      .box([60, 0.4, 3.2], [0, y0, 0], { color: '#9da3a8', round: 0.1 })
      .box([60, 0.06, 2.6], [0, y0 + 0.23, 0], { color: '#b5814e' });
    const cy = (x: number) => (Math.abs(x) <= 16 ? y0 + 1.5 + 9.5 * (x / 16) ** 2 : y0 + 11 - ((Math.abs(x) - 16) / 13) * (y0 + 10.5));
    b.pair((s) => {
      b.box([3, 0.8, 5], [s * 29, 0.4, 0], { color: 'stone', round: 0.1 });
      b.box([4, y0, 4], [s * 16, y0 / 2, 0], { color: 'stone', round: 0.05 });
      for (const z of [1.7, -1.7]) b.box([0.8, 15, 0.8], [s * 16, 7.5 + 0.1, z], { color: red, round: 0.1 });
      b.box([0.8, 0.8, 4.2], [s * 16, 14.5, 0], { color: red, round: 0.1 });
      b.box([0.8, 0.8, 4.2], [s * 16, 8.5, 0], { color: red, round: 0.1 });
      for (const z of [1.7, -1.7]) {
        b.box([60, 1.0, 0.08], [0, y0 + 0.9, s * 1.55], { color: '#5c6166' });
        const xs = [-29, -24, -20, -16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24, 29];
        for (let i = 0; i + 1 < xs.length; i++) b.rod([xs[i], cy(xs[i]), z], [xs[i + 1], cy(xs[i + 1]), z], 0.25, red);
        if (s > 0) for (let x = -14; x <= 14; x += 2) b.stick([x, cy(x), z], [x, y0 + 0.2, z], 0.06, '#5c6166');
      }
      b.each(3, (i) => b.ball(0.5, [s * (4 + i * 4), cy(s * (4 + i * 4)) + 0.4, 1.7], { color: '#fff6c8', name: `lamp${s > 0 ? 'L' : 'R'}${i}`, mover: { kind: 'light', on: false } }));
    });
    return b.act({ click: [[A.operate('lamps', 'on'), A.par(A.effect('sparkle', { dur: 1.5 }), A.anim('wobble'))], [A.par(A.operate('lamps', 'off'), A.say('Creak...', 1.2))]] }).done();
  }),
  // A big SUV (4.8 m, 1.8 m tall): high ground clearance, upright glasshouse, roof rails, chunky black bumpers and
  // arches, a spare wheel on the back door, all-terrain tyres.
  e('suv', 'garage', 'cars', () => {
    const b = m('suv', { view: 'side' });
    car(b, { L: 4.8, W: 1.95, H: 1.82, belt: 1.15, low: 0.42, color: '#2f5a3a', wheel: 0.8, wb: 2.85, cab: [0.06, 0.74], rake: [0.08, 0.3], nose: 0.8, tail: 0.95, plate: 'SUV 4X4', rim: '#9da3a8' });
    b.pair((s) => {
      b.stick([s * 0.72, 1.86, -1.9], [s * 0.72, 1.86, 1.0], 0.04, '#2a2726', { edge: 'sharp' });
      b.box([0.08, 0.15, 3.0], [s * 0.99, 0.55, 0], { color: '#2a2726', round: 0.4, edge: 'sharp' });
    });
    b.torus([0.76, 0.76, 0.26], [0, 1.02, -2.52], { color: 'rubber', tube: 0.36 })
      .cyl([0.45, 0.24, 0.45], [0, 1.02, -2.52], { color: '#2f5a3a', rot: [90, 0, 0], edge: 'sharp' });
    return b.act(carAct('Beep beep!', 'Clunk!')).done();
  }),
  // A SWAT armoured van (6 m, 2.8 m high): a black box body with armour plates, a bull bar, narrow armoured glass, a
  // red-and-blue light bar (lights), side steps and grab rails, rear double doors that open.
  e('swat van', 'garage', 'trucks', () => {
    const k = '#22252a';
    const b = m('swat van', { view: 'side', edge: 'sharp' })
      .box([2.3, 2.2, 4.4], [0, 1.55, -0.7], { color: k, round: 0.08 })
      .box([2.3, 1.2, 1.6], [0, 1.05, 2.2], { color: k, round: 0.15 })
      .box([2.2, 0.75, 0.08], [0, 2.05, 1.52], { color: '#3d5a73', rot: [-18, 0, 0] })
      .box([2.0, 0.5, 0.12], [0, 0.75, 3.05], { color: '#3a3633', round: 0.2 })
      .box([2.4, 0.7, 0.2], [0, 0.85, 3.2], { color: '#5c6166', round: 0.2 })
      .box([1.6, 0.18, 0.35], [0, 2.73, 0.9], { color: '#2a2726', round: 0.3 })
      .box([0.7, 0.14, 0.3], [-0.38, 2.86, 0.9], { color: '#e0302a', name: 'lightR', mover: { kind: 'light', on: false } })
      .box([0.7, 0.14, 0.3], [0.38, 2.86, 0.9], { color: '#2f6fff', name: 'lightB', mover: { kind: 'light', on: false } })
      .label('SWAT', [1.6, 0.5], [1.16, 1.6, -0.9], { color: k, rot: [0, 90, 0], depth: 0.02 })
      .label('SWAT', [1.6, 0.5], [-1.16, 1.6, -0.9], { color: k, rot: [0, -90, 0], depth: 0.02 });
    b.pair((s) => {
      b.box([0.05, 0.5, 0.9], [s * 1.16, 2.05, 1.1], { color: '#3d5a73' });
      b.box([0.3, 0.06, 1.6], [s * 1.25, 0.5, 0.6], { color: '#5c6166' });
      b.stick([s * 1.18, 1.2, -2.8], [s * 1.18, 2.2, -2.8], 0.04, 'silver');
      const n = s > 0 ? 'doorL' : 'doorR';
      b.box([1.12, 1.9, 0.06], [s * 0.57, 1.5, -2.93], { color: '#2a2e33', round: 0.1, name: n, pivot: [s * 1.14, 1.5, -2.93], mover: { kind: 'swing', axis: 'y', amount: s * 100 } });
      b.box([0.6, 0.3, 0.04], [s * 0.6, 2.05, -2.97], { color: '#3d5a73', parent: n });
      b.ball([0.25, 0.18, 0.06], [s * 0.8, 1.15, 3.02], { color: '#fff6c8', glow: true });
      for (const [kk, zz] of [['F', 2.2], ['B', -1.8]] as const) wheel(b, `wheel${kk}${s > 0 ? 'L' : 'R'}`, s * 1.06, zz, 0.95, 0.34, { rim: '#2a2726' });
    });
    return b
      .socket('driver', [0.5, 1.4, 1.8], 'seat')
      .act({
        click: [
          [A.par(A.operate('lightR', 'on'), A.say('Woo-woo-woo!', 1.6)), A.par(A.operate('lightR', 'off'), A.operate('lightB', 'on')), A.par(A.operate('lightB', 'off'), A.operate('lightR', 'on')), A.par(A.operate('lightR', 'off'), A.operate('lightB', 'on')), A.operate('lightB', 'off')],
          [A.operate('doors', 'open'), A.say('Clunk!', 1.2), A.wait(2), A.operate('doors', 'close')],
        ],
      })
      .done();
  }),
  // A chunky knit Christmas sweater on a hanger: green with a white band of snowflakes, ribbed cuffs, collar and hem.
  e('sweater', 'wardrobe', 'tops', () => {
    const b = m('sweater');
    const T = hanger(b, valet(b, 1.75), 0.44);
    topOn(b, T, 0, { color: '#2f6a3a', sleeves: 'long', W: 0.52, L: 0.66, band: '#1f4f2a' });
    b.box([0.5, 0.12, 0.005], [0, T - 0.3, 0.083], { color: 'white', parent: 'garment', noInk: true });
    b.each(5, (i) => b.star(0.07, [-0.18 + i * 0.09, T - 0.3, 0.088], { color: '#c0392b', parent: 'garment', noInk: true }));
    return b.act(garmentAct([A.effect('hearts', { dur: 1.2 })], [A.effect('sparkle', { dur: 1 })])).done();
  }),
  // Grey marl joggers on a clip hanger: an elastic waistband with drawstrings, a pocket on each hip, tapered legs and
  // ribbed cuffs.
  e('sweatpants', 'wardrobe', 'pants', () => {
    const b = m('sweatpants');
    const T = hanger(b, valet(b, 1.6), 0.4, true), z = 0;
    pantsOn(b, T, z, { color: '#9da3a8', L: 0.98, band: '#5c6166', cuff: '#5c6166', legW: 0.2 });
    b.pair((s) => {
      b.rod([s * 0.03, T - 0.06, z + 0.09], [s * 0.04, T - 0.2, z + 0.1], 0.01, 'white', { parent: 'garment' });
      b.box([0.005, 0.12, 0.02], [s * 0.16, T - 0.18, z + 0.09], { color: '#8a9096', rot: [0, 0, s * 15], parent: 'garment', noInk: true });
    });
    return b.act(garmentAct([A.say('Flump.', 1)])).done();
  }),
  // Orange swim trunks with a hibiscus print and a white drawstring, on a clip hanger. Still dripping.
  e('swim trunks', 'wardrobe', 'swimwear', () => {
    const b = m('swim trunks');
    const T = hanger(b, valet(b, 1.45), 0.4, true), z = 0;
    pantsOn(b, T, z, { color: '#f0923b', L: 0.48, band: '#c86a1e', legW: 0.23 });
    b.each(4, (i) => b.ball([0.06, 0.06, 0.01], [-0.14 + i * 0.09, T - 0.2 - (i % 2) * 0.12, z + 0.1], { color: i % 2 ? '#f6d24a' : '#e0473b', parent: 'garment', noInk: true }));
    b.rod([0.02, T - 0.04, z + 0.09], [0.05, T - 0.18, z + 0.1], 0.01, 'white', { parent: 'garment' });
    return b.act(garmentAct([A.par(A.effect('water_spray', { dur: 1 }), A.say('Drip, drip.', 1.2))])).done();
  }),
  // A single bodyboard swim fin (50 cm) standing on its heel: an open-heel blue rubber foot pocket with a strap and a
  // short, ribbed, flexible blade above it. It flaps.
  e('swimfin', 'sports', 'swim gear', () =>
    m('swimfin')
      .loft([0.11, 0.09, 0.26], [0, 0.13, 0], [[0, 0.75, 0.9], [0.3, 1, 1], [0.8, 0.95, 0.7], [1, 0.7, 0.3]], { color: '#2f4f8f', rot: [-90, 0, 0], name: 'fin' })
      .torus([0.1, 0.08, 0.03], [0, 0.04, -0.01], { color: '#2a2726', rot: [90, 0, 0], tube: 0.18, parent: 'fin' })
      .box([0.18, 0.3, 0.012], [0, 0.4, 0.015], { color: '#4e8fd6', rot: [-6, 0, 0], round: 0.5, name: 'blade', parent: 'fin', pivot: [0, 0.26, 0.01], edge: 'sharp' })
      .box([0.012, 0.28, 0.02], [0.08, 0.4, 0.02], { color: '#2f4f8f', rot: [-6, 0, 0], parent: 'blade' })
      .box([0.012, 0.28, 0.02], [-0.08, 0.4, 0.02], { color: '#2f4f8f', rot: [-6, 0, 0], parent: 'blade' })
      .act({ click: [A.pose('blade', { rot: [-25, 0, 0], dur: 0.25 }), A.pose('blade', { rot: [20, 0, 0], dur: 0.3 }), A.pose('blade', { rot: [0, 0, 0], dur: 0.25 }), A.par(A.effect('water_spray', { dur: 1 }), A.say('Flap!', 1))] })
      .done(),
  ),
  // A one-piece swimsuit on a hanger: magenta with white polka dots, thin straps, a scooped back and leg openings.
  e('swimsuit', 'wardrobe', 'swimwear', () => {
    const b = m('swimsuit');
    const T = hanger(b, valet(b, 1.6), 0.36) - 0.05, c = '#d64fa0';
    b.loft([0.32, 0.14, 0.55], [0, T - 0.33, 0], [[0, 0.3, 0.6], [0.12, 0.65, 0.85], [0.3, 0.92, 1], [0.7, 0.85, 1], [0.92, 0.95, 0.95], [1, 0.8, 0.8]], { color: c, rot: [-90, 0, 0], boxy: 0.55, parent: 'garment', edge: 'soft' });
    b.pair((s) => b.stick([s * 0.1, T - 0.08, 0], [s * 0.12, T + 0.03, 0], 0.02, c, { parent: 'garment' }));
    b.each(7, (i) => b.ball([0.03, 0.03, 0.008], [-0.1 + (i % 3) * 0.1, T - 0.15 - Math.floor(i / 3) * 0.13, 0.07], { color: 'white', parent: 'garment', noInk: true }));
    return b.act(garmentAct([A.effect('sparkle', { dur: 1 })], [A.effect('water_spray', { dur: 0.8 })])).done();
  }),
  // A backyard swing set (2.4 m): a blue A-frame with a top beam, two swings on chains with seats (one red, one
  // yellow). The red one swings back and forth.
  e('swing', 'toys', 'playground', () => {
    const b = m('swing', { edge: 'sharp' }).stick([-1.3, 2.35, 0], [1.3, 2.35, 0], 0.12, '#2f6fb0');
    b.pair((s) => {
      b.stick([s * 1.35, 0, 0.75], [s * 1.25, 2.35, 0], 0.08, '#2f6fb0');
      b.stick([s * 1.35, 0, -0.75], [s * 1.25, 2.35, 0], 0.08, '#2f6fb0');
      b.stick([s * 1.33, 0.8, 0.5], [s * 1.33, 0.8, -0.5], 0.05, '#2f6fb0');
      const x = s * 0.55, n = s > 0 ? 'swingA' : 'swingB';
      b.stick([x - 0.22, 2.32, 0], [x - 0.22, 0.5, 0], 0.02, 'steel', { name: n, pivot: [x, 2.32, 0] });
      b.stick([x + 0.22, 2.32, 0], [x + 0.22, 0.5, 0], 0.02, 'steel', { parent: n });
      b.box([0.5, 0.04, 0.2], [x, 0.47, 0], { color: s > 0 ? '#e0473b' : '#f6d24a', round: 0.4, parent: n, edge: 'soft' });
      b.socket(s > 0 ? 'seat1' : 'seat2', [x, 0.5, 0], 'seat', { part: n });
    });
    return b
      .act({ click: [A.pose('swingA', { rot: [35, 0, 0], dur: 0.6 }), A.pose('swingA', { rot: [-35, 0, 0], dur: 1.0 }), A.par(A.pose('swingA', { rot: [25, 0, 0], dur: 0.9 }), A.say('Wheee!', 1.4)), A.pose('swingA', { rot: [-15, 0, 0], dur: 0.8 }), A.pose('swingA', { rot: [0, 0, 0], dur: 0.6 })] })
      .done();
  }),
  // A wedge of Swiss cheese (20 cm) with its rind and round holes on every face, on a little board. A mouse comes for
  // a nibble.
  e('swiss cheese', 'food', 'dairy', () => {
    const b = m('swiss cheese', { edge: 'sharp' })
      .box([0.26, 0.016, 0.16], [0, 0.008, 0], { color: 'lightwood', round: 0.2 })
      .wedge([0.22, 0.17, 0.1], [0, 0.066, 0], { color: 'cheese', rot: [90, 0, 0] })
      .box([0.012, 0.1, 0.17], [0.105, 0.066, -0.0], { color: '#e8b030', rot: [0, 0, 0] });
    const hole = (p: V, n: V, d: number) => b.stick([p[0] - n[0] * 0.006, p[1] - n[1] * 0.006, p[2] - n[2] * 0.006], [p[0] + n[0] * 0.002, p[1] + n[1] * 0.002, p[2] + n[2] * 0.002], d, '#d9a830', { noInk: true, edge: 'soft' });
    hole([-0.03, 0.116, -0.04], [0, 1, 0], 0.035);
    hole([0.03, 0.116, 0.0], [0, 1, 0], 0.025);
    hole([-0.005, 0.116, 0.045], [0, 1, 0], 0.018);
    hole([0.055, 0.066, 0.0], [0.85, 0, 0.52], 0.035);
    hole([0.075, 0.04, -0.04], [0.85, 0, 0.52], 0.02);
    hole([-0.06, 0.07, -0.01], [-0.85, 0, 0.52], 0.03);
    return b.act({ click: [A.spawn('mouse', 'mouse', { rel: 'near', of: 'self', dist: 'near' }), A.move('mouse', { rel: 'near', of: 'self', dist: 'touch' }, { speed: 'run' }), A.say('Squeak! Nibble, nibble.', 1.8, 'mouse'), A.wait(1), A.remove('mouse', 'fade')] }).done();
  }),
  // A Swiss roll (30 cm) on a plate, dusted with sugar: the sponge spiral round raspberry jam and cream shows at both
  // ends, and a slice is cut ready to take.
  e('swiss roll', 'food', 'cakes', () => {
    const b = m('swiss roll')
      .cyl([0.36, 0.012, 0.26], [0, 0.006, 0], { color: 'white', edge: 'sharp', name: 'plate' })
      .cyl([0.11, 0.24, 0.11], [-0.02, 0.067, -0.02], { color: '#d9a35f', rot: [0, 0, 90] })
      .torus([0.085, 0.085, 0.006], [0.1, 0.067, -0.02], { color: 'cream', rot: [0, 90, 0], tube: 0.16 })
      .torus([0.05, 0.05, 0.006], [0.1, 0.067, -0.02], { color: '#c0303a', rot: [0, 90, 0], tube: 0.28 })
      .cyl([0.11, 0.03, 0.11], [0.0, 0.067, 0.09], { color: '#d9a35f', rot: [90, 0, 0], name: 'slice', parent: 'plate', piece: true })
      .torus([0.085, 0.085, 0.006], [0.0, 0.067, 0.106], { color: 'cream', tube: 0.16, parent: 'slice' })
      .torus([0.05, 0.05, 0.006], [0.0, 0.067, 0.106], { color: '#c0303a', tube: 0.28, parent: 'slice' });
    b.each(5, (i) => b.ball(0.01, [-0.1 + i * 0.045, 0.122, -0.02], { color: 'white', noInk: true }));
    return b.act({ click: [[A.detach('slice', 'slice'), A.say('Mmm!', 1)], [A.reattach('slice')]] }).done();
  }),
  // A light switch on its wall plate (12 cm): a rocker toggle (it flips) and a tiny locator light that glows when on.
  e('switch', 'home', 'electrical', () =>
    m('switch', { edge: 'sharp' })
      .box([0.075, 0.12, 0.012], [0, 0.06, 0], { color: '#f7f5ef', round: 0.3 })
      .box([0.032, 0.054, 0.008], [0, 0.06, 0.008], { color: '#d4d7da', round: 0.3 })
      .box([0.024, 0.036, 0.016], [0, 0.06, 0.014], { color: '#f2f2ee', round: 0.4, name: 'toggle', mover: { kind: 'swing', axis: 'x', amount: -24 } })
      .ball(0.005, [0, 0.092, 0.012], { color: '#ff9a2a', name: 'pilot', mover: { kind: 'light', on: false } })
      .ball(0.005, [0, 0.105, 0.007], { color: '#9da3a8' })
      .ball(0.005, [0, 0.015, 0.007], { color: '#9da3a8' })
      .act({ click: [[A.par(A.operate('toggle', 'on'), A.operate('pilot', 'on')), A.say('Click.', 0.8)], [A.par(A.operate('toggle', 'off'), A.operate('pilot', 'off')), A.say('Click.', 0.8)]] })
      .done(),
  ),
  // A synagogue (14 m): a pale stone front with a gabled centre, a big round Star of David window, a tall arched
  // entrance with double doors (they open), arched windows, two flanking towers with domes, steps up to the door.
  e('synagogue', 'places', 'places of worship', () => {
    const st = '#e6d6b0', tr = '#c9a46a', gl = '#9fd0ea';
    const b = m('synagogue', { edge: 'sharp' })
      .box([8, 9, 10], [0, 4.5, -1], { color: st, round: 0.02 })
      .wedge([8.4, 2.6, 10.4], [0, 10.3, -1], { color: '#b9a888', rot: [0, 0, 0] })
      .wedge([8.0, 2.4, 0.4], [0, 10.2, 4.1], { color: st })
      .box([8.4, 0.4, 0.5], [0, 9.0, 4.1], { color: tr, round: 0.2 })
      .box([9, 0.3, 2.5], [0, 0.15, 5.0], { color: '#9a9a92', round: 0.1 })
      .box([7, 0.3, 1.8], [0, 0.45, 4.7], { color: '#9a9a92', round: 0.1 })
      .box([2.4, 4.2, 0.2], [0, 2.7, 4.05], { color: '#5a3a22' })
      .arc([2.8, 2.6, 0.4], [0, 4.8, 4.05], { color: tr, tube: 0.12 })
      .box([1.15, 3.6, 0.12], [-0.6, 2.4, 4.12], { color: '#7a5230', name: 'doorR', pivot: [-1.18, 2.4, 4.14], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .box([1.15, 3.6, 0.12], [0.6, 2.4, 4.12], { color: '#7a5230', name: 'doorL', pivot: [1.18, 2.4, 4.14], mover: { kind: 'swing', axis: 'y', amount: 95 } })
      .cyl([2.6, 0.2, 2.6], [0, 6.9, 4.05], { color: tr, rot: [90, 0, 0] })
      .cyl([2.2, 0.2, 2.2], [0, 6.9, 4.1], { color: gl, rot: [90, 0, 0], name: 'rose', mover: { kind: 'light', on: false } });
    const sv = (a: number): V => xy(0, 6.9, 0.9, a, 4.22);
    for (const off of [0, Math.PI]) for (let k = 0; k < 3; k++) b.rod(sv(off + (k * 2 * Math.PI) / 3), sv(off + ((k + 1) * 2 * Math.PI) / 3), 0.12, '#2f4f8f');
    b.pair((s) => {
      b.box([2.6, 12, 2.6], [s * 5.2, 6, 2.6], { color: st, round: 0.03 });
      b.box([2.8, 0.35, 2.8], [s * 5.2, 12.1, 2.6], { color: tr, round: 0.2 });
      b.dome([2.4, 2.2, 2.4], [s * 5.2, 13.35, 2.6], { color: '#4f9a7a' });
      b.stick([s * 5.2, 14.4, 2.6], [s * 5.2, 15.4, 2.6], 0.12, 'gold');
      b.each(2, (i) => {
        b.box([0.9, 2.0, 0.1], [s * 5.2, 3.0 + i * 4.5, 3.92], { color: gl });
        b.arc([0.9, 0.9, 0.12], [s * 5.2, 4.0 + i * 4.5, 3.92], { color: gl, tube: 0.5 });
      });
      b.each(3, (i) => b.box([0.1, 2.4, 1.0], [s * 4.02, 3.2, 0.5 - i * 2.8], { color: gl }));
      b.box([0.9, 2.2, 0.1], [s * 2.6, 3.0, 4.02], { color: gl });
    });
    return b
      .act({ click: [[A.operate('doors', 'open'), A.par(A.operate('rose', 'on'), A.effect('sparkle', { dur: 1.5 })), A.wait(2.5), A.operate('doors', 'close')], [A.operate('rose', 'off')]] })
      .done();
  }),
  // A hypodermic syringe (15 cm) on a steel kidney dish: a clear barrel with graduations and blue medicine, the
  // plunger (it pushes in) and its thumb rest, finger flange, a needle under its cap (a piece).
  e('syringe', 'clinic', 'medical tools', () =>
    m('syringe', { edge: 'sharp' })
      .cyl([0.12, 0.012, 0.07], [0, 0.006, 0], { color: 'silver', round: 0.3 })
      .box([0.05, 0.006, 0.022], [0, 0.07, 0], { color: 'white', round: 0.4, name: 'body' })
      .cyl([0.022, 0.07, 0.022], [0, 0.106, 0], { color: '#d6f0fa', parent: 'body' })
      .cyl([0.0225, 0.04, 0.0225], [0, 0.12, 0], { color: '#4ec0ff', parent: 'body' })
      .cone([0.014, 0.012, 0.014], [0, 0.147, 0], { color: 'white', parent: 'body' })
      .stick([0, 0.152, 0], [0, 0.175, 0], 0.002, 'silver', { parent: 'body' })
      .cyl([0.008, 0.035, 0.008], [0, 0.17, 0], { color: '#ff8a2a', name: 'cap', parent: 'body', piece: true })
      .stick([0, 0.02, 0], [0, 0.085, 0], 0.008, 'white', { name: 'plunger', mover: { kind: 'slide', axis: 'y', amount: 0.03 } })
      .cyl([0.03, 0.005, 0.03], [0, 0.02, 0], { color: 'white', parent: 'plunger' })
      .act({ click: [[A.detach('cap', 'cap'), A.operate('plunger', 'on'), A.par(A.effect('water_spray', { dur: 0.6 }), A.say('Squirt!', 1)), A.operate('plunger', 'off')], [A.reattach('cap')]] })
      .done(),
  ),
  // A red-and-white check tablecloth on a little cafe table (75 cm) set with a plate, a cup and a vase of flowers.
  // The magician's trick: the cloth whips out from under the dishes (a piece), and goes back.
  e('tablecloth', 'home', 'linens', () => {
    const b = m('tablecloth', { edge: 'sharp' })
      .box([1.1, 0.04, 0.8], [0, 0.72, 0], { color: 'wood', name: 'table' })
      .box([1.18, 0.012, 0.88], [0, 0.746, 0], { color: '#e0473b', round: 0.3, name: 'cloth', parent: 'table', piece: true, edge: 'soft' });
    b.pair((s) => {
      b.box([1.18, 0.22, 0.012], [0, 0.64, s * 0.44], { color: '#e0473b', parent: 'cloth', edge: 'soft' });
      b.box([0.012, 0.22, 0.88], [s * 0.59, 0.64, 0], { color: '#e0473b', parent: 'cloth', edge: 'soft' });
      for (const z of [0.32, -0.32]) b.stick([s * 0.48, 0, z], [s * 0.48, 0.7, z], 0.05, 'darkwood');
    });
    b.each(12, (i) => {
      if ((i + Math.floor(i / 4)) % 2) return;
      b.box([0.29, 0.004, 0.22], [-0.44 + (i % 4) * 0.295, 0.754, -0.33 + Math.floor(i / 4) * 0.22], { color: 'white', parent: 'cloth', noInk: true });
    });
    b.cyl([0.24, 0.015, 0.24], [-0.2, 0.76, 0.1], { color: 'white' })
      .cyl([0.08, 0.08, 0.08], [0.25, 0.79, 0.15], { color: 'white', taper: 1.15 })
      .cyl([0.1, 0.18, 0.1], [0.15, 0.84, -0.2], { color: '#4e8fd6', taper: 0.6 })
      .ball(0.06, [0.12, 0.98, -0.2], { color: '#f4a1c0', edge: 'soft' })
      .ball(0.06, [0.18, 0.99, -0.18], { color: '#f6d24a', edge: 'soft' });
    return b.act({ click: [[A.detach('cloth', 'cloth'), A.par(A.effect('sparkle', { dur: 1 }), A.say('Ta-da!', 1.4))], [A.reattach('cloth'), A.say('Swish!', 1)]] }).done();
  }),
  // A tablet (25 cm) on a folding stand: slim black bezel, a glowing screen (a light) with a grid of app tiles that
  // swipe across, the camera dot.
  e('tablet (electronics)', 'tech', 'computers', () => {
    const t = -15, c = Math.cos(t * D), s = Math.sin(t * D);
    const P = (x: number, y: number, z: number): V => [x, 0.12 + y * c - z * s, 0.0 + y * s + z * c];
    const b = m('tablet (electronics)', { edge: 'sharp' })
      .box([0.12, 0.012, 0.1], [0, 0.006, -0.02], { color: '#5c6166', round: 0.3 })
      .box([0.1, 0.12, 0.01], [0, 0.065, -0.06], { color: '#5c6166', rot: [25, 0, 0], round: 0.3 })
      .box([0.25, 0.18, 0.008], P(0, 0, 0), { color: '#2a2726', rot: [t, 0, 0], round: 0.5 })
      .box([0.226, 0.156, 0.002], P(0, 0, 0.0045), { color: '#3a7bd5', rot: [t, 0, 0], name: 'screen', mover: { kind: 'light', on: true } })
      .ball(0.004, P(0, 0.083, 0.004), { color: '#5c6166' });
    const cols = ['#e0473b', '#9be34d', '#f6d24a', '#f0923b', '#f4a1c0', '#f7f5ef', '#6fd3e8', '#8a5fc4'];
    b.box([0.03, 0.03, 0.002], P(-0.075, 0.04, 0.0062), { color: cols[0], rot: [t, 0, 0], name: 'apps', noInk: true });
    b.each(7, (i) => b.box([0.03, 0.03, 0.002], P(-0.075 + ((i + 1) % 4) * 0.05, 0.04 - Math.floor((i + 1) / 4) * 0.05, 0.0062), { color: cols[i + 1], rot: [t, 0, 0], parent: 'apps', noInk: true }));
    return b.act({ click: [[A.pose('apps', { move: [-0.05, 0, 0], dur: 0.3 }), A.say('Swish.', 0.8), A.pose('apps', { move: [0, 0, 0], dur: 0.3 })], [A.par(A.operate('screen', 'off'), A.pose('apps', { scale: 0, dur: 0 })), A.say('Click.', 0.8), A.wait(1), A.par(A.operate('screen', 'on'), A.pose('apps', { scale: 1, dur: 0 }))]] }).done();
  }),
  // A gossip tabloid (40 cm) open on a news rack: a screaming red masthead, SHOCK! headline and a big photo; the front
  // page turns.
  e('tabloid', 'study', 'newspapers', () =>
    m('tabloid', { edge: 'sharp' })
      .box([0.36, 0.03, 0.14], [0, 0.015, 0], { color: '#5c6166', round: 0.3 })
      .box([0.34, 0.06, 0.02], [0, 0.06, 0.05], { color: '#5c6166', round: 0.3 })
      .box([0.3, 0.4, 0.012], [0, 0.23, 0], { color: 'paper', rot: [-10, 0, 0], round: 0.05, name: 'back' })
      .box([0.3, 0.4, 0.004], [0, 0.232, 0.009], { color: 'paper', rot: [-10, 0, 0], name: 'page', pivot: [-0.15, 0.232, 0.009], mover: { kind: 'swing', axis: 'y', amount: -160 } })
      .box([0.28, 0.07, 0.003], [0, 0.375, 0.038], { color: '#e0302a', rot: [-10, 0, 0], parent: 'page' })
      .label('GOSSIP', [0.22, 0.05], [0, 0.375, 0.041], { color: '#e0302a', rot: [-10, 0, 0], parent: 'page', depth: 0.001 })
      .label('SHOCK!', [0.26, 0.06], [0, 0.3, 0.026], { color: 'paper', rot: [-10, 0, 0], parent: 'page', depth: 0.001 })
      .box([0.12, 0.12, 0.003], [-0.07, 0.17, 0.016], { color: '#a8d8f5', rot: [-10, 0, 0], parent: 'page' })
      .box([0.1, 0.01, 0.003], [0.08, 0.2, 0.017], { color: '#9da3a8', rot: [-10, 0, 0], parent: 'page', noInk: true })
      .box([0.1, 0.01, 0.003], [0.08, 0.17, 0.012], { color: '#9da3a8', rot: [-10, 0, 0], parent: 'page', noInk: true })
      .box([0.1, 0.01, 0.003], [0.08, 0.14, 0.007], { color: '#9da3a8', rot: [-10, 0, 0], parent: 'page', noInk: true })
      .act({ click: [[A.operate('page', 'open'), A.say('Rustle, rustle.', 1.2)], [A.operate('page', 'close'), A.say('Flap.', 1)]] })
      .done(),
  ),
  // A red thumbtack (1.2 cm head) pushed into a square of cork board, a second one beside it. It pops out (a piece).
  e('tack', 'study', 'stationery', () =>
    m('tack')
      .box([0.08, 0.08, 0.01], [0, 0.04, -0.005], { color: '#c89a5e', round: 0.2, name: 'cork', edge: 'sharp' })
      .stick([0, 0.05, 0.0], [0, 0.05, 0.006], 0.0015, 'silver', { name: 'tack', parent: 'cork', piece: true })
      .cyl([0.012, 0.004, 0.012], [0, 0.05, 0.008], { color: '#e0302a', rot: [90, 0, 0], parent: 'tack' })
      .cyl([0.007, 0.006, 0.007], [0, 0.05, 0.013], { color: '#e0302a', rot: [90, 0, 0], parent: 'tack' })
      .cyl([0.012, 0.004, 0.012], [0.022, 0.025, 0.002], { color: '#4e8fd6', rot: [90, 0, 0] })
      .cyl([0.007, 0.006, 0.007], [0.022, 0.025, 0.007], { color: '#4e8fd6', rot: [90, 0, 0] })
      .act({ click: [[A.detach('tack', 'tack'), A.say('Pop!', 1)], [A.reattach('tack'), A.say('Tik.', 1)]] })
      .done(),
  ),
  // A green fishing tackle box (36 cm): the lid opens on its hinge and two cantilever trays of lures fan out.
  e('tackle box', 'sports', 'fishing gear', () => {
    const b = m('tackle box', { edge: 'sharp' })
      .box([0.36, 0.14, 0.2], [0, 0.07, 0], { color: '#3f7a3a', round: 0.15 })
      .box([0.36, 0.05, 0.2], [0, 0.165, 0], { color: '#2f6a2a', round: 0.25, name: 'lid', pivot: [0, 0.14, -0.1], mover: { kind: 'swing', axis: 'x', amount: -110 } })
      .arc([0.14, 0.08, 0.02], [0, 0.19, 0], { color: '#2a2726', tube: 0.25, parent: 'lid' })
      .box([0.03, 0.04, 0.015], [-0.1, 0.14, 0.105], { color: 'silver' })
      .box([0.03, 0.04, 0.015], [0.1, 0.14, 0.105], { color: 'silver' })
      .box([0.32, 0.03, 0.08], [0, 0.125, 0.04], { color: '#f2f2ee', name: 'tray', pivot: [0, 0.12, 0.0], mover: { kind: 'slide', axis: 'z', amount: 0.09 } });
    b.each(4, (i) => b.ball([0.02, 0.015, 0.03], [-0.11 + i * 0.075, 0.145, 0.04], { color: ['#e0473b', '#f6d24a', '#9be34d', '#f4a1c0'][i], parent: 'tray' }));
    return b.act({ click: [[A.operate('lid', 'open'), A.operate('tray', 'out'), A.say('Click-clack.', 1.2)], [A.operate('tray', 'in'), A.operate('lid', 'close')]] }).done();
  }),
  // A crunchy taco (15 cm) on a plate: a folded corn shell filled with seasoned beef, lettuce, tomato and cheese.
  e('taco', 'food', 'mexican food', () => {
    const b = m('taco').cyl([0.2, 0.01, 0.2], [0, 0.005, 0], { color: 'white', edge: 'sharp' }).ball([0.15, 0.03, 0.07], [0, 0.025, 0], { color: '#e8c25a' });
    b.pair((s) => b.ball([0.16, 0.11, 0.022], [0, 0.068, s * 0.032], { color: '#e8c25a', rot: [s * 12, 0, 0] }));
    const fill: Array<[number, string]> = [[-0.05, 'lettuce'], [-0.02, 'tomato'], [0.01, 'lettuce'], [0.04, '#8a4a2a'], [0.06, 'lettuce']];
    for (const [x, c] of fill) b.ball([0.04, 0.035, 0.04], [x, 0.11 - Math.abs(x) * 0.3, 0], { color: c });
    b.ball([0.02, 0.012, 0.02], [-0.03, 0.13, 0.005], { color: 'cheese' }).ball([0.02, 0.012, 0.02], [0.025, 0.125, -0.005], { color: 'cheese' });
    return b.act({ click: [A.par(A.anim('hop'), A.effect('dust', { dur: 0.8 }), A.say('Crunch!', 1))] }).done();
  }),
  // Three pieces of saltwater taffy (5 cm) twisted up in wax paper; the pink one unwraps (a piece) and wraps again.
  e('taffy', 'food', 'candy', () => {
    const b = m('taffy').cyl([0.12, 0.006, 0.12], [0, 0.003, 0], { color: '#f2e6cf', name: 'dish', edge: 'sharp' });
    const pcs: Array<[number, number, number, string, string]> = [[0, 0, 0, '#f4a1c0', 'candy'], [0.02, 0.03, 40, '#a8d8f5', 'candy2'], [-0.025, -0.025, -30, '#fff3a0', 'candy3']];
    for (const [x, z, r, c, n] of pcs) {
      b.cyl([0.026, 0.045, 0.026], [x, 0.017, z], { color: c, rot: [0, r, 90], name: n, ...(n === 'candy' ? { parent: 'dish', piece: true } : {}) });
      for (const s of [-1, 1]) b.cone([0.026, 0.02, 0.014], [x + Math.cos(r * D) * s * 0.032, 0.017, z - Math.sin(r * D) * s * 0.032], { color: '#f7f5ef', rot: [0, r, -s * 90], parent: n });
    }
    return b.act({ click: [[A.detach('candy', 'taffy'), A.say('Crinkle!', 1)], [A.reattach('candy')]] }).done();
  }),
  // A clothing price tag (7 cm) on its red string loop: a kraft card with a punched hole, the price and a barcode. It
  // flips over to show the sale price.
  e('tag (clothes)', 'wardrobe', 'accessories', () =>
    m('tag (clothes)', { edge: 'sharp' })
      .box([0.05, 0.075, 0.003], [0, 0.05, 0], { color: '#d9b98a', round: 0.15, name: 'tag', pivot: [0, 0.09, 0] })
      .label('$19', [0.036, 0.018], [0, 0.05, 0.002], { color: '#d9b98a', parent: 'tag', depth: 0.001 })
      .label('SALE $9', [0.04, 0.016], [0, 0.05, -0.002], { color: '#e0302a', rot: [0, 180, 0], parent: 'tag', depth: 0.001 })
      .box([0.034, 0.012, 0.001], [0, 0.028, 0.002], { color: '#2a2726', parent: 'tag', noInk: true })
      .cyl([0.008, 0.004, 0.008], [0, 0.08, 0.0], { color: 'white', rot: [90, 0, 0], parent: 'tag' })
      .torus([0.03, 0.05, 0.002], [0, 0.11, 0], { color: '#e0302a', tube: 0.08 })
      .act({ click: [[A.pose('tag', { rot: [0, 180, 0], dur: 0.5 }), A.say('Ka-ching!', 1.2)], [A.pose('tag', { rot: [0, 0, 0], dur: 0.5 })]] })
      .done(),
  ),
  // A bushy fox tail (45 cm) curling up from a little mount: russet fur in three jointed sections down to a white
  // tip. It swishes and wags.
  e('tail', 'wild', 'animal parts', () =>
    m('tail')
      .cyl([0.1, 0.03, 0.08], [0, 0.015, 0], { color: 'darkwood', edge: 'sharp' })
      .ball([0.09, 0.14, 0.09], [0, 0.08, 0], { color: '#d06a2a', name: 'tail', pivot: [0, 0.03, 0] })
      .ball([0.11, 0.16, 0.1], [0.02, 0.2, 0], { color: '#d97a35', rot: [0, 0, -15], name: 'mid', parent: 'tail', pivot: [0, 0.14, 0] })
      .ball([0.1, 0.13, 0.09], [0.06, 0.32, 0], { color: '#e08a40', rot: [0, 0, -35], name: 'tip', parent: 'mid', pivot: [0.04, 0.27, 0] })
      .ball([0.07, 0.08, 0.07], [0.1, 0.39, 0], { color: 'white', rot: [0, 0, -50], parent: 'tip' })
      .act({
        click: [
          [A.pose('tail', { rot: [0, 0, 20], dur: 0.25 }), A.pose('tail', { rot: [0, 0, -20], dur: 0.3 }), A.par(A.pose('tail', { rot: [0, 0, 15], dur: 0.25 }), A.pose('tip', { rot: [0, 0, -30], dur: 0.25 })), A.par(A.pose('tail', { rot: [0, 0, 0], dur: 0.3 }), A.pose('tip', { rot: [0, 0, 0], dur: 0.3 }))],
          [A.par(A.pose('mid', { rot: [0, 0, 30], dur: 0.4 }), A.pose('tip', { rot: [0, 0, 40], dur: 0.4 })), A.par(A.pose('mid', { rot: [0, 0, 0], dur: 0.4 }), A.pose('tip', { rot: [0, 0, 0], dur: 0.4 }), A.say('Swish!', 1))],
        ],
      })
      .done(),
  ),
  // A tambourine (25 cm) standing on its edge in a little stand: a wooden hoop with a skin head and pairs of brass
  // jingles in slots round the rim. Shake it: jingle-jingle.
  e('tambourine', 'music', 'percussion', () => {
    const c: V = [0, 0.15, 0];
    const b = m('tambourine')
      .box([0.12, 0.02, 0.08], [0, 0.01, 0], { color: '#5c6166', round: 0.3, edge: 'sharp' })
      .torus([0.26, 0.26, 0.05], c, { color: '#b5814e', tube: 0.08, name: 'hoop' })
      .cyl([0.245, 0.006, 0.245], [0, 0.15, 0.022], { color: '#f2e6cf', rot: [90, 0, 0], parent: 'hoop' })
      .ball(0.04, [0.04, 0.17, 0.026], { color: '#e8d8b8', parent: 'hoop', noInk: true });
    b.each(6, (i) => {
      const a = Math.PI * 0.25 + (i * Math.PI * 1.5) / 5;
      b.cyl([0.04, 0.008, 0.04], xy(0, 0.15, 0.128, a, 0.008), { color: 'brass', rot: [0, 0, 90 - (a * 180) / Math.PI], parent: 'hoop', edge: 'sharp' })
        .cyl([0.04, 0.008, 0.04], xy(0, 0.15, 0.128, a, -0.008), { color: 'gold', rot: [0, 0, 90 - (a * 180) / Math.PI], parent: 'hoop', edge: 'sharp' });
    });
    return b.act({ click: [A.par(A.pose('hoop', { rot: [0, 0, 15], dur: 0.15 }), A.say('Jingle-jingle!', 1.4)), A.pose('hoop', { rot: [0, 0, -15], dur: 0.15 }), A.pose('hoop', { rot: [0, 0, 12], dur: 0.15 }), A.pose('hoop', { rot: [0, 0, 0], dur: 0.15 }), A.anim('shake')] }).done();
  }),
  // A main battle tank (9 m with its gun, 3 m to the turret top): a sloped hull on two tracks, each running over seven
  // road wheels between the sprocket and idler, side skirts, a turret that traverses with the long gun that elevates,
  // a commander's hatch and smoke launchers. It turns, aims and fires.
  e('tank', 'garage', 'military vehicles', () => {
    const o = '#6f7a3a', dk = '#545c2c';
    const b = m('tank', { view: 'side', edge: 'sharp' })
      .box([2.6, 0.9, 6.6], [0, 1.15, 0], { color: o, round: 0.1 })
      .wedge([2.6, 0.6, 1.0], [0, 1.3, 3.5], { color: o, rot: [0, 0, 0], apex: 0.5 })
      .box([2.6, 0.5, 1.2], [0, 1.05, 3.3], { color: o, rot: [-25, 0, 0], round: 0.1 })
      .box([3.6, 0.1, 6.4], [0, 1.65, 0], { color: dk, round: 0.2 })
      .box([2.4, 0.8, 3.0], [0, 2.1, -0.5], { color: o, round: 0.25, name: 'turret', mover: { kind: 'spin', axis: 'y', amount: 40 } })
      .box([1.8, 0.6, 1.0], [0, 2.05, 1.3], { color: o, rot: [-12, 0, 0], round: 0.3, parent: 'turret' })
      .box([0.5, 0.35, 0.6], [0, 2.1, 1.7], { color: dk, round: 0.3, name: 'gun', parent: 'turret', pivot: [0, 2.15, 1.5], mover: { kind: 'swing', axis: 'x', amount: -8 } })
      .stick([0, 2.15, 1.8], [0, 2.2, 5.6], 0.18, dk, { parent: 'gun' })
      .cyl([0.3, 0.5, 0.3], [0, 2.2, 4.4], { color: o, rot: [90, 0, 0], parent: 'gun' })
      .cyl([0.75, 0.2, 0.75], [0.5, 2.6, -0.8], { color: dk, parent: 'turret' })
      .cyl([0.7, 0.08, 0.7], [0.5, 2.74, -0.8], { color: o, name: 'hatch', parent: 'turret', pivot: [0.5, 2.74, -1.15], mover: { kind: 'swing', axis: 'x', amount: -100 } })
      .box([1.2, 0.5, 0.6], [0, 2.15, -2.3], { color: dk, round: 0.3, parent: 'turret' })
      .star(0.6, [1.22, 2.15, -0.5], { color: 'white', rot: [0, 90, 0], parent: 'turret', noInk: true })
      .star(0.6, [-1.22, 2.15, -0.5], { color: 'white', rot: [0, -90, 0], parent: 'turret', noInk: true });
    b.pair((s) => {
      b.box([0.75, 1.15, 6.9], [s * 1.45, 0.6, 0], { color: '#3a3633', round: 0.5 });
      b.box([0.06, 0.6, 5.8], [s * 1.85, 1.2, 0.1], { color: dk, round: 0.2 });
      b.each(7, (i) => b.cyl([0.68, 0.18, 0.68], [s * 1.75, 0.4, -2.6 + i * 0.85], { color: '#5c6166', rot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}${i}` }));
      b.cyl([0.62, 0.2, 0.62], [s * 1.75, 0.85, 3.25], { color: '#3a3633', rot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}S` });
      b.cyl([0.62, 0.2, 0.62], [s * 1.75, 0.85, -3.25], { color: '#3a3633', rot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}I` });
      b.each(3, (i) => b.cyl([0.12, 0.3, 0.12], [s * (0.9 + i * 0.12), 2.45, 0.3], { color: dk, rot: [-30, 0, s * 30], parent: 'turret' }));
      b.ball([0.2, 0.16, 0.08], [s * 1.0, 1.45, 3.75], { color: '#fff6c8', glow: true });
    });
    return b
      .act({
        click: [
          [A.operate('turret', 'on'), A.say('Clank, clank, clank...', 1.6), A.wait(1.2), A.operate('turret', 'off'), A.operate('gun', 'up'), A.par(A.effect('smoke', { dur: 2 }), A.effect('explosion', { dur: 0.6 }), A.anim('shake', 2), A.say('BOOM!', 1.2)), A.operate('gun', 'down')],
          [A.operate('hatch', 'open'), A.say('Clunk!', 1), A.wait(1.5), A.operate('hatch', 'close')],
        ],
      })
      .done();
  }),
  // An orange racer-back tank top on a hanger: deep armholes, a scoop neck and a ribbed hem.
  e('tanktop', 'wardrobe', 'tops', () => {
    const b = m('tanktop');
    const T = hanger(b, valet(b, 1.6), 0.34);
    topOn(b, T, 0, { color: '#f0923b', sleeves: 'none', W: 0.42, L: 0.66, band: '#e07a28' });
    return b.act(garmentAct([A.effect('sparkle', { dur: 1 })])).done();
  }),
  // A tanning bed (2.2 m): a white base with a glowing acrylic bed full of UV tubes (lights), and a canopy on hinges
  // with its own tubes that comes down over you. Hummm.
  e('tanning bed', 'home', 'beauty', () => {
    const b = m('tanning bed', { edge: 'sharp' })
      .box([2.2, 0.62, 1.0], [0, 0.31, 0], { color: '#f2f2ee', round: 0.12 })
      .box([2.0, 0.04, 0.8], [0, 0.63, 0], { color: '#b48aff', name: 'bed', mover: { kind: 'light', on: false } })
      .box([2.2, 0.08, 0.1], [0, 0.45, 0.5], { color: '#8a5fc4', round: 0.4 })
      .box([2.2, 0.16, 1.0], [0, 1.25, -0.05], { color: '#f2f2ee', rot: [-45, 0, 0], round: 0.3, name: 'canopy', pivot: [0, 0.75, -0.48], mover: { kind: 'swing', axis: 'x', amount: 45 } })
      .box([2.0, 0.02, 0.8], [0, 1.18, -0.0], { color: '#b48aff', rot: [-45, 0, 0], parent: 'canopy', name: 'lid', mover: { kind: 'light', on: false } })
      .box([0.6, 0.3, 0.2], [0, 0.85, -0.5], { color: '#d4d7da', round: 0.3 });
    b.each(7, (i) => b.box([2.0, 0.01, 0.03], [0, 0.655, -0.36 + i * 0.12], { color: 'white', noInk: true }));
    return b
      .socket('bed', [0, 0.66, 0], 'seat')
      .act({ click: [[A.operate('canopy', 'close'), A.par(A.operate('bed', 'on'), A.operate('lid', 'on'), A.say('Hummmmm...', 2)), A.wait(2)], [A.par(A.operate('bed', 'off'), A.operate('lid', 'off')), A.operate('canopy', 'open'), A.say('Ding!', 1)]] })
      .done();
  }),
  // A pump bottle of bronzing lotion (20 cm): amber bottle with a gold band and the pump top that presses down.
  e('tanning lotion', 'sports', 'beach gear', () =>
    m('tanning lotion')
      .cyl([0.07, 0.15, 0.07], [0, 0.075, 0], { color: '#8a4a22' })
      .cyl([0.072, 0.05, 0.072], [0, 0.08, 0], { color: 'gold', noInk: true })
      .label('BRONZE', [0.05, 0.02], [0, 0.08, 0.036], { color: 'gold', depth: 0.002 })
      .cyl([0.07, 0.02, 0.07], [0, 0.16, 0], { color: '#8a4a22', taper: 0.5 })
      .cyl([0.03, 0.02, 0.03], [0, 0.175, 0], { color: 'gold', edge: 'sharp' })
      .stick([0, 0.185, 0], [0, 0.205, 0], 0.012, '#2a2726', { name: 'pump', mover: { kind: 'slide', axis: 'y', amount: -0.012 } })
      .box([0.025, 0.014, 0.05], [0, 0.21, 0.012], { color: '#2a2726', round: 0.4, parent: 'pump' })
      .act({ click: [A.operate('pump', 'on'), A.par(A.effect('sparkle', { dur: 1 }), A.say('Squish!', 1)), A.operate('pump', 'off')] })
      .done(),
  ),
  // A roll of silver duct tape (10 cm) with its end peeled out; pull it and a strip rips off.
  e('tape (sticky)', 'study', 'stationery', () =>
    m('tape (sticky)')
      .torus([0.1, 0.1, 0.05], [0, 0.05, 0], { color: '#b9bec2', tube: 0.3, name: 'roll' })
      .torus([0.07, 0.07, 0.052], [0, 0.05, 0], { color: '#d9b98a', tube: 0.12, parent: 'roll' })
      .box([0.048, 0.04, 0.003], [0, 0.012, 0.04], { color: '#b9bec2', rot: [-50, 0, 0] })
      .box([0.048, 0.003, 0.12], [0, 0.0015, 0.1], { color: '#b9bec2', name: 'strip', mover: { kind: 'slide', axis: 'z', amount: 0.15 }, scale: 1 })
      .act({ click: [[A.operate('strip', 'out'), A.say('Rrrrrrip!', 1.2)], [A.operate('strip', 'in'), A.say('Thwup.', 0.8)]] })
      .done(),
  ),
  // A weighted desk tape dispenser (17 cm, side view): a heavy black shell, a roll of clear tape on its hub (it spins)
  // and the serrated cutter. Zzzip... snip.
  e('tape dispenser', 'study', 'stationery', () =>
    m('tape dispenser', { view: 'side', edge: 'sharp' })
      .box([0.07, 0.05, 0.17], [0, 0.025, 0], { color: '#2a2726', round: 0.4 })
      .ball([0.07, 0.07, 0.09], [0, 0.07, -0.03], { color: '#2a2726', edge: 'soft' })
      .torus([0.085, 0.085, 0.022], [0, 0.1, -0.02], { color: '#d6f0fa', rot: [0, 90, 0], tube: 0.25, name: 'roll', mover: { kind: 'spin', axis: 'x', amount: 720 } })
      .torus([0.05, 0.05, 0.024], [0, 0.1, -0.02], { color: 'white', rot: [0, 90, 0], tube: 0.15, parent: 'roll' })
      .stick([0, 0.142, -0.015], [0, 0.1, 0.075], 0.006, '#d6f0fa')
      .box([0.03, 0.025, 0.012], [0, 0.09, 0.08], { color: 'silver' })
      .act({ click: [A.operate('roll', 'on'), A.say('Zzzzip...', 1), A.operate('roll', 'off'), A.par(A.anim('shake'), A.say('Snip!', 0.8))] })
      .done(),
  ),
  // A 5 m tape measure (8 cm case): yellow case with a belt clip, a lock button and the steel blade with its hook; the
  // blade pulls out and zips back. Snap!
  e('tape measure', 'workshop', 'measuring', () => {
    const b = m('tape measure', { edge: 'sharp' })
      .box([0.04, 0.075, 0.075], [0, 0.0375, 0], { color: '#f6d24a', round: 0.5 })
      .cyl([0.045, 0.004, 0.045], [0.021, 0.04, 0], { color: '#2a2726', rot: [0, 0, 90] })
      .box([0.014, 0.022, 0.014], [0, 0.078, 0.015], { color: '#e0302a' })
      .box([0.004, 0.05, 0.02], [-0.022, 0.04, -0.01], { color: 'silver' })
      .box([0.024, 0.003, 0.08], [0, 0.0015, 0.075], { color: '#f6d24a', name: 'blade', mover: { kind: 'slide', axis: 'z', amount: 0.25 } })
      .box([0.026, 0.012, 0.003], [0, 0.006, 0.115], { color: 'silver', parent: 'blade' });
    b.each(4, (i) => b.box([0.012, 0.0035, 0.003], [-0.004, 0.002, 0.045 + i * 0.02], { color: '#2a2726', parent: 'blade', noInk: true }));
    return b.act({ click: [A.operate('blade', 'out'), A.say('Zzzzip!', 1), A.wait(0.8), A.operate('blade', 'in'), A.par(A.anim('shake'), A.say('SNAP!', 0.8))] }).done();
  }),
  // A medieval tapestry (1.3 m) hanging from a pole on a wooden stand: a maroon field with a gold border, a great tree
  // under a sun, stars and a fringe. It stirs in a draught.
  e('tapestry', 'home', 'decor', () => {
    const b = m('tapestry')
      .stick([-0.7, 1.6, 0], [0.7, 1.6, 0], 0.035, 'darkwood', { edge: 'sharp' })
      .box([1.04, 1.3, 0.02], [0, 0.93, 0], { color: 'gold', name: 'cloth', pivot: [0, 1.6, 0] })
      .box([0.94, 1.2, 0.012], [0, 0.93, 0.012], { color: '#7a1f2a', parent: 'cloth' })
      .cyl([0.3, 0.006, 0.3], [0, 1.25, 0.02], { color: 'gold', rot: [90, 0, 0], parent: 'cloth', noInk: true })
      .ball([0.36, 0.3, 0.006], [0, 0.95, 0.021], { color: '#2f6a3a', parent: 'cloth', noInk: true })
      .box([0.06, 0.24, 0.006], [0, 0.72, 0.021], { color: '#5a3a22', parent: 'cloth', noInk: true })
      .box([0.7, 0.05, 0.006], [0, 0.58, 0.021], { color: '#3f7a3a', parent: 'cloth', noInk: true })
      .star(0.1, [-0.32, 1.3, 0.022], { color: 'gold', parent: 'cloth', noInk: true })
      .star(0.1, [0.32, 1.3, 0.022], { color: 'gold', parent: 'cloth', noInk: true });
    b.each(9, (i) => b.box([0.03, 0.08, 0.01], [-0.44 + i * 0.11, 0.25, 0], { color: 'gold', parent: 'cloth' }));
    b.pair((s) => {
      b.stick([s * 0.66, 0, -0.04], [s * 0.66, 1.66, -0.04], 0.045, 'darkwood', { edge: 'sharp' });
      b.box([0.12, 0.08, 0.42], [s * 0.66, 0.04, -0.04], { color: 'darkwood', round: 0.3, edge: 'sharp' });
      b.ball(0.07, [s * 0.73, 1.6, 0], { color: 'gold' });
    });
    return b.act({ click: [A.pose('cloth', { rot: [-10, 0, 0], dur: 0.6 }), A.pose('cloth', { rot: [6, 0, 0], dur: 0.6 }), A.pose('cloth', { rot: [0, 0, 0], dur: 0.6 }), A.say('Fwoosh...', 1)] }).done();
  }),
  // A bucket of hot tar (25 cm) with a dipping stick, black and glossy, dribbling over the rim. It bubbles.
  e('tar (material)', 'workshop', 'materials', () =>
    m('tar (material)')
      .cyl([0.22, 0.22, 0.22], [0, 0.11, 0], { color: '#5c6166', taper: 1.12, edge: 'sharp' })
      .torus([0.25, 0.25, 0.012], [0, 0.22, 0], { color: '#5c6166', rot: [90, 0, 0], tube: 0.06, edge: 'sharp' })
      .arc([0.24, 0.2, 0.01], [0, 0.22, 0], { color: 'silver', tube: 0.04 })
      .ball([0.24, 0.04, 0.24], [0, 0.215, 0], { color: '#1e1c1b' })
      .ball([0.03, 0.08, 0.02], [0.07, 0.17, 0.1], { color: '#1e1c1b' })
      .ball([0.025, 0.06, 0.02], [-0.08, 0.18, 0.09], { color: '#1e1c1b' })
      .rod([0.02, 0.2, 0], [0.12, 0.38, -0.06], 0.02, 'wood')
      .ball(0.02, [-0.04, 0.235, 0.03], { color: '#3a3633', name: 'bubble', noInk: true })
      .act({ click: [A.par(A.pose('bubble', { scale: 2, dur: 0.6 }), A.effect('smoke', { dur: 2 }), A.say('Blub... blub...', 1.6)), A.pose('bubble', { scale: 1, dur: 0.2 })] })
      .done(),
  ),
  // An archery target (1.2 m face) on a wooden easel: gold, red, blue, black and white rings on a straw boss. An arrow
  // thwacks into the bullseye.
  e('target', 'sports', 'archery', () => {
    const b = m('target')
      .rod([0.45, 0, 0.3], [0.25, 1.5, -0.06], 0.05, 'wood')
      .rod([-0.45, 0, 0.3], [-0.25, 1.5, -0.06], 0.05, 'wood')
      .rod([0, 0, -0.6], [0, 1.4, -0.1], 0.05, 'wood')
      .cyl([1.22, 0.14, 1.22], [0, 0.95, 0], { color: '#d9c48a', rot: [80, 0, 0] });
    const rings: Array<[number, string]> = [[1.12, 'white'], [0.9, '#2a2726'], [0.68, '#4e8fd6'], [0.46, '#e0302a'], [0.24, '#f6d24a']];
    rings.forEach(([d, c], i) => b.cyl([d, 0.01, d], [0, 0.95 + 0.075 * Math.cos(80 * D) + i * 0.0, 0.075 * Math.sin(80 * D) + 0.002 + i * 0.002], { color: c, rot: [80, 0, 0], noInk: i > 0 }));
    b.stick([0, 0.96, 0.08], [0, 1.0, 0.65], 0.012, 'wood', { name: 'arrow', scale: 0 })
      .box([0.004, 0.05, 0.08], [0, 1.0, 0.62], { color: '#e0302a', name: 'fletch', scale: 0 });
    return b.act({ click: [[A.par(A.pose('arrow', { scale: 1, dur: 0.05 }), A.pose('fletch', { scale: 1, dur: 0.05 }), A.anim('shake'), A.say('Thwack! Bullseye!', 1.6))], [A.par(A.pose('arrow', { scale: 0, dur: 0.2 }), A.pose('fletch', { scale: 0, dur: 0.2 }))]] }).done();
  }),
  // A blue tarp pitched as a ridge shelter (3 m) over a line between two poles, pegged out with guy ropes; a backpack
  // and a sleeping mat underneath. It flaps in the wind.
  e('tarp', 'sports', 'camping gear', () => {
    const t = 40 * D;
    const b = m('tarp')
      .stick([-1.5, 1.66, 0], [1.5, 1.66, 0], 0.02, 'tan')
      .box([2.9, 0.025, 1.45], [0, 1.66 - 0.72 * Math.sin(t), 0.72 * Math.cos(t)], { color: '#2f6fd6', rot: [40, 0, 0], name: 'tarp', pivot: [0, 1.66, 0], edge: 'sharp' })
      .box([2.9, 0.025, 1.45], [0, 1.66 - 0.72 * Math.sin(t), -0.72 * Math.cos(t)], { color: '#2f6fd6', rot: [-40, 0, 0], name: 'tarpB', pivot: [0, 1.66, 0], edge: 'sharp' })
      .box([0.42, 0.55, 0.28], [0.3, 0.275, -0.2], { color: '#c0392b', round: 0.3 })
      .box([1.8, 0.03, 0.5], [-0.2, 0.015, 0.1], { color: '#3f7a3a', round: 0.5 });
    b.pair((s) => {
      b.stick([s * 1.45, 0, 0], [s * 1.45, 1.8, 0], 0.045, 'wood');
      b.rod([s * 1.45, 1.75, 0], [s * 2.1, 0.02, 0], 0.012, 'tan');
      b.cone([0.04, 0.1, 0.04], [s * 2.1, 0.05, 0], { color: 'silver', rot: [180, 0, 0] });
      for (const z of [1.1, -1.1]) b.cone([0.03, 0.08, 0.03], [s * 1.4, 0.04, z * 1.02], { color: 'silver', rot: [180, 0, 0] });
    });
    return b.act({ click: [A.pose('tarp', { rot: [-8, 0, 0], dur: 0.25 }), A.pose('tarp', { rot: [4, 0, 0], dur: 0.25 }), A.par(A.pose('tarp', { rot: [0, 0, 0], dur: 0.3 }), A.say('Flap, flap!', 1.2))] }).done();
  }),
  // A fruit tart (20 cm): a fluted pastry case, vanilla custard, rings of strawberries and blueberries under a shiny
  // glaze. A slice lifts out.
  e('tart', 'food', 'desserts', () => {
    const b = m('tart')
      .cyl([0.26, 0.01, 0.26], [0, 0.005, 0], { color: 'white', edge: 'sharp', name: 'plate' })
      .cyl([0.2, 0.035, 0.2], [0, 0.0275, 0], { color: 'crust', segs: 16, taper: 1.06 })
      .cyl([0.18, 0.006, 0.18], [0, 0.046, 0], { color: '#f6e2a0' });
    for (const [x, z] of around(8, 0.065)) b.ball([0.028, 0.02, 0.024], [x, 0.054, z], { color: '#e0302a' });
    for (const [x, z] of around(6, 0.035, 0.3)) b.ball(0.014, [x, 0.053, z], { color: '#2f3f8f' });
    b.ball(0.022, [0, 0.055, 0], { color: '#9be34d' });
    b.cyl([0.07, 0.035, 0.03], [0.0, 0.0275, 0.115], { color: 'crust', name: 'slice', parent: 'plate', piece: true, rot: [0, 0, 0] })
      .box([0.06, 0.006, 0.026], [0.0, 0.047, 0.115], { color: '#f6e2a0', parent: 'slice' })
      .ball([0.024, 0.018, 0.02], [0.0, 0.054, 0.115], { color: '#e0302a', parent: 'slice' });
    return b.act({ click: [[A.detach('slice', 'slice'), A.say('Yum!', 1)], [A.reattach('slice')]] }).done();
  }),
  // A gold silk curtain tassel (20 cm) hanging from a hook by its cord: a turned bead head, a red collar and a skirt
  // of fringe. It swings.
  e('tassel', 'home', 'decor', () => {
    const b = m('tassel')
      .box([0.06, 0.012, 0.04], [0, 0.006, -0.03], { color: 'brass', round: 0.4, edge: 'sharp' })
      .stick([0, 0.01, -0.03], [0, 0.32, -0.03], 0.008, 'brass', { edge: 'sharp' })
      .arc([0.04, 0.04, 0.008], [0, 0.31, -0.01], { color: 'brass', rot: [0, 90, 180], arc: 200, tube: 0.25, edge: 'sharp' })
      .torus([0.03, 0.04, 0.008], [0, 0.28, 0], { color: 'gold', tube: 0.15, name: 'tassel', pivot: [0, 0.3, 0] })
      .ball([0.04, 0.05, 0.04], [0, 0.24, 0], { color: 'gold', parent: 'tassel' })
      .cyl([0.03, 0.015, 0.03], [0, 0.21, 0], { color: '#c0392b', parent: 'tassel' })
      .cyl([0.05, 0.12, 0.05], [0, 0.145, 0], { color: 'gold', rot: [180, 0, 0], taper: 0.55, parent: 'tassel' });
    b.each(5, (i) => b.stick([-0.016 + i * 0.008, 0.2, 0.022], [-0.024 + i * 0.012, 0.085, 0.026], 0.003, '#c08a2a', { parent: 'tassel', noInk: true }));
    return b.act({ click: [A.pose('tassel', { rot: [0, 0, 25], dur: 0.4 }), A.pose('tassel', { rot: [0, 0, -18], dur: 0.6 }), A.pose('tassel', { rot: [0, 0, 8], dur: 0.5 }), A.pose('tassel', { rot: [0, 0, 0], dur: 0.4 })] }).done();
  }),
  // A tattoo on a display forearm (35 cm) on a block: a red heart with a MOM banner in navy ink. The tattoo machine
  // fades away, then buzzes and it is inked back on.
  e('tattoo', 'wardrobe', 'body art', () =>
    m('tattoo')
      .box([0.16, 0.03, 0.12], [0, 0.015, 0], { color: 'wood', round: 0.2, edge: 'sharp' })
      .capsule([0.09, 0.3, 0.08], [0, 0.18, 0], { color: 'skin2' })
      .ball([0.1, 0.1, 0.09], [0, 0.35, 0], { color: 'skin2' })
      .box([0.085, 0.022, 0.006], [0, 0.175, 0.042], { color: '#2f4f8f', noInk: true, name: 'tat' })
      .heart(0.07, [0, 0.19, 0.038], { color: '#c0202a', noInk: true, parent: 'tat' })
      .label('MOM', [0.06, 0.016], [0, 0.175, 0.045], { color: '#2f4f8f', parent: 'tat' })
      .act({ click: [[A.pose('tat', { scale: 0, dur: 0.6 }), A.wait(0.6)], [A.par(A.anim('shake', 2), A.say('Bzzzzzzz...', 1.6), A.pose('tat', { scale: 1, dur: 1.4 })), A.effect('sparkle', { dur: 1 })]] })
      .done(),
  ),
  // A taxi rank (3 m): a kerb with yellow TAXI bay markings, a post with a lit TAXI sign (it lights up when a cab is
  // coming) and a little glass shelter with a bench for the queue.
  e('taxi stand', 'places', 'street things', () => {
    const b = m('taxi stand', { edge: 'sharp' })
      .box([4.4, 0.15, 2.0], [0, 0.075, -0.4], { color: '#c9ccd1', round: 0.05 })
      .box([4.4, 0.02, 1.6], [0, 0.01, 1.4], { color: '#4a4744' })
      .box([4.4, 0.03, 0.12], [0, 0.03, 0.62], { color: '#f6d24a' })
      .label('TAXI', [1.4, 0.4], [0, 0.03, 1.4], { color: '#4a4744', rot: [-90, 0, 0], depth: 0.003 })
      .stick([1.6, 0.15, 0.4], [1.6, 2.6, 0.4], 0.08, '#9da3a8')
      .box([0.8, 0.4, 0.12], [1.6, 2.75, 0.4], { color: '#f6c23a', round: 0.2, name: 'sign', mover: { kind: 'light', on: false } })
      .label('TAXI', [0.7, 0.28], [1.6, 2.75, 0.47], { color: '#f6c23a', parent: 'sign', depth: 0.01 })
      .box([2.2, 0.08, 1.2], [-0.6, 2.4, -0.6], { color: '#2f4f8f', round: 0.3 })
      .box([2.2, 2.2, 0.04], [-0.6, 1.3, -1.18], { color: '#bfe6f5' })
      .box([1.6, 0.06, 0.4], [-0.6, 0.6, -0.9], { color: '#b5814e', round: 0.3 });
    for (const x of [-1.65, 0.45]) b.stick([x, 0.15, -1.15], [x, 2.38, -1.15], 0.07, '#5c6166').stick([x, 0.15, -0.05], [x, 2.38, -0.05], 0.07, '#5c6166');
    b.box([0.04, 2.2, 1.1], [-1.65, 1.3, -0.6], { color: '#bfe6f5' });
    return b.socket('bench', [-0.6, 0.65, -0.9], 'seat').act({ click: [A.operate('sign', 'on'), A.say('Honk honk!', 1.4), A.wait(1.8), A.operate('sign', 'off')] }).done();
  }),
  // A cup of tea on a saucer (bone china, 14 cm): amber tea, a teaspoon in it, the teabag's string and tag hanging
  // over the rim. Stir: clink, clink; steam.
  e('tea', 'food', 'drinks', () =>
    m('tea')
      .cyl([0.15, 0.01, 0.15], [0, 0.005, 0], { color: 'white', edge: 'sharp' })
      .cyl([0.075, 0.06, 0.075], [0, 0.04, 0], { color: 'white', taper: 1.3 })
      .cyl([0.092, 0.004, 0.092], [0, 0.068, 0], { color: 'tea' })
      .torus([0.04, 0.045, 0.01], [0.055, 0.043, 0], { color: 'white', tube: 0.2 })
      .torus([0.098, 0.098, 0.004], [0, 0.07, 0], { color: 'gold', rot: [90, 0, 0], tube: 0.06, noInk: true })
      .rod([-0.03, 0.07, 0.01], [-0.05, 0.04, 0.035], 0.002, 'white')
      .label('TEA', [0.02, 0.018], [-0.05, 0.03, 0.04], { color: '#f6d24a', depth: 0.002 })
      .stick([0.01, 0.06, -0.01], [0.03, 0.12, -0.03], 0.005, 'silver', { name: 'spoon', pivot: [0.01, 0.06, -0.01], edge: 'sharp' })
      .act({ click: [A.par(A.pose('spoon', { rot: [0, 360, 0], dur: 0.8 }), A.say('Clink, clink.', 1.2)), A.pose('spoon', { rot: [0, 0, 0], dur: 0 }), A.effect('steam', { dur: 2 })] })
      .done(),
  ),
  // A teabag on its string over a glass mug of hot water (11 cm), the tag hanging over the rim. Dunk it and the
  // water brews to amber.
  e('teabag', 'food', 'drinks', () =>
    m('teabag')
      .cyl([0.08, 0.1, 0.08], [0, 0.05, 0], { color: '#d6f0fa' })
      .torus([0.045, 0.05, 0.01], [0.05, 0.05, 0], { color: '#d6f0fa', tube: 0.2 })
      .cyl([0.072, 0.07, 0.072], [0, 0.04, 0], { color: '#e8f4f8', name: 'water' })
      .cyl([0.074, 0.072, 0.074], [0, 0.04, 0], { color: '#c8873a', name: 'brew', scale: 0, pivot: [0, 0.005, 0] })
      .box([0.05, 0.06, 0.012], [0, 0.135, 0], { color: '#efe6cf', round: 0.3, name: 'bag', mover: { kind: 'slide', axis: 'y', amount: -0.07 } })
      .box([0.036, 0.04, 0.003], [0, 0.133, 0.006], { color: '#8a5a2a', parent: 'bag', noInk: true })
      .rod([0, 0.165, 0], [-0.04, 0.105, 0], 0.002, 'white', { parent: 'bag' })
      .label('TEA', [0.022, 0.022], [-0.05, 0.085, 0.004], { color: '#f6d24a', depth: 0.002 })
      .act({ click: [[A.operate('bag', 'on'), A.operate('bag', 'off'), A.operate('bag', 'on'), A.par(A.operate('bag', 'off'), A.pose('brew', { scale: 1, dur: 1.5 }), A.effect('steam', { dur: 1.5 }))], [A.pose('brew', { scale: 0, dur: 0.5 }), A.say('Splash.', 1)]] })
      .done(),
  ),
  // A tear-gas grenade (15 cm): an olive canister with a yellow band and CS stencil, a spoon lever and pull ring (a
  // piece). Pull the ring: it hisses out an acrid cloud.
  e('tear gas', 'armory', 'grenades', () =>
    m('tear gas')
      .cyl([0.06, 0.12, 0.06], [0, 0.06, 0], { color: '#5a6a3a', name: 'can' })
      .cyl([0.062, 0.02, 0.062], [0, 0.07, 0], { color: '#f6d24a', parent: 'can', noInk: true })
      .label('CS', [0.03, 0.02], [0, 0.04, 0.031], { color: '#5a6a3a', parent: 'can', depth: 0.002 })
      .cyl([0.034, 0.02, 0.034], [0, 0.13, 0], { color: '#9da3a8', parent: 'can', edge: 'sharp' })
      .box([0.012, 0.1, 0.014], [0.034, 0.095, 0], { color: '#9da3a8', parent: 'can', edge: 'sharp' })
      .torus([0.026, 0.026, 0.005], [-0.024, 0.14, 0], { color: 'silver', tube: 0.18, name: 'ring', parent: 'can', piece: true })
      .act({ click: [[A.detach('ring', 'ring'), A.par(A.effect('smoke', { dur: 3.5 }), A.say('Hissssss... cough, cough!', 2.5)), A.wait(2.5)], [A.reattach('ring')]] })
      .done(),
  ),
  // A classic jointed teddy bear (40 cm), sitting: honey plush with a pale muzzle, paw pads and ear linings, a
  // stitched nose and a red bow. Hug it: hearts. It squeaks.
  e('teddy bear', 'toys', 'stuffed toys', () => {
    const c = '#b07a45', l = '#e0b98a';
    const b = m('teddy bear')
      .ball([0.2, 0.22, 0.17], [0, 0.13, 0], { color: c, name: 'body' })
      .ball([0.12, 0.13, 0.05], [0, 0.12, 0.07], { color: l, parent: 'body' })
      .ball(0.16, [0, 0.3, 0.01], { color: c, name: 'head', parent: 'body', pivot: [0, 0.23, 0] })
      .ball([0.075, 0.055, 0.05], [0, 0.28, 0.08], { color: l, parent: 'head' })
      .ball(0.022, [0, 0.297, 0.105], { color: '#2a2726', parent: 'head' })
      .ball([0.04, 0.03, 0.025], [0.025, 0.225, 0.075], { color: '#c0302a', parent: 'body' })
      .ball([0.04, 0.03, 0.025], [-0.025, 0.225, 0.075], { color: '#c0302a', parent: 'body' })
      .ball(0.018, [0, 0.225, 0.085], { color: '#a02020', parent: 'body' });
    b.pair((s) => {
      b.ball(0.018, [s * 0.035, 0.325, 0.07], { color: '#2a2726', eye: true, parent: 'head' });
      b.ball([0.06, 0.06, 0.035], [s * 0.065, 0.37, 0], { color: c, parent: 'head' });
      b.ball([0.035, 0.035, 0.02], [s * 0.065, 0.37, 0.01], { color: l, parent: 'head' });
      b.rod([s * 0.09, 0.2, 0.02], [s * 0.13, 0.11, 0.08], 0.06, c, { parent: 'body' });
      b.rod([s * 0.06, 0.05, 0.03], [s * 0.08, 0.04, 0.14], 0.07, c, { parent: 'body' });
      b.ball([0.06, 0.06, 0.02], [s * 0.08, 0.04, 0.175], { color: l, parent: 'body' });
    });
    return b.act({ click: [[A.par(A.anim('wobble'), A.effect('hearts', { dur: 1.5 }), A.say('Squeak!', 1))], [A.pose('head', { rot: [0, 0, 20], dur: 0.4 }), A.say('Squeak!', 1), A.pose('head', { rot: [0, 0, 0], dur: 0.4 })]] }).done();
  }),
  // A golf ball (4.3 cm) on a wooden tee pushed into a square of turf. Fore! The ball flies off and a new one appears.
  e('tee', 'sports', 'golf', () =>
    m('tee')
      .box([0.14, 0.012, 0.14], [0, 0.006, 0], { color: '#5aa553', round: 0.3 })
      .stick([0, 0.01, 0], [0, 0.045, 0], 0.006, 'white')
      .cyl([0.014, 0.01, 0.014], [0, 0.049, 0], { color: 'white', taper: 2 })
      .ball(0.043, [0, 0.0755, 0], { color: 'white', name: 'ball' })
      .ball(0.005, [0.008, 0.083, 0.02], { color: '#d4d7da', parent: 'ball', noInk: true })
      .ball(0.005, [-0.01, 0.072, 0.019], { color: '#d4d7da', parent: 'ball', noInk: true })
      .act({ click: [A.pose('ball', { move: [0, 2, 6], dur: 0.6 }), A.say('Fore!', 1.2), A.pose('ball', { move: [0, 0, 0], scale: 0, dur: 0 }), A.pose('ball', { scale: 1, dur: 0.5 })] })
      .done(),
  ),
  // A dentist's model of the teeth (12 cm): upper and lower arches of white teeth in pink gums, hinged at the back so
  // the jaw opens and chatters shut.
  e('teeth', 'clinic', 'dental', () => {
    const b = m('teeth').box([0.12, 0.012, 0.1], [0, 0.006, -0.01], { color: '#5c6166', round: 0.3, edge: 'sharp' });
    b.arc([0.11, 0.1, 0.024], [0, 0.024, -0.012], { color: '#e8919a', rot: [-90, 0, 0], arc: 230, tube: 0.3, name: 'lower' });
    b.arc([0.11, 0.1, 0.024], [0, 0.082, -0.012], { color: '#e8919a', rot: [-90, 0, 0], arc: 230, tube: 0.3, name: 'upper', pivot: [0, 0.07, -0.07], mover: { kind: 'swing', axis: 'x', amount: -25 } });
    b.each(7, (i) => {
      const a = ((i - 3) * 23 * Math.PI) / 180, x = Math.sin(a) * 0.042, z = Math.cos(a) * 0.04 - 0.012;
      b.box([0.014, 0.02, 0.012], [x, 0.042, z], { color: 'white', rot: [0, a / D, 0], round: 0.4, parent: 'lower', edge: 'sharp' });
      b.box([0.015, 0.022, 0.012], [x, 0.063, z], { color: 'white', rot: [0, a / D, 0], round: 0.4, parent: 'upper', edge: 'sharp' });
    });
    return b.act({ click: [A.operate('upper', 'open'), A.operate('upper', 'close'), A.par(A.operate('upper', 'open'), A.say('Chatter, chatter!', 1.4)), A.operate('upper', 'close')] }).done();
  }),
  // An old telegraph pole (7 m): a tarred wooden pole with two crossarms full of green glass insulators carrying the
  // wires, iron climbing steps. The wires hum with Morse.
  e('telegraph', 'places', 'street things', () => {
    const b = m('telegraph').cyl([0.3, 7.0, 0.3], [0, 3.5, 0], { color: '#5a3a22', taper: 0.75 });
    for (const y of [6.6, 6.0]) {
      b.box([1.8, 0.12, 0.12], [0, y, 0], { color: '#7a5230', edge: 'sharp' });
      for (const x of [-0.8, -0.45, 0.45, 0.8]) {
        b.cyl([0.08, 0.12, 0.08], [x, y + 0.12, 0], { color: '#5fb39a', taper: 0.7 });
        b.stick([x, y + 0.17, -2.0], [x, y + 0.17, 2.0], 0.012, '#2a2726');
      }
    }
    b.each(6, (i) => b.stick([0, 2.0 + i * 0.6, 0], [(i % 2 ? 1 : -1) * 0.28, 2.0 + i * 0.6, 0], 0.03, 'iron'));
    b.box([0.2, 0.2, 0.02], [0, 2.2, 0.15], { color: '#c9ccd1', edge: 'sharp' });
    return b.act({ click: [A.par(A.say('Dit-dit-dah... dah-dit.', 2), A.anim('wobble'))] }).done();
  }),
  // A utility pole (10 m): a creosoted wooden pole with a crossarm of insulators and power lines, a grey transformer
  // can, a street lamp on an arm (a light), climbing steps and a pole tag. Hum.
  e('telephone pole', 'places', 'street things', () => {
    const b = m('telephone pole')
      .cyl([0.32, 10, 0.32], [0, 5, 0], { color: '#5a3a22', taper: 0.7 })
      .box([2.2, 0.15, 0.15], [0, 9.6, 0], { color: '#7a5230', edge: 'sharp' })
      .cyl([0.55, 0.9, 0.55], [0, 8.1, 0.35], { color: '#9da3a8', edge: 'sharp' })
      .cyl([0.58, 0.08, 0.58], [0, 8.6, 0.35], { color: '#5c6166', edge: 'sharp' })
      .rod([0, 7.0, 0.1], [0.0, 7.4, 1.6], 0.07, '#9da3a8', { edge: 'sharp' })
      .box([0.5, 0.15, 0.25], [0, 7.35, 1.75], { color: '#5c6166', edge: 'sharp' })
      .box([0.4, 0.04, 0.2], [0, 7.27, 1.75], { color: '#fff3c0', name: 'lamp', mover: { kind: 'light', on: false } })
      .box([0.12, 0.18, 0.02], [0, 1.8, 0.16], { color: 'silver', edge: 'sharp' });
    for (const x of [-0.95, -0.35, 0.35, 0.95]) {
      b.cyl([0.1, 0.16, 0.1], [x, 9.76, 0], { color: '#e8e4dc' });
      b.stick([x, 9.84, -2.5], [x, 9.84, 2.5], 0.022, '#2a2726');
    }
    b.stick([0.3, 6.4, -2.5], [0.3, 6.4, 2.5], 0.03, '#2a2726');
    b.each(8, (i) => b.stick([0, 2.4 + i * 0.6, 0], [(i % 2 ? 1 : -1) * 0.3, 2.4 + i * 0.6, 0], 0.03, 'iron'));
    return b.act({ click: [[A.operate('lamp', 'on'), A.say('Bzzzz... hmmm.', 1.6)], [A.operate('lamp', 'off'), A.say('Click.', 1)]] }).done();
  }),
  // An amateur refracting telescope (1.5 m) on an equatorial mount and wooden tripod: a white tube with a dew shield,
  // a finder scope, the eyepiece, a counterweight. It swings up to the night sky.
  e('telescope', 'study', 'optics', () => {
    const b = m('telescope', { edge: 'sharp' })
      .cyl([0.12, 0.1, 0.12], [0, 1.0, 0], { color: '#5c6166' })
      .box([0.12, 0.12, 0.14], [0, 1.1, 0], { color: '#9da3a8', round: 0.3, name: 'mount' })
      .stick([0, 1.1, -0.05], [0, 0.85, -0.22], 0.02, 'silver', { parent: 'mount' })
      .cyl([0.12, 0.08, 0.12], [0, 0.82, -0.25], { color: '#5c6166', parent: 'mount' })
      .cyl([0.14, 1.0, 0.14], [0, 1.25, 0.05], { color: 'white', rot: [50, 0, 0], name: 'tube', parent: 'mount', pivot: [0, 1.2, 0], edge: 'soft' })
      .cyl([0.17, 0.2, 0.17], [0, 1.25 + 0.48 * Math.sin(40 * D), 0.05 + 0.48 * Math.cos(40 * D)], { color: '#2a2726', rot: [50, 0, 0], parent: 'tube' })
      .cyl([0.13, 0.01, 0.13], [0, 1.25 + 0.58 * Math.sin(40 * D), 0.05 + 0.58 * Math.cos(40 * D)], { color: '#3d5a73', rot: [50, 0, 0], parent: 'tube' })
      .cyl([0.04, 0.24, 0.04], [0.09, 1.3 + 0.2 * Math.sin(40 * D), 0.05 + 0.2 * Math.cos(40 * D)], { color: '#2a2726', rot: [50, 0, 0], parent: 'tube' })
      .cyl([0.05, 0.1, 0.05], [0, 1.25 - 0.54 * Math.sin(40 * D), 0.05 - 0.54 * Math.cos(40 * D)], { color: '#2a2726', rot: [50, 0, 0], parent: 'tube' })
      .cyl([0.04, 0.08, 0.04], [0, 1.25 - 0.6 * Math.sin(40 * D) + 0.05, 0.05 - 0.6 * Math.cos(40 * D)], { color: '#3a3633', parent: 'tube' });
    for (const [x, z] of around(3, 0.5, Math.PI / 2)) b.rod([x * 0.12, 0.98, z * 0.12], [x, 0, z], 0.04, 'wood', { edge: 'soft' });
    b.cyl([0.3, 0.02, 0.3], [0, 0.4, 0], { color: 'wood', segs: 3 });
    return b.act({ click: [[A.pose('tube', { rot: [-30, 0, 0], dur: 1.2 }), A.effect('sparkle', { dur: 2 }), A.say('Twinkle, twinkle...', 1.6)], [A.pose('tube', { rot: [0, 0, 0], dur: 1 })]] }).done();
  }),
  // A Greek temple (17 m wide, 11 m high): three marble steps, a peristyle of fluted columns with capitals, an
  // entablature with a frieze, a pediment with a sculpted group, bronze doors in the cella wall (they open) and two
  // fire bowls (lights) before the steps.
  e('temple', 'places', 'places of worship', () => {
    const mb = '#f2eee2', sh = '#ddd6c4';
    const b = m('temple', { edge: 'sharp' })
      .box([17, 0.45, 11], [0, 0.225, 0], { color: sh, round: 0.02 })
      .box([16.2, 0.45, 10.2], [0, 0.675, 0], { color: mb, round: 0.02 })
      .box([15.4, 0.45, 9.4], [0, 1.125, 0], { color: sh, round: 0.02 })
      .box([10, 6.2, 5.4], [0, 4.45, -0.6], { color: '#e6dfcc', round: 0.01 })
      .box([15.6, 0.7, 9.6], [0, 8.05, 0], { color: mb, round: 0.02 })
      .box([15.7, 0.7, 9.7], [0, 8.75, 0], { color: sh, round: 0.02 })
      .wedge([15.8, 2.4, 9.8], [0, 10.3, 0], { color: mb, rot: [0, 0, 0] })
      .wedge([12.8, 1.6, 0.2], [0, 10.0, 4.86], { color: sh })
      .box([2.2, 4.0, 0.12], [-1.1, 3.35, 2.18], { color: '#b0804a', name: 'doorR', pivot: [-2.2, 3.35, 2.2], mover: { kind: 'swing', axis: 'y', amount: -95 } })
      .box([2.2, 4.0, 0.12], [1.1, 3.35, 2.18], { color: '#b0804a', name: 'doorL', pivot: [2.2, 3.35, 2.2], mover: { kind: 'swing', axis: 'y', amount: 95 } });
    b.each(6, (i) => b.ball([0.8, 0.9, 0.3], [-2.5 + i, 9.9 - Math.abs(i - 2.5) * 0.25, 4.95], { color: '#e6dfcc' }));
    b.each(8, (i) => {
      const x = -7.0 + i * 2.0;
      for (const z of [4.2, -4.2]) {
        b.cyl([1.0, 6.2, 1.0], [x, 4.45, z], { color: mb, segs: 16, taper: 0.88 });
        b.box([1.3, 0.35, 1.3], [x, 7.6, z], { color: sh, round: 0.2 });
      }
      b.box([0.9, 0.5, 0.06], [x + 1.0, 8.05, 4.83], { color: '#b8c8d8', noInk: true });
    });
    b.each(3, (i) => b.pair((s) => b.cyl([1.0, 6.2, 1.0], [s * 7.0, 4.45, 2.1 - i * 2.1], { color: mb, segs: 16, taper: 0.88 }).box([1.3, 0.35, 1.3], [s * 7.0, 7.6, 2.1 - i * 2.1], { color: sh, round: 0.2 })));
    b.pair((s) => {
      b.cyl([0.3, 1.2, 0.3], [s * 3.2, 0.6, 6.4], { color: '#9a9a92' });
      b.cyl([0.9, 0.3, 0.9], [s * 3.2, 1.35, 6.4], { color: 'bronze', taper: 1.4 });
      b.cone([0.6, 0.8, 0.6], [s * 3.2, 1.9, 6.4], { color: '#ff8a2a', name: `fire${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: false } });
    });
    return b
      .act({ click: [[A.par(A.operate('fires', 'on'), A.operate('doors', 'open')), A.effect('sparkle', { dur: 2 }), A.wait(2), A.operate('doors', 'close')], [A.operate('fires', 'off'), A.effect('smoke', { dur: 1.5 })]] })
      .done();
  }),
  // A meat tenderiser mallet (30 cm) standing on its handle: a cast aluminium head with a waffle face of pyramids on
  // each end, a beech handle. Thwack, thwack.
  e('tenderizer', 'kitchen', 'utensils', () => {
    const b = m('tenderizer', { edge: 'sharp' })
      .cyl([0.032, 0.2, 0.026], [0, 0.1, 0], { color: '#d8b07a', name: 'mallet', edge: 'soft' })
      .cyl([0.034, 0.02, 0.028], [0, 0.005, 0], { color: '#b5814e', parent: 'mallet', edge: 'soft' })
      .box([0.1, 0.055, 0.055], [0, 0.23, 0], { color: '#c9ccd1', round: 0.12, parent: 'mallet' });
    b.pair((s) => {
      for (const [y, z] of [[0.216, 0.013], [0.216, -0.013], [0.244, 0.013], [0.244, -0.013]]) b.pyramid([0.012, 0.012, 0.012], [s * 0.056, y, z], 4, { color: '#9da3a8', rot: [0, 0, -s * 90], parent: 'mallet' });
    });
    return b.act({ click: [A.par(A.pose('mallet', { move: [0, 0.08, 0], rot: [0, 0, 30], dur: 0.25, times: 2 }), A.say('Thwack! Thwack!', 1.4))] }).done();
  }),
  // A tennis ball (6.7 cm): fuzzy optic yellow felt with the white curving seam. Thok!
  e('tennis ball', 'sports', 'balls', () =>
    m('tennis ball')
      .ball(0.067, [0, 0.0335, 0], { color: '#d4e84a' })
      .torus([0.068, 0.068, 0.004], [0, 0.0335, 0], { color: 'white', tube: 0.06, rot: [20, 30, 0], noInk: true })
      .torus([0.068, 0.068, 0.004], [0, 0.0335, 0], { color: 'white', tube: 0.06, rot: [70, -30, 0], noInk: true })
      .act({ click: [[A.par(A.anim('bounce', 2), A.say('Thok!', 0.8))], [A.anim('spin')]] })
      .done(),
  ),
  // A doubles tennis court at its real size (23.8 x 11 m inside 36 x 18 m of run-off): blue hard court in green, white
  // lines, the net between its posts, an umpire's high chair and players' benches. A rally goes back and forth.
  e('tennis court', 'places', 'sports venues', () => {
    const b = m('tennis court', { edge: 'sharp' })
      .box([18, 0.06, 36], [0, 0.03, 0], { color: '#3f8f5a' })
      .box([10.97, 0.02, 23.77], [0, 0.07, 0], { color: '#2f6fb0' })
      .box([10.97, 0.9, 0.04], [0, 0.52, 0], { color: '#2a2726' })
      .box([11.0, 0.07, 0.06], [0, 0.95, 0], { color: 'white' })
      .ball(0.07, [0, 1.0, 9], { color: '#d4e84a', name: 'ball' });
    b.pair((s) => {
      b.box([0.06, 0.006, 23.77], [s * 5.485, 0.083, 0], { color: 'white', noInk: true });
      b.box([0.06, 0.006, 23.77], [s * 4.115, 0.083, 0], { color: 'white', noInk: true });
      b.box([10.97, 0.006, 0.06], [0, 0.083, s * 11.885], { color: 'white', noInk: true });
      b.box([8.23, 0.006, 0.06], [0, 0.083, s * 6.4], { color: 'white', noInk: true });
      b.box([0.06, 0.006, 6.4], [0, 0.083, s * 3.2], { color: 'white', noInk: true });
      b.stick([s * 5.6, 0, 0], [s * 5.6, 1.07, 0], 0.1, '#3a3633');
      b.box([2.0, 0.45, 0.45], [s * 7.5, 0.45, s * 2.5], { color: '#b5814e', round: 0.2 });
    });
    b.stick([-6.6, 0, -0.5], [-6.6, 1.8, -0.5], 0.06, '#9da3a8').stick([-6.6, 0, 0.5], [-6.6, 1.8, 0.5], 0.06, '#9da3a8').stick([-7.2, 0, -0.5], [-7.2, 1.8, -0.5], 0.06, '#9da3a8').stick([-7.2, 0, 0.5], [-7.2, 1.8, 0.5], 0.06, '#9da3a8')
      .box([0.8, 0.1, 1.1], [-6.9, 1.85, 0], { color: '#2f6a3a' })
      .box([0.7, 0.8, 0.1], [-7.2, 2.3, 0], { color: '#2f6a3a' });
    return b
      .socket('umpire', [-6.9, 1.9, 0], 'seat')
      .act({ click: [A.pose('ball', { move: [0, 0.5, -18], dur: 0.9 }), A.say('Thok!', 0.6), A.pose('ball', { move: [0, 0, 0], dur: 0.9 }), A.say('Thok!', 0.6), A.pose('ball', { move: [2, 0.3, -18], dur: 0.9 }), A.par(A.say('Out!', 1), A.pose('ball', { move: [0, 0, 0], dur: 0.6 }))] })
      .done();
  }),
  // A tennis net at its real size (12.8 m between posts, 1.07 m high at the posts, 0.91 m in the middle): black mesh,
  // a white headband and centre strap, green posts with their winding crank. A ball hits the tape: thwip.
  e('tennis net', 'sports', 'tennis', () => {
    const b = m('tennis net', { edge: 'sharp' })
      .box([12.8, 0.95, 0.02], [0, 0.55, 0], { color: '#2a2726', name: 'net', pivot: [0, 1.0, 0] })
      .box([12.8, 0.07, 0.04], [0, 1.0, 0], { color: 'white', parent: 'net' })
      .box([0.05, 0.9, 0.03], [0, 0.48, 0], { color: 'white', parent: 'net' })
      .box([0.1, 0.1, 0.1], [0, 0.03, 0], { color: '#5c6166' });
    b.each(24, (i) => b.box([0.012, 0.9, 0.024], [-6.0 + i * 0.52, 0.55, 0], { color: '#5c6166', parent: 'net', noInk: true }));
    b.each(5, (i) => b.box([12.7, 0.012, 0.024], [0, 0.18 + i * 0.16, 0], { color: '#5c6166', parent: 'net', noInk: true }));
    b.pair((s) => {
      b.stick([s * 6.45, 0, 0], [s * 6.45, 1.07, 0], 0.08, '#2f6a3a');
      b.box([0.06, 0.12, 0.12], [s * 6.5, 0.4, 0], { color: '#2f6a3a' });
    });
    return b.act({ click: [A.pose('net', { rot: [10, 0, 0], dur: 0.15, times: 2 }), A.say('Thwip! Let!', 1.2)] }).done();
  }),
  // A two-person dome tent (1.3 m high, 2.1 m floor): green fly sheet over two crossed poles, a zipped door that rolls
  // up, guy lines to pegs, a groundsheet edge.
  e('tent', 'sports', 'camping gear', () => {
    const b = m('tent')
      .box([2.3, 0.02, 2.3], [0, 0.01, 0], { color: '#3a4a3a', edge: 'sharp' })
      .dome([2.2, 1.3, 2.1], [0, 0.65, 0], { color: '#3f8f5a' })
      .dome([2.0, 1.25, 1.9], [0, 0.63, 0.06], { color: '#f0923b' })
      .box([0.8, 1.0, 0.06], [0, 0.52, 0.93], { color: '#2a2726', round: 0.6, rot: [-12, 0, 0] })
      .box([0.86, 1.05, 0.04], [0, 0.55, 0.98], { color: '#3f8f5a', round: 0.6, rot: [-12, 0, 0], name: 'door', pivot: [0, 1.05, 0.88], mover: { kind: 'swing', axis: 'x', amount: -90 } })
      .stick([0, 0.05, 0.98], [0, 1.0, 0.88], 0.01, 'silver', { parent: 'door', noInk: true });
    b.pair((s) => {
      b.arc([2.6, 2.6, 0.03], [0, 0.0, 0], { color: '#5c6166', rot: [0, s * 45, 0], tube: 0.02 });
      b.rod([s * 1.0, 0.5, 0.5], [s * 1.6, 0.02, 0.9], 0.01, 'tan');
      b.rod([s * 1.0, 0.5, -0.5], [s * 1.6, 0.02, -0.9], 0.01, 'tan');
      b.cone([0.03, 0.08, 0.03], [s * 1.6, 0.04, 0.9], { color: 'silver', rot: [180, 0, 0] });
      b.cone([0.03, 0.08, 0.03], [s * 1.6, 0.04, -0.9], { color: 'silver', rot: [180, 0, 0] });
    });
    return b.socket('inside', [0, 0.1, 0], 'inside', { size: 1.5 }).act({ click: [[A.operate('door', 'open'), A.say('Zzzzip!', 1.2)], [A.operate('door', 'close'), A.say('Zzzzip!', 1.2)]] }).done();
  }),
  // An octopus tentacle (50 cm) rising from the sea bed: tapering purple in three jointed sections with rows of pale
  // suckers, the tip curled. It curls and uncurls.
  e('tentacle', 'sea', 'sea creatures', () => {
    const c = '#8a4fb8';
    const b = m('tentacle')
      .ball([0.2, 0.06, 0.16], [0, 0.02, 0], { color: 'sand' })
      .capsule([0.09, 0.2, 0.08], [0.01, 0.1, 0], { color: c, rot: [0, 0, -8], name: 'base', pivot: [0, 0.02, 0] })
      .capsule([0.07, 0.18, 0.065], [0.04, 0.26, 0], { color: c, rot: [0, 0, -20], name: 'mid', parent: 'base', pivot: [0.025, 0.18, 0] })
      .capsule([0.05, 0.12, 0.045], [0.06, 0.39, 0], { color: c, rot: [0, 0, 20], name: 'tip', parent: 'mid', pivot: [0.06, 0.33, 0] })
      .ball(0.035, [0.03, 0.46, 0], { color: c, parent: 'tip' });
    for (const [p, y, x, d] of [['base', 0.06, 0.0, 0.03], ['base', 0.12, 0.012, 0.028], ['mid', 0.2, 0.025, 0.024], ['mid', 0.27, 0.045, 0.022], ['tip', 0.35, 0.065, 0.018], ['tip', 0.41, 0.06, 0.015]] as const) b.cyl([d, 0.006, d], [x, y, 0.036 - (y - 0.06) * 0.035], { color: '#f0c8e0', rot: [90, 0, 0], parent: p, noInk: true });
    return b
      .act({ click: [A.par(A.pose('mid', { rot: [0, 0, 35], dur: 0.5, times: 2 }), A.pose('tip', { rot: [0, 0, 50], dur: 0.5, times: 2 }), A.pose('base', { rot: [0, 0, -12], dur: 0.5, times: 2 })), A.effect('water_spray', { dur: 0.8 })] })
      .done();
  }),
  // A tipi (5 m): a cone of painted canvas over a frame of long poles crossing at the top, two smoke flaps, lacing pins
  // up the front, a door flap that lifts, pegs round the hem. Smoke drifts from the top.
  e('tepee', 'places', 'homes', () => {
    const b = m('tepee')
      .cone([4.2, 4.6, 4.2], [0, 2.3, 0], { color: '#e8d4a8' })
      .torus([3.0, 3.0, 0.3], [0, 1.15, 0], { color: '#c0392b', rot: [90, 0, 0], tube: 0.04, noInk: true })
      .torus([2.56, 2.56, 0.18], [0, 1.65, 0], { color: '#2f4f8f', rot: [90, 0, 0], tube: 0.05, noInk: true })
      .torus([1.2, 1.2, 0.2], [0, 3.3, 0], { color: '#c0392b', rot: [90, 0, 0], tube: 0.08, noInk: true })
      .wedge([1.0, 1.4, 0.05], [0, 0.7, 1.72], { color: '#a8865a', rot: [-24, 0, 0], name: 'door', pivot: [0, 1.4, 1.42], mover: { kind: 'swing', axis: 'x', amount: -70 } });
    for (const [x, z] of around(7, 0.4)) b.rod([0, 4.0, 0], [x * 2.2, 5.6, z * 2.2], 0.08, 'darkwood');
    b.pair((s) => b.wedge([0.9, 1.4, 0.05], [s * 0.45, 3.9, 0.52], { color: '#d4be92', rot: [-20, 0, s * 15] }));
    b.each(4, (i) => b.stick([-0.06, 1.8 + i * 0.5, 1.7 - i * 0.18 - 0.0], [0.06, 1.8 + i * 0.5, 1.7 - i * 0.18], 0.025, 'darkwood'));
    for (const [x, z] of around(10, 2.15)) b.cone([0.06, 0.15, 0.06], [x, 0.05, z], { color: 'darkwood', rot: [180, 0, 0] });
    return b.act({ click: [[A.operate('door', 'open'), A.par(A.effect('smoke', { dur: 3 }), A.say('Crackle, crackle...', 1.8)), A.wait(1.5), A.operate('door', 'close')]] }).done();
  }),
  // A rack of three test tubes (15 cm) in a wooden stand: lime, red and blue liquids, one corked. The reaction fizzes
  // and bubbles over.
  e('test tube', 'study', 'lab', () => {
    const b = m('test tube', { edge: 'sharp' })
      .box([0.15, 0.02, 0.05], [0, 0.01, 0], { color: 'wood' })
      .box([0.15, 0.015, 0.05], [0, 0.08, 0], { color: 'wood' });
    b.pair((s) => b.box([0.015, 0.08, 0.05], [s * 0.07, 0.045, 0], { color: 'wood' }));
    const cols = ['#9be34d', '#e0302a', '#4ec0ff'];
    b.each(3, (i) => {
      const x = (i - 1) * 0.04;
      b.cyl([0.016, 0.12, 0.016], [x, 0.09, 0], { color: '#e8f6fb', edge: 'soft' });
      b.cyl([0.017, 0.05, 0.017], [x, 0.06, 0], { color: cols[i], edge: 'soft' });
      b.ball(0.016, [x, 0.03, 0], { color: cols[i], edge: 'soft' });
    });
    b.cyl([0.016, 0.018, 0.016], [0.04, 0.155, 0], { color: '#b5814e', taper: 1.2 });
    b.ball(0.03, [-0.04, 0.16, 0], { color: '#c8f08a', name: 'froth', scale: 0, edge: 'soft' });
    return b.act({ click: [A.par(A.pose('froth', { scale: 1, dur: 0.6 }), A.effect('smoke', { dur: 1.5 }), A.anim('shake', 2), A.say('Fizz... bubble... POP!', 1.8)), A.wait(0.6), A.pose('froth', { scale: 0, dur: 0.5 })] }).done();
  }),
  // A playground tetherball (a 3 m pole in a concrete base; the vocabulary's 66 cm is far too small): the yellow ball on its rope from the top swings round and
  // round the pole when hit.
  e('tetherball', 'sports', 'playground games', () =>
    m('tetherball')
      .cyl([0.5, 0.15, 0.5], [0, 0.075, 0], { color: 'stone', edge: 'sharp' })
      .stick([0, 0.15, 0], [0, 3.0, 0], 0.07, 'silver', { edge: 'sharp' })
      .ball(0.08, [0, 3.02, 0], { color: 'silver' })
      .rod([0, 2.95, 0], [0.55, 1.7, 0.2], 0.015, 'white', { name: 'tether', pivot: [0, 2.95, 0], mover: { kind: 'spin', axis: 'y', amount: 540 } })
      .ball(0.24, [0.62, 1.6, 0.23], { color: '#f6d24a', parent: 'tether' })
      .torus([0.245, 0.245, 0.01], [0.62, 1.6, 0.23], { color: '#e0473b', parent: 'tether', tube: 0.04, noInk: true })
      .act({ click: [A.operate('tether', 'on'), A.say('Whap!', 1), A.wait(2), A.operate('tether', 'off'), A.say('Whap!', 1)] })
      .done(),
  ),
  // A hardback maths textbook (28 cm) standing up: a blue cover with a big yellow pi, gold title, a thick block of
  // pages. The cover swings open.
  e('textbook', 'study', 'books', () =>
    m('textbook', { edge: 'sharp' })
      .box([0.2, 0.27, 0.044], [0.006, 0.14, 0], { color: 'paper', round: 0.05 })
      .box([0.012, 0.28, 0.05], [-0.1, 0.14, 0], { color: '#2f4f8f', round: 0.3 })
      .box([0.21, 0.28, 0.005], [0.0, 0.14, -0.024], { color: '#2f4f8f', round: 0.2 })
      .box([0.21, 0.28, 0.005], [0.0, 0.14, 0.024], { color: '#2f4f8f', round: 0.2, name: 'cover', pivot: [-0.1, 0.14, 0.024], mover: { kind: 'swing', axis: 'y', amount: -150 } })
      .label('MATH', [0.16, 0.05], [0.0, 0.22, 0.028], { color: '#2f4f8f', parent: 'cover', depth: 0.002 })
      .label('pi', [0.06, 0.06], [0.0, 0.12, 0.028], { color: '#f6d24a', parent: 'cover', depth: 0.002 })
      .act({ click: [[A.operate('cover', 'open'), A.say('Flip, flip, flip.', 1.2)], [A.operate('cover', 'close'), A.say('Thump.', 1)]] })
      .done(),
  ),
  // A theatre (12 m front, 11 m high): a classical facade with columns and a cornice, a marquee canopy ringed with
  // chaser bulbs (lights) and NOW SHOWING, a tall blade sign, poster cases and glass entrance doors that open.
  e('theater', 'places', 'venues', () => {
    const b = m('theater', { edge: 'sharp' })
      .box([12, 10, 10], [0, 5, -1], { color: '#e8d8bc', round: 0.01 })
      .box([12.4, 0.6, 10.4], [0, 10.2, -1], { color: '#c9a46a', round: 0.1 })
      .box([12, 1.0, 0.6], [0, 9.3, 4.2], { color: '#c9a46a', round: 0.1 })
      .box([9, 1.4, 2.6], [0, 4.0, 5.2], { color: '#2a2726', round: 0.1 })
      .label('NOW SHOWING', [7.8, 0.9], [0, 4.0, 6.52], { color: '#2a2726', depth: 0.05 })
      .box([1.0, 6.0, 0.5], [4.9, 6.6, 4.6], { color: '#c0392b', round: 0.2 })
      .label('THEATER', [0.8, 5.4], [4.9, 6.6, 4.86], { color: '#c0392b', depth: 0.03 })
      .box([6.0, 3.0, 0.12], [0, 1.6, 3.9], { color: '#2a2726' });
    b.each(4, (i) => b.box([1.3, 2.6, 0.1], [-2.1 + i * 1.4, 1.5, 4.0], { color: '#9fd0ea', ...(i === 1 ? { name: 'door', pivot: [-1.35, 1.5, 4.02], mover: { kind: 'swing', axis: 'y', amount: -80 } } : {}) }));
    b.each(12, (i) => b.ball(0.22, [-4.1 + i * 0.745, 3.25, 6.5], { color: '#ffe066', name: `bulb${i}`, mover: { kind: 'light', on: false } }));
    b.pair((s) => {
      b.box([1.0, 1.6, 0.15], [s * 4.6, 1.5, 4.05], { color: '#f6d24a', round: 0.1 });
      b.box([0.8, 1.3, 0.04], [s * 4.6, 1.5, 4.13], { color: s > 0 ? '#8a5fc4' : '#3fa7a0' });
      b.each(2, (i) => b.cyl([0.7, 4.6, 0.7], [s * (3.3 + i * 1.6), 6.6, 4.0], { color: '#f2eee2', segs: 14 }));
      b.each(2, (i) => b.box([1.2, 1.8, 0.1], [s * (1.6 + i * 2.0), 7.0, 4.0], { color: '#9fd0ea' }));
      b.stick([s * 4.2, 3.3, 6.3], [s * 4.2, 7.0, 4.2], 0.06, '#5c6166');
    });
    return b
      .act({ click: [[A.operate('bulbs', 'on'), A.par(A.effect('sparkle', { dur: 2 }), A.operate('door', 'open'), A.say('Ta-da-daaa!', 1.8)), A.wait(2), A.operate('door', 'close')], [A.operate('bulbs', 'off'), A.say('Shhh...', 1)]] })
      .done();
  }),
  // A steel vacuum flask (30 cm): brushed body with a carry handle, a grippy band, a stopper and the red cup-lid on
  // top (a piece) that comes off with a puff of steam.
  e('thermos', 'kitchen', 'drinkware', () =>
    m('thermos')
      .cyl([0.08, 0.22, 0.08], [0, 0.11, 0], { color: '#9aa3ac', name: 'flask' })
      .cyl([0.082, 0.02, 0.082], [0, 0.01, 0], { color: '#2a2726', parent: 'flask' })
      .cyl([0.083, 0.05, 0.083], [0, 0.12, 0], { color: '#5c6166', parent: 'flask', noInk: true })
      .cyl([0.05, 0.02, 0.05], [0, 0.23, 0], { color: '#2a2726', parent: 'flask' })
      .arc([0.06, 0.14, 0.02], [0.045, 0.13, 0], { color: '#2a2726', rot: [0, 0, -90], tube: 0.25, parent: 'flask' })
      .cyl([0.086, 0.065, 0.086], [0, 0.26, 0], { color: '#c0392b', taper: 1.06, name: 'lid', parent: 'flask', piece: true, edge: 'sharp' })
      .act({ click: [[A.detach('lid', 'cup'), A.effect('steam', { dur: 2 })], [A.reattach('lid'), A.say('Squeak.', 1)]] })
      .done(),
  ),
  // A round wall thermostat (12 cm) on its plate: a silver bezel dial that turns and a glowing amber readout.
  e('thermostat', 'home', 'electrical', () =>
    m('thermostat', { edge: 'sharp' })
      .box([0.12, 0.12, 0.012], [0, 0.06, -0.02], { color: '#efe8d8', round: 0.3 })
      .cyl([0.1, 0.03, 0.1], [0, 0.06, 0], { color: 'white', rot: [90, 0, 0] })
      .torus([0.105, 0.105, 0.024], [0, 0.06, 0.006], { color: 'silver', tube: 0.15, name: 'dial' })
      .box([0.008, 0.012, 0.006], [0, 0.104, 0.016], { color: '#2a2726', parent: 'dial' })
      .cyl([0.06, 0.004, 0.06], [0, 0.06, 0.016], { color: '#ffb02a', rot: [90, 0, 0], name: 'display', mover: { kind: 'light', on: false } })
      .label('21', [0.03, 0.02], [0, 0.06, 0.019], { color: '#ffb02a', parent: 'display', depth: 0.001 })
      .act({ click: [[A.pose('dial', { rot: [0, 0, -60], dur: 0.6 }), A.operate('display', 'on'), A.say('Click... whoosh.', 1.4)], [A.pose('dial', { rot: [0, 0, 0], dur: 0.6 }), A.operate('display', 'off'), A.say('Click.', 1)]] })
      .done(),
  ),
  // A silver sewing thimble (2 cm, dimpled) beside a spool of red thread and a needle. It taps: tink, tink.
  e('thimble', 'home', 'sewing', () => {
    const b = m('thimble', { edge: 'sharp' })
      .cyl([0.019, 0.022, 0.019], [0, 0.011, 0], { color: 'silver', taper: 0.85, name: 'thimble' })
      .dome([0.016, 0.006, 0.016], [0, 0.025, 0], { color: 'silver', parent: 'thimble' })
      .cyl([0.022, 0.003, 0.022], [0, 0.0015, 0], { color: '#d4d7da', parent: 'thimble' })
      .cyl([0.022, 0.026, 0.022], [0.035, 0.015, 0], { color: '#c0302a', edge: 'soft' })
      .cyl([0.028, 0.004, 0.028], [0.035, 0.002, 0], { color: 'wood' })
      .cyl([0.028, 0.004, 0.028], [0.035, 0.028, 0], { color: 'wood' })
      .stick([-0.035, 0.0015, 0.02], [0.015, 0.0015, 0.03], 0.0015, 'silver');
    b.each(6, (i) => b.ball(0.0025, [-0.005 + (i % 3) * 0.005, 0.008 + Math.floor(i / 3) * 0.007, 0.0095], { color: '#9da3a8', parent: 'thimble', noInk: true }));
    return b.act({ click: [A.pose('thimble', { move: [0, 0.01, 0], dur: 0.12, times: 2 }), A.say('Tink, tink.', 1)] }).done();
  }),
  // A pair of flip-flops (26 cm): blue foam soles with a paler footbed and yellow Y straps through the toe post. They
  // slap along: flip-flop.
  e('thong', 'wardrobe', 'shoes', () => {
    const b = m('thong');
    b.pair((s) => {
      const x = s * 0.065, n = s > 0 ? 'flipL' : 'flipR';
      b.box([0.09, 0.02, 0.26], [x, 0.01, 0], { color: '#2f6fd6', round: 0.8, name: n, pivot: [x, 0, -0.12] })
        .box([0.084, 0.006, 0.25], [x, 0.021, 0], { color: '#a8d8f5', round: 0.8, parent: n });
      for (const k of [-1, 1]) {
        b.rod([x, 0.024, 0.07], [x + k * 0.035, 0.04, 0.0], 0.008, '#f6d24a', { parent: n });
        b.rod([x + k * 0.035, 0.04, 0.0], [x + k * 0.042, 0.022, -0.03], 0.008, '#f6d24a', { parent: n });
      }
    });
    return b.act({ click: [A.pose('flipL', { rot: [-20, 0, 0], dur: 0.15, times: 2 }), A.pose('flipR', { rot: [-20, 0, 0], dur: 0.15, times: 2 }), A.say('Flip-flop, flip-flop.', 1.4)] }).done();
  }),
  // A thorn at close range: a green rose stem (10 cm) in a crumb of soil, three hooked red-brown thorns. Prick!
  e('thorn', 'garden', 'plant parts', () =>
    m('thorn')
      .ball([0.05, 0.02, 0.04], [0, 0.008, 0], { color: 'dirt' })
      .cyl([0.012, 0.1, 0.012], [0, 0.05, 0], { color: '#3f7a3a' })
      .cone([0.012, 0.028, 0.008], [0.014, 0.035, 0], { color: '#8a3a2a', rot: [0, 0, -65] })
      .cone([0.012, 0.028, 0.008], [-0.014, 0.06, 0], { color: '#8a3a2a', rot: [0, 0, 65] })
      .cone([0.012, 0.028, 0.008], [0, 0.085, 0.014], { color: '#8a3a2a', rot: [65, 0, 0] })
      .ball([0.03, 0.01, 0.015], [0.012, 0.1, 0], { color: 'leaf', rot: [0, 0, 30] })
      .act({ click: [A.par(A.anim('shake'), A.say('Prick!', 1))] })
      .done(),
  ),
  // A bramble (1.5 m wide): arching thorny canes and dense leaves dotted with blackberries, some still red. They ripen.
  e('thorn bush', 'garden', 'shrubs', () => {
    const b = m('thorn bush')
      .ball([1.2, 0.85, 1.0], [0, 0.45, 0], { color: '#2f6a2a' })
      .ball([0.8, 0.65, 0.7], [0.5, 0.4, 0.1], { color: '#3f7a3a' })
      .ball([0.7, 0.6, 0.6], [-0.5, 0.45, 0.05], { color: '#356a32' })
      .ball([0.6, 0.5, 0.6], [0, 0.88, 0], { color: '#3f7a3a' });
    for (const [a, c] of [[[-0.3, 0.1, 0.3], [-0.85, 0.95, 0.35]], [[0.3, 0.1, 0.3], [0.9, 1.05, 0.2]], [[0, 0.2, -0.3], [0.2, 1.2, -0.5]]] as Array<[V, V]>) {
      b.rod(a, c, 0.035, '#7a2a3a');
      for (let k = 1; k <= 3; k++) {
        const t = k / 4, p: V = [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t];
        b.cone([0.03, 0.06, 0.03], [p[0], p[1] + 0.03, p[2]], { color: '#7a2a3a', rot: [0, 0, k % 2 ? 50 : -50] });
      }
    }
    const berries: V[] = [[0.25, 0.65, 0.48], [-0.2, 0.55, 0.5], [0.5, 0.4, 0.45], [-0.45, 0.75, 0.33], [0.05, 0.98, 0.28], [0.35, 0.88, 0.32]];
    berries.forEach((p, i) => {
      b.ball(0.06, p, { color: i % 3 ? '#e0302a' : '#2a1a3a' });
      if (i % 3) b.ball(0.066, p, { color: '#2a1a3a', name: `berry${i}`, scale: 0 });
    });
    return b.act({ click: [[A.par(A.pose('berry1', { scale: 1, dur: 0.8 }), A.pose('berry2', { scale: 1, dur: 1.0 }), A.pose('berry4', { scale: 1, dur: 1.2 }), A.pose('berry5', { scale: 1, dur: 1.4 }), A.effect('sparkle', { dur: 1.4 }))], [A.par(A.pose('berry1', { scale: 0, dur: 0.4 }), A.pose('berry2', { scale: 0, dur: 0.4 }), A.pose('berry4', { scale: 0, dur: 0.4 }), A.pose('berry5', { scale: 0, dur: 0.4 }), A.anim('wobble'), A.say('Rustle...', 1))]] }).done();
  }),
  // A desktop 3D printer (50 cm): a black frame with corner rails, a heated blue build plate, the orange print head on
  // its gantry (it shuttles to and fro), a spool of green filament (it turns) and a little control screen. A vase
  // grows layer by layer.
  e('three d printer', 'tech', 'machines', () => {
    const b = m('three d printer', { edge: 'sharp' })
      .box([0.46, 0.06, 0.46], [0, 0.03, 0], { color: '#2a2726', round: 0.2 })
      .box([0.1, 0.04, 0.01], [0, 0.03, 0.231], { color: '#3fe0c8', glow: true })
      .box([0.34, 0.02, 0.34], [0, 0.12, 0], { color: '#2f6fd6' })
      .cyl([0.08, 0.1, 0.08], [0, 0.18, 0], { color: '#e0473b', taper: 0.6, name: 'print', scale: 0, pivot: [0, 0.13, 0], edge: 'soft' })
      .stick([-0.22, 0.4, 0], [0.22, 0.4, 0], 0.02, 'silver')
      .box([0.07, 0.07, 0.07], [0, 0.37, 0], { color: '#f0923b', round: 0.2, name: 'head' })
      .cone([0.02, 0.03, 0.02], [0, 0.325, 0], { color: 'brass', rot: [180, 0, 0], parent: 'head' })
      .torus([0.18, 0.18, 0.06], [0.28, 0.42, 0], { color: '#3fa75a', rot: [0, 90, 0], tube: 0.3, name: 'spool', mover: { kind: 'spin', axis: 'x', amount: 90 } })
      .rod([0.26, 0.48, 0], [0.04, 0.4, 0], 0.005, '#3fa75a', { edge: 'soft' });
    for (const [x, z] of [[0.21, 0.21], [-0.21, 0.21], [0.21, -0.21], [-0.21, -0.21]]) b.stick([x, 0.06, z], [x, 0.5, z], 0.03, '#2a2726');
    b.pair((s) => b.stick([s * 0.21, 0.5, -0.21], [s * 0.21, 0.5, 0.21], 0.025, '#2a2726').stick([-0.21, 0.5, s * 0.21], [0.21, 0.5, s * 0.21], 0.025, '#2a2726'));
    return b
      .act({
        click: [
          [A.operate('spool', 'on'), A.par(A.pose('head', { move: [0.07, 0, 0], dur: 0.3, times: 4 }), A.pose('print', { scale: 1, dur: 2.4 }), A.say('Whirr... zzzt... zzzt...', 2.2)), A.operate('spool', 'off'), A.say('Ding!', 0.8)],
          [A.pose('print', { scale: 0, dur: 0.4 })],
        ],
      })
      .done();
  }),
  // A three-hole punch (28 cm, side view): grey base with the paper guide and confetti drawer, three punch heads and the
  // long black lever on its back hinge. Ka-chunk, and out come the paper dots.
  e('three hole punch', 'study', 'stationery', () => {
    const b = m('three hole punch', { view: 'side', edge: 'sharp' })
      .box([0.28, 0.025, 0.11], [0, 0.0125, 0], { color: '#5c6166', round: 0.2 })
      .box([0.26, 0.012, 0.03], [0, 0.03, 0.04], { color: '#9da3a8', round: 0.3 })
      .box([0.3, 0.02, 0.09], [0, 0.085, -0.005], { color: '#2a2726', rot: [-6, 0, 0], round: 0.4, name: 'lever', pivot: [0, 0.07, -0.05], mover: { kind: 'swing', axis: 'x', amount: 8 } });
    b.each(3, (i) => b.cyl([0.03, 0.05, 0.03], [-0.1 + i * 0.1, 0.05, 0.01], { color: 'silver' }));
    b.pair((s) => b.box([0.02, 0.06, 0.02], [s * 0.13, 0.05, -0.04], { color: '#5c6166' }));
    return b.act({ click: [A.operate('lever', 'on'), A.par(A.anim('shake'), A.effect('dust', { dur: 0.8 }), A.say('Ka-chunk!', 1)), A.operate('lever', 'off')] }).done();
  }),
  // A royal throne (1.7 m): a carved gilt frame, a red velvet seat cushion and back panel, a crown crest on top, arms
  // ending in lion heads, claw feet, on a stepped dais. A seat fit for a king; a fanfare sounds.
  e('throne', 'home', 'seating', () => {
    const g = '#e2b23a', v = '#a3182a';
    const b = m('throne', { edge: 'sharp' })
      .box([1.2, 0.15, 1.0], [0, 0.075, 0.05], { color: '#8a1f24', round: 0.2 })
      .box([0.8, 0.32, 0.65], [0, 0.31, 0], { color: g, round: 0.1 })
      .box([0.72, 0.12, 0.62], [0, 0.53, 0.02], { color: v, round: 0.6, edge: 'soft' })
      .box([0.82, 1.25, 0.12], [0, 1.1, -0.28], { color: g, round: 0.1 })
      .box([0.6, 0.95, 0.06], [0, 1.02, -0.21], { color: v, round: 0.5, edge: 'soft' })
      .arc([0.82, 0.5, 0.12], [0, 1.72, -0.28], { color: g, tube: 0.3 })
      .cyl([0.28, 0.14, 0.28], [0, 1.88, -0.28], { color: g })
      .ball(0.09, [0, 1.88, -0.13], { color: '#c0302a' });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.pyramid([0.06, 0.12, 0.06], [Math.sin(a) * 0.12, 2.0, -0.28 + Math.cos(a) * 0.12], 4, { color: g });
    });
    b.pair((s) => {
      b.box([0.12, 0.3, 0.6], [s * 0.42, 0.62, 0.02], { color: g, round: 0.3 });
      b.ball([0.15, 0.15, 0.15], [s * 0.42, 0.8, 0.3], { color: g, edge: 'soft' });
      b.ball(0.025, [s * 0.42, 0.82, 0.37], { color: '#2a2726', noInk: true });
      b.ball([0.14, 0.1, 0.16], [s * 0.34, 0.2, 0.28], { color: g, edge: 'soft' });
      b.ball(0.07, [s * 0.4, 1.72, -0.26], { color: g, edge: 'soft' });
    });
    return b.socket('seat', [0, 0.6, 0.05], 'seat').act({ click: [A.par(A.effect('sparkle', { dur: 2 }), A.say('Ta-ta-ta-taaa!', 2))] }).done();
  }),
  // A fingerprint scanner (10 cm): a black puck with a glowing glass pad, a scan line that sweeps across it and a
  // status light that turns green. Beep!
  e('thumbprint scanner', 'tech', 'gadgets', () =>
    m('thumbprint scanner', { edge: 'sharp' })
      .box([0.08, 0.025, 0.1], [0, 0.0125, 0], { color: '#2a2726', round: 0.3 })
      .box([0.055, 0.004, 0.065], [0, 0.027, 0.005], { color: '#1a6a6a' })
      .torus([0.012, 0.016, 0.002], [0, 0.03, 0.005], { color: '#6fd3e8', rot: [90, 0, 0], tube: 0.3, noInk: true })
      .torus([0.024, 0.032, 0.002], [0, 0.03, 0.005], { color: '#6fd3e8', rot: [90, 0, 0], tube: 0.15, noInk: true })
      .torus([0.036, 0.048, 0.002], [0, 0.03, 0.005], { color: '#6fd3e8', rot: [90, 0, 0], tube: 0.1, noInk: true })
      .box([0.054, 0.003, 0.004], [0, 0.031, -0.025], { color: '#6fffd8', name: 'scan', mover: { kind: 'light', on: false } })
      .ball(0.008, [0.03, 0.026, -0.042], { color: '#3fe05a', name: 'ok', mover: { kind: 'light', on: false } })
      .act({ click: [A.operate('scan', 'on'), A.pose('scan', { move: [0, 0, 0.06], dur: 0.8 }), A.par(A.operate('scan', 'off'), A.pose('scan', { move: [0, 0, 0], dur: 0 }), A.operate('ok', 'on'), A.say('Beep-beep!', 1.2)), A.wait(1.2), A.operate('ok', 'off')] })
      .done(),
  ),
  // A thunderbolt (60 cm): a dark storm cloud with a jagged yellow lightning bolt beneath it (a light). KRAKOOM!
  e('thunderbolt', 'nature', 'weather', () =>
    m('thunderbolt')
      .box([0.2, 0.02, 0.1], [0, 0.01, 0], { color: '#5c6166', round: 0.3, edge: 'sharp' })
      .ball([0.36, 0.16, 0.18], [0, 0.56, 0], { color: '#6a7078' })
      .ball([0.22, 0.14, 0.16], [0.14, 0.52, 0], { color: '#5c6166' })
      .ball([0.22, 0.16, 0.16], [-0.14, 0.53, 0], { color: '#7a8088' })
      .ball([0.18, 0.12, 0.14], [0.02, 0.64, 0], { color: '#7a8088' })
      .box([0.05, 0.2, 0.025], [0.02, 0.4, 0], { color: '#ffd23a', rot: [0, 0, -25], name: 'bolt', mover: { kind: 'light', on: false }, edge: 'sharp' })
      .box([0.1, 0.035, 0.025], [0.0, 0.3, 0], { color: '#ffd23a', rot: [0, 0, 15], parent: 'bolt', edge: 'sharp' })
      .box([0.05, 0.24, 0.025], [0.0, 0.17, 0], { color: '#ffd23a', rot: [0, 0, -25], parent: 'bolt', edge: 'sharp' })
      .cone([0.05, 0.08, 0.025], [-0.03, 0.04, 0], { color: '#ffd23a', rot: [180, 0, -25], parent: 'bolt', edge: 'sharp' })
      .act({ click: [A.operate('bolt', 'on'), A.par(A.anim('shake', 2), A.effect('rain', { dur: 2 }), A.say('KRAKOOM!', 1.4)), A.operate('bolt', 'off'), A.wait(0.3), A.operate('bolt', 'on'), A.operate('bolt', 'off')] })
      .done(),
  ),
  // A silver tiara (15 cm) set with pink and blue stones, on a velvet display cushion. It sparkles and turns.
  e('tiara', 'wardrobe', 'jewellery', () => {
    const b = m('tiara')
      .box([0.2, 0.05, 0.14], [0, 0.025, 0], { color: '#8a1f4a', round: 0.6 })
      .torus([0.15, 0.13, 0.012], [0, 0.056, 0], { color: 'silver', rot: [90, 0, 0], tube: 0.1, name: 'tiara', edge: 'sharp' });
    const peaks: Array<[number, number]> = [[-0.05, 0.05], [-0.025, 0.07], [0, 0.1], [0.025, 0.07], [0.05, 0.05]];
    for (const [x, h] of peaks) {
      const z = Math.sqrt(Math.max(0, 0.065 ** 2 - x * x)) * 0.87;
      b.cone([0.022, h, 0.008], [x, 0.056 + h / 2, z], { color: 'silver', parent: 'tiara', edge: 'sharp' });
      b.ball(0.012, [x, 0.066 + h * 0.35, z + 0.004], { color: x ? '#a8d8f5' : '#f4a1c0', parent: 'tiara', edge: 'sharp' });
    }
    return b.act({ click: [A.par(A.pose('tiara', { rot: [0, 360, 0], dur: 1.6 }), A.effect('sparkle', { dur: 1.6 })), A.pose('tiara', { rot: [0, 0, 0], dur: 0 })] }).done();
  }),
  // A tide pool (1.6 m): a ring of barnacled rocks round clear water, a pink anemone that closes up, an orange
  // starfish, a little crab that scuttles, a snail and some weed.
  e('tide pool', 'sea', 'seaside', () => {
    const b = m('tide pool')
      .cyl([1.3, 0.04, 1.1], [0, 0.02, 0], { color: '#c2a06a' })
      .cyl([1.1, 0.03, 0.9], [0, 0.07, 0], { color: '#4f9bd6', noInk: true });
    around(9, 0.62).forEach(([x, z], i) => b.ball([0.36 + (i % 3) * 0.06, 0.18 + (i % 3) * 0.06, 0.3], [x, 0.1, z * 0.86], { color: i % 2 ? 'rock' : '#7a7770' }));
    for (const [x, z] of around(5, 0.07, Math.PI / 2)) b.rod([0.18, 0.08, 0.12], [0.18 + x, 0.08, 0.12 + z], 0.035, '#f0923b');
    b.ball(0.04, [0.18, 0.085, 0.12], { color: '#f0923b' })
      .cyl([0.08, 0.06, 0.08], [-0.15, 0.1, -0.05], { color: '#e8608a', name: 'anemone' });
    for (const [x, z] of around(7, 0.035)) b.rod([-0.15 + x * 0.5, 0.13, -0.05 + z * 0.5], [-0.15 + x * 1.3, 0.18, -0.05 + z * 1.3], 0.012, '#f4a1c0', { parent: 'anemone' });
    b.ball([0.08, 0.035, 0.06], [0.05, 0.09, -0.22], { color: '#c0392b', name: 'crab' });
    b.pair((s) => {
      b.ball(0.025, [0.05 + s * 0.045, 0.1, -0.18], { color: '#c0392b', parent: 'crab' });
      b.each(3, (i) => b.rod([0.05 + s * 0.03, 0.09, -0.24 + i * 0.02], [0.05 + s * 0.07, 0.07, -0.26 + i * 0.025], 0.008, '#a3322a', { parent: 'crab' }));
    });
    b.dome([0.05, 0.04, 0.05], [-0.3, 0.09, 0.2], { color: '#8a6a4a' })
      .rod([0.32, 0.06, -0.1], [0.36, 0.25, -0.12], 0.02, '#3f7a3a')
      .rod([0.3, 0.06, -0.08], [0.25, 0.2, -0.05], 0.018, '#5aa553');
    return b
      .act({ click: [A.par(A.pose('anemone', { scale: 0.4, dur: 0.4 }), A.pose('crab', { move: [0.15, 0, 0.05], dur: 0.6 }), A.effect('water_spray', { dur: 0.8 })), A.wait(1), A.par(A.pose('anemone', { scale: 1, dur: 1 }), A.pose('crab', { move: [0, 0, 0], dur: 0.8 }))] })
      .done();
  }),
  // A silk necktie (1.45 m long) knotted round the collar of a white shirt on a display form: navy with red
  // diagonal stripes, a neat four-in-hand knot, the wide blade hanging to the belt. It flaps in a breeze.
  e('tie', 'wardrobe', 'accessories', () => {
    const nv = '#2f4f8f';
    const b = m('tie')
      .cyl([0.36, 0.03, 0.36], [0, 0.015, 0], { color: '#5c6166', edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.9, 0], 0.035, 'silver', { edge: 'sharp' })
      .loft([0.44, 0.24, 0.6], [0, 1.18, 0], [[0, 0.86, 0.85], [0.3, 0.88, 0.9], [0.75, 1, 1], [0.92, 0.95, 0.95], [1, 0.42, 0.6]], { color: '#f7f5ef', rot: [-90, 0, 0], boxy: 0.5 })
      .cyl([0.14, 0.07, 0.12], [0, 1.5, 0], { color: '#f7f5ef' })
      .box([0.045, 0.045, 0.03], [0, 1.47, 0.07], { color: nv, round: 0.4, name: 'knot', edge: 'sharp' })
      .cyl([0.085, 0.5, 0.012], [0, 1.2, 0.125], { color: nv, rot: [180, 0, 0], taper: 0.45, name: 'blade', parent: 'knot', pivot: [0, 1.45, 0.09], edge: 'sharp' })
      .cone([0.085, 0.05, 0.012], [0, 0.925, 0.125], { color: nv, rot: [180, 0, 0], parent: 'blade', edge: 'sharp' });
    b.pair((s) => b.box([0.06, 0.05, 0.012], [s * 0.04, 1.47, 0.065], { color: '#f7f5ef', rot: [0, 0, s * 35], edge: 'sharp' }));
    b.each(5, (i) => b.box([0.05 + i * 0.008, 0.014, 0.004], [0, 1.36 - i * 0.09, 0.132], { color: '#c0392b', rot: [0, 0, 32], parent: 'blade', noInk: true }));
    return b.act({ click: [A.pose('blade', { rot: [-25, 0, 10], dur: 0.35, times: 2 }), A.say('Flap, flap.', 1)] }).done();
  }),
  // A tie-dye T-shirt on a hanger: white cotton dyed in a spiral of purple, blue, green, yellow and orange rings.
  e('tie dye shirt', 'wardrobe', 'tops', () => {
    const b = m('tie dye shirt');
    const T = hanger(b, valet(b, 1.7), 0.44);
    topOn(b, T, 0, { color: '#f7f5ef', sleeves: 'short', W: 0.52, L: 0.7, band: '#8a5fc4' });
    const rings: Array<[number, string]> = [[0.46, '#8a5fc4'], [0.37, '#2f6fd6'], [0.28, '#3fa75a'], [0.19, '#f6d24a'], [0.1, '#f0923b']];
    for (const [d, c] of rings) b.torus([d, d, 0.01], [0, T - 0.36, 0.083], { color: c, tube: 0.16, parent: 'garment', noInk: true });
    b.ball([0.05, 0.05, 0.01], [0, T - 0.36, 0.085], { color: '#e0473b', parent: 'garment', noInk: true });
    b.pair((s) => b.ball([0.12, 0.12, 0.01], [s * 0.37, T - 0.17, 0.07], { color: s > 0 ? '#2f6fd6' : '#f0923b', parent: 'garment', noInk: true }));
    return b.act(garmentAct([A.effect('sparkle', { dur: 1.2 })], [A.effect('hearts', { dur: 1 })])).done();
  }),
  // A tilde (~) cut from blue acrylic (15 cm), standing in a little wooden foot. It wiggles.
  e('tilde', 'ideas', 'symbols', () => {
    const b = m('tilde').box([0.12, 0.03, 0.06], [0, 0.015, 0], { color: 'wood', round: 0.3, edge: 'sharp' }).stick([0, 0.03, 0], [0, 0.07, 0], 0.008, '#9da3a8');
    b.box([0.01, 0.01, 0.01], [0, 0.085, 0], { color: '#4e8fd6', name: 'wave', pivot: [0, 0.07, 0] });
    let prev: V = [-0.065, 0.085, 0];
    for (let i = 1; i <= 8; i++) {
      const x = -0.065 + i * (0.13 / 8), p: V = [x, 0.085 + 0.018 * Math.sin((x / 0.065) * Math.PI), 0];
      b.rod(prev, p, 0.02, '#4e8fd6', { parent: 'wave' });
      prev = p;
    }
    return b.act({ click: [A.par(A.pose('wave', { rot: [0, 0, 12], dur: 0.2, times: 3 }), A.effect('sparkle', { dur: 1 }))] }).done();
  }),
  // A Victorian time machine (2 m): a brass sledge frame, a red buttoned chair (a seat), the great spinning brass
  // disc behind it, a control desk with dials and a lever, crystal rods that glow. Pull the lever: vworp!
  e('time machine', 'tech', 'machines', () => {
    const b = m('time machine', { edge: 'sharp' })
      .box([1.4, 0.12, 1.2], [0, 0.06, 0], { color: 'brass', round: 0.3 })
      .box([0.55, 0.12, 0.5], [0, 0.6, 0.05], { color: '#a3182a', round: 0.6, edge: 'soft' })
      .box([0.55, 0.7, 0.12], [0, 1.0, -0.2], { color: '#a3182a', round: 0.6, edge: 'soft' })
      .box([0.62, 0.06, 0.56], [0, 0.52, 0.05], { color: 'brass', round: 0.3 })
      .cyl([1.7, 0.08, 1.7], [0, 1.15, -0.55], { color: 'brass', rot: [90, 0, 0], name: 'disc', mover: { kind: 'spin', axis: 'z', amount: 360 } })
      .cyl([1.3, 0.02, 1.3], [0, 1.15, -0.5], { color: 'copper', rot: [90, 0, 0], parent: 'disc', noInk: true })
      .box([0.34, 0.5, 0.2], [0.55, 0.85, 0.35], { color: 'darkwood', round: 0.2 })
      .cyl([0.1, 0.02, 0.1], [0.5, 1.03, 0.46], { color: '#e8e4dc', rot: [70, 0, 0] })
      .cyl([0.1, 0.02, 0.1], [0.62, 1.03, 0.46], { color: '#e8e4dc', rot: [70, 0, 0] })
      .stick([0.55, 1.1, 0.35], [0.55, 1.45, 0.45], 0.03, 'silver', { name: 'lever', pivot: [0.55, 1.1, 0.35], mover: { kind: 'swing', axis: 'x', amount: 50 } })
      .ball(0.07, [0.55, 1.47, 0.46], { color: '#c0302a', parent: 'lever' });
    b.each(4, (i) => b.ball(0.1, xy(0, 1.15, 0.62, (i * Math.PI) / 2 + 0.4, -0.5), { color: ['#6fd3e8', '#d64fa0', '#9be34d', '#f6d24a'][i], parent: 'disc' }));
    b.pair((s) => {
      b.stick([s * 0.3, 0.12, 0.3], [s * 0.3, 0.55, 0.3], 0.04, 'brass');
      b.stick([s * 0.3, 0.12, -0.25], [s * 0.3, 1.35, -0.3], 0.04, 'brass');
      b.cyl([0.06, 0.55, 0.06], [s * 0.62, 0.4, -0.35], { color: '#bfe6f5', name: `rod${s > 0 ? 'L' : 'R'}`, mover: { kind: 'light', on: false } });
      b.rod([s * 0.75, 0.1, 0.62], [s * 0.75, 0.04, -0.62], 0.08, 'brass');
    });
    return b
      .socket('seat', [0, 0.68, 0.05], 'seat')
      .act({
        click: [A.operate('lever', 'on'), A.par(A.operate('disc', 'on'), A.operate('rods', 'on')), A.par(A.effect('sparkle', { dur: 3 }), A.anim('pulse', 3), A.say('Vworp... vworp... vworp...', 2.6)), A.wait(1), A.par(A.operate('disc', 'off'), A.operate('rods', 'off'), A.operate('lever', 'off'))],
      })
      .done();
  }),
  // A roll of aluminium foil in its box (30 cm): the serrated cutting edge, a shiny sheet pulled out that slides back,
  // and a crumpled foil ball beside it. Crinkle.
  e('tin foil', 'kitchen', 'wraps', () =>
    m('tin foil', { edge: 'sharp' })
      .box([0.3, 0.05, 0.05], [0, 0.025, 0], { color: '#2f6fd6', round: 0.2 })
      .label('FOIL', [0.12, 0.03], [0, 0.025, 0.026], { color: 'white', depth: 0.002 })
      .box([0.31, 0.004, 0.06], [0, 0.052, -0.005], { color: '#2f6fd6', rot: [8, 0, 0] })
      .box([0.29, 0.006, 0.006], [0, 0.05, 0.028], { color: 'silver' })
      .box([0.28, 0.003, 0.14], [0, 0.002, 0.1], { color: '#d8dde2', name: 'sheet', mover: { kind: 'slide', axis: 'z', amount: 0.12 } })
      .ball(0.05, [0.22, 0.025, 0.06], { color: '#c9ccd1', edge: 'soft' })
      .ball(0.025, [0.235, 0.045, 0.07], { color: '#e0e4e8', edge: 'soft' })
      .act({ click: [[A.operate('sheet', 'out'), A.say('Crinkle, crinkle!', 1.2)], [A.operate('sheet', 'in'), A.say('Rrrip!', 1)]] })
      .done(),
  ),
  // Christmas tinsel (2 m) swagged between two little wooden stands: twisted gold and silver strands that glitter,
  // a red bauble in the middle. It shimmers.
  e('tinsel', 'toys', 'holiday decorations', () => {
    const b = m('tinsel').box([0.01, 0.01, 0.01], [0, 1.45, 0], { color: 'gold', name: 'swag', pivot: [0, 1.5, 0] });
    b.pair((s) => {
      b.stick([s * 0.95, 0, 0], [s * 0.95, 1.55, 0], 0.05, 'wood', { edge: 'sharp' });
      b.box([0.16, 0.06, 0.4], [s * 0.95, 0.03, 0], { color: 'wood', round: 0.3, edge: 'sharp' });
      b.ball(0.06, [s * 0.95, 1.58, 0], { color: 'gold' });
    });
    for (const [col, dz, dy] of [['gold', 0.02, 0], ['silver', -0.02, -0.04]] as const) {
      let prev: V = [-0.92, 1.5 + dy, dz];
      for (let i = 1; i <= 12; i++) {
        const t = i / 12, x = -0.92 + t * 1.84, p: V = [x, 1.5 + dy - 0.55 * Math.sin(Math.PI * t), dz];
        b.rod(prev, p, 0.07, col, { parent: 'swag', noInk: true });
        b.box([0.05, 0.05, 0.05], p, { color: col === 'gold' ? '#ffe680' : '#f2f5f7', rot: [i * 40, i * 30, 45], parent: 'swag', noInk: true });
        prev = p;
      }
    }
    b.ball(0.1, [0, 0.86, 0.06], { color: '#c0302a', parent: 'swag' }).cyl([0.03, 0.03, 0.03], [0, 0.92, 0.06], { color: 'gold', parent: 'swag' });
    return b.act({ click: [A.par(A.effect('sparkle', { dur: 2 }), A.pose('swag', { rot: [10, 0, 0], dur: 0.4, times: 2 }))] }).done();
  }),
  // A car tyre (65 cm) standing on its tread: deep tread blocks round the rubber, sidewall lettering, a silver
  // five-spoke alloy rim with its centre cap. It rolls a little way and back.
  e('tire', 'garage', 'car parts', () => {
    const b = m('tire', { view: 'side' })
      .torus([0.65, 0.65, 0.22], [0, 0.325, 0], { color: 'rubber', rot: [0, 90, 0], tube: 0.3, name: 'wheel' })
      .cyl([0.44, 0.18, 0.44], [0, 0.325, 0], { color: 'silver', rot: [0, 0, 90], parent: 'wheel', edge: 'sharp' })
      .cyl([0.12, 0.2, 0.12], [0, 0.325, 0], { color: '#5c6166', rot: [0, 0, 90], parent: 'wheel', edge: 'sharp' })
      .label('ALL SEASON', [0.04, 0.2], [0.112, 0.325, 0.25], { color: 'rubber', rot: [0, 90, 0], parent: 'wheel', depth: 0.003 });
    b.each(5, (i) => {
      const a = (i / 5) * Math.PI * 2;
      b.box([0.19, 0.16, 0.05], [0, 0.325 + Math.cos(a) * 0.11, Math.sin(a) * 0.11], { color: '#c9ccd1', rot: [-a / D, 0, 0], parent: 'wheel', edge: 'sharp' });
    });
    b.each(16, (i) => {
      const a = (i / 16) * Math.PI * 2;
      b.box([0.2, 0.03, 0.05], [0, 0.325 + Math.cos(a) * 0.315, Math.sin(a) * 0.315], { color: '#2a2726', rot: [-a / D, 0, 0], parent: 'wheel', noInk: true });
    });
    return b.act({ click: [A.pose('wheel', { move: [0, 0, 1.0], rot: [176, 0, 0], dur: 1 }), A.say('Rumble...', 1), A.pose('wheel', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1 })] }).done();
  }),
  // A four-way lug wrench (55 cm cross) standing on one of its sockets: forged steel bars with a different-sized hex
  // socket on each end. It spins: clank, clank.
  e('tire iron', 'workshop', 'hand tools', () =>
    m('tire iron', { edge: 'sharp' })
      .stick([0, 0.03, 0], [0, 0.58, 0], 0.024, 'iron', { name: 'cross', pivot: [0, 0.03, 0] })
      .stick([-0.27, 0.305, 0], [0.27, 0.305, 0], 0.024, 'iron', { parent: 'cross' })
      .cyl([0.044, 0.06, 0.044], [0, 0.03, 0], { color: '#5c6166', segs: 6, parent: 'cross' })
      .cyl([0.04, 0.06, 0.04], [0, 0.58, 0], { color: '#5c6166', segs: 6, parent: 'cross' })
      .cyl([0.036, 0.06, 0.036], [-0.27, 0.305, 0], { color: '#5c6166', rot: [0, 0, 90], segs: 6, parent: 'cross' })
      .cyl([0.032, 0.06, 0.032], [0.27, 0.305, 0], { color: '#5c6166', rot: [0, 0, 90], segs: 6, parent: 'cross' })
      .ball(0.04, [0, 0.305, 0], { color: 'iron', parent: 'cross' })
      .act({ click: [A.par(A.pose('cross', { rot: [0, 720, 0], dur: 1.6 }), A.say('Clank, clank, clank!', 1.6)), A.pose('cross', { rot: [0, 0, 0], dur: 0 })] })
      .done(),
  ),
  // A tyre swing (4.2 m with its tree; the vocabulary's 1 m is the tyre alone): an old oak with a thick branch, a
  // rope down to a black tyre hanging at sitting height. It swings.
  e('tire swing', 'toys', 'playground', () => {
    const b = m('tire swing')
      .cyl([0.5, 3.4, 0.5], [-1.0, 1.7, 0], { color: 'bark', taper: 0.65 })
      .rod([-0.95, 2.9, 0], [0.8, 3.2, 0], 0.2, 'bark')
      .ball([2.2, 1.3, 1.6], [-0.4, 3.6, 0], { color: '#3f7a3a' })
      .ball([1.4, 1.0, 1.3], [0.6, 3.5, 0.1], { color: '#4f8a3a' })
      .ball([1.2, 1.0, 1.2], [-1.5, 3.3, -0.2], { color: '#3f7a3a' });
    for (const [x, z] of around(4, 0.35, 0.3)) b.rod([-1.0 + x * 0.6, 0.15, z * 0.6], [-1.0 + x * 1.4, 0.02, z * 1.4], 0.12, 'bark');
    b.stick([0.3, 3.08, 0], [0.3, 1.1, 0], 0.035, 'tan', { name: 'rope', pivot: [0.3, 3.08, 0] })
      .torus([0.66, 0.66, 0.22], [0.3, 0.78, 0], { color: 'rubber', tube: 0.3, parent: 'rope' })
      .torus([0.12, 0.08, 0.06], [0.3, 1.1, 0], { color: 'tan', rot: [0, 90, 0], tube: 0.25, parent: 'rope' });
    return b
      .socket('seat', [0.3, 0.55, 0], 'seat', { part: 'rope' })
      .act({ click: [A.par(A.pose('rope', { rot: [28, 0, 0], dur: 0.9, times: 2 }), A.say('Wheee!', 1.4))] })
      .done();
  }),
  // A single soft facial tissue (22 cm) lying in loose folds. It flutters up in a puff of air.
  e('tissue', 'home', 'bathroom', () =>
    m('tissue')
      .box([0.2, 0.006, 0.16], [0, 0.006, 0], { color: 'white', round: 0.6, name: 'tissue' })
      .ball([0.12, 0.05, 0.1], [0.03, 0.025, 0.01], { color: '#fbfbfb', parent: 'tissue' })
      .ball([0.08, 0.04, 0.06], [-0.05, 0.02, -0.03], { color: '#f7f7f7', rot: [0, 0, -20], parent: 'tissue' })
      .box([0.1, 0.004, 0.08], [0.06, 0.045, 0.02], { color: 'white', rot: [20, 30, 15], round: 0.6, parent: 'tissue' })
      .act({ click: [A.pose('tissue', { move: [0, 0.25, 0], rot: [15, 40, 10], dur: 0.8 }), A.say('Fwff...', 1), A.pose('tissue', { move: [0, 0, 0], rot: [0, 0, 0], dur: 1.0 })] })
      .done(),
  ),
  // A cube box of tissues (12 cm): sky-blue card printed with white clouds, an oval opening on top and a tissue
  // fluffed up out of it. Pull one: fwip, and the next pops up.
  e('tissue box', 'home', 'bathroom', () => {
    const b = m('tissue box', { edge: 'sharp' })
      .box([0.12, 0.12, 0.12], [0, 0.06, 0], { color: '#a8d8f5', round: 0.1 })
      .cyl([0.07, 0.004, 0.04], [0, 0.121, 0], { color: '#e8f4fb' })
      .ball([0.07, 0.07, 0.03], [0, 0.14, 0], { color: 'white', name: 'tissue', edge: 'soft', mover: { kind: 'slide', axis: 'y', amount: 0.06 } })
      .ball([0.05, 0.05, 0.02], [0.02, 0.17, 0], { color: 'white', rot: [0, 0, -25], parent: 'tissue', edge: 'soft' });
    b.each(4, (i) => b.ball([0.03, 0.02, 0.004], [-0.03 + (i % 2) * 0.06, 0.04 + Math.floor(i / 2) * 0.045, 0.061], { color: 'white', noInk: true }));
    return b.act({ click: [A.operate('tissue', 'out'), A.say('Fwip!', 0.8), A.operate('tissue', 'in'), A.anim('hop')] }).done();
  }),
];
