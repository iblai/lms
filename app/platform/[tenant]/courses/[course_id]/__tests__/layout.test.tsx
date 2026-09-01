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

// The provider now owns the fetch; the layout just wires it up. The mock
// renders children and exposes the `courseId` prop it was given so we can
// assert the layout decoded the param correctly.
vi.mock('@/hooks/courses/course-detail-context', () => ({
  CourseDetailProvider: vi.fn(({ courseId, children }: any) => (
    <div data-testid="course-detail-provider" data-course-id={courseId}>
      {children}
    </div>
  )),
  useCourseDetailContext: vi.fn(() => ({
    course: { platform_key: 'test-tenant', display_name: 'Test Course' },
    courseInfoLoadingState: 'successful',
  })),
}));

vi.mock('@/components/course-access-guard', () => ({
  CourseAccessGuard: ({ children, course, courseInfoLoadingState }: any) => (
    <div
      data-testid="course-access-guard"
      data-loading-state={courseInfoLoadingState}
      data-platform-key={course?.platform_key}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/self-linking-guard', () => ({
  SelfLinkingGuard: ({ children }: any) => <>{children}</>,
}));

// The client half of the layout (provider + guards + param decoding) moved to
// CourseLayoutClient when layout.tsx became a server component for SEO metadata.
import { CourseLayoutClient as CourseLayout } from '../_components/course-layout-client';
import {
  CourseDetailProvider,
  useCourseDetailContext,
} from '@/hooks/courses/course-detail-context';

describe('CourseLayoutClient', () => {
  const defaultParams = Promise.resolve({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCourseDetailContext).mockReturnValue({
      course: { platform_key: 'test-tenant', display_name: 'Test Course' } as any,
      courseInfoLoadingState: 'successful',
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

  it('passes course from context to CourseAccessGuard', () => {
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

  it('passes loading state from context to CourseAccessGuard', () => {
    vi.mocked(useCourseDetailContext).mockReturnValue({
      course: null,
      courseInfoLoadingState: 'loading',
    } as any);

    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(screen.getByTestId('course-access-guard')).toHaveAttribute(
      'data-loading-state',
      'loading',
    );
  });

  it('wraps the subtree in CourseDetailProvider so course data is fetched once', () => {
    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(vi.mocked(CourseDetailProvider)).toHaveBeenCalled();
    expect(screen.getByTestId('course-detail-provider')).toBeInTheDocument();
  });

  it('decodes course_id from params before passing to CourseDetailProvider', () => {
    render(
      <CourseLayout params={defaultParams}>
        <div>children</div>
      </CourseLayout>,
    );
    expect(screen.getByTestId('course-detail-provider')).toHaveAttribute(
      'data-course-id',
      'course-v1:test+course+2024',
    );
  });
});
