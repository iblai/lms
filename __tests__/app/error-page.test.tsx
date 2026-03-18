import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockHideInitialLoader = vi.fn();
vi.mock('@/lib/initial-loader', () => ({
  hideInitialLoader: mockHideInitialLoader,
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      supportEmail: () => 'support@ibl.ai',
    },
  },
}));

const mockUseParams = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

const MockClientErrorPage = vi.fn(({ errorCode, supportEmail, header, message, showHomeButton }: any) => (
  <div data-testid="client-error-page">
    <span data-testid="error-code">{errorCode}</span>
    <span data-testid="support-email">{supportEmail}</span>
    <span data-testid="header">{header}</span>
    <span data-testid="message">{message}</span>
    {showHomeButton && <button data-testid="home-button">Home</button>}
  </div>
));
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  ClientErrorPage: (props: any) => MockClientErrorPage(props),
}));

describe('ErrorPage (app/error/[code]/page.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ code: '404' });
  });

  it('renders ClientErrorPage with the error code from params', async () => {
    const { default: ErrorPage } = await import('@/app/error/[code]/page');
    render(<ErrorPage />);
    expect(screen.getByTestId('error-code').textContent).toBe('404');
  });

  it('renders ClientErrorPage with supportEmail from config', async () => {
    const { default: ErrorPage } = await import('@/app/error/[code]/page');
    render(<ErrorPage />);
    expect(screen.getByTestId('support-email').textContent).toBe('support@ibl.ai');
  });

  it('renders with correct header and message', async () => {
    const { default: ErrorPage } = await import('@/app/error/[code]/page');
    render(<ErrorPage />);
    expect(screen.getByTestId('header').textContent).toBe('Not found');
    expect(screen.getByTestId('message').textContent).toBe(
      'The page you are looking for does not exist.',
    );
  });

  it('renders home button', async () => {
    const { default: ErrorPage } = await import('@/app/error/[code]/page');
    render(<ErrorPage />);
    expect(screen.getByTestId('home-button')).toBeTruthy();
  });

  it('calls hideInitialLoader on mount', async () => {
    const { default: ErrorPage } = await import('@/app/error/[code]/page');
    render(<ErrorPage />);
    expect(mockHideInitialLoader).toHaveBeenCalledTimes(1);
  });

  it('uses a different error code from params', async () => {
    mockUseParams.mockReturnValue({ code: '500' });
    const { default: ErrorPage } = await import('@/app/error/[code]/page');
    render(<ErrorPage />);
    expect(screen.getByTestId('error-code').textContent).toBe('500');
  });
});
