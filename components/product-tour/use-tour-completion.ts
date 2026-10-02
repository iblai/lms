'use client';

import { useCallback } from 'react';

import { useLocalStorage } from '@/hooks/localstorage/use-local-storage';

/** Bump to show a reworked tour again to people who finished the previous one. */
export const PRODUCT_TOUR_VERSION = 1;

export type TourOutcome = 'finished' | 'skipped';

/**
 * Per-user key, so a different account on the same browser gets its own tour.
 * Mirrored in `e2e/utils/product-tour.ts` (the auth setup pre-marks it seen).
 */
export function productTourStorageKey(username: string | null | undefined): string {
  return `skills:product-tour:v${PRODUCT_TOUR_VERSION}:${username || 'anonymous'}`;
}

const STORAGE_OPTIONS = {
  serializer: (value: TourOutcome | null) => value ?? '',
  deserializer: (raw: string): TourOutcome | null =>
    raw === 'finished' || raw === 'skipped' ? raw : null,
};

export function useTourCompletion(username: string | null | undefined) {
  const [outcome, setOutcome, removeOutcome] = useLocalStorage<TourOutcome | null>(
    productTourStorageKey(username),
    null,
    STORAGE_OPTIONS,
  );

  const markCompleted = useCallback((value: TourOutcome) => setOutcome(value), [setOutcome]);

  return { completed: outcome !== null, outcome, markCompleted, reset: removeOutcome };
}
