import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('../profile-sidebar-skeletons', () => ({
  SkillsSkeleton: () => <div data-testid="skills-skeleton">Skills Loading</div>,
  CredentialsSkeleton: () => <div data-testid="credentials-skeleton">Credentials Loading</div>,
  AllTimeSkeleton: () => <div data-testid="all-time-skeleton">All Time Loading</div>,
  ProfileSectionSkeleton: () => <div data-testid="profile-skeleton">Profile Loading</div>,
}));

vi.mock('../latest-skills-box', () => ({
  LatestSkillsBox: ({ skills }: any) => (
    <div data-testid="latest-skills-box">{skills.length} skills</div>
  ),
}));

vi.mock('../credentials-list-box', () => ({
  CredentialsListBox: ({ credentials }: any) => (
    <div data-testid="credentials-list-box">{credentials.length} credentials</div>
  ),
}));

vi.mock('../all-time-perlearner-box', () => ({
  AllTimePerLearnerBox: (props: any) => (
    <div data-testid="all-time-box">All Time: {props.total_time_spent}</div>
  ),
}));

vi.mock('../user-profile-box', () => ({
  UserProfileBox: () => <div data-testid="user-profile-box">User Profile</div>,
}));

const mockUseLatestSkills = vi.fn(() => ({
  latestSkills: [{ name: 'React' }],
  latestSkillsLoading: false,
}));

const mockUseProfileCredentials = vi.fn(() => ({
  fetchedCredentials: [{ entityId: '1' }],
  isLoading: false,
}));

const mockUsePerLearnerInfoQuery = vi.fn(() => ({
  userPerLearnerInfo: {
    total_assessments: 10,
    total_time_spent: 3600,
    total_videos: 5,
    course_completions: 2,
  },
  userPerLearnerInfoLoading: false,
}));

const mockUseUserMetadata = vi.fn(() => ({
  userMetaDataLoading: false,
}));

vi.mock('@/hooks/skills/use-latest-skills', () => ({
  useLatestSkills: () => mockUseLatestSkills(),
}));

vi.mock('@/hooks/profile/use-profile-credentials', () => ({
  useProfileCredentials: () => mockUseProfileCredentials(),
}));

vi.mock('@/hooks/perlearner/use-perlearner', () => ({
  usePerLearnerInfoQuery: () => mockUsePerLearnerInfoQuery(),
}));

vi.mock('@/hooks/users/use-usermetadata', () => ({
  useUserMetadata: () => mockUseUserMetadata(),
}));

import { ProfileSidebar } from '../profile-sidebar';

describe('ProfileSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserMetadata.mockReturnValue({ userMetaDataLoading: false });
    mockUseLatestSkills.mockReturnValue({
      latestSkills: [{ name: 'React' }],
      latestSkillsLoading: false,
    });
    mockUseProfileCredentials.mockReturnValue({
      fetchedCredentials: [{ entityId: '1' }],
      isLoading: false,
    });
    mockUsePerLearnerInfoQuery.mockReturnValue({
      userPerLearnerInfo: {
        total_assessments: 10,
        total_time_spent: 3600,
        total_videos: 5,
        course_completions: 2,
      },
      userPerLearnerInfoLoading: false,
    });
  });

  it('renders without crashing', () => {
    render(<ProfileSidebar />);
    expect(screen.getByTestId('user-profile-box')).toBeInTheDocument();
  });

  it('renders all sections when data is loaded', () => {
    render(<ProfileSidebar />);
    expect(screen.getByTestId('user-profile-box')).toBeInTheDocument();
    expect(screen.getByTestId('latest-skills-box')).toBeInTheDocument();
    expect(screen.getByTestId('credentials-list-box')).toBeInTheDocument();
    expect(screen.getByTestId('all-time-box')).toBeInTheDocument();
  });

  it('shows profile skeleton when metadata is loading', () => {
    mockUseUserMetadata.mockReturnValue({ userMetaDataLoading: true });
    render(<ProfileSidebar />);
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('user-profile-box')).not.toBeInTheDocument();
  });

  it('shows skills skeleton when skills are loading', () => {
    mockUseLatestSkills.mockReturnValue({ latestSkills: [], latestSkillsLoading: true });
    render(<ProfileSidebar />);
    expect(screen.getByTestId('skills-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('latest-skills-box')).not.toBeInTheDocument();
  });

  it('shows credentials skeleton when credentials are loading', () => {
    mockUseProfileCredentials.mockReturnValue({ fetchedCredentials: [], isLoading: true });
    render(<ProfileSidebar />);
    expect(screen.getByTestId('credentials-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('credentials-list-box')).not.toBeInTheDocument();
  });

  it('shows all time skeleton when perlearner info is loading', () => {
    mockUsePerLearnerInfoQuery.mockReturnValue({
      userPerLearnerInfo: null,
      userPerLearnerInfoLoading: true,
    });
    render(<ProfileSidebar />);
    expect(screen.getByTestId('all-time-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('all-time-box')).not.toBeInTheDocument();
  });

  it('passes correct props to AllTimePerLearnerBox', () => {
    render(<ProfileSidebar />);
    expect(screen.getByText('All Time: 3600')).toBeInTheDocument();
  });

  it('defaults to 0 when perlearner info values are undefined', () => {
    mockUsePerLearnerInfoQuery.mockReturnValue({
      userPerLearnerInfo: undefined,
      userPerLearnerInfoLoading: false,
    });
    render(<ProfileSidebar />);
    expect(screen.getByText('All Time: 0')).toBeInTheDocument();
  });
});
