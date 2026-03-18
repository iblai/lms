import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      supportEmail: () => 'support@ibl.ai',
    },
  },
}));

const MockErrorPage = vi.fn(({ errorCode, customTitle, customDescription, supportEmail }: any) => (
  <div data-testid="error-page">
    <span data-testid="error-code">{errorCode}</span>
    <span data-testid="custom-title">{customTitle}</span>
    <span data-testid="custom-description">{customDescription}</span>
    <span data-testid="support-email">{supportEmail}</span>
  </div>
));
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  ErrorPage: (props: any) => MockErrorPage(props),
}));

describe('NotFound (app/not-found.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with error code 404', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    expect(screen.getByTestId('error-code').textContent).toBe('404');
  });

  it('renders with correct title', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    expect(screen.getByTestId('custom-title').textContent).toBe('Page Not Found');
  });

  it('renders with correct description', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    expect(screen.getByTestId('custom-description').textContent).toBe(
      'The page you are looking for does not exist.',
    );
  });

  it('passes supportEmail from config', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    expect(screen.getByTestId('support-email').textContent).toBe('support@ibl.ai');
  });
});
