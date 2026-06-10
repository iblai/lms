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
  extractTenantFromCookies,
  isDevelopment,
  logEnvironmentInfo,
} from '@/lib/utils/server-metadata';
import { StoreProvider } from '@/providers/store-provider';

const openSans = Open_Sans({ subsets: ['latin'] });

// ibl.ai default icon set, served when no tenant-specific favicon override is set.
const DEFAULT_ICONS: Metadata['icons'] = [
  { rel: 'icon', url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
  { rel: 'icon', url: '/icon.svg', type: 'image/svg+xml' },
  { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
  { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
  { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
];

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

    // Fetch metadata based on custom domain or tenant
    const metadata = await fetchAppMetadata(host, tenantKey);

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

    const metadataResult: Metadata = {
      title: metadata.title,
      description: metadata.description,
      generator: 'ibl.ai',
      // Use the full ibl.ai icon set for the default favicon; fall back to a
      // single icon when a tenant provides a custom favicon override.
      icons: faviconPath === '/favicon.ico' ? DEFAULT_ICONS : [{ rel: 'icon', url: faviconPath }],
      ...(baseUrl && { metadataBase: new URL(baseUrl) }),
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        images: [
          {
            url: metadata.logo.startsWith('http')
              ? metadata.logo
              : `${baseUrl || ''}${metadata.logo.startsWith('/') ? metadata.logo : `/${metadata.logo}`}`,
            alt: metadata.title,
          },
        ],
      },
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
        icons: DEFAULT_ICONS,
        ...(baseUrl && { metadataBase: new URL(baseUrl) }),
      };
    } catch {
      return {
        title: 'skillsAI',
        description: 'Build Your Skills with AI',
        generator: 'ibl.ai',
        icons: DEFAULT_ICONS,
      };
    }
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Log environment information in development
  if (isDevelopment) {
    logEnvironmentInfo();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.className} flex h-screen flex-col overflow-hidden`}>
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
