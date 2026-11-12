/** Sculpts figures off the main thread: a figure key in, the model's typed arrays out (transferred, not copied). */
import { getFigure } from '../../../shared/figure/items';
import { sculpt } from '../../../shared/figure/sculpt';

const scope = self as unknown as { onmessage: ((ev: MessageEvent<{ key: string; detail?: number }>) => void) | null; postMessage(m: unknown, transfer?: Transferable[]): void };

scope.onmessage = (ev) => {
  const key = ev.data.key;
  const fig = getFigure(key);
  if (!fig) {
    scope.postMessage({ key, error: 'unknown figure' });
    return;
  }
  const s = sculpt(fig, { detail: ev.data.detail });
  scope.postMessage({ key, sculpt: s }, [s.positions.buffer, s.normals.buffer, s.colors.buffer, s.skinIndex.buffer, s.skinWeight.buffer, s.indices.buffer]);
};
