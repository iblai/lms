import type { NextRequest } from 'next/server';
import { applyCsp } from '@iblai/iblai-js/security/next';

// IBL infrastructure on non-`.app` domains. Production runs on `*.iblai.app`
// (covered by the SDK's built-in allowlist), but staging and some environments
// serve the LMS/edX + APIs from `*.iblai.org` / `*.iblai.tech` (e.g.
// learn.stg1.iblai.org). The SDK defaults only cover .app/.ai/.network, so add
// these first-party domains explicitly or enforcement blocks their XHR/iframes.
const IBL_ALT_HTTP = ['https://*.iblai.org', 'https://*.iblai.tech'];
const IBL_ALT_WS = ['wss://*.iblai.org', 'wss://*.iblai.tech'];
// Customer/partner institution domains served from their own host (SSO/LMS/API).
// Override via CSP_PARTNER_HOSTS (comma/space-separated); defaults to Syracuse
// when unset. Read at request time so it isn't frozen at module load / build time.
const DEFAULT_PARTNER_HOSTS = ['https://*.syr.edu']; // Syracuse University
const partnerHosts = () => {
  const raw = process.env.CSP_PARTNER_HOSTS?.trim();
  return raw ? raw.split(/[\s,]+/).filter(Boolean) : DEFAULT_PARTNER_HOSTS;
};

// Immutable-static CDN origin (e.g. assets.ibl.ai), when static assets are
// served cross-origin from it. Derived from the SAME NEXT_PUBLIC_ASSET_CDN that
// next.config.mjs bakes into assetPrefix, so the CSP and the emitted asset URLs
// can't drift. Accepts a bare host or full URL; [] when unset (assets are
// same-origin, so this is a no-op). The gap it closes is style-src + font-src
// (script-src/img-src already allow it via strict-dynamic / `https:`).
const assetCdnOrigin = (): string[] => {
  let cdn = process.env.NEXT_PUBLIC_ASSET_CDN?.trim();
  if (!cdn) return [];
  if (!/^https?:\/\//i.test(cdn)) cdn = `https://${cdn}`;
  try {
    return [new URL(cdn).origin];
  } catch {
    return [];
  }
};

// Server components don't have direct access to the request URL/pathname.
// Forward the pathname as a header so layouts can read it via `headers()` and
// branch on the current route (used to fetch the public platform-membership
// config server-side before rendering `Providers`).
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  const partners = partnerHosts();
  // connect-src also needs the wss:// origin of each https:// partner host —
  // browsers don't treat an https:// source as covering wss:// to the same host
  // (e.g. Syracuse's wss://asgi.data.ai.syr.edu needs wss://*.syr.edu).
  const partnerWs = partners
    .filter((h) => h.startsWith('https://'))
    .map((h) => `wss://${h.slice('https://'.length)}`);
  const assetCdn = assetCdnOrigin();
  // Attach the per-request, nonce-based Content-Security-Policy. @iblai/iblai-js
  // @2.x ENFORCES by default; local dev is report-only via .env.development
  // (CSP_MODE=report-only). applyCsp stamps the nonce onto these same request
  // headers — preserving x-pathname — and returns the response with the header.
  return applyCsp(request, {
    requestHeaders,
    // CDN-hosted CSS + fonts are cross-origin; style-src/font-src don't get the
    // strict-dynamic/`https:` fallback, so allow the CDN origin explicitly.
    styleSrc: assetCdn,
    fontSrc: assetCdn,
    connectSrc: [...IBL_ALT_HTTP, ...IBL_ALT_WS, ...partners, ...partnerWs, ...assetCdn],
    frameSrc: [...IBL_ALT_HTTP, ...partners], // edX + partner content in iframes
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
