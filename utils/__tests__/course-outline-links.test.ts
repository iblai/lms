import { describe, it, expect } from 'vitest';
import { findUnitIdForBlock, usageKeyInUrl } from '../course-outline-links';
import type { CourseOutlineChildNode } from '@/types/courses';

const node = (
  id: string,
  type: string,
  children: CourseOutlineChildNode[] = [],
): CourseOutlineChildNode => ({ id, block_id: id, type, display_name: id, children });

const outline = node('course', 'course', [
  node('ch1', 'chapter', [
    node('seq1', 'sequential', [
      node('unit1', 'vertical', [node('problem1', 'problem')]),
      node('unit2', 'vertical'),
    ]),
    node('seq-empty', 'sequential'),
  ]),
  node('ch2', 'chapter', [node('seq2', 'sequential', [node('unit3', 'vertical')])]),
]);

describe('findUnitIdForBlock', () => {
  it('returns the unit itself', () => {
    expect(findUnitIdForBlock(outline, 'unit2')).toBe('unit2');
  });

  it('returns the first unit under a subsection or section', () => {
    expect(findUnitIdForBlock(outline, 'seq1')).toBe('unit1');
    expect(findUnitIdForBlock(outline, 'ch2')).toBe('unit3');
  });

  it('returns the enclosing unit for a component', () => {
    expect(findUnitIdForBlock(outline, 'problem1')).toBe('unit1');
  });

  it('returns null for an empty subsection, an unknown block or no outline', () => {
    expect(findUnitIdForBlock(outline, 'seq-empty')).toBeNull();
    expect(findUnitIdForBlock(outline, 'nope')).toBeNull();
    expect(findUnitIdForBlock(outline, '')).toBeNull();
    expect(findUnitIdForBlock(undefined, 'unit1')).toBeNull();
  });
});

describe('usageKeyInUrl', () => {
  it('extracts a usage key from MFE and legacy URLs, decoding when needed', () => {
    expect(
      usageKeyInUrl(
        'https://apps.lms/learning/course/course-v1:o+c+r/block-v1:o+c+r+type@sequential+block@a1/',
      ),
    ).toBe('block-v1:o+c+r+type@sequential+block@a1');
    expect(
      usageKeyInUrl('https://lms/courses/x/jump_to/block-v1:o+c+r+type%40vertical%2Bblock%40u?x=1'),
    ).toBe('block-v1:o+c+r+type@vertical+block@u');
  });

  it('returns null without a key, and tolerates malformed encoding', () => {
    expect(usageKeyInUrl('https://lms/courses/x/')).toBeNull();
    expect(usageKeyInUrl('')).toBeNull();
    expect(usageKeyInUrl('%E0%A4%A/block-v1:o+c+r+type@vertical+block@u')).toBe(
      'block-v1:o+c+r+type@vertical+block@u',
    );
  });
});
