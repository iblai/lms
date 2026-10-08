import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Profile lookups are covered by the hook's own tests; here names resolve to the fallback.
vi.mock('@/lib/config', () => ({
  config: { urls: { lms: () => 'https://lms.example.org' } },
}));

vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string, fallback?: string) => fallback || username,
}));

vi.mock('lucide-react', () => ({
  Download: () => <span />,
  RefreshCw: (props: any) => <span data-testid="refresh-icon" className={props.className} />,
}));

const hooks = vi.hoisted(() => ({
  generate: vi.fn(),
  downloads: vi.fn(),
  tasks: vi.fn(),
  refetchDownloads: vi.fn(),
  refetchTasks: vi.fn(),
}));
vi.mock('@/services/instructor', () => ({
  useGenerateReportMutation: () => [hooks.generate, { isLoading: false }],
  useListReportDownloadsQuery: (...args: any[]) => hooks.downloads(...args),
  useListInstructorTasksQuery: (...args: any[]) => hooks.tasks(...args),
}));

import { ReportsSection, downloadHref } from '../reports-section';

const ok = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const fail = (value: unknown) => ({ unwrap: () => Promise.reject(value) });

describe('ReportsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.downloads.mockReturnValue({
      data: [],
      isFetching: false,
      refetch: hooks.refetchDownloads,
    });
    hooks.tasks.mockReturnValue({ data: [], isFetching: false, refetch: hooks.refetchTasks });
  });

  it('queues a standard report and reports the outcome', async () => {
    hooks.generate
      .mockReturnValueOnce(ok({ status: 'queued' }))
      .mockReturnValueOnce(fail(new Error('Already running')));
    render(<ReportsSection courseId="c" />);
    const buttons = screen.getAllByRole('button', { name: 'Generate' });
    fireEvent.click(buttons[0]);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Grade report queued'),
    );
    expect(hooks.generate).toHaveBeenCalledWith({
      courseId: 'c',
      report: 'calculate_grades_csv',
      problemLocation: undefined,
    });

    fireEvent.click(buttons[1]);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Already running'));
  });

  it('needs a problem location for the problem responses report', async () => {
    hooks.generate.mockReturnValue(ok({}));
    render(<ReportsSection courseId="c" />);
    const responses = screen.getAllByRole('button', { name: 'Generate' }).at(-1)!;
    expect(responses).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Problem responses'), {
      target: { value: ' block-v1:p ' },
    });
    fireEvent.click(responses);
    await waitFor(() =>
      expect(hooks.generate).toHaveBeenCalledWith({
        courseId: 'c',
        report: 'get_problem_responses',
        problemLocation: 'block-v1:p',
      }),
    );
  });

  it('lists downloads and pending tasks, and refreshes both', () => {
    hooks.downloads.mockReturnValue({
      data: [
        { name: 'grades.csv', url: '/media/grades.csv', link: '' },
        { name: 'in-s3.csv', url: 'https://bucket.s3.example.org/in-s3.csv', link: '' },
      ],
      isFetching: false,
      refetch: hooks.refetchDownloads,
    });
    hooks.tasks.mockReturnValue({
      data: [
        {
          task_id: 't1',
          task_type: 'grade_course',
          requester: 'ada',
          created: '2026-01-02T10:00:00Z',
          status: 'In Progress',
          task_state: 'PROGRESS',
        },
        {
          task_id: 't2',
          task_type: 'rescore',
          requester: 'bob',
          created: 'not-a-date',
          status: '',
          task_state: 'QUEUED',
        },
      ],
      isFetching: false,
      refetch: hooks.refetchTasks,
    });
    render(<ReportsSection courseId="c" />);

    const [download, external] = within(screen.getByTestId('report-downloads')).getAllByRole(
      'link',
      { name: /Download/ },
    );
    expect(download).toHaveAttribute('href', 'https://lms.example.org/media/grades.csv');
    expect(external).toHaveAttribute('href', 'https://bucket.s3.example.org/in-s3.csv');
    const rows = within(screen.getByTestId('pending-tasks')).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('grade_course');
    expect(rows[0]).toHaveTextContent('In Progress');
    expect(within(rows[0]).getByTestId('user-display-name')).toHaveTextContent('ada');
    expect(rows[1]).toHaveTextContent('not-a-date');
    expect(rows[1]).toHaveTextContent('QUEUED');

    fireEvent.click(screen.getByRole('button', { name: 'Refresh reports' }));
    expect(hooks.refetchDownloads).toHaveBeenCalled();
    expect(hooks.refetchTasks).toHaveBeenCalled();
  });

  it('shows empty states and a spinning refresh while fetching', () => {
    hooks.tasks.mockReturnValue({ data: [], isFetching: true, refetch: hooks.refetchTasks });
    render(<ReportsSection courseId="c" />);
    expect(screen.getByText('No reports yet.')).toBeInTheDocument();
    expect(screen.getByText('Nothing running.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh reports' })).toBeDisabled();
    expect(screen.getByTestId('refresh-icon').className).toContain('animate-spin');
  });

  it('resolves relative report paths against the LMS and leaves absolute urls alone', () => {
    expect(downloadHref('/media/grades.csv')).toBe('https://lms.example.org/media/grades.csv');
    expect(downloadHref('https://bucket.s3.example.org/x.csv')).toBe(
      'https://bucket.s3.example.org/x.csv',
    );
  });
});
