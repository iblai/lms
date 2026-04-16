import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
  })),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

const mockUserCourses: any[] = [];
const mockPagination = { total_pages: 1, count: 0 };

vi.mock('@iblai/iblai-js/web-containers', () => ({
  useUserCourses: vi.fn(() => ({
    userCourses: mockUserCourses,
    isLoadingUserCourses: false,
    errorUserCourses: false,
    pagination: mockPagination,
  })),
  getRandomCourseImage: vi.fn(() => '/fallback.png'),
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  CourseBox: ({ course }: any) => <div data-testid="course-box">{course.course_id}</div>,
}));

vi.mock('react-paginate', () => ({
  default: ({ onPageChange }: any) => (
    <div data-testid="paginate">
      <button data-testid="page-btn" onClick={() => onPageChange({ selected: 2 })}>
        Page 3
      </button>
    </div>
  ),
}));

import CoursesPage from '../page';
import { useUserCourses } from '@iblai/iblai-js/web-containers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "My courses" tab by default', () => {
    render(<CoursesPage />);

    expect(screen.getByText('My courses')).toBeInTheDocument();
  });

  it('renders the "Assigned courses" tab when feature is not hidden', () => {
    render(<CoursesPage />);

    expect(screen.getByText('Assigned courses')).toBeInTheDocument();
  });

  it('hides "Assigned courses" tab when feature is hidden', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => true),
    } as any);

    render(<CoursesPage />);

    expect(screen.queryByText('Assigned courses')).not.toBeInTheDocument();
  });

  it('hides "Assigned courses" tab when metadata not loaded', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: false,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
    } as any);

    render(<CoursesPage />);

    expect(screen.queryByText('Assigned courses')).not.toBeInTheDocument();
  });

  it('shows empty box when no courses and not loading', () => {
    vi.mocked(useUserCourses).mockReturnValue({
      userCourses: [],
      isLoadingUserCourses: false,
      errorUserCourses: false,
      pagination: mockPagination,
    } as any);

    render(<CoursesPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No courses found.');
  });

  it('shows empty box on error', () => {
    vi.mocked(useUserCourses).mockReturnValue({
      userCourses: [],
      isLoadingUserCourses: false,
      errorUserCourses: true,
      pagination: mockPagination,
    } as any);

    render(<CoursesPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No courses found.');
  });

  it('shows skeletons when loading', () => {
    vi.mocked(useUserCourses).mockReturnValue({
      userCourses: [],
      isLoadingUserCourses: true,
      errorUserCourses: false,
      pagination: mockPagination,
    } as any);

    render(<CoursesPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders courses when available', () => {
    vi.mocked(useUserCourses).mockReturnValue({
      userCourses: [{ course_id: 'course-1' }, { course_id: 'course-2' }],
      isLoadingUserCourses: false,
      errorUserCourses: false,
      pagination: mockPagination,
    } as any);

    render(<CoursesPage />);

    expect(screen.getAllByTestId('course-box')).toHaveLength(2);
  });

  it('handles search input', () => {
    render(<CoursesPage />);

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'react' } });

    expect(searchInput).toHaveValue('react');
  });

  it('switches to assigned tab on click', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
    } as any);

    render(<CoursesPage />);

    fireEvent.click(screen.getByText('Assigned courses'));
    // The tab switch triggers useUserCourses with courseType: 'assigned'
    expect(screen.getByText('Assigned courses')).toBeInTheDocument();
  });

  it('renders Discover Courses button', () => {
    render(<CoursesPage />);

    expect(screen.getByText('Discover Courses')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    render(<CoursesPage />);

    fireEvent.click(screen.getByTestId('page-btn'));
    // Pagination callback sets page to selected + 1
    expect(screen.getByTestId('paginate')).toBeInTheDocument();
  });
});
