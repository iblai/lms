'use client';

import { useParams } from 'next/navigation';
import { getTenant } from '@/utils/helpers';

/**
 * Returns the tenant from the URL params for routes under `/[tenant]/`.
 * Falls back to the stored tenant when the param is not present (e.g.
 * components rendered outside the `[tenant]` segment).
 */
export function useTenantParam(): string {
  const params = useParams();
  const raw = params?.tenant;
  const fromUrl = Array.isArray(raw) ? raw[0] : raw;
  return (fromUrl as string | undefined) || getTenant() || '';
}
