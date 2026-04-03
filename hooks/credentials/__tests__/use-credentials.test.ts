import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockUseGetUserCredentialsQuery = vi.fn();

vi.mock('@/services/credentials', () => ({
  useGetUserCredentialsQuery: (...args: any[]) => mockUseGetUserCredentialsQuery(...args),
}));

import { useCredentials } from '../use-credentials';

describe('useCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useCredentials());
    expect(result.current).toHaveProperty('credentials');
    expect(result.current).toHaveProperty('credentialsLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('calls useGetUserCredentialsQuery with correct params', () => {
    renderHook(() => useCredentials());
    expect(mockUseGetUserCredentialsQuery).toHaveBeenCalledWith({
      org: 'test-tenant',
      username: 'test-user',
      query: { page: 1 },
    });
  });

  it('returns empty credentials when data is undefined', () => {
    const { result } = renderHook(() => useCredentials());
    expect(result.current.credentials).toEqual([]);
  });

  it('returns credentials from data when available', async () => {
    const mockCredentials = [{ id: 'cred-1' }, { id: 'cred-2' }];
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: [{ data: mockCredentials }],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCredentials());
    await waitFor(() => {
      expect(result.current.credentials).toEqual(mockCredentials);
    });
  });

  it('limits credentials when maxCredentials is provided', async () => {
    const mockCredentials = [{ id: 'cred-1' }, { id: 'cred-2' }, { id: 'cred-3' }];
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: [{ data: mockCredentials }],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCredentials({ maxCredentials: 2 }));
    await waitFor(() => {
      expect(result.current.credentials).toEqual([{ id: 'cred-1' }, { id: 'cred-2' }]);
    });
  });

  it('returns all credentials when maxCredentials is 0', async () => {
    const mockCredentials = [{ id: 'cred-1' }, { id: 'cred-2' }];
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: [{ data: mockCredentials }],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCredentials({ maxCredentials: 0 }));
    await waitFor(() => {
      expect(result.current.credentials).toEqual(mockCredentials);
    });
  });

  it('returns loading state', () => {
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useCredentials());
    expect(result.current.credentialsLoading).toBe(true);
  });

  it('returns error state', () => {
    const mockError = { message: 'Failed to fetch' };
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useCredentials());
    expect(result.current.error).toEqual(mockError);
  });

  it('handles empty data array', async () => {
    mockUseGetUserCredentialsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCredentials());
    expect(result.current.credentials).toEqual([]);
  });
});
