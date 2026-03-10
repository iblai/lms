'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsPrograms } from '@iblai/web-containers';

export default function ProgramsPage() {
  return <AnalyticsPrograms tenantKey={getTenant()} mentorId={''} basePath="/analytics" />;
}
