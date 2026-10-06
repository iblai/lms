import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CourseOutline, countUnits } from '../course-outline';
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

const root = (modules: CourseOutlineChildNode[]) =>
  makeNode({ id: 'root', display_name: 'Root', children: modules });

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

/** Module › lesson › four units, two of them complete. */
const halfDoneModule = makeNode({
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
});

const iconState = (scope: HTMLElement) =>
  within(scope).getByTestId('completion-icon').getAttribute('data-state');

describe('countUnits', () => {
  it('counts a leaf as one unit, complete or not', () => {
    expect(countUnits(makeNode({ complete: true }))).toEqual({ total: 1, done: 1 });
    expect(countUnits(makeNode({ complete: false }))).toEqual({ total: 1, done: 0 });
  });

  it('sums leaf units through every level', () => {
    expect(countUnits(halfDoneModule)).toEqual({ total: 4, done: 2 });
  });
});

describe('CourseOutline', () => {
  it('renders the skeleton while loading', () => {
    renderWithContext({ courseOutlineLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('outline-summary')).not.toBeInTheDocument();
  });

  it('renders nothing but the nav when the outline has no modules', () => {
    renderWithContext({ courseOutline: makeNode({ id: 'root', children: [] }) });
    expect(screen.getByRole('navigation', { name: 'Course outline' })).toBeInTheDocument();
    expect(screen.queryByTestId('outline-summary')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('outline-module')).toHaveLength(0);
  });

  it('summarises overall completion above the modules', () => {
    renderWithContext({ courseOutline: root([halfDoneModule]) });
    const summary = screen.getByTestId('outline-summary');
    expect(summary).toHaveTextContent('50%');
    expect(summary).toHaveTextContent('2 of 4 units completed');
    const bar = summary.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('50%');
    expect(bar.className).toContain('bg-amber-500');
  });

  it('fills the summary bar completely once everything is complete', () => {
    const done = makeNode({
      id: 'mod-1',
      display_name: 'Module 1',
      children: [makeNode({ id: 'lesson-1', display_name: 'Lesson 1', complete: true })],
    });
    renderWithContext({ courseOutline: root([done]) });
    const bar = screen.getByTestId('outline-summary').querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('100%');
    expect(screen.getByTestId('outline-summary')).toHaveTextContent('100%');
  });

  it('renders each module with its completion count', () => {
    const modules = [
      halfDoneModule,
      makeNode({ id: 'mod-2', display_name: 'Module 2', children: [] }),
    ];
    renderWithContext({ courseOutline: root(modules) });
    const [first, second] = screen.getAllByTestId('outline-module');
    expect(first).toHaveTextContent('Module 1');
    expect(within(first).getByTestId('outline-module-meta')).toHaveTextContent('2 of 4 completed');
    expect(second).toHaveTextContent('Module 2');
    expect(within(second).getByTestId('outline-module-meta')).toHaveTextContent('No content yet');
  });

  it('calls toggleModule on module click and reflects the expanded state', () => {
    const toggleModule = vi.fn();
    const { rerender } = render(
      <CourseOutlineContext.Provider
        value={{ ...defaultContext, courseOutline: root([halfDoneModule]), toggleModule }}
      >
        <CourseOutline />
      </CourseOutlineContext.Provider>,
    );
    const header = screen.getByRole('button', { name: /Module 1/ });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Lesson 1')).not.toBeInTheDocument();

    fireEvent.click(header);
    expect(toggleModule).toHaveBeenCalledWith('mod-1');

    rerender(
      <CourseOutlineContext.Provider
        value={{
          ...defaultContext,
          courseOutline: root([halfDoneModule]),
          toggleModule,
          expandedModule: 'mod-1',
        }}
      >
        <CourseOutline />
      </CourseOutlineContext.Provider>,
    );
    expect(screen.getByRole('button', { name: /Module 1/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
  });

  it('calls toggleLesson on lesson click and only marks expandable lessons', () => {
    const toggleLesson = vi.fn();
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Lesson 1',
            children: [makeNode({ id: 'sub-1', display_name: 'Sub 1' })],
          }),
          makeNode({ id: 'lesson-2', display_name: 'Lesson 2' }),
        ],
      }),
    ];
    renderWithContext({ courseOutline: root(modules), expandedModule: 'mod-1', toggleLesson });

    const [withUnits, leaf] = screen.getAllByTestId('outline-lesson');
    expect(withUnits).toHaveAttribute('aria-expanded', 'false');
    expect(leaf).not.toHaveAttribute('aria-expanded');

    fireEvent.click(withUnits);
    expect(toggleLesson).toHaveBeenCalledWith('lesson-1');
    expect(screen.queryByText('Sub 1')).not.toBeInTheDocument();
  });

  it('lists units under an expanded lesson and selects one on click', () => {
    const selectLesson = vi.fn();
    renderWithContext({
      courseOutline: root([halfDoneModule]),
      expandedModule: 'mod-1',
      expandedLessons: ['lesson-1'],
      selectLesson,
    });
    const units = screen.getAllByTestId('outline-unit');
    expect(units.map((unit) => unit.textContent)).toEqual(['Sub 1', 'Sub 2', 'Sub 3', 'Sub 4']);

    fireEvent.click(screen.getByText('Sub 3'));
    expect(selectLesson).toHaveBeenCalledWith('sub-3');
  });

  it('highlights the current lesson and unit', () => {
    renderWithContext({
      courseOutline: root([halfDoneModule]),
      expandedModule: 'mod-1',
      expandedLessons: ['lesson-1'],
      currentChapter: 'lesson-1',
      currentLesson: 'sub-3',
    });
    expect(screen.getByTestId('outline-lesson').className).toContain('text-amber-700');

    const current = screen.getByText('Sub 3').closest('button') as HTMLElement;
    expect(current).toHaveAttribute('aria-current', 'location');
    expect(current.className).toContain('bg-amber-50');
    const other = screen.getByText('Sub 1').closest('button') as HTMLElement;
    expect(other).not.toHaveAttribute('aria-current');
    // Word-bounded: the accent bar's `before:bg-amber-500` must not match.
    expect(other.className).not.toMatch(/(^|\s)bg-amber-50(\s|$)/);
  });

  it('flags graded and timed-exam lessons and units', () => {
    const modules = [
      makeNode({
        id: 'mod-1',
        display_name: 'Module 1',
        children: [
          makeNode({
            id: 'lesson-1',
            display_name: 'Exam',
            graded: true,
            special_exam_info: true,
            children: [makeNode({ id: 'sub-1', display_name: 'Attempt', graded: true })],
          }),
        ],
      }),
    ];
    renderWithContext({
      courseOutline: root(modules),
      expandedModule: 'mod-1',
      expandedLessons: ['lesson-1'],
    });
    const lesson = screen.getByTestId('outline-lesson');
    expect(within(lesson).getByTestId('outline-badge-graded')).toBeInTheDocument();
    expect(within(lesson).getByTestId('outline-badge-timed')).toBeInTheDocument();
    const unit = screen.getByTestId('outline-unit');
    expect(within(unit).getByTestId('outline-badge-graded')).toBeInTheDocument();
    expect(within(unit).queryByTestId('outline-badge-timed')).not.toBeInTheDocument();
  });
});

