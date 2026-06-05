'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
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
      mentorId={''}
      programId={programId}
      onBack={handleBack}
    />
  );
}
