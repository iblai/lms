import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/spinner', () => ({
  Spinner: ({ className }: { className?: string }) => (
    <div data-testid="spinner" className={className}>
      Loading...
    </div>
  ),
}));

import Loading from '../loading';

describe('Loading', () => {
  it('renders without crashing', () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a status region with an accessible label', () => {
    render(<Loading />);
    const status = screen.getByRole('status', { name: 'Loading...' });
    expect(status).toBeInTheDocument();
  });

  it('renders the Spinner with the expected classes', () => {
    render(<Loading />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-14', 'w-14', 'text-amber-500');
  });
});
