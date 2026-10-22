import type { CourseOutlineChildNode } from '@/types/courses';

const firstUnitUnder = (node: CourseOutlineChildNode): string | null => {
  if (node.type === 'vertical') return node.id;
  for (const child of node.children ?? []) {
    const unit = firstUnitUnder(child);
    if (unit) return unit;
  }
  return null;
};

/**
 * The unit (vertical) the Course tab should open for a block: the block itself
 * when it is a unit, the first unit under it for a section or subsection, and
 * the enclosing unit for a component. `null` when the outline doesn't hold it.
 */
export const findUnitIdForBlock = (
  outline: CourseOutlineChildNode | null | undefined,
  blockId: string | null | undefined,
): string | null => {
  if (!outline || !blockId) return null;
  const walk = (node: CourseOutlineChildNode, unitAncestor: string | null): string | null => {
    if (node.id === blockId) return firstUnitUnder(node) ?? unitAncestor;
    const nextAncestor = node.type === 'vertical' ? node.id : unitAncestor;
    for (const child of node.children ?? []) {
      const found = walk(child, nextAncestor);
      if (found) return found;
    }
    return null;
  };
  return walk(outline, null);
};

/** The usage key an LMS / learning-MFE URL points at, if it carries one. */
export const usageKeyInUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    // Not percent-encoded; match the raw string.
  }
  return decoded.match(/block-v1:[^/?#&]+/)?.[0] ?? null;
};
