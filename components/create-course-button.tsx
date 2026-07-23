'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanCreateCourse } from '@/components/course-creation-access-guard';
import { CourseCreationModal } from '@/components/course-creation/course-creation-modal';

/** Admin-only entry point to the course-creation modal. */
export function CreateCourseButton() {
  const { canCreateCourse } = useCanCreateCourse();
  const [open, setOpen] = useState(false);

  if (!canCreateCourse) return null;

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Course
      </Button>
      <CourseCreationModal open={open} onOpenChange={setOpen} />
    </>
  );
}
