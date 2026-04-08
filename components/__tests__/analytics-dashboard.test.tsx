import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}));

vi.mock('recharts', () => ({
  Line: () => <div data-testid="line" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

import { AnalyticsDashboard } from '../analytics-dashboard';

describe('AnalyticsDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalyticsDashboard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders Platform Overview heading', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Platform Overview')).toBeInTheDocument();
  });

  it('renders Total Users stat card', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders Active Courses stat card', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Active Courses')).toBeInTheDocument();
  });

  it('renders Completion Rate stat card', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });

  it('renders Avg. Engagement stat card', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Avg. Engagement')).toBeInTheDocument();
  });

  it('renders stat values', () => {
    render(<AnalyticsDashboard />);
    const values245k = screen.getAllByText('245,000');
    expect(values245k.length).toBe(2); // Total Users and Active Courses
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('renders stat subtitles', () => {
    render(<AnalyticsDashboard />);
    const monthText = screen.getAllByText('+12.5% from last month');
    expect(monthText.length).toBe(2);
    expect(screen.getByText('+3% improvement')).toBeInTheDocument();
    expect(screen.getByText('Per session')).toBeInTheDocument();
  });

  it('renders User Growth chart section', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('User Growth')).toBeInTheDocument();
    expect(screen.getByText('Monthly active users over time')).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders responsive container', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
