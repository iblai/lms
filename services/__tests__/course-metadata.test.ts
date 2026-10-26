import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Mock iblFetchBaseQuery to avoid Node 25 + jsdom AbortSignal cross-realm
// incompatibility in fetchBaseQuery's Request constructor (undici rejects
// jsdom's AbortSignal with "Expected signal to be an instance of AbortSignal").
// We capture the query args directly instead of intercepting fetch.
let capturedBaseQueryArgs: Array<{ url: string; method: string; body?: unknown }> = [];
vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...original,
    iblFetchBaseQuery: async (args: any) => {
      capturedBaseQueryArgs.push({
        url: args.url,
        method: (args.method ?? 'GET').toUpperCase(),
        body: args.body,
      });
      return { data: { ok: true } };
    },
  };
});

import { COURSE_METADATA_CACHE_SECONDS } from '@/lib/constants';
import { CourseMetadataSlice } from '../course-metadata';

describe('CourseMetadataSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports CourseMetadataSlice API with correct reducerPath', () => {
    expect(CourseMetadataSlice).toBeDefined();
    expect(CourseMetadataSlice.reducerPath).toBe('CourseMetadataSlice');
  });

  it('has reducer function', () => {
    expect(CourseMetadataSlice.reducer).toBeDefined();
    expect(typeof CourseMetadataSlice.reducer).toBe('function');
  });

  it('has middleware function', () => {
    expect(CourseMetadataSlice.middleware).toBeDefined();
  });

  it('has endpoints defined', () => {
    expect(CourseMetadataSlice.endpoints).toBeDefined();
  });
});

describe('CourseMetadataSlice hooks exports', () => {
  it('exports useGetCourseMetaDataQuery', async () => {
    const { useGetCourseMetaDataQuery } = await import('../course-metadata');
    expect(useGetCourseMetaDataQuery).toBeDefined();
    expect(typeof useGetCourseMetaDataQuery).toBe('function');
  });

  it('exports useLazyGetCourseMetaDataQuery', async () => {
    const { useLazyGetCourseMetaDataQuery } = await import('../course-metadata');
    expect(useLazyGetCourseMetaDataQuery).toBeDefined();
    expect(typeof useLazyGetCourseMetaDataQuery).toBe('function');
  });

  it('exports useGetCourseCompletionOutlinesQuery', async () => {
    const { useGetCourseCompletionOutlinesQuery } = await import('../course-metadata');
    expect(useGetCourseCompletionOutlinesQuery).toBeDefined();
    expect(typeof useGetCourseCompletionOutlinesQuery).toBe('function');
  });

  it('exports useLazyGetCourseCompletionOutlinesQuery', async () => {
    const { useLazyGetCourseCompletionOutlinesQuery } = await import('../course-metadata');
    expect(useLazyGetCourseCompletionOutlinesQuery).toBeDefined();
    expect(typeof useLazyGetCourseCompletionOutlinesQuery).toBe('function');
  });

  it('exports useGetCourseEligibilityQuery', async () => {
    const { useGetCourseEligibilityQuery } = await import('../course-metadata');
    expect(useGetCourseEligibilityQuery).toBeDefined();
    expect(typeof useGetCourseEligibilityQuery).toBe('function');
  });

  it('exports useLazyGetCourseEligibilityQuery', async () => {
    const { useLazyGetCourseEligibilityQuery } = await import('../course-metadata');
    expect(useLazyGetCourseEligibilityQuery).toBeDefined();
    expect(typeof useLazyGetCourseEligibilityQuery).toBe('function');
  });

  it('exports useCreateCourseEnrollmentMutation', async () => {
    const { useCreateCourseEnrollmentMutation } = await import('../course-metadata');
    expect(useCreateCourseEnrollmentMutation).toBeDefined();
    expect(typeof useCreateCourseEnrollmentMutation).toBe('function');
  });

  it('exports useGetCourseProgressQuery', async () => {
    const { useGetCourseProgressQuery } = await import('../course-metadata');
    expect(useGetCourseProgressQuery).toBeDefined();
    expect(typeof useGetCourseProgressQuery).toBe('function');
  });

  it('exports useLazyGetCourseProgressQuery', async () => {
    const { useLazyGetCourseProgressQuery } = await import('../course-metadata');
    expect(useLazyGetCourseProgressQuery).toBeDefined();
    expect(typeof useLazyGetCourseProgressQuery).toBe('function');
  });

  it('exports useGetCourseCompletionQuery', async () => {
    const { useGetCourseCompletionQuery } = await import('../course-metadata');
    expect(useGetCourseCompletionQuery).toBeDefined();
    expect(typeof useGetCourseCompletionQuery).toBe('function');
  });

  it('exports useLazyGetCourseCompletionQuery', async () => {
    const { useLazyGetCourseCompletionQuery } = await import('../course-metadata');
    expect(useLazyGetCourseCompletionQuery).toBeDefined();
    expect(typeof useLazyGetCourseCompletionQuery).toBe('function');
  });

  it('exports useGetCourseBlockDetailsQuery', async () => {
    const { useGetCourseBlockDetailsQuery } = await import('../course-metadata');
    expect(useGetCourseBlockDetailsQuery).toBeDefined();
    expect(typeof useGetCourseBlockDetailsQuery).toBe('function');
  });

  it('exports useLazyGetCourseBlockDetailsQuery', async () => {
    const { useLazyGetCourseBlockDetailsQuery } = await import('../course-metadata');
    expect(useLazyGetCourseBlockDetailsQuery).toBeDefined();
    expect(typeof useLazyGetCourseBlockDetailsQuery).toBe('function');
  });
});

