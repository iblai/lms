'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config';

export const EDX_IFRAME_LOADED_EVENT = 'edx-iframe:loaded';
export const EDX_UNIT_LOADED_EVENT = 'edx-unit:loaded';

/** Posted to the host by the edX page's own script once the unit it renders has loaded. */
export const EDX_UNIT_LOADED_MESSAGE_TYPE = 'unit.loaded';

/** Posted to the edX page to have it announce itself again (`context`, then `unit.loaded`). */
export const EDX_CONTEXT_REQUEST_MESSAGE_TYPE = 'context.request';

export const EDX_IFRAME_ID = 'edx-iframe';

/** Subsections that never mount the iframe (exam gates) would otherwise wait forever. */
export const EDX_IFRAME_LOAD_FALLBACK_MS = 15_000;

/**
 * How long after the iframe element's load event to keep waiting for the page's
 * `unit.loaded` frame before letting the element load stand in for it. edX
 * deployments without the script never send one.
 */
export const EDX_UNIT_LOADED_GRACE_MS = 1_000;

export interface EdxUnitLoadedMessage {
  type: typeof EDX_UNIT_LOADED_MESSAGE_TYPE;
  usageId: string;
  courseId?: string | null;
  displayName?: string | null;
}

export interface EdxUnitLoadedDetail {
  usageId: string;
}

// Mirrors the mounted iframe's load state so a consumer that mounts *after* the
// load event (the agent chat is lazily imported) still sees that it happened,
// instead of waiting for an event that already fired.
let edxIframeLoaded = false;
let loadedUnitId: string | null = null;

export function markEdxIframeLoaded() {
  edxIframeLoaded = true;
  window.dispatchEvent(new CustomEvent(EDX_IFRAME_LOADED_EVENT));
}

/** Called when the iframe is torn down, so the next load is awaited afresh. */
export function markEdxIframeUnloaded() {
  edxIframeLoaded = false;
  loadedUnitId = null;
}

export function hasEdxIframeLoaded() {
  return edxIframeLoaded;
}

export function isEdxUnitLoadedMessage(data: unknown): data is EdxUnitLoadedMessage {
  if (!data || typeof data !== 'object') return false;
  const { type, usageId } = data as Partial<EdxUnitLoadedMessage>;
  return type === EDX_UNIT_LOADED_MESSAGE_TYPE && typeof usageId === 'string' && usageId !== '';
}

/** Records that the iframe now shows `usageId`; a unit can't be loaded without its iframe being so. */
export function markEdxUnitLoaded(usageId: string) {
  if (!edxIframeLoaded) markEdxIframeLoaded();
  loadedUnitId = usageId;
  window.dispatchEvent(
    new CustomEvent<EdxUnitLoadedDetail>(EDX_UNIT_LOADED_EVENT, { detail: { usageId } }),
  );
}

export function getLoadedEdxUnitId() {
  return loadedUnitId;
}

/**
 * Asks the course iframe's page to announce itself again, for a consumer that
 * mounted after the page had loaded and so missed its frames. Nothing happens
 * when no iframe is mounted; a page still loading drops the request and will
 * announce on its own load anyway.
 */
export function requestEdxUnitContext() {
  const iframe = document.getElementById(EDX_IFRAME_ID) as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage({ type: EDX_CONTEXT_REQUEST_MESSAGE_TYPE }, config.urls.lms());
}

/**
 * Runs `onLoaded` once the iframe reports unit `unitId` loaded — at once if it
 * already has — or after `fallbackMs` if it never does. A load of any other
 * unit (the one being left, say) is not it. Returns a cancel.
 */
export function waitForEdxUnitLoaded(
  unitId: string,
  onLoaded: () => void,
  fallbackMs = EDX_IFRAME_LOAD_FALLBACK_MS,
): () => void {
  if (loadedUnitId === unitId) {
    onLoaded();
    return () => {};
  }
  const cancel = () => {
    clearTimeout(fallbackTimer);
    window.removeEventListener(EDX_UNIT_LOADED_EVENT, onUnitLoaded);
  };
  const settle = () => {
    cancel();
    onLoaded();
  };
  const onUnitLoaded = (event: Event) => {
    if ((event as CustomEvent<EdxUnitLoadedDetail>).detail?.usageId === unitId) settle();
  };
  const fallbackTimer = setTimeout(settle, fallbackMs);
  window.addEventListener(EDX_UNIT_LOADED_EVENT, onUnitLoaded);
  return cancel;
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
