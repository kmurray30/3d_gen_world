import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import type { ResolvedStep, StreamEvent } from '../../shared/schema';
import { CommandRequestSchema, MAX_STEPS, ScriptRequestSchema } from '../../shared/schema';
import type { LlmProvider } from '../llm/provider';
import { buildSystemPrompt, buildUserPrompt } from '../llm/prompt';
import { StepStreamParser } from '../llm/stream-parser';
import { CommandValidator } from '../llm/validate';
import type { Vocab } from '../vocab';

export interface CommandDeps {
  vocab: Vocab;
  provider: LlmProvider;
  timeoutMs?: number;
  onCommand?: (info: { slug: string; command: string; steps: number; ms: number; model: string; errors: string[]; raw: string }) => void;
}

const PING_MS = 15000;

/** NDJSON streaming routes: /command runs the model, /script runs a hand-written step list through the same pipeline. */
export function commandRoutes(deps: CommandDeps): Hono {
  const app = new Hono();
  const systemPrompt = buildSystemPrompt(deps.vocab);

  const ndjsonHeaders = (c: { header: (k: string, v: string) => void }) => {
    c.header('Content-Type', 'application/x-ndjson; charset=utf-8');
    c.header('Cache-Control', 'no-cache, no-transform');
    c.header('X-Accel-Buffering', 'no');
  };

  app.post('/:slug/command', async (c) => {
    const body = CommandRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'bad request', detail: body.error.issues[0]?.message }, 400);
    const { command, context } = body.data;
    const slug = c.req.param('slug');
    ndjsonHeaders(c);
    return stream(c, async (s) => {
      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 30000);
      s.onAbort(() => controller.abort());
      const write = (ev: StreamEvent) => s.write(JSON.stringify(ev) + '\n');
      const ping = setInterval(() => void write({ t: 'ping' }), PING_MS);
      const validator = new CommandValidator(deps.vocab, context);
      const parser = new StepStreamParser();
      let steps = 0;
      const errors: string[] = [];
      let reason: string | undefined;
      let raw = '';
      try {
        await write({ t: 'meta', commandId: `${started.toString(36)}`, model: deps.provider.name });
        const req = { system: systemPrompt, user: buildUserPrompt(command, context), command, context, signal: controller.signal };
        outer: for await (const chunk of deps.provider.stream(req)) {
          raw += chunk;
          for (const text of parser.push(chunk)) {
            let raw: unknown;
            try {
              raw = JSON.parse(text);
            } catch {
              errors.push('unparseable step');
              await write({ t: 'error', msg: 'skipped an unreadable step' });
              continue;
            }
            const v = validator.handle(raw);
            errors.push(...v.errors);
            for (const e of v.errors) await write({ t: 'error', msg: e });
            if (v.step) {
              await write({ t: 'step', step: v.step });
              if (++steps >= MAX_STEPS) {
                reason = 'max steps';
                controller.abort();
                break outer;
              }
            }
          }
        }
        if (!parser.sawJson) reason = 'no json';
      } catch (err) {
        if (controller.signal.aborted && !reason) reason = 'timeout';
        else if (!controller.signal.aborted) {
          reason = 'provider error';
          await write({ t: 'error', msg: `The model failed: ${(err as Error).message}` }).catch(() => undefined);
        }
      } finally {
        clearInterval(ping);
        clearTimeout(timer);
      }
      await write({ t: 'done', steps, reason }).catch(() => undefined);
      deps.onCommand?.({ slug, command, steps, ms: Date.now() - started, model: deps.provider.name, errors, raw });
    });
  });

  app.post('/:slug/script', async (c) => {
    const body = ScriptRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'bad request', detail: body.error.issues[0]?.message }, 400);
    ndjsonHeaders(c);
    return stream(c, async (s) => {
      const write = (ev: StreamEvent) => s.write(JSON.stringify(ev) + '\n');
      const validator = new CommandValidator(deps.vocab, body.data.context);
      let steps = 0;
      await write({ t: 'meta', commandId: 'script', model: 'script' });
      for (const raw of body.data.steps) {
        const v = validator.handle(raw);
        for (const e of v.errors) await write({ t: 'error', msg: e });
        if (v.step) {
          await write({ t: 'step', step: v.step as ResolvedStep });
          steps++;
        }
      }
      await write({ t: 'done', steps });
    });
  });

  return app;
}
