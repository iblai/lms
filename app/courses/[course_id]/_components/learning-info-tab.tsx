'use client';

import { CheckCircle } from 'lucide-react';
import { DefaultEmptyBox } from '@/components/default-empty-box';

interface LearningInfoTabProps {
  course: any;
}

export function LearningInfoTab({ course }: LearningInfoTabProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">What You&apos;ll Learn</h2>
      {(!course?.learning_info || course.learning_info.length === 0) && (
        <DefaultEmptyBox message="No learning info available." />
      )}
      <div className="space-y-3">
        {course?.learning_info?.map((item: string, index: number) => (
          <div
            key={`learning-info-${index}`}
            className="flex items-start p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              <CheckCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
