'use client';

// Prevent static generation - this page uses browser APIs
export const dynamic = 'force-dynamic';

import { AnalyticsMemoryStats } from '@iblai/iblai-js/web-containers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { getUserName } from '@/utils/helpers';

export default function MemoryPage() {
  const username = getUserName();
  const tenant = useTenantParam();
  return <AnalyticsMemoryStats tenantKey={tenant} mentorId={''} userId={username} />;
}
