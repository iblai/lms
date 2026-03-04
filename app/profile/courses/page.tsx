'use client';

import { useState } from 'react';

import { Search, Plus } from 'lucide-react';
import { useUserCourses } from '@/hooks/courses/use-user-courses';
import { CourseBox } from '@/components/course-box';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { Course } from '@/types/courses';
import ReactPaginate from 'react-paginate';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';

export default function CoursesPage() {
  const { metadataLoaded, isSkillsAssignmentsFeatureHidden } = useTenantMetadata({
    org: getTenant(),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const ENROLLED_TAB = 'enrolled';
  const ASSIGNED_TAB = 'assigned';
  const [activeTab, setActiveTab] = useState(ENROLLED_TAB); // "my" or "assigned"
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const { userCourses, isLoadingUserCourses, errorUserCourses, pagination } = useUserCourses({
    page,
    limit,
    courseType: activeTab,
    useAPISearch: false,
    search: searchQuery,
  });

  const handleCourseTabChange = (tab: 'enrolled' | 'assigned') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <div className="p-6">
      {/* Courses Tabs */}
      <div className="border-b border-gray-200 mb-6 sm:mb-8">
        <div className="flex space-x-8">
          <button
            onClick={() => handleCourseTabChange(ENROLLED_TAB)}
            className={`py-2 px-1 text-sm font-medium border-b-2 ${
              activeTab === ENROLLED_TAB
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My courses
          </button>
          {metadataLoaded && !isSkillsAssignmentsFeatureHidden() && (
            <button
              onClick={() => handleCourseTabChange(ASSIGNED_TAB)}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === ASSIGNED_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assigned courses
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <button className="flex items-center gap-2 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] px-4 py-2 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity">
          <Plus className="h-4 w-4" />
          <span>Discover Courses</span>
        </button>
      </div>
      {((!isLoadingUserCourses && errorUserCourses) ||
        (!isLoadingUserCourses && userCourses.length === 0)) && (
        <DefaultEmptyBox message="No courses found." className="w-full" />
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {isLoadingUserCourses && (
          <SkeletonMultiplier Skeleton={CourseCardSkeleton} multiplier={6} />
        )}
        {!isLoadingUserCourses &&
          !errorUserCourses &&
          userCourses.map((course: Course, index: number) => (
            <CourseBox key={`course-${course.course_id}-${index}`} course={course} />
          ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-end mt-8 mb-10">
        <ReactPaginate
          className="flex items-center space-x-2"
          pageClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          activeClassName="bg-amber-50 text-amber-600 hover:bg-amber-100"
          previousClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          nextClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          breakClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          pageCount={pagination?.total_pages || Math.ceil((pagination?.count || 1) / limit)}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          previousLabel="Previous"
          nextLabel="Next"
          onPageChange={(data) => {
            setPage(data.selected + 1);
          }}
        />
      </div>
    </div>
  );
}
