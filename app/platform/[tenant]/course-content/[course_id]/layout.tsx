'use client';

import type React from 'react';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  BookOpen,
  CalendarDays,
  ChartColumn,
  ChartNoAxesColumn,
  CirclePause,
  CirclePlay,
  ClipboardList,
  Lightbulb,
  ListTree,
  Maximize,
  MessageSquarePlus,
  MessagesSquare,
  MoreVertical,
  Presentation,
  Settings2,
  Sparkles,
  SquarePen,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { useCourseUserRoles } from '@/hooks/courses/use-course-user-roles';
import { usePathname, useSearchParams } from 'next/navigation';
import isEmpty from 'lodash/isEmpty';
import { toast } from 'sonner';
import { useEdxIframe } from '@/hooks/courses/use-edx-iframe';
import { AgentMode, EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useUnitAutoCompletion } from '@/hooks/courses/use-unit-auto-completion';
import { getUserId, getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { CourseOutlineSidebar, CourseOutlineToggle } from '@/components/course-outline-sidebar';
import { CourseOutlineDrawer } from '@/components/course-outline-drawer';
import { CourseAccessGuard } from '@/components/course-access-guard';
import { CourseLessonNavigator } from '@/components/course-lesson-navigator';
import { LessonCompletedDialog } from '@/components/lesson-completed-dialog';
import { CourseContentTabs, type CourseContentTab } from '@/components/course-content-tabs';
import { CourseAdminShell, type CourseAdminSection } from '@/components/course-admin-shell';
import {
  DASHBOARD_SECTIONS,
  isDashboardSection,
} from '@/app/platform/[tenant]/course-content/[course_id]/instructor/_components/instructor-dashboard';
import { CourseProgressSummary, CourseUnitBreadcrumb } from '@/components/course-content-header';
import {
  CourseMediaDropdown,
  CourseMediaMenuItems,
  CourseMediaPreviewDialog,
  getUnitMediaBlocks,
} from '@/components/course-media-dropdown';
import type { CourseBlockDetailsBlock } from '@/types/courses';
// @ts-ignore
import { ExamInfo } from '@iblai/iblai-js/data-layer';
import { useChatState } from '@/components/chat-button';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useLearnerMode } from '@/hooks/use-learner-mode';
import {
  useGetCourseBlockDetailsQuery,
  useGetCourseEligibilityQuery,
} from '@/services/course-metadata';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  setAdvancedDisplayMonetizationCheckoutModal,
  useTenantMetadata,
} from '@iblai/iblai-js/web-utils';
import { useDispatch, useSelector } from 'react-redux';
import { MONETIZATION_CLOSE_PAYLOAD, NAVBAR_COURSE_CONTROLS_ID } from '@/constants/global';
import { config } from '@/lib/config';
import { selectMentorAgentReady, selectMentorSpinnerHidden } from '@/features/mentor';
import { requestCourseAgentNewChat } from '@/utils/course-agent';
import {
  canViewContentModeAudience,
  isAgentContentModeOn,
  isCourseContentModeOn,
  WATCHER_RBAC_RESOURCE,
} from '@/utils/course-content-mode';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { useMediaQuery } from 'react-responsive';
import { cn } from '@/lib/utils';
import { waitForEdxUnitLoaded } from '@/hooks/courses/use-edx-iframe-loaded';

// Tab identity is derived from the route rather than pushed up from each page's
// mount effect: an effect lands one commit *after* the new page renders, so the
// EdxIframe it mounts would briefly see the previous tab and load that tab's URL.
// Keys are route segments, values the tab keys used by the tab bar and by the
// edX iframe URL builder ("discussion" is still called "forum" on the edX side).
const ROUTE_SEGMENT_TO_TAB: Record<string, string> = {
  agent: 'agent',
  course: 'course',
  progress: 'progress',
  gradebook: 'gradebook',
  dates: 'dates',
  discussion: 'forum',
  bookmarks: 'bookmarks',
  instructor: 'instructor',
  instructors: 'instructors',
  configuration: 'configuration',
  analytics: 'analytics',
  'learning-info': 'learning-info',
};
const DEFAULT_TAB = 'course';
// Tab-bar key of the single Administration tab that stands for every staff page.
const ADMIN_TAB_KEY = 'admin';

