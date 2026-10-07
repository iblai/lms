'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  Cohort,
  CourseMode,
  GradingAssignmentType,
  GradingSubsection,
} from '@/types/instructor';
import { cn } from '@/lib/utils';

/** Everything the edX gradebook lets staff filter on, as form state ('' = unset). */
export interface GradebookFilters {
  assignmentType: string;
  /** `module_id` of one graded subsection. */
  assignment: string;
  assignmentGradeMin: string;
  assignmentGradeMax: string;
  courseGradeMin: string;
  courseGradeMax: string;
  cohortId: string;
  enrollmentMode: string;
  includeCourseTeam: boolean;
}

export const EMPTY_FILTERS: GradebookFilters = {
  assignmentType: '',
  assignment: '',
  assignmentGradeMin: '',
  assignmentGradeMax: '',
  courseGradeMin: '',
  courseGradeMax: '',
  cohortId: '',
  enrollmentMode: '',
  includeCourseTeam: false,
};

export const parsePercent = (value: string): number | undefined =>
  value.trim() === '' ? undefined : Number(value);

export const rangeError = (min: string, max: string): string | null => {
  const bounds = [parsePercent(min), parsePercent(max)];
  if (bounds.some((bound) => bound !== undefined && !(bound >= 0 && bound <= 100))) {
    return 'Use percentages from 0 to 100.';
  }
  const [lo, hi] = bounds;
  if (lo !== undefined && hi !== undefined && lo > hi) return 'Min can’t be above max.';
  return null;
};

const describeRange = (min: string, max: string) => {
  if (min && max) return `${min}–${max}%`;
  return min ? `≥ ${min}%` : `≤ ${max}%`;
};

export interface FilterOptions {
  assignmentTypes: GradingAssignmentType[];
  subsections: GradingSubsection[];
  cohorts: Cohort[];
  courseModes: CourseMode[];
}

interface FilterChip {
  key: keyof GradebookFilters;
  label: string;
}

/** The chips shown under the toolbar, one per filter in effect. */
export const activeFilterChips = (
  filters: GradebookFilters,
  options: FilterOptions,
): FilterChip[] => {
  const chips: FilterChip[] = [];
  if (filters.assignmentType)
    chips.push({ key: 'assignmentType', label: `Type: ${filters.assignmentType}` });
  if (filters.assignment) {
    const subsection = options.subsections.find((s) => s.module_id === filters.assignment);
    chips.push({
      key: 'assignment',
      label: `Assignment: ${subsection?.short_label ?? subsection?.display_name ?? filters.assignment}`,
    });
    if (filters.assignmentGradeMin || filters.assignmentGradeMax) {
      chips.push({
        key: 'assignmentGradeMin',
        label: `Assignment grade ${describeRange(filters.assignmentGradeMin, filters.assignmentGradeMax)}`,
      });
    }
  }
  if (filters.courseGradeMin || filters.courseGradeMax) {
    chips.push({
      key: 'courseGradeMin',
      label: `Overall grade ${describeRange(filters.courseGradeMin, filters.courseGradeMax)}`,
    });
  }
  if (filters.cohortId) {
    const cohort = options.cohorts.find((c) => String(c.id) === filters.cohortId);
    chips.push({ key: 'cohortId', label: `Cohort: ${cohort?.name ?? filters.cohortId}` });
  }
  if (filters.enrollmentMode) {
    const mode = options.courseModes.find((m) => m.slug === filters.enrollmentMode);
    chips.push({ key: 'enrollmentMode', label: `Track: ${mode?.name ?? filters.enrollmentMode}` });
  }
  if (filters.includeCourseTeam)
    chips.push({ key: 'includeCourseTeam', label: 'Course team included' });
  return chips;
};

/** Drops one filter and whatever depends on it (type → assignment → its grade range). */
export const withoutFilter = (
  filters: GradebookFilters,
  key: keyof GradebookFilters,
): GradebookFilters => {
  switch (key) {
    case 'assignmentType':
      return {
        ...filters,
        assignmentType: '',
        assignment: '',
        assignmentGradeMin: '',
        assignmentGradeMax: '',
      };
    case 'assignment':
      return { ...filters, assignment: '', assignmentGradeMin: '', assignmentGradeMax: '' };
    case 'assignmentGradeMin':
    case 'assignmentGradeMax':
      return { ...filters, assignmentGradeMin: '', assignmentGradeMax: '' };
    case 'courseGradeMin':
    case 'courseGradeMax':
      return { ...filters, courseGradeMin: '', courseGradeMax: '' };
    case 'includeCourseTeam':
      return { ...filters, includeCourseTeam: false };
    default:
      return { ...filters, [key]: '' };
  }
};

const SectionHeading = ({ children }: { children: string }) => (
  <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">{children}</p>
);

