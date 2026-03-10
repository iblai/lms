import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock getTenant from helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock the web-containers module
vi.mock('@iblai/web-containers', () => ({
  AnalyticsPrograms: vi.fn(({ tenantKey, mentorId, basePath }) => (
    <div data-testid="analytics-programs">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="base-path">{basePath}</span>
    </div>
  )),
}));

import ProgramsPage from '../page';

describe('ProgramsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ProgramsPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsPrograms component', () => {
    render(<ProgramsPage />);
    expect(screen.getByTestId('analytics-programs')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<ProgramsPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for mentorId (Skills app does not use mentor)', () => {
    render(<ProgramsPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes correct basePath', () => {
    render(<ProgramsPage />);
    expect(screen.getByTestId('base-path')).toHaveTextContent('/analytics');
  });
});
