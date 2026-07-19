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

import { CatalogSlice } from '../catalog';

describe('CatalogSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports CatalogSlice API with correct reducerPath', () => {
    expect(CatalogSlice).toBeDefined();
    expect(CatalogSlice.reducerPath).toBe('CatalogSlice');
  });

  it('has reducer function', () => {
    expect(CatalogSlice.reducer).toBeDefined();
    expect(typeof CatalogSlice.reducer).toBe('function');
  });

  it('has middleware function', () => {
    expect(CatalogSlice.middleware).toBeDefined();
  });

  it('has endpoints defined', () => {
    expect(CatalogSlice.endpoints).toBeDefined();
  });
});

describe('CatalogSlice hooks exports', () => {
  it.each([
    'useGetUserSkillsPointQuery',
    'useLazyGetUserSkillsPointQuery',
    'useGetUserCatalogPathwaysQuery',
    'useLazyGetUserCatalogPathwaysQuery',
    'useGetUserAssignedPathwaysQuery',
    'useLazyGetUserAssignedPathwaysQuery',
    'useGetUserEnrolledPathwaysQuery',
    'useLazyGetUserEnrolledPathwaysQuery',
    'useGetUserEnrolledProgramsQuery',
    'useLazyGetUserEnrolledProgramsQuery',
    'useGetAssignedProgramsQuery',
    'useLazyGetAssignedProgramsQuery',
  ])('exports %s', async (hookName) => {
    const mod = (await import('../catalog')) as Record<string, unknown>;
    expect(mod[hookName]).toBeDefined();
    expect(typeof mod[hookName]).toBe('function');
  });
});

describe('CatalogSlice endpoint structure', () => {
  it.each([
    'getUserSkillsPoint',
    'getUserEnrolledPrograms',
    'getUserCatalogPathways',
    'getUserAssignedPathways',
    'getUserEnrolledPathways',
    'getAssignedPrograms',
  ] as const)('%s endpoint exists with matchers and initiate', (name) => {
    const endpoint = (CatalogSlice.endpoints as Record<string, any>)[name];
    expect(endpoint).toBeDefined();
    expect(endpoint.matchPending).toBeDefined();
    expect(endpoint.matchFulfilled).toBeDefined();
    expect(endpoint.matchRejected).toBeDefined();
    expect(endpoint.initiate).toBeDefined();
    expect(typeof endpoint.initiate).toBe('function');
    expect(endpoint.name).toBe(name);
  });

  it('has util methods for cache management', () => {
    expect(CatalogSlice.util).toBeDefined();
    expect(CatalogSlice.util.resetApiState).toBeDefined();
    expect(CatalogSlice.util.invalidateTags).toBeDefined();
  });

  it('endpoints have select function for creating selectors', () => {
    const endpoint = CatalogSlice.endpoints.getUserSkillsPoint as any;
    expect(endpoint.select).toBeDefined();
    expect(typeof endpoint.select).toBe('function');

    const selector = endpoint.select({ username: 'jane', platform_key: 'main' });
    expect(selector).toBeDefined();
    expect(typeof selector).toBe('function');
  });
});

describe('CatalogSlice query functions (executed via store dispatch)', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    capturedBaseQueryArgs = [];

    store = configureStore({
      reducer: {
        [CatalogSlice.reducerPath]: CatalogSlice.reducer,
      },
      middleware: (getDefault) => getDefault().concat(CatalogSlice.middleware),
    });
    setupListeners(store.dispatch);
  });

  it('getUserSkillsPoint builds the expected URL', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getUserSkillsPoint as any).initiate({
        username: 'jane',
        platform_key: 'main',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].method).toBe('GET');
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/milestones/skill_points/user/?username=jane&platform_key=main',
    );
  });

  it('getUserEnrolledPrograms defaults include_default_platform to 1', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getUserEnrolledPrograms as any).initiate({
        username: 'jane',
        platform_key: 'main',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/enrollment/programs/?username=jane&platform_key=main&include_default_platform=1',
    );
  });

  it('getUserEnrolledPrograms honors an explicit include_default_platform of 0', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getUserEnrolledPrograms as any).initiate({
        username: 'jane',
        platform_key: 'main',
        include_default_platform: 0,
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/enrollment/programs/?username=jane&platform_key=main&include_default_platform=0',
    );
  });

  it('getUserCatalogPathways builds the expected URL', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getUserCatalogPathways as any).initiate({
        username: 'jane',
        platform_key: 'main',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/pathways/?username=jane&platform_key=main',
    );
  });

  it('getUserAssignedPathways builds the expected URL with user_id', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getUserAssignedPathways as any).initiate({ user_id: 42 }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe('/api/catalog/suggestions/pathway/user/?user_id=42');
  });

  it('getUserEnrolledPathways builds the expected URL with username', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getUserEnrolledPathways as any).initiate({ username: 'jane' }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe('/api/catalog/enrollment/pathways/?username=jane');
  });

  it('getAssignedPrograms builds the expected URL with user_id', async () => {
    await store.dispatch(
      (CatalogSlice.endpoints.getAssignedPrograms as any).initiate({ user_id: 42 }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0].url).toBe('/api/catalog/suggestions/program/user/?user_id=42');
  });
});
