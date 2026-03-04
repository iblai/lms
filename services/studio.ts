import { createApi } from '@reduxjs/toolkit/query/react';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const StudioSlice = createApi({
  reducerPath: 'StudioSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getCoursesAdvancedSettings: builder.query<Record<string, any>, { course_id: string }>({
      query: ({ course_id }) => ({
        url: `/api/contentstore/v0/advanced_settings/${course_id}?fetch_all=0`,
        service: SERVICES.STUDIO,
        includeCredentials: true,
      }),
    }),
    updateCoursesAdvancedSettings: builder.mutation<
      Record<string, any>,
      { course_id: string; advanced_settings: Record<string, any> }
    >({
      query: ({ course_id, advanced_settings }) => ({
        url: `/api/contentstore/v0/advanced_settings/${course_id}`,
        method: 'PATCH',
        body: advanced_settings,
        service: SERVICES.STUDIO,
        includeCredentials: true,
      }),
    }),
    getProgramMetadata: builder.query<Record<string, any>, { programId: string; org: string }>({
      query: ({ programId, org }) => ({
        url: `/api/ibl/catalog/metadata/program/settings/?program_id=${programId}&org=${org}`,
        service: SERVICES.STUDIO,
        includeCredentials: true,
      }),
    }),
    updateProgramMetadata: builder.mutation<
      Record<string, any>,
      { programId: string; org: string; settings: Record<string, any> }
    >({
      query: ({ programId, org, settings }) => ({
        url: `/api/ibl/catalog/metadata/program/settings/?program_id=${programId}&org=${org}`,
        method: 'POST',
        body: {
          program_id: programId,
          org: org,
          ...settings,
        },
        service: SERVICES.STUDIO,
        includeCredentials: true,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetCoursesAdvancedSettingsQuery,
  useLazyGetCoursesAdvancedSettingsQuery,
  useUpdateCoursesAdvancedSettingsMutation,
  useGetProgramMetadataQuery,
  useLazyGetProgramMetadataQuery,
  useUpdateProgramMetadataMutation,
} = StudioSlice;
