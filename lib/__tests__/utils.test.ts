import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, getServiceUrl, iblFetchBaseQuery, isTauriApp, isOfflineServerOrigin } from '../utils';
import { SERVICES } from '../constants';
import { config } from '../config';

// Mock the config module
vi.mock('../config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'https://lms.example.com'),
      dm: vi.fn(() => 'https://dm.example.com'),
      axd: vi.fn(() => 'https://axd.example.com'),
      studio: vi.fn(() => 'https://studio.example.com'),
    },
  },
}));

// Mock localStorage using the correct keys from LOCALSTORAGE_KEYS
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    const tokens: Record<string, string> = {
      edx_jwt_token: 'test-jwt-token',
      dm_token: 'test-dm-token',
      axd_token: 'test-axd-token',
    };
    return tokens[key] || null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock fetchBaseQuery - capture the config to test prepareHeaders
const mockFetchBaseQueryResult = vi.fn();
let capturedFetchBaseQueryConfig: any = null;
vi.mock('@reduxjs/toolkit/query/react', () => ({
  fetchBaseQuery: vi.fn((config: any) => {
    capturedFetchBaseQueryConfig = config;
    return mockFetchBaseQueryResult;
  }),
}));

describe('utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cn (className utility)', () => {
    it('merges multiple class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles conditional classes using clsx', () => {
      const result = cn('base', { conditional: true, excluded: false });
      expect(result).toBe('base conditional');
    });

    it('handles array of classes', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('merges Tailwind conflicting classes correctly', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('handles empty string', () => {
      const result = cn('base', '', 'valid');
      expect(result).toBe('base valid');
    });

    it('handles complex Tailwind merges', () => {
      const result = cn('px-4 py-2', 'px-8');
      expect(result).toBe('py-2 px-8');
    });

    it('preserves non-conflicting classes', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });
  });

  describe('getServiceUrl', () => {
    it('returns LMS URL for LMS service', () => {
      const result = getServiceUrl(SERVICES.LMS);
      expect(result).toBe('https://lms.example.com');
      expect(config.urls.lms).toHaveBeenCalled();
    });

    it('returns DM URL for DM service', () => {
      const result = getServiceUrl(SERVICES.DM);
      expect(result).toBe('https://dm.example.com');
      expect(config.urls.dm).toHaveBeenCalled();
    });

    it('returns AXD URL for AXD service', () => {
      const result = getServiceUrl(SERVICES.AXD);
      expect(result).toBe('https://axd.example.com');
      expect(config.urls.axd).toHaveBeenCalled();
    });

    it('returns STUDIO URL for STUDIO service', () => {
      const result = getServiceUrl(SERVICES.STUDIO);
      expect(result).toBe('https://studio.example.com');
      expect(config.urls.studio).toHaveBeenCalled();
    });

    it('returns DM URL as default for unknown service', () => {
      // Cast to any to test default case
      const result = getServiceUrl('UNKNOWN' as any);
      expect(result).toBe('https://dm.example.com');
    });
  });

  describe('iblFetchBaseQuery', () => {
    const mockApi = {
      signal: new AbortController().signal,
      abort: vi.fn(),
      dispatch: vi.fn(),
      getState: vi.fn(),
      extra: undefined,
      endpoint: 'test',
      type: 'query' as const,
      forced: undefined,
    };
    const extraOptions = {};

    it('returns data on successful request', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: { success: true } });

      const args = {
        url: '/test',
        service: SERVICES.DM,
        includeCredentials: false,
        isJson: true,
      };

      const result = await iblFetchBaseQuery(args, mockApi, extraOptions);
      expect(result).toEqual({ data: { success: true } });
    });

    it('throws error with string error data', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({
        error: { status: 400, data: 'Bad request error' },
      });

      const args = {
        url: '/test',
        service: SERVICES.DM,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Bad request error',
      );
    });

    it('throws error with detail in error object', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({
        error: { status: 400, data: { detail: 'Detailed error message' } },
      });

      const args = {
        url: '/test',
        service: SERVICES.LMS,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Detailed error message',
      );
    });

    it('throws error with message in error object', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({
        error: { status: 400, data: { message: 'Error message from API' } },
      });

      const args = {
        url: '/test',
        service: SERVICES.AXD,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Error message from API',
      );
    });

    it('throws Unknown server error when error object has no detail or message', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({
        error: { status: 500, data: { foo: 'bar' } },
      });

      const args = {
        url: '/test',
        service: SERVICES.STUDIO,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Unknown server error',
      );
    });

    it('throws Unknown server error for null error data', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({
        error: { status: 500, data: null },
      });

      const args = {
        url: '/test',
        service: SERVICES.DM,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Unknown server error',
      );
    });

    it('handles includeCredentials option', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: { success: true } });

      const args = {
        url: '/test',
        service: SERVICES.LMS,
        includeCredentials: true,
      };

      await iblFetchBaseQuery(args, mockApi, extraOptions);
      // Verify the function completes without error
      expect(mockFetchBaseQueryResult).toHaveBeenCalled();
    });

    it('handles isJson false option', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: { success: true } });

      const args = {
        url: '/test',
        service: SERVICES.DM,
        isJson: false,
      };

      await iblFetchBaseQuery(args, mockApi, extraOptions);
      expect(mockFetchBaseQueryResult).toHaveBeenCalled();
    });

    it('re-throws errors that have message property', async () => {
      // Error objects have a 'message' property, so isErrorObject returns true
      // and the original error is re-thrown
      const unexpectedError = new TypeError('Network failure');
      mockFetchBaseQueryResult.mockRejectedValueOnce(unexpectedError);

      const args = {
        url: '/test',
        service: SERVICES.DM,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Network failure',
      );
    });

    it('re-throws Unknown server error as-is', async () => {
      const unknownError = new Error('Unknown server error');
      mockFetchBaseQueryResult.mockRejectedValueOnce(unknownError);

      const args = {
        url: '/test',
        service: SERVICES.DM,
      };

      await expect(iblFetchBaseQuery(args, mockApi, extraOptions)).rejects.toThrow(
        'Unknown server error',
      );
    });

    it('handles different service types for proper header generation', async () => {
      // Test each service type
      const services = [SERVICES.LMS, SERVICES.DM, SERVICES.AXD, SERVICES.STUDIO];

      for (const service of services) {
        mockFetchBaseQueryResult.mockResolvedValueOnce({ data: { success: true } });

        const args = {
          url: '/test',
          service,
        };

        const result = await iblFetchBaseQuery(args, mockApi, extraOptions);
        expect(result).toEqual({ data: { success: true } });
      }
    });
  });

  describe('baseQuery configuration', () => {
    const mockApi = {
      signal: new AbortController().signal,
      abort: vi.fn(),
      dispatch: vi.fn(),
      getState: vi.fn(),
      extra: undefined,
      endpoint: 'test',
      type: 'query' as const,
      forced: undefined,
    };

    it('configures fetchBaseQuery with correct baseUrl for LMS service', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.LMS }, mockApi, {});

      expect(capturedFetchBaseQueryConfig.baseUrl).toBe('https://lms.example.com');
    });

    it('configures fetchBaseQuery with credentials omit by default', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.DM }, mockApi, {});

      expect(capturedFetchBaseQueryConfig.credentials).toBe('omit');
    });

    it('configures fetchBaseQuery with credentials omit even when includeCredentials specified', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery(
        { url: '/test', service: SERVICES.DM, includeCredentials: true },
        mockApi,
        {},
      );

      expect(capturedFetchBaseQueryConfig.credentials).toBe('omit');
    });

    it('prepareHeaders adds JWT Authorization for LMS service', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.LMS }, mockApi, {});

      // Create mock headers and call prepareHeaders
      const mockHeaders = new Map<string, string>();
      mockHeaders.set = vi.fn();

      capturedFetchBaseQueryConfig.prepareHeaders(mockHeaders);

      expect(mockHeaders.set).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'JWT test-jwt-token');
    });

    it('prepareHeaders adds Token Authorization for DM service', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.DM }, mockApi, {});

      const mockHeaders = new Map<string, string>();
      mockHeaders.set = vi.fn();

      capturedFetchBaseQueryConfig.prepareHeaders(mockHeaders);

      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Token test-dm-token');
    });

    it('prepareHeaders adds Token Authorization for AXD service', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.AXD }, mockApi, {});

      const mockHeaders = new Map<string, string>();
      mockHeaders.set = vi.fn();

      capturedFetchBaseQueryConfig.prepareHeaders(mockHeaders);

      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Token test-axd-token');
    });

    it('prepareHeaders adds JWT Authorization for STUDIO service', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.STUDIO }, mockApi, {});

      const mockHeaders = new Map<string, string>();
      mockHeaders.set = vi.fn();

      capturedFetchBaseQueryConfig.prepareHeaders(mockHeaders);

      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'JWT test-jwt-token');
    });

    it('prepareHeaders defaults to DM Token for unknown service', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: 'UNKNOWN' as any }, mockApi, {});

      const mockHeaders = new Map<string, string>();
      mockHeaders.set = vi.fn();

      capturedFetchBaseQueryConfig.prepareHeaders(mockHeaders);

      expect(mockHeaders.set).toHaveBeenCalledWith('Authorization', 'Token test-dm-token');
    });

    it('prepareHeaders does not set Content-Type when isJson is false', async () => {
      mockFetchBaseQueryResult.mockResolvedValueOnce({ data: {} });

      await iblFetchBaseQuery({ url: '/test', service: SERVICES.DM, isJson: false }, mockApi, {});

      const mockHeaders = new Map<string, string>();
      mockHeaders.set = vi.fn();

      capturedFetchBaseQueryConfig.prepareHeaders(mockHeaders);

      // Should not include Content-Type when isJson is false
      expect(mockHeaders.set).not.toHaveBeenCalledWith('Content-Type', 'application/json');
    });
  });

  describe('isTauriApp', () => {
    it('returns false when __TAURI_INTERNALS__ is not present', () => {
      delete (window as any).__TAURI_INTERNALS__;
      expect(isTauriApp()).toBe(false);
    });

    it('returns true when __TAURI_INTERNALS__ is present', () => {
      (window as any).__TAURI_INTERNALS__ = {};
      expect(isTauriApp()).toBe(true);
      delete (window as any).__TAURI_INTERNALS__;
    });
  });

  describe('isOfflineServerOrigin', () => {
    const originalLocation = window.location;

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('returns false for non-localhost origins', () => {
      expect(isOfflineServerOrigin()).toBe(false);
    });

    it('returns true for localhost:3456', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3456' },
        writable: true,
        configurable: true,
      });
      expect(isOfflineServerOrigin()).toBe(true);
    });

    it('returns true for 127.0.0.1:3456', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://127.0.0.1:3456' },
        writable: true,
        configurable: true,
      });
      expect(isOfflineServerOrigin()).toBe(true);
    });
  });
});
