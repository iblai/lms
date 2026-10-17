import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseGetPublicPlatformMembershipQuery = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetPublicPlatformMembershipQuery: (...args: unknown[]) =>
    mockUseGetPublicPlatformMembershipQuery(...args),
}));

const mockIsLoggedIn = vi.fn();
vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: () => mockIsLoggedIn(),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

const mockRedirectToAuthSpa = vi.fn();
vi.mock('@/utils/helpers', () => ({
  redirectToAuthSpa: (...args: unknown[]) => mockRedirectToAuthSpa(...args),
}));

import { SelfLinkingGuard } from '../self-linking-guard';

describe('SelfLinkingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children immediately for a logged-in user and skips the membership query', () => {
    mockIsLoggedIn.mockReturnValue(true);
    mockUseGetPublicPlatformMembershipQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isUninitialized: true,
    });

    render(
      <SelfLinkingGuard>
        <div data-testid="child">content</div>
      </SelfLinkingGuard>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockRedirectToAuthSpa).not.toHaveBeenCalled();
    // Query was invoked with skip=true so it never hits the network.
    expect(mockUseGetPublicPlatformMembershipQuery).toHaveBeenCalledWith(
      { platform_key: 'test-tenant' },
      { skip: true },
    );
  });

  it('renders children for an anonymous user when self-linking is enabled', () => {
    mockIsLoggedIn.mockReturnValue(false);
    mockUseGetPublicPlatformMembershipQuery.mockReturnValue({
      data: { platform_key: 'test-tenant', allow_self_linking: true },
      isLoading: false,
      isUninitialized: false,
    });

    render(
      <SelfLinkingGuard>
        <div data-testid="child">content</div>
      </SelfLinkingGuard>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockRedirectToAuthSpa).not.toHaveBeenCalled();
  });

  it('renders children while the membership check is loading (SSR-transparent) without redirecting', () => {
    mockIsLoggedIn.mockReturnValue(false);
    mockUseGetPublicPlatformMembershipQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isUninitialized: false,
    });

    render(
      <SelfLinkingGuard>
        <div data-testid="child">content</div>
      </SelfLinkingGuard>,
    );

    // Content is rendered immediately so it reaches the server HTML; the
    // anonymous decision is deferred until the query resolves.
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockRedirectToAuthSpa).not.toHaveBeenCalled();
  });

  it('renders children but redirects an anonymous user when self-linking is disabled', async () => {
    mockIsLoggedIn.mockReturnValue(false);
    mockUseGetPublicPlatformMembershipQuery.mockReturnValue({
      data: { platform_key: 'test-tenant', allow_self_linking: false },
      isLoading: false,
      isUninitialized: false,
    });

    render(
      <SelfLinkingGuard>
        <div data-testid="child">content</div>
      </SelfLinkingGuard>,
    );

    await waitFor(() => {
      expect(mockRedirectToAuthSpa).toHaveBeenCalled();
    });
    // Content is in the HTML (crawler-visible); the client redirect handles the
    // disallowed anonymous case.
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
