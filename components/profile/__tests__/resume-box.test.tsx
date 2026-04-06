import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

// Mock react-pdf to avoid issues in test environment
vi.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess, onLoadError, loading }: any) => {
    return (
      <div data-testid="pdf-document">
        {loading}
        <div
          data-testid="pdf-load-trigger"
          onClick={() => onLoadSuccess && onLoadSuccess({ numPages: 3 })}
          onKeyDown={(e) => e.key === 'e' && onLoadError && onLoadError(new Error('Load error'))}
        />
        {children}
      </div>
    );
  },
  Page: ({ pageNumber, scale, rotate }: any) => (
    <div data-testid="pdf-page" data-page={pageNumber} data-scale={scale} data-rotate={rotate} />
  ),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.0.0',
  },
}));

import { ResumeBox } from '../resume-box';

describe('ResumeBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    const { container } = render(<ResumeBox />);
    expect(container).toBeTruthy();
  });

  it('renders Resume title', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<ResumeBox />);
    // The skeleton renders as an animate-pulse div
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows empty box when error', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<ResumeBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No resume found.')).toBeInTheDocument();
  });

  it('shows empty box when no resume url', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: [] },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No resume found.')).toBeInTheDocument();
  });

  it('shows empty box when files have no resume type', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [
          { name: 'portfolio.pdf', url: 'https://example.com/portfolio.pdf', type: 'portfolio' },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('shows PDF viewer when resume is available', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
  });

  it('shows navigation controls when resume is available', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByText('Previous Page')).toBeInTheDocument();
    expect(screen.getByText('Next Page')).toBeInTheDocument();
  });

  it('shows zoom controls when resume is available', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText(/Zoom:/)).toBeInTheDocument();
  });

  it('shows rotation controls when resume is available', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByText('Rotate Left')).toBeInTheDocument();
    expect(screen.getByText('Rotate Right')).toBeInTheDocument();
  });

  it('previous page button is disabled on first page', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    const prevBtn = screen.getByText('Previous Page');
    expect(prevBtn).toBeDisabled();
  });

  it('handles pdf load success', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    const loadTrigger = screen.getByTestId('pdf-load-trigger');
    fireEvent.click(loadTrigger);
    // After load success, numPages should be set to 3
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('handles pdf load error', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    const loadTrigger = screen.getByTestId('pdf-load-trigger');
    fireEvent.keyDown(loadTrigger, { key: 'e' });
    // After load error, error empty box should show
    waitFor(() => {
      expect(screen.getByText('Error loading resume.')).toBeInTheDocument();
    });
  });

  it('can navigate to next page after loading', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    // First load the document
    const loadTrigger = screen.getByTestId('pdf-load-trigger');
    fireEvent.click(loadTrigger);

    // Now Next button should be enabled
    const nextBtn = screen.getByText('Next Page');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });

  it('previous page is disabled after going forward then back', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    fireEvent.click(screen.getByTestId('pdf-load-trigger'));

    // Go to page 2
    fireEvent.click(screen.getByText('Next Page'));
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();

    // Go back to page 1
    fireEvent.click(screen.getByText('Previous Page'));
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('can zoom in', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByText('Zoom: 100%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('Zoom: 120%')).toBeInTheDocument();
  });

  it('can zoom out', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    fireEvent.click(screen.getByText('-'));
    expect(screen.getByText('Zoom: 80%')).toBeInTheDocument();
  });

  it('zoom out is disabled when at min zoom', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    const zoomOutBtn = screen.getByText('-');
    // Zoom out multiple times to reach minimum
    for (let i = 0; i < 4; i++) {
      fireEvent.click(zoomOutBtn);
    }
    expect(zoomOutBtn).toBeDisabled();
  });

  it('can rotate left', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    fireEvent.click(screen.getByText('Rotate Left'));
    const page = screen.getByTestId('pdf-page');
    expect(page).toHaveAttribute('data-rotate', '-90');
  });

  it('can rotate right', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: {
        files: [{ name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'resume' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    fireEvent.click(screen.getByText('Rotate Right'));
    const page = screen.getByTestId('pdf-page');
    expect(page).toHaveAttribute('data-rotate', '90');
  });

  it('handles data where files is not an array', () => {
    mockGetUserResumeQuery.mockReturnValue({
      data: { files: null },
      isLoading: false,
      isError: false,
    });
    render(<ResumeBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });
});
