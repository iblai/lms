import type { Metadata } from 'next';

/**
 * Shared SEO helpers for building consistent, tenant-aware metadata
 * (Open Graph, Twitter cards, robots, canonical) and JSON-LD structured data
 * across the app's server-rendered pages.
 */

export const SEO_DEFAULTS = {
  siteName: 'skillsAI',
  description: 'Build Your Skills with AI',
  /** Twitter handle for the card `site`/`creator`. */
  twitterSite: '@iblai',
  locale: 'en_US',
} as const;

/** Builds the absolute origin for the current request (used as metadataBase). */
export function getSiteUrl(host?: string | null, protocol?: string | null): string | undefined {
  if (!host) return undefined;
  const proto = protocol || 'https';
  return `${proto}://${host}`;
}

/** Resolves a possibly-relative path/asset to an absolute URL against baseUrl. */
export function absoluteUrl(path: string | undefined | null, baseUrl?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${suffix}` : suffix;
}

/**
 * Robots directives gated on whether the tenant is public. Private tenants must
 * never be indexed; public tenants get full indexing with large-image previews.
 */
export function buildRobots(isPublic: boolean): Metadata['robots'] {
  if (isPublic) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    };
  }
  return { index: false, follow: false, nocache: true };
}

interface OgTwitterInput {
  title: string;
  description: string;
  images: string[];
  siteName?: string;
  url?: string;
  /** 'website' for listing/landing pages, 'article' for course/program detail. */
  type?: 'website' | 'article';
}

/** Open Graph block shared by the root layout and per-entity pages. */
export function buildOpenGraph(input: OgTwitterInput): Metadata['openGraph'] {
  return {
    title: input.title,
    description: input.description,
    siteName: input.siteName || SEO_DEFAULTS.siteName,
    type: input.type || 'website',
    locale: SEO_DEFAULTS.locale,
    ...(input.url && { url: input.url }),
    images: input.images.map((url) => ({ url, alt: input.title, width: 1200, height: 630 })),
  };
}

/** Twitter (X) summary_large_image card. */
export function buildTwitter(input: OgTwitterInput): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    site: SEO_DEFAULTS.twitterSite,
    creator: SEO_DEFAULTS.twitterSite,
    title: input.title,
    description: input.description,
    images: input.images,
  };
}

// ---------------------------------------------------------------------------
// JSON-LD structured data builders (schema.org). Each returns a plain object
// to be serialized inside a <script type="application/ld+json"> tag.
// ---------------------------------------------------------------------------

export function organizationLd(params: { name: string; url?: string; logo?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: params.name,
    ...(params.url && { url: params.url }),
    ...(params.logo && { logo: params.logo }),
  };
}

export function webSiteLd(params: { name: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: params.name,
    url: params.url,
  };
}

export function courseLd(params: {
  name: string;
  description?: string;
  url?: string;
  image?: string;
  providerName: string;
  providerUrl?: string;
  inLanguage?: string;
  price?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: params.name,
    ...(params.description && { description: params.description }),
    ...(params.url && { url: params.url }),
    ...(params.image && { image: params.image }),
    ...(params.inLanguage && { inLanguage: params.inLanguage }),
    provider: {
      '@type': 'EducationalOrganization',
      name: params.providerName,
      ...(params.providerUrl && { url: params.providerUrl }),
    },
    ...(params.price && {
      offers: { '@type': 'Offer', price: params.price, priceCurrency: 'USD' },
    }),
  };
}

export function breadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListLd(params: { name: string; items: Array<{ name: string; url: string }> }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: params.name,
    itemListElement: params.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
