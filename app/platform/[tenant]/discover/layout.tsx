import type React from 'react';
import { SelfLinkingGuard } from '@/components/self-linking-guard';
import { DiscoverAccessGuard } from '@/components/discover-access-guard';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <SelfLinkingGuard>
      <DiscoverAccessGuard>{children}</DiscoverAccessGuard>
    </SelfLinkingGuard>
  );
}
