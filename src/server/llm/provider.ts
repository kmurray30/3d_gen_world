import OpenAI from 'openai';
import type { CompactWorld, Step } from '../../shared/schema';
import { mockScript } from './mock-scripts';

export interface LlmRequest {
  system: string;
  user: string;
  /** raw inputs for providers that do not use the prompt (mock) */
  command: string;
  context: CompactWorld;
  signal: AbortSignal;
}

export interface LlmProvider {
  readonly name: string;
  stream(req: LlmRequest): AsyncIterable<string>;
}

/** Plays canned scripts chunk by chunk so the whole streaming path is exercised without an API key. */
export class MockProvider implements LlmProvider {
  readonly name = 'mock';
  constructor(private readonly delayMs = 12) {}
  async *stream(req: LlmRequest): AsyncIterable<string> {
    const steps: Step[] = mockScript(req.command, req.context);
    const text = JSON.stringify({ steps }, null, 1);
    for (let i = 0; i < text.length; i += 24) {
      if (req.signal.aborted) return;
      yield text.slice(i, i + 24);
      if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    }
  }
}

/** Any OpenAI-compatible chat completions endpoint (xAI Grok by default). */
export class OpenAICompatProvider implements LlmProvider {
  readonly name: string;
  private readonly client: OpenAI;
  constructor(
    private readonly model: string,
    apiKey: string,
    baseURL: string,
    private readonly temperature = 0.4,
  ) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.name = model;
  }
  async *stream(req: LlmRequest): AsyncIterable<string> {
    const completion = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: this.temperature,
        max_tokens: 2000,
        stream: true,
        response_format: { type: 'json_object' },
      },
      { signal: req.signal },
    );
    for await (const chunk of completion) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
