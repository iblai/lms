'use client';

import { useEffect, useState } from 'react';

export const EDX_IFRAME_LOADED_EVENT = 'edx-iframe:loaded';

/** Subsections that never mount the iframe (exam gates) would otherwise wait forever. */
export const EDX_IFRAME_LOAD_FALLBACK_MS = 15_000;

// Mirrors the mounted iframe's load state so a consumer that mounts *after* the
// load event (the agent chat is lazily imported) still sees that it happened,
// instead of waiting for an event that already fired.
let edxIframeLoaded = false;

export function markEdxIframeLoaded() {
  edxIframeLoaded = true;
  window.dispatchEvent(new CustomEvent(EDX_IFRAME_LOADED_EVENT));
}

/** Called when the iframe navigates, so the next load is awaited afresh. */
export function markEdxIframeUnloaded() {
  edxIframeLoaded = false;
}

export function hasEdxIframeLoaded() {
  return edxIframeLoaded;
}

/**
 * True once the course iframe has loaded — latched, so a later unit switch
 * (which reloads the iframe) never flips it back and tears down whatever it
 * gates. Falls back to true after `EDX_IFRAME_LOAD_FALLBACK_MS` so content is
 * never withheld indefinitely when no iframe ever loads.
 */
export function useEdxIframeLoaded(fallbackMs = EDX_IFRAME_LOAD_FALLBACK_MS) {
  const [loaded, setLoaded] = useState(hasEdxIframeLoaded);

  useEffect(() => {
    if (loaded) return;
    if (hasEdxIframeLoaded()) {
      setLoaded(true);
      return;
    }
    const onLoaded = () => setLoaded(true);
    window.addEventListener(EDX_IFRAME_LOADED_EVENT, onLoaded, { once: true });
    const fallbackTimer = setTimeout(onLoaded, fallbackMs);
    return () => {
      window.removeEventListener(EDX_IFRAME_LOADED_EVENT, onLoaded);
      clearTimeout(fallbackTimer);
    };
  }, [loaded, fallbackMs]);

  return loaded;
}
