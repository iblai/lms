import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockPush = vi.fn();
let mockPathname = '/platform/test-tenant/home';
let mockSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
  usePathname: vi.fn(() => mockPathname),
  useSearchParams: vi.fn(() => new URLSearchParams(mockSearch)),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      hideDiscoverTab: vi.fn(() => false),
      studioHeaderMenuEnabled: vi.fn(() => true),
      aiAnalyticsHeaderMenuEnabled: vi.fn(() => true),
      enableRBAC: vi.fn(() => true),
      mainPlatformKey: vi.fn(() => 'main'),
      appName: vi.fn(() => 'skills'),
      platformBaseDomain: vi.fn(() => 'example.com'),
    },
    urls: {
      studioUrl: vi.fn(() => 'https://studio.example.com'),
      auth: vi.fn(() => 'https://auth.example.com'),
    },
  },
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
  getUserEmail: vi.fn(() => 'test-user@example.com'),
}));

vi.mock('@/utils/discover-visibility', () => ({
  isDiscoverEnabled: vi.fn(() => true),
}));

vi.mock('@/utils/course-content-mode', () => ({
  WATCHER_RBAC_RESOURCE: '/watchedgroups/#list',
}));

// checkRbacPermission is exercised for real gate combinations: grant a
// resource by adding it to mockRbacPermissions.
let mockRbacPermissions: string[] = [];
vi.mock('@/hoc', () => ({
  checkRbacPermission: vi.fn(
    (permissions: any, resource: string) =>
      Array.isArray(permissions) && permissions.includes(resource),
  ),
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: vi.fn(() => mockRbacPermissions),
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(),
}));

vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false, is_department_admin: false },
  })),
}));

vi.mock('@/utils/localstorage', () => ({
  useCurrentTenant: vi.fn(() => ({ currentTenant: { key: 'test-tenant' } })),
  useUserTenants: vi.fn(() => ({ userTenants: [{ key: 'test-tenant' }] })),
  canMonetize: vi.fn(() => true),
}));

vi.mock('@/components/logo', () => ({
  Logo: () => <div data-testid="logo" />,
}));

vi.mock('@/components/profile/profile-credentials-content', () => ({
  ProfileCredentialsContent: () => <div data-testid="credentials-content" />,
}));

