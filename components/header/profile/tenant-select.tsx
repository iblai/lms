import { TenantSwitcher } from '@iblai/iblai-js/web-containers';
import { getTenant, getTenants, handleTenantSwitch } from '@/utils/helpers';
import { Tenant } from '@iblai/iblai-js/web-utils';
import isEmpty from 'lodash/isEmpty';
import { selectRbacPermissions } from '@/features/rbac';
import { useAppSelector } from '@/lib/hooks';
import { config } from '@/lib/config';

export function TenantSelect() {
  const tenantKey = getTenant();
  const tenants = getTenants() as Tenant[];
  const rbacPermissions = useAppSelector(selectRbacPermissions);

  if (isEmpty(tenants) || !tenantKey) {
    return <></>;
  }

  return (
    <TenantSwitcher
      currentTenantKey={tenantKey}
      tenants={tenants}
      onTenantChange={handleTenantSwitch}
      rbacPermissions={rbacPermissions}
      enableRbac={config.settings.enableRBAC()}
    />
  );
}
