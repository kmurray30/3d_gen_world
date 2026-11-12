/**
 * A signboard: two posts and a plank with painted text. Labels rows in the visuals gallery, and lets a command put
 * up "a sign that says ...".
 */
import type { GenContext, Structure } from '../types';
import { Parts, tidy } from '../build';

export interface SignboardParams {
  text: string;
  color: string;
}

export function signboard(params: Partial<SignboardParams>, _ctx: GenContext, decals: Parts['decals']): Structure {
  const text = (params.text ?? 'HELLO').toUpperCase().slice(0, 24);
  const color = params.color ?? '#c8955a';
  const textH = 0.42;
  const chars = Math.max(4, text.length);
  const tw = Math.min(textH * 6, textH * (0.55 * chars + 0.8));
  const w = tw + 0.5;
  const b = new Parts(decals);
  for (const s of [-1, 1]) b.box((s * (w - 0.3)) / 2, 0, 0, 0.14, 1.45, 0.14, 'plank', '#8a5a35');
  b.box(0, 0.85, 0, w, 0.7, 0.1, 'plank', color);
  b.sign(text, 0, 0.99, 0.06, textH, 0, '#fff3c4');
  return tidy(b.finish('signboard', { text, color }));
}
