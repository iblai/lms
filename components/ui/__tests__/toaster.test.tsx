import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useToast hook that toaster.tsx imports from @/hooks/use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toasts: [] }),
}));

import { Toaster } from '../toaster';

describe('Toaster', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toaster />);
    expect(container).toBeInTheDocument();
  });
});
