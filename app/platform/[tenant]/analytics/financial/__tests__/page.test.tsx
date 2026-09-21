import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock appName from config
const mockAppName = vi.fn((): string => 'skills');

vi.mock('@/lib/config', () => ({
  config: { settings: { appName: () => mockAppName() } },
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsFinancialStats: vi.fn(({ tenantKey, currentSPA, mentorId, usergroupIds }) => (
    <div data-testid="analytics-financial-stats">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="current-spa">{currentSPA}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="usergroup-ids">{JSON.stringify(usergroupIds)}</span>
    </div>
  )),
  useAnalyticsSettings: vi.fn(() => ({ usergroupIds: ['group1'] })),
}));

import FinancialPage from '../page';

describe('FinancialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppName.mockReturnValue('skills');
  });

  it('renders without crashing', () => {
    const { container } = render(<FinancialPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsFinancialStats component', () => {
    render(<FinancialPage />);
    expect(screen.getByTestId('analytics-financial-stats')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<FinancialPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes the configured app name as currentSPA', () => {
    mockAppName.mockReturnValue('custom-spa');

    render(<FinancialPage />);
    expect(screen.getByTestId('current-spa')).toHaveTextContent('custom-spa');
  });

  it("falls back to 'skills' for currentSPA when no app name is configured", () => {
    mockAppName.mockReturnValue('');

    render(<FinancialPage />);
    expect(screen.getByTestId('current-spa')).toHaveTextContent('skills');
  });

  it('passes empty string for mentorId', () => {
    render(<FinancialPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes usergroupIds from useAnalyticsSettings', () => {
    render(<FinancialPage />);
    expect(screen.getByTestId('usergroup-ids')).toHaveTextContent(JSON.stringify(['group1']));
  });
});
