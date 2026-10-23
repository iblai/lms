'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Flag,
  Link2,
  Lock,
  LockOpen,
  MessageSquare,
  Pencil,
  Pin,
  PinOff,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreateCommentMutation,
  useDeleteThreadMutation,
  useGetCommentsQuery,
  useGetThreadQuery,
  useUpdateThreadMutation,
} from '@/services/discussions';
import type {
  CourseTopicsResponse,
  DiscussionConfig,
  DiscussionThread,
  ThreadPatch,
} from '@/types/discussions';
import { CommentEditor, CommentItem } from './comment-item';
import { SanitizedHtml } from './discussion-html';
import { avatarOf, relativeTime, topicNameOf } from './discussion-utils';
import { PostForm } from './post-form';
import { AuthorName, Avatar } from './posts-list';

const COMMENTS_PAGE_SIZE = 20;

function CommentsList({
  thread,
  endorsed,
  title,
  canPost,
  hideWhenEmpty,
}: {
  thread: DiscussionThread;
  endorsed?: boolean;
  title: (count: number) => string;
  canPost: boolean;
  hideWhenEmpty?: boolean;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useGetCommentsQuery({
    threadId: thread.id,
    page,
    pageSize: COMMENTS_PAGE_SIZE,
    endorsed,
  });
  const comments = data?.results ?? [];
  const count = data?.pagination.count ?? 0;
  const pages = data?.pagination.num_pages ?? 1;
  if (hideWhenEmpty && !isLoading && comments.length === 0) return null;
  return (
    <section
      aria-label={title(count)}
      data-testid={endorsed === true ? 'endorsed-responses' : 'responses'}
      aria-busy={isFetching}
    >
      <h4 className="text-sm font-semibold text-gray-900">{title(count)}</h4>
      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load the responses. {(error as Error).message}
        </p>
      ) : (
        <ul className={cn('divide-y divide-gray-100', isFetching && !isLoading && 'opacity-60')}>
          {isLoading && <li className="py-3 text-sm text-gray-500">Loading responses…</li>}
          {!isLoading && comments.length === 0 && (
            <li className="py-3 text-sm text-gray-500" data-testid="responses-empty">
              No responses yet.
            </li>
          )}
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              thread={thread}
              users={data?.users}
              canPost={canPost}
            />
          ))}
        </ul>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
          <span className="mr-2">
            Page {page} of {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            aria-label="Previous responses"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={page >= pages}
            onClick={() => setPage((value) => value + 1)}
            aria-label="More responses"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}

