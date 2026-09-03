'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import '@iblai/agent-ai';
import { useDispatch } from 'react-redux';
import { config } from '@/lib/config';
import { getUserId } from '@/utils/helpers';
import { useChatState } from '@/components/chat-button';
import { setMentorSpinnerHidden } from '@/features/mentor';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useDefaultMentor } from '@/hooks/use-default-mentor';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useEdxIframeLoaded } from '@/hooks/courses/use-edx-iframe-loaded';
import { useUnitAutoCompletion } from '@/hooks/courses/use-unit-auto-completion';
import { Spinner } from '@/components/spinner';
import type { CourseOutlineChildNode } from '@/types/courses';

export function CourseAgentChat() {
  const tenant = useTenantParam();
  const { courseMentor } = useChatState();
  // Shared with the chat launcher so both embed the same agent, and so a
  // course mentor arriving late supersedes an in-flight fallback lookup
  // instead of racing it.
  const { mentor: mentorInUse, isLoading } = useDefaultMentor({
    tenant,
    courseMentor,
    onError: () => toast.error('No mentors found'),
  });
  const [spinnerHidden, setSpinnerHidden] = useState(false);
  const mentorElementRef = useRef<HTMLElement | null>(null);
  const dispatch = useDispatch();
  const { course, currentUnitID } = useContext(CourseOutlineContext);
  const { courseID, activeTab, agentMode, courseOutline } = useContext(EdxIframeContext);
  // The agent reads the unit the (hidden) course iframe is showing, so mounting
  // it before that iframe has loaded both competes for the network on the tab's
  // heaviest moment and gives the agent a unit that isn't rendered yet. Latched
  // once true, so later unit switches never tear the mounted chat back down.
  const edxIframeLoaded = useEdxIframeLoaded();
  const { unitAutoCompletionDisabled } = useUnitAutoCompletion({
    course,
    activeTab,
    agentMode,
    tenant,
  });

  // The agent names the lesson it completes, so it needs the unit's title on
  // top of its ids. Matched on id alone: an outline that has not loaded yet —
  // or a unit id belonging to another course — must yield no name rather than
  // a confidently wrong one, so the agent completes an unnamed lesson instead
  // of the wrong one.
  const currentUnitDisplayName = useMemo(() => {
    if (!currentUnitID) return undefined;
    const findUnit = (node?: CourseOutlineChildNode): CourseOutlineChildNode | undefined => {
      if (!node) return undefined;
      if (node.id === currentUnitID) return node;
      for (const child of node.children ?? []) {
        const match = findUnit(child);
        if (match) return match;
      }
      return undefined;
    };
    return findUnit(courseOutline)?.display_name || undefined;
  }, [courseOutline, currentUnitID]);

  // With edX auto-completion off, the agent is the one that marks the unit
  // complete, so it needs the edX identifiers of what the learner is on, the
  // unit's name, and the switch that turns lesson completion on.
  const edxCompletionProps = unitAutoCompletionDisabled
    ? {
        edxCourseId: courseID || undefined,
        edxUsageId: currentUnitID || undefined,
        edxUserId: getUserId() ?? undefined,
        edxDisplayName: currentUnitDisplayName,
        enableLessonCompletion: true,
      }
    : {};

  useEffect(() => {
    dispatch(setMentorSpinnerHidden(spinnerHidden));
    return () => {
      dispatch(setMentorSpinnerHidden(false));
    };
  }, [spinnerHidden, dispatch]);

  useEffect(() => {
    const handleUnitSwitched = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (!message) return;
      const iframe = mentorElementRef.current?.shadowRoot?.querySelector(
        'iframe',
      ) as HTMLIFrameElement | null;
      iframe?.contentWindow?.postMessage({ type: 'MENTOR:CHAT_ACTION_ADD_MESSAGE', message }, '*');
    };
    window.addEventListener('mentor:unit-switched', handleUnitSwitched);
    return () => window.removeEventListener('mentor:unit-switched', handleUnitSwitched);
  }, []);

  useEffect(() => {
    const handleAutoplayChanged = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
      if (typeof enabled !== 'boolean') return;
      const iframe = mentorElementRef.current?.shadowRoot?.querySelector(
        'iframe',
      ) as HTMLIFrameElement | null;
      iframe?.contentWindow?.postMessage(
        {
          type: enabled
            ? 'MENTOR:ENABLE_AUTOPLAY_LAST_AI_MESSAGE'
            : 'MENTOR:DISABLE_AUTOPLAY_LAST_AI_MESSAGE',
        },
        '*',
      );
    };
    window.addEventListener('mentor:autoplay-changed', handleAutoplayChanged);
    return () => window.removeEventListener('mentor:autoplay-changed', handleAutoplayChanged);
  }, []);

  //TODO mutation observer to be removed once we able to have a READY postmessage from the iframe
  useEffect(() => {
    if (!mentorInUse) return;
    let observer: MutationObserver | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const attach = () => {
      const spinner = mentorElementRef.current?.shadowRoot?.querySelector(
        '#loading-spinner',
      ) as HTMLElement | null;
      if (!spinner) return false;
      const update = () => setSpinnerHidden(spinner.style.display === 'none');
      update();
      observer = new MutationObserver(update);
      observer.observe(spinner, { attributes: true, attributeFilter: ['style'] });
      return true;
    };

    if (!attach()) {
      intervalId = setInterval(() => {
        if (attach() && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 100);
    }

    return () => {
      observer?.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, [mentorInUse]);

  const handleNewChat = () => {
    const iframe = mentorElementRef.current?.shadowRoot?.querySelector(
      'iframe',
    ) as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage({ type: 'MENTOR:NEW_CHAT' }, '*');
  };

  if (isLoading || !edxIframeLoaded) {
    return <CourseAgentChatLoading />;
  }

  if (!mentorInUse) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
      {spinnerHidden && (
        <button
          type="button"
          onClick={handleNewChat}
          aria-label="New chat"
          className="absolute inset-[0px_0px_0px_-25px] z-10 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:inset-[0px_0px_0px_-19px]"
        >
          <SquarePen className="h-4 w-4" />
        </button>
      )}
      {React.createElement('agent-ai', {
        ref: mentorElementRef,
        mentorUrl: config.urls.mentor(),
        authUrl: config.urls.auth(),
        lmsUrl: config.urls.lms(),
        tenant: tenant,
        mentor: mentorInUse,
        contextOrigins: `${config.urls.lms()}`,
        authRelyOnHost: true,
        isContextAware: true,
        theme: 'light',
        style: { height: '100%', width: '100%' },
        extraparams: 'hide-sidebar=true&hide-navbar=true',
        ...edxCompletionProps,
      })}
    </div>
  );
}

// Stands in for the agent while the course iframe loads, so the tab shows the
// app's usual loading spinner rather than an empty panel.
function CourseAgentChatLoading() {
  return (
    <div
      role="status"
      aria-label="Loading course…"
      data-testid="course-agent-chat-loading"
      className="flex h-full w-full items-center justify-center bg-white"
    >
      <Spinner className="h-14 w-14" />
    </div>
  );
}
