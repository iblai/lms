'use client';

import { useEffect, useRef, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
// @ts-ignore
import { useLazyGetMentorsQuery } from '@iblai/iblai-js/data-layer';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getUserName } from '@/utils/helpers';

interface UseDefaultMentorOptions {
  /** Tenant/platform key the mentor is resolved for. */
  tenant: string;
  /** Pin a specific mentor (e.g. the mentor attached to a course); wins outright. */
  courseMentor?: string | null;
  /** Skip resolution entirely and clear the mentor (e.g. the chat sidebar is hidden). */
  skip?: boolean;
  /** Called when no mentor could be resolved, so hosts can toast or close their UI. */
  onError?: () => void;
}

interface UseDefaultMentorResult {
  /** `unique_id` of the mentor to embed, or null while unresolved/unavailable. */
  mentor: string | null;
  /** True while the tenant metadata or the mentor lookups are in flight. */
  isLoading: boolean;
  /** Whether the tenant metadata has settled. */
  metadataLoaded: boolean;
}

/**
 * Resolve the agent (mentor) to embed for the current tenant, in priority order:
 *
 *   1. an explicitly pinned `courseMentor`
 *   2. the tenant's embedded mentor from platform metadata
 *   3. the user's most recently accessed mentors (default-flagged one first)
 *   4. the tenant's featured mentors (default-flagged one first)
 *
 * Extracted from `ChatButton` so the onboarding wizard's final step embeds the
 * same agent the chat launcher would open.
 */
export function useDefaultMentor({
  tenant,
  courseMentor = null,
  skip = false,
  onError,
}: UseDefaultMentorOptions): UseDefaultMentorResult {
  const { getEmbeddedMentorToUse, metadataLoaded } = useTenantMetadata({ org: tenant });
  const [getMentors, { isLoading, isFetching }] = useLazyGetMentorsQuery();
  const [mentor, setMentor] = useState<string | null>(null);

  // Held in a ref so an inline callback does not re-trigger resolution.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (skip) {
      setMentor(null);
      return;
    }

    // Step 1 - use course mentor if set
    if (courseMentor) {
      setMentor(courseMentor);
      return;
    }
    if (!metadataLoaded) return;

    // Step 2 - use embedded mentor if set
    const embeddedMentor = getEmbeddedMentorToUse();
    if (embeddedMentor) {
      setMentor(embeddedMentor?.unique_id);
      return;
    }

    // Resolve a mentor unique_id from a result list (default mentor first).
    const resolveMentor = (results: any[]) =>
      (results.find((item: any) => item?.metadata?.default) || results[0])?.unique_id || null;

    let cancelled = false;

    const fetchMentors = async () => {
      try {
        // Step 3 - fetch recently accessed mentors first
        const recent = await getMentors({
          org: tenant,
          username: getUserName(),
          orderBy: 'recently_accessed_at',
          limit: 10,
        }).unwrap();

        let resolved = isEmpty(recent?.results) ? null : resolveMentor(recent.results);

        // Step 4 - fall back to featured mentors when none are recently accessed
        if (!resolved) {
          const featured = await getMentors({
            org: tenant,
            username: getUserName(),
            featured: true,
            limit: 10,
          }).unwrap();
          resolved = isEmpty(featured?.results) ? null : resolveMentor(featured.results);
        }

        if (!resolved) {
          throw new Error('No mentors found');
        }
        if (!cancelled) setMentor(resolved);
      } catch (error) {
        console.error('Failed to resolve a default mentor:', error);
        if (cancelled) return;
        setMentor(null);
        onErrorRef.current?.();
      }
    };

    fetchMentors();

    // A newer resolution supersedes this one — drop its late result.
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, metadataLoaded, courseMentor, skip]);

  return { mentor, isLoading: isLoading || isFetching || !metadataLoaded, metadataLoaded };
}
