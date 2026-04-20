'use client';

import type React from 'react';
import { use, useEffect, useRef, useState } from 'react';

import { ChevronRight, ListTree } from 'lucide-react';
import Link from 'next/link';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { usePathname, useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { toast } from 'sonner';
import { useEdxIframe } from '@/hooks/courses/use-edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { getTenant, getUserId } from '@/utils/helpers';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { CourseOutline } from '@/components/course-outline';
import { CourseOutlineDrawer } from '@/components/course-outline-drawer';
import { CourseAccessGuard } from '@/components/course-access-guard';
import { CourseLessonNavigator } from '@/components/course-lesson-navigator';
// @ts-ignore
import { ExamInfo } from '@iblai/iblai-js/data-layer';
import { useChatState } from '@/components/chat-button';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';

export default function CourseContentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ course_id: string }>;
}) {
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });
  const resolvedParams = use(params);
  const courseId = decodeURIComponent(resolvedParams.course_id);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = pathname?.split('/').filter(Boolean).pop();
  const { setCourseMentor } = useChatState();
  const {
    handleFetchCourseInfo,
    handleFetchCourseSyllabus,
    handleOpenLesson,
    handleFetchCourseProgress,
    handleFetchCourseCompletion,
    course,
    courseInfoLoadingState,
    courseOutline,
    courseOutlineLoading,
    courseCompletion,
    courseGradingPolicyActive,
  } = useCourseDetail(courseId);

  const { getUnitToIframe, getParentsInfosFromSublessonId } = useEdxIframe();

  useEffect(() => {
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
      toast.success(`Switched to "${currentCourseInfo?.display_name ?? 'new unit'}"`);
    }
    previousUnitIdRef.current = unitId;
  }, [currentCourseInfo?.id, currentTab]);

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

  const agentTabVisible = !course || course.agent_content_mode !== false;
  const courseTabVisible = !course || course.course_content_mode === true;

  return (
    <CourseAccessGuard
      course={course}
      courseInfoLoadingState={courseInfoLoadingState}
      currentTab={currentTab}
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
        <EdxIframeContext.Provider
          value={{
            iframeUrl: iframeUrl,
            setIframeUrl: setIframeUrl,
            courseOutline: courseOutline,
            setActiveTab: setActiveTab,
            activeTab: activeTab,
            courseID: courseId,
            currentlyInExamSubsection: currentlyInExamSubsection,
            setCurrentlyInExamSubsection: setCurrentlyInExamSubsection,
            examInfo: examInfo,
            setExamInfo: setExamInfo,
            refresher: refresher,
            setRefresher: setRefresher,
            //setCourseOutline: () => {},
          }}
        >
          <main className="flex flex-1 overflow-hidden">
            {/* Course sidebar */}
            <div
              className="hidden w-72 overflow-y-auto border-r border-gray-200 pl-4 md:block"
              style={{ scrollbarWidth: 'none', height: 'calc(100% - 60px)' }}
            >
              <div className="border-b border-gray-200 p-4">
                <h2 className="font-semibold text-gray-800">{course?.display_name}</h2>
              </div>

              <CourseOutline />
            </div>

            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Course navigation tabs */}
              <div className="border-b border-gray-200">
                {/* Skills innercourseware tabs */}
                <div className="flex w-full items-center justify-between">
                  <div className="flex min-w-0 overflow-x-auto">
                    {agentTabVisible && (
                      <Link
                        href={`/course-content/${resolvedParams.course_id}/agent`}
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
                        href={`/course-content/${resolvedParams.course_id}/course${
                          currentCourseInfo?.id ? `?unit_id=${currentCourseInfo?.id}` : ''
                        }`}
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
                      href={`/course-content/${resolvedParams.course_id}/progress`}
                      className={`border-b-2 px-4 py-3 text-sm font-medium ${
                        activeTab === 'progress'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Progress
                    </Link>
                    <Link
                      href={`/course-content/${resolvedParams.course_id}/dates`}
                      className={`border-b-2 px-4 py-3 text-sm font-medium ${
                        activeTab === 'dates'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Dates
                    </Link>
                    <Link
                      href={`/course-content/${resolvedParams.course_id}/discussion`}
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
                        href={`/course-content/${resolvedParams.course_id}/instructor`}
                        className={`border-b-2 px-4 py-3 text-sm font-medium ${
                          activeTab === 'instructor'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Instructor
                      </Link>
                    )}
                  </div>
                  <CourseLessonNavigator className="pr-4" />
                </div>
                <div className="flex items-center bg-gray-50 px-4 py-2">
                  <button
                    onClick={() => setCourseOutlineDrawerOpen(true)} // Open the new course outline drawer
                    className="mr-2 -ml-2 p-2 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:ring-inset xl:hidden" // Updated here
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
                className="flex-1 overflow-y-auto pb-[60px]"
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
