/**
 * Houses: four walls with a doorway, a roof, windows, a chimney and trim. Every house in the game is this function
 * with different numbers; `randomHouse` rolls a plausible set, and the gingerbread house is a house in candy.
 */
import type { MaterialName, GenContext, Structure } from '../types';
import { Parts, WALL_T, pick, range, tidy } from '../build';
import { roofHeightAt } from '../collide';
import { CANDY, DOOR_COLORS, ROOF_COLORS, TRIM_COLORS, WALL_COLORS, WOOD } from '../palette';

export interface HouseParams {
  w: number;
  d: number;
  stories: number;
  wallMat: MaterialName;
  wallColor: string;
  roof: 'gable' | 'hip' | 'flat';
  roofMat: MaterialName;
  roofColor: string;
  /** Roof height over half the span it covers (0.35 = shallow, 1 = 45 degrees). */
  pitch: number;
  trimColor: string;
  doorColor: string;
  chimney: boolean;
  windows: boolean;
  /** Offset of the door along the front wall. */
  doorAt: number;
  floorH: number;
  /** Text on a paper sign over the door ("FIRE STATION"). */
  sign?: string;
}

export const DEFAULT_HOUSE: HouseParams = {
  w: 6,
  d: 5,
  stories: 1,
  wallMat: 'plaster',
  wallColor: '#f6e27a',
  roof: 'gable',
  roofMat: 'shingle',
  roofColor: '#e8493b',
  pitch: 0.7,
  trimColor: '#ffffff',
  doorColor: '#b86a3c',
  chimney: true,
  windows: true,
  doorAt: 0,
  floorH: 2.6,
};

const DOOR_W = 1.0;
const DOOR_H = 2.1;
const OVERHANG = 0.5;

/** Evenly spaced positions along a wall of length len, leaving `margin` at each end and avoiding [avoidLo, avoidHi]. */
function slots(len: number, spacing: number, margin: number, avoid?: [number, number]): number[] {
  const usable = len - margin * 2;
  const n = Math.max(0, Math.floor(usable / spacing) + 1);
  if (n <= 0 || usable <= 0) return [];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -usable / 2 + (i * usable) / (n - 1);
    if (avoid && x > avoid[0] && x < avoid[1]) continue;
    out.push(x);
  }
  return out;
}

