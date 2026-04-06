import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonActivityStatBox } from '../skeleton-activity-stat-box';

describe('SkeletonActivityStatBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonActivityStatBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
