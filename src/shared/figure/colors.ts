/** Colour names authors can use instead of hex codes. */
export const C: Record<string, string> = {
  white: '#f7f5ef', black: '#2a2726', gray: '#9da3a8', grey: '#9da3a8', darkgray: '#5c6166', lightgray: '#d4d7da',
  red: '#e0473b', darkred: '#a3322a', orange: '#f0923b', yellow: '#f6d24a', gold: '#e2b23a', green: '#5aa553',
  darkgreen: '#3f7a3a', lime: '#9be34d', teal: '#3fa7a0', cyan: '#6fd3e8', blue: '#4e8fd6', navy: '#2f4f8f',
  skyblue: '#a8d8f5', purple: '#8a5fc4', violet: '#8a5fc4', pink: '#f4a1c0', magenta: '#d64fa0', brown: '#8c5a2b',
  darkbrown: '#5a3a22', tan: '#d9b98a', beige: '#f2e6cf', cream: '#fff3d6', peach: '#f9c9a3', maroon: '#8a2b3a',
  olive: '#8a8f3a', silver: '#c9ccd1', metal: '#b9c2ca', steel: '#8f99a3', iron: '#55595e', copper: '#c87a4a',
  bronze: '#b0804a', brass: '#d0a84a', wood: '#b5814e', darkwood: '#7a5230', lightwood: '#d8b07a', bark: '#7a5134',
  glass: '#a9dcf2', water: '#4f9bd6', ice: '#d6f0fa', stone: '#a7a7a0', rock: '#8f8c86', sand: '#e8d29a',
  dirt: '#8a6440', grass: '#6ab04c', leaf: '#5aa553', snow: '#f4f8fb', fire: '#ff8a2a', flame: '#ffd24a',
  rubber: '#3a3633', plastic: '#e8e4dc', paper: '#faf6ea', leather: '#8a5a35', denim: '#4a6fa5', wool: '#f1ecdc',
  chocolate: '#6b3e26', bread: '#d9a35f', crust: '#b8742f', cheese: '#f6c445', meat: '#b5543c', tomato: '#e0473b',
  lettuce: '#7cc45a', banana: '#f6dc5a', honey: '#e8a83a', milk: '#fbf9f2', coffee: '#6b4226', tea: '#c8873a',
  skin1: '#f6d2b4', skin2: '#f0c39f', skin3: '#d9a173', skin4: '#a8714a', skin5: '#7a4b2e',
};
export const col = (c: string | undefined, fallback = '#cccccc'): string => (c ? (c.startsWith('#') ? c : C[c.toLowerCase()] ?? fallback) : fallback);

const COLOR_KEYS = /color|colour|skin|hair|shirt|pants|shoes|skirt|legs|belly|hoof|nose|wing|beak|comb|scales|spikes|horns|eyes|blush|beard|glasses|stripes|fin|bands|tail/i;

/** Turn colour names into hex in an options object (top level, arrays and a nested snout). */
export function hexColors<T extends object>(o: T): T {
  const out: Record<string, unknown> = { ...(o as Record<string, unknown>) };
  for (const [k, v] of Object.entries(out)) {
    if (!COLOR_KEYS.test(k)) continue;
    if (typeof v === 'string') out[k] = col(v, v);
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'string' ? col(x, x) : x));
  }
  if (out.snout && typeof out.snout === 'object') out.snout = hexColors(out.snout as object);
  return out as T;
}
