'use client';

import { useGetUserProfileSummaryQuery } from '@iblai/iblai-js/data-layer';
import { getTenant } from '@/utils/helpers';

/**
 * Resolves what to call a user in staff-facing lists: their profile name,
 * else their email, never the raw username. `fallback` covers the fetch
 * (and any user the profile API doesn't know) — pass whatever the calling
 * API already gave you (full name, email) so the cell never flashes empty.
 */
export function useUserDisplayName(username: string | undefined, fallback?: string): string {
  const { data } = useGetUserProfileSummaryQuery(
    { username, platformKey: getTenant() },
    { skip: !username },
  );
  // Accounts created without a name get their username copied into it.
  const name = data?.name?.trim();
  const realName = name && name !== username ? name : '';
  return realName || data?.email || fallback || username || '';
}
