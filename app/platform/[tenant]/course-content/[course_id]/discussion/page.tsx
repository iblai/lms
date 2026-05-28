'use client';

import type React from 'react';
import { useContext, useEffect } from 'react';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

export default function DiscussionTab() {
  const { setActiveTab } = useContext(EdxIframeContext);
  useEffect(() => {
    setActiveTab('forum');
  }, []);

  return <EdxIframe />;
}
