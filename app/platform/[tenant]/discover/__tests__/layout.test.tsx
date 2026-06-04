import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/self-linking-guard', () => ({
  SelfLinkingGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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
