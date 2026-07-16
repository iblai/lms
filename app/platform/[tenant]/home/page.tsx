'use client';

import { HomeHero } from '@/components/home/home-hero';
import { HomeDiscoverRail } from '@/components/home/home-discover-rail';

/**
 * Home — the landing page. A full-width column of bands:
 *
 *   1. Hero greeting with the primary jumping-off points,
 *   2. Explore rail (Discover page endpoint; enrollments and
 *      recommendations live on the centralized catalog page).
 *
 * The Activity Overview (stats + time-spent chart) lives on the profile
 * Activity page only — it is intentionally NOT shown here.
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
              <HomeDiscoverRail />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
