'use client';

import { useContext, useEffect, useState } from 'react';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

import { CourseOutline } from '@/components/course-outline';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { useLocalStorage } from '@/hooks/localstorage/use-local-storage';

export const OUTLINE_COLLAPSED_KEY = 'course-outline-collapsed';

const BOOLEAN_STORAGE = {
  serializer: (value: boolean) => (value ? 'true' : 'false'),
  deserializer: (value: string) => value === 'true',
};

export const CourseOutlineSidebar = () => {
  const { course } = useContext(CourseOutlineContext);

  const [mounted, setMounted] = useState(false);
  // Expanded by default — the user has to explicitly collapse the outline.
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(OUTLINE_COLLAPSED_KEY, false, {
    initializeWithValue: false,
    ...BOOLEAN_STORAGE,
  });

  // The collapse feature is available at every width from md (768px) upwards;
  // below md the outline lives in the drawer (handled in the layout).
  const isWide = useMediaQuery({ minWidth: 768 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showFull = isWide && !collapsed;
  const showRail = isWide && collapsed;
  const showCollapseControl = isWide;

  const railClass = !mounted ? 'hidden' : showRail ? 'flex' : 'hidden';
  const fullClass = !mounted ? 'hidden md:block' : showFull ? 'block' : 'hidden';
  const collapseBtnClass = mounted && showCollapseControl ? 'inline-flex' : 'hidden';

  const handleExpand = () => {
    setCollapsed(false);
  };

  const handleCollapse = () => {
    setCollapsed(true);
  };

  return (
    <>
      {/* Collapsed rail — md (768px) and up, while collapsed */}
      <div
        className={`${railClass} w-12 flex-shrink-0 flex-col items-center border-r border-gray-200 pt-2`}
        data-testid="course-outline-rail"
      >
        <button
          type="button"
          onClick={handleExpand}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          aria-label="Expand course outline"
          title="Show course outline"
          data-testid="expand-course-outline"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      </div>

      {/* Expanded outline — full sidebar */}
      <div
        className={`${fullClass} w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200`}
        style={{ scrollbarWidth: 'none' }}
        data-testid="course-outline-sidebar"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800">{course?.display_name}</h2>
          <button
            type="button"
            onClick={handleCollapse}
            className={`-mr-1 ${collapseBtnClass} rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none`}
            aria-label="Collapse course outline"
            title="Hide course outline"
            data-testid="collapse-course-outline"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <CourseOutline />
      </div>
    </>
  );
};
