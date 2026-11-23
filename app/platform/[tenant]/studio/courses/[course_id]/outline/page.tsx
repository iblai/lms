'use client';

import { useParams } from 'next/navigation';
import { StudioFrame } from '@/components/studio/studio-frame';

export default function StudioCourseOutlinePage() {
  const params = useParams();
  return <StudioFrame courseId={decodeURIComponent(params.course_id as string)} />;
}
