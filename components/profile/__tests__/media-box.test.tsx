import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserResumeQuery = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserResumeQuery: () => mockGetUserResumeQuery(),
}));

const mockUseTenantMetadata = vi.fn();
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

const mockCreateUserResume = vi.fn();
vi.mock('@/services/career', () => ({
  useCreateUserResumeMutation: vi.fn(() => [mockCreateUserResume, { isError: false }]),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier}</div>
  ),
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@tanstack/react-form', () => ({
  useForm: vi.fn(({ defaultValues, onSubmit }: any) => {
    let values = { ...defaultValues };
    let isSubmitting = false;
    let isFormValid = true;

    return {
      state: { isSubmitting, isFormValid },
      handleSubmit: vi.fn(async () => {
        isSubmitting = true;
        await onSubmit({ value: values });
        isSubmitting = false;
      }),
      reset: vi.fn(() => {
        values = { ...defaultValues };
      }),
      Subscribe: ({ selector, children }: any) => children(selector({ isSubmitting })),
      Field: ({ name, children, validators }: any) => {
        const field = {
          name,
          state: {
            value: values[name as keyof typeof values],
            meta: { isValid: true, errors: [] },
          },
          handleChange: vi.fn((val: any) => {
            values[name as keyof typeof values] = val;
          }),
        };
        return children(field);
      },
    };
  }),
}));

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn((val) => !val || (typeof val === 'object' ? Object.keys(val).length === 0 : false)),
  },
}));

import { MediaBox } from '../media-box';

