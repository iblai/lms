import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Profile lookups are covered by the hook's own tests; here names resolve to the fallback.
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string, fallback?: string) => fallback || username,
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
  Lock: () => <span data-testid="icon-lock" />,
  Search: () => <span />,
  SlidersHorizontal: () => <span />,
  X: () => <span />,
}));

// The filter UI has its own tests; here it is a stub that applies whatever it is told to.
const filterProps = vi.fn();
const stubFilters = vi.hoisted(() => ({ next: {} as Record<string, unknown> }));
vi.mock('../gradebook-filters', async () => {
  const actual =
    await vi.importActual<typeof import('../gradebook-filters')>('../gradebook-filters');
  return {
    ...actual,
    GradebookFiltersPopover: (props: any) => {
      filterProps(props);
      return (
        <button
          type="button"
          data-testid="apply-filters"
          onClick={() => props.onApply({ ...actual.EMPTY_FILTERS, ...stubFilters.next })}
        >
          apply
        </button>
      );
    },
  };
});

const dialogProps = vi.fn();
vi.mock('../grade-override-dialog', () => ({
  GradeOverrideDialog: (props: any) => {
    dialogProps(props);
    return (
      <div data-testid="override-dialog">
        <button type="button" onClick={props.onClose}>
          close
        </button>
      </div>
    );
  },
}));

const hooks = vi.hoisted(() => ({
  gradingInfo: vi.fn(),
  cohorts: vi.fn(),
  modes: vi.fn(),
  gradebook: vi.fn(),
}));
vi.mock('@/services/instructor', () => ({
  useGetGradingInfoQuery: (...args: any[]) => hooks.gradingInfo(...args),
  useGetCohortsQuery: (...args: any[]) => hooks.cohorts(...args),
  useGetCourseModesQuery: (...args: any[]) => hooks.modes(...args),
  useGetGradebookQuery: (...args: any[]) => hooks.gradebook(...args),
}));

import { CourseGradebook, cursorOf, formatPercent } from '../course-gradebook';

const COURSE = 'course-v1:org+c+run';
const HW = {
  module_id: 'hw-1',
  display_name: 'Homework 1',
  assignment_type: 'Homework',
  short_label: 'HW 01',
  graded: true,
};
const EXAM = {
  module_id: 'exam',
  display_name: 'Final',
  assignment_type: 'Final Exam',
  short_label: null,
  graded: true,
};
const gradingInfo = {
  grade_cutoffs: { Pass: 0.5 },
  assignment_types: {
    Homework: { type: 'Homework', short_label: 'HW', min_count: 1, drop_count: 0, weight: 0.4 },
    'Final Exam': {
      type: 'Final Exam',
      short_label: 'Final',
      min_count: 1,
      drop_count: 0,
      weight: 0.6,
    },
  },
  subsections: [
    {
      module_id: 'intro',
      display_name: 'Intro',
      assignment_type: null,
      short_label: null,
      graded: false,
    },
    HW,
    EXAM,
  ],
  grades_frozen: false,
  can_see_bulk_management: false,
};
const ada = {
  user_id: 1,
  username: 'ada',
  email: 'ada@x.org',
  full_name: 'Ada Lovelace',
  percent: 0.82,
  letter_grade: 'Pass',
  section_breakdown: [
    {
      module_id: 'hw-1',
      subsection_name: 'Homework 1',
      score_earned: 8,
      score_possible: 10,
      percent: 0.8,
    },
  ],
};
const bob = {
  user_id: 2,
  username: 'bob',
  email: 'bob@x.org',
  percent: 0.1,
  section_breakdown: [],
};
const page = {
  next: 'https://lms/api/grades/v1/gradebook/c/?cursor=NEXT&page_size=25',
  previous: null,
  results: [ada, bob],
  total_users_count: 6,
  filtered_users_count: 2,
};

