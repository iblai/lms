import { hasOnboardingContent, readUserOnboardingForm } from '@iblai/iblai-js/web-containers';

import { ONBOARDING_ADMIN_FLOW, ONBOARDING_USER_FLOW } from '@/constants/global';

/** Which onboarding the `/onboarding` route runs. */
export type OnboardingFlow = 'user' | 'admin';

/**
 * Whether the tenant has a member onboarding worth showing: switched on, and
 * with something in it (an agent, or questions on an older form).
 */
export function hasUserOnboarding(metadata: Record<string, unknown> | undefined): boolean {
  const form = readUserOnboardingForm(metadata);
  return form.enabled && hasOnboardingContent(form);
}

/**
 * Resolve which flow to run, shared by the page (which renders it) and the
 * navbar (whose switch sets it), so the two can never disagree.
 *
 * Members always get the member flow. Admins get it too by default — it is
 * what their platform actually shows people — and only fall back to the
 * first-run setup flow when the tenant has configured no member onboarding.
 * Either way the navbar switch overrides, through the `flow` query param.
 */
export function resolveOnboardingFlow({
  isAdmin,
  flowParam,
  metadata,
}: {
  isAdmin: boolean;
  /** The `flow` query param, when the admin has picked a side. */
  flowParam?: string | null;
  metadata: Record<string, unknown> | undefined;
}): OnboardingFlow {
  if (!isAdmin) return ONBOARDING_USER_FLOW;
  if (flowParam === ONBOARDING_ADMIN_FLOW) return ONBOARDING_ADMIN_FLOW;
  if (flowParam === ONBOARDING_USER_FLOW) return ONBOARDING_USER_FLOW;
  return hasUserOnboarding(metadata) ? ONBOARDING_USER_FLOW : ONBOARDING_ADMIN_FLOW;
}
