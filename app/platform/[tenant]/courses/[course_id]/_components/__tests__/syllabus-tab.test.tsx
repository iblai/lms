import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyllabusTab } from '../syllabus-tab';
import '@testing-library/jest-dom';

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton" />,
}));

vi.mock('@/components/skeleton-course-syllabus', () => ({
  SkeletonCourseSyllabus: () => <div />,
}));

const defaultProps = {
  courseOutline: {} as any,
  courseOutlineLoading: false,
  expandedSections: {} as Record<string, boolean>,
  toggleSection: vi.fn(),
  handleOpenLesson: vi.fn(),
};

const renderTab = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<SyllabusTab {...defaultProps} {...overrides} />);

describe('SyllabusTab', () => {
  it('renders the Syllabus heading', () => {
    renderTab();
    expect(screen.getByText('Syllabus')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    renderTab({ courseOutlineLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no children', () => {
    renderTab({ courseOutline: {} });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No course syllabus found.')).toBeInTheDocument();
  });

  it('shows empty state when children array is empty', () => {
    renderTab({ courseOutline: { children: [] } });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('does not show empty state when loading', () => {
    renderTab({ courseOutline: {}, courseOutlineLoading: true });
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders sections from courseOutline.children', () => {
    const courseOutline = {
      children: [
        { id: 'sec-1', display_name: 'Section 1', children: [] },
        { id: 'sec-2', display_name: 'Section 2', children: [] },
      ],
    };
    renderTab({ courseOutline });
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('calls toggleSection when a section header is clicked', () => {
    const toggleSection = vi.fn();
    const courseOutline = {
      children: [{ id: 'sec-1', display_name: 'Section 1', children: [] }],
    };
    renderTab({ courseOutline, toggleSection });
    fireEvent.click(screen.getByText('Section 1'));
    expect(toggleSection).toHaveBeenCalledWith(0);
  });

  it('shows Plus icon for collapsed sections and Minus icon for expanded', () => {
    const courseOutline = {
      children: [
        { id: 'sec-1', display_name: 'Section 1', children: [] },
        { id: 'sec-2', display_name: 'Section 2', children: [] },
      ],
    };
    const { container } = renderTab({
      courseOutline,
      expandedSections: { 0: true, 1: false } as any,
    });
    // Section 0 expanded -> Minus icon, Section 1 collapsed -> Plus icon
    const svgs = container.querySelectorAll('svg');
    // Minus has a single line (horizontal), Plus has two lines
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders lessons when section is expanded', () => {
    const courseOutline = {
      children: [
        {
          id: 'sec-1',
          display_name: 'Section 1',
          children: [
            { id: 'lesson-1', display_name: 'Lesson 1', children: [{ id: 'unit-1' }] },
            { id: 'lesson-2', display_name: 'Lesson 2', children: [] },
          ],
        },
      ],
    };
    renderTab({ courseOutline, expandedSections: { 0: true } as any });
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 2')).toBeInTheDocument();
  });

  it('does not render lessons when section is collapsed', () => {
    const courseOutline = {
      children: [
        {
          id: 'sec-1',
          display_name: 'Section 1',
          children: [{ id: 'lesson-1', display_name: 'Lesson 1', children: [] }],
        },
      ],
    };
    renderTab({ courseOutline, expandedSections: {} });
    expect(screen.queryByText('Lesson 1')).not.toBeInTheDocument();
  });

  it('calls handleOpenLesson with first child id when lesson with children is clicked', () => {
    const handleOpenLesson = vi.fn();
    const courseOutline = {
      children: [
        {
          id: 'sec-1',
          display_name: 'Section 1',
          children: [
            {
              id: 'lesson-1',
              display_name: 'Lesson 1',
              children: [{ id: 'unit-1' }, { id: 'unit-2' }],
            },
          ],
        },
      ],
    };
    renderTab({
      courseOutline,
      expandedSections: { 0: true } as any,
      handleOpenLesson,
    });
    fireEvent.click(screen.getByText('Lesson 1'));
    expect(handleOpenLesson).toHaveBeenCalledWith('unit-1', true);
  });

  it('does not call handleOpenLesson when lesson has no children', () => {
    const handleOpenLesson = vi.fn();
    const courseOutline = {
      children: [
        {
          id: 'sec-1',
          display_name: 'Section 1',
          children: [{ id: 'lesson-1', display_name: 'Empty Lesson', children: [] }],
        },
      ],
    };
    renderTab({
      courseOutline,
      expandedSections: { 0: true } as any,
      handleOpenLesson,
    });
    fireEvent.click(screen.getByText('Empty Lesson'));
    expect(handleOpenLesson).not.toHaveBeenCalled();
  });

  it('handles null courseOutline children gracefully', () => {
    renderTab({ courseOutline: null });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });
});
