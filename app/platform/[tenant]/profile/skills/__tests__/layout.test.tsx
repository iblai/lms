import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillsLayout from '../layout';

describe('SkillsLayout', () => {
  it('renders children', () => {
    render(
      <SkillsLayout>
        <span>test child</span>
      </SkillsLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
