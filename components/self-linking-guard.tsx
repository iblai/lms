'use client';

import type React from 'react';
import { useEffect } from 'react';
// @ts-ignore
import { useGetPublicPlatformMembershipQuery } from '@iblai/iblai-js/data-layer';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { redirectToAuthSpa } from '@/utils/helpers';

/**
 * URL-level access gate for the public-capable routes (discover, course-about,
 * program-about). The root `Providers` middleware lets these routes through the
 * auth gate unconditionally, so the real check happens here:
 *
 * - Logged-in users always pass through.
 * - Anonymous users pass through only when the tenant has public registration /
 *   self-linking enabled (`allow_self_linking` from the public membership
 *   endpoint); otherwise they are redirected to the auth SPA.
 *
 * The children are rendered unconditionally (never gated behind a spinner) so
 * the server-rendered course/program/discover content reaches the initial HTML
 * — crawlers and the JS-less first pass see the real content. The anonymous
 * access decision is enforced on the client: once the public membership query
 * resolves, a disallowed anonymous visitor is redirected to the auth SPA. On a
 * public tenant this is a no-op; on a private one the content is briefly visible
 * before the redirect, which is acceptable — the content is public metadata,
 * already exposed via the page's Open Graph tags.
 */
export function SelfLinkingGuard({ children }: { children: React.ReactNode }) {
  const tenant = useTenantParam();
  const userIsLoggedIn = isLoggedIn();

  // Only the anonymous path needs the public membership config; skip the
  // request entirely for logged-in users (and while the tenant is unresolved).
  const { data, isLoading, isUninitialized } = useGetPublicPlatformMembershipQuery(
    { platform_key: tenant },
    { skip: userIsLoggedIn || !tenant },
  );

  const allowSelfLinking = Boolean(data?.allow_self_linking);
  const isResolving = !userIsLoggedIn && (isLoading || isUninitialized);
  const shouldRedirect = !userIsLoggedIn && !isResolving && !allowSelfLinking;

  useEffect(() => {
    if (shouldRedirect) {
      redirectToAuthSpa();
    }
  }, [shouldRedirect]);

  return <>{children}</>;
}
