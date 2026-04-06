import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonCourseAccessBtn } from '../skeleton-course-access-btn';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonCourseAccessBtn', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCourseAccessBtn />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
