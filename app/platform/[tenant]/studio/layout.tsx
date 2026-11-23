import type React from 'react';
import { SelfLinkingGuard } from '@/components/self-linking-guard';
import { StudioAccessGuard } from '@/components/studio/studio-access-guard';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <SelfLinkingGuard>
      <StudioAccessGuard>{children}</StudioAccessGuard>
    </SelfLinkingGuard>
  );
}
