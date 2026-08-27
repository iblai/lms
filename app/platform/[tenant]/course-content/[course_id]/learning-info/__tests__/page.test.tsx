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

import LearningInfoPage from '../page';
import { CourseOutlineContext } from '@/contexts/course-outline-context';

function renderPage(course: any = { display_name: 'Test Course', learning_info: ['A'] }) {
  return render(
    <CourseOutlineContext.Provider value={{ course } as any}>
      <LearningInfoPage />
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
});
