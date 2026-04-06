import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CourseCardSkeleton } from '../course-card-skeleton';

describe('CourseCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CourseCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
