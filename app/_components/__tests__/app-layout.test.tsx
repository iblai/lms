import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  usePathname: vi.fn(() => '/home'),
}));

// Mock isNonAuthPathname (and NON_AUTH_PAGES for back-compat)
vi.mock('@/constants/global', () => ({
  NON_AUTH_PAGES: ['/sso-login', '/sso-login-complete', '/version', '/'],
  isNonAuthPathname: (pathname: string) => {
    const list = ['/sso-login', '/sso-login-complete', '/version', '/'];
    if (list.includes(pathname)) return true;
    return /^\/[^/]+\/start\/?$/.test(pathname);
  },
}));

// Mock useChatState
const mockSetCourseMentor = vi.fn();
const mockSetMentorSidebarHidden = vi.fn();
vi.mock('@/components/chat-button', () => ({
  useChatState: vi.fn(() => ({
    courseMentor: null,
    setCourseMentor: mockSetCourseMentor,
    setMentorSidebarHidden: mockSetMentorSidebarHidden,
    mentorSidebarHidden: false,
  })),
  ChatButton: ({ isMobile }: { isMobile: boolean }) => (
    <div data-testid="chat-button" data-is-mobile={isMobile}>
      ChatButton
    </div>
  ),
}));

// Mock react-responsive
vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(() => false),
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      mentorEnabled: vi.fn(() => true),
    },
  },
}));

// Mock NavigationDrawer
vi.mock('@/components/navigation-drawer', () => ({
  NavigationDrawer: ({ isOpen, onClose }: any) => (
    <div data-testid="navigation-drawer" data-is-open={isOpen}>
      NavigationDrawer
      <button onClick={onClose} data-testid="drawer-close">
        Close
      </button>
    </div>
  ),
}));

// Mock NavBar
vi.mock('@/components/nav-bar', () => ({
  NavBar: ({ sidebarOpen, activePage, onMenuClick }: any) => (
    <div data-testid="navbar" data-sidebar-open={sidebarOpen} data-active-page={activePage}>
      <button onClick={onMenuClick} data-testid="menu-btn">
        Menu
      </button>
    </div>
  ),
}));

// Mock Footer
vi.mock('@/components/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

// Mock useTenantMetadata
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isMentorAIEnabled: vi.fn(() => true),
  })),
  isLoggedIn: vi.fn(() => true),
}));

// Mock useGetUserMetadataQuery
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserMetadataQuery: vi.fn(() => ({
    data: { enable_sidebar_ai_mentor_display: true },
    isLoading: false,
  })),
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

// Mock monetization wrapper (transitively pulls @iblai/iblai-js/web-containers,
// which doesn't resolve under vitest's module resolver).
vi.mock('../monetization-wrapper', () => ({
  MonetizationWrapper: () => <div data-testid="monetization-wrapper" />,
}));

