import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img src={typeof src === 'string' ? src : ''} alt={alt} onError={onError} {...props} />
  ),
}));

const mockPush = vi.fn();
const mockParams = vi.hoisted(() => ({ program_id: 'prog-1' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
  useSearchParams: () => ({ get: vi.fn(() => null) }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
  setAccessCheckResponse: vi.fn((payload) => ({ type: 'setAccessCheckResponse', payload })),
  setDisplayMonetizationCheckoutModal: vi.fn((payload) => ({
    type: 'setDisplayMonetizationCheckoutModal',
    payload,
  })),
}));

const mockCheckAccess = vi.fn();
const mockCreateCatalogProgramSelfEnrollment = vi.fn();
const mockGetUserEnrolledPrograms = vi.fn();
const mockGetProgramCompletion = vi.fn();

const enrollmentMutationState = vi.hoisted(() => ({ isError: false, isSuccess: false }));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useCreateCatalogProgramSelfEnrollmentMutation: () => [
    mockCreateCatalogProgramSelfEnrollment,
    enrollmentMutationState,
  ],
  useLazyCheckAccessQuery: () => [mockCheckAccess],
  useLazyGetProgramCompletionQuery: () => [mockGetProgramCompletion],
  useLazyGetUserEnrolledProgramsQuery: () => [mockGetUserEnrolledPrograms, { isLoading: false }],
}));

vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random.png'),
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  handleNotLoggedInAction: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

const isAdminState = vi.hoisted(() => ({ value: true }));
const currentTenantState = vi.hoisted(() => ({
  value: { key: 'main', enable_monetization: true } as any,
}));
const canMonetizeState = vi.hoisted(() => ({ value: true }));
vi.mock('@/utils/localstorage', () => ({
  useIsAdmin: () => isAdminState.value,
  useCurrentTenant: () => ({ currentTenant: currentTenantState.value }),
  useUserTenants: () => ({ userTenants: [{ key: 'main' }] }),
  canMonetize: vi.fn(() => canMonetizeState.value),
}));

const mockHandleSearch = vi.fn();
vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalog: () => ({ handleSearch: mockHandleSearch }),
}));

const programMetadataState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
  refetch: vi.fn(),
}));
const mockUpdateProgramMetadata = vi.fn();
const updateMutationState = vi.hoisted(() => ({ isLoading: false }));

vi.mock('@/services/studio', () => ({
  useGetProgramMetadataQuery: vi.fn(() => programMetadataState),
  useUpdateProgramMetadataMutation: () => [mockUpdateProgramMetadata, updateMutationState],
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid="select">
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectValue: () => null,
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      data-testid="invitation-only-switch"
    />
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...rest }: any) => (
    <div data-default={defaultValue} {...rest}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  TabsTrigger: ({ value, children, ...rest }: any) => (
    <button data-value={value} {...rest}>
      {children}
    </button>
  ),
  TabsContent: ({ value, children, ...rest }: any) => (
    <div data-value={value} {...rest}>
      {children}
    </div>
  ),
}));

vi.mock('lucide-react', () => {
  const stub = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = `Icon(${name})`;
    return Icon;
  };
  return {
    Award: stub('award'),
    Calendar: stub('calendar'),
    Clock: stub('clock'),
    DollarSign: stub('dollar'),
    Globe: stub('globe'),
    ImageIcon: stub('image'),
    Loader2: stub('loader'),
    Plus: stub('plus'),
    Save: stub('save'),
    X: stub('x'),
  };
});

vi.mock('lodash', () => ({
  default: {
    isEmpty: (val: any) =>
      val == null ||
      (Array.isArray(val) && val.length === 0) ||
      (typeof val === 'object' && Object.keys(val).length === 0),
  },
}));

vi.mock('dayjs', () => {
  const fn = (_d?: any) => ({ format: () => 'Jan 1, 2026' });
  return { default: fn };
});

import ProgramDetailPage from '../page';
import { toast } from 'sonner';

