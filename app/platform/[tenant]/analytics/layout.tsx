'use client';

import type React from 'react';
import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  AnalyticsLayout,
  AnalyticsSettingsProvider,
  GroupsFilterDropdown,
  type GroupOption,
} from '@iblai/iblai-js/web-containers';
// @ts-ignore
import { useLazyPlatformUserGroupsQuery } from '@iblai/iblai-js/data-layer';
import { usePathname, useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';

export default function AnalyticsLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tenant = useTenantParam();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);

  const [fetchGroups, { data: groupsData, isLoading: isLoadingGroups }] =
    useLazyPlatformUserGroupsQuery();

  const basePath = `/platform/${tenant}/analytics`;

  // Fetch groups on mount
  useEffect(() => {
    if (tenant) {
      const onDataReportPage = pathname === `${basePath}/reports`;
      fetchGroups({
        platformKey: tenant,
        requiredAction: onDataReportPage ? 'Ibl.Analytics/Reports/read' : 'Ibl.Analytics/Core/read',
      });
    }
  }, [fetchGroups, pathname, tenant, basePath]);

  // Update groups state when data changes
  useEffect(() => {
    if (groupsData?.results) {
      setGroups(
        groupsData.results
          .filter((group: any) => group.name !== null)
          .map((group: any) => ({
            id: group.id,
            name: group.name as string,
          })),
      );
    }
  }, [groupsData]);

  const handleTabChange = useCallback(
    (tabValue: string) => {
      const newPath = tabValue ? `${basePath}/${tabValue}` : basePath;
      router.push(newPath);
    },
    [basePath, router],
  );

  const groupsFilterDropdown = useMemo(
    () => (
      <GroupsFilterDropdown
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        onSelectionChange={setSelectedGroupIds}
        isLoading={isLoadingGroups}
        placeholder="Filter by Groups"
      />
    ),
    [groups, selectedGroupIds, isLoadingGroups],
  );

  const analyticsSettingsValue = useMemo(
    () => ({ usergroupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined }),
    [selectedGroupIds],
  );

  return (
    <div className="h-full overflow-auto">
      <AnalyticsSettingsProvider value={analyticsSettingsValue}>
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
