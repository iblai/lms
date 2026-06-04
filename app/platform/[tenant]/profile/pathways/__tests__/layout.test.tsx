import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PathwaysLayout from '../layout';

describe('PathwaysLayout', () => {
  it('renders children', () => {
    render(
      <PathwaysLayout>
        <span>test child</span>
      </PathwaysLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
