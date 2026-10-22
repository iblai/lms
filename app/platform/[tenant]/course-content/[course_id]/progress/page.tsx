'use client';

import { useParams } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { CourseProgress } from './_components/course-progress';

export default function ProgressTab() {
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  return (
    <CourseProgress
      courseId={courseId}
      courseBasePath={`/platform/${tenant}/course-content/${params.course_id as string}`}
    />
  );
}
