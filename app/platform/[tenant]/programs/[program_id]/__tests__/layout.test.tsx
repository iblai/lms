import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/self-linking-guard', () => ({
  SelfLinkingGuard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="self-linking-guard">{children}</div>
  ),
}));

import ProgramLayout from '../layout';

describe('ProgramLayout', () => {
  it('wraps children in the SelfLinkingGuard', () => {
    render(
      <ProgramLayout>
        <span>test child</span>
      </ProgramLayout>,
    );
    expect(screen.getByTestId('self-linking-guard')).toBeInTheDocument();
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
