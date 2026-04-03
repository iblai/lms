import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: mockGet,
  })),
}));

// Mock hooks and components
const mockSetSelectedFacets = vi.fn();
const mockHandleSelectFacets = vi.fn();
const mockSetPage = vi.fn();

vi.mock('@/hooks/discover/use-discover', () => ({
  useDiscover: vi.fn(() => ({
    contents: [],
    facets: [],
    contentsLoading: false,
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
  })),
}));

vi.mock('@/components/course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

vi.mock('@/components/footer', () => ({
  Footer: () => <div data-testid="footer" />,
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
  default: ({ onPageChange, ...props }: any) => (
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

import DiscoverPage from '../page';
import { useDiscover } from '@/hooks/discover/use-discover';

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('renders the page with heading and footer', () => {
    render(<DiscoverPage />);

    expect(screen.getAllByText('Featured Learning Content').length).toBeGreaterThan(0);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('shows empty box when no contents and not loading', () => {
    render(<DiscoverPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No content found.');
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
    } as any);

    render(<DiscoverPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No content found.');
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
    } as any);

    render(<DiscoverPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders content cards when contents are available', () => {
    vi.mocked(useDiscover).mockReturnValue({
      contents: [{ title: 'Course 1' }, { title: 'Course 2' }] as any,
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
    } as any);

    render(<DiscoverPage />);

    expect(screen.getAllByTestId('discover-content-card')).toHaveLength(2);
  });

  it('handles pagination click', () => {
    render(<DiscoverPage />);

    fireEvent.click(screen.getByTestId('page-btn'));
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  it('sets search query from URL params', () => {
    mockGet.mockReturnValue('react');

    render(<DiscoverPage />);

    expect(mockSetSelectedFacets).toHaveBeenCalledWith(expect.objectContaining({ q: ['react'] }));
  });

  it('clears search query when URL param is removed', () => {
    mockGet.mockReturnValue(null);

    render(<DiscoverPage />);

    expect(mockSetSelectedFacets).toHaveBeenCalledWith(expect.objectContaining({ q: [] }));
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
    } as any);

    render(<DiscoverPage />);

    expect(screen.getByText('type:')).toBeInTheDocument();
    expect(screen.getByText('course')).toBeInTheDocument();
  });

  it('renders facets filter sidebar', () => {
    render(<DiscoverPage />);

    expect(screen.getByTestId('facets-filter')).toBeInTheDocument();
    expect(screen.getByText('Explore Content')).toBeInTheDocument();
  });
});
