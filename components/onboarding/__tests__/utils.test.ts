import { describe, it, expect } from 'vitest';
import { scrollbarHideStyles, RATING_LEVELS, roles, skills } from '../utils';

describe('onboarding/utils', () => {
  describe('scrollbarHideStyles', () => {
    it('is a non-empty string', () => {
      expect(typeof scrollbarHideStyles).toBe('string');
      expect(scrollbarHideStyles.length).toBeGreaterThan(0);
    });

    it('contains webkit scrollbar rule', () => {
      expect(scrollbarHideStyles).toContain('.scrollbar-hide::-webkit-scrollbar');
      expect(scrollbarHideStyles).toContain('display: none');
    });
  });

  describe('RATING_LEVELS', () => {
    it('has 5 levels', () => {
      expect(Object.keys(RATING_LEVELS)).toHaveLength(5);
    });

    it('maps 1 to BEGINNER', () => {
      expect(RATING_LEVELS[1]).toBe('BEGINNER');
    });

    it('maps 2 to NOVICE', () => {
      expect(RATING_LEVELS[2]).toBe('NOVICE');
    });

    it('maps 3 to INTERMEDIATE', () => {
      expect(RATING_LEVELS[3]).toBe('INTERMEDIATE');
    });

    it('maps 4 to ADVANCED', () => {
      expect(RATING_LEVELS[4]).toBe('ADVANCED');
    });

    it('maps 5 to EXPERT', () => {
      expect(RATING_LEVELS[5]).toBe('EXPERT');
    });
  });

  describe('roles', () => {
    it('is an array', () => {
      expect(Array.isArray(roles)).toBe(true);
    });

    it('contains objects with title and description', () => {
      roles.forEach((role) => {
        expect(role).toHaveProperty('title');
        expect(role).toHaveProperty('description');
      });
    });

    it('contains software engineer', () => {
      expect(roles.some((r) => r.title === 'software engineer')).toBe(true);
    });

    it('has at least 5 roles', () => {
      expect(roles.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('skills', () => {
    it('is an array', () => {
      expect(Array.isArray(skills)).toBe(true);
    });

    it('contains string values', () => {
      skills.forEach((skill) => {
        expect(typeof skill).toBe('string');
      });
    });

    it('contains JavaScript', () => {
      expect(skills).toContain('JavaScript');
    });

    it('contains Python', () => {
      expect(skills).toContain('Python');
    });

    it('has at least 10 skills', () => {
      expect(skills.length).toBeGreaterThanOrEqual(10);
    });
  });
});
