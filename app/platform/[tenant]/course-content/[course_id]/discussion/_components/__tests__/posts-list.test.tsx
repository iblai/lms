import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { DiscussionThread } from '@/types/discussions';

vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string) => `Name of ${username}`,
}));
const hooks = vi.hoisted(() => ({ threads: vi.fn() }));
vi.mock('@/services/discussions', () => ({
  useGetThreadsQuery: (...args: any[]) => hooks.threads(...args),
}));

import { AuthorName, Avatar, PostsList, ThreadRow } from '../posts-list';

const thread = (overrides: Partial<DiscussionThread>): DiscussionThread =>
  ({
    id: 't1',
    course_id: 'c',
    topic_id: 'course',
    author: 'ada',
    author_label: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
    type: 'discussion',
    title: 'First post',
    raw_body: 'b',
    rendered_body: '<p>b</p>',
    preview_body: 'preview text',
    abuse_flagged: false,
    voted: false,
    vote_count: 2,
    editable_fields: [],
    pinned: false,
    closed: false,
    following: false,
    comment_count: 3,
    unread_comment_count: 0,
    read: true,
    has_endorsed: false,
    ...overrides,
  }) as DiscussionThread;

const page = (results: DiscussionThread[], num_pages = 1) => ({
  results,
  pagination: { count: results.length, num_pages, next: null, previous: null },
  users: { ada: { profile: { image: { image_url_small: 'https://img/ada.png' } } } },
});

const baseProps = {
  courseId: 'c',
  onSelect: vi.fn(),
  canModerate: false,
  postingEnabled: true,
  onAddPost: vi.fn(),
};

describe('ThreadRow / Avatar / AuthorName', () => {
  it('shows the post’s state, counts and author', () => {
    const onSelect = vi.fn();
    const row = thread({
      read: false,
      pinned: true,
      closed: true,
      following: true,
      abuse_flagged: true,
      author_label: 'Staff',
      type: 'question',
    });
    render(
      <ul>
        <ThreadRow thread={row} users={page([]).users} selected onSelect={onSelect} />
      </ul>,
    );
    const button = screen.getByTestId('thread-row');
    expect(button).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('thread-unread')).toBeInTheDocument();
    expect(screen.getByLabelText('Question')).toBeInTheDocument();
    expect(button).toHaveTextContent('Pinned');
    expect(button).toHaveTextContent('Closed');
    expect(button).toHaveTextContent('Following');
    expect(button).toHaveTextContent('Reported');
    expect(button).toHaveTextContent('Staff');
    expect(button).toHaveTextContent('preview text');
    expect(screen.getByLabelText('2 votes')).toBeInTheDocument();
    expect(screen.getByLabelText('3 responses')).toBeInTheDocument();
    expect(button.querySelector('img')).toHaveAttribute('src', 'https://img/ada.png');
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('t1');
  });

  it('falls back to initials, the thread’s own users and Anonymous', () => {
    render(
      <ul>
        <ThreadRow
          thread={thread({
            author: null,
            preview_body: undefined,
            users: { bob: { profile: { image: { image_url_small: 'https://img/bob.png' } } } },
          })}
          users={undefined}
          selected={false}
          onSelect={vi.fn()}
        />
      </ul>,
    );
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
    expect(screen.getByLabelText('Discussion')).toBeInTheDocument();
    expect(screen.getByTestId('thread-row').querySelector('img')).toBeNull();
    const { container } = render(<Avatar url={null} name="zed" />);
    expect(container).toHaveTextContent('z');
    render(<AuthorName username="ada" label="Moderator" />);
    expect(screen.getByText('Name of ada')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });
});

