'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { AnalyticsTranscriptsStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function TranscriptsPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics transcripts stats component
  // without mentor-specific parameters
  return (
    <AnalyticsTranscriptsStats
      tenantKey={tenant}
      currentSPA={config.settings.appName() || 'skills'}
      mentorId={''}
      usergroupIds={usergroupIds}
    />
  );
}
