import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: { hideDiscoverTab: vi.fn(() => false) },
  },
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

vi.mock('@/utils/discover-visibility', () => ({
  isDiscoverEnabled: vi.fn(() => true),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({ metadata: {} })),
  isLoggedIn: vi.fn(() => true),
  LMS_DASHBOARD_COURSES_DISPLAY_SLUG: 'lms_dashboard_courses_display',
  // Mirrors the SDK helper: anything unrecognized falls back to catalog.
  resolveLmsDashboardCoursesDisplay: (value: unknown) =>
    ['catalog', 'enrolled', 'recommended'].includes(value as string) ? value : 'catalog',
}));

const mockUseDiscover = vi.fn();
vi.mock('@/hooks/discover/use-discover', () => ({
  useDiscover: (args: any) => mockUseDiscover(args),
  ENROLLMENT_FACET_SLUG: 'enrollment',
  ENROLLMENT_FACET_TERM: 'Enrolled',
  RECOMMENDED_FACET_TERM: 'Recommended',
}));

vi.mock('@/components/discover-content-card', () => ({
  DiscoverContentCard: ({ content }: any) => (
    <div data-testid="discover-content-card">{content.title}</div>
  ),
}));

vi.mock('@/components/course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier, Skeleton }: any) => (
    <div data-testid="skeleton-multiplier" data-count={multiplier}>
      <Skeleton />
    </div>
  ),
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="default-empty-box">{message}</div>,
}));

// Reads Redux (rbac) + localStorage + tenant metadata; rail tests render
// without providers.
vi.mock('@/components/no-courses-empty-box', () => ({
  NoCoursesEmptyBox: () => <div data-testid="no-courses-empty-box" />,
}));

import { HomeDiscoverRail } from '../home-discover-rail';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { useTenantMetadata, isLoggedIn } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';

const makeCards = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `card-${i + 1}`, title: `Content ${i + 1}` }));

const discoverState = (overrides: Record<string, unknown> = {}) => ({
  displayCards: makeCards(3),
  contentsLoading: false,
  facetsLoading: false,
  isError: false,
  catalogEmpty: false,
  enrolledOnly: false,
  recommendedOnly: false,
  enrollmentsLoading: false,
  recommendationsLoading: false,
  ...overrides,
});

/** Puts the tenant on a given `lms_dashboard_courses_display` value. */
const setDisplaySetting = (value?: string, extra: Record<string, unknown> = {}) =>
  vi.mocked(useTenantMetadata).mockReturnValue({
    metadata: { ...(value ? { lms_dashboard_courses_display: value } : {}), ...extra },
    isLoading: false,
  } as any);

