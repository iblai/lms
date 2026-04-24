'use client';

import { useContext, useEffect } from 'react';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { CourseAgentChat } from '@/components/course-agent-chat';
import { useChatState } from '@/components/chat-button';
import { cn } from '@/lib/utils';

export default function AgentTab() {
  const { setActiveTab, activeTab } = useContext(EdxIframeContext);
  const { setMentorSidebarHidden } = useChatState();

  useEffect(() => {
    setActiveTab('agent');
    setMentorSidebarHidden(true);
    return () => {
      setMentorSidebarHidden(false);
    };
  }, []);

  // with this height, the agent chat will be full height of the screen minus the navbar and the course outline and no weird overflow happening
  return (
    <div
      className={cn(
        'flex w-full flex-col p-6',
        activeTab === 'agent' ? 'h-[calc(100vh-100px-62px-42px)]' : 'h-[calc(100vh-100px-62px)]',
      )}
    >
      <div style={{ display: 'none' }}>
        <EdxIframe />
      </div>
      <div className="min-h-0 flex-1">
        <CourseAgentChat />
      </div>
    </div>
  );
}
