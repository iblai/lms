'use client';

import { useDispatch } from 'react-redux';
// @ts-ignore
import {
  AccessCheckResponse,
  initializeDataLayer,
  TokenResponse,
} from '@iblai/iblai-js/data-layer';
import { useEffect, useState, useMemo } from 'react';
import { config } from '@/lib/config';
import {
  handleTenantSwitch,
  LocalStorageService,
  saveUserTokens,
  useUserTenants,
} from '@/utils/localstorage';
import {
  AuthProvider,
  setAccessCheckResponse,
  TenantProvider,
  useCurrentTenant,
} from '@iblai/iblai-js/web-utils';
import { getErrorPageUrl, getTenant, getUserName, redirectToAuthSpa } from '@/utils/helpers';
import { useParams, usePathname } from 'next/navigation';
import { updateRbacPermissions } from '@/features/rbac';
import { Spinner } from '@/components/spinner';
import { SkillsTimeTrackingProvider } from '@/hooks/use-time-tracking';
import { SentryInit } from '@/components/sentry-init';

declare global {
  interface Window {
    localStorage: Storage;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tenant, setTenant] = useState('');
  useEffect(() => {
    setTenant(getTenant());
  }, []);
  const { tenant: routeTenant } = useParams<{ tenant: string }>();
  // A URL that matches no route (e.g. `/platform/kaplan/<typo>`) is rendered by
  // `not-found.tsx` with no dynamic segment matched, so `useParams()` carries no
  // `tenant`. Read it off the pathname in that case, otherwise the guard below
  // blanks the page out instead of showing the 404.
  const requestedTenant = routeTenant || pathname.match(/^\/platform\/([^/]+)/)?.[1] || '';
  const [ready, setReady] = useState(false);
  const { saveCurrentTenant } = useCurrentTenant();
  const { saveUserTenants } = useUserTenants();
  const isSsoLoginRoute = /^\/sso-login/.test(pathname);
  const isVersionRoute = /^\/version/.test(pathname);
  // The error page is where a failed auth check or an unresolvable tenant
  // lands, so it must render without the providers whose failure sent the user
  // there — otherwise the same failure fires again and bounces them off it.
  const isErrorRoute = /^\/error(\/|$)/.test(pathname);

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
      config.urls.studioUrl(),
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
      script.onerror = () => {
        // Without env.js every runtime-configured URL silently falls back to a
        // build-time default, so this is worth reporting even though the app
        // continues to boot.
        console.error('Failed to load /env.js; falling back to build-time config');
        loadDataLayer();
      };
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

    // Error pages must render for everyone: they are where a failed auth or a
    // tenant mismatch lands, so gating them behind the auth check would bounce
    // the visitor straight back to the auth SPA instead of showing the reason.
    map.set(new RegExp('^/error(/|$)'), async () => false);

    // Discover / course-about / program-about let everyone past the root auth
    // gate. The actual anonymous-access decision (does the tenant allow
    // self-linking?) is made at the URL-route level via `SelfLinkingGuard`,
    // so these never need the server-resolved flag here. Both the canonical
    // tenant-scoped paths and their legacy non-prefixed aliases (which redirect
    // to the canonical URL) are allowed through.
    map.set(new RegExp('^/discover(/|$)'), async () => false);
    map.set(new RegExp('^/courses/[^/]+/?$'), async () => false);
    map.set(new RegExp('^/programs/[^/]+/?$'), async () => false);

    map.set(new RegExp('^/platform/[^/]+/discover(/|$)'), async () => false);
    map.set(new RegExp('^/platform/[^/]+/courses/[^/]+/?$'), async () => false);
    map.set(new RegExp('^/platform/[^/]+/programs/[^/]+/?$'), async () => false);

    return map;
  }, []);

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

  if (!requestedTenant && window.location.pathname.startsWith('/platform/')) return null;

  return (
    <>
      {/* Mounted past the `ready` gate so `/env.js` — the source of the runtime
          Sentry DSN — has already been loaded by the effect above. */}
      <SentryInit />
      <AuthProvider
        skip={isSsoLoginRoute || isVersionRoute || isErrorRoute}
        redirectToAuthSpa={(
          redirectTo = undefined,
          platformKey = undefined,
          logout = false,
          saveRedirect = true,
        ) => redirectToAuthSpa(redirectTo, platformKey, logout, saveRedirect)}
        username={getUserName() || ''}
        storageService={LocalStorageService.getInstance()}
        middleware={middleware}
        pathname={pathname}
      >
        <TenantProvider
          skip={isSsoLoginRoute || isVersionRoute || isErrorRoute}
          currentTenant={tenant || ''}
          requestedTenant={requestedTenant || ''}
          saveCurrentTenant={(currentTenant) => {
            saveCurrentTenant(currentTenant);
          }}
          saveUserTenants={saveUserTenants}
          saveUserTokens={(tokens) => {
            saveUserTokens(tokens as TokenResponse);
          }}
          handleTenantSwitch={(tenant, saveRedirect) => handleTenantSwitch(tenant, saveRedirect)}
          username={getUserName() || ''}
          onAuthFailure={(reason) => {
            console.error('[TenantProvider] Auth failure:', reason);
            window.location.href = getErrorPageUrl(409, tenant);
          }}
          onLoadPlatformPermissions={onLoadPlatformpermissions}
          fallback={spinnerFallback}
          onTenantMismatch={() => {
            window.location.href = getErrorPageUrl(409, tenant);
          }}
        >
          <SkillsTimeTrackingProvider />
          {children}
        </TenantProvider>
      </AuthProvider>
    </>
  );
}
