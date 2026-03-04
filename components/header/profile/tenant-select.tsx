import { TenantSwitcher } from '@iblai/iblai-js/web-containers';
import { getTenant, getTenants, handleTenantSwitch } from '@/utils/helpers';
import { Tenant } from '@iblai/iblai-js/web-utils';
import _ from 'lodash';
import { selectRbacPermissions } from '@/features/rbac';
import { useAppSelector } from '@/lib/hooks';

export function TenantSelect() {
  const tenantKey = getTenant();
  const tenants = getTenants() as Tenant[];
  const rbacPermissions = useAppSelector(selectRbacPermissions);

  if (_.isEmpty(tenants) || !tenantKey) {
    return <></>;
  }

  return (
    <TenantSwitcher
      currentTenantKey={tenantKey}
      tenants={tenants}
      onTenantChange={handleTenantSwitch}
      rbacPermissions={rbacPermissions}
    />
  );
}
