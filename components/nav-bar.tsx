'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';
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
import {
  useGetUserCatalogPathwaysQuery,
  useGetUserEnrolledProgramsQuery,
} from '@/services/catalog';
import { config } from '@/lib/config';
import { isDiscoverEnabled } from '@/utils/discover-visibility';

/** Max enrolled courses fetched when resolving the current course's name. */
const COURSE_LOOKUP_PAGE_SIZE = 50;

/** Shared navbar page-title rendering (course / program / catalog). */
function NavbarTitle({ label, className }: { label: string; className?: string }) {
  return (
    <h1
      className={`truncate text-lg font-medium text-[var(--navbar-text)] sm:text-xl ${className ?? ''}`}
      data-testid="navbar-page-title"
    >
      {label}
    </h1>
  );
}

/**
 * Current course title — shown in the navbar's left cluster on the
 * course ABOUT page (`/courses/<id>`) and the course DETAIL pages
 * (`/course-content/<id>/…`). Resolves the name from the learner's
 * enrollments, falling back to a label derived from the course id.
 */
function CourseTitle({ tenant }: { tenant: string }) {
  const pathname = usePathname();
  const username = getUserName();

  const match = pathname?.match(/\/(courses|course-content)\/([^/]+)(\/.*)?$/);
  const courseId = match?.[2] ? decodeURIComponent(match[2]) : undefined;

  const { data } = useGetUserEnrolledCoursesQuery(
    {
      username: username ?? '',
      query: { page_size: COURSE_LOOKUP_PAGE_SIZE, platform_key: tenant },
    },
    { skip: !courseId || !username },
  );

  if (!courseId) return null;

  const current = (data?.results ?? []).find((course) => course.course_id === courseId);
  // Fallback when the opened course isn't in the enrollments (e.g. an
  // un-enrolled about page): derive a readable label from the course id
  // (`course-v1:org+NUM+RUN` → "NUM RUN").
  const fallbackLabel = courseId.split(':').pop()?.split('+').slice(1).join(' ') || courseId;
  const label = current?.course_name || fallbackLabel;

  return <NavbarTitle label={label} />;
}

/**
 * Current program title — shown in the navbar's left cluster on the
 * program detail page (`/programs/<id>`). Resolves the name from the
 * learner's program enrollments, falling back to the raw program id.
 */
function ProgramTitle({ tenant }: { tenant: string }) {
  const pathname = usePathname();
  const username = getUserName();

  const match = pathname?.match(/\/programs\/([^/]+)/);
  const programId = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  const { data } = useGetUserEnrolledProgramsQuery(
    { username: username ?? '', platform_key: tenant },
    { skip: !programId || !username },
  );

  if (!programId) return null;

  const current = (data ?? []).find((program) => program.program_id === programId);
  const label = current?.name || programId;

  return <NavbarTitle label={label} />;
}

/**
 * Current pathway title — shown in the navbar's left cluster on the
 * pathway detail page (`/pathways/<uuid>`). Resolves the name from the
 * user's catalog pathways, falling back to a generic label (the raw
 * uuid would be noise).
 */
function PathwayTitle({ tenant }: { tenant: string }) {
  const pathname = usePathname();
  const username = getUserName();

  const match = pathname?.match(/\/pathways\/([^/]+)/);
  const pathwayId = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  const { data } = useGetUserCatalogPathwaysQuery(
    { username: username ?? '', platform_key: tenant },
    { skip: !pathwayId || !username },
  );

  if (!pathwayId) return null;

  const current = (data ?? []).find((pathway) => pathway.pathway_uuid === pathwayId);
  const label = current?.name || 'Pathway';

  return <NavbarTitle label={label} />;
}

/**
 * SkillsAI top navigation, built on the cross-SPA `PlatformNavbar`
 * shell. The shell owns the invariant right cluster (search box,
 * notification bell, profile dropdown slot, anonymous Log in / Sign up);
 * this wrapper supplies the SkillsAI-specific left cluster (mobile
 * sidebar toggle + the current page title — page navigation lives in
 * the PlatformSidebar now) and the right-side tenant-configured links.
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
  const isProgramPage = /\/programs\/[^/]+/.test(pathname ?? '');
  const isPathwayPage = /\/pathways\/[^/]+/.test(pathname ?? '');
  const isCatalogPage = /\/discover\/?$/.test(pathname?.split('?')[0] ?? '');
  const isNotificationsPage = /\/notifications(\/|$)/.test(pathname?.split('?')[0] ?? '');
  const isAnalyticsPage = /\/analytics(\/|$)/.test(pathname?.split('?')[0] ?? '');

  // VARIABLE left cluster: mobile sidebar toggle, the current course /
  // program title on their detail pages, and tenant-configured extra
  // links. The old Home / Profile / Recommended / Discover links moved
  // to the sidebar.
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

      {/* Current course / program / pathway title on their detail pages */}
      {isUserLoggedIn && isCoursePage && <CourseTitle tenant={tenant} />}
      {isUserLoggedIn && isProgramPage && <ProgramTitle tenant={tenant} />}
      {isUserLoggedIn && isPathwayPage && <PathwayTitle tenant={tenant} />}

      {/* Static page titles (the pages themselves render no heading) */}
      {isCatalogPage && <NavbarTitle label="Explore Content" />}
      {isNotificationsPage && <NavbarTitle label="Notifications" />}
      {/* The analytics content is inset further than other pages, so the
          title gets extra left padding on tablet/desktop to line up with
          it (mobile keeps the default alignment). */}
      {isAnalyticsPage && <NavbarTitle label="Analytics" className="md:pl-3" />}

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
