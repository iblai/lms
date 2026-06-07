import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/course-card-skeleton', () => ({
  CourseCardSkeleton: () => <div data-testid="course-card-skeleton" />,
}));

import RecommendedLoading from '../loading';

describe('RecommendedLoading', () => {
  it('renders without crashing', () => {
    render(<RecommendedLoading />);
  });

  it('renders course card skeleton elements', () => {
    render(<RecommendedLoading />);
    const skeletons = screen.getAllByTestId('course-card-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
