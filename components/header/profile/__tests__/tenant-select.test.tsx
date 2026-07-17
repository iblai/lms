import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TenantSelect } from '../tenant-select';

// Hoisted mock functions
const { mockHandleTenantSwitch } = vi.hoisted(() => ({
  mockHandleTenantSwitch: vi.fn(),
}));

// Mutable state for per-test config control
let mockTenantKey = 'test-tenant';
let mockTenants: { key: string; org: string }[] = [
  { key: 'test-tenant', org: 'test-org' },
  { key: 'other-tenant', org: 'other-org' },
];
let mockEnableRBAC = false;

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getTenant: () => mockTenantKey,
  getTenants: () => mockTenants,
  handleTenantSwitch: mockHandleTenantSwitch,
}));

// Mock web-utils (Tenant is a type-only export at runtime)
vi.mock('@iblai/iblai-js/web-utils', () => ({
  Tenant: {},
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      enableRBAC: () => mockEnableRBAC,
    },
  },
}));

// Mock Redux hooks
vi.mock('@/lib/hooks', () => ({
  useAppSelector: (selector: any) => selector({ rbac: {} }),
}));

// Mock RBAC slice
vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: () => ({ canSwitch: true }),
}));

// Mock TenantSwitcher
vi.mock('@iblai/iblai-js/web-containers', () => ({
  TenantSwitcher: (props: any) => (
    <div data-testid="tenant-switcher">
      <span data-testid="current-tenant-key">{props.currentTenantKey}</span>
      <span data-testid="tenant-count">{String(props.tenants?.length)}</span>
      <span data-testid="enable-rbac">{String(props.enableRbac)}</span>
      <span data-testid="rbac-permissions">{JSON.stringify(props.rbacPermissions)}</span>
      <button data-testid="change-btn" onClick={() => props.onTenantChange?.('new-tenant')}>
        Change
      </button>
    </div>
  ),
}));

describe('TenantSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantKey = 'test-tenant';
    mockTenants = [
      { key: 'test-tenant', org: 'test-org' },
      { key: 'other-tenant', org: 'other-org' },
    ];
    mockEnableRBAC = false;
  });

  describe('rendering', () => {
    it('renders the TenantSwitcher when a tenant key and tenants exist', () => {
      render(<TenantSelect />);

      expect(screen.getByTestId('tenant-switcher')).toBeInTheDocument();
    });

    it('passes the current tenant key to the switcher', () => {
      render(<TenantSelect />);

      expect(screen.getByTestId('current-tenant-key')).toHaveTextContent('test-tenant');
    });

    it('passes the tenants list to the switcher', () => {
      render(<TenantSelect />);

      expect(screen.getByTestId('tenant-count')).toHaveTextContent('2');
    });

    it('passes the RBAC permissions to the switcher', () => {
      render(<TenantSelect />);

      expect(screen.getByTestId('rbac-permissions')).toHaveTextContent(
        JSON.stringify({ canSwitch: true }),
      );
    });

    it('passes the enableRbac config flag to the switcher', () => {
      mockEnableRBAC = true;
      render(<TenantSelect />);

      expect(screen.getByTestId('enable-rbac')).toHaveTextContent('true');
    });
  });

  describe('empty states', () => {
    it('renders nothing when there are no tenants', () => {
      mockTenants = [];
      const { container } = render(<TenantSelect />);

      expect(screen.queryByTestId('tenant-switcher')).not.toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the tenant key is empty', () => {
      mockTenantKey = '';
      const { container } = render(<TenantSelect />);

      expect(screen.queryByTestId('tenant-switcher')).not.toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('callbacks', () => {
    it('wires onTenantChange to handleTenantSwitch', () => {
      render(<TenantSelect />);

      fireEvent.click(screen.getByTestId('change-btn'));

      expect(mockHandleTenantSwitch).toHaveBeenCalledWith('new-tenant');
    });
  });
});
