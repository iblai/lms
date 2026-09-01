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

// Captures the props recharts components receive so tests can exercise
// the tickFormatter / tooltip formatter callbacks directly.
const capturedProps = vi.hoisted(() => ({ xAxis: null as any, tooltip: null as any }));

vi.mock('recharts', () => ({
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  XAxis: (props: any) => {
    capturedProps.xAxis = props;
    return <div data-testid="x-axis" />;
  },
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: (props: any) => {
    capturedProps.tooltip = props;
    return <div data-testid="tooltip" />;
  },
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

  it('formats X axis ticks to just the day ("Tue 08/07/26" → "Tue")', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Tue 08/07/26', minutes: 10 }],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    expect(capturedProps.xAxis.tickFormatter('Tue 08/07/26')).toBe('Tue');
  });

  it('formats tooltip values in plain words for minutes-only durations', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Mon 06/07/26', minutes: 45 }],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    expect(capturedProps.tooltip.formatter(45)).toEqual(['45m', 'Time spent']);
  });

  it('formats tooltip values for whole-hour durations', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Mon 06/07/26', minutes: 120 }],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    expect(capturedProps.tooltip.formatter(120)).toEqual(['2h', 'Time spent']);
  });

  it('formats tooltip values for mixed hour-and-minute durations', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Mon 06/07/26', minutes: 80 }],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    expect(capturedProps.tooltip.formatter(80)).toEqual(['1h 20m', 'Time spent']);
  });

  it('shows "No activity" in the tooltip for zero or sub-minute values', () => {
    mockUseProfileTimeSpent.mockReturnValue({
      timeSpent: [{ date: 'Mon 06/07/26', minutes: 0 }],
      timeSpentLoading: false,
    });
    render(<ProfileTimeChart />);
    expect(capturedProps.tooltip.formatter(0)).toEqual(['No activity', 'Time spent']);
    expect(capturedProps.tooltip.formatter(0.5)).toEqual(['No activity', 'Time spent']);
  });
});
