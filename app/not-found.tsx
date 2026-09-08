'use client';

import { usePathname } from 'next/navigation';
import { ErrorPageContent } from '@/components/error-page-content';
import { getTenant } from '@/utils/helpers';

export default function NotFound() {
  const pathname = usePathname();
  // No route matched, so there is no `[tenant]` param to read: take the tenant
  // from the URL when the visitor was on a tenant-scoped path, and fall back to
  // the stored one otherwise. It only feeds the tenant support email.
  const tenant = pathname.match(/^\/platform\/([^/]+)/)?.[1] || getTenant();

  return <ErrorPageContent code="404" tenant={tenant} />;
}