import AppLayout from '../app-layout';
import { usePathname } from 'next/navigation';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';
import { useChatState } from '@/components/chat-button';
import { useMediaQuery } from 'react-responsive';
import { config } from '@/lib/config';

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore defaults
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isMentorAIEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_sidebar_ai_mentor_display: true },
      isLoading: false,
    } as any);
    vi.mocked(useChatState).mockReturnValue({
      courseMentor: null,
      setCourseMentor: mockSetCourseMentor,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
      mentorSidebarHidden: false,
    } as any);
    vi.mocked(useMediaQuery).mockReturnValue(false);
    vi.mocked(config.settings.mentorEnabled).mockReturnValue(true);
  });

  it('renders without crashing for an auth page', () => {
    const { container } = render(<AppLayout>children</AppLayout>);
    expect(container).toBeTruthy();
  });

  it('renders DefaultPageLayout for NON_AUTH_PAGES (/start)', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/start');

    render(
      <AppLayout>
        <div data-testid="child">Page Content</div>
      </AppLayout>,
    );

    // Should render children directly without NavBar
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders DefaultPageLayout for NON_AUTH_PAGES (/sso-login)', () => {
    vi.mocked(usePathname).mockReturnValue('/sso-login');

    render(
      <AppLayout>
        <div data-testid="child">SSO Login</div>
      </AppLayout>,
    );

    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders DefaultPageLayout for root path (/)', () => {
    vi.mocked(usePathname).mockReturnValue('/');

    render(
      <AppLayout>
        <div data-testid="child">Root</div>
      </AppLayout>,
    );

    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders full layout (NavBar, Footer) for auth pages', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('navigation-drawer')).toBeInTheDocument();
  });

  it('renders children within auth layout', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/profile');

    render(
      <AppLayout>
        <div data-testid="page-children">Profile Page</div>
      </AppLayout>,
    );

    expect(screen.getByTestId('page-children')).toBeInTheDocument();
  });

  it('shows ChatButton when all conditions are met', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(config.settings.mentorEnabled).mockReturnValue(true);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isMentorAIEnabled: vi.fn(() => true),
    } as any);
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_sidebar_ai_mentor_display: true },
      isLoading: false,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(screen.getByTestId('chat-button')).toBeInTheDocument();
  });

  it('hides ChatButton when mentorEnabled returns false', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(config.settings.mentorEnabled).mockReturnValue(false);

    render(<AppLayout>Content</AppLayout>);

    expect(screen.queryByTestId('chat-button')).not.toBeInTheDocument();
  });

  it('hides ChatButton when metadataLoaded is false', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: false,
      isMentorAIEnabled: vi.fn(() => true),
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(screen.queryByTestId('chat-button')).not.toBeInTheDocument();
  });

  it('hides ChatButton when isMentorAIEnabled returns false', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isMentorAIEnabled: vi.fn(() => false),
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(screen.queryByTestId('chat-button')).not.toBeInTheDocument();
  });

  it('hides ChatButton when userMetadata is loading', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(screen.queryByTestId('chat-button')).not.toBeInTheDocument();
  });

  it('hides ChatButton when enable_sidebar_ai_mentor_display is false', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useGetUserMetadataQuery).mockReturnValue({
      data: { enable_sidebar_ai_mentor_display: false },
      isLoading: false,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(screen.queryByTestId('chat-button')).not.toBeInTheDocument();
  });

  it('renders ChatButton with isMobile=true when on mobile', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useMediaQuery).mockReturnValue(true);

    render(<AppLayout>Content</AppLayout>);

    const chatButton = screen.getByTestId('chat-button');
    expect(chatButton).toHaveAttribute('data-is-mobile', 'true');
  });

  it('renders ChatButton with isMobile=false when not on mobile', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useMediaQuery).mockReturnValue(false);

    render(<AppLayout>Content</AppLayout>);

    const chatButton = screen.getByTestId('chat-button');
    expect(chatButton).toHaveAttribute('data-is-mobile', 'false');
  });

  it('passes active page derived from pathname to NavBar', () => {
    vi.mocked(usePathname).mockReturnValue('/profile/skills');

    render(<AppLayout>Content</AppLayout>);

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-active-page', 'profile');
  });

  it('passes "home" as active page when pathname is root-level', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');

    render(<AppLayout>Content</AppLayout>);

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-active-page', 'home');
  });

  it('calls setCourseMentor(null) when navigating away from course pages with courseMentor set', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useChatState).mockReturnValue({
      courseMentor: 'some-mentor-uuid',
      setCourseMentor: mockSetCourseMentor,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
      mentorSidebarHidden: false,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(mockSetCourseMentor).toHaveBeenCalledWith(null);
    expect(mockSetMentorSidebarHidden).toHaveBeenCalledWith(false);
  });

  it('calls setMentorSidebarHidden(false) when navigating away with mentorSidebarHidden=true', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useChatState).mockReturnValue({
      courseMentor: null,
      setCourseMentor: mockSetCourseMentor,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
      mentorSidebarHidden: true,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(mockSetMentorSidebarHidden).toHaveBeenCalledWith(false);
  });

  it('does NOT reset courseMentor when on course-content path', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/course-content/some-course');
    vi.mocked(useChatState).mockReturnValue({
      courseMentor: 'some-mentor-uuid',
      setCourseMentor: mockSetCourseMentor,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
      mentorSidebarHidden: false,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(mockSetCourseMentor).not.toHaveBeenCalled();
  });

  it('does NOT reset courseMentor when on /courses/ path', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/courses/some-course');
    vi.mocked(useChatState).mockReturnValue({
      courseMentor: 'some-mentor-uuid',
      setCourseMentor: mockSetCourseMentor,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
      mentorSidebarHidden: false,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(mockSetCourseMentor).not.toHaveBeenCalled();
  });

  it('does NOT call setCourseMentor when courseMentor and mentorSidebarHidden are both falsy', () => {
    vi.mocked(usePathname).mockReturnValue('/test-tenant/home');
    vi.mocked(useChatState).mockReturnValue({
      courseMentor: null,
      setCourseMentor: mockSetCourseMentor,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
      mentorSidebarHidden: false,
    } as any);

    render(<AppLayout>Content</AppLayout>);

    expect(mockSetCourseMentor).not.toHaveBeenCalled();
    expect(mockSetMentorSidebarHidden).not.toHaveBeenCalled();
  });

  describe('agent tab special-case', () => {
    it('hides the sidebar ChatButton when pathname is a course-content agent route', () => {
      vi.mocked(usePathname).mockReturnValue(
        '/test-tenant/course-content/course-v1:test+course+2024/agent',
      );

      render(<AppLayout>Content</AppLayout>);

      expect(screen.queryByTestId('chat-button')).not.toBeInTheDocument();
    });

    it('still renders the sidebar ChatButton on other course-content tabs', () => {
      vi.mocked(usePathname).mockReturnValue(
        '/test-tenant/course-content/course-v1:test+course+2024/course',
      );

      render(<AppLayout>Content</AppLayout>);

      expect(screen.getByTestId('chat-button')).toBeInTheDocument();
    });

    it('does not accidentally hide the ChatButton on an /agent path outside /course-content', () => {
      vi.mocked(usePathname).mockReturnValue('/agent');

      render(<AppLayout>Content</AppLayout>);

      expect(screen.getByTestId('chat-button')).toBeInTheDocument();
    });
  });
});
