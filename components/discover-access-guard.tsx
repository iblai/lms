'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { isDiscoverEnabled } from '@/utils/discover-visibility';

/**
 * Gates the Discover page itself. Redirects to a 403 when Discover is disabled —
 * either by the `hideDiscoverTab` config flag (which supersedes everything) or by
 * the tenant's `enable_discover_page` metadata being explicitly `false`.
 *
 * While the metadata is still loading the page is treated as enabled, so a valid
 * Discover page is never redirected before the tenant switch resolves. The config
 * flag, being synchronous, redirects immediately.
 */
export function DiscoverAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const tenant = useTenantParam();
  const { metadata, isLoading } = useTenantMetadata({ org: tenant });

  const hideDiscoverTab = config.settings.hideDiscoverTab();

  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab,
    enableDiscoverPage: metadata?.enable_discover_page,
  });

  useEffect(() => {
    if (!discoverEnabled) {
      router.replace(`/platform/${tenant}/error/403`);
    }
  }, [discoverEnabled, tenant]);

  // Show the spinner while redirecting, and while metadata is still loading (so a
  // disabled page never flashes before the tenant switch resolves).
  if (!discoverEnabled || (!hideDiscoverTab && isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
