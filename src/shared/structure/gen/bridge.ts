/**
 * A footbridge running along local z: a plank deck whose top sits at y 0.05 (flush with the road it joins),
 * railings on both sides, and stone piers reaching down into the water.
 */
import type { GenContext, Structure } from '../types';
import { Parts, tidy } from '../build';

export interface BridgeParams {
  /** Length along local z (bank to bank) and deck width. */
  len: number;
  w: number;
  /** How far the piers reach below the deck. */
  drop: number;
  color: string;
}

export const DEFAULT_BRIDGE: BridgeParams = { len: 12, w: 3.4, drop: 2.2, color: '#a86f38' };

export function bridge(params: Partial<BridgeParams>, _ctx: GenContext, decals: Parts['decals']): Structure {
  const p: BridgeParams = { ...DEFAULT_BRIDGE, ...params };
  p.len = Math.max(4, Math.min(40, p.len));
  p.w = Math.max(1.6, Math.min(8, p.w));
  p.drop = Math.max(0.5, Math.min(6, p.drop));
  const b = new Parts(decals);
  const deckT = 0.3;
  const hw = p.w / 2;
  b.box(0, 0.05 - deckT, 0, p.w, deckT, p.len, 'plank', p.color);
  // a beam under each edge and the piers into the river
  for (const sx of [-1, 1]) b.box(sx * (hw - 0.15), -deckT - 0.3, 0, 0.3, 0.32, p.len, 'plank', '#6a3d2a', { noInk: false });
  const piers = p.len > 9 ? [-p.len / 4, p.len / 4] : [0];
  for (const z of piers) b.box(0, -p.drop, z, p.w * 0.85, p.drop - deckT - 0.28, 0.9, 'stone', '#9da3a8');
  // railings: posts and a top rail; solid so nobody walks off the side
  const n = Math.max(2, Math.round(p.len / 2) + 1);
  for (const sx of [-1, 1]) {
    for (let k = 0; k < n; k++) {
      const z = -p.len / 2 + 0.15 + (k * (p.len - 0.3)) / (n - 1);
      b.box(sx * (hw - 0.08), 0.05, z, 0.14, 1.0, 0.14, 'plank', p.color, { ghost: true });
    }
    b.box(sx * (hw - 0.08), 0.95, 0, 0.12, 0.12, p.len, 'plank', p.color);
    b.box(sx * (hw - 0.08), 0.5, 0, 0.12, 0.1, p.len - 0.2, 'plank', p.color, { ghost: true });
    // the solid part of the railing: a thin invisible-ish wall along the edge
    b.box(sx * (hw - 0.08), 0.05, 0, 0.1, 0.95, p.len - 0.4, 'flat', p.color, { noInk: true, hidden: true });
  }
  return tidy(b.finish('bridge', { ...p }));
}
