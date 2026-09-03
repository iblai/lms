import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const captureRequestError = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureRequestError }));

// Importing the real configs would call Sentry.init; the configs have their
// own suite (__tests__/sentry-configs.test.ts).
vi.mock('../sentry.server.config', () => ({}));
vi.mock('../sentry.edge.config', () => ({}));

describe('instrumentation', () => {
  const originalRuntime = process.env.NEXT_RUNTIME;
  const originalProcessOn = process.on;
  let processOn: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  const rejectionHandler = () =>
    processOn.mock.calls.find((call) => call[0] === 'unhandledRejection')?.[1];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    processOn = vi.fn();
    process.on = processOn as unknown as typeof process.on;
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.on = originalProcessOn;
    if (originalRuntime === undefined) delete process.env.NEXT_RUNTIME;
    else process.env.NEXT_RUNTIME = originalRuntime;
    warnSpy.mockRestore();
  });

  describe('nodejs runtime', () => {
    beforeEach(() => {
      process.env.NEXT_RUNTIME = 'nodejs';
    });

    it('registers an unhandledRejection handler', async () => {
      const { register } = await import('../instrumentation');

      await register();

      expect(processOn).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('suppresses the HTMLElement pre-warming rejection', async () => {
      const { register } = await import('../instrumentation');
      await register();

      rejectionHandler()?.({ message: 'HTMLElement is not defined' });

      expect(warnSpy).toHaveBeenCalledWith(
        '[Next.js] Suppressed HTMLElement error during route pre-warming (non-blocking)',
      );
    });

    it('lets every other rejection through to the default handling', async () => {
      const { register } = await import('../instrumentation');
      await register();

      rejectionHandler()?.({ message: 'database unreachable' });

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('tolerates rejections with no message', async () => {
      const { register } = await import('../instrumentation');
      await register();
      const handler = rejectionHandler();

      expect(() => {
        handler?.(null);
        handler?.(undefined);
        handler?.({});
        handler?.('a string reason');
      }).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge runtime', () => {
    it('does not register a process handler (no process in edge)', async () => {
      process.env.NEXT_RUNTIME = 'edge';
      const { register } = await import('../instrumentation');

      await register();

      expect(processOn).not.toHaveBeenCalled();
    });
  });

  it('is a no-op for an unknown runtime', async () => {
    delete process.env.NEXT_RUNTIME;
    const { register } = await import('../instrumentation');

    await expect(register()).resolves.toBeUndefined();
    expect(processOn).not.toHaveBeenCalled();
  });

  // Without this export, Next 15 server render/route errors never reach the
  // server config — console.error alone wouldn't see most of them.
  it('forwards server request errors to Sentry', async () => {
    const mod = await import('../instrumentation');

    expect(mod.onRequestError).toBe(captureRequestError);
  });
});
