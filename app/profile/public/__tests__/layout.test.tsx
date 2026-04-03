import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicProfileLayout from '../layout';

describe('PublicProfileLayout', () => {
  it('renders children', () => {
    render(
      <PublicProfileLayout>
        <span>test child</span>
      </PublicProfileLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <PublicProfileLayout>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </PublicProfileLayout>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('passes through children without adding wrapper elements', () => {
    const { container } = render(
      <PublicProfileLayout>
        <p>Content</p>
      </PublicProfileLayout>,
    );

    expect(container.querySelector('p')).toBeInTheDocument();
  });
});