/** Walls, door, windows and trim on an existing collector; used by the house and by the keeper's cottage. */
export function houseBody(b: Parts, p: HouseParams, ox = 0, oz = 0): { H: number; roofY: number } {
  const H = p.stories * p.floorH;
  const hw = p.w / 2;
  const hd = p.d / 2;
  const t = WALL_T;
  const door = { at: p.doorAt, w: DOOR_W, h: DOOR_H };
  b.wall(ox, 0, oz + hd - t / 2, p.w, H, 0, p.wallMat, p.wallColor, [door]);
  b.wall(ox, 0, oz - hd + t / 2, p.w, H, 180, p.wallMat, p.wallColor);
  b.wall(ox + hw - t / 2, 0, oz, p.d - 2 * t, H, 90, p.wallMat, p.wallColor);
  b.wall(ox - hw + t / 2, 0, oz, p.d - 2 * t, H, -90, p.wallMat, p.wallColor);
  // a floor slab so the inside is not bare meadow
  b.box(ox, 0, oz, p.w - 0.1, 0.06, p.d - 0.1, 'plank', '#c9a36a', { noInk: true });

  // door frame and the door itself, swung open against the wall
  b.box(ox + p.doorAt, DOOR_H, oz + hd - t / 2, DOOR_W + 0.3, 0.16, t + 0.08, 'flat', p.trimColor);
  b.box(ox + p.doorAt - DOOR_W / 2 - 0.07, 0, oz + hd - t / 2, 0.14, DOOR_H, t + 0.08, 'flat', p.trimColor);
  b.box(ox + p.doorAt + DOOR_W / 2 + 0.07, 0, oz + hd - t / 2, 0.14, DOOR_H, t + 0.08, 'flat', p.trimColor);
  const sticker = b.decals('door');
  if (sticker?.file) {
    const dw = (DOOR_H - 0.05) * (sticker.w / Math.max(1, sticker.h));
    b.decal(ox + p.doorAt + DOOR_W / 2 + 0.05, 0, oz + hd + dw / 2, sticker, dw, DOOR_H - 0.05, 90);
  } else {
    b.box(ox + p.doorAt + DOOR_W / 2 + 0.04, 0, oz + hd + DOOR_W / 2, 0.06, DOOR_H - 0.05, DOOR_W - 0.05, 'plank', p.doorColor);
  }
  b.box(ox + p.doorAt, 0, oz + hd + 0.3, 1.6, 0.16, 0.6, 'stone', '#b9bcb6');
  if (p.sign) {
    const signH = p.stories > 1 ? 0.55 : 0.4;
    b.sign(p.sign.slice(0, 24), ox + p.doorAt, DOOR_H + 0.14, oz + hd + 0.03, signH, 0);
  }

  // windows on every storey; the front row skips the door
  if (p.windows) {
    const winH = 1.1;
    for (let s = 0; s < p.stories; s++) {
      const y = s * p.floorH + 0.95;
      const front = slots(p.w, 2.4, 1.0, [p.doorAt - DOOR_W / 2 - 0.75, p.doorAt + DOOR_W / 2 + 0.75]);
      for (const x of front) window(b, ox + x, y, oz + hd, 0, winH, p.trimColor);
      for (const x of slots(p.w, 2.6, 1.0)) window(b, ox + x, y, oz - hd, 180, winH, p.trimColor);
      for (const z of slots(p.d, 2.6, 1.0)) {
        window(b, ox + hw, y, oz + z, 90, winH, p.trimColor);
        window(b, ox - hw, y, oz + z, -90, winH, p.trimColor);
      }
    }
  }
  // corner boards
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(ox + sx * (hw - 0.03), 0, oz + sz * (hd - 0.03), 0.18, H + 0.02, 0.18, 'flat', p.trimColor);

  // roof
  const roofY = H - 0.12;
  if (p.roof === 'flat') {
    b.box(ox, H, oz, p.w + 0.5, 0.3, p.d + 0.5, p.roofMat, p.roofColor);
    for (const sz of [-1, 1]) b.box(ox, H + 0.3, oz + sz * (hd + 0.15), p.w + 0.5, 0.35, 0.2, p.wallMat, p.wallColor);
    for (const sx of [-1, 1]) b.box(ox + sx * (hw + 0.15), H + 0.3, oz, 0.2, 0.35, p.d + 0.1, p.wallMat, p.wallColor);
  } else if (p.roof === 'gable') {
    const roof = b.roof(ox, roofY, oz, 'gable', p.w + 0.08, (hd + OVERHANG) * p.pitch, p.d + OVERHANG * 2, p.roofMat, p.roofColor, {
      endMat: p.wallMat,
      endColor: p.wallColor,
    });
    if (p.chimney) chimney(b, roof, ox + hw * 0.45, oz - hd * 0.35, roofY);
  } else {
    const roof = b.roof(ox, roofY, oz, 'hip', p.w + OVERHANG * 2, (Math.min(hw, hd) + OVERHANG) * p.pitch, p.d + OVERHANG * 2, p.roofMat, p.roofColor);
    if (p.chimney) chimney(b, roof, ox + hw * 0.4, oz - hd * 0.2, roofY);
  }
  return { H, roofY };
}

function window(b: Parts, x: number, y: number, z: number, rot: number, h: number, trim: string): void {
  if (b.sticker('window', x, y, z, h, rot)) return;
  // no sprite: a framed pane
  const w = h * 0.85;
  const f = (ox: number, oz: number) => {
    const s = Math.sin((rot * Math.PI) / 180);
    const c = Math.cos((rot * Math.PI) / 180);
    return [x + ox * c + oz * s, z - ox * s + oz * c] as const;
  };
  const [fx, fz] = f(0, 0.03);
  b.box(fx, y, fz, w + 0.16, h + 0.16, 0.06, 'flat', trim, { rot, ghost: true });
  const [gx, gz] = f(0, 0.07);
  b.box(gx, y + 0.08, gz, w, h, 0.04, 'glass', '#bfe9ff', { rot, ghost: true, noInk: true });
}

function chimney(b: Parts, roof: { style: 'gable' | 'hip' | 'shed'; w: number; d: number; h: number }, x: number, z: number, roofY: number): void {
  const surface = roofY + roofHeightAt({ ...roof, t: 'roof', pos: [0, 0, 0], mat: 'shingle', color: '' }, x, z);
  const base = roofY - 0.4;
  const top = surface + 1.1;
  b.box(x, base, z, 0.7, top - base, 0.7, 'brick', '#c96a4b');
  b.box(x, top, z, 0.9, 0.18, 0.9, 'flat', '#8f5a45');
}

export function house(params: Partial<HouseParams>, _ctx: GenContext, decals: Parts['decals']): Structure {
  const p: HouseParams = { ...DEFAULT_HOUSE, ...params };
  p.w = Math.max(3, Math.min(14, p.w));
  p.d = Math.max(3, Math.min(14, p.d));
  p.stories = Math.max(1, Math.min(3, Math.round(p.stories)));
  const b = new Parts(decals);
  houseBody(b, p);
  return tidy(b.finish('house', { ...p }));
}

