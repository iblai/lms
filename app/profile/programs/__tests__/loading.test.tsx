import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import ProgramsLoading from '../loading';

describe('ProgramsLoading', () => {
  it('renders without crashing', () => {
    render(<ProgramsLoading />);
  });

  it('renders skeleton elements', () => {
    render(<ProgramsLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
