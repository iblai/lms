import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsUsersStats: vi.fn(({ tenantKey, mentorId, usergroupIds }) => (
    <div data-testid="analytics-users-stats">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="usergroup-ids">{JSON.stringify(usergroupIds)}</span>
    </div>
  )),
  useAnalyticsSettings: vi.fn(() => ({ usergroupIds: ['group1'] })),
}));

import UsersPage from '../page';

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<UsersPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsUsersStats component', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('analytics-users-stats')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for mentorId', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes usergroupIds from useAnalyticsSettings', () => {
    render(<UsersPage />);
    expect(screen.getByTestId('usergroup-ids')).toHaveTextContent(JSON.stringify(['group1']));
  });
});
