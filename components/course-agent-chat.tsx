'use client';

import React, { useContext, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import '@iblai/agent-ai';
import { config } from '@/lib/config';
import { getUserId } from '@/utils/helpers';
import { useChatState } from '@/components/chat-button';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useDefaultMentor } from '@/hooks/use-default-mentor';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import {
  getCourseAgentIframe,
  useCourseAgentBridge,
} from '@/hooks/courses/use-course-agent-bridge';
import {
  EDX_UNIT_LOADED_EVENT,
  requestEdxUnitContext,
  useEdxIframeLoaded,
} from '@/hooks/courses/use-edx-iframe-loaded';
import { useUnitAutoCompletion } from '@/hooks/courses/use-unit-auto-completion';
import { Spinner } from '@/components/spinner';
import { findOutlineNode } from '@/utils/assessment-mentor';

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
  const mentorElementRef = useCourseAgentBridge(mentorInUse);
  const { course, currentUnitID } = useContext(CourseOutlineContext);
  const { courseID, courseOutline } = useContext(EdxIframeContext);
  // The agent reads the unit the (hidden) course iframe is showing, so mounting
  // it before that iframe has loaded both competes for the network on the tab's
  // heaviest moment and gives the agent a unit that isn't rendered yet. Latched
  // once true, so later unit switches never tear the mounted chat back down.
  const edxIframeLoaded = useEdxIframeLoaded();
  const { unitAutoCompletionDisabled } = useUnitAutoCompletion({ course, tenant });

  // The agent names the lesson it completes, so it needs the unit's title on
  // top of its ids. Matched on id alone: an outline that has not loaded yet —
  // or a unit id belonging to another course — must yield no name rather than
  // a confidently wrong one, so the agent completes an unnamed lesson instead
  // of the wrong one.
  const currentUnitDisplayName = useMemo(() => {
    if (!currentUnitID) return undefined;
    return findOutlineNode(courseOutline, currentUnitID)?.display_name || undefined;
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

  // The embed stores the course iframe's `context` frame but only forwards it
  // to the mentor when the host URL changes — which, on a unit switch, happens
  // before the new unit's iframe exists, so the mentor sat one unit behind.
  // The iframe posts `context` before `unit.loaded`, so by the time the unit
  // reports loaded the fresh context is in the embed: push it across.
  useEffect(() => {
    const handleUnitLoaded = () => {
      mentorElementRef.current?.sendHostInfoToIframe?.();
    };
    window.addEventListener(EDX_UNIT_LOADED_EVENT, handleUnitLoaded);
    return () => window.removeEventListener(EDX_UNIT_LOADED_EVENT, handleUnitLoaded);
  }, [mentorElementRef]);

  // This chat mounts only once the course iframe has loaded, so the embed
  // missed that page's `context` frame. Ask the page to announce itself again
  // now that the embed is listening; its `unit.loaded` answer drives the push
  // above, and the embed also sends what it holds when the mentor loads.
  useEffect(() => {
    if (!mentorElementRef.current) return;
    requestEdxUnitContext();
  }, [mentorElementRef, mentorInUse, isLoading, edxIframeLoaded]);

  useEffect(() => {
    const handleUnitSwitched = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (!message) return;
      getCourseAgentIframe(mentorElementRef.current)?.contentWindow?.postMessage(
        { type: 'MENTOR:CHAT_ACTION_ADD_MESSAGE', message },
        '*',
      );
    };
    window.addEventListener('mentor:unit-switched', handleUnitSwitched);
    return () => window.removeEventListener('mentor:unit-switched', handleUnitSwitched);
  }, [mentorElementRef]);

  if (isLoading || !edxIframeLoaded) {
    return <CourseAgentChatLoading />;
  }

  if (!mentorInUse) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
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
        handleCreditExhaustion: true,
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
