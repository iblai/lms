import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonSkillBox } from '../skeleton-skill-box';

vi.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <svg data-testid="star-icon" className={className} />
  ),
}));

describe('SkeletonSkillBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonSkillBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
