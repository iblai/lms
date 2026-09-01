import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getOrg: vi.fn(() => 'test-org'),
}));

// The declarative recommendations query — tests configure the payload and
// inspect the subscription args/options recorded on every render.
const mockRecommendationsQuery = vi.hoisted(() => ({
  data: { recommendations: [] } as any,
  isLoading: false,
  error: null as any,
  calls: [] as { args: any; options: any }[],
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetRecommendationsAiSearchQuery: vi.fn((args: any, options: any) => {
    mockRecommendationsQuery.calls.push({ args, options });
    return {
      data: options?.skip ? undefined : mockRecommendationsQuery.data,
      isLoading: mockRecommendationsQuery.isLoading,
      error: mockRecommendationsQuery.error,
    };
  }),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadata: { skills_include_community_courses: false },
    isLoading: false,
  })),
}));

import { useRecommendedCourses } from '../use-recommended-courses';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

describe('useRecommendedCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecommendationsQuery.data = { recommendations: [] };
    mockRecommendationsQuery.isLoading = false;
    mockRecommendationsQuery.error = null;
    mockRecommendationsQuery.calls = [];
    (useTenantMetadata as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: { skills_include_community_courses: false },
      isLoading: false,
    });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false, tenant: '' }),
    );
    expect(result.current).toHaveProperty('recommendedCourses');
    expect(result.current).toHaveProperty('allRecommendedCourses');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
  });

  it('subscribes to the recommendations query on mount', () => {
    renderHook(() => useRecommendedCourses({ limit: 8, search: '', forceLimit: false }));
    expect(mockRecommendationsQuery.calls.length).toBeGreaterThan(0);
    expect(mockRecommendationsQuery.calls[0].options.skip).toBe(false);
  });

  it('skips the query while tenant metadata is loading', () => {
    (useTenantMetadata as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: undefined,
      isLoading: true,
    });
    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false }),
    );
    expect(mockRecommendationsQuery.calls[0].options.skip).toBe(true);
    expect(result.current.isLoading).toBe(true);
  });

  it('transforms AI search recommendations to correct format', async () => {
    const mockRec = {
      course_id: 'course-1',
      course_title: 'Test Course',
      platform_key: 'test-platform',
      edx_data: { some: 'data' },
      domain: 'Technology',
      difficulty_level: 'beginner',
    };
    mockRecommendationsQuery.data = { recommendations: [mockRec] };

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses.length).toBe(1);
    });

    const course = result.current.recommendedCourses[0];
    expect(course.type).toBe('course');
    expect(course.data.course_id).toBe('course-1');
    expect(course.data.name).toBe('Test Course');
    expect(course.data.platform_key).toBe('test-platform');
  });

  it('applies forceLimit when set', async () => {
    const recommendations = Array.from({ length: 10 }, (_, i) => ({
      course_id: `course-${i}`,
      course_title: `Course ${i}`,
      platform_key: 'platform',
      edx_data: {},
      domain: null,
      difficulty_level: 'beginner',
    }));
    mockRecommendationsQuery.data = { recommendations };

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 5, search: '', forceLimit: true }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses.length).toBe(5);
    });
  });

  it('does not limit when forceLimit is false', async () => {
    const recommendations = Array.from({ length: 10 }, (_, i) => ({
      course_id: `course-${i}`,
      course_title: `Course ${i}`,
      platform_key: 'platform',
      edx_data: {},
      domain: null,
      difficulty_level: 'beginner',
    }));
    mockRecommendationsQuery.data = { recommendations };

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 5, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses.length).toBe(10);
    });
  });

  it('uses provided tenant in params', () => {
    renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false, tenant: 'custom-tenant' }),
    );
    expect(mockRecommendationsQuery.calls[0].args).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({ platform_key: 'custom-tenant' }),
      }),
    );
  });

  it('includes include_main_catalog when metadata has skills_include_community_courses', () => {
    (useTenantMetadata as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: { skills_include_community_courses: true },
      isLoading: false,
    });

    renderHook(() => useRecommendedCourses({ limit: 8, search: '', forceLimit: false }));

    expect(mockRecommendationsQuery.calls[0].args).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({ include_main_catalog: true }),
      }),
    );
  });

  it('handles empty recommendations gracefully', async () => {
    mockRecommendationsQuery.data = { recommendations: [] };

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses).toEqual([]);
      expect(result.current.allRecommendedCourses).toEqual([]);
    });
  });

  it('exposes the query error and falls back to empty lists', async () => {
    mockRecommendationsQuery.data = undefined;
    mockRecommendationsQuery.error = new Error('Network error');

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses).toEqual([]);
      expect(result.current.allRecommendedCourses).toEqual([]);
    });
    expect(result.current.isError).toBeTruthy();
  });

  it('filters courses when search length > 2', async () => {
    const recommendations = [
      {
        course_id: 'python-101',
        course_title: 'Python Basics',
        platform_key: 'platform',
        edx_data: {},
        domain: null,
        difficulty_level: 'beginner',
      },
      {
        course_id: 'js-101',
        course_title: 'JavaScript Intro',
        platform_key: 'platform',
        edx_data: {},
        domain: null,
        difficulty_level: 'beginner',
      },
    ];
    mockRecommendationsQuery.data = { recommendations };

    const { result, rerender } = renderHook(
      ({ search }) => useRecommendedCourses({ limit: 8, search, forceLimit: false }),
      { initialProps: { search: '' } },
    );

    await waitFor(() => {
      expect(result.current.allRecommendedCourses.length).toBe(2);
    });

    rerender({ search: 'python' });

    await waitFor(() => {
      expect(result.current.recommendedCourses.length).toBe(1);
      expect(result.current.recommendedCourses[0].data.name).toBe('Python Basics');
    });
  });

  it('shows all courses when search length <= 2', async () => {
    const recommendations = [
      {
        course_id: 'python-101',
        course_title: 'Python Basics',
        platform_key: 'platform',
        edx_data: {},
        domain: null,
        difficulty_level: 'beginner',
      },
    ];
    mockRecommendationsQuery.data = { recommendations };

    const { result, rerender } = renderHook(
      ({ search }) => useRecommendedCourses({ limit: 8, search, forceLimit: false }),
      { initialProps: { search: '' } },
    );

    await waitFor(() => {
      expect(result.current.allRecommendedCourses.length).toBe(1);
    });

    rerender({ search: 'py' });

    expect(result.current.recommendedCourses.length).toBe(1);
  });
});
