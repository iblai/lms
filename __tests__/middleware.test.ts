import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const applyCsp = vi.fn((_request: unknown, options: Record<string, unknown>) => ({
  __cspOptions: options,
}));
vi.mock('@iblai/iblai-js/security/next', () => ({
  applyCsp: (request: unknown, options: Record<string, unknown>) => applyCsp(request, options),
}));

const request = (pathname = '/platform/acme/courses') =>
  ({
    headers: new Headers({ host: 'skills.example.com' }),
    nextUrl: { pathname },
  }) as never;

const loadMiddleware = async () => {
  vi.resetModules();
  return await import('../middleware');
};

const lastCspOptions = () => applyCsp.mock.calls.at(-1)?.[1] as Record<string, any>;

describe('middleware', () => {
  const originalEnv = { ...process.env };
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_ASSET_CDN;
    delete process.env.CSP_PARTNER_HOSTS;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    errorSpy.mockRestore();
  });

  it('forwards the pathname to server components', async () => {
    const { middleware } = await loadMiddleware();

    middleware(request('/platform/acme/programs/p1'));

    const forwarded = lastCspOptions().requestHeaders as Headers;
    expect(forwarded.get('x-pathname')).toBe('/platform/acme/programs/p1');
  });

  it('allows the alternate IBL domains the SDK defaults miss', async () => {
    const { middleware } = await loadMiddleware();

    middleware(request());

    expect(lastCspOptions().connectSrc).toEqual(
      expect.arrayContaining([
        'https://*.iblai.org',
        'https://*.iblai.tech',
        'wss://*.iblai.org',
        'wss://*.iblai.tech',
      ]),
    );
  });

  it('adds the wss:// origin for each https:// partner host', async () => {
    process.env.CSP_PARTNER_HOSTS = 'https://*.example.edu, https://*.partner.org';
    const { middleware } = await loadMiddleware();

    middleware(request());

    expect(lastCspOptions().connectSrc).toEqual(
      expect.arrayContaining([
        'https://*.example.edu',
        'wss://*.example.edu',
        'https://*.partner.org',
        'wss://*.partner.org',
      ]),
    );
    expect(lastCspOptions().frameSrc).toEqual(
      expect.arrayContaining(['https://*.example.edu', 'https://*.partner.org']),
    );
  });

  it('defaults to the Syracuse partner host when none are configured', async () => {
    const { middleware } = await loadMiddleware();

    middleware(request());

    expect(lastCspOptions().connectSrc).toEqual(expect.arrayContaining(['https://*.syr.edu']));
  });

  describe('asset CDN origin', () => {
    it('omits CDN directives when no CDN is configured', async () => {
      const { middleware } = await loadMiddleware();

      middleware(request());

      expect(lastCspOptions().styleSrc).toEqual([]);
      expect(lastCspOptions().fontSrc).toEqual([]);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('allows the CDN origin for styles and fonts', async () => {
      process.env.NEXT_PUBLIC_ASSET_CDN = 'https://assets.ibl.ai/apps/lms/';
      const { middleware } = await loadMiddleware();

      middleware(request());

      expect(lastCspOptions().styleSrc).toEqual(['https://assets.ibl.ai']);
      expect(lastCspOptions().fontSrc).toEqual(['https://assets.ibl.ai']);
    });

    it('defaults a bare CDN host to https', async () => {
      process.env.NEXT_PUBLIC_ASSET_CDN = 'assets.ibl.ai';
      const { middleware } = await loadMiddleware();

      middleware(request());

      expect(lastCspOptions().styleSrc).toEqual(['https://assets.ibl.ai']);
    });

    // A malformed CDN value silently drops the origin from the CSP, which
    // breaks every asset the CDN serves — report it rather than swallow it.
    it('reports a malformed CDN value and omits the origin', async () => {
      process.env.NEXT_PUBLIC_ASSET_CDN = 'https://';
      const { middleware } = await loadMiddleware();

      middleware(request());

      expect(errorSpy).toHaveBeenCalledWith(
        'Invalid NEXT_PUBLIC_ASSET_CDN; CSP will omit the CDN origin:',
        expect.any(Error),
      );
      expect(lastCspOptions().styleSrc).toEqual([]);
    });
  });

  it('matches every route except Next static assets and the favicon', async () => {
    const { config } = await loadMiddleware();
    const [pattern] = config.matcher;
    const matches = (path: string) => new RegExp(`^${pattern}$`).test(path);

    expect(matches('/platform/acme/courses')).toBe(true);
    expect(matches('/_next/static/chunk.js')).toBe(false);
    expect(matches('/_next/image')).toBe(false);
    expect(matches('/favicon.ico')).toBe(false);
  });
});
