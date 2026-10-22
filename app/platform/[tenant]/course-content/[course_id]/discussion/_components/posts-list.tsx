'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Flag,
  Lock,
  MessageSquare,
  Pin,
  Plus,
  Search,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { UserDisplayName } from '@/components/user-display-name';
import { useGetThreadsQuery } from '@/services/discussions';
import type { DiscussionThread, DiscussionUsers, ThreadOrdering } from '@/types/discussions';
import {
  type PostStatusFilter,
  type PostTypeFilter,
  avatarOf,
  relativeTime,
  statusQuery,
} from './discussion-utils';

export const PAGE_SIZE = 20;

export const Avatar = ({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className?: string;
}) =>
  url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={cn('h-8 w-8 shrink-0 rounded-full bg-gray-100 object-cover', className)}
    />
  ) : (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 uppercase',
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 1) || '?'}
    </span>
  );

export const AuthorName = ({
  username,
  label,
  className,
}: {
  username: string | null;
  label?: string | null;
  className?: string;
}) => (
  <span className={cn('inline-flex items-center gap-1.5', className)}>
    {username ? (
      <UserDisplayName username={username} className="font-medium text-gray-900" />
    ) : (
      <span className="font-medium text-gray-700">Anonymous</span>
    )}
    {label && (
      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-amber-700 uppercase">
        {label}
      </span>
    )}
  </span>
);

