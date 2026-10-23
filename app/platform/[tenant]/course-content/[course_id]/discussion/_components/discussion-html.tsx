'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  // Post bodies come back from the LMS already rendered; links in them open
  // outside the course page.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

export const sanitizeHtml = (html: string | null | undefined) =>
  typeof window === 'undefined' || !html
    ? ''
    : DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });

const BODY_CLASSES =
  'text-sm leading-relaxed break-words text-gray-800 [&_a]:text-amber-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:text-[13px] [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-gray-100 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0';

/** A post or response body as the LMS rendered it, sanitised before it hits the DOM. */
export function SanitizedHtml({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const safe = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={cn(BODY_CLASSES, className)}
      data-testid="sanitized-html"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
