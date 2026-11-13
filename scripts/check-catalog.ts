/**
 * Check a catalog chunk: every assigned word has an entry, every entry builds, has sane parts and size, sculpts
 * into a model, and has an act that runs in the real engine and does something on every click.
 *   npx tsx scripts/check-catalog.ts objects-01            (add --acts to print what each act does)
 */
import fs from 'node:fs';
import path from 'node:path';
import { DISTRICTS } from '../src/shared/figure/catalog/types';
import { sculpt, standsApart } from '../src/shared/figure/sculpt';
import { StepSchema, type Step } from '../src/shared/schema';
import { resolveFromFigure } from '../src/shared/engine/index';
import type { Figure } from '../src/shared/figure/types';
import { loadChunks, runAct } from './lib/act-lab';

const name = process.argv[2];
const showActs = process.argv.includes('--acts');
const file = path.resolve(`src/shared/figure/catalog/${name}.ts`);
if (!name || !fs.existsSync(file)) {
  console.error('usage: npx tsx scripts/check-catalog.ts <chunk> [--acts]   (a file in src/shared/figure/catalog/)');
  process.exit(2);
}
const entries = await loadChunks(name);
const manifest = JSON.parse(fs.readFileSync(path.resolve('assets/manifest.json'), 'utf8')).words as Record<string, { t: string; hm: number }>;
const assignFile = path.resolve(`src/shared/figure/catalog/assign/${name}.tsv`);
const assigned = fs.existsSync(assignFile)
  ? fs.readFileSync(assignFile, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => l.split('\t')[0])
  : entries.map((e) => e.key);
const seen = new Set<string>();
const errors: string[] = [];
const warns: string[] = [];
let ok = 0;

/** Steps of an act, flattened out of par blocks. */
const flat = (steps: Step[]): Step[] => steps.flatMap((s) => (s.op === 'par' ? (s.do as Step[]) : [s]));

function checkAct(where: string, f: Figure): void {
  const act = f.act;
  if (!act || !act.click?.length) {
    errors.push(`${where}: no act (every thing needs one: what it does when clicked)`);
    return;
  }
  const names = new Set(f.parts.map((p) => p.name));
  const movers = f.parts.filter((p) => p.mover);
  const sockets = new Set((f.sockets ?? []).map((s) => s.name));
  const lists = [...(act.setup ? [act.setup] : []), ...act.click];
  const refs = new Set<string>();
  for (const list of lists) {
    for (const [i, s] of list.entries()) {
      const r = StepSchema.safeParse(s);
      if (!r.success) errors.push(`${where}: act step ${i + 1} (${(s as { op?: string }).op}) is not a valid step: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`);
    }
    for (const s of flat(list)) {
      const a = s as Record<string, unknown>;
      if (a.op === 'spawn') {
        refs.add(String(a.ref));
        if (!resolveFromFigure(String(a.word))) errors.push(`${where}: act spawns "${a.word}", which has no figure (use a catalog word)`);
      }
      if (a.op === 'set' && typeof a.word === 'string' && !resolveFromFigure(a.word)) errors.push(`${where}: act turns something into "${a.word}", which has no figure`);
      if (a.op === 'detach' && typeof a.ref === 'string') refs.add(a.ref);
      if (a.id !== 'self') continue;
      const part = typeof a.part === 'string' ? a.part : undefined;
      if ((a.op === 'pose' || a.op === 'detach' || a.op === 'reattach') && part && !names.has(part)) errors.push(`${where}: act moves part "${part}", which it does not have`);
      if (a.op === 'detach' && part) {
        const p = f.parts.find((q) => q.name === part);
        if (p && !p.parent) errors.push(`${where}: act detaches "${part}", which has no parent (only a part hanging off another can come off)`);
        if (p && !p.piece && !p.mover) errors.push(`${where}: act detaches "${part}"; mark it { piece: true } so it is not melted into the body`);
      }
      if (a.op === 'operate' && part) {
        const w = part.toLowerCase();
        const stem = w.replace(/s$/, '');
        const hit = movers.some((p) => p.name.toLowerCase() === w || p.name.toLowerCase().startsWith(stem) || p.mover!.kind === stem) || ['all', 'it', 'everything'].includes(stem);
        if (!hit) errors.push(`${where}: act operates "${part}", but no part with a mover answers to that name`);
      }
      if (a.op === 'attach' && a.to === 'self' && typeof a.where === 'string' && !['top', 'held', 'front', 'inside'].includes(a.where) && !sockets.has(a.where)) errors.push(`${where}: act attaches to socket "${a.where}", which it does not have`);
    }
    for (const s of flat(list)) {
      const a = s as Record<string, unknown>;
      for (const k of ['id', 'to']) {
        const v = a[k];
        if (typeof v !== 'string' || (k === 'to' && a.op !== 'attach')) continue;
        if (v === 'self' || v === 'player') continue;
        if (v.startsWith('self.')) {
          if (!sockets.has(v.slice(5))) errors.push(`${where}: act refers to "${v}", but it has no socket "${v.slice(5)}"`);
          continue;
        }
        if (!refs.has(v)) errors.push(`${where}: act refers to "${v}", which no earlier step spawned or detached`);
      }
    }
  }
  try {
    const run = runAct(f);
    run.clicks.forEach((c, i) => {
      if (c.events === 0) errors.push(`${where}: click ${i + 1} of its act does nothing visible`);
      if (c.seconds >= 15) errors.push(`${where}: click ${i + 1} of its act runs for 15 s or more (keep acts short)`);
    });
    if (act.setup?.length && run.setupEvents === 0) errors.push(`${where}: its act setup does nothing`);
    if (showActs) console.log(`  ${where}: ${run.events.join(' | ')}`);
  } catch (err) {
    errors.push(`${where}: act fails in the engine: ${(err as Error).message}`);
  }
}

