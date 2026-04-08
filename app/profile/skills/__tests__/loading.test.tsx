import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import SkillsLoading from '../loading';

describe('SkillsLoading', () => {
  it('renders without crashing', () => {
    render(<SkillsLoading />);
  });

  it('renders skeleton elements', () => {
    render(<SkillsLoading />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
