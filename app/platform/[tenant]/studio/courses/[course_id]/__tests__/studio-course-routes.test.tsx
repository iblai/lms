import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const COURSE_KEY = 'course-v1:org+CS101+2026';
const ENCODED = 'course-v1%3Aorg%2BCS101%2B2026';

const mockReplace = vi.fn();
const nav = vi.hoisted(() => ({ search: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useParams: () => ({ course_id: 'course-v1%3Aorg%2BCS101%2B2026' }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));
vi.mock('@/components/studio/studio-course-shell', () => ({
  StudioCourseShell: ({ courseId, children }: any) => (
    <div data-testid="shell" data-course={courseId}>
      {children}
    </div>
  ),
}));
vi.mock('@/components/studio/course-details-form', () => ({
  CourseDetailsForm: ({ courseId }: any) => <div data-testid="details" data-course={courseId} />,
}));
vi.mock('@/components/studio/studio-frame', () => ({
  StudioFrame: ({ courseId }: any) => <div data-testid="frame" data-course={courseId} />,
}));
vi.mock(
  '@/app/platform/[tenant]/course-content/[course_id]/instructor/_components/instructor-dashboard',
  () => ({
    InstructorDashboard: ({ courseId, courseBasePath, section }: any) => (
      <div
        data-testid="dashboard"
        data-course={courseId}
        data-base={courseBasePath}
        data-section={section}
      />
    ),
    isDashboardSection: (value: unknown) => value === 'membership',
  }),
);

import StudioCourseLayout from '../layout';
import StudioCoursePage from '../page';
import DetailsPage from '../details/page';
import OutlinePage from '../outline/page';
import InstructorPage from '../instructor/page';

describe('Studio course routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.search = '';
  });

  it('wraps the course pages in the Studio course shell', async () => {
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <StudioCourseLayout params={Promise.resolve({ course_id: ENCODED })}>
            <div data-testid="child" />
          </StudioCourseLayout>
        </Suspense>,
      );
    });
    expect(await screen.findByTestId('shell')).toHaveAttribute('data-course', COURSE_KEY);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('sends the bare course URL to the details section', () => {
    render(<StudioCoursePage />);
    expect(mockReplace).toHaveBeenCalledWith(`/platform/acme/studio/courses/${ENCODED}/details`);
  });

  it('renders the details form for the course', () => {
    render(<DetailsPage />);
    expect(screen.getByTestId('details')).toHaveAttribute('data-course', COURSE_KEY);
  });

  it('renders the embedded Studio outline for the course', () => {
    render(<OutlinePage />);
    expect(screen.getByTestId('frame')).toHaveAttribute('data-course', COURSE_KEY);
  });

  it('renders the instructor dashboard on the Studio base path', () => {
    nav.search = 'section=membership';
    const { unmount } = render(<InstructorPage />);
    const dashboard = screen.getByTestId('dashboard');
    expect(dashboard).toHaveAttribute('data-course', COURSE_KEY);
    expect(dashboard).toHaveAttribute('data-base', `/platform/acme/studio/courses/${ENCODED}`);
    expect(dashboard).toHaveAttribute('data-section', 'membership');
    unmount();

    nav.search = 'section=bogus';
    render(<InstructorPage />);
    expect(screen.getByTestId('dashboard')).toHaveAttribute('data-section', 'overview');
  });
});
