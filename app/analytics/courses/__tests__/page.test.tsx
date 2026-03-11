import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock getTenant from helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock the web-containers module
vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsCourses: vi.fn(({ tenantKey, mentorId, basePath }) => (
    <div data-testid="analytics-courses">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="base-path">{basePath}</span>
    </div>
  )),
}));

import CoursesPage from '../page';

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<CoursesPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsCourses component', () => {
    render(<CoursesPage />);
    expect(screen.getByTestId('analytics-courses')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<CoursesPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes empty string for mentorId (Skills app does not use mentor)', () => {
    render(<CoursesPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes correct basePath', () => {
    render(<CoursesPage />);
    expect(screen.getByTestId('base-path')).toHaveTextContent('/analytics');
  });
});
