import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonEducationBox } from '../profile/skeleton-education-box';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonEducationBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonEducationBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
