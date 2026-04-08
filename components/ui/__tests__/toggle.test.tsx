import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Toggle } from '../toggle';

describe('Toggle', () => {
  it('renders without crashing', () => {
    render(<Toggle aria-label="Toggle bold">B</Toggle>);
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
