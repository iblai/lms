'use client';

import React, { useMemo } from 'react';
import {
  AgentSettingsLauncherProvider,
  type AgentSettingsTarget,
} from '@iblai/iblai-js/web-containers';

import { config } from '@/lib/config';
import { useCurrentTenant, useIsAdmin } from '@/utils/localstorage';

/**
 * Tells the SDK how an agent's settings open here, so agent names on
 * Analytics → Transcripts and on the profile's History tab become links —
 * the same wiring the mentor app has.
 *
 * This app has no Edit Agent dialog of its own, so the link opens the mentor
 * app's dialog in a new tab: `/platform/{tenant}/{agentId}` with the mentor
 * app's URL modal stack preselecting that agent's settings (`edit_mentor` is
 * the modal name and `mentorId` the stack-entry key the mentor app reads).
 *
 * Gated on the tenant admin flag; without a provider (or when the check says
 * no) the SDK renders the names as plain text, which is what non-admins see.
 * Reads only localStorage-backed hooks, so it is safe on the routes where
 * the SDK providers run with `skip` (`/sso-login*`, `/version`, `/error`).
 */
export function AgentSettingsLauncher({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin();
  const { currentTenant } = useCurrentTenant();
  const tenantKey = currentTenant?.key ?? '';

  const value = useMemo(
    () => ({
      openAgentSettings: (agent: AgentSettingsTarget) => {
        const modalStack = JSON.stringify([
          { name: 'edit_mentor', tab: 'settings', mentorId: agent.uniqueId },
        ]);
        window.open(
          `${config.urls.mentor()}/platform/${tenantKey}/${agent.uniqueId}?modal=${encodeURIComponent(modalStack)}`,
          '_blank',
          'noopener,noreferrer',
        );
      },
      canOpenAgentSettings: () => isAdmin && !!tenantKey,
    }),
    [isAdmin, tenantKey],
  );

  return <AgentSettingsLauncherProvider value={value}>{children}</AgentSettingsLauncherProvider>;
}
