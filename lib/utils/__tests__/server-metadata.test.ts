import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      dm: () => 'https://dm.example.com',
    },
  },
}));

import {
  fetchAppMetadata,
  extractTenantFromCookies,
  logEnvironmentInfo,
  isDevelopment,
} from '../server-metadata';

const DEFAULTS = {
  title: 'skillsAI',
  favicon: '/favicon.ico',
  description: 'Build Your Skills with AI',
  logo: '/skills-logo.png',
};

describe('fetchAppMetadata', () => {
  const originalFetch = global.fetch;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleSpy.mockRestore();
  });

  describe('custom domain (priority 1)', () => {
    it('resolves metadata from a matching skillsai custom domain', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            count: 1,
            custom_domains: [
              { spa: 'mentorai', platform_metadata: { auth_web_mentorai: {} } },
              {
                spa: 'SkillsAI-prod',
                platform_metadata: {
                  auth_web_skillsai: {
                    title: 'Custom Title',
                    favicon: '/custom.ico',
                    display_description_info: 'Custom description',
                    display_logo: '/custom-logo.png',
                  },
                },
              },
            ],
          }),
      });
      global.fetch = fetchSpy as any;

      const result = await fetchAppMetadata('custom.example.com');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://dm.example.com/api/custom-domains?domain=custom.example.com',
        { cache: 'no-store' },
      );
      expect(result).toEqual({
        title: 'Custom Title',
        favicon: '/custom.ico',
        description: 'Custom description',
        logo: '/custom-logo.png',
      });
    });

    it('falls back to display_title_info and defaults when fields are missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            count: 1,
            custom_domains: [
              {
                spa: 'skillsai',
                platform_metadata: {
                  auth_web_skillsai: { display_title_info: 'From Display Info' },
                },
              },
            ],
          }),
      }) as any;

      const result = await fetchAppMetadata('custom.example.com');

      expect(result).toEqual({
        title: 'From Display Info',
        favicon: DEFAULTS.favicon,
        description: DEFAULTS.description,
        logo: DEFAULTS.logo,
      });
    });

    it('returns defaults when the matching domain has no auth_web_skillsai metadata', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            count: 1,
            custom_domains: [{ spa: 'skillsai', platform_metadata: {} }],
          }),
      }) as any;

      const result = await fetchAppMetadata('custom.example.com');

      expect(result).toEqual(DEFAULTS);
    });

    it('returns defaults when no custom domain matches skillsai', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            count: 1,
            custom_domains: [{ spa: 'mentorai', platform_metadata: {} }],
          }),
      }) as any;

      const result = await fetchAppMetadata('custom.example.com');

      expect(result).toEqual(DEFAULTS);
    });

    it('returns defaults when the custom domain response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }) as any;

      const result = await fetchAppMetadata('custom.example.com');

      expect(result).toEqual(DEFAULTS);
    });

    it('returns defaults and logs when the custom domain fetch throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('boom')) as any;

      const result = await fetchAppMetadata('custom.example.com');

      expect(result).toEqual(DEFAULTS);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('tenant cookie (priority 2)', () => {
    it('resolves metadata from tenant metadata when no host is provided', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            platform_key: 'acme',
            platform_name: 'Acme',
            metadata: {
              auth_web_skillsai: {
                display_title_info: 'Tenant Title',
                display_description_info: 'Tenant description',
                display_logo: '/tenant-logo.png',
                favicon: '/tenant.ico',
              },
            },
          }),
      });
      global.fetch = fetchSpy as any;

      const result = await fetchAppMetadata(undefined, 'acme');

      expect(fetchSpy).toHaveBeenCalledWith('https://dm.example.com/api/core/orgs/acme/metadata/', {
        cache: 'no-store',
      });
      expect(result).toEqual({
        title: 'Tenant Title',
        favicon: '/tenant.ico',
        description: 'Tenant description',
        logo: '/tenant-logo.png',
      });
    });

    it('returns defaults when tenant metadata has no auth_web_skillsai', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ platform_key: 'acme', metadata: {} }),
      }) as any;

      const result = await fetchAppMetadata(undefined, 'acme');

      expect(result).toEqual(DEFAULTS);
    });

    it('returns defaults when the tenant metadata response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }) as any;

      const result = await fetchAppMetadata(undefined, 'acme');

      expect(result).toEqual(DEFAULTS);
    });

    it('returns defaults and logs when the tenant metadata fetch throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('boom')) as any;

      const result = await fetchAppMetadata(undefined, 'acme');

      expect(result).toEqual(DEFAULTS);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  it('returns defaults when neither host nor tenant cookie is provided', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const result = await fetchAppMetadata();

    expect(result).toEqual(DEFAULTS);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('extractTenantFromCookies', () => {
  it('returns null for null/empty cookie strings', () => {
    expect(extractTenantFromCookies(null)).toBeNull();
    expect(extractTenantFromCookies('')).toBeNull();
  });

  it('returns the key from a valid ibl_current_tenant JSON cookie', () => {
    const cookie = `ibl_current_tenant=${encodeURIComponent(JSON.stringify({ key: 'acme' }))}`;
    expect(extractTenantFromCookies(cookie)).toBe('acme');
  });

  it('falls back to the plain tenant cookie when ibl_current_tenant is malformed', () => {
    const cookie = 'ibl_current_tenant=not-json; tenant=fallback-tenant';
    expect(extractTenantFromCookies(cookie)).toBe('fallback-tenant');
  });

  it('falls back to the plain tenant cookie when ibl_current_tenant has no key', () => {
    const cookie = `ibl_current_tenant=${encodeURIComponent(JSON.stringify({ foo: 'bar' }))}; tenant=plain`;
    expect(extractTenantFromCookies(cookie)).toBe('plain');
  });

  it('reads the plain tenant cookie among multiple cookies', () => {
    expect(extractTenantFromCookies('foo=1; tenant=acme; bar=2')).toBe('acme');
  });

  it('returns null when no tenant cookie is present', () => {
    expect(extractTenantFromCookies('foo=1; bar=2')).toBeNull();
  });
});

describe('environment helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes isDevelopment as a boolean', () => {
    expect(typeof isDevelopment).toBe('boolean');
  });

  it('logs server environment info when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logEnvironmentInfo();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[Server] Environment:'));
    logSpy.mockRestore();
  });

  it('does not log when window is defined', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logEnvironmentInfo();

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
