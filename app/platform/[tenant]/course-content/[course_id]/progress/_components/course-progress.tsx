'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Lock, MessagesSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCourseProgressQuery } from '@/services/course-metadata';
import { useGetCourseHomeMetaQuery } from '@/services/course-home';
import { legacyLmsPost } from '@/services/instructor';
import type { CourseProgress as CourseProgressData } from '@/types/courses';
import { DetailedGrades, GradeBar, GradeSummaryTable } from './progress-grades';
import {
  certificateCase,
  completionBreakdown,
  gradeLocks,
  summarizeAssignmentTypes,
} from './progress-utils';

const DONUT_RADIUS = 15.915;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/** Complete / incomplete / locked units as a ring, the edX progress page's chart. */
export function CompletionDonut({
  summary,
}: {
  summary: CourseProgressData['completion_summary'];
}) {
  const breakdown = completionBreakdown(summary);
  const segment = (percent: number, offset: number) => ({
    strokeDasharray: `${(percent / 100) * DONUT_CIRCUMFERENCE} ${DONUT_CIRCUMFERENCE}`,
    strokeDashoffset: -((offset / 100) * DONUT_CIRCUMFERENCE),
  });
  return (
    <div className="flex items-center gap-5" data-testid="completion-donut">
      <svg
        viewBox="0 0 42 42"
        className="h-32 w-32 shrink-0 -rotate-90"
        role="img"
        aria-label={`${breakdown.completePercent}% complete, ${breakdown.incompletePercent}% incomplete${breakdown.lockedPercent ? `, ${breakdown.lockedPercent}% locked` : ''}`}
      >
        <circle
          cx="21"
          cy="21"
          r={DONUT_RADIUS}
          fill="none"
          strokeWidth="5"
          className="stroke-gray-200"
        />
        {breakdown.lockedPercent > 0 && (
          <circle
            cx="21"
            cy="21"
            r={DONUT_RADIUS}
            fill="none"
            strokeWidth="5"
            className="stroke-gray-500"
            style={segment(breakdown.lockedPercent, breakdown.completePercent)}
          />
        )}
        <circle
          cx="21"
          cy="21"
          r={DONUT_RADIUS}
          fill="none"
          strokeWidth="5"
          strokeLinecap={breakdown.completePercent < 100 ? 'round' : undefined}
          className="stroke-amber-500 transition-[stroke-dasharray] duration-500"
          style={segment(breakdown.completePercent, 0)}
        />
        <text
          x="21"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          transform="rotate(90 21 21)"
          className="fill-gray-900 text-[9px] font-semibold"
        >
          {breakdown.completePercent}%
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm" aria-label="Completion breakdown">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
          <span className="text-gray-700">
            <span className="font-semibold text-gray-900">{breakdown.completePercent}%</span>{' '}
            complete
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-200" aria-hidden />
          <span className="text-gray-700">
            <span className="font-semibold text-gray-900">{breakdown.incompletePercent}%</span>{' '}
            incomplete
          </span>
        </li>
        {breakdown.lockedPercent > 0 && (
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-500" aria-hidden />
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{breakdown.lockedPercent}%</span> locked
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

const Card = ({
  title,
  description,
  children,
  className,
  testId,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) => (
  <section
    className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}
    aria-labelledby={`progress-${title.replace(/\s+/g, '-').toLowerCase()}`}
    data-testid={testId}
  >
    <h3
      id={`progress-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className="text-base font-semibold text-gray-900"
    >
      {title}
    </h3>
    {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

function CertificateCard({
  progress,
  courseId,
  meta,
}: {
  progress: CourseProgressData;
  courseId: string;
  meta: ReturnType<typeof useGetCourseHomeMetaQuery>['data'];
}) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const status = certificateCase(progress, meta);
  if (!status) return null;
  const requestCertificate = async () => {
    setRequesting(true);
    try {
      await legacyLmsPost(`/courses/${courseId}/generate_user_cert`, {});
      setRequested(true);
      toast.success('Your certificate has been requested. It will be ready shortly.');
    } catch (error) {
      toast.error((error as Error).message || 'The certificate could not be requested');
    } finally {
      setRequesting(false);
    }
  };
  return (
    <Card title={status.title} testId="certificate-status">
      <p className="text-sm text-gray-700">{status.body}</p>
      {status.action?.href && (
        <Button asChild variant="outline" size="sm" className="mt-3">
          <a href={status.action.href} target="_blank" rel="noopener noreferrer">
            {status.action.label} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      )}
      {status.action?.request && !requested && (
        <Button
          type="button"
          size="sm"
          className="mt-3 bg-amber-500 text-white hover:bg-amber-600"
          disabled={requesting}
          onClick={requestCertificate}
        >
          {requesting ? 'Requesting…' : status.action.label}
        </Button>
      )}
    </Card>
  );
}

export function CourseProgress({
  courseId,
  courseBasePath,
}: {
  courseId: string;
  courseBasePath: string;
}) {
  const { data: progress, isLoading, error } = useGetCourseProgressQuery({ courseKey: courseId });
  const { data: meta } = useGetCourseHomeMetaQuery({ courseId });

  if (error) {
    return (
      <div className="px-3 py-4 md:px-4">
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Couldn&apos;t load your progress. {(error as Error).message}
        </p>
      </div>
    );
  }
  if (isLoading || !progress) {
    return (
      <div className="space-y-4 px-3 py-4 md:px-4" data-testid="course-progress-loading">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { fullyLocked, partiallyLocked } = gradeLocks(progress);
  const summaries = summarizeAssignmentTypes(progress, fullyLocked);
  const hasGradingPolicy = summaries.length > 0;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 md:px-4"
      data-testid="course-progress"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Your progress</h2>
          <p className="text-xs text-gray-500">
            How much of the course you have completed and how you are doing on graded work.
          </p>
        </div>

        <Card
          title="Course completion"
          description="This represents how much of the course content you have completed. Note that some content may not yet be released."
          testId="course-completion"
        >
          <CompletionDonut summary={progress.completion_summary} />
        </Card>

        <Card
          title="Grades"
          description="This represents your weighted grade against the grade needed to pass this course."
          testId="course-grades"
          className={cn(fullyLocked && 'relative')}
        >
          {fullyLocked && (
            <p
              className="mb-4 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              data-testid="grades-locked"
            >
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
              Grades are locked for your enrollment track. Upgrade to unlock graded assignments and
              your progress on them.
            </p>
          )}
          <div className={cn('space-y-6', fullyLocked && 'opacity-50')} aria-hidden={fullyLocked}>
            <GradeBar
              courseGrade={progress.course_grade}
              gradeRange={progress.grading_policy?.grade_range}
            />
            {hasGradingPolicy ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Grade summary</h4>
                <GradeSummaryTable summaries={summaries} courseGrade={progress.course_grade} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">This course has no graded assignments.</p>
            )}
            <DetailedGrades
              sections={progress.section_scores}
              courseBasePath={courseBasePath}
              fullyLocked={fullyLocked}
              partiallyLocked={partiallyLocked}
            />
          </div>
        </Card>

        <CertificateCard progress={progress} courseId={courseId} meta={meta} />

        <Card title="Related links" testId="related-links">
          <ul className="grid gap-2 sm:grid-cols-2">
            <li>
              <Link
                href={`${courseBasePath}/dates`}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden />
                Dates
                <span className="ml-auto text-xs font-normal text-gray-500">
                  Upcoming assignments and deadlines
                </span>
              </Link>
            </li>
            <li>
              <Link
                href={`${courseBasePath}/discussion`}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <MessagesSquare className="h-4 w-4 text-gray-400" aria-hidden />
                Discussions
                <span className="ml-auto text-xs font-normal text-gray-500">
                  Ask questions and talk with the class
                </span>
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
