import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import ProgramLayout, { generateMetadata } from '../layout';

const params = Promise.resolve({ tenant: 'test-tenant', program_id: 'prog-1' });

describe('ProgramLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSeoFlags.mockResolvedValue({ isPublic: false, platformName: null });
    mockProgramSeo.mockResolvedValue(null);
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
});
