'use client';

import type React from 'react';
import { use, useEffect } from 'react';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { CourseAccessGuard } from '@/components/course-access-guard';
import { SelfLinkingGuard } from '@/components/self-linking-guard';

export default function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  const courseId = decodeURIComponent(course_id);
  const { course, courseInfoLoadingState, handleFetchCourseInfo } = useCourseDetail(courseId);

  useEffect(() => {
    handleFetchCourseInfo();
  }, [courseId]);

  return (
    <SelfLinkingGuard>
      <CourseAccessGuard course={course} courseInfoLoadingState={courseInfoLoadingState}>
        {children}
      </CourseAccessGuard>
    </SelfLinkingGuard>
  );
}
