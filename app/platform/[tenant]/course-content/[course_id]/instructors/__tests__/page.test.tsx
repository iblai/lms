import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Stub InstructorTab and expose the props/toggle so we can exercise the page's
// local expandedSections state.
vi.mock('@/app/platform/[tenant]/courses/[course_id]/_components/instructor-tab', () => ({
  InstructorTab: (props: any) => (
    <div data-testid="instructor-tab" data-course={props.course?.display_name}>
      <button data-testid="toggle" onClick={() => props.toggleSection('instructor-0')}>
        toggle
      </button>
      <span data-testid="expanded">{String(!!props.expandedSections['instructor-0'])}</span>
    </div>
  ),
}));

vi.mock('@/contexts/course-outline-context', () => ({
  CourseOutlineContext: React.createContext<any>({ course: null }),
}));
vi.mock('@/hooks/courses/edx-iframe-context', () => ({
  EdxIframeContext: React.createContext<any>({ setActiveTab: () => {} }),
}));

import InstructorsPage from '../page';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const mockSetActiveTab = vi.fn();

function renderPage(
  course: any = { display_name: 'Test Course', instructor_info: { instructors: [{ name: 'A' }] } },
) {
  return render(
    <CourseOutlineContext.Provider value={{ course } as any}>
      <EdxIframeContext.Provider value={{ setActiveTab: mockSetActiveTab } as any}>
        <InstructorsPage />
      </EdxIframeContext.Provider>
    </CourseOutlineContext.Provider>,
  );
}

describe('InstructorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the InstructorTab with the course from context', () => {
    renderPage({ display_name: 'My Course' });
    const tab = screen.getByTestId('instructor-tab');
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute('data-course', 'My Course');
  });

  it('announces instructors as the active tab on mount', () => {
    renderPage();
    expect(mockSetActiveTab).toHaveBeenCalledWith('instructors');
  });

  it('toggles a section via its local expandedSections state', () => {
    renderPage();
    expect(screen.getByTestId('expanded')).toHaveTextContent('false');
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('expanded')).toHaveTextContent('true');
  });
});
