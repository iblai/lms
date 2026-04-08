import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Separator } from '../separator';

describe('Separator', () => {
  it('renders without crashing', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
