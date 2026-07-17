'use client';

import { useProfileTimeSpent } from '@/hooks/profile/use-profile-timespent';

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
  Tooltip,
} from 'recharts';

/** Minutes → plain words ("45m", "7h", "7h 20m"). Empty for no activity. */
const formatDuration = (minutes: number): string => {
  if (!minutes || minutes < 1) return '';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Daily learning time, kept deliberately un-scientific: no axes, grid or
 * legend — just soft bars with the day underneath and the time spent in
 * plain words on top.
 */
export function ProfileTimeChart({
  chartHeight = 256,
}: {
  /** Chart area height in px — the home page passes a compact one. */
  chartHeight?: number;
} = {}) {
  const { timeSpent: timeSpentData, timeSpentLoading } = useProfileTimeSpent();

  return (
    <div className="mb-4 border-b border-gray-200 pb-2">
      {timeSpentLoading ? (
        <div className="flex items-center justify-center" style={{ height: chartHeight }}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="relative" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSpentData} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                // "Tue 08/07/26" → "Tue"
                tickFormatter={(date: string) => String(date).split(' ')[0]}
              />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                formatter={(value) => [
                  formatDuration(Number(value)) || 'No activity',
                  'Time spent',
                ]}
              />
              <Bar dataKey="minutes" name="Time spent" radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="minutes"
                  position="top"
                  formatter={(value: number) => formatDuration(value)}
                  style={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                />
                {timeSpentData?.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill="rgba(59, 130, 246, 0.7)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
