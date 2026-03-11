"use client";

import { ProfileTimeChart } from "@/components/profile-time-chart";
import { ProfileInfoCards } from "@/components/profile-info-cards";
import { SkillLeaderboardChart } from "@/components/skill-leaderboard-chart";
import { useProfileActivityStats } from "@/hooks/profile/use-profile-activity-stats";
import { ActivityStats } from "@/types/catalog";
import { SkeletonActivityStatBox } from "@/components/skeleton-activity-stat-box";
import { getTenant, getUserName } from "@/utils/helpers";
import { useTenantMetadata } from "@iblai/iblai-js/web-utils";
// @ts-ignore
import { useGetUserMetadataQuery } from "@iblai/iblai-js/data-layer";

export default function ProfilePage() {
  const { stats } = useProfileActivityStats();
  const { metadataLoaded, isSkillsLeaderBoardEnabled } = useTenantMetadata({
    org: getTenant(),
  });
  const username = getUserName();
  const { data: userMetadata, isLoading: isUserMetadataLoading } =
    useGetUserMetadataQuery({
      params: { username },
    }, {
      skip: !username,
    });

  return (
    <>
      <div className="px-6 pb-12 pt-8">
        {/* Stats Grid - Apply styling similar to skills page */}
        <div className="mb-6 bg-gray-50 rounded-md p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Activity Overview
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
              {stats.map((stat: ActivityStats, index: number) =>
                stat.loading ? (
                  <SkeletonActivityStatBox key={index} />
                ) : (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    <span className="text-xl md:text-lg font-medium text-gray-700">
                      {stat.value}
                    </span>
                    <span className="text-xs text-gray-500 text-center mt-1">
                      {stat.label}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        <div className="mb-6 bg-amber-50/30 rounded-md p-6 border border-amber-100 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Time Spent</h2>
          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <ProfileTimeChart />
          </div>
        </div>

        {/* Profile Info Cards - Apply styling similar to skills page */}
        <div className="mb-6 bg-gray-50 rounded-md p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Profile Information
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <ProfileInfoCards />
          </div>
        </div>

        {/* Skill Leaderboard Chart - Apply styling similar to skills page */}
        {metadataLoaded &&
          isSkillsLeaderBoardEnabled() &&
          !isUserMetadataLoading &&
          userMetadata?.enable_skills_leaderboard_display!==false && (
            <div className="bg-amber-50/30 rounded-md p-6 border border-amber-100 shadow-sm">
              <h2 className="text-lg font-medium text-gray-700 mb-4">
                Skill Leaderboard
              </h2>
              <div className="bg-white rounded-lg border border-amber-200 p-4">
                <SkillLeaderboardChart
                  userSkillPoints={
                    stats.find((stat) => stat.label === "Points")?.value || 0
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
