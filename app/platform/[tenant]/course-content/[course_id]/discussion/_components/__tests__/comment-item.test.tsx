import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { DiscussionComment, DiscussionThread } from '@/types/discussions';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string) => `Name of ${username}`,
}));
const hooks = vi.hoisted(() => ({
  update: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  replies: vi.fn(),
}));
vi.mock('@/services/discussions', () => ({
  useUpdateCommentMutation: () => [hooks.update, { isLoading: false }],
  useDeleteCommentMutation: () => [hooks.remove, { isLoading: false }],
  useCreateCommentMutation: () => [hooks.create, { isLoading: false }],
  useGetCommentRepliesQuery: (...args: any[]) => hooks.replies(...args),
}));

import { toast } from 'sonner';
import { CommentEditor, CommentItem } from '../comment-item';

const thread = { id: 't1', type: 'discussion', closed: false } as DiscussionThread;
const comment = (overrides: Partial<DiscussionComment>): DiscussionComment =>
  ({
    id: 'c1',
    thread_id: 't1',
    parent_id: null,
    author: 'ada',
    author_label: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    raw_body: 'raw',
    rendered_body: '<p>rendered</p>',
    endorsed: false,
    abuse_flagged: false,
    voted: false,
    vote_count: 1,
    editable_fields: ['voted', 'raw_body', 'abuse_flagged', 'endorsed'],
    can_delete: true,
    child_count: 0,
    ...overrides,
  }) as DiscussionComment;

const ok = { unwrap: () => Promise.resolve({}) };
const fail = (message?: string) => ({
  unwrap: () => Promise.reject(message ? new Error(message) : {}),
});

const renderItem = (props: Partial<React.ComponentProps<typeof CommentItem>> = {}) =>
  render(
    <ul>
      <CommentItem comment={comment({})} thread={thread} users={undefined} canPost {...props} />
    </ul>,
  );

describe('CommentEditor', () => {
  it('only submits trimmed, non-empty text and can be cancelled', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(
      <CommentEditor
        placeholder="Say it"
        submitLabel="Go"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Say it' }), {
      target: { value: '  hi  ' },
    });
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith('hi');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    render(<CommentEditor placeholder="p" submitLabel="Go" onSubmit={vi.fn()} busy />);
    expect(screen.getByRole('button', { name: 'Posting…' })).toBeDisabled();
  });
});

