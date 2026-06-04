'use client';

import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useContext, useEffect } from 'react';

export default function ProgressTab() {
  // Mock course data
  const { setActiveTab } = useContext(EdxIframeContext);
  useEffect(() => {
    setActiveTab('progress');
  }, []);
  //const { data: course } = useGetCourseQuery(resolvedParams.course_id);

  return <EdxIframe />;
}
