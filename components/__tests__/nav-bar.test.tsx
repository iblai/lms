import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockPush = vi.fn();
let mockPathname = '/platform/test-tenant/home';

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({ push: mockPush })),
  usePathname: vi.fn(() => mockPathname),
  useSearchParams: vi.fn(() => new URLSearchParams()),
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

const mockEnrolledCourses = {
  count: 2,
  results: [
    { course_id: 'course-v1:main+AAA+2026', course_name: 'Course Alpha', active: true },
    { course_id: 'course-v1:main+BBB+2026', course_name: 'Course Beta', active: true },
  ],
};

vi.mock('@/services/courses', () => ({
  useGetUserEnrolledCoursesQuery: vi.fn(() => ({
    data: mockEnrolledCourses,
    isLoading: false,
  })),
}));

vi.mock('../header/profile/user-profile-button', () => ({
  UserProfileButton: () => <div data-testid="user-profile-button">Profile</div>,
}));

// Faithful placement stub of the SDK shell: renders the slots and exposes
// the config surfaces (search form, notifications marker, anonymous
// buttons) so the tests verify what the WRAPPER feeds the SDK.
vi.mock('@iblai/iblai-js/web-containers', () => ({
  PlatformNavbar: ({
    left,
    modeSwitcher,
    search,
    notifications,
    profile,
    visibleToLoggedInUsersOnly,
    onLoginClick,
  }: any) => (
    <nav data-testid="platform-navbar">
      <div data-testid="left-slot">{left}</div>
      <div data-testid="mode-switcher-slot">{modeSwitcher}</div>
      {search && (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget as HTMLFormElement).elements.namedItem(
              'q',
            ) as HTMLInputElement;
            search.onSubmit(input.value.trim());
          }}
        >
          <input name="q" placeholder="Search" />
        </form>
      )}
      {notifications && visibleToLoggedInUsersOnly && (
        <div
          data-testid="notification-dropdown"
          data-org={notifications.org}
          data-user={notifications.userId}
        />
      )}
      {visibleToLoggedInUsersOnly && profile}
      {!visibleToLoggedInUsersOnly && onLoginClick && (
        <div>
          <button onClick={onLoginClick}>Log In</button>
          <button onClick={onLoginClick}>Sign Up</button>
        </div>
      )}
    </nav>
  ),
}));

const mockToggleSidebar = vi.fn();
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  useSidebar: () => ({ toggleSidebar: mockToggleSidebar }),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
  useTenantMetadata: vi.fn(() => ({ metadata: {}, isLoading: false, isError: false })),
}));

// Always-open dropdown stub: the radix open/close behavior is the SDK's
// concern; these tests target the CourseSwitcher's own logic (label
// resolution, listing, switch navigation).
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div role="menu">{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: any) => (
    <button role="menuitem" onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
}));

import { NavBar } from '../nav-bar';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
import { parseMarkdownLinks } from '@/utils/helpers';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';

