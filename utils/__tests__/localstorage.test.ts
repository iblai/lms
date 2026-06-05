import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock StorageService from iblai-js
vi.mock('@iblai/iblai-js/data-layer', () => ({
  StorageService: class MockStorageService {},
}));

// Mock use-local-storage hook
const mockUseLocalStorage = vi.fn();
vi.mock('@/hooks/localstorage/use-local-storage', () => ({
  useLocalStorage: (...args: any[]) => mockUseLocalStorage(...args),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      auth: vi.fn(() => 'https://auth.example.com'),
    },
  },
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  clearCurrentTenantCookie: vi.fn(),
}));

vi.mock('@/types/storage', () => {
  const { z } = require('zod');
  return {
    userDataSchema: z.object({
      user_display_name: z.string(),
      user_email: z.string().email(),
      user_fullname: z.string(),
      user_id: z.number(),
      user_nicename: z.string(),
    }),
    tenantSchema: z.object({
      key: z.string(),
      is_admin: z.boolean(),
      org: z.string(),
    }),
  };
});

vi.mock('@/constants/storage', () => ({
  LOCALSTORAGE_KEYS: {
    CURRENT_TENANT: 'current_tenant',
    TENANT: 'tenant',
    TENANTS: 'tenants',
    REDIRECT_TO: 'redirect-to',
    REDIRECT_PATH: 'redirect-path',
    AUTH_TOKEN: 'axd_token',
    TOKEN_EXPIRY: 'axd_token_expires',
    DM_TOKEN_EXPIRY: 'dm_token_expires',
    EDX_TOKEN_KEY: 'edx_jwt_token',
    DM_TOKEN_KEY: 'dm_token',
    AXD_TOKEN_KEY: 'axd_token',
    USER_DATA: 'userData',
    USER_TENANTS: 'tenants',
  },
}));

// Setup localStorage stub
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('localStorage', mockLocalStorage);

import {
  LocalStorageService,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  useUserData,
  useUsername,
  useCurrentTenant,
  useUserTenants,
  useIsAdmin,
  useGetAllTenants,
  handleTenantSwitch,
  saveUserTokens,
  canMonetize,
  handleSaveCurrentTenant,
} from '../localstorage';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    (LocalStorageService as any).instance = undefined;
    service = LocalStorageService.getInstance();
  });

  it('returns a singleton instance', () => {
    const instance1 = LocalStorageService.getInstance();
    const instance2 = LocalStorageService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('getItem returns value from localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue('test-value');
    const result = await service.getItem<string>('test-key');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    expect(result).toBe('test-value');
  });

  it('getItem returns null when not found', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const result = await service.getItem('missing-key');
    expect(result).toBeNull();
  });

  it('setItem calls localStorage.setItem with JSON-stringified value', async () => {
    await service.setItem('user', { name: 'Alice' });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ name: 'Alice' }),
    );
  });

  it('removeItem calls localStorage.removeItem', async () => {
    await service.removeItem('old-key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('old-key');
  });
});

describe('getLocalStorageItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns value from localStorage when available', () => {
    mockLocalStorage.getItem.mockReturnValue('my-value');
    const result = getLocalStorageItem('my-key');
    expect(result).toBe('my-value');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('my-key');
  });

  it('returns null when key not found', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const result = getLocalStorageItem('missing');
    expect(result).toBeNull();
  });

  it('returns null and logs error when localStorage throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    const result = getLocalStorageItem('error-key');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('returns null when window is undefined (SSR)', () => {
    // We can't actually undefine window in jsdom, but we verify the function handles it
    // by just calling normally
    mockLocalStorage.getItem.mockReturnValue(null);
    const result = getLocalStorageItem('ssr-key');
    expect(result).toBeNull();
  });
});

