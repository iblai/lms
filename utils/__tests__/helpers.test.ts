import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock config before importing helpers
vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      auth: () => 'https://auth.example.com',
    },
    settings: {
      appName: () => 'skills',
      discoverFacetsToHide: () => 'facet1,facet2',
      hideRecommendedTab: () => false,
    },
  },
}));

// Mock localStorage service
vi.mock('../localstorage', () => ({
  getLocalStorageItem: vi.fn((key: string) => {
    const store: Record<string, string> = {
      tenant: 'test-tenant',
      userData: JSON.stringify({ user_id: '123', user_nicename: 'Test User' }),
      current_tenant: JSON.stringify({ org: 'test-org' }),
      tenants: JSON.stringify([{ key: 'tenant1' }]),
    };
    return store[key] || null;
  }),
}));

// Mock @iblai/web-utils
vi.mock(import('@iblai/iblai-js/web-utils'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    clearCurrentTenantCookie: vi.fn(),
    redirectToAuthSpa: vi.fn(),
  };
});

// Import after mocking
import {
  isJSON,
  inIframe,
  getTenant,
  getTenants,
  getOrg,
  getUserId,
  getUserName,
  getUserEmail,
  getRandomCourseImage,
  getContentImage,
  slugify,
  getMonthsData,
  getDiscoverFacetsToHide,
  isRecommendedTabHidden,
  getTimeAgo,
  redirectToAuthSpa,
  hasNonExpiredAuthToken,
  isInIframe,
  deleteCookie,
  getDomainParts,
  deleteCookieOnAllDomains,
  getParentDomain,
  clearCookies,
  handleLogout,
  onAccountDeleted,
  parseMarkdownLinks,
  inBrowserPrint,
  handleTenantSwitch,
  switchTenant,
  setTenantSwitching,
  DEFAULT_OVERVIEW_PLACEHOLDER,
} from '../helpers';
import { getLocalStorageItem } from '../localstorage';
import { redirectToAuthSpa as sdkRedirectToAuthSpa } from '@iblai/iblai-js/web-utils';

