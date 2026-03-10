'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsReports, useAnalyticsSettings } from '@iblai/web-containers';

export default function ReportsPage() {
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics users stats component
  // without mentor-specific parameters
  return (
    <AnalyticsReports tenantKey={getTenant()} selectedMentorId={''} usergroupIds={usergroupIds} />
  );
}