const ThreadAction = ({
  onClick,
  active,
  label,
  icon: Icon,
  text,
  count,
  disabled,
  tone,
  testId,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  icon: typeof ThumbsUp;
  text?: string;
  count?: number;
  disabled?: boolean;
  tone?: 'danger';
  testId?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    aria-label={label}
    title={label}
    data-testid={testId}
    className={cn(
      'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-50',
      active
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-gray-200 text-gray-700 hover:bg-gray-50',
      tone === 'danger' && 'hover:border-red-200 hover:text-red-700',
    )}
  >
    <Icon className="h-3.5 w-3.5" aria-hidden />
    {text && <span>{text}</span>}
    {count !== undefined && <span className="tabular-nums">{count}</span>}
  </button>
);

export function ThreadView({
  courseId,
  threadId,
  config,
  topics,
  onBack,
  onDeleted,
  onTopicClick,
}: {
  courseId: string;
  threadId: string;
  config: DiscussionConfig | undefined;
  topics: CourseTopicsResponse | undefined;
  onBack: () => void;
  onDeleted: () => void;
  onTopicClick: (topicId: string) => void;
}) {
  const { data: thread, isLoading, error } = useGetThreadQuery({ threadId, courseId });
  const [updateThread, { isLoading: updating }] = useUpdateThreadMutation();
  const [deleteThread, { isLoading: deleting }] = useDeleteThreadMutation();
  const [createComment, { isLoading: responding }] = useCreateCommentMutation();
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  // Opening a post marks it read, like the edX discussions page.
  useEffect(() => {
    if (thread && thread.read === false && thread.editable_fields.includes('read')) {
      updateThread({ threadId: thread.id, patch: { read: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, thread?.read]);
  useEffect(() => {
    setEditing(false);
    setClosing(false);
  }, [threadId]);

  const patch = async (fields: ThreadPatch, done?: string) => {
    try {
      await updateThread({ threadId, patch: fields }).unwrap();
      if (done) toast.success(done);
      return true;
    } catch (err) {
      toast.error((err as Error).message || 'The change could not be saved');
      return false;
    }
  };
  const remove = async () => {
    if (!window.confirm('Delete this post and all of its responses? This cannot be undone.'))
      return;
    try {
      await deleteThread({ threadId }).unwrap();
      toast.success('Post deleted');
      onDeleted();
    } catch (err) {
      toast.error((err as Error).message || 'The post could not be deleted');
    }
  };
  const respond = async (rawBody: string) => {
    try {
      await createComment({ threadId, rawBody }).unwrap();
      toast.success('Response posted');
      return true;
    } catch (err) {
      toast.error((err as Error).message || 'The response could not be posted');
      return false;
    }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('The link could not be copied');
    }
  };

  if (error) {
    return (
      <div className="p-3" data-testid="thread-view">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 md:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to posts
        </button>
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load this post. {(error as Error).message}
        </p>
      </div>
    );
  }
  if (isLoading || !thread) {
    return (
      <div className="space-y-3 p-4" data-testid="thread-view-loading">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const can = (field: string) => thread.editable_fields.includes(field);
  const canPost = config?.is_posting_enabled !== false;
  const isQuestion = thread.type === 'question';
  const topicName = topicNameOf(topics, thread.topic_id);
  const closeReasons = config?.post_close_reasons ?? [];
  const TypeIcon = isQuestion ? CircleHelp : MessageSquare;

  return (
    <article
      className="flex min-h-0 flex-1 flex-col"
      data-testid="thread-view"
      aria-labelledby="thread-title"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 md:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to posts
        </button>

        {editing ? (
          <PostForm
            mode="edit"
            courseId={courseId}
            config={config}
            topics={topics}
            thread={thread}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                  isQuestion ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700',
                )}
              >
                <TypeIcon className="h-3 w-3" aria-hidden />
                {isQuestion ? 'Question' : 'Discussion'}
              </span>
              {topicName && (
                <button
                  type="button"
                  onClick={() => onTopicClick(thread.topic_id)}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 hover:bg-gray-200"
                >
                  {topicName}
                </button>
              )}
              {thread.pinned && (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <Pin className="h-3 w-3" aria-hidden /> Pinned
                </span>
              )}
              {thread.closed && (
                <span className="inline-flex items-center gap-1" data-testid="thread-closed">
                  <Lock className="h-3 w-3" aria-hidden /> Closed
                  {thread.close_reason ? ` · ${thread.close_reason}` : ''}
                </span>
              )}
              {thread.abuse_flagged && (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <Flag className="h-3 w-3" aria-hidden /> Reported
                </span>
              )}
            </div>
            <h3 id="thread-title" className="text-lg font-semibold text-gray-900">
              {thread.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Avatar
                url={avatarOf(thread.users, thread.author)}
                name={thread.author ?? ''}
                className="h-7 w-7"
              />
              <AuthorName username={thread.author} label={thread.author_label} />
              <span>posted {relativeTime(thread.created_at)}</span>
              {thread.last_edit && (
                <span>(edited{thread.edit_by_label ? ` by ${thread.edit_by_label}` : ''})</span>
              )}
            </div>
            <SanitizedHtml html={thread.rendered_body} />
            <div className="flex flex-wrap gap-1.5" data-testid="thread-actions">
              <ThreadAction
                icon={ThumbsUp}
                label={thread.voted ? 'Remove vote' : 'Vote for this post'}
                active={thread.voted}
                count={thread.vote_count}
                disabled={!can('voted') || updating}
                onClick={() => patch({ voted: !thread.voted })}
                testId="thread-vote"
              />
              {can('following') && (
                <ThreadAction
                  icon={thread.following ? BellOff : Bell}
                  label={thread.following ? 'Unfollow this post' : 'Follow this post'}
                  text={thread.following ? 'Following' : 'Follow'}
                  active={thread.following}
                  disabled={updating}
                  onClick={() =>
                    patch(
                      { following: !thread.following },
                      thread.following
                        ? 'You stopped following this post'
                        : 'You are now following this post',
                    )
                  }
                  testId="thread-follow"
                />
              )}
              {can('abuse_flagged') && (
                <ThreadAction
                  icon={Flag}
                  label={thread.abuse_flagged ? 'Remove report' : 'Report this post'}
                  text={thread.abuse_flagged ? 'Reported' : 'Report'}
                  active={thread.abuse_flagged}
                  disabled={updating}
                  onClick={() =>
                    patch(
                      { abuse_flagged: !thread.abuse_flagged },
                      thread.abuse_flagged ? 'Report removed' : 'Post reported to the course team',
                    )
                  }
                  testId="thread-report"
                />
              )}
              {can('raw_body') && (
                <ThreadAction
                  icon={Pencil}
                  label="Edit this post"
                  text="Edit"
                  onClick={() => setEditing(true)}
                  testId="thread-edit"
                />
              )}
              {can('pinned') && (
                <ThreadAction
                  icon={thread.pinned ? PinOff : Pin}
                  label={thread.pinned ? 'Unpin this post' : 'Pin this post'}
                  text={thread.pinned ? 'Unpin' : 'Pin'}
                  disabled={updating}
                  onClick={() =>
                    patch(
                      { pinned: !thread.pinned },
                      thread.pinned ? 'Post unpinned' : 'Post pinned',
                    )
                  }
                  testId="thread-pin"
                />
              )}
              {can('closed') && (
                <ThreadAction
                  icon={thread.closed ? LockOpen : Lock}
                  label={thread.closed ? 'Reopen this post' : 'Close this post'}
                  text={thread.closed ? 'Reopen' : 'Close'}
                  disabled={updating}
                  onClick={() => {
                    if (thread.closed) patch({ closed: false }, 'Post reopened');
                    else if (closeReasons.length) setClosing(true);
                    else patch({ closed: true }, 'Post closed');
                  }}
                  testId="thread-close"
                />
              )}
              <ThreadAction
                icon={Link2}
                label="Copy link to this post"
                text="Copy link"
                onClick={copyLink}
              />
              {thread.can_delete && (
                <ThreadAction
                  icon={Trash2}
                  label="Delete this post"
                  text="Delete"
                  tone="danger"
                  disabled={deleting}
                  onClick={remove}
                  testId="thread-delete"
                />
              )}
            </div>
          </header>
        )}

        <div className="space-y-5 border-t border-gray-200 pt-4">
          {isQuestion ? (
            <>
              <CommentsList
                thread={thread}
                endorsed
                title={(count) => (count === 1 ? '1 answer' : `${count} answers`)}
                canPost={canPost}
                hideWhenEmpty
              />
              <CommentsList
                thread={thread}
                endorsed={false}
                title={(count) => (count === 1 ? '1 response' : `${count} responses`)}
                canPost={canPost}
              />
            </>
          ) : (
            <CommentsList
              thread={thread}
              title={(count) => (count === 1 ? '1 response' : `${count} responses`)}
              canPost={canPost}
            />
          )}
          {canPost && !thread.closed ? (
            <div data-testid="add-response">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Add a response</h4>
              <CommentEditor
                placeholder="Write your response"
                submitLabel="Post response"
                busy={responding}
                onSubmit={respond}
                testId="response-form"
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500" data-testid="responses-closed">
              {thread.closed
                ? 'This post is closed to new responses.'
                : 'Posting is turned off for this course.'}
            </p>
          )}
        </div>
      </div>

      <Dialog open={closing} onOpenChange={(open) => !open && setClosing(false)}>
        <DialogContent className="sm:max-w-sm" data-testid="close-thread-dialog">
          <DialogHeader>
            <DialogTitle>Close this post</DialogTitle>
            <DialogDescription>
              Closed posts stay visible but can&apos;t receive new responses.
            </DialogDescription>
          </DialogHeader>
          <NativeSelect
            aria-label="Reason for closing"
            className="w-full"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
          >
            <option value="">No reason given</option>
            {closeReasons.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label}
              </option>
            ))}
          </NativeSelect>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setClosing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-amber-500 text-white hover:bg-amber-600"
              disabled={updating}
              onClick={async () => {
                const ok = await patch(
                  { closed: true, ...(closeReason ? { close_reason_code: closeReason } : {}) },
                  'Post closed',
                );
                if (ok) setClosing(false);
              }}
            >
              Close post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
