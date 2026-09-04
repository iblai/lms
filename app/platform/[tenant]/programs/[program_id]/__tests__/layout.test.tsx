import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/self-linking-guard', () => ({
  SelfLinkingGuard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="self-linking-guard">{children}</div>
  ),
}));

// The layout became an async Server Component that also emits SEO metadata, so
// stub the request context + data fetchers it now depends on.
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([['host', 'skills.example.com']])),
}));

const mockSeoFlags = vi.fn(async () => ({ isPublic: false, platformName: null }));
const mockProgramSeo = vi.fn(async () => null as null | Record<string, unknown>);
vi.mock('@/lib/utils/server-metadata', () => ({
  fetchTenantSeoFlags: () => mockSeoFlags(),
}));
vi.mock('@/lib/utils/seo-data', () => ({
  getProgramSeoData: () => mockProgramSeo(),
}));
vi.mock('@/components/json-ld', () => ({
  JsonLd: ({ data }: { data: object[] }) => <div data-testid="json-ld">{JSON.stringify(data)}</div>,
}));

import ProgramLayout, { generateMetadata } from '../layout';

const params = Promise.resolve({ tenant: 'test-tenant', program_id: 'prog-1' });

describe('ProgramLayout', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSeoFlags.mockResolvedValue({ isPublic: false, platformName: null });
    mockProgramSeo.mockResolvedValue(null);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('wraps children in the SelfLinkingGuard', async () => {
    render(
      await ProgramLayout({
        children: <span>test child</span>,
        params,
      }),
    );
    expect(screen.getByTestId('self-linking-guard')).toBeInTheDocument();
    expect(screen.getByText('test child')).toBeInTheDocument();
  });

  it('emits program metadata (title/description/image) when data resolves', async () => {
    mockSeoFlags.mockResolvedValue({ isPublic: true, platformName: null });
    mockProgramSeo.mockResolvedValue({
      title: 'Data Science Program',
      description: 'Learn data science.',
      image: 'https://cdn.example.com/prog.png',
    });

    const metadata = await generateMetadata({ params });
    expect(metadata.title).toBe('Data Science Program');
    expect(metadata.description).toBe('Learn data science.');
    expect(metadata.robots).toMatchObject({ index: true });
  });

  it('stays noindex when no program data resolves', async () => {
    mockProgramSeo.mockResolvedValue(null);
    const metadata = await generateMetadata({ params });
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it('reports and falls back to noindex when SEO resolution throws', async () => {
    mockProgramSeo.mockRejectedValue(new Error('seo boom'));

    const metadata = await generateMetadata({ params });

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to build program metadata:', expect.any(Error));
  });

  it('emits course + breadcrumb JSON-LD for a public program', async () => {
    mockSeoFlags.mockResolvedValue({ isPublic: true, platformName: null });
    mockProgramSeo.mockResolvedValue({
      title: 'Data Science Program',
      description: 'Learn data science.',
      image: 'https://cdn.example.com/prog.png',
      org: 'ibl',
      language: 'en',
    });

    render(await ProgramLayout({ children: <span>test child</span>, params }));

    const payload = JSON.parse(screen.getByTestId('json-ld').textContent as string);
    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({ name: 'Data Science Program' });
    expect(payload[1]['@type']).toBe('BreadcrumbList');
  });

  it('reports and emits no JSON-LD when SEO resolution throws', async () => {
    mockProgramSeo.mockRejectedValue(new Error('seo boom'));

    render(await ProgramLayout({ children: <span>test child</span>, params }));

    expect(screen.queryByTestId('json-ld')).not.toBeInTheDocument();
    expect(screen.getByText('test child')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to build program JSON-LD:', expect.any(Error));
  });
});
