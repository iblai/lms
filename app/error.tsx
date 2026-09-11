'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorPageUrl, getTenant } from '@/utils/helpers';

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
    router.replace(getErrorPageUrl(500, tenant));
  }, [error, router]);

  return null;
}
