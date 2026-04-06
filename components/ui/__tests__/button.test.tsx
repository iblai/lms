import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders with variant and size', () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
