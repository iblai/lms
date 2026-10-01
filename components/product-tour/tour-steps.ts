import type { Step } from 'react-joyride';

import {
  findSidebarFooter,
  isTourTargetVisible,
  SEARCH_TARGET_SELECTOR,
  TOUR_TARGET,
  tourSelector,
} from './tour-targets';

export type TourStepId = 'profile' | 'search' | 'discover' | 'account';

export type TourStep = Step & { id: TourStepId };

export type TourViewer = {
  /** Platform admin (from the department-member check). */
  isAdmin: boolean;
  /** Holds the watcher RBAC resource (`/watchedgroups/#list`). */
  isWatcher: boolean;
};

export type BuildTourStepsOptions = {
  viewer: TourViewer;
  /** Same gate the navbar search box and the sidebar Discover row use. */
  discoverEnabled: boolean;
};

const ADMIN_ACCOUNT_COPY = {
  title: 'Manage your organization',
  content:
    'Invite people, manage members and groups, connect integrations, and change advanced settings from the tools at the bottom of the sidebar.',
};

const WATCHER_ACCOUNT_COPY = {
  title: 'Management',
  content: 'Keep up with the groups you watch from Management, at the bottom of the sidebar.',
};

/**
 * The tour, top of the page first: the header's profile menu and search box,
 * then the sidebar's Discover row and (for admins and watchers) the account /
 * management tools in the sidebar footer.
 */
export function buildTourSteps({ viewer, discoverEnabled }: BuildTourStepsOptions): TourStep[] {
  const steps: TourStep[] = [
    {
      id: 'profile',
      target: tourSelector(TOUR_TARGET.profile),
      placement: 'bottom-end',
      title: 'Your profile',
      content: 'Open your profile, switch between organizations, or log out from this menu.',
    },
  ];

  if (discoverEnabled) {
    steps.push(
      {
        id: 'search',
        target: SEARCH_TARGET_SELECTOR,
        placement: 'bottom',
        title: 'Search',
        content:
          'Looking for something specific? Search courses, programs, and pathways by keyword. Results open on the Discover page.',
      },
      {
        id: 'discover',
        target: tourSelector(TOUR_TARGET.discover),
        placement: 'right',
        // The sidebar rail is position: fixed.
        isFixed: true,
        title: 'Discover',
        content: 'Browse the full catalog of courses, programs, and pathways available to you.',
      },
    );
  }

  if (viewer.isAdmin || viewer.isWatcher) {
    steps.push({
      id: 'account',
      target: () => findSidebarFooter(),
      placement: 'right-end',
      isFixed: true,
      ...(viewer.isAdmin ? ADMIN_ACCOUNT_COPY : WATCHER_ACCOUNT_COPY),
    });
  }

  return steps;
}

/** Drop steps whose target isn't on the page, so "n of N" counts only real steps. */
export function filterVisibleTourSteps(steps: TourStep[]): TourStep[] {
  return steps.filter((step) => isTourTargetVisible(step.target));
}
