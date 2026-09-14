import * as Sentry from '@sentry/nextjs';
import { getEnv } from './lib/config';
import { getClientSentryOptions } from './lib/sentry-client-options';

// The DSN is deployment-driven. At this point in the boot sequence only the
// build-time value is available — `/env.js` (which carries the runtime value for
// containerized deploys) is injected with `strategy="afterInteractive"` in
// app/layout.tsx and hasn't run yet. `<SentryInit />` re-inits once it has, so
// this init is the build-time/dev path and stays inert when no DSN is baked in.
Sentry.init(getClientSentryOptions(getEnv('NEXT_PUBLIC_IBL_SENTRY_DSN')));
