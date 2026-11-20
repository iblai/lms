'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setMentorAgentReady, setMentorSpinnerHidden } from '@/features/mentor';

/** The `<agent-ai>` element's host-facing surface the course pages rely on. */
export type CourseAgentElement = HTMLElement & { sendHostInfoToIframe?: () => void };

/** The mentor iframe inside the element's shadow root, once rendered. */
export const getCourseAgentIframe = (element: CourseAgentElement | null) =>
  (element?.shadowRoot?.querySelector('iframe') as HTMLIFrameElement | null) ?? null;

/**
 * Host-side wiring every course-page `<agent-ai>` needs, whichever mentor it
 * embeds: reports the agent ready and its spinner gone to the store (the
 * layout's autoplay and New-chat controls key on those) and forwards the
 * layout's autoplay toggle into the agent. Returns the ref for the element.
 */
export function useCourseAgentBridge(mentorInUse: string | null) {
  const mentorElementRef = useRef<CourseAgentElement | null>(null);
  const [spinnerHidden, setSpinnerHidden] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setMentorSpinnerHidden(spinnerHidden));
    return () => {
      dispatch(setMentorSpinnerHidden(false));
    };
  }, [spinnerHidden, dispatch]);

  // The agent SPA posts `{ ready: true }` to its parent once it can take
  // host messages; controls that drive it (e.g. autoplay) wait for that.
  useEffect(() => {
    if (!mentorInUse) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.ready !== true) return;
      const iframe = getCourseAgentIframe(mentorElementRef.current);
      if (!iframe || event.source !== iframe.contentWindow) return;
      console.log('[Agent Iframe loaded]: ', event?.data);
      dispatch(setMentorAgentReady(true));
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      dispatch(setMentorAgentReady(false));
    };
  }, [mentorInUse, dispatch]);

  useEffect(() => {
    const handleAutoplayChanged = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
      if (typeof enabled !== 'boolean') return;
      getCourseAgentIframe(mentorElementRef.current)?.contentWindow?.postMessage(
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

  return mentorElementRef;
}
