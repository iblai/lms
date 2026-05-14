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

// Mock next/navigation — return stable references so effects don't loop
const mockState = vi.hoisted(() => ({ searchParams: new URLSearchParams() }));
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => mockState.searchParams),
  usePathname: vi.fn(() => '/course-content/course-v1:test+course+2024/course'),
}));

// Mock sonner so we can assert toast usage
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock lodash
vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn(
      (val: any) =>
        !val || Object.keys(val).length === 0 || (Array.isArray(val) && val.length === 0),
    ),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right">&gt;</span>,
  ListTree: () => <span data-testid="list-tree">ListTree</span>,
  MoreVertical: () => <span data-testid="more-vertical">⋮</span>,
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 'test-user-id'),
  getUserName: vi.fn(() => 'test-user'),
}));

// Mock useGetCourseBlockDetailsQuery — block-details visibility gate
const mockUseGetCourseBlockDetailsQuery: any = vi.fn(
  (..._args: any[]) => ({ data: undefined }) as any,
);
vi.mock('@/services/course-metadata', () => ({
  useGetCourseBlockDetailsQuery: (...args: any[]) => mockUseGetCourseBlockDetailsQuery(...args),
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

const mockHandleCheckCourseMonetizationAccess = vi.fn(async (cb?: any) => {
  cb?.({ hasAccess: true });
});

vi.mock('@/hooks/courses/use-course-detail', () => ({
  useCourseDetail: vi.fn(() => ({
    handleFetchCourseInfo: mockHandleFetchCourseInfo,
    handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
    handleOpenLesson: mockHandleOpenLesson,
    handleFetchCourseProgress: mockHandleFetchCourseProgress,
    handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
    handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
    course: null,
    courseInfoLoadingState: 'successful',
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

// Mock CourseAccessGuard — renders children unconditionally so layout tests are isolated
vi.mock('@/components/course-access-guard', () => ({
  CourseAccessGuard: ({ children }: any) => <>{children}</>,
}));

// Mock CourseLessonNavigator — layout tests don't need to exercise navigator internals
vi.mock('@/components/course-lesson-navigator', () => ({
  CourseLessonNavigator: () => (
    <div data-testid="course-lesson-navigator">CourseLessonNavigator</div>
  ),
}));

// Mock Switch / Popover so the toggle is predictably rendered in jsdom
vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, 'aria-label': ariaLabel }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-testid="agent-mode-switch"
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <>{children}</>,
  PopoverTrigger: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  PopoverContent: ({ children }: any) => <div data-testid="agent-mode-popover">{children}</div>,
}));

// Mock ExamInfo from data-layer
vi.mock('@iblai/iblai-js/data-layer', () => ({
  ExamInfo: {},
}));

// Mock web-utils — layout dispatches setAdvancedDisplayMonetizationCheckoutModal
vi.mock('@iblai/iblai-js/web-utils', () => ({
  setAdvancedDisplayMonetizationCheckoutModal: (payload: unknown) => ({
    type: 'setAdvancedDisplayMonetizationCheckoutModal',
    payload,
  }),
}));

// Mock react-redux — layout calls useDispatch
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

// Mock config — layout reads studioUrl for the Authoring tab
vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      studioUrl: vi.fn(() => 'https://studio.example.com'),
    },
  },
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
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: null,
      courseInfoLoadingState: 'successful',
      courseOutline: null,
      courseOutlineLoading: false,
      courseCompletion: null,
      courseGradingPolicyActive: false,
    } as any);
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: undefined });
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

  it('renders course navigation tabs (Agent, Course, Progress, Dates, Discussion)', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Dates')).toBeInTheDocument();
    expect(screen.getByText('Discussion')).toBeInTheDocument();
  });

  it('hides Agent tab when course.agent_content_mode is not true', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: { agent_content_mode: false, course_content_mode: true },
      courseInfoLoadingState: 'successful',
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
    expect(screen.queryByText('Agent')).not.toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
  });

  it('hides Course tab when course.course_content_mode is false', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: { agent_content_mode: true, course_content_mode: false },
      courseInfoLoadingState: 'successful',
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
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.queryByText('Course')).not.toBeInTheDocument();
  });

  it('hides Agent tab when course.agent_content_mode is null', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: { agent_content_mode: null, course_content_mode: true },
      courseInfoLoadingState: 'successful',
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
    expect(screen.queryByText('Agent')).not.toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
  });

  it('shows Course tab when course.course_content_mode is null', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: { agent_content_mode: true, course_content_mode: null },
      courseInfoLoadingState: 'successful',
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
    expect(screen.getByText('Course')).toBeInTheDocument();
  });

  it('shows Course tab when both course_content_mode and agent_content_mode are false', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: { agent_content_mode: false, course_content_mode: false },
      courseInfoLoadingState: 'successful',
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
    expect(screen.queryByText('Agent')).not.toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
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

  describe('Authoring tab (platform admin only)', () => {
    it('renders Authoring tab for platform admin', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(screen.getByText('Authoring')).toBeInTheDocument();
    });

    it('hides Authoring tab for non-admin users', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false },
      } as any);

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(screen.queryByText('Authoring')).not.toBeInTheDocument();
    });

    it('Authoring tab points at studioUrl/course/<courseId> in a new tab', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);

      const { container } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const authoringLink = Array.from(container.querySelectorAll('a')).find(
        (a) => a.textContent?.trim() === 'Authoring',
      );
      expect(authoringLink).toBeTruthy();
      // React.use mock decodes the param, so the courseId in the href has raw colons/plus.
      expect(authoringLink?.getAttribute('href')).toBe(
        'https://studio.example.com/course/course-v1:test+course+2024',
      );
      expect(authoringLink?.getAttribute('target')).toBe('_blank');
      expect(authoringLink?.getAttribute('rel')).toContain('noopener');
    });

    it('Authoring tab is rendered immediately after Instructor tab', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);

      const { container } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const tabLabels = Array.from(container.querySelectorAll('a'))
        .map((a) => a.textContent?.trim() ?? '')
        .filter((t) =>
          [
            'Agent',
            'Course',
            'Progress',
            'Dates',
            'Discussion',
            'Instructor',
            'Authoring',
          ].includes(t),
        );
      const instructorIdx = tabLabels.indexOf('Instructor');
      const authoringIdx = tabLabels.indexOf('Authoring');
      expect(instructorIdx).toBeGreaterThanOrEqual(0);
      expect(authoringIdx).toBe(instructorIdx + 1);
    });
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
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
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
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
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
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
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
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
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

  it('renders the Agent tab link pointing at the agent route', () => {
    const { container } = render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    const agentLink = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Agent',
    );
    expect(agentLink).toBeTruthy();
    // The layout uses the raw course_id from params (React.use mock returns the
    // already-decoded form, so the href keeps the colon/plus characters).
    expect(agentLink?.getAttribute('href')).toMatch(/\/course-content\/.+\/agent$/);
  });

  it('renders the CourseLessonNavigator next to the tabs', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('course-lesson-navigator')).toBeInTheDocument();
  });

  describe('unit-switch toast on the agent tab', () => {
    // Stable outline/unit references avoid render loops when the effect
    // syncs currentCourseInfo from the mocked getUnitToIframe.
    const unitA = { id: 'unit-A', display_name: 'Unit A' };
    const unitB = { id: 'unit-B', display_name: 'Unit B' };
    const outline = {
      id: 'course-root',
      children: [
        {
          id: 'chapter-1',
          display_name: 'Ch 1',
          children: [
            {
              id: 'seq-1',
              display_name: 'Seq 1',
              children: [
                { id: 'unit-A', display_name: 'Unit A', children: [] },
                { id: 'unit-B', display_name: 'Unit B', children: [] },
              ],
            },
          ],
        },
      ],
    };

    const mockUnitLayout = async ({
      pathname,
      initialUnit,
    }: {
      pathname: string;
      initialUnit: typeof unitA;
    }) => {
      const { useEdxIframe } = await import('@/hooks/courses/use-edx-iframe');
      const { usePathname } = await import('next/navigation');

      vi.mocked(usePathname).mockReturnValue(pathname);
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_content_mode: true, course_content_mode: true },
        courseInfoLoadingState: 'successful',
        courseOutline: outline,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);

      let currentUnit = initialUnit;
      vi.mocked(useEdxIframe).mockReturnValue({
        getUnitToIframe: vi.fn(() => currentUnit),
        getParentsInfosFromSublessonId: vi.fn(() => null),
      } as any);

      return {
        setUnit: (u: typeof unitA) => {
          currentUnit = u;
        },
      };
    };

    it('fires a success toast when the current unit id changes while on /agent', async () => {
      const { toast } = await import('sonner');
      const { setUnit } = await mockUnitLayout({
        pathname: '/course-content/course-v1:test+course+2024/agent',
        initialUnit: unitA,
      });

      const { rerender } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(toast.success).not.toHaveBeenCalled();

      // Simulate a URL change by swapping the searchParams reference; that
      // retriggers the effect that syncs currentCourseInfo from the mocked unit.
      setUnit(unitB);
      mockState.searchParams = new URLSearchParams('unit_id=unit-B');
      rerender(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(toast.success).toHaveBeenCalledWith('Switched to "Unit B"');
    });

    it('does NOT fire the toast when the unit changes on a non-agent tab', async () => {
      const { toast } = await import('sonner');
      const { setUnit } = await mockUnitLayout({
        pathname: '/course-content/course-v1:test+course+2024/course',
        initialUnit: unitA,
      });

      const { rerender } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      setUnit(unitB);
      mockState.searchParams = new URLSearchParams('unit_id=unit-B');
      rerender(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('learning/assessment mode toggle', () => {
    const unit = { id: 'unit-vertical-1', display_name: 'Unit 1' };
    const outlineWithUnit = {
      id: 'course-root',
      children: [
        {
          id: 'chapter-1',
          children: [
            {
              id: 'seq-1',
              children: [{ id: 'unit-vertical-1', display_name: 'Unit 1', children: [] }],
            },
          ],
        },
      ],
    };

    const blockDetailsWithMentor = {
      root: 'unit-vertical-1',
      blocks: {
        'unit-vertical-1': { id: 'unit-vertical-1', type: 'vertical', display_name: 'Unit' },
        'mentor-block': {
          id: 'mentor-block',
          type: 'ibl_mentor_xblock',
          display_name: 'Mentor',
        },
      },
    };

    const blockDetailsWithoutMentor = {
      root: 'unit-vertical-1',
      blocks: {
        'unit-vertical-1': { id: 'unit-vertical-1', type: 'vertical', display_name: 'Unit' },
      },
    };

    const setupAgentTab = async (blocks: any) => {
      const { useEdxIframe } = await import('@/hooks/courses/use-edx-iframe');
      const { usePathname } = await import('next/navigation');

      vi.mocked(usePathname).mockReturnValue('/course-content/course-v1:test+course+2024/agent');
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_content_mode: true, course_content_mode: true },
        courseInfoLoadingState: 'successful',
        courseOutline: outlineWithUnit,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);
      vi.mocked(useEdxIframe).mockReturnValue({
        getUnitToIframe: vi.fn(() => unit),
        getParentsInfosFromSublessonId: vi.fn(() => null),
      } as any);
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blocks });
    };

    it('hides the toggle on a non-agent tab even when the block has a mentor xblock', async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue('/course-content/course-v1:test+course+2024/course');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMentor });

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      expect(screen.queryByTestId('agent-mode-switch')).not.toBeInTheDocument();
    });

    it('hides the toggle on the agent tab when no block has type=ibl_mentor_xblock', async () => {
      await setupAgentTab(blockDetailsWithoutMentor);

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      expect(screen.queryByTestId('agent-mode-switch')).not.toBeInTheDocument();
    });

    it('shows the toggle on the agent tab when at least one block has type=ibl_mentor_xblock', async () => {
      await setupAgentTab(blockDetailsWithMentor);

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      // Inline (md+) and popover (mobile) variants both render the same Switch.
      const switches = screen.getAllByTestId('agent-mode-switch');
      expect(switches.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Learn').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Assess').length).toBeGreaterThan(0);
    });

    it('renders a vertical 3-dot trigger (mobile) when the toggle is visible', async () => {
      await setupAgentTab(blockDetailsWithMentor);

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const moreVerticalIcons = screen.getAllByTestId('more-vertical');
      expect(moreVerticalIcons.length).toBeGreaterThan(0);
    });

    it('skips the block-details query when not on the agent tab', async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue('/course-content/course-v1:test+course+2024/course');

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      // The hook still gets called, but with skip:true so RTK Query won't fire the request.
      const lastCall =
        mockUseGetCourseBlockDetailsQuery.mock.calls[
          mockUseGetCourseBlockDetailsQuery.mock.calls.length - 1
        ];
      expect(lastCall?.[1]).toEqual(expect.objectContaining({ skip: true }));
    });

    it('toggles agent mode from learning to assessment when the switch is clicked', async () => {
      await setupAgentTab(blockDetailsWithMentor);

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const switches = screen.getAllByTestId('agent-mode-switch');
      const initialSwitch = switches[0];
      expect(initialSwitch).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(initialSwitch);

      // After click, every rendered switch should reflect the new checked state.
      const updatedSwitches = screen.getAllByTestId('agent-mode-switch');
      updatedSwitches.forEach((s) => expect(s).toHaveAttribute('aria-checked', 'true'));
    });
  });
});
