'use client';

import { ProfileSidebar } from '@/components/profile-sidebar';
import { SuggestedCourses } from '@/components/suggested-courses';
import { MyCourses } from '@/components/my-courses';
import { isRecommendedTabHidden } from '@/utils/helpers';

export default function Dashboard() {
  return (
    <>
      {/* Main content area with proper overflow and padding for fixed elements */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Update main content to be scrollable and account for fixed header/footer */}
        <main className="flex-1 overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            {/* Main content column - this is the only scrollable area */}
            <div
              className="flex-1 overflow-y-auto h-full"
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
              <div className="flex flex-col md:flex-row gap-6 px-3 sm:px-4 md:px-6 pt-4 md:pt-6 pb-24 md:pb-6">
                {/* Profile sidebar inside the scrollable area for desktop */}
                <div className="md:w-80 md:flex-shrink-0">
                  <ProfileSidebar />
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col gap-6">
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
