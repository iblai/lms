'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsUsersStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function UsersPage() {
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics users stats component
  // without mentor-specific parameters
  return <AnalyticsUsersStats tenantKey={getTenant()} mentorId={''} usergroupIds={usergroupIds} />;
}
