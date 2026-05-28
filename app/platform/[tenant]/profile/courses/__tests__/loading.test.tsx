import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import CoursesLoading from '../loading';

describe('CoursesLoading', () => {
  it('renders without crashing', () => {
    render(<CoursesLoading />);
  });

  it('renders skeleton elements', () => {
    render(<CoursesLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
