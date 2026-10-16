import path from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { Db } from './db';
import { env } from './env';
import { MockProvider, OpenAICompatProvider, type LlmProvider } from './llm/provider';
import { Vocab } from './vocab';

const vocab = Vocab.load(path.join(env.assetsDir, 'manifest.json'));
const db = new Db(env.dbPath);

let provider: LlmProvider;
if (env.mockLlm || !env.xaiApiKey) {
  provider = new MockProvider();
  console.log(env.mockLlm ? '[llm] MOCK_LLM=1: playing canned scripts' : '[llm] no XAI_API_KEY: playing canned scripts');
} else {
  provider = new OpenAICompatProvider(env.llmModel, env.xaiApiKey, env.llmBaseUrl);
  console.log(`[llm] ${env.llmModel} via ${env.llmBaseUrl}`);
}
if (!env.passcode) console.log('[auth] APP_PASSCODE not set: the app is open to anyone who can reach it');

const app = createApp({
  vocab,
  provider,
  db,
  version: process.env.npm_package_version ?? '0.1.0',
  auth: { passcode: env.passcode, secret: env.cookieSecret, secure: env.isProd },
  dailyCap: env.dailyCommandCap,
  log: !env.isProd || process.env.LOG_REQUESTS === '1',
});

serve({ fetch: app.fetch, port: env.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`[server] listening on http://0.0.0.0:${info.port} (${env.nodeEnv}); db ${env.dbPath}; ${vocab.counts.withSprite}/${vocab.counts.words} words have sprites`);
});
