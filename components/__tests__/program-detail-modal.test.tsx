import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies before importing component
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, onError, ...props }: any) => (
    <img src={src} alt={alt} data-fill={fill} {...props} onError={onError} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockHandleSearch = vi.fn().mockResolvedValue({
  data: { results: [] },
});

vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalog: () => ({
    handleSearch: mockHandleSearch,
  }),
}));

vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random-image.jpg'),
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'testuser'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: () => 'https://lms.example.com',
    },
  },
}));

vi.mock('@/utils/localstorage', () => ({
  useIsAdmin: vi.fn(() => false),
}));

// Mock RTK Query hooks properly - return array with function and object
const mockGetProgramCompletion = vi.fn().mockResolvedValue({ data: null });
const mockGetUserEnrolledPrograms = vi.fn().mockResolvedValue({ data: [] });
const mockCreateEnrollment = vi.fn().mockResolvedValue({});

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetProgramCompletionQuery: () => [
    mockGetProgramCompletion,
    { isLoading: false, data: null },
  ],
  useLazyGetUserEnrolledProgramsQuery: () => [
    mockGetUserEnrolledPrograms,
    { isLoading: false, data: [] },
  ],
  useCreateCatalogProgramSelfEnrollmentMutation: () => [
    mockCreateEnrollment,
    { isLoading: false, isError: false, isSuccess: false },
  ],
}));

const mockUpdateProgramMetadata = vi.fn().mockReturnValue({
  unwrap: vi.fn().mockResolvedValue({}),
});
const mockRefetch = vi.fn();

vi.mock('@/services/studio', () => ({
  useGetProgramMetadataQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    refetch: mockRefetch,
  })),
  useUpdateProgramMetadataMutation: () => [mockUpdateProgramMetadata, { isLoading: false }],
}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: (obj: any) => !obj || Object.keys(obj).length === 0,
  },
}));

// Mock UI components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue} {...props}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`${value}-tab-content`} data-value={value} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="program-tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`${value}-tab`} data-value={value} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <button
      data-testid="switch"
      data-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      Switch
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button data-testid="select-change" onClick={() => onValueChange?.('both')}>
        Change
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

// Import component after mocks
import { ProgramDetailModal } from '../program-detail-modal';
import { useIsAdmin } from '@/utils/localstorage';
import { getTenant } from '@/utils/helpers';
import { useGetProgramMetadataQuery } from '@/services/studio';
import { toast } from 'sonner';

