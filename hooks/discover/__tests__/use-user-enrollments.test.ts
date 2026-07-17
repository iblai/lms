import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetUserName = vi.hoisted(() => vi.fn(() => 'test-user'));
vi.mock('@/utils/helpers', () => ({
  getUserName: mockGetUserName,
}));

const mockIsLoggedIn = vi.hoisted(() => vi.fn(() => true));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: mockIsLoggedIn,
}));

const mockCoursesQuery = vi.hoisted(() => vi.fn());
vi.mock('@/services/courses', () => ({
  useGetUserEnrolledCoursesQuery: mockCoursesQuery,
}));

const mockProgramsQuery = vi.hoisted(() => vi.fn());
const mockPathwaysQuery = vi.hoisted(() => vi.fn());
vi.mock('@/services/catalog', () => ({
  useGetUserEnrolledProgramsQuery: mockProgramsQuery,
  useGetUserCatalogPathwaysQuery: mockPathwaysQuery,
}));

import { useUserEnrollments } from '../use-user-enrollments';

describe('useUserEnrollments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserName.mockReturnValue('test-user');
    mockIsLoggedIn.mockReturnValue(true);
    mockCoursesQuery.mockReturnValue({ data: undefined, isLoading: false });
    mockProgramsQuery.mockReturnValue({ data: undefined, isLoading: false });
    mockPathwaysQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('returns empty enrollments when no query has data', () => {
    const { result } = renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(result.current.enrolledIds.size).toBe(0);
    expect(result.current.enrolledCards).toEqual({ courses: [], programs: [], pathways: [] });
    expect(result.current.enrolledTotal).toBe(0);
    expect(result.current.enrollmentsLoading).toBe(false);
  });

  it('queries with the username, page size and tenant, unskipped when logged in', () => {
    renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(mockCoursesQuery).toHaveBeenCalledWith(
      {
        username: 'test-user',
        query: { page_size: 100, platform_key: 'test-tenant' },
      },
      { skip: false },
    );
    expect(mockProgramsQuery).toHaveBeenCalledWith(
      { username: 'test-user', platform_key: 'test-tenant' },
      { skip: false },
    );
    expect(mockPathwaysQuery).toHaveBeenCalledWith(
      { username: 'test-user', platform_key: 'test-tenant' },
      { skip: false },
    );
  });

  it('skips every query when the user is not logged in', () => {
    mockIsLoggedIn.mockReturnValue(false);
    renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(mockCoursesQuery.mock.calls[0][1]).toEqual({ skip: true });
    expect(mockProgramsQuery.mock.calls[0][1]).toEqual({ skip: true });
    expect(mockPathwaysQuery.mock.calls[0][1]).toEqual({ skip: true });
  });

  it('skips and falls back to an empty username when there is no username', () => {
    mockGetUserName.mockReturnValue(null as any);
    renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(mockCoursesQuery.mock.calls[0][0].username).toBe('');
    expect(mockCoursesQuery.mock.calls[0][1]).toEqual({ skip: true });
  });

  it('skips every query when there is no tenant', () => {
    renderHook(() => useUserEnrollments({ tenant: '' }));
    expect(mockCoursesQuery.mock.calls[0][1]).toEqual({ skip: true });
    expect(mockProgramsQuery.mock.calls[0][1]).toEqual({ skip: true });
    expect(mockPathwaysQuery.mock.calls[0][1]).toEqual({ skip: true });
  });

  it('builds course cards, hiding unnamed courses but keeping their ids', () => {
    mockCoursesQuery.mockReturnValue({
      data: {
        results: [
          { course_id: 'course-1', course_name: 'Course One' },
          { course_id: 'course-2', course_name: '' },
        ],
      },
      isLoading: false,
    });
    const { result } = renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(result.current.enrolledCards.courses).toEqual([
      {
        title: 'Course One',
        contentType: 'course',
        url: '/courses/course-1',
        image: '',
        id: 'course-1',
        enrolled: true,
      },
    ]);
    // Unnamed enrollments still pin the "Enrolled" flag on catalog results.
    expect(result.current.enrolledIds.has('course-1')).toBe(true);
    expect(result.current.enrolledIds.has('course-2')).toBe(true);
    expect(result.current.enrolledTotal).toBe(1);
  });

  it('builds program cards with title and id fallbacks', () => {
    mockProgramsQuery.mockReturnValue({
      data: [
        { name: 'Program One', program_id: 'prog-1', program_key: 'key-1' },
        // No name — the title falls back to the program id.
        { program_id: 'prog-2' },
        // No program id — the card id falls back to the program key.
        { name: 'Program Three', program_key: 'key-3' },
        // Neither name nor program id — hidden from the cards.
        { program_key: 'key-4' },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    const programs = result.current.enrolledCards.programs;
    expect(programs).toHaveLength(3);
    expect(programs[0]).toMatchObject({
      title: 'Program One',
      contentType: 'program',
      url: '/programs/key-1',
      id: 'prog-1',
      enrolled: true,
    });
    expect(programs[1]).toMatchObject({ title: 'prog-2', id: 'prog-2' });
    expect(programs[2]).toMatchObject({ title: 'Program Three', id: 'key-3' });
    // Both program ids and program keys count as enrolled ids.
    expect(result.current.enrolledIds.has('prog-1')).toBe(true);
    expect(result.current.enrolledIds.has('key-1')).toBe(true);
    expect(result.current.enrolledIds.has('key-4')).toBe(true);
    expect(result.current.enrolledTotal).toBe(3);
  });

  it('builds pathway cards, deduplicating and dropping keyless entries', () => {
    mockPathwaysQuery.mockReturnValue({
      data: [
        { pathway_uuid: 'uuid-1', pathway_id: 'path-1', name: 'Pathway One' },
        // Duplicate of the first pathway — dropped.
        { pathway_uuid: 'uuid-1', name: 'Pathway One (again)' },
        // No name — the title falls back to the pathway id; no uuid — the
        // card id falls back to the pathway id too.
        { pathway_id: 'path-2' },
        // Keyed only by `id` — kept, but contributes no enrolled id.
        { id: 'raw-3', name: 'Pathway Three' },
        // No key at all — dropped.
        { name: 'Keyless' },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    const pathways = result.current.enrolledCards.pathways;
    expect(pathways).toHaveLength(3);
    expect(pathways[0]).toMatchObject({
      title: 'Pathway One',
      contentType: 'pathway',
      url: '',
      id: 'uuid-1',
      enrolled: true,
    });
    expect(pathways[1]).toMatchObject({ title: 'path-2', id: 'path-2' });
    expect(pathways[2]).toMatchObject({ title: 'Pathway Three', id: '' });
    expect(result.current.enrolledIds.has('uuid-1')).toBe(true);
    expect(result.current.enrolledIds.has('path-1')).toBe(true);
    expect(result.current.enrolledIds.has('path-2')).toBe(true);
    expect(result.current.enrolledTotal).toBe(3);
  });

  it('sums enrolledTotal across content types', () => {
    mockCoursesQuery.mockReturnValue({
      data: { results: [{ course_id: 'course-1', course_name: 'Course One' }] },
      isLoading: false,
    });
    mockProgramsQuery.mockReturnValue({
      data: [{ name: 'Program One', program_id: 'prog-1', program_key: 'key-1' }],
      isLoading: false,
    });
    mockPathwaysQuery.mockReturnValue({
      data: [{ pathway_uuid: 'uuid-1', name: 'Pathway One' }],
      isLoading: false,
    });
    const { result } = renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(result.current.enrolledTotal).toBe(3);
  });

  it('reports loading while any of the queries is loading', () => {
    mockPathwaysQuery.mockReturnValue({ data: undefined, isLoading: true });
    const { result } = renderHook(() => useUserEnrollments({ tenant: 'test-tenant' }));
    expect(result.current.enrollmentsLoading).toBe(true);
  });
});
