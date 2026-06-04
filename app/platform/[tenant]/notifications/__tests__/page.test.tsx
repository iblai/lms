import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: vi.fn(() => 'test-tenant'),
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: vi.fn(() => ({ canView: true })),
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(),
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: true },
  })),
}));

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      enableRBAC: vi.fn(() => true),
    },
  },
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  NotificationDisplay: vi.fn(({ org, userId, isAdmin, enableRbac, rbacPermissions }) => (
    <div data-testid="notification-display">
      <span data-testid="org">{org}</span>
      <span data-testid="user-id">{userId}</span>
      <span data-testid="is-admin">{String(isAdmin)}</span>
      <span data-testid="enable-rbac">{String(enableRbac)}</span>
      <span data-testid="rbac-permissions">{JSON.stringify(rbacPermissions)}</span>
    </div>
  )),
}));

import NotificationsPage from '../page';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useAppSelector } from '@/lib/hooks';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getUserName } from '@/utils/helpers';
import { config } from '@/lib/config';

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTenantParam).mockReturnValue('test-tenant');
    vi.mocked(useAppSelector).mockReturnValue({ canView: true });
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);
    vi.mocked(getUserName).mockReturnValue('test-user');
    vi.mocked(config.settings.enableRBAC).mockReturnValue(true as any);
  });

  it('renders without crashing', () => {
    const { container } = render(<NotificationsPage />);
    expect(container).toBeTruthy();
  });

  it('renders the NotificationDisplay component', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('notification-display')).toBeInTheDocument();
  });

  it('passes tenant as org from useTenantParam', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('org')).toHaveTextContent('test-tenant');
  });

  it('queries department member check with the tenant platform_key', () => {
    render(<NotificationsPage />);
    expect(useGetDepartmentMemberCheckQuery).toHaveBeenCalledWith({
      platform_key: 'test-tenant',
    });
  });

  it('passes userId from getUserName', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user');
  });

  it('passes isAdmin from departmentMemberCheck.is_platform_admin', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
  });

  it('passes enableRbac from config.settings.enableRBAC', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('enable-rbac')).toHaveTextContent('true');
  });

  it('passes rbacPermissions from useAppSelector', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('rbac-permissions')).toHaveTextContent(
      JSON.stringify({ canView: true }),
    );
  });

  it('handles undefined departmentMemberCheck data gracefully', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: undefined,
    } as any);
    render(<NotificationsPage />);
    // isAdmin should be undefined -> rendered as "undefined"
    expect(screen.getByTestId('is-admin')).toHaveTextContent('undefined');
  });

  it('passes isAdmin false when not a platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);
    render(<NotificationsPage />);
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
  });

  it('passes enableRbac false when RBAC is disabled', () => {
    vi.mocked(config.settings.enableRBAC).mockReturnValue(false as any);
    render(<NotificationsPage />);
    expect(screen.getByTestId('enable-rbac')).toHaveTextContent('false');
  });
});
