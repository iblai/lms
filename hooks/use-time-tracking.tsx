'use client';

import { useCallback } from 'react';
import { TimeTrackingProvider } from '@iblai/iblai-js/web-containers';
import { getTenant } from '@/utils/helpers';

/**
 * Skills time tracking = the shared SDK `TimeTrackingProvider`
 * (`@iblai/iblai-js/web-containers`), wired for Next's App Router and given the
 * skills-specific course/unit context:
 *
 *   - `course_id` — the edX course key, when on a course route
 *     (`/platform/{tenant}/courses/{id}` or `…/course-content/{id}/…`).
 *   - `block_id`  — the active unit's vertical block id, from the `?unit_id=`
 *     search param the course player writes on navigation.
 *
 * The provider's `getCourseId`/`getBlockId` receive the URL the time was spent
 * on (which differs from `window.location` on a route-change flush), so time is
 * attributed to the correct course/unit as the learner navigates. The mutation
 * itself is the SDK's `useTimeTrackingMutation`, whose middleware is already
 * registered in the store via `skillsMiddleware`/`skillsReducer`.
 */

const COURSE_ID_RE = /^\/(?:platform\/[^/]+\/)?(?:courses|course-content)\/([^/?#]+)/;

/** Extract the edX course key from a tracked URL (relative path + search). */
function parseCourseId(url: string): string | undefined {
  const pathname = url.split(/[?#]/, 1)[0];
  const match = pathname.match(COURSE_ID_RE);
  if (!match) return undefined;
  try {
    // Course keys use `+` separators (course-v1:org+course+run); a decoded
    // path can surface them as spaces, so normalise back to `+`.
    return decodeURIComponent(match[1]).replace(/ /g, '+');
  } catch {
    return match[1];
  }
}

/** Extract the active unit (vertical) block id from a tracked URL's query. */
function parseUnitId(url: string): string | undefined {
  const match = url.match(/[?&]unit_id=([^&]*)/);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

interface SkillsTimeTrackingProviderProps {
  intervalSeconds?: number;
  enabled?: boolean;
}

/**
 * Mount once, high in the tree (under the Redux store + tenant context), to
 * track time across the whole app. Renders nothing.
 */
export function SkillsTimeTrackingProvider({
  intervalSeconds = 30,
  enabled = true,
}: SkillsTimeTrackingProviderProps = {}) {
  // These callbacks are only ever invoked client-side (inside the SDK's
  // TimeTracker effect), so they can touch `window` directly.
  const getCurrentUrl = useCallback(() => window.location.pathname + window.location.search, []);

  // App Router does soft pushes without popstate, so detect SPA navigations by
  // polling the URL; also flush on popstate and before unload. The SDK's
  // TimeTracker uses this to bank time against the previous URL on each change.
  const onRouteChange = useCallback((callback: () => void) => {
    let previousUrl = window.location.pathname + window.location.search;
    const check = () => {
      const current = window.location.pathname + window.location.search;
      if (current !== previousUrl) {
        callback();
        previousUrl = current;
      }
    };

    const interval = setInterval(check, 500);
    const onPopState = () => setTimeout(check, 10);
    const onBeforeUnload = () => callback();

    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return (
    <TimeTrackingProvider
      intervalSeconds={intervalSeconds}
      enabled={enabled}
      getTenantKey={() => getTenant()}
      getCourseId={parseCourseId}
      getBlockId={parseUnitId}
      getCurrentUrl={getCurrentUrl}
      onRouteChange={onRouteChange}
    />
  );
}
