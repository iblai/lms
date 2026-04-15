import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  ProfileTimeChart: () => <div data-testid="profile-time-chart">ProfileTimeChart</div>,
  SkillLeaderboardChart: ({ userSkillPoints }: any) => (
    <div data-testid="skill-leaderboard-chart" data-points={userSkillPoints}>
      SkillLeaderboardChart
    </div>
  ),
  SkeletonActivityStatBox: () => <div data-testid="skeleton-activity-stat-box">Loading...</div>,
  useProfileActivityStats: vi.fn(() => ({ stats: [] })),
  useProfileTimeSpent: vi.fn(() => ({ timeSpent: [], timeSpentLoading: false })),
  useUserMetadata: vi.fn(() => ({
    userMetaData: { enable_skills_leaderboard_display: true },
    userMetaDataLoading: false,
  })),
}));

vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  ProfileInfoCards: () => <div data-testid="profile-info-cards">ProfileInfoCards</div>,
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isSkillsLeaderBoardEnabled: vi.fn(() => false),
  })),
}));

vi.mock('@/services/perlearner', () => ({
  useGetUserPerLearnerInfoQuery: vi.fn(() => ({ data: null, isLoading: false })),
  useLazyGetPerLearnerActivityQuery: vi.fn(() => [vi.fn(() => Promise.resolve({ data: {} }))]),
}));

import ProfilePage from '../page';
import { useProfileActivityStats, useUserMetadata } from '@iblai/iblai-js/web-containers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

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
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: { enable_skills_leaderboard_display: true },
      userMetaDataLoading: false,
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
        { loading: false, label: 'Points', value: 100 },
      ],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders mix of loading and non-loading stats', () => {
    vi.mocked(useProfileActivityStats).mockReturnValue({
      stats: [
        { loading: true, label: 'Courses', value: 0 },
        { loading: false, label: 'Points', value: 50 },
      ],
    } as any);

    render(<ProfilePage />);

    expect(screen.getByTestId('skeleton-activity-stat-box')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
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
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: undefined,
      userMetaDataLoading: true,
    } as any);

    render(<ProfilePage />);

    expect(screen.queryByTestId('skill-leaderboard-chart')).not.toBeInTheDocument();
  });

  it('hides SkillLeaderboardChart when enable_skills_leaderboard_display is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: { enable_skills_leaderboard_display: false },
      userMetaDataLoading: false,
    } as any);

    render(<ProfilePage />);

    expect(screen.queryByTestId('skill-leaderboard-chart')).not.toBeInTheDocument();
  });

  it('shows SkillLeaderboardChart when all conditions met', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: { enable_skills_leaderboard_display: true },
      userMetaDataLoading: false,
    } as any);

    render(<ProfilePage />);

    expect(screen.getByTestId('skill-leaderboard-chart')).toBeInTheDocument();
    expect(screen.getByText('Skill Leaderboard')).toBeInTheDocument();
  });

  it('passes correct userSkillPoints to SkillLeaderboardChart', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsLeaderBoardEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: { enable_skills_leaderboard_display: true },
      userMetaDataLoading: false,
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
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: { enable_skills_leaderboard_display: true },
      userMetaDataLoading: false,
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
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: {},
      userMetaDataLoading: false,
    } as any);

    render(<ProfilePage />);

    expect(screen.getByTestId('skill-leaderboard-chart')).toBeInTheDocument();
  });
});
