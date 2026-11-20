import { config } from '@/lib/config';
import type { CourseOutlineChildNode, MentorXblockOutlineNode } from '@/types/courses';

/** Outline block type the backend gives the mentor xblock inside an assessment unit. */
export const MENTOR_XBLOCK_TYPE = 'ibl_mentor_xblock';

/** A mentor xblock the page can embed: typed as one and naming its mentor. */
export function isMentorXblockNode(
  node: CourseOutlineChildNode | null | undefined,
): node is MentorXblockOutlineNode {
  if (node?.type !== MENTOR_XBLOCK_TYPE) return false;
  const { mentor } = node as Partial<MentorXblockOutlineNode>;
  return typeof mentor === 'string' && mentor !== '';
}

/** Depth-first lookup by id; undefined for an outline that is empty or lacks it. */
export function findOutlineNode(
  root: CourseOutlineChildNode | null | undefined,
  id: string,
): CourseOutlineChildNode | undefined {
  if (!root) return undefined;
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const match = findOutlineNode(child, id);
    if (match) return match;
  }
  return undefined;
}

/**
 * The mentor xblock the outline lists under `unitId`, or null. Null also
 * covers a course published before the outline carried the xblock's type:
 * such a unit may still be an assessment, served through the edX iframe.
 */
export function findAssessmentMentorBlock(
  outline: CourseOutlineChildNode | null | undefined,
  unitId: string | null | undefined,
): MentorXblockOutlineNode | null {
  if (!unitId) return null;
  return findOutlineNode(outline, unitId)?.children?.find(isMentorXblockNode) ?? null;
}

export interface AssessmentMentorHost {
  tenant: string;
  courseId: string;
  userId?: string | number | null;
}

/**
 * The `<agent-ai>` attributes the mentor xblock's own student view sets
 * (ibl_mentor_xblock/templates/student.html), built from the outline's copy
 * of its settings, so the page embeds the agent the edX unit would have.
 */
export function buildAssessmentMentorProps(
  block: MentorXblockOutlineNode,
  { tenant, courseId, userId }: AssessmentMentorHost,
) {
  const contextOrigins = block.context_origins ?? [];
  const extraParams = [
    block.hide_sidebar && 'hide-sidebar=true',
    block.hide_navbar && 'hide-navbar=true',
    block.disable_guided_prompts && 'disable-guided-prompts=true',
  ]
    .filter(Boolean)
    .join('&');

  return {
    mentorUrl: block.mentor_domain ? `https://${block.mentor_domain}` : config.urls.mentor(),
    authUrl: block.auth_domain ? `https://${block.auth_domain}` : config.urls.auth(),
    lmsUrl: config.urls.lms(),
    tenant,
    mentor: block.mentor,
    edxUserId: userId ?? undefined,
    edxCourseId: courseId,
    // Grades are posted against the xblock, not the unit holding it.
    edxUsageId: block.id,
    authRelyOnHost: true,
    enableGrading: block.assessment_mode === true,
    isAnonymous: block.is_anonymous === true,
    isContextAware: block.is_context_aware === true,
    isAdvanced: block.is_advanced === true,
    enableChatActionPopup: block.enable_chat_action_popup !== false,
    handleCreditExhaustion: true,
    ...(contextOrigins.length > 0 ? { contextOrigins: contextOrigins.join(',') } : {}),
    ...(extraParams ? { extraparams: extraParams } : {}),
  };
}
