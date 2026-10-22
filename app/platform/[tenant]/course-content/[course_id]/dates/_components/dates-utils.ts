import type { CourseDateBlock } from '@/types/course-home';

/** A date block plus the flags the timeline derives for it. */
export interface TimelineItem extends CourseDateBlock {
  /** The first unfinished assignment due today or later. */
  dueNext?: boolean;
}

export interface TimelineDay {
  date: Date;
  items: TimelineItem[];
  first: boolean;
  last: boolean;
  /** The synthetic "today" row inserted between past and future dates. */
  today: boolean;
}

export type BadgeTone = 'today' | 'completed' | 'pastDue' | 'dueNext' | 'unreleased' | 'locked';

export interface TimelineBadge {
  key: BadgeTone;
  label: string;
}

/** Compares two dates by calendar day only, ignoring the time of day. */
export const daycmp = (a: Date, b: Date) => {
  const left = [a.getFullYear(), a.getMonth(), a.getDate()];
  const right = [b.getFullYear(), b.getMonth(), b.getDate()];
  for (let i = 0; i < 3; i += 1) {
    if (left[i] < right[i]) return -1;
    if (left[i] > right[i]) return 1;
  }
  return 0;
};

export const isLearnerAssignment = (item: CourseDateBlock) =>
  item.learner_has_access && item.date_type === 'assignment-due-date';

const isComplete = (item: CourseDateBlock) => item.complete === true;
const isPastDue = (item: CourseDateBlock, now: Date) =>
  !isComplete(item) && new Date(item.date) < now;
const isUnreleased = (item: CourseDateBlock) => !item.link;

/**
 * Groups the API's (sorted) date blocks by day, marks the next due assignment
 * and slots a "today" row in where it falls — the edX dates timeline's grouping.
 */
export const groupDateBlocks = (blocks: CourseDateBlock[], now = new Date()): TimelineDay[] => {
  const days: TimelineDay[] = [];
  let foundNextDue = false;
  let foundToday = false;
  const push = (date: Date, items: TimelineItem[], today = false) =>
    days.push({ date, items, first: days.length === 0, last: false, today });

  blocks.forEach((block) => {
    const item: TimelineItem = { ...block };
    const date = new Date(item.date);
    if (!foundNextDue && date >= now && isLearnerAssignment(item) && !item.complete) {
      foundNextDue = true;
      item.dueNext = true;
    }
    if (!foundToday) {
      const compared = daycmp(date, now);
      if (compared === 0) {
        foundToday = true;
      } else if (compared > 0) {
        foundToday = true;
        push(now, [], true);
      }
    }
    const previous = days[days.length - 1];
    if (!previous || daycmp(previous.date, date) !== 0) {
      push(date, [item]);
    } else {
      previous.items.push(item);
    }
  });
  if (!foundToday) push(now, [], true);
  if (days.length) days[days.length - 1].last = true;
  return days;
};

/**
 * Badges for one item, or for the whole day when `item` is null. Ordered by
 * priority: the first one colours the day's dot. Mirrors the edX timeline's
 * rules, so a badge the day already carries isn't repeated on its items.
 */
export const badgesFor = (
  date: Date,
  item: TimelineItem | null,
  items: TimelineItem[],
  now = new Date(),
): TimelineBadge[] => {
  const assignments = items.filter(isLearnerAssignment);
  const isToday = daycmp(date, now) === 0;
  const rules: Array<{
    key: BadgeTone;
    label: string;
    day: boolean;
    item?: (candidate: TimelineItem) => boolean;
  }> = [
    { key: 'today', label: 'Today', day: isToday },
    {
      key: 'completed',
      label: 'Completed',
      day: assignments.length > 0 && assignments.every(isComplete),
      item: (candidate) => isLearnerAssignment(candidate) && isComplete(candidate),
    },
    {
      key: 'pastDue',
      label: 'Past due',
      day: assignments.length > 0 && assignments.every((candidate) => isPastDue(candidate, now)),
      item: (candidate) => isLearnerAssignment(candidate) && isPastDue(candidate, now),
    },
    {
      key: 'dueNext',
      label: 'Due next',
      day: !isToday && assignments.some((candidate) => candidate.dueNext),
      item: (candidate) => candidate.dueNext === true,
    },
    {
      key: 'unreleased',
      label: 'Not yet released',
      day: assignments.length > 0 && assignments.every(isUnreleased),
      item: (candidate) => isLearnerAssignment(candidate) && isUnreleased(candidate),
    },
    {
      key: 'locked',
      label: 'Verified only',
      day: items.length > 0 && items.every((candidate) => !candidate.learner_has_access),
      item: (candidate) => !candidate.learner_has_access,
    },
  ];
  return rules
    .filter((rule) => (item ? !rule.day && rule.item?.(item) : rule.day))
    .map(({ key, label }) => ({ key, label }));
};

const timeZoneOptions = (timeZone: string | null | undefined) => {
  if (!timeZone) return {};
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return { timeZone };
  } catch {
    return {};
  }
};

export const formatDay = (date: Date, timeZone?: string | null) =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...timeZoneOptions(timeZone),
  });

export const formatTime = (date: Date, timeZone?: string | null) =>
  date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...timeZoneOptions(timeZone),
  });
