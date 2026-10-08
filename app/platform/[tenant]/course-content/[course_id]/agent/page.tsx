'use client';

import { useContext, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Minimize2 } from 'lucide-react';
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
  const { agentMode, agentFullscreen, setAgentFullscreen } = useContext(EdxIframeContext);
  const { setMentorSidebarHidden } = useChatState();

  useEffect(() => {
    setMentorSidebarHidden(true);
    return () => {
      setMentorSidebarHidden(false);
    };
  }, []);

  const assessmentMode = agentMode === 'assessment';

  // Fills the layout's content area (a definite-height flex item), so the chat
  // always ends exactly at the footer however tall the course header is.
  return (
    <div
      className={cn(
        '@container relative flex w-full flex-col',
        agentFullscreen
          ? 'fixed inset-0 z-50 h-screen bg-white p-4'
          : // Same horizontal padding as the course header so the chat's edges
            // line up with the tab track and the Manage button.
            'h-full px-3 pt-4 pb-0 md:px-4',
      )}
    >
      {agentFullscreen && (
        <button
          type="button"
          onClick={() => setAgentFullscreen(false)}
          aria-label="Exit fullscreen"
          title="Exit fullscreen"
          data-testid="agent-fullscreen-exit"
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg ring-1 ring-gray-200 transition-colors hover:text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      )}
      {/* Kept mounted and laid out when not in assessment mode — `invisible` instead of
          `hidden` so the iframe keeps its rendering box (display:none makes browsers drop
          the iframe's layout/paint state). Pulled out of flow so it doesn't take space
          from the chat below. */}
      <div
        className={cn(
          'flex min-h-0 flex-col',
          assessmentMode
            ? 'flex-1'
            : 'pointer-events-none invisible absolute inset-0 overflow-hidden',
        )}
        aria-hidden={!assessmentMode}
      >
        <EdxIframe />
      </div>
      {/* The mentor page pads its own chat card (`px-1 md:px-4`, judged on the
          iframe's width, which is this container's). Pull the iframe out by
          the same amount so the card's edges land on ours — flush with the tab
          track and the Manage button. */}
      <div className={cn(assessmentMode ? 'hidden' : '-mx-1 min-h-0 flex-1 @3xl:-mx-4')}>
        <CourseAgentChat />
      </div>
    </div>
  );
}
