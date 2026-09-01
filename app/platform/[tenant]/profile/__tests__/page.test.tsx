import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

// Mock useProfileActivityStats
vi.mock('@/hooks/profile/use-profile-activity-stats', () => ({
  useProfileActivityStats: vi.fn(() => ({
    stats: [],
  })),
}));

// Mock useTenantMetadata
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isSkillsLeaderBoardEnabled: vi.fn(() => false),
  })),
}));

// Mock useGetUserMetadataQuery
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserMetadataQuery: vi.fn(() => ({
    data: { enable_skills_leaderboard_display: true },
    isLoading: false,
  })),
}));

// Mock ProfileTimeChart
vi.mock('@/components/profile-time-chart', () => ({
  ProfileTimeChart: () => <div data-testid="profile-time-chart">ProfileTimeChart</div>,
}));

// Mock ProfileInfoCards
vi.mock('@/components/profile-info-cards', () => ({
  ProfileInfoCards: () => <div data-testid="profile-info-cards">ProfileInfoCards</div>,
}));

// Mock SkillLeaderboardChart
vi.mock('@/components/skill-leaderboard-chart', () => ({
  SkillLeaderboardChart: ({ userSkillPoints }: any) => (
    <div data-testid="skill-leaderboard-chart" data-points={userSkillPoints}>
      SkillLeaderboardChart
    </div>
  ),
}));

// Mock SkeletonActivityStatBox
vi.mock('@/components/skeleton-activity-stat-box', () => ({
  SkeletonActivityStatBox: () => <div data-testid="skeleton-activity-stat-box">Loading...</div>,
}));

import ProfilePage from '../page';
import { useProfileActivityStats } from '@/hooks/profile/use-profile-activity-stats';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [],
    } as any);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => false),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_skills_leaderboard_display: true },
      isLoading: false,
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(<ProfilePage />);
    expect(container).toBeTruthy();
  });

  it('renders Activity Overview section', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Activity Overview')).toBeInTheDocument();
  });

  it('renders Time Spent section with ProfileTimeChart', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Time Spent')).toBeInTheDocument();
    expect(screen.getByTestId('profile-time-chart')).toBeInTheDocument();
  });

  it('renders Profile Information section with ProfileInfoCards', () => {
    render(<ProfilePage />);
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByTestId('profile-info-cards')).toBeInTheDocument();
  });

  it('renders SkeletonActivityStatBox when a stat is loading', () => {
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [{ loading: true, label: 'Courses', value: 0 }],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByTestId('skeleton-activity-stat-box')).toBeInTheDocument();
  });

  it('renders stat boxes when stats are not loading', () => {
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [
        { loading: false, label: 'Courses', value: 5 },
        { loading: false, label: 'Skills', value: 100 },
      ],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('hides stat tiles whose value is zero', () => {
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [
        { loading: false, label: 'Courses', value: 5 },
        { loading: false, label: 'Programs', value: 0 },
        { loading: true, label: 'Pathways', value: 0 },
      ],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.queryByText('Programs')).not.toBeInTheDocument();
    // Still-loading stats keep their skeleton even at value 0.
    expect(screen.getByTestId('skeleton-activity-stat-box')).toBeInTheDocument();
  });

  it('hides the Points, Assessments, and Videos stat tiles', () => {
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [
        { loading: false, label: 'Courses', value: 5 },
        { loading: false, label: 'Points', value: 100 },
        { loading: false, label: 'Assessments', value: 2 },
        { loading: false, label: 'Videos', value: 3 },
      ],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.queryByText('Points')).not.toBeInTheDocument();
    expect(screen.queryByText('Assessments')).not.toBeInTheDocument();
    expect(screen.queryByText('Videos')).not.toBeInTheDocument();
  });

  it('renders mix of loading and non-loading stats', () => {
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [
        { loading: true, label: 'Courses', value: 0 },
        { loading: false, label: 'Skills', value: 50 },
      ],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByTestId('skeleton-activity-stat-box')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('hides SkillLeaderboardChart when metadataLoaded is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: false,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);

    render(<ProfilePage />);

    expect(screen.queryByTestId('skill-leaderboard-chart')).not.toBeInTheDocument();
  });

  it('hides SkillLeaderboardChart when isSkillsLeaderBoardEnabled returns false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => false),
    } as any);

    render(<ProfilePage />);

    expect(screen.queryByTestId('skill-leaderboard-chart')).not.toBeInTheDocument();
  });

  it('hides SkillLeaderboardChart when userMetadata is loading', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<ProfilePage />);

    expect(screen.queryByTestId('skill-leaderboard-chart')).not.toBeInTheDocument();
  });

  it('hides SkillLeaderboardChart when enable_skills_leaderboard_display is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_skills_leaderboard_display: false },
      isLoading: false,
    } as any);

    render(<ProfilePage />);

    expect(screen.queryByTestId('skill-leaderboard-chart')).not.toBeInTheDocument();
  });

  it('shows SkillLeaderboardChart when all conditions met', async () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_skills_leaderboard_display: true },
      isLoading: false,
    } as any);

    render(<ProfilePage />);

    // SkillLeaderboardChart is lazy-loaded via next/dynamic (recharts).
    expect(await screen.findByTestId('skill-leaderboard-chart')).toBeInTheDocument();
    expect(screen.getByText('Skill Leaderboard')).toBeInTheDocument();
  });

  it('passes correct userSkillPoints to SkillLeaderboardChart', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_skills_leaderboard_display: true },
      isLoading: false,
    } as any);
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [{ loading: false, label: 'Points', value: 250 }],
    } as any);

    render(<ProfilePage />);

    const chart = screen.getByTestId('skill-leaderboard-chart');
    expect(chart).toHaveAttribute('data-points', '250');
  });

  it('passes 0 as userSkillPoints when no Points stat found', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_skills_leaderboard_display: true },
      isLoading: false,
    } as any);
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [{ loading: false, label: 'Courses', value: 10 }],
    } as any);

    render(<ProfilePage />);

    const chart = screen.getByTestId('skill-leaderboard-chart');
    expect(chart).toHaveAttribute('data-points', '0');
  });

  it('shows SkillLeaderboardChart when enable_skills_leaderboard_display is undefined', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: {},
      isLoading: false,
    } as any);

    render(<ProfilePage />);

    // enable_skills_leaderboard_display is undefined, not false - should show chart
    expect(screen.getByTestId('skill-leaderboard-chart')).toBeInTheDocument();
  });
});
