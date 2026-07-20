import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { CourseOutlineContext } from '@/contexts/course-outline-context';

// Controllable media-query result. `isWide` = md (768px) and up. Default: wide.
const mockMedia = vi.hoisted(() => ({ isWide: true }));
vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn((q: any) => {
    if (q.minWidth === 768 && !q.maxWidth) return mockMedia.isWide;
    return false;
  }),
}));

// Mock lucide icons used by the component.
vi.mock('lucide-react', () => ({
  PanelLeftOpen: () => <span data-testid="panel-left-open" />,
  PanelLeftClose: () => <span data-testid="panel-left-close" />,
}));

// Mock the outline tree itself.
vi.mock('@/components/course-outline', () => ({
  CourseOutline: () => <div data-testid="course-outline">CourseOutline</div>,
}));

import {
  CourseOutlineSidebar,
  CourseOutlineToggle,
  OUTLINE_COLLAPSED_KEY,
} from '@/components/course-outline-sidebar';

// The toggle lives in the layout's course header row while the sidebar is a
// sibling of the content column; they only share state through localStorage.
const renderSidebar = (course: any = { display_name: 'My Course' }) =>
  render(
    <CourseOutlineContext.Provider value={{ course } as any}>
      <CourseOutlineToggle />
      <CourseOutlineSidebar />
    </CourseOutlineContext.Provider>,
  );

const tokens = (testId: string) => screen.getByTestId(testId).className.split(/\s+/);

describe('CourseOutlineSidebar', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMedia.isWide = true;
  });

  it('renders the toggle and the outline', () => {
    renderSidebar({ display_name: 'My Course' });

    expect(screen.getByTestId('toggle-course-outline')).toBeInTheDocument();
    expect(screen.getByTestId('course-outline')).toBeInTheDocument();
  });

  it('does not repeat the course name (it already lives in the navbar)', () => {
    renderSidebar({ display_name: 'My Course' });

    expect(screen.queryByText('My Course')).not.toBeInTheDocument();
  });

  it('defaults to expanded, with the toggle offering to collapse', () => {
    renderSidebar();

    expect(tokens('course-outline-sidebar')).toContain('block');
    expect(screen.getByTestId('panel-left-close')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-course-outline')).toHaveAccessibleName(
      'Collapse course outline',
    );
  });

  it('hides the toggle below md via responsive classes (drawer handles mobile)', () => {
    renderSidebar();

    expect(tokens('toggle-course-outline')).toContain('hidden');
    expect(tokens('toggle-course-outline')).toContain('md:inline-flex');
  });

  it('collapses the sidebar and persists collapsed=true when the toggle is clicked', () => {
    renderSidebar();

    fireEvent.click(screen.getByTestId('toggle-course-outline'));

    expect(window.localStorage.getItem(OUTLINE_COLLAPSED_KEY)).toBe('true');
    expect(tokens('course-outline-sidebar')).toContain('hidden');
    expect(screen.getByTestId('panel-left-open')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-course-outline')).toHaveAccessibleName(
      'Expand course outline',
    );
  });

  it('expands the sidebar and persists collapsed=false when the toggle is clicked again', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'true');
    renderSidebar();

    // Collapsed → sidebar hidden.
    expect(tokens('course-outline-sidebar')).toContain('hidden');

    fireEvent.click(screen.getByTestId('toggle-course-outline'));

    expect(window.localStorage.getItem(OUTLINE_COLLAPSED_KEY)).toBe('false');
    expect(tokens('course-outline-sidebar')).toContain('block');
    expect(screen.getByTestId('panel-left-close')).toBeInTheDocument();
  });

  it('reads the persisted collapsed state from localStorage', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'true');
    renderSidebar();

    expect(tokens('course-outline-sidebar')).toContain('hidden');
    expect(screen.getByTestId('panel-left-open')).toBeInTheDocument();
  });

  it('hides the sidebar below 768px (drawer handles the outline there)', () => {
    mockMedia.isWide = false;
    renderSidebar();

    expect(tokens('course-outline-sidebar')).toContain('hidden');
  });
});
