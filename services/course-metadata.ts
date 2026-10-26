import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import {
  CourseBlockDetailsResponse,
  CourseCompletion,
  CourseEdxData,
  CourseEligibilityResponse,
  CourseEnrollmentRequest,
  CourseEnrollmentResponse,
  CourseOutlineResponse,
  CourseProgress,
  EdxCourseDetail,
} from '@/types/courses';
import { CustomQueryArgs, iblFetchBaseQuery } from '@/lib/utils';
import { COURSE_METADATA_CACHE_SECONDS, SERVICES } from '@/lib/constants';
import { getUserName } from '@/utils/helpers';
import { mergeCourseMetadata } from '@/utils/course-metadata-merge';

/**
 * DM's catalog user endpoints take `username=<self>` where the edX plugin
 * inferred the caller from the JWT.
 */
const selfParam = () => `username=${encodeURIComponent(getUserName() ?? '')}`;

/** One request through the base query, unwrapped to its payload. */
const fetchData = async <T>(
  args: CustomQueryArgs,
  api: BaseQueryApi,
  extraOptions: Record<string, unknown>,
): Promise<T> => {
  const result = await iblFetchBaseQuery(args, api, extraOptions);
  if (result.error) {
    throw result.error;
  }
  return result.data as T;
};

// Define a service using a base URL and expected endpoints
export const CourseMetadataSlice = createApi({
  reducerPath: 'CourseMetadataSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    // The edX plugin merged DM catalog metadata with the edX course details;
    // it is rebuilt here from DM's public metadata plus Open edX's course
    // detail through DM's proxy (iblai-platform#2707 row 7). Anonymous
    // visitors keep the plugin endpoint: DM's public metadata refuses
    // anonymous calls (gap B3).
    getCourseMetaData: builder.query<CourseEdxData, { courseKey: string; noAuth?: boolean }>({
      queryFn: async ({ courseKey, noAuth = false }, api, extraOptions) => {
        if (noAuth) {
          const data = await fetchData<CourseEdxData>(
            {
              url: `/api/ibl/v1/course_metadata?course_key=${encodeURIComponent(courseKey)}`,
              service: SERVICES.LMS_DIRECT,
              noAuth,
            },
            api,
            extraOptions,
          );
          return { data };
        }
        const [dmMetadata, edxCourse] = await Promise.all([
          fetchData<Record<string, unknown>>(
            {
              url: `/api/catalog/metadata/course-public/?course_id=${encodeURIComponent(courseKey)}`,
              service: SERVICES.DM,
            },
            api,
            extraOptions,
          ).catch((error: unknown) => {
            // The DM half only enriches the record; a course DM has no catalog
            // entry for still renders from its edX details.
            console.warn('[course-metadata] DM public metadata unavailable:', error);
            return {};
          }),
          fetchData<EdxCourseDetail>(
            { url: `/api/courses/v1/courses/${courseKey}`, service: SERVICES.LMS },
            api,
            extraOptions,
          ),
        ]);
        return { data: mergeCourseMetadata(courseKey, dmMetadata, edxCourse) };
      },
      // One cache entry per course, keyed on the course alone. `noAuth` only
      // decides whether the request carries credentials — it describes the
      // caller, not the resource — and leaving it in the default key meant
      // `{ courseKey }` (the card-artwork lookup) and
      // `{ courseKey, noAuth: false }` (every other caller) resolved to two
      // separate entries, so the same course was fetched twice.
      serializeQueryArgs: ({ queryArgs }) => ({ courseKey: queryArgs.courseKey }),
      keepUnusedDataFor: COURSE_METADATA_CACHE_SECONDS,
    }),
    // The completion outline from DM. DM answers 404 for a course the user is
    // not enrolled in, where the edX plugin returned an empty outline; both
    // reach the callers as "no outline".
    getCourseCompletionOutlines: builder.query<CourseOutlineResponse, { courseKey: string }>({
      query: ({ courseKey }) => ({
        url: `/api/catalog/enrollment/courses/completion/?${selfParam()}&course_id=${encodeURIComponent(
          courseKey,
        )}&endpoint=outline`,
        service: SERVICES.DM,
      }),
    }),
    // Same fields as the edX plugin's `enroll_status`, plus `is_eligible`.
    getCourseEligibility: builder.query<CourseEligibilityResponse, { courseKey: string }>({
      query: ({ courseKey }) => ({
        url: `/api/catalog/eligibility/courses/check/?${selfParam()}&course_id=${encodeURIComponent(
          courseKey,
        )}`,
        service: SERVICES.DM,
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
