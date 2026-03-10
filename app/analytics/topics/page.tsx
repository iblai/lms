'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsTopicsStats, useAnalyticsSettings } from '@iblai/web-containers';

export default function TopicsPage() {
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics topics stats component
  // without mentor-specific parameters
  return <AnalyticsTopicsStats tenantKey={getTenant()} mentorId={''} usergroupIds={usergroupIds} />;
}
