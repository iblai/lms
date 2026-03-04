'use client';

import React, { Suspense } from 'react';
import { SsoLogin as SsoLoginComponent } from '@iblai/iblai-js/web-containers/next';
import { LOCAL_STORAGE_KEYS } from '@iblai/iblai-js/web-utils';

function SsoLoginCompleteContent() {
  return (
    <SsoLoginComponent
      localStorageKeys={{
        CURRENT_TENANT: LOCAL_STORAGE_KEYS.CURRENT_TENANT,
        USER_DATA: LOCAL_STORAGE_KEYS.USER_DATA,
        TENANTS: LOCAL_STORAGE_KEYS.TENANTS,
      }}
      redirectPathKey="redirect-to"
      defaultRedirectPath="/"
    />
  );
}

export default function SsoLoginComplete() {
  return (
    <Suspense fallback={null}>
      <SsoLoginCompleteContent />
    </Suspense>
  );
}
