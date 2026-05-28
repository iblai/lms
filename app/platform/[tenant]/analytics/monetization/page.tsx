'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsMonetizationStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function MonetizationPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  return (
    <AnalyticsMonetizationStats tenantKey={tenant} mentorId={''} usergroupIds={usergroupIds} />
  );
}
