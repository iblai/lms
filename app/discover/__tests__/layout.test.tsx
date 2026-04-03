import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiscoverLayout from '../layout';

describe('DiscoverLayout', () => {
  it('renders children', () => {
    render(
      <DiscoverLayout>
        <span>test child</span>
      </DiscoverLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
