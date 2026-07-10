'use client';

import { HomeHero } from '@/components/home/home-hero';
import { HomeActivityOverview } from '@/components/home/home-activity-overview';
import { HomeDiscoverRail } from '@/components/home/home-discover-rail';
import { SuggestedCourses } from '@/components/suggested-courses';
import { MyCourses } from '@/components/my-courses';
import { isRecommendedTabHidden } from '@/utils/helpers';

/**
 * Home — the landing page. A full-width column of bands:
 *
 *   1. Hero greeting with the primary jumping-off points,
 *   2. Activity Overview (profile Activity page endpoints: the nine
 *      stats + the 7-day time-spent chart),
 *   3. My Courses (enrollments),
 *   4. Suggested Courses (recommendations),
 *   5. Explore the Catalog (Discover page endpoint).
 */
export default function Dashboard() {
  return (
    <>
      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {/* The only scrollable area on the page */}
          <div
            className="h-full flex-1 overflow-y-auto"
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
            <style jsx>{`
              @media (max-width: 768px) {
                .home-page-content {
                  padding-top: 14px;
                }
              }
            `}</style>
            <div className="home-page-content mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-3 pt-4 pb-10 sm:px-4 md:px-6">
              <HomeHero />
              <HomeActivityOverview />
              <MyCourses />
              {!isRecommendedTabHidden() && <SuggestedCourses />}
              <HomeDiscoverRail />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
