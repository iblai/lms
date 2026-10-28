import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileButton } from '../user-profile-button';

// Hoisted mock functions
const mockLearnerMode = vi.hoisted(() => ({ isInstructorMode: true, toggleLearnerMode: vi.fn() }));
vi.mock('@/hooks/use-learner-mode', () => ({ useLearnerMode: () => mockLearnerMode }));

const {
  mockSaveCurrentTenant,
  mockSaveUserTenants,
  mockDispatch,
  mockHandleLogout,
  mockHandleTenantSwitch,
  mockOnAccountDeleted,
} = vi.hoisted(() => ({
  mockSaveCurrentTenant: vi.fn(),
  mockSaveUserTenants: vi.fn(),
  mockDispatch: vi.fn(),
  mockHandleLogout: vi.fn(),
  mockHandleTenantSwitch: vi.fn(),
  mockOnAccountDeleted: vi.fn(),
}));

// Mutable state for per-test config control
let mockEnableGravatarOnProfilePic = 'true';
let mockDefaultSupportPhoneNumber = '(571) 293-0242';
let mockEnableSupportPhone = false;
let mockTenantMetadata: { support_phone_number?: string; support_url?: string } | undefined =
  undefined;
let mockMetadataLoaded = true;

// The route the button is rendered under. `useTenantParam` reads it, so this is
// what decides which tenant the dropdown — and its onboarding links — point at.
let mockRouteParams: Record<string, string | string[]> = { tenant: 'test-tenant' };
vi.mock('next/navigation', () => ({
  useParams: () => mockRouteParams,
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: () => 'test-tenant',
  getUserName: () => 'testuser',
  getUserEmail: () => 'test@example.com',
  handleLogout: mockHandleLogout,
  handleTenantSwitch: mockHandleTenantSwitch,
  onAccountDeleted: mockOnAccountDeleted,
}));

// Mock local storage hooks - default to admin
let mockIsAdmin = true;
const defaultUserTenants = [
  { key: 'test-tenant', is_admin: true, org: 'test-org' },
  { key: 'other-tenant', is_admin: false, org: 'other-org' },
];
let mockUserTenants: { key: string; is_admin: boolean; org: string }[] = defaultUserTenants;
vi.mock('@/utils/localstorage', () => ({
  useCurrentTenant: () => ({
    currentTenant: { key: 'test-tenant', is_admin: true, org: 'test-org' },
    saveCurrentTenant: mockSaveCurrentTenant,
  }),
  useUserTenants: () => ({
    userTenants: mockUserTenants,
    saveUserTenants: mockSaveUserTenants,
  }),
  useIsAdmin: () => mockIsAdmin,
}));

let mockIsPlatformAdmin = true;
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: () => ({
    data: { is_platform_admin: mockIsPlatformAdmin },
  }),
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      appName: () => 'skills',
      platformBaseDomain: () => 'example.com',
      enableRBAC: () => false,
      enableGravatarOnProfilePic: () => mockEnableGravatarOnProfilePic,
      mainPlatformKey: () => 'main',
      defaultSupportPhoneNumber: () => mockDefaultSupportPhoneNumber,
      enableSupportPhone: () => mockEnableSupportPhone,
      helpCenterUrl: () => 'https://ibl.ai/support',
    },
    urls: {
      auth: () => 'https://auth.example.com',
    },
  },
}));

// Mock Redux hooks
vi.mock('@/lib/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => {
    const mockState = {
      rbac: {},
    };
    return selector(mockState);
  },
}));

// Mock RBAC slice
vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: () => ({}),
  updateRbacPermissions: vi.fn((permissions) => ({
    type: 'updateRbacPermissions',
    payload: permissions,
  })),
}));

// Mock web-utils
vi.mock('@iblai/iblai-js/web-utils', () => ({
  Tenant: {},
  useTenantMetadata: () => ({ metadata: mockTenantMetadata, metadataLoaded: mockMetadataLoaded }),
}));

