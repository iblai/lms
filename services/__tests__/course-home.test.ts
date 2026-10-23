import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Capture the args each endpoint builds instead of hitting fetch (jsdom's
// AbortSignal is rejected by undici's Request constructor on Node 25).
type Captured = { url: string; method: string; body?: unknown; service?: string };
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
      });
      return { data: { ok: true } };
    },
  };
});

import { CourseHomeSlice } from '../course-home';

const COURSE = 'course-v1:org+c+run';

const makeStore = () =>
  configureStore({
    reducer: { [CourseHomeSlice.reducerPath]: CourseHomeSlice.reducer },
    middleware: (getDefault) => getDefault().concat(CourseHomeSlice.middleware),
  });

describe('CourseHomeSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    captured = [];
    store = makeStore();
  });

  const run = async (endpoint: string, args: unknown) => {
    const before = captured.length;
    await store.dispatch(
      (CourseHomeSlice.endpoints as any)[endpoint].initiate(args, { forceRefetch: true }),
    );
    return captured[before];
  };

  it('is registered under its own reducer path', () => {
    expect(CourseHomeSlice.reducerPath).toBe('CourseHomeSlice');
  });

  it('reads the dates tab data off the course-home API', async () => {
    const call = await run('getCourseDates', { courseId: COURSE });
    expect(call).toMatchObject({
      url: `/api/course_home/dates/${COURSE}`,
      method: 'GET',
      service: 'LMS',
    });
  });

  it('reads the course-home metadata', async () => {
    const call = await run('getCourseHomeMeta', { courseId: COURSE });
    expect(call).toMatchObject({
      url: `/api/course_home/course_metadata/${COURSE}`,
      method: 'GET',
      service: 'LMS',
    });
  });

  it('posts a deadline reset tagged with the dates tab and refetches the dates', async () => {
    await run('getCourseDates', { courseId: COURSE });
    const call = await run('resetCourseDeadlines', { courseId: COURSE });
    expect(call).toMatchObject({
      url: '/api/course_experience/v1/reset_course_deadlines',
      method: 'POST',
      body: { course_key: COURSE, research_event_data: { location: 'dates-tab' } },
      service: 'LMS',
    });
    // Tag invalidation refetches the dates behind the mutation.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const datesCalls = captured.filter((c) => c.url === `/api/course_home/dates/${COURSE}`);
    expect(datesCalls.length).toBeGreaterThanOrEqual(2);
  });
});