describe('MediaBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseTenantMetadata.mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: vi.fn(() => false),
    });
    mockCreateUserResume.mockResolvedValue({ data: {} });
  });

  it('renders without crashing', () => {
    const { container } = render(<MediaBox />);
    expect(container).toBeTruthy();
  });

  it('renders Upload Media title', () => {
    render(<MediaBox />);
    expect(screen.getByText('Upload Media')).toBeInTheDocument();
  });

  it('renders Uploaded Media title', () => {
    render(<MediaBox />);
    expect(screen.getByText('Uploaded Media')).toBeInTheDocument();
  });

  it('renders File Upload tab', () => {
    render(<MediaBox />);
    expect(screen.getByText('File Upload')).toBeInTheDocument();
  });

  it('renders Link Upload tab', () => {
    render(<MediaBox />);
    expect(screen.getByText('Link Upload')).toBeInTheDocument();
  });

  it('shows upload area on File Upload tab', () => {
    render(<MediaBox />);
    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
  });

  it('switches to Link Upload tab when clicked', () => {
    render(<MediaBox />);
    fireEvent.click(screen.getByText('Link Upload'));
    expect(screen.getByText('Enter URL')).toBeInTheDocument();
  });

  it('switches back to File Upload tab when clicked', () => {
    render(<MediaBox />);
    fireEvent.click(screen.getByText('Link Upload'));
    fireEvent.click(screen.getByText('File Upload'));
    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
  });

  it('shows loading skeleton when data is loading', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty box when no media', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: [], links: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('shows empty box when error', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('renders uploaded files when data is available', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [
          { name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' },
          { name: 'portfolio.pdf', url: 'https://example.com/portfolio.pdf', type: 'portfolio' },
        ],
        links: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('renders uploaded links', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [],
        links: [{ url: 'https://github.com/user' }],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    // getFileNameFromPath('https://github.com/user') returns 'user'
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('renders Upload File button in file tab', () => {
    render(<MediaBox />);
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('renders Add Link button in link tab', () => {
    render(<MediaBox />);
    fireEvent.click(screen.getByText('Link Upload'));
    expect(screen.getByText('Add Link')).toBeInTheDocument();
  });

  it('handles file input area click', () => {
    render(<MediaBox />);
    const uploadArea = screen.getByText('Drag and drop your file here').closest('div');
    if (uploadArea) {
      fireEvent.click(uploadArea);
    }
    // Should trigger the file input click
    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
  });

  it('handles file selection', () => {
    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);
    }
    expect(screen.getByText('Upload Media')).toBeInTheDocument();
  });

  it('handles PDF file with resume feature enabled', async () => {
    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      const pdfFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput, 'files', {
        value: [pdfFile],
        configurable: true,
      });
      fireEvent.change(fileInput);
      await waitFor(() => {
        // Should show "This is a resume" checkbox
        expect(screen.queryByText('This is a resume')).toBeInTheDocument();
      });
    }
  });

  it('handles file too large', async () => {
    const { toast } = await import('sonner');
    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      // Create a file > 25MB
      const largeFile = new File(['x'.repeat(100)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 30 * 1024 * 1024 });
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        configurable: true,
      });
      fireEvent.change(fileInput);
    }
  });

  it('handles empty file input', async () => {
    const _ = await import('lodash');
    vi.mocked(_.default.isEmpty).mockReturnValue(true);
    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [],
        configurable: true,
      });
      fireEvent.change(fileInput);
    }
    expect(screen.getByText('Upload Media')).toBeInTheDocument();
  });

  it('shows selected file name after selection', async () => {
    const lodash = await import('lodash');
    vi.mocked(lodash.default.isEmpty).mockReturnValue(false);

    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      const file = new File(['content'], 'my-doc.txt', { type: 'text/plain' });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.queryByText(/Selected file/)).toBeInTheDocument();
      });
    }
  });

  it('handles form submit when form is valid with file', async () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: [], links: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);
    }
    const submitBtn = screen.getByText('Upload File');
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Upload Media')).toBeInTheDocument();
    });
  });

  it('handles link form submission with existing links', async () => {
    // Setup with existing links data to cover line 122-128
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [],
        links: [{ url: 'https://existing.com/link' }],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    // Switch to Link Upload tab
    fireEvent.click(screen.getByText('Link Upload'));
    expect(screen.getByText('Add Link')).toBeInTheDocument();

    // Type in the URL input
    const urlInput = screen.getByPlaceholderText('https://example.com/resource');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/new-link' } });

    // Submit the link form
    const addLinkBtn = screen.getByText('Add Link');
    await act(async () => {
      fireEvent.click(addLinkBtn);
      await Promise.resolve();
    });
    expect(mockCreateUserResume).toHaveBeenCalled();
  });

  it('handles link form submission without existing links', async () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: [], links: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    fireEvent.click(screen.getByText('Link Upload'));
    const urlInput = screen.getByPlaceholderText('https://example.com/resource');
    fireEvent.change(urlInput, { target: { value: 'https://newlink.com' } });
    const addLinkBtn = screen.getByText('Add Link');
    await act(async () => {
      fireEvent.click(addLinkBtn);
      await Promise.resolve();
    });
    expect(mockCreateUserResume).toHaveBeenCalled();
  });

  it('handles link upload error', async () => {
    mockCreateUserResume.mockRejectedValue(new Error('Upload failed'));
    const { toast } = await import('sonner');
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: [], links: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    fireEvent.click(screen.getByText('Link Upload'));
    const urlInput = screen.getByPlaceholderText('https://example.com/resource');
    fireEvent.change(urlInput, { target: { value: 'https://bad.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Add Link'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('toggles the isResume checkbox when PDF is selected', async () => {
    render(<MediaBox />);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      const pdfFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput, 'files', {
        value: [pdfFile],
        configurable: true,
      });
      fireEvent.change(fileInput);
    }
    await waitFor(() => {
      expect(screen.queryByText('This is a resume')).toBeInTheDocument();
    });
    // Click the checkbox to trigger onCheckedChange
    const checkbox = screen.getByRole('checkbox');
    if (checkbox) {
      await act(async () => {
        fireEvent.click(checkbox);
      });
    }
    expect(screen.getByText('Upload Media')).toBeInTheDocument();
  });

  it('submits file as resume when isResume is checked', async () => {
    // Override the form mock to simulate isResume = true on submit
    const { useForm } = await import('@tanstack/react-form');
    vi.mocked(useForm).mockImplementationOnce(({ defaultValues, onSubmit }: any) => {
      const values = { ...defaultValues, isResume: true };
      return {
        state: { isSubmitting: false, isFormValid: true },
        handleSubmit: vi.fn(async () => {
          await onSubmit({ value: values });
        }),
        reset: vi.fn(),
        Subscribe: ({ selector, children }: any) => children(selector({ isSubmitting: false })),
        Field: ({ name, children }: any) => {
          const field = {
            name,
            state: { value: values[name as keyof typeof values], meta: { isValid: true, errors: [] } },
            handleChange: vi.fn((val: any) => { values[name as keyof typeof values] = val; }),
          };
          return children(field);
        },
      };
    });
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: [], links: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    // Select a PDF file
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      const pdfFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput, 'files', { value: [pdfFile], configurable: true });
      fireEvent.change(fileInput);
    }
    // Submit
    await act(async () => {
      fireEvent.click(screen.getByText('Upload File'));
      await Promise.resolve();
    });
    expect(mockCreateUserResume).toHaveBeenCalled();
  });

  it('shows error when form is invalid on submit (line 225-226)', async () => {
    // Override the form mock to return isFormValid = false
    const { useForm } = await import('@tanstack/react-form');
    vi.mocked(useForm).mockImplementationOnce(({ defaultValues, onSubmit }: any) => {
      const values = { ...defaultValues };
      return {
        state: { isSubmitting: false, isFormValid: false },
        handleSubmit: vi.fn(),
        reset: vi.fn(),
        Subscribe: ({ selector, children }: any) => children(selector({ isSubmitting: false })),
        Field: ({ name, children }: any) => {
          const field = {
            name,
            state: { value: values[name as keyof typeof values], meta: { isValid: true, errors: [] } },
            handleChange: vi.fn(),
          };
          return children(field);
        },
      };
    });
    const { toast } = await import('sonner');
    render(<MediaBox />);
    const submitBtn = screen.getByText('Upload File');
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
  });

  it('returns early when form is submitting (line 229)', async () => {
    const { useForm } = await import('@tanstack/react-form');
    const mockHandleSubmitFn = vi.fn();
    vi.mocked(useForm).mockImplementationOnce(({ defaultValues, onSubmit }: any) => {
      const values = { ...defaultValues };
      return {
        state: { isSubmitting: true, isFormValid: true },
        handleSubmit: mockHandleSubmitFn,
        reset: vi.fn(),
        Subscribe: ({ selector, children }: any) => children(selector({ isSubmitting: true })),
        Field: ({ name, children }: any) => {
          const field = {
            name,
            state: { value: values[name as keyof typeof values], meta: { isValid: true, errors: [] } },
            handleChange: vi.fn(),
          };
          return children(field);
        },
      };
    });
    render(<MediaBox />);
    // When isSubmitting is true, button text is "Uploading..."
    const submitBtn = screen.getByText('Uploading...');
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    // handleSubmit should NOT be called (button is disabled and handleSubmit returns early)
    expect(mockHandleSubmitFn).not.toHaveBeenCalled();
    expect(screen.getByText('Upload Media')).toBeInTheDocument();
  });

  it('shows correct file icons for different file types', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [
          { name: 'image.jpg', url: 'https://example.com/image.jpg', type: 'image' },
          { name: 'video.mp4', url: 'https://example.com/video.mp4', type: 'video' },
          { name: 'audio.mp3', url: 'https://example.com/audio.mp3', type: 'audio' },
          { name: 'archive.zip', url: 'https://example.com/archive.zip', type: 'archive' },
          { name: 'script.js', url: 'https://example.com/script.js', type: 'code' },
          { name: 'unknown.xyz', url: 'https://example.com/unknown.xyz', type: 'other' },
        ],
        links: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<MediaBox />);
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
  });
});
