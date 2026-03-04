import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import Providers from '../index';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock all external dependencies
vi.mock('@iblai/iblai-js/data-layer', () => ({
  initializeDataLayer: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      dm: () => 'https://dm.example.com',
      lms: () => 'https://lms.example.com',
    },
  },
}));

vi.mock('@/utils/localstorage', () => ({
  handleTenantSwitch: vi.fn(),
  LocalStorageService: {
    getInstance: () => ({
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }),
  },
  useCurrentTenant: () => ({
    saveCurrentTenant: vi.fn(),
  }),
  useUserTenants: () => ({
    saveUserTenants: vi.fn(),
  }),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  TenantProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tenant-provider">{children}</div>
  ),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: () => 'test-tenant',
  getUserName: () => 'test-user',
  hasNonExpiredAuthToken: vi.fn(() => true),
  redirectToAuthSpa: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('@/features/rbac', () => ({
  updateRbacPermissions: vi.fn(() => ({ type: 'rbac/updatePermissions' })),
}));

// Create a minimal test store
const createTestStore = () =>
  configureStore({
    reducer: {
      test: (state = {}) => state,
    },
  });

describe('Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.__ENV__ to avoid dynamic script loading
    Object.defineProperty(window, '__ENV__', {
      value: { DM_URL: 'https://dm.example.com' },
      writable: true,
      configurable: true,
    });
  });

  it('renders children when ready', async () => {
    const store = createTestStore();

    const { getByText } = render(
      <Provider store={store}>
        <Providers>
          <div>Test Child</div>
        </Providers>
      </Provider>,
    );

    // Wait for the component to become ready
    await waitFor(() => {
      expect(getByText('Test Child')).toBeInTheDocument();
    });
  });

  it('wraps children with AuthProvider and TenantProvider', async () => {
    const store = createTestStore();

    const { getByTestId } = render(
      <Provider store={store}>
        <Providers>
          <div>Test Child</div>
        </Providers>
      </Provider>,
    );

    await waitFor(() => {
      expect(getByTestId('auth-provider')).toBeInTheDocument();
      expect(getByTestId('tenant-provider')).toBeInTheDocument();
    });
  });

  it('initializes data layer when window.__ENV__ is defined', async () => {
    const store = createTestStore();
    const { initializeDataLayer } = await import('@iblai/iblai-js/data-layer');

    render(
      <Provider store={store}>
        <Providers>
          <div>Test Child</div>
        </Providers>
      </Provider>,
    );

    await waitFor(() => {
      expect(initializeDataLayer).toHaveBeenCalled();
    });
  });
});
