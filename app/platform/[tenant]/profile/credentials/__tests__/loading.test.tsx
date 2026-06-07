import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import CredentialsLoading from '../loading';

describe('CredentialsLoading', () => {
  it('renders without crashing', () => {
    render(<CredentialsLoading />);
  });

  it('renders skeleton elements', () => {
    render(<CredentialsLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
