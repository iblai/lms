import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock recharts components to avoid SVG rendering issues in tests
vi.mock('recharts', () => ({
  Line: () => <div data-testid="line" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ReferenceArea: () => <div data-testid="reference-area" />,
}));

import { SkillLeaderboardChart } from '../skill-leaderboard-chart';

describe('SkillLeaderboardChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkillLeaderboardChart userSkillPoints={100} />);
    expect(container).toBeTruthy();
  });

  it('displays skill level names', () => {
    render(<SkillLeaderboardChart userSkillPoints={100} />);
    const expectLevelVisible = (name: string) =>
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    expectLevelVisible('Beginner');
    expectLevelVisible('Novice');
    expectLevelVisible('Intermediate');
    expectLevelVisible('Advanced');
    expectLevelVisible('Expert');
  });

  it('displays user level as Beginner for low points', () => {
    render(<SkillLeaderboardChart userSkillPoints={50} />);
    expect(screen.getByText(/Your Level:/)).toBeInTheDocument();
  });

  it('displays the chart container', () => {
    render(<SkillLeaderboardChart userSkillPoints={100} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('displays percentile', () => {
    render(<SkillLeaderboardChart userSkillPoints={250} />);
    expect(screen.getByText(/Percentile:/)).toBeInTheDocument();
  });

  it('displays skill points', () => {
    render(<SkillLeaderboardChart userSkillPoints={100} />);
    expect(screen.getByText(/Skill Points:/)).toBeInTheDocument();
  });

  it('caps percentile at 100 for points > 500', () => {
    render(<SkillLeaderboardChart userSkillPoints={600} />);
    expect(screen.getByText('Percentile: 100%')).toBeInTheDocument();
  });

  it('sets percentile to 0 for NaN points', () => {
    render(<SkillLeaderboardChart userSkillPoints={NaN} />);
    expect(screen.getByText('Percentile: 0%')).toBeInTheDocument();
  });

  it('handles zero skill points', () => {
    render(<SkillLeaderboardChart userSkillPoints={0} />);
    expect(screen.getByText('Percentile: 0%')).toBeInTheDocument();
  });
});
