'use client';

import { SkeletonCourseAccessBtn } from '@/components/skeleton-course-access-btn';
import { useCourseDetailContext } from '@/hooks/courses/course-detail-context';

/** Enroll / access CTA. Interactive (eligibility + action come from context). */
export function CourseCta() {
  const { courseEligibility, courseEligibilityLoading, courseButtonActionLoading } =
    useCourseDetailContext();

  if (courseEligibilityLoading || courseButtonActionLoading) {
    return <SkeletonCourseAccessBtn />;
  }

  return (
    <button
      onClick={courseEligibility.btn_action}
      className="w-full rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] py-3 font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
      disabled={courseEligibility.disabled}
    >
      {courseEligibility.btn_label}
    </button>
  );
}
