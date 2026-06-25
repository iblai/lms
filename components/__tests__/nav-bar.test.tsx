import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({ push: mockPush })),
  useSearchParams: vi.fn(() => mockSearchParams),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  isRecommendedTabHidden: vi.fn(() => false),
  parseMarkdownLinks: vi.fn(() => []),
  redirectToAuthSpa: vi.fn(),
  redirectToAuthSpaJoinTenant: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      hideDiscoverTab: vi.fn(() => false),
      aiAnalyticsHeaderMenuEnabled: vi.fn(() => true),
      studioHeaderMenuEnabled: vi.fn(() => true),
      additionalLeftHeaderMenuItems: vi.fn(() => ''),
      additionalRightHeaderMenuItems: vi.fn(() => ''),
    },
    urls: {
      studioUrl: vi.fn(() => 'https://studio.example.com'),
    },
  },
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false, is_department_admin: false },
  })),
}));

vi.mock('../logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('../header/profile/user-profile-button', () => ({
  UserProfileButton: () => <div data-testid="user-profile-button">Profile</div>,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
  useTenantMetadata: vi.fn(() => ({ metadata: {}, isLoading: false, isError: false })),
}));

vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(({ minWidth, maxWidth }: any) => {
    if (minWidth === 915 && !maxWidth) return true; // isDesktop
    return false;
  }),
}));

// Controllable RBAC mocks. `WithPermissions` supplies `hasPermission`
// (the `can_view_analytics` resource); `checkRbacPermission` backs the
// `isWatcher` (`/watchedgroups/#list`) derivation.
const mockHasPermission = vi.hoisted(() => ({ value: false }));
const mockCheckRbacPermission = vi.hoisted(() => vi.fn(() => false));

vi.mock('@/hoc', () => ({
  WithPermissions: ({ children }: any) => children({ hasPermission: mockHasPermission.value }),
  checkRbacPermission: mockCheckRbacPermission,
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: vi.fn(() => ({})),
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(() => ({})),
}));

import { NavBar } from '../nav-bar';
import { WATCHER_RBAC_RESOURCE } from '@/utils/course-content-mode';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';

describe('NavBar', () => {
  const defaultProps = {
    sidebarOpen: false,
    activePage: 'home',
    onMenuClick: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockHasPermission.value = false;
    mockCheckRbacPermission.mockReturnValue(false);
    vi.mocked(config.settings.aiAnalyticsHeaderMenuEnabled).mockReturnValue(true);
    const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(false);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: {},
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders without crashing', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    // Profile text appears both in nav link and UserProfileButton mock
    expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders Recommended link when not hidden', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('hides Recommended link when isRecommendedTabHidden returns true', async () => {
    const { isRecommendedTabHidden } = await import('@/utils/helpers');
    vi.mocked(isRecommendedTabHidden).mockReturnValue(true);
    render(<NavBar {...defaultProps} />);
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('applies active styling to active page link', () => {
    render(<NavBar {...defaultProps} activePage="home" />);
    const homeLink = screen.getByText('Home');
    expect(homeLink.className).toContain('border-b-2');
  });

  it('calls onMenuClick when menu button is clicked', () => {
    render(<NavBar {...defaultProps} />);
    const menuButton = screen.getByLabelText('Open sidebar');
    fireEvent.click(menuButton);
    expect(defaultProps.onMenuClick).toHaveBeenCalled();
  });

  it('renders search input on desktop', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders user profile button', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByTestId('user-profile-button')).toBeInTheDocument();
  });

  it('renders notification dropdown', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('submits search form on desktop', () => {
    render(<NavBar {...defaultProps} activePage="discover" />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'test query' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    expect(mockPush).toHaveBeenCalled();
  });

  describe('when logged out', () => {
    beforeEach(async () => {
      const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
      vi.mocked(isLoggedIn).mockReturnValue(false);
    });

    it('renders Log In and Sign Up buttons', () => {
      render(<NavBar {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    it('hides Home, Profile and Recommended links', () => {
      render(<NavBar {...defaultProps} />);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
      // Discover stays available to logged-out users
      expect(screen.getByText('Discover')).toBeInTheDocument();
    });

    it('does not render notification dropdown or profile button', () => {
      render(<NavBar {...defaultProps} />);
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-profile-button')).not.toBeInTheDocument();
    });

    it('triggers the join-tenant redirect when Log In is clicked', async () => {
      const { redirectToAuthSpaJoinTenant } = await import('@/utils/helpers');
      render(<NavBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
      expect(redirectToAuthSpaJoinTenant).toHaveBeenCalledWith('test-tenant', undefined, true);
    });

    it('triggers the join-tenant redirect when Sign Up is clicked', async () => {
      const { redirectToAuthSpaJoinTenant } = await import('@/utils/helpers');
      render(<NavBar {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      expect(redirectToAuthSpaJoinTenant).toHaveBeenCalledWith('test-tenant', undefined, true);
    });
  });

  it('does not render Log In / Sign Up buttons when logged in', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument();
  });

  it('hides the Discover link and search bar when hideDiscoverTab is true', () => {
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
    render(<NavBar {...defaultProps} />);
    expect(screen.queryByText('Discover')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
  });

  it('hides the Discover link and search bar when enable_discover_page is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_discover_page: false },
      isLoading: false,
      isError: false,
    } as any);
    render(<NavBar {...defaultProps} />);
    expect(screen.queryByText('Discover')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
  });

  it('shows Discover when enable_discover_page is null/undefined (truthy default)', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_discover_page: null },
      isLoading: false,
      isError: false,
    } as any);
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('hideDiscoverTab supersedes enable_discover_page', () => {
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: { enable_discover_page: true },
      isLoading: false,
      isError: false,
    } as any);
    render(<NavBar {...defaultProps} />);
    expect(screen.queryByText('Discover')).not.toBeInTheDocument();
  });

  describe('AI Analytics menu item', () => {
    it('hides AI Analytics when the user lacks can_view_analytics and is not a watcher', () => {
      mockHasPermission.value = false;
      mockCheckRbacPermission.mockReturnValue(false);
      render(<NavBar {...defaultProps} />);
      expect(screen.queryByText('AI Analytics')).not.toBeInTheDocument();
    });

    it('shows AI Analytics when the user has the can_view_analytics permission', () => {
      mockHasPermission.value = true;
      mockCheckRbacPermission.mockReturnValue(false);
      render(<NavBar {...defaultProps} />);
      expect(screen.getByText('AI Analytics')).toBeInTheDocument();
    });

    it('shows AI Analytics when the user has the watcher (watchedgroup) permission', () => {
      mockHasPermission.value = false;
      mockCheckRbacPermission.mockReturnValue(true);
      render(<NavBar {...defaultProps} />);
      expect(screen.getByText('AI Analytics')).toBeInTheDocument();
      expect(mockCheckRbacPermission).toHaveBeenCalledWith(
        expect.anything(),
        WATCHER_RBAC_RESOURCE,
      );
    });

    it('hides AI Analytics when the header menu config flag is disabled, even for a watcher', () => {
      vi.mocked(config.settings.aiAnalyticsHeaderMenuEnabled).mockReturnValue(false);
      mockHasPermission.value = true;
      mockCheckRbacPermission.mockReturnValue(true);
      render(<NavBar {...defaultProps} />);
      expect(screen.queryByText('AI Analytics')).not.toBeInTheDocument();
    });
  });
});
