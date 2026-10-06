import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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
vi.mock('lodash/isEmpty', () => ({
  default: vi.fn(
    (val: any) => !val || Object.keys(val).length === 0 || (Array.isArray(val) && val.length === 0),
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  // Empty so a tab's textContent stays its bare label.
  const icon = (testId: string) => {
    const Icon = (props: any) => <span data-testid={testId} aria-hidden={props['aria-hidden']} />;
    Icon.displayName = `Icon(${testId})`;
    return Icon;
  };
  return {
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
    // Used by LessonCompletedDialog, rendered inside the layout.
    CheckCircle2: () => <span data-testid="check-circle-2">CheckCircle2</span>,
    ChevronLeft: () => <span data-testid="chevron-left">&lt;</span>,
    // Tab icons (layout) and the overflow / external markers (CourseContentTabs).
    // Hidden from the accessible name so `getByRole('link', { name })` still
    // matches the bare label.
    Sparkles: icon('icon-sparkles'),
    BookOpen: icon('icon-book-open'),
    ChartNoAxesColumn: icon('icon-chart-no-axes-column'),
    ClipboardList: icon('icon-clipboard-list'),
    CalendarDays: icon('icon-calendar-days'),
    MessagesSquare: icon('icon-messages-square'),
    MessageSquarePlus: icon('icon-message-square-plus'),
    Presentation: icon('icon-presentation'),
    Lightbulb: icon('icon-lightbulb'),
    Users: icon('icon-users'),
    Settings2: icon('icon-settings-2'),
    ChartColumn: icon('icon-chart-column'),
    SquarePen: icon('icon-square-pen'),
    Ellipsis: icon('icon-ellipsis'),
    ArrowUpRight: icon('icon-arrow-up-right'),
    ChevronDown: icon('icon-chevron-down'),
    ShieldCheck: icon('icon-shield-check'),
    Wrench: icon('icon-wrench'),
  };
});

// Overflowed tabs live inside a Radix DropdownMenu whose content only mounts
// once opened — and opening needs pointer APIs jsdom lacks. Stub it to always
// render its content so tab assertions keep working either way.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
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

// Mock the course-role hook — drives the staff-only tab gates
const courseUserRolesState = vi.hoisted(() => ({
  current: {
    courseRoles: [] as any[],
    isCourseStaff: false,
    isCourseLimitedStaff: false,
    hasCourseStaffAccess: false,
    isResolved: true,
  },
}));
const mockUseCourseUserRoles = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/courses/use-course-user-roles', () => ({
  useCourseUserRoles: (...args: any[]) => mockUseCourseUserRoles(...args),
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

// Mock config — layout reads studioUrl for the Authoring tab.
vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      studioUrl: vi.fn(() => 'https://studio.example.com'),
      mentor: vi.fn(() => 'https://mentor.example.com'),
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
import { LESSON_COMPLETED_DIALOG_DELAY_MS } from '@/components/lesson-completed-dialog';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { NAVBAR_COURSE_CONTROLS_ID } from '@/constants/global';

describe('CourseContentLayout', () => {
  const defaultParams = Promise.resolve({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' });

  // CourseContentTabs renders an aria-hidden copy of every label to measure its
  // natural width, so a plain text query matches each tab twice. Tabs are always
  // anchors, and role queries skip the aria-hidden measurement row.
  const tabLink = (name: string) => screen.getByRole('link', { name });
  const queryTabLink = (name: string) => screen.queryByRole('link', { name });
  const linkLabels = (scope: HTMLElement) =>
    within(scope)
      .getAllByRole('link')
      .map((a) => a.textContent?.trim() ?? '');
  /** Tab labels in row order (overflow never triggers in jsdom, so all are inline). */
  const rowLabels = () => linkLabels(screen.getByTestId('course-content-tabs'));
  /** Staff section labels, in nav order (only rendered on a staff route). */
  const staffSectionLabels = () => linkLabels(screen.getByTestId('course-staff-nav'));
  /** The staff pages share one tab; their links live in the staff area's nav. */
  const useStaffRoute = async (section = 'instructor') => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue(`/course-content/course-v1:test+course+2024/${section}`);
  };

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
    courseUserRolesState.current = {
      courseRoles: [],
      isCourseStaff: false,
      isCourseLimitedStaff: false,
      hasCourseStaffAccess: false,
      isResolved: true,
    };
    mockUseCourseUserRoles.mockImplementation(() => courseUserRolesState.current);
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
    expect(tabLink('Agent')).toBeInTheDocument();
    expect(tabLink('Course')).toBeInTheDocument();
    expect(tabLink('Progress')).toBeInTheDocument();
    expect(tabLink('Dates')).toBeInTheDocument();
    expect(tabLink('Discussions')).toBeInTheDocument();
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
    expect(queryTabLink('Agent')).not.toBeInTheDocument();
    expect(tabLink('Course')).toBeInTheDocument();
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
    expect(tabLink('Agent')).toBeInTheDocument();
    expect(queryTabLink('Course')).not.toBeInTheDocument();
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
    expect(queryTabLink('Agent')).not.toBeInTheDocument();
    expect(tabLink('Course')).toBeInTheDocument();
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
    expect(tabLink('Course')).toBeInTheDocument();
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
    expect(queryTabLink('Agent')).not.toBeInTheDocument();
    expect(tabLink('Course')).toBeInTheDocument();
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
    expect(queryTabLink('Agent')).not.toBeInTheDocument();
    expect(tabLink('Course')).toBeInTheDocument();
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
    expect(tabLink('Agent')).toBeInTheDocument();
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
    expect(queryTabLink('Course')).not.toBeInTheDocument();
    expect(tabLink('Agent')).toBeInTheDocument();
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
    expect(queryTabLink('Agent')).not.toBeInTheDocument();
    expect(tabLink('Course')).toBeInTheDocument();
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
    expect(tabLink('Agent')).toBeInTheDocument();
    expect(mockCheckRbacPermission).toHaveBeenCalledWith({}, '/watchedgroups/#list');
  });

  it('hides the Instructor Dashboard tab when user is not platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(queryTabLink('Instructor Dashboard')).not.toBeInTheDocument();
  });

  it('shows the Admin tab and the Instructor Dashboard section to a platform admin', async () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);
    await useStaffRoute();

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(tabLink('Admin')).toHaveAttribute('href', expect.stringContaining('/instructor'));
    expect(tabLink('Instructor Dashboard')).toBeInTheDocument();
  });

  it('hides the Admin tab from a learner', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(queryTabLink('Admin')).not.toBeInTheDocument();
  });

  it('hides Gradebook tab when user is not platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(queryTabLink('Gradebook')).not.toBeInTheDocument();
  });

  it('ends the row with a single Admin tab and lists Gradebook right after Instructor Dashboard in the staff nav', async () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);
    await useStaffRoute();

    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );

    expect(rowLabels()).toEqual(['Agent', 'Course', 'Progress', 'Dates', 'Discussions', 'Admin']);
    const sections = staffSectionLabels();
    expect(sections.indexOf('Gradebook')).toBe(sections.indexOf('Instructor Dashboard') + 1);
    // One visible divider (the measurement row's copy is aria-hidden).
    expect(
      screen
        .getAllByTestId('course-tabs-staff-divider')
        .filter((divider) => !divider.closest('[aria-hidden="true"]')),
    ).toHaveLength(1);
  });

  it('shows only the learner tabs, with no staff divider, to a learner', () => {
    render(
      <CourseContentLayout params={defaultParams}>
        <div>children</div>
      </CourseContentLayout>,
    );
    expect(rowLabels()).toEqual(['Agent', 'Course', 'Progress', 'Dates', 'Discussions']);
    expect(screen.queryByTestId('course-tabs-staff-divider')).not.toBeInTheDocument();
  });

  describe('Edit in Studio tab (platform admin only)', () => {
    it('renders the Edit in Studio section for platform admin', async () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      await useStaffRoute();

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(tabLink('Edit in Studio')).toBeInTheDocument();
    });

    it('hides the Edit in Studio section for non-admin users', async () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false },
      } as any);
      await useStaffRoute();

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      expect(queryTabLink('Edit in Studio')).not.toBeInTheDocument();
    });

    it('Edit in Studio points at studioUrl/course/<courseId> in a new tab', async () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      await useStaffRoute();

      const { container } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      const authoringLink = Array.from(container.querySelectorAll('a')).find(
        (a) => a.textContent?.trim() === 'Edit in Studio',
      );
      expect(authoringLink).toBeTruthy();
      // React.use mock decodes the param, so the courseId in the href has raw colons/plus.
      expect(authoringLink?.getAttribute('href')).toBe(
        'https://studio.example.com/course/course-v1:test+course+2024',
      );
      expect(authoringLink?.getAttribute('target')).toBe('_blank');
      expect(authoringLink?.getAttribute('rel')).toContain('noopener');
    });

    it('Edit in Studio closes the staff nav, after Instructor Dashboard, Gradebook and Settings', async () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      await useStaffRoute();

      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      // No can_view_analytics here, so Analytics is absent from the nav.
      expect(staffSectionLabels()).toEqual([
        'Instructor Dashboard',
        'Gradebook',
        'Settings',
        'Edit in Studio',
      ]);
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

    expect(screen.getByText('Grade')).toBeInTheDocument();
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

    expect(screen.queryByText('Grade')).not.toBeInTheDocument();
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

  describe('active tab derived from the route', () => {
    // The tab identity used to be pushed up from each page's mount effect, which
    // landed a commit after the new page (and its EdxIframe) had already
    // rendered against the *previous* tab. Deriving it from the pathname means a
    // page never sees a tab value that disagrees with the URL it renders under.
    const DEFAULT_PATHNAME = '/course-content/course-v1:test+course+2024/course';

    const ActiveTabProbe = () => {
      const { activeTab } = React.useContext(EdxIframeContext);
      return <div data-testid="active-tab">{activeTab}</div>;
    };

    const renderAt = async (pathname: string) => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue(pathname);
      return render(
        <CourseContentLayout params={defaultParams}>
          <ActiveTabProbe />
        </CourseContentLayout>,
      );
    };

    afterEach(async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue(DEFAULT_PATHNAME);
    });

    it.each([
      ['/course-content/course-v1:test+course+2024/agent', 'agent'],
      ['/course-content/course-v1:test+course+2024/course', 'course'],
      ['/course-content/course-v1:test+course+2024/progress', 'progress'],
      ['/course-content/course-v1:test+course+2024/gradebook', 'gradebook'],
      ['/course-content/course-v1:test+course+2024/analytics', 'analytics'],
      // The discussion route is still called "forum" by the edX iframe URL builder.
      ['/course-content/course-v1:test+course+2024/discussion', 'forum'],
    ])('exposes %s as activeTab "%s" on the first render', async (pathname, expected) => {
      const { getByTestId } = await renderAt(pathname);
      expect(getByTestId('active-tab')).toHaveTextContent(expected);
    });

    it('falls back to the course tab for a route with no known tab segment', async () => {
      const { getByTestId } = await renderAt('/course-content/course-v1:test+course+2024');
      expect(getByTestId('active-tab')).toHaveTextContent('course');
    });

    it('highlights the tab matching the route', async () => {
      await renderAt('/course-content/course-v1:test+course+2024/discussion');
      // The mocked next/link drops aria-current, so assert the active styling —
      // it proves the derived value lines up with the tab bar's `key`s.
      expect(tabLink('Discussions').className).toContain('text-amber-600');
      expect(tabLink('Agent').className).not.toContain('text-amber-600');
    });
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
  describe('New chat control (course controls cluster)', () => {
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

    /** Stand-in for the `<agent-ai>` web component with its shadow-hosted iframe. */
    const mountAgent = () => {
      const postMessage = vi.fn();
      const agent = document.createElement('agent-ai');
      Object.defineProperty(agent, 'shadowRoot', {
        value: {
          querySelector: (selector: string) =>
            selector === 'iframe' ? { contentWindow: { postMessage } } : null,
        },
        configurable: true,
      });
      document.body.appendChild(agent);
      return { agent, postMessage };
    };

    afterEach(() => {
      document.querySelector('agent-ai')?.remove();
      mentorState.spinnerHidden = false;
    });

    it('is hidden until the mentor spinner has gone', async () => {
      await setTab('agent');
      mentorState.spinnerHidden = false;
      renderLayout();
      expect(screen.queryByTestId('agent-new-chat')).not.toBeInTheDocument();
      // The popover still exists for fullscreen, but has no New chat row yet.
      fireEvent.click(screen.getByLabelText('Agent display options'));
      expect(screen.queryByTestId('agent-new-chat-popover-button')).not.toBeInTheDocument();
    });

    it('renders in the navbar cluster on the agent tab once the mentor is ready', async () => {
      await setTab('agent');
      mentorState.spinnerHidden = true;
      renderLayout();

      const button = screen.getByTestId('agent-new-chat');
      expect(button).toHaveAccessibleName('New chat');
      expect(document.getElementById(NAVBAR_COURSE_CONTROLS_ID)!.contains(button)).toBe(true);
    });

    it('stays hidden on other tabs even when the mentor flag is set', async () => {
      await setTab('course');
      mentorState.spinnerHidden = true;
      renderLayout();
      expect(screen.queryByTestId('agent-new-chat')).not.toBeInTheDocument();
    });

    it('asks the embedded agent for a new chat when clicked', async () => {
      await setTab('agent');
      mentorState.spinnerHidden = true;
      const { postMessage } = mountAgent();
      renderLayout();

      fireEvent.click(screen.getByTestId('agent-new-chat'));
      expect(postMessage).toHaveBeenCalledWith({ type: 'MENTOR:NEW_CHAT' }, '*');
    });

    it('is offered in the mobile popover too, closing it on use', async () => {
      await setTab('agent');
      mentorState.spinnerHidden = true;
      const { postMessage } = mountAgent();
      renderLayout();

      fireEvent.click(screen.getByLabelText('Agent display options'));
      fireEvent.click(screen.getByTestId('agent-new-chat-popover-button'));

      expect(postMessage).toHaveBeenCalledWith({ type: 'MENTOR:NEW_CHAT' }, '*');
      expect(screen.queryByTestId('agent-new-chat-popover-button')).not.toBeInTheDocument();
    });
  });

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

    it('portals the desktop controls into the navbar slot but keeps the 3-dot in the tabs row', async () => {
      await setTab('agent');
      mockUseGetCourseBlockDetailsQuery.mockReturnValue({ data: blockDetailsWithMedia });

      renderLayout();

      const slot = document.getElementById(NAVBAR_COURSE_CONTROLS_ID)!;
      expect(slot.contains(screen.getByTestId('agent-fullscreen-toggle'))).toBe(true);
      expect(slot.contains(screen.getByTestId('course-media-dropdown-trigger'))).toBe(true);
      // The mobile 3-dot trigger renders beside the unit navigator instead.
      expect(slot.contains(screen.getByLabelText('Agent display options'))).toBe(false);
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
      const link = tabLink('Learning Info');
      expect(link).toHaveAttribute('href', expect.stringContaining('/learning-info'));
    });

    it('hides Learning Info when learning_info is empty', () => {
      courseDetailWith({ learning_info: [] });
      renderLayout();
      expect(queryTabLink('Learning Info')).not.toBeInTheDocument();
    });

    it('shows Instructors only when the course has instructors', () => {
      courseDetailWith({ instructor_info: { instructors: [{ name: 'Ada' }] } });
      renderLayout();
      const link = tabLink('Instructors');
      expect(link).toHaveAttribute('href', expect.stringContaining('/instructors'));
    });

    it('hides Instructors when the instructors list is empty', () => {
      courseDetailWith({ instructor_info: { instructors: [] } });
      renderLayout();
      expect(queryTabLink('Instructors')).not.toBeInTheDocument();
    });

    it('shows Settings for a platform admin', async () => {
      await useStaffRoute();
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      renderLayout();
      const link = tabLink('Settings');
      expect(link).toHaveAttribute('href', expect.stringContaining('/configuration'));
    });

    it('hides Settings for a non-admin user', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false },
      } as any);
      renderLayout();
      expect(queryTabLink('Settings')).not.toBeInTheDocument();
    });

    it('shows Analytics only when the user has the can_view_analytics permission', async () => {
      // Analytics is this viewer's only staff section, so it is the staff route.
      await useStaffRoute('analytics');
      mockCheckRbacPermission.mockImplementation(((_perms: any, resource: string) =>
        resource.includes('can_view_analytics')) as any);
      renderLayout();
      const link = tabLink('Analytics');
      expect(link).toHaveAttribute('href', expect.stringContaining('/analytics'));
    });

    it('hides Analytics when the user lacks can_view_analytics (even as admin)', async () => {
      await useStaffRoute();
      // Default mockCheckRbacPermission returns false for every resource.
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      renderLayout();
      expect(queryTabLink('Analytics')).not.toBeInTheDocument();
    });
  });

  describe('course-scoped staff roles', () => {
    const renderLayout = () =>
      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

    const setCourseRole = (role: string) => {
      courseUserRolesState.current = {
        courseRoles: [{ role, org: 'test-tenant', course: 'course-v1:test+course+2024' }],
        isCourseStaff: role === 'course-staff' || role === 'course-instructor',
        isCourseLimitedStaff: role === 'course-limited-staff',
        hasCourseStaffAccess: true,
        isResolved: true,
      };
    };

    beforeEach(async () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false },
      } as any);
      await useStaffRoute();
    });

    it('looks up roles for the decoded course ID', () => {
      renderLayout();
      expect(mockUseCourseUserRoles).toHaveBeenCalledWith('course-v1:test+course+2024');
    });

    it.each(['course-staff', 'course-instructor'])(
      'shows every staff tab — Edit in Studio included — for %s',
      (role) => {
        setCourseRole(role);
        renderLayout();
        expect(tabLink('Instructor Dashboard')).toBeInTheDocument();
        expect(tabLink('Settings')).toBeInTheDocument();
        expect(tabLink('Analytics')).toBeInTheDocument();
        expect(tabLink('Edit in Studio')).toBeInTheDocument();
      },
    );

    it('shows every staff tab except Edit in Studio for course-limited-staff', () => {
      setCourseRole('course-limited-staff');
      renderLayout();
      expect(tabLink('Instructor Dashboard')).toBeInTheDocument();
      expect(tabLink('Settings')).toBeInTheDocument();
      expect(tabLink('Analytics')).toBeInTheDocument();
      expect(queryTabLink('Edit in Studio')).not.toBeInTheDocument();
    });

    it('keeps the staff tabs hidden for a course role that grants no staff access', () => {
      courseUserRolesState.current = {
        courseRoles: [
          { role: 'course-beta-tester', org: 'test-tenant', course: 'course-v1:test+course+2024' },
        ],
        isCourseStaff: false,
        isCourseLimitedStaff: false,
        hasCourseStaffAccess: false,
        isResolved: true,
      };
      renderLayout();
      expect(queryTabLink('Instructor Dashboard')).not.toBeInTheDocument();
      expect(queryTabLink('Settings')).not.toBeInTheDocument();
      expect(queryTabLink('Analytics')).not.toBeInTheDocument();
      expect(queryTabLink('Edit in Studio')).not.toBeInTheDocument();
    });

    it('still shows Edit in Studio to a platform admin with no course role', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      renderLayout();
      expect(tabLink('Edit in Studio')).toBeInTheDocument();
    });

    it('does not grant Analytics to a platform admin lacking can_view_analytics', () => {
      // Course staff unlock Analytics for their own course, but the platform
      // admin path still goes through the can_view_analytics permission.
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      renderLayout();
      expect(queryTabLink('Analytics')).not.toBeInTheDocument();
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

  describe('agent-based completion popup (tenant gate)', () => {
    const completedFrame = {
      type: 'lesson.completed',
      course_id: 'course-v1:test+course+2024',
      usage_id: 'block-v1:test+course+2024+type@html+block@unit-1',
      completion: 1,
      display_name: 'First Unit',
    };

    // The dialog accepts `lesson.completed` from any origin, so jsdom's '' on a
    // dispatched MessageEvent needs no override here.
    const postCompletionFromMentor = async () => {
      const event = new MessageEvent('message', { data: completedFrame });
      await act(async () => {
        window.dispatchEvent(event);
        // The dialog holds the completion back before opening.
        await vi.advanceTimersByTimeAsync(LESSON_COMPLETED_DIALOG_DELAY_MS + 100);
      });
    };

    const renderAndCompleteLesson = async () => {
      render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      await postCompletionFromMentor();
    };

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens the dialog when enable_agent_based_completion_popup is true', async () => {
      mockTenantMetadata.current = { enable_agent_based_completion_popup: true };
      await renderAndCompleteLesson();
      expect(screen.getByText('Lesson complete')).toBeInTheDocument();
    });

    it.each([
      ['false', false],
      ['missing', undefined],
      ['truthy but not true ("true")', 'true'],
      ['truthy but not true (1)', 1],
    ])('keeps the dialog closed when the tenant flag is %s', async (_label, value) => {
      mockTenantMetadata.current =
        value === undefined ? {} : { enable_agent_based_completion_popup: value };
      await renderAndCompleteLesson();
      expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
    });

    it.each([
      ['on', true],
      ['off', false],
    ])(
      'refreshes the course outline on completion with the popup %s',
      async (_label, popupEnabled) => {
        mockTenantMetadata.current = { enable_agent_based_completion_popup: popupEnabled };
        await renderAndCompleteLesson();
        expect(mockHandleFetchCourseSyllabus).toHaveBeenCalledWith(false);
      },
    );

    it('stops opening the dialog — but keeps refreshing — when the flag is turned off', async () => {
      mockTenantMetadata.current = { enable_agent_based_completion_popup: true };
      const { rerender } = render(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );

      mockTenantMetadata.current = { enable_agent_based_completion_popup: false };
      rerender(
        <CourseContentLayout params={defaultParams}>
          <div>children</div>
        </CourseContentLayout>,
      );
      await postCompletionFromMentor();

      expect(screen.queryByText('Lesson complete')).not.toBeInTheDocument();
      expect(mockHandleFetchCourseSyllabus).toHaveBeenCalledWith(false);
    });
  });
});