/** A house no one asked the details of: rolls size, roof and colours. */
export function randomHouse(ctx: GenContext, decals: Parts['decals'], overrides: Partial<HouseParams> = {}): Structure {
  const rng = ctx.rng;
  const stories = rng() < 0.3 ? 2 : 1;
  const roof = pick(rng, ['gable', 'gable', 'hip', 'hip', 'flat'] as const);
  const wood = rng() < 0.35;
  const wallMat: MaterialName = wood ? 'plank' : pick(rng, ['plaster', 'plaster', 'brick', 'stone'] as const);
  const wallColor = wood ? pick(rng, WOOD) : wallMat === 'brick' ? pick(rng, ['#d98c6a', '#c96a4b', '#e2a98a'] as const) : wallMat === 'stone' ? '#c9c4b8' : pick(rng, WALL_COLORS);
  const roofMat: MaterialName = pick(rng, ['shingle', 'shingle', 'thatch', 'plank'] as const);
  const p: Partial<HouseParams> = {
    w: range(rng, 4.5, 8, 0.5),
    d: range(rng, 4, 6.5, 0.5),
    stories,
    wallMat,
    wallColor,
    roof,
    roofMat,
    roofColor: roofMat === 'thatch' ? '#d9b36a' : pick(rng, ROOF_COLORS),
    pitch: range(rng, 0.5, 0.95, 0.05),
    trimColor: pick(rng, TRIM_COLORS),
    doorColor: pick(rng, DOOR_COLORS),
    chimney: rng() < 0.75,
    doorAt: range(rng, -1, 1, 0.5),
    ...overrides,
  };
  return house(p, ctx, decals);
}

/** The gingerbread house: brown walls, white icing roof and outlines, candy everywhere. */
export function gingerbreadHouse(ctx: GenContext, decals: Parts['decals'], overrides: Partial<HouseParams> = {}): Structure {
  const rng = ctx.rng;
  const p: HouseParams = {
    ...DEFAULT_HOUSE,
    w: 5.5,
    d: 4.5,
    wallMat: 'gingerbread',
    wallColor: '#b5712f',
    roof: 'gable',
    roofMat: 'icing',
    roofColor: '#fffdf7',
    pitch: 0.95,
    trimColor: '#fffdf7',
    doorColor: '#ff4f6d',
    chimney: true,
    doorAt: 0,
    ...overrides,
  };
  const b = new Parts(decals);
  const { roofY } = houseBody(b, p);
  const hw = p.w / 2;
  const hd = p.d / 2;
  const roofH = (hd + OVERHANG) * p.pitch;
  const roofSpec = { t: 'roof' as const, style: 'gable' as const, w: p.w + 0.08, d: p.d + OVERHANG * 2, h: roofH, pos: [0, 0, 0] as [number, number, number], mat: 'icing' as const, color: '' };
  // icing drips along both eaves
  for (const sz of [-1, 1]) b.box(0, roofY - 0.05, sz * (hd + OVERHANG - 0.12), p.w + 0.1, 0.22, 0.34, 'icing', '#fffdf7', { noInk: true, ghost: true });
  // gumdrops on the slopes and along the path
  const drops = 10;
  for (let i = 0; i < drops; i++) {
    const x = -hw + 0.6 + (i % 5) * ((p.w - 1.2) / 4) + range(rng, -0.2, 0.2);
    const z = (i < 5 ? 1 : -1) * (hd * 0.45 + range(rng, -0.3, 0.3));
    const y = roofY + roofHeightAt(roofSpec, x, z) - 0.05;
    b.prism(x, y, z, 8, 0.24, 0.32, 'flat', pick(rng, CANDY), { rTop: 0.16 });
  }
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    b.prism(side * (0.9 + i * 0.15), 0, hd + 1.1 + i * 0.5, 8, 0.2, 0.26, 'flat', pick(rng, CANDY), { rTop: 0.13 });
  }
  // candy cane posts beside the door: stacked red and white rings
  for (const side of [-1, 1]) {
    const x = p.doorAt + side * (DOOR_W / 2 + 0.55);
    for (let k = 0; k < 7; k++) b.prism(x, k * 0.3, hd + 0.35, 8, 0.1, 0.3, 'flat', k % 2 ? '#fffdf7' : '#e8493b', { noInk: k % 2 === 1 });
    b.prism(x, 7 * 0.3, hd + 0.35, 8, 0.16, 0.12, 'flat', '#e8493b');
  }
  // peppermint stepping stones
  for (let i = 0; i < 3; i++) b.prism(range(rng, -0.4, 0.4), 0, hd + 1.4 + i * 0.75, 12, 0.32, 0.05, 'stripe', '#fffdf7', { noInk: true });
  return tidy(b.finish('gingerbread', { ...p }, '#fffdf7'));
}
