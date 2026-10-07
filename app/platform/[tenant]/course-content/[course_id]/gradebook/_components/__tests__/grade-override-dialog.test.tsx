import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Profile lookups are covered by the hook's own tests; here names resolve to the fallback.
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string, fallback?: string) => fallback || username,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Radix dialog needs pointer APIs jsdom lacks; render the content inline.
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, onOpenChange }: any) => (
    <div data-testid="dialog">
      <button type="button" onClick={() => onOpenChange(false)}>
        dismiss
      </button>
      {children}
    </div>
  ),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

const hooks = vi.hoisted(() => ({ subsection: vi.fn(), bulkUpdate: vi.fn() }));
vi.mock('@/services/instructor', () => ({
  useGetSubsectionGradeQuery: (...args: any[]) => hooks.subsection(...args),
  useBulkUpdateGradesMutation: () => [hooks.bulkUpdate, { isLoading: false }],
}));

import { toast } from 'sonner';
import { GradeOverrideDialog } from '../grade-override-dialog';

const row = {
  user_id: 1,
  username: 'ada',
  email: 'ada@x.org',
  full_name: 'Ada Lovelace',
  percent: 0.8,
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
const subsection = {
  module_id: 'hw-1',
  display_name: 'Homework 1',
  assignment_type: 'Homework',
  short_label: 'HW',
  graded: true,
};

const unwrap = (value: unknown, reject = false) => ({
  unwrap: () => (reject ? Promise.reject(value) : Promise.resolve(value)),
});

describe('GradeOverrideDialog', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.subsection.mockReturnValue({
      data: {
        original_grade: { earned_graded: 6, possible_graded: 10 },
        history: [
          {
            created: '2026-01-02T10:00:00Z',
            earned_graded_override: 7,
            possible_graded_override: 10,
            comments: 'Late work',
          },
        ],
      },
    });
  });

  it('shows the current and original scores plus the override history', () => {
    render(
      <GradeOverrideDialog courseId="c" row={row} subsection={subsection} onClose={onClose} />,
    );
    expect(hooks.subsection).toHaveBeenCalledWith({ usageId: 'hw-1', userId: 1 });
    expect(screen.getByText('Ada Lovelace · Homework 1')).toBeInTheDocument();
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
    expect(screen.getByText('6 / 10')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText(/Late work/)).toBeInTheDocument();
    expect(screen.getByLabelText('New score (out of 10)')).toHaveValue(8);
  });

  it('saves a valid override and closes with a success toast', async () => {
    hooks.bulkUpdate.mockReturnValue(
      unwrap([{ user_id: 1, usage_id: 'hw-1', success: true, reason: null }]),
    );
    render(
      <GradeOverrideDialog courseId="c" row={row} subsection={subsection} onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText('New score (out of 10)'), { target: { value: '9.5' } });
    fireEvent.change(screen.getByLabelText('Reason (optional)'), {
      target: { value: ' Regrade ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save override' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(hooks.bulkUpdate).toHaveBeenCalledWith({
      courseId: 'c',
      updates: [
        {
          user_id: 1,
          usage_id: 'hw-1',
          grade: { earned_graded_override: 9.5, possible_graded_override: 10, comment: 'Regrade' },
        },
      ],
    });
    expect(toast.success).toHaveBeenCalledWith('Grade updated for Ada Lovelace');
  });

  it('refuses scores outside 0..possible', () => {
    render(
      <GradeOverrideDialog courseId="c" row={row} subsection={subsection} onClose={onClose} />,
    );
    const save = screen.getByRole('button', { name: 'Save override' });
    fireEvent.change(screen.getByLabelText('New score (out of 10)'), { target: { value: '11' } });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('New score (out of 10)'), { target: { value: '' } });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('New score (out of 10)'), { target: { value: '10' } });
    expect(save).toBeEnabled();
  });

  it('surfaces a per-row failure from the API without closing', async () => {
    hooks.bulkUpdate.mockReturnValue(
      unwrap([{ user_id: 1, usage_id: 'hw-1', success: false, reason: 'Grades are frozen' }]),
    );
    render(
      <GradeOverrideDialog courseId="c" row={row} subsection={subsection} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save override' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Grades are frozen'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('surfaces a request failure, falling back to a generic message', async () => {
    hooks.bulkUpdate.mockReturnValueOnce(unwrap(new Error('boom'), true));
    render(
      <GradeOverrideDialog courseId="c" row={row} subsection={subsection} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save override' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('boom'));

    hooks.bulkUpdate.mockReturnValueOnce(unwrap({}, true));
    fireEvent.click(screen.getByRole('button', { name: 'Save override' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('The grade could not be overridden'),
    );

    hooks.bulkUpdate.mockReturnValueOnce(
      unwrap([{ user_id: 1, usage_id: 'hw-1', success: false, reason: null }]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save override' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(3));
  });

  it('handles a cell with no attempt yet and no history', () => {
    hooks.subsection.mockReturnValue({ data: undefined });
    render(
      <GradeOverrideDialog
        courseId="c"
        row={{ ...row, full_name: undefined, section_breakdown: [] }}
        subsection={subsection}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('ada@x.org · Homework 1')).toBeInTheDocument();
    expect(screen.getAllByText('–')).toHaveLength(2);
    expect(screen.queryByText('History')).not.toBeInTheDocument();
    expect(screen.getByLabelText('New score (out of 0)')).toHaveValue(null);
  });

  it('closes from the Cancel button and from the dialog itself', () => {
    render(
      <GradeOverrideDialog courseId="c" row={row} subsection={subsection} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByText('dismiss'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
