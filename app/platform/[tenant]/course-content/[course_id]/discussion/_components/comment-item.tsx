'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flag,
  Pencil,
  Reply,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetCommentRepliesQuery,
  useUpdateCommentMutation,
} from '@/services/discussions';
import type { DiscussionComment, DiscussionThread, DiscussionUsers } from '@/types/discussions';
import { SanitizedHtml } from './discussion-html';
import { avatarOf, relativeTime } from './discussion-utils';
import { AuthorName, Avatar } from './posts-list';

/** Textarea + submit/cancel, used for responses, replies and edits. */
export function CommentEditor({
  initial = '',
  placeholder,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
  autoFocus,
  testId,
}: {
  initial?: string;
  placeholder: string;
  submitLabel: string;
  busy?: boolean;
  /** Resolving to anything but `false` clears the box, ready for the next one. */
  onSubmit: (rawBody: string) => void | boolean | Promise<void | boolean>;
  onCancel?: () => void;
  autoFocus?: boolean;
  testId?: string;
}) {
  const [value, setValue] = useState(initial);
  const valid = value.trim().length > 0;
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!valid) return;
        if ((await onSubmit(value.trim())) !== false) setValue('');
      }}
      className="space-y-2"
      data-testid={testId ?? 'comment-editor'}
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={3}
        autoFocus={autoFocus}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="bg-amber-500 text-white hover:bg-amber-600"
          disabled={!valid || busy}
        >
          {busy ? 'Posting…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

const ActionButton = ({
  onClick,
  active,
  label,
  icon: Icon,
  count,
  disabled,
  tone,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  icon: typeof ThumbsUp;
  count?: number;
  disabled?: boolean;
  tone?: 'danger';
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50',
      active ? 'font-medium text-amber-700' : 'text-gray-600 hover:text-gray-900',
      tone === 'danger' && 'hover:text-red-700',
    )}
  >
    <Icon className="h-3.5 w-3.5" aria-hidden />
    {count !== undefined && <span className="tabular-nums">{count}</span>}
  </button>
);

