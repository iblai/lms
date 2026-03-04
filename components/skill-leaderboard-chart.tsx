'use client';

import { useEffect, useState } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

// Sample data for the skill leaderboard
const skillLevels = [
  { name: 'Beginner', value: 0, description: 'basic knowledge' },
  { name: 'Novice', value: 100, description: 'limited experience' },
  { name: 'Intermediate', value: 200, description: 'practical application' },
  { name: 'Advanced', value: 300, description: 'applied theory' },
  { name: 'Expert', value: 400, description: 'recognized authority' },
];

// Generate data points for the curve
const generateCurveData = () => {
  const data = [];

  // Generate points for a smooth curve
  for (let i = 0; i <= 100; i += 5) {
    let value;
    if (i < 80) {
      // Gradual increase for most of the curve
      value = Math.pow(i, 1.5) * 3;
    } else {
      // Steeper increase at the end (expert level)
      value = Math.pow(i, 1.8) * 1.5;
    }

    // Cap at 500
    value = Math.min(value, 500);

    // Find the corresponding skill level
    let level = 'Beginner';
    let description = 'basic knowledge';

    if (i >= 80) {
      level = 'Expert';
      description = 'recognized authority';
    } else if (i >= 60) {
      level = 'Advanced';
      description = 'applied theory';
    } else if (i >= 40) {
      level = 'Intermediate';
      description = 'practical application';
    } else if (i >= 20) {
      level = 'Novice';
      description = 'limited experience';
    }

    data.push({
      percentile: i,
      value,
      level,
      description,
    });
  }

  return data;
};

// Custom tooltip component
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      percentile: number;
      value: number;
      level: string;
      description: string;
    };
  }>;
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
        <p className="text-sm font-medium">{`Level: ${payload[0].payload.level}`}</p>
        <p className="text-xs text-gray-600">{`Skill Points: ${Math.round(payload[0].value)}`}</p>
        <p className="text-xs text-gray-600">{`Percentile: ${label}%`}</p>
      </div>
    );
  }

  return null;
};

interface SkillLeaderboardChartProps {
  userSkillPoints: number;
}

export function SkillLeaderboardChart({ userSkillPoints = 0 }: SkillLeaderboardChartProps) {
  const [data, setData] = useState<
    Array<{
      percentile: number;
      value: number;
      level: string;
      description: string;
    }>
  >([]);
  const [userPosition, setUserPosition] = useState(0); // User's percentile position

  useEffect(() => {
    const skillPercentage = userSkillPoints / 500;
    if (isNaN(skillPercentage)) {
      setUserPosition(0);
    } else if (skillPercentage > 1) {
      setUserPosition(100);
    } else {
      setUserPosition(skillPercentage * 100);
    }
  }, [userSkillPoints]);

  useEffect(() => {
    setData(generateCurveData());
  }, []);

  // Find user's current level based on percentile
  const getUserLevel = () => {
    if (userPosition >= 80) return 'Expert';
    if (userPosition >= 60) return 'Advanced';
    if (userPosition >= 40) return 'Intermediate';
    if (userPosition >= 20) return 'Novice';
    return 'Beginner';
  };

  // Calculate user's skill points based on percentile
  const getUserPoints = () => {
    const userDataPoint = data.find((point) => point.percentile === userPosition) ||
      data.find((point) => point.percentile > userPosition) || {
        percentile: 0,
        value: 0,
        level: '',
        description: '',
      };
    return Math.round(userDataPoint.value);
  };

  return (
    <>
      <div className="flex justify-between mb-2 px-2">
        {skillLevels.map((level) => (
          <div key={level.name} className="text-center">
            <p className="text-xs font-medium text-gray-700">{level.name}</p>
          </div>
        ))}
      </div>

      <div className="h-[250px] sm:h-[300px] w-full overflow-x-auto">
        <div className="min-w-[600px] h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="percentile"
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                label={{
                  value: 'Global Learner Percentile',
                  position: 'bottom',
                  offset: 0,
                  dy: 30,
                }}
              />
              <YAxis
                domain={[0, 500]}
                label={{
                  value: 'Skill Points',
                  angle: -90,
                  position: 'left',
                  dx: -30,
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Highlight Expert area */}
              <ReferenceArea x1={80} x2={100} fill="rgba(248, 180, 58, 0.15)" fillOpacity={0.3} />

              {/* Skill level labels at the bottom */}
              {skillLevels.map((level, index) => (
                <ReferenceLine
                  key={level.name}
                  x={index * 20}
                  stroke="rgba(0,0,0,0.1)"
                  strokeDasharray="3 3"
                  label={{
                    value: level.description,
                    position: 'bottom',
                    fill: '#6B7280',
                    fontSize: 10,
                    dy: 15,
                  }}
                />
              ))}

              {/* User's current position */}
              <ReferenceLine
                x={userPosition}
                stroke="#F8B43A"
                strokeWidth={2}
                strokeDasharray="3 3"
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#F8B43A"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8, fill: '#F8B43A' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Your Level: <span className="font-medium text-amber-500">{getUserLevel()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Skill Points: <span className="font-medium">{getUserPoints()}</span>
          </p>
        </div>
        <div className="text-xs text-gray-500">Percentile: {userPosition}%</div>
      </div>
    </>
  );
}
