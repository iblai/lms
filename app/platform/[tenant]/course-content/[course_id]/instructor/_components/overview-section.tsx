'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  useGetCohortSettingsQuery,
  useGetCohortsQuery,
  useGetGradebookQuery,
  useGetGradingInfoQuery,
  useListCourseRoleMembersQuery,
} from '@/services/instructor';
import { config } from '@/lib/config';
import { SectionCard, StatCard } from './instructor-ui';

export function OverviewSection({
  courseId,
  courseBasePath,
}: {
  courseId: string;
  courseBasePath: string;
}) {
  const { data: learners } = useGetGradebookQuery({ courseId, pageSize: 1 });
  const { data: staff = [] } = useListCourseRoleMembersQuery({ courseId, rolename: 'staff' });
  const { data: instructors = [] } = useListCourseRoleMembersQuery({
    courseId,
    rolename: 'instructor',
  });
  const { data: cohorts = [] } = useGetCohortsQuery({ courseId });
  const { data: cohortSettings } = useGetCohortSettingsQuery({ courseId });
  const { data: gradingInfo } = useGetGradingInfoQuery({ courseId });

  const gradedCount = gradingInfo?.subsections.filter((s) => s.graded).length;
  const passCutoff = gradingInfo?.grade_cutoffs
    ? Math.max(...Object.values(gradingInfo.grade_cutoffs))
    : undefined;

  return (
    <div className="space-y-4" data-testid="overview-section">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Enrolled learners"
          value={learners ? learners.total_users_count : '…'}
          hint="Active enrollments"
        />
        <StatCard
          label="Course team"
          value={staff.length + instructors.length}
          hint={`${instructors.length} admin · ${staff.length} staff`}
        />
        <StatCard
          label="Cohorts"
          value={cohortSettings?.is_cohorted ? cohorts.length : 'Off'}
          hint={cohortSettings?.is_cohorted ? 'Cohorts enabled' : 'Cohorts disabled'}
        />
        <StatCard
          label="Graded subsections"
          value={gradedCount ?? '…'}
          hint={passCutoff !== undefined ? `Pass mark ${Math.round(passCutoff * 100)}%` : undefined}
        />
      </div>
      <SectionCard title="Quick links" description="Everything else you can do with this course.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { label: 'Grades', href: `${courseBasePath}/gradebook` },
            { label: 'Analytics', href: `${courseBasePath}/analytics` },
            { label: 'Settings', href: `${courseBasePath}/configuration` },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={`${config.urls.studioUrl()}/course/${courseId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Authoring <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            </a>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
