import { Footer } from '@/components/footer';
import { NavBar } from '@/components/nav-bar';
import { isNonAuthPathname } from '@/constants/global';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatButton, useChatState } from '@/components/chat-button';
import { useMediaQuery } from 'react-responsive';
import { config } from '@/lib/config';
import { NavigationDrawer } from '@/components/navigation-drawer';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';
import { MonetizationWrapper } from './monetization-wrapper';
import { useCurrentTenant } from '@/utils/localstorage';

function DefaultPageLayout({ children }: { children: any }) {
  return (
    <div className="flex h-screen flex-col">
      <div className="main-content flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function AppLayout({ children }: { children: any }) {
  const { courseMentor, setCourseMentor, setMentorSidebarHidden, mentorSidebarHidden } =
    useChatState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const username = getUserName();
  const { currentTenant } = useCurrentTenant();
  const { data: userMetadata, isLoading: isUserMetadataLoading } = useGetUserMetadataQuery(
    {
      params: { username },
    },
    {
      skip: !username,
    },
  );
  const tenant = useTenantParam();
  const { metadataLoaded, isMentorAIEnabled } = useTenantMetadata({
    org: tenant,
  });
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const pathname = usePathname();

  useEffect(() => {
    if (
      !(pathname.includes('/course-content/') || pathname.includes('/courses/')) &&
      (courseMentor || mentorSidebarHidden)
    ) {
      setCourseMentor(null);
      setMentorSidebarHidden(false);
    }
  }, [pathname]);

  if (isNonAuthPathname(pathname)) {
    return <DefaultPageLayout>{children}</DefaultPageLayout>;
  }

  // After the tenant segment, the next path piece identifies the active page
  // (`/main/home` → "home"). Fallback to the first segment for legacy paths.
  const segments = pathname.split('/').filter(Boolean);
  const activePage = (tenant && segments[0] === tenant ? segments[1] : segments[0]) || 'home';

  return (
    <DefaultPageLayout>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {/* Make the NavBar sticky at the top */}
        <div className="sticky top-0 z-40 w-full">
          <NavBar
            sidebarOpen={sidebarOpen}
            activePage={activePage}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
        <NavigationDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {currentTenant?.enable_monetization && <MonetizationWrapper />}
        <div className="flex h-full flex-col items-start md:flex-row">
          <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto pb-16">
            {children}
            <Footer />
          </div>
          {config.settings.mentorEnabled() &&
            metadataLoaded &&
            isMentorAIEnabled() &&
            !isUserMetadataLoading &&
            userMetadata?.enable_sidebar_ai_mentor_display !== false &&
            !(pathname.includes('/course-content/') && pathname.endsWith('/agent')) && (
              <div className={`${isMobile ? 'fixed right-0 bottom-0 z-50 pb-30' : 'h-full'} `}>
                <ChatButton isMobile={isMobile} />
              </div>
            )}
        </div>
      </div>
    </DefaultPageLayout>
  );
}
