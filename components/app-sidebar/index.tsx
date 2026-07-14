'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  ClipboardList,
  Compass,
  GraduationCap,
  Home,
  Layers,
  LineChart,
  PencilRuler,
  Route,
  Sparkles,
} from 'lucide-react';
import { GradebookTab, InviteUserDialog } from '@iblai/iblai-js/web-containers';
import {
  PLATFORM_SIDEBAR_NAV_MUTED,
  PlatformAccountSheet,
  PlatformSidebar,
  PlatformSidebarCollapsedLabelFlyout,
} from '@iblai/iblai-js/web-containers/next';
import type {
  PlatformAccountTab,
  PlatformSidebarFooterActionId,
  PlatformSidebarMenu,
  PlatformSidebarNavIcon,
  PlatformSidebarSectionConfig,
} from '@iblai/iblai-js/web-containers/next';
import { isLoggedIn, Tenant, useTenantMetadata } from '@iblai/iblai-js/web-utils';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { config } from '@/lib/config';
import { Logo } from '@/components/logo';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { getUserEmail, getUserName } from '@/utils/helpers';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { canMonetize, useCurrentTenant, useUserTenants } from '@/utils/localstorage';
import { ProfileCredentialsContent } from '@/components/profile/profile-credentials-content';
import { ProfileSkillsContent } from '@/components/profile/profile-skills-content';

type SidebarOpenSection = 'analytics';

type LibraryDialogId = 'gradebook' | 'credentials' | 'skills';

/** Content hosted in the shared dialog shell: the SDK Gradebook, plus the
 * profile > Credentials and profile > Skills page content (shared with
 * those routes via the components/profile/* content components). */
const LIBRARY_DIALOGS: Record<
  LibraryDialogId,
  {
    title: string;
    description: string;
    render: (ctx: { org: string; username: string }) => React.ReactNode;
  }
> = {
  gradebook: {
    title: 'Gradebook',
    description: 'Your grades and progress across courses, programs, and pathways.',
    render: ({ org, username }) => <GradebookTab org={org} username={username} />,
  },
  credentials: {
    title: 'Credentials',
    description: 'Credentials you have earned.',
    render: () => <ProfileCredentialsContent />,
  },
  skills: {
    title: 'Skills',
    description: 'Your earned, self-reported, and desired skills.',
    render: () => <ProfileSkillsContent />,
  },
};

/**
 * A flat (no sub-menu) top-level nav row, styled to match the SDK's
 * `PlatformSidebarNavSection` trigger. Renders an icon button with a
 * label flyout in the collapsed rail, and a full-width row when
 * expanded. `href` navigates (external http(s) URLs open a new tab);
 * `onClick` runs instead of navigating (e.g. opens a dialog).
 */
function FlatNavRow({
  collapsed,
  icon: Icon,
  label,
  href,
  exact,
  activeOverride,
  onClick,
  onAfterNav,
}: {
  collapsed: boolean;
  icon: PlatformSidebarNavIcon;
  label: string;
  href?: string;
  /** Only mark active on an exact path match (e.g. `/profile` shouldn't
   * light up on `/profile/skills`). */
  exact?: boolean;
  /** Overrides the pathname-derived active state (e.g. catalog items
   * distinguished by query params on the same route). */
  activeOverride?: boolean;
  onClick?: () => void;
  onAfterNav?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isExternal = !!href && /^https?:\/\//i.test(href);
  const active = React.useMemo(() => {
    if (activeOverride !== undefined) return activeOverride;
    if (!href || isExternal || !pathname) return false;
    const normalizedHref = (href.split('?')[0] ?? '').replace(/\/$/, '');
    const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    if (exact) return normalizedPath === normalizedHref;
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  }, [href, exact, activeOverride, isExternal, pathname]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      if (isExternal) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(href);
      }
    }
    onAfterNav?.();
  };

  if (collapsed) {
    return (
      <PlatformSidebarCollapsedLabelFlyout label={label}>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'text-foreground inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] transition-colors outline-none hover:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-[#c4c4c8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]',
            active && 'bg-[#eef6fc]',
          )}
          aria-label={label}
        >
          <Icon
            className="size-4 shrink-0"
            style={{ color: active ? '#1e40af' : PLATFORM_SIDEBAR_NAV_MUTED }}
            strokeWidth={1.5}
          />
        </button>
      </PlatformSidebarCollapsedLabelFlyout>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[14px] font-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#cfe8fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]',
        active ? 'bg-[#eef6fc] text-[#1e40af]' : 'text-[#5f5f61] hover:bg-[#f4f4f4]',
      )}
    >
      <Icon
        className="size-4 shrink-0"
        style={{ color: active ? '#1e40af' : PLATFORM_SIDEBAR_NAV_MUTED }}
        strokeWidth={1.5}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/**
 * SkillsAI sidebar built on the cross-SPA `PlatformSidebar` shell.
 *
 * The shell owns the invariant chrome (logo slot, collapse rail,
 * single-open accordion, and the footer cluster + its RBAC/admin
 * visibility rules). This wrapper supplies the SkillsAI-specific
 * variable content: Courses / Programs / Pathways / Discover links,
 * then the Analytics menu and Studio.
 */
