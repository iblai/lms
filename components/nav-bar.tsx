'use client';
import Link from 'next/link';
import { Check, ChevronDown, GraduationCap, Menu } from 'lucide-react';
import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { UserProfileButton } from './header/profile/user-profile-button';
import { getUserName, parseMarkdownLinks, redirectToAuthSpaJoinTenant } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { PlatformNavbar } from '@iblai/iblai-js/web-containers';
import { useSidebar } from '@iblai/iblai-js/web-containers/next';
import { isLoggedIn, useTenantMetadata } from '@iblai/iblai-js/web-utils';

import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useGetUserEnrolledCoursesQuery } from '@/services/courses';
import { EnrolledCourse } from '@/types/courses';
import { config } from '@/lib/config';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Max enrolled courses listed in the switcher dropdown. */
const COURSE_SWITCHER_PAGE_SIZE = 50;

/**
 * Course context switcher — shown in the navbar's left cluster on the
 * course ABOUT page (`/courses/<id>`) and the course DETAIL pages
 * (`/course-content/<id>/…`). Displays the current course and lets the
 * learner jump to any other enrolled course, preserving the surface
 * they're on (about ↔ about, detail tab ↔ same detail tab).
 */
function CourseSwitcher({ tenant }: { tenant: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const username = getUserName();

  const match = pathname?.match(/\/(courses|course-content)\/([^/]+)(\/.*)?$/);
  const kind = match?.[1];
  const courseId = match?.[2] ? decodeURIComponent(match[2]) : undefined;
  // For detail pages keep only the tab segment (course|progress|dates|…) —
  // deeper unit paths are course-specific and don't transfer.
  const tab = match?.[3]?.split('/')[1];

  const { data, isLoading } = useGetUserEnrolledCoursesQuery(
    {
      username: username ?? '',
      query: { page_size: COURSE_SWITCHER_PAGE_SIZE, platform_key: tenant },
    },
    { skip: !courseId || !username },
  );

  if (!courseId || !kind) return null;

  const courses = (data?.results ?? []).filter((course) => course.course_name);
  const current = courses.find((course) => course.course_id === courseId);
  // Fallback when the opened course isn't in the enrollments (e.g. an
  // un-enrolled about page): derive a readable label from the course id
  // (`course-v1:org+NUM+RUN` → "NUM RUN").
  const fallbackLabel = courseId.split(':').pop()?.split('+').slice(1).join(' ') || courseId;
  const label = current?.course_name ?? fallbackLabel;

  const handleSelect = (course: EnrolledCourse) => {
    if (course.course_id === courseId) return;
    const base = `/platform/${tenant}`;
    router.push(
      kind === 'course-content'
        ? // Encoded like the app's own course-content tab links.
          `${base}/course-content/${encodeURIComponent(course.course_id)}/${tab || 'course'}`
        : `${base}/courses/${course.course_id}`,
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--navbar-text)] transition-colors hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
          aria-label="Switch course"
        >
          <GraduationCap className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          <span className="max-w-[160px] truncate sm:max-w-[240px] lg:max-w-[320px]">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] w-80 max-w-[90vw] overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-medium text-gray-500">
          My Courses
        </DropdownMenuLabel>
        {isLoading && (
          <div className="space-y-1 px-2 py-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        )}
        {!isLoading && courses.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-gray-500">No enrolled courses</div>
        )}
        {!isLoading &&
          courses.map((course) => (
            <DropdownMenuItem
              key={course.course_id}
              onSelect={() => handleSelect(course)}
              className="cursor-pointer"
            >
              <span className="min-w-0 flex-1 truncate">{course.course_name}</span>
              {course.course_id === courseId && (
                <Check className="ml-2 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              )}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * SkillsAI top navigation, built on the cross-SPA `PlatformNavbar`
 * shell. The shell owns the invariant right cluster (search box,
 * notification bell, profile dropdown slot, anonymous Log in / Sign up);
 * this wrapper supplies the SkillsAI-specific left cluster (mobile
 * sidebar toggle + course switcher — page navigation lives in the
 * PlatformSidebar now) and the right-side Studio / AI Analytics links.
 */
export function NavBar() {
  const tenant = useTenantParam();
  const isUserLoggedIn = isLoggedIn();
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const { metadata } = useTenantMetadata({ org: tenant });
  // The search bar is gated like the old navbar's: by the config flag and
  // the tenant's `enable_discover_page` metadata (flag supersedes).
  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });
  const additionalLeftHeaderMenuItems = parseMarkdownLinks(
    config.settings.additionalLeftHeaderMenuItems(),
  );
  const additionalRightHeaderMenuItems = parseMarkdownLinks(
    config.settings.additionalRightHeaderMenuItems(),
  );

  const handleViewNotifications = useCallback(
    (notificationId?: string) => {
      router.push(`/platform/${tenant}/notifications/${notificationId ?? ''}`);
    },
    [router, tenant],
  );

  // The invariant navbar search routes to the Discover page, seeding its
  // search box via `?q=`; on Discover itself it updates the query in place.
  const handleSearchSubmit = useCallback(
    (query: string) => {
      if (pathname?.includes('/discover')) {
        const url = new URL(window.location.href);
        url.searchParams.set('q', encodeURIComponent(query));
        router.push(url.pathname + url.search);
      } else {
        router.push(`/platform/${tenant}/discover?q=${encodeURIComponent(query)}`);
      }
    },
    [pathname, router, tenant],
  );

  const isCoursePage = /\/(courses|course-content)\/[^/]+/.test(pathname ?? '');

  // VARIABLE left cluster: mobile sidebar toggle, the course switcher on
  // course about/detail pages, and tenant-configured extra links. The old
  // Home / Profile / Recommended / Discover links moved to the sidebar.
  const leftCluster = (
    <div className="flex h-16 min-w-0 items-center overflow-hidden pl-4 sm:pl-6 md:h-20">
      {/* Mobile hamburger — opens the PlatformSidebar mobile sheet, which
          only renders for logged-in users, so hide it when logged out. */}
      {isUserLoggedIn && (
        <button
          onClick={toggleSidebar}
          className="mr-3 rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none focus:ring-inset md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Current course + switcher on course about/detail pages */}
      {isUserLoggedIn && isCoursePage && <CourseSwitcher tenant={tenant} />}

      {additionalLeftHeaderMenuItems.length > 0 && (
        <nav className="ml-2 hidden h-full items-center space-x-6 md:flex">
          {additionalLeftHeaderMenuItems.map((menu, index) => (
            <Link
              key={`left-header-menu-${index}`}
              href={menu.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-center text-sm font-medium text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]"
            >
              {menu.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );

  // Right-side tenant-configured links — handed to the shell's
  // `modeSwitcher` slot, which positions them right before the invariant
  // cluster. (Studio and Analytics live in the sidebar.)
  const rightLinks =
    additionalRightHeaderMenuItems.length > 0 ? (
      <>
        {additionalRightHeaderMenuItems.map((menu, index) => (
          <Link
            key={`right-header-menu-${index}`}
            href={menu.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm font-medium whitespace-nowrap text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]"
          >
            {menu.label}
          </Link>
        ))}
      </>
    ) : undefined;

  return (
    // Keep the banner landmark the app (and e2e) relies on; the SDK shell
    // renders the inner <nav>.
    <header className="flex-shrink-0">
      <PlatformNavbar
        left={leftCluster}
        modeSwitcher={rightLinks}
        search={discoverEnabled ? { onSubmit: handleSearchSubmit } : null}
        notifications={
          isUserLoggedIn
            ? {
                org: tenant,
                userId: getUserName() ?? '',
                isAdmin: departmentMemberCheck?.is_platform_admin,
                onViewNotifications: handleViewNotifications,
              }
            : null
        }
        profile={
          isUserLoggedIn ? (
            <div className="relative">
              <UserProfileButton />
            </div>
          ) : undefined
        }
        visibleToLoggedInUsersOnly={isUserLoggedIn}
        onLoginClick={() => redirectToAuthSpaJoinTenant(tenant, undefined, true)}
        className="mb-0 h-16 border-[var(--border)] bg-[var(--navbar-bg)] md:h-20"
      />
    </header>
  );
}
