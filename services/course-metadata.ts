import { createApi } from '@reduxjs/toolkit/query/react';
import {
  CourseBlockDetailsResponse,
  CourseCompletion,
  CourseEdxData,
  CourseEligibilityResponse,
  CourseEnrollmentRequest,
  CourseEnrollmentResponse,
  CourseOutlineResponse,
  CourseProgress,
} from '@/types/courses';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
// Define a service using a base URL and expected endpoints
export const CourseMetadataSlice = createApi({
  reducerPath: 'CourseMetadataSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getCourseMetaData: builder.query<CourseEdxData, { courseKey: string; noAuth?: boolean }>({
      query: ({ courseKey, noAuth = false }) => ({
        url: `/api/ibl/v1/course_metadata?course_key=${encodeURIComponent(courseKey)}`,
        service: SERVICES.LMS,
        includeCredentials: true,
        noAuth,
      }),
    }),
    getCourseCompletionOutlines: builder.query<CourseOutlineResponse, { courseKey: string }>({
      query: ({ courseKey }) => ({
        url: `/api/ibl/completion/course_outline/${courseKey}?course_id=${encodeURIComponent(
          courseKey,
        )}`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
    getCourseEligibility: builder.query<CourseEligibilityResponse, { courseKey: string }>({
      query: ({ courseKey }) => ({
        url: `/api/ibl/enrollment/enroll_status?course_id=${encodeURIComponent(courseKey)}`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
    createCourseEnrollment: builder.mutation<CourseEnrollmentResponse, CourseEnrollmentRequest>({
      query: (request) => ({
        url: `/api/enrollment/v1/enrollment`,
        method: 'POST',
        body: request,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
    getCourseProgress: builder.query<CourseProgress, { courseKey: string }>({
      query: ({ courseKey }) => ({
        url: `/api/course_home/progress/${courseKey}`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
    getCourseCompletion: builder.query<CourseCompletion, { courseKey: string; userID: number }>({
      query: ({ courseKey, userID }) => ({
        url: `/api/catalog/milestones/completions/course/manage/?course_id=${courseKey}&user_id=${userID}`,
        service: SERVICES.DM,
        //includeCredentials: true,
      }),
    }),
    getCourseBlockDetails: builder.query<
      CourseBlockDetailsResponse,
      { blockId: string; username: string }
    >({
      query: ({ blockId, username }) => ({
        url: `/api/courses/v2/blocks/${encodeURIComponent(blockId)}?username=${encodeURIComponent(username)}&depth=all`,
        service: SERVICES.LMS,
        includeCredentials: true,
      }),
    }),
  }),
});
// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetCourseMetaDataQuery,
  useLazyGetCourseMetaDataQuery,
  useGetCourseCompletionOutlinesQuery,
  useLazyGetCourseCompletionOutlinesQuery,
  useGetCourseEligibilityQuery,
  useLazyGetCourseEligibilityQuery,
  useCreateCourseEnrollmentMutation,
  useGetCourseProgressQuery,
  useLazyGetCourseProgressQuery,
  useGetCourseCompletionQuery,
  useLazyGetCourseCompletionQuery,
  useGetCourseBlockDetailsQuery,
  useLazyGetCourseBlockDetailsQuery,
} = CourseMetadataSlice;