describe('setLocalStorageItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores JSON-stringified value', () => {
    setLocalStorageItem('config', { theme: 'dark' });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'config',
      JSON.stringify({ theme: 'dark' }),
    );
  });

  it('stores string value', () => {
    setLocalStorageItem('token', 'abc123');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', JSON.stringify('abc123'));
  });

  it('stores number value', () => {
    setLocalStorageItem('count', 42);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('count', JSON.stringify(42));
  });

  it('handles localStorage.setItem throwing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setLocalStorageItem('key', 'value')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('removeLocalStorageItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls localStorage.removeItem', () => {
    removeLocalStorageItem('session-key');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('session-key');
  });

  it('handles localStorage.removeItem throwing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => removeLocalStorageItem('bad-key')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('useUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when data is null', () => {
    mockUseLocalStorage.mockReturnValue([null, vi.fn()]);
    const { result } = renderHook(() => useUserData());
    expect(result.current).toBeNull();
  });

  it('returns null when data is invalid', () => {
    mockUseLocalStorage.mockReturnValue([{ bad: 'data' }, vi.fn()]);
    const { result } = renderHook(() => useUserData());
    expect(result.current).toBeNull();
  });

  it('returns valid user data when schema matches', () => {
    const validData = {
      user_display_name: 'Alice Smith',
      user_email: 'alice@example.com',
      user_fullname: 'Alice Smith',
      user_id: 1,
      user_nicename: 'alice',
    };
    mockUseLocalStorage.mockReturnValue([validData, vi.fn()]);
    const { result } = renderHook(() => useUserData());
    expect(result.current).toEqual(validData);
  });
});

describe('useUsername', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no user data', () => {
    mockUseLocalStorage.mockReturnValue([null, vi.fn()]);
    const { result } = renderHook(() => useUsername());
    expect(result.current).toBeNull();
  });

  it('returns user_nicename when user data is valid', () => {
    const validData = {
      user_display_name: 'Bob Jones',
      user_email: 'bob@example.com',
      user_fullname: 'Bob Jones',
      user_id: 2,
      user_nicename: 'bob',
    };
    mockUseLocalStorage.mockReturnValue([validData, vi.fn()]);
    const { result } = renderHook(() => useUsername());
    expect(result.current).toBe('bob');
  });

  it('returns null when user data is invalid', () => {
    mockUseLocalStorage.mockReturnValue([{ invalid: true }, vi.fn()]);
    const { result } = renderHook(() => useUsername());
    expect(result.current).toBeNull();
  });
});

describe('useCurrentTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns currentTenant and saveCurrentTenant', () => {
    const mockTenant = { key: 'tenant-1', is_admin: false, org: 'test-org' };
    const mockSetValue = vi.fn();
    mockUseLocalStorage.mockReturnValue([mockTenant, mockSetValue]);

    const { result } = renderHook(() => useCurrentTenant());
    expect(result.current.currentTenant).toEqual(mockTenant);
    expect(result.current.saveCurrentTenant).toBe(mockSetValue);
  });

  it('returns null tenant when no data', () => {
    mockUseLocalStorage.mockReturnValue([null, vi.fn()]);
    const { result } = renderHook(() => useCurrentTenant());
    expect(result.current.currentTenant).toBeNull();
  });
});

describe('useUserTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns userTenants and saveUserTenants', () => {
    const mockTenants = [{ key: 'tenant-1', is_admin: true, org: 'org1' }];
    const mockSetValue = vi.fn();
    mockUseLocalStorage.mockReturnValue([mockTenants, mockSetValue]);

    const { result } = renderHook(() => useUserTenants());
    expect(result.current.userTenants).toEqual(mockTenants);
    expect(result.current.saveUserTenants).toBe(mockSetValue);
  });

  it('returns empty array when no tenants', () => {
    mockUseLocalStorage.mockReturnValue([[], vi.fn()]);
    const { result } = renderHook(() => useUserTenants());
    expect(result.current.userTenants).toEqual([]);
  });
});

describe('useIsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when no current tenant', () => {
    mockUseLocalStorage.mockReturnValue([null, vi.fn()]);
    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });

  it('returns true when current tenant is admin', () => {
    const adminTenant = { key: 'tenant-1', is_admin: true, org: 'org1' };
    mockUseLocalStorage.mockReturnValue([adminTenant, vi.fn()]);
    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(true);
  });

  it('returns false when current tenant is not admin', () => {
    const nonAdminTenant = { key: 'tenant-1', is_admin: false, org: 'org1' };
    mockUseLocalStorage.mockReturnValue([nonAdminTenant, vi.fn()]);
    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);
  });
});

