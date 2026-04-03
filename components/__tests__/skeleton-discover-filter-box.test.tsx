import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonDiscoverFilterBox } from '../skeleton-discover-filter-box';

describe('SkeletonDiscoverFilterBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonDiscoverFilterBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
