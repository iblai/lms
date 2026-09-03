import { useEffect, useRef, useState } from 'react';

import { isLoggedIn } from '@iblai/iblai-js/web-utils';

import { useLazyGetCourseMetaDataQuery } from '@/services/course-metadata';
import { resolveLmsAssetUrl } from '@/utils/helpers';

/**
 * How many `course_metadata` requests are in flight at once. The enrollment
 * endpoints carry no image, so a full "My Courses" view needs one request per
 * course — trickling them keeps that from stampeding the LMS.
 */
const CONCURRENCY = 6;

/**
 * Course card images for ids whose own payload carries none — the enrollment
 * endpoints return just id and name, so their cards would otherwise fall back
 * to a random placeholder while the catalog shows the real artwork.
 *
 * Resolves progressively (each course fills in as its metadata lands) and
 * reads from the RTK Query cache first, so a course already fetched anywhere
 * in the app costs no request at all.
 */
export const useCourseImages = (courseIds: string[]) => {
  const userLoggedIn = isLoggedIn();
  const [getCourseMetaData] = useLazyGetCourseMetaDataQuery();
  const [images, setImages] = useState<Record<string, string>>({});
  /** Ids already fetched — a re-render with the same ids must not refetch. */
  const requested = useRef(new Set<string>());
  const idsKey = courseIds.join('|');

  useEffect(() => {
    const pending = courseIds.filter((id) => id && !requested.current.has(id));
    if (pending.length === 0) return;
    pending.forEach((id) => requested.current.add(id));

    let cancelled = false;
    const queue = [...pending];
    const worker = async () => {
      while (queue.length > 0 && !cancelled) {
        const courseId = queue.shift() as string;
        try {
          // `true` prefers the cached value over a fresh request. The args
          // match every other caller's so the first fetch of a course — from
          // here or from the course page — serves all of them.
          const { data } = await getCourseMetaData(
            { courseKey: courseId, noAuth: !userLoggedIn },
            true,
          );
          const image = resolveLmsAssetUrl(data?.course_image_asset_path);
          if (!image || cancelled) continue;
          setImages((previous) => ({ ...previous, [courseId]: image }));
        } catch (error) {
          console.error('Failed to fetch course metadata for card image:', error);
          // No metadata for this course — its card keeps the placeholder.
        }
      }
    };
    for (let slot = 0; slot < Math.min(CONCURRENCY, queue.length); slot++) void worker();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return images;
};
