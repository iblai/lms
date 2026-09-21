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

// Mock appName from config
const mockAppName = vi.fn((): string => 'skills');

vi.mock('@/lib/config', () => ({
  config: { settings: { appName: () => mockAppName() } },
}));

// Mock the web-containers module
vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsCourseDetail: vi.fn(({ tenantKey, currentSPA, mentorId, courseId, onBack }) => (
    <div data-testid="analytics-course-detail">
      <span data-testid="tenant-key">{tenantKey}</span>
      <span data-testid="current-spa">{currentSPA}</span>
      <span data-testid="mentor-id">{mentorId}</span>
      <span data-testid="course-id">{courseId}</span>
      <button data-testid="back-button" onClick={onBack}>
        Back
      </button>
    </div>
  )),
}));

import CourseDetailPage from '../page';

describe('CourseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppName.mockReturnValue('skills');
    mockUseParams.mockReturnValue({ courseId: 'test-course-123' });
  });

  it('renders without crashing', () => {
    const { container } = render(<CourseDetailPage />);
    expect(container).toBeTruthy();
  });

  it('renders the AnalyticsCourseDetail component', () => {
    render(<CourseDetailPage />);
    expect(screen.getByTestId('analytics-course-detail')).toBeInTheDocument();
  });

  it('passes the correct tenantKey from getTenant', () => {
    render(<CourseDetailPage />);
    expect(screen.getByTestId('tenant-key')).toHaveTextContent('test-tenant');
  });

  it('passes the configured app name as currentSPA', () => {
    mockAppName.mockReturnValue('custom-spa');

    render(<CourseDetailPage />);
    expect(screen.getByTestId('current-spa')).toHaveTextContent('custom-spa');
  });

  it("falls back to 'skills' for currentSPA when no app name is configured", () => {
    mockAppName.mockReturnValue('');

    render(<CourseDetailPage />);
    expect(screen.getByTestId('current-spa')).toHaveTextContent('skills');
  });

  it('passes empty string for mentorId (Skills app does not use mentor)', () => {
    render(<CourseDetailPage />);
    expect(screen.getByTestId('mentor-id')).toHaveTextContent('');
  });

  it('passes courseId from params', () => {
    render(<CourseDetailPage />);
    expect(screen.getByTestId('course-id')).toHaveTextContent('test-course-123');
  });

  it('navigates to courses list when back button is clicked', () => {
    render(<CourseDetailPage />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/analytics/courses');
  });
});
