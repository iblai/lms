'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsTranscriptsStats, useAnalyticsSettings } from '@iblai/web-containers';

export default function TranscriptsPage() {
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics transcripts stats component
  // without mentor-specific parameters
  return (
    <AnalyticsTranscriptsStats tenantKey={getTenant()} mentorId={''} usergroupIds={usergroupIds} />
  );
}
