'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsFinancialStats, useAnalyticsSettings } from '@iblai/web-containers';

export default function FinancialPage() {
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics financial stats component
  // without mentor-specific parameters
  return (
    <AnalyticsFinancialStats tenantKey={getTenant()} mentorId={''} usergroupIds={usergroupIds} />
  );
}
