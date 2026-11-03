'use client';

import { useParams } from 'next/navigation';
import { useGetDiscussionsAvailableQuery } from '@/services/discussions';
import { CourseDiscussions } from './_components/course-discussions';

export default function DiscussionTab() {
  const params = useParams();
  const courseId = decodeURIComponent(params.course_id as string);
  const { data: available } = useGetDiscussionsAvailableQuery({ courseId });

  // The layout hides the tab in this case; this covers a direct link.
  if (available === false) {
    return (
      <div className="px-3 py-4 md:px-4" data-testid="discussions-unavailable">
        <p className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          Discussions aren&apos;t available for this course.
        </p>
      </div>
    );
  }
  return <CourseDiscussions courseId={courseId} />;
}
