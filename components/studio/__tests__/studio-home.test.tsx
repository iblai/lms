import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const nav = vi.hoisted(() => ({ search: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/platform/acme/studio',
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/hooks/use-tenant-param', () => ({ useTenantParam: () => 'acme' }));

const state = vi.hoisted(() => ({
  org: 'org1' as string | undefined,
  canCreateCourse: true,
  courses: { data: undefined as any, isLoading: false, isError: false },
  programs: { data: undefined as any, isLoading: false, isError: false },
}));
vi.mock('@/utils/localstorage', () => ({
  useCurrentTenant: () => ({ currentTenant: state.org ? { org: state.org } : null }),
}));
vi.mock('@/components/course-creation-access-guard', () => ({
  useCanCreateCourse: () => ({ canCreateCourse: state.canCreateCourse }),
}));
const mockUseGetStudioCoursesQuery = vi.fn();
vi.mock('@/services/studio', () => ({
  useGetStudioCoursesQuery: (...args: unknown[]) => mockUseGetStudioCoursesQuery(...args),
}));
const mockUseGetCatalogSearchQuery = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetCatalogSearchQuery: (...args: unknown[]) => mockUseGetCatalogSearchQuery(...args),
}));
vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => <div data-testid="empty">{message}</div>,
}));
vi.mock('@/components/course-creation/course-creation-modal', () => ({
  CourseCreationModal: ({ open, onCreated }: any) =>
    open ? (
      <button data-testid="course-modal" onClick={() => onCreated('course-v1:org1+NEW+1')}>
        course modal
      </button>
    ) : null,
}));
vi.mock('@/components/studio/program-creation-modal', () => ({
  ProgramCreationModal: ({ open, onCreated }: any) =>
    open ? (
      <>
        <button
          data-testid="program-modal"
          onClick={() =>
            onCreated({ program_id: 'new', program_key: 'program-v1:org1+new', name: 'New' })
          }
        >
          program modal
        </button>
        <button
          data-testid="program-modal-indexed"
          onClick={() =>
            onCreated({ program_id: 'p1', program_key: 'program-v1:org1+p1', name: 'Dup' })
          }
        >
          indexed
        </button>
      </>
    ) : null,
}));

import { StudioHome } from '../studio-home';

const course = (key: string, name: string, org = 'org1', archived = false) => ({
  course_key: key,
  display_name: name,
  org,
  number: 'N',
  run: 'R',
  archived,
});

