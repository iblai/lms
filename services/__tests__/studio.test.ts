import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudioSlice } from '../studio';

// Don't mock the module - test the actual slice
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
