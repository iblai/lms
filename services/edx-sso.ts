import { createApi } from '@reduxjs/toolkit/query/react';
import {} from '@/types/courses';
import { EdxSSOTokenResponse } from '@/types/edx-sso';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
// Define a service using a base URL and expected endpoints
export const EdxSSOSlice = createApi({
  reducerPath: 'EdxSSOSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getEdxSSOToken: builder.query<EdxSSOTokenResponse, { username: string; redirect_url: string }>({
      query: ({ username, redirect_url }) => ({
        url: `/ibl/ai/sso/backend/edx/sso-auth-token/generate?username=${username}&redirect_url=${encodeURIComponent(
          redirect_url,
        )}`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
  }),
});
// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetEdxSSOTokenQuery, useLazyGetEdxSSOTokenQuery } = EdxSSOSlice;
