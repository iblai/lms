'use client';

import { useContext, useEffect } from 'react';
import { useParams, redirect } from 'next/navigation';
import { ItemMonetization } from '@iblai/iblai-js/web-containers';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useCourseUserRoles } from '@/hooks/courses/use-course-user-roles';
import { useCanSellItems } from '@/hooks/use-can-sell-items';
import { config } from '@/lib/config';

export default function MonetizationPage() {
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  const { course } = useContext(CourseOutlineContext);

  const { data: departmentMemberCheck, isSuccess } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  // Same audience as the other staff pages, narrowed to people who can sell.
  const { hasCourseStaffAccess, isResolved: rolesResolved } = useCourseUserRoles(courseId);
  const canSellItems = useCanSellItems(tenant);
  const canView =
    (departmentMemberCheck?.is_platform_admin === true || hasCourseStaffAccess) && canSellItems;

  useEffect(() => {
    if (isSuccess && rolesResolved && !canView) {
      redirect(`/platform/${tenant}`);
    }
  }, [tenant, isSuccess, rolesResolved, canView]);

  if (!canView) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <ItemMonetization
          platformKey={tenant}
          authURL={config.urls.auth()}
          itemType="course"
          itemId={courseId}
          itemName={course?.display_name}
        />
      </div>
    </div>
  );
}
