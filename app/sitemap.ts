import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { config } from '@/lib/config';
import { fetchTenantSeoFlags } from '@/lib/utils/server-metadata';
import { getTenantCourseEntries } from '@/lib/utils/seo-data';
import { getSiteUrl } from '@/lib/utils/seo';

// Dynamic, request-time sitemap. Courses are created by tenants at any time, so
// the URL set is discovered live from the public catalog on each (cached)
// generation — no build-time knowledge and no redeploy needed.
//
// Emitted as a sitemap INDEX (one child sitemap per tenant) via generateSitemaps
// so it scales as the catalog grows. Caching is applied in middleware for the
// /sitemap paths.
export const dynamic = 'force-dynamic';

/**
 * Tenants whose public courses go in the sitemap. There's no "list public
 * tenants" API, so this is an explicit allowlist (SITEMAP_TENANTS, comma/space
 * separated), falling back to the main platform key. Each is still verified
 * public (allow_self_linking) before its URLs are emitted. Stable order so the
 * numeric sitemap ids map consistently between generateSitemaps() and sitemap().
 */
function sitemapTenants(): string[] {
  const raw = process.env.SITEMAP_TENANTS?.trim();
  if (raw) return raw.split(/[\s,]+/).filter(Boolean);
  const main = config.settings.mainPlatformKey();
  return main ? [main] : [];
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  return sitemapTenants().map((_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const tenant = sitemapTenants()[id];
  if (!tenant) return [];

  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = getSiteUrl(host, protocol);
  if (!baseUrl) return [];

  // Only expose a tenant that's actually public/indexable.
  const { isPublic } = await fetchTenantSeoFlags(tenant);
  if (!isPublic) return [];

  const base = `${baseUrl}/platform/${tenant}`;
  const now = new Date();
  const entries = await getTenantCourseEntries(tenant);

  const courseUrls: MetadataRoute.Sitemap = entries.map((entry) => ({
    // Literal course key — the canonical form (the %-encoded form 301s to it).
    url: `${base}/courses/${entry.courseId}`,
    ...(entry.lastModified ? { lastModified: new Date(entry.lastModified) } : {}),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    { url: `${base}/discover`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...courseUrls,
  ];
}
