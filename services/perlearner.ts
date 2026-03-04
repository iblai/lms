import { createApi } from '@reduxjs/toolkit/query/react';
import { UserPerLearnerResponse, UserActivityResponse } from '@/types/perlearner';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const PerLearnerSlice = createApi({
  reducerPath: 'PerLearnerSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getUserPerLearnerInfo: builder.query<
      UserPerLearnerResponse,
      { org: string; username: string; query?: Record<string, any> }
    >({
      query: ({ org, username, query }) => ({
        url: `/api/perlearner/orgs/${org}/users/${username}/info?${new URLSearchParams(
          query,
        ).toString()}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
    getPerLearnerActivity: builder.query<UserActivityResponse, { org: string; username: string }>({
      query: ({ org, username }) => ({
        url: `/api/perlearner/orgs/${org}/users/${username}/activity/`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetUserPerLearnerInfoQuery,
  useLazyGetUserPerLearnerInfoQuery,
  useGetPerLearnerActivityQuery,
  useLazyGetPerLearnerActivityQuery,
} = PerLearnerSlice;