describe('CourseMetadataSlice endpoint structure', () => {
  it('getCourseMetaData endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.getCourseMetaData).toBeDefined();
  });

  it('getCourseCompletionOutlines endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.getCourseCompletionOutlines).toBeDefined();
  });

  it('getCourseEligibility endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.getCourseEligibility).toBeDefined();
  });

  it('createCourseEnrollment endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.createCourseEnrollment).toBeDefined();
  });

  it('getCourseProgress endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.getCourseProgress).toBeDefined();
  });

  it('getCourseCompletion endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.getCourseCompletion).toBeDefined();
  });

  it('getCourseBlockDetails endpoint exists', () => {
    expect(CourseMetadataSlice.endpoints.getCourseBlockDetails).toBeDefined();
  });
});

describe('CourseMetadataSlice endpoint matchers', () => {
  it.each([
    'getCourseMetaData',
    'getCourseCompletionOutlines',
    'getCourseEligibility',
    'createCourseEnrollment',
    'getCourseProgress',
    'getCourseCompletion',
    'getCourseBlockDetails',
  ] as const)('%s has matcher functions', (name) => {
    const endpoint = (CourseMetadataSlice.endpoints as Record<string, any>)[name];
    expect(endpoint.matchPending).toBeDefined();
    expect(endpoint.matchFulfilled).toBeDefined();
    expect(endpoint.matchRejected).toBeDefined();
  });

  it.each([
    'getCourseMetaData',
    'getCourseCompletionOutlines',
    'getCourseEligibility',
    'createCourseEnrollment',
    'getCourseProgress',
    'getCourseCompletion',
    'getCourseBlockDetails',
  ] as const)('%s has initiate function', (name) => {
    const endpoint = (CourseMetadataSlice.endpoints as Record<string, any>)[name];
    expect(endpoint.initiate).toBeDefined();
    expect(typeof endpoint.initiate).toBe('function');
    expect(endpoint.name).toBe(name);
  });
});

describe('CourseMetadataSlice internal utils', () => {
  it('has util methods for cache management', () => {
    expect(CourseMetadataSlice.util).toBeDefined();
    expect(CourseMetadataSlice.util.resetApiState).toBeDefined();
    expect(CourseMetadataSlice.util.invalidateTags).toBeDefined();
  });

  it('has internalActions for advanced usage', () => {
    expect(CourseMetadataSlice.internalActions).toBeDefined();
  });

  it('endpoints have select function for creating selectors', () => {
    const endpoint = CourseMetadataSlice.endpoints.getCourseMetaData as any;
    expect(endpoint.select).toBeDefined();
    expect(typeof endpoint.select).toBe('function');

    const selector = endpoint.select({ courseKey: 'test-course' });
    expect(selector).toBeDefined();
    expect(typeof selector).toBe('function');
  });
});

