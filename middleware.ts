import type { NextRequest } from 'next/server';
import { applyCsp } from '@iblai/iblai-js/security/next';

// IBL infrastructure on non-`.app` domains. Production runs on `*.iblai.app`
// (covered by the SDK's built-in allowlist), but staging and some environments
// serve the LMS/edX + APIs from `*.iblai.org` / `*.iblai.tech` (e.g.
// learn.stg1.iblai.org). The SDK defaults only cover .app/.ai/.network, so add
// these first-party domains explicitly or enforcement blocks their XHR/iframes.
const IBL_ALT_HTTP = ['https://*.iblai.org', 'https://*.iblai.tech'];
const IBL_ALT_WS = ['wss://*.iblai.org', 'wss://*.iblai.tech'];

// Server components don't have direct access to the request URL/pathname.
// Forward the pathname as a header so layouts can read it via `headers()` and
// branch on the current route (used to fetch the public platform-membership
// config server-side before rendering `Providers`).
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  // Attach the per-request, nonce-based Content-Security-Policy. @iblai/iblai-js
  // @2.x ENFORCES by default; local dev is report-only via .env.development
  // (CSP_MODE=report-only). applyCsp stamps the nonce onto these same request
  // headers — preserving x-pathname — and returns the response with the header.
  return applyCsp(request, {
    requestHeaders,
    connectSrc: [...IBL_ALT_HTTP, ...IBL_ALT_WS],
    frameSrc: IBL_ALT_HTTP, // edX content is embedded in iframes on these hosts
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
