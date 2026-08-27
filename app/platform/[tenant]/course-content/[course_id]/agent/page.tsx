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

  // with this height, the agent chat will be full height of the screen minus the navbar and the course outline and no weird overflow happening
  return (
    <div
      className={cn(
        'relative flex w-full flex-col',
        agentFullscreen
          ? 'fixed inset-0 z-50 h-screen bg-white p-4'
          : // The layout derives the active tab from the route, so this page only ever
            // renders on /agent — one fixed height, no transitional value to flash through.
            'h-[calc(100vh-223px)] px-6 pt-6 pb-0',
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
          'min-h-0',
          assessmentMode
            ? 'flex-1'
            : 'pointer-events-none invisible absolute inset-0 overflow-hidden',
        )}
        aria-hidden={!assessmentMode}
      >
        <EdxIframe />
      </div>
      <div className={cn(assessmentMode ? 'hidden' : 'min-h-0 flex-1')}>
        <CourseAgentChat />
      </div>
    </div>
  );
}
