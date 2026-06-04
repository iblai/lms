import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({
    replace: mockReplace,
  })),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import ErrorBoundary from '../error';

describe('Error boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('redirects to /error/500', () => {
    const error = new Error('Test error');
    render(<ErrorBoundary error={error} reset={() => {}} />);
    expect(mockReplace).toHaveBeenCalledWith('/platform/test-tenant/error/500');
  });

  it('logs the error to console', () => {
    const error = new Error('Something broke');
    render(<ErrorBoundary error={error} reset={() => {}} />);
    expect(console.error).toHaveBeenCalledWith('Unhandled client error:', error);
  });

  it('renders nothing', () => {
    const error = new Error('Test error');
    const { container } = render(<ErrorBoundary error={error} reset={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});
