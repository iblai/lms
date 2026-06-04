'use client';

import { useEffect, useState } from 'react';
import { getTimeAgo, getUserName } from '@/utils/helpers';
import { useLazyGetNotificationsQuery } from '@/services/notifications';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { SkeletonNotificationMiniBox } from './skeleton-notification-mini-box';
import { DefaultEmptyBox } from './default-empty-box';
import { Notification } from '@/types/notifications';
import { UserAvatar } from './header/profile/user-avatar';
import { useTenantParam } from '@/hooks/use-tenant-param';

export function NotificationsDropdown() {
  const tenant = useTenantParam();
  const [getNotifications, { isLoading, isError }] = useLazyGetNotificationsQuery();
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  const handleFetchNotifications = async () => {
    try {
      const response = await getNotifications({
        platform_key: tenant,
        username: getUserName(),
      });
      if (isError) {
        throw new Error();
      }
      setNotifications(response?.data?.results || []);
      setFilteredNotifications(response?.data?.results || []);
    } catch (error) {
      setNotifications([]);
      setFilteredNotifications([]);
    }
  };

  useEffect(() => {
    handleFetchNotifications();
  }, []);

  useEffect(() => {
    if (Array(notifications) && notifications.length > 0) {
      if (showOnlyUnread) {
        setFilteredNotifications(
          notifications.filter((notification) => notification.status === 'UNREAD'),
        );
      } else {
        setFilteredNotifications(notifications);
      }
    }
  }, [showOnlyUnread]);

  return (
    <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-sm border border-gray-200 bg-white shadow-lg">
      <div className="flex flex-col border-b border-gray-200 p-4">
        <h3 className="mb-2 text-lg font-medium text-gray-700">Notifications</h3>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500">Only show unread</span>
          <button
            className={`relative inline-flex h-6 w-11 items-center rounded-sm transition-colors focus:outline-none ${
              showOnlyUnread ? 'bg-amber-500' : 'bg-gray-200'
            }`}
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-sm bg-white transition-transform ${
                showOnlyUnread ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      {((!isLoading && isError) ||
        (!isLoading && !isError && filteredNotifications.length === 0)) && (
        <DefaultEmptyBox message="There are no new notifications." />
      )}

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && <SkeletonMultiplier multiplier={6} Skeleton={SkeletonNotificationMiniBox} />}
        {!isLoading &&
          !isError &&
          filteredNotifications.length > 0 &&
          filteredNotifications.map((notification: Notification, index) => (
            <div
              key={'Notification ' + index}
              className="border-b border-gray-100 p-4 hover:bg-gray-50"
            >
              <div className="flex">
                <div className="mr-3 flex-shrink-0">
                  <UserAvatar />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {notification?.context?.template_data?.message_title || notification?.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {getTimeAgo(notification?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
