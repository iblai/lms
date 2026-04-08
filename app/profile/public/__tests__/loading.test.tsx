import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import PublicProfileLoading from '../loading';

describe('PublicProfileLoading', () => {
  it('renders without crashing', () => {
    render(<PublicProfileLoading />);
  });

  it('renders skeleton elements', () => {
    render(<PublicProfileLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
