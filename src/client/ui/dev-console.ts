import type { Step } from '../../shared/schema';
import { StepSchema } from '../../shared/schema';

export const DEV_PRESETS: Record<string, Step[]> = {
  'dog walks up': [
    { op: 'spawn', ref: 'dog', word: 'dog', at: { rel: 'offscreen', of: 'player', height: 'ground' } },
    { op: 'move', id: 'dog', to: { rel: 'near', of: 'player', dist: 'close', height: 'ground' }, style: 'walk' },
    { op: 'anim', id: 'dog', name: 'hop', times: 2 },
    { op: 'say', id: 'dog', text: 'woof!' },
  ],
  'water the flower': [
    { op: 'spawn', ref: 'can', word: 'watering can', at: { rel: 'above', of: 'flower_1', height: 'low' } },
    { op: 'set', id: 'can', tilt: -45, dur: 0.5 },
    {
      op: 'par',
      do: [
        { op: 'effect', name: 'water_spray', id: 'can', dur: 2.5 },
        { op: 'set', id: 'flower_1', scale: 2.2, dur: 2.5, delay: 0.5 },
      ],
    },
    { op: 'set', id: 'flower_1', word: 'sunflower' },
    { op: 'par', do: [{ op: 'set', id: 'can', tilt: 0, dur: 0.4 }, { op: 'effect', name: 'sparkle', id: 'flower_1', dur: 1.5 }] },
    { op: 'remove', id: 'can', how: 'fade' },
  ],
  'house catches fire': [
    { op: 'set', id: 'house_1', state: { on_fire: true } },
    { op: 'effect', name: 'fire', id: 'house_1', loop: true },
    { op: 'effect', name: 'smoke', id: 'house_1', loop: true },
    { op: 'anim', id: 'house_1', name: 'shake' },
    { op: 'say', text: 'The house is on fire!' },
  ],
  'cat climbs the house and falls': [
    { op: 'spawn', ref: 'cat', word: 'cat', at: { rel: 'near', of: 'house_1', height: 'ground' } },
    { op: 'move', id: 'cat', to: { rel: 'on', of: 'house_1', height: 'ground' }, style: 'hop' },
    { op: 'say', id: 'cat', text: 'meow' },
    { op: 'wait', dur: 1 },
    { op: 'drop', id: 'cat' },
    { op: 'anim', id: 'cat', name: 'wobble' },
  ],
  'knight bows': [
    { op: 'spawn', ref: 'knight', word: 'knight', at: { rel: 'front', of: 'player', height: 'ground' }, face: 'player' },
    { op: 'set', id: 'knight', tilt: 25, dur: 0.6 },
    { op: 'wait', dur: 0.5 },
    { op: 'set', id: 'knight', tilt: 0, dur: 0.6 },
    { op: 'say', id: 'knight', text: 'My liege.' },
  ],
  'everything disappears': [{ op: 'remove', id: 'all', how: 'fade' }],
};

/** Paste-a-script panel for testing the engine without the LLM (?dev=1). */
export class DevConsole {
  private readonly panel: HTMLDivElement;
  private readonly area: HTMLTextAreaElement;

  constructor(root: HTMLElement, onRun: (steps: Step[]) => void) {
    this.panel = document.createElement('div');
    this.panel.className = 'devpanel';
    this.panel.innerHTML = `<div class="devhead">dev console</div><div class="presets"></div><textarea rows="8" spellcheck="false"></textarea><div class="devrow"><button type="button" class="run">Run</button><span class="deverr"></span></div>`;
    root.appendChild(this.panel);
    this.area = this.panel.querySelector('textarea')!;
    const presets = this.panel.querySelector('.presets')!;
    for (const [name, steps] of Object.entries(DEV_PRESETS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => {
        this.area.value = JSON.stringify(steps, null, 1);
        onRun(steps);
      });
      presets.appendChild(b);
    }
    const err = this.panel.querySelector('.deverr')!;
    this.panel.querySelector('.run')!.addEventListener('click', () => {
      err.textContent = '';
      try {
        const raw = JSON.parse(this.area.value);
        const arr: unknown[] = Array.isArray(raw) ? raw : raw.steps;
        const steps: Step[] = [];
        for (const s of arr) {
          const r = StepSchema.safeParse(s);
          if (r.success) steps.push(r.data);
          else err.textContent += `bad step: ${JSON.stringify(s).slice(0, 60)} `;
        }
        onRun(steps);
      } catch (e) {
        err.textContent = String(e);
      }
    });
    this.area.addEventListener('keydown', (e) => e.stopPropagation());
  }
}
