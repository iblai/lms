'use client';

import { useParams, useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';
import { AnalyticsCourseDetail } from '@iblai/iblai-js/web-containers';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const handleBack = () => {
    router.push('/analytics/courses');
  };

  return (
    <AnalyticsCourseDetail
      tenantKey={getTenant()}
      mentorId={''}
      courseId={courseId}
      onBack={handleBack}
    />
  );
}
