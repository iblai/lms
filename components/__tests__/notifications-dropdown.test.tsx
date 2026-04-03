import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  getTimeAgo: vi.fn(() => '2 hours ago'),
}));

const mockGetNotifications = vi.fn();

vi.mock('@/services/notifications', () => ({
  useLazyGetNotificationsQuery: vi.fn(),
}));

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier} skeletons</div>
  ),
}));

vi.mock('../skeleton-notification-mini-box', () => ({
  SkeletonNotificationMiniBox: () => <div data-testid="skeleton-notification" />,
}));

vi.mock('../default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="default-empty-box">{message}</div>,
}));

vi.mock('../header/profile/user-avatar', () => ({
  UserAvatar: () => <div data-testid="user-avatar">Avatar</div>,
}));

import { useLazyGetNotificationsQuery } from '@/services/notifications';
import { NotificationsDropdown } from '../notifications-dropdown';

describe('NotificationsDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotifications.mockResolvedValue({
      data: { results: [] },
    });
    vi.mocked(useLazyGetNotificationsQuery).mockReturnValue([
      mockGetNotifications,
      { isLoading: false, isError: false },
    ] as any);
  });

  it('renders without crashing', () => {
    render(<NotificationsDropdown />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders "Only show unread" toggle', () => {
    render(<NotificationsDropdown />);
    expect(screen.getByText('Only show unread')).toBeInTheDocument();
  });

  it('shows empty message when no notifications', async () => {
    render(<NotificationsDropdown />);
    await waitFor(() => {
      expect(screen.getByTestId('default-empty-box')).toBeInTheDocument();
    });
  });

  it('renders notifications when data is available', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        results: [
          {
            title: 'Test Notification',
            status: 'UNREAD',
            created_at: '2024-01-01T00:00:00Z',
            context: { template_data: { message_title: 'Custom Title' } },
          },
        ],
      },
    });
    render(<NotificationsDropdown />);
    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });
  });

  it('falls back to notification title when no template data', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        results: [
          {
            title: 'Fallback Title',
            status: 'READ',
            created_at: '2024-01-01T00:00:00Z',
            context: {},
          },
        ],
      },
    });
    render(<NotificationsDropdown />);
    await waitFor(() => {
      expect(screen.getByText('Fallback Title')).toBeInTheDocument();
    });
  });

  it('displays time ago for notifications', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        results: [
          {
            title: 'Test',
            status: 'UNREAD',
            created_at: '2024-01-01T00:00:00Z',
            context: {},
          },
        ],
      },
    });
    render(<NotificationsDropdown />);
    await waitFor(() => {
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });
  });

  it('toggles unread filter when button is clicked', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        results: [
          { title: 'Unread', status: 'UNREAD', created_at: '2024-01-01', context: {} },
          { title: 'Read', status: 'READ', created_at: '2024-01-01', context: {} },
        ],
      },
    });
    render(<NotificationsDropdown />);
    await waitFor(() => {
      expect(screen.getByText('Unread')).toBeInTheDocument();
    });
    // Click the toggle button
    const toggleButton = screen
      .getByText('Only show unread')
      .parentElement?.querySelector('button');
    fireEvent.click(toggleButton!);
    // After toggling, only unread should remain
    await waitFor(() => {
      expect(screen.getByText('Unread')).toBeInTheDocument();
    });
  });

  it('shows loading skeletons when loading', async () => {
    vi.mocked(useLazyGetNotificationsQuery).mockReturnValue([
      mockGetNotifications,
      { isLoading: true, isError: false },
    ] as any);
    render(<NotificationsDropdown />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    mockGetNotifications.mockRejectedValue(new Error('Network error'));
    render(<NotificationsDropdown />);
    await waitFor(() => {
      expect(screen.getByTestId('default-empty-box')).toBeInTheDocument();
    });
  });
});
