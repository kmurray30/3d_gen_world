import type { Action, CompactWorld, Place, ResolvedAction, ResolvedStep, Step } from '../../shared/schema';
import { StepSchema } from '../../shared/schema';
import type { Kind } from '../../shared/types';
import type { Vocab } from '../vocab';

export interface Validated {
  step?: ResolvedStep;
  errors: string[];
}

/**
 * Turns raw model steps into engine-ready steps: schema validation, ref -> unique id allocation, rewriting of
 * references, dropping actions that point at unknown entities, and word resolution against the vocabulary.
 */
export class CommandValidator {
  private readonly refs = new Map<string, string>();
  private readonly known = new Set<string>();
  private readonly kinds = new Map<string, Kind>();

  constructor(
    private readonly vocab: Vocab,
    context: CompactWorld,
  ) {
    for (const e of context.entities) {
      this.known.add(e.id);
      this.kinds.set(e.id, e.kind);
    }
  }

  handle(raw: unknown): Validated {
    const parsed = StepSchema.safeParse(raw);
    if (!parsed.success) {
      const op = (raw as { op?: unknown })?.op;
      return { errors: [`invalid step${typeof op === 'string' ? ` (${op})` : ''}: ${parsed.error.issues[0]?.message ?? 'schema'}`] };
    }
    const step: Step = parsed.data;
    const errors: string[] = [];
    if (step.op === 'par') {
      const actions = step.do.map((a) => this.action(a, errors)).filter((a): a is ResolvedAction => !!a);
      if (!actions.length) return { errors };
      return { step: actions.length === 1 ? actions[0] : { op: 'par', do: actions }, errors };
    }
    const action = this.action(step, errors);
    return action ? { step: action, errors } : { errors };
  }

  private mapId(id: string): string | null {
    if (id === 'player') return 'player';
    const viaRef = this.refs.get(id);
    if (viaRef) return viaRef;
    if (this.known.has(id)) return id;
    return null;
  }

  private place(p: Place, errors: string[]): Place | null {
    if (p.of === 'player') return p;
    const id = this.mapId(p.of);
    if (!id) {
      errors.push(`unknown target "${p.of}"`);
      return null;
    }
    return { ...p, of: id };
  }

  private face(face: string | undefined): string | undefined {
    if (!face) return undefined;
    if (face === 'player') return 'player';
    return this.mapId(face) ?? undefined;
  }

  private allocate(ref: string, word: string): string {
    const stem = (ref || word).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/_\d+$/, '') || 'thing';
    let n = 1;
    let id = `${stem}_${n}`;
    while (this.known.has(id)) id = `${stem}_${++n}`;
    this.known.add(id);
    this.refs.set(ref, id);
    return id;
  }

  private action(a: Action, errors: string[]): ResolvedAction | null {
    switch (a.op) {
      case 'spawn': {
        const at = this.place(a.at, errors);
        if (!at) return null;
        const res = this.vocab.resolve(a.word, a.alt);
        const id = this.allocate(a.ref, a.word);
        this.kinds.set(id, res.kind);
        return { ...a, at, id, res, face: this.face(a.face) };
      }
      case 'move': {
        const id = this.mapId(a.id);
        const to = this.place(a.to, errors);
        if (!id || id === 'player') {
          errors.push(`unknown id "${a.id}"`);
          return null;
        }
        if (!to) return null;
        return { ...a, id, to, face: this.face(a.face) };
      }
      case 'set': {
        const id = this.mapId(a.id);
        if (!id || id === 'player') {
          errors.push(`unknown id "${a.id}"`);
          return null;
        }
        const res = a.word ? this.vocab.resolve(a.word, a.alt, this.kinds.get(id)) : undefined;
        if (res) this.kinds.set(id, res.kind);
        return { ...a, id, res, face: this.face(a.face) };
      }
      case 'anim':
      case 'drop': {
        const id = this.mapId(a.id);
        if (!id || id === 'player') {
          errors.push(`unknown id "${a.id}"`);
          return null;
        }
        return { ...a, id };
      }
      case 'attach': {
        const id = this.mapId(a.id);
        const to = this.mapId(a.to);
        if (!id || !to || id === 'player' || to === 'player') {
          errors.push(`attach: unknown id "${!id ? a.id : a.to}"`);
          return null;
        }
        return { ...a, id, to };
      }
      case 'remove': {
        if (a.id === 'all') return a;
        const id = this.mapId(a.id);
        if (!id || id === 'player') {
          errors.push(`unknown id "${a.id}"`);
          return null;
        }
        return { ...a, id };
      }
      case 'say': {
        if (!a.id) return a;
        const id = this.mapId(a.id);
        return { ...a, id: id && id !== 'player' ? id : undefined };
      }
      case 'effect': {
        const id = a.id ? this.mapId(a.id) : undefined;
        if (a.id && (!id || id === 'player')) {
          errors.push(`effect: unknown id "${a.id}"`);
          return null;
        }
        const at = a.at ? this.place(a.at, errors) : undefined;
        if (a.at && !at) return null;
        return { ...a, id: id ?? undefined, at: at ?? undefined };
      }
      case 'wait':
        return a;
      default:
        return null;
    }
  }
}
