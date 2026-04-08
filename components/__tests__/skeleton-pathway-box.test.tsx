import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonPathwayBox } from '../skeleton-pathway-box';

describe('SkeletonPathwayBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonPathwayBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
