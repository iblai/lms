'use client';

import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useContext, useEffect } from 'react';

export default function BookmarksTab() {
  const { setActiveTab } = useContext(EdxIframeContext);
  useEffect(() => {
    setActiveTab('bookmarks');
  }, []);

  return <EdxIframe />;
}
