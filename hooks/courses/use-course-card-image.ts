import { RefObject, useEffect, useState } from 'react';

import { isLoggedIn } from '@iblai/iblai-js/web-utils';

import { useGetCourseMetaDataQuery } from '@/services/course-metadata';
import { resolveLmsAssetUrl } from '@/utils/helpers';

/** Start the lookup a little before the card scrolls into view. */
const PREFETCH_MARGIN = '200px';

/**
 * Flips to true once the element first comes near the viewport, and stays
 * true. Without IntersectionObserver (older browsers, jsdom) the element
 * counts as visible straight away.
 */
const useSeenOnce = (ref: RefObject<Element | null>, enabled: boolean) => {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!enabled || seen) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, seen]);

  return seen;
};

/**
 * Card artwork for a course whose own payload carries none — the
 * enrollment endpoints return just id and name. Looks the image up in the
 * course's metadata, but only once the card nears the viewport, so a
 * learner with 80+ enrollments costs one request per card actually seen
 * instead of one per enrollment up front. The RTK Query cache dedupes the
 * lookup with every other `course_metadata` caller.
 */
export const useCourseCardImage = (
  courseId: string | undefined,
  ref: RefObject<Element | null>,
) => {
  const seen = useSeenOnce(ref, !!courseId);
  const { data, isLoading, isError } = useGetCourseMetaDataQuery(
    { courseKey: courseId ?? '', noAuth: !isLoggedIn() },
    { skip: !courseId || !seen },
  );

  return {
    image: resolveLmsAssetUrl(data?.course_image_asset_path),
    /** The artwork is still unknown — hold off on a placeholder image. */
    isPending: !!courseId && !isError && !data && (!seen || isLoading),
  };
};
