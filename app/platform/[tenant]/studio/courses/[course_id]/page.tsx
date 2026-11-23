'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { studioCoursePath } from '@/utils/studio';

export default function StudioCoursePage() {
  const router = useRouter();
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);

  useEffect(() => {
    router.replace(studioCoursePath(tenant, courseId));
  }, [router, tenant, courseId]);

  return null;
}
