'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Clock, Calendar, Globe, DollarSign } from 'lucide-react';
import _ from 'lodash';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { getRandomCourseImage } from '@/utils/helpers';
import { config } from '@/lib/config';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { SkeletonCourseAccessBtn } from '@/components/skeleton-course-access-btn';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';
import { useChatState } from '@/components/chat-button';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getTenant } from '@/utils/helpers';
import { AboutTab } from './_components/about-tab';
import { SyllabusTab } from './_components/syllabus-tab';
import { LearningInfoTab } from './_components/learning-info-tab';
import { InstructorTab } from './_components/instructor-tab';
import { ConfigurationTab } from './_components/configuration-tab';

dayjs.extend(duration);

export default function CourseDetailsPage() {
  const params = useParams();
  const { setCourseMentor, setMentorSidebarHidden } = useChatState();
  const courseId = decodeURIComponent(params.course_id as string);

  // Fetch department member check for is_platform_admin
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });

  const {
    handleFetchCourseEligibilityInfo,
    handleFetchCourseInfo,
    handleFetchCourseSyllabus,
    handleOpenLesson,
    course,
    courseOutline,
    courseEligibility,
    courseOutlineLoading,
    courseEligibilityLoading,
    courseButtonActionLoading,
    loading,
  } = useCourseDetail(courseId);

  const [randomCourseImage] = useState(() => getRandomCourseImage());

  useEffect(() => {
    if (!_.isEmpty(courseId)) {
      handleFetchCourseInfo();
    }
  }, [courseId]);

  useEffect(() => {
    if (!_.isEmpty(course)) {
      if (!course?.mentor_hidden) {
        setCourseMentor(course?.mentor_uuid || null);
      } else {
        setMentorSidebarHidden(true);
      }
      handleFetchCourseSyllabus();
      handleFetchCourseEligibilityInfo();
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
      {loading && (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && !course && <DefaultEmptyBox message="No course data found." />}

      {!loading && course && (
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
              <div className="max-w-6xl mx-auto">
                <h1 className="text-base md:text-lg font-semibold text-gray-600">
                  {course.display_name}
                </h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="px-6">
                <div className="max-w-6xl mx-auto">
                  <div className="flex space-x-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button
                      onClick={() => setActiveTab('about')}
                      className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${
                        activeTab === 'about'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      About
                    </button>
                    <button
                      onClick={() => setActiveTab('syllabus')}
                      className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${
                        activeTab === 'syllabus'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Syllabus
                    </button>
                    {course?.learning_info && course.learning_info.length > 0 && (
                      <button
                        onClick={() => setActiveTab('learning-info')}
                        className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${
                          activeTab === 'learning-info'
                            ? 'border-amber-500 text-amber-500'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Learning Info
                      </button>
                    )}
                    {course?.instructor_info?.instructors &&
                      course.instructor_info.instructors.length > 0 && (
                        <button
                          onClick={() => setActiveTab('instructor')}
                          className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${
                            activeTab === 'instructor'
                              ? 'border-amber-500 text-amber-500'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Instructors
                        </button>
                      )}
                    {departmentMemberCheck?.is_platform_admin && (
                      <button
                        onClick={() => setActiveTab('configuration')}
                        className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${
                          activeTab === 'configuration'
                            ? 'border-amber-500 text-amber-500'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Configuration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 w-full h-full bg-amber-50 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-white flex items-center justify-center border border-gray-200">
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
                        className="w-full py-3 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity"
                        disabled={courseEligibility.disabled}
                      >
                        {courseEligibility.btn_label}
                      </button>
                    )}

                    <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-5 w-5 text-amber-500 mr-3" />
                        <span>{course.course_price}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Globe className="h-5 w-5 text-amber-500 mr-3" />
                        <span>{course.language}</span>
                      </div>
                      {course?.duration && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-5 w-5 text-amber-500 mr-3" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 text-amber-500 mr-3" />
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