// Mock UserProfileDropdown
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  UserProfileDropdown: (props: any) => (
    <div data-testid="user-profile-dropdown">
      <span data-testid="username">{props.username}</span>
      <span data-testid="tenant">{props.tenantKey}</span>
      <span data-testid="is-admin">{String(props.userIsAdmin)}</span>
      <span data-testid="user-is-student">{String(props.userIsStudent)}</span>
      <span data-testid="show-tenant-switcher">{String(props.showTenantSwitcher)}</span>
      <span data-testid="show-account-tab">{String(props.showAccountTab)}</span>
      <span data-testid="show-help-link">{String(props.showHelpLink)}</span>
      <span data-testid="help-center-url">{props.helpCenterUrl}</span>
      <span data-testid="metadata">{JSON.stringify(props.metadata)}</span>
      <span data-testid="metadata-loaded">{String(props.metadataLoaded)}</span>
      <span data-testid="show-learner-mode-switch">{String(props.showLearnerModeSwitch)}</span>
      <span data-testid="has-learner-mode-switch-component">
        {String(!!props.LearnerModeSwitchComponent)}
      </span>
      <span data-testid="show-gradebook-tab">{String(props.showGradebookTab)}</span>
      <span data-testid="current-spa">{props.currentSPA}</span>
      <span data-testid="enable-gravatar-on-profile-pic">
        {String(props.enableGravatarOnProfilePic)}
      </span>
      <span data-testid="default-support-phone">{String(props.defaultSupportPhone)}</span>
      <span data-testid="enable-support-phone">{String(props.enableSupportPhone)}</span>
      <span data-testid="onboarding-base-path">{String(props.onboardingBasePath)}</span>
      <button data-testid="logout-btn" onClick={() => props.onLogout?.()}>
        Logout
      </button>
      <button data-testid="tenant-change-btn" onClick={() => props.onTenantChange?.('new-tenant')}>
        Change Tenant
      </button>
      <button
        data-testid="tenant-update-btn"
        onClick={() => props.onTenantUpdate?.({ key: 'test-tenant', is_admin: true, org: 'org' })}
      >
        Update Tenant
      </button>
      <button
        data-testid="help-btn"
        onClick={() => props.onHelpClick?.('https://help.example.com')}
      >
        Help
      </button>
      <button
        data-testid="permissions-btn"
        onClick={() => props.onLoadGroupPermissions?.({ test: true })}
      >
        Load Permissions
      </button>
      <button data-testid="account-deleted-btn" onClick={() => props.onAccountDeleted?.()}>
        Account Deleted
      </button>
    </div>
  ),
}));

