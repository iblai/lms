'use client';

import { useContext, useEffect, useState } from 'react';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { InstructorTab } from '@/app/platform/[tenant]/courses/[course_id]/_components/instructor-tab';

export default function InstructorsPage() {
  const { course } = useContext(CourseOutlineContext);
  const { setActiveTab } = useContext(EdxIframeContext);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTab('instructors');
  }, [setActiveTab]);

  const toggleSection = (index: number | string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-amber-50 p-6">
      <div className="mx-auto max-w-4xl">
        <InstructorTab
          course={course}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      </div>
    </div>
  );
}
