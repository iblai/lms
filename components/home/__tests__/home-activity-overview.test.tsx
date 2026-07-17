import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/components/profile-time-chart', () => ({
  ProfileTimeChart: () => <div data-testid="profile-time-chart" />,
}));

vi.mock('@/components/skeleton-activity-stat-box', () => ({
  SkeletonActivityStatBox: () => <div data-testid="skeleton-activity-stat-box" />,
}));

const mockUseProfileActivityStats = vi.fn();
vi.mock('@/hooks/profile/use-profile-activity-stats', () => ({
  useProfileActivityStats: () => mockUseProfileActivityStats(),
}));

import { HomeActivityOverview } from '../home-activity-overview';

describe('HomeActivityOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileActivityStats.mockReturnValue({ stats: [] });
  });

  it('renders the section with the time-spent chart', () => {
    render(<HomeActivityOverview />);
    expect(screen.getByRole('region', { name: 'Activity Overview' })).toBeInTheDocument();
    expect(screen.getByTestId('profile-time-chart')).toBeInTheDocument();
  });

  it('renders loaded stat tiles', () => {
    mockUseProfileActivityStats.mockReturnValue({
      stats: [
        { loading: false, label: 'Courses', value: 9 },
        { loading: false, label: 'Hours', value: 351 },
      ],
    });
    render(<HomeActivityOverview />);
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('351')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
  });

  it('hides the Points, Assessments, and Videos tiles', () => {
    mockUseProfileActivityStats.mockReturnValue({
      stats: [
        { loading: false, label: 'Points', value: 100 },
        { loading: false, label: 'Assessments', value: 2 },
        { loading: false, label: 'Videos', value: 3 },
        { loading: false, label: 'Skills', value: 4 },
      ],
    });
    render(<HomeActivityOverview />);
    expect(screen.queryByText('Points')).not.toBeInTheDocument();
    expect(screen.queryByText('Assessments')).not.toBeInTheDocument();
    expect(screen.queryByText('Videos')).not.toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('hides stat tiles whose value is zero but keeps loading skeletons', () => {
    mockUseProfileActivityStats.mockReturnValue({
      stats: [
        { loading: false, label: 'Courses', value: 5 },
        { loading: false, label: 'Programs', value: 0 },
        { loading: true, label: 'Pathways', value: 0 },
      ],
    });
    render(<HomeActivityOverview />);
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.queryByText('Programs')).not.toBeInTheDocument();
    expect(screen.getByTestId('skeleton-activity-stat-box')).toBeInTheDocument();
  });
});
