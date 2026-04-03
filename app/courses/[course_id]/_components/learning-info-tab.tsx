'use client';

import { CheckCircle } from 'lucide-react';
import { DefaultEmptyBox } from '@/components/default-empty-box';

interface LearningInfoTabProps {
  course: any;
}

export function LearningInfoTab({ course }: LearningInfoTabProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-800">What You&apos;ll Learn</h2>
      {(!course?.learning_info || course.learning_info.length === 0) && (
        <DefaultEmptyBox message="No learning info available." />
      )}
      <div className="space-y-3">
        {course?.learning_info?.map((item: string, index: number) => (
          <div
            key={`learning-info-${index}`}
            className="flex items-start rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="mt-0.5 mr-3 flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
