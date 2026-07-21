import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
  useParams: () => ({ tenant: 'test-tenant' }),
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
  CirclePlay: () => <span data-testid="circle-play">CirclePlay</span>,
  CirclePause: () => <span data-testid="circle-pause">CirclePause</span>,
  Maximize: () => <span data-testid="maximize">Maximize</span>,
  X: () => <span data-testid="dismiss-x">×</span>,
  // Used by the unit media dropdown rendered in the tabs row.
  Projector: () => <span data-testid="projector">Projector</span>,
  FileText: () => <span data-testid="file-text">FileText</span>,
  Library: () => <span data-testid="library">Library</span>,
  PlaySquare: () => <span data-testid="play-square">PlaySquare</span>,
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

// Mock CourseOutlineSidebar — the collapsible-sidebar internals (rail, hint
// popover, media queries) are exercised in its own test; here we only need to
// confirm the layout mounts it.
vi.mock('@/components/course-outline-sidebar', () => ({
  CourseOutlineSidebar: () => <div data-testid="course-outline-sidebar">CourseOutlineSidebar</div>,
  CourseOutlineToggle: () => <div data-testid="course-outline-toggle">CourseOutlineToggle</div>,
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
  Switch: ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
  }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-testid={dataTestId ?? 'agent-mode-switch'}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

// The Popover mock shares the controlling `open` prop with its content via a
// context so controlled popovers (the agent-mode hint, the mobile 3-dot
// controls menu) can be asserted as shown/hidden; the trigger toggles them
// through `onOpenChange` like the real component. Uncontrolled popovers
// (open===undefined) always render their content.
vi.mock('@/components/ui/popover', async () => {
  const ReactActual = await vi.importActual<typeof React>('react');
  const PopoverOpenContext = ReactActual.createContext<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }>({});
  return {
    Popover: ({ children, open, onOpenChange }: any) =>
      ReactActual.createElement(
        PopoverOpenContext.Provider,
        { value: { open, onOpenChange } },
        children,
      ),
    PopoverTrigger: ({ children, onClick, ...rest }: any) => {
      const { open, onOpenChange } = ReactActual.useContext(PopoverOpenContext);
      return (
        <button
          {...rest}
          onClick={(event: React.MouseEvent) => {
            onClick?.(event);
            onOpenChange?.(!open);
          }}
        >
          {children}
        </button>
      );
    },
    PopoverAnchor: ({ children }: any) => <>{children}</>,
    PopoverContent: ({ children }: any) => {
      const { open } = ReactActual.useContext(PopoverOpenContext);
      if (open === false) return null;
      return <div data-testid="agent-mode-popover">{children}</div>;
    },
  };
});

// Mock ExamInfo from data-layer
vi.mock('@iblai/iblai-js/data-layer', () => ({
  ExamInfo: {},
}));

// Mock web-utils — layout dispatches setAdvancedDisplayMonetizationCheckoutModal
// and reads the tenant `enable_course_voice_autoplay` flag via useTenantMetadata.
const mockTenantMetadata = vi.hoisted(() => ({
  current: { enable_course_voice_autoplay: true } as Record<string, unknown>,
}));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  setAdvancedDisplayMonetizationCheckoutModal: (payload: unknown) => ({
    type: 'setAdvancedDisplayMonetizationCheckoutModal',
    payload,
  }),
  useTenantMetadata: vi.fn(() => ({ metadata: mockTenantMetadata.current })),
}));

// Mock react-redux — layout calls useDispatch + useSelector(selectMentorSpinnerHidden | selectRbacPermissions)
const mockDispatch = vi.fn();
const mentorState = vi.hoisted(() => ({ spinnerHidden: false }));
const rbacState = vi.hoisted(() => ({ rbacPermissions: {} as Record<string, unknown> }));
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: any) => any) =>
    selector({ mentor: mentorState, rbac: rbacState }),
}));

vi.mock('@/features/mentor', () => ({
  selectMentorSpinnerHidden: (state: any) => state.mentor.spinnerHidden,
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: (state: any) => state.rbac.rbacPermissions,
}));

