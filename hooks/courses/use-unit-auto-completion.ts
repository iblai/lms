'use client';

import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import type { CourseEdxData } from '@/types/courses';

export interface UseUnitAutoCompletionParams {
  /** Course settings from Studio (`enable_agent_based_completion`, `agent_content_mode`). */
  course?: CourseEdxData | null;
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
 * Auto-completion is turned off whenever the tenant metadata flag
 * `enable_agent_based_unit_completion` and the course flags
 * `enable_agent_based_completion` and `agent_content_mode` are all on. Where the
 * learner is — agent tab or course tab, learning or assessment mode — makes no
 * difference: once the course runs on agent-based completion, the agent owns it
 * everywhere.
 */
export function useUnitAutoCompletion({
  course,
  tenant,
}: UseUnitAutoCompletionParams): UnitAutoCompletion {
  const tenantFromUrl = useTenantParam();
  const { metadata } = useTenantMetadata({ org: tenant || tenantFromUrl });

  const unitAutoCompletionDisabled =
    metadata?.enable_agent_based_unit_completion === true &&
    course?.enable_agent_based_completion === true &&
    course?.agent_content_mode === true;

  return {
    unitAutoCompletionEnabled: !unitAutoCompletionDisabled,
    unitAutoCompletionDisabled,
  };
}
