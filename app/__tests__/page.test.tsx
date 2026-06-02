import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  redirectToAuthSpa: vi.fn(),
}));

import RootRedirect from '../page';
import { getTenant, redirectToAuthSpa } from '@/utils/helpers';

describe('RootRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /{tenant} when a tenant is set', () => {
    vi.mocked(getTenant).mockReturnValue('test-tenant');
    render(<RootRedirect />);
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant');
    expect(redirectToAuthSpa).not.toHaveBeenCalled();
  });

  it('redirects to auth SPA when no tenant is set', () => {
    vi.mocked(getTenant).mockReturnValue('');
    render(<RootRedirect />);
    expect(redirectToAuthSpa).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
