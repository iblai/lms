import { createApi } from '@reduxjs/toolkit/query/react';
import { NotificationCount, NotificationResponse } from '@/types/notifications';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const NotificationsSlice = createApi({
  reducerPath: 'NotificationsSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getNotificationsCount: builder.query<
      NotificationCount,
      { platform_key: string; username: string; query?: Record<string, any> }
    >({
      query: ({ platform_key, username, query }) => ({
        url: `api/notification/v1/orgs/${platform_key}/users/${username}/notifications-count/?${new URLSearchParams(
          query,
        ).toString()}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
    getNotifications: builder.query<
      NotificationResponse,
      { platform_key: string; username: string; query?: Record<string, any> }
    >({
      query: ({ platform_key, username, query }) => ({
        url: `api/notification/v1/orgs/${platform_key}/users/${username}/notifications/?${new URLSearchParams(
          query,
        ).toString()}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetNotificationsCountQuery,
  useLazyGetNotificationsCountQuery,
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
} = NotificationsSlice;
