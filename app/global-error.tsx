'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';
import { isChunkLoadError, chunkReloadsExhausted, reloadForChunkError } from '@/lib/chunk-retry';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isChunk = isChunkLoadError(error);

  useEffect(() => {
    if (isChunk) {
      // Only a fresh page load fetches HTML with current chunk hashes. Auto-reload
      // up to the shared budget; when spent, the recoverable UI below is shown.
      reloadForChunkError();
      return;
    }
    console.error('Unhandled global error:', error);
    const tenant = getTenant();
    router.replace(tenant ? `/platform/${tenant}/error/500` : '/');
  }, [isChunk, error, router]);

  // Only render UI for a chunk error whose reload budget is spent; other cases
  // (non-chunk redirect, or a reload already firing) render an empty body.
  const showReload = isChunk && chunkReloadsExhausted();

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#0b0b0f',
          color: '#e7e7ea',
          padding: '24px',
        }}
      >
        {showReload && (
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>
              Couldn’t finish loading the app
            </h1>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                opacity: 0.75,
                margin: '0 0 20px',
              }}
            >
              This is usually a brief network hiccup or an update that just shipped. Reload to get
              the latest version.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                appearance: 'none',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#2563eb',
                color: '#fff',
              }}
            >
              Reload
            </button>
          </div>
        )}
      </body>
    </html>
  );
}
