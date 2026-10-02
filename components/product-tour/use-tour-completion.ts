'use client';

import { useCallback, useMemo, useState } from 'react';
import { useGetUserMetadataQuery, useUpdateUserMetadataMutation } from '@iblai/iblai-js/data-layer';

import { config } from '@/lib/config';

/** Bump to show a reworked tour again to people who finished the previous one. */
export const PRODUCT_TOUR_VERSION = 1;

export type TourOutcome = 'finished' | 'skipped';

/** What is stored on the user's metadata, under `public_metadata[<appName>-product-tour]`. */
export type ProductTourRecord = {
  status: TourOutcome;
  version: number;
  completed_at: string;
};

/**
 * The `public_metadata` key: `<appName>-product-tour`, e.g. `skills-product-tour`.
 * Mirrored in `e2e/utils/product-tour.ts`.
 */
export function productTourMetadataKey(): string {
  return `${config.settings.appName() || 'skills'}-product-tour`;
}

/** Parse a stored value; anything this code did not write reads as "not seen". */
export function readTourRecord(value: unknown): ProductTourRecord | null {
  if (!value || typeof value !== 'object') return null;
  const { status, version, completed_at } = value as Record<string, unknown>;
  if (status !== 'finished' && status !== 'skipped') return null;
  return {
    status,
    version: typeof version === 'number' ? version : 0,
    completed_at: typeof completed_at === 'string' ? completed_at : '',
  };
}

/**
 * Whether the user has been through the tour. Read from, and written to, the
 * user's metadata (`useUpdateUserMetadataMutation`), so it follows the account
 * across browsers and devices instead of one browser's storage.
 */
export function useTourCompletion(username: string | null | undefined) {
  const { data, isLoading, isError } = useGetUserMetadataQuery(
    { params: { username: username ?? '' } },
    { skip: !username },
  );
  const [updateUserMetadata] = useUpdateUserMetadataMutation();
  type UpdatePayload = Parameters<typeof updateUserMetadata>[0];
  // Optimistic: the tour must not come back while the save is in flight, or if it fails.
  const [localOutcome, setLocalOutcome] = useState<TourOutcome | null>(null);

  const key = productTourMetadataKey();
  // The SDK types `public_metadata` as the profile fields; it is a free-form bag server-side.
  const publicMetadata = useMemo(
    () => (data?.public_metadata ?? {}) as Record<string, unknown>,
    [data],
  );
  const record = useMemo(() => readTourRecord(publicMetadata[key]), [publicMetadata, key]);
  const storedOutcome = record && record.version >= PRODUCT_TOUR_VERSION ? record.status : null;
  const outcome = localOutcome ?? storedOutcome;

  const markCompleted = useCallback(
    async (status: TourOutcome) => {
      setLocalOutcome(status);
      if (!username) return;
      const next: ProductTourRecord = {
        status,
        version: PRODUCT_TOUR_VERSION,
        completed_at: new Date().toISOString(),
      };
      try {
        // Partial update, like the start page's; merged because the endpoint
        // replaces `public_metadata` wholesale.
        await updateUserMetadata({
          username,
          public_metadata: { ...publicMetadata, [key]: next },
        } as unknown as UpdatePayload).unwrap();
      } catch (error) {
        console.error('[product-tour] Could not save the tour outcome to the user metadata', error);
      }
    },
    [username, publicMetadata, key, updateUserMetadata],
  );

  return {
    completed: outcome !== null,
    outcome,
    /** True until the user's metadata has been read; the tour must not start before. */
    isLoading: !!username && isLoading,
    /** The metadata could not be read, so whether the tour was seen is unknown. */
    isError: !!username && isError,
    markCompleted,
  };
}