vi.mock('@/components/profile/profile-skills-content', () => ({
  ProfileSkillsContent: () => <div data-testid="skills-content" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) =>
    open ? (
      <div data-testid="library-dialog">
        <button onClick={() => onOpenChange(false)}>Dismiss dialog</button>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  isLoggedIn: vi.fn(() => true),
  useTenantMetadata: vi.fn(() => ({ metadata: {} })),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  GradebookTab: ({ org, username }: any) => (
    <div data-testid="gradebook-tab" data-org={org} data-username={username} />
  ),
  InviteUserDialog: ({ tenant, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="invite-dialog" data-tenant={tenant}>
        <button onClick={onClose}>Close invite</button>
      </div>
    ) : null,
}));

// Faithful placement stub of the SDK sidebar shell: renders the logo and
// footer slots, walks the sections config (custom rows are rendered in both
// the expanded and the collapsed rail so the wrapper's FlatNavRow covers
// both), and exposes the open-section + footer-action callbacks as buttons.
const mockOnAfterNav = vi.fn();
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  PLATFORM_SIDEBAR_NAV_MUTED: '#8a8a8e',
  PlatformSidebarCollapsedLabelFlyout: ({ label, children }: any) => (
    <div data-testid={`flyout-${label}`}>{children}</div>
  ),
  PlatformAccountSheet: ({ tab, onClose, onInviteClick }: any) =>
    tab ? (
      <div data-testid="account-sheet" data-tab={tab}>
        <button onClick={onClose}>Close account sheet</button>
        <button onClick={onInviteClick}>Invite from sheet</button>
      </div>
    ) : null,
  PlatformSidebar: ({
    logo,
    primaryAction,
    sections,
    openSectionId,
    onOpenSectionChange,
    footer,
  }: any) => (
    <div
      data-testid="platform-sidebar"
      data-open-section={openSectionId ?? ''}
      data-primary-action={String(primaryAction)}
    >
      <div data-testid="logo-slot">{logo}</div>
      <div data-testid="sections">
        {sections.map((section: any) => {
          if (section.type === 'divider') {
            return <hr key={section.id} data-testid={`divider-${section.id}`} />;
          }
          if (section.type === 'menu') {
            return (
              <div key={section.menu.id} data-testid={`menu-${section.menu.id}`}>
                <span>{section.menu.label}</span>
                {section.menu.items.map((item: any) => (
                  <a key={item.id} href={item.href} data-exact={String(!!item.exact)}>
                    {item.label}
                  </a>
                ))}
              </div>
            );
          }
          return (
            <div key={section.id} data-testid={`section-${section.id}`}>
              <div data-testid={`section-${section.id}-expanded`}>
                {section.render({ collapsed: false, onAfterNav: mockOnAfterNav })}
              </div>
              <div data-testid={`section-${section.id}-collapsed`}>
                {section.render({ collapsed: true, onAfterNav: mockOnAfterNav })}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => onOpenSectionChange('analytics')}>Force open analytics</button>
      <button onClick={() => onOpenSectionChange(null)}>Force close section</button>
      <div
        data-testid="sidebar-footer"
        data-is-admin={String(footer.isAdmin)}
        data-is-live-admin={String(footer.isLiveAdmin)}
        data-enable-rbac={String(footer.enableRbac)}
        data-tenant-key={footer.tenantKey}
        data-current-tenant-key={footer.currentTenant.key}
        data-enable-monetization={String(footer.currentTenant.enable_monetization)}
        data-notifications-allowed={String(footer.notificationsAllowed)}
        data-invites-allowed={String(footer.invitesUserTypeAllowed)}
      >
        {['notifications', 'invites', 'management', 'integrations', 'monetization', 'advanced'].map(
          (actionId) => (
            <button key={actionId} onClick={() => footer.onAction(actionId)}>
              {`footer-${actionId}`}
            </button>
          ),
        )}
      </div>
    </div>
  ),
}));

import { AppSidebar } from '../index';
import { isLoggedIn } from '@iblai/iblai-js/web-utils';
import { isDiscoverEnabled } from '@/utils/discover-visibility';
import { config } from '@/lib/config';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { canMonetize, useUserTenants } from '@/utils/localstorage';
import { getUserName } from '@/utils/helpers';

const expandedRow = (id: string) =>
  within(screen.getByTestId(`section-${id}-expanded`)).getByRole('button');
const collapsedRow = (id: string) =>
  within(screen.getByTestId(`section-${id}-collapsed`)).getByRole('button');

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/platform/test-tenant/home';
    mockSearch = '';
    mockRbacPermissions = [];
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(isDiscoverEnabled).mockReturnValue(true);
    vi.mocked(config.settings.aiAnalyticsHeaderMenuEnabled).mockReturnValue(true);
    vi.mocked(config.settings.studioHeaderMenuEnabled).mockReturnValue(true);
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false, is_department_admin: false },
    } as any);
    vi.mocked(canMonetize).mockReturnValue(true);
    vi.mocked(useUserTenants).mockReturnValue({ userTenants: [{ key: 'test-tenant' }] } as any);
    vi.mocked(getUserName).mockReturnValue('test-user');
  });

  it('renders nothing when logged out', () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const { container } = render(<AppSidebar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the logo linked to the tenant home', () => {
    render(<AppSidebar />);
    const logoLink = screen.getByRole('link', { name: 'Home' });
    expect(logoLink).toHaveAttribute('href', '/platform/test-tenant/home');
    expect(within(logoLink).getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByTestId('platform-sidebar')).toHaveAttribute('data-primary-action', 'null');
  });

  it('renders the core nav rows and the library divider', () => {
    render(<AppSidebar />);
    for (const id of [
      'home',
      'courses',
      'programs',
      'pathways',
      'discover',
      'gradebook',
      'credentials',
      'skills',
    ]) {
      expect(screen.getByTestId(`section-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('divider-library-divider')).toBeInTheDocument();
    expect(expandedRow('home')).toHaveTextContent('Home');
    expect(expandedRow('courses')).toHaveTextContent('Courses');
  });

  describe('navigation clicks', () => {
    it('routes Home through the router and fires onAfterNav', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('home'));
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/home');
      expect(mockOnAfterNav).toHaveBeenCalled();
    });

    it('deep-links Courses into the enrolled catalog', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('courses'));
      expect(mockPush).toHaveBeenCalledWith(
        '/platform/test-tenant/discover?content=courses&enrolled=true',
      );
    });

    it('deep-links Programs and Pathways into the enrolled catalog', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('programs'));
      expect(mockPush).toHaveBeenCalledWith(
        '/platform/test-tenant/discover?content=programs&enrolled=true',
      );
      fireEvent.click(expandedRow('pathways'));
      expect(mockPush).toHaveBeenCalledWith(
        '/platform/test-tenant/discover?content=pathways&enrolled=true',
      );
    });

    it('routes Discover to the unfiltered catalog', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('discover'));
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/discover');
    });

    it('navigates from the collapsed rail buttons too', () => {
      render(<AppSidebar />);
      expect(screen.getByTestId('flyout-Home')).toBeInTheDocument();
      const collapsed = collapsedRow('home');
      expect(collapsed).toHaveAttribute('aria-label', 'Home');
      fireEvent.click(collapsed);
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/home');
      expect(mockOnAfterNav).toHaveBeenCalled();
    });
  });

  describe('active states', () => {
    it('marks Home active on the home route (and collapsed rail)', () => {
      mockPathname = '/platform/test-tenant/home/';
      render(<AppSidebar />);
      expect(expandedRow('home').className).toContain('bg-[#eef6fc]');
      expect(collapsedRow('home').className).toContain('bg-[#eef6fc]');
      expect(expandedRow('gradebook').className).not.toContain('bg-[#eef6fc]');
    });

    it('marks Courses (not Discover) active on the enrolled courses catalog', () => {
      mockPathname = '/platform/test-tenant/discover';
      mockSearch = 'content=courses&enrolled=true';
      render(<AppSidebar />);
      expect(expandedRow('courses').className).toContain('bg-[#eef6fc]');
      expect(expandedRow('programs').className).not.toContain('bg-[#eef6fc]');
      expect(expandedRow('discover').className).not.toContain('bg-[#eef6fc]');
    });

    it('marks Discover active on the unfiltered catalog page', () => {
      mockPathname = '/platform/test-tenant/discover/';
      render(<AppSidebar />);
      expect(expandedRow('discover').className).toContain('bg-[#eef6fc]');
      expect(expandedRow('courses').className).not.toContain('bg-[#eef6fc]');
    });
  });

  describe('Discover gate', () => {
    it('hides the Discover row when the gate is off', () => {
      vi.mocked(isDiscoverEnabled).mockReturnValue(false);
      render(<AppSidebar />);
      expect(screen.queryByTestId('section-discover')).not.toBeInTheDocument();
    });
  });

  describe('Studio gate', () => {
    it('hides Studio for non-admins', () => {
      render(<AppSidebar />);
      expect(screen.queryByTestId('section-studio')).not.toBeInTheDocument();
    });

    it('hides Studio when the config flag is off, even for admins', () => {
      vi.mocked(config.settings.studioHeaderMenuEnabled).mockReturnValue(false);
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true, is_department_admin: false },
      } as any);
      render(<AppSidebar />);
      expect(screen.queryByTestId('section-studio')).not.toBeInTheDocument();
    });

    it('shows Studio to platform admins and opens the Studio host in a new tab', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true, is_department_admin: false },
      } as any);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<AppSidebar />);
      fireEvent.click(expandedRow('studio'));
      expect(openSpy).toHaveBeenCalledWith(
        'https://studio.example.com',
        '_blank',
        'noopener,noreferrer',
      );
      expect(mockPush).not.toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('shows Studio to department admins', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false, is_department_admin: true },
      } as any);
      render(<AppSidebar />);
      expect(screen.getByTestId('section-studio')).toBeInTheDocument();
    });
  });

  describe('Analytics gate', () => {
    it('hides Analytics when the config flag is off, even with RBAC access', () => {
      vi.mocked(config.settings.aiAnalyticsHeaderMenuEnabled).mockReturnValue(false);
      mockRbacPermissions = ['/platforms/test-tenant/#can_view_analytics'];
      render(<AppSidebar />);
      expect(screen.queryByTestId('menu-analytics')).not.toBeInTheDocument();
    });

    it('hides Analytics when the flag is on but the user has no RBAC access', () => {
      render(<AppSidebar />);
      expect(screen.queryByTestId('menu-analytics')).not.toBeInTheDocument();
    });

    it('shows Analytics with the can_view_analytics permission alone', () => {
      mockRbacPermissions = ['/platforms/test-tenant/#can_view_analytics'];
      render(<AppSidebar />);
      expect(screen.getByTestId('menu-analytics')).toBeInTheDocument();
    });

    it('shows Analytics with the watcher permission alone', () => {
      mockRbacPermissions = ['/watchedgroups/#list'];
      render(<AppSidebar />);
      expect(screen.getByTestId('menu-analytics')).toBeInTheDocument();
    });

    it('renders every analytics menu item with its tenant-scoped href', () => {
      mockRbacPermissions = ['/platforms/test-tenant/#can_view_analytics'];
      render(<AppSidebar />);
      const menu = screen.getByTestId('menu-analytics');
      const base = '/platform/test-tenant/analytics';
      const expectations: Array<[string, string]> = [
        ['Overview', base],
        ['Users', `${base}/users`],
        ['Courses', `${base}/courses`],
        ['Programs', `${base}/programs`],
        ['Topics', `${base}/topics`],
        ['Transcripts', `${base}/transcripts`],
        ['Costs', `${base}/financial`],
        ['Audit', `${base}/audit`],
        ['Data Reports', `${base}/reports`],
      ];
      for (const [label, href] of expectations) {
        expect(within(menu).getByText(label)).toHaveAttribute('href', href);
      }
      expect(within(menu).getByText('Overview')).toHaveAttribute('data-exact', 'true');
    });

    it('force-opens the Analytics accordion when deep-linked into analytics', () => {
      mockRbacPermissions = ['/platforms/test-tenant/#can_view_analytics'];
      mockPathname = '/platform/test-tenant/analytics/users';
      render(<AppSidebar />);
      expect(screen.getByTestId('platform-sidebar')).toHaveAttribute(
        'data-open-section',
        'analytics',
      );
    });

    it('tracks the shell open/close section callbacks', () => {
      render(<AppSidebar />);
      const sidebar = screen.getByTestId('platform-sidebar');
      expect(sidebar).toHaveAttribute('data-open-section', '');
      fireEvent.click(screen.getByText('Force open analytics'));
      expect(screen.getByTestId('platform-sidebar')).toHaveAttribute(
        'data-open-section',
        'analytics',
      );
      fireEvent.click(screen.getByText('Force close section'));
      expect(screen.getByTestId('platform-sidebar')).toHaveAttribute('data-open-section', '');
    });
  });

  describe('library dialogs', () => {
    it('opens the Gradebook dialog with the SDK gradebook wired to org/username', () => {
      render(<AppSidebar />);
      expect(screen.queryByTestId('library-dialog')).not.toBeInTheDocument();
      fireEvent.click(expandedRow('gradebook'));
      expect(mockPush).not.toHaveBeenCalled();
      const dialog = screen.getByTestId('library-dialog');
      expect(within(dialog).getByRole('heading', { name: 'Gradebook' })).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          'Your grades and progress across courses, programs, and pathways.',
        ),
      ).toBeInTheDocument();
      const gradebook = within(dialog).getByTestId('gradebook-tab');
      expect(gradebook).toHaveAttribute('data-org', 'test-tenant');
      expect(gradebook).toHaveAttribute('data-username', 'test-user');
    });

    it('opens the Credentials dialog hosting the profile credentials content', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('credentials'));
      const dialog = screen.getByTestId('library-dialog');
      expect(within(dialog).getByRole('heading', { name: 'Credentials' })).toBeInTheDocument();
      expect(within(dialog).getByTestId('credentials-content')).toBeInTheDocument();
    });

    it('opens the Skills dialog hosting the profile skills content', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('skills'));
      const dialog = screen.getByTestId('library-dialog');
      expect(within(dialog).getByRole('heading', { name: 'Skills' })).toBeInTheDocument();
      expect(within(dialog).getByTestId('skills-content')).toBeInTheDocument();
    });

    it('closes the dialog through onOpenChange', () => {
      render(<AppSidebar />);
      fireEvent.click(expandedRow('gradebook'));
      expect(screen.getByTestId('library-dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Dismiss dialog'));
      expect(screen.queryByTestId('library-dialog')).not.toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('feeds the SDK footer the admin, RBAC, and monetization signals', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true, is_department_admin: false },
      } as any);
      render(<AppSidebar />);
      const footer = screen.getByTestId('sidebar-footer');
      expect(footer).toHaveAttribute('data-is-admin', 'true');
      expect(footer).toHaveAttribute('data-is-live-admin', 'true');
      expect(footer).toHaveAttribute('data-enable-rbac', 'true');
      expect(footer).toHaveAttribute('data-tenant-key', 'test-tenant');
      expect(footer).toHaveAttribute('data-current-tenant-key', 'test-tenant');
      expect(footer).toHaveAttribute('data-enable-monetization', 'true');
      expect(footer).toHaveAttribute('data-notifications-allowed', 'true');
      expect(footer).toHaveAttribute('data-invites-allowed', 'true');
    });

    it('reports non-admins and monetization ineligibility to the footer', () => {
      vi.mocked(canMonetize).mockReturnValue(false);
      vi.mocked(useUserTenants).mockReturnValue({ userTenants: undefined } as any);
      render(<AppSidebar />);
      const footer = screen.getByTestId('sidebar-footer');
      expect(footer).toHaveAttribute('data-is-admin', 'false');
      expect(footer).toHaveAttribute('data-enable-monetization', 'false');
    });

    it('routes the notifications action to the notifications page', () => {
      render(<AppSidebar />);
      fireEvent.click(screen.getByText('footer-notifications'));
      expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/notifications');
    });

    it('opens and closes the invite dialog from the invites action', () => {
      render(<AppSidebar />);
      expect(screen.queryByTestId('invite-dialog')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('footer-invites'));
      const invite = screen.getByTestId('invite-dialog');
      expect(invite).toHaveAttribute('data-tenant', 'test-tenant');
      fireEvent.click(screen.getByText('Close invite'));
      expect(screen.queryByTestId('invite-dialog')).not.toBeInTheDocument();
    });

    it.each([
      ['management', 'footer-management'],
      ['integrations', 'footer-integrations'],
      ['monetization', 'footer-monetization'],
      ['advanced', 'footer-advanced'],
    ])('opens the account sheet on the %s tab', (tab, buttonLabel) => {
      render(<AppSidebar />);
      expect(screen.queryByTestId('account-sheet')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText(buttonLabel));
      expect(screen.getByTestId('account-sheet')).toHaveAttribute('data-tab', tab);
    });

    it('closes the account sheet and can open the invite dialog from it', () => {
      render(<AppSidebar />);
      fireEvent.click(screen.getByText('footer-management'));
      fireEvent.click(screen.getByText('Invite from sheet'));
      expect(screen.getByTestId('invite-dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close account sheet'));
      expect(screen.queryByTestId('account-sheet')).not.toBeInTheDocument();
    });
  });

  it('handles a null username by passing empty strings downstream', () => {
    vi.mocked(getUserName).mockReturnValue(null as any);
    render(<AppSidebar />);
    fireEvent.click(expandedRow('gradebook'));
    expect(screen.getByTestId('gradebook-tab')).toHaveAttribute('data-username', '');
  });
});
