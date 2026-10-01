import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockMetadataQuery = vi.hoisted(() => ({
  result: { data: undefined as any, isLoading: false, isError: false },
  calls: [] as { args: any; options: any }[],
}));
vi.mock('@/services/course-metadata', () => ({
  useGetCourseMetaDataQuery: (args: any, options: any) => {
    mockMetadataQuery.calls.push({ args, options });
    return options?.skip
      ? { data: undefined, isLoading: false, isError: false }
      : mockMetadataQuery.result;
  },
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: () => true,
}));

vi.mock('@/utils/helpers', () => ({
  resolveLmsAssetUrl: (path?: string | null) =>
    !path ? '' : String(path).startsWith('http') ? String(path) : `https://lms.test${path}`,
}));

import { useCourseCardImage } from '../use-course-card-image';

const lastCall = () => mockMetadataQuery.calls.at(-1)!;
const elementRef = () => ({ current: document.createElement('div') });

describe('useCourseCardImage', () => {
  beforeEach(() => {
    mockMetadataQuery.result = { data: undefined, isLoading: false, isError: false };
    mockMetadataQuery.calls = [];
  });

  describe('without IntersectionObserver', () => {
    // The shared setup polyfills a no-op observer; take it away here.
    beforeEach(() => {
      vi.stubGlobal('IntersectionObserver', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('looks the course up straight away, keyed like every other caller', () => {
      renderHook(() => useCourseCardImage('course-1', elementRef()));
      expect(lastCall()).toEqual({
        args: { courseKey: 'course-1', noAuth: false },
        options: { skip: false },
      });
    });

    it('resolves the image from the metadata', () => {
      mockMetadataQuery.result = {
        data: { course_image_asset_path: '/img.png' },
        isLoading: false,
        isError: false,
      };
      const { result } = renderHook(() => useCourseCardImage('course-1', elementRef()));
      expect(result.current).toEqual({ image: 'https://lms.test/img.png', isPending: false });
    });

    it('is pending while the metadata loads', () => {
      mockMetadataQuery.result = { data: undefined, isLoading: true, isError: false };
      const { result } = renderHook(() => useCourseCardImage('course-1', elementRef()));
      expect(result.current.isPending).toBe(true);
    });

    it('stops pending when the lookup fails, so the placeholder shows', () => {
      mockMetadataQuery.result = { data: undefined, isLoading: false, isError: true };
      const { result } = renderHook(() => useCourseCardImage('course-1', elementRef()));
      expect(result.current).toEqual({ image: '', isPending: false });
    });

    it('does nothing without a course id', () => {
      const { result } = renderHook(() => useCourseCardImage(undefined, elementRef()));
      expect(lastCall().options.skip).toBe(true);
      expect(result.current).toEqual({ image: '', isPending: false });
    });
  });

  describe('with IntersectionObserver', () => {
    let trigger: (isIntersecting: boolean) => void;
    const disconnect = vi.fn();

    beforeEach(() => {
      disconnect.mockClear();
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: IntersectionObserverCallback) {
            trigger = (isIntersecting) =>
              callback([{ isIntersecting } as IntersectionObserverEntry], this as any);
          }
          observe() {}
          disconnect = disconnect;
        },
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('holds the request until the card nears the viewport', () => {
      const { result } = renderHook(() => useCourseCardImage('course-1', elementRef()));
      expect(lastCall().options.skip).toBe(true);
      // Not yet seen — no placeholder flash before the real artwork.
      expect(result.current.isPending).toBe(true);

      act(() => trigger(false));
      expect(lastCall().options.skip).toBe(true);

      act(() => trigger(true));
      expect(lastCall().options.skip).toBe(false);
      expect(disconnect).toHaveBeenCalled();
    });
  });
});
