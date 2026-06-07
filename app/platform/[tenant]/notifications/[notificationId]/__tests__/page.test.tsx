import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock rbac feature
vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(() => ['perm-1', 'perm-2']),
}));

// Mock redux hooks
vi.mock('@/lib/hooks', () => ({
  useAppSelector: vi.fn((selector: any) => selector()),
}));

// Mock RTK query hook
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: true },
  })),
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
}));

// Mock useTenantParam
vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: vi.fn(() => 'test-tenant'),
}));

// Mock NotificationDisplay container
vi.mock('@iblai/iblai-js/web-containers', () => ({
  NotificationDisplay: vi.fn(
    ({ org, userId, isAdmin, rbacPermissions, selectedNotificationId }) => (
      <div data-testid="notification-display">
        <span data-testid="org">{org}</span>
        <span data-testid="user-id">{userId}</span>
        <span data-testid="is-admin">{String(isAdmin)}</span>
        <span data-testid="rbac">{JSON.stringify(rbacPermissions)}</span>
        <span data-testid="selected-id">{selectedNotificationId}</span>
      </div>
    ),
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ notificationId: 'notif-123' })),
}));

import NotificationsPage from '../page';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useParams } from 'next/navigation';

describe('NotificationsPage ([notificationId])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);
    vi.mocked(useParams).mockReturnValue({ notificationId: 'notif-123' } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(<NotificationsPage />);
    expect(container).toBeTruthy();
  });

  it('renders the NotificationDisplay component', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('notification-display')).toBeInTheDocument();
  });

  it('passes the tenant as org', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('org')).toHaveTextContent('test-tenant');
  });

  it('passes the username as userId', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user');
  });

  it('passes is_platform_admin as isAdmin', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
  });

  it('passes rbac permissions', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('rbac')).toHaveTextContent(JSON.stringify(['perm-1', 'perm-2']));
  });

  it('passes the notificationId param as selectedNotificationId', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('selected-id')).toHaveTextContent('notif-123');
  });

  it('handles undefined departmentMemberCheck data (optional chaining branch)', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: undefined,
    } as any);
    render(<NotificationsPage />);
    expect(screen.getByTestId('is-admin')).toHaveTextContent('undefined');
  });

  it('calls the department member check query with the tenant platform_key', () => {
    render(<NotificationsPage />);
    expect(useGetDepartmentMemberCheckQuery).toHaveBeenCalledWith({
      platform_key: 'test-tenant',
    });
  });
});
