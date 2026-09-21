'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsCourses } from '@iblai/iblai-js/web-containers';

export default function CoursesPage() {
  const tenant = useTenantParam();
  return (
    <AnalyticsCourses
      tenantKey={tenant}
      mentorId={''}
      basePath={`/platform/${tenant}/analytics`}
      // The id cell links to the course itself; the row still opens analytics.
      getCourseURL={(courseId) => `/platform/${tenant}/courses/${courseId}`}
    />
  );
}
