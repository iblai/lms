import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import PathwaysLoading from '../loading';

describe('PathwaysLoading', () => {
  it('renders without crashing', () => {
    render(<PathwaysLoading />);
  });

  it('renders skeleton elements', () => {
    render(<PathwaysLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
