'use client';

import { useContext } from 'react';
import isEmpty from 'lodash/isEmpty';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import useCourseNavigator from '@/hooks/courses/useCourseNavigator';

export const CourseLessonNavigator = ({ className }: { className?: string }) => {
  const { courseOutline, courseID } = useContext(EdxIframeContext);
  const { selectLesson, currentUnitID } = useContext(CourseOutlineContext);
  const hasOutline = !isEmpty(courseOutline) && !!courseID;
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
          type="button"
          onClick={handlePreviousBtnClick}
          className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none @xl:pr-3"
          aria-label="Previous lesson"
        >
          <ChevronLeft className="h-4 w-4 @xl:mr-1" />
          <span className="hidden @xl:inline">Previous Unit</span>
        </button>
      )}
      {!navigator.isNextHidden() && (
        <button
          type="button"
          onClick={handleNextBtnClick}
          className="inline-flex h-8 items-center rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-2 text-xs font-medium text-[var(--button-primary-text)] shadow-xs transition-opacity hover:opacity-[var(--button-primary-hover-opacity)] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none @xl:pl-3"
          aria-label="Next lesson"
        >
          <span className="hidden @xl:inline">Keep Learning</span>
          <ChevronRight className="h-4 w-4 @xl:ml-1" />
        </button>
      )}
    </div>
  );
};
