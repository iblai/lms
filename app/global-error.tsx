'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorPageUrl, getTenant } from '@/utils/helpers';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Unhandled global error:', error);
    const tenant = getTenant();
    router.replace(getErrorPageUrl(500, tenant));
  }, [error, router]);

  return (
    <html>
      <body />
    </html>
  );
}
