import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      studioUrl: () => 'https://studio.example.com',
      legacyLmsUrl: () => 'https://learn.example.com',
    },
  },
}));

import {
  edxSsoLoginUrl,
  fromDateInputValue,
  isSameSite,
  isValidProgramId,
  programIdFromName,
  studioAuthoringUrl,
  studioBasePath,
  studioCoursePath,
  toDateInputValue,
} from '../studio';

const COURSE_KEY = 'course-v1:org+CS101+2026';

describe('studio paths', () => {
  it('builds the Studio home path for a tenant', () => {
    expect(studioBasePath('acme')).toBe('/platform/acme/studio');
  });

  it('builds a course path, defaulting to the details section', () => {
    expect(studioCoursePath('acme', COURSE_KEY)).toBe(
      '/platform/acme/studio/courses/course-v1%3Aorg%2BCS101%2B2026/details',
    );
    expect(studioCoursePath('acme', COURSE_KEY, 'outline')).toBe(
      '/platform/acme/studio/courses/course-v1%3Aorg%2BCS101%2B2026/outline',
    );
  });

  it('points the authoring URL at the course page on the Studio host', () => {
    expect(studioAuthoringUrl(COURSE_KEY)).toBe(`https://studio.example.com/course/${COURSE_KEY}`);
  });

  it('builds the SSO login URL with an encoded code and redirect', () => {
    expect(edxSsoLoginUrl('a b', 'https://apps.learn.example.com/x?y=1')).toBe(
      'https://learn.example.com/ibl/ai/sso/backend/edx/login?code=a%20b&redirect_url=https%3A%2F%2Fapps.learn.example.com%2Fx%3Fy%3D1',
    );
  });
});

describe('program IDs', () => {
  it('derives an ID from the program name', () => {
    expect(programIdFromName('  Data Science: Fundamentals!  ')).toBe('data-science-fundamentals');
    expect(programIdFromName('!!!')).toBe('');
    expect(programIdFromName('a'.repeat(80))).toHaveLength(50);
  });

  it('accepts letters, digits, hyphens and underscores only', () => {
    expect(isValidProgramId('data-science_101')).toBe(true);
    expect(isValidProgramId('data science')).toBe(false);
    expect(isValidProgramId('')).toBe(false);
  });
});

describe('date input conversion', () => {
  it('reads the day out of an ISO timestamp', () => {
    expect(toDateInputValue('2026-06-19T19:28:12Z')).toBe('2026-06-19');
    expect(toDateInputValue(null)).toBe('');
    expect(toDateInputValue('soon')).toBe('');
  });

  it('keeps the original timestamp when the day is unchanged', () => {
    expect(fromDateInputValue('2026-06-19', '2026-06-19T19:28:12Z')).toBe('2026-06-19T19:28:12Z');
  });

  it('stores midnight UTC for a changed day and null for a cleared one', () => {
    expect(fromDateInputValue('2026-07-01', '2026-06-19T19:28:12Z')).toBe('2026-07-01T00:00:00Z');
    expect(fromDateInputValue('2026-07-01', null)).toBe('2026-07-01T00:00:00Z');
    expect(fromDateInputValue('', '2026-06-19T19:28:12Z')).toBeNull();
  });
});

describe('isSameSite', () => {
  it('matches hosts under the same registrable domain', () => {
    expect(isSameSite('https://skillsai.iblai.org/x', 'https://apps.learn.iblai.org/y')).toBe(true);
  });

  it('rejects hosts on different sites and unparsable URLs', () => {
    expect(isSameSite('http://localhost:3002/x', 'https://apps.learn.iblai.org/y')).toBe(false);
    expect(isSameSite('not a url', 'https://apps.learn.iblai.org/y')).toBe(false);
  });
});
