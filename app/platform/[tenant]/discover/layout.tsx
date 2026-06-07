import type React from 'react';
import { SelfLinkingGuard } from '@/components/self-linking-guard';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <SelfLinkingGuard>{children}</SelfLinkingGuard>;
}
