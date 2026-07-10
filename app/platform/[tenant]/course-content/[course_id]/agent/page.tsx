'use client';

import { useContext, useEffect } from 'react';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { CourseAgentChat } from '@/components/course-agent-chat';
import { useChatState } from '@/components/chat-button';
import { cn } from '@/lib/utils';

export default function AgentTab() {
  const { setActiveTab, activeTab, agentMode } = useContext(EdxIframeContext);
  const { setMentorSidebarHidden } = useChatState();

  useEffect(() => {
    setActiveTab('agent');
    setMentorSidebarHidden(true);
    return () => {
      setMentorSidebarHidden(false);
    };
  }, []);

  const assessmentMode = agentMode === 'assessment';

  // with this height, the agent chat will be full height of the screen minus the navbar and the course outline and no weird overflow happening
  return (
    <div
      className={cn(
        'flex w-full flex-col px-6 pt-6',
        activeTab === 'agent' ? 'h-[calc(100vh-100px-62px-41px)]' : 'h-[calc(100vh-100px-62px)]',
      )}
    >
      <div className={cn(assessmentMode ? 'min-h-0 flex-1' : 'hidden')}>
        <EdxIframe />
      </div>
      <div className={cn(assessmentMode ? 'hidden' : 'min-h-0 flex-1')}>
        <CourseAgentChat />
      </div>
    </div>
  );
}
