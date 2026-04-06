import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import CourseDetailsLoading from '../loading';

describe('CourseDetailsLoading', () => {
  it('renders without crashing', () => {
    render(<CourseDetailsLoading />);
  });

  it('renders skeleton elements', () => {
    render(<CourseDetailsLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
