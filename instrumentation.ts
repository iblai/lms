import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Suppress HTMLElement errors during server startup pre-warming.
    // These occur when Next.js pre-warms routes that touch browser APIs but
    // don't affect actual request handling.
    process.on('unhandledRejection', (reason: any) => {
      if (reason?.message?.includes?.('HTMLElement is not defined')) {
        console.warn(
          '[Next.js] Suppressed HTMLElement error during route pre-warming (non-blocking)',
        );
        return;
      }
      // Let other unhandled rejections be handled normally (by Sentry, etc.)
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Next.js 15 routes server-side render/route errors here; without it the
// server configs above would only ever see what `console.error` surfaces.
export const onRequestError = Sentry.captureRequestError;
