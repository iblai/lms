import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span />,
  SlidersHorizontal: () => <span />,
  X: () => <span />,
}));

// Radix popovers need layout APIs jsdom lacks; render the content inline and
// expose open/close through buttons.
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      <button type="button" onClick={() => onOpenChange(true)}>
        open popover
      </button>
      <button type="button" onClick={() => onOpenChange(false)}>
        close popover
      </button>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, className, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      className={className}
      onChange={(event) => onCheckedChange(event.target.checked)}
      {...props}
    />
  ),
}));

import {
  EMPTY_FILTERS,
  GradebookFilterChips,
  GradebookFiltersPopover,
  activeFilterChips,
  parsePercent,
  rangeError,
  withoutFilter,
  type FilterOptions,
  type GradebookFilters,
} from '../gradebook-filters';

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
const options: FilterOptions = {
  assignmentTypes: [
    { type: 'Homework', short_label: 'HW', min_count: 1, drop_count: 0, weight: 0.4 },
    { type: 'Final Exam', short_label: 'Final', min_count: 1, drop_count: 0, weight: 0.6 },
  ],
  subsections: [HW, EXAM],
  cohorts: [{ id: 3, name: 'Blue', assignment_type: 'manual', user_count: 2 }],
  courseModes: [
    { slug: 'audit', name: 'Audit' },
    { slug: 'verified', name: 'Verified' },
  ],
};
const everything: GradebookFilters = {
  assignmentType: 'Homework',
  assignment: 'hw-1',
  assignmentGradeMin: '10',
  assignmentGradeMax: '90',
  courseGradeMin: '5',
  courseGradeMax: '',
  cohortId: '3',
  enrollmentMode: 'audit',
  includeCourseTeam: true,
};

describe('gradebook filter helpers', () => {
  it('parses and validates percentages', () => {
    expect(parsePercent('')).toBeUndefined();
    expect(parsePercent(' ')).toBeUndefined();
    expect(parsePercent('42')).toBe(42);
    expect(rangeError('', '')).toBeNull();
    expect(rangeError('10', '90')).toBeNull();
    expect(rangeError('101', '')).toBe('Use percentages from 0 to 100.');
    expect(rangeError('', '-1')).toBe('Use percentages from 0 to 100.');
    expect(rangeError('abc', '')).toBe('Use percentages from 0 to 100.');
    expect(rangeError('90', '10')).toBe('Min can’t be above max.');
  });

  it('describes every active filter as a chip, naming things from the options', () => {
    expect(activeFilterChips(EMPTY_FILTERS, options)).toEqual([]);
    expect(activeFilterChips(everything, options).map((chip) => chip.label)).toEqual([
      'Type: Homework',
      'Assignment: HW 01',
      'Assignment grade 10–90%',
      'Overall grade ≥ 5%',
      'Cohort: Blue',
      'Track: Audit',
      'Course team included',
    ]);
    // Unknown ids and an exam without a short label fall back to what is known.
    const labels = activeFilterChips(
      {
        ...everything,
        assignment: 'exam',
        cohortId: '9',
        enrollmentMode: 'honor',
        courseGradeMin: '',
        courseGradeMax: '50',
      },
      options,
    ).map((chip) => chip.label);
    expect(labels).toContain('Assignment: Final');
    expect(labels).toContain('Overall grade ≤ 50%');
    expect(labels).toContain('Cohort: 9');
    expect(labels).toContain('Track: honor');
    expect(activeFilterChips({ ...everything, assignment: 'gone' }, options)[1].label).toBe(
      'Assignment: gone',
    );
    // An assignment grade range without an assignment is not a filter.
    expect(activeFilterChips({ ...EMPTY_FILTERS, assignmentGradeMin: '10' }, options)).toEqual([]);
  });

  it('removes a filter together with what depends on it', () => {
    expect(withoutFilter(everything, 'assignmentType')).toMatchObject({
      assignmentType: '',
      assignment: '',
      assignmentGradeMin: '',
      assignmentGradeMax: '',
      cohortId: '3',
    });
    expect(withoutFilter(everything, 'assignment')).toMatchObject({
      assignmentType: 'Homework',
      assignment: '',
      assignmentGradeMin: '',
    });
    expect(withoutFilter(everything, 'assignmentGradeMax')).toMatchObject({
      assignment: 'hw-1',
      assignmentGradeMin: '',
      assignmentGradeMax: '',
    });
    expect(withoutFilter(everything, 'courseGradeMin')).toMatchObject({
      courseGradeMin: '',
      courseGradeMax: '',
    });
    expect(withoutFilter(everything, 'includeCourseTeam').includeCourseTeam).toBe(false);
    expect(withoutFilter(everything, 'cohortId').cohortId).toBe('');
  });
});

