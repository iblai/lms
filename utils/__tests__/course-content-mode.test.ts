import { describe, it, expect } from 'vitest';
import {
  canViewContentModeAudience,
  isAgentContentModeOn,
  isCourseContentModeOn,
  resolveContentModeAudience,
} from '../course-content-mode';

describe('resolveContentModeAudience', () => {
  it('defaults empty/undefined/null to ["learners"]', () => {
    expect(resolveContentModeAudience(undefined)).toEqual(['learners']);
    expect(resolveContentModeAudience(null)).toEqual(['learners']);
    expect(resolveContentModeAudience([])).toEqual(['learners']);
  });

  it('returns the audience unchanged when non-empty', () => {
    expect(resolveContentModeAudience(['admins'])).toEqual(['admins']);
    expect(resolveContentModeAudience(['admins', 'learners'])).toEqual(['admins', 'learners']);
  });
});

describe('canViewContentModeAudience', () => {
  const learner = { isAdmin: false, isWatcher: false };
  const admin = { isAdmin: true, isWatcher: false };
  const watcher = { isAdmin: false, isWatcher: true };

  it('grants everyone when audience is empty (defaults to learners)', () => {
    expect(canViewContentModeAudience(undefined, learner)).toBe(true);
    expect(canViewContentModeAudience([], learner)).toBe(true);
    expect(canViewContentModeAudience(undefined, admin)).toBe(true);
  });

  it('grants everyone when audience includes learners', () => {
    expect(canViewContentModeAudience(['learners'], learner)).toBe(true);
    expect(canViewContentModeAudience(['learners'], admin)).toBe(true);
    expect(canViewContentModeAudience(['admins', 'learners'], learner)).toBe(true);
  });

  it('grants only admins when audience is admins-only', () => {
    expect(canViewContentModeAudience(['admins'], admin)).toBe(true);
    expect(canViewContentModeAudience(['admins'], learner)).toBe(false);
    expect(canViewContentModeAudience(['admins'], watcher)).toBe(false);
  });

  it('grants only watchers when audience is watchers-only', () => {
    expect(canViewContentModeAudience(['watchers'], watcher)).toBe(true);
    expect(canViewContentModeAudience(['watchers'], learner)).toBe(false);
    expect(canViewContentModeAudience(['watchers'], admin)).toBe(false);
  });

  it('grants any matching role when audience lists several', () => {
    expect(canViewContentModeAudience(['admins', 'watchers'], admin)).toBe(true);
    expect(canViewContentModeAudience(['admins', 'watchers'], watcher)).toBe(true);
    expect(canViewContentModeAudience(['admins', 'watchers'], learner)).toBe(false);
  });
});

describe('isAgentContentModeOn', () => {
  it('is on only when agent_content_mode is strictly true', () => {
    expect(isAgentContentModeOn({ agent_content_mode: true })).toBe(true);
    expect(isAgentContentModeOn({ agent_content_mode: false })).toBe(false);
    expect(isAgentContentModeOn({ agent_content_mode: null })).toBe(false);
    expect(isAgentContentModeOn({})).toBe(false);
  });
});

describe('isCourseContentModeOn', () => {
  it('is on unless course_content_mode is false (and agent is not explicitly off)', () => {
    expect(isCourseContentModeOn({ course_content_mode: true })).toBe(true);
    expect(isCourseContentModeOn({ course_content_mode: null })).toBe(true);
    expect(isCourseContentModeOn({})).toBe(true);
    expect(isCourseContentModeOn({ course_content_mode: false })).toBe(false);
  });

  it('stays on when course_content_mode is false but agent_content_mode is also false', () => {
    expect(isCourseContentModeOn({ course_content_mode: false, agent_content_mode: false })).toBe(
      true,
    );
  });
});
