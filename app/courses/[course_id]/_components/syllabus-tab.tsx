'use client';

import { Plus, Minus, Play } from 'lucide-react';
import _ from 'lodash';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { SkeletonCourseSyllabus } from '@/components/skeleton-course-syllabus';

interface SyllabusTabProps {
  courseOutline: any;
  courseOutlineLoading: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (index: number | string) => void;
  handleOpenLesson: (lessonId: string | null, shouldOpen: boolean) => void;
}

export function SyllabusTab({
  courseOutline,
  courseOutlineLoading,
  expandedSections,
  toggleSection,
  handleOpenLesson,
}: SyllabusTabProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-800">Syllabus</h2>
      {!courseOutlineLoading &&
        (!courseOutline?.children || courseOutline.children.length === 0) && (
          <DefaultEmptyBox message="No course syllabus found." />
        )}
      <div className="space-y-3">
        {courseOutlineLoading && (
          <SkeletonMultiplier multiplier={6} Skeleton={SkeletonCourseSyllabus} />
        )}
        {(courseOutline?.children || []).map((section: any, index: number) => (
          <div
            key={`${section.id}-${index}`}
            className="overflow-hidden rounded-md border border-gray-200"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
              onClick={() => toggleSection(index)}
            >
              <h3 className="font-medium text-gray-800">{section.display_name}</h3>
              <div>
                {expandedSections[index] ? (
                  <Minus className="h-5 w-5 text-gray-400" />
                ) : (
                  <Plus className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {expandedSections[index] && (
              <div className="border-t border-gray-200">
                {section.children?.map((lesson: any, lessonIndex: number) => (
                  <div
                    onClick={
                      !_.isEmpty(lesson?.children)
                        ? () => handleOpenLesson(lesson?.children?.[0]?.id || null, true)
                        : () => {}
                    }
                    key={`${section.id}-${lesson.id}-${lessonIndex}`}
                    className="flex cursor-pointer items-center border-b border-gray-100 p-4 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="mr-3 text-amber-500">
                      <Play className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{lesson.display_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