describe('GradebookFiltersPopover', () => {
  it('shows how many filters are active on the trigger', () => {
    const { rerender } = render(
      <GradebookFiltersPopover value={EMPTY_FILTERS} options={options} onApply={vi.fn()} />,
    );
    expect(screen.getByTestId('gradebook-filters-trigger')).toHaveTextContent(/^Filters$/);
    rerender(<GradebookFiltersPopover value={everything} options={options} onApply={vi.fn()} />);
    expect(screen.getByTestId('gradebook-filters-trigger')).toHaveTextContent('Filters7');
  });

  it('edits a draft and applies it as one change', () => {
    const onApply = vi.fn();
    render(<GradebookFiltersPopover value={EMPTY_FILTERS} options={options} onApply={onApply} />);
    fireEvent.click(screen.getByText('open popover'));

    const assignment = screen.getByLabelText('Assignment') as HTMLSelectElement;
    expect(
      within(assignment)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['All assignments', 'HW 01 · Homework 1', 'Final']);
    expect(screen.getByLabelText('Assignment grade min')).toBeDisabled();
    expect(screen.getByText('Pick an assignment to filter by its grade.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Assignment type'), { target: { value: 'Homework' } });
    expect(
      within(assignment)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['All assignments', 'HW 01 · Homework 1']);
    fireEvent.change(assignment, { target: { value: 'hw-1' } });
    expect(screen.getByLabelText('Assignment grade min')).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Assignment grade min'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Assignment grade max'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Overall grade max'), { target: { value: '95' } });
    fireEvent.change(screen.getByLabelText('Track'), { target: { value: 'verified' } });
    fireEvent.change(screen.getByLabelText('Cohort'), { target: { value: '3' } });
    // The label is tied to the box by id (not wrapped), so clicking its text toggles it once.
    const includeTeam = screen.getByLabelText('Include course team members');
    expect(includeTeam).toHaveAttribute('id', 'filter-include-course-team');
    fireEvent.click(screen.getByText('Include course team members'));
    expect(includeTeam).toBeChecked();
    expect(includeTeam.className).toContain('data-[state=checked]:bg-amber-500');

    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(onApply).toHaveBeenCalledWith({
      assignmentType: 'Homework',
      assignment: 'hw-1',
      assignmentGradeMin: '10',
      assignmentGradeMax: '90',
      courseGradeMin: '',
      courseGradeMax: '95',
      cohortId: '3',
      enrollmentMode: 'verified',
      includeCourseTeam: true,
    });
    expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'false');
  });

  it('keeps or drops the chosen assignment as the type changes', () => {
    render(<GradebookFiltersPopover value={everything} options={options} onApply={vi.fn()} />);
    fireEvent.click(screen.getByText('open popover'));
    const assignment = screen.getByLabelText('Assignment') as HTMLSelectElement;
    expect(assignment.value).toBe('hw-1');

    // Widening to all types keeps Homework 1 selected …
    fireEvent.change(screen.getByLabelText('Assignment type'), { target: { value: '' } });
    expect(assignment.value).toBe('hw-1');
    expect((screen.getByLabelText('Assignment grade min') as HTMLInputElement).value).toBe('10');

    // … switching to a type it is not part of drops it and its grade range.
    fireEvent.change(screen.getByLabelText('Assignment type'), { target: { value: 'Final Exam' } });
    expect(assignment.value).toBe('');
    expect((screen.getByLabelText('Assignment grade min') as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('Assignment grade min')).toBeDisabled();

    // Clearing the assignment by hand does the same.
    fireEvent.change(assignment, { target: { value: 'exam' } });
    fireEvent.change(screen.getByLabelText('Assignment grade max'), { target: { value: '50' } });
    fireEvent.change(assignment, { target: { value: '' } });
    expect((screen.getByLabelText('Assignment grade max') as HTMLInputElement).value).toBe('');
  });

  it('blocks Apply on an invalid range and clears the draft', () => {
    const onApply = vi.fn();
    render(<GradebookFiltersPopover value={everything} options={options} onApply={onApply} />);
    fireEvent.click(screen.getByText('open popover'));
    fireEvent.change(screen.getByLabelText('Overall grade min'), { target: { value: '120' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Use percentages from 0 to 100.');
    expect(screen.getByRole('button', { name: 'Apply filters' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Assignment grade min'), { target: { value: '95' } });
    expect(screen.getAllByRole('alert')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect((screen.getByLabelText('Cohort') as HTMLSelectElement).value).toBe('');
    expect(screen.getByLabelText('Include course team members')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(onApply).toHaveBeenCalledWith(EMPTY_FILTERS);
  });

  it('discards unapplied edits when reopened', () => {
    render(<GradebookFiltersPopover value={EMPTY_FILTERS} options={options} onApply={vi.fn()} />);
    fireEvent.click(screen.getByText('open popover'));
    fireEvent.change(screen.getByLabelText('Track'), { target: { value: 'audit' } });
    fireEvent.click(screen.getByText('close popover'));
    fireEvent.click(screen.getByText('open popover'));
    expect((screen.getByLabelText('Track') as HTMLSelectElement).value).toBe('');
  });

  it('disables the pickers that have nothing to offer', () => {
    render(
      <GradebookFiltersPopover
        value={EMPTY_FILTERS}
        options={{ assignmentTypes: [], subsections: [], cohorts: [], courseModes: [] }}
        onApply={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('open popover'));
    expect(screen.getByLabelText('Assignment')).toBeDisabled();
    expect(screen.getByLabelText('Assignment')).toHaveTextContent('No graded assignments');
    expect(screen.getByLabelText('Cohort')).toBeDisabled();
    expect(screen.getByLabelText('Cohort')).toHaveTextContent('No cohorts');
    expect(screen.getByLabelText('Track')).toBeDisabled();
  });
});

describe('GradebookFilterChips', () => {
  it('renders nothing without filters and removes one or all of them', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <GradebookFilterChips value={EMPTY_FILTERS} options={options} onChange={onChange} />,
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    rerender(<GradebookFilterChips value={everything} options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Cohort: Blue' }));
    expect(onChange).toHaveBeenCalledWith({ ...everything, cohortId: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });
});
