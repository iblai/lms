import { useState } from 'react';
import { useCourseMetadata } from '@/hooks/courses/use-course-metadata';
import {
  CourseCompletion,
  CourseEdxData,
  CourseOutlineChildNode,
  CourseOutlineResponse,
  CourseProgress,
} from '@/types/courses';
import _ from 'lodash';
import { getTenant, getUserName, inIframe } from '@/utils/helpers';
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
import { useCreateStripeCheckoutSessionMutation } from '@iblai/iblai-js/data-layer';

export type CourseInfoLoadingState = 'not-started' | 'loading' | 'successful' | 'failure';

interface CourseEligibility {
  btn_label: string;
  btn_action: () => void;
  disabled?: boolean;
}

export const useCourseDetail = (courseId: string) => {
  const router = useRouter();
  const ACCESS_COURSE_LABEL = 'Access Course';
  const ENROLL_NOW_LABEL = 'Enroll Now';
  const REQUEST_ACCESS_LABEL = 'Request Access';
  const ENROLL_NOW_COURSE_STARTING_SOON_LABEL = 'Enroll Now - Course Starting Soon';
  const REQUEST_ACCESS_COURSE_STARTING_SOON_LABEL = 'Request Access - Course Starting Soon';
  const INVITATION_ONLY_LABEL = 'Invitation Only';
  const BUY_NOW_LABEL = 'Buy Now';
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
  const [courseInfoLoadingState, setCourseInfoLoadingState] =
    useState<CourseInfoLoadingState>('not-started');
  const [course, setCourse] = useState<CourseEdxData | null>(null);
  const [courseOutline, setCourseOutline] = useState<CourseOutlineChildNode>(
    {} as CourseOutlineChildNode,
  );
  const [courseOutlineLoading, setCourseOutlineLoading] = useState(false);
  const [courseEligibilityLoading, setCourseEligibilityLoading] = useState(false);
  const [courseButtonActionLoading, setCourseButtonActionLoading] = useState(false);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [courseCompletion, setCourseCompletion] = useState<CourseCompletion | null>(null);
  const [courseGradingPolicyActive, setCourseGradingPolicyActive] = useState(false);

  const handleRequestAccess = () => {
    console.log('Request Access');
  };

  const handleSelfEnrollToCourse = () => {
    console.log('Self Enroll to Course');
  };

  const handleAccessCourse = () => {
    if (inIframe()) {
      window.open(`/course-content/${courseId}/course`, '_blank');
    } else {
      router.push(`/course-content/${courseId}/course`);
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
    btn_action: handleEnrollToCourse,
  });

  const handleFetchCourseEligibilityInfo = async () => {
    setCourseEligibilityLoading(true);
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
          setCourseEligibility({
            btn_label: ACCESS_COURSE_LABEL,
            btn_action: handleAccessCourse,
          });
        } else if (isNotMainTenant && enrollmentStarted && !isEligible) {
          setCourseEligibility({
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
          setCourseEligibility({
            btn_label: ENROLL_NOW_COURSE_STARTING_SOON_LABEL,
            btn_action: handleSelfEnrollToCourse,
          });
        } else if (
          !isNotMainTenant &&
          !enrollmentStarted &&
          !isEligible &&
          course?.platform_key === 'main'
        ) {
          setCourseEligibility({
            btn_label: REQUEST_ACCESS_COURSE_STARTING_SOON_LABEL,
            btn_action: handleRequestAccess,
          });
        } else if (isNotMainTenant && enrollmentStarted && isEligible && !isEnrolled && canEnroll) {
          setCourseEligibility({
            btn_label: ENROLL_NOW_LABEL,
            btn_action: handleSelfEnrollToCourse,
          });
        }
      } else {
        if (isEnrolled) {
          setCourseEligibility({
            btn_label: ACCESS_COURSE_LABEL,
            btn_action: handleAccessCourse,
          });
        } else if (invitationOnly) {
          setCourseEligibility({
            disabled: true,
            btn_label: INVITATION_ONLY_LABEL,
            btn_action: () => {},
          });
        } else if (coursePrice && coursePrice !== 'Free' && parseInt(coursePrice) !== 0) {
          setCourseEligibility({
            btn_label: BUY_NOW_LABEL,
            btn_action: handleCreateCheckoutSession,
          });
        } else {
          setCourseEligibility({
            btn_label: ENROLL_NOW_LABEL,
            btn_action: handleEnrollToCourse,
          });
        }
      }
      setCourseEligibilityLoading(false);
    } else {
      setCourseEligibility({
        btn_label: ENROLL_NOW_LABEL,
        btn_action: handleEnrollToCourse,
      });
      setCourseEligibilityLoading(false);
    }
  };
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

  const handleOpenLesson = (lessonId: string | null, checkEligibility = false) => {
    if (
      lessonId &&
      (checkEligibility ? courseEligibility.btn_label === ACCESS_COURSE_LABEL : true)
    ) {
      const URL = `/course-content/${courseId}/course?unit_id=${lessonId}`;
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
    course,
    courseInfoLoadingState,
    courseOutline,
    courseEligibility,
    courseOutlineLoading,
    courseEligibilityLoading,
    courseButtonActionLoading,
    isCourseProgressLoading,
    isCourseCompletionLoading,
    courseProgress,
    courseCompletion,
    courseGradingPolicyActive,
    ACCESS_COURSE_LABEL,
    ENROLL_NOW_LABEL,
    REQUEST_ACCESS_LABEL,
    ENROLL_NOW_COURSE_STARTING_SOON_LABEL,
    REQUEST_ACCESS_COURSE_STARTING_SOON_LABEL,
    INVITATION_ONLY_LABEL,
    BUY_NOW_LABEL,
  };
};
