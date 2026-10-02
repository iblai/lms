'use client';

import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSidebar } from '@iblai/iblai-js/web-containers/next';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

import { config } from '@/lib/config';
import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { WATCHER_RBAC_RESOURCE } from '@/utils/course-content-mode';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { getUserName } from '@/utils/helpers';

import { buildTourSteps, filterVisibleTourSteps, type TourStep } from './tour-steps';
import { useTourCompletion, type TourOutcome } from './use-tour-completion';

// react-joyride only loads when a tour is actually going to run.
const TourRunner = dynamic(() => import('./tour-runner').then((m) => m.TourRunner), {
  ssr: false,
  loading: () => null,
});

/** `?tour=1` replays the tour even after it was completed (support, QA, e2e). */
export const TOUR_QUERY_PARAM = 'tour';

/** Grace period for the shell (navbar, sidebar) to mount before targets are resolved. */
export const TOUR_START_DELAY_MS = 1000;
export const TOUR_START_RETRY_MS = 500;
export const TOUR_START_MAX_ATTEMPTS = 10;

// Flows that own the screen: the onboarding wizard, the immersive course
// view (which has its own one-time hint), and the pre-onboarding start page.
const EXCLUDED_PATHS = [/\/onboarding(\/|$)/, /\/course-content\//, /\/start\/?$/];

export function isTourExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  const path = pathname.split('?')[0] ?? '';
  return EXCLUDED_PATHS.some((pattern) => pattern.test(path));
}

type TourSession = 'idle' | 'running' | 'done';

/**
 * First-visit product tour over the app chrome: profile menu, search box,
 * the sidebar's Discover row and, for admins and watchers, the account /
 * management tools. Runs once per user (per browser), on tablet and desktop
 * only — the search box and the sidebar rail are hidden on mobile.
 *
 * Mounted inside the SDK `SidebarProvider` (see `AppLayout`) so it can read
 * the sidebar's own mobile state.
 */
export function ProductTour() {
  const tenant = useTenantParam();
  const username = getUserName();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();
  const { metadata, metadataLoaded } = useTenantMetadata({ org: tenant });
  const { data: departmentMemberCheck, isLoading: isRoleLoading } =
    useGetDepartmentMemberCheckQuery({ platform_key: tenant }, { skip: !tenant });
  const rbacPermissions = useAppSelector(selectRbacPermissions);
  const { completed, markCompleted } = useTourCompletion(username);

  const [session, setSession] = useState<TourSession>('idle');
  const [steps, setSteps] = useState<TourStep[]>([]);

  const isAdmin = departmentMemberCheck?.is_platform_admin === true;
  const isWatcher = checkRbacPermission(rbacPermissions, WATCHER_RBAC_RESOURCE);
  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });
  const forced = searchParams?.get(TOUR_QUERY_PARAM) === '1';

  const eligible =
    session === 'idle' &&
    metadataLoaded &&
    !isRoleLoading &&
    !isMobile &&
    !isTourExcludedPath(pathname) &&
    (forced || !completed);

  // Start once the targets are on the page. The role and Discover gates are
  // settled by then (`eligible`), so the step list is built once and frozen
  // for the run.
  useEffect(() => {
    if (!eligible) return;

    let attempts = 0;
    let timer: number;

    const tryStart = () => {
      const visibleSteps = filterVisibleTourSteps(
        buildTourSteps({ viewer: { isAdmin, isWatcher }, discoverEnabled }),
      );
      if (visibleSteps.length > 0) {
        setSteps(visibleSteps);
        setSession('running');
        return;
      }
      attempts += 1;
      if (attempts < TOUR_START_MAX_ATTEMPTS) {
        timer = window.setTimeout(tryStart, TOUR_START_RETRY_MS);
      }
    };

    timer = window.setTimeout(tryStart, TOUR_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [eligible, isAdmin, isWatcher, discoverEnabled]);

  const handleEnd = useCallback(
    (outcome: TourOutcome) => {
      markCompleted(outcome);
      setSession('done');
    },
    [markCompleted],
  );

  if (session !== 'running') return null;

  return <TourRunner steps={steps} run onEnd={handleEnd} />;
}
