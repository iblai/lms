import { describe, it, expect } from 'vitest';
import type { CourseDateBlock } from '@/types/course-home';
import {
  badgesFor,
  daycmp,
  formatDay,
  formatTime,
  groupDateBlocks,
  isLearnerAssignment,
} from '../dates-utils';

const NOW = new Date('2026-06-10T12:00:00Z');
const block = (overrides: Partial<CourseDateBlock>): CourseDateBlock => ({
  assignment_type: 'Homework',
  complete: false,
  date: '2026-06-12T23:59:00Z',
  date_type: 'assignment-due-date',
  description: '',
  learner_has_access: true,
  link: 'https://lms/x',
  link_text: '',
  title: 'HW 1',
  extra_info: null,
  ...overrides,
});

describe('daycmp / isLearnerAssignment', () => {
  it('compares calendar days only', () => {
    expect(daycmp(new Date('2026-06-10T01:00:00'), new Date('2026-06-10T23:00:00'))).toBe(0);
    expect(daycmp(new Date('2026-06-09T23:00:00'), new Date('2026-06-10T01:00:00'))).toBe(-1);
    expect(daycmp(new Date('2027-01-01'), new Date('2026-12-31'))).toBe(1);
    expect(daycmp(new Date('2026-07-01'), new Date('2026-06-30'))).toBe(1);
  });

  it('only counts accessible due dates as learner assignments', () => {
    expect(isLearnerAssignment(block({}))).toBe(true);
    expect(isLearnerAssignment(block({ learner_has_access: false }))).toBe(false);
    expect(isLearnerAssignment(block({ date_type: 'course-start-date' }))).toBe(false);
  });
});

describe('groupDateBlocks', () => {
  it('groups by day, marks the next due assignment and inserts today between past and future', () => {
    const days = groupDateBlocks(
      [
        block({ title: 'Start', date_type: 'course-start-date', date: '2026-06-01T00:00:00Z' }),
        block({ title: 'Past', date: '2026-06-05T00:00:00Z' }),
        block({ title: 'Also past', date: '2026-06-05T10:00:00Z', complete: true }),
        block({ title: 'Next', date: '2026-06-12T00:00:00Z' }),
        block({ title: 'Later', date: '2026-06-20T00:00:00Z' }),
      ],
      NOW,
    );
    expect(days.map((day) => [day.items.map((item) => item.title), day.today])).toEqual([
      [['Start'], false],
      [['Past', 'Also past'], false],
      [[], true],
      [['Next'], false],
      [['Later'], false],
    ]);
    expect(days[0].first).toBe(true);
    expect(days[4].last).toBe(true);
    expect(days[3].items[0].dueNext).toBe(true);
    expect(days[4].items[0].dueNext).toBeUndefined();
  });

  it('does not duplicate today when a block falls on it, and appends today after all-past dates', () => {
    const onToday = groupDateBlocks([block({ date: '2026-06-10T18:00:00Z' })], NOW);
    expect(onToday).toHaveLength(1);
    expect(onToday[0].today).toBe(false);
    const allPast = groupDateBlocks([block({ date: '2026-06-01T00:00:00Z' })], NOW);
    expect(allPast.map((day) => day.today)).toEqual([false, true]);
    expect(allPast[1].last).toBe(true);
    expect(groupDateBlocks([], NOW)).toEqual([
      { date: NOW, items: [], first: true, last: true, today: true },
    ]);
  });
});

describe('badgesFor', () => {
  const labels = (badges: ReturnType<typeof badgesFor>) => badges.map((badge) => badge.label);

  it('badges a day by its assignments and a future item by its own state', () => {
    const past = block({ date: '2026-06-05T00:00:00Z' });
    expect(labels(badgesFor(new Date(past.date), null, [past], NOW))).toEqual(['Past due']);
    expect(labels(badgesFor(new Date(past.date), past, [past], NOW))).toEqual([]);

    const done = block({ date: '2026-06-05T00:00:00Z', complete: true });
    expect(labels(badgesFor(new Date(done.date), null, [done, past], NOW))).toEqual([]);
    expect(labels(badgesFor(new Date(done.date), done, [done, past], NOW))).toEqual(['Completed']);
    expect(labels(badgesFor(new Date(done.date), past, [done, past], NOW))).toEqual(['Past due']);
  });

  it('marks today, due next, unreleased and verified-only', () => {
    expect(labels(badgesFor(NOW, null, [], NOW))).toEqual(['Today']);
    const next = { ...block({ date: '2026-06-12T00:00:00Z' }), dueNext: true };
    expect(labels(badgesFor(new Date(next.date), null, [next], NOW))).toEqual(['Due next']);
    const unreleased = block({ date: '2026-06-12T00:00:00Z', link: '' });
    expect(labels(badgesFor(new Date(unreleased.date), null, [unreleased], NOW))).toEqual([
      'Not yet released',
    ]);
    const gated = block({ date: '2026-06-12T00:00:00Z', learner_has_access: false });
    expect(labels(badgesFor(new Date(gated.date), null, [gated], NOW))).toEqual(['Verified only']);
    expect(labels(badgesFor(new Date(gated.date), gated, [gated, next], NOW))).toEqual([
      'Verified only',
    ]);
  });
});

describe('formatDay / formatTime', () => {
  it('formats in the given zone and falls back to the browser zone for a bad one', () => {
    const date = new Date('2026-06-12T23:59:00Z');
    expect(formatDay(date, 'UTC')).toBe('Fri, Jun 12, 2026');
    expect(formatTime(date, 'UTC')).toMatch(/11:59 PM/);
    expect(formatDay(date, 'Not/AZone')).toContain('2026');
    expect(formatTime(date, null)).toMatch(/\d/);
  });
});
