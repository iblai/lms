'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeInitializer } from '@/components/theme-initializer';
import { ChatProvider } from '@/providers/chat';
import { Toaster } from 'sonner';
import AppLayout from '@/app/_components/app-layout';
import { useState } from 'react';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { isJSON } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';
import { sanitizeCss } from '@iblai/iblai-js/web-containers';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfileTargetTab, setUserProfileTargetTab] = useState<string>('basic');
  const { metadata } = useTenantMetadata({ org: getTenant() });
  const tenantAdvancedCSS = isJSON(metadata?.skills_advanced_css)
    ? sanitizeCss(JSON.parse(metadata?.skills_advanced_css) as string)
    : '';
  return (
    <ThemeProvider>
      {tenantAdvancedCSS && <style>{tenantAdvancedCSS}</style>}
      <ThemeInitializer />
      <AppContext.Provider
        value={{
          isUserProfileOpen,
          setIsUserProfileOpen,
          userProfileTargetTab,
          setUserProfileTargetTab,
        }}
      >
        <ChatProvider>
          <AppLayout>{children}</AppLayout>
        </ChatProvider>
      </AppContext.Provider>
      <Toaster />
    </ThemeProvider>
  );
}

export const AppContext = React.createContext<{
  isUserProfileOpen: boolean;
  setIsUserProfileOpen: (isUserProfileOpen: boolean) => void;
  userProfileTargetTab: string;
  setUserProfileTargetTab: (targetTab: string) => void;
}>({
  isUserProfileOpen: false,
  setIsUserProfileOpen: () => {},
  userProfileTargetTab: 'basic',
  setUserProfileTargetTab: () => {},
});
