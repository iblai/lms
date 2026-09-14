import { describe, it, expect, vi, beforeEach } from 'vitest';

const replayIntegration = vi.fn((opts: unknown) => ({ name: 'Replay', opts }));

vi.mock('@sentry/nextjs', () => ({
  captureConsoleIntegration: (opts: unknown) => ({ name: 'CaptureConsole', opts }),
  replayIntegration: (opts: unknown) => replayIntegration(opts),
}));

describe('getClientSentryOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // The replay SDK throws "Multiple Sentry Session Replay instances are not
  // supported" on a second construction, and the browser inits Sentry twice on
  // runtime-configured deploys (boot-time config, then <SentryInit />).
  it('constructs the replay integration once across repeated inits', async () => {
    const { getClientSentryOptions } = await import('../sentry-client-options');

    const bootTime = getClientSentryOptions('');
    const runtime = getClientSentryOptions('https://runtime@sentry.ibl.network/1');

    expect(replayIntegration).toHaveBeenCalledTimes(1);
    expect(runtime.integrations[1]).toBe(bootTime.integrations[1]);
  });

  it('enables the client only when a DSN is present', async () => {
    const { getClientSentryOptions } = await import('../sentry-client-options');

    expect(getClientSentryOptions('')).toMatchObject({ dsn: '', enabled: false });
    expect(getClientSentryOptions('https://x@sentry.ibl.network/1')).toMatchObject({
      enabled: true,
    });
  });
});