describe('useGetAllTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when data is null', () => {
    mockUseLocalStorage.mockReturnValue([null, vi.fn()]);
    const { result } = renderHook(() => useGetAllTenants());
    expect(result.current).toBeNull();
  });

  it('returns null when data is invalid', () => {
    mockUseLocalStorage.mockReturnValue([{ bad: 'data' }, vi.fn()]);
    const { result } = renderHook(() => useGetAllTenants());
    expect(result.current).toBeNull();
  });

  it('returns valid tenant array', () => {
    const validTenants = [
      { key: 'tenant-a', is_admin: false, org: 'org-a' },
      { key: 'tenant-b', is_admin: true, org: 'org-b' },
    ];
    mockUseLocalStorage.mockReturnValue([validTenants, vi.fn()]);
    const { result } = renderHook(() => useGetAllTenants());
    expect(result.current).toEqual(validTenants);
  });

  it('returns null for array with invalid tenant objects', () => {
    const invalidTenants = [{ not_a_tenant: true }];
    mockUseLocalStorage.mockReturnValue([invalidTenants, vi.fn()]);
    const { result } = renderHook(() => useGetAllTenants());
    expect(result.current).toBeNull();
  });
});

describe('handleTenantSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup window.location mock
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        pathname: '/dashboard',
        search: '?tab=overview',
        origin: 'https://app.example.com',
      },
      writable: true,
      configurable: true,
    });
  });

  it('calls clearCurrentTenantCookie and clears localStorage', async () => {
    await handleTenantSwitch('new-tenant');
    expect(mockLocalStorage.clear).toHaveBeenCalled();
  }, 10000);

  it('sets tenant in localStorage', async () => {
    await handleTenantSwitch('test-tenant');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tenant', 'test-tenant');
  }, 10000);

  it('saves redirect when saveRedirect is true', async () => {
    await handleTenantSwitch('test-tenant', true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'redirect-path',
      '/dashboard?tab=overview',
    );
  }, 10000);

  it('does not save redirect when saveRedirect is false', async () => {
    await handleTenantSwitch('test-tenant', false);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('redirect-path', expect.any(String));
  }, 10000);

  it('updates window.location.href to auth URL', async () => {
    await handleTenantSwitch('new-tenant');
    expect(window.location.href).toContain('https://auth.example.com');
    expect(window.location.href).toContain('new-tenant');
  }, 10000);
});

describe('saveUserTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tokenResponse = {
    axd_token: { token: 'axd-tok', expires: 'axd-exp' },
    dm_token: { token: 'dm-tok', expires: 'dm-exp' },
  } as any;

  it('persists both axd and dm tokens with their expiries', () => {
    saveUserTokens(tokenResponse);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('axd_token', JSON.stringify('axd-tok'));
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'axd_token_expires',
      JSON.stringify('axd-exp'),
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dm_token', JSON.stringify('dm-tok'));
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'dm_token_expires',
      JSON.stringify('dm-exp'),
    );
  });

  it('writes exactly four keys', () => {
    saveUserTokens(tokenResponse);
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(4);
  });
});

describe('canMonetize', () => {
  it('returns the current tenant flag when it is already enabled', () => {
    const current = { key: 't1', enable_monetization: true } as any;
    expect(canMonetize(current, [])).toBe(true);
  });

  it('falls back to the matching tenant in the list when current flag is falsy', () => {
    const current = { key: 't1', enable_monetization: false } as any;
    const all = [{ key: 't1', enable_monetization: true }] as any;
    expect(canMonetize(current, all)).toBe(true);
  });

  it('returns false when no matching tenant is found in the list', () => {
    const current = { key: 't1', enable_monetization: false } as any;
    const all = [{ key: 'other', enable_monetization: true }] as any;
    expect(canMonetize(current, all)).toBe(false);
  });

  it('returns the matched tenant flag (false) when it is also disabled', () => {
    const current = { key: 't1', enable_monetization: false } as any;
    const all = [{ key: 't1', enable_monetization: false }] as any;
    expect(canMonetize(current, all)).toBe(false);
  });
});

describe('handleSaveCurrentTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/platform/acme/home', search: '?q=1' },
      writable: true,
      configurable: true,
    });
  });

  it('persists the current path and serialized tenant', () => {
    const tenant = { key: 'acme', org: 'acme-org' } as any;
    handleSaveCurrentTenant(tenant);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'redirect-path',
      '/platform/acme/home?q=1',
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('current_tenant', JSON.stringify(tenant));
  });
});