describe('StudioHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.search = '';
    state.org = 'org1';
    state.canCreateCourse = true;
    state.courses = {
      data: [
        course('course-v1:org1+A+1', 'Algebra'),
        course('course-v1:org1+B+1', '', 'org1', true),
        course('course-v1:other+C+1', 'Foreign', 'other'),
      ],
      isLoading: false,
      isError: false,
    };
    state.programs = {
      data: {
        results: [
          { data: { program_id: 'p1', program_key: 'program-v1:org1+p1', name: 'Program One' } },
          { data: { program_id: 'p2', program_key: '', name: '' } },
        ],
      },
      isLoading: false,
      isError: false,
    };
    mockUseGetStudioCoursesQuery.mockImplementation(() => state.courses);
    mockUseGetCatalogSearchQuery.mockImplementation(() => state.programs);
  });

  const rows = () => screen.getAllByTestId('studio-row');

  it("lists the tenant's own courses, linking each to its Studio pages", () => {
    render(<StudioHome />);

    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveTextContent('Algebra');
    expect(rows()[0]).toHaveAttribute(
      'href',
      '/platform/acme/studio/courses/course-v1%3Aorg1%2BA%2B1/details',
    );
    expect(screen.queryByText('Foreign')).not.toBeInTheDocument();
    expect(mockUseGetStudioCoursesQuery).toHaveBeenCalledWith(undefined, {
      refetchOnMountOrArgChange: true,
    });
  });

  it('falls back to the course key for an unnamed course and marks archived ones', () => {
    render(<StudioHome />);
    expect(rows()[1]).toHaveTextContent('course-v1:org1+B+1');
    expect(rows()[1]).toHaveTextContent('Archived');
  });

  it('lists every authorable course while the tenant org is unknown', () => {
    state.org = undefined;
    render(<StudioHome />);
    expect(rows()).toHaveLength(3);
  });

  it('filters the list by the search term', () => {
    render(<StudioHome />);
    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: 'alg' } });
    expect(rows()).toHaveLength(1);

    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: ' zzz ' } });
    expect(screen.getByTestId('empty')).toHaveTextContent('No courses match "zzz".');
  });

  it('shows a spinner while courses load', () => {
    state.courses = { data: undefined, isLoading: true, isError: false };
    render(<StudioHome />);
    expect(screen.getByTestId('studio-loading')).toBeInTheDocument();
  });

  it('shows an error when courses fail to load', () => {
    state.courses = { data: undefined, isLoading: false, isError: true };
    render(<StudioHome />);
    expect(screen.getByTestId('empty')).toHaveTextContent("We couldn't load your courses.");
  });

  it('shows an empty state when there are no courses', () => {
    state.courses = { data: undefined, isLoading: false, isError: false };
    render(<StudioHome />);
    expect(screen.getByTestId('empty')).toHaveTextContent('No courses yet.');
  });

  it('switches views through the URL', () => {
    render(<StudioHome />);
    fireEvent.click(screen.getByRole('tab', { name: 'Programs' }));
    expect(mockReplace).toHaveBeenCalledWith('/platform/acme/studio?view=programs', {
      scroll: false,
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Courses' }));
    expect(mockReplace).toHaveBeenCalledWith('/platform/acme/studio', { scroll: false });
  });

  it('creates a course and opens its Studio pages', () => {
    render(<StudioHome />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Course' }));
    fireEvent.click(screen.getByTestId('course-modal'));
    expect(mockPush).toHaveBeenCalledWith(
      '/platform/acme/studio/courses/course-v1%3Aorg1%2BNEW%2B1/details',
    );
  });

  it('hides the create button from people who cannot create', () => {
    state.canCreateCourse = false;
    render(<StudioHome />);
    expect(screen.queryByRole('button', { name: 'Create Course' })).not.toBeInTheDocument();
  });

  describe('programs view', () => {
    beforeEach(() => {
      nav.search = 'view=programs';
    });

    it("lists the tenant's programs from the catalog search, linking to the program page", () => {
      render(<StudioHome />);

      expect(mockUseGetCatalogSearchQuery).toHaveBeenCalledWith(
        [{ tenant: 'acme', content: ['programs'], limit: 100 }],
        { skip: false },
      );
      expect(screen.getByRole('tab', { name: 'Programs' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(rows()).toHaveLength(2);
      expect(rows()[0]).toHaveTextContent('Program One');
      expect(rows()[0]).toHaveAttribute('href', '/platform/acme/programs/program-v1%3Aorg1%2Bp1');
      expect(rows()[1]).toHaveTextContent('p2');
      expect(rows()[1]).toHaveAttribute('href', '/platform/acme/programs/p2');
    });

    it('shows a newly created program ahead of the indexed ones', () => {
      render(<StudioHome />);
      fireEvent.click(screen.getByRole('button', { name: 'Create Program' }));
      fireEvent.click(screen.getByTestId('program-modal'));

      expect(rows()).toHaveLength(3);
      expect(rows()[0]).toHaveTextContent('New');
      expect(screen.queryByTestId('program-modal')).not.toBeInTheDocument();
    });

    it('does not duplicate a created program the index already lists', () => {
      render(<StudioHome />);
      fireEvent.click(screen.getByRole('button', { name: 'Create Program' }));
      fireEvent.click(screen.getByTestId('program-modal-indexed'));
      expect(rows()).toHaveLength(2);
    });

    it('shows loading, error and empty states', () => {
      state.programs = { data: undefined, isLoading: true, isError: false };
      const { rerender } = render(<StudioHome />);
      expect(screen.getByTestId('studio-loading')).toBeInTheDocument();

      state.programs = { data: undefined, isLoading: false, isError: true };
      rerender(<StudioHome />);
      expect(screen.getByTestId('empty')).toHaveTextContent("We couldn't load your programs.");

      state.programs = { data: undefined, isLoading: false, isError: false };
      rerender(<StudioHome />);
      expect(screen.getByTestId('empty')).toHaveTextContent('No programs yet.');
    });
  });
});
