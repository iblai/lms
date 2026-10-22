'use client';

import { useParams } from 'next/navigation';
import { CourseDiscussions } from './_components/course-discussions';

export default function DiscussionTab() {
  const params = useParams();
  const courseId = decodeURIComponent(params.course_id as string);
  return <CourseDiscussions courseId={courseId} />;
}
