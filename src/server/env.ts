import path from 'node:path';

/** All server configuration comes from the environment; defaults suit local development. */
export const env = {
  port: Number(process.env.PORT ?? 8787),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dbPath: process.env.DB_PATH ?? path.resolve('data/world.db'),
  passcode: process.env.APP_PASSCODE ?? '',
  cookieSecret: process.env.COOKIE_SECRET ?? 'dev-insecure-cookie-secret-change-me',
  xaiApiKey: process.env.XAI_API_KEY ?? '',
  llmModel: process.env.LLM_MODEL ?? 'grok-4-1-fast-non-reasoning',
  llmBaseUrl: process.env.LLM_BASE_URL ?? 'https://api.x.ai/v1',
  mockLlm: process.env.MOCK_LLM === '1',
  dailyCommandCap: Number(process.env.DAILY_COMMAND_CAP ?? 500),
  clientDir: path.resolve('dist/client'),
  assetsDir: path.resolve('assets'),
  get isProd() {
    return this.nodeEnv === 'production';
  },
};
