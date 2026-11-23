'use client';

import { useParams } from 'next/navigation';
import { CourseDetailsForm } from '@/components/studio/course-details-form';

export default function StudioCourseDetailsPage() {
  const params = useParams();
  const courseId = decodeURIComponent(params.course_id as string);
  return (
    <div className="px-6 pt-6">
      <div className="mx-auto max-w-4xl">
        <CourseDetailsForm courseId={courseId} />
      </div>
    </div>
  );
}
