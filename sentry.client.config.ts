import * as Sentry from '@sentry/nextjs';
import { getEnv } from './lib/config';

// The DSN is deployment-driven. At this point in the boot sequence only the
// build-time value is available — `/env.js` (which carries the runtime value for
// containerized deploys) is injected with `strategy="afterInteractive"` in
// app/layout.tsx and hasn't run yet. `<SentryInit />` re-inits once it has, so
// this init is the build-time/dev path and stays inert when no DSN is baked in.
const dsn = getEnv('NEXT_PUBLIC_IBL_SENTRY_DSN');

Sentry.init({
  dsn,
  enabled: !!dsn,
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
    Sentry.replayIntegration({
      // A replay only ever shows the viewer their own session, and masking the
      // course/learner text it contains would make it useless for support triage.
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  normalizeDepth: 3,
  environment: getEnv('NODE_ENV'),

  // Session Replay: 10% of all sessions, 100% of sessions that hit an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
