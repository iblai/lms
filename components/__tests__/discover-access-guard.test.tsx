import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: mockReplace })),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: vi.fn(() => 'test-tenant'),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({ metadata: {}, isLoading: false, isError: false })),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      hideDiscoverTab: vi.fn(() => false),
    },
  },
}));

import { DiscoverAccessGuard } from '../discover-access-guard';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';

const child = <div data-testid="discover-content">Discover</div>;

describe('DiscoverAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(false);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: {},
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders children when Discover is enabled', () => {
    render(<DiscoverAccessGuard>{child}</DiscoverAccessGuard>);
    expect(screen.getByTestId('discover-content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to 403 when hideDiscoverTab is true', () => {
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
    render(<DiscoverAccessGuard>{child}</DiscoverAccessGuard>);
    expect(screen.queryByTestId('discover-content')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/error/403');
  });

  it('redirects to 403 when enable_discover_page is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_discover_page: false },
      isLoading: false,
      isError: false,
    } as any);
    render(<DiscoverAccessGuard>{child}</DiscoverAccessGuard>);
    expect(screen.queryByTestId('discover-content')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/error/403');
  });

  it('renders children when enable_discover_page is null/undefined (truthy default)', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_discover_page: null },
      isLoading: false,
      isError: false,
    } as any);
    render(<DiscoverAccessGuard>{child}</DiscoverAccessGuard>);
    expect(screen.getByTestId('discover-content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect while metadata is still loading', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: true,
      isError: false,
    } as any);
    render(<DiscoverAccessGuard>{child}</DiscoverAccessGuard>);
    expect(screen.queryByTestId('discover-content')).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects immediately on hideDiscoverTab even while metadata is loading', () => {
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: undefined,
      isLoading: true,
      isError: false,
    } as any);
    render(<DiscoverAccessGuard>{child}</DiscoverAccessGuard>);
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/error/403');
  });
});
