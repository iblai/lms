import { useGetUserCredentialsQuery } from '@/services/credentials';
import { getTenant, getUserName } from '@/utils/helpers';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch and manage user credentials
 * @param options - Configuration options
 * @param options.maxCredentials - Optional maximum number of credentials to return
 * @returns Object containing credentials array, loading state, and any error
 */
export function useCredentials({ maxCredentials }: { maxCredentials?: number } = {}) {
  const {
    data,
    isLoading: credentialsLoading,
    error,
  } = useGetUserCredentialsQuery({
    org: getTenant(),
    username: getUserName(),
    query: { page: 1 },
  });
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    const credentialsArray = Array.isArray(data) && data.length > 0 ? data[0]?.data : [];
    const result =
      maxCredentials && maxCredentials > 0
        ? credentialsArray.slice(0, maxCredentials)
        : credentialsArray;
    setCredentials(result);
  }, [data, maxCredentials]);

  return { credentials, credentialsLoading, error };
}
