import { createApi } from '@reduxjs/toolkit/query/react';
import { UserMetadata } from '@/types/users';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const UserMetaDataSlice = createApi({
  reducerPath: 'UserMetaDataSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getUserMetaData: builder.query<UserMetadata, string>({
      query: (username) => ({
        url: `/api/ibl/users/manage/metadata/?username=${username}`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
    uploadProfileImage: builder.mutation<any, { formData: FormData; username: string }>({
      query: ({ formData, username }) => ({
        url: `/api/user/v1/accounts/${username}/image/`,
        method: 'POST',
        body: formData,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetUserMetaDataQuery,
  useLazyGetUserMetaDataQuery,
  useUploadProfileImageMutation,
} = UserMetaDataSlice;
