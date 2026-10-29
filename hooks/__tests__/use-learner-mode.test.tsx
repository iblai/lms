import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

const mockPush = vi.fn();
let mockPathname = '/platform/acme/home';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

import { getLearnerModeRedirect, useLearnerMode } from '../use-learner-mode';
import { learnerModeSlice } from '@/features/learner-mode';

function renderLearnerMode() {
  const store = configureStore({
    reducer: { [learnerModeSlice.reducerPath]: learnerModeSlice.reducer },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useLearnerMode(), { wrapper });
}

describe('getLearnerModeRedirect', () => {
  it('sends course staff pages back to the course tab', () => {
    for (const tab of ['instructor', 'gradebook', 'analytics', 'configuration']) {
      expect(getLearnerModeRedirect(`/platform/acme/course-content/course-v1:a+b+c/${tab}`)).toBe(
        '/platform/acme/course-content/course-v1:a+b+c/course',
      );
    }
  });

  it('keeps nested staff sub-routes on the same rule', () => {
    expect(
      getLearnerModeRedirect('/platform/acme/course-content/course-v1:a+b+c/instructor/grading'),
    ).toBe('/platform/acme/course-content/course-v1:a+b+c/course');
  });

  it('sends platform analytics pages to home', () => {
    expect(getLearnerModeRedirect('/platform/acme/analytics')).toBe('/platform/acme/home');
    expect(getLearnerModeRedirect('/platform/acme/analytics/users')).toBe('/platform/acme/home');
  });

  it('leaves learner pages alone', () => {
    expect(getLearnerModeRedirect('/platform/acme/home')).toBeNull();
    expect(
      getLearnerModeRedirect('/platform/acme/course-content/course-v1:a+b+c/course'),
    ).toBeNull();
    expect(
      getLearnerModeRedirect('/platform/acme/course-content/course-v1:a+b+c/progress'),
    ).toBeNull();
    expect(getLearnerModeRedirect('/platform/acme/analytics-report')).toBeNull();
  });
});

describe('useLearnerMode', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockPathname = '/platform/acme/home';
  });

  it('starts in admin (instructor) mode', () => {
    const { result } = renderLearnerMode();
    expect(result.current.isInstructorMode).toBe(true);
  });

  it('flips between modes', () => {
    const { result } = renderLearnerMode();
    act(() => result.current.toggleLearnerMode());
    expect(result.current.isInstructorMode).toBe(false);
    act(() => result.current.toggleLearnerMode());
    expect(result.current.isInstructorMode).toBe(true);
  });

  it('does not navigate when switching on a learner page', () => {
    const { result } = renderLearnerMode();
    act(() => result.current.toggleLearnerMode());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('leaves a staff-only page when switching to learner mode', () => {
    mockPathname = '/platform/acme/analytics/users';
    const { result } = renderLearnerMode();
    act(() => result.current.toggleLearnerMode());
    expect(mockPush).toHaveBeenCalledWith('/platform/acme/home');
  });

  it('does not navigate when switching back to admin mode', () => {
    const { result } = renderLearnerMode();
    act(() => result.current.toggleLearnerMode());
    mockPush.mockClear();
    mockPathname = '/platform/acme/analytics';
    act(() => result.current.toggleLearnerMode());
    expect(mockPush).not.toHaveBeenCalled();
  });
});
