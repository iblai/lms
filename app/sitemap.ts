import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { config } from '@/lib/config';
import { extractTenantFromCookies, fetchTenantSeoFlags } from '@/lib/utils/server-metadata';
import { getSiteUrl } from '@/lib/utils/seo';

// Per-host sitemap. Only emits URLs when the resolved tenant is public;
// otherwise returns an empty sitemap so private tenants expose nothing to
// crawlers. Per-entity (course/program) URLs are added by the public catalog
// pages in Phase 2.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = getSiteUrl(host, protocol);
  if (!baseUrl) return [];

  const tenantKey =
    extractTenantFromCookies(headersList.get('cookie')) || config.settings.mainPlatformKey();
  const { isPublic } = await fetchTenantSeoFlags(tenantKey);
  if (!isPublic || !tenantKey) return [];

  const now = new Date();
  const base = `${baseUrl}/platform/${tenantKey}`;
  return [
    { url: `${base}/discover`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/recommended`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ];
}
