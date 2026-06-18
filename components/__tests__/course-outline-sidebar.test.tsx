import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { CourseOutlineContext } from '@/contexts/course-outline-context';

// Controllable media-query results. Default: tablet range, not desktop.
const mockMedia = vi.hoisted(() => ({ isDesktop: false, isTablet: true }));
vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn((q: any) => {
    if (q.minWidth === 1280 && !q.maxWidth) return mockMedia.isDesktop;
    if (q.minWidth === 768 && q.maxWidth === 1279) return mockMedia.isTablet;
    return false;
  }),
}));

// Mock lucide icons used by the component.
vi.mock('lucide-react', () => ({
  PanelLeftOpen: () => <span data-testid="panel-left-open" />,
  PanelLeftClose: () => <span data-testid="panel-left-close" />,
  ListTree: () => <span data-testid="list-tree" />,
}));

// Mock the outline tree itself.
vi.mock('@/components/course-outline', () => ({
  CourseOutline: () => <div data-testid="course-outline">CourseOutline</div>,
}));

// Popover mock that reflects the controlled `open` prop so we can assert the
// first-time hint visibility, and forwards `asChild` triggers cleanly.
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open }: any) => (
    <div data-testid="popover" data-open={open ? 'true' : 'false'}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild, ...rest }: any) =>
    asChild ? children : <button {...rest}>{children}</button>,
  PopoverContent: ({ children, 'data-testid': dataTestId, className }: any) => (
    <div data-testid={dataTestId} className={className}>
      {children}
    </div>
  ),
}));

import {
  CourseOutlineSidebar,
  OUTLINE_COLLAPSED_KEY,
  OUTLINE_HINT_SEEN_KEY,
} from '@/components/course-outline-sidebar';

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
    mockMedia.isDesktop = false;
    mockMedia.isTablet = true;
  });

  it('renders the rail expand button, header collapse button, and the outline', () => {
    renderSidebar({ display_name: 'My Course' });

    expect(screen.getByTestId('expand-course-outline')).toBeInTheDocument();
    expect(screen.getByTestId('collapse-course-outline')).toBeInTheDocument();
    expect(screen.getByTestId('course-outline')).toBeInTheDocument();
    expect(screen.getByText('My Course')).toBeInTheDocument();
  });

  it('defaults to collapsed (rail shown, full outline hidden) in the tablet range', () => {
    renderSidebar();

    expect(tokens('course-outline-rail')).toContain('flex');
    expect(tokens('course-outline-rail')).not.toContain('hidden');
    expect(tokens('course-outline-sidebar')).toContain('hidden');
  });

  it('expands and persists collapsed=false when the rail button is clicked', () => {
    renderSidebar();

    fireEvent.click(screen.getByTestId('expand-course-outline'));

    expect(window.localStorage.getItem(OUTLINE_COLLAPSED_KEY)).toBe('false');
    // Expanding also dismisses the first-time hint.
    expect(window.localStorage.getItem(OUTLINE_HINT_SEEN_KEY)).toBe('true');

    // Rail is hidden and the full outline is shown once expanded.
    expect(tokens('course-outline-rail')).toContain('hidden');
    expect(tokens('course-outline-sidebar')).toContain('block');
  });

  it('collapses and persists collapsed=true when the header button is clicked', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'false');
    renderSidebar();

    fireEvent.click(screen.getByTestId('collapse-course-outline'));

    expect(window.localStorage.getItem(OUTLINE_COLLAPSED_KEY)).toBe('true');
    expect(tokens('course-outline-rail')).toContain('flex');
    expect(tokens('course-outline-sidebar')).toContain('hidden');
  });

  it('reads the persisted expanded state from localStorage', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'false');
    renderSidebar();

    expect(tokens('course-outline-sidebar')).toContain('block');
    expect(tokens('course-outline-rail')).toContain('hidden');
  });

  it('always shows the full outline and no collapse controls at xl (>=1280px)', () => {
    mockMedia.isDesktop = true;
    mockMedia.isTablet = false;
    renderSidebar(); // default collapsed — must not affect desktop

    expect(tokens('course-outline-sidebar')).toContain('block');
    expect(tokens('course-outline-rail')).toContain('hidden');
    expect(tokens('collapse-course-outline')).toContain('hidden');
  });

  it('keeps the full outline visible at xl even when collapsed was set on tablet', () => {
    window.localStorage.setItem(OUTLINE_COLLAPSED_KEY, 'true');
    mockMedia.isDesktop = true;
    mockMedia.isTablet = false;
    renderSidebar();

    expect(tokens('course-outline-sidebar')).toContain('block');
    expect(tokens('course-outline-rail')).toContain('hidden');
  });

  it('shows the first-time hint in the tablet range and hides it once dismissed', () => {
    renderSidebar();

    expect(screen.getByTestId('popover').getAttribute('data-open')).toBe('true');

    fireEvent.click(screen.getByText('Got it'));

    expect(window.localStorage.getItem(OUTLINE_HINT_SEEN_KEY)).toBe('true');
    expect(screen.getByTestId('popover').getAttribute('data-open')).toBe('false');
  });

  it('does not show the hint when it has already been seen', () => {
    window.localStorage.setItem(OUTLINE_HINT_SEEN_KEY, 'true');
    renderSidebar();

    expect(screen.getByTestId('popover').getAttribute('data-open')).toBe('false');
  });

  it('does not show the hint outside the tablet range', () => {
    mockMedia.isTablet = false;
    mockMedia.isDesktop = true;
    renderSidebar();

    expect(screen.getByTestId('popover').getAttribute('data-open')).toBe('false');
  });
});
