import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonCourseSyllabus } from '../skeleton-course-syllabus';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonCourseSyllabus', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCourseSyllabus />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
