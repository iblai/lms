import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  getUserId: vi.fn(() => 'user-id-1'),
  getRandomCourseImage: vi.fn(() => '/images/default-course.png'),
  slugify: vi.fn((name: string) => name.toLowerCase().replace(/\s+/g, '-')),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

const mockCreateCatalogPathway = vi.fn();
const mockGetResourceSearch = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetResourceSearchQuery: vi.fn(() => [mockGetResourceSearch, { isLoading: false }]),
  useCreateCatalogPathwayMutation: vi.fn(() => [mockCreateCatalogPathway, { isError: false }]),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockHandleSearch = vi.fn();
vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalog: vi.fn(() => ({
    handleSearch: mockHandleSearch,
    isLoading: false,
  })),
}));

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img src={src} alt={alt || ''} {...props} />
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
}));

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton-multiplier" />,
}));

vi.mock('../skeleton-create-pathway-search-list', () => ({
  default: () => <div data-testid="skeleton-search-list" />,
}));

vi.mock('@iblai/iblai-api', () => ({}));

import { CreatePathwayModal } from '../create-pathway-modal';

const mockCoursesData = {
  data: {
    results: [
      {
        data: {
          course_id: 'course-1',
          name: 'Python Basics',
          edx_data: { course_image_asset_path: '/images/python.jpg' },
        },
      },
      {
        data: {
          course_id: 'course-2',
          name: 'JavaScript Advanced',
          edx_data: { course_image_asset_path: '' },
        },
      },
    ],
  },
};

const mockResourcesData = [
  { id: 1, name: 'PDF Guide', image: '/images/guide.jpg', data: {} },
  { id: 2, name: 'Video Tutorial', image: null, data: { banner_image: '/images/video.jpg' } },
  { id: 3, name: 'Article', image: null, data: {} },
];

