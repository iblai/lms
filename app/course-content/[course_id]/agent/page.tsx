'use client';

import { useContext, useEffect } from 'react';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { CourseAgentChat } from '@/components/course-agent-chat';
import { useChatState } from '@/components/chat-button';

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

  return (
    <div
      className="flex h-full w-full flex-col p-6"
      style={{
        height: `calc(100vh - 100px - 62px - ${activeTab === 'agent' ? 60 : 0}px)`,
      }}
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
