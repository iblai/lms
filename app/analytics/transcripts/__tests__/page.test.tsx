import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsTranscriptsStats: vi.fn(({ tenantKey, mentorId, usergroupIds }) => (
    <div data-testid="analytics-transcripts-stats">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="usergroup-ids">{JSON.stringify(usergroupIds)}</span>
    </div>
  )),
  useAnalyticsSettings: vi.fn(() => ({ usergroupIds: ['group1'] })),
}));

import TranscriptsPage from '../page';

describe('TranscriptsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<TranscriptsPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsTranscriptsStats component', () => {
    render(<TranscriptsPage />);
    expect(screen.getByTestId('analytics-transcripts-stats')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<TranscriptsPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for mentorId', () => {
    render(<TranscriptsPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes usergroupIds from useAnalyticsSettings', () => {
    render(<TranscriptsPage />);
    expect(screen.getByTestId('usergroup-ids')).toHaveTextContent(JSON.stringify(['group1']));
  });
});
