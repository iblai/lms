'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { AnalyticsProgramDetail } from '@iblai/iblai-js/web-containers';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = useTenantParam();
  const programId = params.programId as string;

  const handleBack = () => {
    router.push(`/platform/${tenant}/analytics/programs`);
  };

  return (
    <AnalyticsProgramDetail
      tenantKey={tenant}
      currentSPA={config.settings.appName() || 'skills'}
      mentorId={''}
      programId={programId}
      onBack={handleBack}
    />
  );
}
