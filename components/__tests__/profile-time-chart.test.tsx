import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockUseProfileTimeSpent = vi.fn(() => ({
  timeSpent: [
    { date: 'Mon 06/07/26', minutes: 10 },
    { date: 'Tue 07/07/26', minutes: 20 },
  ],
  timeSpentLoading: false,
}));

vi.mock('@/hooks/profile/use-profile-timespent', () => ({
  useProfileTimeSpent: () => mockUseProfileTimeSpent(),
}));

vi.mock('recharts', () => ({
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  LabelList: ({ formatter }: any) => (
    <div data-testid="label-list">{formatter ? formatter(80) : null}</div>
  ),
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
}));

import { ProfileTimeChart } from '../profile-time-chart';

describe('ProfileTimeChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProfileTimeChart />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [],
      timeSpentLoading: true,
    });
    const { container } = render(<ProfileTimeChart />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders chart components when data is loaded', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Mon 06/07/26', minutes: 10 }],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('labels bars with plain-words durations (1h 20m)', () => {
    render(<ProfileTimeChart />);
    // The LabelList formatter turns 80 minutes into "1h 20m".
    expect(screen.getByTestId('label-list')).toHaveTextContent('1h 20m');
  });

  it('renders cells for each data point', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [
        { date: 'Mon 06/07/26', minutes: 10 },
        { date: 'Tue 07/07/26', minutes: 20 },
      ],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    const cells = screen.getAllByTestId('cell');
    expect(cells.length).toBe(2);
  });

  it('does not show spinner when data is loaded', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Mon 06/07/26', minutes: 10 }],
      timeSpentLoading: false,
    });
    const { container } = render(<ProfileTimeChart />);
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });
});
