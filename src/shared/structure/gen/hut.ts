/** The witch's hut: an octagonal cabin wearing a crooked witch hat for a roof. */
import type { GenContext, Structure } from '../types';
import { Parts, tidy } from '../build';
import { DEG } from '../../engine/math';

export interface WitchHutParams {
  r: number;
  wallColor: string;
  hatColor: string;
  bandColor: string;
  tilt: number;
}

export const DEFAULT_WITCH_HUT: WitchHutParams = { r: 2.3, wallColor: '#6b5577', hatColor: '#3b2a52', bandColor: '#8a4fd0', tilt: 1 };

export function witchHut(params: Partial<WitchHutParams>, _ctx: GenContext, decals: Parts['decals']): Structure {
  const p: WitchHutParams = { ...DEFAULT_WITCH_HUT, ...params };
  p.r = Math.max(1.6, Math.min(4, p.r));
  const b = new Parts(decals);
  const sides = 8;
  const wallH = 2.5;
  const apothem = p.r * Math.cos(Math.PI / sides);
  // floor plate and walls; segment 1 faces +z and is the doorway
  b.prism(0, 0, 0, sides, p.r + 0.25, 0.14, 'plank', '#4a3a3a');
  b.ring(0, 0.14, 0, sides, p.r, wallH, 'plank', p.wallColor, [1]);
  // narrow the doorway with two posts and a crooked lintel
  const segW = 2 * p.r * Math.sin(Math.PI / sides);
  for (const s of [-1, 1]) b.box(s * (segW / 2 - 0.1), 0.14, apothem, 0.22, wallH, 0.3, 'plank', '#3a2a2a');
  b.box(0, 2.05, apothem, segW + 0.2, 0.2, 0.34, 'plank', '#3a2a2a', { rot: 0 });
  const door = b.decals('door');
  if (door?.file) {
    const dw = Math.min(segW - 0.5, 1.9 * (door.w / Math.max(1, door.h)));
    b.decal(0, 0.14, apothem + 0.16, door, dw, 1.9, 0, { role: 'door' });
  }
  // round-ish windows on the front-left and front-right faces
  for (const i of [0, 2]) {
    const a = ((i + 1) / sides) * Math.PI * 2;
    const x = Math.cos(a) * (apothem + 0.01);
    const z = Math.sin(a) * (apothem + 0.01);
    const rot = Math.atan2(Math.cos(a), Math.sin(a)) / DEG;
    if (!b.sticker('window', x, 1.15, z, 0.85, rot)) b.box(x, 1.15, z, 0.7, 0.85, 0.06, 'glass', '#cfe3ff', { rot, ghost: true, noInk: true });
  }
  // the hat: brim, band with buckle, and three leaning cone segments
  const brimY = wallH + 0.14 - 0.08;
  b.prism(0, brimY, 0, 12, p.r + 1.5, 0.18, 'flat', p.hatColor, { rz: p.r + 1.35, name: 'hat' });
  const crownY = brimY + 0.18;
  const r0 = p.r + 0.25;
  const seg1 = { r: r0, rTop: r0 * 0.68, h: 1.5 };
  const seg2 = { r: seg1.rTop, rTop: seg1.rTop * 0.6, h: 1.4, lean: [0.28 * p.tilt, 0.1 * p.tilt] as [number, number] };
  const seg3 = { r: seg2.rTop, rTop: 0, h: 1.9, lean: [0.9 * p.tilt, 0.35 * p.tilt] as [number, number] };
  b.prism(0, crownY, 0, 10, seg1.r, seg1.h, 'flat', p.hatColor, { rTop: seg1.rTop, name: 'hat' });
  b.prism(0, crownY + seg1.h - 0.02, 0, 10, seg2.r, seg2.h, 'flat', p.hatColor, { rTop: seg2.rTop, lean: seg2.lean, name: 'hat' });
  b.prism(seg2.lean[0], crownY + seg1.h + seg2.h - 0.04, seg2.lean[1], 10, seg3.r, seg3.h, 'flat', p.hatColor, { rTop: 0, lean: seg3.lean, name: 'hat' });
  b.prism(0, crownY + 0.15, 0, 10, r0 * 0.98 + 0.05, 0.42, 'flat', p.bandColor, { rTop: r0 * 0.93 + 0.05, noInk: true, name: 'hat' });
  b.box(0, crownY + 0.1, r0 * 0.95 + 0.08, 0.55, 0.52, 0.12, 'metal', '#f2c14e', { name: 'hat' });
  // a crooked stovepipe through the hat, and a lantern by the door
  b.prism(-p.r * 0.5, crownY + 0.8, -p.r * 0.35, 6, 0.17, 2.4, 'metal', '#4a4a4a', { name: 'chimney' });
  b.box(-p.r * 0.5, crownY + 3.2, -p.r * 0.35, 0.6, 0.12, 0.6, 'metal', '#4a4a4a', { name: 'chimney' });
  b.prism(-(segW / 2 + 0.3), 0.14, apothem + 0.1, 6, 0.05, 1.7, 'flat', '#3a3a3a', { noInk: true, name: 'lantern' });
  b.box(-(segW / 2 + 0.3), 1.6, apothem + 0.1, 0.28, 0.34, 0.28, 'glass', '#ffd27a', { name: 'lantern' });
  return tidy(b.finish('witch_hut', { ...p }));
}
