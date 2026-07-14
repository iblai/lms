'use client';

import { HomeHero } from '@/components/home/home-hero';
import { HomeActivityOverview } from '@/components/home/home-activity-overview';
import { HomeDiscoverRail } from '@/components/home/home-discover-rail';

/**
 * Home — the landing page. A full-width column of bands:
 *
 *   1. Hero greeting with the primary jumping-off points,
 *   2. Activity Overview (profile Activity page endpoints: the stats +
 *      the 7-day time-spent chart),
 *   3. Explore the Catalog (Discover page endpoint; enrollments and
 *      recommendations live on the centralized catalog page).
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
            {/* Full-bleed hero band, outside the padded content container */}
            <HomeHero />
            <div className="home-page-content mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-3 pt-4 pb-10 sm:px-4 md:px-6">
              <HomeActivityOverview />
              <HomeDiscoverRail />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
