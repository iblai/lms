import { createApi } from '@reduxjs/toolkit/query/react';
import { Tenant } from '@/types/tenants';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
import { getUserName } from '@/utils/helpers';

// Define a service using a base URL and expected endpoints
export const PlatformSlice = createApi({
  reducerPath: 'PlatformSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    // The DM view the edX `/api/ibl/users/manage/platform/` endpoint used to
    // proxy; takes `username=<self>`.
    getUserTenants: builder.query<Tenant[], null>({
      query: () => ({
        url: `/api/core/users/platforms/?username=${encodeURIComponent(getUserName() ?? '')}`,
        service: SERVICES.DM,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetUserTenantsQuery, useLazyGetUserTenantsQuery } = PlatformSlice;
