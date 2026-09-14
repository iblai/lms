import * as Sentry from '@sentry/nextjs';
import { getEnv } from './config';

type ReplayIntegration = ReturnType<typeof Sentry.replayIntegration>;

let replay: ReplayIntegration | undefined;

/**
 * The replay SDK allows one instance per page: its constructor flips a
 * module-level flag that `Sentry.close()` never resets, so a second
 * `replayIntegration()` call throws "Multiple Sentry Session Replay instances
 * are not supported". The browser boots Sentry twice on runtime-configured
 * deploys (`sentry.client.config.ts`, then `<SentryInit />`), so both inits
 * must share this one instance.
 */
function getReplayIntegration(): ReplayIntegration {
  replay ??= Sentry.replayIntegration({
    // A replay only ever shows the viewer their own session, and masking the
    // course/learner text it contains would make it useless for support triage.
    maskAllText: false,
    blockAllMedia: false,
  });
  return replay;
}

/** Browser `Sentry.init` options shared by the boot-time and runtime inits. */
export function getClientSentryOptions(dsn: string) {
  return {
    dsn,
    enabled: !!dsn,
    integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] }), getReplayIntegration()],
    tracesSampleRate: 1.0,
    normalizeDepth: 3,
    environment: getEnv('NODE_ENV'),

    // Session Replay: 10% of all sessions, 100% of sessions that hit an error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  };
}
