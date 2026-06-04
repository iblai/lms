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
      studioUrl: vi.fn(() => 'https://studio.example.com'),
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

// Mock useGetDepartmentMemberCheckQuery
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: vi.fn(() => ({
    data: { is_platform_admin: false },
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

vi.mock('../_components/learning-info-tab', () => ({
  LearningInfoTab: () => <div data-testid="learning-info-tab">Learning Info Tab</div>,
}));

vi.mock('../_components/instructor-tab', () => ({
  InstructorTab: () => <div data-testid="instructor-tab">Instructor Tab</div>,
}));

vi.mock('../_components/configuration-tab', () => ({
  ConfigurationTab: () => <div data-testid="configuration-tab">Configuration Tab</div>,
}));

import CourseDetailsPage from '../page';
import { useCourseDetailContext } from '@/hooks/courses/course-detail-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
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

    expect(screen.getByText('Test Course')).toBeInTheDocument();
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

  it('shows learning info tab when course has learning_info', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      learning_info: [{ title: 'Info 1' }],
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

    expect(screen.getByText('Learning Info')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Learning Info'));
    expect(screen.getByTestId('learning-info-tab')).toBeInTheDocument();
  });

  it('shows instructor tab when course has instructors', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      instructor_info: { instructors: [{ name: 'John Doe' }] },
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

    expect(screen.getByText('Instructors')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Instructors'));
    expect(screen.getByTestId('instructor-tab')).toBeInTheDocument();
  });

  it('shows configuration tab for platform admin', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: true },
    } as any);

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

    expect(screen.getByText('Configuration')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Configuration'));
    expect(screen.getByTestId('configuration-tab')).toBeInTheDocument();
  });

  it('hides configuration tab for non-admin users', () => {
    vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
      data: { is_platform_admin: false },
    } as any);

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

    expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
  });

  describe('Authoring tab (platform admin only)', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
    };

    const mockCourseDetail = () =>
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

    it('renders Authoring tab for platform admin', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      mockCourseDetail();

      render(<CourseDetailsPage />);

      expect(screen.getByText('Authoring')).toBeInTheDocument();
    });

    it('hides Authoring tab for non-admin users', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: false },
      } as any);
      mockCourseDetail();

      render(<CourseDetailsPage />);

      expect(screen.queryByText('Authoring')).not.toBeInTheDocument();
    });

    it('Authoring tab points at studioUrl/course/<courseId> in a new tab', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      mockCourseDetail();

      render(<CourseDetailsPage />);

      const link = screen.getByText('Authoring').closest('a');
      // The mocked useParams returns the URL-encoded id; the page decodes it.
      expect(link?.getAttribute('href')).toBe(
        'https://studio.example.com/course/course-v1:test+course+2024',
      );
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toContain('noopener');
    });

    it('Authoring tab is rendered after Configuration tab', () => {
      vi.mocked(useGetDepartmentMemberCheckQuery).mockReturnValue({
        data: { is_platform_admin: true },
      } as any);
      mockCourseDetail();

      const { container } = render(<CourseDetailsPage />);
      const tabRow = container.querySelector('div.flex.space-x-8');
      const labels = Array.from(tabRow?.children ?? []).map((el) => el.textContent?.trim());
      const configIdx = labels.indexOf('Configuration');
      const authoringIdx = labels.indexOf('Authoring');
      expect(configIdx).toBeGreaterThanOrEqual(0);
      expect(authoringIdx).toBe(configIdx + 1);
    });
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

  it('does not show learning info tab when course has no learning_info', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      learning_info: [],
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

    expect(screen.queryByText('Learning Info')).not.toBeInTheDocument();
  });

  it('does not show instructor tab when course has no instructors', () => {
    const mockCourse = {
      display_name: 'Test Course',
      course_image_asset_path: '/course-image.jpg',
      course_price: '$99',
      language: 'English',
      start_date: '2024-01-01',
      instructor_info: { instructors: [] },
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

    expect(screen.queryByText('Instructors')).not.toBeInTheDocument();
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
