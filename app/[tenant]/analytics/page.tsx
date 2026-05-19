'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsOverview, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function AnalyticsPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics overview component
  // without mentor-specific parameters
  return <AnalyticsOverview tenantKey={tenant} mentorId={''} usergroupIds={usergroupIds} />;
}
