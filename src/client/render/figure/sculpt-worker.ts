/** Sculpts figures off the main thread: a figure spec in, the model's typed arrays out (transferred, not copied). */
import type { Figure } from '../../../shared/figure/types';
import { sculpt } from '../../../shared/figure/sculpt';

const scope = self as unknown as { onmessage: ((ev: MessageEvent<{ fig: Figure; detail?: number }>) => void) | null; postMessage(m: unknown, transfer?: Transferable[]): void };

scope.onmessage = (ev) => {
  const { fig, detail } = ev.data;
  try {
    const s = sculpt(fig, { detail });
    scope.postMessage({ key: fig.key, sculpt: s }, [s.positions.buffer, s.normals.buffer, s.colors.buffer, s.skinIndex.buffer, s.skinWeight.buffer, s.indices.buffer]);
  } catch (err) {
    scope.postMessage({ key: fig.key, error: String(err) });
  }
};
