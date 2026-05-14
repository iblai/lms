import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsMonetizationStats: vi.fn(({ tenantKey, mentorId, usergroupIds }) => (
    <div data-testid="analytics-monetization-stats">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="usergroup-ids">{JSON.stringify(usergroupIds)}</span>
    </div>
  )),
  useAnalyticsSettings: vi.fn(() => ({ usergroupIds: ['group1', 'group2'] })),
}));

import MonetizationPage from '../page';

describe('MonetizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<MonetizationPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsMonetizationStats component', () => {
    render(<MonetizationPage />);
    expect(screen.getByTestId('analytics-monetization-stats')).toBeInTheDocument();
  });

  it('passes the tenantKey from getTenant', () => {
    render(<MonetizationPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes an empty mentorId', () => {
    render(<MonetizationPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes usergroupIds from useAnalyticsSettings', () => {
    render(<MonetizationPage />);
    expect(screen.getByTestId('usergroup-ids')).toHaveTextContent(
      JSON.stringify(['group1', 'group2']),
    );
  });
});
