'use client';

import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useContext, useEffect } from 'react';

export default function DatesTab() {
  const { setActiveTab } = useContext(EdxIframeContext);
  useEffect(() => {
    setActiveTab('dates');
  }, []);

  return <EdxIframe />;
}
