'use client';

import { use, type ReactNode } from 'react';
import { StudioCourseShell } from '@/components/studio/studio-course-shell';

export default function StudioCourseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  return <StudioCourseShell courseId={decodeURIComponent(course_id)}>{children}</StudioCourseShell>;
}
