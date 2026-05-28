import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ code: '404' })),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      supportEmail: vi.fn(() => 'fallback@support.com'),
    },
  },
}));

vi.mock('@/lib/initial-loader', () => ({
  hideInitialLoader: vi.fn(),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

const mockGetSupportEmail = vi.fn(() => 'tenant@support.com');
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    getSupportEmail: mockGetSupportEmail,
  })),
}));

import ErrorPage from '../page';
import { useParams } from 'next/navigation';
import { config } from '@/lib/config';

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSupportEmail.mockReturnValue('tenant@support.com');
  });

  describe('error code rendering', () => {
    it('renders 401 title and description', () => {
      vi.mocked(useParams).mockReturnValue({ code: '401' });
      render(<ErrorPage />);
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('You need to sign in to access this resource.')).toBeInTheDocument();
    });

    it('renders 403 title and description', () => {
      vi.mocked(useParams).mockReturnValue({ code: '403' });
      render(<ErrorPage />);
      expect(screen.getByText('Unauthorized Resource')).toBeInTheDocument();
      expect(
        screen.getByText("The resource you're trying to access is unauthorized."),
      ).toBeInTheDocument();
    });

    it('renders 404 title and description', () => {
      vi.mocked(useParams).mockReturnValue({ code: '404' });
      render(<ErrorPage />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(
        screen.getByText("The page you're looking for doesn't exist or has been moved."),
      ).toBeInTheDocument();
    });

    it('renders 500 title and description', () => {
      vi.mocked(useParams).mockReturnValue({ code: '500' });
      render(<ErrorPage />);
      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(
        screen.getByText('Something went wrong on our end. Please try again later.'),
      ).toBeInTheDocument();
    });

    it('renders unauthorized-tenant title and description', () => {
      vi.mocked(useParams).mockReturnValue({ code: 'unauthorized-tenant' });
      render(<ErrorPage />);
      expect(screen.getByText('Unauthorized Resource')).toBeInTheDocument();
      expect(
        screen.getByText(
          "The resource you're trying to access belongs to a different platform and cannot be accessed here.",
        ),
      ).toBeInTheDocument();
    });

    it('renders default fallback for unknown error codes', () => {
      vi.mocked(useParams).mockReturnValue({ code: 'unknown-error' });
      render(<ErrorPage />);
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred. Please try again or contact support.'),
      ).toBeInTheDocument();
    });

    it('displays the error code badge', () => {
      vi.mocked(useParams).mockReturnValue({ code: '403' });
      render(<ErrorPage />);
      expect(screen.getByText('403')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ code: '404' });
    });

    it('renders Back to Home link pointing to /', () => {
      render(<ErrorPage />);
      const homeLink = screen.getByText('Back to Home');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', '/test-tenant');
    });

    it('renders Contact Support link with tenant support email', () => {
      render(<ErrorPage />);
      const supportLink = screen.getByText('Contact Support');
      expect(supportLink.closest('a')).toHaveAttribute('href', 'mailto:tenant@support.com');
    });

    it('falls back to config supportEmail when getSupportEmail returns falsy', () => {
      mockGetSupportEmail.mockReturnValue('');
      vi.mocked(config.settings.supportEmail).mockReturnValue('fallback@support.com');
      render(<ErrorPage />);
      const supportLink = screen.getByText('Contact Support');
      expect(supportLink.closest('a')).toHaveAttribute('href', 'mailto:fallback@support.com');
    });
  });
});
