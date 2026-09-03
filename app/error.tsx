'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';
import { isChunkLoadError, chunkReloadsExhausted, reloadForChunkError } from '@/lib/chunk-retry';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isChunk = isChunkLoadError(error);

  useEffect(() => {
    if (isChunk) {
      // A missing chunk won't recover via client navigation — only a fresh page
      // load fetches HTML with current chunk hashes. Auto-reload up to the shared
      // budget; when spent, the recoverable UI below is shown.
      reloadForChunkError();
      return;
    }
    console.error('Unhandled client error:', error);
    const tenant = getTenant();
    router.replace(tenant ? `/platform/${tenant}/error/500` : '/');
  }, [isChunk, error, router]);

  // Chunk error, budget spent → recoverable "please reload" UI. Inline styles so
  // it survives even a failed CSS chunk; the button hard-reloads (client nav
  // can't fix a missing chunk).
  if (isChunk && chunkReloadsExhausted()) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420 }}>
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
            This is usually a brief network hiccup or an update that just shipped. Reload to get the
            latest version.
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
      </div>
    );
  }

  return null;
}
