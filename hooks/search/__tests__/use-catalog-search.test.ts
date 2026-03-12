import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetCatalogSearch = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetCatalogSearchQuery: vi.fn(() => [
    mockGetCatalogSearch,
    { isLoading: false, isError: false },
  ]),
}));

import { useCatalogSearch } from '../use-catalog-search';

describe('useCatalogSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCatalogSearch.mockResolvedValue({ data: { results: [] } });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useCatalogSearch());
    expect(result.current).toHaveProperty('handleSearch');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(typeof result.current.handleSearch).toBe('function');
  });

  it('returns isLoading and isError from query', () => {
    const { result } = renderHook(() => useCatalogSearch());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('handleSearch calls getCatalogSearch with wrapped params', async () => {
    const mockResponse = { data: { results: [{ id: '1', name: 'skill' }] } };
    mockGetCatalogSearch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCatalogSearch());
    let response: any;
    await act(async () => {
      response = await result.current.handleSearch({
        query: 'test',
        content: ['skills'],
        tenant: 'test-tenant',
      });
    });

    expect(mockGetCatalogSearch).toHaveBeenCalledWith(
      [{ query: 'test', content: ['skills'], tenant: 'test-tenant' }],
      true,
    );
    expect(response).toEqual(mockResponse);
  });

  it('handleSearch returns null on error', async () => {
    mockGetCatalogSearch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCatalogSearch());
    let response: any;
    await act(async () => {
      response = await result.current.handleSearch({ query: 'test' });
    });

    expect(response).toBeNull();
  });

  it('handleSearch works with minimal params', async () => {
    const mockResponse = { data: { results: [] } };
    mockGetCatalogSearch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCatalogSearch());
    await act(async () => {
      await result.current.handleSearch({});
    });

    expect(mockGetCatalogSearch).toHaveBeenCalledWith([{}], true);
  });
});
