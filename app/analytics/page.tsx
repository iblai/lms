'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsOverview, useAnalyticsSettings } from '@iblai/web-containers';

export default function AnalyticsPage() {
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics overview component
  // without mentor-specific parameters
  return <AnalyticsOverview tenantKey={getTenant()} mentorId={''} usergroupIds={usergroupIds} />;
}
