'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Unhandled global error:', error);
    router.replace('/error/500');
  }, [error, router]);

  return (
    <html>
      <body />
    </html>
  );
}
