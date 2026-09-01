'use client';

import { OnboardingFlowPage } from './onboarding-flow-page';

/**
 * The platform's onboarding entry point with no agent named — a member arriving
 * here meets the first agent the tenant configured.
 *
 * `/platform/[tenant]/onboarding/[agentId]` is the same screen aimed at one
 * specific agent; both render {@link OnboardingFlowPage}.
 */
export default function OnboardingPage() {
  return <OnboardingFlowPage />;
}
