'use client';

import { ProfileSidebar } from '@/components/profile-sidebar';
import { SuggestedCourses } from '@/components/suggested-courses';
import { MyCourses } from '@/components/my-courses';
import { isRecommendedTabHidden } from '@/utils/helpers';

export default function Dashboard() {
  return (
    <>
      {/* Main content area with proper overflow and padding for fixed elements */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Update main content to be scrollable and account for fixed header/footer */}
        <main className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col md:flex-row">
            {/* Main content column - this is the only scrollable area */}
            <div
              className="h-full flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex flex-col gap-6 px-3 pt-4 pb-24 sm:px-4 md:flex-row md:px-6 md:pt-6 md:pb-6">
                {/* Profile sidebar inside the scrollable area for desktop */}
                <div className="md:w-80 md:flex-shrink-0">
                  <ProfileSidebar />
                </div>

                {/* Main content */}
                <div className="flex flex-1 flex-col gap-6">
                  {!isRecommendedTabHidden() && <SuggestedCourses />}
                  <MyCourses />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
