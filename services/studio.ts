import { createApi } from '@reduxjs/toolkit/query/react';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
import { getUserName } from '@/utils/helpers';

// Define a service using a base URL and expected endpoints
export const StudioSlice = createApi({
  reducerPath: 'StudioSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getCoursesAdvancedSettings: builder.query<Record<string, any>, { course_id: string }>({
      query: ({ course_id }) => ({
        url: `/api/contentstore/v0/advanced_settings/${course_id}?fetch_all=0`,
        service: SERVICES.STUDIO,
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
      }),
    }),
    // DM serves the program metadata the Studio plugin returned as `formData`;
    // it is re-wrapped so the program page keeps reading `formData`. The
    // plugin's `formChoices` are not exposed to platform admins by DM yet and
    // the page does not use them.
    getProgramMetadata: builder.query<Record<string, any>, { programId: string; org: string }>({
      query: ({ programId, org }) => ({
        url: `/api/catalog/metadata/program/?program_id=${encodeURIComponent(programId)}&org=${encodeURIComponent(
          org,
        )}&username=${encodeURIComponent(getUserName() ?? '')}`,
        service: SERVICES.DM,
      }),
      transformResponse: (metadata: Record<string, any>, _meta, { programId, org }) => ({
        formData: { ...metadata, program_id: programId, org },
      }),
    }),
    // TODO(iblai-platform#2707 row 10 / B4): the DM write
    // (`POST /api/catalog/metadata/program/`) is DM-admin only, so platform
    // admins keep saving through the Studio plugin until DM allows them.
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
        service: SERVICES.STUDIO_DIRECT,
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
