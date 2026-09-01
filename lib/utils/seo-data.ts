import { cache } from 'react';
import { config } from '@/lib/config';

/**
 * Server-side data fetchers for per-entity SEO metadata. These hit the public
 * (no-auth) endpoints and are wrapped in React `cache()` so a page's
 * generateMetadata and its layout's JSON-LD share a single request-scoped fetch.
 */

export interface EntitySeoData {
  title: string;
  description: string;
  image?: string;
  language?: string;
  price?: string;
  org?: string;
}

/** Strips HTML tags and collapses whitespace so descriptions are meta-safe. */
function toPlainText(value: unknown, maxLength = 300): string {
  if (typeof value !== 'string' || !value) return '';
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/** Resolves an LMS asset path (often root-relative) to an absolute URL. */
function resolveLmsImage(path: unknown): string | undefined {
  if (typeof path !== 'string' || !path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${config.urls.lms()}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Resolves an image path against the LMS origin (program images are LMS-relative). */
function resolveImage(path: unknown): string | undefined {
  return resolveLmsImage(path);
}

/**
 * Fetches public program metadata for SEO from the catalog program-settings
 * endpoint. `org` defaults to the tenant when the program's own org is unknown.
 *
 * NOTE: the exact field names / anonymous accessibility of this endpoint should
 * be verified against a real public program — it degrades to null (noindex) on
 * any failure, so a private/auth-only response is safe.
 */
export const getProgramSeoData = cache(
  async (programId: string, org: string): Promise<EntitySeoData | null> => {
    try {
      const url = `${config.urls.studio()}/api/ibl/catalog/metadata/program/settings/?program_id=${encodeURIComponent(
        programId,
      )}&org=${encodeURIComponent(org)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      // Tolerate flat, { metadata }, or { formData } response shapes.
      const meta = data?.metadata ?? data?.formData ?? data ?? {};
      const title: string = meta.name || meta.title || meta.program_name || data?.name || '';
      if (!title) return null;
      return {
        title,
        description: toPlainText(meta.description || meta.short_description || meta.overview),
        image: resolveImage(meta.card_image || meta.banner_image || meta.image),
        language: typeof meta.language === 'string' ? meta.language : undefined,
        org,
      };
    } catch {
      return null;
    }
  },
);

/**
 * Fetches public course metadata for SEO. The course_metadata endpoint accepts
 * anonymous requests, so no auth token is attached.
 */
export const getCourseSeoData = cache(async (courseKey: string): Promise<EntitySeoData | null> => {
  try {
    const url = `${config.urls.lms()}/api/ibl/v1/course_metadata?course_key=${encodeURIComponent(
      courseKey,
    )}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    // Fields may arrive at the top level or nested under edx_data.
    const edx = data?.edx_data ?? data;
    const title: string = edx?.title || edx?.display_name || data?.name || '';
    if (!title) return null;
    return {
      title,
      description: toPlainText(edx?.short_description || edx?.description || edx?.overview),
      image: resolveLmsImage(edx?.course_image_asset_path || edx?.banner_image_asset_path),
      language: typeof edx?.language === 'string' ? edx.language : undefined,
      price: typeof edx?.course_price === 'string' ? edx.course_price : undefined,
      org: typeof edx?.org === 'string' ? edx.org : undefined,
    };
  } catch {
    return null;
  }
});
