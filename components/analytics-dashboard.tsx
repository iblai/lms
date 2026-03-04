'use client';

import type React from 'react';

import { CircleUser, FileText, Sparkles, Clock } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const userGrowthData = [
  { month: 'Jan', value: 5 },
  { month: 'Feb', value: 20 },
  { month: 'Mar', value: 18 },
  { month: 'Apr', value: 15 },
  { month: 'May', value: 25 },
  { month: 'Jun', value: 40 },
  { month: 'Jul', value: 35 },
  { month: 'Aug', value: 20 },
  { month: 'Sep', value: 12 },
  { month: 'Oct', value: 35 },
];

// Stat card component with simplified design
function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-3xl font-semibold text-gray-800 my-1">{value}</p>
          <p className="text-xs text-amber-600">{subtitle}</p>
        </div>
        <div className="text-amber-500">{icon}</div>
      </div>
    </div>
  );
}

// Analytics Dashboard component
export function AnalyticsDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Platform Overview</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StatCard
          title="Total Users"
          value="245,000"
          subtitle="+12.5% from last month"
          icon={<CircleUser className="h-5 w-5" />}
        />
        <StatCard
          title="Active Courses"
          value="245,000"
          subtitle="+12.5% from last month"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Completion Rate"
          value="78%"
          subtitle="+3% improvement"
          icon={<Sparkles className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. Engagement"
          value="45 min"
          subtitle="Per session"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* User Growth Chart */}
      <div className="rounded-lg border border-gray-200 p-6 bg-white">
        <h2 className="text-base font-medium text-gray-800 mb-1">User Growth</h2>
        <p className="text-xs text-gray-500 mb-4">Monthly active users over time</p>
        <div className="h-[300px] w-full">
          <ChartContainer
            config={{
              value: {
                label: 'Active Users',
                color: 'hsl(43, 93%, 60%)',
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={true}
                  horizontal={true}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 80]}
                  ticks={[0, 20, 40, 60, 80]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#F8B43A"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#F8B43A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
