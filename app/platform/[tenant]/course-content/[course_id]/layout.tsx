'use client';

import type React from 'react';
import { use, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronRight, CirclePause, CirclePlay, ListTree, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { usePathname, useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { toast } from 'sonner';
import { useEdxIframe } from '@/hooks/courses/use-edx-iframe';
import { AgentMode, EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { getUserId, getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { CourseOutlineSidebar } from '@/components/course-outline-sidebar';
import { CourseOutlineDrawer } from '@/components/course-outline-drawer';
import { CourseAccessGuard } from '@/components/course-access-guard';
import { CourseLessonNavigator } from '@/components/course-lesson-navigator';
// @ts-ignore
import { ExamInfo } from '@iblai/iblai-js/data-layer';
import { useChatState } from '@/components/chat-button';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useGetCourseBlockDetailsQuery } from '@/services/course-metadata';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  setAdvancedDisplayMonetizationCheckoutModal,
  useTenantMetadata,
} from '@iblai/iblai-js/web-utils';
import { useDispatch, useSelector } from 'react-redux';
import { MONETIZATION_CLOSE_PAYLOAD } from '@/constants/global';
import { config } from '@/lib/config';
import { selectMentorSpinnerHidden } from '@/features/mentor';
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
  const contentModeViewer = { isAdmin, isWatcher };
  const resolvedParams = use(params);
  const courseId = decodeURIComponent(resolvedParams.course_id);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = pathname?.split('/').filter(Boolean).pop();
  const dispatch = useDispatch();
  const mentorSpinnerHidden = useSelector(selectMentorSpinnerHidden);
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
    checkCourseMonetizationAccess();
    handleFetchCourseInfo();
    handleFetchCourseProgress();
    handleFetchCourseCompletion(getUserId());
  }, [courseId]);

  useEffect(() => {
    if (!_.isEmpty(course)) {
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
  const [activeTab, setActiveTab] = useState('course');
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
  const [agentAutoplayOn, setAgentAutoplayOn] = useState(false);
  const setAgentAutoplay = (enabled: boolean) => {
    setAgentAutoplayOn(enabled);
    toast.success(enabled ? 'Autoplay turned on' : 'Autoplay turned off');
    window.dispatchEvent(new CustomEvent('mentor:autoplay-changed', { detail: { enabled } }));
  };

  // enable_course_voice_autoplay tenant metadata flag and agent_autoplay flag from the course settings on studio to allow this feature
  const autoplayToggleVisible =
    course?.agent_autoplay === true && metadata?.enable_course_voice_autoplay === true;

  const { data: courseBlockDetails } = useGetCourseBlockDetailsQuery(
    { blockId: currentUnitID || '', username: getUserName() },
    { skip: !currentUnitID || currentTab !== 'agent' },
  );
  const hasMentorXblock = Object.values(courseBlockDetails?.blocks ?? {}).some(
    (block) => block.type === 'ibl_mentor_xblock',
  );
  const assessmentToggleVisible = currentTab === 'agent' && hasMentorXblock;

  useEffect(() => {
    if (!assessmentToggleVisible && agentMode !== 'learning') {
      setAgentMode('learning');
    }
  }, [assessmentToggleVisible]);
  useEffect(() => {
    if (!_.isEmpty(courseOutline)) {
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

  const previousUnitIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const unitId = currentCourseInfo?.id;
    if (currentTab !== 'agent' || !unitId) {
      previousUnitIdRef.current = unitId;
      return;
    }
    if (previousUnitIdRef.current && previousUnitIdRef.current !== unitId) {
      const message = `Switched to "${currentCourseInfo?.display_name ?? 'new unit'}"`;
      toast.success(message);
      window.dispatchEvent(new CustomEvent('mentor:unit-switched', { detail: { message } }));
    }
    previousUnitIdRef.current = unitId;
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
    setTimeout(() => {
      const message = `Loaded "${unitName}"`;
      toast.success(message);
      window.dispatchEvent(new CustomEvent('mentor:unit-switched', { detail: { message } }));
    }, 4000);
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

  const edxIframeValue = useMemo(
    () => ({
      iframeUrl,
      setIframeUrl,
      courseOutline,
      setActiveTab,
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
        }}
      >
        <CourseOutlineDrawer />
        <EdxIframeContext.Provider value={edxIframeValue}>
          <main className="flex flex-1 overflow-hidden">
            {/* Course sidebar (collapsible on tablet / small screens) */}
            <CourseOutlineSidebar />

            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Course navigation tabs */}
              <div className="border-b border-gray-200">
                {/* Skills innercourseware tabs */}
                <div className="flex w-full items-center justify-between">
                  <div className="flex min-w-0 overflow-x-auto">
                    {agentTabVisible && (
                      <Link
                        href={`/platform/${tenant}/course-content/${resolvedParams.course_id}/agent`}
                        aria-current={activeTab === 'agent' ? 'page' : undefined}
                        className={`border-b-2 px-4 py-3 text-sm font-medium ${
                          activeTab === 'agent'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Agent
                      </Link>
                    )}
                    {courseTabVisible && (
                      <Link
                        href={`/platform/${tenant}/course-content/${resolvedParams.course_id}/course${
                          currentCourseInfo?.id ? `?unit_id=${currentCourseInfo?.id}` : ''
                        }`}
                        aria-current={activeTab === 'course' ? 'page' : undefined}
                        className={`border-b-2 px-4 py-3 text-sm font-medium ${
                          activeTab === 'course'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Course
                      </Link>
                    )}
                    <Link
                      href={`/platform/${tenant}/course-content/${resolvedParams.course_id}/progress`}
                      aria-current={activeTab === 'progress' ? 'page' : undefined}
                      className={`border-b-2 px-4 py-3 text-sm font-medium ${
                        activeTab === 'progress'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Progress
                    </Link>
                    <Link
                      href={`/platform/${tenant}/course-content/${resolvedParams.course_id}/dates`}
                      aria-current={activeTab === 'dates' ? 'page' : undefined}
                      className={`border-b-2 px-4 py-3 text-sm font-medium ${
                        activeTab === 'dates'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Dates
                    </Link>
                    <Link
                      href={`/platform/${tenant}/course-content/${resolvedParams.course_id}/discussion`}
                      aria-current={activeTab === 'forum' ? 'page' : undefined}
                      className={`border-b-2 px-4 py-3 text-sm font-medium ${
                        activeTab === 'forum'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Discussion
                    </Link>
                    {departmentMemberCheck?.is_platform_admin && (
                      <Link
                        href={`/platform/${tenant}/course-content/${resolvedParams.course_id}/instructor`}
                        aria-current={activeTab === 'instructor' ? 'page' : undefined}
                        className={`border-b-2 px-4 py-3 text-sm font-medium ${
                          activeTab === 'instructor'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Instructor
                      </Link>
                    )}
                    {departmentMemberCheck?.is_platform_admin && (
                      <a
                        href={`${config.urls.studioUrl()}/course/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        Authoring
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pr-4">
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
                    {assessmentToggleVisible && (
                      <div
                        className="hidden items-center gap-2 text-xs text-gray-600 md:flex"
                        role="group"
                        aria-label="Agent display mode"
                      >
                        <span
                          className={agentMode === 'learning' ? 'font-medium text-amber-600' : ''}
                        >
                          Learn
                        </span>
                        <Switch
                          checked={agentMode === 'assessment'}
                          onCheckedChange={(checked) =>
                            setAgentMode(checked ? 'assessment' : 'learning')
                          }
                          aria-label="Toggle assessment mode"
                          className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-300"
                        />
                        <span
                          className={agentMode === 'assessment' ? 'font-medium text-amber-600' : ''}
                        >
                          Assess
                        </span>
                      </div>
                    )}
                    {(assessmentToggleVisible || autoplayToggleVisible) && (
                      <Popover>
                        <PopoverTrigger
                          className="rounded p-1 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none md:hidden"
                          aria-label="Agent display options"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto p-3">
                          <div className="flex flex-col gap-3">
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
                            {assessmentToggleVisible && (
                              <div
                                className="flex items-center gap-2 text-xs text-gray-600"
                                role="group"
                                aria-label="Agent display mode"
                              >
                                <span
                                  className={
                                    agentMode === 'learning' ? 'font-medium text-amber-600' : ''
                                  }
                                >
                                  Learn
                                </span>
                                <Switch
                                  checked={agentMode === 'assessment'}
                                  onCheckedChange={(checked) =>
                                    setAgentMode(checked ? 'assessment' : 'learning')
                                  }
                                  aria-label="Toggle assessment mode"
                                  className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-300"
                                />
                                <span
                                  className={
                                    agentMode === 'assessment' ? 'font-medium text-amber-600' : ''
                                  }
                                >
                                  Assess
                                </span>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <CourseLessonNavigator />
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 px-4 py-2">
                  <button
                    onClick={() => setCourseOutlineDrawerOpen(true)} // Open the new course outline drawer
                    className="mr-2 -ml-2 p-2 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:ring-inset md:hidden" // Mobile only; tablet/laptop use the inline collapsible sidebar
                    aria-label="Open course outline"
                  >
                    <ListTree className="h-5 w-5" /> {/* Changed icon to ListTree */}
                  </button>
                  <div
                    className="flex flex-1 items-center justify-between overflow-x-auto whitespace-nowrap md:whitespace-normal"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <div className="flex min-w-0 flex-shrink-0 items-center pr-4 text-xs text-gray-500">
                      <Link href="#" className="flex-shrink-0 hover:text-amber-600">
                        {course?.display_name}
                      </Link>
                      {currentParentIds && currentParentIds.module.id && (
                        <>
                          <ChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
                          <Link href="#" className="flex-shrink-0 hover:text-amber-600">
                            {currentParentIds.module.display_name}
                          </Link>
                        </>
                      )}
                      {currentParentIds && currentParentIds.lesson.id && (
                        <>
                          <ChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
                          <Link href="#" className="flex-shrink-0 hover:text-amber-600">
                            {currentParentIds.lesson.display_name}
                          </Link>
                        </>
                      )}
                      <ChevronRight className="mx-1 h-3 w-3 flex-shrink-0" />
                      <span className="flex-shrink-0 text-gray-700">
                        {currentCourseInfo?.display_name}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 items-center">
                      <div className="mr-4 flex items-center text-xs text-gray-600">
                        <span className="mr-1 font-medium">Progress:</span>
                        <div className="mx-1 h-1.5 w-16 rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, courseCompletion?.completion_percentage || 0),
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="ml-1">
                          {courseCompletion?.completion_percentage || 0}%
                        </span>
                      </div>
                      {courseGradingPolicyActive && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Grade:</span>{' '}
                          {courseCompletion?.grading_percentage || 0}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content area */}
              <div
                /* className="flex-1 overflow-y-auto bg-amber-50 pb-[60px]" */
                //no overflow hidden on mobile
                className={cn('flex-1', isMobile ? 'overflow-y-auto' : 'overflow-hidden')}
                style={{ scrollbarWidth: 'none' }}
              >
                {children}
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