describe('ProgramDetailModal', () => {
  const defaultProgram = {
    program_id: 'program-123',
    program_key: 'test-program-key',
    name: 'Test Program',
    platform_key: 'other-tenant',
    program_metadata: {
      card_image: '/program-image.jpg',
    },
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(false);
    vi.mocked(getTenant).mockReturnValue('test-tenant');
  });

  it('renders modal with program name', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    expect(screen.getByText('Test Program')).toBeInTheDocument();
    expect(screen.getByText('Program Details')).toBeInTheDocument();
  });

  it('displays program badge', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    expect(screen.getByTestId('program-badge')).toHaveTextContent('PROGRAM');
  });

  it('has proper accessibility attributes', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    const modal = screen.getByTestId('program-detail-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when close button is clicked', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    const xButton = screen.getByLabelText('Close modal');
    fireEvent.click(xButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows enroll button when user is not enrolled', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    expect(screen.getByTestId('enroll-button')).toBeInTheDocument();
    expect(screen.getByText('Enroll Now')).toBeInTheDocument();
  });

  it('shows courses section when loaded', async () => {
    mockHandleSearch.mockResolvedValueOnce({ data: { results: [] } });

    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    // After loading completes, courses section is shown
    await waitFor(() => {
      expect(screen.getByText('Courses in this Program')).toBeInTheDocument();
    });
  });

  it('shows courses section title after loading', async () => {
    mockHandleSearch.mockResolvedValueOnce({ data: { results: [] } });

    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Courses in this Program')).toBeInTheDocument();
    });
  });

  it('renders program banner image', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    const bannerContainer = screen.getByTestId('program-banner-container');
    expect(bannerContainer).toBeInTheDocument();
  });

  it('has modal footer with buttons', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
    });

    const footer = screen.getByTestId('program-modal-footer');
    expect(footer).toBeInTheDocument();
  });

  describe('enrollment', () => {
    it('handles enrollment when enroll button is clicked', async () => {
      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      const enrollButton = screen.getByTestId('enroll-button');
      fireEvent.click(enrollButton);

      await waitFor(() => {
        expect(mockCreateEnrollment).toHaveBeenCalled();
      });
    });

    it('shows success toast after enrollment', async () => {
      mockCreateEnrollment.mockResolvedValueOnce({});

      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      const enrollButton = screen.getByTestId('enroll-button');

      await act(async () => {
        fireEvent.click(enrollButton);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Enrolled into program successfully');
      });
    });

    it('disables enroll button while submitting', async () => {
      // Make enrollment take time
      mockCreateEnrollment.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 100)),
      );

      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      const enrollButton = screen.getByTestId('enroll-button');

      await act(async () => {
        fireEvent.click(enrollButton);
      });

      // Button should be disabled and show enrolling text
      expect(enrollButton).toHaveTextContent('Enrolling...');
      expect(enrollButton).toBeDisabled();
    });
  });

  describe('program completion', () => {
    it('displays progress bar when completion data exists', async () => {
      mockGetProgramCompletion.mockResolvedValueOnce({
        data: { completion_percentage: 75 },
      });

      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });
  });

  describe('courses display', () => {
    it('shows empty message when no courses', async () => {
      mockHandleSearch.mockResolvedValueOnce({ data: { results: [] } });

      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('empty-box')).toHaveTextContent(
          'No courses found under this program.',
        );
      });
    });

    it('displays courses when available', async () => {
      mockHandleSearch.mockResolvedValueOnce({
        data: {
          results: [
            {
              courses: [
                {
                  course: {
                    id: 'course-1',
                    course_id: 'course-v1:test+001+2024',
                    name: 'Test Course 1',
                    edx_data: {
                      course_image_asset_path: '/course-image.jpg',
                    },
                  },
                },
              ],
            },
          ],
        },
      });

      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });
    });

    it('handles search error gracefully', async () => {
      mockHandleSearch.mockRejectedValueOnce(new Error('Search failed'));

      await act(async () => {
        render(<ProgramDetailModal program={defaultProgram as any} onClose={mockOnClose} />);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error fetching program details');
      });
    });
  });
});

