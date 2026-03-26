'use client';

import { createContext } from 'react';
import { CourseEdxData, CourseOutlineChildNode } from '@/types/courses';

export interface CourseOutlineContextType {
  courseOutline: CourseOutlineChildNode[];
  courseOutlineLoading: boolean;
  expandedModule: string;
  expandedLessons: string[];
  selectLesson: (lessonId: string) => void;
  toggleModule: (moduleId: string) => void;
  toggleLesson: (lessonId: string) => void;
  currentChapter: string;
  currentLesson: string;
  course: CourseEdxData | null;
  courseOutlineDrawerOpen: boolean;
  setCourseOutlineDrawerOpen: (open: boolean) => void;
  currentUnitID: string | null;
  refetchCourseOutline: (setLoadingState: boolean) => void;
}

export const CourseOutlineContext = createContext<CourseOutlineContextType>({
  courseOutline: [],
  courseOutlineLoading: false,
  expandedModule: '',
  expandedLessons: [],
  selectLesson: () => {},
  toggleModule: () => {},
  toggleLesson: () => {},
  currentChapter: '',
  currentLesson: '',
  course: null,
  courseOutlineDrawerOpen: false,
  setCourseOutlineDrawerOpen: () => {},
  currentUnitID: null,
  refetchCourseOutline: () => {},
});
