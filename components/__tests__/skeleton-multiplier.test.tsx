import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonMultiplier } from '../skeleton-multiplier';

const MockSkeleton = () => <div data-testid="mock-skeleton" />;

describe('SkeletonMultiplier', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonMultiplier Skeleton={MockSkeleton} multiplier={3} />);
    expect(container).toBeInTheDocument();
  });

  it('renders the correct number of skeleton elements', () => {
    const { getAllByTestId } = render(
      <SkeletonMultiplier Skeleton={MockSkeleton} multiplier={5} />,
    );
    expect(getAllByTestId('mock-skeleton')).toHaveLength(5);
  });
});
