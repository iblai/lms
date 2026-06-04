'use client';

import { useEffect, useContext } from 'react';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
export default function CourseTab() {
  const { setActiveTab } = useContext(EdxIframeContext);
  useEffect(() => {
    setActiveTab('course');
  }, []);

  return <EdxIframe />;
}
