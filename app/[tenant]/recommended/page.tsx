'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useRecommendedCourses } from '@/hooks/courses/use-recommended-courses';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { CourseCardSkeleton } from '@/components/course-card-skeleton';
import { RecommendedCourseResult } from '@/types/courses';
import { CourseBox } from '@/components/course-box';
import { useTenantParam } from '@/hooks/use-tenant-param';

export default function RecommendedPage() {
  const tenant = useTenantParam();
  const [searchQuery, setSearchQuery] = useState('');
  const { recommendedCourses, isLoading, isError } = useRecommendedCourses({
    limit: 8,
    search: searchQuery,
    tenant,
  });

  return (
    <>
      <main
        className="h-[calc(100vh-80px)] overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="flex h-full flex-col items-start md:flex-row">
          <div
            className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 pb-16 md:pb-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              main::-webkit-scrollbar {
                display: none;
              }
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div>
              <h1 className="mb-6 text-base font-semibold text-gray-600 sm:text-lg md:text-xl">
                Recommended for Me
              </h1>

              <div className="mb-6 flex items-center justify-between">
                <div className="relative w-64">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button className="flex items-center gap-2 rounded-md bg-[var(--button-primary-bg)] px-4 py-2 text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]">
                  <Plus className="h-4 w-4" />
                  <span>Recommended Courses</span>
                </button>
              </div>
              {((!isLoading && isError) || (!isLoading && recommendedCourses.length === 0)) && (
                <DefaultEmptyBox message="No courses found." className="w-full" />
              )}

              {/* Course Grid */}
              <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {isLoading && <SkeletonMultiplier Skeleton={CourseCardSkeleton} multiplier={6} />}
                {!isLoading &&
                  !isError &&
                  recommendedCourses.map((course: RecommendedCourseResult, index: number) => (
                    <CourseBox
                      key={`course-${course.data.course_id}-${index}`}
                      course={course.data}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
