import { describe, it, expect, vi } from 'vitest';
import type { CourseOutlineChildNode, MentorXblockOutlineNode } from '@/types/courses';
import {
  MENTOR_XBLOCK_TYPE,
  buildAssessmentMentorProps,
  findAssessmentMentorBlock,
  findOutlineNode,
  isMentorXblockNode,
} from '../assessment-mentor';

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      mentor: () => 'https://mentor.example.com',
      auth: () => 'https://auth.example.com',
      lms: () => 'https://lms.example.com',
    },
  },
}));

const node = (overrides: Partial<CourseOutlineChildNode>): CourseOutlineChildNode =>
  ({ id: 'id', block_id: 'id', type: 'html', display_name: 'Block', ...overrides }) as any;

const mentorBlock: MentorXblockOutlineNode = {
  id: 'block-v1:org+c+2026+type@ibl_mentor_xblock+block@m1',
  block_id: 'm1',
  type: 'ibl_mentor_xblock',
  display_name: 'Assessment 1.1.4',
  mentor: 'mentor-uuid-1',
  mentor_domain: 'mentorai.example.org',
  auth_domain: 'auth.example.org',
  is_anonymous: false,
  is_context_aware: true,
  is_advanced: false,
  context_origins: [],
  enable_chat_action_popup: true,
  hide_sidebar: false,
  hide_navbar: true,
  disable_guided_prompts: false,
  assessment_mode: true,
};

const outline = node({
  id: 'course',
  type: 'course',
  children: [
    node({
      id: 'chapter-1',
      type: 'chapter',
      children: [
        node({
          id: 'seq-1',
          type: 'sequential',
          children: [
            node({ id: 'unit-learning', type: 'vertical', children: [node({ id: 'html-1' })] }),
            node({
              id: 'unit-assessment',
              type: 'vertical',
              children: [node({ id: 'html-2' }), mentorBlock],
            }),
            node({ id: 'unit-empty', type: 'vertical' }),
          ],
        }),
      ],
    }),
  ],
});

describe('isMentorXblockNode', () => {
  it('accepts an ibl_mentor_xblock block that names its mentor', () => {
    expect(MENTOR_XBLOCK_TYPE).toBe('ibl_mentor_xblock');
    expect(isMentorXblockNode(mentorBlock)).toBe(true);
  });

  it('rejects other block types and a mentor xblock with no mentor to embed', () => {
    expect(isMentorXblockNode(node({ type: 'vertical' }))).toBe(false);
    expect(isMentorXblockNode({ ...mentorBlock, mentor: '' } as CourseOutlineChildNode)).toBe(
      false,
    );
    expect(
      isMentorXblockNode({ ...mentorBlock, mentor: undefined } as CourseOutlineChildNode),
    ).toBe(false);
    expect(isMentorXblockNode(null)).toBe(false);
    expect(isMentorXblockNode(undefined)).toBe(false);
  });
});

describe('findOutlineNode', () => {
  it('finds a node at any depth, including the root', () => {
    expect(findOutlineNode(outline, 'course')?.id).toBe('course');
    expect(findOutlineNode(outline, 'unit-assessment')?.display_name).toBe('Block');
    expect(findOutlineNode(outline, mentorBlock.id)).toBe(mentorBlock);
  });

  it('yields undefined for an unknown id or no outline', () => {
    expect(findOutlineNode(outline, 'nope')).toBeUndefined();
    expect(findOutlineNode(undefined, 'course')).toBeUndefined();
    expect(findOutlineNode(null, 'course')).toBeUndefined();
    expect(findOutlineNode({} as CourseOutlineChildNode, 'course')).toBeUndefined();
  });
});

