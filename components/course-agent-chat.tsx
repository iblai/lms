'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
    <div className="h-full w-full">
      {React.createElement('mentor-ai', {
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
