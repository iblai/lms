import type { CourseHomeMeta } from '@/types/course-home';
import type { CourseGrade, CourseProgress, GradeRange, Subsection } from '@/types/courses';

/** `0.825` → `82.5%`; whole numbers lose the decimals. */
export const formatPercent = (fraction: number) => {
  const rounded = Math.round((fraction || 0) * 10000) / 100;
  return `${Number.isInteger(rounded) ? rounded : parseFloat(rounded.toFixed(2))}%`;
};

export const formatDate = (value: string | null | undefined, timeZone?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  try {
    return date.toLocaleDateString(undefined, timeZone ? { ...options, timeZone } : options);
  } catch {
    return date.toLocaleDateString(undefined, options);
  }
};

/** Subsections that appear in the detailed grades, as the edX progress page picks them. */
export const isGradedSubsection = (subsection: Subsection) =>
  subsection.has_graded_assignment &&
  subsection.show_grades &&
  (subsection.num_points_possible > 0 || subsection.num_points_earned > 0);

/**
 * Content-type gating: when some units are locked for this learner's track,
 * grades are fully locked unless they can still reach some graded content.
 */
export const gradeLocks = (progress: CourseProgress) => {
  let fullyLocked = (progress.completion_summary?.locked_count ?? 0) > 0;
  let partiallyLocked = false;
  if (fullyLocked) {
    progress.section_scores.forEach((section) =>
      section.subsections.forEach((subsection) => {
        if (
          subsection.assignment_type !== null &&
          isGradedSubsection(subsection) &&
          subsection.learner_has_access
        ) {
          partiallyLocked = true;
          fullyLocked = false;
        }
      }),
    );
  }
  return { fullyLocked, partiallyLocked };
};

export interface AssignmentTypeSummary {
  type: string;
  shortLabel: string;
  weight: number;
  numDroppable: number;
  numTotal: number;
  /** Average of the counted scores, as a fraction. */
  average: number;
  /** `average × weight`, as a fraction of the course grade. */
  weighted: number;
  /** Every scored assignment of this type is gated away from the learner. */
  locked: boolean;
}

/**
 * Per-assignment-type grades. Newer LMS releases send them on the policy;
 * otherwise they are worked out the way edX's grader does: pad the scores up to
 * the expected count with zeros, drop the lowest `num_droppable`, average the
 * rest.
 */
export const summarizeAssignmentTypes = (
  progress: CourseProgress,
  fullyLocked = false,
): AssignmentTypeSummary[] => {
  const subsections = progress.section_scores.flatMap((section) => section.subsections);
  return (progress.grading_policy?.assignment_policies ?? []).map((policy) => {
    const ofType = subsections.filter(
      (subsection) =>
        subsection.assignment_type === policy.type && subsection.has_graded_assignment,
    );
    const scores = ofType
      .filter((subsection) => subsection.num_points_possible > 0)
      .map((subsection) => subsection.num_points_earned / subsection.num_points_possible);
    while (scores.length < policy.num_total) scores.push(0);
    const kept = [...scores]
      .sort((a, b) => b - a)
      .slice(0, Math.max(0, scores.length - policy.num_droppable));
    const computed = kept.length ? kept.reduce((sum, score) => sum + score, 0) / kept.length : 0;
    const average = policy.average_grade ?? computed;
    const weighted = policy.weighted_grade ?? average * policy.weight;
    const scored = ofType.filter(
      (subsection) => subsection.num_points_possible > 0 || subsection.num_points_earned > 0,
    );
    const locked =
      !fullyLocked &&
      scored.length > 0 &&
      !scored.some((subsection) => subsection.learner_has_access);
    return {
      type: policy.type,
      shortLabel: policy.short_label,
      weight: policy.weight,
      numDroppable: policy.num_droppable,
      numTotal: policy.num_total,
      average,
      weighted,
      locked,
    };
  });
};

export const completionBreakdown = (summary: CourseProgress['completion_summary']) => {
  const complete = summary?.complete_count ?? 0;
  const incomplete = summary?.incomplete_count ?? 0;
  const locked = summary?.locked_count ?? 0;
  const total = complete + incomplete + locked;
  const completePercent = total ? Math.round((complete / total) * 100) : 0;
  const lockedPercent = total ? Math.round((locked / total) * 100) : 0;
  return {
    total,
    complete,
    incomplete,
    locked,
    completePercent,
    lockedPercent,
    incompletePercent: total ? 100 - completePercent - lockedPercent : 0,
  };
};

/** Lowest cutoff in the grade range, as a whole percentage. */
export const passingGradePercent = (gradeRange: GradeRange | undefined) => {
  const cutoffs = Object.values(gradeRange ?? {});
  return cutoffs.length ? Math.round(Math.min(...cutoffs) * 100) : 0;
};

