import { createApi } from '@reduxjs/toolkit/query/react';
import { DepartmentMemberCheckResponse } from '@/types/core';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const CoreSlice = createApi({
  reducerPath: 'CoreSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getDepartmentMemberCheck: builder.query<
      DepartmentMemberCheckResponse,
      { platform_key: string }
    >({
      query: ({ platform_key }) => ({
        url: `/api/core/departments/members/check/?platform_key=${platform_key}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetDepartmentMemberCheckQuery, useLazyGetDepartmentMemberCheckQuery } = CoreSlice;
