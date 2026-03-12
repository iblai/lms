import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetPersonnalizedSearch = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetPersonnalizedSearchQuery: vi.fn(() => [
    mockGetPersonnalizedSearch,
    { isLoading: false, isError: false },
  ]),
}));

import { usePersonnalizedCatalog } from '../use-personnalized-catalog';

describe('usePersonnalizedCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPersonnalizedSearch.mockResolvedValue({
      data: { count: 0, current_page: 1, total_pages: 1, results: [] },
    });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => usePersonnalizedCatalog());
    expect(result.current).toHaveProperty('handleSearch');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('pagination');
    expect(typeof result.current.handleSearch).toBe('function');
  });

  it('has null pagination initially', () => {
    const { result } = renderHook(() => usePersonnalizedCatalog());
    expect(result.current.pagination).toBeNull();
  });

  it('handleSearch calls getPersonnalizedSearch with correct params', async () => {
    const mockResponse = {
      data: { count: 10, current_page: 1, total_pages: 2, results: [] },
    };
    mockGetPersonnalizedSearch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePersonnalizedCatalog());
    await act(async () => {
      await result.current.handleSearch({
        username: 'test-user',
        query: 'test query',
        limit: 10,
        offset: 0,
      });
    });

    expect(mockGetPersonnalizedSearch).toHaveBeenCalledWith(
      [{ username: 'test-user', query: 'test query', limit: 10, offset: 0 }],
      true,
    );
  });

  it('updates pagination after successful search', async () => {
    const mockResponse = {
      data: { count: 25, current_page: 2, total_pages: 3 },
    };
    mockGetPersonnalizedSearch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePersonnalizedCatalog());
    await act(async () => {
      await result.current.handleSearch({ username: 'test-user' });
    });

    expect(result.current.pagination).toEqual({
      count: 25,
      current_page: 2,
      total_pages: 3,
    });
  });

  it('sets zero pagination when data is missing', async () => {
    mockGetPersonnalizedSearch.mockResolvedValue({ data: null });

    const { result } = renderHook(() => usePersonnalizedCatalog());
    await act(async () => {
      await result.current.handleSearch({ username: 'test-user' });
    });

    expect(result.current.pagination).toEqual({
      count: 0,
      current_page: 0,
      total_pages: 0,
    });
  });

  it('handleSearch returns undefined on error', async () => {
    mockGetPersonnalizedSearch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePersonnalizedCatalog());
    let response: any;
    await act(async () => {
      response = await result.current.handleSearch({ username: 'test-user' });
    });

    expect(response).toBeUndefined();
  });

  it('handleSearch returns response on success', async () => {
    const mockResponse = { data: { count: 5, current_page: 1, total_pages: 1 } };
    mockGetPersonnalizedSearch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePersonnalizedCatalog());
    let response: any;
    await act(async () => {
      response = await result.current.handleSearch({ username: 'test-user' });
    });

    expect(response).toEqual(mockResponse);
  });
});
