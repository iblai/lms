'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsReports, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function ReportsPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics users stats component
  // without mentor-specific parameters
  return <AnalyticsReports tenantKey={tenant} selectedMentorId={''} usergroupIds={usergroupIds} />;
}
