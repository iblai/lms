'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useGetCohortsQuery,
  useGetCourseModesQuery,
  useGetGradebookQuery,
  useGetGradingInfoQuery,
} from '@/services/instructor';
import type { GradebookRow, GradingSubsection } from '@/types/instructor';
import { cn } from '@/lib/utils';
import { UserDisplayName } from '@/components/user-display-name';
import { GradeOverrideDialog } from './grade-override-dialog';
import {
  EMPTY_FILTERS,
  GradebookFilterChips,
  GradebookFiltersPopover,
  parsePercent,
  type GradebookFilters,
} from './gradebook-filters';

const PAGE_SIZE = 25;
type ScoreView = 'percent' | 'absolute';

/** `cursor` query value of a paginated `next` / `previous` link, if any. */
export const cursorOf = (link: string | null | undefined) => {
  if (!link) return undefined;
  try {
    return new URL(link).searchParams.get('cursor') ?? undefined;
  } catch {
    return undefined;
  }
};

export const formatPercent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export function CourseGradebook({ courseId }: { courseId: string }) {
  const [search, setSearch] = useState('');
  const [userContains, setUserContains] = useState('');
  const [filters, setFilters] = useState<GradebookFilters>(EMPTY_FILTERS);
  const [scoreView, setScoreView] = useState<ScoreView>('percent');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [override, setOverride] = useState<{
    row: GradebookRow;
    subsection: GradingSubsection;
  } | null>(null);

  // Debounce typing into the search box; every filter change restarts paging.
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserContains(search.trim());
      setCursor(undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: gradingInfo } = useGetGradingInfoQuery({ courseId });
  const { data: cohorts = [] } = useGetCohortsQuery({ courseId });
  const { data: modes } = useGetCourseModesQuery({ courseId });
  const {
    data: page,
    isLoading,
    isFetching,
    error,
  } = useGetGradebookQuery({
    courseId,
    cursor,
    pageSize: PAGE_SIZE,
    userContains: userContains || undefined,
    cohortId: filters.cohortId || undefined,
    enrollmentMode: filters.enrollmentMode || undefined,
    assignment: filters.assignment || undefined,
    assignmentGradeMin: parsePercent(filters.assignmentGradeMin),
    assignmentGradeMax: parsePercent(filters.assignmentGradeMax),
    courseGradeMin: parsePercent(filters.courseGradeMin),
    courseGradeMax: parsePercent(filters.courseGradeMax),
    includeCourseTeam: filters.includeCourseTeam,
  });

  const gradedSubsections = useMemo(
    () => (gradingInfo?.subsections ?? []).filter((subsection) => subsection.graded),
    [gradingInfo],
  );
  const columns = useMemo(() => {
    if (filters.assignment) {
      return gradedSubsections.filter((subsection) => subsection.module_id === filters.assignment);
    }
    if (filters.assignmentType) {
      return gradedSubsections.filter(
        (subsection) => subsection.assignment_type === filters.assignmentType,
      );
    }
    return gradedSubsections;
  }, [gradedSubsections, filters.assignment, filters.assignmentType]);
  const assignmentTypes = Object.values(gradingInfo?.assignment_types ?? {});
  const filterOptions = {
    assignmentTypes,
    subsections: gradedSubsections,
    cohorts,
    courseModes: modes?.course_modes ?? [],
  };
  const frozen = gradingInfo?.grades_frozen === true;

  const applyFilters = (next: GradebookFilters) => {
    setFilters(next);
    setCursor(undefined);
  };
  const nextCursor = cursorOf(page?.next);
  const previousCursor = cursorOf(page?.previous);

  const gradeFor = (row: GradebookRow, subsection: GradingSubsection) =>
    row.section_breakdown.find((entry) => entry.module_id === subsection.module_id);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 px-3 py-4 md:px-4"
      data-testid="course-gradebook"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Grades</h2>
          <p className="text-xs text-gray-500" data-testid="gradebook-count">
            {page
              ? `Showing ${page.filtered_users_count} of ${page.total_users_count} learners`
              : 'Loading learners…'}
          </p>
        </div>
        {assignmentTypes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Grading policy">
            {assignmentTypes.map((type) => (
              <li
                key={type.type}
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-600"
              >
                {type.type} · {formatPercent(type.weight)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by username, email or student key"
            aria-label="Search learners"
            className="h-9 w-72 pl-8"
          />
        </label>
        <GradebookFiltersPopover value={filters} options={filterOptions} onApply={applyFilters} />
        <div
          role="group"
          aria-label="Score view"
          className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 p-0.5 text-sm font-medium"
        >
          {(['percent', 'absolute'] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={scoreView === view}
              onClick={() => setScoreView(view)}
              className={cn(
                'h-full rounded px-2.5 transition-colors',
                scoreView === view
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {view === 'percent' ? 'Percent' : 'Absolute'}
            </button>
          ))}
        </div>
        {frozen && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Grades are frozen
          </span>
        )}
      </div>
      <GradebookFilterChips value={filters} options={filterOptions} onChange={applyFilters} />

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load the gradebook. {(error as Error).message}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-max border-collapse text-sm" data-testid="gradebook-table">
            <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2">Learner</th>
                {columns.map((subsection) => (
                  <th
                    key={subsection.module_id}
                    className="px-3 py-2 text-center"
                    title={subsection.display_name}
                  >
                    {subsection.short_label ?? subsection.display_name}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className={cn(isFetching && !isLoading && 'opacity-60')}>
              {isLoading && (
                <tr>
                  <td colSpan={columns.length + 2} className="px-3 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && page?.results.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="px-3 py-8 text-center text-gray-500">
                    No learners match these filters.
                  </td>
                </tr>
              )}
              {page?.results.map((row) => (
                <tr key={row.user_id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <UserDisplayName
                      username={row.username}
                      fallback={row.full_name || row.email}
                      className="block font-medium text-gray-900"
                    />
                    <div className="text-xs text-gray-500">{row.email}</div>
                  </td>
                  {columns.map((subsection) => {
                    const grade = gradeFor(row, subsection);
                    return (
                      <td key={subsection.module_id} className="px-3 py-2 text-center">
                        {grade ? (
                          <button
                            type="button"
                            disabled={frozen}
                            onClick={() => setOverride({ row, subsection })}
                            className="rounded px-1.5 py-0.5 text-gray-800 tabular-nums hover:bg-amber-50 hover:text-amber-700 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-gray-800"
                            title={`${grade.score_earned} / ${grade.score_possible}`}
                            data-testid="gradebook-cell"
                          >
                            {scoreView === 'percent'
                              ? formatPercent(grade.percent)
                              : `${grade.score_earned}/${grade.score_possible}`}
                          </button>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-semibold text-gray-900 tabular-nums">
                    {formatPercent(row.percent)}
                    {row.letter_grade && (
                      <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        {row.letter_grade}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!previousCursor}
          onClick={() => setCursor(previousCursor)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!nextCursor}
          onClick={() => setCursor(nextCursor)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {override && (
        <GradeOverrideDialog
          courseId={courseId}
          row={override.row}
          subsection={override.subsection}
          onClose={() => setOverride(null)}
        />
      )}
    </div>
  );
}
