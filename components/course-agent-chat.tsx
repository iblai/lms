'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, SquarePen } from 'lucide-react';
import _ from 'lodash';
import { toast } from 'sonner';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
// @ts-ignore
import { useLazyGetMentorsQuery } from '@iblai/iblai-js/data-layer';
import '@iblai/iblai-web-mentor';
import { config } from '@/lib/config';
import { getTenant, getUserName } from '@/utils/helpers';
import { useChatState } from '@/components/chat-button';

export function CourseAgentChat() {
  const DEFAULT_MENTOR_NAME = config.settings.defaultEmbeddedMentorName();
  const { courseMentor } = useChatState();
  const { getEmbeddedMentorToUse, metadataLoaded } = useTenantMetadata({ org: getTenant() });
  const [getMentors, { isLoading, isFetching }] = useLazyGetMentorsQuery();
  const [mentorInUse, setMentorInUse] = useState<string | null>(null);
  const [spinnerHidden, setSpinnerHidden] = useState(false);
  const mentorElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const resolveMentor = async () => {
      if (courseMentor) {
        setMentorInUse(courseMentor);
        return;
      }
      if (!metadataLoaded) return;
      const embeddedMentor = getEmbeddedMentorToUse();
      if (embeddedMentor) {
        setMentorInUse(embeddedMentor?.unique_id);
        return;
      }
      try {
        const response = await getMentors({
          org: getTenant(),
          username: getUserName(),
          query: DEFAULT_MENTOR_NAME,
        });
        if (_.isEmpty(response?.data?.results)) {
          throw new Error('No mentors found');
        }
        const mentor =
          (
            response?.data?.results.find((item: any) => item?.metadata?.default) ||
            response?.data?.results[0]
          )?.unique_id || null;
        if (!mentor) {
          throw new Error('No mentors found');
        }
        setMentorInUse(mentor);
      } catch {
        setMentorInUse(null);
        toast.error('No mentors found');
      }
    };
    resolveMentor();
  }, [metadataLoaded, courseMentor]);

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

  if (isLoading || isFetching || !metadataLoaded) {
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
        tenant: getTenant(),
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
