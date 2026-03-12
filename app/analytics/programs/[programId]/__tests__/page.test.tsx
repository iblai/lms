import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();
const mockUseParams = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock getTenant from helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock the web-containers module
vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsProgramDetail: vi.fn(({ tenantKey, mentorId, programId, onBack }) => (
    <div data-testid="analytics-program-detail">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="program-id">{programId}</span>
      <button data-testid="back-button" onClick={onBack}>
        Back
      </button>
    </div>
  )),
}));

import ProgramDetailPage from '../page';

describe('ProgramDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ programId: 'test-program-123' });
  });

  it('renders without crashing', () => {
    const { container } = render(<ProgramDetailPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsProgramDetail component', () => {
    render(<ProgramDetailPage />);
    expect(screen.getByTestId('analytics-program-detail')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<ProgramDetailPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for mentorId (Skills app does not use mentor)', () => {
    render(<ProgramDetailPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes programId from params', () => {
    render(<ProgramDetailPage />);
    expect(screen.getByTestId('program-id')).toHaveTextContent('test-program-123');
  });

  it('navigates to programs list when back button is clicked', () => {
    render(<ProgramDetailPage />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockPush).toHaveBeenCalledWith('/analytics/programs');
  });
});
