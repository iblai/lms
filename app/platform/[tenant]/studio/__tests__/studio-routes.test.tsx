import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/self-linking-guard', () => ({
  SelfLinkingGuard: ({ children }: any) => <div data-testid="self-linking-guard">{children}</div>,
}));
vi.mock('@/components/studio/studio-access-guard', () => ({
  StudioAccessGuard: ({ children }: any) => <div data-testid="studio-access-guard">{children}</div>,
}));
vi.mock('@/components/studio/studio-home', () => ({
  StudioHome: () => <div data-testid="studio-home" />,
}));

import StudioLayout from '../layout';
import StudioPage from '../page';

describe('Studio routes', () => {
  it('guards everything under Studio', () => {
    render(
      <StudioLayout>
        <div data-testid="child" />
      </StudioLayout>,
    );
    expect(screen.getByTestId('self-linking-guard')).toContainElement(
      screen.getByTestId('studio-access-guard'),
    );
    expect(screen.getByTestId('studio-access-guard')).toContainElement(screen.getByTestId('child'));
  });

  it('renders the Studio home', () => {
    render(<StudioPage />);
    expect(screen.getByTestId('studio-home')).toBeInTheDocument();
  });
});
