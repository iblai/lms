import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockUseRecommendedCourses = vi.fn();

vi.mock('@/hooks/courses/use-recommended-courses', () => ({
  useRecommendedCourses: () => mockUseRecommendedCourses(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

vi.mock('../default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier}</div>
  ),
}));

vi.mock('../course-box', () => ({
  CourseBox: ({ course }: any) => <div data-testid="course-box">{course.course_id}</div>,
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import { SuggestedCourses } from '../suggested-courses';

describe('SuggestedCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [],
      isLoading: false,
      isError: false,
    });
    const { container } = render(<SuggestedCourses />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the title', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [],
      isLoading: false,
      isError: false,
    });
    render(<SuggestedCourses />);
    expect(screen.getByText('Suggested Courses')).toBeInTheDocument();
  });

  it('displays See More link', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [],
      isLoading: false,
      isError: false,
    });
    render(<SuggestedCourses />);
    const link = screen.getByText('See More');
    expect(link.closest('a')).toHaveAttribute('href', '/recommended');
  });

  it('shows skeleton when loading', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [],
      isLoading: true,
      isError: false,
    });
    render(<SuggestedCourses />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty box when error', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [],
      isLoading: false,
      isError: true,
    });
    render(<SuggestedCourses />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No suggested courses found.')).toBeInTheDocument();
  });

  it('shows empty box when no courses', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [],
      isLoading: false,
      isError: false,
    });
    render(<SuggestedCourses />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('renders course boxes when courses are available', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [
        { data: { course_id: 'course-1' } },
        { data: { course_id: 'course-2' } },
      ],
      isLoading: false,
      isError: false,
    });
    render(<SuggestedCourses />);
    const boxes = screen.getAllByTestId('course-box');
    expect(boxes).toHaveLength(2);
    expect(screen.getByText('course-1')).toBeInTheDocument();
    expect(screen.getByText('course-2')).toBeInTheDocument();
  });

  it('does not show empty box when courses are available', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [{ data: { course_id: 'course-1' } }],
      isLoading: false,
      isError: false,
    });
    render(<SuggestedCourses />);
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('does not show skeleton when not loading', () => {
    mockUseRecommendedCourses.mockReturnValue({
      recommendedCourses: [{ data: { course_id: 'course-1' } }],
      isLoading: false,
      isError: false,
    });
    render(<SuggestedCourses />);
    expect(screen.queryByTestId('skeleton-multiplier')).not.toBeInTheDocument();
  });
});
