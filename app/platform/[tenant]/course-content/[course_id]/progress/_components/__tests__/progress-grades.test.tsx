import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import type { SectionScore, Subsection } from '@/types/courses';
import { DetailedGrades, GradeBar, GradeSummaryTable } from '../progress-grades';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const subsection = (overrides: Partial<Subsection>): Subsection => ({
  assignment_type: 'Homework',
  block_key: 'seq-1',
  display_name: 'Homework 1',
  has_graded_assignment: true,
  override: null,
  learner_has_access: true,
  num_points_earned: 8,
  num_points_possible: 10,
  percent_graded: 0.8,
  problem_scores: [
    { earned: 3, possible: 5 },
    { earned: 5, possible: 5 },
  ],
  show_correctness: 'always',
  show_grades: true,
  url: '',
  ...overrides,
});

const outline = {
  id: 'course',
  block_id: 'course',
  type: 'course',
  display_name: 'Course',
  children: [
    {
      id: 'ch',
      block_id: 'ch',
      type: 'chapter',
      display_name: 'Ch',
      children: [
        {
          id: 'seq-1',
          block_id: 'seq-1',
          type: 'sequential',
          display_name: 'Seq',
          children: [
            {
              id: 'unit-1',
              block_id: 'unit-1',
              type: 'vertical',
              display_name: 'U1',
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

const withOutline = (ui: React.ReactElement) =>
  render(
    <CourseOutlineContext.Provider value={{ courseOutline: outline } as any}>
      {ui}
    </CourseOutlineContext.Provider>,
  );

describe('GradeBar', () => {
  it('shows the current and passing grades and the status text', () => {
    render(
      <GradeBar
        courseGrade={{ percent: 0.42, is_passing: false, letter_grade: null }}
        gradeRange={{ Pass: 0.5 }}
      />,
    );
    expect(screen.getByTestId('current-grade')).toHaveTextContent('42%');
    expect(screen.getByTestId('passing-grade')).toHaveTextContent('50%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByTestId('grade-status')).toHaveTextContent(
      'A weighted grade of 50% is required',
    );
    expect(screen.queryByRole('list', { name: 'Grade range' })).not.toBeInTheDocument();
  });

  it('lists the letter bands when the course has them', () => {
    render(
      <GradeBar
        courseGrade={{ percent: 0.95, is_passing: true, letter_grade: 'A' }}
        gradeRange={{ A: 0.9, B: 0.8 }}
      />,
    );
    const list = screen.getByRole('list', { name: 'Grade range' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['A: 90–100%', 'B: 80–90%']);
    expect(screen.getByTestId('grade-status')).toHaveTextContent('grade of A (90–100%)');
  });
});

describe('GradeSummaryTable', () => {
  const summaries = [
    {
      type: 'Homework',
      shortLabel: 'HW',
      weight: 0.4,
      numDroppable: 2,
      numTotal: 3,
      average: 0.5,
      weighted: 0.2,
      locked: false,
    },
    {
      type: 'Lab',
      shortLabel: '',
      weight: 0.1,
      numDroppable: 1,
      numTotal: 3,
      average: 0.5,
      weighted: 0.05,
      locked: true,
    },
    {
      type: 'Final Exam',
      shortLabel: 'Final',
      weight: 0.5,
      numDroppable: 0,
      numTotal: 1,
      average: 0.75,
      weighted: 0.375,
      locked: false,
    },
  ];

  it('renders one row per assignment type, the weighted total and the drop footnotes', () => {
    render(
      <GradeSummaryTable
        summaries={summaries}
        courseGrade={{ percent: 0.625, is_passing: true, letter_grade: 'Pass' }}
      />,
    );
    const rows = screen.getAllByTestId('grade-summary-row');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Homework');
    expect(rows[0]).toHaveTextContent('40%');
    expect(rows[0]).toHaveTextContent('50%');
    expect(rows[0]).toHaveTextContent('20%');
    expect(within(rows[1]).getByLabelText('Locked')).toBeInTheDocument();
    expect(screen.getByTestId('weighted-total')).toHaveTextContent('62.5%');
    expect(screen.getByText(/The lowest 2 HW scores are dropped/)).toBeInTheDocument();
    expect(screen.getByText(/The lowest 1 Lab score is dropped/)).toBeInTheDocument();
  });

  it('omits the footnotes when nothing is dropped', () => {
    render(
      <GradeSummaryTable
        summaries={[summaries[2]]}
        courseGrade={{ percent: 0, is_passing: false, letter_grade: null }}
      />,
    );
    expect(screen.queryByText(/dropped/)).not.toBeInTheDocument();
  });
});

describe('DetailedGrades', () => {
  const sections: SectionScore[] = [
    {
      display_name: 'Week 1',
      subsections: [
        subsection({}),
        subsection({
          block_key: 'seq-x',
          display_name: 'Unknown unit',
          problem_scores: [],
          learner_has_access: false,
        }),
        subsection({ block_key: 'ungraded', has_graded_assignment: false }),
      ],
    },
    {
      display_name: 'Week 2',
      subsections: [subsection({ block_key: 'none', has_graded_assignment: false })],
    },
  ];

  it('lists graded subsections per section, links them into the Course tab and toggles problem scores', () => {
    withOutline(
      <DetailedGrades
        sections={sections}
        courseBasePath="/c"
        fullyLocked={false}
        partiallyLocked={false}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Week 1' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Week 2' })).not.toBeInTheDocument();
    const rows = screen.getAllByTestId('detailed-grade-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole('link', { name: 'Homework 1' })).toHaveAttribute(
      'href',
      '/c/course?unit_id=unit-1',
    );
    expect(within(rows[1]).queryByRole('link')).not.toBeInTheDocument();
    expect(
      within(rows[1]).getByLabelText('You have no access to Unknown unit'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('detailed-grade-score')[0]).toHaveTextContent('8/10');

    fireEvent.click(screen.getByRole('button', { name: 'Show problem scores for Homework 1' }));
    const problems = screen.getAllByTestId('problem-score-row');
    expect(problems).toHaveLength(2);
    expect(problems[0]).toHaveTextContent('Problem 1');
    expect(problems[0]).toHaveTextContent('3/5');
    fireEvent.click(screen.getByRole('button', { name: 'Hide problem scores for Homework 1' }));
    expect(screen.queryByTestId('problem-score-row')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'course outline' })).toHaveAttribute(
      'href',
      '/c/course',
    );
  });

  it('shows the empty state and the partial-lock note', () => {
    withOutline(
      <DetailedGrades
        sections={[sections[1]]}
        courseBasePath="/c"
        fullyLocked={false}
        partiallyLocked
      />,
    );
    expect(screen.getByText('You currently have no graded problem scores.')).toBeInTheDocument();
    expect(screen.getByText(/Some assignments are locked/)).toBeInTheDocument();
  });

  it('hides the per-row lock when grades are fully locked', () => {
    withOutline(
      <DetailedGrades
        sections={sections}
        courseBasePath="/c"
        fullyLocked
        partiallyLocked={false}
      />,
    );
    expect(screen.queryByLabelText('You have no access to Unknown unit')).not.toBeInTheDocument();
  });
});
