import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Capture the plugin options rather than running the real Sentry webpack plugin.
vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (config: Record<string, unknown>, options: Record<string, unknown>) => ({
    ...config,
    __sentryOptions: options,
  }),
}));

const loadConfig = async () => {
  vi.resetModules();
  return (await import('../next.config.mjs')).default as Record<string, any>;
};

describe('next.config sentry wiring', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_AUTH_TOKEN;
    delete process.env.SENTRY_ORG;
    delete process.env.SENTRY_PROJECT;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('wraps the Next config with withSentryConfig', async () => {
    const config = await loadConfig();

    expect(config.__sentryOptions).toBeDefined();
    // The base config survives the wrapping.
    expect(config.images).toBeDefined();
  });

  // Generating multi-GB source maps only to throw them away is what OOM-ed the
  // CI runners, so the whole pipeline is gated on the upload token.
  it('disables the sourcemap pipeline when SENTRY_AUTH_TOKEN is absent', async () => {
    const config = await loadConfig();

    expect(config.__sentryOptions.sourcemaps).toMatchObject({ disable: true });
    expect(config.__sentryOptions.widenClientFileUpload).toBe(false);
  });

  it('enables sourcemap upload when SENTRY_AUTH_TOKEN is set', async () => {
    process.env.SENTRY_AUTH_TOKEN = 'sntrys_token';

    const config = await loadConfig();

    expect(config.__sentryOptions.sourcemaps).toMatchObject({ disable: false });
    expect(config.__sentryOptions.widenClientFileUpload).toBe(true);
  });

  // Uploaded maps must not also be served publicly.
  it('deletes emitted sourcemaps after upload', async () => {
    process.env.SENTRY_AUTH_TOKEN = 'sntrys_token';

    const config = await loadConfig();

    expect(config.__sentryOptions.sourcemaps.deleteSourcemapsAfterUpload).toBe(true);
  });

  it('defaults the upload target to the ibl-ai LMS project', async () => {
    const config = await loadConfig();

    expect(config.__sentryOptions.org).toBe('ibl-ai');
    expect(config.__sentryOptions.project).toBe('lms-iblai-app');
  });

  it('lets the deployment override the org and project', async () => {
    process.env.SENTRY_ORG = 'other-org';
    process.env.SENTRY_PROJECT = 'other-project';

    const config = await loadConfig();

    expect(config.__sentryOptions.org).toBe('other-org');
    expect(config.__sentryOptions.project).toBe('other-project');
  });

  it('does not opt into Vercel monitors and strips debug logging', async () => {
    const config = await loadConfig();

    expect(config.__sentryOptions.webpack).toMatchObject({
      treeshake: { removeDebugLogging: true },
      automaticVercelMonitors: false,
    });
  });

  // Sentry's Node SDK + the OpenTelemetry instrumentation it loads rely on
  // require-in-the-middle hooks that break when bundled.
  it('keeps the Sentry/OpenTelemetry node packages external', async () => {
    const config = await loadConfig();

    expect(config.serverExternalPackages).toEqual(
      expect.arrayContaining([
        'import-in-the-middle',
        'require-in-the-middle',
        '@opentelemetry/instrumentation',
        '@sentry/node',
        '@sentry/node-core',
      ]),
    );
  });
});
