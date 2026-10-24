import type { Entity } from '../types';
import type { ResolvedStep } from '../schema';
import type { Bump } from './collide';
import type { Engine, EngineEvent } from './index';
import { dist2D } from './transform';
import { yawFacing } from './facing';

const BUMP_COOLDOWN_S = 0.8;
const MAX_REACTIONS_PER_FRAME = 8;
const PERSON_LINES = ['hey!', 'oops', 'watch it', 'excuse me', 'careful!', 'oh!'];
const ANIMAL_LINES = ['!', '?!', '!!'];

/**
 * Reactive behaviour: what happens when the player bumps things, and a few state rules (fire, water, landing).
 * Reactions never steal an entity that a script is currently moving; they wobble it instead.
 */
export class Rules {
  private readonly until = new Map<string, number>();

  constructor(private readonly engine: Engine) {
    engine.on((ev) => this.onEvent(ev));
  }

  private cool(key: string, seconds: number): boolean {
    const now = this.engine.time;
    if ((this.until.get(key) ?? -1) > now) return false;
    this.until.set(key, now + seconds);
    return true;
  }

  private run(steps: ResolvedStep[]): void {
    this.engine.run(steps, `rule_${this.engine.nextKey()}`);
  }

  /** Called once per frame with the player's contacts. */
  bumps(bumps: Bump[]): void {
    let n = 0;
    for (const b of bumps) {
      if (n >= MAX_REACTIONS_PER_FRAME) break;
      const e = this.engine.world.get(b.id);
      if (!e || !this.cool(`bump:${b.id}`, BUMP_COOLDOWN_S)) continue;
      n++;
      this.react(e, b);
    }
  }

  private react(e: Entity, b: Bump): void {
    const moving = this.engine.scheduler.isClaimed(e.id, 'xz');
    const rng = this.engine.rng;
    const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length)];
    switch (e.massClass) {
      case 'animal':
        if (moving) this.run([{ op: 'anim', id: e.id, name: 'wobble' }]);
        else
          this.run([
            { op: 'par', do: [{ op: 'move', id: e.id, to: { rel: 'away', of: 'player', dist: 'close', height: 'ground' }, speed: 'run', style: 'hop' }, { op: 'say', id: e.id, text: pick(ANIMAL_LINES), dur: 1 }] },
          ]);
        break;
      case 'person':
        if (moving) this.run([{ op: 'anim', id: e.id, name: 'wobble' }]);
        else {
          this.engine.turn(e.id, yawFacing(e.pos, this.engine.world.player.pos), undefined, undefined, `rule_${this.engine.nextKey()}`);
          this.run([
            { op: 'par', do: [{ op: 'move', id: e.id, to: { rel: rng() < 0.5 ? 'left' : 'right', of: 'player', dist: 'close', height: 'ground' }, speed: 'walk', style: 'walk' }, { op: 'say', id: e.id, text: pick(PERSON_LINES), dur: 1.5 }] },
          ]);
        }
        break;
      case 'light':
        if (!moving) {
          // nudge away from the player, then wobble
          e.pos[0] += -b.nx * 0.4;
          e.pos[2] += -b.nz * 0.4;
        }
        this.run([{ op: 'anim', id: e.id, name: 'wobble' }]);
        break;
      case 'medium':
        this.run([{ op: 'anim', id: e.id, name: 'wobble' }]);
        break;
      case 'heavy':
      default: {
        // the thing stands firm; whatever sits on it rattles
        const kids = this.engine.world.children(e.id).slice(0, 4);
        if (kids.length) this.run([{ op: 'par', do: kids.map((k) => ({ op: 'anim' as const, id: k.id, name: 'wobble' as const })) }]);
        break;
      }
    }
  }

  private onEvent(ev: EngineEvent): void {
    const w = this.engine.world;
    if (ev.type === 'stateChange' && ev.key === 'on_fire') {
      const e = w.get(ev.id);
      if (!e) return;
      if (ev.value === true) {
        for (const name of ['fire', 'smoke']) if (!e.effects.includes(name)) e.effects.push(name);
      } else if (ev.value === false) {
        e.effects = e.effects.filter((n) => n !== 'fire' && n !== 'smoke');
        this.run([{ op: 'effect', name: 'steam', id: e.id, dur: 2.5 }]);
      }
      return;
    }
    if (ev.type === 'effect' && (ev.name === 'water_spray' || ev.name === 'rain')) {
      // water puts out fires underneath / around it
      const source = ev.id ? w.get(ev.id) : undefined;
      const origin = source ? w.worldPos(source) : ev.pos;
      if (!origin) return;
      const radius = ev.name === 'rain' ? 5 : 2.5;
      for (const e of w.list()) {
        if (e.state.on_fire !== true || e.id === ev.id) continue;
        if (dist2D(w.worldPos(e), origin) <= radius + 0.5) {
          const delay = Math.min(1.5, (ev.dur ?? 2) * 0.6);
          if (this.cool(`extinguish:${e.id}`, 5)) this.run([{ op: 'set', id: e.id, state: { on_fire: false, wet: true }, delay }]);
        }
      }
      return;
    }
    if (ev.type === 'land') {
      const e = w.get(ev.id);
      if (e && this.cool(`land:${e.id}`, 0.5)) this.engine.emit({ type: 'effect', key: `dust:${e.id}:${this.engine.nextKey()}`, name: 'dust', id: e.id, dur: 0.6 });
    }
  }
}
