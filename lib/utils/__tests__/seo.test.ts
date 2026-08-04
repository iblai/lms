import { describe, it, expect } from 'vitest';
import {
  getSiteUrl,
  absoluteUrl,
  buildRobots,
  buildOpenGraph,
  buildTwitter,
  buildEntityMetadata,
  organizationLd,
  webSiteLd,
  courseLd,
  breadcrumbLd,
  itemListLd,
} from '../seo';

describe('seo helpers', () => {
  describe('getSiteUrl', () => {
    it('builds an origin from host + protocol', () => {
      expect(getSiteUrl('skills.example.com', 'https')).toBe('https://skills.example.com');
    });
    it('defaults the protocol to https', () => {
      expect(getSiteUrl('a.com')).toBe('https://a.com');
    });
    it('returns undefined without a host', () => {
      expect(getSiteUrl(null)).toBeUndefined();
    });
  });

  describe('absoluteUrl', () => {
    it('returns absolute urls unchanged', () => {
      expect(absoluteUrl('https://x.com/a.png', 'https://y.com')).toBe('https://x.com/a.png');
    });
    it('joins relative paths onto the base', () => {
      expect(absoluteUrl('/a.png', 'https://y.com')).toBe('https://y.com/a.png');
      expect(absoluteUrl('a.png', 'https://y.com')).toBe('https://y.com/a.png');
    });
    it('returns undefined for empty paths', () => {
      expect(absoluteUrl(undefined, 'https://y.com')).toBeUndefined();
    });
  });

  describe('buildRobots', () => {
    it('indexes public tenants', () => {
      expect(buildRobots(true)).toMatchObject({ index: true, follow: true });
    });
    it('noindexes private tenants', () => {
      expect(buildRobots(false)).toMatchObject({ index: false, follow: false });
    });
  });

  describe('buildOpenGraph / buildTwitter', () => {
    const input = { title: 'T', description: 'D', images: ['https://x.com/i.png'] };
    it('builds Open Graph with sized images', () => {
      const og = buildOpenGraph({ ...input, type: 'article', url: 'https://x.com/p' }) as any;
      expect(og.type).toBe('article');
      expect(og.url).toBe('https://x.com/p');
      expect(og.images[0]).toMatchObject({ url: 'https://x.com/i.png', width: 1200, height: 630 });
    });
    it('builds a summary_large_image twitter card', () => {
      const tw = buildTwitter(input) as any;
      expect(tw.card).toBe('summary_large_image');
      expect(tw.images).toEqual(['https://x.com/i.png']);
    });
  });

  describe('buildEntityMetadata', () => {
    it('maps entity title/description/image and gates robots on isPublic', () => {
      const meta = buildEntityMetadata({
        title: 'Course A',
        description: 'About A',
        image: 'https://x.com/a.png',
        canonicalUrl: 'https://x.com/platform/t/courses/a',
        isPublic: true,
      });
      expect(meta.title).toBe('Course A');
      expect(meta.description).toBe('About A');
      expect(meta.alternates?.canonical).toBe('https://x.com/platform/t/courses/a');
      expect(meta.robots).toMatchObject({ index: true });
      expect((meta.openGraph as any).images[0].url).toBe('https://x.com/a.png');
    });
    it('noindexes when the tenant is private', () => {
      const meta = buildEntityMetadata({ title: 'X', isPublic: false });
      expect(meta.robots).toMatchObject({ index: false });
    });
  });

  describe('JSON-LD builders', () => {
    it('organizationLd / webSiteLd', () => {
      expect(organizationLd({ name: 'Acme', url: 'https://a.com' })).toMatchObject({
        '@type': 'EducationalOrganization',
        name: 'Acme',
      });
      expect(webSiteLd({ name: 'Acme', url: 'https://a.com' })).toMatchObject({
        '@type': 'WebSite',
      });
    });
    it('courseLd includes provider and optional offer', () => {
      const ld = courseLd({
        name: 'C',
        description: 'd',
        providerName: 'Acme',
        price: '10',
      }) as any;
      expect(ld['@type']).toBe('Course');
      expect(ld.provider.name).toBe('Acme');
      expect(ld.offers).toMatchObject({ price: '10', priceCurrency: 'USD' });
    });
    it('breadcrumbLd / itemListLd number positions from 1', () => {
      const bc = breadcrumbLd([
        { name: 'A', url: 'https://a.com/a' },
        { name: 'B', url: 'https://a.com/b' },
      ]) as any;
      expect(bc.itemListElement[1].position).toBe(2);
      const list = itemListLd({ name: 'L', items: [{ name: 'A', url: 'https://a.com/a' }] }) as any;
      expect(list.itemListElement[0].position).toBe(1);
    });
  });
});
