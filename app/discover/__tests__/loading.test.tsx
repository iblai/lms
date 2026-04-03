import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import DiscoverLoading from '../loading';

describe('DiscoverLoading', () => {
  it('renders without crashing', () => {
    render(<DiscoverLoading />);
  });

  it('renders skeleton elements', () => {
    render(<DiscoverLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
