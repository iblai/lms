'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { Clock, Calendar, Globe, DollarSign } from 'lucide-react';
import _ from 'lodash';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { getRandomCourseImage } from '@/utils/helpers';
import { config } from '@/lib/config';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { SkeletonCourseAccessBtn } from '@/components/skeleton-course-access-btn';
import { useCourseDetailContext } from '@/hooks/courses/course-detail-context';
import { useChatState } from '@/components/chat-button';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { AboutTab } from './_components/about-tab';
import { SyllabusTab } from './_components/syllabus-tab';
import { LearningInfoTab } from './_components/learning-info-tab';
import { InstructorTab } from './_components/instructor-tab';
import { ConfigurationTab } from './_components/configuration-tab';

dayjs.extend(duration);

export default function CourseDetailsPage() {
  const params = useParams();
  const tenant = useTenantParam();
  const { setCourseMentor, setMentorSidebarHidden } = useChatState();
  const courseId = decodeURIComponent(params.course_id as string);

  // Fetch department member check for is_platform_admin
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });

  const {
    handleFetchCourseSyllabus,
    handleOpenLesson,
    course,
    courseOutline,
    courseEligibility,
    courseOutlineLoading,
    courseEligibilityLoading,
    courseEligibilityFetched,
    courseButtonActionLoading,
    courseInfoLoadingState,
    userLoggedIn,
  } = useCourseDetailContext();

  const [randomCourseImage] = useState(() => getRandomCourseImage());

  // When the user is sent back from the auth SPA after clicking the CTA while
  // anonymous, `?trigger_cta=1` is appended to the URL. Once the page and
  // eligibility have loaded — and the user is actually authenticated — fire
  // the CTA action automatically, then strip the param so a refresh doesn't
  // re-trigger it.
  const searchParams = useSearchParams();
  const ctaAutoTriggeredRef = useRef(false);

  useEffect(() => {
    if (ctaAutoTriggeredRef.current) return;
    if (searchParams.get('trigger_cta') !== '1') return;
    if (!userLoggedIn) return;
    if (courseInfoLoadingState !== 'successful') return;
    // Wait until `handleFetchCourseEligibilityInfo` has actually settled —
    // `courseEligibilityLoading` is `false` both before and after the fetch,
    // so we need the positive `courseEligibilityFetched` signal to know the
    // resolved CTA reflects the real eligibility.
    if (!courseEligibilityFetched) return;
    if (courseEligibilityLoading || courseButtonActionLoading) return;
    if (!courseEligibility?.btn_action || courseEligibility.disabled) return;

    ctaAutoTriggeredRef.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete('trigger_cta');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    courseEligibility.btn_action();
  }, [
    searchParams,
    userLoggedIn,
    courseInfoLoadingState,
    courseEligibilityFetched,
    courseEligibilityLoading,
    courseButtonActionLoading,
    courseEligibility,
  ]);

  // Course info is fetched once by `CourseDetailProvider` in the layout; the
  // page only reacts to the resulting `course` to wire up the mentor + syllabus.
  useEffect(() => {
    if (!_.isEmpty(course)) {
      if (!course?.mentor_hidden) {
        setCourseMentor(course?.mentor_uuid || null);
      } else {
        setMentorSidebarHidden(true);
      }
      handleFetchCourseSyllabus();
      // Eligibility + monetization-access is now driven internally by
      // `useCourseDetail` once `course` arrives — no manual trigger needed.
    }
  }, [course]);

  const [activeTab, setActiveTab] = useState<
    'about' | 'syllabus' | 'learning-info' | 'instructor' | 'configuration'
  >('about');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Add a function to toggle section expansion
  const toggleSection = (index: number | string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <>
      {(courseInfoLoadingState === 'not-started' || courseInfoLoadingState === 'loading') && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      )}

      {courseInfoLoadingState === 'failure' && !course && (
        <DefaultEmptyBox message="No course data found." />
      )}

      {courseInfoLoadingState === 'successful' && course && (
        <div className="flex flex-1 overflow-hidden">
          {/* Main content area */}
          <div
            className="flex-1 overflow-y-auto pb-16 md:pb-0"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Course Title */}
            <div className="border-b border-gray-200 p-6">
              <div className="mx-auto max-w-6xl">
                <h1 className="text-base font-semibold text-gray-600 md:text-lg">
                  {course.display_name}
                </h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="px-6">
                <div className="mx-auto max-w-6xl">
                  <div className="flex space-x-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setActiveTab('about')}
                      className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
                        activeTab === 'about'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      About
                    </button>
                    <button
                      onClick={() => setActiveTab('syllabus')}
                      className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
                        activeTab === 'syllabus'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      Syllabus
                    </button>
                    {course?.learning_info && course.learning_info.length > 0 && (
                      <button
                        onClick={() => setActiveTab('learning-info')}
                        className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
                          activeTab === 'learning-info'
                            ? 'border-amber-500 text-amber-500'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        Learning Info
                      </button>
                    )}
                    {course?.instructor_info?.instructors &&
                      course.instructor_info.instructors.length > 0 && (
                        <button
                          onClick={() => setActiveTab('instructor')}
                          className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
                            activeTab === 'instructor'
                              ? 'border-amber-500 text-amber-500'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                        >
                          Instructors
                        </button>
                      )}
                    {departmentMemberCheck?.is_platform_admin && (
                      <button
                        onClick={() => setActiveTab('configuration')}
                        className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
                          activeTab === 'configuration'
                            ? 'border-amber-500 text-amber-500'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        Configuration
                      </button>
                    )}
                    {departmentMemberCheck?.is_platform_admin && (
                      <a
                        href={`${config.urls.studioUrl()}/course/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 border-b-2 border-transparent px-1 py-3 text-sm font-medium whitespace-nowrap text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      >
                        Authoring
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="h-[calc(100%-100px)] w-full overflow-y-auto bg-amber-50 p-6 md:h-full">
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  {activeTab === 'about' && <AboutTab course={course} />}

                  {activeTab === 'syllabus' && (
                    <SyllabusTab
                      courseOutline={courseOutline}
                      courseOutlineLoading={courseOutlineLoading}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      handleOpenLesson={handleOpenLesson}
                    />
                  )}

                  {activeTab === 'learning-info' && <LearningInfoTab course={course} />}

                  {activeTab === 'instructor' && (
                    <InstructorTab
                      course={course}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                    />
                  )}

                  {activeTab === 'configuration' && departmentMemberCheck?.is_platform_admin && (
                    <ConfigurationTab
                      courseId={courseId}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                    />
                  )}
                </div>
                <div className="md:col-span-1">
                  <div className="sticky top-6 space-y-6">
                    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <Image
                        src={`${config.urls.lms()}${course.course_image_asset_path}`}
                        alt={course.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = randomCourseImage;
                        }}
                      />
                    </div>
                    {courseEligibilityLoading || courseButtonActionLoading ? (
                      <SkeletonCourseAccessBtn />
                    ) : (
                      <button
                        onClick={courseEligibility.btn_action}
                        className="w-full rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] py-3 font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
                        disabled={courseEligibility.disabled}
                      >
                        {courseEligibility.btn_label}
                      </button>
                    )}

                    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{course.course_price}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Globe className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{course.language}</span>
                      </div>
                      {course?.duration && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="mr-3 h-5 w-5 text-amber-500" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <Calendar className="mr-3 h-5 w-5 text-amber-500" />
                        <span>{dayjs(course.start_date).format('MMM D, YYYY')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
