import type { Tenant } from '@iblai/iblai-js/web-utils';

import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { canMonetize, useCurrentTenant, useUserTenants } from '@/utils/localstorage';

/**
 * Whether the signed-in user may put items on this tenant behind a paywall:
 * the tenant has monetization on and the user holds `#can_sell_items` (always
 * true with RBAC off). Same rule as the SDK's Account › Monetization tab.
 */
export function useCanSellItems(tenant: string): boolean {
  const { currentTenant } = useCurrentTenant();
  const { userTenants } = useUserTenants();
  const rbacPermissions = useAppSelector(selectRbacPermissions);

  if (!currentTenant) return false;
  return (
    !!canMonetize(currentTenant as Tenant, (userTenants ?? []) as Tenant[]) &&
    checkRbacPermission(rbacPermissions, `/platforms/${tenant}/#can_sell_items`)
  );
}
