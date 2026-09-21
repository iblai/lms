'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsPrograms } from '@iblai/iblai-js/web-containers';

export default function ProgramsPage() {
  const tenant = useTenantParam();
  return (
    <AnalyticsPrograms
      tenantKey={tenant}
      mentorId={''}
      basePath={`/platform/${tenant}/analytics`}
      // The id cell links to the program itself; the row still opens analytics.
      getProgramURL={(programId) => `/platform/${tenant}/programs/${programId}`}
    />
  );
}
