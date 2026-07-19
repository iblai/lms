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

import { CoursesSlice } from '../courses';

describe('CoursesSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports CoursesSlice API with correct reducerPath', () => {
    expect(CoursesSlice).toBeDefined();
    expect(CoursesSlice.reducerPath).toBe('CoursesSlice');
  });

  it('has reducer function', () => {
    expect(CoursesSlice.reducer).toBeDefined();
    expect(typeof CoursesSlice.reducer).toBe('function');
  });

  it('has middleware function', () => {
    expect(CoursesSlice.middleware).toBeDefined();
  });

  it('has endpoints defined', () => {
    expect(CoursesSlice.endpoints).toBeDefined();
  });
});

describe('CoursesSlice hooks exports', () => {
  it.each([
    'useGetRecommendedCoursesQuery',
    'useLazyGetRecommendedCoursesQuery',
    'useGetUserEnrolledCoursesQuery',
    'useLazyGetUserEnrolledCoursesQuery',
    'useGetUserAssignedCoursesQuery',
    'useLazyGetUserAssignedCoursesQuery',
  ])('exports %s', async (hookName) => {
    const mod = (await import('../courses')) as Record<string, unknown>;
    expect(mod[hookName]).toBeDefined();
    expect(typeof mod[hookName]).toBe('function');
  });
});

describe('CoursesSlice endpoint structure', () => {
  it.each(['getRecommendedCourses', 'getUserEnrolledCourses', 'getUserAssignedCourses'] as const)(
    '%s endpoint exists with matchers and initiate',
    (name) => {
      const endpoint = (CoursesSlice.endpoints as Record<string, any>)[name];
      expect(endpoint).toBeDefined();
      expect(endpoint.matchPending).toBeDefined();
      expect(endpoint.matchFulfilled).toBeDefined();
      expect(endpoint.matchRejected).toBeDefined();
      expect(endpoint.initiate).toBeDefined();
      expect(typeof endpoint.initiate).toBe('function');
      expect(endpoint.name).toBe(name);
    },
  );

  it('has util methods for cache management', () => {
    expect(CoursesSlice.util).toBeDefined();
    expect(CoursesSlice.util.resetApiState).toBeDefined();
    expect(CoursesSlice.util.invalidateTags).toBeDefined();
  });

  it('endpoints have select function for creating selectors', () => {
    const endpoint = CoursesSlice.endpoints.getRecommendedCourses as any;
    expect(endpoint.select).toBeDefined();
    expect(typeof endpoint.select).toBe('function');

    const selector = endpoint.select({ org: 'main', username: 'jane' });
    expect(selector).toBeDefined();
    expect(typeof selector).toBe('function');
  });
});

describe('CoursesSlice query functions (executed via store dispatch)', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    capturedBaseQueryArgs = [];

    store = configureStore({
      reducer: {
        [CoursesSlice.reducerPath]: CoursesSlice.reducer,
      },
      middleware: (getDefault) => getDefault().concat(CoursesSlice.middleware),
    });
    setupListeners(store.dispatch);
  });

  it('getRecommendedCourses builds the expected URL with serialized query params', async () => {
    await store.dispatch(
      (CoursesSlice.endpoints.getRecommendedCourses as any).initiate({
        org: 'main',
        username: 'jane',
        query: { limit: '5', offset: '10' },
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].method).toBe('GET');
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/search/orgs/main/users/jane/recommended/?limit=5&offset=10',
    );
  });

  it('getRecommendedCourses builds the expected URL without query params', async () => {
    await store.dispatch(
      (CoursesSlice.endpoints.getRecommendedCourses as any).initiate({
        org: 'main',
        username: 'jane',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe('/api/search/orgs/main/users/jane/recommended/?');
  });

  it('getUserEnrolledCourses builds the expected URL with serialized query params', async () => {
    await store.dispatch(
      (CoursesSlice.endpoints.getUserEnrolledCourses as any).initiate({
        username: 'jane',
        query: { page: '2' },
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/enrollment/courses/search/?username=jane&page=2',
    );
  });

  it('getUserEnrolledCourses builds the expected URL without query params', async () => {
    await store.dispatch(
      (CoursesSlice.endpoints.getUserEnrolledCourses as any).initiate({ username: 'jane' }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/enrollment/courses/search/?username=jane&',
    );
  });

  it('getUserAssignedCourses builds the expected URL with serialized query params', async () => {
    await store.dispatch(
      (CoursesSlice.endpoints.getUserAssignedCourses as any).initiate({
        user_id: '42',
        query: { status: 'active' },
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/suggestions/course/user/?user_id=42&status=active',
    );
  });

  it('getUserAssignedCourses builds the expected URL without query params', async () => {
    await store.dispatch(
      (CoursesSlice.endpoints.getUserAssignedCourses as any).initiate({ user_id: '42' }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe('/api/catalog/suggestions/course/user/?user_id=42&');
  });
});
