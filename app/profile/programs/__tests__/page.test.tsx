import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" onError={onError} />
  ),
}));

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

// Mock useIsAdmin
vi.mock('@/utils/localstorage', () => ({
  useIsAdmin: vi.fn(() => false),
}));

// Mock toast (import reference for assertions)
import { toast } from 'sonner';

// Stable references to avoid useEffect loops
const stableHandleSearch = vi.fn(() => Promise.resolve({ data: { results: [] } }));
const stableGetProgramCompletion = vi.fn(() => Promise.resolve({ data: null }));
const stableGetUserEnrolledPrograms = vi.fn(() => Promise.resolve({ data: [] }));
const stableCreateEnrollment = vi.fn();
const stableUpdateMetadata = vi.fn(() => ({ unwrap: vi.fn(() => Promise.resolve()) }));
const stableRefetch = vi.fn();

// Mock personnalized catalog hook
vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalog: vi.fn(() => ({
    handleSearch: stableHandleSearch,
  })),
}));

// Mock studio hooks
vi.mock('@/services/studio', () => ({
  useGetProgramMetadataQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    refetch: stableRefetch,
  })),
  useUpdateProgramMetadataMutation: vi.fn(() => [stableUpdateMetadata, { isLoading: false }]),
}));

// Mock iblai-js/data-layer
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetProgramCompletionQuery: vi.fn(() => [stableGetProgramCompletion]),
  useLazyGetUserEnrolledProgramsQuery: vi.fn(() => [
    stableGetUserEnrolledPrograms,
    { isLoading: false },
  ]),
  useCreateCatalogProgramSelfEnrollmentMutation: vi.fn(() => [
    stableCreateEnrollment,
    { isError: false, isSuccess: false },
  ]),
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

vi.mock('@iblai/iblai-js/web-containers', () => ({
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
  getRandomCourseImage: vi.fn(() => '/random-course-image.jpg'),
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier">Loading...</div>,
  SkeletonPathwayBox: () => <div data-testid="skeleton-pathway-box">Skeleton</div>,
}));

const capturedModalProps: { value?: any } = {};
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  ProgramDetailModal: (props: any) => {
    capturedModalProps.value = props;
    return (
      <div data-testid="program-detail-modal" data-banner={props.bannerImageSrc}>
        Modal for: {props.program?.name}
        <button onClick={props.onClose}>Close Modal</button>
      </div>
    );
  },
}));

import ProgramsPage from '../page';
import { useProfilePrograms } from '@iblai/iblai-js/web-containers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useIsAdmin } from '@/utils/localstorage';
import {
  useCreateCatalogProgramSelfEnrollmentMutation,
  useLazyGetProgramCompletionQuery,
  useLazyGetUserEnrolledProgramsQuery,
} from '@iblai/iblai-js/data-layer';
import { useGetProgramMetadataQuery } from '@/services/studio';

