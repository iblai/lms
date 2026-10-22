'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { findUnitIdForBlock } from '@/utils/course-outline-links';
import type { CourseGrade, GradeRange, SectionScore, Subsection } from '@/types/courses';
import {
  type AssignmentTypeSummary,
  formatPercent,
  gradeStatusText,
  isGradedSubsection,
  letterGradeBands,
  passingGradePercent,
} from './progress-utils';

const percentWidth = (value: number) => `${Math.min(100, Math.max(0, value))}%`;

/** Current grade against the passing mark, with the letter bands when there are any. */
export function GradeBar({
  courseGrade,
  gradeRange,
}: {
  courseGrade: CourseGrade;
  gradeRange: GradeRange | undefined;
}) {
  const current = Math.round((courseGrade.percent || 0) * 100);
  const passing = passingGradePercent(gradeRange);
  const bands = letterGradeBands(gradeRange);
  return (
    <div data-testid="grade-bar">
      <div className="mb-1.5 flex items-center justify-between text-xs text-gray-600">
        <span>
          Current grade{' '}
          <span className="font-semibold text-gray-900" data-testid="current-grade">
            {current}%
          </span>
        </span>
        <span>
          Passing grade{' '}
          <span className="font-semibold text-gray-900" data-testid="passing-grade">
            {passing}%
          </span>
        </span>
      </div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Current grade ${current}%, passing grade ${passing}%`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            courseGrade.is_passing ? 'bg-emerald-500' : 'bg-amber-500',
          )}
          style={{ width: percentWidth(current) }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-700"
          style={{ left: percentWidth(passing) }}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-sm text-gray-700" data-testid="grade-status">
        {gradeStatusText(courseGrade, gradeRange)}
      </p>
      {bands.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Grade range">
          {bands.map((band) => (
            <li
              key={band.letter}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-600"
            >
              {band.letter}: {band.min}–{band.max}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GradeSummaryTable({
  summaries,
  courseGrade,
}: {
  summaries: AssignmentTypeSummary[];
  courseGrade: CourseGrade;
}) {
  const droppable = summaries.filter((summary) => summary.numDroppable > 0);
  return (
    <div data-testid="grade-summary">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2">Assignment type</th>
              <th className="px-3 py-2 text-right">Weight</th>
              <th className="px-3 py-2 text-right">Grade</th>
              <th className="px-3 py-2 text-right">Weighted grade</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary, index) => (
              <tr
                key={summary.type}
                className={cn('border-t border-gray-100', summary.locked && 'text-gray-400')}
                data-testid="grade-summary-row"
              >
                <td className="px-3 py-2 text-gray-900">
                  <span className="inline-flex items-center gap-1.5">
                    {summary.locked && <Lock className="h-3.5 w-3.5" aria-label="Locked" />}
                    {summary.type}
                    {summary.numDroppable > 0 && (
                      <sup className="text-[10px] text-gray-500">
                        {droppable.indexOf(summary) + 1}
                      </sup>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatPercent(summary.weight)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatPercent(summary.average)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatPercent(summary.weighted)}
                </td>
                {/* Row index keeps React keys stable when two types share a name. */}
                <td hidden>{index}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
              <td className="px-3 py-2" colSpan={3}>
                Weighted grade summary
              </td>
              <td className="px-3 py-2 text-right tabular-nums" data-testid="weighted-total">
                {formatPercent(courseGrade.percent || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {droppable.length > 0 && (
        <ol className="mt-2 space-y-0.5 text-xs text-gray-500">
          {droppable.map((summary, index) => (
            <li key={summary.type}>
              <sup>{index + 1}</sup> The lowest {summary.numDroppable}{' '}
              {summary.shortLabel || summary.type} score
              {summary.numDroppable === 1 ? ' is' : 's are'} dropped.
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SubsectionRow({
  subsection,
  courseBasePath,
  locked,
}: {
  subsection: Subsection;
  courseBasePath: string;
  locked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { courseOutline } = useContext(CourseOutlineContext);
  const unitId = findUnitIdForBlock(courseOutline, subsection.block_key);
  const problems = subsection.problem_scores ?? [];
  const blocked = !locked && !subsection.learner_has_access;
  const title = unitId ? (
    <Link
      href={`${courseBasePath}/course?unit_id=${encodeURIComponent(unitId)}`}
      className="text-gray-900 underline-offset-2 hover:text-amber-700 hover:underline"
    >
      {subsection.display_name}
    </Link>
  ) : (
    <span className="text-gray-900">{subsection.display_name}</span>
  );
  return (
    <>
      <tr className="border-t border-gray-100" data-testid="detailed-grade-row">
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            {problems.length > 0 ? (
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label={`${open ? 'Hide' : 'Show'} problem scores for ${subsection.display_name}`}
                className="rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                {open ? (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                )}
              </button>
            ) : (
              <span className="w-5" aria-hidden />
            )}
            {blocked && (
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-gray-400"
                aria-label={`You have no access to ${subsection.display_name}`}
              />
            )}
            <span className={cn(blocked && 'text-gray-400')}>{title}</span>
          </div>
        </td>
        <td
          className={cn('px-3 py-2 text-right tabular-nums', blocked && 'text-gray-400')}
          data-testid="detailed-grade-score"
        >
          {subsection.num_points_earned}/{subsection.num_points_possible}
        </td>
      </tr>
      {open &&
        problems.map((problem, index) => (
          <tr
            key={`${subsection.block_key}-${index}`}
            className="bg-gray-50 text-xs text-gray-600"
            data-testid="problem-score-row"
          >
            <td className="py-1 pr-3 pl-12">Problem {index + 1}</td>
            <td className="px-3 py-1 text-right tabular-nums">
              {problem.earned}/{problem.possible}
            </td>
          </tr>
        ))}
    </>
  );
}

/** One table per section listing its graded subsections and their scores. */
export function DetailedGrades({
  sections,
  courseBasePath,
  fullyLocked,
  partiallyLocked,
}: {
  sections: SectionScore[];
  courseBasePath: string;
  fullyLocked: boolean;
  partiallyLocked: boolean;
}) {
  const graded = sections
    .map((section) => ({
      name: section.display_name,
      subsections: section.subsections.filter(isGradedSubsection),
    }))
    .filter((section) => section.subsections.length > 0);
  return (
    <div className="space-y-3" data-testid="detailed-grades">
      <h4 className="text-sm font-semibold text-gray-900">Detailed grades</h4>
      {partiallyLocked && (
        <p className="flex items-center gap-1.5 text-xs text-gray-600">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Some assignments are locked for your enrollment track and are left out of your grade.
        </p>
      )}
      {graded.length === 0 ? (
        <p className="text-sm text-gray-500">You currently have no graded problem scores.</p>
      ) : (
        graded.map((section) => (
          <div key={section.name} className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2">{section.name}</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {section.subsections.map((subsection) => (
                  <SubsectionRow
                    key={subsection.block_key}
                    subsection={subsection}
                    courseBasePath={courseBasePath}
                    locked={fullyLocked}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      <p className="text-xs text-gray-500">
        For progress on ungraded aspects of the course, view the{' '}
        <Link
          href={`${courseBasePath}/course`}
          className="font-medium text-amber-700 underline-offset-2 hover:underline"
        >
          course outline
        </Link>
        .
      </p>
    </div>
  );
}
