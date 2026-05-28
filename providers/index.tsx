'use client';

import { useDispatch } from 'react-redux';
// @ts-ignore
import { AccessCheckResponse, initializeDataLayer } from '@iblai/iblai-js/data-layer';
import { useEffect, useState, useMemo } from 'react';
import { config } from '@/lib/config';
import {
  handleTenantSwitch,
  LocalStorageService,
  useCurrentTenant,
  useUserTenants,
} from '@/utils/localstorage';
import { AuthProvider, setAccessCheckResponse, TenantProvider } from '@iblai/iblai-js/web-utils';
import { getTenant, getUserName, hasNonExpiredAuthToken, redirectToAuthSpa } from '@/utils/helpers';
import { usePathname, useRouter } from 'next/navigation';
import { updateRbacPermissions } from '@/features/rbac';
import { selectRequestedTenant } from '@/features/tenant';
import { useAppSelector } from '@/lib/hooks';
import { Spinner } from '@/components/spinner';
export default function Providers({
  children,
  allowSelfLinking = false,
}: {
  children: React.ReactNode;
  // Resolved server-side in `app/layout.tsx` via `fetchPublicPlatformMembership`.
  // Gates the unauthenticated route patterns in the middleware map below.
  allowSelfLinking?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { saveCurrentTenant } = useCurrentTenant();
  const { saveUserTenants } = useUserTenants();
  const requestedTenant = useAppSelector(selectRequestedTenant);
  const isSsoLoginRoute = /^\/sso-login/.test(pathname);
  const isVersionRoute = /^\/version/.test(pathname);

  console.log('################### [Providers] isSsoLoginRoute', isSsoLoginRoute);
  console.log('################### [Providers] isVersionRoute', isVersionRoute);

  const loadDataLayer = () => {
    initializeDataLayer(
      config.urls.dm(),
      config.urls.lms(),
      config.urls.legacyLmsUrl(),
      LocalStorageService.getInstance(),
      {
        401: () => {
          console.log('[auth-redirect] API returned 401 Unauthorized');
          redirectToAuthSpa(undefined, undefined, true);
        },
        402: (error402Response) => {
          dispatch(setAccessCheckResponse(error402Response as unknown as AccessCheckResponse));
        },
      },
    );
    setReady(true);
  };

  useEffect(() => {
    if (typeof window.__ENV__ !== 'undefined') {
      loadDataLayer();
    } else {
      const script = document.createElement('script');
      script.src = '/env.js';
      script.async = false;
      script.onload = () => loadDataLayer();
      script.onerror = () => loadDataLayer();
      document.head.appendChild(script);
    }
  }, []);

  const dispatch = useDispatch();

  const middleware = useMemo(() => {
    const map = new Map();

    map.set(new RegExp('^/sso-login'), async () => false);

    map.set(new RegExp('^/sso-login-complete'), async () => false);

    // allow user to go to version page without auth
    map.set(new RegExp('^\/version'), async () => false);

    // Discover / course-about / program-about pages are only public when the
    // tenant has self-linking enabled. Otherwise they fall through to the
    // standard auth gate.
    if (allowSelfLinking) {
      map.set(new RegExp('^/platform/[^/]+/discover(/|$)'), async () => false);
      map.set(new RegExp('^/platform/[^/]+/courses/[^/]+/?$'), async () => false);
      map.set(new RegExp('^/platform/[^/]+/programs/[^/]+/?$'), async () => false);
    }

    return map;
  }, [allowSelfLinking]);

  const spinnerFallback = (
    <div className="flex h-dvh w-screen items-center justify-center">
      <div className="space-y-3">
        <Spinner className="h-14 w-14 text-amber-500" />
      </div>
    </div>
  );

  if (!ready) return null;

  function onLoadPlatformpermissions(rbacPermissions: Record<string, unknown> | undefined) {
    dispatch(updateRbacPermissions(rbacPermissions ?? {}));
  }

  return (
    <AuthProvider
      skip={isSsoLoginRoute || isVersionRoute}
      redirectToAuthSpa={(
        redirectTo = undefined,
        platformKey = undefined,
        logout = false,
        saveRedirect = true,
      ) => redirectToAuthSpa(redirectTo, platformKey, logout, saveRedirect)}
      hasNonExpiredAuthToken={hasNonExpiredAuthToken}
      username={getUserName() || ''}
      storageService={LocalStorageService.getInstance()}
      middleware={middleware}
      pathname={pathname}
    >
      <TenantProvider
        skip={isSsoLoginRoute || isVersionRoute}
        currentTenant={getTenant() || ''}
        requestedTenant={requestedTenant}
        saveCurrentTenant={saveCurrentTenant}
        saveUserTenants={saveUserTenants}
        handleTenantSwitch={(tenant, saveRedirect) => handleTenantSwitch(tenant, saveRedirect)}
        username={getUserName() || ''}
        onAuthFailure={(reason) => {
          console.error('[TenantProvider] Auth failure:', reason);
          router.push(`/platform/${getTenant()}/error/403`);
        }}
        onLoadPlatformPermissions={onLoadPlatformpermissions}
        fallback={spinnerFallback}
      >
        {children}
      </TenantProvider>
    </AuthProvider>
  );
}
