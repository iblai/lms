import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { CourseTopicsResponse, DiscussionConfig, DiscussionThread } from '@/types/discussions';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string) => `Name of ${username}`,
}));
const hooks = vi.hoisted(() => ({
  thread: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  comments: vi.fn(),
  create: vi.fn(),
}));
vi.mock('@/services/discussions', () => ({
  useGetThreadQuery: (...args: any[]) => hooks.thread(...args),
  useUpdateThreadMutation: () => [hooks.update, { isLoading: false }],
  useDeleteThreadMutation: () => [hooks.remove, { isLoading: false }],
  useGetCommentsQuery: (...args: any[]) => hooks.comments(...args),
  useCreateCommentMutation: () => [hooks.create, { isLoading: false }],
}));
// The post form and responses have their own tests.
vi.mock('../post-form', () => ({
  PostForm: (props: any) => (
    <div data-testid="post-form">
      <button type="button" onClick={() => props.onSaved({})}>
        saved
      </button>
      <button type="button" onClick={props.onCancel}>
        cancel-edit
      </button>
    </div>
  ),
}));
vi.mock('../comment-item', () => ({
  CommentItem: (props: any) => <li data-testid="comment-item">{props.comment.id}</li>,
  CommentEditor: (props: any) => (
    <form
      data-testid={props.testId}
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit('typed');
      }}
    >
      <button type="submit">{props.submitLabel}</button>
    </form>
  ),
}));

import { toast } from 'sonner';
import { ThreadView } from '../thread-view';

const topics: CourseTopicsResponse = {
  non_courseware_topics: [{ id: 'course', name: 'General', children: [], thread_counts: null }],
  courseware_topics: [],
};
const config = {
  is_posting_enabled: true,
  post_close_reasons: [{ code: 'off-topic', label: 'Off topic' }],
} as DiscussionConfig;
const thread = (overrides: Partial<DiscussionThread> = {}): DiscussionThread =>
  ({
    id: 't1',
    course_id: 'c',
    topic_id: 'course',
    author: 'ada',
    author_label: 'Staff',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    type: 'discussion',
    title: 'The title',
    raw_body: 'raw',
    rendered_body: '<p>body</p>',
    abuse_flagged: false,
    voted: false,
    vote_count: 4,
    editable_fields: [
      'voted',
      'following',
      'abuse_flagged',
      'raw_body',
      'pinned',
      'closed',
      'read',
    ],
    can_delete: true,
    pinned: false,
    closed: false,
    following: false,
    comment_count: 1,
    unread_comment_count: 0,
    read: true,
    has_endorsed: false,
    ...overrides,
  }) as DiscussionThread;
const comments = (ids: string[], num_pages = 1) => ({
  results: ids.map((id) => ({ id })),
  pagination: { count: ids.length, num_pages, next: null, previous: null },
});
const ok = { unwrap: () => Promise.resolve({}) };
const fail = (message?: string) => ({
  unwrap: () => Promise.reject(message ? new Error(message) : {}),
});

const props = {
  courseId: 'c',
  threadId: 't1',
  config,
  topics,
  onBack: vi.fn(),
  onDeleted: vi.fn(),
  onTopicClick: vi.fn(),
};

