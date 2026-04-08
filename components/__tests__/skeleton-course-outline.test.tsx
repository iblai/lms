import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonCourseOutline } from '../skeleton-course-outline';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonCourseOutline', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCourseOutline />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