describe('findAssessmentMentorBlock', () => {
  it("returns the unit's mentor xblock", () => {
    expect(findAssessmentMentorBlock(outline, 'unit-assessment')).toBe(mentorBlock);
  });

  it('returns null for a unit without one, a unit with no children, or an unknown unit', () => {
    expect(findAssessmentMentorBlock(outline, 'unit-learning')).toBeNull();
    expect(findAssessmentMentorBlock(outline, 'unit-empty')).toBeNull();
    expect(findAssessmentMentorBlock(outline, 'unit-missing')).toBeNull();
  });

  it('returns null with no unit selected or no outline loaded yet', () => {
    expect(findAssessmentMentorBlock(outline, null)).toBeNull();
    expect(findAssessmentMentorBlock(outline, undefined)).toBeNull();
    expect(findAssessmentMentorBlock({} as CourseOutlineChildNode, 'unit-assessment')).toBeNull();
    expect(findAssessmentMentorBlock(null, 'unit-assessment')).toBeNull();
  });
});

describe('buildAssessmentMentorProps', () => {
  const host = { tenant: 'acme', courseId: 'course-v1:org+c+2026', userId: 42 };

  it("mirrors the xblock student view: the xblock's domains, ids and flags", () => {
    expect(buildAssessmentMentorProps(mentorBlock, host)).toEqual({
      mentorUrl: 'https://mentorai.example.org',
      authUrl: 'https://auth.example.org',
      lmsUrl: 'https://lms.example.com',
      tenant: 'acme',
      mentor: 'mentor-uuid-1',
      edxUserId: 42,
      edxCourseId: 'course-v1:org+c+2026',
      edxUsageId: mentorBlock.id,
      authRelyOnHost: true,
      enableGrading: true,
      isAnonymous: false,
      isContextAware: true,
      isAdvanced: false,
      enableChatActionPopup: true,
      handleCreditExhaustion: true,
      extraparams: 'hide-navbar=true',
    });
  });

  it('falls back to the configured mentor and auth URLs when the xblock sets no domains', () => {
    const props = buildAssessmentMentorProps(
      { ...mentorBlock, mentor_domain: '', auth_domain: undefined },
      host,
    );
    expect(props.mentorUrl).toBe('https://mentor.example.com');
    expect(props.authUrl).toBe('https://auth.example.com');
  });

  it('joins every extra param the xblock turns on, and omits the attribute when none is', () => {
    expect(
      buildAssessmentMentorProps(
        { ...mentorBlock, hide_sidebar: true, hide_navbar: true, disable_guided_prompts: true },
        host,
      ).extraparams,
    ).toBe('hide-sidebar=true&hide-navbar=true&disable-guided-prompts=true');
    expect(
      buildAssessmentMentorProps(
        { ...mentorBlock, hide_sidebar: false, hide_navbar: false, disable_guided_prompts: false },
        host,
      ),
    ).not.toHaveProperty('extraparams');
  });

  it('passes the context origins as the comma list the element reads, only when there are any', () => {
    expect(
      buildAssessmentMentorProps(
        { ...mentorBlock, context_origins: ['https://a.example', 'https://b.example'] },
        host,
      ).contextOrigins,
    ).toBe('https://a.example,https://b.example');
    expect(buildAssessmentMentorProps(mentorBlock, host)).not.toHaveProperty('contextOrigins');
    expect(
      buildAssessmentMentorProps({ ...mentorBlock, context_origins: undefined }, host),
    ).not.toHaveProperty('contextOrigins');
  });

  it('reads the boolean flags strictly, with the chat action popup on unless turned off', () => {
    const props = buildAssessmentMentorProps(
      {
        ...mentorBlock,
        assessment_mode: undefined,
        is_anonymous: true,
        is_context_aware: undefined,
        is_advanced: true,
        enable_chat_action_popup: undefined,
      },
      host,
    );
    expect(props.enableGrading).toBe(false);
    expect(props.isAnonymous).toBe(true);
    expect(props.isContextAware).toBe(false);
    expect(props.isAdvanced).toBe(true);
    expect(props.enableChatActionPopup).toBe(true);
    expect(
      buildAssessmentMentorProps({ ...mentorBlock, enable_chat_action_popup: false }, host)
        .enableChatActionPopup,
    ).toBe(false);
  });

  it('leaves the user id out when the host has none', () => {
    expect(buildAssessmentMentorProps(mentorBlock, { ...host, userId: null }).edxUserId).toBe(
      undefined,
    );
    expect(buildAssessmentMentorProps(mentorBlock, { ...host, userId: undefined }).edxUserId).toBe(
      undefined,
    );
  });
});