describe('CompletionIcon', () => {
  const renderLesson = (lesson: CourseOutlineChildNode) => {
    renderWithContext({
      courseOutline: root([
        makeNode({ id: 'mod-1', display_name: 'Module 1', children: [lesson] }),
      ]),
      expandedModule: 'mod-1',
    });
    return screen.getByTestId('outline-lesson');
  };

  it('renders an empty ring for an incomplete leaf', () => {
    const lesson = renderLesson(makeNode({ id: 'lesson-1', display_name: 'L', complete: false }));
    expect(iconState(lesson)).toBe('empty');
    const svg = within(lesson).getByTestId('completion-icon');
    expect(svg.querySelectorAll('circle')).toHaveLength(1);
    expect(svg.querySelector('path')).toBeNull();
  });

  it('renders a filled check for a complete leaf', () => {
    const lesson = renderLesson(makeNode({ id: 'lesson-1', display_name: 'L', complete: true }));
    expect(iconState(lesson)).toBe('complete');
    const svg = within(lesson).getByTestId('completion-icon');
    expect(svg.querySelector('circle')?.getAttribute('class')).toContain('fill-amber-500');
    expect(svg.querySelector('path')).not.toBeNull();
  });

  it('renders a progress arc for a parent with mixed completion', () => {
    const lesson = renderLesson(halfDoneModule.children![0]);
    expect(iconState(lesson)).toBe('partial');
    const circles = within(lesson).getByTestId('completion-icon').querySelectorAll('circle');
    expect(circles).toHaveLength(2);
    const arc = circles[1];
    expect(arc.getAttribute('class')).toContain('stroke-amber-500');
    const circumference = Number(arc.getAttribute('stroke-dasharray'));
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.5);
  });

  it('is complete only when every descendant is complete', () => {
    const lesson = renderLesson(
      makeNode({
        id: 'lesson-1',
        display_name: 'L',
        children: [
          makeNode({ id: 'sub-1', complete: true }),
          makeNode({ id: 'sub-2', complete: true }),
        ],
      }),
    );
    expect(iconState(lesson)).toBe('complete');
  });

  it('is empty when no descendant is complete', () => {
    const lesson = renderLesson(
      makeNode({
        id: 'lesson-1',
        display_name: 'L',
        children: [makeNode({ id: 'sub-1', complete: false }), makeNode({ id: 'sub-2' })],
      }),
    );
    expect(iconState(lesson)).toBe('empty');
  });

  it('averages completion recursively through nested levels', () => {
    // (1 + 0.5) / 2 = 0.75 of the way round.
    const lesson = renderLesson(
      makeNode({
        id: 'lesson-1',
        display_name: 'L',
        children: [
          makeNode({ id: 'sub-1', complete: true }),
          makeNode({
            id: 'sub-2',
            children: [
              makeNode({ id: 'unit-1', complete: true }),
              makeNode({ id: 'unit-2', complete: false }),
            ],
          }),
        ],
      }),
    );
    expect(iconState(lesson)).toBe('partial');
    const arc = within(lesson).getByTestId('completion-icon').querySelectorAll('circle')[1];
    const circumference = Number(arc.getAttribute('stroke-dasharray'));
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.25);
  });
});
