'use client';

import { OverviewSection } from './overview-section';
import { MembershipSection } from './membership-section';
import { CohortsSection } from './cohorts-section';
import { ExtensionsSection } from './extensions-section';
import { AttemptsSection } from './attempts-section';
import { ReportsSection } from './reports-section';

/** Sections of the native instructor page, each reachable as `?section=<key>`. */
export const DASHBOARD_SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'membership', label: 'Membership' },
  { key: 'cohorts', label: 'Cohorts' },
  { key: 'extensions', label: 'Extensions' },
  { key: 'attempts', label: 'Attempts' },
  { key: 'reports', label: 'Reports' },
] as const;

export type DashboardSectionKey = (typeof DASHBOARD_SECTIONS)[number]['key'];

export const isDashboardSection = (value: string | null): value is DashboardSectionKey =>
  DASHBOARD_SECTIONS.some((section) => section.key === value);

/**
 * Native replacement for the edX instructor dashboard. The course admin nav
 * (in the course layout) switches sections through the `section` query param.
 */
export function InstructorDashboard({
  courseId,
  courseBasePath,
  section,
}: {
  courseId: string;
  courseBasePath: string;
  section: DashboardSectionKey;
}) {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto bg-gray-50/60 px-3 py-4 md:px-4"
      style={{ scrollbarWidth: 'none' }}
      data-testid="instructor-dashboard"
    >
      {section === 'overview' && (
        <OverviewSection courseId={courseId} courseBasePath={courseBasePath} />
      )}
      {section === 'membership' && <MembershipSection courseId={courseId} />}
      {section === 'cohorts' && <CohortsSection courseId={courseId} />}
      {section === 'extensions' && <ExtensionsSection courseId={courseId} />}
      {section === 'attempts' && <AttemptsSection courseId={courseId} />}
      {section === 'reports' && <ReportsSection courseId={courseId} />}
    </div>
  );
}
