import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// next/font is a build-time transform; stub it so the module can be imported.
vi.mock('next/font/google', () => ({
  Open_Sans: () => ({ className: 'open-sans' }),
}));
vi.mock('../globals.css', () => ({}));

const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({ headers: () => mockHeaders() }));

const mockFetchAppMetadata = vi.fn();
const mockFetchTenantSeoFlags = vi.fn();
vi.mock('@/lib/utils/server-metadata', () => ({
  fetchAppMetadata: (...args: unknown[]) => mockFetchAppMetadata(...args),
  fetchTenantSeoFlags: (...args: unknown[]) => mockFetchTenantSeoFlags(...args),
  extractTenantFromCookies: (cookie: string | null) => (cookie ? 'acme' : null),
  isDevelopment: false,
  logEnvironmentInfo: vi.fn(),
}));

vi.mock('@/providers', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/providers/store-provider', () => ({
  StoreProvider: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/client-layout', () => ({
  ClientLayout: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/json-ld', () => ({ JsonLd: () => null }));
vi.mock('next/script', () => ({ default: () => null }));

import { generateMetadata } from '../layout';

const headerMap = (entries: Record<string, string>) => ({
  get: (key: string) => entries[key] ?? null,
});

const DEFAULT_TITLE = 'ibl.ai | Agentic LMS';

describe('RootLayout generateMetadata', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(headerMap({ host: 'skills.example.com', cookie: 'tenant=acme' }));
    mockFetchAppMetadata.mockResolvedValue({
      title: 'Acme Learning',
      description: 'Upskill with Acme.',
      favicon: 'acme.ico',
      logo: '/logo.png',
    });
    mockFetchTenantSeoFlags.mockResolvedValue({ isPublic: true, platformName: 'Acme' });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('builds tenant metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Acme Learning');
    expect(metadata.description).toBe('Upskill with Acme.');
    expect(metadata.applicationName).toBe('Acme');
    expect(metadata.icons).toEqual([{ rel: 'icon', url: '/acme.ico' }]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('reports the failure and falls back to default metadata', async () => {
    mockFetchAppMetadata.mockRejectedValue(new Error('metadata service down'));

    const metadata = await generateMetadata();

    expect(errorSpy).toHaveBeenCalledWith('Failed to generate metadata:', expect.any(Error));
    expect(metadata.title).toBe(DEFAULT_TITLE);
    expect(metadata.metadataBase).toEqual(new URL('https://skills.example.com'));
  });

  // The fallback re-reads headers(); if that fails too the metadata still has
  // to resolve, and the second failure is a distinct signal worth reporting.
  it('reports the fallback failure and still returns metadata', async () => {
    mockFetchAppMetadata.mockRejectedValue(new Error('metadata service down'));
    mockHeaders
      .mockResolvedValueOnce(headerMap({ host: 'skills.example.com' }))
      .mockRejectedValue(new Error('no request context'));

    const metadata = await generateMetadata();

    expect(errorSpy).toHaveBeenCalledWith('Failed to generate metadata:', expect.any(Error));
    expect(errorSpy).toHaveBeenCalledWith('Failed to build fallback metadata:', expect.any(Error));
    expect(metadata.title).toBe(DEFAULT_TITLE);
    expect(metadata.metadataBase).toBeUndefined();
  });
});
