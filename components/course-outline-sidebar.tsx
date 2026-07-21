'use client';

import { useEffect, useState } from 'react';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

import { CourseOutline } from '@/components/course-outline';
import { useLocalStorage } from '@/hooks/localstorage/use-local-storage';

export const OUTLINE_COLLAPSED_KEY = 'course-outline-collapsed';

const BOOLEAN_STORAGE = {
  serializer: (value: boolean) => (value ? 'true' : 'false'),
  deserializer: (value: string) => value === 'true',
};

// Shared between the sidebar and the toggle — useLocalStorage broadcasts a
// 'local-storage' event on set, so every instance of this hook stays in sync.
const useOutlineCollapsed = () => {
  const [mounted, setMounted] = useState(false);
  // Expanded by default — the user has to explicitly collapse the outline.
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(OUTLINE_COLLAPSED_KEY, false, {
    initializeWithValue: false,
    ...BOOLEAN_STORAGE,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  return { mounted, collapsed, setCollapsed };
};

// Lives in the course header row of the layout (same spot as the mobile drawer
// opener), so the sidebar itself doesn't need a header row to host a control.
export const CourseOutlineToggle = () => {
  const { mounted, collapsed, setCollapsed } = useOutlineCollapsed();
  const showAsCollapsed = mounted && collapsed;

  return (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      className="mr-2 -ml-2 hidden p-2 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:ring-inset md:inline-flex"
      aria-label={showAsCollapsed ? 'Expand course outline' : 'Collapse course outline'}
      title={showAsCollapsed ? 'Show course outline' : 'Hide course outline'}
      data-testid="toggle-course-outline"
    >
      {showAsCollapsed ? (
        <PanelLeftOpen className="h-5 w-5" />
      ) : (
        <PanelLeftClose className="h-5 w-5" />
      )}
    </button>
  );
};

export const CourseOutlineSidebar = () => {
  const { mounted, collapsed } = useOutlineCollapsed();

  // The outline is available at every width from md (768px) upwards; below md
  // it lives in the drawer (handled in the layout).
  const isWide = useMediaQuery({ minWidth: 768 });

  const visibleClass = !mounted ? 'hidden md:block' : isWide && !collapsed ? 'block' : 'hidden';

  return (
    <div
      className={`${visibleClass} w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200 pl-4`}
      style={{ scrollbarWidth: 'none' }}
      data-testid="course-outline-sidebar"
    >
      <CourseOutline />
    </div>
  );
};
