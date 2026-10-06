'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const clampPercentage = (value: number | null | undefined) =>
  Math.min(100, Math.max(0, Math.round(value ?? 0)));

const RING_SIZE = 28;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const CourseProgressRing = ({ percentage }: { percentage: number }) => {
  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="shrink-0 -rotate-90"
      aria-hidden
      data-testid="course-progress-ring"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        className="stroke-gray-200"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - percentage / 100)}
        className="stroke-amber-500 transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
};

/**
 * Compact completion ring + grade readout for the course header. The grade is
 * only meaningful when the course has an active grading policy.
 */
export const CourseProgressSummary = ({
  completionPercentage,
  gradingPercentage,
  gradeVisible,
  className,
}: {
  completionPercentage?: number | null;
  gradingPercentage?: number | null;
  gradeVisible: boolean;
  className?: string;
}) => {
  const completion = clampPercentage(completionPercentage);
  const grade = clampPercentage(gradingPercentage);
  return (
    <div
      className={cn('flex shrink-0 items-center gap-4 text-xs', className)}
      data-testid="course-progress-summary"
    >
      <div
        className="flex items-center gap-2"
        role="img"
        aria-label={`Course progress ${completion}%`}
      >
        <CourseProgressRing percentage={completion} />
        <div className="flex flex-col leading-tight">
          <span className="hidden text-[11px] text-gray-500 md:inline">Progress</span>
          <span className="font-semibold text-gray-900">{completion}%</span>
        </div>
      </div>
      {gradeVisible && (
        <div className="flex flex-col border-l border-gray-200 pl-4 leading-tight">
          <span className="hidden text-[11px] text-gray-500 md:inline">Grade</span>
          <span className="font-semibold text-gray-900">{grade}%</span>
        </div>
      )}
    </div>
  );
};

/**
 * Section › subsection › unit path of the unit currently open — the header's
 * title line (the course name already sits in the navbar). The layout only
 * passes names once a unit is resolved.
 */
export const CourseUnitBreadcrumb = ({
  moduleName,
  lessonName,
  unitName,
  className,
}: {
  moduleName?: string;
  lessonName?: string;
  unitName?: string;
  className?: string;
}) => {
  // Ancestors appear as the header's title column widens (container query):
  // the nearest first, then the section. Each can truncate, but the unit
  // name gives up space five times more slowly so it stays readable.
  const ancestors = [
    { name: moduleName, className: 'hidden @3xl:flex' },
    { name: lessonName, className: 'hidden @xl:flex' },
  ].filter((ancestor): ancestor is { name: string; className: string } => !!ancestor.name);
  if (ancestors.length === 0 && !unitName) {
    return null;
  }
  return (
    <div className={cn('@container min-w-0', className)}>
      <nav
        aria-label="Current unit"
        className="flex min-w-0 items-center text-sm whitespace-nowrap text-gray-500"
        data-testid="course-unit-breadcrumb"
      >
        {ancestors.map(({ name, className: ancestorClassName }, index) => (
          <span
            key={`${index}-${name}`}
            className={cn('min-w-0 items-center', ancestorClassName)}
            data-testid="course-unit-breadcrumb-ancestor"
          >
            <span className="truncate">{name}</span>
            <ChevronRight className="mx-1.5 h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
          </span>
        ))}
        {unitName && (
          <span
            className="min-w-0 shrink-[0.2] truncate font-semibold text-gray-900"
            aria-current="location"
          >
            {unitName}
          </span>
        )}
      </nav>
    </div>
  );
};
