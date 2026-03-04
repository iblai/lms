import { StorageService } from '@iblai/iblai-js/data-layer';
import { z } from 'zod';
import { userDataSchema, tenantSchema } from '@/types/storage';
import { useLocalStorage } from '@/hooks/localstorage/use-local-storage';
import { LOCALSTORAGE_KEYS } from '@/constants/storage';
import { config } from '@/lib/config';
import { Tenant } from '@iblai/iblai-js/web-utils';

export class LocalStorageService implements StorageService {
  private static instance: LocalStorageService;

  private constructor() {}

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  async getItem<T>(key: string): Promise<T | null> {
    return window.localStorage.getItem(key) as T;
  }

  async setItem<T>(key: string, item: T): Promise<void> {
    window.localStorage.setItem(key, JSON.stringify(item));
  }

  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }
}

export const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

export const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

export const removeLocalStorageItem = (key: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing localStorage item:', error);
  }
};

export function useUserData() {
  const [data] = useLocalStorage<z.infer<typeof userDataSchema> | null>(
    LOCALSTORAGE_KEYS.USER_DATA,
    null,
  );

  const validationResult = userDataSchema.safeParse(data);
  if (!validationResult.success) {
    return null;
  }

  return validationResult.data;
}

export function useUsername() {
  const userData = useUserData();

  if (!userData) {
    return null;
  }

  return userData.user_nicename;
}

export function useCurrentTenant() {
  const [data, setValue] = useLocalStorage<Tenant | null>(LOCALSTORAGE_KEYS.CURRENT_TENANT, null);

  return { currentTenant: data, saveCurrentTenant: setValue };
}

export function useUserTenants() {
  const [data, setValue] = useLocalStorage<Tenant[]>(LOCALSTORAGE_KEYS.USER_TENANTS, []);

  return { userTenants: data, saveUserTenants: setValue };
}

export function useIsAdmin() {
  const { currentTenant } = useCurrentTenant();

  if (!currentTenant) {
    return false;
  }

  return currentTenant.is_admin;
}

export function useGetAllTenants() {
  const [data] = useLocalStorage(LOCALSTORAGE_KEYS.TENANTS, null);

  const validationResult = z.array(tenantSchema).safeParse(data);

  if (!validationResult.success) {
    return null;
  }

  return validationResult.data;
}

export const handleTenantSwitch = async (tenant: string, saveRedirect = false) => {
  // Clear current tenant cookie before switching
  const { clearCurrentTenantCookie } = await import('@iblai/iblai-js/web-utils');
  clearCurrentTenantCookie();

  // Preserve the current path before clearing localStorage
  const currentPath = `${window.location.pathname}${window.location.search}`;
  localStorage.clear();

  const url = `${config.urls.auth()}/login/complete`;
  const param = new URLSearchParams({
    tenant,
    'redirect-to': window.location.origin,
  }).toString();

  localStorage.setItem('tenant', tenant);
  if (saveRedirect) {
    // Restore the redirect path after setting tenant
    localStorage.setItem('redirect-to', currentPath);
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  window.location.href = `${url}?${param}`;
};
