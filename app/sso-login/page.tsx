'use client';

import React, { Suspense } from 'react';
// import { SsoLogin as SsoLoginComponent } from '@iblai/iblai-js/web-containers/next';
import { LOCAL_STORAGE_KEYS } from '@iblai/iblai-js/web-utils';
import { useSearchParams } from 'next/navigation';

interface SsoLoginProps {
  /**
   * Local storage keys for authentication data
   */
  localStorageKeys: {
    CURRENT_TENANT: string;
    USER_DATA: string;
    TENANTS: string;
    AXD_TOKEN?: string;
    AXD_TOKEN_EXPIRES?: string;
    DM_TOKEN?: string;
    DM_TOKEN_EXPIRES?: string;
    EDX_TOKEN_KEY?: string;
  };
  /**
   * Local storage key for redirect path
   */
  redirectPathKey?: string;
  /**
   * Default redirect path if none is found
   */
  defaultRedirectPath?: string;
  /**
   * Optional callback after successful login
   */
  onLoginSuccess?: (data: Record<string, string>) => void;
  /**
   * Optional callback to resolve the redirect path after login.
   * Receives the current redirectPath and parsed auth data.
   * Should return the final redirect path.
   */
  resolveRedirectPath?: (redirectPath: string, data: Record<string, string>) => string;
}

/**
 * Get the base domain for cookie sharing
 */
const getBaseDomain = (): string => {
  const hostname = window.location.hostname;

  // For localhost or IP addresses, use as-is
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname;
  }

  // Split the hostname into parts
  const parts = hostname.split('.');

  // If it's already a base domain (e.g., iblai.app), return as-is
  if (parts.length === 2) {
    return hostname;
  }

  // If it's a subdomain (e.g., mentor.iblai.app), return base domain with leading dot
  if (parts.length > 2) {
    return `.${parts.slice(-2).join('.')}`;
  }

  return hostname;
};

/**
 * Set a cookie with the base domain for cross-SPA sharing
 */
const setCookie = (name: string, value: string, days: number = 365): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const baseDomain = getBaseDomain();
  const domainAttr = baseDomain ? `;domain=${baseDomain}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=None;Secure${domainAttr}`;
};

/**
 * Delete a cookie by setting it to expire in the past
 * Tries multiple domain variations to ensure the cookie is cleared
 */
