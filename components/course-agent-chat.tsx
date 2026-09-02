'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import '@iblai/agent-ai';
import { useDispatch } from 'react-redux';
import { config } from '@/lib/config';
import { useChatState } from '@/components/chat-button';
import { setMentorSpinnerHidden } from '@/features/mentor';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useDefaultMentor } from '@/hooks/use-default-mentor';

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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
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
      })}
    </div>
  );
}
