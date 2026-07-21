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

// Controls the CourseTitle tablet/desktop check (react-responsive).
const mockIsTabletUp = vi.hoisted(() => ({ current: true }));
vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(() => mockIsTabletUp.current),
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

// Course metadata by course key — the navbar resolves the course title
// through useCourseMetadata (cached metadata endpoint), not the
// enrollments list. `display_name` wins over `title` when both are present.
const mockCourseMetadata: Record<string, { display_name?: string; title?: string }> = {
  'course-v1:main+AAA+2026': { display_name: 'Course Alpha', title: 'Alpha (title)' },
  'course-v1:main+BBB+2026': { display_name: 'Course Beta' },
  // Older metadata shape: only `title`.
  'course-v1:main+CCC+2026': { title: 'Course Gamma' },
};

const mockHandleFetchCourseMetaData = vi.fn(
  async (courseKey: string) => mockCourseMetadata[courseKey] ?? {},
);

vi.mock('@/hooks/courses/use-course-metadata', () => ({
  useCourseMetadata: vi.fn(() => ({
    handleFetchCourseMetaData: mockHandleFetchCourseMetaData,
  })),
}));

const mockEnrolledPrograms = [
  { program_id: 'program-alpha', name: 'Program Alpha', active: true },
  { program_id: 'program-beta', name: 'Program Beta', active: true },
];

const mockCatalogPathways = [
  { pathway_uuid: 'uuid-alpha', name: 'Pathway Alpha' },
  { pathway_uuid: 'uuid-beta', name: 'Pathway Beta' },
];

