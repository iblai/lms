'use client';

import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Info, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import {
  useGetCourseDatesQuery,
  useGetCourseHomeMetaQuery,
  useResetCourseDeadlinesMutation,
} from '@/services/course-home';
import { findUnitIdForBlock, usageKeyInUrl } from '@/utils/course-outline-links';
import type { CourseOutlineChildNode } from '@/types/courses';
import {
  type BadgeTone,
  type TimelineBadge,
  type TimelineDay,
  type TimelineItem,
  badgesFor,
  formatDay,
  formatTime,
  groupDateBlocks,
  isLearnerAssignment,
} from './dates-utils';

const BADGE_CLASSES: Record<BadgeTone, string> = {
  today: 'bg-amber-100 text-amber-800',
  completed: 'bg-gray-100 text-gray-700',
  pastDue: 'bg-gray-200 text-gray-800',
  dueNext: 'bg-gray-700 text-white',
  unreleased: 'border border-gray-400 text-gray-600',
  locked: 'bg-gray-800 text-white',
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  today: 'bg-amber-400 border-amber-400',
  completed: 'bg-gray-300 border-gray-300',
  pastDue: 'bg-gray-500 border-gray-500',
  dueNext: 'bg-gray-700 border-gray-700',
  unreleased: 'bg-white border-gray-500',
  locked: 'bg-gray-900 border-gray-900',
};

const Badges = ({ badges }: { badges: TimelineBadge[] }) => (
  <>
    {badges.map((badge) => (
      <span
        key={badge.key}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
          BADGE_CLASSES[badge.key],
        )}
        data-testid="dates-badge"
      >
        {badge.key === 'locked' && <Lock className="h-3 w-3" aria-hidden />}
        {badge.label}
      </span>
    ))}
  </>
);

/** Where an assignment opens: the Course tab when the outline knows its unit, else the LMS link. */
export const assignmentHref = (
  item: TimelineItem,
  outline: CourseOutlineChildNode | null | undefined,
  courseBasePath: string,
) => {
  if (!item.link || !isLearnerAssignment(item)) return null;
  const unitId =
    findUnitIdForBlock(outline, item.first_component_block_id) ??
    findUnitIdForBlock(outline, usageKeyInUrl(item.link));
  return unitId
    ? { href: `${courseBasePath}/course?unit_id=${encodeURIComponent(unitId)}`, external: false }
    : { href: item.link, external: true };
};

function DayRow({
  day,
  now,
  timeZone,
  courseBasePath,
}: {
  day: TimelineDay;
  now: Date;
  timeZone: string | null | undefined;
  courseBasePath: string;
}) {
  const { courseOutline } = useContext(CourseOutlineContext);
  const dayBadges = badgesFor(day.date, null, day.items, now);
  const isFuture = day.date > now && !day.today;
  const dotTone = dayBadges[0]?.key;
  return (
    <li className="relative pb-6 pl-7" data-testid="dates-day">
      {!day.first && (
        <span className="absolute top-0 left-[7px] h-2 w-px bg-gray-300" aria-hidden />
      )}
      <span
        className={cn(
          'absolute top-2 left-[3px] h-2.5 w-2.5 rounded-full border',
          dotTone ? DOT_CLASSES[dotTone] : isFuture ? DOT_CLASSES.locked : DOT_CLASSES.unreleased,
        )}
        aria-hidden
      />
      {!day.last && (
        <span className="absolute top-5 bottom-0 left-[7px] w-px bg-gray-300" aria-hidden />
      )}
      <div className="flex flex-wrap items-center gap-2" data-testid="dates-day-header">
        <span className="text-sm font-semibold text-gray-900">{formatDay(day.date, timeZone)}</span>
        <Badges badges={dayBadges} />
      </div>
      {day.items.map((item) => {
        const itemBadges = badgesFor(day.date, item, day.items, now);
        const link = assignmentHref(item, courseOutline, courseBasePath);
        const available = item.learner_has_access && (item.link || !isLearnerAssignment(item));
        const title = link ? (
          link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
            >
              {item.title} <ArrowUpRight className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <Link href={link.href} className="underline-offset-2 hover:underline">
              {item.title}
            </Link>
          )
        ) : (
          item.title
        );
        return (
          <div
            key={`${item.title}-${item.date}`}
            className={cn('mt-1.5 text-sm', available ? 'text-gray-800' : 'text-gray-500')}
            data-testid="dates-item"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                <span className="font-medium">
                  {item.assignment_type && `${item.assignment_type}: `}
                  {title}
                </span>
                {item.date_type === 'assignment-due-date' && (
                  <span className="text-gray-500">
                    {' '}
                    due {formatTime(new Date(item.date), timeZone)}
                  </span>
                )}
              </span>
              <Badges badges={itemBadges} />
              {item.extra_info && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="rounded text-gray-400 hover:text-gray-700"
                        aria-label={item.extra_info}
                        data-testid="dates-extra-info"
                      >
                        <Info className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{item.extra_info}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {item.description && <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>}
          </div>
        );
      })}
    </li>
  );
}

