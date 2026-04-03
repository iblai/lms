import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({
  getOrg: vi.fn(() => 'test-org'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockUseGetUserPerLearnerInfoQuery = vi.fn();

vi.mock('@/services/perlearner', () => ({
  useGetUserPerLearnerInfoQuery: (...args: any[]) => mockUseGetUserPerLearnerInfoQuery(...args),
}));

import { usePerLearnerInfoQuery } from '../use-perlearner';

describe('usePerLearnerInfoQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetUserPerLearnerInfoQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => usePerLearnerInfoQuery());
    expect(result.current).toHaveProperty('userPerLearnerInfo');
    expect(result.current).toHaveProperty('userPerLearnerInfoLoading');
    expect(result.current).toHaveProperty('userPerLearnerInfoError');
  });

  it('calls query with correct params', () => {
    renderHook(() => usePerLearnerInfoQuery());
    expect(mockUseGetUserPerLearnerInfoQuery).toHaveBeenCalledWith({
      org: 'test-org',
      username: 'test-user',
      query: { meta: true },
    });
  });

  it('returns undefined userPerLearnerInfo when data is undefined', () => {
    const { result } = renderHook(() => usePerLearnerInfoQuery());
    expect(result.current.userPerLearnerInfo).toBeUndefined();
  });

  it('returns data.data as userPerLearnerInfo', () => {
    const mockData = { data: { name: 'John', courses: 5 } };
    mockUseGetUserPerLearnerInfoQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePerLearnerInfoQuery());
    expect(result.current.userPerLearnerInfo).toEqual({ name: 'John', courses: 5 });
  });

  it('returns loading state', () => {
    mockUseGetUserPerLearnerInfoQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => usePerLearnerInfoQuery());
    expect(result.current.userPerLearnerInfoLoading).toBe(true);
  });

  it('returns error state', () => {
    const mockError = { message: 'Network error' };
    mockUseGetUserPerLearnerInfoQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => usePerLearnerInfoQuery());
    expect(result.current.userPerLearnerInfoError).toEqual(mockError);
  });
});
