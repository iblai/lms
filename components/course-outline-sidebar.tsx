'use client';

import { useContext, useEffect, useState } from 'react';

import { ListTree, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

import { CourseOutline } from '@/components/course-outline';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { useLocalStorage } from '@/hooks/localstorage/use-local-storage';

export const OUTLINE_COLLAPSED_KEY = 'course-outline-collapsed';
export const OUTLINE_HINT_SEEN_KEY = 'course-outline-collapse-hint-seen';

const BOOLEAN_STORAGE = {
  serializer: (value: boolean) => (value ? 'true' : 'false'),
  deserializer: (value: string) => value === 'true',
};

export const CourseOutlineSidebar = () => {
  const { course } = useContext(CourseOutlineContext);

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(OUTLINE_COLLAPSED_KEY, true, {
    initializeWithValue: false,
    ...BOOLEAN_STORAGE,
  });
  const [hintSeen, setHintSeen] = useLocalStorage<boolean>(OUTLINE_HINT_SEEN_KEY, false, {
    initializeWithValue: false,
    ...BOOLEAN_STORAGE,
  });

  const isDesktop = useMediaQuery({ minWidth: 1280 }); // xl and up
  const isTabletRange = useMediaQuery({ minWidth: 768, maxWidth: 1279 }); // md–xl

  useEffect(() => {
    setMounted(true);
  }, []);

  const showFull = isDesktop || (isTabletRange && !collapsed);

  const showRail = isTabletRange && collapsed;

  const showCollapseControl = isTabletRange;
  const showHint = mounted && isTabletRange && collapsed && !hintSeen;

  const railClass = !mounted ? 'hidden' : showRail ? 'flex' : 'hidden';
  const fullClass = !mounted ? 'hidden md:block' : showFull ? 'block' : 'hidden';
  const collapseBtnClass = mounted && showCollapseControl ? 'inline-flex' : 'hidden';

  const handleExpand = () => {
    setCollapsed(false);
    setHintSeen(true);
  };

  const handleCollapse = () => {
    setCollapsed(true);
  };

  const dismissHint = () => {
    setHintSeen(true);
  };

  return (
    <>
      {/* Collapsed rail — tablet range only, while collapsed */}
      <div
        className={`${railClass} w-12 flex-shrink-0 flex-col items-center border-r border-gray-200 pt-2`}
        style={{ height: 'calc(100% - 60px)' }}
        data-testid="course-outline-rail"
      >
        <Popover
          open={showHint}
          onOpenChange={(open) => {
            if (!open) dismissHint();
          }}
        >
          <PopoverTrigger asChild>
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
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-64 p-3"
            data-testid="course-outline-hint"
          >
            <div className="flex items-start gap-2">
              <ListTree className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-xs text-gray-600">
                <p className="mb-1 font-medium text-gray-800">Course outline hidden</p>
                <p>
                  We collapsed the outline to give the content more room. Tap this button to show it
                  anytime.
                </p>
                <button
                  type="button"
                  onClick={dismissHint}
                  className="mt-2 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  Got it
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Expanded outline — full sidebar */}
      <div
        className={`${fullClass} w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200 pl-4`}
        style={{ scrollbarWidth: 'none', height: 'calc(100% - 60px)' }}
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
