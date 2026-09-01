import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetCourseMetaData = vi.hoisted(() => vi.fn());
vi.mock('@/services/course-metadata', () => ({
  useLazyGetCourseMetaDataQuery: vi.fn(() => [mockGetCourseMetaData, { isLoading: false }]),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: () => true,
}));

vi.mock('@/utils/helpers', () => ({
  resolveLmsAssetUrl: (path?: string | null) =>
    !path ? '' : String(path).startsWith('http') ? String(path) : `https://lms.test${path}`,
}));

import { useCourseImages } from '../use-course-images';

describe('useCourseImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCourseMetaData.mockResolvedValue({ data: { course_image_asset_path: '/img.png' } });
  });

  it('resolves an image per course id, preferring the cached value', async () => {
    const { result } = renderHook(() => useCourseImages(['course-1', 'course-2']));

    await waitFor(() =>
      expect(result.current).toEqual({
        'course-1': 'https://lms.test/img.png',
        'course-2': 'https://lms.test/img.png',
      }),
    );
    // Same arg shape as every other `course_metadata` caller, so the two
    // share one RTK Query cache entry instead of fetching the course twice.
    expect(mockGetCourseMetaData).toHaveBeenCalledWith(
      { courseKey: 'course-1', noAuth: false },
      true,
    );
  });

  it('keeps absolute image URLs as they are', async () => {
    mockGetCourseMetaData.mockResolvedValue({
      data: { course_image_asset_path: 'https://cdn.example.com/img.png' },
    });
    const { result } = renderHook(() => useCourseImages(['course-1']));

    await waitFor(() =>
      expect(result.current).toEqual({ 'course-1': 'https://cdn.example.com/img.png' }),
    );
  });

  it('omits courses whose metadata carries no image', async () => {
    mockGetCourseMetaData.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useCourseImages(['course-1']));

    await waitFor(() => expect(mockGetCourseMetaData).toHaveBeenCalled());
    expect(result.current).toEqual({});
  });

  it('omits courses whose metadata request fails', async () => {
    mockGetCourseMetaData.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useCourseImages(['course-1']));

    await waitFor(() => expect(mockGetCourseMetaData).toHaveBeenCalled());
    expect(result.current).toEqual({});
  });

  it('fetches nothing when there are no ids', () => {
    const { result } = renderHook(() => useCourseImages([]));
    expect(mockGetCourseMetaData).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
  });

  it('fetches each id once, even across re-renders and added ids', async () => {
    const { result, rerender } = renderHook(({ ids }) => useCourseImages(ids), {
      initialProps: { ids: ['course-1'] },
    });
    await waitFor(() => expect(result.current['course-1']).toBeDefined());

    rerender({ ids: ['course-1', 'course-2'] });
    await waitFor(() => expect(result.current['course-2']).toBeDefined());

    expect(mockGetCourseMetaData).toHaveBeenCalledTimes(2);
  });

  describe('error reporting', () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    // The card keeps its placeholder either way, so a metadata outage is
    // invisible in the UI.
    it('reports a per-course metadata failure and keeps the card placeholder', async () => {
      mockGetCourseMetaData.mockRejectedValue(new Error('network'));

      const { result } = renderHook(() => useCourseImages(['course-1']));

      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          'Failed to fetch course metadata for card image:',
          expect.any(Error),
        );
      });
      expect(result.current).toEqual({});
    });
  });
});