describe('UserProfileButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin = true; // Reset to admin by default
    mockIsPlatformAdmin = true;
    mockLearnerMode.isInstructorMode = true;
    mockEnableGravatarOnProfilePic = 'true'; // Reset to gravatar enabled by default
    mockDefaultSupportPhoneNumber = '(571) 293-0242'; // Reset to config default
    mockEnableSupportPhone = false; // Reset to support phone disabled by default
    mockTenantMetadata = undefined; // Reset to no tenant metadata
    mockMetadataLoaded = true;
    mockUserTenants = defaultUserTenants; // Reset to default tenant list
    mockRouteParams = { tenant: 'test-tenant' }; // Reset to the tenant in the URL
  });

  describe('rendering', () => {
    it('should render the UserProfileDropdown', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();
    });

    it('should pass username to dropdown', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    it('should pass tenantKey to dropdown', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('tenant')).toHaveTextContent('test-tenant');
    });

    it('should pass current SPA as skills', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('current-spa')).toHaveTextContent('skills');
    });

    it('should not show account tab', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-account-tab')).toHaveTextContent('false');
    });

    it('shows the help link with the configured help center as the fallback URL', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-help-link')).toHaveTextContent('true');
      expect(screen.getByTestId('help-center-url')).toHaveTextContent('https://ibl.ai/support');
    });

    it('passes tenant metadata through so a tenant support_url and show_help apply', () => {
      mockTenantMetadata = { support_url: 'help.acme.edu' };
      render(<UserProfileButton />);

      expect(screen.getByTestId('metadata')).toHaveTextContent(
        JSON.stringify({ support_url: 'help.acme.edu' }),
      );
      expect(screen.getByTestId('metadata-loaded')).toHaveTextContent('true');
    });

    it('reports metadata as not loaded until the tenant metadata resolves', () => {
      mockMetadataLoaded = false;
      render(<UserProfileButton />);

      expect(screen.getByTestId('metadata-loaded')).toHaveTextContent('false');
    });

    it('shows the learner mode switch to platform admins, with the switch component', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-learner-mode-switch')).toHaveTextContent('true');
      expect(screen.getByTestId('has-learner-mode-switch-component')).toHaveTextContent('true');
    });

    it('hides the learner mode switch from non-admins', () => {
      mockIsPlatformAdmin = false;
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-learner-mode-switch')).toHaveTextContent('false');
    });

    it('sets userIsStudent to false in admin mode', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('user-is-student')).toHaveTextContent('false');
    });

    it('sets userIsStudent to true while an admin previews the learner view', () => {
      mockLearnerMode.isInstructorMode = false;
      render(<UserProfileButton />);

      expect(screen.getByTestId('user-is-student')).toHaveTextContent('true');
    });

    it('should show the gradebook tab', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-gradebook-tab')).toHaveTextContent('true');
    });

    it('should show the gradebook tab regardless of admin status', () => {
      mockIsAdmin = false;
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-gradebook-tab')).toHaveTextContent('true');
    });
  });

  describe('tenant switcher visibility', () => {
    it('should show tenant switcher for admin users', () => {
      mockIsAdmin = true;
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-tenant-switcher')).toHaveTextContent('true');
    });

    it('should not show tenant switcher for non-admin users with no other tenants', () => {
      mockIsAdmin = false;
      // User is only enrolled on the current tenant (plus main), so there are no
      // other non-main tenants to switch to.
      mockUserTenants = [
        { key: 'test-tenant', is_admin: false, org: 'test-org' },
        { key: 'main', is_admin: false, org: 'main-org' },
      ];
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-tenant-switcher')).toHaveTextContent('false');
    });

    it('should show tenant switcher for non-admin users enrolled on other tenants', () => {
      mockIsAdmin = false;
      // Default tenant list includes 'other-tenant', a non-main tenant other than
      // the current one, so the switcher should be shown even for non-admins.
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-tenant-switcher')).toHaveTextContent('true');
    });
  });

  describe('callbacks', () => {
    it('should handle logout click', () => {
      render(<UserProfileButton />);

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      expect(mockHandleLogout).toHaveBeenCalled();
    });

    it('should handle tenant change', () => {
      render(<UserProfileButton />);

      const tenantChangeBtn = screen.getByTestId('tenant-change-btn');
      fireEvent.click(tenantChangeBtn);

      expect(mockHandleTenantSwitch).toHaveBeenCalledWith('new-tenant');
    });

    it('should handle help click', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(<UserProfileButton />);

      const helpBtn = screen.getByTestId('help-btn');
      fireEvent.click(helpBtn);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://help.example.com', '_blank');

      windowOpenSpy.mockRestore();
    });

    it('should handle tenant update', () => {
      render(<UserProfileButton />);

      const tenantUpdateBtn = screen.getByTestId('tenant-update-btn');
      fireEvent.click(tenantUpdateBtn);

      expect(mockSaveCurrentTenant).toHaveBeenCalled();
      expect(mockSaveUserTenants).toHaveBeenCalled();
    });

    it('should handle load group permissions', () => {
      render(<UserProfileButton />);

      const permissionsBtn = screen.getByTestId('permissions-btn');
      fireEvent.click(permissionsBtn);

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle account deleted', () => {
      render(<UserProfileButton />);

      const accountDeletedBtn = screen.getByTestId('account-deleted-btn');
      fireEvent.click(accountDeletedBtn);

      expect(mockOnAccountDeleted).toHaveBeenCalled();
    });

    it('should preserve non-matching tenants during tenant update', () => {
      render(<UserProfileButton />);

      // Clicking tenant-update-btn updates 'test-tenant'; 'other-tenant' hits the else branch
      fireEvent.click(screen.getByTestId('tenant-update-btn'));

      const savedTenants = mockSaveUserTenants.mock.calls[0][0];
      expect(savedTenants).toHaveLength(2);
      // matched tenant is replaced with the updated value
      expect(savedTenants[0]).toEqual({ key: 'test-tenant', is_admin: true, org: 'org' });
      // non-matching tenant is preserved as-is
      expect(savedTenants[1]).toEqual({ key: 'other-tenant', is_admin: false, org: 'other-org' });
    });
  });

  describe('enableGravatarOnProfilePic', () => {
    it('passes true to dropdown when config does not return "false"', () => {
      mockEnableGravatarOnProfilePic = 'true';
      render(<UserProfileButton />);

      expect(screen.getByTestId('enable-gravatar-on-profile-pic')).toHaveTextContent('true');
    });

    it('passes false to dropdown when config returns "false"', () => {
      mockEnableGravatarOnProfilePic = 'false';
      render(<UserProfileButton />);

      expect(screen.getByTestId('enable-gravatar-on-profile-pic')).toHaveTextContent('false');
    });

    it('treats any value other than "false" as enabled', () => {
      mockEnableGravatarOnProfilePic = '1';
      render(<UserProfileButton />);

      expect(screen.getByTestId('enable-gravatar-on-profile-pic')).toHaveTextContent('true');
    });
  });

  describe('defaultSupportPhone', () => {
    it('uses the tenant metadata support phone number when available', () => {
      mockTenantMetadata = { support_phone_number: '(800) 555-0199' };
      render(<UserProfileButton />);

      expect(screen.getByTestId('default-support-phone')).toHaveTextContent('(800) 555-0199');
    });

    it('falls back to the config default when metadata is unavailable', () => {
      mockTenantMetadata = undefined;
      mockDefaultSupportPhoneNumber = '(571) 293-0242';
      render(<UserProfileButton />);

      expect(screen.getByTestId('default-support-phone')).toHaveTextContent('(571) 293-0242');
    });

    it('falls back to the config default when metadata has no support phone number', () => {
      mockTenantMetadata = {};
      mockDefaultSupportPhoneNumber = '(555) 123-4567';
      render(<UserProfileButton />);

      expect(screen.getByTestId('default-support-phone')).toHaveTextContent('(555) 123-4567');
    });

    it('prefers the metadata phone number over the config default', () => {
      mockTenantMetadata = { support_phone_number: '(111) 222-3333' };
      mockDefaultSupportPhoneNumber = '(999) 888-7777';
      render(<UserProfileButton />);

      expect(screen.getByTestId('default-support-phone')).toHaveTextContent('(111) 222-3333');
    });
  });

  describe('tenant from the route', () => {
    it('uses the tenant in the URL rather than the stored one', () => {
      // An admin viewing /platform/other-tenant/... is acting on that tenant,
      // so the dropdown must follow the route and not the stored tenant.
      mockRouteParams = { tenant: 'other-tenant' };
      render(<UserProfileButton />);

      expect(screen.getByTestId('tenant')).toHaveTextContent('other-tenant');
    });

    it('falls back to the stored tenant outside the [tenant] segment', () => {
      // Rendered somewhere with no tenant param — the stored tenant is all
      // there is to go on.
      mockRouteParams = {};
      render(<UserProfileButton />);

      expect(screen.getByTestId('tenant')).toHaveTextContent('test-tenant');
    });
  });

  describe('onboardingBasePath', () => {
    it("points the admin panel at this app's onboarding route", () => {
      // The SDK's Onboarding tab builds its copyable link as
      // `<onboardingBasePath>/onboarding/<agent-id>`, so the base has to be the
      // platform prefix of the route that renders onboarding.
      render(<UserProfileButton />);

      expect(screen.getByTestId('onboarding-base-path')).toHaveTextContent(
        `${window.location.origin}/platform/test-tenant`,
      );
    });

    it('composes into the onboarding agent route', () => {
      render(<UserProfileButton />);

      const basePath = screen.getByTestId('onboarding-base-path').textContent;

      expect(new URL(`${basePath}/onboarding/agent-2`).pathname).toBe(
        '/platform/test-tenant/onboarding/agent-2',
      );
    });

    it('follows the tenant in the route', () => {
      mockRouteParams = { tenant: 'other-tenant' };
      render(<UserProfileButton />);

      expect(screen.getByTestId('onboarding-base-path')).toHaveTextContent(
        `${window.location.origin}/platform/other-tenant`,
      );
    });
  });

  describe('enableSupportPhone', () => {
    it('passes true to dropdown when config enables the support phone', () => {
      mockEnableSupportPhone = true;
      render(<UserProfileButton />);

      expect(screen.getByTestId('enable-support-phone')).toHaveTextContent('true');
    });

    it('passes false to dropdown when config disables the support phone', () => {
      mockEnableSupportPhone = false;
      render(<UserProfileButton />);

      expect(screen.getByTestId('enable-support-phone')).toHaveTextContent('false');
    });
  });
});
