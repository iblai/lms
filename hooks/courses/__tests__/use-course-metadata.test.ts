import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetCourseMetaData = vi.fn();
const mockGetCourseCompletionOutlines = vi.fn();
const mockGetCourseEligibility = vi.fn();

vi.mock('@/services/course-metadata', () => ({
  useLazyGetCourseMetaDataQuery: vi.fn(() => [
    mockGetCourseMetaData,
    { isLoading: false, isError: false },
  ]),
  useLazyGetCourseCompletionOutlinesQuery: vi.fn(() => [
    mockGetCourseCompletionOutlines,
    { isLoading: false, isError: false },
  ]),
  useLazyGetCourseEligibilityQuery: vi.fn(() => [mockGetCourseEligibility]),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
}));

import { useCourseMetadata } from '../use-course-metadata';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';

describe('useCourseMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useCourseMetadata());
    expect(result.current).toHaveProperty('handleFetchCourseMetaData');
    expect(result.current).toHaveProperty('handleFetchCourseCompletionOutlines');
    expect(result.current).toHaveProperty('handleFetchCourseEligibility');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isLoadingCompletionOutlines');
    expect(result.current).toHaveProperty('isErrorCompletionOutlines');
  });

  describe('handleFetchCourseMetaData', () => {
    it('returns course metadata on success when logged in', async () => {
      const data = { id: 'course-1', name: 'Test' };
      mockGetCourseMetaData.mockResolvedValue({ data });

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseMetaData('course-1');

      expect(res).toEqual(data);
      expect(mockGetCourseMetaData).toHaveBeenCalledWith(
        { courseKey: 'course-1', noAuth: false },
        true,
      );
    });

    it('passes noAuth true when not logged in', async () => {
      (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
      mockGetCourseMetaData.mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useCourseMetadata());
      await result.current.handleFetchCourseMetaData('course-1');

      expect(mockGetCourseMetaData).toHaveBeenCalledWith(
        { courseKey: 'course-1', noAuth: true },
        true,
      );
    });

    it('returns empty object on error', async () => {
      mockGetCourseMetaData.mockRejectedValue(new Error('boom'));

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseMetaData('course-1');

      expect(res).toEqual({});
    });
  });

  describe('handleFetchCourseEligibility', () => {
    it('returns eligibility data on success', async () => {
      const data = { is_enrolled: true };
      mockGetCourseEligibility.mockResolvedValue({ data });

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseEligibility('course-1');

      expect(res).toEqual(data);
      expect(mockGetCourseEligibility).toHaveBeenCalledWith({ courseKey: 'course-1' });
    });

    it('returns null when data is falsy', async () => {
      mockGetCourseEligibility.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseEligibility('course-1');

      expect(res).toBeNull();
    });

    it('returns null on error', async () => {
      mockGetCourseEligibility.mockRejectedValue(new Error('boom'));

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseEligibility('course-1');

      expect(res).toBeNull();
    });
  });

  describe('handleFetchCourseCompletionOutlines', () => {
    it('returns completion outlines on success', async () => {
      const data = { children: [{ id: 'sec-1' }] };
      mockGetCourseCompletionOutlines.mockResolvedValue({ data });

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseCompletionOutlines('course-1');

      expect(res).toEqual(data);
      expect(mockGetCourseCompletionOutlines).toHaveBeenCalledWith({ courseKey: 'course-1' });
    });

    it('returns empty object on error', async () => {
      mockGetCourseCompletionOutlines.mockRejectedValue(new Error('boom'));

      const { result } = renderHook(() => useCourseMetadata());
      const res = await result.current.handleFetchCourseCompletionOutlines('course-1');

      expect(res).toEqual({});
    });
  });

  describe('error reporting', () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    // All three fetchers degrade to an empty value, which the UI renders as
    // "no metadata" — indistinguishable from an outage without a report.
    it('reports a course metadata failure and returns an empty object', async () => {
      mockGetCourseMetaData.mockRejectedValue(new Error('network'));
      const { result } = renderHook(() => useCourseMetadata());

      await expect(result.current.handleFetchCourseMetaData('course-1')).resolves.toEqual({});
      expect(errorSpy).toHaveBeenCalledWith('Failed to fetch course metadata:', expect.any(Error));
    });

    it('reports a course eligibility failure and returns null', async () => {
      mockGetCourseEligibility.mockRejectedValue(new Error('network'));
      const { result } = renderHook(() => useCourseMetadata());

      await expect(result.current.handleFetchCourseEligibility('course-1')).resolves.toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to fetch course eligibility:',
        expect.any(Error),
      );
    });

    it('reports a completion-outlines failure and returns an empty object', async () => {
      mockGetCourseCompletionOutlines.mockRejectedValue(new Error('network'));
      const { result } = renderHook(() => useCourseMetadata());

      await expect(result.current.handleFetchCourseCompletionOutlines('course-1')).resolves.toEqual(
        {},
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to fetch course completion outlines:',
        expect.any(Error),
      );
    });
  });
});
