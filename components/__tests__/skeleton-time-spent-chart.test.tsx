import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonTimeSpentChart } from '../skeleton-time-spent-chart';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonTimeSpentChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonTimeSpentChart />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
