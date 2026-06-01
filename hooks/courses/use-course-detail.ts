import { useEffect, useState } from 'react';
import { useCourseMetadata } from '@/hooks/courses/use-course-metadata';
import {
  CourseCompletion,
  CourseEdxData,
  CourseOutlineChildNode,
  CourseOutlineResponse,
  CourseProgress,
} from '@/types/courses';
import _ from 'lodash';
import { getTenant, getUserName, handleNotLoggedInAction, inIframe } from '@/utils/helpers';
import { config } from '@/lib/config';
import dayjs from 'dayjs';
import {
  useCreateCourseEnrollmentMutation,
  useLazyGetCourseCompletionQuery,
  useLazyGetCourseProgressQuery,
} from '@/services/course-metadata';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
//@ts-ignore
import {
  useCreateStripeCheckoutSessionMutation,
  useLazyCheckAccessQuery,
} from '@iblai/iblai-js/data-layer';
import {
  isLoggedIn,
  setAccessCheckResponse,
  setDisplayMonetizationCheckoutModal,
} from '@iblai/iblai-js/web-utils';

import { useDispatch } from 'react-redux';
import { useCurrentTenant } from '@/utils/localstorage';
import { useTenantParam } from '../use-tenant-param';

export type CourseInfoLoadingState = 'not-started' | 'loading' | 'successful' | 'failure';

interface CourseEligibility {
  btn_label: string;
  btn_action: () => void;
  disabled?: boolean;
}

