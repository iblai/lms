import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const imageResponseCalls: Array<{ element: any; options: any }> = [];

vi.mock('next/og', () => ({
  // next/og renders with Satori, which needs a font binary; capture the element
  // instead so the tests can assert on what the card would render.
  ImageResponse: class {
    constructor(element: any, options: any) {
      imageResponseCalls.push({ element, options });
    }
  },
}));

const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}));

const mockFetchAppMetadata = vi.fn();
vi.mock('@/lib/utils/server-metadata', () => ({
  fetchAppMetadata: (...args: unknown[]) => mockFetchAppMetadata(...args),
  extractTenantFromCookies: (cookie: string | null) => (cookie ? 'acme' : null),
}));

import OpengraphImage, { alt, size, contentType, runtime } from '../opengraph-image';
import { SEO_DEFAULTS } from '@/lib/utils/seo';

/** Text content of the title/description divs the card renders. */
const renderedText = () => {
  const children = imageResponseCalls.at(-1)?.element.props.children ?? [];
  return children.map((child: any) => child.props.children);
};

const headerMap = (entries: Record<string, string>) => ({
  get: (key: string) => entries[key] ?? null,
});

describe('OpengraphImage', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    imageResponseCalls.length = 0;
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('exposes the Next.js route segment config', () => {
    expect(runtime).toBe('nodejs');
    expect(contentType).toBe('image/png');
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(alt).toContain('ibl.ai');
  });

  it('renders the tenant title and description', async () => {
    mockHeaders.mockResolvedValue(headerMap({ host: 'skills.example.com', cookie: 'tenant=acme' }));
    mockFetchAppMetadata.mockResolvedValue({
      title: 'Acme Learning',
      description: 'Upskill with Acme.',
    });

    await OpengraphImage();

    expect(mockFetchAppMetadata).toHaveBeenCalledWith('skills.example.com', 'acme');
    const [, title, description] = renderedText();
    expect(title).toBe('Acme Learning');
    expect(description).toBe('Upskill with Acme.');
    expect(imageResponseCalls.at(-1)?.options).toEqual(size);
  });

  it('keeps the SEO defaults when the tenant metadata is empty', async () => {
    mockHeaders.mockResolvedValue(headerMap({ 'x-forwarded-host': 'fallback.example.com' }));
    mockFetchAppMetadata.mockResolvedValue({ title: '', description: '' });

    await OpengraphImage();

    expect(mockFetchAppMetadata).toHaveBeenCalledWith('fallback.example.com', null);
    const [, title, description] = renderedText();
    expect(title).toBe(SEO_DEFAULTS.siteName);
    expect(description).toBe(SEO_DEFAULTS.description);
  });

  it('reports the failure and still renders a default card', async () => {
    mockHeaders.mockRejectedValue(new Error('no request context'));

    await OpengraphImage();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to resolve tenant metadata for the OG image:',
      expect.any(Error),
    );
    const [, title, description] = renderedText();
    expect(title).toBe(SEO_DEFAULTS.siteName);
    expect(description).toBe(SEO_DEFAULTS.description);
  });
});
