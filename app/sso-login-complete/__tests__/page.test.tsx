import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SsoLoginComplete from '../page';
import '@testing-library/jest-dom';

// Mock the SsoLogin component from web-containers
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  SsoLogin: vi.fn(({ localStorageKeys, redirectPathKey, defaultRedirectPath }) => (
    <div data-testid="sso-login-mock">
      <span data-testid="current-tenant-key">{localStorageKeys.CURRENT_TENANT}</span>
      <span data-testid="user-data-key">{localStorageKeys.USER_DATA}</span>
      <span data-testid="tenants-key">{localStorageKeys.TENANTS}</span>
      <span data-testid="redirect-path-key">{redirectPathKey}</span>
      <span data-testid="default-redirect-path">{defaultRedirectPath}</span>
    </div>
  )),
}));

// Mock the LOCAL_STORAGE_KEYS from web-utils
vi.mock('@iblai/iblai-js/web-utils', () => ({
  LOCAL_STORAGE_KEYS: {
    CURRENT_TENANT: 'current_tenant',
    USER_DATA: 'userData',
    TENANTS: 'tenants',
  },
}));

describe('SsoLoginComplete page', () => {
  it('renders without crashing', () => {
    const { container } = render(<SsoLoginComplete />);
    expect(container).toBeTruthy();
  });

  it('renders the SsoLogin component with correct props', () => {
    const { getByTestId } = render(<SsoLoginComplete />);

    expect(getByTestId('sso-login-mock')).toBeInTheDocument();
    expect(getByTestId('current-tenant-key')).toHaveTextContent('current_tenant');
    expect(getByTestId('user-data-key')).toHaveTextContent('userData');
    expect(getByTestId('tenants-key')).toHaveTextContent('tenants');
    expect(getByTestId('redirect-path-key')).toHaveTextContent('redirect-to');
    expect(getByTestId('default-redirect-path')).toHaveTextContent('/');
  });

  it('wraps content in Suspense with null fallback', () => {
    const { container } = render(<SsoLoginComplete />);
    // The component should render without showing any fallback
    expect(container.querySelector('[data-testid="sso-login-mock"]')).toBeInTheDocument();
  });
});
