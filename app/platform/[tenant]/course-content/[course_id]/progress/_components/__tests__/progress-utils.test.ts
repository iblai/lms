import { describe, it, expect } from 'vitest';
import type { CourseProgress, Subsection } from '@/types/courses';
import {
  certificateCase,
  completionBreakdown,
  formatDate,
  formatPercent,
  gradeLocks,
  gradeStatusText,
  isGradedSubsection,
  letterGradeBands,
  passingGradePercent,
  summarizeAssignmentTypes,
} from '../progress-utils';

const subsection = (overrides: Partial<Subsection>): Subsection => ({
  assignment_type: 'Homework',
  block_key: 'block-1',
  display_name: 'HW',
  has_graded_assignment: true,
  override: null,
  learner_has_access: true,
  num_points_earned: 0,
  num_points_possible: 0,
  percent_graded: 0,
  problem_scores: [],
  show_correctness: 'always',
  show_grades: true,
  url: '',
  ...overrides,
});

const progress = (overrides: Partial<CourseProgress> = {}): CourseProgress => ({
  can_show_upgrade_sock: false,
  verified_mode: null,
  access_expiration: null,
  certificate_data: null,
  completion_summary: { complete_count: 1, incomplete_count: 3, locked_count: 0 },
  course_grade: { letter_grade: null, percent: 0.42, is_passing: false },
  credit_course_requirements: null,
  end: '2026-12-01T00:00:00Z',
  enrollment_mode: 'honor',
  grading_policy: {
    assignment_policies: [
      { num_droppable: 1, num_total: 3, short_label: 'HW', type: 'Homework', weight: 0.4 },
      { num_droppable: 0, num_total: 1, short_label: 'Final', type: 'Final Exam', weight: 0.6 },
    ],
    grade_range: { Pass: 0.5 },
  },
  has_scheduled_content: false,
  section_scores: [
    {
      display_name: 'Week 1',
      subsections: [
        subsection({ block_key: 'hw1', num_points_earned: 8, num_points_possible: 10 }),
        subsection({ block_key: 'hw2', num_points_earned: 2, num_points_possible: 10 }),
        subsection({
          block_key: 'final',
          assignment_type: 'Final Exam',
          num_points_earned: 30,
          num_points_possible: 40,
        }),
        subsection({ block_key: 'intro', assignment_type: null, has_graded_assignment: false }),
      ],
    },
  ],
  studio_url: 'https://studio/course',
  username: 'ada',
  user_has_passing_grade: false,
  verification_data: { link: null, status: 'none', status_date: null },
  ...overrides,
});

