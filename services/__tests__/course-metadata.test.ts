import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
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
  let fetchMock: ReturnType<typeof vi.fn>;
  let capturedRequests: Array<{ url: string; method: string; body?: string | null }>;

  beforeEach(() => {
    capturedRequests = [];
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const isRequest = typeof Request !== 'undefined' && input instanceof Request;
      const url = typeof input === 'string' ? input : isRequest ? input.url : String(input);
      const method = (
        init?.method ??
        (isRequest ? input.method : undefined) ??
        'GET'
      ).toUpperCase();
      let body: string | null = null;
      if (init?.body) {
        body = String(init.body);
      } else if (isRequest) {
        try {
          body = await input.clone().text();
        } catch {
          body = null;
        }
      }
      capturedRequests.push({ url, method, body });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    store = configureStore({
      reducer: {
        [CourseMetadataSlice.reducerPath]: CourseMetadataSlice.reducer,
      },
      middleware: (getDefault) => getDefault().concat(CourseMetadataSlice.middleware),
    });
    setupListeners(store.dispatch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getCourseMetaData builds the expected URL with encoded courseKey', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseMetaData as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].method).toBe('GET');
    expect(capturedRequests[0].url).toContain(
      '/api/ibl/v1/course_metadata?course_key=course-v1%3AOrg%2BRun%2B1',
    );
  });

  it('getCourseCompletionOutlines builds the expected URL with encoded courseKey', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseCompletionOutlines as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].url).toContain(
      '/api/ibl/completion/course_outline/course-v1:Org+Run+1?course_id=course-v1%3AOrg%2BRun%2B1',
    );
  });

  it('getCourseEligibility builds the expected URL with encoded courseKey', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseEligibility as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].url).toContain(
      '/api/ibl/enrollment/enroll_status?course_id=course-v1%3AOrg%2BRun%2B1',
    );
  });

  it('createCourseEnrollment performs a POST with the request body', async () => {
    const request = { course_details: { course_id: 'course-v1:Org+Run+1' } } as any;
    await store.dispatch(
      (CourseMetadataSlice.endpoints.createCourseEnrollment as any).initiate(request),
    );
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].method).toBe('POST');
    expect(capturedRequests[0].url).toContain('/api/enrollment/v1/enrollment');
    expect(capturedRequests[0].body).toBe(JSON.stringify(request));
  });

  it('getCourseProgress builds the expected URL', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseProgress as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].url).toContain('/api/course_home/progress/course-v1:Org+Run+1');
  });

  it('getCourseCompletion builds the expected URL with course and user id', async () => {
    await store.dispatch(
      (CourseMetadataSlice.endpoints.getCourseCompletion as any).initiate({
        courseKey: 'course-v1:Org+Run+1',
        userID: 42,
      }),
    );
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].url).toContain(
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
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0].url).toContain(
      '/api/courses/v2/blocks/block-v1%3AOrg%2BRun%2B1%2Btype%40vertical%2Bblock%40abc?username=jane%20doe&depth=all',
    );
  });
});
