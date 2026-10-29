import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Mock iblFetchBaseQuery to avoid Node 25 + jsdom AbortSignal cross-realm
// incompatibility in fetchBaseQuery's Request constructor.
let capturedBaseQueryArgs: any[] = [];
vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...original,
    iblFetchBaseQuery: async (args: any) => {
      capturedBaseQueryArgs.push({ ...args, method: (args.method ?? 'GET').toUpperCase() });
      return { data: { name: 'Program' } };
    },
  };
});

import { SERVICES } from '@/lib/constants';
import { StudioSlice } from '../studio';

describe('StudioSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports StudioSlice API with correct reducerPath', () => {
    expect(StudioSlice).toBeDefined();
    expect(StudioSlice.reducerPath).toBe('StudioSlice');
  });

  it('has reducer function', () => {
    expect(StudioSlice.reducer).toBeDefined();
    expect(typeof StudioSlice.reducer).toBe('function');
  });

  it('has middleware function', () => {
    expect(StudioSlice.middleware).toBeDefined();
  });

  it('has endpoints defined', () => {
    expect(StudioSlice.endpoints).toBeDefined();
  });
});

describe('StudioSlice hooks exports', () => {
  it('exports useGetCoursesAdvancedSettingsQuery', async () => {
    const { useGetCoursesAdvancedSettingsQuery } = await import('../studio');
    expect(useGetCoursesAdvancedSettingsQuery).toBeDefined();
    expect(typeof useGetCoursesAdvancedSettingsQuery).toBe('function');
  });

  it('exports useLazyGetCoursesAdvancedSettingsQuery', async () => {
    const { useLazyGetCoursesAdvancedSettingsQuery } = await import('../studio');
    expect(useLazyGetCoursesAdvancedSettingsQuery).toBeDefined();
    expect(typeof useLazyGetCoursesAdvancedSettingsQuery).toBe('function');
  });

  it('exports useUpdateCoursesAdvancedSettingsMutation', async () => {
    const { useUpdateCoursesAdvancedSettingsMutation } = await import('../studio');
    expect(useUpdateCoursesAdvancedSettingsMutation).toBeDefined();
    expect(typeof useUpdateCoursesAdvancedSettingsMutation).toBe('function');
  });

  it('exports useGetProgramMetadataQuery', async () => {
    const { useGetProgramMetadataQuery } = await import('../studio');
    expect(useGetProgramMetadataQuery).toBeDefined();
    expect(typeof useGetProgramMetadataQuery).toBe('function');
  });

  it('exports useLazyGetProgramMetadataQuery', async () => {
    const { useLazyGetProgramMetadataQuery } = await import('../studio');
    expect(useLazyGetProgramMetadataQuery).toBeDefined();
    expect(typeof useLazyGetProgramMetadataQuery).toBe('function');
  });

  it('exports useUpdateProgramMetadataMutation', async () => {
    const { useUpdateProgramMetadataMutation } = await import('../studio');
    expect(useUpdateProgramMetadataMutation).toBeDefined();
    expect(typeof useUpdateProgramMetadataMutation).toBe('function');
  });
});

describe('StudioSlice endpoint structure', () => {
  it('getCoursesAdvancedSettings endpoint exists', () => {
    expect(StudioSlice.endpoints.getCoursesAdvancedSettings).toBeDefined();
  });

  it('updateCoursesAdvancedSettings endpoint exists', () => {
    expect(StudioSlice.endpoints.updateCoursesAdvancedSettings).toBeDefined();
  });

  it('getProgramMetadata endpoint exists', () => {
    expect(StudioSlice.endpoints.getProgramMetadata).toBeDefined();
  });

  it('updateProgramMetadata endpoint exists', () => {
    expect(StudioSlice.endpoints.updateProgramMetadata).toBeDefined();
  });
});

describe('StudioSlice endpoint query functions', () => {
  it('getCoursesAdvancedSettings has initiate function', () => {
    const endpoint = StudioSlice.endpoints.getCoursesAdvancedSettings as any;
    expect(endpoint).toBeDefined();
    expect(endpoint.initiate).toBeDefined();
    expect(typeof endpoint.initiate).toBe('function');
    expect(endpoint.name).toBe('getCoursesAdvancedSettings');
  });

  it('updateCoursesAdvancedSettings has initiate function', () => {
    const endpoint = StudioSlice.endpoints.updateCoursesAdvancedSettings as any;
    expect(endpoint).toBeDefined();
    expect(endpoint.initiate).toBeDefined();
    expect(typeof endpoint.initiate).toBe('function');
    expect(endpoint.name).toBe('updateCoursesAdvancedSettings');
  });

  it('getProgramMetadata has initiate function', () => {
    const endpoint = StudioSlice.endpoints.getProgramMetadata as any;
    expect(endpoint).toBeDefined();
    expect(endpoint.initiate).toBeDefined();
    expect(typeof endpoint.initiate).toBe('function');
    expect(endpoint.name).toBe('getProgramMetadata');
  });

  it('updateProgramMetadata has initiate function', () => {
    const endpoint = StudioSlice.endpoints.updateProgramMetadata as any;
    expect(endpoint).toBeDefined();
    expect(endpoint.initiate).toBeDefined();
    expect(typeof endpoint.initiate).toBe('function');
    expect(endpoint.name).toBe('updateProgramMetadata');
  });
});

