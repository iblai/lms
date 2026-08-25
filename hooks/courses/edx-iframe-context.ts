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
  // True when the agent owns unit completion (tenant
  // `enable_agent_based_unit_completion` + course `enable_agent_based_completion`
  // + course `agent_content_mode` all on), so the edX unit must not complete
  // itself. Told to the edX iframe over postMessage.
  disableUnitAutoCompletion: boolean;
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
  disableUnitAutoCompletion: false,
  //setCourseOutline: () => {},
});
