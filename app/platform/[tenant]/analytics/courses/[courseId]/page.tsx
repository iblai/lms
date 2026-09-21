'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { AnalyticsCourseDetail } from '@iblai/iblai-js/web-containers';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = useTenantParam();
  const courseId = params.courseId as string;

  const handleBack = () => {
    router.push(`/platform/${tenant}/analytics/courses`);
  };

  return (
    <AnalyticsCourseDetail
      tenantKey={tenant}
      currentSPA={config.settings.appName() || 'skills'}
      mentorId={''}
      courseId={courseId}
      onBack={handleBack}
    />
  );
}