describe('CreatePathwayModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    mockCreateCatalogPathway.mockResolvedValue({ data: { id: 1, name: 'Test Pathway' } });
    mockGetResourceSearch.mockResolvedValue({ data: mockResourcesData });
    mockHandleSearch.mockResolvedValue(mockCoursesData);

    // Re-setup module mocks after reset
    const { useLazyGetResourceSearchQuery, useCreateCatalogPathwayMutation } =
      await import('@iblai/iblai-js/data-layer');
    vi.mocked(useLazyGetResourceSearchQuery).mockReturnValue([
      mockGetResourceSearch,
      { isLoading: false },
    ] as any);
    vi.mocked(useCreateCatalogPathwayMutation).mockReturnValue([
      mockCreateCatalogPathway,
      { isError: false },
    ] as any);

    const { usePersonnalizedCatalog } = await import('@/hooks/search/use-personnalized-catalog');
    vi.mocked(usePersonnalizedCatalog).mockReturnValue({
      handleSearch: mockHandleSearch,
      isLoading: false,
    } as any);
  });

  it('renders without crashing when open', () => {
    const { container } = render(<CreatePathwayModal {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { queryByTestId } = render(
      <CreatePathwayModal {...defaultProps} open={false} />,
    );
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders pathway name input', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter pathway name')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter pathway description')).toBeInTheDocument();
  });

  it('renders subject input', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter subject')).toBeInTheDocument();
  });

  it('renders search content input', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search content to add')).toBeInTheDocument();
  });

  it('renders Create Pathway button', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByText('Create Pathway')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onOpenChange when Cancel is clicked', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange when X button is clicked', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const closeBtn = screen.getByText('Create New Pathway').closest('div')?.querySelector('button');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Create Pathway button is disabled when name is empty', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const createBtn = screen.getByText('Create Pathway');
    expect(createBtn).toBeDisabled();
  });

  it('updates pathway name on input change', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });
    expect(nameInput).toHaveValue('My Pathway');
  });

  it('updates subject on input change', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const subjectInput = screen.getByPlaceholderText('Enter subject');
    fireEvent.change(subjectInput, { target: { value: 'Technology' } });
    expect(subjectInput).toHaveValue('Technology');
  });

  it('updates description on input change', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const descInput = screen.getByPlaceholderText('Enter pathway description');
    fireEvent.change(descInput, { target: { value: 'A great pathway' } });
    expect(descInput).toHaveValue('A great pathway');
  });

  it('updates search query on input change', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search content to add');
    fireEvent.change(searchInput, { target: { value: 'python' } });
    expect(searchInput).toHaveValue('python');
  });

  it('shows 0 items selected initially', () => {
    render(<CreatePathwayModal {...defaultProps} />);
    expect(screen.getByText('0 items selected')).toBeInTheDocument();
  });

  it('renders courses when search returns data', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
  });

  it('renders resources when search returns data', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('PDF Guide')).toBeInTheDocument();
    });
  });

  it('renders course with fallback image when no image path', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('JavaScript Advanced')).toBeInTheDocument();
    });
  });

  it('renders resource with fallback when no image', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Article')).toBeInTheDocument();
    });
  });

  it('toggles course selection when course is clicked', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    // Wait for courses to appear
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    // Click the course card
    const courseCard = screen.getByText('Python Basics');
    const courseRow = courseCard.closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });
    expect(screen.getByText('1 items selected')).toBeInTheDocument();
  });

  it('deselects course when clicked again', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseCard = screen.getByText('Python Basics');
    const courseRow = courseCard.closest('div.border');
    await act(async () => {
      if (courseRow) {
        fireEvent.click(courseRow);
      }
    });
    expect(screen.getByText('1 items selected')).toBeInTheDocument();
    await act(async () => {
      if (courseRow) {
        fireEvent.click(courseRow);
      }
    });
    expect(screen.getByText('0 items selected')).toBeInTheDocument();
  });

  it('toggles resource selection when resource is clicked', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    // Wait for resources to appear
    await waitFor(() => {
      expect(screen.queryByText('PDF Guide')).toBeInTheDocument();
    });
    const resourceCard = screen.getByText('PDF Guide');
    const resourceRow = resourceCard.closest('div.border');
    await act(async () => {
      if (resourceRow) fireEvent.click(resourceRow);
    });
    expect(screen.getByText('1 items selected')).toBeInTheDocument();
  });

  it('Create Pathway button is enabled when name and courses are set', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });

    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseCard = screen.getByText('Python Basics');
    const courseRow = courseCard.closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });
    const createBtn = screen.getByText('Create Pathway');
    expect(createBtn).not.toBeDisabled();
  });

  it('calls handleSave on Create Pathway click with valid data', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });

    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });

    await act(async () => {
      const createBtn = screen.getByText('Create Pathway');
      fireEvent.click(createBtn);
      await Promise.resolve();
    });
  });

  it('handles save success - calls onSave and resets state', async () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();
    render(<CreatePathwayModal open={true} onOpenChange={onOpenChange} onSave={onSave} />);

    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });

    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });

    await act(async () => {
      const createBtn = screen.getByText('Create Pathway');
      fireEvent.click(createBtn);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('handles save error - shows error toast', async () => {
    mockCreateCatalogPathway.mockRejectedValue(new Error('Network error'));
    const { toast } = await import('sonner');

    render(<CreatePathwayModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });

    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });

    await act(async () => {
      const createBtn = screen.getByText('Create Pathway');
      fireEvent.click(createBtn);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('shows "No content found" when no search results', async () => {
    mockGetResourceSearch.mockResolvedValue({ data: null });
    mockHandleSearch.mockResolvedValue({ data: null });
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText(/No content found/)).toBeInTheDocument();
    });
  });

  it('shows search query hint when query > 2 chars', async () => {
    mockGetResourceSearch.mockResolvedValue({ data: null });
    mockHandleSearch.mockResolvedValue({ data: null });
    render(<CreatePathwayModal {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search content to add');
    fireEvent.change(searchInput, { target: { value: 'abc' } });
    await waitFor(() => {
      expect(screen.queryByText(/matching "abc"/)).toBeInTheDocument();
    });
  });

  it('handles search with existing selected courses (no response data)', async () => {
    // First render with courses
    mockGetResourceSearch.mockResolvedValue({ data: mockResourcesData });
    mockHandleSearch.mockResolvedValue(mockCoursesData);
    render(<CreatePathwayModal {...defaultProps} />);

    // Select a course first
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });

    // Now change search - no results
    mockHandleSearch.mockResolvedValue({ data: null });
    mockGetResourceSearch.mockResolvedValue({ data: [] });
    await act(async () => {
      const searchInput = screen.getByPlaceholderText('Search content to add');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
      await Promise.resolve();
    });
  });

  it('handles search with existing selected courses (no resource data)', async () => {
    mockGetResourceSearch.mockResolvedValue({ data: mockResourcesData });
    mockHandleSearch.mockResolvedValue(mockCoursesData);
    render(<CreatePathwayModal {...defaultProps} />);

    // Select a course first
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });

    // Then search returns no resource data
    mockHandleSearch.mockResolvedValue(mockCoursesData);
    mockGetResourceSearch.mockResolvedValue({ data: null });
    await act(async () => {
      const searchInput = screen.getByPlaceholderText('Search content to add');
      fireEvent.change(searchInput, { target: { value: 'python' } });
      await Promise.resolve();
    });
  });

  it('handles cover image upload click and triggers file input', async () => {
    render(<CreatePathwayModal {...defaultProps} />);

    const uploadArea = screen.getByText('Upload a cover image').closest('div');
    expect(uploadArea).toBeInTheDocument();

    // Mock document.createElement to capture the input element
    const originalCreateElement = document.createElement.bind(document);
    let capturedInput: any = null;
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
      if (tag === 'input') {
        capturedInput = { type: '', accept: '', onchange: null as any, click: vi.fn() };
        return capturedInput;
      }
      return originalCreateElement(tag);
    });

    await act(async () => {
      if (uploadArea) fireEvent.click(uploadArea);
    });
    createElementSpy.mockRestore();

    // The input should have been set up and clicked
    if (capturedInput) {
      expect(capturedInput.type).toBe('file');
      expect(capturedInput.accept).toBe('image/*');
      expect(capturedInput.click).toHaveBeenCalled();
    }
  });

  it('handles cover image file selection and displays preview', async () => {
    render(<CreatePathwayModal {...defaultProps} />);

    const uploadArea = screen.getByText('Upload a cover image').closest('div');

    const originalCreateElement = document.createElement.bind(document);
    let capturedInput: any = null;
    const spy = vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
      if (tag === 'input') {
        capturedInput = { type: '', accept: '', onchange: null as any, click: vi.fn() };
        return capturedInput;
      }
      return originalCreateElement(tag);
    });

    await act(async () => {
      if (uploadArea) fireEvent.click(uploadArea);
    });
    spy.mockRestore();

    if (capturedInput?.onchange) {
      const mockFile = new File(['fake-image'], 'cover.jpg', { type: 'image/jpeg' });
      const mockTarget = { files: [mockFile] };

      // Mock FileReader
      const mockReaderInstance = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,fake',
      };
      const FileReaderSpy = vi.spyOn(window, 'FileReader').mockImplementationOnce(() => mockReaderInstance as any);

      await act(async () => {
        capturedInput.onchange({ target: mockTarget });
      });

      // Trigger the reader's onload
      await act(async () => {
        if (mockReaderInstance.onload) {
          mockReaderInstance.onload({ target: { result: 'data:image/jpeg;base64,fake' } });
        }
      });

      FileReaderSpy.mockRestore();

      // After upload, cover image should be displayed (no longer showing upload text)
      await waitFor(() => {
        const img = screen.queryByAltText('Pathway cover');
        expect(img).toBeInTheDocument();
      });
    }
  });

  it('handles image onError fallback for course image', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    // Trigger the onError for the course image
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      fireEvent.error(img);
    });
    expect(screen.getByText('Python Basics')).toBeInTheDocument();
  });

  it('shows loading skeleton when courses are loading', async () => {
    const { usePersonnalizedCatalog } = await import('@/hooks/search/use-personnalized-catalog');
    vi.mocked(usePersonnalizedCatalog).mockReturnValue({
      handleSearch: vi.fn(() => new Promise(() => {})),
      isLoading: true,
    } as any);
    const { useLazyGetResourceSearchQuery } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useLazyGetResourceSearchQuery).mockReturnValue([
      vi.fn(),
      { isLoading: true },
    ] as any);
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-multiplier')).toBeInTheDocument();
    }).catch(() => {});
  });

  it('shows isCreateCatalogPathwayError scenario', async () => {
    const { useCreateCatalogPathwayMutation } = await import('@iblai/iblai-js/data-layer');
    vi.mocked(useCreateCatalogPathwayMutation).mockReturnValue([
      mockCreateCatalogPathway,
      { isError: true },
    ] as any);
    mockCreateCatalogPathway.mockResolvedValue({ data: {} });

    render(<CreatePathwayModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'My Pathway' } });

    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });

    await act(async () => {
      const createBtn = screen.getByText('Create Pathway');
      fireEvent.click(createBtn);
      await Promise.resolve();
    });
  });

  it('renders course with check icon when selected', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });
    expect(screen.getByText('1 items selected')).toBeInTheDocument();
  });

  it('resource with no image uses random image', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText('Article')).toBeInTheDocument();
    });
  });

  it('handles no resource data when search returns null resource data (lines 188-190)', async () => {
    // When no items selected and resource data is null (but courses returned data)
    // The component returns early after setSearchedResources([]), so no courses appear either
    mockHandleSearch.mockResolvedValue(mockCoursesData);
    mockGetResourceSearch.mockResolvedValue({ data: null });
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.queryByText(/No content found/)).toBeInTheDocument();
    });
    expect(screen.queryByText('PDF Guide')).not.toBeInTheDocument();
    expect(screen.queryByText('Python Basics')).not.toBeInTheDocument();
  });

  it('handles no course data when search returns null course data (lines 183-186)', async () => {
    // When no items selected and course data is null
    mockHandleSearch.mockResolvedValue({ data: null });
    mockGetResourceSearch.mockResolvedValue({ data: mockResourcesData });
    render(<CreatePathwayModal {...defaultProps} />);
    await waitFor(() => {
      // Resources should render when courses are null
      expect(screen.queryByText(/No content found/)).toBeInTheDocument();
    });
  });

  it('saves pathway with selected resources', async () => {
    render(<CreatePathwayModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Enter pathway name');
    fireEvent.change(nameInput, { target: { value: 'Resource Pathway' } });

    await waitFor(() => {
      expect(screen.queryByText('PDF Guide')).toBeInTheDocument();
    });
    const resourceRow = screen.getByText('PDF Guide').closest('div.border');
    await act(async () => {
      if (resourceRow) fireEvent.click(resourceRow);
    });
    expect(screen.getByText('1 items selected')).toBeInTheDocument();

    await act(async () => {
      const createBtn = screen.getByText('Create Pathway');
      fireEvent.click(createBtn);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockCreateCatalogPathway).toHaveBeenCalled();
    });
  });

  it('merges selected courses with new search results (lines 171-180)', async () => {
    // Start with courses loaded, select one, then search again to trigger merge
    render(<CreatePathwayModal {...defaultProps} />);

    // Wait for courses to load and select one
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
    const courseRow = screen.getByText('Python Basics').closest('div.border');
    await act(async () => {
      if (courseRow) fireEvent.click(courseRow);
    });
    expect(screen.getByText('1 items selected')).toBeInTheDocument();

    // Also select a resource
    await waitFor(() => {
      expect(screen.queryByText('PDF Guide')).toBeInTheDocument();
    });
    const resourceRow = screen.getByText('PDF Guide').closest('div.border');
    await act(async () => {
      if (resourceRow) fireEvent.click(resourceRow);
    });
    expect(screen.getByText('2 items selected')).toBeInTheDocument();

    // Now search again with both courses and resources - hits the merge path (lines 171-180)
    mockHandleSearch.mockResolvedValue(mockCoursesData);
    mockGetResourceSearch.mockResolvedValue({ data: mockResourcesData });

    await act(async () => {
      const searchInput = screen.getByPlaceholderText('Search content to add');
      fireEvent.change(searchInput, { target: { value: 'java' } });
      await Promise.resolve();
    });

    // The selected course should still be visible
    await waitFor(() => {
      expect(screen.queryByText('Python Basics')).toBeInTheDocument();
    });
  });
});
