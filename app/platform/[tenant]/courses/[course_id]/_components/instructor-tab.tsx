'use client';

import Image from 'next/image';
import { Plus, Minus, User, Briefcase, Building } from 'lucide-react';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { config } from '@/lib/config';

interface InstructorTabProps {
  course: any;
  expandedSections: Record<string, boolean>;
  toggleSection: (index: number | string) => void;
}

export function InstructorTab({ course, expandedSections, toggleSection }: InstructorTabProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-800">Instructors</h2>
      {(!course?.instructor_info?.instructors ||
        course.instructor_info.instructors.length === 0) && (
        <DefaultEmptyBox message="No instructor info available." />
      )}
      <div className="space-y-3">
        {course?.instructor_info?.instructors?.map((instructor: any, index: number) => (
          <div
            key={`instructor-${index}`}
            className="overflow-hidden rounded-md border border-gray-200"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
              onClick={() => toggleSection(`instructor-${index}`)}
            >
              <div className="flex items-center gap-3">
                {instructor.image ? (
                  <Image
                    src={config.urls.studio() + instructor.image}
                    alt={instructor.name || 'Instructor'}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-amber-100 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-100">
                    <User className="h-5 w-5 text-amber-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-800">
                    {instructor.name || 'Unknown Instructor'}
                  </h3>
                  {instructor.title && <p className="text-xs text-gray-500">{instructor.title}</p>}
                </div>
              </div>
              <div>
                {expandedSections[`instructor-${index}`] ? (
                  <Minus className="h-5 w-5 text-gray-400" />
                ) : (
                  <Plus className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {expandedSections[`instructor-${index}`] && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-6 md:flex-row">
                  {/* Instructor Image */}
                  <div className="flex-shrink-0">
                    {instructor.image ? (
                      <Image
                        src={config.urls.studio() + instructor.image}
                        alt={instructor.name || 'Instructor'}
                        width={120}
                        height={120}
                        className="rounded-full border-4 border-amber-100 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-amber-200 bg-amber-100">
                        <User className="h-12 w-12 text-amber-500" />
                      </div>
                    )}
                  </div>

                  {/* Instructor Details */}
                  <div className="flex-1 space-y-3">
                    {instructor.title && (
                      <div className="flex items-center text-gray-600">
                        <Briefcase className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-sm">{instructor.title}</span>
                      </div>
                    )}
                    {instructor.organization && (
                      <div className="flex items-center text-gray-600">
                        <Building className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-sm">{instructor.organization}</span>
                      </div>
                    )}

                    {instructor.bio && (
                      <div className="border-t border-gray-200 pt-3">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">About</h4>
                        <p className="text-sm leading-relaxed text-gray-600">{instructor.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
