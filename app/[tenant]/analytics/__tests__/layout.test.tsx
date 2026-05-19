import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetTenant = vi.fn(() => 'test-tenant');
vi.mock('@/utils/helpers', () => ({
  getTenant: () => mockGetTenant(),
}));

const mockFetchGroups = vi.fn();
const mockUseLazyPlatformUserGroupsQuery = vi.fn(() => [
  mockFetchGroups,
  { data: undefined, isLoading: false },
]);
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyPlatformUserGroupsQuery: () => mockUseLazyPlatformUserGroupsQuery(),
}));

const mockUsePathname = vi.fn(() => '/test-tenant/analytics');
const mockRouterPush = vi.fn();
const mockUseParams = vi.fn(() => ({ tenant: 'test-tenant' }));
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  AnalyticsLayout: ({
    children,
    beforeDataReports,
  }: {
    children: React.ReactNode;
    beforeDataReports?: React.ReactNode;
  }) => (
    <div data-testid="analytics-layout">
      <div data-testid="before-data-reports">{beforeDataReports}</div>
      {children}
    </div>
  ),
  AnalyticsSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="analytics-settings-provider">{children}</div>
  ),
  GroupsFilterDropdown: ({ groups, isLoading }: { groups: unknown[]; isLoading: boolean }) => (
    <div data-testid="groups-filter-dropdown">
      <span data-testid="groups-count">{groups.length}</span>
      <span data-testid="is-loading">{String(isLoading)}</span>
    </div>
  ),
}));

import AnalyticsLayoutWrapper from '../layout';

describe('AnalyticsLayoutWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTenant.mockReturnValue('test-tenant');
    mockUseParams.mockReturnValue({ tenant: 'test-tenant' });
    mockUsePathname.mockReturnValue('/test-tenant/analytics');
    mockUseLazyPlatformUserGroupsQuery.mockReturnValue([
      mockFetchGroups,
      { data: undefined, isLoading: false },
    ]);
  });

  it('renders children', () => {
    render(
      <AnalyticsLayoutWrapper>
        <span>test child</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });

  it('fetches groups with the Core read action on non-reports analytics pages', () => {
    mockUsePathname.mockReturnValue('/test-tenant/analytics');
    render(
      <AnalyticsLayoutWrapper>
        <span>content</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(mockFetchGroups).toHaveBeenCalledWith({
      platformKey: 'test-tenant',
      requiredAction: 'Ibl.Analytics/Core/read',
    });
  });

  it('fetches groups with the Core read action on sub-pages other than reports', () => {
    mockUsePathname.mockReturnValue('/test-tenant/analytics/courses');
    render(
      <AnalyticsLayoutWrapper>
        <span>content</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(mockFetchGroups).toHaveBeenCalledWith({
      platformKey: 'test-tenant',
      requiredAction: 'Ibl.Analytics/Core/read',
    });
  });

  it('fetches groups with the Reports read action on the data reports page', () => {
    mockUsePathname.mockReturnValue('/test-tenant/analytics/reports');
    render(
      <AnalyticsLayoutWrapper>
        <span>content</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(mockFetchGroups).toHaveBeenCalledWith({
      platformKey: 'test-tenant',
      requiredAction: 'Ibl.Analytics/Reports/read',
    });
  });

  it('re-fetches groups when pathname changes between reports and another tab', () => {
    mockUsePathname.mockReturnValue('/test-tenant/analytics');
    const { rerender } = render(
      <AnalyticsLayoutWrapper>
        <span>content</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(mockFetchGroups).toHaveBeenLastCalledWith({
      platformKey: 'test-tenant',
      requiredAction: 'Ibl.Analytics/Core/read',
    });

    mockUsePathname.mockReturnValue('/test-tenant/analytics/reports');
    rerender(
      <AnalyticsLayoutWrapper>
        <span>content</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(mockFetchGroups).toHaveBeenLastCalledWith({
      platformKey: 'test-tenant',
      requiredAction: 'Ibl.Analytics/Reports/read',
    });
  });

  it('does not fetch groups when there is no tenant key', () => {
    mockGetTenant.mockReturnValue('');
    mockUseParams.mockReturnValue({});
    render(
      <AnalyticsLayoutWrapper>
        <span>content</span>
      </AnalyticsLayoutWrapper>,
    );
    expect(mockFetchGroups).not.toHaveBeenCalled();
  });
});
