import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes since Sonner Toaster uses useTheme
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

import { Toaster } from '../sonner';

describe('Sonner Toaster', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toaster />);
    expect(container).toBeInTheDocument();
  });
});
