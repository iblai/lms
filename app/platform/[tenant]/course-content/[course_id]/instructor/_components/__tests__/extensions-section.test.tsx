import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const hooks = vi.hoisted(() => ({
  gradingInfo: vi.fn(),
  changeDueDate: vi.fn(),
  resetDueDate: vi.fn(),
  lookupStudent: vi.fn(),
  lookupUnit: vi.fn(),
  studentResult: { data: undefined as unknown, isFetching: false },
  unitResult: { data: undefined as unknown, isFetching: false },
}));
// Profile lookups are covered by the hook's own tests; here names resolve to the fallback.
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string, fallback?: string) => fallback || username,
}));

vi.mock('@/services/instructor', () => ({
  useGetGradingInfoQuery: (...args: any[]) => hooks.gradingInfo(...args),
  useChangeDueDateMutation: () => [hooks.changeDueDate, { isLoading: false }],
  useResetDueDateMutation: () => [hooks.resetDueDate, { isLoading: false }],
  useLazyShowStudentExtensionsQuery: () => [hooks.lookupStudent, hooks.studentResult],
  useLazyShowUnitExtensionsQuery: () => [hooks.lookupUnit, hooks.unitResult],
}));

import { ExtensionsSection, toLmsDatetime } from '../extensions-section';

const ok = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const fail = (value: unknown) => ({ unwrap: () => Promise.reject(value) });

const fill = () => {
  fireEvent.change(screen.getByLabelText('Learner (email or username)'), {
    target: { value: ' ada ' },
  });
  fireEvent.change(screen.getByLabelText('Subsection'), { target: { value: 'hw-1' } });
  fireEvent.change(screen.getByLabelText('New due date'), {
    target: { value: '2026-03-01T09:30' },
  });
};

describe('ExtensionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.studentResult = { data: undefined, isFetching: false };
    hooks.unitResult = { data: undefined, isFetching: false };
    hooks.gradingInfo.mockReturnValue({
      data: {
        subsections: [
          { module_id: 'hw-1', display_name: 'Homework 1', graded: true },
          { module_id: 'intro', display_name: 'Intro', graded: false },
        ],
      },
    });
  });

  it('converts the datetime-local value to the LMS format', () => {
    expect(toLmsDatetime('2026-03-01T09:30')).toBe('2026-03-01 09:30');
  });

  it('extends a due date for a learner on a subsection', async () => {
    hooks.changeDueDate.mockReturnValue(ok({}));
    render(<ExtensionsSection courseId="c" />);
    const extend = screen.getByRole('button', { name: 'Extend due date' });
    expect(extend).toBeDisabled();
    fill();
    fireEvent.click(extend);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Due date for "Homework 1" extended for ada',
      ),
    );
    expect(hooks.changeDueDate).toHaveBeenCalledWith({
      courseId: 'c',
      identifier: 'ada',
      unitLocation: 'hw-1',
      dueDatetime: '2026-03-01 09:30',
    });
  });

  it('resets an extension and reports failures', async () => {
    hooks.resetDueDate
      .mockReturnValueOnce(ok({}))
      .mockReturnValueOnce(fail(new Error('No extension')));
    render(<ExtensionsSection courseId="c" />);
    fill();
    const reset = screen.getByRole('button', { name: 'Reset to course due date' });
    fireEvent.click(reset);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Extension on "Homework 1" removed for ada',
      ),
    );
    expect(hooks.resetDueDate).toHaveBeenCalledWith({
      courseId: 'c',
      identifier: 'ada',
      unitLocation: 'hw-1',
    });
    fireEvent.click(reset);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No extension'));
  });

  it('looks up extensions by learner and by subsection and renders the tables', () => {
    hooks.studentResult = {
      data: {
        header: ['Unit', 'Extended Due Date'],
        title: 'Extensions for ada',
        data: [{ Unit: 'Homework 1', 'Extended Due Date': '2026-03-01 09:30' }],
      },
      isFetching: false,
    };
    hooks.unitResult = {
      data: {
        header: ['Username', 'Full Name', 'Extended Due Date'],
        title: 'Extensions for Homework 1',
        data: [
          { Username: 'bob', 'Full Name': 'Bob Byte', 'Extended Due Date': '2026-04-01 10:00' },
        ],
      },
      isFetching: false,
    };
    render(<ExtensionsSection courseId="c" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Show learner’s extensions' }));
    expect(hooks.lookupStudent).toHaveBeenCalledWith({ courseId: 'c', identifier: 'ada' });
    fireEvent.click(screen.getByRole('button', { name: 'Show subsection extensions' }));
    expect(hooks.lookupUnit).toHaveBeenCalledWith({ courseId: 'c', unitLocation: 'hw-1' });

    const tables = screen.getAllByTestId('extensions-table');
    expect(tables[0]).toHaveTextContent('Extensions for ada');
    expect(tables[0]).toHaveTextContent('2026-03-01 09:30');
    // One "Learner" column stands in for the LMS's Username + Full Name pair.
    expect(
      within(tables[1])
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Learner', 'Extended Due Date']);
    expect(within(tables[1]).getByTestId('user-display-name')).toHaveTextContent('Bob Byte');
    expect(tables[1]).not.toHaveTextContent(/\bbob\b/);
  });

  it('says so when a subsection has no extensions', () => {
    hooks.unitResult = {
      data: {
        header: ['Username', 'Full Name', 'Extended Due Date'],
        title: 'Extensions',
        data: [],
      },
      isFetching: false,
    };
    render(<ExtensionsSection courseId="c" />);
    expect(screen.getByTestId('extensions-table')).toHaveTextContent('No extensions.');
  });

  it('shows loading labels on the lookup buttons and copes without grading info', () => {
    hooks.gradingInfo.mockReturnValue({ data: undefined });
    hooks.studentResult = { data: undefined, isFetching: true };
    hooks.unitResult = { data: undefined, isFetching: true };
    render(<ExtensionsSection courseId="c" />);
    expect(screen.getAllByRole('button', { name: 'Loading…' })).toHaveLength(2);
    expect(screen.getByLabelText('Subsection').querySelectorAll('option')).toHaveLength(1);
  });
});
