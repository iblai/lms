import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonRoleBox } from '../skeleton-role-box';

describe('SkeletonRoleBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonRoleBox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
