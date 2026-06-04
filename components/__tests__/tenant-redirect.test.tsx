import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockReplace = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  redirectToAuthSpa: vi.fn(),
}));

import { TenantRedirect } from '../tenant-redirect';
import { getTenant, redirectToAuthSpa } from '@/utils/helpers';

function setLocation(search = '', hash = '') {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search, hash },
    writable: true,
    configurable: true,
  });
}

describe('TenantRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    setLocation('', '');
  });

  it('forwards the root path to the tenant-scoped root', () => {
    vi.mocked(getTenant).mockReturnValue('test-tenant');
    render(<TenantRedirect />);
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant');
    expect(redirectToAuthSpa).not.toHaveBeenCalled();
  });

  it('preserves the legacy sub-path under the tenant prefix', () => {
    mockPathname = '/analytics/courses/abc';
    render(<TenantRedirect />);
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/analytics/courses/abc');
  });

  it('preserves the query string and hash', () => {
    mockPathname = '/programs/p1';
    setLocation('?trigger_cta=1', '#section');
    render(<TenantRedirect />);
    expect(mockReplace).toHaveBeenCalledWith(
      '/platform/test-tenant/programs/p1?trigger_cta=1#section',
    );
  });

  it('redirects to the auth SPA when no tenant is known', () => {
    vi.mocked(getTenant).mockReturnValue('');
    render(<TenantRedirect />);
    expect(redirectToAuthSpa).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
