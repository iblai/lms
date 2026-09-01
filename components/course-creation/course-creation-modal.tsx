'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CourseCreationForm } from '@/components/course-creation/course-creation-form';

interface CourseCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Course creation as a modal (mirrors the create-pathway modal chrome).
 * Radix unmounts the content on close, so every open starts a fresh form —
 * same as the old dedicated page did on navigation.
 */
export function CourseCreationModal({ open, onOpenChange }: CourseCreationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-0 overflow-hidden rounded-lg bg-white p-0 [&>button:last-child]:hidden"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <DialogTitle className="text-lg font-medium text-gray-600">Create Course</DialogTitle>
        </div>
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <CourseCreationForm onCancel={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
