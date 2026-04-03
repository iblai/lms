import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => (open ? <div data-testid="sheet">{children}</div> : null),
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('../course-outline', () => ({
  CourseOutline: () => <div data-testid="course-outline">Course Outline Content</div>,
}));

import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { CourseOutlineDrawer } from '../course-outline-drawer';

describe('CourseOutlineDrawer', () => {
  const mockSetCourseOutlineDrawerOpen = vi.fn();

  const createWrapper = (overrides = {}) => {
    const contextValue = {
      courseOutline: {} as any,
      courseOutlineLoading: false,
      expandedModule: '',
      expandedLessons: [],
      selectLesson: vi.fn(),
      toggleModule: vi.fn(),
      toggleLesson: vi.fn(),
      currentChapter: '',
      currentLesson: '',
      course: { display_name: 'Test Course' } as any,
      courseOutlineDrawerOpen: true,
      setCourseOutlineDrawerOpen: mockSetCourseOutlineDrawerOpen,
      currentUnitID: null,
      refetchCourseOutline: vi.fn(),
      ...overrides,
    };

    return ({ children }: { children: React.ReactNode }) => (
      <CourseOutlineContext.Provider value={contextValue}>{children}</CourseOutlineContext.Provider>
    );
  };

  it('renders without crashing when open', () => {
    const Wrapper = createWrapper();
    const { container } = render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(container).toBeTruthy();
  });

  it('does not render when closed', () => {
    const Wrapper = createWrapper({ courseOutlineDrawerOpen: false });
    const { queryByTestId } = render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(queryByTestId('sheet')).not.toBeInTheDocument();
  });

  it('renders the course display name', () => {
    const Wrapper = createWrapper();
    render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });

  it('renders the CourseOutline component', () => {
    const Wrapper = createWrapper();
    render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(screen.getByTestId('course-outline')).toBeInTheDocument();
  });

  it('handles null course gracefully', () => {
    const Wrapper = createWrapper({ course: null });
    const { container } = render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(container).toBeTruthy();
  });

  it('renders sheet header', () => {
    const Wrapper = createWrapper();
    render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(screen.getByTestId('sheet-header')).toBeInTheDocument();
  });

  it('renders sheet content', () => {
    const Wrapper = createWrapper();
    render(<CourseOutlineDrawer />, { wrapper: Wrapper });
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
  });
});
