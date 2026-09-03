import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserCredentials = vi.fn();
vi.mock('@/services/credentials', () => ({
  useLazyGetUserCredentialsQuery: () => [
    mockGetUserCredentials,
    { isLoading: false, isError: false },
  ],
}));

import { useProfileCredentials } from '../use-profile-credentials';

const credential = (name: string) => ({ credentialDetails: { name } });

describe('useProfileCredentials', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserCredentials.mockResolvedValue({ data: { data: [] } });
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('fetches credentials for the current tenant and user on mount', async () => {
    renderHook(() => useProfileCredentials({}));

    await waitFor(() => {
      expect(mockGetUserCredentials).toHaveBeenCalledWith(
        { org: 'test-tenant', username: 'test-user' },
        true,
      );
    });
  });

  it('passes maxCredentials through as a limit query', async () => {
    renderHook(() => useProfileCredentials({ maxCredentials: 5 }));

    await waitFor(() => {
      expect(mockGetUserCredentials).toHaveBeenCalledWith(
        { org: 'test-tenant', username: 'test-user', query: { limit: 5 } },
        true,
      );
    });
  });

  it('stores the fetched credentials', async () => {
    mockGetUserCredentials.mockResolvedValue({ data: { data: [credential('Badge A')] } });

    const { result } = renderHook(() => useProfileCredentials({}));

    await waitFor(() => {
      expect(result.current.fetchedCredentials).toHaveLength(1);
      expect(result.current.filteredCredentials).toHaveLength(1);
    });
  });

  it('defaults to an empty list when the response has no data', async () => {
    mockGetUserCredentials.mockResolvedValue({});

    const { result } = renderHook(() => useProfileCredentials({}));

    await waitFor(() => {
      expect(result.current.fetchedCredentials).toEqual([]);
    });
  });

  it('reports the failure and clears the list when the request throws', async () => {
    mockGetUserCredentials.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useProfileCredentials({}));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch profile credentials:',
        expect.any(Error),
      );
    });
    expect(result.current.fetchedCredentials).toEqual([]);
    expect(result.current.filteredCredentials).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters by search once the query is longer than two characters', async () => {
    mockGetUserCredentials.mockResolvedValue({
      data: { data: [credential('React Basics'), credential('Python Basics')] },
    });

    const { result, rerender } = renderHook(({ search }) => useProfileCredentials({ search }), {
      initialProps: { search: '' },
    });

    await waitFor(() => expect(result.current.fetchedCredentials).toHaveLength(2));

    rerender({ search: 'reac' });
    await waitFor(() => expect(result.current.filteredCredentials).toHaveLength(1));
    expect(result.current.filteredCredentials[0]).toMatchObject({
      credentialDetails: { name: 'React Basics' },
    });

    rerender({ search: 'ab' });
    await waitFor(() => expect(result.current.filteredCredentials).toHaveLength(2));
  });

  it('tolerates a credential with no details while searching', async () => {
    mockGetUserCredentials.mockResolvedValue({ data: { data: [{}] } });

    const { result, rerender } = renderHook(({ search }) => useProfileCredentials({ search }), {
      initialProps: { search: '' },
    });

    await waitFor(() => expect(result.current.fetchedCredentials).toHaveLength(1));

    rerender({ search: 'react' });
    await waitFor(() => expect(result.current.filteredCredentials).toEqual([]));
  });
});