/** Letter grades and their percentage bands, best first. */
export const letterGradeBands = (gradeRange: GradeRange | undefined) => {
  const entries = Object.entries(gradeRange ?? {}).sort(([, a], [, b]) => b - a);
  return entries.map(([letter, cutoff], index) => ({
    letter,
    min: Math.round(cutoff * 100),
    max: index === 0 ? 100 : Math.round(entries[index - 1][1] * 100),
  }));
};

export const gradeStatusText = (courseGrade: CourseGrade, gradeRange: GradeRange | undefined) => {
  const passing = passingGradePercent(gradeRange);
  if (!courseGrade?.is_passing) {
    return `A weighted grade of ${passing}% is required to pass in this course.`;
  }
  const bands = letterGradeBands(gradeRange);
  const band = bands.find((candidate) => candidate.letter === courseGrade.letter_grade);
  if (bands.length > 1 && band) {
    return `You're currently passing this course with a grade of ${band.letter} (${band.min}–${band.max}%).`;
  }
  return "You're currently passing this course.";
};

export interface CertificateCase {
  key:
    | 'notPassing'
    | 'inProgress'
    | 'requestable'
    | 'unverified'
    | 'downloadable'
    | 'notAvailable'
    | 'upgrade';
  title: string;
  body: string;
  action?: { label: string; href?: string; request?: boolean };
}

/**
 * What the certificate card should say, following the edX progress page's
 * cases; `null` hides the card (no certificate data, or nothing to say yet).
 */
export const certificateCase = (
  progress: CourseProgress,
  meta: CourseHomeMeta | undefined,
): CertificateCase | null => {
  const data = progress.certificate_data;
  if (!data || meta?.is_enrolled === false) return null;
  const downloadable = data.cert_status === 'downloadable';
  const timeZone = meta?.user_timezone;
  if (!progress.user_has_passing_grade && !downloadable) {
    return {
      key: 'notPassing',
      title: 'Certificate status',
      body: 'In order to qualify for a certificate, you must have a passing grade.',
    };
  }
  if (progress.has_scheduled_content && !downloadable) {
    return {
      key: 'inProgress',
      title: 'Certificate status',
      body: 'It looks like there is more content in this course that will be released in the future. Look out for email updates or check back on this course for when this content will be available.',
    };
  }
  switch (data.cert_status) {
    case 'requesting':
      return {
        key: 'requestable',
        title: 'Congratulations, you qualified for a certificate!',
        body: "You've earned a certificate for this course. Request it now to add it to your profile.",
        action: { label: 'Request certificate', request: true },
      };
    case 'unverified':
      return {
        key: 'unverified',
        title: 'Certificate status',
        body:
          progress.verification_data?.status === 'pending'
            ? 'Your ID verification is pending and your certificate will be available once approved.'
            : 'In order to generate a certificate, you must complete ID verification.',
        action:
          progress.verification_data?.status === 'pending' || !progress.verification_data?.link
            ? undefined
            : { label: 'Verify ID', href: progress.verification_data.link },
      };
    case 'downloadable': {
      const href = data.cert_web_view_url || data.download_url || undefined;
      return {
        key: 'downloadable',
        title: 'Your certificate is available',
        body: 'Showcase your accomplishment on LinkedIn or your résumé today. You can view your certificate now and access it any time from your profile.',
        action: href ? { label: 'View certificate', href } : undefined,
      };
    }
    case 'earned_but_not_available':
      return {
        key: 'notAvailable',
        title: 'Certificate status',
        body: `This course ends on ${formatDate(progress.end, timeZone) || 'its end date'}. Final grades and any earned certificates are scheduled to be available after ${formatDate(data.certificate_available_date, timeZone) || 'the course ends'}.`,
      };
    case 'audit_passing':
    case 'honor_passing':
      return progress.verified_mode
        ? {
            key: 'upgrade',
            title: 'Earn a certificate',
            body: 'You are in an audit track and do not qualify for a certificate. In order to work towards a certificate, upgrade your course today.',
            action: meta?.verified_mode?.upgrade_url
              ? { label: 'Upgrade now', href: meta.verified_mode.upgrade_url }
              : undefined,
          }
        : null;
    default:
      return meta?.can_view_certificate === false
        ? {
            key: 'notAvailable',
            title: 'Certificate status',
            body: `Final grades and any earned certificates are scheduled to be available after the course ends${progress.end ? ` on ${formatDate(progress.end, timeZone)}` : ''}.`,
          }
        : null;
  }
};
