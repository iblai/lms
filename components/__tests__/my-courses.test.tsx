import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUseUserCourses = vi.fn(() => ({
  userCourses: [] as { course_id: string }[],
  isLoadingUserCourses: false,
  errorUserCourses: null as Error | null,
}));

vi.mock('@/hooks/courses/use-user-courses', () => ({
  useUserCourses: () => mockUseUserCourses(),
}));

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier} skeletons</div>
  ),
}));

vi.mock('../course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

vi.mock('../default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="default-empty-box">{message}</div>,
}));

vi.mock('../course-box', () => ({
  CourseBox: ({ course }: any) => <div data-testid="course-box">{course.course_id}</div>,
}));

import { MyCourses } from '../my-courses';

describe('MyCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MyCourses />);
    expect(screen.getByText('My Courses')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    mockUseUserCourses.mockReturnValue({
      userCourses: [],
      isLoadingUserCourses: true,
      errorUserCourses: null,
    });
    render(<MyCourses />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty message when no courses and not loading', () => {
    mockUseUserCourses.mockReturnValue({
      userCourses: [],
      isLoadingUserCourses: false,
      errorUserCourses: null,
    });
    render(<MyCourses />);
    expect(screen.getByTestId('default-empty-box')).toBeInTheDocument();
    expect(screen.getByText('You have not enrolled in any courses yet.')).toBeInTheDocument();
  });

  it('shows empty message on error', () => {
    mockUseUserCourses.mockReturnValue({
      userCourses: [],
      isLoadingUserCourses: false,
      errorUserCourses: new Error('fail'),
    });
    render(<MyCourses />);
    expect(screen.getByTestId('default-empty-box')).toBeInTheDocument();
  });

  it('renders course boxes when courses are available', () => {
    mockUseUserCourses.mockReturnValue({
      userCourses: [{ course_id: 'course-1' }, { course_id: 'course-2' }],
      isLoadingUserCourses: false,
      errorUserCourses: null,
    });
    render(<MyCourses />);
    expect(screen.getByText('course-1')).toBeInTheDocument();
    expect(screen.getByText('course-2')).toBeInTheDocument();
  });

  it('renders "See More" link to /profile/courses', () => {
    render(<MyCourses />);
    const seeMoreLink = screen.getByText('See More');
    expect(seeMoreLink.closest('a')).toHaveAttribute('href', '/profile/courses');
  });

  it('renders courses grid with correct aria-label', () => {
    render(<MyCourses />);
    expect(screen.getByRole('region', { name: 'My Courses' })).toBeInTheDocument();
  });
});