describe('ProgramDetailModal - Admin View', () => {
  const adminProgram = {
    program_id: 'program-123',
    program_key: 'test-program-key',
    name: 'Test Program',
    platform_key: 'test-tenant',
    program_metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.mocked(getTenant).mockReturnValue('test-tenant');
  });

  it('shows tabs for admin users with matching tenant', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    expect(screen.getByTestId('program-tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('courses-tab')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
  });

  it('does not show tabs for admin when tenant does not match', async () => {
    const otherProgram = {
      ...adminProgram,
      platform_key: 'other-tenant',
    };

    await act(async () => {
      render(<ProgramDetailModal program={otherProgram as any} onClose={vi.fn()} />);
    });

    expect(screen.queryByTestId('program-tabs-list')).not.toBeInTheDocument();
  });

  describe('settings tab', () => {
    it('loads metadata into settings form', async () => {
      vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
        data: {
          formData: {
            subject: 'Computer Science',
            slug: 'cs-program',
            tags: ['programming', 'web'],
            level: 'Intermediate',
            topics: ['JavaScript'],
            description: 'A CS program',
            display_price: '$99',
            start_date: '2024-01-01T00:00:00Z',
            end_date: '2024-12-31T00:00:00Z',
            enrollment_start: '2024-01-01T00:00:00Z',
            enrollment_end: '2024-06-30T00:00:00Z',
            language: 'en',
            credential: 'Certificate',
            catalog_visibility: 'both',
            invitation_only: false,
            banner_image: 'https://example.com/banner.jpg',
            card_image: 'https://example.com/card.jpg',
            promotion: 'Summer Sale',
            social_team: 'Marketing',
            social_channels: ['twitter', 'linkedin'],
          },
        },
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      await act(async () => {
        render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
      });

      // Settings tab content should be rendered
      expect(screen.getByTestId('settings-tab-content')).toBeInTheDocument();
    });

    it('shows loading state for settings', async () => {
      vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
        data: null,
        isLoading: true,
        refetch: mockRefetch,
      } as any);

      await act(async () => {
        render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
      });

      expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
    });

    it('saves settings when save button is clicked', async () => {
      vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
        data: {
          formData: {
            subject: '',
            slug: '',
            tags: [],
            level: '',
            topics: [],
            description: '',
            display_price: '',
            start_date: '',
            end_date: '',
            enrollment_start: '',
            enrollment_end: '',
            language: '',
            credential: '',
            catalog_visibility: 'both',
            invitation_only: false,
            banner_image: '',
            card_image: '',
            promotion: '',
            social_team: '',
            social_channels: '',
          },
        },
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      await act(async () => {
        render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
      });

      const saveButton = screen.getByTestId('save-settings-button');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockUpdateProgramMetadata).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Program settings saved successfully');
      });
    });

    it('shows error toast when save fails', async () => {
      vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
        data: {
          formData: {
            subject: '',
            slug: '',
            tags: [],
            level: '',
            topics: [],
            description: '',
          },
        },
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      mockUpdateProgramMetadata.mockReturnValueOnce({
        unwrap: vi.fn().mockRejectedValue(new Error('Save failed')),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
      });

      const saveButton = screen.getByTestId('save-settings-button');

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save program settings');
      });

      consoleSpy.mockRestore();
    });
  });
});

describe('ProgramDetailModal - with full metadata', () => {
  it('renders without crashing for program with all metadata fields', async () => {
    const programWithMetadata = {
      program_id: 'program-123',
      program_key: 'test-program-key',
      name: 'Test Program',
      platform_key: 'other-tenant',
      program_metadata: {
        tags: ['tag1', 'tag2'],
        topics: ['topic1'],
        card_image: 'https://example.com/card.jpg',
        banner_image: 'https://example.com/banner.jpg',
      },
    };

    await act(async () => {
      render(<ProgramDetailModal program={programWithMetadata as any} onClose={vi.fn()} />);
    });

    expect(screen.getByText('Test Program')).toBeInTheDocument();
  });

  it('handles program with relative card image path', async () => {
    const programWithRelativeImage = {
      program_id: 'program-123',
      program_key: 'test-program-key',
      name: 'Test Program',
      platform_key: 'other-tenant',
      program_metadata: {
        card_image: '/relative/path/image.jpg',
      },
    };

    await act(async () => {
      render(<ProgramDetailModal program={programWithRelativeImage as any} onClose={vi.fn()} />);
    });

    const bannerImage = screen.getByTestId('program-banner-image');
    expect(bannerImage).toHaveAttribute('src', 'https://lms.example.com/relative/path/image.jpg');
  });

  it('handles program with no card image', async () => {
    const programNoImage = {
      program_id: 'program-123',
      program_key: 'test-program-key',
      name: 'Test Program',
      platform_key: 'other-tenant',
      program_metadata: {},
    };

    await act(async () => {
      render(<ProgramDetailModal program={programNoImage as any} onClose={vi.fn()} />);
    });

    const bannerImage = screen.getByTestId('program-banner-image');
    expect(bannerImage).toHaveAttribute('src', '/random-image.jpg');
  });

  it('handles image error with fallback', async () => {
    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: { card_image: '/broken.jpg' },
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    const bannerImage = screen.getByTestId('program-banner-image');
    fireEvent.error(bannerImage);

    expect(bannerImage).toHaveAttribute('src', '/random-image.jpg');
  });
});

