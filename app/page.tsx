'use client';

import { Spinner } from '@/components/spinner';
import { getTenant, redirectToAuthSpa } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const tenant = getTenant();
    if (tenant) {
      router.replace(`/${tenant}`);
    } else {
      redirectToAuthSpa();
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-14 w-14 text-[var(--primary)]" />
    </div>
  );
}
