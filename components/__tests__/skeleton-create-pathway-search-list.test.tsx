import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonCreatePathwaySearchList } from '../skeleton-create-pathway-search-list';

describe('SkeletonCreatePathwaySearchList', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCreatePathwaySearchList />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
