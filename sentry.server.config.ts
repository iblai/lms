import * as Sentry from '@sentry/nextjs';
import { getEnv } from './lib/config';

// `NEXT_PUBLIC_*` values are inlined at build time, so a DSN set only in the
// container never reaches the server runtime through them. `SENTRY_DSN` is not
// inlined, which makes it the one that works for a runtime-configured deploy.
const dsn = process.env.SENTRY_DSN || getEnv('NEXT_PUBLIC_IBL_SENTRY_DSN');

Sentry.init({
  dsn,
  enabled: !!dsn,
  integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
  tracesSampleRate: 1.0,
  normalizeDepth: 3,
  environment: getEnv('NODE_ENV'),
});