describe('ProgramsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedModalProps.value = undefined;
    // Reset stable mock references so counts don't bleed across tests
    stableHandleSearch.mockReset();
    stableHandleSearch.mockResolvedValue({ data: { results: [] } });
    stableGetProgramCompletion.mockReset();
    stableGetProgramCompletion.mockResolvedValue({ data: null });
    stableGetUserEnrolledPrograms.mockReset();
    stableGetUserEnrolledPrograms.mockResolvedValue({ data: [] });
    stableCreateEnrollment.mockReset();
    stableCreateEnrollment.mockResolvedValue({});
    stableUpdateMetadata.mockReset();
    stableUpdateMetadata.mockImplementation(() => ({ unwrap: vi.fn(() => Promise.resolve()) }));
    stableRefetch.mockReset();
    vi.mocked(useIsAdmin).mockReturnValue(false);
    vi.mocked(useCreateCatalogProgramSelfEnrollmentMutation).mockReturnValue([
      stableCreateEnrollment,
      { isError: false, isSuccess: false },
    ] as any);
    vi.mocked(useLazyGetProgramCompletionQuery).mockReturnValue([
      stableGetProgramCompletion,
    ] as any);
    vi.mocked(useLazyGetUserEnrolledProgramsQuery).mockReturnValue([
      stableGetUserEnrolledPrograms,
      { isLoading: false },
    ] as any);
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: stableRefetch,
    } as any);
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

  it('opens program detail modal when program card is clicked', () => {
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

    expect(screen.getByTestId('program-detail-modal')).toBeInTheDocument();
  });

  it('closes program detail modal', () => {
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

    // Open modal
    const programCard = screen.getByTestId('program-card');
    fireEvent.click(programCard);
    expect(screen.getByTestId('program-detail-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('program-detail-modal')).not.toBeInTheDocument();
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

  const openProgram = async (
    overrides: Partial<Record<string, any>> = {},
    programOverrides: Partial<Record<string, any>> = {},
  ) => {
    const program = {
      name: 'Program 1',
      program_id: 'prog-1',
      program_key: 'key-1',
      program_metadata: {},
      platform_key: 'test-tenant',
      ended: '',
      ...programOverrides,
    };
    vi.mocked(useProfilePrograms).mockReturnValue({
      programs: [program],
      filteredPrograms: [program],
      isLoading: false,
      isError: false,
      setFilteredPrograms: mockSetFilteredPrograms,
      setPrograms: mockSetPrograms,
      programCompletions: [],
      programCompletionsLoading: false,
      ...overrides,
    } as any);

    render(<ProgramsPage />);
    fireEvent.click(screen.getByTestId('program-card'));
    await waitFor(() => expect(capturedModalProps.value).toBeDefined());
    return program;
  };

  it('fetches program detail data and maps courses when a program is selected', async () => {
    stableHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  course_id: 'c-1',
                  edx_data: { course_image_asset_path: '/img/c1.jpg' },
                },
              },
              {
                course: {
                  course_id: 'c-1',
                  edx_data: { course_image_asset_path: '/img/c1.jpg' },
                },
              },
              {
                course: { course_id: 'c-2', edx_data: {} },
              },
            ],
          },
          { courses: undefined },
        ],
      },
    });
    stableGetUserEnrolledPrograms.mockResolvedValueOnce({
      data: [{ active: true, program_id: 'prog-1' }],
    });
    stableGetProgramCompletion.mockResolvedValueOnce({
      data: { completion_percentage: 40 },
    });

    await openProgram();

    await waitFor(() => {
      expect(stableHandleSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'test-user',
          content: ['programs'],
          programId: 'prog-1',
          returnItems: true,
          tenant: 'test-tenant',
        }),
      );
    });

    await waitFor(() => {
      expect(capturedModalProps.value?.courses).toHaveLength(2);
    });
    expect(capturedModalProps.value?.courses[0].course.edx_data.course_image_asset_path).toBe(
      'https://lms.example.com/img/c1.jpg',
    );
    expect(capturedModalProps.value?.courses[1].course.edx_data.course_image_asset_path).toBe(
      '/random-course-image.jpg',
    );

    await waitFor(() => {
      expect(capturedModalProps.value?.enrollmentStatus).toBe(true);
    });

    await waitFor(() => {
      expect(capturedModalProps.value?.programCompletion).toEqual({
        completion_percentage: 40,
      });
    });
  });

  it('toasts an error and clears courses when handleSearch rejects', async () => {
    stableHandleSearch.mockRejectedValueOnce(new Error('boom'));

    await openProgram();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error fetching program details');
    });
    await waitFor(() => {
      expect(capturedModalProps.value?.courses).toEqual([]);
    });
  });

  it('sets enrollmentStatus=false when getUserEnrolledPrograms rejects', async () => {
    stableGetUserEnrolledPrograms.mockRejectedValueOnce(new Error('boom'));

    await openProgram();

    await waitFor(() => {
      expect(stableGetUserEnrolledPrograms).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(capturedModalProps.value?.enrollmentStatus).toBe(false);
    });
  });

  it('sets enrollmentStatus=false when resp.data is not an array', async () => {
    stableGetUserEnrolledPrograms.mockResolvedValueOnce({ data: null });

    await openProgram();

    await waitFor(() => {
      expect(capturedModalProps.value?.enrollmentStatus).toBe(false);
    });
  });

  it('sets programCompletion=null when getProgramCompletion rejects', async () => {
    stableGetProgramCompletion.mockRejectedValueOnce(new Error('boom'));

    await openProgram();

    await waitFor(() => {
      expect(capturedModalProps.value?.programCompletion).toBeNull();
    });
  });

  it('uses selectedProgram.platform over platform_key for tenant in search', async () => {
    await openProgram({}, { platform: 'other-tenant' });

    await waitFor(() => {
      expect(stableHandleSearch).toHaveBeenCalledWith(
        expect.objectContaining({ tenant: 'other-tenant' }),
      );
    });
  });

  it('uses relative card_image as absolute LMS URL for the modal banner', async () => {
    await openProgram({}, { program_metadata: { card_image: '/banners/p1.jpg' } });

    expect(capturedModalProps.value?.bannerImageSrc).toBe('https://lms.example.com/banners/p1.jpg');
  });

  it('uses card_image directly when it is already an absolute URL', async () => {
    await openProgram(
      {},
      { program_metadata: { card_image: 'https://cdn.example.com/banners/p1.jpg' } },
    );

    expect(capturedModalProps.value?.bannerImageSrc).toBe('https://cdn.example.com/banners/p1.jpg');
  });

  it('uses the random image as banner when no card_image is set', async () => {
    await openProgram();
    expect(capturedModalProps.value?.bannerImageSrc).toBe('/random-course-image.jpg');
  });

  it('navigates to course page when onCourseClick is invoked from modal', async () => {
    await openProgram();

    await act(async () => {
      capturedModalProps.value?.onCourseClick('course-xyz');
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/courses/course-xyz');
  });

  it('enrolls into program via onEnroll and toasts success', async () => {
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onEnroll({ program_key: 'key-1' });
    });

    expect(stableCreateEnrollment).toHaveBeenCalledWith([
      {
        requestBody: {
          program_key: 'key-1',
          username: 'test-user',
          active: true,
          ended: null,
        },
      },
    ]);
    expect(toast.success).toHaveBeenCalledWith('Enrolled into program successfully');
  });

  it('toasts an error when enrollment rejects', async () => {
    stableCreateEnrollment.mockRejectedValueOnce(new Error('fail'));
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onEnroll({ program_key: 'key-1' });
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to enroll into program');
  });

  it('toasts an error when enrollment hook reports isError after call', async () => {
    vi.mocked(useCreateCatalogProgramSelfEnrollmentMutation).mockReturnValue([
      stableCreateEnrollment,
      { isError: true, isSuccess: false },
    ] as any);

    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onEnroll({ program_key: 'key-1' });
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to enroll into program');
  });

  it('skips enrollment when already submitting (falls back to default program_key)', async () => {
    let resolveFn: (v?: any) => void = () => {};
    stableCreateEnrollment.mockImplementationOnce(
      () => new Promise((resolve) => (resolveFn = resolve)),
    );

    await openProgram();

    // First invocation begins submission (does not await so guard is active for the second call)
    act(() => {
      void capturedModalProps.value?.onEnroll({ program_key: 'key-1' });
    });

    // Second invocation while submitting should short-circuit
    await act(async () => {
      await capturedModalProps.value?.onEnroll({ program_key: 'key-1' });
    });

    expect(stableCreateEnrollment).toHaveBeenCalledTimes(1);

    act(() => resolveFn({}));
  });

  it('enrolls with default empty program_key when program has no program_key', async () => {
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onEnroll({});
    });

    expect(stableCreateEnrollment).toHaveBeenCalledWith([
      {
        requestBody: {
          program_key: '',
          username: 'test-user',
          active: true,
          ended: null,
        },
      },
    ]);
  });

  it('validates start_date <= end_date in onSaveSettings', async () => {
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onSaveSettings({
        start_date: '2026-05-01',
        end_date: '2026-04-01',
        tags: [],
        topics: [],
      });
    });

    expect(toast.error).toHaveBeenCalledWith('End date must be after start date');
    expect(stableUpdateMetadata).not.toHaveBeenCalled();
  });

  it('validates enrollment_start <= enrollment_end in onSaveSettings', async () => {
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onSaveSettings({
        enrollment_start: '2026-05-01',
        enrollment_end: '2026-04-01',
        tags: [],
        topics: [],
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Enrollment end date must be after enrollment start date',
    );
    expect(stableUpdateMetadata).not.toHaveBeenCalled();
  });

  it('saves program settings happy path, refetches metadata and toasts success', async () => {
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onSaveSettings({
        slug: 'slug',
        subject: 'subject',
        tags: ['t1'],
        level: 'beginner',
        topics: ['topic'],
        promotion: 'p',
        social_team: 'team',
        social_channels: 'ch',
        description: 'desc',
        display_price: '10',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        enrollment_start: '2026-01-01',
        enrollment_end: '2026-06-01',
        language: 'en',
        credential: 'cert',
        catalog_visibility: 'both',
        invitation_only: false,
        banner_image: 'banner.jpg',
        card_image: 'card.jpg',
      });
    });

    expect(stableUpdateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        programId: 'prog-1',
        org: 'test-tenant',
        settings: expect.objectContaining({
          slug: 'slug',
          tags: ['t1'],
          topics: ['topic'],
          invitation_only: false,
          platform_key: 'test-tenant',
        }),
      }),
    );
    expect(stableRefetch).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Program settings saved successfully');
  });

  it('coerces empty optional fields to null and empty arrays to null in onSaveSettings', async () => {
    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onSaveSettings({
        slug: '',
        subject: '',
        tags: [],
        level: '',
        topics: [],
        promotion: '',
        social_team: '',
        social_channels: '',
        description: '',
        display_price: '',
        start_date: '',
        end_date: '',
        enrollment_start: '',
        enrollment_end: '',
        language: '',
        credential: '',
        catalog_visibility: '',
        invitation_only: true,
        banner_image: '',
        card_image: '',
      });
    });

    const call = stableUpdateMetadata.mock.calls[0][0];
    expect(call.settings.slug).toBeNull();
    expect(call.settings.tags).toBeNull();
    expect(call.settings.topics).toBeNull();
    expect(call.settings.invitation_only).toBe(true);
  });

  it('toasts an error and logs when saving settings fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stableUpdateMetadata.mockImplementationOnce(() => ({
      unwrap: vi.fn(() => Promise.reject(new Error('save fail'))),
    }));

    await openProgram();

    await act(async () => {
      await capturedModalProps.value?.onSaveSettings({ tags: [], topics: [] });
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to save program settings');
    errorSpy.mockRestore();
  });

  it('enables settings mode when admin and program belongs to tenant', async () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);

    await openProgram();

    expect(capturedModalProps.value?.showSettings).toBe(true);
  });

  it('falls back to platform_key then getTenant for programOrg', async () => {
    vi.mocked(useIsAdmin).mockReturnValue(true);

    await openProgram({}, { platform_key: undefined, platform: undefined, org: 'explicit-org' });

    await act(async () => {
      await capturedModalProps.value?.onSaveSettings({ tags: [], topics: [] });
    });

    const call = stableUpdateMetadata.mock.calls[0][0];
    expect(call.org).toBe('explicit-org');
  });
});
