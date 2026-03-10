'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  AnalyticsLayout,
  AnalyticsSettingsProvider,
  GroupsFilterDropdown,
  type GroupOption,
} from '@iblai/web-containers';
import { useLazyPlatformUserGroupsQuery } from '@iblai/data-layer';
import { usePathname, useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';

export default function AnalyticsLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);

  const [fetchGroups, { data: groupsData, isLoading: isLoadingGroups }] =
    useLazyPlatformUserGroupsQuery();

  const basePath = '/analytics';

  // Fetch groups on mount
  useEffect(() => {
    const tenantKey = getTenant();
    if (tenantKey) {
      fetchGroups({ platformKey: tenantKey });
    }
  }, [fetchGroups]);

  // Update groups state when data changes
  useEffect(() => {
    if (groupsData?.results) {
      setGroups(
        groupsData.results
          .filter((group) => group.name !== null)
          .map((group) => ({
            id: group.id,
            name: group.name as string,
          })),
      );
    }
  }, [groupsData]);

  const handleTabChange = (tabValue: string) => {
    const newPath = tabValue ? `${basePath}/${tabValue}` : basePath;
    router.push(newPath);
  };

  const groupsFilterDropdown = (
    <GroupsFilterDropdown
      groups={groups}
      selectedGroupIds={selectedGroupIds}
      onSelectionChange={setSelectedGroupIds}
      isLoading={isLoadingGroups}
      placeholder="Filter by Groups"
    />
  );

  return (
    <div className="mb-16 h-[calc(100%-50px)]">
      <AnalyticsSettingsProvider
        value={{ usergroupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined }}
      >
        <AnalyticsLayout
          currentPath={pathname}
          basePath={basePath}
          onTabChange={handleTabChange}
          activeTabClassName="!text-amber-600"
          beforeDataReports={groupsFilterDropdown}
        >
          {children}
        </AnalyticsLayout>
      </AnalyticsSettingsProvider>
    </div>
  );
}
