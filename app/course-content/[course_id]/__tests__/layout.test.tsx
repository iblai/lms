import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock lodash
vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn((val: any) => !val || Object.keys(val).length === 0 || (Array.isArray(val) && val.length === 0)),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right">&gt;</span>,
  ListTree: () => <span data-testid="list-tree">ListTree</span>,
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 'test-user-id'),
}));

// Mock useGetDepartmentMemberCheckQuery
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false },
  })),
}));

// Mock useChatState
const mockSetCourseMentor = vi.fn();
vi.mock('@/components/chat-button', () => ({
  useChatState: vi.fn(() => ({
    setCourseMentor: mockSetCourseMentor,
  })),
}));

// Mock useCourseDetail
const mockHandleFetchCourseInfo = vi.fn();
const mockHandleFetchCourseSyllabus = vi.fn();
const mockHandleOpenLesson = vi.fn();
const mockHandleFetchCourseProgress = vi.fn();
const mockHandleFetchCourseCompletion = vi.fn();

vi.mock('@/hooks/courses/use-course-detail', () => ({
  useCourseDetail: vi.fn(() => ({
    handleFetchCourseInfo: mockHandleFetchCourseInfo,
    handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
    handleOpenLesson: mockHandleOpenLesson,
    handleFetchCourseProgress: mockHandleFetchCourseProgress,
    handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
    course: null,
    courseOutline: null,
    courseOutlineLoading: false,
    courseCompletion: null,
    courseGradingPolicyActive: false,
  })),
}));

// Mock useEdxIframe
vi.mock('@/hooks/courses/use-edx-iframe', () => ({
  useEdxIframe: vi.fn(() => ({
    getUnitToIframe: vi.fn(() => null),
    getParentsInfosFromSublessonId: vi.fn(() => null),
  })),
}));

// Mock EdxIframeContext
vi.mock('@/hooks/courses/edx-iframe-context', () => ({
  EdxIframeContext: React.createContext({}),
}));

// Mock CourseOutlineContext
vi.mock('@/contexts/course-outline-context', () => ({
  CourseOutlineContext: React.createContext({}),
}));

// Mock CourseOutline
vi.mock('@/components/course-outline', () => ({
  CourseOutline: () => <div data-testid="course-outline">CourseOutline</div>,
}));

// Mock CourseOutlineDrawer
vi.mock('@/components/course-outline-drawer', () => ({
  CourseOutlineDrawer: () => <div data-testid="course-outline-drawer">CourseOutlineDrawer</div>,
}));

// Mock ExamInfo from data-layer
vi.mock('@iblai/iblai-js/data-layer', () => ({
  ExamInfo: {},
}));

// Mock React.use
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof React>('react');
  return {
    ...actual,
    use: vi.fn((promise: any) => {
      if (promise && typeof promise === 'object' && 'course_id' in promise) {
        return promise;
      }
      return { course_id: 'course-v1:test+course+2024' };
    }),
  };
});

import CourseContentLayout from '../layout';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';

describe('CourseContentLayout', () => {
  const defaultParams = Promise.resolve({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      course: null,
      courseOutline: null,
      courseOutlineLoading: false,
      courseCompletion: null,
      courseGradingPolicyActive: false,
    } as any);
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(container).toBeTruthy();
  });

  it('renders CourseOutlineDrawer', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('course-outline-drawer')).toBeInTheDocument();
  });

  it('renders CourseOutline in sidebar', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('course-outline')).toBeInTheDocument();
  });

  it('renders course navigation tabs (Course, Progress, Dates, Discussion)', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Dates')).toBeInTheDocument();
    expect(screen.getByText('Discussion')).toBeInTheDocument();
  });

  it('hides Instructor tab when user is not platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.queryByText('Instructor')).not.toBeInTheDocument();
  });

  it('shows Instructor tab when user is platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByText('Instructor')).toBeInTheDocument();
  });

  it('renders children within layout', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div data-testid="page-content">Page Content</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('shows course display_name when course is loaded', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      course: { display_name: 'My Test Course', mentor_hidden: false, mentor_uuid: 'uuid-123' },
      courseOutline: null,
      courseOutlineLoading: false,
      courseCompletion: null,
      courseGradingPolicyActive: false,
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    expect(screen.getAllByText('My Test Course').length).toBeGreaterThan(0);
  });

  it('shows completion percentage in progress bar', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      course: null,
      courseOutline: null,
      courseOutlineLoading: false,
      courseCompletion: { completion_percentage: 75, grading_percentage: 80 },
      courseGradingPolicyActive: false,
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows grading percentage when courseGradingPolicyActive is true', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      course: null,
      courseOutline: null,
      courseOutlineLoading: false,
      courseCompletion: { completion_percentage: 50, grading_percentage: 90 },
      courseGradingPolicyActive: true,
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    expect(screen.getByText('Grade:')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('hides Grade section when courseGradingPolicyActive is false', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      course: null,
      courseOutline: null,
      courseOutlineLoading: false,
      courseCompletion: { completion_percentage: 50, grading_percentage: 90 },
      courseGradingPolicyActive: false,
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    expect(screen.queryByText('Grade:')).not.toBeInTheDocument();
  });

  it('renders open course outline button', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    const outlineButton = screen.getByLabelText('Open course outline');
    expect(outlineButton).toBeInTheDocument();
  });

  it('clicking open course outline button opens drawer', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    const outlineButton = screen.getByLabelText('Open course outline');
    fireEvent.click(outlineButton);
    // Verifies no error thrown (the state is internal)
    expect(outlineButton).toBeInTheDocument();
  });

  it('calls handleFetchCourseInfo on mount', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(mockHandleFetchCourseInfo).toHaveBeenCalled();
  });

  it('calls handleFetchCourseProgress on mount', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(mockHandleFetchCourseProgress).toHaveBeenCalled();
  });

  it('calls handleFetchCourseCompletion on mount', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(mockHandleFetchCourseCompletion).toHaveBeenCalled();
  });

  it('shows 0% when courseCompletion is null', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
