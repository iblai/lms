import { getTenant, getUserName } from '@/utils/helpers';
import { useLazyGetUserCredentialsQuery } from '@/services/credentials';
import { useEffect, useState } from 'react';
import { Assertion } from '@iblai/iblai-api';
export const useProfileCredentials = ({
  search = '',
  maxCredentials,
}: {
  search?: string;
  maxCredentials?: number;
}) => {
  const [getUserCredentials, { isLoading, isError }] = useLazyGetUserCredentialsQuery();
  const [filteredCredentials, setFilteredCredentials] = useState<Assertion[]>([]);
  const [fetchedCredentials, setFetchedCredentials] = useState<Assertion[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  const handleFetchCredentials = async () => {
    try {
      setCredentialsLoading(true);
      const response = await getUserCredentials(
        {
          org: getTenant(),
          username: getUserName(),
          ...(maxCredentials && { query: { limit: maxCredentials } }),
        },
        true,
      );
      setFetchedCredentials(response.data?.data || []);
      setFilteredCredentials(response.data?.data || []);
      setCredentialsLoading(false);
    } catch (error) {
      setFetchedCredentials([]);
      setFilteredCredentials([]);
      setCredentialsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchCredentials();
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      setFilteredCredentials(
        fetchedCredentials?.filter((credential) =>
          String(credential?.credentialDetails?.name || '')
            .toLowerCase()
            .includes(search.toLowerCase()),
        ) ?? [],
      );
    } else {
      setFilteredCredentials(fetchedCredentials);
    }
  }, [search]);

  return {
    filteredCredentials,
    fetchedCredentials,
    isLoading: isLoading || credentialsLoading,
    isError,
  };
};
