import type { StepTarget } from 'react-joyride';

/**
 * DOM hooks for the product tour.
 *
 * Only the profile wrapper and the Discover row are host-owned, so they carry
 * a `data-tour` attribute. The search box and the sidebar footer cluster are
 * rendered by the `@iblai/iblai-js` shells, which expose no data-* passthrough,
 * so those two are located structurally (see `PlatformNavbarSearch` and
 * `PlatformSidebarFooter` in the SDK).
 */
export const TOUR_TARGET = {
  profile: 'profile',
  discover: 'discover',
} as const;

export type TourTargetId = (typeof TOUR_TARGET)[keyof typeof TOUR_TARGET];

export const tourSelector = (id: TourTargetId): string => `[data-tour="${id}"]`;

/** The SDK navbar search form (`<form role="search">` inside the banner). */
export const SEARCH_TARGET_SELECTOR = 'header form[role="search"]';

/**
 * The SDK sidebar footer cluster (Notifications / Invites / Management /
 * Integrations / Monetization / Advanced / Support): the `border-t` block
 * that closes the sidebar's `<aside>`, in both the expanded sidebar and the
 * collapsed icon rail.
 */
export function findSidebarFooter(root: ParentNode = document): HTMLElement | null {
  const aside = root.querySelector<HTMLElement>('[data-slot="sidebar"] aside[data-state]');
  const footer = aside?.lastElementChild ?? null;
  if (!(footer instanceof HTMLElement) || !footer.classList.contains('border-t')) {
    return null;
  }
  return footer;
}

/** Resolve a joyride step target (selector, element, ref, or getter) to an element. */
export function resolveTourTarget(target: StepTarget): HTMLElement | null {
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target);
  }
  if (typeof target === 'function') {
    return target();
  }
  if (target instanceof HTMLElement) {
    return target;
  }
  return target.current;
}

/**
 * Whether a step target is mounted and laid out (not `display: none`), so a
 * step can be shown for it. Mirrors the check react-joyride applies before
 * it gives up on a step, but ahead of time so the step count is accurate.
 */
export function isTourTargetVisible(target: StepTarget): boolean {
  const element = resolveTourTarget(target);
  return !!element && element.getClientRects().length > 0;
}
