import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled, 'aria-label': label }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

const hooks = vi.hoisted(() => ({
  settings: vi.fn(),
  cohorts: vi.fn(),
  updateSettings: vi.fn(),
  createCohort: vi.fn(),
  updateCohort: vi.fn(),
  addUsers: vi.fn(),
  removeUser: vi.fn(),
}));
vi.mock('@/services/instructor', () => ({
  useGetCohortSettingsQuery: (...args: any[]) => hooks.settings(...args),
  useGetCohortsQuery: (...args: any[]) => hooks.cohorts(...args),
  useUpdateCohortSettingsMutation: () => [hooks.updateSettings, { isLoading: false }],
  useCreateCohortMutation: () => [hooks.createCohort, { isLoading: false }],
  useUpdateCohortMutation: () => [hooks.updateCohort, { isLoading: false }],
  useAddCohortUsersMutation: () => [hooks.addUsers, { isLoading: false }],
  useRemoveCohortUserMutation: () => [hooks.removeUser, { isLoading: false }],
}));

import { CohortsSection, describeCohortUsersResult } from '../cohorts-section';

const ok = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const fail = (value: unknown) => ({ unwrap: () => Promise.reject(value) });
const blue = { id: 3, name: 'Blue', assignment_type: 'manual' as const, user_count: 1 };
const red = { id: 4, name: 'Red', assignment_type: 'random' as const, user_count: 2 };

describe('describeCohortUsersResult', () => {
  it('summarises every bucket of the add-users response', () => {
    expect(
      describeCohortUsersResult({
        added: ['a'],
        changed: ['b'],
        present: ['c'],
        preassigned: ['d'],
        unknown: ['e'],
        invalid: ['f'],
      }),
    ).toBe(
      '1 added · 1 moved from another cohort · 1 already here · 1 pre-assigned (no account yet) · unknown: e · invalid: f',
    );
    expect(describeCohortUsersResult({})).toBe('Nothing changed');
  });
});

describe('CohortsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.settings.mockReturnValue({ data: { id: 1, is_cohorted: true } });
    hooks.cohorts.mockReturnValue({ data: [blue, red], isLoading: false });
  });

  it('explains how to start when cohorts are off, and toggles them on', async () => {
    hooks.settings.mockReturnValue({ data: { id: 1, is_cohorted: false } });
    hooks.updateSettings.mockReturnValue(ok({ id: 1, is_cohorted: true }));
    render(<CohortsSection courseId="c" />);
    expect(screen.getByText(/Turn cohorts on/)).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Enable cohorts' }));
    await waitFor(() =>
      expect(hooks.updateSettings).toHaveBeenCalledWith({ courseId: 'c', isCohorted: true }),
    );
  });

  it('reports a failed settings change and disables the switch until settings load', async () => {
    hooks.settings.mockReturnValue({ data: { id: 1, is_cohorted: false } });
    hooks.updateSettings.mockReturnValue(fail(new Error('nope')));
    const { rerender } = render(<CohortsSection courseId="c" />);
    fireEvent.click(screen.getByRole('switch', { name: 'Enable cohorts' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('nope'));

    hooks.settings.mockReturnValue({ data: undefined });
    rerender(<CohortsSection courseId="c" />);
    expect(screen.getByRole('switch', { name: 'Enable cohorts' })).toBeDisabled();
  });

  it('lists cohorts and creates a new one', async () => {
    hooks.createCohort.mockReturnValueOnce(ok(blue)).mockReturnValueOnce(fail({}));
    render(<CohortsSection courseId="c" />);
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    const rows = screen.getAllByTestId('cohort-row');
    expect(rows[0]).toHaveTextContent('Blue');
    expect(rows[0]).toHaveTextContent('1 learner · manual');
    expect(rows[1]).toHaveTextContent('2 learners · auto-assigned');

    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText('New cohort'), { target: { value: ' Green ' } });
    fireEvent.change(screen.getByLabelText('New cohort assignment type'), {
      target: { value: 'random' },
    });
    fireEvent.click(create);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Cohort "Green" created'),
    );
    expect(hooks.createCohort).toHaveBeenCalledWith({
      courseId: 'c',
      name: 'Green',
      assignmentType: 'random',
    });

    fireEvent.change(screen.getByLabelText('New cohort'), { target: { value: 'Dup' } });
    fireEvent.click(create);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Could not create the cohort'),
    );
  });

  it('shows loading and empty states for the cohort list', () => {
    hooks.cohorts.mockReturnValue({ data: undefined, isLoading: true });
    const { rerender } = render(<CohortsSection courseId="c" />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    hooks.cohorts.mockReturnValue({ data: [], isLoading: false });
    rerender(<CohortsSection courseId="c" />);
    expect(screen.getByText('No cohorts yet.')).toBeInTheDocument();
  });

  it('manages one cohort: rename, assignment type, add and remove learners', async () => {
    hooks.updateCohort.mockReturnValue(ok(blue));
    hooks.addUsers.mockReturnValue(ok({ added: ['ada'], unknown: ['ghost'] }));
    hooks.removeUser
      .mockReturnValueOnce(ok(undefined))
      .mockReturnValueOnce(fail(new Error('Not in cohort')));
    render(<CohortsSection courseId="c" />);
    const row = screen.getAllByTestId('cohort-row')[0];
    fireEvent.click(within(row).getByRole('button', { name: /Blue/ }));

    fireEvent.change(within(row).getByLabelText('Name'), { target: { value: 'Navy' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Rename' }));
    await waitFor(() =>
      expect(within(row).getByRole('status')).toHaveTextContent('Cohort renamed'),
    );
    expect(hooks.updateCohort).toHaveBeenCalledWith({ courseId: 'c', cohortId: 3, name: 'Navy' });

    fireEvent.change(within(row).getByLabelText('Assignment type for Blue'), {
      target: { value: 'random' },
    });
    await waitFor(() =>
      expect(within(row).getByRole('status')).toHaveTextContent('Assignment type updated'),
    );
    expect(hooks.updateCohort).toHaveBeenLastCalledWith({
      courseId: 'c',
      cohortId: 3,
      assignmentType: 'random',
    });

    fireEvent.change(within(row).getByLabelText('Add learners'), {
      target: { value: 'ada, ghost\n' },
    });
    fireEvent.click(within(row).getByRole('button', { name: 'Add to cohort' }));
    await waitFor(() =>
      expect(within(row).getByRole('status')).toHaveTextContent('1 added · unknown: ghost'),
    );
    expect(hooks.addUsers).toHaveBeenCalledWith({
      courseId: 'c',
      cohortId: 3,
      users: ['ada', 'ghost'],
    });

    fireEvent.change(within(row).getByLabelText('Remove a learner'), { target: { value: 'ada' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(within(row).getByRole('status')).toHaveTextContent('ada removed from Blue'),
    );
    expect(hooks.removeUser).toHaveBeenCalledWith({ courseId: 'c', cohortId: 3, username: 'ada' });

    fireEvent.change(within(row).getByLabelText('Remove a learner'), { target: { value: 'bob' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(within(row).getByRole('alert')).toHaveTextContent('Not in cohort'));

    fireEvent.click(within(row).getByRole('button', { name: /Close/ }));
    expect(within(row).queryByLabelText('Name')).not.toBeInTheDocument();
  });
});