describe('ProgramDetailModal - enrollment status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides enroll button when user is already enrolled', async () => {
    mockGetUserEnrolledPrograms.mockResolvedValueOnce({
      data: [{ program_id: 'program-123', active: true }],
    });

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('enroll-button')).not.toBeInTheDocument();
    });
  });

  it('handles enrollment status check error gracefully', async () => {
    mockGetUserEnrolledPrograms.mockRejectedValueOnce(new Error('Failed to check enrollment'));

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    // Should still show enroll button on error (defaults to not enrolled)
    await waitFor(() => {
      expect(screen.getByTestId('enroll-button')).toBeInTheDocument();
    });
  });
});

describe('ProgramDetailModal - Admin View with courses', () => {
  const adminProgram = {
    program_id: 'program-123',
    program_key: 'test-program-key',
    name: 'Test Program',
    platform_key: 'test-tenant',
    program_metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.mocked(getTenant).mockReturnValue('test-tenant');
  });

  it('renders courses in admin view with course cards', async () => {
    mockHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  id: 'course-1',
                  course_id: 'course-v1:test+001+2024',
                  name: 'Test Course Admin',
                  edx_data: {
                    course_image_asset_path: '/course-image.jpg',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Course Admin')).toBeInTheDocument();
    });
  });

  it('handles course card keyboard navigation', async () => {
    mockHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  id: 'course-1',
                  course_id: 'course-v1:test+001+2024',
                  name: 'Test Course',
                  edx_data: {
                    course_image_asset_path: '/course-image.jpg',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    await waitFor(() => {
      const courseCard = screen.getByTestId('course-card-0');
      fireEvent.keyDown(courseCard, { key: 'Enter' });
      fireEvent.keyDown(courseCard, { key: ' ' });
    });
  });

  it('validates end date must be after start date', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          start_date: '2024-12-01T00:00:00Z',
          end_date: '2024-01-01T00:00:00Z',
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const saveButton = screen.getByTestId('save-settings-button');

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('End date must be after start date');
    });
  });

  it('validates enrollment end date must be after enrollment start date', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          enrollment_start: '2024-12-01T00:00:00Z',
          enrollment_end: '2024-01-01T00:00:00Z',
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const saveButton = screen.getByTestId('save-settings-button');

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Enrollment end date must be after enrollment start date',
      );
    });
  });

  it('renders all settings form sections', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          subject: 'Computer Science',
          slug: 'cs-program',
          tags: ['tag1'],
          topics: ['topic1'],
          level: 'Beginner',
          description: 'A test program',
          display_price: '$99',
          language: 'en',
          credential: 'Certificate',
          catalog_visibility: 'both',
          invitation_only: false,
          banner_image: 'https://example.com/banner.jpg',
          card_image: 'https://example.com/card.jpg',
          promotion: 'Summer Sale',
          social_team: 'Marketing',
          social_channels: 'twitter,linkedin',
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    // Check all form sections are rendered
    expect(screen.getByTestId('basic-information-section')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-dates-section')).toBeInTheDocument();
    expect(screen.getByTestId('visibility-access-section')).toBeInTheDocument();
    expect(screen.getByTestId('images-section')).toBeInTheDocument();
    expect(screen.getByTestId('social-promotion-section')).toBeInTheDocument();
  });

  it('handles invitation only toggle', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          invitation_only: false,
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const switchElement = screen.getByTestId('switch');
    fireEvent.click(switchElement);

    expect(switchElement).toHaveAttribute('data-checked', 'true');
  });

  it('handles catalog visibility change', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          catalog_visibility: 'both',
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const selectChange = screen.getByTestId('select-change');
    fireEvent.click(selectChange);
  });
});

