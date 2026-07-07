import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useContext } from 'react';

vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock('@/components/theme-initializer', () => ({
  ThemeInitializer: () => <div data-testid="theme-initializer" />,
}));

vi.mock('@/providers/chat', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chat-provider">{children}</div>
  ),
}));

vi.mock('@/app/_components/app-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  sanitizeCss: vi.fn((css: string) => css),
}));

const mockUseTenantMetadata = vi.fn(() => ({ metadata: {} }));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
  isJSON: (value: unknown) => {
    if (typeof value !== 'string') return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
}));

import { ClientLayout, AppContext } from '@/components/client-layout';

function AppContextProbe() {
  const ctx = useContext(AppContext);
  return (
    <div
      data-testid="app-context-probe"
      data-open={String(ctx.isUserProfileOpen)}
      data-tab={ctx.userProfileTargetTab}
    />
  );
}

describe('ClientLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenantMetadata.mockReturnValue({ metadata: {} } as any);
  });

  it('renders the provider tree and page children', () => {
    render(<ClientLayout>page content</ClientLayout>);
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('theme-initializer')).toBeInTheDocument();
    expect(screen.getByTestId('chat-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('app-layout')).toHaveTextContent('page content');
  });

  it('provides the default AppContext value to consumers', () => {
    render(<ClientLayout>{<AppContextProbe />}</ClientLayout>);
    const probe = screen.getByTestId('app-context-probe');
    expect(probe).toHaveAttribute('data-open', 'false');
    expect(probe).toHaveAttribute('data-tab', 'basic');
  });

  it('injects sanitized tenant advanced CSS when metadata provides valid JSON', () => {
    mockUseTenantMetadata.mockReturnValue({
      metadata: { skills_advanced_css: JSON.stringify('body { color: red; }') },
    } as any);
    const { container } = render(<ClientLayout>content</ClientLayout>);
    const style = container.querySelector('style');
    expect(style).not.toBeNull();
    expect(style?.textContent).toBe('body { color: red; }');
  });

  it('renders no advanced-CSS style tag when metadata has none', () => {
    const { container } = render(<ClientLayout>content</ClientLayout>);
    expect(container.querySelector('style')).toBeNull();
  });

  it('exposes the AppContext defaults to consumers rendered outside the provider', () => {
    render(<AppContextProbe />);
    const probe = screen.getByTestId('app-context-probe');
    expect(probe).toHaveAttribute('data-open', 'false');
    expect(probe).toHaveAttribute('data-tab', 'basic');
  });
});
