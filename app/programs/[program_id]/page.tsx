'use client';

import { Spinner } from '@/components/spinner';
import { getTenant, redirectToAuthSpa } from '@/utils/helpers';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProgramRedirect() {
  const router = useRouter();
  const params = useParams<{ program_id: string }>();

  useEffect(() => {
    const tenant = getTenant();
    const programId = params?.program_id ?? '';
    if (tenant) {
      router.replace(`/platform/${tenant}/programs/${programId}`);
    } else {
      redirectToAuthSpa();
    }
  }, [router, params?.program_id]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-14 w-14 text-[var(--primary)]" />
    </div>
  );
}
