'use client';

import { useProfileTimeSpent } from '@/hooks/profile/use-profile-timespent';

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

export function ProfileTimeChart() {
  const { timeSpent: timeSpentData, timeSpentLoading } = useProfileTimeSpent();

  // Custom legend renderer to center the legend and use amber color
  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="flex w-full justify-center pt-0 pb-4">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="mx-2 flex items-center">
            <div className="mr-2 h-3 w-3 bg-amber-500 opacity-70"></div>
            <span className="text-xs text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-4 border-b border-gray-200 pb-2">
      {timeSpentLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="relative h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSpentData} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                axisLine={true}
                tickLine={true}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                height={50}
              />
              <YAxis
                axisLine={true}
                tickLine={true}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{
                  value: 'Minutes',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12 },
                }}
                domain={[0, 30]}
                ticks={[0, 10, 20, 30, 40, 50]}
              />
              <Legend content={renderLegend} verticalAlign="top" height={36} />
              <Bar dataKey="minutes" name="Minutes" barSize={130}>
                {timeSpentData?.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill="rgba(245, 158, 11, 0.7)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