describe('PostsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.threads.mockReturnValue({
      data: page([thread({}), thread({ id: 't2', title: 'Second' })]),
      isLoading: false,
      isFetching: false,
    });
  });

  it('queries with the defaults and passes topic, author and selection through', () => {
    render(<PostsList {...baseProps} topicId="course" author="ada" selectedThreadId="t2" />);
    expect(hooks.threads).toHaveBeenCalledWith({
      courseId: 'c',
      page: 1,
      pageSize: 20,
      topicId: 'course',
      author: 'ada',
      textSearch: undefined,
      threadType: undefined,
      orderBy: 'last_activity_at',
      countFlagged: undefined,
    });
    const rows = screen.getAllByTestId('thread-row');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
  });

  it('maps the filters, search and sort onto the query and resets paging', () => {
    vi.useFakeTimers();
    hooks.threads.mockReturnValue({
      data: page([thread({})], 3),
      isLoading: false,
      isFetching: false,
    });
    render(<PostsList {...baseProps} canModerate />);
    expect(hooks.threads).toHaveBeenLastCalledWith(expect.objectContaining({ countFlagged: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(hooks.threads).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Post type' }), {
      target: { value: 'question' },
    });
    expect(hooks.threads).toHaveBeenLastCalledWith(
      expect.objectContaining({ threadType: 'question', page: 1 }),
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Post status' }), {
      target: { value: 'reported' },
    });
    expect(hooks.threads).toHaveBeenLastCalledWith(expect.objectContaining({ flagged: true }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Post status' }), {
      target: { value: 'unread' },
    });
    expect(hooks.threads).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'unread' }));
    expect(hooks.threads).toHaveBeenLastCalledWith(expect.not.objectContaining({ flagged: true }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort posts' }), {
      target: { value: 'vote_count' },
    });
    expect(hooks.threads).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderBy: 'vote_count' }),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Search posts' }), {
      target: { value: ' hello ' },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(hooks.threads).toHaveBeenLastCalledWith(
      expect.objectContaining({ textSearch: 'hello', page: 1 }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    vi.useRealTimers();
  });

  it('hides the reported filter and the add button for the right people', () => {
    render(<PostsList {...baseProps} postingEnabled={false} />);
    expect(screen.queryByRole('option', { name: 'Reported' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add a post/ })).not.toBeInTheDocument();
  });

  it('opens the composer and goes back from a narrowed list', () => {
    const onBack = vi.fn();
    render(
      <PostsList
        {...baseProps}
        heading={{ title: 'Lesson 1', subtitle: 'Posts in this topic', onBack }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Lesson 1' })).toBeInTheDocument();
    expect(screen.getByText('Posts in this topic')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Add a post/ }));
    expect(baseProps.onAddPost).toHaveBeenCalled();
  });

  it('explains an empty list depending on why it is empty', () => {
    hooks.threads.mockReturnValue({ data: page([]), isLoading: false, isFetching: false });
    const { unmount } = render(<PostsList {...baseProps} />);
    expect(screen.getByTestId('posts-empty')).toHaveTextContent(
      'Be the first to start a conversation.',
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Post type' }), {
      target: { value: 'question' },
    });
    expect(screen.getByTestId('posts-empty')).toHaveTextContent('No posts match these filters.');
    unmount();
    render(<PostsList {...baseProps} postingEnabled={false} />);
    expect(screen.getByTestId('posts-empty')).toHaveTextContent(
      'Posting is turned off for this course.',
    );
  });

  it('shows the loading, refreshing and error states', () => {
    hooks.threads.mockReturnValue({ data: undefined, isLoading: true, isFetching: true });
    const { unmount } = render(<PostsList {...baseProps} />);
    expect(screen.getByText('Loading posts…')).toBeInTheDocument();
    unmount();
    hooks.threads.mockReturnValue({ data: page([thread({})]), isLoading: false, isFetching: true });
    const refreshing = render(<PostsList {...baseProps} />);
    expect(screen.getByRole('list', { name: 'Posts' })).toHaveClass('opacity-60');
    refreshing.unmount();
    hooks.threads.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('boom'),
    });
    render(<PostsList {...baseProps} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the posts. boom");
  });
});
