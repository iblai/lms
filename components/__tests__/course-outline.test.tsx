import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseOutline } from '../course-outline';
import { CourseOutlineContext, CourseOutlineContextType } from '@/contexts/course-outline-context';
import { CourseOutlineChildNode } from '@/types/courses';
import '@testing-library/jest-dom';

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: () => <div data-testid="skeleton" />,
}));

vi.mock('../skeleton-course-outline', () => ({
  SkeletonCourseOutline: () => <div />,
}));

const makeNode = (overrides: Partial<CourseOutlineChildNode> = {}): CourseOutlineChildNode => ({
  id: 'node-1',
  block_id: 'block-1',
  type: 'html',
  display_name: 'Node 1',
  ...overrides,
});

const defaultContext: CourseOutlineContextType = {
  courseOutline: {} as CourseOutlineChildNode,
  courseOutlineLoading: false,
  expandedModule: '',
  expandedLessons: [],
  selectLesson: vi.fn(),
  toggleModule: vi.fn(),
  toggleLesson: vi.fn(),
  currentChapter: '',
  currentLesson: '',
  course: null,
  courseOutlineDrawerOpen: false,
  setCourseOutlineDrawerOpen: vi.fn(),
  currentUnitID: null,
  refetchCourseOutline: vi.fn(),
};

const renderWithContext = (ctx: Partial<CourseOutlineContextType> = {}) =>
  render(
    <CourseOutlineContext.Provider value={{ ...defaultContext, ...ctx }}>
      <CourseOutline />
    </CourseOutlineContext.Provider>,
  );

describe('CourseOutline', () => {
  it('renders skeleton when loading', () => {
    renderWithContext({ courseOutlineLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders module names', () => {
    const modules = [
      makeNode({ id: 'mod-1', display_name: 'Module 1', children: [] }),
      makeNode({ id: 'mod-2', display_name: 'Module 2', children: [] }),
    ];
    renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
    });
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Module 2')).toBeInTheDocument();
  });

  it('shows lessons when module is expanded', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({ id: 'lesson-1', display_name: 'Lesson 1' }),
          makeNode({ id: 'lesson-2', display_name: 'Lesson 2' }),
        ],
      }),
    ];
    renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 2')).toBeInTheDocument();
  });

  it('calls toggleModule on module click', () => {
    const toggleModule = vi.fn();
    const modules = [makeNode({ id: 'mod-1', display_name: 'Module 1' })];
    renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      toggleModule,
    });
    fireEvent.click(screen.getByText('Module 1'));
    expect(toggleModule).toHaveBeenCalledWith('mod-1');
  });
});

