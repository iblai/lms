import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
}));

const { mockGetEmbeddedMentorToUse, mockUseTenantMetadata, mockGetMentors } = vi.hoisted(() => ({
  mockGetEmbeddedMentorToUse: vi.fn(() => null as { unique_id: string } | null),
  mockUseTenantMetadata: vi.fn(),
  mockGetMentors: vi.fn(),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetMentorsQuery: () => [mockGetMentors, { isLoading: false, isFetching: false }],
}));

import { useDefaultMentor } from '../use-default-mentor';

/** Queue one `getMentors` resolution per call, in order. */
function queueMentorResults(...pages: Array<{ results: any[] }>) {
  for (const page of pages) {
    mockGetMentors.mockReturnValueOnce({ unwrap: () => Promise.resolve(page) });
  }
}

describe('useDefaultMentor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEmbeddedMentorToUse.mockReturnValue(null);
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: true,
    });
  });

  it('prefers an explicitly pinned course mentor over everything else', () => {
    const { result } = renderHook(() =>
      useDefaultMentor({ tenant: 'test-tenant', courseMentor: 'course-mentor' }),
    );

    expect(result.current.mentor).toBe('course-mentor');
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it("uses the tenant's embedded mentor when no course mentor is pinned", () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor' });

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant' }));

    expect(result.current.mentor).toBe('embedded-mentor');
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it('falls back to the default-flagged recently accessed mentor', async () => {
    queueMentorResults({
      results: [
        { unique_id: 'recent-1' },
        { unique_id: 'recent-default', metadata: { default: true } },
      ],
    });

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant' }));

    await waitFor(() => expect(result.current.mentor).toBe('recent-default'));
    expect(mockGetMentors).toHaveBeenCalledWith({
      org: 'test-tenant',
      username: 'test-user',
      orderBy: 'recently_accessed_at',
      limit: 10,
    });
  });

  it('takes the first recently accessed mentor when none is flagged default', async () => {
    queueMentorResults({ results: [{ unique_id: 'recent-1' }, { unique_id: 'recent-2' }] });

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant' }));

    await waitFor(() => expect(result.current.mentor).toBe('recent-1'));
  });

  it('falls back to featured mentors when nothing was recently accessed', async () => {
    queueMentorResults(
      { results: [] },
      { results: [{ unique_id: 'featured-default', metadata: { default: true } }] },
    );

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant' }));

    await waitFor(() => expect(result.current.mentor).toBe('featured-default'));
    expect(mockGetMentors).toHaveBeenLastCalledWith({
      org: 'test-tenant',
      username: 'test-user',
      featured: true,
      limit: 10,
    });
  });

  it('reports an error and leaves the mentor null when no mentors exist', async () => {
    queueMentorResults({ results: [] }, { results: [] });
    const onError = vi.fn();

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant', onError }));

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(result.current.mentor).toBeNull();
  });

  it('reports an error when the mentor lookup rejects', async () => {
    mockGetMentors.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('boom')) });
    const onError = vi.fn();

    renderHook(() => useDefaultMentor({ tenant: 'test-tenant', onError }));

    await waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it('resolves nothing while the tenant metadata is still loading', () => {
    mockUseTenantMetadata.mockReturnValue({
      getEmbeddedMentorToUse: mockGetEmbeddedMentorToUse,
      metadataLoaded: false,
    });

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant' }));

    expect(result.current.mentor).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it('skips resolution entirely when skip is set', () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor' });

    const { result } = renderHook(() => useDefaultMentor({ tenant: 'test-tenant', skip: true }));

    expect(result.current.mentor).toBeNull();
    expect(mockGetMentors).not.toHaveBeenCalled();
  });

  it('clears the mentor when skip flips on', () => {
    mockGetEmbeddedMentorToUse.mockReturnValue({ unique_id: 'embedded-mentor' });

    const { result, rerender } = renderHook(({ skip }) => useDefaultMentor({ tenant: 't', skip }), {
      initialProps: { skip: false },
    });
    expect(result.current.mentor).toBe('embedded-mentor');

    rerender({ skip: true });

    expect(result.current.mentor).toBeNull();
  });

  it('drops a superseded in-flight resolution', async () => {
    let resolveFirst: (value: { results: any[] }) => void = () => {};
    mockGetMentors.mockReturnValueOnce({
      unwrap: () => new Promise<{ results: any[] }>((resolve) => (resolveFirst = resolve)),
    });

    const { result, rerender } = renderHook(
      ({ courseMentor }) => useDefaultMentor({ tenant: 'test-tenant', courseMentor }),
      { initialProps: { courseMentor: null as string | null } },
    );

    // A course mentor arrives before the recent-mentors call settles.
    rerender({ courseMentor: 'course-mentor' });
    expect(result.current.mentor).toBe('course-mentor');

    resolveFirst({ results: [{ unique_id: 'stale-mentor' }] });
    await waitFor(() => expect(result.current.mentor).toBe('course-mentor'));
  });
});