export const useCourseDetail = (rawCourseId: string) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const tenant = useTenantParam();
  const { currentTenant } = useCurrentTenant();
  // Some auth-SPA redirects send the user back with `+` characters in the course
  // id decoded to spaces (which the browser shows as %20). Normalize back to `+`
  // so all internal lookups use the canonical course id format.
  const courseId = rawCourseId.replace(/ /g, '+');

  useEffect(() => {
    if (courseId === rawCourseId || typeof window === 'undefined') return;
    const updatedPathname = window.location.pathname.replace(/%20/g, '+');
    if (updatedPathname !== window.location.pathname) {
      window.history.replaceState(
        null,
        '',
        `${updatedPathname}${window.location.search}${window.location.hash}`,
      );
    }
  }, [rawCourseId, courseId]);
  const ACCESS_COURSE_LABEL = 'Access Course';
  const ENROLL_NOW_LABEL = 'Enroll Now';
  const REQUEST_ACCESS_LABEL = 'Request Access';
  const ENROLL_NOW_COURSE_STARTING_SOON_LABEL = 'Enroll Now - Course Starting Soon';
  const REQUEST_ACCESS_COURSE_STARTING_SOON_LABEL = 'Request Access - Course Starting Soon';
  const INVITATION_ONLY_LABEL = 'Invitation Only';
  const BUY_NOW_LABEL = 'Buy Now';
  const PURCHASE_NOW_LABEL = 'Purchase Now';
  const [createCourseEnrollment, { isError: isCourseEnrollmentError }] =
    useCreateCourseEnrollmentMutation();
  const [createStripeCheckoutSession] = useCreateStripeCheckoutSessionMutation();
  const [
    getCourseProgress,
    { isLoading: isCourseProgressLoading, isError: isCourseProgressError },
  ] = useLazyGetCourseProgressQuery();
  const [
    getCourseCompletion,
    { isLoading: isCourseCompletionLoading, isError: isCourseCompletionError },
  ] = useLazyGetCourseCompletionQuery();
  const {
    handleFetchCourseMetaData,
    handleFetchCourseCompletionOutlines,
    handleFetchCourseEligibility,
  } = useCourseMetadata();
  const [checkAccess] = useLazyCheckAccessQuery();
  const [courseInfoLoadingState, setCourseInfoLoadingState] =
    useState<CourseInfoLoadingState>('not-started');
  const [course, setCourse] = useState<CourseEdxData | null>(null);
  const [courseOutline, setCourseOutline] = useState<CourseOutlineChildNode>(
    {} as CourseOutlineChildNode,
  );
  const [courseOutlineLoading, setCourseOutlineLoading] = useState(false);
  const [courseEligibilityLoading, setCourseEligibilityLoading] = useState(false);
  // Flips to `true` the first time `handleFetchCourseEligibilityInfo` settles.
  // `courseEligibilityLoading` alone isn't sufficient — it's `false` both before
  // the fetch starts and after it finishes, so consumers (e.g. the `trigger_cta`
  // auto-click) need a positive "has-fetched" signal to avoid acting on the
  // initial default eligibility.
  const [courseEligibilityFetched, setCourseEligibilityFetched] = useState(false);
  const [courseButtonActionLoading, setCourseButtonActionLoading] = useState(false);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [courseCompletion, setCourseCompletion] = useState<CourseCompletion | null>(null);
  const [courseGradingPolicyActive, setCourseGradingPolicyActive] = useState(false);

  const userLoggedIn = isLoggedIn();

  const triggerNotLoggedInAction = () => handleNotLoggedInAction(tenant);

  const applyEligibility = (eligibility: CourseEligibility) => {
    setCourseEligibility({
      ...eligibility,
      btn_action: userLoggedIn ? eligibility.btn_action : triggerNotLoggedInAction,
    });
  };

  const handleRequestAccess = () => {
    console.log('Request Access');
  };

  const handleSelfEnrollToCourse = () => {
    console.log('Self Enroll to Course');
  };

  const handleAccessCourse = () => {
    const defaultTab = course?.agent_content_mode === true ? 'agent' : 'course';
    const url = `/platform/${tenant}/course-content/${courseId}/${defaultTab}`;
    if (inIframe()) {
      window.open(url, '_blank');
    } else {
      router.push(url);
    }
  };

  const handleCreateCheckoutSession = async () => {
    setCourseButtonActionLoading(true);
    const currentTenant = getTenant();
    try {
      const checkoutSession = await createStripeCheckoutSession({
        sku: courseId,
        org: course?.org || '',
        tenant: course?.platform_key || currentTenant,
        username: getUserName(),
        mode: 'payment',
        cancel_url: window.location.href,
        success_url: `${config.urls.dm()}/api/service/orgs/${course?.platform_key}/stripe/course-payment-callback/`,
      }).unwrap();
      if (!checkoutSession?.redirect_to) {
        throw new Error('Failed to create checkout session');
      } else {
        toast.success('Redirecting to checkout page...');
        window.location.href = checkoutSession.redirect_to;
      }
    } catch (error) {
      setCourseButtonActionLoading(false);
      toast.error('Failed to create checkout session');
    }
  };

  const handleEnrollToCourse = async () => {
    setCourseButtonActionLoading(true);
    try {
      const response = await createCourseEnrollment({
        course_details: {
          course_id: courseId,
        },
      });
      if (isCourseEnrollmentError || !response.data || !response.data.created) {
        throw new Error('Failed to enroll in course');
      }
      toast.success('Enrolled in course successfully');
      setCourseButtonActionLoading(false);
      handleAccessCourse();
    } catch (error) {
      toast.error('Failed to enroll in course.');
      setCourseButtonActionLoading(false);
    }
  };
  const [courseEligibility, setCourseEligibility] = useState<CourseEligibility>({
    btn_label: ENROLL_NOW_LABEL,
    btn_action: userLoggedIn ? handleEnrollToCourse : triggerNotLoggedInAction,
  });

  const handleOpenMonetizationCheckoutModal = () => {
    dispatch(setDisplayMonetizationCheckoutModal(true));
  };

  const handleCheckCourseMonetizationAccess = async (
    onComplete: (result: { hasAccess: boolean }) => void,
  ) => {
    if (!currentTenant?.enable_monetization) {
      onComplete({ hasAccess: true });
      return;
    }
    try {
      const result = await checkAccess({
        item_type: 'course',
        item_id: courseId,
        platform_key: getTenant(),
      });
      const data = result?.data;
      dispatch(setAccessCheckResponse(data));
      onComplete({ hasAccess: !!data?.has_access });
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };

  const handleFetchCourseEligibilityInfo = async () => {
    setCourseEligibilityLoading(true);
    setCourseEligibilityFetched(false);
    // Monetization access supersedes other eligibility rules — if the user
    // doesn't have monetization access, show Purchase Now and stop.
    let hasMonetizationAccess = true;
    await handleCheckCourseMonetizationAccess((result) => {
      hasMonetizationAccess = result.hasAccess;
    });
    if (!hasMonetizationAccess) {
      applyEligibility({
        btn_label: PURCHASE_NOW_LABEL,
        btn_action: () => handleOpenMonetizationCheckoutModal(),
      });
      setCourseEligibilityLoading(false);
      setCourseEligibilityFetched(true);
      return;
    }

    const courseEligibility = await handleFetchCourseEligibility(courseId);
    if (!_.isEmpty(courseEligibility)) {
      const enrollmentStarted = dayjs(course?.enrollment_start).diff(dayjs(), 'seconds') > 0;
      const isEnrolled = courseEligibility.is_enrolled;
      const canEnroll = courseEligibility.can_enroll;
      const isEligible = courseEligibility?.is_eligible;
      const isNotMainTenant = getTenant() !== 'main';
      const invitationOnly = courseEligibility.invitation_only;
      const coursePrice = course?.course_price;
      if (config.settings.courseEligibilityEnabled()) {
        if (isNotMainTenant && isEnrolled && enrollmentStarted && isEligible) {
          applyEligibility({
            btn_label: ACCESS_COURSE_LABEL,
            btn_action: handleAccessCourse,
          });
        } else if (isNotMainTenant && enrollmentStarted && !isEligible) {
          applyEligibility({
            btn_label: REQUEST_ACCESS_LABEL,
            btn_action: handleRequestAccess,
          });
        } else if (
          !isNotMainTenant &&
          !enrollmentStarted &&
          isEligible &&
          canEnroll &&
          !isEnrolled
        ) {
          applyEligibility({
            btn_label: ENROLL_NOW_COURSE_STARTING_SOON_LABEL,
            btn_action: handleSelfEnrollToCourse,
          });
        } else if (
          !isNotMainTenant &&
          !enrollmentStarted &&
          !isEligible &&
          course?.platform_key === 'main'
        ) {
          applyEligibility({
            btn_label: REQUEST_ACCESS_COURSE_STARTING_SOON_LABEL,
            btn_action: handleRequestAccess,
          });
        } else if (isNotMainTenant && enrollmentStarted && isEligible && !isEnrolled && canEnroll) {
          applyEligibility({
            btn_label: ENROLL_NOW_LABEL,
            btn_action: handleSelfEnrollToCourse,
          });
        }
      } else {
        if (isEnrolled) {
          applyEligibility({
            btn_label: ACCESS_COURSE_LABEL,
            btn_action: handleAccessCourse,
          });
        } else if (invitationOnly) {
          applyEligibility({
            disabled: true,
            btn_label: INVITATION_ONLY_LABEL,
            btn_action: () => {},
          });
        } else if (coursePrice && coursePrice !== 'Free' && parseInt(coursePrice) !== 0) {
          applyEligibility({
            btn_label: BUY_NOW_LABEL,
            btn_action: handleCreateCheckoutSession,
          });
        } else {
          applyEligibility({
            btn_label: ENROLL_NOW_LABEL,
            btn_action: handleEnrollToCourse,
          });
        }
      }
      setCourseEligibilityLoading(false);
      setCourseEligibilityFetched(true);
    } else {
      applyEligibility({
        btn_label: ENROLL_NOW_LABEL,
        btn_action: handleEnrollToCourse,
      });
      setCourseEligibilityLoading(false);
      setCourseEligibilityFetched(true);
    }
  };

  // Once the course metadata is loaded, automatically resolve eligibility +
  // monetization-access internally. The page used to call
  // `handleFetchCourseEligibilityInfo` itself after `course` arrived — moving
  // it here keeps the responsibility (and the `applyEligibility` state
  // machine) entirely inside the hook so consumers don't have to remember to
  // wire it up.
  useEffect(() => {
    if (_.isEmpty(course)) return;
    handleFetchCourseEligibilityInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const handleFetchCourseInfo = async () => {
    setCourseInfoLoadingState('loading');
    try {
      const courseMetaData = await handleFetchCourseMetaData(courseId);
      if (!_.isEmpty(courseMetaData)) {
        setCourse(courseMetaData as CourseEdxData);
        setCourseInfoLoadingState('successful');
      } else {
        setCourse(null);
        setCourseInfoLoadingState('failure');
      }
    } catch {
      setCourse(null);
      setCourseInfoLoadingState('failure');
    }
  };

  const handleFetchCourseSyllabus = async (setLoadingState: boolean = true) => {
    if (setLoadingState) {
      setCourseOutlineLoading(true);
    }
    const courseCompletionOutlines = (await handleFetchCourseCompletionOutlines(courseId)) as
      | CourseOutlineResponse
      | Record<string, any>;
    if (!_.isEmpty(courseCompletionOutlines)) {
      //const coursesSyllabus = courseCompletionOutlines.children as CourseOutlineChildNode[];
      setCourseOutline(courseCompletionOutlines as CourseOutlineChildNode);
      if (setLoadingState) {
        setCourseOutlineLoading(false);
      }
    } else {
      setCourseOutline({} as CourseOutlineChildNode);
      if (setLoadingState) {
        setCourseOutlineLoading(false);
      }
    }
  };

  const handleOpenLesson = (
    lessonId: string | null,
    checkEligibility = false,
    targetTab: 'course' | 'agent' = 'course',
  ) => {
    if (
      lessonId &&
      (checkEligibility ? courseEligibility.btn_label === ACCESS_COURSE_LABEL : true)
    ) {
      const URL = `/platform/${tenant}/course-content/${courseId}/${targetTab}?unit_id=${lessonId}`;
      if (inIframe()) {
        window.open(URL, '_blank');
      } else {
        router.push(URL);
      }
    }
  };

  const handleFetchCourseProgress = async () => {
    try {
      const courseProgress = await getCourseProgress({ courseKey: courseId });
      if (isCourseProgressError) {
        throw new Error('Error fetching course progress');
      }
      setCourseProgress(courseProgress.data || null);
      if (!_.isEmpty(courseProgress.data)) {
        setCourseGradingPolicyActive(
          Array.isArray(courseProgress.data?.grading_policy?.assignment_policies) &&
            courseProgress.data?.grading_policy?.assignment_policies.length > 0,
        );
      }
    } catch (error) {
      setCourseProgress(null);
      console.error('Error fetching course progress:', error);
    }
  };

  const handleFetchCourseCompletion = async (userID: number) => {
    try {
      const courseCompletion = await getCourseCompletion({
        courseKey: encodeURIComponent(courseId),
        userID: userID,
      });
      if (isCourseCompletionError) {
        throw new Error('Error fetching course completion');
      }
      setCourseCompletion(courseCompletion.data || null);
    } catch (error) {
      setCourseCompletion(null);
      console.error('Error fetching course completion:', error);
    }
  };

  return {
    handleRequestAccess,
    handleSelfEnrollToCourse,
    handleAccessCourse,
    handleCreateCheckoutSession,
    handleEnrollToCourse,
    handleFetchCourseEligibilityInfo,
    handleFetchCourseInfo,
    handleFetchCourseSyllabus,
    handleOpenLesson,
    handleFetchCourseProgress,
    handleFetchCourseCompletion,
    handleCheckCourseMonetizationAccess,
    course,
    courseInfoLoadingState,
    courseOutline,
    courseEligibility,
    courseOutlineLoading,
    courseEligibilityLoading,
    courseEligibilityFetched,
    courseButtonActionLoading,
    isCourseProgressLoading,
    isCourseCompletionLoading,
    courseProgress,
    courseCompletion,
    courseGradingPolicyActive,
    userLoggedIn,
    ACCESS_COURSE_LABEL,
    ENROLL_NOW_LABEL,
    REQUEST_ACCESS_LABEL,
    ENROLL_NOW_COURSE_STARTING_SOON_LABEL,
    REQUEST_ACCESS_COURSE_STARTING_SOON_LABEL,
    INVITATION_ONLY_LABEL,
    BUY_NOW_LABEL,
  };
};
