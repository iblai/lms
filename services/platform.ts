import { createApi } from '@reduxjs/toolkit/query/react';
import { Tenant } from '@/types/tenants';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const PlatformSlice = createApi({
  reducerPath: 'PlatformSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getUserTenants: builder.query<Tenant[], null>({
      query: () => ({
        url: `/api/ibl/users/manage/platform/`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetUserTenantsQuery, useLazyGetUserTenantsQuery } = PlatformSlice;
