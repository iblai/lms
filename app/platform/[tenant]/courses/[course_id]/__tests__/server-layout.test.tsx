import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// The default export here is the async Server Component that emits SEO
// metadata + JSON-LD; `layout.test.tsx` covers the client half separately.
vi.mock('../_components/course-layout-client', () => ({
  CourseLayoutClient: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="course-layout-client">{children}</div>
  ),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Map([['host', 'skills.example.com']])),
}));

const mockSeoFlags = vi.fn(async () => ({ isPublic: false, platformName: null }));
const mockCourseSeo = vi.fn(async () => null as null | Record<string, unknown>);
vi.mock('@/lib/utils/server-metadata', () => ({
  fetchTenantSeoFlags: () => mockSeoFlags(),
}));
vi.mock('@/lib/utils/seo-data', () => ({
  getCourseSeoData: () => mockCourseSeo(),
}));
vi.mock('@/components/json-ld', () => ({
  JsonLd: ({ data }: { data: object[] }) => <div data-testid="json-ld">{JSON.stringify(data)}</div>,
}));

import CourseLayout, { generateMetadata } from '../layout';

const params = Promise.resolve({ tenant: 'test-tenant', course_id: 'course-v1%3Aacme%2BX%2B2024' });

describe('CourseLayout (server)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSeoFlags.mockResolvedValue({ isPublic: false, platformName: null });
    mockCourseSeo.mockResolvedValue(null);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('emits course metadata when the course resolves', async () => {
    mockSeoFlags.mockResolvedValue({ isPublic: true, platformName: null });
    mockCourseSeo.mockResolvedValue({
      title: 'Intro to X',
      description: 'Learn X.',
      image: 'https://cdn.example.com/x.png',
      org: 'acme',
    });

    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe('Intro to X');
    expect(metadata.description).toBe('Learn X.');
    expect(metadata.robots).toMatchObject({ index: true });
  });

  it('stays noindex when no course data resolves', async () => {
    const metadata = await generateMetadata({ params });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('reports and falls back to noindex when SEO resolution throws', async () => {
    mockCourseSeo.mockRejectedValue(new Error('seo boom'));

    const metadata = await generateMetadata({ params });

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to build course metadata:', expect.any(Error));
  });

  it('wraps children in the client layout', async () => {
    render(await CourseLayout({ children: <span>test child</span>, params }));

    expect(screen.getByTestId('course-layout-client')).toBeInTheDocument();
    expect(screen.getByText('test child')).toBeInTheDocument();
    expect(screen.queryByTestId('json-ld')).not.toBeInTheDocument();
  });

  it('emits course + breadcrumb JSON-LD for a public course', async () => {
    mockSeoFlags.mockResolvedValue({ isPublic: true, platformName: null });
    mockCourseSeo.mockResolvedValue({
      title: 'Intro to X',
      description: 'Learn X.',
      image: 'https://cdn.example.com/x.png',
      org: 'acme',
      language: 'en',
      price: '49.00',
    });

    render(await CourseLayout({ children: <span>test child</span>, params }));

    const payload = JSON.parse(screen.getByTestId('json-ld').textContent as string);
    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({ name: 'Intro to X' });
    expect(payload[1]['@type']).toBe('BreadcrumbList');
  });

  it('reports and emits no JSON-LD when SEO resolution throws', async () => {
    mockCourseSeo.mockRejectedValue(new Error('seo boom'));

    render(await CourseLayout({ children: <span>test child</span>, params }));

    expect(screen.queryByTestId('json-ld')).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to build course JSON-LD:', expect.any(Error));
  });
});
