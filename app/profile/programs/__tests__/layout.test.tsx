import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgramsLayout from '../layout';

describe('ProgramsLayout', () => {
  it('renders children', () => {
    render(
      <ProgramsLayout>
        <span>test child</span>
      </ProgramsLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
