'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { ProfileTimeChart } from '@/components/profile-time-chart';
import { SkeletonActivityStatBox } from '@/components/skeleton-activity-stat-box';
import { useProfileActivityStats } from '@/hooks/profile/use-profile-activity-stats';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { ActivityStats } from '@/types/catalog';

/** Stats hidden on the landing tiles (still shown on the full profile
 * Activity page). */
const HIDDEN_STAT_LABELS = new Set(['Points', 'Assessments', 'Videos']);

/**
 * Landing view of the profile Activity page data: the activity stats
 * (skills, credentials, courses, …) as compact tiles next to the 7-day
 * Time Spent chart. "View activity" deep-links to the full profile
 * Activity page.
 */
export function HomeActivityOverview() {
  const tenant = useTenantParam();
  const { stats: allStats } = useProfileActivityStats();
  const stats = allStats.filter((stat) => !HIDDEN_STAT_LABELS.has(String(stat.label)));

  return (
    <section aria-label="Activity Overview" className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-600 sm:text-lg md:text-xl">
          Activity Overview
        </h3>
        <Link
          href={`/platform/${tenant}/profile`}
          className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 sm:text-sm"
        >
          View Activity
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 50/50 split: stat tiles (2 per row × 3 rows) | time-spent chart */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Stat tiles — same endpoints as the profile Activity page */}
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="grid h-full grid-cols-2 content-center gap-3">
            {stats.map((stat: ActivityStats, index: number) =>
              stat.loading ? (
                <SkeletonActivityStatBox key={index} />
              ) : (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-3 transition-shadow hover:shadow-sm"
                >
                  <span className="text-xl font-medium text-gray-700 md:text-lg">{stat.value}</span>
                  <span className="mt-1 text-center text-xs text-gray-500">{stat.label}</span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* 7-day time-spent chart — same endpoint as the profile Activity page */}
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-600">Time Spent — last 7 days</h4>
          <ProfileTimeChart />
        </div>
      </div>
    </section>
  );
}
