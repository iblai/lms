'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsMonetizationStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function MonetizationPage() {
  const { usergroupIds } = useAnalyticsSettings();

  return (
    <AnalyticsMonetizationStats tenantKey={getTenant()} mentorId={''} usergroupIds={usergroupIds} />
  );
}
