import { Footer as FooterBase } from '@/components/footer';
import { NavBar as NavBarBase } from '@/components/nav-bar';
import { AppSidebar } from '@/components/app-sidebar';
import { isNonAuthPathname } from '@/constants/global';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { memo, useEffect } from 'react';
import { useChatState } from '@/components/chat-button';
import { useMediaQuery } from 'react-responsive';
import { config } from '@/lib/config';
import { SidebarInset, SidebarProvider } from '@iblai/iblai-js/web-containers/next';
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

  return (
    <DefaultPageLayout>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {/* Main part: left sidebar + inner main content (navbar lives inside).
            The sidebar is the cross-SPA PlatformSidebar shell, so it lives
            inside the SDK's SidebarProvider and the content sits in the
            matching SidebarInset. The Footer lives at the bottom of the
            inset so it sits to the RIGHT of the sidebar instead of
            overlaying it. */}
        <SidebarProvider defaultOpen={false} className="min-h-0 flex-1">
          {userIsLoggedIn && <AppSidebar />}
          <SidebarInset
            asChild
            className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white"
          >
            <div>
              <div className="z-40 w-full shrink-0">
                <NavBar />
              </div>
              {canMonetize(currentTenant as Tenant, userTenants as Tenant[]) && (
                <MonetizationWrapper />
              )}
              <div className="flex min-h-0 flex-1 flex-col items-start md:flex-row">
                <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto">
                  {children}
                </div>
                {config.settings.mentorEnabled() &&
                  userIsLoggedIn &&
                  metadataLoaded &&
                  isMentorAIEnabled() &&
                  !isUserMetadataLoading &&
                  userMetadata?.enable_sidebar_ai_mentor_display !== false &&
                  !(pathname.includes('/course-content/') && pathname.endsWith('/agent')) && (
                    <div
                      className={`${isMobile ? 'fixed right-0 bottom-0 z-50 pb-30' : 'h-full'} `}
                    >
                      <ChatButton isMobile={isMobile} />
                    </div>
                  )}
              </div>
              {/* Footer: bottom of the inset (right of the sidebar) */}
              <Footer />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </DefaultPageLayout>
  );
}
