import { SkillsSlice } from '@/services/skills';
import { CredentialsSlice } from '@/services/credentials';
import { PerLearnerSlice } from '@/services/perlearner';
import { CoursesSlice } from '@/services/courses';
import { UserMetaDataSlice } from '@/services/users';
import { configureStore } from '@reduxjs/toolkit';
import { PlatformSlice } from '@/services/platform';
import { CourseMetadataSlice } from '@/services/course-metadata';
import { CatalogSlice } from '@/services/catalog';
// @ts-ignore
import {
  skillsMiddleware,
  skillsReducer,
  authApiSlice,
  auditLogsApiSlice,
  searchApiSlice,
  customAiSearchApiSlice,
} from '@iblai/iblai-js/data-layer';
import { CATALOG_CACHE_SECONDS } from '@/lib/constants';
// @ts-ignore
import { monetizationSlice } from '@iblai/iblai-js/web-utils';
import { CareerSlice } from '@/services/career';
import { NotificationsSlice } from '@/services/notifications';
import { EdxSSOSlice } from '@/services/edx-sso';
import { CoreSlice } from '@/services/core';
import { rbacSlice } from '@/features/rbac';
import { tenantSlice } from '@/features/tenant';
import { mentorSlice } from '@/features/mentor';
import { StudioSlice } from '@/services/studio';

// The catalog search and recommendations power Home's Explore rail and the
// Discover page — keep their caches warm past the RTK Query 60s default so
// returning to those pages renders instantly instead of refetching behind
// a loader.
searchApiSlice.enhanceEndpoints({
  endpoints: {
    getPersonnalizedSearch: { keepUnusedDataFor: CATALOG_CACHE_SECONDS },
    getCatalogSearch: { keepUnusedDataFor: CATALOG_CACHE_SECONDS },
  },
});
customAiSearchApiSlice.enhanceEndpoints({
  endpoints: {
    getRecommendationsAiSearch: { keepUnusedDataFor: CATALOG_CACHE_SECONDS },
  },
});

export const store = configureStore({
  reducer: {
    [SkillsSlice.reducerPath]: SkillsSlice.reducer,
    [CredentialsSlice.reducerPath]: CredentialsSlice.reducer,
    [PerLearnerSlice.reducerPath]: PerLearnerSlice.reducer,
    [CoursesSlice.reducerPath]: CoursesSlice.reducer,
    [UserMetaDataSlice.reducerPath]: UserMetaDataSlice.reducer,
    [PlatformSlice.reducerPath]: PlatformSlice.reducer,
    [CourseMetadataSlice.reducerPath]: CourseMetadataSlice.reducer,
    [CatalogSlice.reducerPath]: CatalogSlice.reducer,
    [CareerSlice.reducerPath]: CareerSlice.reducer,
    [NotificationsSlice.reducerPath]: NotificationsSlice.reducer,
    [EdxSSOSlice.reducerPath]: EdxSSOSlice.reducer,
    [CoreSlice.reducerPath]: CoreSlice.reducer,
    [rbacSlice.reducerPath]: rbacSlice.reducer,
    [tenantSlice.reducerPath]: tenantSlice.reducer,
    mentor: mentorSlice.reducer,
    [StudioSlice.reducerPath]: StudioSlice.reducer,
    monetization: monetizationSlice.reducer,
    [authApiSlice.reducerPath]: authApiSlice.reducer,
    [auditLogsApiSlice.reducerPath]: auditLogsApiSlice.reducer,
    ...skillsReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const additionalMiddleware = [
      SkillsSlice.middleware,
      CredentialsSlice.middleware,
      PerLearnerSlice.middleware,
      CoursesSlice.middleware,
      UserMetaDataSlice.middleware,
      PlatformSlice.middleware,
      CourseMetadataSlice.middleware,
      CatalogSlice.middleware,
      CareerSlice.middleware,
      NotificationsSlice.middleware,
      EdxSSOSlice.middleware,
      CoreSlice.middleware,
      StudioSlice.middleware,
      authApiSlice.middleware,
      auditLogsApiSlice.middleware,
      ...skillsMiddleware,
    ];
    return getDefaultMiddleware().concat(additionalMiddleware);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