describe('ThreadView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.thread.mockReturnValue({ data: thread(), isLoading: false });
    hooks.update.mockReturnValue(ok);
    hooks.remove.mockReturnValue(ok);
    hooks.create.mockReturnValue(ok);
    hooks.comments.mockReturnValue({ data: comments(['c1']), isLoading: false, isFetching: false });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the loading and error states', () => {
    hooks.thread.mockReturnValue({ data: undefined, isLoading: true });
    const { unmount } = render(<ThreadView {...props} />);
    expect(screen.getByTestId('thread-view-loading')).toBeInTheDocument();
    unmount();
    hooks.thread.mockReturnValue({ data: undefined, isLoading: false, error: new Error('gone') });
    render(<ThreadView {...props} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load this post. gone");
    fireEvent.click(screen.getByRole('button', { name: /Back to posts/ }));
    expect(props.onBack).toHaveBeenCalled();
  });

  it('renders the post and its responses, marking it read when it is new', () => {
    hooks.thread.mockReturnValue({
      data: thread({
        read: false,
        pinned: true,
        abuse_flagged: true,
        last_edit: { reason: null },
        edit_by_label: 'Staff',
      }),
      isLoading: false,
    });
    render(<ThreadView {...props} />);
    expect(hooks.thread).toHaveBeenCalledWith({ threadId: 't1', courseId: 'c' });
    expect(hooks.update).toHaveBeenCalledWith({ threadId: 't1', patch: { read: true } });
    expect(screen.getByRole('heading', { name: 'The title' })).toBeInTheDocument();
    expect(screen.getByText('Discussion')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    // The header chip and the active Report button both read "Reported".
    expect(screen.getAllByText('Reported')).toHaveLength(2);
    expect(screen.getByText('(edited by Staff)')).toBeInTheDocument();
    expect(screen.getByText('Name of ada')).toBeInTheDocument();
    expect(screen.getByTestId('sanitized-html')).toHaveTextContent('body');
    fireEvent.click(screen.getByRole('button', { name: 'General' }));
    expect(props.onTopicClick).toHaveBeenCalledWith('course');
    expect(hooks.comments).toHaveBeenCalledWith({
      threadId: 't1',
      page: 1,
      pageSize: 20,
      endorsed: undefined,
    });
    expect(screen.getByRole('heading', { name: '1 response' })).toBeInTheDocument();
    expect(screen.getAllByTestId('comment-item')).toHaveLength(1);
    expect(screen.getByTestId('add-response')).toBeInTheDocument();
  });

  it('does not mark an already-read or non-markable post', () => {
    render(<ThreadView {...props} />);
    expect(hooks.update).not.toHaveBeenCalled();
    hooks.thread.mockReturnValue({
      data: thread({ read: false, editable_fields: [] }),
      isLoading: false,
    });
    render(<ThreadView {...props} threadId="t2" />);
    expect(hooks.update).not.toHaveBeenCalled();
  });

  it('votes, follows, reports and pins', async () => {
    render(<ThreadView {...props} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-vote'));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({ threadId: 't1', patch: { voted: true } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-follow'));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({ threadId: 't1', patch: { following: true } });
    expect(toast.success).toHaveBeenCalledWith('You are now following this post');
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-report'));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({
      threadId: 't1',
      patch: { abuse_flagged: true },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-pin'));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({ threadId: 't1', patch: { pinned: true } });
    expect(toast.success).toHaveBeenCalledWith('Post pinned');
  });

  it('reverses those actions and reports failures', async () => {
    hooks.thread.mockReturnValue({
      data: thread({ voted: true, following: true, abuse_flagged: true, pinned: true }),
      isLoading: false,
    });
    hooks.update.mockReturnValueOnce(fail('nope')).mockReturnValue(ok);
    render(<ThreadView {...props} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-follow'));
    });
    expect(toast.error).toHaveBeenCalledWith('nope');
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-report'));
    });
    expect(toast.success).toHaveBeenCalledWith('Report removed');
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-pin'));
    });
    expect(toast.success).toHaveBeenCalledWith('Post unpinned');
    hooks.update.mockReturnValueOnce(fail());
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-vote'));
    });
    expect(toast.error).toHaveBeenCalledWith('The change could not be saved');
  });

  it('closes with a reason through the dialog, closes directly without reasons, and reopens', async () => {
    render(<ThreadView {...props} />);
    fireEvent.click(screen.getByTestId('thread-close'));
    const dialog = screen.getByTestId('close-thread-dialog');
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Reason for closing' }), {
      target: { value: 'off-topic' },
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close post' }));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({
      threadId: 't1',
      patch: { closed: true, close_reason_code: 'off-topic' },
    });
    expect(toast.success).toHaveBeenCalledWith('Post closed');
    expect(screen.queryByTestId('close-thread-dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('thread-close'));
    fireEvent.click(
      within(screen.getByTestId('close-thread-dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(screen.queryByTestId('close-thread-dialog')).not.toBeInTheDocument();
  });

  it('closes without a dialog when the course has no reasons, and reopens a closed post', async () => {
    const { unmount } = render(
      <ThreadView {...props} config={{ is_posting_enabled: true } as DiscussionConfig} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-close'));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({ threadId: 't1', patch: { closed: true } });
    unmount();
    hooks.thread.mockReturnValue({
      data: thread({ closed: true, close_reason: 'Off topic' }),
      isLoading: false,
    });
    render(<ThreadView {...props} />);
    expect(screen.getByTestId('thread-closed')).toHaveTextContent('Closed · Off topic');
    expect(screen.getByTestId('responses-closed')).toHaveTextContent('closed to new responses');
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-close'));
    });
    expect(hooks.update).toHaveBeenLastCalledWith({ threadId: 't1', patch: { closed: false } });
  });

  it('edits through the post form and copies the link', async () => {
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ThreadView {...props} />);
    fireEvent.click(screen.getByTestId('thread-edit'));
    expect(screen.getByTestId('post-form')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'cancel-edit' }));
    expect(screen.queryByTestId('post-form')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('thread-edit'));
    fireEvent.click(screen.getByRole('button', { name: 'saved' }));
    expect(screen.queryByTestId('post-form')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link to this post' }));
    });
    expect(toast.success).toHaveBeenCalledWith('Link copied');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link to this post' }));
    });
    expect(toast.error).toHaveBeenCalledWith('The link could not be copied');
  });

  it('deletes after confirmation and reports failures', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    hooks.remove
      .mockReturnValueOnce(fail('no'))
      .mockReturnValueOnce(fail())
      .mockReturnValueOnce(ok);
    render(<ThreadView {...props} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-delete'));
    });
    expect(hooks.remove).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-delete'));
    });
    expect(toast.error).toHaveBeenCalledWith('no');
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-delete'));
    });
    expect(toast.error).toHaveBeenCalledWith('The post could not be deleted');
    await act(async () => {
      fireEvent.click(screen.getByTestId('thread-delete'));
    });
    expect(hooks.remove).toHaveBeenCalledWith({ threadId: 't1' });
    expect(props.onDeleted).toHaveBeenCalled();
  });

  it('posts a response and reports failures', async () => {
    hooks.create
      .mockReturnValueOnce(fail('bad'))
      .mockReturnValueOnce(fail())
      .mockReturnValueOnce(ok);
    render(<ThreadView {...props} />);
    const form = screen.getByTestId('response-form');
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(hooks.create).toHaveBeenCalledWith({ threadId: 't1', rawBody: 'typed' });
    expect(toast.error).toHaveBeenCalledWith('bad');
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(toast.error).toHaveBeenCalledWith('The response could not be posted');
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(toast.success).toHaveBeenCalledWith('Response posted');
  });

  it('splits a question’s answers from its other responses and pages them', () => {
    hooks.thread.mockReturnValue({
      data: thread({ type: 'question', editable_fields: [], can_delete: false }),
      isLoading: false,
    });
    hooks.comments.mockImplementation(({ endorsed }: any) =>
      endorsed
        ? { data: comments(['a1']), isLoading: false, isFetching: false }
        : { data: comments(['r1', 'r2'], 2), isLoading: false, isFetching: true },
    );
    render(<ThreadView {...props} config={{ is_posting_enabled: false } as DiscussionConfig} />);
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1 answer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2 responses' })).toBeInTheDocument();
    expect(screen.getByTestId('responses-closed')).toHaveTextContent('Posting is turned off');
    expect(screen.queryByTestId('thread-follow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('thread-delete')).not.toBeInTheDocument();
    const responses = screen.getByTestId('responses');
    fireEvent.click(within(responses).getByRole('button', { name: 'More responses' }));
    expect(hooks.comments).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, endorsed: false }),
    );
    fireEvent.click(within(responses).getByRole('button', { name: 'Previous responses' }));
  });

  it('hides an empty answers section, shows empty responses, and response errors', () => {
    hooks.thread.mockReturnValue({ data: thread({ type: 'question' }), isLoading: false });
    hooks.comments.mockImplementation(({ endorsed }: any) =>
      endorsed
        ? { data: comments([]), isLoading: false, isFetching: false }
        : { data: comments([]), isLoading: false, isFetching: false },
    );
    const { unmount } = render(<ThreadView {...props} />);
    expect(screen.queryByTestId('endorsed-responses')).not.toBeInTheDocument();
    expect(screen.getByTestId('responses-empty')).toBeInTheDocument();
    unmount();
    hooks.thread.mockReturnValue({ data: thread(), isLoading: false });
    hooks.comments.mockReturnValue({ data: undefined, isLoading: true, isFetching: true });
    const loading = render(<ThreadView {...props} />);
    expect(screen.getByText('Loading responses…')).toBeInTheDocument();
    loading.unmount();
    hooks.comments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('x'),
    });
    render(<ThreadView {...props} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the responses. x");
  });
});
