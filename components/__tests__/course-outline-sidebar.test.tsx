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

import { CourseOutlineSidebar, OUTLINE_COLLAPSED_KEY } from '@/components/course-outline-sidebar';

const renderSidebar = (course: any = { display_name: 'My Course' }) =>
  render(
    <CourseOutlineContext.Provider value={{ course } as any}>
      <CourseOutlineSidebar />
    </CourseOutlineContext.Provider>,
  );

const tokens = (testId: string) => screen.getByTestId(testId).className.split(/\s+/);

describe('CourseOutlineSidebar', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMedia.isWide = true;
  });

  it('renders the rail expand button, header collapse button, and the outline', () => {
    renderSidebar({ display_name: 'My Course' });

    expect(screen.getByTestId('expand-course-outline')).toBeInTheDocument();
    expect(screen.getByTestId('collapse-course-outline')).toBeInTheDocument();
    expect(screen.getByTestId('course-outline')).toBeInTheDocument();
    expect(screen.getByText('My Course')).toBeInTheDocument();
  });

  it('defaults to expanded (full outline shown, rail hidden)', () => {
    renderSidebar();

    expect(tokens('course-outline-sidebar')).toContain('block');
    expect(tokens('course-outline-rail')).toContain('hidden');
  });

  it('offers the collapse control at every width >= 768px (incl. desktop)', () => {
    renderSidebar();

    expect(tokens('collapse-course-outline')).toContain('inline-flex');
  });

  it('collapses and persists collapsed=true when the header button is clicked', () => {
    renderSidebar();

    fireEvent.click(screen.getByTestId('collapse-course-outline'));

    expect(window.localStorage.getItem(OUTLINE_COLLAPSED_KEY)).toBe('true');
    expect(tokens('course-outline-rail')).toContain('flex');
    expect(tokens('course-outline-sidebar')).toContain('hidden');
  });

  it('expands and persists collapsed=false when the rail button is clicked', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'true');
    renderSidebar();

    // Collapsed → rail is shown.
    expect(tokens('course-outline-rail')).toContain('flex');

    fireEvent.click(screen.getByTestId('expand-course-outline'));

    expect(window.localStorage.getItem(OUTLINE_COLLAPSED_KEY)).toBe('false');
    expect(tokens('course-outline-rail')).toContain('hidden');
    expect(tokens('course-outline-sidebar')).toContain('block');
  });

  it('reads the persisted collapsed state from localStorage', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'true');
    renderSidebar();

    expect(tokens('course-outline-rail')).toContain('flex');
    expect(tokens('course-outline-sidebar')).toContain('hidden');
  });

  it('hides everything below 768px (drawer handles the outline there)', () => {
    mockMedia.isWide = false;
    renderSidebar();

    expect(tokens('course-outline-rail')).toContain('hidden');
    expect(tokens('course-outline-sidebar')).toContain('hidden');
  });

  it('does not render the first-time hint popover', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'true');
    renderSidebar();

    expect(screen.queryByTestId('course-outline-hint')).not.toBeInTheDocument();
    expect(screen.queryByText('Course outline hidden')).not.toBeInTheDocument();
  });
});
