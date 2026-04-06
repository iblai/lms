import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonStartPageSkillsBox } from '../skeleton-start-page-skills-box';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('SkeletonStartPageSkillsBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonStartPageSkillsBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
