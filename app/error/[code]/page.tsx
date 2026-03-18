'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { config } from '@/lib/config';
import { hideInitialLoader } from '@/lib/initial-loader';

import { ClientErrorPage } from '@iblai/iblai-js/web-containers/next';

export default function ErrorPage() {
  const params = useParams();

  const code = params.code as string;

  const handleError = (error: any) => {
    console.error(JSON.stringify({ tenant: 'client-error-page', error }));
  };

  useEffect(() => {
    hideInitialLoader();
  }, []);

  return (
    <ClientErrorPage
      errorCode={code}
      header={"Not found"}
      message={"The page you are looking for does not exist."}
      showHomeButton={true}
      supportEmail={config.settings.supportEmail()}
      handleError={handleError}
    />
  );
}
