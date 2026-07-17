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
}));

const mockUseDiscover = vi.fn();
vi.mock('@/hooks/discover/use-discover', () => ({
  useDiscover: (args: any) => mockUseDiscover(args),
}));

vi.mock('@/components/discover-content-card', () => ({
  DiscoverContentCard: ({ content }: any) => (
    <div data-testid="discover-content-card">{content.name}</div>
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

import { HomeDiscoverRail } from '../home-discover-rail';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';

const makeContents = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ name: `Content ${i + 1}` }));

const mockHandleFormatContents = vi.fn((content: any) => content);

const discoverState = (overrides: Record<string, unknown> = {}) => ({
  contents: makeContents(3),
  contentsLoading: false,
  isError: false,
  handleFormatContents: mockHandleFormatContents,
  ...overrides,
});

describe('HomeDiscoverRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isDiscoverEnabled).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({ metadata: {} } as any);
    mockHandleFormatContents.mockImplementation((content: any) => content);
    mockUseDiscover.mockReturnValue(discoverState());
  });

  it('renders the Explore rail with a card per catalog item', () => {
    render(<HomeDiscoverRail />);
    expect(screen.getByRole('region', { name: 'Explore' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
    expect(screen.getAllByTestId('discover-content-card')).toHaveLength(3);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('requests the catalog with the rail limit', () => {
    render(<HomeDiscoverRail />);
    expect(mockUseDiscover).toHaveBeenCalledWith({ limit: 16 });
  });

  it('links "See More" to the tenant discover page', () => {
    render(<HomeDiscoverRail />);
    expect(screen.getByRole('link', { name: /See More/ })).toHaveAttribute(
      'href',
      '/platform/test-tenant/discover',
    );
  });

  it('passes each item through handleFormatContents before rendering', () => {
    mockHandleFormatContents.mockImplementation((content: any) => ({
      ...content,
      name: `${content.name} (formatted)`,
    }));
    render(<HomeDiscoverRail />);
    expect(mockHandleFormatContents).toHaveBeenCalledTimes(3);
    expect(screen.getByText('Content 2 (formatted)')).toBeInTheDocument();
  });

  it('caps the rail at 16 cards even when more items are returned', () => {
    mockUseDiscover.mockReturnValue(discoverState({ contents: makeContents(20) }));
    render(<HomeDiscoverRail />);
    expect(screen.getAllByTestId('discover-content-card')).toHaveLength(16);
    expect(screen.queryByText('Content 17')).not.toBeInTheDocument();
  });

  it('shows the skeleton grid (and no cards) while loading', () => {
    mockUseDiscover.mockReturnValue(discoverState({ contentsLoading: true, contents: [] }));
    render(<HomeDiscoverRail />);
    const skeletons = screen.getByTestId('skeleton-multiplier');
    expect(skeletons).toHaveAttribute('data-count', '16');
    expect(screen.getByTestId('course-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('discover-content-card')).not.toBeInTheDocument();
  });

  it('feeds the discover gate from the config flag and tenant metadata', () => {
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_discover_page: false },
    } as any);
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

  it('renders nothing when the catalog request errored', () => {
    mockUseDiscover.mockReturnValue(discoverState({ isError: true }));
    const { container } = render(<HomeDiscoverRail />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the catalog is empty', () => {
    mockUseDiscover.mockReturnValue(discoverState({ contents: [] }));
    const { container } = render(<HomeDiscoverRail />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when contents are missing entirely', () => {
    mockUseDiscover.mockReturnValue(discoverState({ contents: undefined }));
    const { container } = render(<HomeDiscoverRail />);
    expect(container).toBeEmptyDOMElement();
  });
});
