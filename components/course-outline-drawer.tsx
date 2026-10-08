'use client';

import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useContext } from 'react';
import { CourseOutline } from './course-outline';

export function CourseOutlineDrawer() {
  const { course, courseOutlineDrawerOpen, setCourseOutlineDrawerOpen } =
    useContext(CourseOutlineContext);

  return (
    <Sheet open={courseOutlineDrawerOpen} onOpenChange={setCourseOutlineDrawerOpen}>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col gap-0 p-0">
        <SheetHeader className="border-b border-gray-200 px-4 py-3 pr-12">
          <SheetTitle className="truncate text-left text-sm font-semibold text-gray-900">
            {course?.display_name}
          </SheetTitle>
        </SheetHeader>
        <CourseOutline />
      </SheetContent>
    </Sheet>
  );
}
