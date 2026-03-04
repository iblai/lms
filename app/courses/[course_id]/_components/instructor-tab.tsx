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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Instructors</h2>
      {(!course?.instructor_info?.instructors ||
        course.instructor_info.instructors.length === 0) && (
        <DefaultEmptyBox message="No instructor info available." />
      )}
      <div className="space-y-3">
        {course?.instructor_info?.instructors?.map((instructor: any, index: number) => (
          <div
            key={`instructor-${index}`}
            className="border border-gray-200 rounded-md overflow-hidden"
          >
            <div
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection(`instructor-${index}`)}
            >
              <div className="flex items-center gap-3">
                {instructor.image ? (
                  <Image
                    src={config.urls.studio() + instructor.image}
                    alt={instructor.name || 'Instructor'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border-2 border-amber-100"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-200">
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
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Instructor Image */}
                  <div className="flex-shrink-0">
                    {instructor.image ? (
                      <Image
                        src={config.urls.studio() + instructor.image}
                        alt={instructor.name || 'Instructor'}
                        width={120}
                        height={120}
                        className="rounded-full object-cover border-4 border-amber-100"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-200">
                        <User className="h-12 w-12 text-amber-500" />
                      </div>
                    )}
                  </div>

                  {/* Instructor Details */}
                  <div className="flex-1 space-y-3">
                    {instructor.title && (
                      <div className="flex items-center text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-sm">{instructor.title}</span>
                      </div>
                    )}
                    {instructor.organization && (
                      <div className="flex items-center text-gray-600">
                        <Building className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-sm">{instructor.organization}</span>
                      </div>
                    )}

                    {instructor.bio && (
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{instructor.bio}</p>
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
