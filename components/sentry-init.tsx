'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { getEnv } from '@/lib/config';
import { getClientSentryOptions } from '@/lib/sentry-client-options';

/**
 * Re-initializes Sentry with the DSN that `/env.js` supplies at runtime.
 *
 * `sentry.client.config.ts` runs before `/env.js` is loaded (app/layout.tsx
 * injects it with `strategy="afterInteractive"`), so in a containerized deploy —
 * where the DSN is injected per-environment rather than baked into the bundle —
 * the SDK would boot without one and send nothing. This runs after hydration,
 * once `window.__ENV__` exists, and re-inits when the effective DSN differs from
 * the one the current client holds.
 */
export function SentryInit() {
  useEffect(() => {
    const runtimeDsn = getEnv('NEXT_PUBLIC_IBL_SENTRY_DSN');
    // Nothing configured for this deployment — leave the inert client alone.
    if (!runtimeDsn) return;

    // Compare against the DSN the live client actually holds rather than the
    // build-time constant: on a runtime-configured deploy that constant is
    // empty, so trusting it would skip the re-init this component exists for.
    const currentDsn = Sentry.getClient()?.getOptions().dsn ?? '';
    if (currentDsn === runtimeDsn) return;

    Sentry.close();
    // Shares the boot-time init's replay integration — constructing a second
    // one throws "Multiple Sentry Session Replay instances are not supported".
    Sentry.init(getClientSentryOptions(runtimeDsn));
  }, []);

  return null;
}