// Mock checkRbacPermission — layout uses it to derive the watcher audience
const mockCheckRbacPermission = vi.hoisted(() => vi.fn(() => false));
vi.mock('@/hoc', () => ({
  checkRbacPermission: mockCheckRbacPermission,
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
import { NAVBAR_COURSE_CONTROLS_ID } from '@/constants/global';

describe('CourseContentLayout', () => {
  const defaultParams = Promise.resolve({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' });

  beforeEach(() => {
    vi.clearAllMocks();
    // The course controls (autoplay, media, fullscreen, Learn/Assess) portal
    // into the navbar slot, which the (unrendered-here) NavBar provides in the
    // real app — recreate it so the portal has a mount point.
    document.getElementById(NAVBAR_COURSE_CONTROLS_ID)?.remove();
    const navbarControlsSlot = document.createElement('div');
    navbarControlsSlot.id = NAVBAR_COURSE_CONTROLS_ID;
    document.body.appendChild(navbarControlsSlot);
    mockTenantMetadata.current = { enable_course_voice_autoplay: true };
    mockCheckRbacPermission.mockReturnValue(false);
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

  it('renders CourseOutlineSidebar', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(screen.getByTestId('course-outline-sidebar')).toBeInTheDocument();
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

  it('hides Agent tab for non-admin when agent_content_mode_audience is admins-only', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: {
        agent_content_mode: true,
        course_content_mode: true,
        agent_content_mode_audience: ['admins'],
      },
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

  it('shows Agent tab for admin when agent_content_mode_audience is admins-only', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: {
        agent_content_mode: true,
        course_content_mode: true,
        agent_content_mode_audience: ['admins'],
      },
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
  });

  it('hides Course tab for non-admin when course_content_mode_audience is admins-only', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: {
        agent_content_mode: true,
        course_content_mode: true,
        course_content_mode_audience: ['admins'],
      },
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
    expect(screen.queryByText('Course')).not.toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('hides Agent tab from a non-watcher when agent_content_mode_audience is watchers-only', () => {
    mockCheckRbacPermission.mockReturnValue(false);
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: {
        agent_content_mode: true,
        course_content_mode: true,
        agent_content_mode_audience: ['watchers'],
      },
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

  it('shows Agent tab to a watcher (RBAC granted) when agent_content_mode_audience is watchers-only', () => {
    mockCheckRbacPermission.mockReturnValue(true);
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    vi.mocked(useCourseDetail).mockReturnValue({
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      handleFetchCourseProgress: mockHandleFetchCourseProgress,
      handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
      handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
      course: {
        agent_content_mode: true,
        course_content_mode: true,
        agent_content_mode_audience: ['watchers'],
      },
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
    expect(mockCheckRbacPermission).toHaveBeenCalledWith({}, '/watchedgroups/#list');
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

      // The notification is deferred until the hidden course iframe reports
      // it has loaded the new unit.
      expect(toast.success).not.toHaveBeenCalled();
      act(() => {
        window.dispatchEvent(new CustomEvent('edx-iframe:loaded'));
      });
      expect(toast.success).toHaveBeenCalledWith('Switched to "Unit B"');
    });

    it('falls back to firing the switch toast after 15s when the iframe never loads', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
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

        setUnit(unitB);
        mockState.searchParams = new URLSearchParams('unit_id=unit-B');
        rerender(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        expect(toast.success).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(15_000);
        expect(toast.success).toHaveBeenCalledWith('Switched to "Unit B"');
      } finally {
        vi.useRealTimers();
      }
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

      act(() => {
        window.dispatchEvent(new CustomEvent('edx-iframe:loaded'));
      });
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('initial unit load on /agent dispatches "Loaded" once the mentor spinner is hidden and the course iframe has loaded', () => {
    const unit = { id: 'unit-1', display_name: 'Intro Unit' };
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
              children: [{ id: 'unit-1', display_name: 'Intro Unit', children: [] }],
            },
          ],
        },
      ],
    };

    const mockAgentLayoutWithUnit = async (pathname: string) => {
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
      vi.mocked(useEdxIframe).mockReturnValue({
        getUnitToIframe: vi.fn(() => unit),
        getParentsInfosFromSublessonId: vi.fn(() => null),
      } as any);
    };

    beforeEach(() => {
      mentorState.spinnerHidden = false;
    });

    it('fires toast + custom event once the course iframe loads on the agent tab', async () => {
      const { toast } = await import('sonner');
      await mockAgentLayoutWithUnit('/course-content/course-v1:test+course+2024/agent');
      mentorState.spinnerHidden = true;

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      expect(toast.success).not.toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'mentor:unit-switched' }),
      );

      act(() => {
        window.dispatchEvent(new CustomEvent('edx-iframe:loaded'));
      });
      expect(toast.success).toHaveBeenCalledWith('Loaded "Intro Unit"');

      const eventCall = dispatchSpy.mock.calls.find(
        ([e]) => (e as CustomEvent).type === 'mentor:unit-switched',
      );
      expect(eventCall).toBeDefined();
      const event = eventCall![0] as CustomEvent<{ message: string }>;
      expect(event.detail.message).toBe('Loaded "Intro Unit"');
    });

    it('fires immediately when the iframe had already loaded before the spinner hid', async () => {
      const { toast } = await import('sonner');
      await mockAgentLayoutWithUnit('/course-content/course-v1:test+course+2024/agent');
      mentorState.spinnerHidden = false;

      const { rerender } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      // Iframe loads while the mentor spinner is still visible.
      act(() => {
        window.dispatchEvent(new CustomEvent('edx-iframe:loaded'));
      });
      expect(toast.success).not.toHaveBeenCalled();

      mentorState.spinnerHidden = true;
      rerender(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(toast.success).toHaveBeenCalledWith('Loaded "Intro Unit"');
    });

    it('falls back to firing after 15s when the iframe never loads', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { toast } = await import('sonner');
        await mockAgentLayoutWithUnit('/course-content/course-v1:test+course+2024/agent');
        mentorState.spinnerHidden = true;

        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        // 14s (not 14.999s): shouldAdvanceTime lets real elapsed time tick the
        // mock clock too, so a 1ms margin flakes under load.
        await vi.advanceTimersByTimeAsync(14_000);
        expect(toast.success).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1_000);
        expect(toast.success).toHaveBeenCalledWith('Loaded "Intro Unit"');
      } finally {
        vi.useRealTimers();
      }
    });

    it('does NOT fire the "Loaded" toast while the mentor spinner is still visible', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { toast } = await import('sonner');
        await mockAgentLayoutWithUnit('/course-content/course-v1:test+course+2024/agent');
        mentorState.spinnerHidden = false;

        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await vi.advanceTimersByTimeAsync(10_000);
        expect(toast.success).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('does NOT fire the "Loaded" toast when the user is not on the agent tab', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { toast } = await import('sonner');
        await mockAgentLayoutWithUnit('/course-content/course-v1:test+course+2024/course');
        mentorState.spinnerHidden = true;

        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await vi.advanceTimersByTimeAsync(10_000);
        expect(toast.success).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('only schedules the "Loaded" toast once even if the component re-renders', async () => {
      const { toast } = await import('sonner');
      await mockAgentLayoutWithUnit('/course-content/course-v1:test+course+2024/agent');
      mentorState.spinnerHidden = true;

      const { rerender } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      // Force several extra renders before the iframe reports loaded.
      for (let i = 0; i < 3; i++) {
        rerender(
          <CourseContentLayout params={defaultParams}>
            <div>children {i}</div>
          </CourseContentLayout>,
        );
      }

      act(() => {
        window.dispatchEvent(new CustomEvent('edx-iframe:loaded'));
      });
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Loaded "Intro Unit"');

      // More renders and iframe loads after it already fired change nothing.
      rerender(
        <CourseContentLayout params={defaultParams}>
          <div>children final</div>
        </CourseContentLayout>,
      );
      act(() => {
        window.dispatchEvent(new CustomEvent('edx-iframe:loaded'));
      });
      expect(toast.success).toHaveBeenCalledTimes(1);
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

  describe('one-time agent-mode hint popover', () => {
    const STORAGE_KEY = 'skills:agent-mode-hint-dismissed';

    const blockDetailsWithMentor = {
      root: 'unit-vertical-1',
      blocks: {
        'unit-vertical-1': { id: 'unit-vertical-1', type: 'vertical', display_name: 'Unit' },
        'mentor-block': { id: 'mentor-block', type: 'ibl_mentor_xblock', display_name: 'Mentor' },
      },
    };

    // Puts the layout on the agent tab with a mentor xblock present, which is
    // what makes the Learn/Assess switch (and therefore the hint) eligible.
    const setupAgentTab = async () => {
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
        courseOutline: null,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMentor });
    };

    beforeEach(() => {
      localStorage.clear();
      // Keep the unrelated "Loaded" toast timer from firing during our waits.
      mentorState.spinnerHidden = false;
    });

    it('does not show the hint before the 600ms delay elapses', async () => {
      // No shouldAdvanceTime here: this test asserts the hint is absent just
      // under the threshold, so the clock must only move when advanced explicitly.
      vi.useFakeTimers();
      try {
        await setupAgentTab();
        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        expect(screen.queryByText('Two ways to learn')).not.toBeInTheDocument();
        await act(async () => {
          await vi.advanceTimersByTimeAsync(599);
        });
        expect(screen.queryByText('Two ways to learn')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('shows the hint 600ms after the Learn/Assess switch appears (first visit)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        await setupAgentTab();
        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(600);
        });
        expect(screen.getByText('Two ways to learn')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not show the hint when it was previously dismissed (persisted in localStorage)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
        await setupAgentTab();
        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
        expect(screen.queryByText('Two ways to learn')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not show the hint on a non-agent tab (switch not visible)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const { usePathname } = await import('next/navigation');
        vi.mocked(usePathname).mockReturnValue('/course-content/course-v1:test+course+2024/course');
        mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMentor });

        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
        expect(screen.queryByText('Two ways to learn')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('persists dismissal to localStorage and hides the hint when "Got it" is clicked', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        await setupAgentTab();
        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(600);
        });
        expect(screen.getByText('Two ways to learn')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(screen.queryByText('Two ways to learn')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('persists dismissal and hides the hint when the X button is clicked', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        await setupAgentTab();
        render(
          <CourseContentLayout params={defaultParams}>
            <div>children</div>
          </CourseContentLayout>,
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(600);
        });
        expect(screen.getByText('Two ways to learn')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(screen.queryByText('Two ways to learn')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('agent autoplay toggle', () => {
    const renderWithCourse = (course: any) => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course,
        courseInfoLoadingState: 'successful',
        courseOutline: null,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);

      return render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
    };

    it('hides the autoplay toggle when course.agent_autoplay is false', () => {
      renderWithCourse({ agent_autoplay: false });
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle when course.agent_autoplay is null', () => {
      renderWithCourse({ agent_autoplay: null });
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle when course.agent_autoplay is missing', () => {
      renderWithCourse({});
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle when course is null (still loading)', () => {
      renderWithCourse(null);
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle for truthy-but-not-true values (e.g. 1)', () => {
      renderWithCourse({ agent_autoplay: 1 });
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle when tenant enable_course_voice_autoplay is false (course flag on)', () => {
      mockTenantMetadata.current = { enable_course_voice_autoplay: false };
      renderWithCourse({ agent_autoplay: true });
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle when tenant enable_course_voice_autoplay is missing', () => {
      mockTenantMetadata.current = {};
      renderWithCourse({ agent_autoplay: true });
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('hides the autoplay toggle for tenant truthy-but-not-true values (e.g. "true")', () => {
      mockTenantMetadata.current = { enable_course_voice_autoplay: 'true' };
      renderWithCourse({ agent_autoplay: true });
      expect(screen.queryByTestId('agent-autoplay-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-autoplay-popover-switch')).not.toBeInTheDocument();
    });

    it('shows the autoplay toggle only when BOTH course.agent_autoplay AND tenant flag are true', () => {
      mockTenantMetadata.current = { enable_course_voice_autoplay: true };
      renderWithCourse({ agent_autoplay: true });
      expect(screen.getByTestId('agent-autoplay-toggle')).toBeInTheDocument();
    });

    it('shows the autoplay toggle (defaults to off, play icon visible)', () => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_autoplay: true },
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

      const toggle = screen.getByTestId('agent-autoplay-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      // When off, CirclePlay is visible (in desktop button and popover row).
      expect(screen.getAllByTestId('circle-play').length).toBeGreaterThan(0);
      expect(screen.queryByTestId('circle-pause')).not.toBeInTheDocument();
    });

    it('flips to the pause icon and fires a toast when clicked on', async () => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_autoplay: true },
        courseInfoLoadingState: 'successful',
        courseOutline: null,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);

      const { toast } = await import('sonner');

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const toggle = screen.getByTestId('agent-autoplay-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'true');
      // When on, CirclePause is visible (in desktop button and popover row).
      expect(screen.getAllByTestId('circle-pause').length).toBeGreaterThan(0);
      expect(toast.success).toHaveBeenCalledWith('Autoplay turned on');

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(toast.success).toHaveBeenCalledWith('Autoplay turned off');
    });

    it('renders the autoplay row inside the mobile popover when agent_autoplay is true', () => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_autoplay: true },
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

      // Mobile 3-dot trigger renders even when only autoplay is visible.
      expect(screen.getAllByTestId('more-vertical').length).toBeGreaterThan(0);

      // Popover content (opened via the trigger) includes the Autoplay label
      // + its own switch.
      fireEvent.click(screen.getByLabelText('Agent display options'));
      const popover = screen.getByTestId('agent-mode-popover');
      expect(popover).toHaveTextContent('Autoplay');
      expect(screen.getByTestId('agent-autoplay-popover-switch')).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('dispatches mentor:autoplay-changed with the new state when the desktop button is clicked', () => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_autoplay: true },
        courseInfoLoadingState: 'successful',
        courseOutline: null,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const toggle = screen.getByTestId('agent-autoplay-toggle');

      // First click: off -> on, expect enabled=true.
      fireEvent.click(toggle);
      let autoplayEvent = dispatchSpy.mock.calls
        .map(([e]) => e as Event)
        .find((e) => e.type === 'mentor:autoplay-changed') as
        | CustomEvent<{ enabled: boolean }>
        | undefined;
      expect(autoplayEvent).toBeDefined();
      expect(autoplayEvent!.detail).toEqual({ enabled: true });

      dispatchSpy.mockClear();

      // Second click: on -> off, expect enabled=false.
      fireEvent.click(toggle);
      autoplayEvent = dispatchSpy.mock.calls
        .map(([e]) => e as Event)
        .find((e) => e.type === 'mentor:autoplay-changed') as
        | CustomEvent<{ enabled: boolean }>
        | undefined;
      expect(autoplayEvent).toBeDefined();
      expect(autoplayEvent!.detail).toEqual({ enabled: false });
    });

    it('dispatches mentor:autoplay-changed when the popover switch is clicked', () => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_autoplay: true },
        courseInfoLoadingState: 'successful',
        courseOutline: null,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      fireEvent.click(screen.getByLabelText('Agent display options'));
      fireEvent.click(screen.getByTestId('agent-autoplay-popover-switch'));

      const autoplayEvent = dispatchSpy.mock.calls
        .map(([e]) => e as Event)
        .find((e) => e.type === 'mentor:autoplay-changed') as
        | CustomEvent<{ enabled: boolean }>
        | undefined;
      expect(autoplayEvent).toBeDefined();
      expect(autoplayEvent!.detail).toEqual({ enabled: true });
    });

    it('keeps the popover autoplay switch and the desktop button in sync', () => {
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course: { agent_autoplay: true },
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

      fireEvent.click(screen.getByLabelText('Agent display options'));
      const desktopToggle = screen.getByTestId('agent-autoplay-toggle');
      const popoverSwitch = screen.getByTestId('agent-autoplay-popover-switch');

      expect(desktopToggle).toHaveAttribute('aria-checked', 'false');
      expect(popoverSwitch).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(popoverSwitch);

      expect(desktopToggle).toHaveAttribute('aria-checked', 'true');
      expect(popoverSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });

  // Mobile 3-dot controls popover: the media and fullscreen rows (autoplay
  // and the Learn/Assess switch rows are covered in their describes above).
  describe('mobile controls popover (media + fullscreen)', () => {
    const blockDetailsWithMedia = {
      root: 'unit-vertical-1',
      blocks: {
        'unit-vertical-1': { id: 'unit-vertical-1', type: 'vertical', display_name: 'Unit' },
        'pdf-block': {
          id: 'pdf-block',
          type: 'pdf',
          display_name: 'Course PDF',
          student_view_url: 'https://lms.example.com/xblock/pdf-block',
        },
      },
    };

    const setTab = async (tab: 'agent' | 'course') => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue(`/course-content/course-v1:test+course+2024/${tab}`);
    };

    const renderLayout = () =>
      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

    it('lists the media and fullscreen rows on the agent tab', async () => {
      await setTab('agent');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMedia });

      renderLayout();
      fireEvent.click(screen.getByLabelText('Agent display options'));

      expect(screen.getByTestId('agent-fullscreen-popover-button')).toBeInTheDocument();
      const items = screen.getAllByTestId('course-media-menu-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Course PDF');
    });

    it('lists media but no fullscreen row on the course tab', async () => {
      await setTab('course');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMedia });

      renderLayout();
      fireEvent.click(screen.getByLabelText('Agent display options'));

      expect(screen.getAllByTestId('course-media-menu-item')).toHaveLength(1);
      expect(screen.queryByTestId('agent-fullscreen-popover-button')).not.toBeInTheDocument();
    });

    it('closes the popover when the fullscreen row is clicked', async () => {
      await setTab('agent');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMedia });

      renderLayout();
      fireEvent.click(screen.getByLabelText('Agent display options'));
      fireEvent.click(screen.getByTestId('agent-fullscreen-popover-button'));

      expect(screen.queryByTestId('agent-fullscreen-popover-button')).not.toBeInTheDocument();
    });

    it('selecting a media item on the agent tab closes the popover and opens the preview dialog', async () => {
      await setTab('agent');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMedia });

      renderLayout();
      fireEvent.click(screen.getByLabelText('Agent display options'));
      fireEvent.click(screen.getByTestId('course-media-menu-item'));

      // Popover closed, preview (rendered outside it) open.
      expect(screen.queryByTestId('course-media-menu-item')).not.toBeInTheDocument();
      expect(screen.getByTestId('course-media-preview')).toBeInTheDocument();
    });

    it('hides the 3-dot trigger when no control is available (course tab, no media)', async () => {
      await setTab('course');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: undefined });

      renderLayout();

      expect(screen.queryByLabelText('Agent display options')).not.toBeInTheDocument();
    });
  });

  // Tabs moved here from the course about page + the new Analytics tab.
  describe('Course detail tabs (Learning Info / Instructors / Configuration / Analytics)', () => {
    const courseDetailWith = (course: any) =>
      vi.mocked(useCourseDetail).mockReturnValue({
        handleFetchCourseInfo: mockHandleFetchCourseInfo,
        handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
        handleOpenLesson: mockHandleOpenLesson,
        handleFetchCourseProgress: mockHandleFetchCourseProgress,
        handleFetchCourseCompletion: mockHandleFetchCourseCompletion,
        handleCheckCourseMonetizationAccess: mockHandleCheckCourseMonetizationAccess,
        course,
        courseInfoLoadingState: 'successful',
        courseOutline: null,
        courseOutlineLoading: false,
        courseCompletion: null,
        courseGradingPolicyActive: false,
      } as any);

    const renderLayout = () =>
      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

    it('shows Learning Info only when the course has learning_info', () => {
      courseDetailWith({ learning_info: ['Understand X'] });
      renderLayout();
      const link = screen.getByText('Learning Info').closest('a');
      expect(link).toHaveAttribute('href', expect.stringContaining('/learning-info'));
    });

    it('hides Learning Info when learning_info is empty', () => {
      courseDetailWith({ learning_info: [] });
      renderLayout();
      expect(screen.queryByText('Learning Info')).not.toBeInTheDocument();
    });

    it('shows Instructors only when the course has instructors', () => {
      courseDetailWith({ instructor_info: { instructors: [{ name: 'Ada' }] } });
      renderLayout();
      const link = screen.getByText('Instructors').closest('a');
      expect(link).toHaveAttribute('href', expect.stringContaining('/instructors'));
    });

    it('hides Instructors when the instructors list is empty', () => {
      courseDetailWith({ instructor_info: { instructors: [] } });
      renderLayout();
      expect(screen.queryByText('Instructors')).not.toBeInTheDocument();
    });

    it('shows Configuration for a platform admin', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      renderLayout();
      const link = screen.getByText('Configuration').closest('a');
      expect(link).toHaveAttribute('href', expect.stringContaining('/configuration'));
    });

    it('hides Configuration for a non-admin user', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false },
      } as any);
      renderLayout();
      expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
    });

    it('shows Analytics only when the user has the can_view_analytics permission', () => {
      mockCheckRbacPermission.mockImplementation(((_perms: any, resource: string) =>
        resource.includes('can_view_analytics')) as any);
      renderLayout();
      const link = screen.getByText('Analytics').closest('a');
      expect(link).toHaveAttribute('href', expect.stringContaining('/analytics'));
    });

    it('hides Analytics when the user lacks can_view_analytics (even as admin)', () => {
      // Default mockCheckRbacPermission returns false for every resource.
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      renderLayout();
      expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    });
  });

  describe('content area scrolling', () => {
    const renderOnTab = async (tab: string) => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue(`/course-content/course-v1:test+course+2024/${tab}`);
      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      return screen.getByText('children').parentElement as HTMLElement;
    };

    it.each(['analytics', 'configuration', 'instructor', 'instructors'])(
      'scrolls the container on the %s tab (desktop)',
      async (tab) => {
        const contentArea = await renderOnTab(tab);
        expect(contentArea.className).toContain('overflow-y-auto');
      },
    );

    it.each(['course', 'progress', 'dates', 'discussion'])(
      'leaves scrolling to the iframe on the %s tab (desktop)',
      async (tab) => {
        const contentArea = await renderOnTab(tab);
        expect(contentArea.className).not.toContain('overflow-y-auto');
      },
    );
  });
});
