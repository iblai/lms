import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import { SentryInit } from '../sentry-init';

vi.mock('@sentry/nextjs', () => ({
  getClient: vi.fn(),
  close: vi.fn(),
  init: vi.fn(),
  captureConsoleIntegration: vi.fn(() => ({ name: 'CaptureConsole' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}));

const RUNTIME_DSN = 'https://runtime@sentry.ibl.network/1';

const setEnv = (env: Record<string, string>) => {
  Object.defineProperty(window, '__ENV__', {
    value: env,
    writable: true,
    configurable: true,
  });
};

const mockClientWithDsn = (dsn: string) => {
  vi.mocked(Sentry.getClient).mockReturnValue({
    getOptions: () => ({ dsn }),
  } as unknown as ReturnType<typeof Sentry.getClient>);
};

describe('SentryInit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Sentry.getClient).mockReturnValue(undefined);
  });

  afterEach(() => {
    setEnv({});
  });

  it('renders nothing', () => {
    setEnv({});
    const { container } = render(<SentryInit />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not initialize when no runtime DSN is configured', () => {
    setEnv({});
    render(<SentryInit />);
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.close).not.toHaveBeenCalled();
  });

  it('does not re-initialize when the live client already holds the runtime DSN', () => {
    setEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: RUNTIME_DSN });
    mockClientWithDsn(RUNTIME_DSN);

    render(<SentryInit />);

    expect(Sentry.close).not.toHaveBeenCalled();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('re-initializes when the build-time client has no DSN', () => {
    setEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: RUNTIME_DSN, NODE_ENV: 'production' });
    mockClientWithDsn('');

    render(<SentryInit />);

    expect(Sentry.close).toHaveBeenCalled();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: RUNTIME_DSN,
        environment: 'production',
        tracesSampleRate: 1.0,
        normalizeDepth: 3,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      }),
    );
    expect(Sentry.captureConsoleIntegration).toHaveBeenCalledWith({ levels: ['error'] });
    expect(Sentry.replayIntegration).toHaveBeenCalledWith({
      maskAllText: false,
      blockAllMedia: false,
    });
  });

  it('re-initializes when the live client holds a stale DSN', () => {
    setEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: RUNTIME_DSN });
    mockClientWithDsn('https://stale@sentry.ibl.network/2');

    render(<SentryInit />);

    expect(Sentry.close).toHaveBeenCalled();
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: RUNTIME_DSN }));
  });

  it('re-initializes when there is no client at all', () => {
    setEnv({ NEXT_PUBLIC_IBL_SENTRY_DSN: RUNTIME_DSN });
    vi.mocked(Sentry.getClient).mockReturnValue(undefined);

    render(<SentryInit />);

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: RUNTIME_DSN }));
  });
});
