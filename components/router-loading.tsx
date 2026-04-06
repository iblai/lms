'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export function RouterLoading({ children }: { children: React.ReactNode }): React.ReactElement {
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = React.useState(false);

  React.useEffect(() => {
    if (router) {
      setIsRouterReady(true);
    }
  }, [router]);

  if (!isRouterReady) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
