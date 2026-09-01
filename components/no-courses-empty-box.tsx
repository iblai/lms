'use client';

import Image from 'next/image';
import { Mail } from 'lucide-react';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useCanCreateCourse } from '@/components/course-creation-access-guard';
import { CreateCourseButton } from '@/components/create-course-button';

/**
 * Empty state for course lists (home Explore rail, Discover page). Course
 * creators get a CTA into the course-creation modal; everyone else gets a
 * mailto CTA to the tenant support email. Neutral (no CTA) until the
 * admin/RBAC state has resolved so the wrong CTA never flashes.
 */
export function NoCoursesEmptyBox({ className = '' }: { className?: string }) {
  const tenant = useTenantParam();
  const { canCreateCourse, resolved } = useCanCreateCourse();
  const { getSupportEmail } = useTenantMetadata({ org: tenant });
  const supportEmail = getSupportEmail() || config.settings.supportEmail();

  return (
    <div className={`rounded-lg border border-gray-200 p-12 ${className}`}>
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center">
          <Image
            src="/images/empty-data-icon.svg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10"
          />
        </div>
        {!resolved ? (
          <p className="text-gray-600">No courses available.</p>
        ) : canCreateCourse ? (
          <>
            <p className="text-gray-600">No courses available yet.</p>
            <p className="text-sm text-gray-500">Create the first course for your platform.</p>
            <div className="mt-4">
              <CreateCourseButton />
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600">No courses have been created yet.</p>
            <p className="text-sm text-gray-500">
              Please check back later, or reach out to the support team.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Contact Support
            </a>
          </>
        )}
      </div>
    </div>
  );
}
