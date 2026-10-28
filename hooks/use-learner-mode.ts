'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectIsInstructorMode, setIsInstructorMode } from '@/features/learner-mode';

const PLATFORM_ANALYTICS_ROUTE = /^\/platform\/([^/]+)\/analytics(\/|$)/;
const COURSE_STAFF_ROUTE =
  /^(\/platform\/[^/]+\/course-content\/[^/]+)\/(instructor|gradebook|analytics|configuration)(\/|$)/;

/**
 * Where an admin lands when they switch to learner mode on a page only staff
 * see — the page would otherwise stay on screen with its nav entry gone.
 */
export function getLearnerModeRedirect(pathname: string): string | null {
  const courseStaff = pathname.match(COURSE_STAFF_ROUTE);
  if (courseStaff) return `${courseStaff[1]}/course`;
  const analytics = pathname.match(PLATFORM_ANALYTICS_ROUTE);
  if (analytics) return `/platform/${analytics[1]}/home`;
  return null;
}

/**
 * The navbar's User/Admin switch. Only admins are shown it, so
 * `isInstructorMode` is false only for an admin previewing the learner view;
 * admin-gated UI reads it as `isAdmin && isInstructorMode`.
 */
export function useLearnerMode() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isInstructorMode = useAppSelector(selectIsInstructorMode);

  const toggleLearnerMode = useCallback(() => {
    const nextInstructorMode = !isInstructorMode;
    dispatch(setIsInstructorMode(nextInstructorMode));
    if (!nextInstructorMode) {
      const redirect = getLearnerModeRedirect(pathname ?? '');
      if (redirect) router.push(redirect);
    }
  }, [dispatch, isInstructorMode, pathname, router]);

  return { isInstructorMode, toggleLearnerMode };
}
