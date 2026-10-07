import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { SkeletonMultiplier } from './skeleton-multiplier';
import { ChevronDown, ClipboardCheck, TimerIcon } from 'lucide-react';
import { useContext } from 'react';
import { SkeletonCourseOutline } from './skeleton-course-outline';
import { CourseOutlineChildNode } from '@/types/courses';
import { cn } from '@/lib/utils';
import { clampPercentage } from './course-content-header';

const hasChildren = (node: CourseOutlineChildNode) =>
  Array.isArray(node.children) && node.children.length > 0;

const getCompletionRatio = (node: CourseOutlineChildNode): number => {
  if (!hasChildren(node)) {
    return node.complete ? 1 : 0;
  }
  const children = node.children as CourseOutlineChildNode[];
  const completedScore = children.reduce((acc, child) => acc + getCompletionRatio(child), 0);
  return completedScore / children.length;
};

/** Leaf units under a node: how many there are and how many are complete. */
export const countUnits = (node: CourseOutlineChildNode): { total: number; done: number } => {
  if (!hasChildren(node)) {
    return { total: 1, done: node.complete ? 1 : 0 };
  }
  return (node.children as CourseOutlineChildNode[]).reduce(
    (acc, child) => {
      const counts = countUnits(child);
      return { total: acc.total + counts.total, done: acc.done + counts.done };
    },
    { total: 0, done: 0 },
  );
};

type CompletionState = 'complete' | 'partial' | 'empty';

const getCompletionState = (ratio: number): CompletionState => {
  if (ratio >= 1) return 'complete';
  if (ratio > 0) return 'partial';
  return 'empty';
};

const STROKE_WIDTH = 2;

/**
 * Completion ring: a filled check once everything underneath is complete, an
 * arc for partial progress, an empty ring for nothing started.
 */
export const CompletionIcon = ({
  node,
  size = 18,
  className,
}: {
  node: CourseOutlineChildNode;
  size?: number;
  className?: string;
}) => {
  const ratio = getCompletionRatio(node);
  const state = getCompletionState(ratio);
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  // Check mark drawn in a 16-unit box, scaled to the ring size.
  const checkScale = size / 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0', className)}
      aria-hidden
      data-testid="completion-icon"
      data-state={state}
    >
      {state === 'complete' ? (
        <>
          <circle cx={center} cy={center} r={radius} className="fill-amber-500" />
          <path
            d="M5 8.5L7 10.5L11 6"
            transform={`scale(${checkScale})`}
            fill="none"
            className="stroke-white"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            className="stroke-gray-300"
          />
          {state === 'partial' && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className="stroke-amber-500"
            />
          )}
        </>
      )}
    </svg>
  );
};

const LessonBadges = ({ node }: { node: CourseOutlineChildNode }) => (
  <>
    {node.special_exam_info && (
      <TimerIcon
        className="h-3.5 w-3.5 shrink-0 text-gray-400"
        aria-label="Timed exam"
        data-testid="outline-badge-timed"
      />
    )}
    {node.graded && (
      <ClipboardCheck
        className="h-3.5 w-3.5 shrink-0 text-gray-400"
        aria-label="Graded"
        data-testid="outline-badge-graded"
      />
    )}
  </>
);

