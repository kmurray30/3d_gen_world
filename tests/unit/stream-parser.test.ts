import { describe, expect, it } from 'vitest';
import { StepStreamParser } from '../../src/server/llm/stream-parser';
import { makeRng } from '../../src/shared/engine/math';

const STEPS = [
  { op: 'spawn', ref: 'dog', word: 'dog', at: { rel: 'offscreen' } },
  { op: 'say', id: 'dog', text: 'brackets } ] and \\"quotes\\" and \\\\ and \\u00e9 inside' },
  { op: 'par', do: [{ op: 'wait', dur: 1 }, { op: 'effect', name: 'fire', id: 'house_1', loop: true }] },
  { op: 'remove', id: 'dog', how: 'fade' },
];

function replay(text: string, seed = 1): unknown[] {
  const rng = makeRng(seed);
  const p = new StepStreamParser();
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const n = 1 + Math.floor(rng() * 7);
    out.push(...p.push(text.slice(i, i + n)));
    i += n;
  }
  return out.map((s) => JSON.parse(s));
}

describe('StepStreamParser', () => {
  it('extracts every element from chunked input', () => {
    const text = JSON.stringify({ steps: STEPS }, null, 2);
    for (let seed = 1; seed <= 5; seed++) expect(replay(text, seed)).toEqual(STEPS);
  });

  it('tolerates fences, preamble, trailing text and other keys before steps', () => {
    const text = 'Sure! Here is the plan:\n```json\n' + JSON.stringify({ thought: 'the dog { walks ] in', count: 3, steps: STEPS }) + '\n```\nDone.';
    expect(replay(text)).toEqual(STEPS);
  });

  it('accepts a bare top-level array', () => {
    expect(replay(JSON.stringify(STEPS))).toEqual(STEPS);
  });

  it('emits only complete elements from a truncated stream', () => {
    const text = JSON.stringify({ steps: STEPS });
    const cut = text.slice(0, text.indexOf('"remove"') + 3);
    const got = replay(cut);
    expect(got).toEqual(STEPS.slice(0, 3));
  });

  it('ignores non-object elements and reports no json for prose', () => {
    expect(replay('{"steps":[1,"x",{"op":"wait","dur":1},null]}')).toEqual([{ op: 'wait', dur: 1 }]);
    const p = new StepStreamParser();
    p.push('I cannot do that.');
    expect(p.sawJson).toBe(false);
  });
});
