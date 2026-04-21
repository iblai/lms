import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('lucide-react', () => ({
  ChevronRight: (props: any) => <span data-testid="chevron" {...props} />,
}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn(
      (val) => !val || (Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0),
    ),
  },
}));

import { CourseLessonNavigator } from '../course-lesson-navigator';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const outlineWithThreeUnits = {
  id: 'course-root',
  display_name: 'Course',
  children: [
    {
      id: 'chapter-1',
      display_name: 'Chapter 1',
      children: [
        {
          id: 'sequential-1',
          display_name: 'Sequential 1',
          children: [
            { id: 'unit-1', display_name: 'Unit 1', children: [] },
            { id: 'unit-2', display_name: 'Unit 2', children: [] },
            { id: 'unit-3', display_name: 'Unit 3', children: [] },
          ],
        },
      ],
    },
  ],
};

const singleUnitOutline = {
  id: 'course-root',
  display_name: 'Course',
  children: [
    {
      id: 'chapter-1',
      display_name: 'Chapter 1',
      children: [
        {
          id: 'sequential-1',
          display_name: 'Sequential 1',
          children: [{ id: 'unit-only', display_name: 'Only unit', children: [] }],
        },
      ],
    },
  ],
};

const renderNavigator = ({
  courseOutline,
  courseID = 'course-v1:test',
  currentUnitID = null as string | null,
  selectLesson = vi.fn(),
  className,
}: {
  courseOutline: any;
  courseID?: string;
  currentUnitID?: string | null;
  selectLesson?: (id: string) => void;
  className?: string;
}) => {
  const edxCtx = {
    courseOutline,
    courseID,
    iframeUrl: '',
    setIframeUrl: vi.fn(),
    setActiveTab: vi.fn(),
    activeTab: 'course',
    currentlyInExamSubsection: false,
    setCurrentlyInExamSubsection: vi.fn(),
    examInfo: null,
    setExamInfo: vi.fn(),
    refresher: null,
    setRefresher: vi.fn(),
  };
  const outlineCtx = {
    courseOutline,
    courseOutlineLoading: false,
    expandedModule: '',
    expandedLessons: [],
    selectLesson,
    toggleModule: vi.fn(),
    toggleLesson: vi.fn(),
    currentChapter: '',
    currentLesson: '',
    course: {},
    courseOutlineDrawerOpen: false,
    setCourseOutlineDrawerOpen: vi.fn(),
    currentUnitID,
    refetchCourseOutline: vi.fn(),
  };
  return render(
    <EdxIframeContext.Provider value={edxCtx as any}>
      <CourseOutlineContext.Provider value={outlineCtx as any}>
        <CourseLessonNavigator className={className} />
      </CourseOutlineContext.Provider>
    </EdxIframeContext.Provider>,
  );
};

describe('CourseLessonNavigator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('returns null when the course outline is empty', () => {
    const { container } = renderNavigator({ courseOutline: {} });
    expect(container).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it('returns null when courseID is missing', () => {
    const { container } = renderNavigator({ courseOutline: outlineWithThreeUnits, courseID: '' });
    expect(container).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it('returns null when there is only a single unit (both arrows hidden)', () => {
    const { container } = renderNavigator({
      courseOutline: singleUnitOutline,
      currentUnitID: 'unit-only',
    });
    expect(container).toBeEmptyDOMElement();
    vi.useRealTimers();
  });

  it('renders only the Next button on the first unit', () => {
    renderNavigator({ courseOutline: outlineWithThreeUnits, currentUnitID: 'unit-1' });
    expect(screen.queryByLabelText('Previous lesson')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Next lesson')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders only the Previous button on the last unit', () => {
    renderNavigator({ courseOutline: outlineWithThreeUnits, currentUnitID: 'unit-3' });
    expect(screen.getByLabelText('Previous lesson')).toBeInTheDocument();
    expect(screen.queryByLabelText('Next lesson')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders both buttons on a middle unit', () => {
    renderNavigator({ courseOutline: outlineWithThreeUnits, currentUnitID: 'unit-2' });
    expect(screen.getByLabelText('Previous lesson')).toBeInTheDocument();
    expect(screen.getByLabelText('Next lesson')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('forwards the optional className to the wrapper div', () => {
    const { container } = renderNavigator({
      courseOutline: outlineWithThreeUnits,
      currentUnitID: 'unit-2',
      className: 'custom-class',
    });
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('calls selectLesson with the next unit id after a debounced click', () => {
    const selectLesson = vi.fn();
    renderNavigator({
      courseOutline: outlineWithThreeUnits,
      currentUnitID: 'unit-2',
      selectLesson,
    });
    fireEvent.click(screen.getByLabelText('Next lesson'));
    expect(selectLesson).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(selectLesson).toHaveBeenCalledWith('unit-3');
    vi.useRealTimers();
  });

  it('calls selectLesson with the previous unit id after a debounced click', () => {
    const selectLesson = vi.fn();
    renderNavigator({
      courseOutline: outlineWithThreeUnits,
      currentUnitID: 'unit-2',
      selectLesson,
    });
    fireEvent.click(screen.getByLabelText('Previous lesson'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(selectLesson).toHaveBeenCalledWith('unit-1');
    vi.useRealTimers();
  });
});
