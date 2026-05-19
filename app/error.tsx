'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Unhandled client error:', error);
    const tenant = getTenant();
    router.replace(tenant ? `/${tenant}/error/500` : '/');
  }, [error, router]);

  return null;
}
