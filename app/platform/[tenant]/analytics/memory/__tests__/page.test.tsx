import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseParams = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'stored-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsMemoryStats: vi.fn(({ tenantKey, mentorId, userId }) => (
    <div data-testid="analytics-memory-stats">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="user-id">{userId}</span>
    </div>
  )),
}));

const MemoryPageModule = await import('../page');
const MemoryPage = MemoryPageModule.default;

describe('MemoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ tenant: 'test-tenant' });
  });

  it('should export dynamic config', () => {
    expect(MemoryPageModule.dynamic).toBe('force-dynamic');
  });

  it('renders the AnalyticsMemoryStats component', () => {
    render(<MemoryPage />);
    expect(screen.getByTestId('analytics-memory-stats')).toBeInTheDocument();
  });

  it('passes the tenantKey from the URL param', () => {
    render(<MemoryPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('falls back to the stored tenant when the URL param is absent', () => {
    mockUseParams.mockReturnValue({});
    render(<MemoryPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('stored-tenant');
  });

  it('passes the userId from getUserName', () => {
    render(<MemoryPage />);
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user');
  });

  it('passes empty string for mentorId', () => {
    render(<MemoryPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });
});
