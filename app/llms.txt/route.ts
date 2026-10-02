import { headers } from 'next/headers';

// Serves /llms.txt — a plain-text guide for LLM/AI crawlers (the emerging
// companion to robots.txt). Previously 404'd. Host-aware so the links are
// absolute for whatever domain (or custom tenant domain) is serving the app.
export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const host = h.get('host') || h.get('x-forwarded-host') || '';
  const protocol = h.get('x-forwarded-proto') || 'https';
  const base = host ? `${protocol}://${host}` : '';

  const body = `# ibl.ai | Agentic LMS

> AI-powered learning platform. Browse and enroll in courses, programs, and pathways; each has a server-rendered, publicly readable detail page.

## Key resources
- Catalog / discover: ${base}/
- Sitemap: ${base}/sitemap.xml
- Robots: ${base}/robots.txt

## Content structure
- Course pages: ${base}/platform/<tenant>/courses/<course_id>
- Program pages: ${base}/platform/<tenant>/programs/<program_id>
- Course detail pages are server-rendered (title, description, overview, and facts are in the initial HTML).

## Notes
- Only tenants with public access enabled expose indexable content; others are noindex.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
