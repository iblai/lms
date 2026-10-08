'use client';

import { useParams } from 'next/navigation';
import { CourseGradebook } from './_components/course-gradebook';

export default function GradebookTab() {
  const params = useParams();
  const courseId = decodeURIComponent(params.course_id as string);
  return <CourseGradebook courseId={courseId} />;
}
