/**
 * What a catalog thing's act does, as a strip of numbered frames (no browser), with what happened printed:
 *   npx tsx scripts/preview-act.ts objects-03 toaster /tmp/toaster-act.png [frames per click, default 4]
 * Frame 0 is after the setup; then each click's frames in order. The act runs in the real engine.
 */
import { Canvas } from './lib/raster';
import { loadChunks, runAct, sceneSculpt } from './lib/act-lab';

const [chunk, word, out = 'act.png', perS = '4'] = process.argv.slice(2);
const list = await loadChunks(chunk);
const en = list.find((e) => e.key === word);
if (!en) {
  console.error(`no entry "${word}" in ${chunk}`);
  process.exit(2);
}
const fig = en.f();
const frames: Array<{ label: string; s: ReturnType<typeof sceneSculpt> }> = [];
const run = runAct(fig, Number(perS), (engine, label) => frames.push({ label, s: sceneSculpt(engine) }));
const cols = Math.min(8, frames.length), tile = 200;
const cv = new Canvas(cols * tile, Math.ceil(frames.length / cols) * tile);
frames.forEach((f, i) => {
  const x = (i % cols) * tile, y = Math.floor(i / cols) * tile;
  cv.rect(x, y, tile, 1, [200, 200, 200]);
  cv.rect(x, y, 1, tile, [200, 200, 200]);
  if (f.s) cv.sculpt(f.s, x, y, tile, fig.view === 'side' ? 55 : 30);
  cv.number(i, x + 4, y + 4);
  console.log(`frame ${i}: ${f.label}`);
});
cv.png(out);
console.log(`events: ${run.events.join(' | ')}`);
console.log(`clicks: ${run.clicks.map((c, i) => `${i + 1}: ${c.events} events, ${c.seconds.toFixed(1)} s`).join('; ')}`);
console.log(`wrote ${out}`);
