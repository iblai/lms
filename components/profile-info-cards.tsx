import {
  useGetUserPerLearnerInfoQuery,
  useLazyGetPerLearnerActivityQuery,
} from '@/services/perlearner';
import { getTenant, getUserName } from '@/utils/helpers';
import { useEffect } from 'react';
import { BookOpen, Clock, Check } from 'lucide-react';
import { SkeletonProfileInfoCard } from './skeleton-profile-info-card';
import dayjs from 'dayjs';
import { useState } from 'react';
import { UserActivityInfo } from '@/types/perlearner';
import _ from 'lodash';
import { SkeletonMultiplier } from './skeleton-multiplier';
import Link from 'next/link';

export function ProfileInfoCards() {
  const { data: userInfo, isLoading } = useGetUserPerLearnerInfoQuery({
    org: getTenant(),
    username: getUserName(),
  });

  const [getPerLearnerActivity, { isError: activityError }] = useLazyGetPerLearnerActivityQuery();
  const [topContent, setTopContent] = useState<UserActivityInfo | null>(null);
  const [topContentLoading, setTopContentLoading] = useState(false);
  const handleGetPerLearnerActivity = async () => {
    try {
      setTopContentLoading(true);
      const response = await getPerLearnerActivity({
        org: getTenant(),
        username: getUserName(),
      });
      if (activityError || _.isEmpty(response.data)) {
        throw new Error('Error fetching per learner activity');
      }
      const sortedData = [...response.data.data].sort((a, b) => b.time_invested - a.time_invested);
      setTopContent(sortedData[0]);
      setTopContentLoading(false);
    } catch (error) {
      console.error(JSON.stringify(error));
      setTopContent({
        name: '-',
        time_invested: 0,
        course_id: '-',
        course_start: '-',
        course_end: '-',
        average_time_invested: 0,
        days_away: '-',
        last_access_date: '-',
        days_accessed: 0,
      });
      setTopContentLoading(false);
    }
  };
  useEffect(() => {
    handleGetPerLearnerActivity();
  }, []);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Last Accessed Card */}
      {isLoading ? (
        <SkeletonMultiplier multiplier={3} Skeleton={SkeletonProfileInfoCard} />
      ) : (
        <>
          <div className="flex items-start rounded-sm border border-[var(--border)] p-4">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--primary-light)]">
              <BookOpen className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-sm text-[var(--text-light)]">Last Accessed</h3>
              <p className="text-base font-medium text-[var(--text-dark)]">
                {userInfo?.data?.last_activity
                  ? dayjs(userInfo?.data?.last_activity).format('MMM DD, YYYY')
                  : '-'}
              </p>
            </div>
          </div>

          {/* Joined Card */}
          <div className="flex items-start rounded-sm border border-[var(--border)] p-4">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--primary-light)]">
              <Check className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-sm text-[var(--text-light)]">Joined</h3>
              <p className="text-base font-medium text-[var(--text-dark)]">
                {userInfo?.data?.date_joined
                  ? dayjs(userInfo?.data?.date_joined).format('MMM DD, YYYY')
                  : '-'}
              </p>
            </div>
          </div>

          {/* Total Time Spent Card */}
          <div className="flex items-start rounded-sm border border-[var(--border)] p-4">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--primary-light)]">
              <Clock className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-sm text-[var(--text-light)]">Total Time Spent</h3>
              <p className="text-base font-medium text-[var(--text-dark)]">
                {userInfo?.data?.total_time_spent
                  ? dayjs.duration(userInfo?.data?.total_time_spent, 'seconds').format('HH:mm')
                  : '-'}
              </p>
            </div>
          </div>
        </>
      )}
      {topContentLoading ? (
        <SkeletonProfileInfoCard />
      ) : (
        <div className="rounded-sm border border-[var(--border)] p-4">
          <h3 className="mb-4 text-sm text-[var(--text-light)]">Top Content</h3>
          <div className="flex items-center justify-between">
            <Link
              href={`/courses/${topContent?.course_id}`}
              className="text-sm text-[var(--primary)]"
            >
              {topContent?.name}
            </Link>
            <span className="text-xs text-[var(--text-light)]">
              {dayjs.duration(topContent?.time_invested || 0, 'seconds').format('HH:mm')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
