'use client';

import { useMemo, useState } from 'react';

import { FileText, Library, PlaySquare, Projector } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { config } from '@/lib/config';
import type { CourseBlockDetailsBlock } from '@/types/courses';

// Only these block types are surfaced as "media" for the current unit.
const MEDIA_BLOCK_TYPES = ['pdf', 'ibl-media-catalog', 'video'];

const MEDIA_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  'ibl-media-catalog': 'Media catalog',
  video: 'Video',
};

const MEDIA_TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  'ibl-media-catalog': Library,
  video: PlaySquare,
};

export const getUnitMediaBlocks = (
  blocks: Record<string, CourseBlockDetailsBlock> | undefined,
): CourseBlockDetailsBlock[] =>
  Object.values(blocks ?? {}).filter((block) => MEDIA_BLOCK_TYPES.includes(block.type));

/**
 * Shared selection behavior: the agent tab previews the block inline (via
 * `onPreview`); the course tab asks the edX iframe to scroll the block into
 * view since it already renders the whole unit. Returns true when the
 * selection resulted in an action (vs an error toast), so callers can close
 * a containing popover only on success.
 */
const selectMediaBlock = (
  block: CourseBlockDetailsBlock,
  currentTab: string | undefined,
  onPreview: (block: CourseBlockDetailsBlock) => void,
): boolean => {
  if (currentTab === 'agent') {
    if (!block.student_view_url) {
      toast.error('This resource has no preview available');
      return false;
    }
    onPreview(block);
    return true;
  }

  const iframe = document.getElementById('edx-iframe') as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) {
    toast.error('Course content is still loading');
    return false;
  }
  iframe.contentWindow.postMessage({ type: 'SCROLL_TO', id: block.id }, config.urls.lms());
  return true;
};

/**
 * Fullscreen-ish preview overlay for a media block's `student_view_url`.
 * Rendered by the desktop dropdown below, and standalone by the course
 * layout for the mobile controls popover — the dialog must NOT live inside
 * the popover, which dismisses (and unmounts its children) on outside focus.
 */
export const CourseMediaPreviewDialog = ({
  block,
  onClose,
}: {
  block: CourseBlockDetailsBlock | null;
  onClose: () => void;
}) => (
  <Dialog open={block !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className="gap-0 p-0"
      // Laid out inline rather than with Tailwind: the base DialogContent is
      // a `grid` whose auto rows stretch to fill a fixed height, which pads
      // the header to half the dialog. Inline styles also survive the dev
      // server dropping newly-added arbitrary utilities from its CSS.
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 'min(1200px, 94vw)',
        maxWidth: 'none',
        height: 'min(88vh, 900px)',
        overflow: 'hidden',
        // Top strip keeps the close button clear of the iframe.
        padding: '2.5rem 1rem 1rem',
      }}
      data-testid="course-media-preview"
    >
      {/* The block name/type are visible in the dropdown that opened this,
          so they stay screen-reader-only here to keep the frame clean. */}
      <DialogHeader className="sr-only">
        <DialogTitle>{block?.display_name}</DialogTitle>
        <DialogDescription>
          {block ? (MEDIA_TYPE_LABELS[block.type] ?? block.type) : ''}
        </DialogDescription>
      </DialogHeader>
      {block?.student_view_url && (
        <iframe
          src={block.student_view_url}
          title={block.display_name}
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            width: '100%',
            border: 0,
            borderRadius: '0.375rem',
          }}
          sandbox="allow-modals allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads"
          allowFullScreen
          allow="microphone *; camera *; midi *; geolocation *; encrypted-media *"
        />
      )}
    </DialogContent>
  </Dialog>
);

/**
 * Flat media list for the mobile course-controls popover. Selection follows
 * the same rules as the desktop dropdown; `onAction` fires after a successful
 * selection with the block to preview (agent tab) or null (course tab
 * scroll-to), letting the layout close the popover and open the preview
 * dialog it renders outside of it.
 */
export const CourseMediaMenuItems = ({
  blocks,
  currentTab,
  onAction,
}: {
  blocks: Record<string, CourseBlockDetailsBlock> | undefined;
  currentTab: string | undefined;
  onAction: (previewBlock: CourseBlockDetailsBlock | null) => void;
}) => {
  const mediaBlocks = useMemo(() => getUnitMediaBlocks(blocks), [blocks]);

  if (mediaBlocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Unit media">
      <span className="text-xs text-gray-500">Media</span>
      {mediaBlocks.map((block) => {
        const Icon = MEDIA_TYPE_ICONS[block.type] ?? FileText;
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => {
              let preview: CourseBlockDetailsBlock | null = null;
              const acted = selectMediaBlock(block, currentTab, (b) => {
                preview = b;
              });
              if (acted) {
                onAction(preview);
              }
            }}
            className="flex items-center gap-2 rounded p-1 text-left focus:ring-2 focus:ring-amber-500 focus:outline-none"
            data-testid="course-media-menu-item"
          >
            <Icon className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-gray-900">{block.display_name}</span>
              <span className="block text-xs text-gray-500">
                {MEDIA_TYPE_LABELS[block.type] ?? block.type}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const CourseMediaDropdown = ({
  blocks,
  currentTab,
}: {
  blocks: Record<string, CourseBlockDetailsBlock> | undefined;
  currentTab: string | undefined;
}) => {
  const [previewBlock, setPreviewBlock] = useState<CourseBlockDetailsBlock | null>(null);
  const mediaBlocks = useMemo(() => getUnitMediaBlocks(blocks), [blocks]);

  if (mediaBlocks.length === 0) {
    return null;
  }

  const handleSelect = (block: CourseBlockDetailsBlock) => {
    selectMediaBlock(block, currentTab, setPreviewBlock);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="rounded p-1 text-gray-500 transition-colors hover:text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          aria-label="Unit media"
          title="Media"
          data-testid="course-media-dropdown-trigger"
        >
          <Projector className="h-5 w-5" />
        </DropdownMenuTrigger>
        {/* border-gray-200 is explicit because the shared DropdownMenuContent
            only sets `border`, which Tailwind v4 resolves to currentColor. */}
        <DropdownMenuContent align="end" className="w-64 border-gray-200">
          <DropdownMenuLabel className="text-xs text-gray-500">Media</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {mediaBlocks.map((block) => {
            const Icon = MEDIA_TYPE_ICONS[block.type] ?? FileText;
            return (
              <DropdownMenuItem
                key={block.id}
                onSelect={() => handleSelect(block)}
                className="flex items-start gap-2"
                data-testid="course-media-dropdown-item"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-gray-900">{block.display_name}</span>
                  <span className="block text-xs text-gray-500">
                    {MEDIA_TYPE_LABELS[block.type] ?? block.type}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <CourseMediaPreviewDialog block={previewBlock} onClose={() => setPreviewBlock(null)} />
    </>
  );
};
