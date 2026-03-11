import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
  getTenant: vi.fn(() => 'test-tenant'),
}));

const mockUseGetUserMetadataQuery = vi.fn(() => ({
  data: null,
  isLoading: false,
  isError: false,
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserMetadataQuery: (...args: any[]) => mockUseGetUserMetadataQuery(...args),
}));

import { useUserMetadata } from '../use-usermetadata';
import { getUserName } from '@/utils/helpers';

describe('useUserMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns expected shape with null data initially', () => {
    const { result } = renderHook(() => useUserMetadata());
    expect(result.current).toHaveProperty('userMetaData');
    expect(result.current).toHaveProperty('userMetaDataLoading');
    expect(result.current).toHaveProperty('userMetaDataError');
  });

  it('calls useGetUserMetadataQuery with correct params', () => {
    renderHook(() => useUserMetadata());
    expect(mockUseGetUserMetadataQuery).toHaveBeenCalledWith(
      { params: { username: 'test-user' } },
      { skip: false },
    );
  });

  it('skips query when username is null', () => {
    (getUserName as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
    renderHook(() => useUserMetadata());
    expect(mockUseGetUserMetadataQuery).toHaveBeenCalledWith(
      { params: { username: null } },
      { skip: true },
    );
  });

  it('returns userMetaData from query', () => {
    const mockData = { id: 1, username: 'test-user', bio: 'Test bio' };
    mockUseGetUserMetadataQuery.mockReturnValueOnce({
      data: mockData,
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useUserMetadata());
    expect(result.current.userMetaData).toEqual(mockData);
    expect(result.current.userMetaDataLoading).toBe(false);
    expect(result.current.userMetaDataError).toBe(false);
  });

  it('returns loading state correctly', () => {
    mockUseGetUserMetadataQuery.mockReturnValueOnce({
      data: null,
      isLoading: true,
      isError: false,
    });
    const { result } = renderHook(() => useUserMetadata());
    expect(result.current.userMetaDataLoading).toBe(true);
  });

  it('returns error state correctly', () => {
    mockUseGetUserMetadataQuery.mockReturnValueOnce({
      data: null,
      isLoading: false,
      isError: true,
    });
    const { result } = renderHook(() => useUserMetadata());
    expect(result.current.userMetaDataError).toBe(true);
  });
});