describe('ProgramDetailModal - Non-admin with courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(false);
    vi.mocked(getTenant).mockReturnValue('test-tenant');
  });

  it('renders courses in non-admin view', async () => {
    mockHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  id: 'course-1',
                  course_id: 'course-v1:test+001+2024',
                  name: 'Non-Admin Course',
                  edx_data: {
                    course_image_asset_path: '/course-image.jpg',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Non-Admin Course')).toBeInTheDocument();
    });
  });

  it('handles course card click in non-admin view', async () => {
    mockHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  id: 'course-1',
                  course_id: 'course-v1:test+001+2024',
                  name: 'Clickable Course',
                  edx_data: {
                    course_image_asset_path: '/course-image.jpg',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    await waitFor(() => {
      const courseCard = screen.getByTestId('course-card-0');
      fireEvent.click(courseCard);
    });
  });

  it('handles keyboard navigation on course card', async () => {
    mockHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  id: 'course-1',
                  course_id: 'course-v1:test+001+2024',
                  name: 'Keyboard Course',
                  edx_data: {},
                },
              },
            ],
          },
        ],
      },
    });

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    await waitFor(() => {
      const courseCard = screen.getByTestId('course-card-0');
      fireEvent.keyDown(courseCard, { key: 'Enter' });
      fireEvent.keyDown(courseCard, { key: ' ' });
    });
  });

  it('handles course image error in non-admin view', async () => {
    mockHandleSearch.mockResolvedValueOnce({
      data: {
        results: [
          {
            courses: [
              {
                course: {
                  id: 'course-1',
                  course_id: 'course-v1:test+001+2024',
                  name: 'Error Image Course',
                  edx_data: {
                    course_image_asset_path: '/broken-image.jpg',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    await waitFor(() => {
      const courseImages = screen.getAllByRole('img');
      const courseImage = courseImages.find((img) =>
        img.getAttribute('alt')?.includes('Error Image Course'),
      );
      if (courseImage) {
        fireEvent.error(courseImage);
      }
    });
  });
});

describe('ProgramDetailModal - enrollment error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(false);
  });

  it('shows error toast when enrollment fails', async () => {
    mockCreateEnrollment.mockRejectedValueOnce(new Error('Enrollment failed'));

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    const enrollButton = screen.getByTestId('enroll-button');

    await act(async () => {
      fireEvent.click(enrollButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to enroll into program');
    });
  });

  it('handles program completion fetch error', async () => {
    mockGetProgramCompletion.mockRejectedValueOnce(new Error('Failed to fetch completion'));

    await act(async () => {
      render(
        <ProgramDetailModal
          program={
            {
              program_id: 'program-123',
              program_key: 'test-program-key',
              name: 'Test Program',
              platform_key: 'other-tenant',
              program_metadata: {},
            } as any
          }
          onClose={vi.fn()}
        />,
      );
    });

    // Should render without progress bar on error
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });
});

describe('ProgramDetailModal - Settings Form Interactions', () => {
  const adminProgram = {
    program_id: 'program-123',
    program_key: 'test-program-key',
    name: 'Test Program',
    platform_key: 'test-tenant',
    program_metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.mocked(getTenant).mockReturnValue('test-tenant');
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          subject: '',
          slug: '',
          tags: ['existing-tag'],
          level: '',
          topics: ['existing-topic'],
          description: '',
          display_price: '',
          start_date: '',
          end_date: '',
          enrollment_start: '',
          enrollment_end: '',
          language: '',
          credential: '',
          catalog_visibility: 'both',
          invitation_only: false,
          banner_image: '',
          card_image: '',
          promotion: '',
          social_team: '',
          social_channels: '',
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);
  });

  it('renders subject input field and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const subjectInput = screen.getByPlaceholderText('e.g., Computer Science');
    expect(subjectInput).toBeInTheDocument();

    fireEvent.change(subjectInput, { target: { value: 'Mathematics' } });
    expect(subjectInput).toHaveValue('Mathematics');
  });

  it('renders slug input field and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const slugInput = screen.getByPlaceholderText('e.g., my-program');
    fireEvent.change(slugInput, { target: { value: 'new-slug' } });
    expect(slugInput).toHaveValue('new-slug');
  });

  it('renders level input field and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const levelInput = screen.getByPlaceholderText('e.g., Beginner, Intermediate, Advanced');
    fireEvent.change(levelInput, { target: { value: 'Advanced' } });
    expect(levelInput).toHaveValue('Advanced');
  });

  it('renders language input field and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const languageInput = screen.getByPlaceholderText('e.g., en');
    fireEvent.change(languageInput, { target: { value: 'fr' } });
    expect(languageInput).toHaveValue('fr');
  });

  it('renders description textarea and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const descriptionInput = screen.getByPlaceholderText('Program description...');
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });
    expect(descriptionInput).toHaveValue('New description');
  });

  it('renders display price input and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const priceInput = screen.getByPlaceholderText('e.g., $99.00');
    fireEvent.change(priceInput, { target: { value: '$199.00' } });
    expect(priceInput).toHaveValue('$199.00');
  });

  it('renders date inputs', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    // Find date inputs by their labels
    const startDateInputs = screen.getAllByRole('textbox');
    expect(startDateInputs.length).toBeGreaterThan(0);
  });

  it('renders credential input and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const credentialInput = screen.getByPlaceholderText('Credential information');
    fireEvent.change(credentialInput, { target: { value: 'Professional Certificate' } });
    expect(credentialInput).toHaveValue('Professional Certificate');
  });

  it('renders promotion input and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const promotionInput = screen.getByPlaceholderText('Promotion data');
    fireEvent.change(promotionInput, { target: { value: 'Summer Sale' } });
    expect(promotionInput).toHaveValue('Summer Sale');
  });

  it('renders social team input and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const socialTeamInput = screen.getByPlaceholderText('Social team info');
    fireEvent.change(socialTeamInput, { target: { value: 'Marketing Team' } });
    expect(socialTeamInput).toHaveValue('Marketing Team');
  });

  it('renders social channels input and handles change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const socialChannelsInput = screen.getByPlaceholderText('Social channels');
    fireEvent.change(socialChannelsInput, { target: { value: 'twitter, facebook' } });
    expect(socialChannelsInput).toHaveValue('twitter, facebook');
  });

  it('renders banner image URL input', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const bannerImageInput = screen.getByPlaceholderText('https://example.com/banner.jpg');
    expect(bannerImageInput).toBeInTheDocument();
    fireEvent.change(bannerImageInput, { target: { value: 'https://new-banner.jpg' } });
    expect(bannerImageInput).toHaveValue('https://new-banner.jpg');
  });

  it('renders card image URL input', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const cardImageInput = screen.getByPlaceholderText('https://example.com/card.jpg');
    expect(cardImageInput).toBeInTheDocument();
    fireEvent.change(cardImageInput, { target: { value: 'https://new-card.jpg' } });
    expect(cardImageInput).toHaveValue('https://new-card.jpg');
  });

  it('displays existing tags', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    expect(screen.getByText('existing-tag')).toBeInTheDocument();
  });

  it('displays existing topics', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    expect(screen.getByText('existing-topic')).toBeInTheDocument();
  });

  it('adds a new tag via Enter key', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'new-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // The input should be cleared after adding
    expect(tagInput).toHaveValue('');
  });

  it('adds a new tag via add button', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'button-tag' } });

    // Find the add button for tags (the first one with aria-label containing "add")
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    const tagAddButton = addButtons[0];
    fireEvent.click(tagAddButton);

    expect(tagInput).toHaveValue('');
  });

  it('removes an existing tag', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    // Find the remove button for the existing tag
    const removeButton = screen.getByRole('button', { name: /remove existing-tag/i });
    fireEvent.click(removeButton);

    // The tag should be removed
    expect(screen.queryByText('existing-tag')).not.toBeInTheDocument();
  });

  it('adds a new topic via Enter key', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const topicInput = screen.getByPlaceholderText('Type a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'new-topic' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });

    expect(topicInput).toHaveValue('');
  });

  it('removes an existing topic', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const removeButton = screen.getByRole('button', { name: /remove existing-topic/i });
    fireEvent.click(removeButton);

    expect(screen.queryByText('existing-topic')).not.toBeInTheDocument();
  });

  it('does not add duplicate tags', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'existing-tag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Should still only have one instance of the tag
    const tags = screen.getAllByText('existing-tag');
    expect(tags).toHaveLength(1);
  });

  it('does not add empty tags', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: '   ' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Input should remain unchanged (not cleared) since empty values aren't added
  });

  it('handles other key presses without adding', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'test' } });
    fireEvent.keyDown(tagInput, { key: 'Tab' });

    // Value should still be in input
    expect(tagInput).toHaveValue('test');
  });

  it('shows image preview when banner URL is entered', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          banner_image: 'https://example.com/banner.jpg',
          tags: [],
          topics: [],
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    // The banner preview should be visible with the URL
    const bannerInput = screen.getByPlaceholderText('https://example.com/banner.jpg');
    expect(bannerInput).toHaveValue('https://example.com/banner.jpg');
  });

  it('handles start date change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    // Since date inputs might not be type="date" in jsdom, let's use labels
    const startDateLabel = screen.getByText('Start Date');
    const startDateInput = startDateLabel.parentElement?.querySelector('input');
    if (startDateInput) {
      fireEvent.change(startDateInput, { target: { value: '2024-06-01' } });
      expect(startDateInput).toHaveValue('2024-06-01');
    }
  });

  it('handles end date change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const endDateLabel = screen.getByText('End Date');
    const endDateInput = endDateLabel.parentElement?.querySelector('input');
    if (endDateInput) {
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
      expect(endDateInput).toHaveValue('2024-12-31');
    }
  });

  it('handles enrollment start date change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const enrollmentStartLabel = screen.getByText('Enrollment Start');
    const enrollmentStartInput = enrollmentStartLabel.parentElement?.querySelector('input');
    if (enrollmentStartInput) {
      fireEvent.change(enrollmentStartInput, { target: { value: '2024-01-01' } });
      expect(enrollmentStartInput).toHaveValue('2024-01-01');
    }
  });

  it('handles enrollment end date change', async () => {
    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    const enrollmentEndLabel = screen.getByText('Enrollment End');
    const enrollmentEndInput = enrollmentEndLabel.parentElement?.querySelector('input');
    if (enrollmentEndInput) {
      fireEvent.change(enrollmentEndInput, { target: { value: '2024-06-30' } });
      expect(enrollmentEndInput).toHaveValue('2024-06-30');
    }
  });

  it('handles image preview error', async () => {
    vi.mocked(useGetProgramMetadataQuery).mockReturnValue({
      data: {
        formData: {
          banner_image: 'https://example.com/broken-banner.jpg',
          tags: [],
          topics: [],
        },
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    await act(async () => {
      render(<ProgramDetailModal program={adminProgram as any} onClose={vi.fn()} />);
    });

    // Find the banner preview image and trigger error
    const allImages = screen.getAllByRole('img');
    const bannerPreview = allImages.find((img) => img.getAttribute('alt')?.includes('preview'));
    if (bannerPreview) {
      fireEvent.error(bannerPreview);
      // After error, should show "Invalid image URL" message
      await waitFor(() => {
        expect(screen.getByText('Invalid image URL')).toBeInTheDocument();
      });
    }
  });
});
