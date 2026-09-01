'use client';

import { useParams } from 'next/navigation';

import { OnboardingFlowPage } from '../onboarding-flow-page';

/**
 * Onboarding aimed at one of the tenant's configured agents — the route behind
 * the link an admin copies out of the admin panel's Onboarding tab
 * (`<origin>/platform/<tenant>/onboarding/<agent-id>`), so a tenant can point
 * different audiences at different onboardings.
 *
 * An id naming no configured agent is left to the SDK wizard, which says so
 * rather than falling back to another audience's agent.
 */
export default function OnboardingAgentPage() {
  const params = useParams<{ agentId: string }>();
  // Next gives a repeated segment as an array; the route declares one.
  const agentId = Array.isArray(params?.agentId) ? params.agentId[0] : params?.agentId;

  return <OnboardingFlowPage agentId={agentId ? decodeURIComponent(agentId) : undefined} />;
}