for (const en of entries) {
  const where = `${en.key}`;
  if (seen.has(en.key)) errors.push(`${where}: duplicate entry`);
  seen.add(en.key);
  if (en.extra && manifest[en.key]) errors.push(`${where}: is a vocabulary word, so it cannot be an extra (use e())`);
  else if (!en.extra && !manifest[en.key]) warns.push(`${where}: not a vocabulary word (keys must match the .tsv exactly; act-only props use x())`);
  if (!(en.d in DISTRICTS)) errors.push(`${where}: unknown district "${en.d}"`);
  if (!en.g || en.g.length > 32) errors.push(`${where}: group must be a short phrase`);
  try {
    const f = en.f();
    const names = new Set<string>();
    for (const p of f.parts) {
      if (names.has(p.name)) errors.push(`${where}: duplicate part name "${p.name}"`);
      names.add(p.name);
      if (!p.size.every((v) => Number.isFinite(v) && v > 0)) errors.push(`${where}: part ${p.name} has a bad size ${JSON.stringify(p.size)}`);
      if (![...p.at, ...(p.off ?? [0, 0, 0])].every(Number.isFinite)) errors.push(`${where}: part ${p.name} has a bad position`);
      if (p.shape === 'loft' && (!p.profile || p.profile.length < 2)) errors.push(`${where}: loft ${p.name} needs a profile of at least two sections`);
    }
    for (const p of f.parts) if (p.parent && !names.has(p.parent)) errors.push(`${where}: ${p.name} hangs off missing ${p.parent}`);
    for (const s of f.sockets ?? []) if (s.part && !names.has(s.part)) errors.push(`${where}: socket ${s.name} rides on missing part ${s.part}`);
    if (!(f.heightM > 0.005 && f.heightM < 400)) errors.push(`${where}: height ${f.heightM}`);
    const hm = manifest[en.key]?.hm;
    if (hm && (f.heightM > hm * 4 || f.heightM < hm / 4)) warns.push(`${where}: height ${f.heightM.toFixed(2)} m vs vocabulary ${hm} m (fine if the vocabulary is wrong; things must be their real size)`);
    const s = sculpt(f, { detail: 0.5 });
    const shown = f.parts.filter((p) => p.scale !== 0 && p.only !== 'paper' && p.role !== 'face');
    const pieces = shown.filter((p) => standsApart(p, f) || s.separate.includes(p.name));
    if (s.positions.length / 3 < 30 && pieces.length === 0) errors.push(`${where}: sculpted to almost nothing (${s.positions.length / 3} vertices and no separate pieces)`);
    checkAct(where, f);
    ok++;
  } catch (err) {
    errors.push(`${where}: ${(err as Error).message}`);
  }
}
const missing = assigned.filter((w) => !seen.has(w));
const extras = entries.filter((e) => e.extra).length;
if (extras > 12) warns.push(`${extras} act-only extras: keep them few (reuse vocabulary words where you can)`);
console.log(`${name}: ${ok}/${entries.length} entries build and sculpt; ${assigned.length - missing.length}/${assigned.length} assigned words covered`);
if (missing.length) console.log(`missing (${missing.length}): ${missing.slice(0, 40).join(', ')}${missing.length > 40 ? ' ...' : ''}`);
for (const w of warns.slice(0, 40)) console.log('warn  ', w);
for (const er of errors.slice(0, 200)) console.log('ERROR ', er);
if (errors.length > 200) console.log(`... and ${errors.length - 200} more errors`);
process.exit(errors.length ? 1 : 0);
