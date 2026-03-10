'use client';

import { useParams, useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';
import { AnalyticsProgramDetail } from '@iblai/web-containers';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const handleBack = () => {
    router.push('/analytics/programs');
  };

  return (
    <AnalyticsProgramDetail
      tenantKey={getTenant()}
      mentorId={''}
      programId={programId}
      onBack={handleBack}
    />
  );
}