const UnitRow = ({
  unit,
  current,
  onSelect,
}: {
  unit: CourseOutlineChildNode;
  current: boolean;
  onSelect: () => void;
}) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      aria-current={current ? 'location' : undefined}
      data-testid="outline-unit"
      className={cn(
        'relative flex w-full items-start gap-2.5 rounded-md py-2 pr-2 pl-2.5 text-left text-sm leading-snug transition-colors',
        // Accent bar sits on the guide line of the parent list.
        'before:absolute before:top-1.5 before:bottom-1.5 before:-left-[13px] before:w-0.5 before:rounded-full before:bg-amber-500 before:opacity-0',
        current
          ? 'bg-amber-50 font-medium text-amber-700 before:opacity-100'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <CompletionIcon node={unit} size={16} className="mt-0.5" />
      <span className="min-w-0 flex-1">{unit.display_name}</span>
      <span className="mt-0.5 flex shrink-0 items-center gap-1">
        <LessonBadges node={unit} />
      </span>
    </button>
  </li>
);

const LessonRow = ({
  lesson,
  expanded,
  current,
  currentUnit,
  onToggle,
  onSelectUnit,
}: {
  lesson: CourseOutlineChildNode;
  expanded: boolean;
  current: boolean;
  currentUnit: string;
  onToggle: () => void;
  onSelectUnit: (id: string) => void;
}) => {
  const expandable = hasChildren(lesson);
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expandable ? expanded : undefined}
        data-testid="outline-lesson"
        className={cn(
          // pl-7: one step in from the module header, so the hierarchy reads.
          'flex w-full items-start gap-2.5 py-2 pr-3 pl-7 text-left text-sm leading-snug transition-colors',
          current ? 'font-medium text-amber-700' : 'text-gray-700 hover:bg-gray-50',
        )}
      >
        <CompletionIcon node={lesson} className="mt-0.5" />
        <span className="min-w-0 flex-1">{lesson.display_name}</span>
        <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <LessonBadges node={lesson} />
          {expandable && (
            <ChevronDown
              className={cn('h-4 w-4 text-gray-400 transition-transform', expanded && 'rotate-180')}
              aria-hidden
            />
          )}
        </span>
      </button>
      {/* Guide line under the lesson icon's centre (pl-7 + half the 18px ring). */}
      {expandable && expanded && (
        <ol className="mt-0.5 mr-2 mb-1 ml-[2.3rem] border-l border-gray-200 pl-3">
          {(lesson.children as CourseOutlineChildNode[]).map((unit) => (
            <UnitRow
              key={unit.id}
              unit={unit}
              current={currentUnit === unit.id}
              onSelect={() => onSelectUnit(unit.id)}
            />
          ))}
        </ol>
      )}
    </li>
  );
};

const ModuleSection = ({
  module,
  expanded,
  expandedLessons,
  currentChapter,
  currentLesson,
  onToggle,
  onToggleLesson,
  onSelectUnit,
}: {
  module: CourseOutlineChildNode;
  expanded: boolean;
  expandedLessons: string[];
  currentChapter: string;
  currentLesson: string;
  onToggle: () => void;
  onToggleLesson: (id: string) => void;
  onSelectUnit: (id: string) => void;
}) => {
  const { total, done } = countUnits(module);
  const lessons = hasChildren(module) ? (module.children as CourseOutlineChildNode[]) : [];
  return (
    <section
      className={cn('border-b border-gray-200', expanded && 'bg-white')}
      data-testid="outline-module"
      data-expanded={expanded}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-gray-50',
          expanded && 'bg-gray-50/60',
        )}
      >
        <CompletionIcon node={module} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900">{module.display_name}</span>
          <span className="mt-0.5 block text-xs text-gray-500" data-testid="outline-module-meta">
            {hasChildren(module) ? `${done} of ${total} completed` : 'No content yet'}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {expanded && lessons.length > 0 && (
        <ol className="pb-2">
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              expanded={expandedLessons.includes(lesson.id)}
              current={currentChapter === lesson.id}
              currentUnit={currentLesson}
              onToggle={() => onToggleLesson(lesson.id)}
              onSelectUnit={onSelectUnit}
            />
          ))}
        </ol>
      )}
    </section>
  );
};

export const CourseOutline = () => {
  const {
    courseOutline,
    courseOutlineLoading,
    expandedModule,
    expandedLessons,
    selectLesson,
    toggleModule,
    toggleLesson,
    currentChapter,
    currentLesson,
    completionPercentage,
  } = useContext(CourseOutlineContext);

  const modules = Array.isArray(courseOutline?.children) ? courseOutline.children : [];
  const { total, done } = modules.reduce(
    (acc, module) => {
      const counts = countUnits(module);
      return { total: acc.total + counts.total, done: acc.done + counts.done };
    },
    { total: 0, done: 0 },
  );
  // Same figure as the header's progress ring, not a recount of the units.
  const percent = clampPercentage(completionPercentage);

  return (
    <nav
      aria-label="Course outline"
      className="h-full overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
      data-testid="course-outline"
    >
      {courseOutlineLoading ? (
        <SkeletonMultiplier multiplier={8} Skeleton={SkeletonCourseOutline} />
      ) : (
        <>
          {modules.length > 0 && (
            <div className="border-b border-gray-200 px-4 py-3" data-testid="outline-summary">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-gray-600">
                  {done} of {total} units completed
                </p>
                <p className="text-xs font-medium text-gray-700">{percent}%</p>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
          {modules.map((module) => (
            <ModuleSection
              key={module.id}
              module={module}
              expanded={expandedModule === module.id}
              expandedLessons={expandedLessons}
              currentChapter={currentChapter}
              currentLesson={currentLesson}
              onToggle={() => toggleModule(module.id)}
              onToggleLesson={toggleLesson}
              onSelectUnit={selectLesson}
            />
          ))}
        </>
      )}
    </nav>
  );
};
