import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  inIframe: vi.fn(() => false),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      dm: vi.fn(() => 'http://dm.example.com'),
    },
    settings: {
      courseEligibilityEnabled: vi.fn(() => false),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

const mockCreateCourseEnrollment = vi.fn();
const mockCreateStripeCheckoutSession = vi.fn();
const mockGetCourseProgress = vi.fn();
const mockGetCourseCompletion = vi.fn();

vi.mock('@/services/course-metadata', () => ({
  useCreateCourseEnrollmentMutation: vi.fn(() => [mockCreateCourseEnrollment, { isError: false }]),
  useLazyGetCourseProgressQuery: vi.fn(() => [
    mockGetCourseProgress,
    { isLoading: false, isError: false },
  ]),
  useLazyGetCourseCompletionQuery: vi.fn(() => [
    mockGetCourseCompletion,
    { isLoading: false, isError: false },
  ]),
}));

const mockCheckAccess = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useCreateStripeCheckoutSessionMutation: vi.fn(() => [mockCreateStripeCheckoutSession]),
  useLazyCheckAccessQuery: vi.fn(() => [mockCheckAccess]),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  setAccessCheckResponse: vi.fn((payload) => ({ type: 'setAccessCheckResponse', payload })),
  setDisplayMonetizationCheckoutModal: vi.fn((payload) => ({
    type: 'setDisplayMonetizationCheckoutModal',
    payload,
  })),
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(() => mockDispatch),
}));

const mockHandleFetchCourseMetaData = vi.fn();
const mockHandleFetchCourseCompletionOutlines = vi.fn();
const mockHandleFetchCourseEligibility = vi.fn();

vi.mock('@/hooks/courses/use-course-metadata', () => ({
  useCourseMetadata: vi.fn(() => ({
    handleFetchCourseMetaData: mockHandleFetchCourseMetaData,
    handleFetchCourseCompletionOutlines: mockHandleFetchCourseCompletionOutlines,
    handleFetchCourseEligibility: mockHandleFetchCourseEligibility,
  })),
}));

import { useCourseDetail } from '../use-course-detail';
import { inIframe } from '@/utils/helpers';
import { toast } from 'sonner';
import { config } from '@/lib/config';