vi.mock('@/services/catalog', () => ({
  useGetUserEnrolledProgramsQuery: vi.fn(() => ({
    data: mockEnrolledPrograms,
    isLoading: false,
  })),
  useGetUserCatalogPathwaysQuery: vi.fn(() => ({
    data: mockCatalogPathways,
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

import { NavBar } from '../nav-bar';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
import { parseMarkdownLinks } from '@/utils/helpers';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { NAVBAR_COURSE_CONTROLS_ID } from '@/constants/global';

describe('NavBar', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockPathname = '/platform/test-tenant/home';
    mockIsTabletUp.current = true;
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
    // Re-pin after clearAllMocks so per-test overrides (e.g. the
    // never-resolving promise) don't leak into later tests.
    mockHandleFetchCourseMetaData.mockImplementation(
      async (courseKey: string) => mockCourseMetadata[courseKey] ?? {},
    );
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

  describe('catalog page title', () => {
    it('shows "Explore Content" in the left cluster on the catalog page', () => {
      mockPathname = '/platform/test-tenant/discover';
      render(<NavBar />);
      expect(screen.getByRole('heading', { name: 'Explore Content' })).toBeInTheDocument();
    });

    it('is absent off the catalog page', () => {
      render(<NavBar />);
      expect(screen.queryByText('Explore Content')).not.toBeInTheDocument();
    });

    it('shows "Notifications" on the notifications page', () => {
      mockPathname = '/platform/test-tenant/notifications';
      render(<NavBar />);
      expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    });

    it('shows "Analytics" on analytics pages (including sub-pages) with extra left padding on md+', () => {
      mockPathname = '/platform/test-tenant/analytics/users';
      render(<NavBar />);
      const title = screen.getByRole('heading', { name: 'Analytics' });
      expect(title).toBeInTheDocument();
      // 12px from the md breakpoint up; mobile keeps the default alignment.
      expect(title).toHaveClass('md:pl-3');
    });
  });

  describe('course title', () => {
    it('is absent off course pages', () => {
      render(<NavBar />);
      expect(screen.queryByText('Course Alpha')).not.toBeInTheDocument();
      expect(mockHandleFetchCourseMetaData).not.toHaveBeenCalled();
    });

    it('shows the current course name as a heading on a course about page', async () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      expect(await screen.findByRole('heading', { name: 'Course Alpha' })).toBeInTheDocument();
      expect(mockHandleFetchCourseMetaData).toHaveBeenCalledWith('course-v1:main+AAA+2026');
    });

    it('prefers display_name over title when the metadata has both', async () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      expect(await screen.findByRole('heading', { name: 'Course Alpha' })).toBeInTheDocument();
      expect(screen.queryByText('Alpha (title)')).not.toBeInTheDocument();
    });

    it('falls back to title when the metadata has no display_name', async () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+CCC+2026';
      render(<NavBar />);
      expect(await screen.findByRole('heading', { name: 'Course Gamma' })).toBeInTheDocument();
    });

    it('shows the current course name on course-content detail pages', async () => {
      mockPathname = '/platform/test-tenant/course-content/course-v1:main+BBB+2026/progress';
      render(<NavBar />);
      expect(await screen.findByRole('heading', { name: 'Course Beta' })).toBeInTheDocument();
    });

    it('renders no title while the metadata is loading', () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      // Never resolves within this test — the slot must stay empty rather
      // than showing a label derived from the course id.
      mockHandleFetchCourseMetaData.mockReturnValue(new Promise(() => {}) as any);
      render(<NavBar />);
      expect(screen.queryByTestId('navbar-page-title')).not.toBeInTheDocument();
    });

    it('does not render the old enrolled-courses dropdown', async () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      await screen.findByRole('heading', { name: 'Course Alpha' });
      expect(screen.queryByLabelText('Switch course')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('nudges the title left by 11px on course-content pages on tablet/desktop', async () => {
      mockPathname = '/platform/test-tenant/course-content/course-v1:main+BBB+2026/course';
      render(<NavBar />);
      const title = await screen.findByRole('heading', { name: 'Course Beta' });
      expect(title).toHaveStyle({ marginLeft: '-11px' });
    });

    it('keeps the default title alignment on course-content pages on mobile', async () => {
      mockIsTabletUp.current = false;
      mockPathname = '/platform/test-tenant/course-content/course-v1:main+BBB+2026/course';
      render(<NavBar />);
      const title = await screen.findByRole('heading', { name: 'Course Beta' });
      expect(title.style.marginLeft).toBe('');
    });

    it('does not nudge the title on the course ABOUT page', async () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:main+AAA+2026';
      render(<NavBar />);
      const title = await screen.findByRole('heading', { name: 'Course Alpha' });
      expect(title.style.marginLeft).toBe('');
    });

    it('renders no title when the metadata has neither display_name nor title', async () => {
      mockPathname = '/platform/test-tenant/courses/course-v1:other+XYZ+2026';
      render(<NavBar />);
      await vi.waitFor(() =>
        expect(mockHandleFetchCourseMetaData).toHaveBeenCalledWith('course-v1:other+XYZ+2026'),
      );
      // No id-derived fallback — the raw id reads as noise.
      expect(screen.queryByTestId('navbar-page-title')).not.toBeInTheDocument();
      expect(screen.queryByText('XYZ 2026')).not.toBeInTheDocument();
    });
  });

  describe('course controls portal slot', () => {
    it('renders the (empty) slot the course layout portals its controls into, inside the left cluster', () => {
      render(<NavBar />);
      const slot = document.getElementById(NAVBAR_COURSE_CONTROLS_ID);
      expect(slot).toBeInTheDocument();
      expect(slot).toBeEmptyDOMElement();
      expect(screen.getByTestId('left-slot').contains(slot)).toBe(true);
    });

    it('renders the slot on course-content pages too (same node, filled by the layout)', async () => {
      mockPathname = '/platform/test-tenant/course-content/course-v1:main+BBB+2026/agent';
      render(<NavBar />);
      await screen.findByRole('heading', { name: 'Course Beta' });
      expect(document.getElementById(NAVBAR_COURSE_CONTROLS_ID)).toBeInTheDocument();
    });
  });

  describe('program title', () => {
    it('shows the current program name as a heading on a program page', () => {
      mockPathname = '/platform/test-tenant/programs/program-alpha';
      render(<NavBar />);
      expect(screen.getByRole('heading', { name: 'Program Alpha' })).toBeInTheDocument();
    });

    it('falls back to the program id when the program is not in the enrollments', () => {
      mockPathname = '/platform/test-tenant/programs/unknown-program';
      render(<NavBar />);
      expect(screen.getByRole('heading', { name: 'unknown-program' })).toBeInTheDocument();
    });

    it('is absent off program pages', () => {
      render(<NavBar />);
      expect(screen.queryByText('Program Alpha')).not.toBeInTheDocument();
    });
  });

  describe('pathway title', () => {
    it('shows the current pathway name as a heading on a pathway page', () => {
      mockPathname = '/platform/test-tenant/pathways/uuid-alpha';
      render(<NavBar />);
      expect(screen.getByRole('heading', { name: 'Pathway Alpha' })).toBeInTheDocument();
    });

    it('falls back to a generic label for an unknown pathway', () => {
      mockPathname = '/platform/test-tenant/pathways/unknown-uuid';
      render(<NavBar />);
      expect(screen.getByRole('heading', { name: 'Pathway' })).toBeInTheDocument();
    });

    it('is absent off pathway pages', () => {
      render(<NavBar />);
      expect(screen.queryByText('Pathway Alpha')).not.toBeInTheDocument();
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
