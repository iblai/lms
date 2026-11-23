'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  ChartColumn,
  ChartNoAxesColumn,
  ChevronRight,
  ClipboardList,
  Coins,
  FileText,
  ListTree,
  Presentation,
  Settings2,
  UserCog,
  Users,
} from 'lucide-react';
import {
  DASHBOARD_SECTIONS,
  isDashboardSection,
} from '@/app/platform/[tenant]/course-content/[course_id]/instructor/_components/instructor-dashboard';
import { CourseAdminShell, type CourseAdminSection } from '@/components/course-admin-shell';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { useCanSellItems } from '@/hooks/use-can-sell-items';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { useGetCourseMetaDataQuery } from '@/services/course-metadata';
import { useGetStudioCourseSettingsQuery } from '@/services/studio';
import { studioBasePath, studioCoursePath } from '@/utils/studio';

const INSTRUCTOR_ICONS = {
  membership: Users,
  cohorts: Users,
  extensions: CalendarDays,
  attempts: UserCog,
  reports: ChartNoAxesColumn,
} as const;

const OUTLINE_CONTEXT_DEFAULTS = {
  courseOutline: {} as never,
  courseOutlineLoading: false,
  expandedModule: '',
  expandedLessons: [],
  selectLesson: () => {},
  toggleModule: () => {},
  toggleLesson: () => {},
  currentChapter: '',
  currentLesson: '',
  courseOutlineDrawerOpen: false,
  setCourseOutlineDrawerOpen: () => {},
  currentUnitID: null,
  refetchCourseOutline: () => {},
};

/**
 * One course inside the native Studio: its details and outline first, then the
 * course administration pages, all behind a single section nav.
 */
export function StudioCourseShell({
  courseId,
  children,
}: {
  courseId: string;
  children: ReactNode;
}) {
  const tenant = useTenantParam();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canSellItems = useCanSellItems(tenant);
  const rbacPermissions = useAppSelector(selectRbacPermissions);
  const canViewAnalytics = checkRbacPermission(
    rbacPermissions,
    `/platforms/${tenant}/#can_view_analytics`,
  );
  const { data: settings } = useGetStudioCourseSettingsQuery({ courseKey: courseId });
  const { data: course } = useGetCourseMetaDataQuery({ courseKey: courseId });
  const courseName = course?.display_name || settings?.formData?.title || courseId;

  const sections = useMemo<CourseAdminSection[]>(() => {
    const href = (section: string) => studioCoursePath(tenant, courseId, section);
    const list: CourseAdminSection[] = [
      { key: 'details', label: 'Details', href: href('details'), icon: FileText },
      {
        key: 'outline',
        label: 'Outline',
        href: href('outline'),
        icon: ListTree,
        scrollsItself: true,
      },
      {
        key: 'gradebook',
        label: 'Grades',
        href: href('gradebook'),
        icon: ClipboardList,
        group: 'learners',
        scrollsItself: true,
      },
    ];
    DASHBOARD_SECTIONS.filter((section) => section.key !== 'overview').forEach((section) => {
      list.push({
        key: `instructor:${section.key}`,
        label: section.label,
        href: `${href('instructor')}?section=${section.key}`,
        icon: INSTRUCTOR_ICONS[section.key as keyof typeof INSTRUCTOR_ICONS],
        group: section.key === 'reports' ? 'insights' : 'learners',
        scrollsItself: true,
      });
    });
    list.push({
      key: 'instructor:overview',
      label: 'Overview',
      href: `${href('instructor')}?section=overview`,
      icon: Presentation,
      group: 'insights',
      scrollsItself: true,
    });
    if (canViewAnalytics) {
      list.push({
        key: 'analytics',
        label: 'Analytics',
        href: href('analytics'),
        icon: ChartColumn,
        group: 'insights',
      });
    }
    list.push({
      key: 'configuration',
      label: 'Settings',
      href: href('configuration'),
      icon: Settings2,
      group: 'course',
    });
    if (canSellItems) {
      list.push({
        key: 'monetization',
        label: 'Monetization',
        href: href('monetization'),
        icon: Coins,
        group: 'course',
      });
    }
    return list;
  }, [tenant, courseId, canViewAnalytics, canSellItems]);

  const segment = pathname?.split('/').filter(Boolean).pop() ?? '';
  const requestedSection = searchParams?.get('section');
  const activeKey =
    segment === 'instructor'
      ? `instructor:${isDashboardSection(requestedSection) ? requestedSection : 'overview'}`
      : segment;

  const outlineContext = useMemo(
    () => ({ ...OUTLINE_CONTEXT_DEFAULTS, course: course ?? null }),
    [course],
  );

  return (
    <CourseOutlineContext.Provider value={outlineContext}>
      <div className="flex h-full min-h-0 w-full flex-col" data-testid="studio-course-shell">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link
              href={studioBasePath(tenant)}
              className="shrink-0 font-medium text-gray-500 hover:text-gray-900"
            >
              Studio
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <h1 className="truncate font-semibold text-gray-900" title={courseName}>
              {courseName}
            </h1>
          </nav>
          <Link
            href={`/platform/${tenant}/courses/${encodeURIComponent(courseId)}`}
            className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            View course
          </Link>
        </header>
        <CourseAdminShell sections={sections} activeKey={activeKey}>
          {children}
        </CourseAdminShell>
      </div>
    </CourseOutlineContext.Provider>
  );
}
