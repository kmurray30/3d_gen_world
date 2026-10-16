import path from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './env';
import { MockProvider, OpenAICompatProvider, type LlmProvider } from './llm/provider';
import { Vocab } from './vocab';

const vocab = Vocab.load(path.join(env.assetsDir, 'manifest.json'));

let provider: LlmProvider;
if (env.mockLlm || !env.xaiApiKey) {
  provider = new MockProvider();
  console.log(env.mockLlm ? '[llm] MOCK_LLM=1: playing canned scripts' : '[llm] no XAI_API_KEY: playing canned scripts');
} else {
  provider = new OpenAICompatProvider(env.llmModel, env.xaiApiKey, env.llmBaseUrl);
  console.log(`[llm] ${env.llmModel} via ${env.llmBaseUrl}`);
}

const app = createApp({
  vocab,
  provider,
  version: process.env.npm_package_version ?? '0.1.0',
  passcode: env.passcode,
  log: !env.isProd,
  onCommand: (info) => console.log(`[cmd] ${info.slug} "${info.command}" -> ${info.steps} steps in ${info.ms}ms${info.errors.length ? ` (${info.errors.length} skipped)` : ''}`),
});

serve({ fetch: app.fetch, port: env.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`[server] listening on http://0.0.0.0:${info.port} (${env.nodeEnv}); ${vocab.counts.withSprite}/${vocab.counts.words} words have sprites`);
});
