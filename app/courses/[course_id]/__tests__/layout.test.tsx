import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock React.use
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof React>('react');
  return {
    ...actual,
    use: vi.fn(() => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' })),
  };
});

const mockHandleFetchCourseInfo = vi.fn();
vi.mock('@/hooks/courses/use-course-detail', () => ({
  useCourseDetail: vi.fn(() => ({
    course: { platform_key: 'test-tenant', display_name: 'Test Course' },
    loading: false,
    handleFetchCourseInfo: mockHandleFetchCourseInfo,
  })),
}));

vi.mock('@/components/course-access-guard', () => ({
  CourseAccessGuard: ({ children, course, loading }: any) => (
    <div data-testid="course-access-guard" data-loading={loading} data-platform-key={course?.platform_key}>
      {children}
    </div>
  ),
}));

import CourseLayout from '../layout';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';

describe('CourseLayout', () => {
  const defaultParams = Promise.resolve({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCourseDetail).mockReturnValue({
      course: { platform_key: 'test-tenant', display_name: 'Test Course' } as any,
      loading: false,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(container).toBeTruthy();
  });

  it('renders children through CourseAccessGuard', () => {
    render(
      <CourseLayout params={defaultParams}>
        <div data-testid="page-content">Page Content</div>
      </CourseLayout>,
    );
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('passes course to CourseAccessGuard', () => {
    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(screen.getByTestId('course-access-guard')).toHaveAttribute(
      'data-platform-key',
      'test-tenant',
    );
  });

  it('passes loading state to CourseAccessGuard', () => {
    vi.mocked(useCourseDetail).mockReturnValue({
      course: null,
      loading: true,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
    } as any);

    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(screen.getByTestId('course-access-guard')).toHaveAttribute('data-loading', 'true');
  });

  it('calls handleFetchCourseInfo on mount', () => {
    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(mockHandleFetchCourseInfo).toHaveBeenCalled();
  });

  it('decodes course_id from params before passing to useCourseDetail', () => {
    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(vi.mocked(useCourseDetail)).toHaveBeenCalledWith('course-v1:test+course+2024');
  });
});