describe('HomeDiscoverRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isDiscoverEnabled).mockReturnValue(true);
    vi.mocked(isLoggedIn).mockReturnValue(true);
    setDisplaySetting();
    mockUseDiscover.mockReturnValue(discoverState());
  });

  describe('catalog mode (the default)', () => {
    it('renders the Explore rail with a card per catalog item', () => {
      render(<HomeDiscoverRail />);
      expect(screen.getByRole('region', { name: 'Explore' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
      expect(screen.getAllByTestId('discover-content-card')).toHaveLength(3);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('requests the catalog with the rail limit and no seeded filter', () => {
      render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenCalledWith({ limit: 16, initialFacets: undefined });
    });

    it('links "See More" to the unfiltered tenant discover page', () => {
      render(<HomeDiscoverRail />);
      expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
        'href',
        '/platform/test-tenant/discover',
      );
    });

    it('caps the rail at 16 cards even when more items are returned', () => {
      mockUseDiscover.mockReturnValue(discoverState({ displayCards: makeCards(20) }));
      render(<HomeDiscoverRail />);
      expect(screen.getAllByTestId('discover-content-card')).toHaveLength(16);
      expect(screen.queryByText('Content 17')).not.toBeInTheDocument();
    });

    it('shows the skeleton grid (and no cards) while loading', () => {
      mockUseDiscover.mockReturnValue(discoverState({ contentsLoading: true, displayCards: [] }));
      render(<HomeDiscoverRail />);
      const skeletons = screen.getByTestId('skeleton-multiplier');
      expect(skeletons).toHaveAttribute('data-count', '16');
      expect(screen.getByTestId('course-card-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('discover-content-card')).not.toBeInTheDocument();
    });

    it('renders nothing when the catalog request errored', () => {
      mockUseDiscover.mockReturnValue(discoverState({ isError: true }));
      const { container } = render(<HomeDiscoverRail />);
      expect(container).toBeEmptyDOMElement();
    });

    it('shows only the no-courses box (no heading or See More) when the catalog is empty', () => {
      mockUseDiscover.mockReturnValue(discoverState({ displayCards: [] }));
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('no-courses-empty-box')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Explore' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /See More/ })).not.toBeInTheDocument();
      expect(screen.queryByTestId('discover-content-card')).not.toBeInTheDocument();
    });

    it('shows the no-courses box when cards are missing entirely', () => {
      mockUseDiscover.mockReturnValue(discoverState({ displayCards: undefined }));
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('no-courses-empty-box')).toBeInTheDocument();
    });
  });

  describe('enrolled mode', () => {
    beforeEach(() => {
      setDisplaySetting('enrolled');
      mockUseDiscover.mockReturnValue(discoverState({ enrolledOnly: true }));
    });

    it('seeds the Enrolled access facet', () => {
      render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenCalledWith({
        limit: 16,
        initialFacets: { enrollment: ['Enrolled'] },
      });
    });

    it('renders the enrolled heading and carries the filter into "See More"', () => {
      render(<HomeDiscoverRail />);
      expect(screen.getByRole('heading', { name: 'My Courses' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
        'href',
        '/platform/test-tenant/discover?enrolled=true',
      );
    });

    it('waits on the enrollments request, not just the catalog search', () => {
      mockUseDiscover.mockReturnValue(
        discoverState({ enrolledOnly: true, enrollmentsLoading: true, displayCards: [] }),
      );
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
      expect(screen.queryByTestId('default-empty-box')).not.toBeInTheDocument();
    });

    it('keeps the rail up when the catalog search errors — its cards come from the user endpoints', () => {
      mockUseDiscover.mockReturnValue(discoverState({ enrolledOnly: true, isError: true }));
      render(<HomeDiscoverRail />);
      expect(screen.getByRole('heading', { name: 'My Courses' })).toBeInTheDocument();
      expect(screen.getAllByTestId('discover-content-card')).toHaveLength(3);
    });

    it('offers a way into the catalog when the user has no enrollments yet', () => {
      mockUseDiscover.mockReturnValue(discoverState({ enrolledOnly: true, displayCards: [] }));
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('default-empty-box')).toHaveTextContent(
        'No enrolled content found',
      );
      expect(screen.getByRole('heading', { name: 'My Courses' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See More/ })).toBeInTheDocument();
      expect(screen.queryByTestId('no-courses-empty-box')).not.toBeInTheDocument();
    });

    it('falls back to the no-courses box when the catalog itself is empty', () => {
      mockUseDiscover.mockReturnValue(
        discoverState({ enrolledOnly: true, displayCards: [], catalogEmpty: true }),
      );
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('no-courses-empty-box')).toBeInTheDocument();
      expect(screen.queryByTestId('default-empty-box')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /See More/ })).not.toBeInTheDocument();
    });

    it('holds the empty state until the catalog probe resolves', () => {
      mockUseDiscover.mockReturnValue(
        discoverState({ enrolledOnly: true, displayCards: [], facetsLoading: true }),
      );
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
      expect(screen.queryByTestId('default-empty-box')).not.toBeInTheDocument();
      expect(screen.queryByTestId('no-courses-empty-box')).not.toBeInTheDocument();
    });
  });

  describe('recommended mode', () => {
    beforeEach(() => {
      setDisplaySetting('recommended');
      mockUseDiscover.mockReturnValue(discoverState({ recommendedOnly: true }));
    });

    it('seeds the Recommended access facet', () => {
      render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenCalledWith({
        limit: 16,
        initialFacets: { enrollment: ['Recommended'] },
      });
    });

    it('renders the recommended heading and carries the filter into "See More"', () => {
      render(<HomeDiscoverRail />);
      expect(screen.getByRole('heading', { name: 'Recommended for You' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
        'href',
        '/platform/test-tenant/discover?recommended=true',
      );
    });

    it('waits on the recommendations request', () => {
      mockUseDiscover.mockReturnValue(
        discoverState({ recommendedOnly: true, recommendationsLoading: true, displayCards: [] }),
      );
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
    });

    it('reads the heading off the hook, so a declined mode reverts to Explore', () => {
      // `useDiscover` refuses the Recommended term when recommendations are
      // hidden for the deploy and serves the catalog instead.
      mockUseDiscover.mockReturnValue(discoverState({ recommendedOnly: false }));
      render(<HomeDiscoverRail />);
      expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
        'href',
        '/platform/test-tenant/discover',
      );
    });
  });

  describe('mode resolution', () => {
    // An unset setting comes back as `null` (key present, no value) or as a
    // missing key; either way the rail serves the catalog.
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an empty string', ''],
      ['an unrecognized value', 'something-else'],
    ])('falls back to the catalog when the setting is %s', (_label, value) => {
      vi.mocked(useTenantMetadata).mockReturnValue({
        metadata: { lms_dashboard_courses_display: value },
        isLoading: false,
      } as any);
      render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenCalledWith({ limit: 16, initialFacets: undefined });
      expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
        'href',
        '/platform/test-tenant/discover',
      );
    });

    it('falls back to the catalog when tenant metadata is absent entirely', () => {
      vi.mocked(useTenantMetadata).mockReturnValue({
        metadata: undefined,
        isLoading: false,
      } as any);
      render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenCalledWith({ limit: 16, initialFacets: undefined });
      expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
    });

    it('serves the catalog to logged-out visitors even when the tenant asks for enrolled', () => {
      setDisplaySetting('enrolled');
      vi.mocked(isLoggedIn).mockReturnValue(false);
      render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenCalledWith({ limit: 16, initialFacets: undefined });
    });

    it('holds on skeletons until the setting has loaded, so the mode is settled before mount', () => {
      vi.mocked(useTenantMetadata).mockReturnValue({ metadata: undefined, isLoading: true } as any);
      render(<HomeDiscoverRail />);
      expect(screen.getByTestId('skeleton-multiplier')).toHaveAttribute('data-count', '16');
      expect(mockUseDiscover).not.toHaveBeenCalled();
    });

    it('switches mode when the setting changes, with no page reload', () => {
      const { rerender } = render(<HomeDiscoverRail />);
      expect(mockUseDiscover).toHaveBeenLastCalledWith({ limit: 16, initialFacets: undefined });
      expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();

      // The admin saves a new value; `updateTenantMetadata` invalidates the
      // metadata query, so the hook hands back the new setting in place.
      setDisplaySetting('recommended');
      mockUseDiscover.mockReturnValue(discoverState({ recommendedOnly: true }));
      rerender(<HomeDiscoverRail />);

      // Re-seeded, which only happens on a fresh mount of the inner rail.
      expect(mockUseDiscover).toHaveBeenLastCalledWith({
        limit: 16,
        initialFacets: { enrollment: ['Recommended'] },
      });
      expect(screen.getByRole('heading', { name: 'Recommended for You' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
        'href',
        '/platform/test-tenant/discover?recommended=true',
      );
    });
  });

  describe('discover gate', () => {
    it('feeds the discover gate from the config flag and tenant metadata', () => {
      vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
      setDisplaySetting(undefined, { enable_discover_page: false });
      render(<HomeDiscoverRail />);
      expect(vi.mocked(isDiscoverEnabled)).toHaveBeenCalledWith({
        hideDiscoverTab: true,
        enableDiscoverPage: false,
      });
    });

    it('renders nothing when Discover is disabled for the tenant', () => {
      vi.mocked(isDiscoverEnabled).mockReturnValue(false);
      const { container } = render(<HomeDiscoverRail />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
