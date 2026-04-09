'use client';

import type React from 'react';
import { use } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
// @ts-ignore
import { CourseContentLayout as SharedCourseContentLayout } from '@iblai/iblai-js/web-containers/next';
// @ts-ignore
import { useGetDepartmentMemberCheckQuery } from '@iblai/iblai-js/data-layer';

import { config } from '@/lib/config';
import { getTenant } from '@/utils/helpers';
import { useChatState } from '@/components/chat-button';

export default function CourseContentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ course_id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = decodeURIComponent(resolvedParams.course_id);
  const router = useRouter();
  const { setCourseMentor } = useChatState();

  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });

  return (
    <SharedCourseContentLayout
      courseId={courseId}
      isPlatformAdmin={!!departmentMemberCheck?.is_platform_admin}
      currentTenant={getTenant()}
      dmUrl={config.urls.dm()}
      courseEligibilityEnabled={config.settings.courseEligibilityEnabled()}
      tabHrefTemplate={({ courseId: cid, tab }: { courseId: string; tab: string }) =>
        `/course-content/${cid}/${tab === 'forum' ? 'discussion' : tab}`
      }
      onUnauthorized={() => router.push('/error/403')}
      onNotFound={() => router.push('/error/404')}
      onNavigate={(href: string, opts?: { external?: boolean }) =>
        opts?.external ? window.location.assign(href) : router.push(href)
      }
      onError={(msg: string) => toast.error(msg)}
      onSuccess={(msg: string) => toast.success(msg)}
      onCourseMentorChange={setCourseMentor}
    >
      {children}
    </SharedCourseContentLayout>
  );
}
