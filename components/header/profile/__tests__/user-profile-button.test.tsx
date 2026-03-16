import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileButton } from '../user-profile-button';

// Hoisted mock functions
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

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: () => 'test-tenant',
  getUserName: () => 'testuser',
  handleLogout: mockHandleLogout,
  handleTenantSwitch: mockHandleTenantSwitch,
  onAccountDeleted: mockOnAccountDeleted,
}));

// Mock local storage hooks - default to admin
let mockIsAdmin = true;
vi.mock('@/utils/localstorage', () => ({
  useCurrentTenant: () => ({
    currentTenant: { key: 'test-tenant', is_admin: true, org: 'test-org' },
    saveCurrentTenant: mockSaveCurrentTenant,
  }),
  useUserTenants: () => ({
    userTenants: [
      { key: 'test-tenant', is_admin: true, org: 'test-org' },
      { key: 'other-tenant', is_admin: false, org: 'other-org' },
    ],
    saveUserTenants: mockSaveUserTenants,
  }),
  useIsAdmin: () => mockIsAdmin,
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      appName: () => 'skills',
      platformBaseDomain: () => 'example.com',
      enableRBAC: () => false,
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
      <span data-testid="show-learner-mode-switch">{String(props.showLearnerModeSwitch)}</span>
      <span data-testid="billing-enabled">{String(props.billingEnabled)}</span>
      <span data-testid="current-spa">{props.currentSPA}</span>
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

    it('should disable billing', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('billing-enabled')).toHaveTextContent('false');
    });

    it('should not show account tab', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-account-tab')).toHaveTextContent('false');
    });

    it('should not show help link', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-help-link')).toHaveTextContent('false');
    });

    it('should not show learner mode switch', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-learner-mode-switch')).toHaveTextContent('false');
    });

    it('should set userIsStudent to false', () => {
      render(<UserProfileButton />);

      expect(screen.getByTestId('user-is-student')).toHaveTextContent('false');
    });
  });

  describe('tenant switcher visibility', () => {
    it('should show tenant switcher for admin users', () => {
      mockIsAdmin = true;
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-tenant-switcher')).toHaveTextContent('true');
    });

    it('should not show tenant switcher for non-admin users', () => {
      mockIsAdmin = false;
      render(<UserProfileButton />);

      expect(screen.getByTestId('show-tenant-switcher')).toHaveTextContent('false');
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
});