describe('NavBar', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockPathname = '/platform/test-tenant/home';
    const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false, is_department_admin: false },
    } as any);
    vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(false);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadata: {},
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(parseMarkdownLinks).mockReturnValue([]);
  });

  it('renders the banner landmark around the SDK shell', () => {
    render(<NavBar />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('platform-navbar')).toBeInTheDocument();
  });

  it('does not render the old page links (navigation lives in the sidebar)', () => {
    render(<NavBar />);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    expect(screen.queryByText('Discover')).not.toBeInTheDocument();
  });

  it('toggles the sidebar from the mobile hamburger', () => {
    render(<NavBar />);
    fireEvent.click(screen.getByLabelText('Open sidebar'));
    expect(mockToggleSidebar).toHaveBeenCalled();
  });

  it('hides the hamburger when logged out', async () => {
    const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
    vi.mocked(isLoggedIn).mockReturnValue(false);
    render(<NavBar />);
    expect(screen.queryByLabelText('Open sidebar')).not.toBeInTheDocument();
  });

  it('renders user profile button and notification config when logged in', () => {
    render(<NavBar />);
    expect(screen.getByTestId('user-profile-button')).toBeInTheDocument();
    const bell = screen.getByTestId('notification-dropdown');
    expect(bell).toHaveAttribute('data-org', 'test-tenant');
    expect(bell).toHaveAttribute('data-user', 'test-user');
  });

  describe('search', () => {
    it('redirects to the discover page with the query', () => {
      render(<NavBar />);
      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'machine learning' } });
      fireEvent.submit(input.closest('form')!);
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/discover?q=machine%20learning');
    });

    it('updates the query in place when already on discover', () => {
      mockPathname = '/platform/test-tenant/discover';
      window.history.replaceState(null, '', '/platform/test-tenant/discover');
      render(<NavBar />);
      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'data' } });
      fireEvent.submit(input.closest('form')!);
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/discover?q=data'));
    });

    it('hides the search bar when hideDiscoverTab is true', () => {
      vi.mocked(config.settings.hideDiscoverTab).mockReturnValue(true);
      render(<NavBar />);
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });

    it('hides the search bar when enable_discover_page is false', () => {
      vi.mocked(useTenantMetadata).mockReturnValue({
        metadata: { enable_discover_page: false },
        isLoading: false,
        isError: false,
      } as any);
      render(<NavBar />);
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });

    it('shows the search bar when enable_discover_page is null (truthy default)', () => {
      vi.mocked(useTenantMetadata).mockReturnValue({
        metadata: { enable_discover_page: null },
        isLoading: false,
        isError: false,
      } as any);
      render(<NavBar />);
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  describe('right links', () => {
    it('does not render Studio or AI Analytics (they live in the sidebar)', async () => {
      const { useGetDepartmentMemberCheckQuery } = await import('@/services/core');
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true, is_department_admin: true },
      } as any);
      render(<NavBar />);
      expect(screen.queryByText('Studio')).not.toBeInTheDocument();
      expect(screen.queryByText('AI Analytics')).not.toBeInTheDocument();
    });

    it('renders tenant-configured right header links', async () => {
      const { parseMarkdownLinks } = await import('@/utils/helpers');
      vi.mocked(parseMarkdownLinks).mockReturnValue([
        { label: 'Docs', link: 'https://docs.example.com' },
      ] as any);
      render(<NavBar />);
      expect(screen.getAllByText('Docs').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('course switcher', () => {
    it('is absent off course pages', () => {
      render(<NavBar />);
      expect(screen.queryByLabelText('Switch course')).not.toBeInTheDocument();
    });

    it('shows the current course name on a course about page', () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      const trigger = screen.getByLabelText('Switch course');
      expect(trigger).toHaveTextContent('Course Alpha');
    });

    it('lists enrolled courses and switches to another course about page', () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      fireEvent.click(screen.getByRole('menuitem', { name: /Course Beta/ }));
      expect(mockPush).toHaveBeenCalledWith(
        '/platform/test-tenant/courses/course-v1:main+BBB+2026',
      );
    });

    it('preserves the detail tab when switching on course-content pages', () => {
      mockPathname = '/platform/test-tenant/course-content/course-v1:main+AAA+2026/progress';
      render(<NavBar />);
      fireEvent.click(screen.getByRole('menuitem', { name: /Course Beta/ }));
      expect(mockPush).toHaveBeenCalledWith(
        `/platform/test-tenant/course-content/${encodeURIComponent('course-v1:main+BBB+2026')}/progress`,
      );
    });

    it('does not navigate when re-selecting the current course', () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      fireEvent.click(screen.getByRole('menuitem', { name: /Course Alpha/ }));
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('falls back to an id-derived label for a non-enrolled course', () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:other+XYZ+2026';
      render(<NavBar />);
      const trigger = screen.getByLabelText('Switch course');
      expect(trigger).toHaveTextContent('XYZ 2026');
    });
  });

  describe('when logged out', () => {
    beforeEach(async () => {
      const { isLoggedIn } = await import('@iblai/iblai-js/web-utils');
      vi.mocked(isLoggedIn).mockReturnValue(false);
    });

    it('renders Log In and Sign Up via the SDK slot', () => {
      render(<NavBar />);
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    it('does not render notification dropdown or profile button', () => {
      render(<NavBar />);
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-profile-button')).not.toBeInTheDocument();
    });

    it('triggers the join-tenant redirect from the login buttons', async () => {
      const { redirectToAuthSpaJoinTenant } = await import('@/utils/helpers');
      render(<NavBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
      expect(redirectToAuthSpaJoinTenant).toHaveBeenCalledWith('test-tenant', undefined, true);
    });
  });
});
