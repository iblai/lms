'use client';
import type React from 'react';
import { isRecommendedTabHidden } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useRouter } from 'next/navigation';
export default function RecommendedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const tenant = useTenantParam();
  if (isRecommendedTabHidden()) {
    router.push(`/platform/${tenant}/home`);
    return;
  }
  return <>{children}</>;
}
