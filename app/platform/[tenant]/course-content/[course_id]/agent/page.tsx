'use client';

import { useContext, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { useChatState } from '@/components/chat-button';
import { cn } from '@/lib/utils';

const CourseAgentChat = dynamic(
  () => import('@/components/course-agent-chat').then((m) => m.CourseAgentChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    ),
  },
);

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
        'flex w-full flex-col px-6 pt-6 pb-0',
        activeTab === 'agent' ? 'h-[calc(100vh-203px)]' : 'h-[calc(100vh-162px)]',
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
