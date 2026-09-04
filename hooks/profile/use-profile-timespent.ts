import { TimeSpent } from '@/types/perlearner';
import { getUserName } from '@/utils/helpers';
import { getTenant } from '@/utils/helpers';
// @ts-ignore
import { useLazyGetOverTimeActivityQuery } from '@iblai/iblai-js/data-layer';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isEmpty from 'lodash/isEmpty';
dayjs.extend(duration);

export const useProfileTimeSpent = () => {
  const [timeSpent, setTimeSpent] = useState<TimeSpent[]>([]);
  const [timeSpentLoading, setTimeSpentLoading] = useState(false);
  const [getOverTimeActivity, { isError: isErrorGetOverTimeActivity }] =
    useLazyGetOverTimeActivityQuery();

  const handleTimeSpentStats = async () => {
    setTimeSpentLoading(true);
    try {
      const response = await getOverTimeActivity(
        [
          {
            org: getTenant(),
            //@ts-ignore
            userId: getUserName(),
            startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
            endDate: dayjs().format('YYYY-MM-DD'),
            format: 'json',
          },
        ],
        true,
      );
      if (isErrorGetOverTimeActivity || isEmpty(response?.data?.data)) {
        throw new Error('Time-spent request failed or returned no data');
      }
      setTimeSpent(
        Object.entries(response?.data?.data || {})?.map(([date, seconds]) => ({
          date: dayjs(date).format('ddd DD/MM/YY'),
          minutes: dayjs.duration(seconds as number, 'seconds').asMinutes(),
        })),
      );
      setTimeSpentLoading(false);
    } catch (error) {
      console.error('Failed to load profile time spent:', error);
      setTimeSpent([]);
      setTimeSpentLoading(false);
    }
  };

  useEffect(() => {
    handleTimeSpentStats();
  }, []);

  return {
    timeSpent,
    timeSpentLoading,
  };
};
