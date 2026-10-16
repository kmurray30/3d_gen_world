import { describe, expect, it } from 'vitest';
import { StepSchema } from '../../src/shared/schema';

describe('StepSchema', () => {
  it('parses a spawn with defaults and clamps numbers', () => {
    const r = StepSchema.safeParse({ op: 'spawn', ref: 'dog', word: 'dog', at: { rel: 'offscreen' }, scale: '12' });
    expect(r.success).toBe(true);
    if (r.success && r.data.op === 'spawn') {
      expect(r.data.at).toEqual({ rel: 'offscreen', of: 'player', height: 'ground' });
      expect(r.data.scale).toBe(5);
    }
  });

  it('falls back to a sane place on garbage relations', () => {
    const r = StepSchema.safeParse({ op: 'move', id: 'dog', to: { rel: 'sideways', of: 'house_1', dist: 'kinda' } });
    expect(r.success).toBe(true);
    if (r.success && r.data.op === 'move') expect(r.data.to).toEqual({ rel: 'near', of: 'house_1', height: 'ground' });
  });

  it('reads bare-string places as relations or targets', () => {
    const a = StepSchema.safeParse({ op: 'move', id: 'dog', to: 'house_1' });
    expect(a.success && a.data.op === 'move' && a.data.to).toEqual({ rel: 'near', of: 'house_1', height: 'ground' });
    const b = StepSchema.safeParse({ op: 'spawn', ref: 'cat', word: 'cat', at: 'front' });
    expect(b.success && b.data.op === 'spawn' && b.data.at).toEqual({ rel: 'front', of: 'player', height: 'ground' });
    const c = StepSchema.safeParse({ op: 'move', id: 'dog', to: { rel: 'near', of: 'me' } });
    expect(c.success && c.data.op === 'move' && c.data.to.of).toBe('player');
  });

  it('rejects unknown ops and nested par', () => {
    expect(StepSchema.safeParse({ op: 'teleport', id: 'x' }).success).toBe(false);
    expect(StepSchema.safeParse({ op: 'par', do: [{ op: 'par', do: [] }] }).success).toBe(false);
    expect(StepSchema.safeParse({ op: 'par', do: [{ op: 'wait', dur: 1 }, { op: 'say', text: 'hi' }] }).success).toBe(true);
  });

  it('strips unknown keys and limits text', () => {
    const r = StepSchema.safeParse({ op: 'say', text: 'x'.repeat(500), id: 'dog', extra: 1 });
    expect(r.success).toBe(false);
    const ok = StepSchema.safeParse({ op: 'say', text: 'hello', extra: 1 });
    expect(ok.success).toBe(true);
    if (ok.success) expect('extra' in ok.data).toBe(false);
  });
});
