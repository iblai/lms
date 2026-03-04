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
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="font-semibold text-gray-800 text-left">
            {course?.display_name}
          </SheetTitle>
        </SheetHeader>
        <CourseOutline />
      </SheetContent>
    </Sheet>
  );
}
