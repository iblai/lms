'use client';

import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import _ from 'lodash';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';

type CourseDetailContextValue = ReturnType<typeof useCourseDetail>;

const CourseDetailContext = createContext<CourseDetailContextValue | null>(null);

/**
 * Runs `useCourseDetail` exactly once for a course route and shares the result
 * with every descendant (the access guard in the layout and the course-details
 * page). Previously both `layout.tsx` and `page.tsx` instantiated the hook and
 * each fired `handleFetchCourseInfo`, duplicating the eligibility/monetization
 * state machine. Centralizing it here means a single fetch + a single source of
 * truth for the whole subtree.
 */
export function CourseDetailProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  const value = useCourseDetail(courseId);
  const { handleFetchCourseInfo } = value;

  useEffect(() => {
    if (_.isEmpty(courseId)) return;
    handleFetchCourseInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return <CourseDetailContext.Provider value={value}>{children}</CourseDetailContext.Provider>;
}

export function useCourseDetailContext(): CourseDetailContextValue {
  const ctx = useContext(CourseDetailContext);
  if (!ctx) {
    throw new Error('useCourseDetailContext must be used within a CourseDetailProvider');
  }
  return ctx;
}
