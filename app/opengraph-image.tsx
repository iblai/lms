import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { fetchAppMetadata, extractTenantFromCookies } from '@/lib/utils/server-metadata';
import { SEO_DEFAULTS } from '@/lib/utils/seo';

// Default 1200x630 social card generated at request time. Falls back to the
// tenant's title/description so shared links get a branded, on-brand preview
// even without a bespoke OG image asset. Per-entity pages can override this.
export const runtime = 'nodejs';
export const alt = 'skillsAI — Build Your Skills with AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  let title: string = SEO_DEFAULTS.siteName;
  let description: string = SEO_DEFAULTS.description;
  try {
    const headersList = await headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    const tenantKey = extractTenantFromCookies(headersList.get('cookie'));
    const metadata = await fetchAppMetadata(host, tenantKey);
    title = metadata.title || title;
    description = metadata.description || description;
  } catch {
    // Fall back to defaults on any resolution error.
  }

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 34, opacity: 0.85, marginBottom: 24 }}>ibl.ai</div>
      <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
      <div style={{ fontSize: 40, opacity: 0.9, marginTop: 28 }}>{description}</div>
    </div>,
    size,
  );
}
