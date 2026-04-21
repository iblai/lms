'use client';

import { useContext } from 'react';
import _ from 'lodash';
import { ChevronRight } from 'lucide-react';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import useCourseNavigator from '@/hooks/courses/useCourseNavigator';

export const CourseLessonNavigator = ({ className }: { className?: string }) => {
  const { courseOutline, courseID } = useContext(EdxIframeContext);
  const { selectLesson, currentUnitID } = useContext(CourseOutlineContext);
  const hasOutline = !_.isEmpty(courseOutline) && !!courseID;
  const { navigator } = useCourseNavigator(
    hasOutline ? courseOutline : ({ children: [] } as any),
    currentUnitID || courseID || '',
  );

  if (!hasOutline || (navigator.isPreviousHidden() && navigator.isNextHidden())) {
    return null;
  }

  const handlePreviousBtnClick = () => {
    const target = navigator.moveToPrevious();
    if (!target) return;
    setTimeout(() => selectLesson(target.id), 100);
  };

  const handleNextBtnClick = () => {
    const target = navigator.moveToNext();
    if (!target) return;
    setTimeout(() => selectLesson(target.id), 100);
  };

  return (
    <div className={`flex flex-shrink-0 items-center gap-2 ${className ?? ''}`}>
      {!navigator.isPreviousHidden() && (
        <button
          onClick={handlePreviousBtnClick}
          className="flex items-center rounded-sm border border-gray-300 px-1.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 md:pr-2 md:pl-1"
          aria-label="Previous lesson"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180 transform md:mr-1" />
          <span className="hidden md:inline">Previous Unit</span>
        </button>
      )}
      {!navigator.isNextHidden() && (
        <button
          onClick={handleNextBtnClick}
          className="flex items-center rounded-sm bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-1.5 py-1.5 text-xs font-medium text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)] md:pr-1 md:pl-2"
          aria-label="Next lesson"
        >
          <span className="hidden md:inline">Keep Learning</span>
          <ChevronRight className="h-3.5 w-3.5 md:ml-1" />
        </button>
      )}
    </div>
  );
};
