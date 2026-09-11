import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/platform/kaplan/does-not-exist'),
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

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'stored-tenant'),
}));

const mockGetSupportEmail = vi.fn(() => 'tenant@support.com');
const mockUseTenantMetadata = vi.fn((_args: { org: string }) => ({
  getSupportEmail: mockGetSupportEmail,
}));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: (args: { org: string }) => mockUseTenantMetadata(args),
}));

import NotFound from '../not-found';
import { usePathname } from 'next/navigation';

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSupportEmail.mockReturnValue('tenant@support.com');
    mockUseTenantMetadata.mockReturnValue({ getSupportEmail: mockGetSupportEmail });
    vi.mocked(usePathname).mockReturnValue('/platform/kaplan/does-not-exist');
  });

  it('renders the shared 404 error page', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText("The page you're looking for doesn't exist or has been moved."),
    ).toBeInTheDocument();
  });

  it('resolves the tenant from a tenant-scoped pathname', () => {
    render(<NotFound />);
    expect(mockUseTenantMetadata).toHaveBeenCalledWith({ org: 'kaplan' });
  });

  it('falls back to the stored tenant outside the platform segment', () => {
    vi.mocked(usePathname).mockReturnValue('/nope');
    render(<NotFound />);
    expect(mockUseTenantMetadata).toHaveBeenCalledWith({ org: 'stored-tenant' });
  });

  it('renders the Home and support actions', () => {
    render(<NotFound />);
    expect(screen.getByText('Back to Home').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Contact Support').closest('a')).toHaveAttribute(
      'href',
      'mailto:tenant@support.com',
    );
  });
});
