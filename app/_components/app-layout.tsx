import { Footer } from '@/components/footer';
import { NavBar } from '@/components/nav-bar';
import { NON_AUTH_PAGES } from '@/constants/global';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatButton, useChatState } from '@/components/chat-button';
import { useMediaQuery } from 'react-responsive';
import { config } from '@/lib/config';
import { NavigationDrawer } from '@/components/navigation-drawer';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant, getUserName } from '@/utils/helpers';
// @ts-ignore
import { useGetUserMetadataQuery } from '@iblai/iblai-js/data-layer';
import { MonetizationWrapper } from './monetization-wrapper';

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
  const { data: userMetadata, isLoading: isUserMetadataLoading } = useGetUserMetadataQuery(
    {
      params: { username },
    },
    {
      skip: !username,
    },
  );
  const { metadataLoaded, isMentorAIEnabled } = useTenantMetadata({
    org: getTenant(),
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

  if (NON_AUTH_PAGES.includes(pathname)) {
    return <DefaultPageLayout>{children}</DefaultPageLayout>;
  }

  return (
    <DefaultPageLayout>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {/* Make the NavBar sticky at the top */}
        <div className="sticky top-0 z-40 w-full">
          <NavBar
            sidebarOpen={sidebarOpen}
            activePage={pathname.split('/')[1] || 'home'}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
        <NavigationDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MonetizationWrapper />
        <div className="flex h-full flex-col items-start md:flex-row">
          <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto pb-16">
            {children}
            <Footer />
          </div>
          {config.settings.mentorEnabled() &&
            metadataLoaded &&
            isMentorAIEnabled() &&
            !isUserMetadataLoading &&
            userMetadata?.enable_sidebar_ai_mentor_display !== false && (
              <div className={`${isMobile ? 'fixed right-0 bottom-0 z-50 pb-30' : 'h-full'} `}>
                <ChatButton isMobile={isMobile} />
              </div>
            )}
        </div>
      </div>
    </DefaultPageLayout>
  );
}