describe('CourseMetadataSlice query functions (executed via store dispatch)', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    capturedBaseQueryArgs = [];
    // The DM catalog endpoints take `username=<self>`, read from the stored user.
    window.localStorage.setItem('userData', JSON.stringify({ user_nicename: 'jane' }));

    store = configureStore({
      reducer: {
        [CourseMetadataSlice.reducerPath]: CourseMetadataSlice.reducer,
      },
      middleware: (getDefault) => getDefault().concat(CourseMetadataSlice.middleware),
    });
    setupListeners(store.dispatch);
  });

  it('getCourseMetaData merges DM public metadata with the edX course detail', async () => {
    const result = await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedBaseQueryArgs.map((call) => call.url)).toEqual([
      '/api/catalog/metadata/course-public/?course_id=course-v1%3AOrg%2BRun%2B1',
      '/api/courses/v1/courses/course-v1:Org+Run+1',
    ]);
    // Both mocked responses are `{ ok: true }`: the DM half is spread in and
    // the edX half is mapped onto the plugin's field names.
    expect(result.data).toMatchObject({ ok: true, course_key: 'course-v1:Org+Run+1', org: 'Org' });
  });

  it('getCourseMetaData keeps the anonymous read on the edX plugin endpoint', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({
        courseKey: 'course-v1:Org+Run+2',
        noAuth: true,
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].method).toBe('GET');
    expect(capturedBaseQueryArgs[0].url).toContain(
      '/api/ibl/v1/course_metadata?course_key=course-v1%3AOrg%2BRun%2B2',
    );
  });

  it('getCourseCompletionOutlines reads the outline from DM for the stored user', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseCompletionOutlines as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/enrollment/courses/completion/?username=jane&course_id=course-v1%3AOrg%2BRun%2B1&endpoint=outline',
    );
  });

  it('getCourseEligibility reads eligibility from DM for the stored user', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseEligibility as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/eligibility/courses/check/?username=jane&course_id=course-v1%3AOrg%2BRun%2B1',
    );
  });

  it('createCourseEnrollment performs a POST with the request body', async () => {
    const request = { course_details: { course_id: 'course-v1:Org+Run+1' } } as any;
    await store.dispatch(
      (CourseMetadataSlice.endpoints.createCourseEnrollment as any).initiate(request),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].method).toBe('POST');
    expect(capturedBaseQueryArgs[0].url).toContain('/api/enrollment/v1/enrollment');
    expect(capturedBaseQueryArgs[0].body).toEqual(request);
  });

  it('getCourseProgress builds the expected URL', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseProgress as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toContain('/api/course_home/progress/course-v1:Org+Run+1');
  });

  it('getCourseCompletion builds the expected URL with course and user id', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseCompletion as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
        userID: 42,
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toContain(
      '/api/catalog/milestones/completions/course/manage/?course_id=course-v1:Org+Run+1&user_id=42',
    );
  });

  it('getCourseBlockDetails builds the expected URL with encoded blockId and username', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseBlockDetails as any).initiate({
        blockId: 'block-v1:Org+Run+1+type@vertical+block@abc',
        username: 'jane doe',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toContain(
      '/api/courses/v2/blocks/block-v1%3AOrg%2BRun%2B1%2Btype%40vertical%2Bblock%40abc?username=jane%20doe&depth=all',
    );
  });
});

describe('getCourseMetaData caching', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    capturedBaseQueryArgs = [];
    store = configureStore({
      reducer: {
        [CourseMetadataSlice.reducerPath]: CourseMetadataSlice.reducer,
      },
      middleware: (getDefault) => getDefault().concat(CourseMetadataSlice.middleware),
    });
    setupListeners(store.dispatch);
  });

  it('keys the cache on the course alone, so `noAuth` variants share one entry', async () => {
    const courseKey = 'course-v1:Org+Run+1';
    // The card-artwork lookup and the course page historically sent different
    // arg shapes for the same course, which the default serializer turned into
    // two cache entries — and two requests.
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({ courseKey }),
    );
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({
        courseKey,
        noAuth: false,
      }),
    );
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({
        courseKey,
        noAuth: true,
      }),
    );

    // One cache entry, filled by a single read (DM metadata + edX detail).
    expect(capturedBaseQueryArgs).toHaveLength(2);
    const queries = (store.getState() as any)[CourseMetadataSlice.reducerPath].queries;
    expect(Object.keys(queries)).toEqual([
      'getCourseMetaData({"courseKey":"course-v1:Org+Run+1"})',
    ]);
  });

  it('still fetches a different course', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({ courseKey: 'a' }),
    );
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({ courseKey: 'b' }),
    );
    // Two reads of two requests each.
    expect(capturedBaseQueryArgs).toHaveLength(4);
  });

  it('keeps the payload well past the RTK Query 60s default', () => {
    expect(COURSE_METADATA_CACHE_SECONDS).toBeGreaterThan(60);
  });
});