export function AppSidebar() {
  const router = useRouter();
  const tenant = useTenantParam();
  const username = getUserName();
  const userEmail = getUserEmail();

  const { currentTenant } = useCurrentTenant();
  const { userTenants } = useUserTenants();
  const rbacPermissions = useAppSelector(selectRbacPermissions);
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery(
    { platform_key: tenant },
    { skip: !tenant },
  );
  const { metadata } = useTenantMetadata({ org: tenant });

  const [accountTab, setAccountTab] = React.useState<PlatformAccountTab | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [libraryDialog, setLibraryDialog] = React.useState<LibraryDialogId | null>(null);
  const [openSection, setOpenSection] = React.useState<SidebarOpenSection | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Force-open the Analytics accordion when deep-linked into it.
  React.useEffect(() => {
    if (pathname?.includes('/analytics')) setOpenSection('analytics');
  }, [pathname]);

  const isPlatformAdmin = !!departmentMemberCheck?.is_platform_admin;

  // Discover follows the same gate as the nav-bar: the config flag
  // supersedes the tenant's `enable_discover_page` metadata.
  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });

  // Studio mirrors the nav-bar implementation: config-flag gated,
  // admin-only, external link to the Studio host.
  const studioAllowed =
    config.settings.studioHeaderMenuEnabled() &&
    (departmentMemberCheck?.is_platform_admin || departmentMemberCheck?.is_department_admin);

  const analyticsMenu = React.useMemo<PlatformSidebarMenu>(() => {
    const base = `/platform/${tenant}/analytics`;
    return {
      id: 'analytics',
      label: 'Analytics',
      icon: LineChart,
      items: [
        { id: 'analytics-overview', label: 'Overview', href: base, exact: true },
        { id: 'analytics-users', label: 'Users', href: `${base}/users` },
        { id: 'analytics-courses', label: 'Courses', href: `${base}/courses` },
        { id: 'analytics-programs', label: 'Programs', href: `${base}/programs` },
        { id: 'analytics-topics', label: 'Topics', href: `${base}/topics` },
        { id: 'analytics-transcripts', label: 'Transcripts', href: `${base}/transcripts` },
        { id: 'analytics-costs', label: 'Costs', href: `${base}/financial` },
        { id: 'analytics-audit', label: 'Audit', href: `${base}/audit` },
        { id: 'analytics-reports', label: 'Data Reports', href: `${base}/reports` },
      ],
    };
  }, [tenant]);

  const analyticsAllowed =
    config.settings.aiAnalyticsHeaderMenuEnabled() &&
    checkRbacPermission(rbacPermissions, `/platforms/${tenant}/#can_view_analytics`);

  // Catalog context — Courses / Programs / Pathways / Discover all live on
  // the centralized catalog page and are told apart by query params.
  const onCatalogPage = !!pathname?.split('?')[0]?.match(/\/discover\/?$/);
  const catalogEnrolled = searchParams?.get('enrolled') === 'true';
  const catalogContent = searchParams?.get('content') ?? '';
  const catalogBase = `/platform/${tenant}/discover`;

  const sections = React.useMemo<PlatformSidebarSectionConfig[]>(() => {
    const flat = (
      id: string,
      icon: PlatformSidebarNavIcon,
      label: string,
      href: string,
      opts?: { exact?: boolean; activeOverride?: boolean },
    ): PlatformSidebarSectionConfig => ({
      type: 'custom',
      id,
      render: (ctx) => (
        <FlatNavRow
          collapsed={ctx.collapsed}
          icon={icon}
          label={label}
          href={href}
          exact={opts?.exact}
          activeOverride={opts?.activeOverride}
          onAfterNav={ctx.onAfterNav}
        />
      ),
    });

    // Dialog rows: open the shared library dialog instead of routing.
    const dialogRow = (
      id: LibraryDialogId,
      icon: PlatformSidebarNavIcon,
      label: string,
    ): PlatformSidebarSectionConfig => ({
      type: 'custom',
      id,
      render: (ctx) => (
        <FlatNavRow
          collapsed={ctx.collapsed}
          icon={icon}
          label={label}
          onClick={() => setLibraryDialog(id)}
          onAfterNav={ctx.onAfterNav}
        />
      ),
    });

    // Courses / Programs / Pathways deep-link the centralized catalog with
    // the user's enrollments pre-filtered; Discover is the same page with
    // no enrollment filter.
    const catalogItem = (
      id: string,
      icon: PlatformSidebarNavIcon,
      label: string,
      content: string,
    ) =>
      flat(id, icon, label, `${catalogBase}?content=${content}&enrolled=true`, {
        activeOverride: onCatalogPage && catalogEnrolled && catalogContent === content,
      });

    const list: PlatformSidebarSectionConfig[] = [
      flat('home', Home, 'Home', `/platform/${tenant}/home`),
      catalogItem('courses', GraduationCap, 'Courses', 'courses'),
      catalogItem('programs', Layers, 'Programs', 'programs'),
      catalogItem('pathways', Route, 'Pathways', 'pathways'),
    ];
    if (discoverEnabled) {
      list.push(
        flat('discover', Compass, 'Discover', catalogBase, {
          activeOverride: onCatalogPage && !catalogEnrolled,
        }),
      );
    }
    list.push({ type: 'divider', id: 'library-divider' });
    if (studioAllowed) {
      list.push(flat('studio', PencilRuler, 'Studio', config.urls.studioUrl()));
    }
    if (analyticsAllowed) {
      list.push({ type: 'menu', menu: analyticsMenu });
    }
    list.push(dialogRow('gradebook', ClipboardList, 'Gradebook'));
    list.push(dialogRow('credentials', Award, 'Credentials'));
    list.push(dialogRow('skills', Sparkles, 'Skills'));
    return list;
  }, [
    tenant,
    discoverEnabled,
    analyticsAllowed,
    analyticsMenu,
    studioAllowed,
    catalogBase,
    onCatalogPage,
    catalogEnrolled,
    catalogContent,
  ]);

  const handleFooterAction = React.useCallback(
    (actionId: PlatformSidebarFooterActionId) => {
      switch (actionId) {
        case 'notifications':
          router.push(`/platform/${tenant}/notifications`);
          return;
        case 'invites':
          setInviteOpen(true);
          return;
        case 'management':
          setAccountTab('management');
          return;
        case 'integrations':
          setAccountTab('integrations');
          return;
        case 'monetization':
          setAccountTab('monetization');
          return;
        case 'advanced':
          setAccountTab('advanced');
          return;
      }
    },
    [router, tenant],
  );

  if (!isLoggedIn()) return null;

  return (
    <>
      <PlatformSidebar
        logo={
          <Link href={`/platform/${tenant}/home`} aria-label="Home">
            <Logo className="h-9 w-auto max-w-full object-contain" />
          </Link>
        }
        primaryAction={null}
        sections={sections}
        openSectionId={openSection}
        onOpenSectionChange={(id) => setOpenSection(id as SidebarOpenSection | null)}
        footer={{
          // SkillsAI has no User/Admin toggle, so the live-admin signal is
          // just the platform-admin flag. Notifications are shown to every
          // logged-in user (as before); the admin cluster is narrowed by
          // the SDK's per-item RBAC checks.
          isAdmin: isPlatformAdmin,
          isLiveAdmin: isPlatformAdmin,
          enableRbac: config.settings.enableRBAC(),
          rbacPermissions,
          tenantKey: tenant,
          currentTenant: {
            key: currentTenant?.key,
            // Feed the SDK's monetization gate SkillsAI's own eligibility
            // (`canMonetize` spans the user's tenants); the SDK still
            // applies the `#can_sell_items` RBAC check on top.
            enable_monetization: canMonetize(
              currentTenant as Tenant,
              (userTenants ?? []) as Tenant[],
            ),
          },
          notificationsAllowed: true,
          invitesUserTypeAllowed: true,
          onAction: handleFooterAction,
        }}
      />

      <PlatformAccountSheet
        tab={accountTab}
        onClose={() => setAccountTab(null)}
        tenantKey={tenant}
        username={username ?? ''}
        email={userEmail}
        onInviteClick={() => setInviteOpen(true)}
        mainPlatformKey={config.settings.mainPlatformKey()}
        authUrl={config.urls.auth()}
        currentSpa={config.settings.appName() || 'skills'}
        platformBaseDomain={config.settings.platformBaseDomain()}
      />

      {inviteOpen && (
        <InviteUserDialog
          tenant={tenant}
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          enableCatalogInvite
          hasManageUsersPermission
        />
      )}

      {/* Gradebook / Credentials / Skills — SDK list components hosted in a
          shared dialog shell. Height is PINNED (not max-h) so the chrome
          stays stable while the lists switch between loading skeletons,
          results, and pagination. */}
      <Dialog
        open={libraryDialog !== null}
        onOpenChange={(open) => !open && setLibraryDialog(null)}
      >
        <DialogContent className="mx-auto my-auto flex h-[85vh] w-[95vw] max-w-none flex-col gap-0 rounded-lg p-0 sm:max-w-7xl">
          <DialogHeader className="flex-shrink-0 border-b border-gray-200 p-4 pt-[30px]">
            <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {libraryDialog ? LIBRARY_DIALOGS[libraryDialog].title : ''}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-gray-600">
              {libraryDialog ? LIBRARY_DIALOGS[libraryDialog].description : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {libraryDialog &&
              LIBRARY_DIALOGS[libraryDialog].render({ org: tenant, username: username ?? '' })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
