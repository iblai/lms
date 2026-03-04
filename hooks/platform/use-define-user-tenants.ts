import { LOCALSTORAGE_KEYS } from '@/constants/storage';
import { useLazyGetUserTenantsQuery } from '@/services/platform';
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/localstorage';
import { useEffect, useState } from 'react';

export const useDefineUserTenants = () => {
  const [getUserTenants, { isLoading }] = useLazyGetUserTenantsQuery();
  const [tenantsLoaded, setTenantsLoaded] = useState<boolean>(false);

  const handleTenantInitialization = async () => {
    const userTenants = getLocalStorageItem(LOCALSTORAGE_KEYS.TENANTS);
    const currentTenant = getLocalStorageItem(LOCALSTORAGE_KEYS.CURRENT_TENANT);
    if (!(userTenants && currentTenant)) {
      const { data: tenants } = await getUserTenants(null);
      if (Array.isArray(tenants) && tenants.length > 0) {
        setLocalStorageItem(LOCALSTORAGE_KEYS.TENANTS, tenants);
        setLocalStorageItem(
          LOCALSTORAGE_KEYS.CURRENT_TENANT,
          tenants.find((tenant) => tenant.key === getLocalStorageItem(LOCALSTORAGE_KEYS.TENANT)) ||
            tenants[0],
        );
        setTenantsLoaded(true);
      }
      return;
    }
    setTenantsLoaded(true);
  };

  useEffect(() => {
    handleTenantInitialization();
  }, []);

  return {
    tenantsLoading: isLoading || !tenantsLoaded,
  };
};
