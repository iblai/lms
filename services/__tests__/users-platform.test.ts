import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Capture the args each endpoint builds instead of hitting fetch (jsdom's
// AbortSignal is rejected by undici's Request constructor on Node 25).
type Captured = { url: string; method: string; service?: string };
let captured: Captured[] = [];
vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...original,
    iblFetchBaseQuery: async (args: any) => {
      captured.push({
        url: args.url,
        method: (args.method ?? 'GET').toUpperCase(),
        service: args.service,
      });
      return { data: { ok: true } };
    },
  };
});

import { UserMetaDataSlice } from '../users';
import { PlatformSlice } from '../platform';
import { StudioSlice } from '../studio';

const makeStore = () =>
  configureStore({
    reducer: {
      [UserMetaDataSlice.reducerPath]: UserMetaDataSlice.reducer,
      [PlatformSlice.reducerPath]: PlatformSlice.reducer,
      [StudioSlice.reducerPath]: StudioSlice.reducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(
        UserMetaDataSlice.middleware,
        PlatformSlice.middleware,
        StudioSlice.middleware,
      ),
  });

describe('user, platform and program reads that moved to DM (iblai-platform#2707)', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    captured = [];
    window.localStorage.setItem('userData', JSON.stringify({ user_nicename: 'jane' }));
    store = makeStore();
  });

  it('reads the merged user profile from DM', async () => {
    await store.dispatch(UserMetaDataSlice.endpoints.getUserMetaData.initiate('jane'));
    expect(captured[0]).toEqual({
      url: '/api/core/users/metadata/proxy/?username=jane',
      method: 'GET',
      service: 'DM',
    });
  });

  it('uploads the profile image through the LMS service', async () => {
    await store.dispatch(
      UserMetaDataSlice.endpoints.uploadProfileImage.initiate({
        formData: new FormData(),
        username: 'jane',
      }),
    );
    expect(captured[0]).toMatchObject({
      url: '/api/user/v1/accounts/jane/image/',
      method: 'POST',
      service: 'LMS',
    });
  });

  it('lists the stored user’s platforms from DM', async () => {
    await store.dispatch(PlatformSlice.endpoints.getUserTenants.initiate(null));
    expect(captured[0]).toEqual({
      url: '/api/core/users/platforms/?username=jane',
      method: 'GET',
      service: 'DM',
    });
  });

  it('reads program metadata from DM and re-wraps it as formData', async () => {
    const result = await store.dispatch(
      StudioSlice.endpoints.getProgramMetadata.initiate({ programId: 'P1', org: 'acme' }),
    );
    expect(captured[0]).toEqual({
      url: '/api/catalog/metadata/program/?program_id=P1&org=acme&username=jane',
      method: 'GET',
      service: 'DM',
    });
    expect(result.data).toEqual({ formData: { ok: true, program_id: 'P1', org: 'acme' } });
  });

  it('still saves program metadata through the Studio plugin (gap B4)', async () => {
    await store.dispatch(
      StudioSlice.endpoints.updateProgramMetadata.initiate({
        programId: 'P1',
        org: 'acme',
        settings: { name: 'Program' },
      }),
    );
    expect(captured[0]).toEqual({
      url: '/api/ibl/catalog/metadata/program/settings/?program_id=P1&org=acme',
      method: 'POST',
      service: 'STUDIO_DIRECT',
    });
  });

  it('reads and writes advanced settings through the Studio service', async () => {
    await store.dispatch(
      StudioSlice.endpoints.getCoursesAdvancedSettings.initiate({ course_id: 'course-v1:a+b+c' }),
    );
    expect(captured[0]).toMatchObject({
      url: '/api/contentstore/v0/advanced_settings/course-v1:a+b+c?fetch_all=0',
      service: 'STUDIO',
    });
  });
});
