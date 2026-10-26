import { createApi } from '@reduxjs/toolkit/query/react';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';
import type {
  CommentPatch,
  CommentsPage,
  CourseTopicsResponse,
  DiscussionComment,
  DiscussionConfig,
  DiscussionThread,
  LearnersOrdering,
  LearnersPage,
  NewThread,
  ThreadPatch,
  ThreadsPage,
  ThreadsQuery,
} from '@/types/discussions';

const course = (courseId: string) => encodeURIComponent(courseId);
const PROFILE_IMAGE = 'profile_image';

const query = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return search.toString();
};

// The discussion API only takes partial updates as JSON merge patches, so the
// usual JSON content type is turned off and the body is serialised by hand.
const mergePatch = (url: string, patch: object) => ({
  url,
  method: 'PATCH',
  service: SERVICES.LMS,
  isJson: false,
  headers: { 'Content-Type': 'application/merge-patch+json' },
  body: JSON.stringify(patch),
});

/**
 * Open edX discussion REST API behind the native Discussions tab.
 */
export const DiscussionsSlice = createApi({
  reducerPath: 'DiscussionsSlice',
  baseQuery: iblFetchBaseQuery,
  tagTypes: ['Topics', 'Threads', 'Thread', 'Comments', 'Learners'],
  endpoints: (builder) => ({
    getDiscussionConfig: builder.query<DiscussionConfig, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/discussion/v1/courses/${course(courseId)}/`,
        service: SERVICES.LMS,
      }),
    }),
    getCourseTopics: builder.query<CourseTopicsResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `/api/discussion/v1/course_topics/${course(courseId)}`,
        service: SERVICES.LMS,
      }),
      providesTags: ['Topics'],
    }),

    getThreads: builder.query<ThreadsPage, ThreadsQuery>({
      query: ({
        courseId,
        page = 1,
        pageSize = 20,
        topicId,
        textSearch,
        threadType,
        orderBy,
        view,
        following,
        author,
        flagged,
        countFlagged,
      }) => ({
        url: `/api/discussion/v1/threads/?${query({
          course_id: courseId,
          page,
          page_size: pageSize,
          topic_id: topicId,
          text_search: textSearch,
          thread_type: threadType,
          order_by: orderBy,
          view,
          following: following || undefined,
          author,
          flagged: flagged || undefined,
          count_flagged: countFlagged || undefined,
          requested_fields: PROFILE_IMAGE,
        })}`,
        service: SERVICES.LMS,
      }),
      providesTags: ['Threads'],
    }),
    getThread: builder.query<DiscussionThread, { threadId: string; courseId: string }>({
      query: ({ threadId, courseId }) => ({
        url: `/api/discussion/v1/threads/${encodeURIComponent(threadId)}/?${query({
          course_id: courseId,
          requested_fields: PROFILE_IMAGE,
        })}`,
        service: SERVICES.LMS,
      }),
      providesTags: (_result, _error, { threadId }) => [{ type: 'Thread', id: threadId }],
    }),
    createThread: builder.mutation<DiscussionThread, NewThread>({
      query: ({
        courseId,
        topicId,
        type,
        title,
        rawBody,
        following,
        anonymous,
        anonymousToPeers,
      }) => ({
        url: '/api/discussion/v1/threads/',
        method: 'POST',
        // The anonymity flags are rejected outright ("not initializable") on
        // courses that don't allow them, so they only travel when set.
        body: {
          course_id: courseId,
          topic_id: topicId,
          type,
          title,
          raw_body: rawBody,
          following: following ?? true,
          ...(anonymous ? { anonymous: true } : {}),
          ...(anonymousToPeers ? { anonymous_to_peers: true } : {}),
        },
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Threads', 'Topics', 'Learners'],
    }),
    updateThread: builder.mutation<DiscussionThread, { threadId: string; patch: ThreadPatch }>({
      query: ({ threadId, patch }) =>
        mergePatch(`/api/discussion/v1/threads/${encodeURIComponent(threadId)}/`, patch),
      invalidatesTags: (_result, _error, { threadId }) => [
        'Threads',
        { type: 'Thread', id: threadId },
      ],
    }),
    deleteThread: builder.mutation<void, { threadId: string }>({
      query: ({ threadId }) => ({
        url: `/api/discussion/v1/threads/${encodeURIComponent(threadId)}/`,
        method: 'DELETE',
        service: SERVICES.LMS,
      }),
      invalidatesTags: ['Threads', 'Topics', 'Learners'],
    }),

    getComments: builder.query<
      CommentsPage,
      {
        threadId: string;
        page?: number;
        pageSize?: number;
        /** Required by the API for question threads: endorsed answers or the rest. */
        endorsed?: boolean;
        reverseOrder?: boolean;
      }
    >({
      query: ({ threadId, page = 1, pageSize = 20, endorsed, reverseOrder }) => ({
        url: `/api/discussion/v1/comments/?${query({
          thread_id: threadId,
          page,
          page_size: pageSize,
          endorsed,
          reverse_order: reverseOrder || undefined,
          requested_fields: PROFILE_IMAGE,
        })}`,
        service: SERVICES.LMS,
      }),
      providesTags: (_result, _error, { threadId }) => [{ type: 'Comments', id: threadId }],
    }),
    getCommentReplies: builder.query<
      CommentsPage,
      { commentId: string; page?: number; pageSize?: number }
    >({
      query: ({ commentId, page = 1, pageSize = 20 }) => ({
        url: `/api/discussion/v1/comments/${encodeURIComponent(commentId)}/?${query({
          page,
          page_size: pageSize,
          requested_fields: PROFILE_IMAGE,
        })}`,
        service: SERVICES.LMS,
      }),
      providesTags: (_result, _error, { commentId }) => [{ type: 'Comments', id: commentId }],
    }),
    createComment: builder.mutation<
      DiscussionComment,
      { threadId: string; rawBody: string; parentId?: string }
    >({
      query: ({ threadId, rawBody, parentId }) => ({
        url: '/api/discussion/v1/comments/',
        method: 'POST',
        body: {
          thread_id: threadId,
          raw_body: rawBody,
          ...(parentId ? { parent_id: parentId } : {}),
        },
        service: SERVICES.LMS,
      }),
      invalidatesTags: (_result, _error, { threadId, parentId }) => [
        'Threads',
        'Learners',
        { type: 'Thread', id: threadId },
        { type: 'Comments', id: parentId ?? threadId },
      ],
    }),
    updateComment: builder.mutation<
      DiscussionComment,
      { commentId: string; threadId: string; parentId?: string; patch: CommentPatch }
    >({
      query: ({ commentId, patch }) =>
        mergePatch(`/api/discussion/v1/comments/${encodeURIComponent(commentId)}/`, patch),
      invalidatesTags: (_result, _error, { threadId, parentId }) => [
        { type: 'Thread', id: threadId },
        { type: 'Comments', id: parentId ?? threadId },
      ],
    }),
    deleteComment: builder.mutation<
      void,
      { commentId: string; threadId: string; parentId?: string }
    >({
      query: ({ commentId }) => ({
        url: `/api/discussion/v1/comments/${encodeURIComponent(commentId)}/`,
        method: 'DELETE',
        service: SERVICES.LMS,
      }),
      invalidatesTags: (_result, _error, { threadId, parentId }) => [
        'Threads',
        'Learners',
        { type: 'Thread', id: threadId },
        { type: 'Comments', id: parentId ?? threadId },
      ],
    }),

    getLearners: builder.query<
      LearnersPage,
      { courseId: string; page?: number; orderBy?: LearnersOrdering; username?: string }
    >({
      query: ({ courseId, page = 1, orderBy = 'activity', username }) => ({
        url: `/api/discussion/v1/courses/${course(courseId)}/activity_stats/?${query({
          page,
          order_by: orderBy,
          username,
        })}`,
        service: SERVICES.LMS,
      }),
      providesTags: ['Learners'],
    }),
  }),
});

export const {
  useGetDiscussionConfigQuery,
  useGetCourseTopicsQuery,
  useGetThreadsQuery,
  useGetThreadQuery,
  useCreateThreadMutation,
  useUpdateThreadMutation,
  useDeleteThreadMutation,
  useGetCommentsQuery,
  useGetCommentRepliesQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetLearnersQuery,
} = DiscussionsSlice;
