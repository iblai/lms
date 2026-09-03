import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 'user-1'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetEnrolled = vi.fn();
const mockGetAssigned = vi.fn();
vi.mock('@/services/courses', () => ({
  useLazyGetUserEnrolledCoursesQuery: () => [mockGetEnrolled, { isLoading: false, isError: false }],
  useLazyGetUserAssignedCoursesQuery: () => [mockGetAssigned, { isLoading: false, isError: false }],
}));

const mockFetchCourseMetaData = vi.fn();
vi.mock('../use-course-metadata', () => ({
  useCourseMetadata: () => ({ handleFetchCourseMetaData: mockFetchCourseMetaData }),
}));

const mockTenantMetadata = vi.fn(() => ({ metadata: {} as Record<string, unknown> }));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockTenantMetadata(),
}));

import { useUserCourses } from '../use-user-courses';

const enrolled = (id: string, name: string) => ({ course_id: id, course_name: name });

describe('useUserCourses', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantMetadata.mockReturnValue({ metadata: {} });
    mockGetEnrolled.mockResolvedValue({ data: { results: [], count: 0 } });
    mockGetAssigned.mockResolvedValue({ data: { results: [], count: 0 } });
    mockFetchCourseMetaData.mockResolvedValue({ title: 'meta' });
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('fetches enrolled courses by default and exposes them with metadata', async () => {
    mockGetEnrolled.mockResolvedValue({
      data: { results: [enrolled('course-1', 'React Basics')], count: 9 },
    });

    const { result } = renderHook(() => useUserCourses({ limit: 4 }));

    await waitFor(() => expect(result.current.userCourses).toHaveLength(1));
    expect(result.current.userCourses[0]).toMatchObject({
      course_id: 'course-1',
      name: 'React Basics',
      edx_data: { title: 'meta' },
    });
    expect(result.current.pagination).toEqual({
      count: 9,
      current_page: 1,
      total_pages: 3,
    });
    expect(mockGetEnrolled).toHaveBeenCalledWith(
      {
        username: 'test-user',
        query: { page_size: 4, page: 1, platform_key: 'test-tenant' },
      },
      true,
    );
  });

  it('includes community courses when the tenant opts in', async () => {
    mockTenantMetadata.mockReturnValue({ metadata: { skills_include_community_courses: true } });

    renderHook(() => useUserCourses({}));

    await waitFor(() => expect(mockGetEnrolled).toHaveBeenCalled());
    expect(mockGetEnrolled.mock.calls[0][0].query).toMatchObject({
      include_default_platform: 1,
    });
  });

  it('fetches assigned courses for courseType "assigned"', async () => {
    mockGetAssigned.mockResolvedValue({
      data: { results: [enrolled('course-2', 'Assigned Course')], count: 1 },
    });

    const { result } = renderHook(() => useUserCourses({ courseType: 'assigned' }));

    await waitFor(() => expect(result.current.userCourses).toHaveLength(1));
    expect(mockGetAssigned).toHaveBeenCalledWith(
      { user_id: 'user-1', query: { page_size: 8, page: 1 } },
      true,
    );
    expect(mockGetEnrolled).not.toHaveBeenCalled();
  });

  it('leaves pagination unset when the response has no results array', async () => {
    mockGetEnrolled.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useUserCourses({}));

    await waitFor(() => expect(mockGetEnrolled).toHaveBeenCalled());
    expect(result.current.pagination).toBeNull();
  });

  it('reports the failure and clears the list when the course request throws', async () => {
    mockGetEnrolled.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useUserCourses({}));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch user courses:', expect.any(Error));
    });
    expect(result.current.userCourses).toEqual([]);
    expect(result.current.isLoadingUserCourses).toBe(false);
  });

  it('reports the failure when course metadata cannot be resolved', async () => {
    mockGetEnrolled.mockResolvedValue({
      data: { results: [enrolled('course-1', 'React Basics')], count: 1 },
    });
    mockFetchCourseMetaData.mockRejectedValue(new Error('metadata down'));

    const { result } = renderHook(() => useUserCourses({}));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch metadata for user courses:',
        expect.any(Error),
      );
    });
    expect(result.current.userCourses).toEqual([]);
  });

  it('filters in page when API search is off and re-shows everything for a short query', async () => {
    mockGetEnrolled.mockResolvedValue({
      data: {
        results: [enrolled('c1', 'React Basics'), enrolled('c2', 'Python Basics')],
        count: 2,
      },
    });

    const { result, rerender } = renderHook(({ search }) => useUserCourses({ search }), {
      initialProps: { search: '' },
    });

    await waitFor(() => expect(result.current.userCourses).toHaveLength(2));

    rerender({ search: 'reac' });
    await waitFor(() => expect(result.current.userCourses).toHaveLength(1));
    expect(result.current.userCourses[0]).toMatchObject({ name: 'React Basics' });

    rerender({ search: 'py' });
    await waitFor(() => expect(result.current.userCourses).toHaveLength(2));
  });

  it('refetches from the API when API search is on', async () => {
    const { rerender } = renderHook(
      ({ search }) => useUserCourses({ search, useAPISearch: true }),
      {
        initialProps: { search: '' },
      },
    );

    await waitFor(() => expect(mockGetEnrolled).toHaveBeenCalled());
    const callsAfterMount = mockGetEnrolled.mock.calls.length;

    rerender({ search: 'react' });

    await waitFor(() => expect(mockGetEnrolled.mock.calls.length).toBeGreaterThan(callsAfterMount));
    expect(mockGetEnrolled.mock.calls.at(-1)?.[0].query).toMatchObject({ search: 'react' });
  });
});
