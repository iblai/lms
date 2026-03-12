import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ReportsPage from '../page';
import '@testing-library/jest-dom';

// Mock getTenant from helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock the web-containers module
const mockUseAnalyticsSettings = vi.fn(() => ({
  usergroupIds: ['group-1', 'group-2'],
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsReports: vi.fn(({ tenantKey, selectedMentorId, usergroupIds }) => (
    <div data-testid="analytics-reports">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="selected-mentor-id">{selectedMentorId}</span>
      <span data-testid="usergroup-ids">{JSON.stringify(usergroupIds)}</span>
    </div>
  )),
  useAnalyticsSettings: () => mockUseAnalyticsSettings(),
}));

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalyticsSettings.mockReturnValue({
      usergroupIds: ['group-1', 'group-2'],
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ReportsPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsReports component', () => {
    const { getByTestId } = render(<ReportsPage />);
    expect(getByTestId('analytics-reports')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    const { getByTestId } = render(<ReportsPage />);
    expect(getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for selectedMentorId (Skills app does not use mentor)', () => {
    const { getByTestId } = render(<ReportsPage />);
    expect(getByTestId('selected-mentor-id')).toHaveTextContent('');
  });

  it('passes usergroupIds from useAnalyticsSettings', () => {
    const { getByTestId } = render(<ReportsPage />);
    expect(getByTestId('usergroup-ids')).toHaveTextContent(JSON.stringify(['group-1', 'group-2']));
  });

  it('handles empty usergroupIds', () => {
    mockUseAnalyticsSettings.mockReturnValue({
      usergroupIds: [],
    });

    const { getByTestId } = render(<ReportsPage />);
    expect(getByTestId('usergroup-ids')).toHaveTextContent('[]');
  });

  it('handles undefined usergroupIds', () => {
    mockUseAnalyticsSettings.mockReturnValue({
      usergroupIds: undefined as unknown as string[],
    });

    const { getByTestId } = render(<ReportsPage />);
    expect(getByTestId('usergroup-ids')).toHaveTextContent('');
  });
});
