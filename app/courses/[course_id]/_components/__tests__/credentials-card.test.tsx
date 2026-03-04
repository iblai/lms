import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Helper to create a mock return value for useCredentials
const createMockUseCredentials = (overrides = {}) => ({
  handleFetchCredentials: vi.fn(),
  handleCreateCredential: vi.fn(),
  handleUpdateCredential: vi.fn(),
  handleDeleteCredential: vi.fn().mockResolvedValue(true),
  handleFetchIssuers: vi.fn(),
  handleImageUploadForCredentials: vi.fn(),
  handleFetchUsersAsAssertionsForCourse: vi.fn(),
  handleCreateCredentialAssertion: vi.fn(),
  credentials: null as any,
  isLoadingCredentials: false,
  issuers: [],
  isLoadingIssuers: false,
  ...overrides,
});

// Mock hooks and components
vi.mock('@/hooks/courses/use-credentials', () => ({
  useCredentials: vi.fn(() => createMockUseCredentials()),
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/ui/pagination', () => ({
  Pagination: ({ children }: any) => <nav data-testid="pagination">{children}</nav>,
  PaginationContent: ({ children }: any) => <ul>{children}</ul>,
  PaginationItem: ({ children }: any) => <li>{children}</li>,
  PaginationLink: ({ children, isActive, onClick }: any) => (
    <button data-active={isActive} onClick={onClick}>
      {children}
    </button>
  ),
  PaginationNext: ({ onClick, className }: any) => (
    <button data-testid="pagination-next" onClick={onClick} className={className}>
      Next
    </button>
  ),
  PaginationPrevious: ({ onClick, className }: any) => (
    <button data-testid="pagination-prev" onClick={onClick} className={className}>
      Previous
    </button>
  ),
}));

vi.mock('../credential-modal', () => ({
  CredentialModal: ({
    isOpen,
    onClose,
    handleImageUpload,
    handleSaveCredential,
    credentialForm,
    setCredentialForm,
  }: any) =>
    isOpen ? (
      <div data-testid="credential-modal">
        Modal
        <button onClick={onClose}>Close Modal</button>
        <input
          type="file"
          data-testid="image-upload-input"
          onChange={(e) => handleImageUpload?.(e)}
        />
        <button data-testid="save-credential-btn" onClick={handleSaveCredential}>
          Save
        </button>
        <input
          data-testid="credential-name-input"
          value={credentialForm?.name || ''}
          onChange={(e) => setCredentialForm?.((prev: any) => ({ ...prev, name: e.target.value }))}
        />
      </div>
    ) : null,
}));

import { CredentialsCard } from '../credentials-card';
import { useCredentials } from '@/hooks/courses/use-credentials';

