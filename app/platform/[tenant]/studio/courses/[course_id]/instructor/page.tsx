'use client';

import { useParams, useSearchParams } from 'next/navigation';
import {
  InstructorDashboard,
  isDashboardSection,
} from '@/app/platform/[tenant]/course-content/[course_id]/instructor/_components/instructor-dashboard';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { studioBasePath } from '@/utils/studio';

export default function StudioCourseInstructorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenant = useTenantParam();
  const requested = searchParams.get('section');
  return (
    <InstructorDashboard
      courseId={decodeURIComponent(params.course_id as string)}
      courseBasePath={`${studioBasePath(tenant)}/courses/${params.course_id as string}`}
      section={isDashboardSection(requested) ? requested : 'overview'}
    />
  );
}