export function ThreadRow({
  thread,
  users,
  selected,
  onSelect,
}: {
  thread: DiscussionThread;
  users: DiscussionUsers | undefined;
  selected: boolean;
  onSelect: (threadId: string) => void;
}) {
  const unread = thread.read === false;
  const Icon = thread.type === 'question' ? CircleHelp : MessageSquare;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(thread.id)}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-inset',
          selected && 'bg-amber-50 hover:bg-amber-50',
        )}
        data-testid="thread-row"
      >
        <Avatar url={avatarOf(users ?? thread.users, thread.author)} name={thread.author ?? ''} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                thread.type === 'question' ? 'text-amber-600' : 'text-gray-400',
              )}
              aria-label={thread.type === 'question' ? 'Question' : 'Discussion'}
            />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm text-gray-900',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {thread.title}
            </span>
            {unread && (
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                aria-label="Unread"
                data-testid="thread-unread"
              />
            )}
          </span>
          {thread.preview_body && (
            <span className="mt-0.5 block truncate text-xs text-gray-500">
              {thread.preview_body}
            </span>
          )}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <AuthorName username={thread.author} label={thread.author_label} />
            <span>{relativeTime(thread.updated_at)}</span>
            {thread.pinned && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Pin className="h-3 w-3" aria-hidden /> Pinned
              </span>
            )}
            {thread.closed && (
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" aria-hidden /> Closed
              </span>
            )}
            {thread.following && (
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3 w-3" aria-hidden /> Following
              </span>
            )}
            {thread.abuse_flagged && (
              <span className="inline-flex items-center gap-1 text-red-600">
                <Flag className="h-3 w-3" aria-hidden /> Reported
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-3 tabular-nums">
              <span
                className="inline-flex items-center gap-1"
                aria-label={`${thread.vote_count} votes`}
              >
                <ThumbsUp className="h-3 w-3" aria-hidden /> {thread.vote_count}
              </span>
              <span
                className="inline-flex items-center gap-1"
                aria-label={`${thread.comment_count} responses`}
              >
                <MessageSquare className="h-3 w-3" aria-hidden /> {thread.comment_count}
              </span>
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

export interface PostsListProps {
  courseId: string;
  topicId?: string;
  author?: string;
  /** Shown above the filters when the list is narrowed to a topic or a learner. */
  heading?: { title: string; subtitle?: string; onBack: () => void };
  selectedThreadId?: string;
  onSelect: (threadId: string) => void;
  canModerate: boolean;
  postingEnabled: boolean;
  onAddPost: () => void;
}

export function PostsList({
  courseId,
  topicId,
  author,
  heading,
  selectedThreadId,
  onSelect,
  canModerate,
  postingEnabled,
  onAddPost,
}: PostsListProps) {
  const [type, setType] = useState<PostTypeFilter>('all');
  const [status, setStatus] = useState<PostStatusFilter>('all');
  const [sort, setSort] = useState<ThreadOrdering>('last_activity_at');
  const [search, setSearch] = useState('');
  const [textSearch, setTextSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setTextSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [topicId, author, type, status, sort, textSearch]);

  const { data, isLoading, isFetching, error } = useGetThreadsQuery({
    courseId,
    page,
    pageSize: PAGE_SIZE,
    topicId,
    author,
    textSearch: textSearch || undefined,
    threadType: type === 'all' ? undefined : type,
    orderBy: sort,
    countFlagged: canModerate || undefined,
    ...statusQuery(status),
  });
  const threads = data?.results ?? [];
  const pages = data?.pagination.num_pages ?? 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="posts-list">
      <div className="space-y-2 border-b border-gray-200 px-3 py-3">
        {heading && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={heading.onBack}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900">{heading.title}</h3>
              {heading.subtitle && (
                <p className="truncate text-xs text-gray-500">{heading.subtitle}</p>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search all posts"
              aria-label="Search posts"
              className="h-9 pl-8"
            />
          </label>
          {postingEnabled && (
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 bg-amber-500 text-white hover:bg-amber-600"
              onClick={onAddPost}
            >
              <Plus className="h-4 w-4" aria-hidden /> Add a post
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <NativeSelect
            aria-label="Post type"
            value={type}
            onChange={(event) => setType(event.target.value as PostTypeFilter)}
            className="min-w-0 flex-1 sm:flex-none"
          >
            <option value="all">All post types</option>
            <option value="discussion">Discussions</option>
            <option value="question">Questions</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Post status"
            value={status}
            onChange={(event) => setStatus(event.target.value as PostStatusFilter)}
            className="min-w-0 flex-1 sm:flex-none"
          >
            <option value="all">Any status</option>
            <option value="unread">Unread</option>
            <option value="following">Following</option>
            <option value="unanswered">Unanswered</option>
            <option value="unresponded">Unresponded</option>
            {canModerate && <option value="reported">Reported</option>}
          </NativeSelect>
          <NativeSelect
            aria-label="Sort posts"
            value={sort}
            onChange={(event) => setSort(event.target.value as ThreadOrdering)}
            className="min-w-0 flex-1 sm:flex-none"
          >
            <option value="last_activity_at">Recent activity</option>
            <option value="comment_count">Most activity</option>
            <option value="vote_count">Most votes</option>
          </NativeSelect>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="m-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load the posts. {(error as Error).message}
        </p>
      ) : (
        <ul
          className={cn(
            'min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto',
            isFetching && !isLoading && 'opacity-60',
          )}
          aria-label="Posts"
          aria-busy={isFetching}
        >
          {isLoading && (
            <li className="px-3 py-8 text-center text-sm text-gray-500">Loading posts…</li>
          )}
          {!isLoading && threads.length === 0 && (
            <li className="px-3 py-10 text-center" data-testid="posts-empty">
              <p className="text-sm font-medium text-gray-900">Nothing here yet</p>
              <p className="mt-1 text-xs text-gray-500">
                {textSearch || type !== 'all' || status !== 'all'
                  ? 'No posts match these filters.'
                  : postingEnabled
                    ? 'Be the first to start a conversation.'
                    : 'Posting is turned off for this course.'}
              </p>
            </li>
          )}
          {threads.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              users={data?.users}
              selected={thread.id === selectedThreadId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
          <span>
            Page {page} of {pages}
            {data ? ` · ${data.pagination.count} posts` : ''}
          </span>
          <span className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              aria-label="Previous page"
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
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
