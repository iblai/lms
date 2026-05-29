'use client';

import React, { Suspense } from 'react';
import { LOCAL_STORAGE_KEYS } from '@iblai/iblai-js/web-utils';
import { SsoLogin as SsoLoginComponent } from '@iblai/iblai-js/web-containers/next';

function SsoLoginCompleteContent() {
  return (
    <SsoLoginComponent
      localStorageKeys={{
        CURRENT_TENANT: LOCAL_STORAGE_KEYS.CURRENT_TENANT,
        USER_DATA: LOCAL_STORAGE_KEYS.USER_DATA,
        TENANTS: LOCAL_STORAGE_KEYS.TENANTS,
      }}
      redirectPathKey="redirect-path"
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
