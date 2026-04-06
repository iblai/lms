import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/utils/helpers', () => ({
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'http://lms.example.com'),
      mfe: vi.fn(() => 'http://mfe.example.com'),
      legacyLmsUrl: vi.fn(() => 'http://legacy-lms.example.com'),
    },
  },
}));

const mockGetEdxSsoAuthToken = vi.fn();
vi.mock('@/services/edx-sso', () => ({
  useLazyGetEdxSSOTokenQuery: vi.fn(() => [mockGetEdxSsoAuthToken]),
}));

import { useEdxIframe } from '../use-edx-iframe';

describe('useEdxIframe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useEdxIframe());
    expect(result.current).toHaveProperty('getIframeURL');
    expect(result.current).toHaveProperty('getUnitToIframe');
    expect(result.current).toHaveProperty('findSequentialParent');
    expect(result.current).toHaveProperty('flattenVerticalBlocks');
    expect(result.current).toHaveProperty('getFirstAvailableUnit');
    expect(result.current).toHaveProperty('findLastResumeBlock');
    expect(result.current).toHaveProperty('getParentBlockById');
    expect(result.current).toHaveProperty('getPreviousUnitIframe');
    expect(result.current).toHaveProperty('getNextUnitIframe');
    expect(result.current).toHaveProperty('addBookmarksTab');
    expect(result.current).toHaveProperty('getParentsInfosFromSublessonId');
  });

  describe('flattenVerticalBlocks', () => {
    it('returns empty array for null/undefined input', () => {
      const { result } = renderHook(() => useEdxIframe());
      expect(result.current.flattenVerticalBlocks(null)).toEqual([]);
      expect(result.current.flattenVerticalBlocks(undefined)).toEqual([]);
    });

    it('flattens vertical blocks from nested data', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [
                  {
                    type: 'vertical',
                    id: 'v1',
                    display_name: 'Vertical 1',
                    children: [],
                  },
                  {
                    type: 'vertical',
                    id: 'v2',
                    display_name: 'Vertical 2',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };
      const flatBlocks = result.current.flattenVerticalBlocks(data);
      expect(flatBlocks).toEqual([
        { id: 'v1', display_name: 'Vertical 1' },
        { id: 'v2', display_name: 'Vertical 2' },
      ]);
    });

    it('handles arrays', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = [
        { type: 'vertical', id: 'v1', display_name: 'V1', children: [] },
        { type: 'vertical', id: 'v2', display_name: 'V2', children: [] },
      ];
      const flatBlocks = result.current.flattenVerticalBlocks(data);
      expect(flatBlocks).toEqual([
        { id: 'v1', display_name: 'V1' },
        { id: 'v2', display_name: 'V2' },
      ]);
    });
  });

  describe('findSequentialParent', () => {
    it('finds sequential parent of a vertical block', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        type: 'course',
        children: [
          {
            type: 'sequential',
            id: 'seq-1',
            children: [{ id: 'v1', type: 'vertical' }],
          },
        ],
      };
      expect(result.current.findSequentialParent(data, 'v1')).toBe('seq-1');
    });

    it('returns null when vertical not found', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        type: 'course',
        children: [
          {
            type: 'sequential',
            id: 'seq-1',
            children: [{ id: 'v1', type: 'vertical' }],
          },
        ],
      };
      expect(result.current.findSequentialParent(data, 'v-nonexistent')).toBeNull();
    });

    it('returns null for empty data', () => {
      const { result } = renderHook(() => useEdxIframe());
      expect(result.current.findSequentialParent({ type: 'course' }, 'v1')).toBeNull();
    });
  });

  describe('getFirstAvailableUnit', () => {
    it('returns first available unit', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        children: [
          {
            children: [
              {
                children: [
                  { id: 'unit-1', type: 'vertical' },
                  { id: 'unit-2', type: 'vertical' },
                ],
              },
            ],
          },
        ],
      };
      expect(result.current.getFirstAvailableUnit(data)).toEqual({
        id: 'unit-1',
        type: 'vertical',
      });
    });

    it('returns null when no units are available', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        children: [{ children: [{ children: [] }] }],
      };
      expect(result.current.getFirstAvailableUnit(data)).toBeNull();
    });

    it('returns parent level element on error when course has started', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        start: '2020-01-01',
        children: [{ children: [{ id: 'seq-1' }] }],
      };
      // This triggers the catch path since children[0]?.children[0]?.children is undefined
      expect(result.current.getFirstAvailableUnit(data)).toEqual({ id: 'seq-1' });
    });
  });

  describe('findLastResumeBlock', () => {
    it('finds the last vertical with resume_block true', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              { type: 'vertical', id: 'v1', resume_block: true },
              { type: 'vertical', id: 'v2', resume_block: true },
              { type: 'vertical', id: 'v3', resume_block: false },
            ],
          },
        ],
      };
      expect(result.current.findLastResumeBlock(data)).toEqual({
        type: 'vertical',
        id: 'v2',
        resume_block: true,
      });
    });

    it('returns null when no resume block exists', () => {
      const { result } = renderHook(() => useEdxIframe());
      const data = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [{ type: 'vertical', id: 'v1', resume_block: false }],
          },
        ],
      };
      expect(result.current.findLastResumeBlock(data)).toBeNull();
    });
  });

  describe('getPreviousUnitIframe', () => {
    it('returns previous unit id', () => {
      const { result } = renderHook(() => useEdxIframe());
      const courseData = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [
                  { type: 'vertical', id: 'v1', display_name: 'V1', children: [] },
                  { type: 'vertical', id: 'v2', display_name: 'V2', children: [] },
                  { type: 'vertical', id: 'v3', display_name: 'V3', children: [] },
                ],
              },
            ],
          },
        ],
      };
      expect(result.current.getPreviousUnitIframe('v2', courseData)).toBe('v1');
    });

    it('returns null for the first unit', () => {
      const { result } = renderHook(() => useEdxIframe());
      const courseData = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [{ type: 'vertical', id: 'v1', display_name: 'V1', children: [] }],
              },
            ],
          },
        ],
      };
      expect(result.current.getPreviousUnitIframe('v1', courseData)).toBeNull();
    });

    it('returns null when id is not found', () => {
      const { result } = renderHook(() => useEdxIframe());
      const courseData = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [{ type: 'vertical', id: 'v1', display_name: 'V1', children: [] }],
              },
            ],
          },
        ],
      };
      expect(result.current.getPreviousUnitIframe('nonexistent', courseData)).toBeNull();
    });
  });

  describe('getNextUnitIframe', () => {
    it('returns next unit id', () => {
      const { result } = renderHook(() => useEdxIframe());
      const courseData = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [
                  { type: 'vertical', id: 'v1', display_name: 'V1', children: [] },
                  { type: 'vertical', id: 'v2', display_name: 'V2', children: [] },
                  { type: 'vertical', id: 'v3', display_name: 'V3', children: [] },
                ],
              },
            ],
          },
        ],
      };
      expect(result.current.getNextUnitIframe('v2', courseData)).toBe('v3');
    });

    it('returns null for the last unit', () => {
      const { result } = renderHook(() => useEdxIframe());
      const courseData = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [{ type: 'vertical', id: 'v1', display_name: 'V1', children: [] }],
              },
            ],
          },
        ],
      };
      expect(result.current.getNextUnitIframe('v1', courseData)).toBeNull();
    });

    it('returns null when id is not found', () => {
      const { result } = renderHook(() => useEdxIframe());
      const courseData = {
        type: 'course',
        children: [
          {
            type: 'chapter',
            children: [
              {
                type: 'sequential',
                children: [{ type: 'vertical', id: 'v1', display_name: 'V1', children: [] }],
              },
            ],
          },
        ],
      };
      expect(result.current.getNextUnitIframe('nonexistent', courseData)).toBeNull();
    });
  });

  describe('addBookmarksTab', () => {
    it('adds a bookmarks tab to the tabs array', () => {
      const { result } = renderHook(() => useEdxIframe());
      const tabs: any[] = [];
      result.current.addBookmarksTab(tabs, 'course-123');
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toEqual({
        tab_id: 'bookmarks',
        title: 'Bookmarks',
        url: expect.stringContaining('/courses/course-123/bookmarks'),
      });
    });
  });

  describe('getParentBlockById', () => {
    it('finds a block and returns indices', () => {
      const { result } = renderHook(() => useEdxIframe());
      const blocksArray = [
        {
          id: 'root',
          children: [
            {
              id: 'child-1',
              children: [{ id: 'target-block' }],
            },
          ],
        },
      ];
      const { parentBlock, foundIndices } = result.current.getParentBlockById(
        blocksArray,
        'target-block',
      );
      expect(parentBlock).toEqual({ id: 'target-block' });
      expect(foundIndices).toEqual([0, 0, 0]);
    });

    it('returns null when block is not found', () => {
      const { result } = renderHook(() => useEdxIframe());
      const blocksArray = [{ id: 'root', children: [{ id: 'child-1' }] }];
      const { parentBlock, foundIndices } = result.current.getParentBlockById(
        blocksArray,
        'nonexistent',
      );
      expect(parentBlock).toBeNull();
      expect(foundIndices).toEqual([]);
    });
  });

  describe('getParentsInfosFromSublessonId', () => {
    it('returns module and lesson for a given sublesson id', () => {
      const { result } = renderHook(() => useEdxIframe());
      const modules = [
        {
          id: 'module-1',
          children: [
            {
              id: 'lesson-1',
              children: [{ id: 'sublesson-1' }, { id: 'sublesson-2' }],
            },
          ],
        },
      ];
      const info = result.current.getParentsInfosFromSublessonId(modules, 'sublesson-2');
      expect(info?.module.id).toBe('module-1');
      expect(info?.lesson.id).toBe('lesson-1');
    });

    it('returns empty objects when sublesson is not found', () => {
      const { result } = renderHook(() => useEdxIframe());
      const modules = [
        {
          id: 'module-1',
          children: [{ id: 'lesson-1', children: [{ id: 'sublesson-1' }] }],
        },
      ];
      const info = result.current.getParentsInfosFromSublessonId(modules, 'nonexistent');
      expect(info).toEqual({ module: {}, lesson: {} });
    });

    it('handles modules without children', () => {
      const { result } = renderHook(() => useEdxIframe());
      const modules = [{ id: 'module-1' }];
      const info = result.current.getParentsInfosFromSublessonId(modules, 'sublesson-1');
      expect(info).toEqual({ module: {}, lesson: {} });
    });
  });
});
