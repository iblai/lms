import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useSearchParams: vi.fn(() => ({
    get: mockGet,
  })),
}));

// Mock hooks and components
const mockSetSelectedFacets = vi.fn();
const mockHandleSelectFacets = vi.fn();
const mockSetPage = vi.fn();

vi.mock('@/hooks/discover/use-discover', () => ({
  ENROLLMENT_FACET_SLUG: 'enrollment',
  RECOMMENDED_FACET_SLUG: 'recommended',
  useDiscover: vi.fn(() => ({
    contents: [],
    facets: [],
    contentsLoading: false,
    facetsLoading: false,
    isError: false,
    catalogEmpty: false,
    handleToggleFacet: vi.fn(),
    selectedFacets: {},
    isFacetTermSelected: vi.fn(),
    handleSelectFacets: mockHandleSelectFacets,
    handleFormatContents: vi.fn((c: any) => c),
    pagination: { total_pages: 1, count: 0 },
    setPage: mockSetPage,
    handleFilterFacets: vi.fn(),
    filteredFacets: [],
    setSelectedFacets: mockSetSelectedFacets,
    displayCards: [],
    enrolledOnly: false,
    enrollmentsLoading: false,
    recommendedOnly: false,
    recommendationsLoading: false,
  })),
}));

vi.mock('@/components/course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/discover-content-card', () => ({
  DiscoverContentCard: ({ content }: any) => (
    <div data-testid="discover-content-card">{content?.title}</div>
  ),
}));

