'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsTopicsStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function TopicsPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics topics stats component
  // without mentor-specific parameters
  return <AnalyticsTopicsStats tenantKey={tenant} mentorId={''} usergroupIds={usergroupIds} />;
}
