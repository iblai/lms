'use client';

import dynamic from 'next/dynamic';
import { ProfileInfoCards } from '@/components/profile-info-cards';
import { useProfileActivityStats } from '@/hooks/profile/use-profile-activity-stats';
import { ActivityStats } from '@/types/catalog';
import { SkeletonActivityStatBox } from '@/components/skeleton-activity-stat-box';
import { getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';

/** Stats hidden from the Activity Overview tiles (Points still feeds the
 * Skill Leaderboard below). */
const HIDDEN_STAT_LABELS = new Set(['Points', 'Assessments', 'Videos']);

const chartFallback = <div className="h-64 w-full animate-pulse rounded-lg bg-gray-100" />;

const ProfileTimeChart = dynamic(
  () => import('@/components/profile-time-chart').then((m) => m.ProfileTimeChart),
  { ssr: false, loading: () => chartFallback },
);

const SkillLeaderboardChart = dynamic(
  () => import('@/components/skill-leaderboard-chart').then((m) => m.SkillLeaderboardChart),
  { ssr: false, loading: () => chartFallback },
);

export default function ProfilePage() {
  const tenant = useTenantParam();
  const { stats } = useProfileActivityStats();
  // Zero-value tiles are hidden, same as the home Activity Overview.
  const visibleStats = stats.filter(
    (stat) =>
      !HIDDEN_STAT_LABELS.has(String(stat.label)) && (stat.loading || Number(stat.value) !== 0),
  );
  const { metadataLoaded, isSkillsLeaderBoardEnabled } = useTenantMetadata({
    org: tenant,
  });
  const username = getUserName();
  const { data: userMetadata, isLoading: isUserMetadataLoading } = useGetUserMetadataQuery(
    {
      params: { username },
    },
    {
      skip: !username,
    },
  );

  return (
    <>
      <div className="px-6 pt-8 pb-12">
        {/* Stats Grid - Apply styling similar to skills page */}
        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-700">Activity Overview</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              {visibleStats.map((stat: ActivityStats, index: number) =>
                stat.loading ? (
                  <SkeletonActivityStatBox key={index} />
                ) : (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-3 transition-shadow hover:shadow-sm"
                  >
                    <span className="text-xl font-medium text-gray-700 md:text-lg">
                      {stat.value}
                    </span>
                    <span className="mt-1 text-center text-xs text-gray-500">{stat.label}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="mb-6 rounded-md border border-amber-100 bg-amber-50/30 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-700">Time Spent</h2>
          <div className="rounded-lg border border-amber-200 bg-white p-4">
            <ProfileTimeChart />
          </div>
        </div>

        {/* Profile Info Cards - Apply styling similar to skills page */}
        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-700">Profile Information</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <ProfileInfoCards />
          </div>
        </div>

        {/* Skill Leaderboard Chart - Apply styling similar to skills page */}
        {metadataLoaded &&
          isSkillsLeaderBoardEnabled() &&
          !isUserMetadataLoading &&
          userMetadata?.enable_skills_leaderboard_display !== false && (
            <div className="rounded-md border border-amber-100 bg-amber-50/30 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-700">Skill Leaderboard</h2>
              <div className="rounded-lg border border-amber-200 bg-white p-4">
                <SkillLeaderboardChart
                  userSkillPoints={
                    Number(stats.find((stat) => stat.label === 'Points')?.value) || 0
                  }
                />
              </div>
            </div>
          )}
      </div>
      <style jsx>{`
        main::-webkit-scrollbar {
          display: none;
        }
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
