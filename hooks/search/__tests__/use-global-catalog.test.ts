import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

// Declarative query mock — tests configure the returned state and inspect
// the recorded subscription args/options.
const mockGlobalQueryState = vi.hoisted(() => ({
  state: { data: undefined, isFetching: false, isError: false } as any,
  calls: [] as { args: any; options: any }[],
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetSearchGlobalQuery: vi.fn((args: any, options: any) => {
    mockGlobalQueryState.calls.push({ args, options });
    return options?.skip
      ? { data: undefined, isFetching: false, isError: false }
      : mockGlobalQueryState.state;
  }),
}));

import { CATALOG_REFRESH_AFTER_SECONDS, useGlobalCatalogQuery } from '../use-global-catalog';

describe('useGlobalCatalogQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalQueryState.state = { data: undefined, isFetching: false, isError: false };
    mockGlobalQueryState.calls = [];
  });

  it('subscribes the global search endpoint with the params', () => {
    renderHook(() => useGlobalCatalogQuery({ params: { tenant: 'test-tenant', limit: 12 } }));
    expect(mockGlobalQueryState.calls[0].args).toEqual([{ tenant: 'test-tenant', limit: 12 }]);
    expect(mockGlobalQueryState.calls[0].options).toEqual({
      skip: false,
      refetchOnMountOrArgChange: CATALOG_REFRESH_AFTER_SECONDS,
    });
  });

  it('propagates skip and reports loading', () => {
    const { result } = renderHook(() => useGlobalCatalogQuery({ params: {}, skip: true }));
    expect(mockGlobalQueryState.calls[0].options.skip).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.pagination).toBeNull();
  });

  it('reports loading until a payload (or an error) exists', () => {
    const { result, rerender } = renderHook(() => useGlobalCatalogQuery({ params: {} }));
    expect(result.current.isLoading).toBe(true);

    mockGlobalQueryState.state = {
      data: { results: [], count: 0 },
      isFetching: false,
      isError: false,
    };
    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it('is not loading on error, and flags isError', () => {
    mockGlobalQueryState.state = { data: undefined, isFetching: false, isError: true };
    const { result } = renderHook(() => useGlobalCatalogQuery({ params: {} }));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it('derives pagination from the payload', () => {
    mockGlobalQueryState.state = {
      data: { results: [], count: 25, current_page: 2, total_pages: 3 },
      isFetching: false,
      isError: false,
    };
    const { result } = renderHook(() => useGlobalCatalogQuery({ params: {} }));
    expect(result.current.pagination).toEqual({ count: 25, current_page: 2, total_pages: 3 });
  });

  it('defaults missing pagination fields to 0', () => {
    mockGlobalQueryState.state = { data: { results: [] }, isFetching: false, isError: false };
    const { result } = renderHook(() => useGlobalCatalogQuery({ params: {} }));
    expect(result.current.pagination).toEqual({ count: 0, current_page: 0, total_pages: 0 });
  });

  it('keeps rendering the previous payload while a background refresh runs', () => {
    mockGlobalQueryState.state = {
      data: { results: [{ id: 1 }], count: 1 },
      isFetching: true,
      isError: false,
    };
    const { result } = renderHook(() => useGlobalCatalogQuery({ params: {} }));
    expect(result.current.data).toEqual({ results: [{ id: 1 }], count: 1 });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);
  });
});