export function CourseDates({
  courseId,
  courseBasePath,
  now = new Date(),
}: {
  courseId: string;
  courseBasePath: string;
  /** Injected by tests so "today" is stable. */
  now?: Date;
}) {
  const { data, isLoading, error } = useGetCourseDatesQuery({ courseId });
  const { data: meta } = useGetCourseHomeMetaQuery({ courseId });
  const [resetDeadlines, { isLoading: resetting }] = useResetCourseDeadlinesMutation();

  const blocks = useMemo(() => data?.course_date_blocks ?? [], [data?.course_date_blocks]);
  const days = useMemo(() => groupDateBlocks(blocks, now), [blocks, now]);
  const timeZone = data?.user_timezone ?? meta?.user_timezone;
  const hasDeadlines = blocks.some((block) => block.date_type === 'assignment-due-date');
  const banner = data?.dates_banner_info;
  const canShiftDates =
    !!meta?.is_self_paced && hasDeadlines && !data?.has_ended && !!banner?.missed_deadlines;
  const upgradeLink =
    !!meta?.is_self_paced && hasDeadlines && !data?.has_ended && banner?.missed_gated_content
      ? banner.verified_upgrade_link
      : null;

  const shiftDates = async () => {
    try {
      const result = await resetDeadlines({ courseId }).unwrap();
      toast.success(result?.message || 'Your due dates have been shifted.');
    } catch (err) {
      toast.error((err as Error).message || 'Your due dates could not be shifted');
    }
  };

  if (error) {
    return (
      <div className="px-3 py-4 md:px-4">
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load the course dates. {(error as Error).message}
        </p>
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-4 px-3 py-4 md:px-4" data-testid="course-dates-loading">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 md:px-4"
      data-testid="course-dates"
    >
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Important dates</h2>
          <p className="text-xs text-gray-500">
            Assignment due dates and other milestones for this course
            {timeZone ? `, shown in ${timeZone}` : ''}.
          </p>
        </div>

        {canShiftDates && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
            role="status"
            data-testid="shift-dates-alert"
          >
            <p className="text-sm text-amber-900">
              It looks like you missed some important deadlines based on our suggested schedule. You
              can shift the past-due assignments into the future without losing any progress.
            </p>
            <Button
              type="button"
              size="sm"
              className="bg-amber-500 text-white hover:bg-amber-600"
              disabled={resetting}
              onClick={shiftDates}
            >
              {resetting ? 'Shifting…' : 'Shift due dates'}
            </Button>
          </div>
        )}
        {upgradeLink && (
          <p
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            data-testid="upgrade-to-shift-alert"
          >
            You are auditing this course, which means that you are unable to participate in graded
            assignments. To complete graded assignments as part of this course,{' '}
            <a
              href={upgradeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-amber-700 hover:underline"
            >
              upgrade your enrollment
            </a>
            .
          </p>
        )}

        {blocks.length === 0 ? (
          <p className="text-sm text-gray-500" data-testid="dates-empty">
            There are no dates to show for this course yet.
          </p>
        ) : (
          <ol className="mt-2" data-testid="dates-timeline">
            {days.map((day) => (
              <DayRow
                key={`${day.date.toISOString()}-${day.today}`}
                day={day}
                now={now}
                timeZone={timeZone}
                courseBasePath={courseBasePath}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