describe('CourseGradebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.gradingInfo.mockReturnValue({ data: gradingInfo });
    hooks.cohorts.mockReturnValue({ data: [{ id: 3, name: 'Blue' }] });
    hooks.modes.mockReturnValue({
      data: {
        course_modes: [
          { slug: 'audit', name: 'Audit' },
          { slug: 'verified', name: 'Verified' },
        ],
      },
    });
    hooks.gradebook.mockReturnValue({ data: page, isLoading: false, isFetching: false });
  });

  it('helpers: cursor extraction and percent formatting', () => {
    expect(cursorOf('https://lms/x/?cursor=abc')).toBe('abc');
    expect(cursorOf('https://lms/x/')).toBeUndefined();
    expect(cursorOf(null)).toBeUndefined();
    expect(cursorOf('not a url')).toBeUndefined();
    expect(formatPercent(0.825)).toBe('83%');
  });

  it('renders the count, policy chips, graded columns and learner rows', () => {
    render(<CourseGradebook courseId={COURSE} />);
    expect(screen.getByTestId('gradebook-count')).toHaveTextContent('Showing 2 of 6 learners');
    const policy = screen.getByRole('list', { name: 'Grading policy' });
    expect(policy).toHaveTextContent('Homework · 40%');
    expect(policy).toHaveTextContent('Final Exam · 60%');

    const headers = within(screen.getByTestId('gradebook-table')).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['Learner', 'HW 01', 'Final', 'Total']);

    const rows = within(screen.getByTestId('gradebook-table')).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Ada Lovelace');
    expect(rows[0]).toHaveTextContent('ada@x.org');
    expect(rows[0]).not.toHaveTextContent('ada ·');
    expect(rows[0]).toHaveTextContent('82%');
    expect(rows[0]).toHaveTextContent('Pass');
    expect(within(rows[0]).getByTestId('gradebook-cell')).toHaveTextContent('80%');
    // Bob has no name and no attempts: email stands in for the name, dashes in the grade cells.
    expect(within(rows[1]).getByTestId('user-display-name')).toHaveTextContent('bob@x.org');
    expect(rows[1]).not.toHaveTextContent(/\bbob\b(?!@)/);
    expect(within(rows[1]).queryByTestId('gradebook-cell')).not.toBeInTheDocument();
    expect(rows[1].textContent).toContain('–');
  });

  it('passes the search and applied filters to the query, resetting the cursor', () => {
    vi.useFakeTimers();
    stubFilters.next = {
      assignmentType: 'Homework',
      assignment: 'hw-1',
      assignmentGradeMin: '10',
      courseGradeMax: '95',
      cohortId: '3',
      enrollmentMode: 'verified',
      includeCourseTeam: true,
    };
    render(<CourseGradebook courseId={COURSE} />);
    const initial = hooks.gradebook.mock.calls[0][0];
    expect(initial).toMatchObject({
      courseId: COURSE,
      pageSize: 25,
      cursor: undefined,
      includeCourseTeam: false,
    });
    expect(filterProps).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          subsections: [HW, EXAM],
          cohorts: [{ id: 3, name: 'Blue' }],
          courseModes: [
            { slug: 'audit', name: 'Audit' },
            { slug: 'verified', name: 'Verified' },
          ],
        }),
      }),
    );

    fireEvent.change(screen.getByLabelText('Search learners'), { target: { value: ' ada ' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({ userContains: 'ada' });

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({ cursor: 'NEXT' });

    fireEvent.click(screen.getByTestId('apply-filters'));
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({
      cursor: undefined,
      cohortId: '3',
      enrollmentMode: 'verified',
      assignment: 'hw-1',
      assignmentGradeMin: 10,
      assignmentGradeMax: undefined,
      courseGradeMin: undefined,
      courseGradeMax: 95,
      includeCourseTeam: true,
    });
    // Only the chosen assignment stays as a column, and the chips reflect what is applied.
    const headers = within(screen.getByTestId('gradebook-table')).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual(['Learner', 'HW 01', 'Total']);
    const chips = screen.getByRole('list', { name: 'Active filters' });
    expect(
      within(chips)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([
      'Type: Homework',
      'Assignment: HW 01',
      'Assignment grade ≥ 10%',
      'Overall grade ≤ 95%',
      'Cohort: Blue',
      'Track: Verified',
      'Course team included',
      'Clear all',
    ]);

    // Removing the type chip drops the assignment and its range with it.
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Type: Homework' }));
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({
      assignment: undefined,
      assignmentGradeMin: undefined,
      courseGradeMax: 95,
      cohortId: '3',
    });
    expect(
      within(screen.getByTestId('gradebook-table'))
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Learner', 'HW 01', 'Final', 'Total']);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({
      cohortId: undefined,
      courseGradeMax: undefined,
      includeCourseTeam: false,
    });
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('narrows the columns to one assignment type, and pages back with the previous cursor', () => {
    stubFilters.next = { assignmentType: 'Final Exam' };
    hooks.gradebook.mockReturnValue({
      data: { ...page, previous: 'https://lms/api/grades/v1/gradebook/c/?cursor=PREV' },
      isLoading: false,
      isFetching: false,
    });
    render(<CourseGradebook courseId={COURSE} />);
    fireEvent.click(screen.getByTestId('apply-filters'));
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({ assignment: undefined });
    expect(
      within(screen.getByTestId('gradebook-table'))
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Learner', 'Final', 'Total']);

    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({ cursor: 'PREV' });
  });

  it('switches cells between percent and absolute scores', () => {
    render(<CourseGradebook courseId={COURSE} />);
    expect(screen.getByTestId('gradebook-cell')).toHaveTextContent('80%');
    const absolute = screen.getByRole('button', { name: 'Absolute' });
    fireEvent.click(absolute);
    expect(absolute).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('gradebook-cell')).toHaveTextContent('8/10');
    fireEvent.click(screen.getByRole('button', { name: 'Percent' }));
    expect(screen.getByTestId('gradebook-cell')).toHaveTextContent('80%');
  });

  it('pages with the cursors from the next / previous links', () => {
    render(<CourseGradebook courseId={COURSE} />);
    const previous = screen.getByRole('button', { name: /Previous/ });
    const next = screen.getByRole('button', { name: /Next/ });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(hooks.gradebook.mock.calls.at(-1)![0]).toMatchObject({ cursor: 'NEXT' });
  });

  it('opens the override dialog from a grade cell and closes it again', () => {
    render(<CourseGradebook courseId={COURSE} />);
    fireEvent.click(screen.getByTestId('gradebook-cell'));
    expect(screen.getByTestId('override-dialog')).toBeInTheDocument();
    expect(dialogProps).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: COURSE, row: ada, subsection: HW }),
    );
    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('override-dialog')).not.toBeInTheDocument();
  });

  it('locks the cells and shows the badge when grades are frozen', () => {
    hooks.gradingInfo.mockReturnValue({ data: { ...gradingInfo, grades_frozen: true } });
    render(<CourseGradebook courseId={COURSE} />);
    expect(screen.getByText('Grades are frozen')).toBeInTheDocument();
    expect(screen.getByTestId('gradebook-cell')).toBeDisabled();
  });

  it('shows loading, empty and error states', () => {
    hooks.gradebook.mockReturnValue({ data: undefined, isLoading: true, isFetching: true });
    const { rerender } = render(<CourseGradebook courseId={COURSE} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByTestId('gradebook-count')).toHaveTextContent('Loading learners…');

    hooks.gradebook.mockReturnValue({
      data: { ...page, results: [], filtered_users_count: 0 },
      isLoading: false,
      isFetching: true,
    });
    rerender(<CourseGradebook courseId={COURSE} />);
    expect(screen.getByText('No learners match these filters.')).toBeInTheDocument();

    hooks.gradebook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('403'),
    });
    rerender(<CourseGradebook courseId={COURSE} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the gradebook. 403");
  });

  it('copes with grading info and cohorts still loading', () => {
    hooks.gradingInfo.mockReturnValue({ data: undefined });
    hooks.cohorts.mockReturnValue({ data: undefined });
    hooks.modes.mockReturnValue({ data: undefined });
    render(<CourseGradebook courseId={COURSE} />);
    expect(screen.queryByRole('list', { name: 'Grading policy' })).not.toBeInTheDocument();
    expect(within(screen.getByTestId('gradebook-table')).getAllByRole('columnheader')).toHaveLength(
      2,
    );
    expect(filterProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        options: { assignmentTypes: [], subsections: [], cohorts: [], courseModes: [] },
      }),
    );
  });
});
