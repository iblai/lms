import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string) => `Name of ${username}`,
}));
const hooks = vi.hoisted(() => ({ learners: vi.fn() }));
vi.mock('@/services/discussions', () => ({
  useGetLearnersQuery: (...args: any[]) => hooks.learners(...args),
}));

import { LearnersView } from '../learners-view';

const page = {
  results: [
    { username: 'ada', threads: 3, responses: 2, replies: 1, active_flags: 1, inactive_flags: 2 },
    {
      username: 'bob',
      threads: 0,
      responses: 1,
      replies: 0,
      active_flags: null,
      inactive_flags: null,
    },
  ],
  pagination: { count: 2, num_pages: 2, next: 'x', previous: null },
};

describe('LearnersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.learners.mockReturnValue({ data: page, isLoading: false, isFetching: false });
  });

  it('lists learners with their activity and opens one on click', () => {
    const onSelect = vi.fn();
    render(<LearnersView courseId="c" canModerate={false} onSelectLearner={onSelect} />);
    expect(hooks.learners).toHaveBeenCalledWith({
      courseId: 'c',
      page: 1,
      orderBy: 'activity',
      username: undefined,
    });
    const rows = screen.getAllByTestId('learner-row');
    expect(rows[0]).toHaveTextContent('Name of ada');
    expect(screen.queryByRole('columnheader', { name: 'Reported' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Most reported' })).not.toBeInTheDocument();
    fireEvent.click(rows[1]);
    expect(onSelect).toHaveBeenCalledWith('bob');
  });

  it('shows flags to moderators, and sorts, searches and pages', () => {
    vi.useFakeTimers();
    render(<LearnersView courseId="c" canModerate onSelectLearner={vi.fn()} />);
    expect(screen.getByRole('columnheader', { name: 'Reported' })).toBeInTheDocument();
    const cells = screen.getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toContain('3');
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort learners' }), {
      target: { value: 'flagged' },
    });
    expect(hooks.learners).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderBy: 'flagged' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(hooks.learners).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(hooks.learners).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search learners' }), {
      target: { value: ' ada ' },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(hooks.learners).toHaveBeenLastCalledWith(
      expect.objectContaining({ username: 'ada', page: 1 }),
    );
    vi.useRealTimers();
  });

  it('shows the loading, empty and error states', () => {
    hooks.learners.mockReturnValue({ data: undefined, isLoading: true, isFetching: true });
    const { unmount } = render(
      <LearnersView courseId="c" canModerate={false} onSelectLearner={vi.fn()} />,
    );
    expect(screen.getByText('Loading learners…')).toBeInTheDocument();
    unmount();
    hooks.learners.mockReturnValue({
      data: { results: [], pagination: { count: 0, num_pages: 1, next: null, previous: null } },
      isLoading: false,
      isFetching: true,
    });
    const empty = render(
      <LearnersView courseId="c" canModerate={false} onSelectLearner={vi.fn()} />,
    );
    expect(screen.getByTestId('learners-empty')).toBeInTheDocument();
    empty.unmount();
    hooks.learners.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('boom'),
    });
    render(<LearnersView courseId="c" canModerate={false} onSelectLearner={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the learners. boom");
  });
});
