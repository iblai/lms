import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/app/platform/[tenant]/courses/[course_id]/_components/learning-info-tab', () => ({
  LearningInfoTab: (props: any) => (
    <div data-testid="learning-info-tab" data-course={props.course?.display_name} />
  ),
}));

vi.mock('@/contexts/course-outline-context', () => ({
  CourseOutlineContext: React.createContext<any>({ course: null }),
}));
vi.mock('@/hooks/courses/edx-iframe-context', () => ({
  EdxIframeContext: React.createContext<any>({ setActiveTab: () => {} }),
}));

import LearningInfoPage from '../page';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const mockSetActiveTab = vi.fn();

function renderPage(course: any = { display_name: 'Test Course', learning_info: ['A'] }) {
  return render(
    <CourseOutlineContext.Provider value={{ course } as any}>
      <EdxIframeContext.Provider value={{ setActiveTab: mockSetActiveTab } as any}>
        <LearningInfoPage />
      </EdxIframeContext.Provider>
    </CourseOutlineContext.Provider>,
  );
}

describe('LearningInfoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the LearningInfoTab with the course from context', () => {
    renderPage({ display_name: 'My Course', learning_info: ['x'] });
    const tab = screen.getByTestId('learning-info-tab');
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute('data-course', 'My Course');
  });

  it('announces learning-info as the active tab on mount', () => {
    renderPage();
    expect(mockSetActiveTab).toHaveBeenCalledWith('learning-info');
  });
});
