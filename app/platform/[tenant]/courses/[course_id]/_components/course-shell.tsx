'use client';

import { useState, type ReactNode } from 'react';
import { useCourseDetailContext } from '@/hooks/courses/course-detail-context';
import { SyllabusTab } from './syllabus-tab';

/**
 * Client shell for the course page layout + tab interactivity. The `title`,
 * `about`, and `sidebar` are server-rendered (passed in from the server page),
 * so the H1, description/overview, and facts are in the initial HTML for
 * crawlers; only the tab switching and Syllabus panel run on the client.
 *
 * The About panel is toggled with `hidden` (not unmounted) so its server HTML
 * stays in the document across tab switches.
 */
export function CourseShell({
  title,
  about,
  sidebar,
}: {
  title: string;
  about: ReactNode;
  sidebar: ReactNode;
}) {
  const { handleOpenLesson, courseOutline, courseOutlineLoading } = useCourseDetailContext();
  const [activeTab, setActiveTab] = useState<'about' | 'syllabus'>('about');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (index: number | string) => {
    setExpandedSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const tabClass = (tab: 'about' | 'syllabus') =>
    `shrink-0 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
      activeTab === tab
        ? 'border-amber-500 text-amber-500'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="px-6 pt-6">
          <h1 className="max-w-6xl text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        <div className="mt-4 border-b border-gray-200">
          <div className="px-6">
            <div className="max-w-6xl">
              <div className="flex space-x-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button onClick={() => setActiveTab('about')} className={tabClass('about')}>
                  About
                </button>
                <button onClick={() => setActiveTab('syllabus')} className={tabClass('syllabus')}>
                  Syllabus
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-full w-full overflow-y-auto bg-amber-50 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className={activeTab === 'about' ? undefined : 'hidden'}>{about}</div>
              {activeTab === 'syllabus' && (
                <SyllabusTab
                  courseOutline={courseOutline}
                  courseOutlineLoading={courseOutlineLoading}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  handleOpenLesson={handleOpenLesson}
                />
              )}
            </div>
            <div className="md:col-span-1">{sidebar}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
