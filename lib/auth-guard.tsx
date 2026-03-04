'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: Props): React.ReactElement {
  const pathname = usePathname();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  React.useEffect(() => {
    // Add your authentication logic here
    setIsAuthenticating(false);
  }, [pathname]);

  if (isAuthenticating) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
} 