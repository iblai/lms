'use client';

import { useContext } from 'react';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { LearningInfoTab } from '@/app/platform/[tenant]/courses/[course_id]/_components/learning-info-tab';

export default function LearningInfoPage() {
  const { course } = useContext(CourseOutlineContext);

  return (
    <div className="h-full overflow-y-auto bg-amber-50 p-6">
      <div className="mx-auto max-w-4xl">
        <LearningInfoTab course={course} />
      </div>
    </div>
  );
}
