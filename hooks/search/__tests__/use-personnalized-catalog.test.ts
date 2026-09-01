import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetPersonnalizedSearch = vi.fn();
const mockGetCatalogSearch = vi.fn();

// Declarative query mocks — tests configure the returned state and inspect
// the recorded subscription args/options.
const mockPersonnalizedQueryState = vi.hoisted(() => ({
  state: { data: undefined, isFetching: false, isError: false } as any,
  calls: [] as { args: any; options: any }[],
}));
const mockCatalogQueryState = vi.hoisted(() => ({
  state: { data: undefined, isFetching: false, isError: false } as any,
  calls: [] as { args: any; options: any }[],
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetPersonnalizedSearchQuery: vi.fn(() => [
    mockGetPersonnalizedSearch,
    { isLoading: false, isError: false },
  ]),
  useLazyGetCatalogSearchQuery: vi.fn(() => [
    mockGetCatalogSearch,
    { isLoading: false, isError: false },
  ]),
  useGetPersonnalizedSearchQuery: vi.fn((args: any, options: any) => {
    mockPersonnalizedQueryState.calls.push({ args, options });
    return options?.skip
      ? { data: undefined, isFetching: false, isError: false }
      : mockPersonnalizedQueryState.state;
  }),
  useGetCatalogSearchQuery: vi.fn((args: any, options: any) => {
    mockCatalogQueryState.calls.push({ args, options });
    return options?.skip
      ? { data: undefined, isFetching: false, isError: false }
      : mockCatalogQueryState.state;
  }),
}));

import {
  usePersonnalizedCatalog,
  usePersonnalizedCatalogQuery,
} from '../use-personnalized-catalog';

describe('usePersonnalizedCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPersonnalizedSearch.mockResolvedValue({
      data: { count: 0, current_page: 1, total_pages: 1, results: [] },
    });
    mockPersonnalizedQueryState.state = { data: undefined, isFetching: false, isError: false };
    mockPersonnalizedQueryState.calls = [];
    mockCatalogQueryState.state = { data: undefined, isFetching: false, isError: false };
    mockCatalogQueryState.calls = [];
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

describe('usePersonnalizedCatalogQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersonnalizedQueryState.state = { data: undefined, isFetching: false, isError: false };
    mockPersonnalizedQueryState.calls = [];
    mockCatalogQueryState.state = { data: undefined, isFetching: false, isError: false };
    mockCatalogQueryState.calls = [];
  });

  it('subscribes the personalized endpoint when logged in and skips the catalog one', () => {
    renderHook(() =>
      usePersonnalizedCatalogQuery({ params: { username: 'test-user' }, isLoggedIn: true }),
    );
    expect(mockPersonnalizedQueryState.calls[0].args).toEqual([{ username: 'test-user' }]);
    expect(mockPersonnalizedQueryState.calls[0].options.skip).toBe(false);
    expect(mockCatalogQueryState.calls[0].options.skip).toBe(true);
  });

  it('subscribes the catalog endpoint when logged out', () => {
    renderHook(() => usePersonnalizedCatalogQuery({ params: { username: '' }, isLoggedIn: false }));
    expect(mockCatalogQueryState.calls[0].options.skip).toBe(false);
    expect(mockPersonnalizedQueryState.calls[0].options.skip).toBe(true);
  });

  it('propagates skip to both endpoints and reports loading', () => {
    const { result } = renderHook(() =>
      usePersonnalizedCatalogQuery({ params: { username: 'test-user' }, skip: true }),
    );
    expect(mockPersonnalizedQueryState.calls[0].options.skip).toBe(true);
    expect(mockCatalogQueryState.calls[0].options.skip).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('reports loading until a payload (or an error) exists', () => {
    const { result, rerender } = renderHook(() =>
      usePersonnalizedCatalogQuery({ params: { username: 'test-user' } }),
    );
    expect(result.current.isLoading).toBe(true);

    mockPersonnalizedQueryState.state = {
      data: { results: [], count: 0 },
      isFetching: false,
      isError: false,
    };
    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it('is not loading on error, and flags isError', () => {
    mockPersonnalizedQueryState.state = { data: undefined, isFetching: false, isError: true };
    const { result } = renderHook(() =>
      usePersonnalizedCatalogQuery({ params: { username: 'test-user' } }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it('derives pagination from the payload', () => {
    mockPersonnalizedQueryState.state = {
      data: { results: [], count: 25, current_page: 2, total_pages: 3 },
      isFetching: false,
      isError: false,
    };
    const { result } = renderHook(() =>
      usePersonnalizedCatalogQuery({ params: { username: 'test-user' } }),
    );
    expect(result.current.pagination).toEqual({ count: 25, current_page: 2, total_pages: 3 });
  });

  it('keeps rendering the previous payload while a background refresh runs', () => {
    mockPersonnalizedQueryState.state = {
      data: { results: [{ id: 1 }], count: 1 },
      isFetching: true,
      isError: false,
    };
    const { result } = renderHook(() =>
      usePersonnalizedCatalogQuery({ params: { username: 'test-user' } }),
    );
    expect(result.current.data).toEqual({ results: [{ id: 1 }], count: 1 });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);
  });
});
