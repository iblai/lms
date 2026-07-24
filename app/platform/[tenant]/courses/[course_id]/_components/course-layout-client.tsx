'use client';

import type React from 'react';
import { use } from 'react';
import {
  CourseDetailProvider,
  useCourseDetailContext,
} from '@/hooks/courses/course-detail-context';
import { CourseAccessGuard } from '@/components/course-access-guard';
import { SelfLinkingGuard } from '@/components/self-linking-guard';

// Bridges the shared course-detail context into the prop-based CourseAccessGuard.
// Must be a child of CourseDetailProvider so it can read the context the layout
// itself cannot consume (same component that provides it).
function CourseAccessGate({ children }: { children: React.ReactNode }) {
  const { course, courseInfoLoadingState } = useCourseDetailContext();
  return (
    <CourseAccessGuard course={course} courseInfoLoadingState={courseInfoLoadingState}>
      {children}
    </CourseAccessGuard>
  );
}

/**
 * Client half of the course-about layout: sets up the course-detail context and
 * the anonymous/self-linking + access guards. The server `layout.tsx` wraps this
 * so it can add SEO metadata + structured data without becoming a client module.
 */
export function CourseLayoutClient({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  const courseId = decodeURIComponent(course_id);

  return (
    <CourseDetailProvider courseId={courseId}>
      <SelfLinkingGuard>
        <CourseAccessGate>{children}</CourseAccessGate>
      </SelfLinkingGuard>
    </CourseDetailProvider>
  );
}
