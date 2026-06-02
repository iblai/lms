'use client';

import { Spinner } from '@/components/spinner';
import { getTenant, redirectToAuthSpa } from '@/utils/helpers';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CourseRedirect() {
  const router = useRouter();
  const params = useParams<{ course_id: string }>();

  useEffect(() => {
    const tenant = getTenant();
    const courseId = params?.course_id ?? '';
    if (tenant) {
      router.replace(`/platform/${tenant}/courses/${courseId}`);
    } else {
      redirectToAuthSpa();
    }
  }, [router, params?.course_id]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-14 w-14 text-[var(--primary)]" />
    </div>
  );
}
