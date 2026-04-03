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
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="border-b border-gray-200 p-4">
          <SheetTitle className="text-left font-semibold text-gray-800">
            {course?.display_name}
          </SheetTitle>
        </SheetHeader>
        <CourseOutline />
      </SheetContent>
    </Sheet>
  );
}
