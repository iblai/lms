'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsFinancialStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function FinancialPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics financial stats component
  // without mentor-specific parameters
  return <AnalyticsFinancialStats tenantKey={tenant} mentorId={''} usergroupIds={usergroupIds} />;
}
