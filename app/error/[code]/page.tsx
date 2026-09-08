'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ErrorPageContent } from '@/components/error-page-content';

function ErrorRoute() {
  const params = useParams();
  const code = params.code as string;
  const query = useSearchParams();
  const tenant = query.get('tenant') || '';

  return <ErrorPageContent code={code} tenant={tenant} />;
}

// `useSearchParams` needs a Suspense boundary to keep the route out of the
// bail-out-to-client-rendering build error.
export default function ErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorRoute />
    </Suspense>
  );
}