describe('CommentItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.update.mockReturnValue(ok);
    hooks.remove.mockReturnValue(ok);
    hooks.create.mockReturnValue(ok);
    hooks.replies.mockReturnValue({ data: undefined, isFetching: false });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders the author, body and endorsement', () => {
    renderItem({
      comment: comment({
        endorsed: true,
        endorsed_by: 'staff1',
        author_label: 'Staff',
        last_edit: { reason: null },
      }),
      thread: { ...thread, type: 'question' },
    });
    expect(screen.getByText('Name of ada')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('(edited)')).toBeInTheDocument();
    expect(screen.getByText(/Marked as answer/)).toHaveTextContent('by Name of staff1');
    expect(screen.getByTestId('sanitized-html')).toHaveTextContent('rendered');
    expect(screen.getByRole('button', { name: 'Remove marked as answer' })).toBeInTheDocument();
  });

  it('votes, endorses and reports through merge patches', async () => {
    renderItem();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Vote for this response' }));
    });
    expect(hooks.update).toHaveBeenCalledWith({
      commentId: 'c1',
      threadId: 't1',
      parentId: undefined,
      patch: { voted: true },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Endorsed' }));
    });
    expect(hooks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ patch: { endorsed: true } }),
    );
    expect(toast.success).toHaveBeenCalledWith('Endorsed');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report response' }));
    });
    expect(hooks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ patch: { abuse_flagged: true } }),
    );
    expect(toast.success).toHaveBeenCalledWith('Response reported');
  });

  it('reports failures to save', async () => {
    hooks.update.mockReturnValueOnce(fail('nope')).mockReturnValueOnce(fail());
    renderItem({ comment: comment({ endorsed: true, abuse_flagged: true, voted: true }) });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove endorsed' }));
    });
    expect(toast.error).toHaveBeenCalledWith('nope');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove report' }));
    });
    expect(toast.error).toHaveBeenCalledWith('The change could not be saved');
    expect(screen.getByRole('button', { name: 'Remove vote' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('edits the body inline', async () => {
    hooks.update.mockReturnValueOnce(fail('bad')).mockReturnValueOnce(ok);
    renderItem();
    fireEvent.click(screen.getByRole('button', { name: 'Edit response' }));
    const form = screen.getByTestId('comment-edit-form');
    expect(within(form).getByRole('textbox')).toHaveValue('raw');
    fireEvent.change(within(form).getByRole('textbox'), { target: { value: 'better' } });
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
    });
    expect(hooks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ patch: { raw_body: 'better' } }),
    );
    expect(screen.getByTestId('comment-edit-form')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
    });
    expect(toast.success).toHaveBeenCalledWith('Response updated');
    expect(screen.queryByTestId('comment-edit-form')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit response' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('comment-edit-form')).not.toBeInTheDocument();
  });

  it('deletes after confirmation only', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    renderItem();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete response' }));
    });
    expect(hooks.remove).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete response' }));
    });
    expect(hooks.remove).toHaveBeenCalledWith({
      commentId: 'c1',
      threadId: 't1',
      parentId: undefined,
    });
    expect(toast.success).toHaveBeenCalledWith('Response deleted');
    hooks.remove.mockReturnValueOnce(fail('locked')).mockReturnValueOnce(fail());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete response' }));
    });
    expect(toast.error).toHaveBeenCalledWith('locked');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete response' }));
    });
    expect(toast.error).toHaveBeenCalledWith('The response could not be deleted');
  });

  it('replies to a response and then shows the replies', async () => {
    hooks.create
      .mockReturnValueOnce(fail('no'))
      .mockReturnValueOnce(fail())
      .mockReturnValueOnce(ok);
    hooks.replies.mockReturnValue({
      data: {
        results: [comment({ id: 'r1', author: 'bob', raw_body: 'reply' })],
        pagination: { count: 1, num_pages: 1, next: null, previous: null },
      },
      isFetching: false,
    });
    renderItem({ comment: comment({ child_count: 1 }) });
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    const form = screen.getByTestId('reply-form');
    fireEvent.change(within(form).getByRole('textbox'), { target: { value: 'my reply' } });
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Post reply' }));
    });
    expect(hooks.create).toHaveBeenCalledWith({
      threadId: 't1',
      parentId: 'c1',
      rawBody: 'my reply',
    });
    expect(toast.error).toHaveBeenCalledWith('no');
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Post reply' }));
    });
    expect(toast.error).toHaveBeenCalledWith('The reply could not be posted');
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Post reply' }));
    });
    expect(toast.success).toHaveBeenCalledWith('Reply posted');
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();
    // Posting a reply opens the replies list.
    expect(hooks.replies).toHaveBeenCalledWith({ commentId: 'c1' }, { skip: false });
    const reply = screen.getByTestId('comment-reply');
    expect(reply).toHaveTextContent('Name of bob');
    expect(within(reply).queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hide 1 reply/ }));
    expect(screen.queryByTestId('comment-reply')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument();
  });

  it('falls back to inlined children while replies load and hides replying when it is not allowed', () => {
    hooks.replies.mockReturnValue({ data: undefined, isFetching: true });
    renderItem({
      comment: comment({
        child_count: 2,
        children: [comment({ id: 'k1', author: 'kim' }), comment({ id: 'k2', author: 'kat' })],
      }),
      thread: { ...thread, closed: true },
    });
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show 2 replies/ }));
    expect(screen.getByText('Loading replies…')).toBeInTheDocument();
    expect(screen.getAllByTestId('comment-reply')).toHaveLength(2);
    expect(hooks.replies).toHaveBeenCalledWith({ commentId: 'c1' }, { skip: false });
  });

  it('hides actions the viewer cannot use', () => {
    renderItem({ comment: comment({ editable_fields: [], can_delete: false }), canPost: false });
    expect(screen.getByRole('button', { name: 'Vote for this response' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Endorsed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit response' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report response' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete response' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-replies')).not.toBeInTheDocument();
  });
});
