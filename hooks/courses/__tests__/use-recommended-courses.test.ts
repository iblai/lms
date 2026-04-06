import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getOrg: vi.fn(() => 'test-org'),
}));

const mockGetRecommendationsAiSearch = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetRecommendationsAiSearchQuery: vi.fn(() => [
    mockGetRecommendationsAiSearch,
    { isLoading: false, error: null },
  ]),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadata: { skills_include_community_courses: false },
  })),
}));

import { useRecommendedCourses } from '../use-recommended-courses';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

describe('useRecommendedCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecommendationsAiSearch.mockResolvedValue({
      data: { recommendations: [] },
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

  it('fetches courses on mount', async () => {
    renderHook(() => useRecommendedCourses({ limit: 8, search: '', forceLimit: false }));

    await waitFor(() => {
      expect(mockGetRecommendationsAiSearch).toHaveBeenCalled();
    });
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
    mockGetRecommendationsAiSearch.mockResolvedValue({
      data: { recommendations: [mockRec] },
    });

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
    mockGetRecommendationsAiSearch.mockResolvedValue({
      data: { recommendations },
    });

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
    mockGetRecommendationsAiSearch.mockResolvedValue({
      data: { recommendations },
    });

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 5, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses.length).toBe(10);
    });
  });

  it('uses provided tenant in params', async () => {
    mockGetRecommendationsAiSearch.mockResolvedValue({ data: { recommendations: [] } });

    renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false, tenant: 'custom-tenant' }),
    );

    await waitFor(() => {
      expect(mockGetRecommendationsAiSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ platform_key: 'custom-tenant' }),
        }),
        true,
      );
    });
  });

  it('includes search_terms when search is provided', async () => {
    mockGetRecommendationsAiSearch.mockResolvedValue({ data: { recommendations: [] } });

    renderHook(() => useRecommendedCourses({ limit: 8, search: 'python', forceLimit: false }));

    await waitFor(() => {
      expect(mockGetRecommendationsAiSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ search_terms: 'python' }),
        }),
        true,
      );
    });
  });

  it('includes include_main_catalog when metadata has skills_include_community_courses', async () => {
    (useTenantMetadata as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: { skills_include_community_courses: true },
    });
    mockGetRecommendationsAiSearch.mockResolvedValue({ data: { recommendations: [] } });

    renderHook(() => useRecommendedCourses({ limit: 8, search: '', forceLimit: false }));

    await waitFor(() => {
      expect(mockGetRecommendationsAiSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ include_main_catalog: true }),
        }),
        true,
      );
    });
  });

  it('handles empty recommendations gracefully', async () => {
    mockGetRecommendationsAiSearch.mockResolvedValue({ data: { recommendations: [] } });

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses).toEqual([]);
      expect(result.current.allRecommendedCourses).toEqual([]);
    });
  });

  it('handles error in handleFetchCourses', async () => {
    mockGetRecommendationsAiSearch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useRecommendedCourses({ limit: 8, search: '', forceLimit: false }),
    );

    await waitFor(() => {
      expect(result.current.recommendedCourses).toEqual([]);
      expect(result.current.allRecommendedCourses).toEqual([]);
    });
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
    mockGetRecommendationsAiSearch.mockResolvedValue({ data: { recommendations } });

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
    mockGetRecommendationsAiSearch.mockResolvedValue({ data: { recommendations } });

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
