import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Capture the props handed to the SDK provider so we can exercise the
// course/unit parsers, getCurrentUrl and onRouteChange in isolation.
let captured: Record<string, any> | null = null;
vi.mock('@iblai/iblai-js/web-containers', () => ({
  TimeTrackingProvider: (props: Record<string, any>) => {
    captured = props;
    return null;
  },
}));
vi.mock('@/utils/helpers', () => ({ getTenant: () => 'acme' }));

import { SkillsTimeTrackingProvider } from '../use-time-tracking';

const COURSE_URL = '/platform/main/course-content/course-v1:X+Y+Z/course?unit_id=block-v1:U';

beforeEach(() => {
  captured = null;
  window.history.pushState({}, '', '/');
});

describe('SkillsTimeTrackingProvider', () => {
  it('forwards tenant + config and defaults', () => {
    render(<SkillsTimeTrackingProvider />);
    expect(captured!.intervalSeconds).toBe(30);
    expect(captured!.enabled).toBe(true);
    expect(captured!.getTenantKey()).toBe('acme');
    expect(captured!.getCurrentUrl()).toBe('/');
  });

  it('accepts custom intervalSeconds/enabled', () => {
    render(<SkillsTimeTrackingProvider intervalSeconds={10} enabled={false} />);
    expect(captured!.intervalSeconds).toBe(10);
    expect(captured!.enabled).toBe(false);
  });

  it('parses course_id from course + course-content routes, undefined elsewhere', () => {
    render(<SkillsTimeTrackingProvider />);
    const { getCourseId } = captured!;
    expect(getCourseId(COURSE_URL)).toBe('course-v1:X+Y+Z');
    expect(getCourseId('/platform/main/courses/course-v1:A+B+C')).toBe('course-v1:A+B+C');
    expect(getCourseId('/courses/course-v1:A+B+C')).toBe('course-v1:A+B+C');
    expect(getCourseId('/platform/main/discover')).toBeUndefined();
    // analytics/courses is NOT a learner course route
    expect(getCourseId('/platform/main/analytics/courses/course-v1:A+B+C')).toBeUndefined();
    // malformed percent-encoding falls back to the raw segment
    expect(getCourseId('/courses/course-%ZZ')).toBe('course-%ZZ');
  });

  it('parses block_id from the unit_id query, undefined otherwise', () => {
    render(<SkillsTimeTrackingProvider />);
    const { getBlockId } = captured!;
    expect(getBlockId(COURSE_URL)).toBe('block-v1:U');
    expect(getBlockId('/platform/main/course-content/course-v1:X/course')).toBeUndefined();
    // malformed percent-encoding falls back to the raw value
    expect(getBlockId('/x?unit_id=%ZZ')).toBe('%ZZ');
  });

  describe('onRouteChange', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('fires on URL change (poll + popstate), on unload, and cleans up', () => {
      render(<SkillsTimeTrackingProvider />);
      const cb = vi.fn();
      const cleanup = captured!.onRouteChange(cb);

      // No change yet → not called.
      vi.advanceTimersByTime(500);
      expect(cb).not.toHaveBeenCalled();

      // Soft navigation detected by the poll.
      window.history.pushState({}, '', '/platform/main/course-content/c/course');
      vi.advanceTimersByTime(500);
      expect(cb).toHaveBeenCalledTimes(1);

      // popstate path.
      window.history.pushState({}, '', '/platform/main/discover');
      window.dispatchEvent(new PopStateEvent('popstate'));
      vi.advanceTimersByTime(10);
      expect(cb).toHaveBeenCalledTimes(2);

      // beforeunload flush.
      window.dispatchEvent(new Event('beforeunload'));
      expect(cb).toHaveBeenCalledTimes(3);

      // Cleanup unsubscribes: no further calls after another change.
      cleanup();
      window.history.pushState({}, '', '/platform/main/other');
      vi.advanceTimersByTime(1000);
      expect(cb).toHaveBeenCalledTimes(3);
    });
  });
});
