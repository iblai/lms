import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonAddSkillsLoading } from '../skeleton-add-skills-loading';

describe('SkeletonAddSkillsLoading', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonAddSkillsLoading />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
