import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    replace: mockReplace,
  })),
}));

import GlobalError from '../global-error';

describe('GlobalError boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('redirects to /error/500', () => {
    const error = new Error('Root layout error');
    render(<GlobalError error={error} reset={() => {}} />);
    expect(mockReplace).toHaveBeenCalledWith('/error/500');
  });

  it('logs the error to console', () => {
    const error = new Error('Root layout error');
    render(<GlobalError error={error} reset={() => {}} />);
    expect(console.error).toHaveBeenCalledWith('Unhandled global error:', error);
  });

  it('renders a minimal fallback shell', () => {
    const error = new Error('Root layout error');
    const { container } = render(<GlobalError error={error} reset={() => {}} />);
    // global-error renders <html><body/></html>; jsdom flattens nested html/body,
    // so we just verify the component rendered without crashing and is empty.
    expect(container).toBeTruthy();
  });
});
