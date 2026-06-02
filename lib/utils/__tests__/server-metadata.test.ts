import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      dm: () => 'https://dm.example.com',
    },
  },
}));

import { extractTenantFromPathname, fetchPublicPlatformMembership } from '../server-metadata';

describe('extractTenantFromPathname', () => {
  it('returns the tenant segment for a /platform/<tenant>/... path', () => {
    expect(extractTenantFromPathname('/platform/acme/home')).toBe('acme');
    expect(extractTenantFromPathname('/platform/acme')).toBe('acme');
    expect(extractTenantFromPathname('/platform/acme/courses/c1?x=1')).toBe('acme');
  });

  it('returns null for non platform-scoped routes', () => {
    expect(extractTenantFromPathname('/sso-login')).toBeNull();
    expect(extractTenantFromPathname('/version')).toBeNull();
    expect(extractTenantFromPathname('/')).toBeNull();
  });

  it('returns null when the platform segment has no tenant', () => {
    expect(extractTenantFromPathname('/platform')).toBeNull();
    expect(extractTenantFromPathname('/platform/')).toBeNull();
  });

  it('returns null for null/empty input', () => {
    expect(extractTenantFromPathname(null)).toBeNull();
    expect(extractTenantFromPathname('')).toBeNull();
  });
});

describe('fetchPublicPlatformMembership', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns null without fetching when tenantKey is empty', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const result = await fetchPublicPlatformMembership('');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches the public config endpoint with the encoded platform_key', async () => {
    const payload = { platform_key: 'acme', allow_self_linking: true };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });
    global.fetch = fetchSpy as any;

    const result = await fetchPublicPlatformMembership('acme corp');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://dm.example.com/api/core/users/platforms/config/public/?platform_key=acme%20corp',
      { cache: 'no-store' },
    );
    expect(result).toEqual(payload);
  });

  it('returns null when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }) as any;

    const result = await fetchPublicPlatformMembership('acme');

    expect(result).toBeNull();
  });

  it('returns null and swallows network errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as any;

    const result = await fetchPublicPlatformMembership('acme');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
