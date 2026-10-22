'use client';

import { useParams } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { CourseDates } from './_components/course-dates';

export default function DatesTab() {
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  return (
    <CourseDates
      courseId={courseId}
      courseBasePath={`/platform/${tenant}/course-content/${params.course_id as string}`}
    />
  );
}
