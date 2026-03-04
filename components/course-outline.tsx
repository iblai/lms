import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { ChevronRight, Play, FileText, Clock } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useContext } from 'react';
import { SkeletonCourseOutline } from './skeleton-course-outline';

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
    <div
      className="overflow-y-auto h-full md:h-[calc(100%-35px)]"
      style={{ scrollbarWidth: 'none' }}
    >
      {courseOutlineLoading ? (
        <SkeletonMultiplier multiplier={8} Skeleton={SkeletonCourseOutline} />
      ) : (
        Array.isArray(courseOutline) &&
        courseOutline.map((module) => (
          <div key={module.id} className="border-b border-gray-200">
            <button
              onClick={() => toggleModule(module.id)}
              className={`w-full text-left p-3 flex items-center justify-between hover:bg-gray-50 ${
                expandedModule === module.id ? 'bg-gray-50' : ''
              }`}
            >
              <span className="text-sm font-medium text-gray-700">{module.display_name}</span>
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  expandedModule === module.id ? 'transform rotate-90' : ''
                }`}
              />
            </button>

            {expandedModule === module.id && module.children && (
              <div className="pl-6 pr-2 pb-2">
                {module.children.map((lesson) => (
                  <div key={lesson.id}>
                    <button
                      onClick={() => toggleLesson(lesson.id)}
                      className={`w-full text-left p-2 text-sm flex items-center justify-between rounded-sm mb-1 ${
                        currentChapter === lesson.id
                          ? 'bg-amber-50 text-amber-700'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center">
                        {(!lesson.children || lesson.children.length === 0) && (
                          <div className="mr-2 flex-shrink-0">
                            {lesson.type === 'html' && lesson.complete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : lesson.type === 'video' ? (
                              <Play className="h-4 w-4 text-gray-400" />
                            ) : lesson.type === 'document' ? (
                              <FileText className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        )}
                        <span
                          className={`${
                            lesson.type === 'html' && lesson.complete ? 'text-gray-500' : ''
                          }`}
                        >
                          {lesson.display_name}
                        </span>
                      </div>
                      {lesson.children && lesson.children.length > 0 && (
                        <ChevronRight
                          className={`h-4 w-4 text-gray-500 transition-transform ${
                            expandedLessons.includes(lesson.id) ? 'transform rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>

                    {lesson.children &&
                      lesson.children.length > 0 &&
                      expandedLessons.includes(lesson.id) && (
                        <div className="pl-6 pr-2 pb-2">
                          {lesson.children.map((sublesson) => (
                            <button
                              key={sublesson.id}
                              onClick={() => selectLesson(sublesson.id)}
                              className={`w-full text-left p-2 text-sm flex items-center rounded-sm mb-1 ${
                                currentLesson === sublesson.id
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'hover:bg-gray-50 text-gray-600'
                              }`}
                            >
                              <div className="mr-2 flex-shrink-0">
                                {sublesson.type === 'html' && sublesson.complete ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : sublesson.type === 'video' ? (
                                  <Play className="h-4 w-4 text-gray-400" />
                                ) : sublesson.type === 'document' ? (
                                  <FileText className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Clock className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <span
                                className={`${
                                  sublesson.type === 'html' && sublesson.complete
                                    ? 'text-gray-500'
                                    : ''
                                }`}
                              >
                                {sublesson.display_name}
                              </span>
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
