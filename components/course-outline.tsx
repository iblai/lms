import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { ChevronRight } from 'lucide-react';
import { useContext } from 'react';
import { SkeletonCourseOutline } from './skeleton-course-outline';
import { CourseOutlineChildNode } from '@/types/courses';

const MAX_CHECKMARK_POINT = 7;

const getCompletionRatio = (node: CourseOutlineChildNode): number => {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return node.complete ? 1 : 0;
  }
  const totalChildren = node.children.length;
  const completedScore = node.children.reduce((acc, child) => acc + getCompletionRatio(child), 0);
  return completedScore / totalChildren;
};

const getCompletionLevel = (node: CourseOutlineChildNode): number => {
  return Math.round(getCompletionRatio(node) * MAX_CHECKMARK_POINT);
};

const CompletionIcon = ({ node }: { node: CourseOutlineChildNode }) => {
  const level = getCompletionLevel(node);
  const size = 16;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = level / MAX_CHECKMARK_POINT;
  const dashOffset = circumference * (1 - progress);

  if (level === MAX_CHECKMARK_POINT) {
    // Fully complete - filled check circle
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="#3b82f6" stroke="none" />
        <path
          d="M5 8.5L7 10.5L11 6"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (level === 0) {
    // No progress - empty circle
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // Partial progress - arc circle
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

export const CourseOutline = () => {
  const {
    courseOutline,
    courseOutlineLoading,
    expandedModule,
    expandedLessons,
    selectLesson,
    toggleModule,
    toggleLesson,
    currentChapter,
    currentLesson,
  } = useContext(CourseOutlineContext);
  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {courseOutlineLoading ? (
        <SkeletonMultiplier multiplier={8} Skeleton={SkeletonCourseOutline} />
      ) : (
        Array.isArray(courseOutline?.children) &&
        courseOutline.children.map((module) => (
          <div key={module.id} className="border-b border-gray-200">
            <button
              onClick={() => toggleModule(module.id)}
              className={`flex w-full items-center justify-between p-3 text-left hover:bg-gray-50 ${
                expandedModule === module.id ? 'bg-gray-50' : ''
              }`}
            >
              <span className="text-sm font-medium text-gray-700">{module.display_name}</span>
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  expandedModule === module.id ? 'rotate-90 transform' : ''
                }`}
              />
            </button>

            {expandedModule === module.id && module.children && (
              <div className="pr-2 pb-2 pl-6">
                {module.children.map((lesson) => (
                  <div key={lesson.id}>
                    <button
                      onClick={() => toggleLesson(lesson.id)}
                      className={`mb-1 flex w-full items-center justify-between rounded-sm p-2 text-left text-sm ${
                        currentChapter === lesson.id
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="mr-2 flex-shrink-0">
                          <CompletionIcon node={lesson} />
                        </div>
                        <span>{lesson.display_name}</span>
                      </div>
                      {lesson.children && lesson.children.length > 0 && (
                        <ChevronRight
                          className={`h-4 w-4 text-gray-500 transition-transform ${
                            expandedLessons.includes(lesson.id) ? 'rotate-90 transform' : ''
                          }`}
                        />
                      )}
                    </button>

                    {lesson.children &&
                      lesson.children.length > 0 &&
                      expandedLessons.includes(lesson.id) && (
                        <div className="pr-2 pb-2 pl-6">
                          {lesson.children.map((sublesson) => (
                            <button
                              key={sublesson.id}
                              onClick={() => selectLesson(sublesson.id)}
                              className={`mb-1 flex w-full items-center rounded-sm p-2 text-left text-sm ${
                                currentLesson === sublesson.id
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className="mr-2 flex-shrink-0">
                                <CompletionIcon node={sublesson} />
                              </div>
                              <span>{sublesson.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
