'use client';

import { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  ProfileTimeChart,
  SkillLeaderboardChart,
  SkeletonActivityStatBox,
  useProfileActivityStats,
  useProfileTimeSpent,
  useUserMetadata,
  type ActivityStats,
} from '@iblai/iblai-js/web-containers';
import { ProfileInfoCards } from '@iblai/iblai-js/web-containers/next';
import { getTenant } from '@/utils/helpers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
// @ts-ignore
import { useGetUserPerLearnerInfoQuery } from '@/services/perlearner';
// @ts-ignore
import { useLazyGetPerLearnerActivityQuery } from '@/services/perlearner';

export default function ProfilePage() {
  const { stats } = useProfileActivityStats();
  const { metadataLoaded, isSkillsLeaderBoardEnabled } = useTenantMetadata({
    org: getTenant(),
  });
  const { userMetaData: userMetadata, userMetaDataLoading: isUserMetadataLoading } =
    useUserMetadata();
  const { timeSpent, timeSpentLoading } = useProfileTimeSpent();

  // ProfileInfoCards wiring
  const { data: userInfo, isLoading: isUserInfoLoading } = useGetUserPerLearnerInfoQuery({
    org: getTenant(),
    username: userMetadata?.username || '',
  });
  const [getPerLearnerActivity] = useLazyGetPerLearnerActivityQuery();
  const [topContent, setTopContent] = useState<{
    name?: string | null;
    course_id?: string | null;
    time_invested?: number | null;
  } | null>(null);
  const [topContentLoading, setTopContentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTopContentLoading(true);
        const response = await getPerLearnerActivity({
          org: getTenant(),
          username: userMetadata?.username || '',
        });
        if (cancelled) return;
        if (_.isEmpty(response.data)) {
          throw new Error('Empty per-learner activity');
        }
        const sortedData = [...(response.data as any).data].sort(
          (a: any, b: any) => b.time_invested - a.time_invested,
        );
        setTopContent(sortedData[0]);
      } catch {
        if (!cancelled) {
          setTopContent({ name: '-', time_invested: 0, course_id: '-' });
        }
      } finally {
        if (!cancelled) setTopContentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getPerLearnerActivity, userMetadata?.username]);

  return (
    <>
      <div className="px-6 pt-8 pb-12">
        {/* Stats Grid - Apply styling similar to skills page */}
        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-700">Activity Overview</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-3 gap-4 md:grid-cols-9">
              {stats.map((stat: ActivityStats, index: number) =>
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
            <ProfileTimeChart data={timeSpent} loading={timeSpentLoading} />
          </div>
        </div>

        {/* Profile Info Cards - Apply styling similar to skills page */}
        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-700">Profile Information</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <ProfileInfoCards
              userInfo={(userInfo as any)?.data ?? null}
              topContent={topContent}
              loading={isUserInfoLoading}
              topContentLoading={topContentLoading}
              courseHrefTemplate="/courses/{courseId}"
            />
          </div>
        </div>

        {/* Skill Leaderboard Chart - Apply styling similar to skills page */}
        {metadataLoaded &&
          isSkillsLeaderBoardEnabled() &&
          !isUserMetadataLoading &&
          (userMetadata as any)?.enable_skills_leaderboard_display !== false && (
            <div className="rounded-md border border-amber-100 bg-amber-50/30 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-700">Skill Leaderboard</h2>
              <div className="rounded-lg border border-amber-200 bg-white p-4">
                <SkillLeaderboardChart
                  userSkillPoints={stats.find((stat) => stat.label === 'Points')?.value || 0}
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