const programFixture = {
  program_id: 'prog-1',
  program_key: 'prog-key',
  name: 'Sample Program',
  platform_key: 'test-tenant',
  org: 'test-tenant',
  program_metadata: {
    card_image: 'https://cdn.example.com/card.png',
    display_price: '$99',
    language: 'English',
    start_date: '2026-01-01',
    credential: 'Cert',
  },
};

const setSearchToReturnProgram = (extras: Partial<typeof programFixture> = {}) => {
  mockHandleSearch.mockReset();
  mockHandleSearch.mockImplementation(async (args: any) => {
    if (args?.returnItems && !args?.programId?.includes?.('detail-only')) {
      return {
        data: {
          results: [
            {
              ...programFixture,
              ...extras,
              courses: [
                {
                  course: {
                    id: 'c1',
                    course_id: 'cid-1',
                    name: 'Course A',
                    edx_data: { course_image_asset_path: '/img-a.png' },
                  },
                },
              ],
            },
          ],
        },
      };
    }
    return { data: { results: [] } };
  });
};

const renderPage = async () => {
  const utils = render(<ProgramDetailPage />);
  await waitFor(() => {
    expect(screen.queryByTestId('program-page-loading')).not.toBeInTheDocument();
  });
  return utils;
};

describe('ProgramDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentMutationState.isError = false;
    enrollmentMutationState.isSuccess = false;
    updateMutationState.isLoading = false;
    isAdminState.value = true;
    programMetadataState.data = undefined;
    programMetadataState.isLoading = false;
    programMetadataState.refetch = vi.fn();
    setSearchToReturnProgram();
    mockCheckAccess.mockResolvedValue({ data: { has_access: true } });
    mockCreateCatalogProgramSelfEnrollment.mockResolvedValue({});
    mockGetUserEnrolledPrograms.mockResolvedValue({ data: [] });
    mockGetProgramCompletion.mockResolvedValue({
      data: { completion_percentage: 42 },
    });
    mockUpdateProgramMetadata.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('shows the loading spinner while program data is being fetched', () => {
    mockHandleSearch.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<ProgramDetailPage />);
    expect(screen.getByTestId('program-page-loading')).toBeInTheDocument();
  });

  it('redirects to /error/403 when no program data is returned', async () => {
    mockHandleSearch.mockResolvedValue({ data: { results: [] } });
    render(<ProgramDetailPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
    });
  });

  it('redirects to /error/403 when handleSearch throws', async () => {
    mockHandleSearch.mockRejectedValue(new Error('boom'));
    render(<ProgramDetailPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/error/403');
    });
  });

  it('renders program name once loaded', async () => {
    await renderPage();
    expect(screen.getByTestId('program-page-name')).toHaveTextContent('Sample Program');
  });

  it('renders the admin tabs when admin user is on their tenant', async () => {
    await renderPage();
    expect(screen.getByTestId('program-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
  });

  it('does NOT render tabs when the user is not admin', async () => {
    isAdminState.value = false;
    await renderPage();
    expect(screen.queryByTestId('program-tabs')).not.toBeInTheDocument();
  });

  it('renders the courses list when programDetail loads', async () => {
    isAdminState.value = false;
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('course-card-0')).toBeInTheDocument();
    });
    expect(screen.getByTestId('course-name-0')).toHaveTextContent('Course A');
  });

  it('navigates to a course when a course card is clicked', async () => {
    isAdminState.value = false;
    await renderPage();
    await waitFor(() => expect(screen.getByTestId('course-card-0')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('course-card-0'));
    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/courses/cid-1');
  });

  it('opens the course when Enter/Space is pressed on a card', async () => {
    isAdminState.value = false;
    await renderPage();
    await waitFor(() => expect(screen.getByTestId('course-card-0')).toBeInTheDocument());
    fireEvent.keyDown(screen.getByTestId('course-card-0'), { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/courses/cid-1');
  });

  it('shows the empty box when programDetail has no courses', async () => {
    mockHandleSearch.mockReset();
    mockHandleSearch.mockImplementation(async (args: any) => {
      if (args?.returnItems) {
        return { data: { results: [{ ...programFixture, courses: [] }] } };
      }
      return { data: { results: [] } };
    });
    isAdminState.value = false;
    await renderPage();
    await waitFor(() => expect(screen.getByTestId('empty-box')).toBeInTheDocument());
  });

  it('renders the courses-loading spinner during programDetail fetch', async () => {
    let resolveDetail: (v: any) => void = () => {};
    let firstCall = true;
    mockHandleSearch.mockImplementation(() => {
      if (firstCall) {
        firstCall = false;
        return Promise.resolve({
          data: {
            results: [{ ...programFixture, courses: [{ course: { id: 'c', course_id: 'c' } }] }],
          },
        });
      }
      return new Promise((resolve) => {
        resolveDetail = resolve;
      });
    });
    isAdminState.value = false;
    render(<ProgramDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('courses-loading')).toBeInTheDocument();
    });
    act(() => resolveDetail({ data: { results: [] } }));
  });

  it('shows "Enroll Now" CTA when user has access and is not enrolled', async () => {
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    expect(cta).toHaveTextContent('Enroll Now');
  });

  it('hides the CTA when the user is already enrolled', async () => {
    mockGetUserEnrolledPrograms.mockResolvedValue({
      data: [{ program_id: 'prog-1', active: true }],
    });
    await renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('program-page-cta')).not.toBeInTheDocument();
    });
  });

  it('falls back to enrollmentStatus=false when getUserEnrolledPrograms rejects', async () => {
    mockGetUserEnrolledPrograms.mockRejectedValue(new Error('fail'));
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    expect(cta).toBeInTheDocument();
  });

  it('shows "Purchase Now" CTA when monetization access is denied', async () => {
    mockCheckAccess.mockResolvedValue({ data: { has_access: false } });
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    await waitFor(() => expect(cta).toHaveTextContent('Purchase Now'));
  });

  it('dispatches setDisplayMonetizationCheckoutModal when Purchase Now is clicked', async () => {
    mockCheckAccess.mockResolvedValue({ data: { has_access: false, pricing: { amount: 99 } } });
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    fireEvent.click(cta);
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setDisplayMonetizationCheckoutModal',
        payload: true,
      });
    });
  });

  it('reads access data from error payload when checkAccess returns error', async () => {
    mockCheckAccess.mockResolvedValue({ error: { data: { has_access: false } } });
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    await waitFor(() => expect(cta).toHaveTextContent('Purchase Now'));
  });

  it('handles checkAccess exception without crashing', async () => {
    mockCheckAccess.mockRejectedValue(new Error('access error'));
    await renderPage();
    expect(screen.getByTestId('program-page-cta')).toBeInTheDocument();
  });

  it('calls createCatalogProgramSelfEnrollment when Enroll Now is clicked', async () => {
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    fireEvent.click(cta);
    await waitFor(() => {
      expect(mockCreateCatalogProgramSelfEnrollment).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Enrolled into program successfully');
    });
  });

  it('shows error toast when enrollment mutation throws', async () => {
    mockCreateCatalogProgramSelfEnrollment.mockRejectedValue(new Error('fail'));
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    fireEvent.click(cta);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to enroll into program');
    });
  });

  it('shows error toast when enrollment mutation returns isError', async () => {
    enrollmentMutationState.isError = true;
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    fireEvent.click(cta);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to enroll into program');
    });
  });

  it('shows program completion progress when present', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('42%')).toBeInTheDocument();
    });
  });

  it('handles program completion fetch failure', async () => {
    mockGetProgramCompletion.mockRejectedValue(new Error('boom'));
    await renderPage();
    expect(screen.queryByText('42%')).not.toBeInTheDocument();
  });

  it('renders metadata sidebar when display_price/language/start_date/credential is set', async () => {
    await renderPage();
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Cert')).toBeInTheDocument();
  });

  it('falls back to randomImage when card_image is missing', async () => {
    setSearchToReturnProgram({ program_metadata: undefined as any });
    await renderPage();
    const img = screen.getByTestId('program-page-card-image');
    expect(img).toHaveAttribute('src', '/random.png');
  });

  it('uses card_image directly when it is an absolute URL', async () => {
    await renderPage();
    const img = screen.getByTestId('program-page-card-image');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/card.png');
  });

  it('prepends LMS URL when card_image is a relative path', async () => {
    setSearchToReturnProgram({
      program_metadata: { card_image: '/img.png' } as any,
    });
    await renderPage();
    const img = screen.getByTestId('program-page-card-image');
    expect(img).toHaveAttribute('src', 'https://lms.example.com/img.png');
  });

  it('falls back to randomImage when card image fails to load', async () => {
    await renderPage();
    const img = screen.getByTestId('program-page-card-image');
    fireEvent.error(img);
    expect((img as HTMLImageElement).src).toContain('/random.png');
  });

  it('falls back to randomImage when a course image fails to load', async () => {
    isAdminState.value = false;
    await renderPage();
    const cardImage = await screen.findByAltText('Course A');
    fireEvent.error(cardImage);
    expect((cardImage as HTMLImageElement).src).toContain('/random.png');
  });

  it('populates settings form when metadata loads', async () => {
    programMetadataState.data = {
      formData: {
        subject: 'CS',
        slug: 'cs-101',
        tags: ['ai'],
        level: 'Beginner',
        topics: ['ml'],
        description: 'Hello',
        display_price: '$10',
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2026-12-31T00:00:00Z',
        enrollment_start: '2026-01-01T00:00:00Z',
        enrollment_end: '2026-01-15T00:00:00Z',
        language: 'en',
        credential: 'Cert',
        catalog_visibility: 'about',
        invitation_only: true,
        banner_image: 'https://cdn.example.com/banner.png',
        card_image: 'https://cdn.example.com/card.png',
        promotion: 'promo',
        social_team: 'team',
        social_channels: ['a', 'b'],
      },
    };
    await renderPage();
    expect((screen.getByDisplayValue('CS') as HTMLInputElement).value).toBe('CS');
    expect((screen.getByDisplayValue('cs-101') as HTMLInputElement).value).toBe('cs-101');
    expect((screen.getByDisplayValue('Beginner') as HTMLInputElement).value).toBe('Beginner');
    expect((screen.getByDisplayValue('Hello') as HTMLTextAreaElement).value).toBe('Hello');
    expect((screen.getByDisplayValue('a, b') as HTMLInputElement).value).toBe('a, b');
  });

  it('handles non-array tags/topics and non-string promotion/social_channels safely', async () => {
    programMetadataState.data = {
      formData: {
        tags: 'not-array',
        topics: null,
        promotion: { complex: true },
        social_channels: undefined,
      },
    };
    await renderPage();
    expect(screen.getByTestId('basic-information-section')).toBeInTheDocument();
  });

  it('shows the settings loader when metadata is loading', async () => {
    programMetadataState.isLoading = true;
    await renderPage();
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
  });

  it('saves settings successfully', async () => {
    programMetadataState.data = { formData: { subject: 'CS', tags: [], topics: [] } };
    await renderPage();
    fireEvent.click(screen.getByTestId('save-settings-button'));
    await waitFor(() => {
      expect(mockUpdateProgramMetadata).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Program settings saved successfully');
    });
  });

  it('rejects save when end_date is before start_date', async () => {
    programMetadataState.data = {
      formData: {
        subject: '',
        tags: [],
        topics: [],
        start_date: '2026-12-01T00:00:00Z',
        end_date: '2026-01-01T00:00:00Z',
      },
    };
    await renderPage();
    fireEvent.click(screen.getByTestId('save-settings-button'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('End date must be after start date');
    });
    expect(mockUpdateProgramMetadata).not.toHaveBeenCalled();
  });

  it('rejects save when enrollment_end is before enrollment_start', async () => {
    programMetadataState.data = {
      formData: {
        tags: [],
        topics: [],
        enrollment_start: '2026-12-01T00:00:00Z',
        enrollment_end: '2026-01-01T00:00:00Z',
      },
    };
    await renderPage();
    fireEvent.click(screen.getByTestId('save-settings-button'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Enrollment end date must be after enrollment start date',
      );
    });
  });

  it('shows error toast when updateProgramMetadata rejects', async () => {
    mockUpdateProgramMetadata.mockReturnValue({ unwrap: () => Promise.reject(new Error('fail')) });
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    fireEvent.click(screen.getByTestId('save-settings-button'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save program settings');
    });
  });

  it('updates form fields via the Subject input', async () => {
    programMetadataState.data = { formData: { subject: '', tags: [], topics: [] } };
    await renderPage();
    const subject = screen.getByPlaceholderText('e.g., Computer Science') as HTMLInputElement;
    fireEvent.change(subject, { target: { value: 'New Subject' } });
    expect(subject.value).toBe('New Subject');
  });

  it('toggles invitation_only switch', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [], invitation_only: false } };
    await renderPage();
    const sw = screen.getByTestId('invitation-only-switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(screen.getByTestId('invitation-only-switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('changes catalog_visibility via the Select', async () => {
    programMetadataState.data = {
      formData: { tags: [], topics: [], catalog_visibility: 'both' },
    };
    await renderPage();
    const select = screen.getByTestId('select').querySelector('select')!;
    fireEvent.change(select, { target: { value: 'about' } });
    expect((select as HTMLSelectElement).value).toBe('about');
  });

  it('shows the saving spinner when isSavingSettings=true', async () => {
    updateMutationState.isLoading = true;
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    expect(screen.getByLabelText('Saving')).toBeInTheDocument();
  });

  it('adds a tag via MultiValueInput', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter') as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: 'ai' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByLabelText('Remove ai')).toBeInTheDocument();
  });

  it('does not add a duplicate tag', async () => {
    programMetadataState.data = { formData: { tags: ['ai'], topics: [] } };
    await renderPage();
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter') as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: 'ai' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    const removeButtons = screen.getAllByLabelText('Remove ai');
    expect(removeButtons.length).toBe(1);
  });

  it('does not add an empty tag', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter') as HTMLInputElement;
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.queryByLabelText(/Remove /)).not.toBeInTheDocument();
  });

  it('adds a tag via the plus button', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter') as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: 'ml' } });
    fireEvent.click(screen.getByLabelText('Add tags'));
    expect(screen.getByLabelText('Remove ml')).toBeInTheDocument();
  });

  it('plus button does nothing for duplicate value', async () => {
    programMetadataState.data = { formData: { tags: ['ml'], topics: [] } };
    await renderPage();
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter') as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: 'ml' } });
    fireEvent.click(screen.getByLabelText('Add tags'));
    expect(screen.getAllByLabelText('Remove ml').length).toBe(1);
  });

  it('removes a tag when the remove button is clicked', async () => {
    programMetadataState.data = { formData: { tags: ['ai', 'ml'], topics: [] } };
    await renderPage();
    fireEvent.click(screen.getByLabelText('Remove ai'));
    expect(screen.queryByLabelText('Remove ai')).not.toBeInTheDocument();
  });

  it('shows ImageUrlInput preview when banner_image is provided', async () => {
    programMetadataState.data = {
      formData: { tags: [], topics: [], banner_image: 'https://cdn.example.com/b.png' },
    };
    await renderPage();
    expect(screen.getByAltText('Banner Image URL preview')).toBeInTheDocument();
  });

  it('falls back to "Invalid image URL" when banner image errors', async () => {
    programMetadataState.data = {
      formData: { tags: [], topics: [], banner_image: 'https://cdn.example.com/bad.png' },
    };
    await renderPage();
    const img = screen.getByAltText('Banner Image URL preview') as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('Invalid image URL')).toBeInTheDocument();
  });

  it('updates the banner_image input field', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [], banner_image: '' } };
    await renderPage();
    const url = screen.getByPlaceholderText('https://example.com/banner.jpg') as HTMLInputElement;
    fireEvent.change(url, { target: { value: 'https://cdn.example.com/new.png' } });
    expect(url.value).toBe('https://cdn.example.com/new.png');
  });

  it('updates each remaining settings text field via its onChange handler', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();

    const fields: Array<[string, string]> = [
      ['e.g., my-program', 'my-prog'],
      ['e.g., Beginner, Intermediate, Advanced', 'Advanced'],
      ['e.g., en', 'fr'],
      ['Program description...', 'desc'],
      ['e.g., $99.00', '$10'],
      ['Credential information', 'Cert'],
      ['Promotion data', 'PR'],
      ['Social team info', 'Team A'],
      ['Social channels', 'a, b'],
    ];

    for (const [placeholder, value] of fields) {
      const input = screen.getByPlaceholderText(placeholder) as HTMLInputElement;
      fireEvent.change(input, { target: { value } });
      expect(input.value).toBe(value);
    }
  });

  it('updates each settings date field via its onChange handler', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    const dates = document.querySelectorAll('input[type="date"]');
    expect(dates.length).toBe(4);
    dates.forEach((el, idx) => {
      const newValue = `2026-0${idx + 1}-01`;
      fireEvent.change(el, { target: { value: newValue } });
      expect((el as HTMLInputElement).value).toBe(newValue);
    });
  });

  it('updates the card_image (second ImageUrlInput) via its onChange handler', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [], card_image: '' } };
    await renderPage();
    const url = screen.getByPlaceholderText('https://example.com/card.jpg') as HTMLInputElement;
    fireEvent.change(url, { target: { value: 'https://cdn.example.com/card-new.png' } });
    expect(url.value).toBe('https://cdn.example.com/card-new.png');
  });

  it('updates topic via the Topics MultiValueInput onChange handler', async () => {
    programMetadataState.data = { formData: { tags: [], topics: [] } };
    await renderPage();
    const topicInput = screen.getByPlaceholderText(
      'Type a topic and press Enter',
    ) as HTMLInputElement;
    fireEvent.change(topicInput, { target: { value: 'ml' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    expect(screen.getByLabelText('Remove ml')).toBeInTheDocument();
  });

  it('shows error toast when handleProgramDetailFetch throws', async () => {
    let callCount = 0;
    mockHandleSearch.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return { data: { results: [programFixture] } };
      }
      throw new Error('detail fetch failed');
    });
    isAdminState.value = false;
    await renderPage();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error fetching program details');
    });
  });

  it('deduplicates courses across results and surfaces them from multiple program entries', async () => {
    mockHandleSearch.mockReset();
    let callCount = 0;
    mockHandleSearch.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return {
          data: {
            results: [
              {
                ...programFixture,
                courses: [
                  {
                    course: {
                      id: 'a',
                      course_id: 'dup',
                      name: 'Dup',
                      edx_data: { course_image_asset_path: null },
                    },
                  },
                ],
              },
            ],
          },
        };
      }
      // detail fetch: two program-shaped results with overlapping courses
      return {
        data: {
          results: [
            {
              courses: [
                {
                  course: {
                    id: 'a',
                    course_id: 'cid-shared',
                    name: 'Shared',
                    edx_data: { course_image_asset_path: '/shared.png' },
                  },
                },
              ],
            },
            {
              courses: [
                {
                  course: {
                    id: 'a',
                    course_id: 'cid-shared',
                    name: 'Shared',
                    edx_data: { course_image_asset_path: '/shared.png' },
                  },
                },
                {
                  course: {
                    id: 'b',
                    course_id: 'cid-extra',
                    name: 'Extra',
                    edx_data: {},
                  },
                },
              ],
            },
            {
              /* no courses array at all — should be ignored by the reduce */
            },
          ],
        },
      };
    });
    isAdminState.value = false;
    await renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('course-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
    });
    // No third card — the dup is deduplicated, the empty result contributes nothing
    expect(screen.queryByTestId('course-card-2')).not.toBeInTheDocument();
  });

  it('does not enroll a second time while a submission is in flight', async () => {
    let resolveEnroll: (v: any) => void = () => {};
    mockCreateCatalogProgramSelfEnrollment.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEnroll = resolve;
        }),
    );
    await renderPage();
    const cta = await screen.findByTestId('program-page-cta');
    fireEvent.click(cta);
    fireEvent.click(cta);
    expect(mockCreateCatalogProgramSelfEnrollment).toHaveBeenCalledTimes(1);
    act(() => resolveEnroll({}));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
