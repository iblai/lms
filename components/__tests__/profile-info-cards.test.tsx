import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockGetPerLearnerActivity = vi.fn();

vi.mock('@/services/perlearner', () => ({
  useGetUserPerLearnerInfoQuery: vi.fn(() => ({
    data: {
      data: {
        last_activity: '2024-06-15T10:00:00Z',
        date_joined: '2023-01-10T00:00:00Z',
        total_time_spent: 3600,
      },
    },
    isLoading: false,
  })),
  useLazyGetPerLearnerActivityQuery: vi.fn(() => [mockGetPerLearnerActivity, { isError: false }]),
}));

vi.mock('../skeleton-profile-info-card', () => ({
  SkeletonProfileInfoCard: () => <div data-testid="skeleton-info-card" />,
}));

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier} skeletons</div>
  ),
}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn((val) => !val || Object.keys(val).length === 0),
  },
}));

import { ProfileInfoCards } from '../profile-info-cards';

describe('ProfileInfoCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPerLearnerActivity.mockResolvedValue({
      data: {
        data: [
          {
            name: 'Intro to CS',
            time_invested: 1200,
            course_id: 'course-1',
            course_start: '2024-01-01',
            course_end: '2024-06-01',
            average_time_invested: 600,
            days_away: '5',
            last_access_date: '2024-06-10',
            days_accessed: 30,
          },
        ],
      },
    });
  });

  it('renders without crashing', () => {
    render(<ProfileInfoCards />);
    expect(screen.getByText('Last Accessed')).toBeInTheDocument();
  });

  it('displays Last Accessed date', () => {
    render(<ProfileInfoCards />);
    expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
  });

  it('displays Joined date', () => {
    render(<ProfileInfoCards />);
    expect(screen.getByText('Jan 10, 2023')).toBeInTheDocument();
  });

  it('displays Total Time Spent', () => {
    render(<ProfileInfoCards />);
    expect(screen.getByText('Total Time Spent')).toBeInTheDocument();
  });

  it('displays top content after fetching', async () => {
    render(<ProfileInfoCards />);
    await waitFor(() => {
      expect(screen.getByText('Top Content')).toBeInTheDocument();
      expect(screen.getByText('Intro to CS')).toBeInTheDocument();
    });
  });

  it('shows loading skeletons when loading', async () => {
    const { useGetUserPerLearnerInfoQuery } = await import('@/services/perlearner');
    vi.mocked(useGetUserPerLearnerInfoQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    render(<ProfileInfoCards />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows dash when last_activity is null', async () => {
    const { useGetUserPerLearnerInfoQuery } = await import('@/services/perlearner');
    vi.mocked(useGetUserPerLearnerInfoQuery).mockReturnValue({
      data: { data: { last_activity: null, date_joined: null, total_time_spent: null } },
      isLoading: false,
    } as any);
    render(<ProfileInfoCards />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('handles activity fetch error', async () => {
    mockGetPerLearnerActivity.mockRejectedValue(new Error('fail'));
    render(<ProfileInfoCards />);
    await waitFor(() => {
      expect(screen.getByText('Top Content')).toBeInTheDocument();
    });
  });
});