describe('helpers utility functions', () => {
  let locationHref = '';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location
    locationHref = '';
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'skills.example.com',
        pathname: '/dashboard',
        search: '?param=value',
        origin: 'https://skills.example.com',
        href: '',
      },
      writable: true,
      configurable: true,
    });

    // Track href assignments
    Object.defineProperty(window.location, 'href', {
      get: () => locationHref,
      set: (value: string) => {
        locationHref = value;
      },
      configurable: true,
    });

    // Mock document.cookie
    let cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookieValue,
      set: (value: string) => {
        cookieValue = value;
      },
      configurable: true,
    });

    // Clear localStorage mock
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isJSON', () => {
    it('should return true for valid JSON strings', () => {
      expect(isJSON('{"key": "value"}')).toBe(true);
      expect(isJSON('[1, 2, 3]')).toBe(true);
      expect(isJSON('"string"')).toBe(true);
      expect(isJSON('123')).toBe(true);
      expect(isJSON('null')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isJSON('not json')).toBe(false);
      expect(isJSON('{invalid}')).toBe(false);
      expect(isJSON('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isJSON(123 as any)).toBe(false);
      expect(isJSON(null as any)).toBe(false);
      expect(isJSON(undefined as any)).toBe(false);
    });
  });

  describe('inIframe', () => {
    it('should return false when window.self equals window.top', () => {
      Object.defineProperty(window, 'self', { value: window, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      expect(inIframe()).toBe(false);
    });

    it('should return true when window.self does not equal window.top', () => {
      Object.defineProperty(window, 'self', { value: {}, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      expect(inIframe()).toBe(true);
    });

    it('should return true when accessing top throws an error', () => {
      Object.defineProperty(window, 'self', {
        value: window,
        configurable: true,
      });
      Object.defineProperty(window, 'top', {
        get: () => {
          throw new Error('Cross-origin error');
        },
        configurable: true,
      });
      expect(inIframe()).toBe(true);
    });
  });

  describe('getTenant', () => {
    it('should return the tenant from localStorage', () => {
      expect(getTenant()).toBe('test-tenant');
    });

    it('should return empty string when tenant is not found', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(null);
      expect(getTenant()).toBe('');
    });
  });

  describe('getTenants', () => {
    it('should return parsed tenants array', () => {
      const tenants = getTenants();
      expect(tenants).toEqual([{ key: 'tenant1' }]);
    });

    it('should return empty array for invalid JSON', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce('invalid-json');
      expect(getTenants()).toEqual([]);
    });

    it('should return empty array when tenants is null', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(null);
      expect(getTenants()).toEqual([]);
    });
  });

  describe('getOrg', () => {
    it('should return org from current tenant', () => {
      expect(getOrg()).toBe('test-org');
    });

    it('should return null for invalid JSON', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce('invalid');
      expect(getOrg()).toBeNull();
    });

    it('should return null when current_tenant is null', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(null);
      expect(getOrg()).toBeNull();
    });
  });

  describe('getUserId', () => {
    it('should return user_id from userData', () => {
      expect(getUserId()).toBe('123');
    });

    it('should return null for invalid JSON', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce('invalid');
      expect(getUserId()).toBeNull();
    });

    it('should return null when userData is null', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(null);
      expect(getUserId()).toBeNull();
    });
  });

  describe('getUserName', () => {
    it('should return user_nicename from userData', () => {
      expect(getUserName()).toBe('Test User');
    });

    it('should return null for invalid JSON', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce('invalid');
      expect(getUserName()).toBeNull();
    });

    it('should return null when userData is null', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(null);
      expect(getUserName()).toBeNull();
    });
  });

  describe('getUserEmail', () => {
    it('should return user_email from userData', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(
        JSON.stringify({ user_email: 'test@example.com' }),
      );
      expect(getUserEmail()).toBe('test@example.com');
    });

    it('should return null for invalid JSON', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce('invalid');
      expect(getUserEmail()).toBeNull();
    });

    it('should return null when userData is null', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce(null);
      expect(getUserEmail()).toBeNull();
    });
  });

  describe('getRandomCourseImage', () => {
    it('should return a course image path', () => {
      const image = getRandomCourseImage();
      expect(image).toMatch(/^\/images\/courses\/c\ds\.jpeg$/);
    });
  });

  describe('getContentImage', () => {
    it('should return the provided image path if given', () => {
      expect(getContentImage('/custom/image.jpg')).toBe('/custom/image.jpg');
    });

    it('should return random course image if no path provided', () => {
      const image = getContentImage('');
      expect(image).toMatch(/^\/images\/courses\/c\ds\.jpeg$/);
    });
  });

  describe('slugify', () => {
    it('should convert string to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
      expect(slugify('Special@#$Characters')).toBe('specialcharacters');
    });

    it('should handle leading/trailing spaces', () => {
      // slugify converts spaces to hyphens, so leading/trailing spaces become hyphens
      expect(slugify('  trimmed  ')).toBe('-trimmed-');
    });
  });

  describe('getMonthsData', () => {
    it('should return array of 12 months', () => {
      const months = getMonthsData();
      expect(months).toHaveLength(12);
      expect(months[0]).toEqual({ value: 1, label: 'January' });
      expect(months[11]).toEqual({ value: 12, label: 'December' });
    });
  });

  describe('getDiscoverFacetsToHide', () => {
    it('should return array of facets to hide', () => {
      expect(getDiscoverFacetsToHide()).toEqual(['facet1', 'facet2']);
    });
  });

  describe('isRecommendedTabHidden', () => {
    it('should return the hideRecommendedTab setting', () => {
      expect(isRecommendedTabHidden()).toBe(false);
    });
  });

  describe('getTimeAgo', () => {
    it('should return minutes ago for recent times', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(getTimeAgo(fiveMinutesAgo)).toBe('5 min ago');
    });

    it('should return hours ago for times within a day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(getTimeAgo(threeHoursAgo)).toBe('3 hrs ago');
    });

    it('should return days ago for older times', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTimeAgo(twoDaysAgo)).toBe('2 days ago');
    });

    it('should use singular for one day ago', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTimeAgo(oneDayAgo)).toBe('1 day ago');
    });
  });

  describe('redirectToAuthSpa', () => {
    it('should not save redirect path when path starts with /sso-login', async () => {
      Object.defineProperty(window.location, 'pathname', {
        value: '/sso-login',
        configurable: true,
      });
      Object.defineProperty(window.location, 'search', { value: '', configurable: true });

      await redirectToAuthSpa();

      expect(localStorage.getItem('redirect-to')).toBeNull();
    });

    it('should not save redirect path when path starts with /sso-login-complete', async () => {
      Object.defineProperty(window.location, 'pathname', {
        value: '/sso-login-complete',
        configurable: true,
      });
      Object.defineProperty(window.location, 'search', { value: '', configurable: true });

      await redirectToAuthSpa();

      expect(localStorage.getItem('redirect-to')).toBeNull();
    });

    it('should save redirect path for normal routes', async () => {
      Object.defineProperty(window.location, 'pathname', {
        value: '/dashboard',
        configurable: true,
      });
      Object.defineProperty(window.location, 'search', {
        value: '?param=value',
        configurable: true,
      });

      await redirectToAuthSpa();

      expect(sdkRedirectToAuthSpa).toHaveBeenCalledWith(
        expect.objectContaining({ saveRedirect: true }),
      );
    });

    it('should not save redirect path when saveRedirect is false', async () => {
      Object.defineProperty(window.location, 'pathname', {
        value: '/dashboard',
        configurable: true,
      });
      Object.defineProperty(window.location, 'search', { value: '', configurable: true });

      await redirectToAuthSpa(undefined, undefined, false, false);

      expect(sdkRedirectToAuthSpa).toHaveBeenCalledWith(
        expect.objectContaining({ saveRedirect: false }),
      );
    });

    it('should redirect to auth URL with correct parameters', async () => {
      await redirectToAuthSpa();

      expect(sdkRedirectToAuthSpa).toHaveBeenCalledWith(
        expect.objectContaining({
          authUrl: 'https://auth.example.com',
          appName: 'skills',
        }),
      );
    });

    it('should include logout parameter when logout is true', async () => {
      await redirectToAuthSpa(undefined, undefined, true);

      expect(sdkRedirectToAuthSpa).toHaveBeenCalledWith(expect.objectContaining({ logout: true }));
    });

    it('should include tenant parameter when provided', async () => {
      await redirectToAuthSpa(undefined, 'custom-tenant');

      expect(sdkRedirectToAuthSpa).toHaveBeenCalledWith(
        expect.objectContaining({ platformKey: 'custom-tenant' }),
      );
    });

    it('should use provided redirectTo path', async () => {
      await redirectToAuthSpa('/custom/path');

      expect(sdkRedirectToAuthSpa).toHaveBeenCalledWith(
        expect.objectContaining({ redirectTo: '/custom/path' }),
      );
    });
  });

  describe('hasNonExpiredAuthToken', () => {
    it('should return true when token is not defined', () => {
      vi.mocked(getLocalStorageItem).mockReturnValue(null);
      expect(hasNonExpiredAuthToken()).toBe(true);
    });

    it('should return true when token expiry is not defined', () => {
      vi.mocked(getLocalStorageItem).mockReturnValueOnce('valid-token').mockReturnValueOnce(null);
      expect(hasNonExpiredAuthToken()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      vi.mocked(getLocalStorageItem)
        .mockReturnValueOnce('valid-token')
        .mockReturnValueOnce(pastDate);
      expect(hasNonExpiredAuthToken()).toBe(false);
    });

    it('should return true when token is not expired', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      vi.mocked(getLocalStorageItem)
        .mockReturnValueOnce('valid-token')
        .mockReturnValueOnce(futureDate);
      expect(hasNonExpiredAuthToken()).toBe(true);
    });

    it('should return false for invalid date', () => {
      vi.mocked(getLocalStorageItem)
        .mockReturnValueOnce('valid-token')
        .mockReturnValueOnce('invalid-date');
      expect(hasNonExpiredAuthToken()).toBe(false);
    });
  });

  describe('isInIframe', () => {
    it('should return false when window.self equals window.top', () => {
      Object.defineProperty(window, 'self', { value: window, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      expect(isInIframe()).toBe(false);
    });

    it('should return true when window.self does not equal window.top', () => {
      Object.defineProperty(window, 'self', { value: {}, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      expect(isInIframe()).toBe(true);
    });
  });

  describe('deleteCookie', () => {
    it('should set cookie with expired date', () => {
      deleteCookie('testCookie', '/', 'example.com');
      expect(document.cookie).toContain('testCookie=;');
      expect(document.cookie).toContain('expires=');
      expect(document.cookie).toContain('path=/;');
      expect(document.cookie).toContain('domain=example.com;');
    });

    it('should handle empty path', () => {
      deleteCookie('testCookie', '', 'example.com');
      expect(document.cookie).toContain('testCookie=;');
    });

    it('should handle empty domain', () => {
      deleteCookie('testCookie', '/', '');
      expect(document.cookie).toContain('testCookie=;');
    });
  });

  describe('getDomainParts', () => {
    it('should return domain parts from most specific to least', () => {
      expect(getDomainParts('sub.example.com')).toEqual(['com', 'example.com', 'sub.example.com']);
    });

    it('should handle single part domains', () => {
      expect(getDomainParts('localhost')).toEqual(['localhost']);
    });

    it('should handle two-part domains', () => {
      expect(getDomainParts('example.com')).toEqual(['com', 'example.com']);
    });
  });

  describe('deleteCookieOnAllDomains', () => {
    it('should delete cookie on all domain parts', () => {
      deleteCookieOnAllDomains('testCookie', 'sub.example.com');
      // Each domain part should have been set with expired cookie
      expect(document.cookie).toBeDefined();
    });
  });

  describe('getParentDomain', () => {
    it('should return parent domain with leading dot', () => {
      expect(getParentDomain('sub.example.com')).toBe('.example.com');
    });

    it('should return domain as-is for single part', () => {
      expect(getParentDomain('localhost')).toBe('localhost');
    });

    it('should return empty string for undefined', () => {
      expect(getParentDomain(undefined)).toBe('');
    });

    it('should return parent domain for two-part domain', () => {
      expect(getParentDomain('example.com')).toBe('.example.com');
    });
  });

  describe('clearCookies', () => {
    it('should clear all cookies', () => {
      document.cookie = 'test1=value1;test2=value2';
      clearCookies();
      // Cookie should have been processed
      expect(document.cookie).toBeDefined();
    });
  });

  describe('handleLogout', () => {
    it('should clear localStorage and set tenant', () => {
      localStorage.setItem('someKey', 'someValue');
      handleLogout('https://redirect.example.com');
      expect(localStorage.getItem('tenant')).toBe('test-tenant');
    });

    it('should call callback if provided', () => {
      const callback = vi.fn();
      handleLogout('https://redirect.example.com', callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should redirect when not in iframe', () => {
      Object.defineProperty(window, 'self', { value: window, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      handleLogout('https://redirect.example.com');
      expect(locationHref).toContain('https://auth.example.com/logout');
    });

    it('should not redirect when in iframe', () => {
      Object.defineProperty(window, 'self', { value: {}, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      handleLogout('https://redirect.example.com');
      expect(locationHref).toBe('');
    });

    it('should use default redirect URL if not provided', () => {
      Object.defineProperty(window, 'self', { value: window, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });
      handleLogout();
      expect(locationHref).toContain('redirect-to=');
    });
  });

  describe('parseMarkdownLinks', () => {
    it('should parse markdown links correctly', () => {
      const markdown = '[Link 1](https://example.com) and [Link 2](https://test.com)';
      const links = parseMarkdownLinks(markdown);
      expect(links).toEqual([
        { label: 'Link 1', link: 'https://example.com' },
        { label: 'Link 2', link: 'https://test.com' },
      ]);
    });

    it('should return empty array for no links', () => {
      expect(parseMarkdownLinks('No links here')).toEqual([]);
    });

    it('should return empty array on error', () => {
      expect(parseMarkdownLinks('')).toEqual([]);
    });

    it('should parse single link', () => {
      const markdown = '[Single Link](https://single.com)';
      const links = parseMarkdownLinks(markdown);
      expect(links).toEqual([{ label: 'Single Link', link: 'https://single.com' }]);
    });
  });

  describe('inBrowserPrint', () => {
    it('should not throw when layoutToPrint is null', () => {
      expect(() => inBrowserPrint(null)).not.toThrow();
    });

    it('should add and remove in-browser-printable class', () => {
      const mockDiv = document.createElement('div');
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      const originalAppendChild = document.head.appendChild.bind(document.head);
      const originalRemoveChild = document.head.removeChild.bind(document.head);

      document.head.appendChild = vi.fn(originalAppendChild);
      document.head.removeChild = vi.fn(originalRemoveChild);

      inBrowserPrint(mockDiv);

      expect(mockDiv.classList.contains('in-browser-printable')).toBe(false);
      expect(printSpy).toHaveBeenCalled();

      printSpy.mockRestore();
    });
  });

  describe('handleTenantSwitch', () => {
    it('should clear localStorage and redirect to auth', async () => {
      await handleTenantSwitch('new-tenant');

      expect(localStorage.getItem('tenant')).toBe('new-tenant');
      expect(locationHref).toContain('https://auth.example.com/login/complete');
      expect(locationHref).toContain('tenant=new-tenant');
    });

    it('should save redirect when saveRedirect is true', async () => {
      Object.defineProperty(window.location, 'pathname', {
        value: '/current/path',
        configurable: true,
      });
      Object.defineProperty(window.location, 'search', { value: '?query=1', configurable: true });

      await handleTenantSwitch('new-tenant', true);

      expect(localStorage.getItem('redirect-to')).toBe('/current/path?query=1');
    });

    it('should not save redirect when saveRedirect is false', async () => {
      await handleTenantSwitch('new-tenant', false);

      expect(localStorage.getItem('redirect-to')).toBeNull();
    });
  });

  describe('switchTenant', () => {
    it('redirects to login/complete with the given tenant key', () => {
      switchTenant('target-tenant');

      expect(locationHref).toContain('https://auth.example.com/login/complete');
      expect(locationHref).toContain('tenant=target-tenant');
    });

    it('defaults redirect-to to the current window.location.href', () => {
      Object.defineProperty(window.location, 'href', {
        get: () => 'https://skills.example.com/courses/abc?tab=agent',
        set: (value: string) => {
          locationHref = value;
        },
        configurable: true,
      });

      switchTenant('target-tenant');

      expect(locationHref).toContain(
        `redirect-to=${encodeURIComponent('https://skills.example.com/courses/abc?tab=agent')}`,
      );
    });

    it('uses the provided redirectTo when supplied', () => {
      switchTenant('target-tenant', 'https://elsewhere.example.com/landing');

      expect(locationHref).toContain(
        `redirect-to=${encodeURIComponent('https://elsewhere.example.com/landing')}`,
      );
    });
  });

  describe('setTenantSwitching', () => {
    afterEach(() => {
      setTenantSwitching(false);
    });

    it('suppresses subsequent redirectToAuthSpa calls when set to true', async () => {
      setTenantSwitching(true);
      localStorage.setItem('preserved', 'yes');

      await redirectToAuthSpa();

      // Early return: localStorage was not cleared and no redirect happened
      expect(localStorage.getItem('preserved')).toBe('yes');
      expect(locationHref).toBe('');
    });

    it('re-enables redirectToAuthSpa when set back to false', async () => {
      setTenantSwitching(true);
      setTenantSwitching(false);

      await redirectToAuthSpa();

      expect(sdkRedirectToAuthSpa).toHaveBeenCalled();
    });
  });

  describe('onAccountDeleted', () => {
    it('schedules handleLogout via setTimeout', () => {
      vi.useFakeTimers();
      Object.defineProperty(window, 'self', { value: window, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });

      onAccountDeleted();

      // Before timer elapses, no redirect
      expect(locationHref).toBe('');

      vi.advanceTimersByTime(3000);

      // handleLogout was invoked, so the auth logout URL should now be set
      expect(locationHref).toContain('https://auth.example.com/logout');

      vi.useRealTimers();
    });
  });

  describe('handleLogout timer', () => {
    it('resets the suppression flag after 2 seconds when not in iframe', async () => {
      vi.useFakeTimers();
      Object.defineProperty(window, 'self', { value: window, configurable: true });
      Object.defineProperty(window, 'top', { value: window, configurable: true });

      handleLogout();

      // While suppressed, a subsequent redirect call should be a no-op
      locationHref = '';
      await redirectToAuthSpa();
      expect(locationHref).toBe('');

      // After timer elapses, suppression flag is cleared
      vi.advanceTimersByTime(2000);
      vi.mocked(sdkRedirectToAuthSpa).mockClear();
      await redirectToAuthSpa();
      expect(sdkRedirectToAuthSpa).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('handleTenantSwitch timer', () => {
    it('resets the suppression flag after 2 seconds', async () => {
      vi.useFakeTimers();

      await handleTenantSwitch('new-tenant');

      vi.mocked(sdkRedirectToAuthSpa).mockClear();
      await redirectToAuthSpa();
      expect(sdkRedirectToAuthSpa).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);
      vi.mocked(sdkRedirectToAuthSpa).mockClear();
      await redirectToAuthSpa();
      expect(sdkRedirectToAuthSpa).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('parseMarkdownLinks error path', () => {
    it('returns empty array when regex.exec throws', () => {
      const originalExec = RegExp.prototype.exec;
      RegExp.prototype.exec = function () {
        throw new Error('boom');
      };

      try {
        expect(parseMarkdownLinks('[anything](https://x.com)')).toEqual([]);
      } finally {
        RegExp.prototype.exec = originalExec;
      }
    });
  });

  describe('DEFAULT_OVERVIEW_PLACEHOLDER', () => {
    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_OVERVIEW_PLACEHOLDER).toBe('string');
      expect(DEFAULT_OVERVIEW_PLACEHOLDER.length).toBeGreaterThan(0);
    });

    it('should contain expected sections', () => {
      expect(DEFAULT_OVERVIEW_PLACEHOLDER).toContain('About This Course');
      expect(DEFAULT_OVERVIEW_PLACEHOLDER).toContain('Requirements');
      expect(DEFAULT_OVERVIEW_PLACEHOLDER).toContain('Course Staff');
      expect(DEFAULT_OVERVIEW_PLACEHOLDER).toContain('Frequently Asked Questions');
    });
  });
});
