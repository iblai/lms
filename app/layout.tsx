import type React from 'react';
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import Providers from '@/providers';
import { ClientLayout } from '@/components/client-layout';
import Script from 'next/script';
import {
  fetchAppMetadata,
  fetchTenantSeoFlags,
  extractTenantFromCookies,
  isDevelopment,
  logEnvironmentInfo,
} from '@/lib/utils/server-metadata';
import { StoreProvider } from '@/providers/store-provider';
import {
  getSiteUrl,
  absoluteUrl,
  buildRobots,
  buildOpenGraph,
  buildTwitter,
  organizationLd,
  webSiteLd,
} from '@/lib/utils/seo';
import { JsonLd } from '@/components/json-ld';

const openSans = Open_Sans({ subsets: ['latin'] });

// Force all pages to be dynamically rendered on the client
// This prevents the "window is not defined" error during build
export const dynamic = 'force-dynamic';

/**
 * Generate metadata server-side based on tenant and custom domain
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Get the request headers
    const headersList = await headers();

    // Get host for custom domain lookup
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : undefined;

    // Get tenant from cookies
    const cookieString = headersList.get('cookie');
    const tenantKey = extractTenantFromCookies(cookieString);

    // Debug logging in development
    if (isDevelopment) {
      console.log('[generateMetadata] Skills app - Extracted params:', {
        host,
        tenantKey,
        hasCookies: !!cookieString,
      });
    }

    // Fetch metadata + SEO flags based on custom domain or tenant
    const [metadata, seoFlags] = await Promise.all([
      fetchAppMetadata(host, tenantKey),
      fetchTenantSeoFlags(tenantKey),
    ]);

    // Debug logging in development
    if (isDevelopment) {
      console.log('[generateMetadata] Skills app - Fetched metadata:', {
        title: metadata.title,
        favicon: metadata.favicon,
        hasTenant: !!tenantKey,
      });
    }

    // Ensure favicon is a valid path (don't add / before absolute URLs)
    const faviconPath = metadata.favicon.startsWith('http')
      ? metadata.favicon
      : metadata.favicon.startsWith('/')
        ? metadata.favicon
        : `/${metadata.favicon}`;

    const siteName = seoFlags.platformName || metadata.title;
    // Prefer the tenant logo for social cards; fall back to the dynamic OG image.
    const ogImage =
      absoluteUrl(metadata.logo, baseUrl) || absoluteUrl('/opengraph-image', baseUrl) || '';
    const ogImages = ogImage ? [ogImage] : [];

    const metadataResult: Metadata = {
      title: metadata.title,
      description: metadata.description,
      generator: 'ibl.ai',
      applicationName: siteName,
      icons: [
        {
          rel: 'icon',
          url: faviconPath,
        },
      ],
      ...(baseUrl && { metadataBase: new URL(baseUrl) }),
      robots: buildRobots(seoFlags.isPublic),
      openGraph: buildOpenGraph({
        title: metadata.title,
        description: metadata.description,
        images: ogImages,
        siteName,
        url: baseUrl,
        type: 'website',
      }),
      twitter: buildTwitter({
        title: metadata.title,
        description: metadata.description,
        images: ogImages,
      }),
    };

    // Debug: Log the final metadata object being returned
    if (isDevelopment) {
      console.log('[generateMetadata] Skills app - Returning metadata object:', {
        title: metadataResult.title,
        description: metadataResult.description,
        icons: metadataResult.icons,
        metadataBase: baseUrl,
        openGraph: metadataResult.openGraph,
      });
    }

    return metadataResult;
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    // Fallback to default metadata
    try {
      const headersList = await headers();
      const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
      const protocol = headersList.get('x-forwarded-proto') || 'https';
      const baseUrl = host ? `${protocol}://${host}` : undefined;

      return {
        title: 'skillsAI',
        description: 'Build Your Skills with AI',
        generator: 'ibl.ai',
        icons: [
          {
            rel: 'icon',
            url: '/favicon.ico',
          },
        ],
        ...(baseUrl && { metadataBase: new URL(baseUrl) }),
      };
    } catch {
      return {
        title: 'skillsAI',
        description: 'Build Your Skills with AI',
        generator: 'ibl.ai',
        icons: [
          {
            rel: 'icon',
            url: '/favicon.ico',
          },
        ],
      };
    }
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

/** Builds site-wide Organization + WebSite structured data for the current tenant. */
async function getSiteJsonLd(): Promise<object[]> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const baseUrl = getSiteUrl(host, protocol);
    const tenantKey = extractTenantFromCookies(headersList.get('cookie'));

    const [metadata, seoFlags] = await Promise.all([
      fetchAppMetadata(host, tenantKey),
      fetchTenantSeoFlags(tenantKey),
    ]);
    const name = seoFlags.platformName || metadata.title;
    const logo = absoluteUrl(metadata.logo, baseUrl);

    const ld: object[] = [organizationLd({ name, url: baseUrl, logo })];
    if (baseUrl) ld.push(webSiteLd({ name, url: baseUrl }));
    return ld;
  } catch {
    return [];
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Log environment information in development
  if (isDevelopment) {
    logEnvironmentInfo();
  }

  const siteJsonLd = await getSiteJsonLd();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.className} flex h-screen flex-col overflow-hidden`}>
        {siteJsonLd.length > 0 && <JsonLd data={siteJsonLd} />}
        <Script src="/env.js" strategy="afterInteractive" />
        <StoreProvider>
          <Providers>
            <ClientLayout>{children}</ClientLayout>
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}
