import { createApi } from '@reduxjs/toolkit/query/react';
import { CredentialsResponse } from '@/types/credentials';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const CredentialsSlice = createApi({
  reducerPath: 'CredentialsSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getUserCredentials: builder.query<
      CredentialsResponse,
      { org: string; username: string; query?: Record<string, any> }
    >({
      query: ({ org, username, query }) => ({
        url: `/api/credentials/orgs/${org}/users/${username}/assertions/?${new URLSearchParams(
          query,
        ).toString()}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetUserCredentialsQuery, useLazyGetUserCredentialsQuery } = CredentialsSlice;
