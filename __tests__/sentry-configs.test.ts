import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const init = vi.fn();
const captureConsoleIntegration = vi.fn((opts: unknown) => ({ name: 'CaptureConsole', opts }));
const replayIntegration = vi.fn((opts: unknown) => ({ name: 'Replay', opts }));

vi.mock('@sentry/nextjs', () => ({
  init: (...args: unknown[]) => init(...args),
  captureConsoleIntegration: (opts: unknown) => captureConsoleIntegration(opts),
  replayIntegration: (opts: unknown) => replayIntegration(opts),
}));

const BROWSER_DSN = 'https://browser@sentry.ibl.network/1';
const SERVER_DSN = 'https://server@sentry.ibl.network/2';

/** The runtime config env.js publishes; `getEnv` prefers it over build-time env. */
const setRuntimeEnv = (env: Record<string, string>) => {
  Object.defineProperty(window, '__ENV__', { value: env, writable: true, configurable: true });
};

const lastInitOptions = () => init.mock.calls.at(-1)?.[0] as Record<string, any>;

describe('sentry configs', () => {
  const originalServerDsn = process.env.SENTRY_DSN;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.SENTRY_DSN;
    setRuntimeEnv({});
  });

  afterEach(() => {
    if (originalServerDsn === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = originalServerDsn;
  });

  describe('sentry.client.config', () => {
    it('initializes with the runtime DSN and console + replay integrations', async () => {
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN, NODE_ENV: 'production' });

      await import('../sentry.client.config');

      expect(lastInitOptions()).toMatchObject({
        dsn: BROWSER_DSN,
        enabled: true,
        environment: 'production',
        tracesSampleRate: 1.0,
        normalizeDepth: 3,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    });

    // captureConsoleIntegration at error level is what turns every console.error
    // in the app into a Sentry event, so the level filter is load-bearing.
    it('captures console errors only', async () => {
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN });

      await import('../sentry.client.config');

      expect(captureConsoleIntegration).toHaveBeenCalledWith({ levels: ['error'] });
    });

    it('leaves replay unmasked so support can read the session', async () => {
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN });

      await import('../sentry.client.config');

      expect(replayIntegration).toHaveBeenCalledWith({
        maskAllText: false,
        blockAllMedia: false,
      });
      expect(lastInitOptions().integrations).toHaveLength(2);
    });

    it('stays disabled when no DSN is configured', async () => {
      await import('../sentry.client.config');

      expect(lastInitOptions()).toMatchObject({ dsn: '', enabled: false });
    });
  });

  describe('sentry.server.config', () => {
    it('prefers SENTRY_DSN, which is not inlined at build time', async () => {
      process.env.SENTRY_DSN = SERVER_DSN;
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN });

      await import('../sentry.server.config');

      expect(lastInitOptions()).toMatchObject({ dsn: SERVER_DSN, enabled: true });
    });

    it('falls back to the public DSN', async () => {
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN });

      await import('../sentry.server.config');

      expect(lastInitOptions()).toMatchObject({ dsn: BROWSER_DSN, enabled: true });
    });

    it('captures console errors and omits replay (browser-only)', async () => {
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN });

      await import('../sentry.server.config');

      expect(captureConsoleIntegration).toHaveBeenCalledWith({ levels: ['error'] });
      expect(replayIntegration).not.toHaveBeenCalled();
      expect(lastInitOptions().integrations).toHaveLength(1);
    });

    it('stays disabled when no DSN is configured', async () => {
      await import('../sentry.server.config');

      expect(lastInitOptions()).toMatchObject({ enabled: false });
    });
  });

  describe('sentry.edge.config', () => {
    it('prefers SENTRY_DSN', async () => {
      process.env.SENTRY_DSN = SERVER_DSN;

      await import('../sentry.edge.config');

      expect(lastInitOptions()).toMatchObject({ dsn: SERVER_DSN, enabled: true });
    });

    it('captures console errors and omits replay', async () => {
      setRuntimeEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: BROWSER_DSN });

      await import('../sentry.edge.config');

      expect(captureConsoleIntegration).toHaveBeenCalledWith({ levels: ['error'] });
      expect(replayIntegration).not.toHaveBeenCalled();
    });

    it('stays disabled when no DSN is configured', async () => {
      await import('../sentry.edge.config');

      expect(lastInitOptions()).toMatchObject({ enabled: false });
    });
  });
});