describe('StudioSlice internal utils', () => {
  // Test that the slice internal utils are available for cache management
  it('has util methods for cache management', () => {
    expect(StudioSlice.util).toBeDefined();
    expect(StudioSlice.util.resetApiState).toBeDefined();
    expect(StudioSlice.util.invalidateTags).toBeDefined();
  });

  it('has internalActions for advanced usage', () => {
    expect(StudioSlice.internalActions).toBeDefined();
  });

  // Test that endpoint matchers exist
  it('getCoursesAdvancedSettings has matcher functions', () => {
    const endpoint = StudioSlice.endpoints.getCoursesAdvancedSettings;
    expect(endpoint.matchPending).toBeDefined();
    expect(endpoint.matchFulfilled).toBeDefined();
    expect(endpoint.matchRejected).toBeDefined();
  });

  it('updateCoursesAdvancedSettings has matcher functions', () => {
    const endpoint = StudioSlice.endpoints.updateCoursesAdvancedSettings;
    expect(endpoint.matchPending).toBeDefined();
    expect(endpoint.matchFulfilled).toBeDefined();
    expect(endpoint.matchRejected).toBeDefined();
  });

  it('getProgramMetadata has matcher functions', () => {
    const endpoint = StudioSlice.endpoints.getProgramMetadata;
    expect(endpoint.matchPending).toBeDefined();
    expect(endpoint.matchFulfilled).toBeDefined();
    expect(endpoint.matchRejected).toBeDefined();
  });

  it('updateProgramMetadata has matcher functions', () => {
    const endpoint = StudioSlice.endpoints.updateProgramMetadata;
    expect(endpoint.matchPending).toBeDefined();
    expect(endpoint.matchFulfilled).toBeDefined();
    expect(endpoint.matchRejected).toBeDefined();
  });

  it('endpoints have select function for creating selectors', () => {
    const endpoint = StudioSlice.endpoints.getCoursesAdvancedSettings as any;
    expect(endpoint.select).toBeDefined();
    expect(typeof endpoint.select).toBe('function');

    // The select function should return a selector when called with args
    const selector = endpoint.select({ course_id: 'test-course' });
    expect(selector).toBeDefined();
    expect(typeof selector).toBe('function');
  });
});

describe('StudioSlice query functions (executed via store dispatch)', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    capturedBaseQueryArgs = [];
    window.localStorage.setItem('userData', JSON.stringify({ user_nicename: 'jane' }));
    store = configureStore({
      reducer: { [StudioSlice.reducerPath]: StudioSlice.reducer },
      middleware: (getDefault) => getDefault().concat(StudioSlice.middleware),
    });
    setupListeners(store.dispatch);
  });

  it('getCoursesAdvancedSettings reads from Studio', async () => {
    await store.dispatch(
      (StudioSlice.endpoints.getCoursesAdvancedSettings as any).initiate({
        course_id: 'course-v1:Org+Run+1',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0]).toMatchObject({
      method: 'GET',
      url: '/api/contentstore/v0/advanced_settings/course-v1:Org+Run+1?fetch_all=0',
      service: SERVICES.STUDIO,
    });
  });

  it('updateCoursesAdvancedSettings PATCHes Studio with the settings', async () => {
    const advanced_settings = { display_name: { value: 'New' } };
    await store.dispatch(
      (StudioSlice.endpoints.updateCoursesAdvancedSettings as any).initiate({
        course_id: 'course-v1:Org+Run+1',
        advanced_settings,
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0]).toMatchObject({
      method: 'PATCH',
      url: '/api/contentstore/v0/advanced_settings/course-v1:Org+Run+1',
      body: advanced_settings,
      service: SERVICES.STUDIO,
    });
  });

  it('getProgramMetadata reads from DM and wraps the payload as formData', async () => {
    const result: any = await store.dispatch(
      (StudioSlice.endpoints.getProgramMetadata as any).initiate({
        programId: 'program-v1:Org+P 1',
        org: 'Org&Co',
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0]).toMatchObject({
      method: 'GET',
      url: '/api/catalog/metadata/program/?program_id=program-v1%3AOrg%2BP%201&org=Org%26Co&username=jane',
      service: SERVICES.DM,
    });
    expect(result.data).toEqual({
      formData: { name: 'Program', program_id: 'program-v1:Org+P 1', org: 'Org&Co' },
    });
  });

  it('getProgramMetadata sends an empty username when no user is stored', async () => {
    window.localStorage.removeItem('userData');
    await store.dispatch(
      (StudioSlice.endpoints.getProgramMetadata as any).initiate({ programId: 'p1', org: 'o1' }),
    );
    expect(capturedBaseQueryArgs[0].url).toBe(
      '/api/catalog/metadata/program/?program_id=p1&org=o1&username=',
    );
  });

  it('updateProgramMetadata POSTs through the Studio plugin with credentials', async () => {
    await store.dispatch(
      (StudioSlice.endpoints.updateProgramMetadata as any).initiate({
        programId: 'p1',
        org: 'o1',
        settings: { name: 'Renamed' },
      }),
    );
    expect(capturedBaseQueryArgs).toHaveLength(1);
    expect(capturedBaseQueryArgs[0]).toMatchObject({
      method: 'POST',
      url: '/api/ibl/catalog/metadata/program/settings/?program_id=p1&org=o1',
      body: { program_id: 'p1', org: 'o1', name: 'Renamed' },
      service: SERVICES.STUDIO_DIRECT,
      includeCredentials: true,
    });
  });
});
