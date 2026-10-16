import type { CompactWorld } from '../../shared/schema';
import type { Vocab } from '../vocab';

/** Placeholder until M4: the mock provider ignores the prompt. */
export function buildSystemPrompt(_vocab: Vocab): string {
  return 'You are the world engine for a paper-cutout world. Reply with JSON {"steps":[...]} only.';
}

export function buildUserPrompt(command: string, ctx: CompactWorld): string {
  return `World: ${JSON.stringify(ctx)}\nCommand: ${command}`;
}
