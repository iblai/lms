import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getSiteUrl } from '@/lib/utils/seo';

// Per-host robots.txt. Each tenant / custom domain serves its own from this
// route. Fine-grained, per-tenant indexability is enforced by the `robots` meta
// tag (noindex for private tenants); this file gives crawlers coarse guidance
// and keeps the authenticated app surface out of the index everywhere.
export const dynamic = 'force-dynamic';

// Authenticated / utility paths that should never be crawled, on both the
// canonical /platform/[tenant]/… routes and the legacy top-level redirects.
const PRIVATE_PATHS = [
  '/platform/*/home',
  '/platform/*/profile',
  '/platform/*/analytics',
  '/platform/*/notifications',
  '/platform/*/course-content',
  '/platform/*/reports',
  '/platform/*/start',
  '/home',
  '/profile',
  '/analytics',
  '/notifications',
  '/recommended',
  '/start',
  '/sso-login',
  '/sso-login-complete',
  '/version',
  '/error',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = getSiteUrl(host, protocol);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    ...(baseUrl && { sitemap: `${baseUrl}/sitemap.xml`, host: baseUrl }),
  };
}
