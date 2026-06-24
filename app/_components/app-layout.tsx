import { Footer } from '@/components/footer';
import { NavBar } from '@/components/nav-bar';
import { AppSidebar } from '@/components/app-sidebar';
import { isNonAuthPathname } from '@/constants/global';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatButton, useChatState } from '@/components/chat-button';
import { useMediaQuery } from 'react-responsive';
import { config } from '@/lib/config';
import { NavigationDrawer } from '@/components/navigation-drawer';
import { isLoggedIn, Tenant, useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';
import { MonetizationWrapper } from './monetization-wrapper';
import { canMonetize, useCurrentTenant, useUserTenants } from '@/utils/localstorage';

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
  const userIsLoggedIn = isLoggedIn();
  const { currentTenant } = useCurrentTenant();
  const { userTenants } = useUserTenants();
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

  // After the `/platform/{tenant}/` prefix, the next path piece identifies the
  // active page (`/platform/main/home` → "home"). Fallback to the first
  // segment for legacy paths.
  const segments = pathname.split('/').filter(Boolean);
  const tenantIdx =
    segments[0] === 'platform' && tenant && segments[1] === tenant
      ? 2
      : tenant && segments[0] === tenant
        ? 1
        : 0;
  const activePage = segments[tenantIdx] || 'home';

  return (
    <DefaultPageLayout>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {/* Main part: left sidebar + inner main content (navbar lives inside) */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {userIsLoggedIn && <AppSidebar />}
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <div className="z-40 w-full shrink-0">
              <NavBar
                sidebarOpen={sidebarOpen}
                activePage={activePage}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              />
            </div>
            <NavigationDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {canMonetize(currentTenant as Tenant, userTenants as Tenant[]) && (
              <MonetizationWrapper />
            )}
            <div className="flex min-h-0 flex-1 flex-col items-start md:flex-row">
              <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto pb-16">
                {children}
              </div>
              {config.settings.mentorEnabled() &&
                userIsLoggedIn &&
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
        </div>
        {/* Footer: bottom section (fixed full-width bar) */}
        <Footer />
      </div>
    </DefaultPageLayout>
  );
}
