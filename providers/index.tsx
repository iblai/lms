"use client";

import { useDispatch } from "react-redux";
// @ts-ignore
import { AccessCheckResponse, initializeDataLayer } from "@iblai/iblai-js/data-layer";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import {
  handleTenantSwitch,
  LocalStorageService,
  useCurrentTenant,
  useUserTenants,
} from "@/utils/localstorage";
import { AuthProvider, setAccessCheckResponse, TenantProvider } from "@iblai/iblai-js/web-utils";
import {
  getTenant,
  getUserName,
  hasNonExpiredAuthToken,
  redirectToAuthSpa,
} from "@/utils/helpers";
import { usePathname } from "next/navigation";
import { updateRbacPermissions } from "@/features/rbac";
export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { saveCurrentTenant } = useCurrentTenant();
  const { saveUserTenants } = useUserTenants();
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
          console.log("[auth-redirect] API returned 401 Unauthorized");
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
    if (typeof window.__ENV__ !== "undefined") {
      loadDataLayer();
    } else {
      const script = document.createElement("script");
      script.src = "/env.js";
      script.async = false;
      script.onload = () => loadDataLayer();
      script.onerror = () => loadDataLayer();
      document.head.appendChild(script);
    }
  }, []);

  const dispatch = useDispatch();

  if (!ready) return null;

  const middleware = new Map();
  /* 
  middleware.set(new RegExp("^(?!\/sso-login).*"), () => {
    return true;
  }); */

  middleware.set(new RegExp("^/sso-login"), async () => {
    return false;
  });
  // allow user to go to version page without auth
  middleware.set(new RegExp("^\/version"), async () => false);

  function onLoadPlatformpermissions(
    rbacPermissions: Record<string, unknown> | undefined,
  ) {
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
      username={getUserName() || ""}
      storageService={LocalStorageService.getInstance()}
      middleware={middleware}
      pathname={pathname}
    >
      <TenantProvider
        skip={isSsoLoginRoute || isVersionRoute}
        currentTenant={getTenant() || ""}
        requestedTenant={getTenant() || ""}
        saveCurrentTenant={saveCurrentTenant}
        saveUserTenants={saveUserTenants}
        handleTenantSwitch={handleTenantSwitch}
        username={getUserName() || ""}
        onAuthFailure={(reason) => {
          console.error("[TenantProvider] Auth failure:", reason);
          window.location.href = "/error/403";
        }}
        onLoadPlatformPermissions={onLoadPlatformpermissions}
      >
        {children}
      </TenantProvider>
    </AuthProvider>
  );
}
