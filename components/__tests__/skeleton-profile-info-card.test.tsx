import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonProfileInfoCard } from '../skeleton-profile-info-card';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonProfileInfoCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonProfileInfoCard />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