const PercentRange = ({
  id,
  label,
  min,
  max,
  disabled,
  hideLabel,
  onChange,
}: {
  id: string;
  label: string;
  min: string;
  max: string;
  disabled?: boolean;
  /** When the section heading already says it. */
  hideLabel?: boolean;
  onChange: (min: string, max: string) => void;
}) => {
  const error = rangeError(min, max);
  return (
    <div className="space-y-1">
      {!hideLabel && <span className="text-xs font-medium text-gray-700">{label}</span>}
      <div className="grid grid-cols-2 gap-2">
        <Input
          id={`${id}-min`}
          type="number"
          min={0}
          max={100}
          placeholder="Min %"
          aria-label={`${label} min`}
          value={min}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value, max)}
          className="h-9"
        />
        <Input
          id={`${id}-max`}
          type="number"
          min={0}
          max={100}
          placeholder="Max %"
          aria-label={`${label} max`}
          value={max}
          disabled={disabled}
          onChange={(event) => onChange(min, event.target.value)}
          className="h-9"
        />
      </div>
      {error && !disabled && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * "Filters" button + popover mirroring the edX gradebook's filter drawer.
 * Edits are a draft until "Apply"; closing the popover discards them.
 */
export function GradebookFiltersPopover({
  value,
  options,
  onApply,
}: {
  value: GradebookFilters;
  options: FilterOptions;
  onApply: (filters: GradebookFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GradebookFilters>(value);
  const activeCount = activeFilterChips(value, options).length;

  const assignments = options.subsections.filter(
    (subsection) => !draft.assignmentType || subsection.assignment_type === draft.assignmentType,
  );
  const invalid =
    (draft.assignment && rangeError(draft.assignmentGradeMin, draft.assignmentGradeMax)) ||
    rangeError(draft.courseGradeMin, draft.courseGradeMax);

  const setType = (assignmentType: string) => {
    const keepAssignment = options.subsections.some(
      (s) =>
        s.module_id === draft.assignment &&
        (!assignmentType || s.assignment_type === assignmentType),
    );
    setDraft(
      keepAssignment
        ? { ...draft, assignmentType }
        : withoutFilter({ ...draft, assignmentType }, 'assignment'),
    );
  };
  const setAssignment = (assignment: string) =>
    setDraft(assignment ? { ...draft, assignment } : withoutFilter(draft, 'assignment'));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          aria-label="Edit filters"
          data-testid="gradebook-filters-trigger"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-sm space-y-4 overflow-y-auto border-gray-200 p-4 shadow-lg"
        data-testid="gradebook-filters"
      >
        <div className="space-y-2">
          <SectionHeading>Assignments</SectionHeading>
          <div className="space-y-1">
            <Label htmlFor="filter-assignment-type" className="text-xs">
              Assignment type
            </Label>
            <NativeSelect
              id="filter-assignment-type"
              value={draft.assignmentType}
              onChange={(event) => setType(event.target.value)}
              className="w-full"
            >
              <option value="">All types</option>
              {options.assignmentTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.type}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-assignment" className="text-xs">
              Assignment
            </Label>
            <NativeSelect
              id="filter-assignment"
              value={draft.assignment}
              onChange={(event) => setAssignment(event.target.value)}
              disabled={assignments.length === 0}
              className="w-full"
            >
              <option value="">
                {assignments.length === 0 ? 'No graded assignments' : 'All assignments'}
              </option>
              {assignments.map((subsection) => (
                <option key={subsection.module_id} value={subsection.module_id}>
                  {subsection.short_label ? `${subsection.short_label} · ` : ''}
                  {subsection.display_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <PercentRange
            id="filter-assignment-grade"
            label="Assignment grade"
            min={draft.assignmentGradeMin}
            max={draft.assignmentGradeMax}
            disabled={!draft.assignment}
            onChange={(assignmentGradeMin, assignmentGradeMax) =>
              setDraft({ ...draft, assignmentGradeMin, assignmentGradeMax })
            }
          />
          {!draft.assignment && (
            <p className="text-xs text-gray-500">Pick an assignment to filter by its grade.</p>
          )}
        </div>

        <div className="space-y-2">
          <SectionHeading>Overall grade</SectionHeading>
          <PercentRange
            id="filter-course-grade"
            label="Overall grade"
            hideLabel
            min={draft.courseGradeMin}
            max={draft.courseGradeMax}
            onChange={(courseGradeMin, courseGradeMax) =>
              setDraft({ ...draft, courseGradeMin, courseGradeMax })
            }
          />
        </div>

        <div className="space-y-2">
          <SectionHeading>Learner groups</SectionHeading>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="filter-track" className="text-xs">
                Track
              </Label>
              <NativeSelect
                id="filter-track"
                value={draft.enrollmentMode}
                onChange={(event) => setDraft({ ...draft, enrollmentMode: event.target.value })}
                disabled={options.courseModes.length === 0}
                className="w-full"
              >
                <option value="">All tracks</option>
                {options.courseModes.map((mode) => (
                  <option key={mode.slug} value={mode.slug}>
                    {mode.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-cohort" className="text-xs">
                Cohort
              </Label>
              <NativeSelect
                id="filter-cohort"
                value={draft.cohortId}
                onChange={(event) => setDraft({ ...draft, cohortId: event.target.value })}
                disabled={options.cohorts.length === 0}
                className="w-full"
              >
                <option value="">
                  {options.cohorts.length === 0 ? 'No cohorts' : 'All cohorts'}
                </option>
                {options.cohorts.map((cohort) => (
                  <option key={cohort.id} value={String(cohort.id)}>
                    {cohort.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-include-course-team"
              checked={draft.includeCourseTeam}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, includeCourseTeam: checked === true })
              }
              className="border-gray-300 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white"
            />
            <Label
              htmlFor="filter-include-course-team"
              className="text-sm font-normal text-gray-700"
            >
              Include course team members
            </Label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(EMPTY_FILTERS)}>
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={Boolean(invalid)}
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** One removable chip per active filter, plus "Clear all". */
export function GradebookFilterChips({
  value,
  options,
  onChange,
}: {
  value: GradebookFilters;
  options: FilterOptions;
  onChange: (filters: GradebookFilters) => void;
}) {
  const chips = activeFilterChips(value, options);
  if (chips.length === 0) return null;
  return (
    <ul
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Active filters"
      data-testid="gradebook-filter-chips"
    >
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onChange(withoutFilter(value, chip.key))}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 pr-1.5 pl-2.5 text-xs font-medium text-amber-700 hover:bg-amber-100',
            )}
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label}
            <X className="h-3 w-3" aria-hidden />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="h-7 px-2 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          Clear all
        </button>
      </li>
    </ul>
  );
}
