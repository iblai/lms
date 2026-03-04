import { ReactNode } from 'react';
import { useDefineUserTenants } from '@/hooks/platform/use-define-user-tenants';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { tenantsLoading } = useDefineUserTenants();

  if (tenantsLoading) {
    return fallback || 'Loading...';
  }

  return children;
};
