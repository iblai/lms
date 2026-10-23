'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { UserDisplayName } from '@/components/user-display-name';
import { useGetLearnersQuery } from '@/services/discussions';
import type { LearnersOrdering } from '@/types/discussions';

/** Who is active in the discussions, each opening their posts. */
export function LearnersView({
  courseId,
  canModerate,
  onSelectLearner,
}: {
  courseId: string;
  canModerate: boolean;
  onSelectLearner: (username: string) => void;
}) {
  const [orderBy, setOrderBy] = useState<LearnersOrdering>('activity');
  const [search, setSearch] = useState('');
  const [username, setUsername] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => setUsername(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [orderBy, username]);

  const { data, isLoading, isFetching, error } = useGetLearnersQuery({
    courseId,
    page,
    orderBy,
    username: username || undefined,
  });
  const learners = data?.results ?? [];
  const pages = data?.pagination.num_pages ?? 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="learners-view">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 px-3 py-3">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search learners by username"
            aria-label="Search learners"
            className="h-9 pl-8"
          />
        </label>
        <NativeSelect
          aria-label="Sort learners"
          value={orderBy}
          onChange={(event) => setOrderBy(event.target.value as LearnersOrdering)}
        >
          <option value="activity">Most activity</option>
          <option value="recency">Recent activity</option>
          {canModerate && <option value="flagged">Most reported</option>}
        </NativeSelect>
      </div>
      {error ? (
        <p
          role="alert"
          className="m-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load the learners. {(error as Error).message}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={isFetching}>
          <table className="w-full text-sm" data-testid="learners-table">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">Learner</th>
                <th className="px-3 py-2 text-right">Posts</th>
                <th className="px-3 py-2 text-right">Responses</th>
                <th className="px-3 py-2 text-right">Replies</th>
                {canModerate && <th className="px-3 py-2 text-right">Reported</th>}
              </tr>
            </thead>
            <tbody className={isFetching && !isLoading ? 'opacity-60' : undefined}>
              {isLoading && (
                <tr>
                  <td colSpan={canModerate ? 5 : 4} className="px-3 py-8 text-center text-gray-500">
                    Loading learners…
                  </td>
                </tr>
              )}
              {!isLoading && learners.length === 0 && (
                <tr>
                  <td
                    colSpan={canModerate ? 5 : 4}
                    className="px-3 py-8 text-center text-gray-500"
                    data-testid="learners-empty"
                  >
                    No learners have posted yet.
                  </td>
                </tr>
              )}
              {learners.map((learner) => (
                <tr key={learner.username} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelectLearner(learner.username)}
                      className="font-medium text-gray-900 hover:text-amber-700 hover:underline"
                      data-testid="learner-row"
                    >
                      <UserDisplayName username={learner.username} />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{learner.threads}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{learner.responses}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{learner.replies}</td>
                  {canModerate && (
                    <td className="px-3 py-2 text-right tabular-nums">
                      {(learner.active_flags ?? 0) + (learner.inactive_flags ?? 0)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
          <span>
            Page {page} of {pages}
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
