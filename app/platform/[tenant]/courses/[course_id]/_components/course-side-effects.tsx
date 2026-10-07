'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import isEmpty from 'lodash/isEmpty';
import { useCourseDetailContext } from '@/hooks/courses/course-detail-context';
import { useChatState } from '@/components/chat-button';

/**
 * Headless client island for the course page's side effects: wiring the course
 * mentor into the chat sidebar, kicking off the syllabus fetch once the course
 * loads, and auto-firing the CTA when the user returns from auth with
 * `?trigger_cta=1`. Renders nothing.
 */
export function CourseSideEffects() {
  const { setCourseMentor, setMentorSidebarHidden } = useChatState();
  const {
    handleFetchCourseSyllabus,
    course,
    courseEligibility,
    courseEligibilityLoading,
    courseEligibilityFetched,
    courseButtonActionLoading,
    courseInfoLoadingState,
    userLoggedIn,
  } = useCourseDetailContext();

  const searchParams = useSearchParams();
  const ctaAutoTriggeredRef = useRef(false);

  useEffect(() => {
    if (ctaAutoTriggeredRef.current) return;
    if (searchParams.get('trigger_cta') !== '1') return;
    if (!userLoggedIn) return;
    if (courseInfoLoadingState !== 'successful') return;
    if (!courseEligibilityFetched) return;
    if (courseEligibilityLoading || courseButtonActionLoading) return;
    if (!courseEligibility?.btn_action || courseEligibility.disabled) return;

    ctaAutoTriggeredRef.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete('trigger_cta');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    courseEligibility.btn_action();
  }, [
    searchParams,
    userLoggedIn,
    courseInfoLoadingState,
    courseEligibilityFetched,
    courseEligibilityLoading,
    courseButtonActionLoading,
    courseEligibility,
  ]);

  useEffect(() => {
    if (!isEmpty(course)) {
      if (!course?.mentor_hidden) {
        setCourseMentor(course?.mentor_uuid || null);
      } else {
        setMentorSidebarHidden(true);
      }
      handleFetchCourseSyllabus();
    }
  }, [course]);

  return null;
}
