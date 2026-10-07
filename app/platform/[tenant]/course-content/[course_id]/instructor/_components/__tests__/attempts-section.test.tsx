import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('lucide-react', () => ({ ArrowUpRight: () => <span /> }));

const hooks = vi.hoisted(() => ({
  lookup: vi.fn(),
  lookupResult: { data: undefined as unknown, isFetching: false },
  reset: vi.fn(),
  rescore: vi.fn(),
  override: vi.fn(),
}));
vi.mock('@/services/instructor', () => ({
  useLazyGetStudentProgressUrlQuery: () => [hooks.lookup, hooks.lookupResult],
  useResetStudentAttemptsMutation: () => [hooks.reset, { isLoading: false }],
  useRescoreProblemMutation: () => [hooks.rescore, { isLoading: false }],
  useOverrideProblemScoreMutation: () => [hooks.override, { isLoading: false }],
}));

import { AttemptsSection } from '../attempts-section';

const ok = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const fail = (value: unknown) => ({ unwrap: () => Promise.reject(value) });

const fill = () => {
  fireEvent.change(screen.getByLabelText('Email or username'), { target: { value: ' ada ' } });
  fireEvent.change(screen.getByLabelText('Problem location'), { target: { value: 'block-v1:p' } });
};

describe('AttemptsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.lookupResult = { data: undefined, isFetching: false };
  });

  it('looks up a learner and links to their progress page', () => {
    hooks.lookupResult = {
      data: { course_id: 'c', progress_url: 'https://lms/progress/1' },
      isFetching: false,
    };
    render(<AttemptsSection courseId="c" />);
    const form = screen.getByLabelText('Email or username').closest('form')!;
    fireEvent.submit(form);
    expect(hooks.lookup).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Email or username'), { target: { value: 'ada' } });
    fireEvent.submit(form);
    expect(hooks.lookup).toHaveBeenCalledWith({ courseId: 'c', identifier: 'ada' });
    expect(screen.getByRole('link', { name: 'Open progress page' })).toHaveAttribute(
      'href',
      'https://lms/progress/1',
    );
  });

  it('shows the lookup in progress', () => {
    hooks.lookupResult = { data: undefined, isFetching: true };
    render(<AttemptsSection courseId="c" />);
    expect(screen.getByRole('button', { name: 'Looking up…' })).toBeDisabled();
  });

  it('resets, deletes state, rescores and overrides for one learner', async () => {
    hooks.reset.mockReturnValue(ok({}));
    hooks.rescore.mockReturnValue(ok({}));
    hooks.override.mockReturnValue(ok({}));
    render(<AttemptsSection courseId="c" />);
    expect(screen.getByRole('button', { name: 'Reset attempts' })).toBeDisabled();
    fill();

    fireEvent.click(screen.getByRole('button', { name: 'Reset attempts' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Attempts reset for ada'),
    );
    expect(hooks.reset).toHaveBeenCalledWith({
      courseId: 'c',
      problemLocation: 'block-v1:p',
      identifier: 'ada',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete learner state' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('State deleted for ada'),
    );
    expect(hooks.reset).toHaveBeenLastCalledWith(expect.objectContaining({ deleteModule: true }));

    fireEvent.click(screen.getByRole('button', { name: 'Rescore' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Rescore queued for ada'),
    );
    expect(hooks.rescore).toHaveBeenCalledWith({
      courseId: 'c',
      problemLocation: 'block-v1:p',
      identifier: 'ada',
    });

    const override = screen.getByRole('button', { name: 'Override score' });
    expect(override).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Score override'), { target: { value: '2.5' } });
    fireEvent.click(override);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Score override queued for ada'),
    );
    expect(hooks.override).toHaveBeenCalledWith({
      courseId: 'c',
      problemLocation: 'block-v1:p',
      identifier: 'ada',
      score: 2.5,
    });
  });

  it('reports a failed learner action', async () => {
    hooks.reset.mockReturnValue(fail(new Error('Unknown problem')));
    render(<AttemptsSection courseId="c" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Reset attempts' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Unknown problem'));
  });

  it('asks for confirmation before course-wide reset / rescore and allows cancelling', async () => {
    hooks.reset.mockReturnValue(ok({}));
    hooks.rescore.mockReturnValue(fail({}));
    render(<AttemptsSection courseId="c" />);
    fireEvent.change(screen.getByLabelText('Problem location'), {
      target: { value: 'block-v1:p' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset attempts for all learners' }));
    expect(screen.getByText(/Reset attempts on this problem for/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(/Reset attempts on this problem for/)).not.toBeInTheDocument();
    expect(hooks.reset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reset attempts for all learners' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, continue' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Course-wide reset queued'),
    );
    expect(hooks.reset).toHaveBeenCalledWith({
      courseId: 'c',
      problemLocation: 'block-v1:p',
      allStudents: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rescore for all learners' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, continue' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The action failed'));
    expect(hooks.rescore).toHaveBeenCalledWith({
      courseId: 'c',
      problemLocation: 'block-v1:p',
      allStudents: true,
    });
  });
});
