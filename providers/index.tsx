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
  isLoggedIn,
  setAccessCheckResponse,
  TenantProvider,
  useCurrentTenant,
} from '@iblai/iblai-js/web-utils';
import { getTenant, getUserName, redirectToAuthSpa } from '@/utils/helpers';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { updateRbacPermissions } from '@/features/rbac';
import { Spinner } from '@/components/spinner';

declare global {
  interface Window {
    localStorage: Storage;
  }
}

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
  const [tenant, setTenant] = useState('');
  useEffect(() => {
    setTenant(getTenant());
  }, []);
  console.log('[PATHNAME UPDATE]: ', { pathname });
  const router = useRouter();
  const { tenant: requestedTenant } = useParams<{ tenant: string }>();
  const [ready, setReady] = useState(false);
  const { saveCurrentTenant } = useCurrentTenant();
  const { saveUserTenants } = useUserTenants();
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const isSsoLoginRoute = /^\/sso-login/.test(pathname);
  const isVersionRoute = /^\/version/.test(pathname);

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

  useEffect(() => {
    setUserIsLoggedIn(isLoggedIn());
  }, []);

  const middleware = useMemo(() => {
    const map = new Map();

    map.set(new RegExp('^/sso-login'), async () => false);

    map.set(new RegExp('^/sso-login-complete'), async () => false);

    // allow user to go to version page without auth
    map.set(new RegExp('^\/version'), async () => false);

    // Discover / course-about / program-about pages are only public when the
    // tenant has self-linking enabled. Otherwise they fall through to the
    // standard auth gate.

    console.log('[ALLOW SELF LINKING]: ', allowSelfLinking);
    console.log('[USER IS LOGGED IN]: ', userIsLoggedIn);

    if (allowSelfLinking && !userIsLoggedIn) {
      map.set(new RegExp('^/platform/[^/]+/discover(/|$)'), async () => false);
      map.set(new RegExp('^/platform/[^/]+/courses/[^/]+/?$'), async () => false);
      map.set(new RegExp('^/platform/[^/]+/programs/[^/]+/?$'), async () => false);
    }

    return map;
  }, [allowSelfLinking, userIsLoggedIn]);

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
      username={getUserName() || ''}
      storageService={LocalStorageService.getInstance()}
      middleware={middleware}
      pathname={pathname}
    >
      <TenantProvider
        skip={isSsoLoginRoute || isVersionRoute}
        currentTenant={tenant || ''}
        requestedTenant={requestedTenant || ''}
        saveCurrentTenant={(currentTenant) => {
          saveCurrentTenant(currentTenant);
          console.log('[SAVING USER TOKENS]', currentTenant);
        }}
        saveUserTenants={saveUserTenants}
        saveUserTokens={(tokens) => {
          saveUserTokens(tokens as TokenResponse);
        }}
        handleTenantSwitch={(tenant, saveRedirect) => handleTenantSwitch(tenant, saveRedirect)}
        username={getUserName() || ''}
        onAuthFailure={(reason) => {
          console.error('[TenantProvider] Auth failure:', reason);
          router.push(`/platform/${tenant}/error/403`);
        }}
        onLoadPlatformPermissions={onLoadPlatformpermissions}
        fallback={spinnerFallback}
      >
        {children}
      </TenantProvider>
    </AuthProvider>
  );
}
