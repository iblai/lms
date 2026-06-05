'use client';

import { Loader } from '@iblai/iblai-js/web-containers';

export default function SsoLoginLoading() {
  return (
    <div className="h-screen w-screen">
      <Loader />
    </div>
  );
}
