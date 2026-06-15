import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import AuditPage from '../page';
import { AnalyticsAuditLogStats } from '@iblai/iblai-js/web-containers';
import '@testing-library/jest-dom';

// Mock getTenant and getUserName from helpers
const mockGetUserName = vi.fn((): string | null => 'test-user');

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: () => mockGetUserName(),
}));

// Mock the web-containers module
vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsAuditLogStats: vi.fn(({ tenantKey, mentorId, userId, selectedMentorId }) => (
    <div data-testid="analytics-audit-log-stats">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="user-id">{userId}</span>
      <span data-testid="selected-mentor-id">{selectedMentorId}</span>
    </div>
  )),
}));

describe('AuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserName.mockReturnValue('test-user');
  });

  it('renders without crashing', () => {
    const { container } = render(<AuditPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsAuditLogStats component', () => {
    const { getByTestId } = render(<AuditPage />);
    expect(getByTestId('analytics-audit-log-stats')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    const { getByTestId } = render(<AuditPage />);
    expect(getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for mentorId and selectedMentorId (Skills app does not use mentor)', () => {
    render(<AuditPage />);
    expect(AnalyticsAuditLogStats).toHaveBeenCalledWith(
      expect.objectContaining({ mentorId: '', selectedMentorId: '' }),
      undefined,
    );
  });

  it('passes the username from getUserName as userId', () => {
    render(<AuditPage />);
    expect(AnalyticsAuditLogStats).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'test-user' }),
      undefined,
    );
  });

  it('falls back to empty string when username is null', () => {
    mockGetUserName.mockReturnValue(null);

    render(<AuditPage />);
    expect(AnalyticsAuditLogStats).toHaveBeenCalledWith(
      expect.objectContaining({ userId: '' }),
      undefined,
    );
  });
});
