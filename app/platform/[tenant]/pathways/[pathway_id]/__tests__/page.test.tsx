import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img src={typeof src === 'string' ? src : ''} alt={alt} onError={onError} {...props} />
  ),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant', pathway_id: 'uuid-1' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
}));

vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random-image.jpg'),
  getUserName: vi.fn(() => 'test-user'),
  handleNotLoggedInAction: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: { lms: vi.fn(() => 'https://lms.example.com') },
  },
}));

const mockHandleSearch = vi.fn();
vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalog: vi.fn(() => ({ handleSearch: mockHandleSearch })),
}));

const mockGetUserEnrolledPathways = vi.fn();
const mockGetPathwayCompletion = vi.fn();
const mockGetPathwayList = vi.fn();
const mockCreateEnrollment = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetUserEnrolledPathwaysQuery: () => [mockGetUserEnrolledPathways, { isLoading: false }],
  useLazyGetPathwayCompletionQuery: () => [mockGetPathwayCompletion],
  useLazyGetPathwayListQuery: () => [mockGetPathwayList],
  useCreateCatalogPathwaySelfEnrollmentMutation: () => [
    mockCreateEnrollment,
    { isError: false, isSuccess: false },
  ],
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

import PathwayDetailPage from '../page';

const pathwayFixture = {
  pathway_uuid: 'uuid-1',
  name: 'Data Pathway',
  platform_key: 'test-tenant',
  metadata: { banner_image_asset_path: '/banner.jpg' },
  path: [
    {
      id: 'item-1',
      item_type: 'course',
      course_id: 'cid-1',
      name: 'Course A',
      edx_data: { course_image_asset_path: '/asset/a.jpg' },
    },
    {
      id: 'item-2',
      item_type: 'resource',
      name: 'External Resource',
      url: 'https://example.com/resource',
      data: { banner_image: '/resource.jpg' },
    },
  ],
};

const renderPage = async () => {
  render(<PathwayDetailPage />);
  await waitFor(() => {
    expect(screen.getByTestId('pathway-detail-content')).toBeInTheDocument();
  });
};

describe('PathwayDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleSearch.mockResolvedValue({
      data: { results: [{ type: 'pathway', data: pathwayFixture }] },
    });
    mockGetUserEnrolledPathways.mockResolvedValue({ data: [] });
    // Decimal on purpose — the page shows the rounded value ("40%").
    mockGetPathwayCompletion.mockResolvedValue({ data: { completion_percentage: 40.44 } });
    mockGetPathwayList.mockResolvedValue({ data: [] });
    mockCreateEnrollment.mockResolvedValue({});
  });

  it('shows the loading spinner while fetching', () => {
    mockHandleSearch.mockReturnValue(new Promise(() => {}));
    render(<PathwayDetailPage />);
    expect(screen.getByTestId('pathway-page-loading')).toBeInTheDocument();
  });

  it('renders the pathway content as catalog-style cards', async () => {
    await renderPage();
    expect(screen.getByTestId('pathway-item-0')).toHaveTextContent('Course A');
    expect(screen.getByTestId('pathway-item-1')).toHaveTextContent('External Resource');
    expect(screen.getAllByTestId('discover-content-card').length).toBe(2);
  });

  it('navigates to the course page when a course item is clicked', async () => {
    await renderPage();
    fireEvent.click(
      within(screen.getByTestId('pathway-item-0')).getByTestId('discover-content-card'),
    );
    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/courses/cid-1');
  });

  it('opens resources in a new tab instead of routing', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    await renderPage();
    fireEvent.click(
      within(screen.getByTestId('pathway-item-1')).getByTestId('discover-content-card'),
    );
    expect(openSpy).toHaveBeenCalledWith('https://example.com/resource', '_blank');
    expect(mockPush).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('shows the Enroll CTA when not enrolled and enrolls on click', async () => {
    await renderPage();
    const cta = screen.getByTestId('pathway-page-cta');
    expect(cta).toHaveTextContent('Enroll Now');
    fireEvent.click(cta);
    await waitFor(() => expect(mockCreateEnrollment).toHaveBeenCalled());
  });

  it('hides the Enroll CTA when already enrolled', async () => {
    mockGetUserEnrolledPathways.mockResolvedValue({
      data: [{ active: true, pathway_uuid: 'uuid-1' }],
    });
    await renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('pathway-page-cta')).not.toBeInTheDocument();
    });
  });

  it('renders the completion progress', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('falls back to the pathway list when the catalog search returns nothing', async () => {
    mockHandleSearch.mockResolvedValue({ data: { results: [] } });
    mockGetPathwayList.mockResolvedValue({ data: [pathwayFixture] });
    await renderPage();
    expect(mockGetPathwayList).toHaveBeenCalled();
    expect(screen.getByTestId('pathway-item-0')).toHaveTextContent('Course A');
  });

  it('shows the empty box when the pathway cannot be found', async () => {
    mockHandleSearch.mockResolvedValue({ data: { results: [] } });
    mockGetPathwayList.mockResolvedValue({ data: [] });
    render(<PathwayDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-box')).toHaveTextContent('No pathway data found.');
    });
  });

  it('shows the pathway-level empty message when the pathway has no content', async () => {
    mockHandleSearch.mockResolvedValue({
      data: { results: [{ type: 'pathway', data: { ...pathwayFixture, path: [] } }] },
    });
    await renderPage();
    expect(screen.getByTestId('empty-box')).toHaveTextContent('No courses in this pathway');
  });

  it('renders the banner image', async () => {
    await renderPage();
    expect(screen.getByTestId('pathway-page-banner-image')).toHaveAttribute(
      'src',
      'https://lms.example.com/banner.jpg',
    );
  });
});
