import { createApi } from '@reduxjs/toolkit/query/react';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
import type {
  CourseDatesResponse,
  CourseHomeMeta,
  ResetDeadlinesResponse,
} from '@/types/course-home';

/**
 * Open edX course-home endpoints behind the native Dates tab. The progress
 * endpoint lives in `services/course-metadata.ts`, where the course layout
 * already loads it.
 */
export const CourseHomeSlice = createApi({
  reducerPath: 'CourseHomeSlice',
  baseQuery: iblFetchBaseQuery,
  tagTypes: ['CourseDates'],
  endpoints: (builder) => ({
    getCourseDates: builder.query<CourseDatesResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/course_home/dates/${courseId}`,
        service: SERVICES.LMS,
      }),
      providesTags: ['CourseDates'],
    }),
    getCourseHomeMeta: builder.query<CourseHomeMeta, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/course_home/course_metadata/${courseId}`,
        service: SERVICES.LMS,
      }),
    }),
    resetCourseDeadlines: builder.mutation<ResetDeadlinesResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: '/api/course_experience/v1/reset_course_deadlines',
        method: 'POST',
        body: { course_key: courseId, research_event_data: { location: 'dates-tab' } },
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['CourseDates'],
    }),
  }),
});

export const {
  useGetCourseDatesQuery,
  useGetCourseHomeMetaQuery,
  useResetCourseDeadlinesMutation,
} = CourseHomeSlice;
