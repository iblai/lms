import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@/hooks/courses/use-recommended-courses', () => ({
  useRecommendedCourses: vi.fn(() => ({
    recommendedCourses: [],
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
}));

vi.mock('@/components/course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

vi.mock('@/components/course-box', () => ({
  CourseBox: ({ course }: any) => <div data-testid="course-box">{course.course_id}</div>,
}));

import RecommendedPage from '../page';
import { useRecommendedCourses } from '@/hooks/courses/use-recommended-courses';

describe('RecommendedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<RecommendedPage />);

    expect(screen.getByText('Recommended for Me')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<RecommendedPage />);

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders "Recommended Courses" button', () => {
    render(<RecommendedPage />);

    expect(screen.getByText('Recommended Courses')).toBeInTheDocument();
  });

  it('shows empty box when no courses and not loading', () => {
    render(<RecommendedPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No courses found.');
  });

  it('shows empty box on error', () => {
    vi.mocked(useRecommendedCourses).mockReturnValue({
      recommendedCourses: [],
      isLoading: false,
      isError: true,
    } as any);

    render(<RecommendedPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No courses found.');
  });

  it('shows skeletons when loading', () => {
    vi.mocked(useRecommendedCourses).mockReturnValue({
      recommendedCourses: [],
      isLoading: true,
      isError: false,
    } as any);

    render(<RecommendedPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders course boxes when recommended courses are available', () => {
    vi.mocked(useRecommendedCourses).mockReturnValue({
      recommendedCourses: [
        { data: { course_id: 'course-1' } },
        { data: { course_id: 'course-2' } },
      ],
      isLoading: false,
      isError: false,
    } as any);

    render(<RecommendedPage />);

    expect(screen.getAllByTestId('course-box')).toHaveLength(2);
  });

  it('handles search input change', () => {
    render(<RecommendedPage />);

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'python' } });

    expect(input).toHaveValue('python');
  });
});