vi.mock('react-paginate', () => ({
  default: ({ onPageChange }: any) => (
    <div data-testid="paginate">
      <button data-testid="page-btn" onClick={() => onPageChange({ selected: 1 })}>
        Page 2
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/discover-facets-filter', () => ({
  DiscoverFacetsFilter: () => <div data-testid="facets-filter" />,
}));

vi.mock('@/components/discover-filter-drawer', () => ({
  DiscoverFilterDrawer: () => <div data-testid="filter-drawer" />,
}));

// Reads Redux (rbac) + localStorage + tenant metadata; page tests render
// without providers.
vi.mock('@/components/no-courses-empty-box', () => ({
  NoCoursesEmptyBox: () => <div data-testid="no-courses-empty-box" />,
}));

import DiscoverPage from '../page';
import { useDiscover } from '@/hooks/discover/use-discover';

/** The default hook state with overrides — for tests that vary one axis. */
const discoverState = (overrides: Record<string, any> = {}) =>
  ({
    contents: [],
    facets: [],
    contentsLoading: false,
    facetsLoading: false,
    isError: false,
    catalogEmpty: false,
    handleToggleFacet: vi.fn(),
    selectedFacets: {},
    isFacetTermSelected: vi.fn(),
    handleSelectFacets: mockHandleSelectFacets,
    handleFormatContents: vi.fn((c: any) => c),
    pagination: { total_pages: 1, count: 0 },
    setPage: mockSetPage,
    handleFilterFacets: vi.fn(),
    filteredFacets: [],
    setSelectedFacets: mockSetSelectedFacets,
    displayCards: [],
    enrolledOnly: false,
    enrollmentsLoading: false,
    recommendedOnly: false,
    recommendationsLoading: false,
    ...overrides,
  }) as any;

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('renders no page titles (the title lives in the navbar)', () => {
    render(<DiscoverPage />);

    expect(screen.queryByText('Featured Learning Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore Content')).not.toBeInTheDocument();
  });

  it('shows the no-courses box when the catalog is empty with no active filters', () => {
    render(<DiscoverPage />);

    expect(screen.getByTestId('no-courses-empty-box')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('shows the no-courses box instead of "No enrolled content found" when the catalog is globally empty', () => {
    vi.mocked(useDiscover).mockReturnValue(
      discoverState({
        catalogEmpty: true,
        enrolledOnly: true,
        selectedFacets: { enrollment: ['Enrolled'] },
      }),
    );

    render(<DiscoverPage />);

    expect(screen.getByTestId('no-courses-empty-box')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('shows the no-courses box when the catalog is globally empty with other filters applied', () => {
    vi.mocked(useDiscover).mockReturnValue(
      discoverState({
        catalogEmpty: true,
        selectedFacets: { subject: ['Math'] },
      }),
    );

    render(<DiscoverPage />);

    expect(screen.getByTestId('no-courses-empty-box')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('keeps "No enrolled content found" when filters match nothing but the catalog has content', () => {
    vi.mocked(useDiscover).mockReturnValue(
      discoverState({
        catalogEmpty: false,
        enrolledOnly: true,
        selectedFacets: { enrollment: ['Enrolled'] },
      }),
    );

    render(<DiscoverPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No enrolled content found.');
    expect(screen.queryByTestId('no-courses-empty-box')).not.toBeInTheDocument();
  });

  it('defers the empty state until the catalog probe resolves', () => {
    vi.mocked(useDiscover).mockReturnValue(discoverState({ facetsLoading: true }));

    render(<DiscoverPage />);

    expect(screen.queryByTestId('no-courses-empty-box')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('shows empty box on error', () => {
    vi.mocked(useDiscover).mockReturnValue({
      contents: [],
      facets: [],
      contentsLoading: false,
      facetsLoading: false,
      isError: true,
      handleToggleFacet: vi.fn(),
      selectedFacets: {},
      isFacetTermSelected: vi.fn(),
      handleSelectFacets: mockHandleSelectFacets,
      handleFormatContents: vi.fn((c: any) => c),
      pagination: { total_pages: 1, count: 0 },
      setPage: mockSetPage,
      handleFilterFacets: vi.fn(),
      filteredFacets: [],
      setSelectedFacets: mockSetSelectedFacets,
      displayCards: [],
      enrolledOnly: false,
      enrollmentsLoading: false,
    } as any);

    render(<DiscoverPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No content found.');
    expect(screen.queryByTestId('no-courses-empty-box')).not.toBeInTheDocument();
  });

  it('shows skeletons when loading', () => {
    vi.mocked(useDiscover).mockReturnValue({
      contents: [],
      facets: [],
      contentsLoading: true,
      facetsLoading: false,
      isError: false,
      handleToggleFacet: vi.fn(),
      selectedFacets: {},
      isFacetTermSelected: vi.fn(),
      handleSelectFacets: mockHandleSelectFacets,
      handleFormatContents: vi.fn((c: any) => c),
      pagination: { total_pages: 1, count: 0 },
      setPage: mockSetPage,
      handleFilterFacets: vi.fn(),
      filteredFacets: [],
      setSelectedFacets: mockSetSelectedFacets,
      displayCards: [],
      enrolledOnly: false,
      enrollmentsLoading: false,
    } as any);

    render(<DiscoverPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders content cards when contents are available', () => {
    vi.mocked(useDiscover).mockReturnValue({
      contents: [] as any,
      facets: [],
      contentsLoading: false,
      facetsLoading: false,
      isError: false,
      handleToggleFacet: vi.fn(),
      selectedFacets: {},
      isFacetTermSelected: vi.fn(),
      handleSelectFacets: mockHandleSelectFacets,
      handleFormatContents: vi.fn((c: any) => c),
      pagination: { total_pages: 2, count: 24 },
      setPage: mockSetPage,
      handleFilterFacets: vi.fn(),
      filteredFacets: [],
      setSelectedFacets: mockSetSelectedFacets,
      displayCards: [
        { title: 'Course 1', id: 'c1' },
        { title: 'Course 2', id: 'c2' },
      ],
      enrolledOnly: false,
      enrollmentsLoading: false,
    } as any);

    render(<DiscoverPage />);

    expect(screen.getAllByTestId('discover-content-card')).toHaveLength(2);
  });

  it('handles pagination click', () => {
    render(<DiscoverPage />);

    fireEvent.click(screen.getByTestId('page-btn'));
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  // The URL-seeding effect passes an updater function to setSelectedFacets;
  // invoke it against an empty state to inspect the seeded facets.
  const seededFacets = () => {
    const updater = mockSetSelectedFacets.mock.calls.at(-1)?.[0];
    return typeof updater === 'function' ? updater({}) : updater;
  };

  it('sets search query from URL params', () => {
    mockGet.mockImplementation((key: string) => (key === 'q' ? 'react' : null));

    render(<DiscoverPage />);

    expect(seededFacets()).toEqual(expect.objectContaining({ q: ['react'] }));
  });

  it('clears search query when URL param is removed', () => {
    mockGet.mockReturnValue(null);

    render(<DiscoverPage />);

    expect(seededFacets()).toEqual(expect.objectContaining({ q: [] }));
  });

  it('seeds content and enrollment filters from URL params', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'content') return 'courses';
      if (key === 'enrolled') return 'true';
      return null;
    });

    render(<DiscoverPage />);

    expect(seededFacets()).toEqual(
      expect.objectContaining({ content: ['courses'], enrollment: ['Enrolled'] }),
    );
  });

  it('seeds the Recommended term of the Access facet from the recommended URL param', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'recommended') return 'true';
      return null;
    });

    render(<DiscoverPage />);

    expect(seededFacets()).toEqual(expect.objectContaining({ enrollment: ['Recommended'] }));
  });

  it('seeds both Access terms when enrolled and recommended params are set', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'enrolled' || key === 'recommended') return 'true';
      return null;
    });

    render(<DiscoverPage />);

    expect(seededFacets()).toEqual(
      expect.objectContaining({ enrollment: ['Enrolled', 'Recommended'] }),
    );
  });

  it('renders selected facets with remove buttons', () => {
    vi.mocked(useDiscover).mockReturnValue({
      contents: [],
      facets: [],
      contentsLoading: false,
      facetsLoading: false,
      isError: false,
      handleToggleFacet: vi.fn(),
      selectedFacets: { type: ['course'] },
      isFacetTermSelected: vi.fn(),
      handleSelectFacets: mockHandleSelectFacets,
      handleFormatContents: vi.fn((c: any) => c),
      pagination: { total_pages: 1, count: 0 },
      setPage: mockSetPage,
      handleFilterFacets: vi.fn(),
      filteredFacets: [],
      setSelectedFacets: mockSetSelectedFacets,
      displayCards: [],
      enrolledOnly: false,
      enrollmentsLoading: false,
    } as any);

    render(<DiscoverPage />);

    expect(screen.getByText('type:')).toBeInTheDocument();
    expect(screen.getByText('course')).toBeInTheDocument();
    // Filtered-empty is "no match", not "no courses" — keep the plain box.
    expect(screen.getByTestId('empty-box')).toHaveTextContent('No content found.');
    expect(screen.queryByTestId('no-courses-empty-box')).not.toBeInTheDocument();
  });

  it('renders facets filter sidebar without a "Filter By" heading', () => {
    render(<DiscoverPage />);

    expect(screen.getByTestId('facets-filter')).toBeInTheDocument();
    expect(screen.queryByText('Filter By')).not.toBeInTheDocument();
  });
});