export default function CourseContentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ course_id: string }>;
}) {
  const tenant = useTenantParam();
  const {
    data: departmentMemberCheck,
    isSuccess: departmentMemberCheckSuccess,
    isError: departmentMemberCheckError,
  } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isAdmin = departmentMemberCheck?.is_platform_admin === true;
  const isAdminResolved = departmentMemberCheckSuccess || departmentMemberCheckError;
  const rbacPermissions = useSelector(selectRbacPermissions);
  const isWatcher = checkRbacPermission(rbacPermissions, WATCHER_RBAC_RESOURCE);
  const canViewAnalytics = checkRbacPermission(
    rbacPermissions,
    `/platforms/${tenant}/#can_view_analytics`,
  );
  // An admin previewing the learner view (navbar User/Admin switch) gets the
  // learner's tabs and content modes; access checks keep the real role so
  // flipping the switch inside a course never locks them out of it.
  const { isInstructorMode } = useLearnerMode();
  const contentModeViewer = {
    isAdmin: isAdmin && isInstructorMode,
    isWatcher: isWatcher && isInstructorMode,
  };
  const resolvedParams = use(params);
  const courseId = decodeURIComponent(resolvedParams.course_id);
  // Course-scoped staff roles open the staff-only tabs to people who aren't
  // platform admins: full staff (course-staff / course-instructor) get every
  // tab, limited staff get all of them except Authoring — they run the course
  // but can't edit it in Studio.
  const {
    isCourseStaff,
    hasCourseStaffAccess,
    isResolved: courseRolesResolved,
  } = useCourseUserRoles(courseId);
  const canViewStaffTabs = isInstructorMode && (isAdmin || hasCourseStaffAccess);
  const {
    data: enrollStatus,
    isSuccess: enrollStatusSuccess,
    isError: enrollStatusError,
  } = useGetCourseEligibilityQuery({ courseKey: courseId });
  const canSkipEnrollment =
    isAdmin || isWatcher || hasCourseStaffAccess || enrollStatus?.is_admin === true;
  // A failed status lookup lets the viewer through rather than locking out
  // enrolled learners on a transient error — edX still enforces enrollment.
  const isEnrolled = canSkipEnrollment || enrollStatus?.is_enrolled !== false;
  const isEnrollmentResolved = Boolean(
    (enrollStatusSuccess || enrollStatusError) && courseRolesResolved && isAdminResolved,
  );
  const canViewAuthoringTab = isInstructorMode && (isAdmin || isCourseStaff);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = pathname?.split('/').filter(Boolean).pop();
  const activeTab = ROUTE_SEGMENT_TO_TAB[currentTab ?? ''] ?? DEFAULT_TAB;
  const dispatch = useDispatch();
  const mentorSpinnerHidden = useSelector(selectMentorSpinnerHidden);
  const mentorAgentReady = useSelector(selectMentorAgentReady);
  const { setCourseMentor } = useChatState();
  const { metadata } = useTenantMetadata({ org: tenant });
  const {
    handleFetchCourseInfo,
    handleFetchCourseSyllabus,
    handleOpenLesson,
    handleFetchCourseProgress,
    handleFetchCourseCompletion,
    handleCheckCourseMonetizationAccess,
    course,
    courseInfoLoadingState,
    courseOutline,
    courseOutlineLoading,
    courseCompletion,
    courseGradingPolicyActive,
  } = useCourseDetail(courseId);

  const { getUnitToIframe, getParentsInfosFromSublessonId } = useEdxIframe();

  const checkCourseMonetizationAccess = async () => {
    await handleCheckCourseMonetizationAccess((result) => {
      if (!result.hasAccess) {
        dispatch(
          setAdvancedDisplayMonetizationCheckoutModal({
            showModal: true,
            paywallClosable: true,
            onClosePayload: MONETIZATION_CLOSE_PAYLOAD.redirect_402,
          }),
        );
      }
    });
  };

  useEffect(() => {
    handleFetchCourseInfo();
    handleFetchCourseProgress();
    handleFetchCourseCompletion(getUserId());
  }, [courseId]);

  // Unenrolled viewers are sent to the about page, which has its own purchase
  // CTA; opening the paywall here first would leave it over that page and its
  // close action would redirect to the 402 page.
  const enrollmentConfirmed = isEnrollmentResolved && isEnrolled;
  useEffect(() => {
    if (enrollmentConfirmed) checkCourseMonetizationAccess();
  }, [courseId, enrollmentConfirmed]);

  useEffect(() => {
    if (!isEmpty(course)) {
      if (!course?.mentor_hidden) {
        setCourseMentor(course.mentor_uuid || null);
      }
      handleFetchCourseSyllabus();
    }
  }, [course]);

  const [expandedModule, setExpandedModule] = useState('');
  const [currentLesson, setCurrentLesson] = useState('');
  const [currentChapter, setCurrentChapter] = useState('');

  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);
  const [courseOutlineDrawerOpen, setCourseOutlineDrawerOpen] = useState(false);
  const [currentlyInExamSubsection, setCurrentlyInExamSubsection] = useState(false);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const [currentParentIds, setCurrentParentIds] = useState<
    { module: Record<string, any>; lesson: Record<string, any> } | undefined
  >(undefined);
  const [currentCourseInfo, setCurrentCourseInfo] = useState<Record<string, any> | undefined>(
    undefined,
  );
  const [currentUnitID, setCurrentUnitID] = useState<string | null>(null);
  const [refresher, setRefresher] = useState<Date | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>('learning');
  const [agentFullscreen, setAgentFullscreen] = useState(false);
  const [agentAutoplayOn, setAgentAutoplayOn] = useState(false);
  const setAgentAutoplay = (enabled: boolean) => {
    setAgentAutoplayOn(enabled);
    toast.success(enabled ? 'Autoplay turned on' : 'Autoplay turned off');
    window.dispatchEvent(new CustomEvent('mentor:autoplay-changed', { detail: { enabled } }));
  };

  // enable_course_voice_autoplay tenant metadata flag and agent_autoplay flag from the course settings on studio to allow this feature.
  // Held back until the agent iframe reports ready — before that it would drop the autoplay message.
  const autoplayToggleVisible =
    course?.agent_autoplay === true &&
    metadata?.enable_course_voice_autoplay === true &&
    mentorAgentReady;

  // Tenant opt-in for the agent's "lesson complete" popup. Off (the default),
  // the mentor's `lesson.completed` relay still refreshes the course outline —
  // only the dialog is suppressed. Read live off the metadata, so flipping the
  // setting takes effect without a reload.
  const completionPopupEnabled = metadata?.enable_agent_based_completion_popup === true;

  // When the agent owns unit completion, the edX unit must stop marking itself
  // complete on view — the agent decides instead. The EdxIframe relays this to
  // the MFE; the agent chat forwards the edX identifiers the agent needs to
  // complete units itself.
  const { unitAutoCompletionDisabled } = useUnitAutoCompletion({ course, tenant });

  // Needed on both agent (mentor xblock detection + media preview) and course
  // (media scroll-to) tabs.
  const blockDetailsTab = currentTab === 'agent' || currentTab === 'course';
  const { data: courseBlockDetails } = useGetCourseBlockDetailsQuery(
    { blockId: currentUnitID || '', username: getUserName() },
    { skip: !currentUnitID || !blockDetailsTab },
  );
  const hasMentorXblock = Object.values(courseBlockDetails?.blocks ?? {}).some(
    (block) => block.type === 'ibl_mentor_xblock',
  );
  // A unit carrying the mentor xblock is an assessment: the agent tab opens it
  // straight in assessment mode, and every other unit runs in learning mode.
  const isAssessmentUnit = currentTab === 'agent' && hasMentorXblock;
  const fullscreenToggleVisible = currentTab === 'agent';
  // Only once the mentor has finished loading — before that there is no chat
  // to reset, and the iframe isn't listening yet.
  const newChatVisible = currentTab === 'agent' && mentorSpinnerHidden;
  const unitMediaVisible =
    blockDetailsTab && getUnitMediaBlocks(courseBlockDetails?.blocks).length > 0;

  // Mobile collapses every course control into a single 3-dot popover.
  // Controlled so actions inside (fullscreen, media) can close it; the media
  // preview dialog lives OUTSIDE the popover, which unmounts its children as
  // soon as focus moves into the (body-portaled) dialog.
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [mobileMediaPreviewBlock, setMobileMediaPreviewBlock] =
    useState<CourseBlockDetailsBlock | null>(null);

  // Navbar slot (rendered empty by the NavBar on every page) that the course
  // controls below portal into, so they sit left of the navbar search bar
  // while their state stays in this layout. Resolved in an effect: the NavBar
  // lives in an ancestor layout, so the slot is in the DOM by the time
  // effects run.
  const [navbarControlsSlot, setNavbarControlsSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setNavbarControlsSlot(document.getElementById(NAVBAR_COURSE_CONTROLS_ID));
  }, []);

  useEffect(() => {
    const unitMode: AgentMode = isAssessmentUnit ? 'assessment' : 'learning';
    if (agentMode === unitMode) return;
    setAgentMode(unitMode);
    if (unitMode === 'assessment') toast.success('Switched to assessment mode');
  }, [isAssessmentUnit]);
  // Leaving the agent tab should always drop out of fullscreen.
  useEffect(() => {
    if (!fullscreenToggleVisible && agentFullscreen) {
      setAgentFullscreen(false);
    }
  }, [fullscreenToggleVisible]);
  useEffect(() => {
    if (!isEmpty(courseOutline)) {
      const currentCourse = getUnitToIframe(courseOutline);
      setCurrentCourseInfo(currentCourse);
      const unitID = currentCourse?.id;
      setCurrentUnitID(unitID);
      const parentsIDs = getParentsInfosFromSublessonId(courseOutline?.children || [], unitID);
      setCurrentParentIds(parentsIDs);
      setCurrentLesson(unitID || '');
      setExpandedLessons([parentsIDs?.lesson.id || '']);
      setCurrentChapter(parentsIDs?.lesson.id || '');
      //setCurrentModule(parentsIDs?.moduleId || "");
      setExpandedModule(parentsIDs?.module.id || '');
    }
  }, [searchParams, courseOutline]);

  // Defers the toast + mentor:unit-switched dispatch until the hidden course
  // iframe reports *this* unit loaded, so the mentor never reacts to a unit
  // that isn't rendered yet and a load of the unit being left can't stand in
  // for it. The fallback timer covers subsections that never mount the iframe
  // (e.g. exam gates). Returns a cleanup that cancels the notification.
  const notifyMentorOnceUnitLoaded = (message: string, unitId: string) =>
    waitForEdxUnitLoaded(unitId, () => {
      toast.success(message);
      window.dispatchEvent(new CustomEvent('mentor:unit-switched', { detail: { message } }));
    });

  const previousUnitIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const unitId = currentCourseInfo?.id;
    if (currentTab !== 'agent' || !unitId) {
      previousUnitIdRef.current = unitId;
      return;
    }
    const previousUnitId = previousUnitIdRef.current;
    previousUnitIdRef.current = unitId;
    if (previousUnitId && previousUnitId !== unitId) {
      return notifyMentorOnceUnitLoaded(
        `Switched to "${currentCourseInfo?.display_name ?? 'new unit'}"`,
        unitId,
      );
    }
  }, [currentCourseInfo?.id, currentTab]);

  const unitLoadedScheduledRef = useRef(false);
  useEffect(() => {
    const unitId = currentCourseInfo?.id;
    const unitName = currentCourseInfo?.display_name;
    if (
      currentTab !== 'agent' ||
      !unitId ||
      !unitName ||
      !mentorSpinnerHidden ||
      unitLoadedScheduledRef.current
    ) {
      return;
    }
    unitLoadedScheduledRef.current = true;
    return notifyMentorOnceUnitLoaded(`Loaded "${unitName}"`, unitId);
  }, [currentCourseInfo?.id, currentCourseInfo?.display_name, currentTab, mentorSpinnerHidden]);

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? '' : moduleId);
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId],
    );
  };

  const selectLesson = (lessonId: string) => {
    setCurrentLesson(lessonId);
    handleOpenLesson(lessonId, false, currentTab === 'agent' ? 'agent' : 'course');
  };

  const agentTabVisible =
    !course ||
    (isAgentContentModeOn(course) &&
      canViewContentModeAudience(course.agent_content_mode_audience, contentModeViewer));
  const courseTabVisible =
    !course ||
    (isCourseContentModeOn(course) &&
      canViewContentModeAudience(course.course_content_mode_audience, contentModeViewer));

  const courseBasePath = `/platform/${tenant}/course-content/${resolvedParams.course_id}`;
  // Ordered tab list; whatever doesn't fit collapses into a grouped "More"
  // menu. Staff tabs (`teach`) come last, behind a divider in the row.
  const courseTabs = useMemo<CourseContentTab[]>(() => {
    const tabs: CourseContentTab[] = [];
    if (agentTabVisible) {
      tabs.push({
        key: 'agent',
        label: 'Agent',
        href: `${courseBasePath}/agent`,
        icon: Sparkles,
        group: 'learn',
      });
    }
    if (courseTabVisible) {
      tabs.push({
        key: 'course',
        label: 'Course',
        href: `${courseBasePath}/course${currentCourseInfo?.id ? `?unit_id=${currentCourseInfo.id}` : ''}`,
        icon: BookOpen,
        group: 'learn',
      });
    }
    tabs.push(
      {
        key: 'progress',
        label: 'Progress',
        href: `${courseBasePath}/progress`,
        icon: ChartNoAxesColumn,
        group: 'learn',
      },
      {
        key: 'dates',
        label: 'Dates',
        href: `${courseBasePath}/dates`,
        icon: CalendarDays,
        group: 'learn',
      },
      {
        key: 'forum',
        label: 'Discussions',
        href: `${courseBasePath}/discussion`,
        icon: MessagesSquare,
        group: 'learn',
      },
    );
    if (course?.learning_info && course.learning_info.length > 0) {
      tabs.push({
        key: 'learning-info',
        label: 'Learning Info',
        href: `${courseBasePath}/learning-info`,
        icon: Lightbulb,
        group: 'about',
      });
    }
    if (course?.instructor_info?.instructors && course.instructor_info.instructors.length > 0) {
      tabs.push({
        key: 'instructors',
        label: 'Instructors',
        href: `${courseBasePath}/instructors`,
        icon: Users,
        group: 'about',
      });
    }
    // The edX instructor dashboard and gradebook MFE are staff-only; learners
    // would just get an access error.
    if (canViewStaffTabs) {
      tabs.push(
        {
          key: 'instructor',
          label: 'Instructor',
          href: `${courseBasePath}/instructor`,
          icon: Presentation,
          group: 'teach',
        },
        {
          key: 'gradebook',
          label: 'Gradebook',
          href: `${courseBasePath}/gradebook`,
          icon: ClipboardList,
          group: 'teach',
        },
      );
    }
    if (isInstructorMode && (canViewAnalytics || hasCourseStaffAccess)) {
      tabs.push({
        key: 'analytics',
        label: 'Analytics',
        href: `${courseBasePath}/analytics`,
        icon: ChartColumn,
        group: 'teach',
      });
    }
    if (canViewStaffTabs) {
      tabs.push({
        key: 'configuration',
        label: 'Settings',
        href: `${courseBasePath}/configuration`,
        icon: Settings2,
        group: 'teach',
      });
    }
    if (canViewAuthoringTab) {
      tabs.push({
        key: 'authoring',
        label: 'Authoring',
        href: `${config.urls.studioUrl()}/course/${courseId}`,
        icon: SquarePen,
        group: 'teach',
        external: true,
      });
    }
    return tabs;
  }, [
    courseBasePath,
    courseId,
    agentTabVisible,
    courseTabVisible,
    currentCourseInfo?.id,
    canViewStaffTabs,
    canViewAuthoringTab,
    hasCourseStaffAccess,
    isInstructorMode,
    course?.learning_info,
    course?.instructor_info?.instructors,
    canViewAnalytics,
  ]);

  // Staff pages share one "Administration" tab that opens the admin area; its nav lists
  // every staff page flat — the instructor page's sections included — so the
  // whole thing reads as one place rather than tabs inside a tab.
  const staffTabs = useMemo(() => courseTabs.filter((tab) => tab.group === 'teach'), [courseTabs]);
  const adminSections = useMemo<CourseAdminSection[]>(() => {
    const has = (key: string) => staffTabs.some((tab) => tab.key === key);
    const instructorHref = (section: string) => `${courseBasePath}/instructor?section=${section}`;
    const sections: CourseAdminSection[] = [];
    if (has('instructor')) {
      sections.push({
        key: 'instructor:overview',
        label: 'Overview',
        href: instructorHref('overview'),
        icon: Presentation,
        scrollsItself: true,
      });
    }
    if (has('gradebook')) {
      sections.push({
        key: 'gradebook',
        label: 'Grades',
        href: `${courseBasePath}/gradebook`,
        icon: ClipboardList,
        group: 'learners',
        scrollsItself: true,
      });
    }
    if (has('instructor')) {
      const icons = {
        membership: Users,
        cohorts: Users,
        extensions: CalendarDays,
        attempts: UserCog,
        reports: ChartNoAxesColumn,
      } as const;
      DASHBOARD_SECTIONS.filter((section) => section.key !== 'overview').forEach((section) => {
        sections.push({
          key: `instructor:${section.key}`,
          label: section.label,
          href: instructorHref(section.key),
          icon: icons[section.key as keyof typeof icons],
          group: section.key === 'reports' ? 'insights' : 'learners',
          scrollsItself: true,
        });
      });
    }
    if (has('analytics')) {
      sections.push({
        key: 'analytics',
        label: 'Analytics',
        href: `${courseBasePath}/analytics`,
        icon: ChartColumn,
        group: 'insights',
      });
    }
    if (has('configuration')) {
      sections.push({
        key: 'configuration',
        label: 'Settings',
        href: `${courseBasePath}/configuration`,
        icon: Settings2,
        group: 'course',
      });
    }
    const authoring = staffTabs.find((tab) => tab.key === 'authoring');
    if (authoring) {
      sections.push({
        key: 'authoring',
        label: 'Authoring',
        href: authoring.href,
        icon: SquarePen,
        group: 'course',
        external: true,
      });
    }
    return sections;
  }, [staffTabs, courseBasePath, courseId]);
  const isAdminRoute = staffTabs.some((tab) => tab.key === activeTab);
  const requestedSection = searchParams?.get('section');
  const adminActiveKey =
    activeTab === 'instructor'
      ? `instructor:${isDashboardSection(requestedSection) ? requestedSection : 'overview'}`
      : activeTab;
  const tabBarTabs = useMemo<CourseContentTab[]>(() => {
    const learnerTabs = courseTabs.filter((tab) => tab.group !== 'teach');
    if (adminSections.length === 0) return learnerTabs;
    return [
      ...learnerTabs,
      {
        key: ADMIN_TAB_KEY,
        label: 'Administration',
        href: adminSections[0].href,
        icon: Wrench,
        group: 'teach',
      },
    ];
  }, [courseTabs, adminSections]);
  const tabBarActiveTab = isAdminRoute ? ADMIN_TAB_KEY : activeTab;

  const edxIframeValue = useMemo(
    () => ({
      iframeUrl,
      setIframeUrl,
      courseOutline,
      activeTab,
      courseID: courseId,
      currentlyInExamSubsection,
      setCurrentlyInExamSubsection,
      examInfo,
      setExamInfo,
      refresher,
      setRefresher,
      agentMode,
      setAgentMode,
      agentFullscreen,
      setAgentFullscreen,
      disableUnitAutoCompletion: unitAutoCompletionDisabled,
    }),
    [
      iframeUrl,
      courseOutline,
      activeTab,
      courseId,
      currentlyInExamSubsection,
      examInfo,
      refresher,
      agentMode,
      agentFullscreen,
      unitAutoCompletionDisabled,
    ],
  );

  return (
    <CourseAccessGuard
      course={course}
      courseInfoLoadingState={courseInfoLoadingState}
      currentTab={currentTab}
      isAdmin={isAdmin}
      isWatcher={isWatcher}
      isAdminResolved={isAdminResolved}
      isEnrolled={isEnrolled}
      isEnrollmentResolved={isEnrollmentResolved}
    >
      <CourseOutlineContext.Provider
        value={{
          courseOutline,
          courseOutlineLoading,
          expandedModule,
          expandedLessons,
          selectLesson,
          toggleModule,
          toggleLesson,
          currentChapter,
          currentLesson,
          course,
          courseOutlineDrawerOpen,
          setCourseOutlineDrawerOpen,
          currentUnitID,
          refetchCourseOutline: handleFetchCourseSyllabus,
          completionPercentage: courseCompletion?.completion_percentage,
        }}
      >
        <CourseOutlineDrawer />
        <EdxIframeContext.Provider value={edxIframeValue}>
          {/* Listens for the mentor's `lesson.completed` relay: always refreshes
              the outline, and — on tenants with the popup flag on — offers to
              move to the next/previous unit. */}
          <LessonCompletedDialog popupEnabled={completionPopupEnabled} />
          <main className="flex flex-1 overflow-hidden">
            {/* Course sidebar (collapsible on tablet / small screens) */}
            <CourseOutlineSidebar />

            {/* Main content area */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {/* Course controls (new chat, autoplay, media dropdown,
                  fullscreen) render in the top navbar — left of the
                  search bar — via the NavBar's portal slot; their state
                  stays in this layout. */}
              {navbarControlsSlot &&
                createPortal(
                  <div className="flex items-center gap-3">
                    {newChatVisible && (
                      <button
                        type="button"
                        onClick={requestCourseAgentNewChat}
                        aria-label="New chat"
                        title="New chat"
                        data-testid="agent-new-chat"
                        className="hidden rounded p-1 text-gray-500 transition-colors hover:text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none md:inline-flex"
                      >
                        <MessageSquarePlus className="h-5 w-5" />
                      </button>
                    )}
                    {autoplayToggleVisible && (
                      <button
                        type="button"
                        onClick={() => setAgentAutoplay(!agentAutoplayOn)}
                        role="switch"
                        aria-checked={agentAutoplayOn}
                        aria-label={
                          agentAutoplayOn ? 'Disable agent autoplay' : 'Enable agent autoplay'
                        }
                        title={agentAutoplayOn ? 'Autoplay on' : 'Autoplay off'}
                        data-testid="agent-autoplay-toggle"
                        className={`hidden rounded p-1 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none md:inline-flex ${
                          agentAutoplayOn
                            ? 'text-amber-600 hover:text-amber-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {agentAutoplayOn ? (
                          <CirclePause className="h-5 w-5" />
                        ) : (
                          <CirclePlay className="h-5 w-5" />
                        )}
                      </button>
                    )}
                    {unitMediaVisible && (
                      <div className="hidden items-center md:flex">
                        <CourseMediaDropdown
                          blocks={courseBlockDetails?.blocks}
                          currentTab={currentTab}
                        />
                      </div>
                    )}
                    {fullscreenToggleVisible && (
                      <button
                        type="button"
                        onClick={() => setAgentFullscreen(true)}
                        aria-label="Enter fullscreen"
                        title="Fullscreen"
                        data-testid="agent-fullscreen-toggle"
                        className="hidden rounded p-1 text-gray-500 transition-colors hover:text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none md:inline-flex"
                      >
                        <Maximize className="h-5 w-5" />
                      </button>
                    )}
                  </div>,
                  navbarControlsSlot,
                )}
              {/* Preview for media picked from the mobile controls popover;
                  kept out of the popover so closing it doesn't unmount the
                  dialog. */}
              <CourseMediaPreviewDialog
                block={mobileMediaPreviewBlock}
                onClose={() => setMobileMediaPreviewBlock(null)}
              />
              <header
                className="shrink-0 border-b border-gray-200 bg-white"
                data-testid="course-content-header"
              >
                {/* Course identity + where you are in it, with the unit
                    navigation at the far end. A container query root: what
                    fits depends on this column's width (the outline sidebar
                    eats a third of a tablet), not the viewport's. */}
                <div className="@container flex items-center gap-3 px-3 pt-3 pb-2 md:px-4">
                  {/* md+ collapses/expands the inline sidebar from the same spot */}
                  <CourseOutlineToggle />
                  <button
                    type="button"
                    onClick={() => setCourseOutlineDrawerOpen(true)}
                    className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none md:hidden"
                    aria-label="Open course outline"
                  >
                    <ListTree className="h-5 w-5" />
                  </button>
                  {/* The course name already heads the navbar; this line is
                      where you are inside it, falling back to the name only
                      until a unit resolves (or when the course has none). */}
                  <div className="min-w-0 flex-1">
                    {currentCourseInfo?.id ? (
                      <CourseUnitBreadcrumb
                        moduleName={currentParentIds?.module?.display_name}
                        lessonName={currentParentIds?.lesson?.display_name}
                        unitName={currentCourseInfo?.display_name}
                      />
                    ) : (
                      <h1 className="truncate text-sm font-semibold text-gray-900">
                        {course?.display_name}
                      </h1>
                    )}
                  </div>
                  <CourseProgressSummary
                    completionPercentage={courseCompletion?.completion_percentage}
                    gradingPercentage={courseCompletion?.grading_percentage}
                    gradeVisible={!!courseGradingPolicyActive}
                    className="hidden @2xl:flex"
                  />
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Mobile-only (trigger is md:hidden) 3-dot menu bundling
                        the course controls, sitting left of the prev/next unit
                        buttons; desktop shows them inline in the navbar via
                        the portal above. */}
                    {(autoplayToggleVisible ||
                      fullscreenToggleVisible ||
                      newChatVisible ||
                      unitMediaVisible) && (
                      <Popover open={mobileControlsOpen} onOpenChange={setMobileControlsOpen}>
                        <PopoverTrigger
                          className="rounded p-1 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none md:hidden"
                          aria-label="Agent display options"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-2">
                          <div className="flex flex-col gap-3">
                            {newChatVisible && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileControlsOpen(false);
                                  requestCourseAgentNewChat();
                                }}
                                data-testid="agent-new-chat-popover-button"
                                className="flex items-center gap-2 rounded p-1 text-left text-xs text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <MessageSquarePlus className="h-4 w-4 text-gray-500" />
                                <span>New chat</span>
                              </button>
                            )}
                            {autoplayToggleVisible && (
                              <div
                                className="flex items-center justify-between gap-3 text-xs text-gray-600"
                                role="group"
                                aria-label="Agent autoplay"
                              >
                                <span className="flex items-center gap-2">
                                  {agentAutoplayOn ? (
                                    <CirclePause className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <CirclePlay className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span
                                    className={agentAutoplayOn ? 'font-medium text-amber-600' : ''}
                                  >
                                    Autoplay
                                  </span>
                                </span>
                                <Switch
                                  checked={agentAutoplayOn}
                                  onCheckedChange={(checked) => setAgentAutoplay(checked)}
                                  aria-label="Toggle agent autoplay"
                                  data-testid="agent-autoplay-popover-switch"
                                  className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-300"
                                />
                              </div>
                            )}
                            {unitMediaVisible && (
                              <CourseMediaMenuItems
                                blocks={courseBlockDetails?.blocks}
                                currentTab={currentTab}
                                onAction={(previewBlock) => {
                                  setMobileControlsOpen(false);
                                  setMobileMediaPreviewBlock(previewBlock);
                                }}
                              />
                            )}
                            {fullscreenToggleVisible && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileControlsOpen(false);
                                  setAgentFullscreen(true);
                                }}
                                data-testid="agent-fullscreen-popover-button"
                                className="flex items-center gap-2 rounded p-1 text-left text-xs text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <Maximize className="h-4 w-4 text-gray-500" />
                                <span>Fullscreen</span>
                              </button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <CourseLessonNavigator />
                  </div>
                </div>
                <div className="@container px-3 pb-2 md:px-4">
                  <CourseContentTabs tabs={tabBarTabs} activeTab={tabBarActiveTab} />
                </div>
              </header>

              {/* Content area: a flex column of definite height, so the
                  iframe / agent pages can fill it (`flex-1`) rather than
                  derive their height from the viewport. */}
              <div
                // Mobile scrolls this container itself. On desktop the
                // iframe tabs manage their own scroll, the admin shell scrolls
                // the pages it frames, and the plain pages outside it need the
                // container to scroll.
                className={cn(
                  'flex min-h-0 flex-1 flex-col',
                  (isMobile ||
                    (!isAdminRoute &&
                      ['analytics', 'configuration', 'instructors'].includes(currentTab ?? ''))) &&
                    'overflow-y-auto',
                )}
                style={{ scrollbarWidth: 'none' }}
              >
                {isAdminRoute ? (
                  <CourseAdminShell sections={adminSections} activeKey={adminActiveKey}>
                    {children}
                  </CourseAdminShell>
                ) : (
                  children
                )}
              </div>
            </div>
          </main>
        </EdxIframeContext.Provider>

        <style jsx global>{`
          ::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </CourseOutlineContext.Provider>
    </CourseAccessGuard>
  );
}
