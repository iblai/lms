import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCourseDetail } from '@/hooks/courses/use-course-detail';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUnwrap = vi.fn();
const mockCreateStripeCheckoutSession = vi.fn(() => ({ unwrap: mockUnwrap }));
const mockCheckAccess = vi.fn(() => Promise.resolve({ data: { has_access: true } }));
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useCreateStripeCheckoutSessionMutation: () => [mockCreateStripeCheckoutSession],
  useLazyCheckAccessQuery: () => [mockCheckAccess],
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  setAccessCheckResponse: (payload: unknown) => ({ type: 'setAccessCheckResponse', payload }),
  setDisplayMonetizationCheckoutModal: (payload: unknown) => ({
    type: 'setDisplayMonetizationCheckoutModal',
    payload,
  }),
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

const mockCreateCourseEnrollment = vi.fn();
const mockGetCourseProgress = vi.fn();
const mockGetCourseCompletion = vi.fn();
vi.mock('@/services/course-metadata', () => ({
  useCreateCourseEnrollmentMutation: () => [mockCreateCourseEnrollment, { isError: false }],
  useLazyGetCourseProgressQuery: () => [
    mockGetCourseProgress,
    { isLoading: false, isError: false },
  ],
  useLazyGetCourseCompletionQuery: () => [
    mockGetCourseCompletion,
    { isLoading: false, isError: false },
  ],
}));

const mockHandleFetchCourseMetaData = vi.fn();
const mockHandleFetchCourseCompletionOutlines = vi.fn();
const mockHandleFetchCourseEligibility = vi.fn();
vi.mock('@/hooks/courses/use-course-metadata', () => ({
  useCourseMetadata: () => ({
    handleFetchCourseMetaData: mockHandleFetchCourseMetaData,
    handleFetchCourseCompletionOutlines: mockHandleFetchCourseCompletionOutlines,
    handleFetchCourseEligibility: mockHandleFetchCourseEligibility,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: () => 'test-tenant',
  getUserName: () => 'test-user',
  inIframe: () => false,
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      dm: () => 'https://dm.example.com',
    },
    settings: {
      courseEligibilityEnabled: () => false,
    },
  },
}));

const COURSE_ID = 'course-v1:TestOrg+CS101+2024';

describe('useCourseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://app.example.com/courses/123' },
      writable: true,
    });
  });

  describe('handleCreateCheckoutSession', () => {
    it('should pass course.org as org parameter instead of hardcoded "main"', async () => {
      mockUnwrap.mockResolvedValue({ redirect_to: 'https://checkout.stripe.com/session123' });

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        org: 'AcmeOrg',
        display_name: 'Test Course',
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      // First fetch the course info so course state is populated
      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      // Now trigger checkout
      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          org: 'AcmeOrg',
        }),
      );
    });

    it('should use course.platform_key in success_url instead of hardcoded "main"', async () => {
      mockUnwrap.mockResolvedValue({ redirect_to: 'https://checkout.stripe.com/session123' });

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        org: 'AcmeOrg',
        display_name: 'Test Course',
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url:
            'https://dm.example.com/api/service/orgs/acme-org/stripe/course-payment-callback/',
        }),
      );
    });

    it('should pass correct tenant from course.platform_key', async () => {
      mockUnwrap.mockResolvedValue({ redirect_to: 'https://checkout.stripe.com/session123' });

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        org: 'AcmeOrg',
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: COURSE_ID,
          org: 'AcmeOrg',
          tenant: 'acme-org',
          username: 'test-user',
          mode: 'payment',
          cancel_url: 'https://app.example.com/courses/123',
          success_url:
            'https://dm.example.com/api/service/orgs/acme-org/stripe/course-payment-callback/',
        }),
      );
    });

    it('should fall back to getTenant() when course.platform_key is undefined', async () => {
      mockUnwrap.mockResolvedValue({ redirect_to: 'https://checkout.stripe.com/session123' });

      mockHandleFetchCourseMetaData.mockResolvedValue({
        org: 'SomeOrg',
        // no platform_key
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: 'test-tenant',
        }),
      );
    });

    it('should handle undefined org when course has no org field', async () => {
      mockUnwrap.mockResolvedValue({ redirect_to: 'https://checkout.stripe.com/session123' });

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        // no org field
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(mockCreateStripeCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          org: '',
        }),
      );
    });

    it('should redirect to checkout URL on success', async () => {
      mockUnwrap.mockResolvedValue({ redirect_to: 'https://checkout.stripe.com/session123' });

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        org: 'AcmeOrg',
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(window.location.href).toBe('https://checkout.stripe.com/session123');
    });

    it('should show error toast when checkout session has no redirect_to', async () => {
      const { toast } = await import('sonner');
      mockUnwrap.mockResolvedValue({});

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        org: 'AcmeOrg',
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create checkout session');
    });

    it('should show error toast when createStripeCheckoutSession rejects', async () => {
      const { toast } = await import('sonner');
      mockUnwrap.mockRejectedValue(new Error('Network error'));

      mockHandleFetchCourseMetaData.mockResolvedValue({
        platform_key: 'acme-org',
        org: 'AcmeOrg',
      });

      const { result } = renderHook(() => useCourseDetail(COURSE_ID));

      await act(async () => {
        await result.current.handleFetchCourseInfo();
      });

      await act(async () => {
        await result.current.handleCreateCheckoutSession();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create checkout session');
      expect(result.current.courseButtonActionLoading).toBe(false);
    });
  });
});
