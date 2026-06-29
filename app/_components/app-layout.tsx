import { Footer as FooterBase } from '@/components/footer';
import { NavBar as NavBarBase } from '@/components/nav-bar';
import { isNonAuthPathname } from '@/constants/global';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useState } from 'react';
import { useChatState } from '@/components/chat-button';
import { useMediaQuery } from 'react-responsive';
import { config } from '@/lib/config';
import { NavigationDrawer as NavigationDrawerBase } from '@/components/navigation-drawer';
import { isLoggedIn, Tenant, useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';
import { canMonetize, useCurrentTenant, useUserTenants } from '@/utils/localstorage';

// Defer the AI mentor widget (pulls @iblai/agent-ai + livekit) so it only loads
// when the mentor sidebar is actually shown, keeping it out of the shared layout chunk.
const ChatButton = dynamic(() => import('@/components/chat-button').then((m) => m.ChatButton), {
  ssr: false,
  loading: () => null,
});

// Paywall UI only renders for monetizing tenants; keep its bundle out of the shared chunk.
const MonetizationWrapper = dynamic(
  () => import('./monetization-wrapper').then((m) => m.MonetizationWrapper),
  { ssr: false, loading: () => null },
);

// The chrome doesn't depend on the page children, so memoize it to skip re-renders
// triggered by AppLayout updates (metadata loads, sidebar toggles) on every navigation.
const NavBar = memo(NavBarBase);
const Footer = memo(FooterBase);
const NavigationDrawer = memo(NavigationDrawerBase);

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

  const handleMenuClick = useCallback(() => setSidebarOpen((open) => !open), []);
  const handleDrawerClose = useCallback(() => setSidebarOpen(false), []);

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
        {/* Make the NavBar sticky at the top */}
        <div className="sticky top-0 z-40 w-full">
          <NavBar sidebarOpen={sidebarOpen} activePage={activePage} onMenuClick={handleMenuClick} />
        </div>
        <NavigationDrawer isOpen={sidebarOpen} onClose={handleDrawerClose} />
        {canMonetize(currentTenant as Tenant, userTenants as Tenant[]) && <MonetizationWrapper />}
        <div
          className="flex h-full flex-col items-start md:flex-row"
          style={{ height: isMobile ? 'calc(100% - 110px)' : 'calc(100% - 125px)' }}
        >
          <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto">
            {children}
            <Footer />
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
    </DefaultPageLayout>
  );
}