describe('useCourseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleFetchCourseMetaData.mockResolvedValue(null);
    mockHandleFetchCourseCompletionOutlines.mockResolvedValue({});
    mockHandleFetchCourseEligibility.mockResolvedValue({});
    mockCreateCourseEnrollment.mockResolvedValue({ data: { created: true } });
    mockCreateStripeCheckoutSession.mockResolvedValue({
      unwrap: () => Promise.resolve({ redirect_to: 'http://checkout.example.com' }),
    });
    mockGetCourseProgress.mockResolvedValue({ data: null });
    mockGetCourseCompletion.mockResolvedValue({ data: null });
    mockCheckAccess.mockResolvedValue({ data: { has_access: true } });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useCourseDetail('course-123'));
    expect(result.current).toHaveProperty('handleRequestAccess');
    expect(result.current).toHaveProperty('handleSelfEnrollToCourse');
    expect(result.current).toHaveProperty('handleAccessCourse');
    expect(result.current).toHaveProperty('handleCreateCheckoutSession');
    expect(result.current).toHaveProperty('handleEnrollToCourse');
    expect(result.current).toHaveProperty('handleFetchCourseEligibilityInfo');
    expect(result.current).toHaveProperty('handleFetchCourseInfo');
    expect(result.current).toHaveProperty('handleFetchCourseSyllabus');
    expect(result.current).toHaveProperty('handleOpenLesson');
    expect(result.current).toHaveProperty('handleFetchCourseProgress');
    expect(result.current).toHaveProperty('handleFetchCourseCompletion');
    expect(result.current).toHaveProperty('course');
    expect(result.current).toHaveProperty('courseOutline');
    expect(result.current).toHaveProperty('courseEligibility');
  });

  it('initializes with expected defaults', () => {
    const { result } = renderHook(() => useCourseDetail('course-123'));
    expect(result.current.course).toBeNull();
    expect(result.current.courseOutline).toEqual({});
    expect(result.current.courseInfoLoadingState).toBe('not-started');
    expect(result.current.courseOutlineLoading).toBe(false);
    expect(result.current.courseEligibilityLoading).toBe(false);
    expect(result.current.courseButtonActionLoading).toBe(false);
    expect(result.current.courseProgress).toBeNull();
    expect(result.current.courseCompletion).toBeNull();
    expect(result.current.courseGradingPolicyActive).toBe(false);
  });

  it('exposes label constants', () => {
    const { result } = renderHook(() => useCourseDetail('course-123'));
    expect(result.current.ACCESS_COURSE_LABEL).toBe('Access Course');
    expect(result.current.ENROLL_NOW_LABEL).toBe('Enroll Now');
    expect(result.current.REQUEST_ACCESS_LABEL).toBe('Request Access');
    expect(result.current.INVITATION_ONLY_LABEL).toBe('Invitation Only');
    expect(result.current.BUY_NOW_LABEL).toBe('Buy Now');
  });

  describe('handleRequestAccess', () => {
    it('can be called without error', () => {
      const { result } = renderHook(() => useCourseDetail('course-123'));
      expect(() => result.current.handleRequestAccess()).not.toThrow();
    });
  });

  describe('handleSelfEnrollToCourse', () => {
    it('can be called without error', () => {
      const { result } = renderHook(() => useCourseDetail('course-123'));
      expect(() => result.current.handleSelfEnrollToCourse()).not.toThrow();
    });
  });

  describe('handleAccessCourse', () => {
    it('routes to /course by default when course data is unavailable', () => {
      (inIframe as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const { result } = renderHook(() => useCourseDetail('course-123'));
      act(() => {
        result.current.handleAccessCourse();
      });
      expect(mockPush).toHaveBeenCalledWith('/course-content/course-123/course');
    });

    it('opens /course in new tab when in iframe and course is default', () => {
      (inIframe as ReturnType<typeof vi.fn>).mockReturnValue(true);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const { result } = renderHook(() => useCourseDetail('course-123'));
      act(() => {
        result.current.handleAccessCourse();
      });
      expect(openSpy).toHaveBeenCalledWith('/course-content/course-123/course', '_blank');
      openSpy.mockRestore();
    });

    it('routes to /agent when agent_content_mode is true', async () => {
      (inIframe as ReturnType<typeof vi.fn>).mockReturnValue(false);
      mockHandleFetchCourseMetaData.mockResolvedValue({
        display_name: 'Test',
        agent_content_mode: true,
        course_content_mode: true,
      });
      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });
      act(() => {
        result.current.handleAccessCourse();
      });
      expect(mockPush).toHaveBeenCalledWith('/course-content/course-123/agent');
    });

    it('routes to /course when agent_content_mode is null', async () => {
      (inIframe as ReturnType<typeof vi.fn>).mockReturnValue(false);
      mockHandleFetchCourseMetaData.mockResolvedValue({
        display_name: 'Test',
        agent_content_mode: null,
        course_content_mode: true,
      });
      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });
      act(() => {
        result.current.handleAccessCourse();
      });
      expect(mockPush).toHaveBeenCalledWith('/course-content/course-123/course');
    });
  });

  describe('handleFetchCourseInfo', () => {
    it('sets course data on success', async () => {
      const mockCourseData = { id: 'course-123', name: 'Test Course' };
      mockHandleFetchCourseMetaData.mockResolvedValue(mockCourseData);

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      expect(result.current.course).toEqual(mockCourseData);
      expect(result.current.courseInfoLoadingState).toBe('successful');
    });

    it('sets course to null when empty data returned', async () => {
      mockHandleFetchCourseMetaData.mockResolvedValue({});

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      expect(result.current.course).toBeNull();
      expect(result.current.courseInfoLoadingState).toBe('failure');
    });
  });

  describe('handleFetchCourseSyllabus', () => {
    it('sets courseOutline data on success', async () => {
      const mockOutlineData = { children: [{ id: 'section-1', name: 'Section 1' }] };
      mockHandleFetchCourseCompletionOutlines.mockResolvedValue(mockOutlineData);

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseSyllabus();
      });

      expect(result.current.courseOutline).toEqual(mockOutlineData);
      expect(result.current.courseOutlineLoading).toBe(false);
    });

    it('sets empty outline when empty data returned', async () => {
      mockHandleFetchCourseCompletionOutlines.mockResolvedValue({});

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseSyllabus();
      });

      expect(result.current.courseOutline).toEqual({});
    });

    it('stores outline even when no children in response', async () => {
      mockHandleFetchCourseCompletionOutlines.mockResolvedValue({ name: 'Outline' });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseSyllabus();
      });

      expect(result.current.courseOutline).toEqual({ name: 'Outline' });
      expect(result.current.courseOutline.children).toBeUndefined();
    });
  });

  describe('handleFetchCourseProgress', () => {
    it('sets course progress data on success', async () => {
      const mockProgressData = {
        completion: 50,
        grading_policy: { assignment_policies: [{ type: 'Homework' }] },
      };
      mockGetCourseProgress.mockResolvedValue({ data: mockProgressData });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseProgress();
      });

      expect(result.current.courseProgress).toEqual(mockProgressData);
      expect(result.current.courseGradingPolicyActive).toBe(true);
    });

    it('sets null progress when no data', async () => {
      mockGetCourseProgress.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseProgress();
      });

      expect(result.current.courseProgress).toBeNull();
    });

    it('handles error and sets null progress', async () => {
      mockGetCourseProgress.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseProgress();
      });

      expect(result.current.courseProgress).toBeNull();
    });
  });

  describe('handleFetchCourseCompletion', () => {
    it('sets course completion data on success', async () => {
      const mockCompletionData = { completion: 100, grade: 'A' };
      mockGetCourseCompletion.mockResolvedValue({ data: mockCompletionData });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseCompletion(42);
      });

      expect(result.current.courseCompletion).toEqual(mockCompletionData);
    });

    it('handles error and sets null completion', async () => {
      mockGetCourseCompletion.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseCompletion(42);
      });

      expect(result.current.courseCompletion).toBeNull();
    });
  });

  describe('handleOpenLesson', () => {
    it('navigates to lesson URL when lessonId is provided', () => {
      (inIframe as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const { result } = renderHook(() => useCourseDetail('course-123'));
      act(() => {
        result.current.handleOpenLesson('lesson-1');
      });
      expect(mockPush).toHaveBeenCalledWith('/course-content/course-123/course?unit_id=lesson-1');
    });

    it('does not navigate when lessonId is null', () => {
      const { result } = renderHook(() => useCourseDetail('course-123'));
      act(() => {
        result.current.handleOpenLesson(null);
      });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('opens in new tab when in iframe', () => {
      (inIframe as ReturnType<typeof vi.fn>).mockReturnValue(true);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const { result } = renderHook(() => useCourseDetail('course-123'));
      act(() => {
        result.current.handleOpenLesson('lesson-1');
      });
      expect(openSpy).toHaveBeenCalledWith(
        '/course-content/course-123/course?unit_id=lesson-1',
        '_blank',
      );
      openSpy.mockRestore();
    });

    it('does not navigate when checkEligibility is true and label is not Access Course', () => {
      const { result } = renderHook(() => useCourseDetail('course-123'));
      // Default label is 'Enroll Now', not 'Access Course'
      act(() => {
        result.current.handleOpenLesson('lesson-1', true);
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('handleEnrollToCourse', () => {
    it('enrolls and shows success toast', async () => {
      mockCreateCourseEnrollment.mockResolvedValue({ data: { created: true } });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleEnrollToCourse();
      });

      expect(toast.success).toHaveBeenCalledWith('Enrolled in course successfully');
    });

    it('shows error toast when enrollment fails', async () => {
      mockCreateCourseEnrollment.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleEnrollToCourse();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to enroll in course.');
    });

    it('shows error toast on exception', async () => {
      mockCreateCourseEnrollment.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleEnrollToCourse();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to enroll in course.');
    });
  });

  describe('handleCreateCheckoutSession', () => {
    it('redirects to checkout on success', async () => {
      const redirectUrl = 'http://stripe.checkout.com';
      mockCreateStripeCheckoutSession.mockReturnValue({
        unwrap: () => Promise.resolve({ redirect_to: redirectUrl }),
      });
      Object.defineProperty(window, 'location', {
        value: { href: 'http://current.com' },
        writable: true,
      });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(toast.success).toHaveBeenCalledWith('Redirecting to checkout page...');
      expect(window.location.href).toBe(redirectUrl);
    });

    it('shows error when no redirect_to in response', async () => {
      mockCreateStripeCheckoutSession.mockReturnValue({
        unwrap: () => Promise.resolve({ redirect_to: null }),
      });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create checkout session');
    });

    it('shows error on exception', async () => {
      mockCreateStripeCheckoutSession.mockReturnValue({
        unwrap: () => Promise.reject(new Error('Stripe error')),
      });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create checkout session');
    });
  });

  describe('handleFetchCourseEligibilityInfo - courseEligibilityEnabled=false', () => {
    beforeEach(() => {
      (config.settings.courseEligibilityEnabled as ReturnType<typeof vi.fn>).mockReturnValue(false);
    });

    it('sets ACCESS_COURSE_LABEL when enrolled', async () => {
      mockHandleFetchCourseEligibility.mockResolvedValue({
        is_enrolled: true,
        can_enroll: false,
        is_eligible: false,
        invitation_only: false,
      });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseEligibilityInfo();
      });

      expect(result.current.courseEligibility.btn_label).toBe('Access Course');
    });

    it('sets INVITATION_ONLY_LABEL and disabled when invitation_only', async () => {
      mockHandleFetchCourseEligibility.mockResolvedValue({
        is_enrolled: false,
        can_enroll: false,
        is_eligible: false,
        invitation_only: true,
      });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseEligibilityInfo();
      });

      expect(result.current.courseEligibility.btn_label).toBe('Invitation Only');
      expect(result.current.courseEligibility.disabled).toBe(true);
    });

    it('sets BUY_NOW_LABEL when course has price', async () => {
      mockHandleFetchCourseEligibility.mockResolvedValue({
        is_enrolled: false,
        can_enroll: true,
        is_eligible: false,
        invitation_only: false,
      });
      mockHandleFetchCourseMetaData.mockResolvedValue({ course_price: '99' });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });
      await act(async () => {
        await result.current.handleFetchCourseEligibilityInfo();
      });

      expect(result.current.courseEligibility.btn_label).toBe('Buy Now');
    });

    it('sets ENROLL_NOW_LABEL when course is free', async () => {
      mockHandleFetchCourseEligibility.mockResolvedValue({
        is_enrolled: false,
        can_enroll: true,
        is_eligible: true,
        invitation_only: false,
      });

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseEligibilityInfo();
      });

      expect(result.current.courseEligibility.btn_label).toBe('Enroll Now');
    });

    it('sets ENROLL_NOW_LABEL when eligibility returns empty', async () => {
      mockHandleFetchCourseEligibility.mockResolvedValue({});

      const { result } = renderHook(() => useCourseDetail('course-123'));
      await act(async () => {
        await result.current.handleFetchCourseEligibilityInfo();
      });

      expect(result.current.courseEligibility.btn_label).toBe('Enroll Now');
      expect(result.current.courseEligibilityLoading).toBe(false);
    });
  });
});
