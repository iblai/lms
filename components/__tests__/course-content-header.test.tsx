import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('lucide-react', () => ({
  ChevronRight: (props: any) => <span data-testid="chevron" {...props} />,
}));

import {
  CourseProgressRing,
  CourseProgressSummary,
  CourseUnitBreadcrumb,
} from '../course-content-header';

describe('CourseProgressRing', () => {
  const arc = () => screen.getByTestId('course-progress-ring').querySelectorAll('circle')[1];

  it('draws the arc proportionally to the percentage', () => {
    render(<CourseProgressRing percentage={25} />);
    const circumference = Number(arc().getAttribute('stroke-dasharray'));
    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.75);
    expect(arc().getAttribute('class')).toContain('stroke-amber-500');
  });

  it('keeps the brand colour once the course is complete', () => {
    render(<CourseProgressRing percentage={100} />);
    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(0);
    expect(arc().getAttribute('class')).toContain('stroke-amber-500');
  });
});

describe('CourseProgressSummary', () => {
  it('shows the rounded, clamped completion percentage', () => {
    const { rerender } = render(
      <CourseProgressSummary completionPercentage={74.6} gradeVisible={false} />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Course progress 75%' })).toBeInTheDocument();

    rerender(<CourseProgressSummary completionPercentage={140} gradeVisible={false} />);
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<CourseProgressSummary completionPercentage={-5} gradeVisible={false} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('falls back to 0% while completion is still unknown', () => {
    render(<CourseProgressSummary completionPercentage={null} gradeVisible={false} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText('Grade')).not.toBeInTheDocument();
  });

  it('adds the grade readout only when the grading policy is active', () => {
    const { rerender } = render(
      <CourseProgressSummary
        completionPercentage={50}
        gradingPercentage={90}
        gradeVisible={false}
      />,
    );
    expect(screen.queryByText('Grade')).not.toBeInTheDocument();
    expect(screen.queryByText('90%')).not.toBeInTheDocument();

    rerender(
      <CourseProgressSummary completionPercentage={50} gradingPercentage={90} gradeVisible />,
    );
    expect(screen.getByText('Grade')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('shows a 0% grade when grading is active but no grade has been recorded', () => {
    render(<CourseProgressSummary completionPercentage={10} gradeVisible />);
    expect(screen.getByText('Grade')).toBeInTheDocument();
    expect(screen.getAllByText(/^(10|0)%$/)).toHaveLength(2);
  });

  it('forwards the className to the wrapper', () => {
    render(
      <CourseProgressSummary completionPercentage={1} gradeVisible={false} className="hidden" />,
    );
    expect(screen.getByTestId('course-progress-summary').className).toContain('hidden');
  });
});

describe('CourseUnitBreadcrumb', () => {
  it('renders nothing until a unit is resolved', () => {
    const { container } = render(<CourseUnitBreadcrumb />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders section › subsection › unit with the unit marked as the current location', () => {
    render(<CourseUnitBreadcrumb moduleName="Module 1" lessonName="Lesson A" unitName="Unit i" />);

    const nav = screen.getByRole('navigation', { name: 'Current unit' });
    expect(nav).toHaveTextContent('Module 1');
    expect(nav).toHaveTextContent('Lesson A');
    expect(within(nav).getByText('Unit i')).toHaveAttribute('aria-current', 'location');
    expect(within(nav).getAllByTestId('chevron')).toHaveLength(2);
    // Ancestors only show once the title column is wide enough (container
    // query): the lesson first, the section only on wider columns.
    const [section, lesson] = within(nav).getAllByTestId('course-unit-breadcrumb-ancestor');
    expect(section.className).toContain('@3xl:flex');
    expect(lesson.className).toContain('@xl:flex');
  });

  it('skips missing ancestors instead of leaving dangling separators', () => {
    render(<CourseUnitBreadcrumb lessonName="Lesson A" unitName="Unit i" />);

    const nav = screen.getByTestId('course-unit-breadcrumb');
    expect(nav).not.toHaveTextContent('undefined');
    expect(within(nav).getAllByTestId('chevron')).toHaveLength(1);
  });

  it('renders ancestors even while the unit name is still loading', () => {
    render(<CourseUnitBreadcrumb moduleName="Module 1" lessonName="" className="mt-1" />);

    const nav = screen.getByTestId('course-unit-breadcrumb');
    expect(nav).toHaveTextContent('Module 1');
    // The className lands on the container-query wrapper around the nav.
    expect(nav.parentElement?.className).toContain('mt-1');
    expect(nav.parentElement?.className).toContain('@container');
    expect(within(nav).queryByText('', { selector: '[aria-current]' })).not.toBeInTheDocument();
  });
});
