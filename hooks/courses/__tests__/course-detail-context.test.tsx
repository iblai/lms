import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockHandleFetchCourseInfo = vi.fn();
const mockHookValue = {
  handleFetchCourseInfo: mockHandleFetchCourseInfo,
  course: { display_name: 'Test Course', platform_key: 'test-tenant' },
  courseInfoLoadingState: 'successful',
};

vi.mock('@/hooks/courses/use-course-detail', () => ({
  useCourseDetail: vi.fn(() => mockHookValue),
}));

import { CourseDetailProvider, useCourseDetailContext } from '../course-detail-context';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';

describe('CourseDetailProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs useCourseDetail with the provided courseId', () => {
    render(
      <CourseDetailProvider courseId="course-123">
        <div>child</div>
      </CourseDetailProvider>,
    );
    expect(vi.mocked(useCourseDetail)).toHaveBeenCalledWith('course-123');
  });

  it('renders its children', () => {
    render(
      <CourseDetailProvider courseId="course-123">
        <div data-testid="child">child</div>
      </CourseDetailProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('fetches course info once on mount when courseId is present', () => {
    render(
      <CourseDetailProvider courseId="course-123">
        <div>child</div>
      </CourseDetailProvider>,
    );
    expect(mockHandleFetchCourseInfo).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when courseId is empty', () => {
    render(
      <CourseDetailProvider courseId="">
        <div>child</div>
      </CourseDetailProvider>,
    );
    expect(mockHandleFetchCourseInfo).not.toHaveBeenCalled();
  });

  it('exposes the hook value to descendants via useCourseDetailContext', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CourseDetailProvider courseId="course-123">{children}</CourseDetailProvider>
    );
    const { result } = renderHook(() => useCourseDetailContext(), { wrapper });
    expect(result.current.course).toEqual(mockHookValue.course);
    expect(result.current.courseInfoLoadingState).toBe('successful');
  });
});

describe('useCourseDetailContext', () => {
  it('throws when used outside of a CourseDetailProvider', () => {
    // Silence the expected React error boundary logging for this case.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCourseDetailContext())).toThrow(
      'useCourseDetailContext must be used within a CourseDetailProvider',
    );
    spy.mockRestore();
  });
});
