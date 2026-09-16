'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { AnalyticsAuditLogStats } from '@iblai/iblai-js/web-containers';
import { getUserName } from '@/utils/helpers';

export default function AuditPage() {
  const tenant = useTenantParam();

  // For Skills app, we'll use the audit log stats component
  // without mentor-specific parameters
  return (
    <AnalyticsAuditLogStats
      tenantKey={tenant}
      currentSPA={config.settings.appName() || 'skills'}
      mentorId={''}
      userId={getUserName() || ''}
      selectedMentorId={''}
    />
  );
}
