/**
 * Prompt tuning loop: runs canned commands against the real model and reports step counts, skipped steps,
 * placeholder words and time to first step. Usage: XAI_API_KEY=... npx tsx scripts/eval-prompt.ts [n] [--record]
 */
import fs from 'node:fs';
import path from 'node:path';
import { OpenAICompatProvider } from '../src/server/llm/provider';
import { buildSystemPrompt, buildUserPrompt } from '../src/server/llm/prompt';
import { StepStreamParser } from '../src/server/llm/stream-parser';
import { CommandValidator } from '../src/server/llm/validate';
import { Vocab } from '../src/server/vocab';
import type { CompactWorld, ResolvedStep } from '../src/shared/schema';

const COMMANDS = [
  'water the flower',
  'a dog runs up to me',
  'the house catches fire',
  'a knight appears in front of me and bows',
  'a bird lands on the tree',
  'make the rock huge',
  'it starts snowing',
  'a dragon flies in and breathes fire at the house',
  'the fence falls over',
  'a wizard turns the rock into a frog',
  'throw a ball at the signpost',
  'a cat climbs the tree and falls off',
  'everyone dance',
  'put a crown on the knight',
  'the puddle freezes',
  'a car drives up and honks',
  'plant a seed and it grows into a tree',
  'the tree says hello',
  'a hoverboard appears',
  'asdkjh qwe',
];

const context: CompactWorld = {
  player: { pos: [0, 0, 0], yaw: 0 },
  entities: [
    { id: 'signpost_1', word: 'signpost', kind: 'object', pos: [-1.5, 0, -4], h: 1.8 },
    { id: 'fence_1', word: 'fence', kind: 'object', pos: [-4, 0, -5], h: 1.1 },
    { id: 'rock_1', word: 'rock', kind: 'object', pos: [3, 0, -6], h: 0.7 },
    { id: 'puddle_1', word: 'puddle', kind: 'other', pos: [1.5, 0, -9], h: 0.25 },
    { id: 'flower_1', word: 'flower', kind: 'object', pos: [5, 0, -9], h: 0.5 },
    { id: 'tree_1', word: 'tree', kind: 'object', pos: [-7, 0, -12], h: 5.5 },
    { id: 'house_1', word: 'house', kind: 'object', pos: [8, 0, -14], h: 5 },
    { id: 'knight_1', word: 'knight', kind: 'human', pos: [2, 0, -3], h: 1.8 },
  ],
};

async function main() {
  const n = Number(process.argv[2] ?? COMMANDS.length);
  const record = process.argv.includes('--record');
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('XAI_API_KEY missing');
  const vocab = Vocab.load(path.resolve('assets/manifest.json'));
  const provider = new OpenAICompatProvider(process.env.LLM_MODEL ?? 'grok-4-1-fast-non-reasoning', key, process.env.LLM_BASE_URL ?? 'https://api.x.ai/v1');
  const system = buildSystemPrompt(vocab);
  console.log(`system prompt: ${system.length} chars (~${Math.round(system.length / 3.3)} tokens)\n`);
  let totalSteps = 0;
  let totalErrors = 0;
  let placeholders = 0;
  for (const command of COMMANDS.slice(0, n)) {
    const t0 = Date.now();
    let tFirst = 0;
    const parser = new StepStreamParser();
    const validator = new CommandValidator(vocab, context);
    const steps: ResolvedStep[] = [];
    const errors: string[] = [];
    let raw = '';
    try {
      for await (const chunk of provider.stream({ system, user: buildUserPrompt(command, context), command, context, signal: new AbortController().signal })) {
        raw += chunk;
        for (const text of parser.push(chunk)) {
          if (!tFirst) tFirst = Date.now() - t0;
          try {
            const v = validator.handle(JSON.parse(text));
            errors.push(...v.errors);
            if (v.step) steps.push(v.step);
          } catch {
            errors.push('unparseable');
          }
        }
      }
    } catch (e) {
      errors.push(`provider: ${(e as Error).message}`);
    }
    const ms = Date.now() - t0;
    const flat = steps.flatMap((s) => (s.op === 'par' ? s.do : [s]));
    const ph = flat.filter((a) => (a.op === 'spawn' || a.op === 'set') && (a as { res?: { placeholder?: boolean } }).res?.placeholder).map((a) => (a as { word?: string }).word);
    totalSteps += steps.length;
    totalErrors += errors.length;
    placeholders += ph.length;
    console.log(`"${command}" -> ${steps.length} steps, first at ${tFirst}ms, total ${ms}ms${errors.length ? `, skipped: ${errors.join('; ')}` : ''}${ph.length ? `, placeholders: ${ph.join(', ')}` : ''}`);
    console.log('   ' + flat.map((a) => summarize(a)).join('  >  '));
    if (record) {
      fs.mkdirSync('tests/fixtures/llm', { recursive: true });
      fs.writeFileSync(path.join('tests/fixtures/llm', `${command.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}.txt`), raw);
    }
  }
  console.log(`\nTOTAL: ${totalSteps} steps, ${totalErrors} skipped, ${placeholders} placeholder words`);
}

function summarize(a: Record<string, unknown>): string {
  const op = a.op as string;
  const id = (a.id as string) ?? (a.ref as string) ?? '';
  switch (op) {
    case 'spawn':
      return `spawn ${a.word}->${(a as { res: { word: string } }).res.word}@${JSON.stringify(a.at)}`;
    case 'move':
      return `move ${id}->${JSON.stringify(a.to)} ${a.style ?? ''}${a.speed ?? ''}`;
    case 'set':
      return `set ${id} ${JSON.stringify({ word: (a as { res?: { word: string } }).res?.word, scale: a.scale, tilt: a.tilt, state: a.state })}`;
    case 'effect':
      return `effect ${a.name}${id ? ' on ' + id : ''}${a.loop ? ' loop' : ''}`;
    case 'say':
      return `say${id ? ' ' + id : ''}: "${a.text}"`;
    default:
      return `${op} ${id} ${a.name ?? a.how ?? a.dur ?? ''}`.trim();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
