import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="course-image" onError={onError} />
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({
    course_id: 'course-v1%3Atest%2Bcourse%2B2024',
    tenant: 'test-tenant',
  })),
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random-course-image.jpg'),
  getTenant: vi.fn(() => 'test-tenant'),
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

// Mock dayjs
vi.mock('dayjs', () => {
  const mockDayjs = (_date?: any) => ({
    format: vi.fn(() => 'Jan 1, 2024'),
  });
  mockDayjs.extend = vi.fn();
  return { default: mockDayjs };
});

vi.mock('dayjs/plugin/duration', () => ({
  default: {},
}));

// Mock useChatState
vi.mock('@/components/chat-button', () => ({
  useChatState: vi.fn(() => ({
    setCourseMentor: vi.fn(),
    setMentorSidebarHidden: vi.fn(),
  })),
}));

// Mock useCourseDetailContext
const mockHandleFetchCourseInfo = vi.fn();
const mockHandleFetchCourseSyllabus = vi.fn();
const mockHandleFetchCourseEligibilityInfo = vi.fn();
const mockHandleOpenLesson = vi.fn();

vi.mock('@/hooks/courses/course-detail-context', () => ({
  useCourseDetailContext: vi.fn(() => ({
    handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
    handleFetchCourseInfo: mockHandleFetchCourseInfo,
    handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
    handleOpenLesson: mockHandleOpenLesson,
    course: null,
    courseOutline: null,
    courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
    courseOutlineLoading: false,
    courseEligibilityLoading: false,
    courseButtonActionLoading: false,
    courseInfoLoadingState: 'successful',
  })),
}));

// Mock components
vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/skeleton-course-access-btn', () => ({
  SkeletonCourseAccessBtn: () => <div data-testid="skeleton-btn">Loading...</div>,
}));

// Mock tab components
vi.mock('../_components/about-tab', () => ({
  AboutTab: ({ course }: any) => <div data-testid="about-tab">About: {course?.display_name}</div>,
}));

vi.mock('../_components/syllabus-tab', () => ({
  SyllabusTab: () => <div data-testid="syllabus-tab">Syllabus Tab</div>,
}));

import CourseDetailsPage from '../page';
import { useCourseDetailContext } from '@/hooks/courses/course-detail-context';
import { useChatState } from '@/components/chat-button';

describe('CourseDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when loading', () => {
    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: null,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'loading',
    } as any);

    render(<CourseDetailsPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no course data', () => {
    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: null,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'failure',
    } as any);

    render(<CourseDetailsPage />);

    expect(screen.getByTestId('empty-box')).toHaveTextContent('No course data found.');
  });

  it('renders course details when course is loaded', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      title: 'Test Course Title',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      duration: '4 weeks',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll Now', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    // No in-page course title — it lives in the navbar's left cluster.
    expect(screen.queryByRole('heading', { name: 'Test Course' })).not.toBeInTheDocument();
    expect(screen.getByTestId('about-tab')).toHaveTextContent('Test Course');
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('4 weeks')).toBeInTheDocument();
  });

  it('renders about tab by default', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    expect(screen.getByTestId('about-tab')).toBeInTheDocument();
  });

  it('switches to syllabus tab when clicked', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    fireEvent.click(screen.getByText('Syllabus'));

    expect(screen.getByTestId('syllabus-tab')).toBeInTheDocument();
  });

  it('shows skeleton button when loading eligibility', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: true,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    expect(screen.getByTestId('skeleton-btn')).toBeInTheDocument();
  });

  it('renders enroll button with correct label', () => {
    const mockBtnAction = vi.fn();
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: {
        btn_label: 'Start Learning',
        btn_action: mockBtnAction,
        disabled: false,
      },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    const enrollButton = screen.getByText('Start Learning');
    expect(enrollButton).toBeInTheDocument();

    fireEvent.click(enrollButton);
    expect(mockBtnAction).toHaveBeenCalled();
  });

  it('disables enroll button when eligibility is disabled', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Not Available', btn_action: vi.fn(), disabled: true },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    const enrollButton = screen.getByText('Not Available');
    expect(enrollButton).toBeDisabled();
  });

  it('handles image error with fallback', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/broken-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    const image = screen.getByTestId('course-image');
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/random-course-image.jpg');
  });

  it('shows loading spinner when state is not-started', () => {
    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: null,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'not-started',
    } as any);

    render(<CourseDetailsPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows skeleton button when courseButtonActionLoading is true', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: true,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    expect(screen.getByTestId('skeleton-btn')).toBeInTheDocument();
  });

  it('sets mentor when course has no mentor_hidden flag', () => {
    const mockSetCourseMentor = vi.fn();
    const mockSetMentorSidebarHidden = vi.fn();

    vi.mocked(useChatState).mockReturnValue({
      isOpen: false,
      setIsOpen: vi.fn(),
      courseMentor: null,
      setCourseMentor: mockSetCourseMentor,
      mentorSidebarHidden: false,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
    });

    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      mentor_uuid: 'mentor-123',
      mentor_hidden: false,
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    expect(mockSetCourseMentor).toHaveBeenCalledWith('mentor-123');
  });

  it('hides mentor sidebar when course has mentor_hidden', () => {
    const mockSetCourseMentor = vi.fn();
    const mockSetMentorSidebarHidden = vi.fn();

    vi.mocked(useChatState).mockReturnValue({
      isOpen: false,
      setIsOpen: vi.fn(),
      courseMentor: null,
      setCourseMentor: mockSetCourseMentor,
      mentorSidebarHidden: false,
      setMentorSidebarHidden: mockSetMentorSidebarHidden,
    });

    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      mentor_hidden: true,
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    expect(mockSetMentorSidebarHidden).toHaveBeenCalledWith(true);
  });

  it('does not show empty state when loading state is successful with course', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('hides duration when not provided', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      duration: undefined,
    };

    vi.mocked(useCourseDetailContext).mockReturnValue({
      handleFetchCourseEligibilityInfo: mockHandleFetchCourseEligibilityInfo,
      handleFetchCourseInfo: mockHandleFetchCourseInfo,
      handleFetchCourseSyllabus: mockHandleFetchCourseSyllabus,
      handleOpenLesson: mockHandleOpenLesson,
      course: mockCourse,
      courseOutline: null,
      courseEligibility: { btn_label: 'Enroll', btn_action: vi.fn(), disabled: false },
      courseOutlineLoading: false,
      courseEligibilityLoading: false,
      courseButtonActionLoading: false,
      courseInfoLoadingState: 'successful',
    } as any);

    render(<CourseDetailsPage />);

    // Duration row should not be rendered
    expect(screen.queryByText('4 weeks')).not.toBeInTheDocument();
  });
});
