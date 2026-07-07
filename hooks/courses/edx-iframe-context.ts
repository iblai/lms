import { CourseOutlineChildNode } from '@/types/courses';
// @ts-ignore
import { ExamInfo } from '@iblai/iblai-js/data-layer';
import { createContext } from 'react';

export type AgentMode = 'learning' | 'assessment';

export const EdxIframeContext = createContext<{
  iframeUrl: string;
  setIframeUrl: (url: string) => void;
  courseOutline: CourseOutlineChildNode;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  courseID: string;
  currentlyInExamSubsection: boolean;
  setCurrentlyInExamSubsection: (examSubsection: boolean) => void;
  examInfo: ExamInfo | null;
  setExamInfo: (examInfo: ExamInfo | null) => void;
  refresher: Date | null;
  setRefresher: (refresher: Date) => void;
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  agentFullscreen: boolean;
  setAgentFullscreen: (fullscreen: boolean) => void;
  //setCourseOutline: (outline:CourseOutlineChildNode[]) => void;
}>({
  iframeUrl: '',
  setIframeUrl: () => {},
  courseOutline: {} as CourseOutlineChildNode,
  setActiveTab: () => {},
  activeTab: '',
  courseID: '',
  currentlyInExamSubsection: false,
  setCurrentlyInExamSubsection: () => {},
  examInfo: null,
  setExamInfo: () => {},
  refresher: null,
  setRefresher: () => {},
  agentMode: 'learning',
  setAgentMode: () => {},
  agentFullscreen: false,
  setAgentFullscreen: () => {},
  //setCourseOutline: () => {},
});
