import { createApi } from '@reduxjs/toolkit/query/react';
import { EnrolledCourseResponse, RecommendedCoursesResponse } from '@/types/courses';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES, CATALOG_CACHE_SECONDS } from '@/lib/constants';
// Define a service using a base URL and expected endpoints
export const CoursesSlice = createApi({
  reducerPath: 'CoursesSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getRecommendedCourses: builder.query<
      RecommendedCoursesResponse,
      { org: string; username: string; query?: Record<string, any> }
    >({
      query: ({ org, username, query }) => ({
        url: `/api/search/orgs/${org}/users/${username}/recommended/?${new URLSearchParams(
          query,
        ).toString()}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
    getUserEnrolledCourses: builder.query<
      EnrolledCourseResponse,
      { username: string; query?: Record<string, any> }
    >({
      query: ({ username, query }) => ({
        url: `/api/catalog/enrollment/courses/search/?username=${username}&${new URLSearchParams(
          query,
        ).toString()}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      // Feeds the catalog pages' Enrolled pills — keep it warm so revisits
      // render instantly from cache.
      keepUnusedDataFor: CATALOG_CACHE_SECONDS,
    }),
    getUserAssignedCourses: builder.query<
      EnrolledCourseResponse,
      { user_id: string; query?: Record<string, any> }
    >({
      query: ({ user_id, query }) => ({
        url: `/api/catalog/suggestions/course/user/?user_id=${user_id}&${new URLSearchParams(
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
export const {
  useGetRecommendedCoursesQuery,
  useLazyGetRecommendedCoursesQuery,
  useGetUserEnrolledCoursesQuery,
  useLazyGetUserEnrolledCoursesQuery,
  useGetUserAssignedCoursesQuery,
  useLazyGetUserAssignedCoursesQuery,
} = CoursesSlice;
