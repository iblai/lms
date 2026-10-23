import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Capture the args each endpoint builds instead of hitting fetch (jsdom's
// AbortSignal is rejected by undici's Request constructor on Node 25).
type Captured = {
  url: string;
  method: string;
  body?: unknown;
  service?: string;
  isJson?: boolean;
  headers?: Record<string, string>;
};
let captured: Captured[] = [];
vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...original,
    iblFetchBaseQuery: async (args: any) => {
      captured.push({
        url: args.url,
        method: (args.method ?? 'GET').toUpperCase(),
        body: args.body,
        service: args.service,
        isJson: args.isJson,
        headers: args.headers,
      });
      return { data: { ok: true } };
    },
  };
});

import { DiscussionsSlice } from '../discussions';

const COURSE = 'course-v1:org+c+run';
const ENC = encodeURIComponent(COURSE);

const makeStore = () =>
  configureStore({
    reducer: { [DiscussionsSlice.reducerPath]: DiscussionsSlice.reducer },
    middleware: (getDefault) => getDefault().concat(DiscussionsSlice.middleware),
  });

const paramsOf = (url: string) => {
  const parsed = new URL(`https://lms${url}`);
  return { path: parsed.pathname, params: Object.fromEntries(parsed.searchParams) };
};

describe('DiscussionsSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    captured = [];
    store = makeStore();
  });

  // The call read back is the first one this dispatch made, so tag
  // invalidation refetches aren't mistaken for the request under test.
  const run = async (endpoint: string, args: unknown) => {
    const before = captured.length;
    await store.dispatch(
      (DiscussionsSlice.endpoints as any)[endpoint].initiate(args, { forceRefetch: true }),
    );
    return captured[before];
  };
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('reads the course discussion config and topics', async () => {
    const config = await run('getDiscussionConfig', { courseId: COURSE });
    expect(config).toMatchObject({
      url: `/api/discussion/v1/courses/${ENC}/`,
      method: 'GET',
      service: 'LMS',
    });
    const topics = await run('getCourseTopics', { courseId: COURSE });
    expect(topics.url).toBe(`/api/discussion/v1/course_topics/${ENC}`);
  });

  it('lists threads with only the filters that are set', async () => {
    const call = await run('getThreads', { courseId: COURSE });
    expect(paramsOf(call.url)).toEqual({
      path: '/api/discussion/v1/threads/',
      params: {
        course_id: COURSE,
        page: '1',
        page_size: '20',
        requested_fields: 'profile_image',
      },
    });

    const filtered = await run('getThreads', {
      courseId: COURSE,
      page: 3,
      pageSize: 10,
      topicId: 'course',
      textSearch: 'hello',
      threadType: 'question',
      orderBy: 'vote_count',
      view: 'unread',
      following: true,
      author: 'ada',
      flagged: true,
      countFlagged: true,
    });
    expect(paramsOf(filtered.url).params).toEqual({
      course_id: COURSE,
      page: '3',
      page_size: '10',
      topic_id: 'course',
      text_search: 'hello',
      thread_type: 'question',
      order_by: 'vote_count',
      view: 'unread',
      following: 'true',
      author: 'ada',
      flagged: 'true',
      count_flagged: 'true',
      requested_fields: 'profile_image',
    });

    // Off flags are left out rather than sent as `false`.
    const off = await run('getThreads', { courseId: COURSE, following: false, flagged: false });
    expect(paramsOf(off.url).params).not.toHaveProperty('following');
    expect(paramsOf(off.url).params).not.toHaveProperty('flagged');
  });

  it('reads one thread with its profile images', async () => {
    const call = await run('getThread', { threadId: 'abc/1', courseId: COURSE });
    expect(paramsOf(call.url)).toEqual({
      path: '/api/discussion/v1/threads/abc%2F1/',
      params: { course_id: COURSE, requested_fields: 'profile_image' },
    });
  });

  it('creates a thread with the follow / anonymity defaults', async () => {
    const call = await run('createThread', {
      courseId: COURSE,
      topicId: 'course',
      type: 'discussion',
      title: 'Hi',
      rawBody: 'Body',
    });
    expect(call).toMatchObject({
      url: '/api/discussion/v1/threads/',
      method: 'POST',
      service: 'LMS',
      body: {
        course_id: COURSE,
        topic_id: 'course',
        type: 'discussion',
        title: 'Hi',
        raw_body: 'Body',
        following: true,
      },
    });
    expect(call.body).not.toHaveProperty('anonymous');
    expect(call.body).not.toHaveProperty('anonymous_to_peers');
    const explicit = await run('createThread', {
      courseId: COURSE,
      topicId: 'course',
      type: 'question',
      title: 'Hi',
      rawBody: 'Body',
      following: false,
      anonymous: true,
      anonymousToPeers: true,
    });
    expect(explicit.body).toMatchObject({
      type: 'question',
      following: false,
      anonymous: true,
      anonymous_to_peers: true,
    });
  });

  it('patches a thread as a JSON merge patch and refetches it and the list', async () => {
    await run('getThreads', { courseId: COURSE });
    await run('getThread', { threadId: 't1', courseId: COURSE });
    const call = await run('updateThread', { threadId: 't1', patch: { voted: true, read: true } });
    expect(call).toMatchObject({
      url: '/api/discussion/v1/threads/t1/',
      method: 'PATCH',
      service: 'LMS',
      isJson: false,
      headers: { 'Content-Type': 'application/merge-patch+json' },
    });
    expect(JSON.parse(call.body as string)).toEqual({ voted: true, read: true });
    await flush();
    expect(captured.filter((c) => c.url.startsWith('/api/discussion/v1/threads/?')).length).toBe(2);
    expect(captured.filter((c) => c.url.startsWith('/api/discussion/v1/threads/t1/?')).length).toBe(
      2,
    );
  });

  it('deletes a thread and refetches the list and the topic counts', async () => {
    await run('getCourseTopics', { courseId: COURSE });
    const call = await run('deleteThread', { threadId: 't1' });
    expect(call).toMatchObject({
      url: '/api/discussion/v1/threads/t1/',
      method: 'DELETE',
      service: 'LMS',
    });
    await flush();
    expect(captured.filter((c) => c.url === `/api/discussion/v1/course_topics/${ENC}`).length).toBe(
      2,
    );
  });

  it('lists responses, endorsed ones separately for question threads', async () => {
    const call = await run('getComments', { threadId: 't1' });
    expect(paramsOf(call.url)).toEqual({
      path: '/api/discussion/v1/comments/',
      params: {
        thread_id: 't1',
        page: '1',
        page_size: '20',
        requested_fields: 'profile_image',
      },
    });
    const endorsed = await run('getComments', {
      threadId: 't1',
      page: 2,
      pageSize: 5,
      endorsed: false,
      reverseOrder: true,
    });
    expect(paramsOf(endorsed.url).params).toEqual({
      thread_id: 't1',
      page: '2',
      page_size: '5',
      endorsed: 'false',
      reverse_order: 'true',
      requested_fields: 'profile_image',
    });
  });

  it('lists the replies under a response', async () => {
    const call = await run('getCommentReplies', { commentId: 'c1', page: 2, pageSize: 5 });
    expect(paramsOf(call.url)).toEqual({
      path: '/api/discussion/v1/comments/c1/',
      params: { page: '2', page_size: '5', requested_fields: 'profile_image' },
    });
  });

  it('creates responses and replies, refetching what they hang off', async () => {
    await run('getComments', { threadId: 't1' });
    await run('getCommentReplies', { commentId: 'c1' });
    const response = await run('createComment', { threadId: 't1', rawBody: 'Hi' });
    expect(response).toMatchObject({
      url: '/api/discussion/v1/comments/',
      method: 'POST',
      body: { thread_id: 't1', raw_body: 'Hi' },
    });
    expect(response.body).not.toHaveProperty('parent_id');
    await flush();
    expect(captured.filter((c) => c.url.includes('thread_id=t1')).length).toBe(2);

    const reply = await run('createComment', { threadId: 't1', rawBody: 'Yo', parentId: 'c1' });
    expect(reply.body).toEqual({ thread_id: 't1', raw_body: 'Yo', parent_id: 'c1' });
    await flush();
    expect(captured.filter((c) => c.url.startsWith('/api/discussion/v1/comments/c1/')).length).toBe(
      2,
    );
  });

  it('patches and deletes a comment', async () => {
    const patch = await run('updateComment', {
      commentId: 'c1',
      threadId: 't1',
      patch: { endorsed: true },
    });
    expect(patch).toMatchObject({
      url: '/api/discussion/v1/comments/c1/',
      method: 'PATCH',
      isJson: false,
      headers: { 'Content-Type': 'application/merge-patch+json' },
    });
    expect(JSON.parse(patch.body as string)).toEqual({ endorsed: true });

    const del = await run('deleteComment', { commentId: 'c1', threadId: 't1', parentId: 'p1' });
    expect(del).toMatchObject({ url: '/api/discussion/v1/comments/c1/', method: 'DELETE' });
  });

  it('lists learners, searchable and sortable', async () => {
    const learners = await run('getLearners', { courseId: COURSE });
    expect(paramsOf(learners.url)).toEqual({
      path: `/api/discussion/v1/courses/${ENC}/activity_stats/`,
      params: { page: '1', order_by: 'activity' },
    });
    const searched = await run('getLearners', {
      courseId: COURSE,
      page: 2,
      orderBy: 'recency',
      username: 'ada',
    });
    expect(paramsOf(searched.url).params).toEqual({
      page: '2',
      order_by: 'recency',
      username: 'ada',
    });
  });
});
