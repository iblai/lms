import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
  })),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getRandomCourseImage: vi.fn(() => '/random-image.jpg'),
}));

const mockSetFilteredPathways = vi.fn();
const mockSetPathways = vi.fn();

vi.mock('@/hooks/profile/use-profile-pathways', () => ({
  useProfilePathways: vi.fn(() => ({
    filteredPathways: [],
    isLoading: false,
    pathways: [],
    isError: false,
    setPathways: mockSetPathways,
    setFilteredPathways: mockSetFilteredPathways,
    pathwayCompletions: [],
  })),
}));

vi.mock('@/components/pathway-detail-modal', () => ({
  PathwayDetailModal: ({ pathway, onClose }: any) => (
    <div data-testid="pathway-modal">
      <span>{pathway?.name}</span>
      <button data-testid="close-pathway-modal" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/components/create-pathway-modal', () => ({
  CreatePathwayModal: ({ open, onOpenChange, onSave }: any) => (
    <div data-testid="create-pathway-modal">
      <button data-testid="save-pathway" onClick={() => onSave({ name: 'New Pathway' })}>
        Save
      </button>
      <button data-testid="close-create-modal" onClick={() => onOpenChange(false)}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
}));

vi.mock('@/components/skeleton-pathway-box', () => ({
  SkeletonPathwayBox: () => <div data-testid="skeleton-pathway-box" />,
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

import PathwaysPage from '../page';
import { useProfilePathways } from '@/hooks/profile/use-profile-pathways';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

describe('PathwaysPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
    } as any);
  });

  it('renders "My pathways" tab by default', () => {
    render(<PathwaysPage />);

    expect(screen.getByText('My pathways')).toBeInTheDocument();
  });

  it('renders "Assigned pathways" tab when feature is not hidden', () => {
    render(<PathwaysPage />);

    expect(screen.getByText('Assigned pathways')).toBeInTheDocument();
  });

  it('renders "Enrolled pathways" tab', () => {
    render(<PathwaysPage />);

    expect(screen.getByText('Enrolled pathways')).toBeInTheDocument();
  });

  it('hides "Assigned pathways" tab when feature is hidden', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => true),
    } as any);

    render(<PathwaysPage />);

    expect(screen.queryByText('Assigned pathways')).not.toBeInTheDocument();
  });

  it('shows empty box when no pathways and not loading', () => {
    render(<PathwaysPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No pathways found.');
  });

  it('shows empty box on error', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [],
      isLoading: false,
      pathways: [],
      isError: true,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [],
    } as any);

    render(<PathwaysPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No pathways found.');
  });

  it('shows skeletons when loading', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [],
      isLoading: true,
      pathways: [],
      isError: false,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [],
    } as any);

    render(<PathwaysPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('renders pathway cards when available', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [
        { name: 'Pathway 1', metadata: { banner_image_asset_path: '/img1.jpg' } },
        { name: 'Pathway 2', metadata: {} },
      ],
      isLoading: false,
      pathways: [{ name: 'Pathway 1' }, { name: 'Pathway 2' }],
      isError: false,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [],
    } as any);

    render(<PathwaysPage />);

    expect(screen.getByText('Pathway 1')).toBeInTheDocument();
    expect(screen.getByText('Pathway 2')).toBeInTheDocument();
  });

  it('renders pathway completions with progress bar', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [{ name: 'Pathway 1', metadata: {} }],
      isLoading: false,
      pathways: [{ name: 'Pathway 1' }],
      isError: false,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [{ completion_percentage: 75 }],
    } as any);

    render(<PathwaysPage />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('opens pathway detail modal on click', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [{ name: 'Pathway 1', metadata: {} }],
      isLoading: false,
      pathways: [{ name: 'Pathway 1' }],
      isError: false,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [],
    } as any);

    render(<PathwaysPage />);

    fireEvent.click(screen.getByText('Pathway 1'));
    expect(screen.getByTestId('pathway-modal')).toBeInTheDocument();
  });

  it('closes pathway detail modal', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [{ name: 'Pathway 1', metadata: {} }],
      isLoading: false,
      pathways: [{ name: 'Pathway 1' }],
      isError: false,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [],
    } as any);

    render(<PathwaysPage />);

    fireEvent.click(screen.getByText('Pathway 1'));
    expect(screen.getByTestId('pathway-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-pathway-modal'));
    expect(screen.queryByTestId('pathway-modal')).not.toBeInTheDocument();
  });

  it('opens create pathway modal on button click', () => {
    render(<PathwaysPage />);

    fireEvent.click(screen.getByText('Create Pathway'));
    expect(screen.getByTestId('create-pathway-modal')).toBeInTheDocument();
  });

  it('handles search input', () => {
    render(<PathwaysPage />);

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'data science' } });

    expect(input).toHaveValue('data science');
  });

  it('shows search-specific empty message when search yields no results', () => {
    vi.mocked(useProfilePathways).mockReturnValue({
      filteredPathways: [],
      isLoading: false,
      pathways: [{ name: 'Pathway 1' }],
      isError: false,
      setPathways: mockSetPathways,
      setFilteredPathways: mockSetFilteredPathways,
      pathwayCompletions: [],
    } as any);

    // We need to trigger the search query state. Since the component uses internal state,
    // we render and type to trigger the condition searchQuery.length > 2
    render(<PathwaysPage />);

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'xyz' } });

    // The empty message for search requires filteredPathways=0, pathways.length > 0, searchQuery.length > 2
    expect(screen.getByTestId('empty-box')).toHaveTextContent(
      'No pathways found matching xyz query.',
    );
  });

  it('hides "Create Pathway" button when not on catalog tab', () => {
    render(<PathwaysPage />);

    // Switch to enrolled tab
    fireEvent.click(screen.getByText('Enrolled pathways'));

    expect(screen.queryByText('Create Pathway')).not.toBeInTheDocument();
  });
});