describe('CredentialsCard', () => {
  const defaultProps = {
    courseId: 'course-v1:test+course+2024',
    expandedSections: { credentials: false },
    toggleSection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card with title', () => {
    render(<CredentialsCard {...defaultProps} />);

    expect(screen.getByText('Credentials')).toBeInTheDocument();
    expect(screen.getByText('Credential List')).toBeInTheDocument();
  });

  it('renders add credential button', () => {
    render(<CredentialsCard {...defaultProps} />);

    const addButton = screen.getByTestId('add-credential-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add Credential');
  });

  it('toggles section when clicked', () => {
    render(<CredentialsCard {...defaultProps} />);

    const toggleButton = screen.getByTestId('credential-list-toggle');
    fireEvent.click(toggleButton);

    expect(defaultProps.toggleSection).toHaveBeenCalledWith('credentials');
  });

  it('has proper accessibility attributes on toggle', () => {
    render(<CredentialsCard {...defaultProps} />);

    const toggleButton = screen.getByTestId('credential-list-toggle');
    expect(toggleButton).toHaveAttribute('role', 'button');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens credential modal when add button is clicked', () => {
    render(<CredentialsCard {...defaultProps} />);

    const addButton = screen.getByTestId('add-credential-button');
    fireEvent.click(addButton);

    expect(screen.getByTestId('credential-modal')).toBeInTheDocument();
  });

  describe('when expanded with loading state', () => {
    it('shows loading spinner', () => {
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: null,
          isLoadingCredentials: true,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      // Check for loading spinner (animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('when expanded with no credentials', () => {
    it('shows empty state', () => {
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: { result: { data: [], count: 0, num_pages: 0, page_number: 1 } },
          isLoadingCredentials: false,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByTestId('empty-box')).toHaveTextContent('No credentials found.');
    });
  });

  describe('when expanded with credentials', () => {
    const mockCredentials = {
      result: {
        data: [
          {
            entityId: 'cred-1',
            name: 'Test Credential 1',
            credentialType: 'badge',
            issuerDetails: { name: 'Test Issuer' },
          },
          {
            entityId: 'cred-2',
            name: 'Test Credential 2',
            credentialType: 'certificate',
            issuerDetails: { name: 'Another Issuer' },
          },
        ],
        count: 2,
        num_pages: 1,
        page_number: 1,
      },
    };

    beforeEach(() => {
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentials,
          handleDeleteCredential: vi.fn().mockResolvedValue(true),
        }),
      );
    });

    it('displays credentials table', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByTestId('credentials-table')).toBeInTheDocument();
    });

    it('displays credential names', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByText('Test Credential 1')).toBeInTheDocument();
      expect(screen.getByText('Test Credential 2')).toBeInTheDocument();
    });

    it('displays table headers', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Entity ID')).toBeInTheDocument();
      expect(screen.getByText('Issuer')).toBeInTheDocument();
      expect(screen.getByText('Credential Type')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays edit buttons for each credential', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByTestId('edit-credential-0')).toBeInTheDocument();
      expect(screen.getByTestId('edit-credential-1')).toBeInTheDocument();
    });

    it('displays delete buttons for each credential', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByTestId('delete-credential-0')).toBeInTheDocument();
      expect(screen.getByTestId('delete-credential-1')).toBeInTheDocument();
    });

    it('opens modal with credential data when edit is clicked', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const editButton = screen.getByTestId('edit-credential-0');
      fireEvent.click(editButton);

      expect(screen.getByTestId('credential-modal')).toBeInTheDocument();
    });

    it('opens modal with credential that has issuerDetails entityId', () => {
      const mockCredentialsWithIssuer = {
        result: {
          data: [
            {
              entityId: 'cred-1',
              name: 'Test Credential 1',
              credentialType: 'badge',
              issuerDetails: { name: 'Test Issuer', entityId: 'issuer-1' },
              description: 'A test credential',
              signal: 'course_completion',
              iconImage: '/icon.png',
              icon_image_id: 123,
            },
          ],
          count: 1,
          num_pages: 1,
          page_number: 1,
        },
      };

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentialsWithIssuer,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const editButton = screen.getByTestId('edit-credential-0');
      fireEvent.click(editButton);

      expect(screen.getByTestId('credential-modal')).toBeInTheDocument();
    });

    it('closes modal when close is triggered', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      // Open modal
      const editButton = screen.getByTestId('edit-credential-0');
      fireEvent.click(editButton);

      expect(screen.getByTestId('credential-modal')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByText('Close Modal'));

      expect(screen.queryByTestId('credential-modal')).not.toBeInTheDocument();
    });

    it('calls delete handler when delete is clicked', async () => {
      const mockDeleteHandler = vi.fn().mockResolvedValue(true);
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentials,
          handleDeleteCredential: mockDeleteHandler,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const deleteButton = screen.getByTestId('delete-credential-0');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteHandler).toHaveBeenCalledWith('cred-1');
      });
    });
  });

  describe('pagination', () => {
    it('shows pagination when there are more than 10 credentials', () => {
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: {
            result: {
              data: Array(10).fill({ entityId: 'cred', name: 'Credential' }),
              count: 25,
              num_pages: 3,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('does not show pagination when credentials fit on one page', () => {
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: {
            result: {
              data: Array(5).fill({ entityId: 'cred', name: 'Credential' }),
              count: 5,
              num_pages: 1,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('navigates to next page when next button is clicked', () => {
      const mockFetchCredentials = vi.fn();
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleFetchCredentials: mockFetchCredentials,
          credentials: {
            result: {
              data: Array(10).fill({ entityId: 'cred', name: 'Credential' }),
              count: 25,
              num_pages: 3,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      // useEffect should trigger fetch with new page
      expect(mockFetchCredentials).toHaveBeenCalled();
    });

    it('navigates to previous page when prev button is clicked', () => {
      const mockFetchCredentials = vi.fn();
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleFetchCredentials: mockFetchCredentials,
          credentials: {
            result: {
              data: Array(10).fill({ entityId: 'cred', name: 'Credential' }),
              count: 25,
              num_pages: 3,
              page_number: 2,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const prevButton = screen.getByTestId('pagination-prev');
      fireEvent.click(prevButton);

      expect(mockFetchCredentials).toHaveBeenCalled();
    });

    it('navigates to specific page when page number is clicked', () => {
      const mockFetchCredentials = vi.fn();
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleFetchCredentials: mockFetchCredentials,
          credentials: {
            result: {
              data: Array(10).fill({ entityId: 'cred', name: 'Credential' }),
              count: 25,
              num_pages: 3,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      // Find and click page 2 button
      const pageButtons = screen.getAllByRole('button');
      const page2Button = pageButtons.find((btn) => btn.textContent === '2');
      if (page2Button) {
        fireEvent.click(page2Button);
      }

      expect(mockFetchCredentials).toHaveBeenCalled();
    });
  });

  describe('fetching data on expand', () => {
    it('fetches credentials when section is expanded', () => {
      const mockFetchCredentials = vi.fn();
      const mockFetchIssuers = vi.fn();

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleFetchCredentials: mockFetchCredentials,
          handleFetchIssuers: mockFetchIssuers,
          credentials: null,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      expect(mockFetchCredentials).toHaveBeenCalledWith('course-v1:test+course+2024', 1, 10);
      expect(mockFetchIssuers).toHaveBeenCalled();
    });

    it('does not fetch when section is collapsed', () => {
      const mockFetchCredentials = vi.fn();
      const mockFetchIssuers = vi.fn();

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleFetchCredentials: mockFetchCredentials,
          handleFetchIssuers: mockFetchIssuers,
          credentials: null,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: false }} />);

      expect(mockFetchCredentials).not.toHaveBeenCalled();
      expect(mockFetchIssuers).not.toHaveBeenCalled();
    });
  });

  describe('credential modal form operations', () => {
    const mockCredentials = {
      result: {
        data: [
          {
            entityId: 'cred-1',
            name: 'Test Credential 1',
            credentialType: 'badge',
            issuerDetails: { name: 'Test Issuer' },
          },
        ],
        count: 1,
        num_pages: 1,
        page_number: 1,
      },
    };

    beforeEach(() => {
      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentials,
        }),
      );
    });

    it('opens add credential modal with empty form', () => {
      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      expect(screen.getByTestId('credential-modal')).toBeInTheDocument();
    });

    it('opens edit credential modal with pre-filled form', () => {
      const mockCredentialsWithDetails = {
        result: {
          data: [
            {
              entityId: 'cred-1',
              name: 'Test Credential',
              description: 'Test description',
              credentialType: 'badge',
              issuerDetails: { name: 'Issuer', entityId: 'issuer-1' },
              signal: 'course_completion',
              iconImage: '/icon.png',
              icon_image_id: 123,
            },
          ],
          count: 1,
          num_pages: 1,
          page_number: 1,
        },
      };

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentialsWithDetails,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const editButton = screen.getByTestId('edit-credential-0');
      fireEvent.click(editButton);

      expect(screen.getByTestId('credential-modal')).toBeInTheDocument();
    });
  });

  describe('image upload', () => {
    it('handles image upload successfully', async () => {
      const mockImageUpload = vi.fn().mockResolvedValue({ image: '/uploaded.png', id: 456 });

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleImageUploadForCredentials: mockImageUpload,
          credentials: {
            result: {
              data: [],
              count: 0,
              num_pages: 0,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      // Open add modal
      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      const fileInput = screen.getByTestId('image-upload-input');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImageUpload).toHaveBeenCalledWith(file);
      });
    });

    it('handles image upload with no file', async () => {
      const mockImageUpload = vi.fn();

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleImageUploadForCredentials: mockImageUpload,
          credentials: {
            result: {
              data: [],
              count: 0,
              num_pages: 0,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      // Open add modal
      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      const fileInput = screen.getByTestId('image-upload-input');
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockImageUpload).not.toHaveBeenCalled();
    });

    it('handles image upload error', async () => {
      const mockImageUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleImageUploadForCredentials: mockImageUpload,
          credentials: {
            result: {
              data: [],
              count: 0,
              num_pages: 0,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      const fileInput = screen.getByTestId('image-upload-input');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error uploading image:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('save credential', () => {
    it('creates new credential when saving without editing', async () => {
      const mockCreateCredential = vi.fn().mockResolvedValue({});
      const mockFetchCredentials = vi.fn();

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleCreateCredential: mockCreateCredential,
          handleFetchCredentials: mockFetchCredentials,
          credentials: {
            result: {
              data: [],
              count: 0,
              num_pages: 0,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      const saveButton = screen.getByTestId('save-credential-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateCredential).toHaveBeenCalled();
      });
    });

    it('updates existing credential when editing', async () => {
      const mockUpdateCredential = vi.fn().mockResolvedValue({});
      const mockFetchCredentials = vi.fn();

      const mockCredentials = {
        result: {
          data: [
            {
              entityId: 'cred-1',
              name: 'Test Credential',
              credentialType: 'badge',
              issuerDetails: { name: 'Issuer' },
            },
          ],
          count: 1,
          num_pages: 1,
          page_number: 1,
        },
      };

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleUpdateCredential: mockUpdateCredential,
          handleFetchCredentials: mockFetchCredentials,
          credentials: mockCredentials,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      // Open edit modal
      const editButton = screen.getByTestId('edit-credential-0');
      fireEvent.click(editButton);

      const saveButton = screen.getByTestId('save-credential-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCredential).toHaveBeenCalledWith('cred-1', expect.any(Object));
      });
    });

    it('handles save credential error', async () => {
      const mockCreateCredential = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleCreateCredential: mockCreateCredential,
          credentials: {
            result: {
              data: [],
              count: 0,
              num_pages: 0,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      const saveButton = screen.getByTestId('save-credential-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving credential:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('includes icon_image_id in request when available', async () => {
      const mockCreateCredential = vi.fn().mockResolvedValue({});
      const mockImageUpload = vi.fn().mockResolvedValue({ image: '/icon.png', id: 789 });

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          handleCreateCredential: mockCreateCredential,
          handleImageUploadForCredentials: mockImageUpload,
          credentials: {
            result: {
              data: [],
              count: 0,
              num_pages: 0,
              page_number: 1,
            },
          },
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const addButton = screen.getByTestId('add-credential-button');
      fireEvent.click(addButton);

      // Upload an image first
      const fileInput = screen.getByTestId('image-upload-input');
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImageUpload).toHaveBeenCalled();
      });

      // Then save
      const saveButton = screen.getByTestId('save-credential-btn');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateCredential).toHaveBeenCalled();
      });
    });
  });

  describe('delete credential', () => {
    it('refetches credentials after successful delete', async () => {
      const mockDeleteCredential = vi.fn().mockResolvedValue(true);
      const mockFetchCredentials = vi.fn();

      const mockCredentials = {
        result: {
          data: [
            {
              entityId: 'cred-1',
              name: 'Test Credential 1',
              credentialType: 'badge',
              issuerDetails: { name: 'Test Issuer' },
            },
          ],
          count: 1,
          num_pages: 1,
          page_number: 1,
        },
      };

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentials,
          handleDeleteCredential: mockDeleteCredential,
          handleFetchCredentials: mockFetchCredentials,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const deleteButton = screen.getByTestId('delete-credential-0');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteCredential).toHaveBeenCalledWith('cred-1');
      });

      await waitFor(() => {
        expect(mockFetchCredentials).toHaveBeenCalled();
      });
    });

    it('handles delete failure gracefully', async () => {
      const mockDeleteCredential = vi.fn().mockResolvedValue(false);
      const mockFetchCredentials = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockCredentials = {
        result: {
          data: [
            {
              entityId: 'cred-1',
              name: 'Test Credential 1',
              credentialType: 'badge',
              issuerDetails: { name: 'Test Issuer' },
            },
          ],
          count: 1,
          num_pages: 1,
          page_number: 1,
        },
      };

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentials,
          handleDeleteCredential: mockDeleteCredential,
          handleFetchCredentials: mockFetchCredentials,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const deleteButton = screen.getByTestId('delete-credential-0');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteCredential).toHaveBeenCalledWith('cred-1');
      });

      consoleSpy.mockRestore();
    });

    it('handles delete error', async () => {
      const mockDeleteCredential = vi.fn().mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockCredentials = {
        result: {
          data: [
            {
              entityId: 'cred-1',
              name: 'Test Credential 1',
              credentialType: 'badge',
              issuerDetails: { name: 'Test Issuer' },
            },
          ],
          count: 1,
          num_pages: 1,
          page_number: 1,
        },
      };

      vi.mocked(useCredentials).mockReturnValue(
        createMockUseCredentials({
          credentials: mockCredentials,
          handleDeleteCredential: mockDeleteCredential,
        }),
      );

      render(<CredentialsCard {...defaultProps} expandedSections={{ credentials: true }} />);

      const deleteButton = screen.getByTestId('delete-credential-0');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting credential:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
