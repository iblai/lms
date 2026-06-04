'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Spinner } from '@/components/spinner';
import { getTenant, redirectToAuthSpa } from '@/utils/helpers';

/**
 * Backward-compatibility redirect for the legacy non-tenant-scoped routes.
 * Every page under `app/platform/[tenant]/...` is also reachable without the
 * `/platform/<tenant>` prefix. This stub resolves the stored tenant and
 * forwards the visitor to the canonical tenant-scoped URL, preserving the
 * sub-path, query string, and hash. Falls back to the auth SPA when no tenant
 * is known (e.g. an anonymous visitor on a fresh device).
 */
export function TenantRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const tenant = getTenant();
    if (!tenant) {
      redirectToAuthSpa();
      return;
    }
    // The legacy pathname is exactly the tenant-scoped path minus the
    // `/platform/<tenant>` prefix, so the canonical URL is simply the prefix
    // plus the current path. `search`/`hash` are read from `window` (effect is
    // client-only) to keep flows like `?trigger_cta=1` intact.
    const suffix = pathname === '/' ? '' : pathname;
    const { search, hash } = window.location;
    const target = `/platform/${tenant}${suffix}${search}${hash}`;
    try {
      router.replace(target);
    } catch (error) {
      // If the client-side navigation fails for any reason, fall back to a
      // hard navigation so the visitor still reaches the canonical URL.
      console.error('[TenantRedirect] router.replace failed:', error);
      window.location.replace(target);
    }
  }, [router, pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-14 w-14 text-[var(--primary)]" />
    </div>
  );
}
