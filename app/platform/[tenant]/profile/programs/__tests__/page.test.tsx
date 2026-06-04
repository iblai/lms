import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" onError={onError} />
  ),
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random-course-image.jpg'),
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

// Mock useTenantMetadata
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
  })),
}));

// Create mock functions for useProfilePrograms
const mockSetFilteredPrograms = vi.fn();
const mockSetPrograms = vi.fn();

vi.mock('@/hooks/profile/use-profile-programs', () => ({
  useProfilePrograms: vi.fn(() => ({
    programs: [],
    filteredPrograms: [],
    isLoading: false,
    isError: false,
    setFilteredPrograms: mockSetFilteredPrograms,
    setPrograms: mockSetPrograms,
    programCompletions: [],
    programCompletionsLoading: false,
  })),
}));

// Mock components
vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier">Loading...</div>,
}));

vi.mock('@/components/skeleton-pathway-box', () => ({
  SkeletonPathwayBox: () => <div data-testid="skeleton-pathway-box">Skeleton</div>,
}));

import ProgramsPage from '../page';
import { useProfilePrograms } from '@/hooks/profile/use-profile-programs';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

describe('ProgramsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mocks
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
    } as any);
    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: [],
      filteredPrograms: [],
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });
  });

  it('renders the page with tabs', () => {
    render(<ProgramsPage />);

    expect(screen.getByText('My programs')).toBeInTheDocument();
  });

  it('shows assigned programs tab when feature is not hidden', () => {
    render(<ProgramsPage />);

    expect(screen.getByText('Assigned programs')).toBeInTheDocument();
  });

  it('hides assigned programs tab when feature is hidden', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => true),
    } as any);

    render(<ProgramsPage />);

    expect(screen.queryByText('Assigned programs')).not.toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<ProgramsPage />);

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('handles search input change', () => {
    render(<ProgramsPage />);

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput).toHaveValue('test search');
  });

  it('shows loading state', () => {
    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: [],
      filteredPrograms: [],
      isLoading: true,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty state when no programs', () => {
    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: [],
      filteredPrograms: [],
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No programs found.');
  });

  it('shows empty state on error', () => {
    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: [],
      filteredPrograms: [],
      isLoading: false,
      isError: true,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No programs found.');
  });

  it('shows no results message when search has no matches', () => {
    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: [{ name: 'Test Program', program_id: '1', ended: '', program_metadata: {} }],
      filteredPrograms: [],
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No programs found matching');
  });

  it('renders program cards when programs exist', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: { card_image: '/image1.jpg' },
        ended: '',
      },
      {
        name: 'Program 2',
        program_id: 'prog-2',
        program_key: 'key-2',
        program_metadata: { card_image: 'https://example.com/image2.jpg' },
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    expect(screen.getByText('Program 1')).toBeInTheDocument();
    expect(screen.getByText('Program 2')).toBeInTheDocument();
  });

  it('shows progress bar when program completions exist', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: {},
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [{ completion_percentage: 75, count: 1 }],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('navigates to program detail page when program card is clicked', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: {},
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    const programCard = screen.getByTestId('program-card');
    fireEvent.click(programCard);

    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/programs/prog-1');
  });

  it('switches tabs and resets state', () => {
    // Reset mock to ensure assigned tab is visible
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
    } as any);

    render(<ProgramsPage />);

    const assignedTab = screen.getByText('Assigned programs');
    fireEvent.click(assignedTab);

    expect(mockSetFilteredPrograms).toHaveBeenCalledWith([]);
    expect(mockSetPrograms).toHaveBeenCalledWith([]);
  });

  it('does not switch tabs when clicking same tab', () => {
    // Reset mock to ensure proper state
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsAssignmentsFeatureHidden: vi.fn(() => false),
    } as any);

    render(<ProgramsPage />);

    const myProgramsTab = screen.getByText('My programs');
    fireEvent.click(myProgramsTab);

    // Should not call reset functions when clicking the same tab
    expect(mockSetFilteredPrograms).not.toHaveBeenCalled();
  });

  it('handles image with relative path', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: { card_image: '/relative/path.jpg' },
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', 'https://lms.example.com/relative/path.jpg');
  });

  it('handles image with absolute URL', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: { card_image: 'https://cdn.example.com/image.jpg' },
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/image.jpg');
  });

  it('uses fallback image when no card_image', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: {},
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', '/random-course-image.jpg');
  });

  it('handles image error by setting fallback', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: { card_image: '/broken-image.jpg' },
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    const image = screen.getByTestId('next-image');
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/random-course-image.jpg');
  });

  it('displays PROGRAM badge on each card', () => {
    const mockPrograms = [
      {
        name: 'Program 1',
        program_id: 'prog-1',
        program_key: 'key-1',
        program_metadata: {},
        ended: '',
      },
    ];

    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: mockPrograms,
      filteredPrograms: mockPrograms,
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
    });

    render(<ProgramsPage />);

    expect(screen.getByTestId('program-badge')).toHaveTextContent('PROGRAM');
  });
});
