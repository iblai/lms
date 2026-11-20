import { CourseOutlineChildNode, MentorXblockOutlineNode } from '@/types/courses';
// @ts-ignore
import { ExamInfo } from '@iblai/iblai-js/data-layer';
import { createContext } from 'react';

export type AgentMode = 'learning' | 'assessment';

export const EdxIframeContext = createContext<{
  iframeUrl: string;
  setIframeUrl: (url: string) => void;
  courseOutline: CourseOutlineChildNode;
  /** Derived from the route by the course-content layout — read-only for consumers. */
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
  // The current unit's mentor xblock as the course outline lists it, for the
  // agent tab to embed directly. Null when the unit has none, or when the
  // course was published before the outline carried the xblock's type: an
  // assessment unit then still goes through the edX iframe.
  assessmentMentor: MentorXblockOutlineNode | null;
  //setCourseOutline: (outline:CourseOutlineChildNode[]) => void;
}>({
  iframeUrl: '',
  setIframeUrl: () => {},
  courseOutline: {} as CourseOutlineChildNode,
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
  assessmentMentor: null,
  //setCourseOutline: () => {},
});