const deleteCookie = (name: string): void => {
  const hostname = window.location.hostname;
  const baseDomain = getBaseDomain();

  // Delete cookie for current hostname (no domain attr)
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=None;Secure`;

  // Delete cookie for base domain (with leading dot)
  if (baseDomain && baseDomain !== hostname) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${baseDomain};SameSite=None;Secure`;
  }

  // Delete cookie for exact hostname
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${hostname};SameSite=None;Secure`;
};

/**
 * Sync authentication data to cookies for cross-SPA synchronization
 * Note: Named differently from @iblai/web-utils syncAuthToCookies to avoid conflicts
 */
const syncSsoDataToCookiesInternal = (
  data: Record<string, string>,
  localStorageKeys: SsoLoginProps['localStorageKeys'],
) => {
  // Sync current_tenant
  if (data[localStorageKeys.CURRENT_TENANT]) {
    setCookie('ibl_current_tenant', data[localStorageKeys.CURRENT_TENANT]);
  }

  // Sync user_data
  if (data[localStorageKeys.USER_DATA]) {
    setCookie('ibl_user_data', data[localStorageKeys.USER_DATA]);
  }

  // Sync tenants
  if (data[localStorageKeys.TENANTS]) {
    setCookie('ibl_tenant', data[localStorageKeys.TENANTS]);
  }
};

/**
 * Initialize localStorage with authentication data and sync to cookies
 */
export const initializeLocalStorageWithObject = async (
  data: Record<string, string>,
  localStorageKeys: SsoLoginProps['localStorageKeys'],
) => {
  console.log('#################### local storage before ', JSON.stringify(localStorage));

  // CRITICAL: Clear auth cookies FIRST to prevent syncCookiesToLocalStorage from
  // syncing stale cookie data back to localStorage after we clear it.
  // This must happen before clearing localStorage values.
  console.log('#################### Clearing stale auth cookies');
  deleteCookie('ibl_current_tenant');
  deleteCookie('ibl_user_data');
  deleteCookie('ibl_tenant');

  // Clear visiting_tenant to prevent stale tenant data from causing redirect issues
  // This is important during tenant switches where old visiting_tenant could redirect back to previous tenant
  localStorage.removeItem('visiting_tenant');

  // Clear current_tenant to ensure a fresh state on tenant switch
  // The new current_tenant will be set by TenantProvider after redirect
  localStorage.removeItem('current_tenant');
  localStorage.removeItem('tenants');

  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  // Ensure tenant key is explicitly set from parsedData to prevent stale values
  if (data.tenant) {
    localStorage.setItem('tenant', data.tenant);
  }

  console.log('#################### local storage after ', JSON.stringify(localStorage));

  // Sync to cookies for cross-SPA synchronization
  // This sets the NEW auth data in cookies after we've cleared the stale ones
  syncSsoDataToCookiesInternal(data, localStorageKeys);

  // Wait a bit to ensure data is written
  await new Promise((resolve) => setTimeout(resolve, 100));
};

/**
 * Reusable SSO Login component for handling authentication redirects
 *
 * This component:
 * 1. Reads authentication data from URL query parameters
 * 2. Stores the data in localStorage
 * 3. Syncs critical auth data to cookies for cross-SPA synchronization
 * 4. Redirects to the appropriate path after login
 */
function SsoLoginComponent({
  localStorageKeys,
  redirectPathKey = 'redirect-to',
  defaultRedirectPath = '/',
  onLoginSuccess,
  resolveRedirectPath,
}: SsoLoginProps) {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const queryParamData = searchParams.get('data');
    const incomingRedirectPath = searchParams.get('redirect-path');

    if (queryParamData) {
      const parsedData = JSON.parse(queryParamData);

      initializeLocalStorageWithObject(parsedData, localStorageKeys).then(() => {
        // Call optional success callback
        onLoginSuccess?.(parsedData);
        console.log('#################### [sso-login] local storage', localStorage);
        // Determine redirect path
        let redirectPath =
          localStorage.getItem(redirectPathKey) || incomingRedirectPath || defaultRedirectPath;

        // Allow the calling component to resolve/override the redirect path
        if (resolveRedirectPath) {
          redirectPath = resolveRedirectPath(redirectPath, parsedData);
        }

        // Clean up redirect path from storage
        localStorage.removeItem(redirectPathKey);
        // Debug: log localStorage right before redirect
        console.log('[sso-login] localStorage.tenant:', localStorage.getItem('tenant'));
        console.log('[sso-login] redirectPath:', redirectPath);

        // Set login timestamp so auth provider won't redirect during an active login
        setCookie('ibl_login_timestamp', String(Date.now()));

        // Clear tenant switching cookie before redirect
        deleteCookie('ibl_tenant_switching');

        // Redirect to the target path
        window.location.href = `${window.location.origin}${redirectPath}`;
      });
    }
  }, [searchParams, localStorageKeys, redirectPathKey, defaultRedirectPath, onLoginSuccess]);

  return null;
}

function SsoLoginContent() {
  return (
    <SsoLoginComponent
      localStorageKeys={{
        CURRENT_TENANT: LOCAL_STORAGE_KEYS.CURRENT_TENANT,
        USER_DATA: LOCAL_STORAGE_KEYS.USER_DATA,
        TENANTS: LOCAL_STORAGE_KEYS.TENANTS,
      }}
      redirectPathKey="redirect-to"
      defaultRedirectPath="/"
    />
  );
}

export default function SsoLogin() {
  return (
    <Suspense fallback={null}>
      <SsoLoginContent />
    </Suspense>
  );
}