describe('CompletionIcon rendering', () => {
  it('renders empty circle for incomplete leaf node', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [makeNode({ id: 'lesson-1', display_name: 'Lesson 1', complete: false })],
      }),
    ];
    const { container } = renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    const svgs = container.querySelectorAll('svg');
    // The lesson's completion icon SVG
    // svgs[0] is the module's ChevronRight, svgs[1] is the CompletionIcon
    const lessonSvg = svgs[1];
    expect(lessonSvg).toBeTruthy();
    // Empty circle has gray stroke (#d1d5db)
    const circle = lessonSvg.querySelector('circle');
    expect(circle?.getAttribute('stroke')).toBe('#d1d5db');
  });

  it('renders filled amber check for fully complete leaf node', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [makeNode({ id: 'lesson-1', display_name: 'Lesson 1', complete: true })],
      }),
    ];
    const { container } = renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    const svgs = container.querySelectorAll('svg');
    // svgs[0] is the module's ChevronRight, svgs[1] is the CompletionIcon
    const lessonSvg = svgs[1];
    // Filled circle has amber fill (#f59e0b)
    const circle = lessonSvg.querySelector('circle');
    expect(circle?.getAttribute('fill')).toBe('#f59e0b');
    // Has a checkmark path
    const path = lessonSvg.querySelector('path');
    expect(path).toBeTruthy();
  });

  it('renders partial progress for parent with mixed children completion', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [
              makeNode({ id: 'sub-1', display_name: 'Sub 1', complete: true }),
              makeNode({ id: 'sub-2', display_name: 'Sub 2', complete: true }),
              makeNode({ id: 'sub-3', display_name: 'Sub 3', complete: false }),
              makeNode({ id: 'sub-4', display_name: 'Sub 4', complete: false }),
            ],
          }),
        ],
      }),
    ];
    const { container } = renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    const svgs = container.querySelectorAll('svg');
    // svgs[0] is the module's ChevronRight, svgs[1] is the CompletionIcon
    const lessonSvg = svgs[1];
    // Partial progress has two circles (background + progress arc)
    const circles = lessonSvg.querySelectorAll('circle');
    expect(circles.length).toBe(2);
    // The progress arc has amber stroke
    const progressCircle = circles[1];
    expect(progressCircle.getAttribute('stroke')).toBe('#f59e0b');
  });

  it('renders full completion when all children are complete', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [
              makeNode({ id: 'sub-1', display_name: 'Sub 1', complete: true }),
              makeNode({ id: 'sub-2', display_name: 'Sub 2', complete: true }),
            ],
          }),
        ],
      }),
    ];
    const { container } = renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    const svgs = container.querySelectorAll('svg');
    // svgs[0] is the module's ChevronRight, svgs[1] is the CompletionIcon
    const lessonSvg = svgs[1];
    // Full completion: amber filled circle with checkmark
    const circle = lessonSvg.querySelector('circle');
    expect(circle?.getAttribute('fill')).toBe('#f59e0b');
    const path = lessonSvg.querySelector('path');
    expect(path).toBeTruthy();
  });

  it('renders empty circle when no children are complete', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [
              makeNode({ id: 'sub-1', display_name: 'Sub 1', complete: false }),
              makeNode({ id: 'sub-2', display_name: 'Sub 2', complete: false }),
            ],
          }),
        ],
      }),
    ];
    const { container } = renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    const svgs = container.querySelectorAll('svg');
    // svgs[0] is the module's ChevronRight, svgs[1] is the CompletionIcon
    const lessonSvg = svgs[1];
    // Empty: single circle with gray stroke
    const circles = lessonSvg.querySelectorAll('circle');
    expect(circles.length).toBe(1);
    expect(circles[0].getAttribute('stroke')).toBe('#d1d5db');
  });

  it('renders sublessons when a lesson is expanded', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [
              makeNode({ id: 'sub-1', display_name: 'Sub 1', complete: false }),
              makeNode({ id: 'sub-2', display_name: 'Sub 2', complete: true }),
            ],
          }),
        ],
      }),
    ];
    renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
      expandedLessons: ['lesson-1'],
    });
    expect(screen.getByText('Sub 1')).toBeInTheDocument();
    expect(screen.getByText('Sub 2')).toBeInTheDocument();
  });

  it('calls selectLesson when a sublesson is clicked', () => {
    const selectLesson = vi.fn();
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [makeNode({ id: 'sub-1', display_name: 'Sub 1', complete: false })],
          }),
        ],
      }),
    ];
    renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
      expandedLessons: ['lesson-1'],
      selectLesson,
    });
    fireEvent.click(screen.getByText('Sub 1'));
    expect(selectLesson).toHaveBeenCalledWith('sub-1');
  });

  it('highlights the current sublesson', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [
              makeNode({ id: 'sub-1', display_name: 'Sub 1', complete: false }),
              makeNode({ id: 'sub-2', display_name: 'Sub 2', complete: false }),
            ],
          }),
        ],
      }),
    ];
    renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
      expandedLessons: ['lesson-1'],
      currentLesson: 'sub-1',
    });
    const sub1Button = screen.getByText('Sub 1').closest('button');
    expect(sub1Button?.className).toContain('bg-amber-50');
  });

  it('calculates recursive completion correctly for deeply nested nodes', () => {
    // Parent with 2 children: one fully complete, one half complete
    // Expected ratio: (1 + 0.5) / 2 = 0.75 => level = round(0.75 * 7) = 5
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [
              makeNode({
                id: 'sub-1',
                display_name: 'Sub 1',
                complete: true,
              }),
              makeNode({
                id: 'sub-2',
                display_name: 'Sub 2',
                children: [
                  makeNode({ id: 'unit-1', display_name: 'Unit 1', complete: true }),
                  makeNode({ id: 'unit-2', display_name: 'Unit 2', complete: false }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];
    const { container } = renderWithContext({
      courseOutline: makeNode({ id: 'root', display_name: 'Root', children: modules }),
      expandedModule: 'mod-1',
    });
    const svgs = container.querySelectorAll('svg');
    // svgs[0] is the module's ChevronRight, svgs[1] is the CompletionIcon
    const lessonSvg = svgs[1];
    // Partial progress (level 5 of 7) -> two circles
    const circles = lessonSvg.querySelectorAll('circle');
    expect(circles.length).toBe(2);
    expect(circles[1].getAttribute('stroke')).toBe('#f59e0b');
  });
});
