import { createApi } from '@reduxjs/toolkit/query/react';
import {
  UserSkillsPointRequest,
  UserSkillsPointResponse,
  UserAssignedPathwaysResponse,
  UserAssignedProgramsResponse,
} from '@/types/catalog';
import { PathwayEnrollmentPlus, ProgramEnrollmentPlus } from '@iblai/iblai-api';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES, CATALOG_CACHE_SECONDS } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const CatalogSlice = createApi({
  reducerPath: 'CatalogSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getUserSkillsPoint: builder.query<UserSkillsPointResponse, UserSkillsPointRequest>({
      query: ({ username, platform_key }) => ({
        url: `/api/catalog/milestones/skill_points/user/?username=${username}&platform_key=${platform_key}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
    getUserEnrolledPrograms: builder.query<
      ProgramEnrollmentPlus[],
      {
        username: string;
        platform_key: string;
        include_default_platform?: 0 | 1;
      }
    >({
      query: ({ username, platform_key, include_default_platform = 1 }) => ({
        url: `/api/catalog/enrollment/programs/?username=${username}&platform_key=${platform_key}&include_default_platform=${include_default_platform}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      // Feeds the catalog pages' Enrolled pills — keep it warm so revisits
      // render instantly from cache.
      keepUnusedDataFor: CATALOG_CACHE_SECONDS,
    }),
    getUserCatalogPathways: builder.query<
      PathwayEnrollmentPlus[],
      { username: string; platform_key: string }
    >({
      query: ({ username, platform_key }) => ({
        url: `/api/catalog/pathways/?username=${username}&platform_key=${platform_key}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      // Feeds the catalog pages' Enrolled pills — keep it warm so revisits
      // render instantly from cache.
      keepUnusedDataFor: CATALOG_CACHE_SECONDS,
    }),

    getUserAssignedPathways: builder.query<UserAssignedPathwaysResponse, { user_id: number }>({
      query: ({ user_id }) => ({
        url: `/api/catalog/suggestions/pathway/user/?user_id=${user_id}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
    getUserEnrolledPathways: builder.query<PathwayEnrollmentPlus[], { username: string }>({
      query: ({ username }) => ({
        url: `/api/catalog/enrollment/pathways/?username=${username}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),

    getAssignedPrograms: builder.query<UserAssignedProgramsResponse, { user_id: number }>({
      query: ({ user_id }) => ({
        url: `/api/catalog/suggestions/program/user/?user_id=${user_id}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetUserSkillsPointQuery,
  useLazyGetUserSkillsPointQuery,
  useGetUserCatalogPathwaysQuery,
  useLazyGetUserCatalogPathwaysQuery,
  useGetUserAssignedPathwaysQuery,
  useLazyGetUserAssignedPathwaysQuery,
  useGetUserEnrolledPathwaysQuery,
  useLazyGetUserEnrolledPathwaysQuery,
  useGetUserEnrolledProgramsQuery,
  useLazyGetUserEnrolledProgramsQuery,
  useGetAssignedProgramsQuery,
  useLazyGetAssignedProgramsQuery,
} = CatalogSlice;