export function CommentItem({
  comment,
  thread,
  users,
  parentId,
  canPost,
}: {
  comment: DiscussionComment;
  thread: DiscussionThread;
  users: DiscussionUsers | undefined;
  /** Set for replies, which can't be replied to again. */
  parentId?: string;
  canPost: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [updateComment, { isLoading: updating }] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: deleting }] = useDeleteCommentMutation();
  const [createComment, { isLoading: creating }] = useCreateCommentMutation();
  const can = (field: string) => comment.editable_fields.includes(field);
  const isReply = !!parentId;
  const replyCount = comment.child_count ?? comment.children?.length ?? 0;
  const { data: replies, isFetching: loadingReplies } = useGetCommentRepliesQuery(
    { commentId: comment.id },
    { skip: isReply || !showReplies },
  );

  const patch = async (fields: Parameters<typeof updateComment>[0]['patch'], done?: string) => {
    try {
      await updateComment({
        commentId: comment.id,
        threadId: thread.id,
        parentId,
        patch: fields,
      }).unwrap();
      if (done) toast.success(done);
      return true;
    } catch (error) {
      toast.error((error as Error).message || 'The change could not be saved');
      return false;
    }
  };
  const remove = async () => {
    if (!window.confirm('Delete this response? This cannot be undone.')) return;
    try {
      await deleteComment({ commentId: comment.id, threadId: thread.id, parentId }).unwrap();
      toast.success('Response deleted');
    } catch (error) {
      toast.error((error as Error).message || 'The response could not be deleted');
    }
  };
  const reply = async (rawBody: string) => {
    try {
      await createComment({ threadId: thread.id, parentId: comment.id, rawBody }).unwrap();
      toast.success('Reply posted');
      setReplying(false);
      setShowReplies(true);
      return true;
    } catch (error) {
      toast.error((error as Error).message || 'The reply could not be posted');
      return false;
    }
  };

  const endorsedLabel = thread.type === 'question' ? 'Marked as answer' : 'Endorsed';
  return (
    <li
      className={cn('py-3', isReply ? 'pl-10' : '')}
      data-testid={isReply ? 'comment-reply' : 'comment-item'}
    >
      <div className="flex gap-3">
        <Avatar
          url={avatarOf(users ?? comment.users, comment.author)}
          name={comment.author ?? ''}
          className={isReply ? 'h-6 w-6 text-[10px]' : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <AuthorName username={comment.author} label={comment.author_label} />
            <span>{relativeTime(comment.created_at)}</span>
            {comment.last_edit && <span>(edited)</span>}
            {comment.endorsed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                {endorsedLabel}
                {comment.endorsed_by && (
                  <>
                    {' '}
                    by <AuthorName username={comment.endorsed_by} className="text-emerald-800" />
                  </>
                )}
              </span>
            )}
          </div>
          {editing ? (
            <div className="mt-2">
              <CommentEditor
                initial={comment.raw_body}
                placeholder="Edit your response"
                submitLabel="Save"
                busy={updating}
                onCancel={() => setEditing(false)}
                onSubmit={async (rawBody) => {
                  const saved = await patch({ raw_body: rawBody }, 'Response updated');
                  if (saved) setEditing(false);
                  return saved;
                }}
                testId="comment-edit-form"
              />
            </div>
          ) : (
            <SanitizedHtml html={comment.rendered_body} className="mt-1" />
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1" data-testid="comment-actions">
            <ActionButton
              icon={ThumbsUp}
              label={comment.voted ? 'Remove vote' : 'Vote for this response'}
              active={comment.voted}
              count={comment.vote_count}
              disabled={!can('voted') || updating}
              onClick={() => patch({ voted: !comment.voted })}
            />
            {!isReply && canPost && !thread.closed && (
              <ActionButton
                icon={Reply}
                label="Reply"
                onClick={() => setReplying((value) => !value)}
              />
            )}
            {can('endorsed') && (
              <ActionButton
                icon={CheckCircle2}
                label={comment.endorsed ? `Remove ${endorsedLabel.toLowerCase()}` : endorsedLabel}
                active={comment.endorsed}
                disabled={updating}
                onClick={() =>
                  patch(
                    { endorsed: !comment.endorsed },
                    comment.endorsed ? 'Endorsement removed' : `${endorsedLabel}`,
                  )
                }
              />
            )}
            {can('raw_body') && !editing && (
              <ActionButton icon={Pencil} label="Edit response" onClick={() => setEditing(true)} />
            )}
            {can('abuse_flagged') && (
              <ActionButton
                icon={Flag}
                label={comment.abuse_flagged ? 'Remove report' : 'Report response'}
                active={comment.abuse_flagged}
                disabled={updating}
                onClick={() =>
                  patch(
                    { abuse_flagged: !comment.abuse_flagged },
                    comment.abuse_flagged ? 'Report removed' : 'Response reported',
                  )
                }
              />
            )}
            {comment.can_delete && (
              <ActionButton
                icon={Trash2}
                label="Delete response"
                tone="danger"
                disabled={deleting}
                onClick={remove}
              />
            )}
            {!isReply && replyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies((value) => !value)}
                aria-expanded={showReplies}
                className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                data-testid="toggle-replies"
              >
                {showReplies ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                )}
                {showReplies ? 'Hide' : 'Show'} {replyCount}{' '}
                {replyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          {replying && (
            <div className="mt-2">
              <CommentEditor
                placeholder="Write a reply"
                submitLabel="Post reply"
                busy={creating}
                autoFocus
                onCancel={() => setReplying(false)}
                onSubmit={reply}
                testId="reply-form"
              />
            </div>
          )}
        </div>
      </div>
      {!isReply && showReplies && (
        <ul className="divide-y divide-gray-100" aria-label="Replies" aria-busy={loadingReplies}>
          {loadingReplies && !replies && (
            <li className="py-2 pl-10 text-xs text-gray-500">Loading replies…</li>
          )}
          {(replies?.results ?? comment.children ?? []).map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              thread={thread}
              users={replies?.users ?? users}
              parentId={comment.id}
              canPost={canPost}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
