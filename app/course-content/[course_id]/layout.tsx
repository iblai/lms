'use client';

import type React from 'react';
import { use, useEffect, useState } from 'react';

import { ChevronRight, ListTree } from 'lucide-react';
import Link from 'next/link';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { useEdxIframe } from '@/hooks/courses/use-edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { getTenant, getUserId } from '@/utils/helpers';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { CourseOutline } from '@/components/course-outline';
import { CourseOutlineDrawer } from '@/components/course-outline-drawer';
import { CourseAccessGuard } from '@/components/course-access-guard';
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
      const currentCourse = getUnitToIframe({ children: courseOutline });
      setCurrentCourseInfo(currentCourse);
      const unitID = currentCourse?.id;
      setCurrentUnitID(unitID);
      const parentsIDs = getParentsInfosFromSublessonId(courseOutline, unitID);
      setCurrentParentIds(parentsIDs);
      setCurrentLesson(unitID || '');
      setExpandedLessons([parentsIDs?.lesson.id || '']);
      setCurrentChapter(parentsIDs?.lesson.id || '');
      //setCurrentModule(parentsIDs?.moduleId || "");
      setExpandedModule(parentsIDs?.module.id || '');
    }
  }, [searchParams, courseOutline]);

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
    handleOpenLesson(lessonId);
  };

  return (
    <CourseAccessGuard course={course} courseInfoLoadingState={courseInfoLoadingState}>
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
        <main className="flex flex-1 overflow-hidden">
          {/* Course sidebar */}
          <div
            className="w-72 border-r border-gray-200 overflow-y-auto hidden md:block pl-4"
            style={{ scrollbarWidth: 'none', height: 'calc(100% - 60px)' }}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">{course?.display_name}</h2>
            </div>

            <CourseOutline />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Course navigation tabs */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto w-full">
                <Link
                  href={`/course-content/${resolvedParams.course_id}/course${
                    currentCourseInfo?.id ? `?unit_id=${currentCourseInfo?.id}` : ''
                  }`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'course'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Course
                </Link>
                <Link
                  href={`/course-content/${resolvedParams.course_id}/progress`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'progress'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Progress
                </Link>
                <Link
                  href={`/course-content/${resolvedParams.course_id}/dates`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'dates'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dates
                </Link>
                <Link
                  href={`/course-content/${resolvedParams.course_id}/discussion`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
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
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'instructor'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Instructor
                  </Link>
                )}
              </div>
              <div className="flex items-center px-4 py-2 bg-gray-50">
                <button
                  onClick={() => setCourseOutlineDrawerOpen(true)} // Open the new course outline drawer
                  className="xl:hidden p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500" // Updated here
                  aria-label="Open course outline"
                >
                  <ListTree className="h-5 w-5" /> {/* Changed icon to ListTree */}
                </button>
                <div
                  className="flex justify-between items-center flex-1 overflow-x-auto whitespace-nowrap md:whitespace-normal"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <div className="flex items-center text-xs text-gray-500 min-w-0 flex-shrink-0 pr-4">
                    <Link href="#" className="hover:text-amber-600 flex-shrink-0">
                      {course?.display_name}
                    </Link>
                    {currentParentIds && currentParentIds.module.id && (
                      <>
                        <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" />
                        <Link href="#" className="hover:text-amber-600 flex-shrink-0">
                          {currentParentIds.module.display_name}
                        </Link>
                      </>
                    )}
                    {currentParentIds && currentParentIds.lesson.id && (
                      <>
                        <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" />
                        <Link href="#" className="hover:text-amber-600 flex-shrink-0">
                          {currentParentIds.lesson.display_name}
                        </Link>
                      </>
                    )}
                    <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" />
                    <span className="text-gray-700 flex-shrink-0">
                      {currentCourseInfo?.display_name}
                    </span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <div className="text-xs text-gray-600 mr-4 flex items-center">
                      <span className="font-medium mr-1">Progress:</span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-1">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, courseCompletion?.completion_percentage || 0),
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="ml-1">{courseCompletion?.completion_percentage || 0}%</span>
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
                {children}
              </EdxIframeContext.Provider>
            </div>
          </div>
        </main>

        <style jsx global>{`
          ::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </CourseOutlineContext.Provider>
    </CourseAccessGuard>
  );
}
