import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      studio: () => 'https://studio.example.com',
      lms: () => 'https://lms.example.com',
    },
  },
}));

// React's `cache()` memoizes per request; outside a request scope it is a
// pass-through, but stub it so each test gets a fresh call.
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, cache: (fn: unknown) => fn };
});

import { getProgramSeoData, getCourseSeoData } from '../seo-data';

const okJson = (body: unknown) =>
  vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });

describe('seo-data', () => {
  const originalFetch = global.fetch;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleSpy.mockRestore();
  });

  describe('getProgramSeoData', () => {
    it('maps a flat program payload', async () => {
      const fetchSpy = okJson({
        name: 'Data Program',
        description: 'A <b>great</b> program',
        card_image: '/media/prog.png',
        language: 'en',
      });
      global.fetch = fetchSpy as unknown as typeof fetch;

      await expect(getProgramSeoData('prog-1', 'acme')).resolves.toEqual({
        title: 'Data Program',
        description: 'A great program',
        image: 'https://lms.example.com/media/prog.png',
        language: 'en',
        org: 'acme',
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://studio.example.com/api/ibl/catalog/metadata/program/settings/?program_id=prog-1&org=acme',
        { cache: 'no-store' },
      );
    });

    it('reads a nested { metadata } payload and an absolute image', async () => {
      global.fetch = okJson({
        metadata: {
          title: 'Nested Program',
          short_description: 'Short',
          banner_image: 'https://cdn.example.com/b.png',
          language: 42,
        },
      }) as unknown as typeof fetch;

      await expect(getProgramSeoData('prog-2', 'acme')).resolves.toMatchObject({
        title: 'Nested Program',
        description: 'Short',
        image: 'https://cdn.example.com/b.png',
        language: undefined,
      });
    });

    it('reads a nested { formData } payload', async () => {
      global.fetch = okJson({
        formData: { program_name: 'Form Program', overview: 'Overview' },
      }) as unknown as typeof fetch;

      await expect(getProgramSeoData('prog-3', 'acme')).resolves.toMatchObject({
        title: 'Form Program',
        description: 'Overview',
        image: undefined,
      });
    });

    it('truncates an over-long description', async () => {
      global.fetch = okJson({
        name: 'Long',
        description: 'x'.repeat(400),
      }) as unknown as typeof fetch;

      const result = await getProgramSeoData('prog-4', 'acme');
      expect(result?.description).toHaveLength(300);
      expect(result?.description.endsWith('…')).toBe(true);
    });

    it('returns null when the payload has no title', async () => {
      global.fetch = okJson({ description: 'no title here' }) as unknown as typeof fetch;
      await expect(getProgramSeoData('prog-5', 'acme')).resolves.toBeNull();
    });

    it('returns null on a non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
      await expect(getProgramSeoData('prog-6', 'acme')).resolves.toBeNull();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('reports and returns null when the request throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

      await expect(getProgramSeoData('prog-7', 'acme')).resolves.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch entity SEO data:',
        expect.any(Error),
      );
    });
  });

  describe('getCourseSeoData', () => {
    it('maps an edx_data payload', async () => {
      const fetchSpy = okJson({
        edx_data: {
          title: 'Intro to X',
          short_description: 'Learn X',
          course_image_asset_path: '/asset/x.png',
          language: 'en',
          course_price: '49.00',
          org: 'acme',
        },
      });
      global.fetch = fetchSpy as unknown as typeof fetch;

      await expect(getCourseSeoData('course-v1:acme+X+2024')).resolves.toEqual({
        title: 'Intro to X',
        description: 'Learn X',
        image: 'https://lms.example.com/asset/x.png',
        language: 'en',
        price: '49.00',
        org: 'acme',
      });
      expect(fetchSpy.mock.calls[0][0]).toContain('course_key=course-v1%3Aacme%2BX%2B2024');
    });

    it('falls back to top-level fields and display_name', async () => {
      global.fetch = okJson({
        display_name: 'Flat Course',
        description: 'Flat description',
        banner_image_asset_path: 'banner.png',
      }) as unknown as typeof fetch;

      await expect(getCourseSeoData('course-1')).resolves.toMatchObject({
        title: 'Flat Course',
        description: 'Flat description',
        image: 'https://lms.example.com/banner.png',
        price: undefined,
        org: undefined,
      });
    });

    it('returns null when the payload has no title', async () => {
      global.fetch = okJson({ description: 'orphan' }) as unknown as typeof fetch;
      await expect(getCourseSeoData('course-2')).resolves.toBeNull();
    });

    it('returns null on a non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
      await expect(getCourseSeoData('course-3')).resolves.toBeNull();
    });

    it('reports and returns null when the request throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

      await expect(getCourseSeoData('course-4')).resolves.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch course SEO data:',
        expect.any(Error),
      );
    });
  });
});
