'use client';

import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import type { AgentMode } from '@/hooks/courses/edx-iframe-context';
import type { CourseEdxData } from '@/types/courses';

/**
 * Agent modes in which the agent — not the edX unit — owns unit completion.
 * Assessment runs inside the same agent experience, so both modes qualify
 * today; a future mode can opt out by staying off this list.
 */
export const AGENT_COMPLETION_MODES: AgentMode[] = ['learning', 'assessment'];

export interface UseUnitAutoCompletionParams {
  /** Course settings from Studio (`enable_agent_based_completion`, `agent_content_mode`). */
  course?: CourseEdxData | null;
  /** Current course-content tab; the agent only owns completion on its own tab. */
  activeTab?: string;
  /** Learn/Assess switcher value. */
  agentMode?: AgentMode;
  /** Tenant to read metadata for. Defaults to the tenant in the URL. */
  tenant?: string;
}

export interface UnitAutoCompletion {
  /** True while the edX unit is still allowed to mark itself complete on view. */
  unitAutoCompletionEnabled: boolean;
  /** Inverse of the above — true when the agent decides completion instead. */
  unitAutoCompletionDisabled: boolean;
}

/**
 * Resolves whether edX should keep auto-completing units, or hand that decision
 * to the agent.
 *
 * Auto-completion is turned off only when every switch is on: the tenant
 * metadata flag `enable_agent_based_unit_completion`, the course flags
 * `enable_agent_based_completion` and `agent_content_mode`, and the learner
 * being in the agent experience (agent tab, in an agent-driven mode).
 */
export function useUnitAutoCompletion({
  course,
  activeTab,
  agentMode = 'learning',
  tenant,
}: UseUnitAutoCompletionParams): UnitAutoCompletion {
  const tenantFromUrl = useTenantParam();
  const { metadata } = useTenantMetadata({ org: tenant || tenantFromUrl });

  const inAgentExperience = activeTab === 'agent' && AGENT_COMPLETION_MODES.includes(agentMode);

  const unitAutoCompletionDisabled =
    inAgentExperience &&
    metadata?.enable_agent_based_unit_completion === true &&
    course?.enable_agent_based_completion === true &&
    course?.agent_content_mode === true;

  return {
    unitAutoCompletionEnabled: !unitAutoCompletionDisabled,
    unitAutoCompletionDisabled,
  };
}
