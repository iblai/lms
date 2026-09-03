import * as Sentry from '@sentry/nextjs';
import { getEnv } from './lib/config';

// See sentry.server.config.ts for why `SENTRY_DSN` comes first.
const dsn = process.env.SENTRY_DSN || getEnv('NEXT_PUBLIC_IBL_SENTRY_DSN');

Sentry.init({
  dsn,
  enabled: !!dsn,
  integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
  tracesSampleRate: 1.0,
  normalizeDepth: 3,
  environment: getEnv('NODE_ENV'),
});