describe('formatPercent / formatDate', () => {
  it('drops decimals for whole numbers and keeps two otherwise', () => {
    expect(formatPercent(0.4)).toBe('40%');
    expect(formatPercent(0.825)).toBe('82.5%');
    expect(formatPercent(1 / 3)).toBe('33.33%');
    expect(formatPercent(Number.NaN)).toBe('0%');
  });

  it('formats dates in the given zone and tolerates bad input', () => {
    expect(formatDate('2026-12-01T12:00:00Z', 'UTC')).toBe('December 1, 2026');
    expect(formatDate('2026-12-01T12:00:00Z', 'Not/AZone')).toContain('2026');
    expect(formatDate('garbage')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});

describe('summarizeAssignmentTypes', () => {
  it('pads to the expected count, drops the lowest scores and weights the rest', () => {
    const [homework, final] = summarizeAssignmentTypes(progress());
    // Scores 0.8, 0.2 padded with a 0; the lowest (0) is dropped → (0.8 + 0.2) / 2.
    expect(homework).toMatchObject({ type: 'Homework', shortLabel: 'HW', numDroppable: 1 });
    expect(homework.average).toBeCloseTo(0.5);
    expect(homework.weighted).toBeCloseTo(0.2);
    expect(final.average).toBeCloseTo(0.75);
    expect(final.weighted).toBeCloseTo(0.45);
  });

  it('prefers averages the LMS already computed', () => {
    const data = progress();
    data.grading_policy.assignment_policies[0].average_grade = 0.9;
    data.grading_policy.assignment_policies[0].weighted_grade = 0.36;
    const [homework] = summarizeAssignmentTypes(data);
    expect(homework.average).toBe(0.9);
    expect(homework.weighted).toBe(0.36);
  });

  it('scores zero when every slot is dropped and copes with a missing policy', () => {
    const data = progress();
    data.grading_policy.assignment_policies[0].num_droppable = 5;
    expect(summarizeAssignmentTypes(data)[0].average).toBe(0);
    expect(summarizeAssignmentTypes({ ...data, grading_policy: undefined as any })).toEqual([]);
  });

  it('locks a type whose scored assignments are all gated', () => {
    const data = progress();
    data.section_scores[0].subsections[0].learner_has_access = false;
    data.section_scores[0].subsections[1].learner_has_access = false;
    const [homework, final] = summarizeAssignmentTypes(data);
    expect(homework.locked).toBe(true);
    expect(final.locked).toBe(false);
    expect(summarizeAssignmentTypes(data, true)[0].locked).toBe(false);
  });
});

describe('gradeLocks', () => {
  it('is unlocked without locked units', () => {
    expect(gradeLocks(progress())).toEqual({ fullyLocked: false, partiallyLocked: false });
  });

  it('is fully locked when units are locked and no graded content is reachable', () => {
    const data = progress({
      completion_summary: { complete_count: 0, incomplete_count: 1, locked_count: 2 },
    });
    data.section_scores[0].subsections.forEach((s) => {
      s.learner_has_access = false;
    });
    expect(gradeLocks(data)).toEqual({ fullyLocked: true, partiallyLocked: false });
  });

  it('is partially locked when some graded content is still reachable', () => {
    const data = progress({
      completion_summary: { complete_count: 0, incomplete_count: 1, locked_count: 2 },
    });
    expect(gradeLocks(data)).toEqual({ fullyLocked: false, partiallyLocked: true });
    expect(gradeLocks({ ...data, completion_summary: undefined as any }).fullyLocked).toBe(false);
  });
});

describe('completion / passing helpers', () => {
  it('turns the completion counts into rounded percentages', () => {
    expect(
      completionBreakdown({ complete_count: 1, incomplete_count: 1, locked_count: 1 }),
    ).toEqual({
      total: 3,
      complete: 1,
      incomplete: 1,
      locked: 1,
      completePercent: 33,
      lockedPercent: 33,
      incompletePercent: 34,
    });
    expect(completionBreakdown(undefined as any)).toMatchObject({
      total: 0,
      completePercent: 0,
      incompletePercent: 0,
    });
  });

  it('reads the passing grade and the letter bands off the grade range', () => {
    expect(passingGradePercent({ Pass: 0.5 })).toBe(50);
    expect(passingGradePercent(undefined)).toBe(0);
    expect(letterGradeBands({ A: 0.9, B: 0.8, C: 0.7 })).toEqual([
      { letter: 'A', min: 90, max: 100 },
      { letter: 'B', min: 80, max: 90 },
      { letter: 'C', min: 70, max: 80 },
    ]);
  });

  it('describes the grade status', () => {
    expect(
      gradeStatusText({ letter_grade: null, percent: 0.1, is_passing: false }, { Pass: 0.5 }),
    ).toBe('A weighted grade of 50% is required to pass in this course.');
    expect(
      gradeStatusText({ letter_grade: 'Pass', percent: 0.6, is_passing: true }, { Pass: 0.5 }),
    ).toBe("You're currently passing this course.");
    expect(
      gradeStatusText({ letter_grade: 'B', percent: 0.85, is_passing: true }, { A: 0.9, B: 0.8 }),
    ).toBe("You're currently passing this course with a grade of B (80–90%).");
    expect(
      gradeStatusText({ letter_grade: 'Z', percent: 0.85, is_passing: true }, { A: 0.9, B: 0.8 }),
    ).toBe("You're currently passing this course.");
  });

  it('picks graded subsections the way the progress page does', () => {
    expect(isGradedSubsection(subsection({ num_points_possible: 1 }))).toBe(true);
    expect(isGradedSubsection(subsection({ num_points_earned: 1, show_grades: false }))).toBe(
      false,
    );
    expect(isGradedSubsection(subsection({}))).toBe(false);
  });
});

describe('certificateCase', () => {
  const cert = (cert_status: string, extra: Partial<CourseProgress> = {}) =>
    progress({
      certificate_data: {
        cert_status,
        cert_web_view_url: '/certificates/abc',
        download_url: null,
        certificate_available_date: '2026-12-15T00:00:00Z',
      },
      user_has_passing_grade: true,
      ...extra,
    });

  it('hides the card without certificate data or for the unenrolled', () => {
    expect(certificateCase(progress(), undefined)).toBeNull();
    expect(certificateCase(cert('downloadable'), { is_enrolled: false } as any)).toBeNull();
  });

  it('explains a failing grade and scheduled content first', () => {
    expect(
      certificateCase(cert('notpassing', { user_has_passing_grade: false }), undefined)?.key,
    ).toBe('notPassing');
    expect(
      certificateCase(cert('notpassing', { has_scheduled_content: true }), undefined)?.key,
    ).toBe('inProgress');
    // A downloadable certificate wins over both.
    expect(
      certificateCase(
        cert('downloadable', { user_has_passing_grade: false, has_scheduled_content: true }),
        undefined,
      )?.key,
    ).toBe('downloadable');
  });

  it('covers every certificate status', () => {
    expect(certificateCase(cert('requesting'), undefined)).toMatchObject({
      key: 'requestable',
      action: { request: true },
    });
    expect(certificateCase(cert('downloadable'), undefined)).toMatchObject({
      key: 'downloadable',
      action: { href: '/certificates/abc' },
    });
    const noLink = cert('downloadable');
    noLink.certificate_data!.cert_web_view_url = null;
    expect(certificateCase(noLink, undefined)?.action).toBeUndefined();
    expect(
      certificateCase(cert('earned_but_not_available'), { user_timezone: 'UTC' } as any)?.body,
    ).toContain('December 15, 2026');
    const unverified = cert('unverified', {
      verification_data: { link: 'https://verify', status: 'none', status_date: null },
    });
    expect(certificateCase(unverified, undefined)).toMatchObject({
      key: 'unverified',
      action: { href: 'https://verify' },
    });
    const pending = cert('unverified', {
      verification_data: { link: 'https://verify', status: 'pending', status_date: null },
    });
    expect(certificateCase(pending, undefined)?.action).toBeUndefined();
    expect(certificateCase(cert('audit_passing'), undefined)).toBeNull();
    expect(
      certificateCase(cert('audit_passing', { verified_mode: 'verified' }), {
        verified_mode: { upgrade_url: 'https://upgrade' },
      } as any),
    ).toMatchObject({ key: 'upgrade', action: { href: 'https://upgrade' } });
    expect(
      certificateCase(cert('honor_passing', { verified_mode: 'verified' }), undefined)?.action,
    ).toBeUndefined();
    expect(certificateCase(cert('unknown'), undefined)).toBeNull();
    expect(certificateCase(cert('unknown'), { can_view_certificate: false } as any)?.key).toBe(
      'notAvailable',
    );
    expect(
      certificateCase(cert('unknown', { end: null }), { can_view_certificate: false } as any)?.body,
    ).not.toContain(' on ');
  });
});
