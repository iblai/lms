import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/config', () => ({
  config: { urls: { lms: () => 'https://learn.example.org' } },
}));

vi.mock('lucide-react', () => ({
  FileText: (props: any) => <span data-testid="icon-pdf" {...props} />,
  Library: (props: any) => <span data-testid="icon-catalog" {...props} />,
  PlaySquare: (props: any) => <span data-testid="icon-video" {...props} />,
  Projector: (props: any) => <span data-testid="icon-trigger" {...props} />,
}));

// Radix's menu/dialog primitives need pointer-capture APIs jsdom lacks, so they
// are stubbed down to the bits this component actually drives. Real interaction
// is covered by the e2e journey (tabs-34).
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({ children, onSelect, ...props }: any) => (
    <button onClick={onSelect} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

import {
  CourseMediaDropdown,
  CourseMediaMenuItems,
  CourseMediaPreviewDialog,
  getUnitMediaBlocks,
} from '../course-media-dropdown';
import type { CourseBlockDetailsBlock } from '@/types/courses';

const block = (
  type: string,
  display_name: string,
  overrides: Partial<CourseBlockDetailsBlock> = {},
): CourseBlockDetailsBlock => ({
  id: `block@${display_name}`,
  block_id: display_name,
  type,
  display_name,
  student_view_url: `https://learn.example.org/xblock/${display_name}`,
  ...overrides,
});

const blocksFixture = (list: CourseBlockDetailsBlock[]) =>
  Object.fromEntries(list.map((b) => [b.id, b]));

const mediaBlocks = blocksFixture([
  block('video', 'Intro Video'),
  block('pdf', 'Sample PDF File'),
  block('ibl-media-catalog', 'Media Resource'),
]);

const attachEdxIframe = () => {
  const iframe = document.createElement('iframe');
  iframe.id = 'edx-iframe';
  document.body.appendChild(iframe);
  return iframe;
};

describe('getUnitMediaBlocks', () => {
  it('keeps only pdf, video, and ibl-media-catalog blocks', () => {
    const blocks = blocksFixture([
      block('problem', 'Checkboxes'),
      block('html', 'Zooming Image Tool'),
      block('vertical', "Duplicate of 'Unit'"),
      block('video', 'Intro Video'),
      block('pdf', 'Sample PDF File'),
      block('ibl-media-catalog', 'Media Resource'),
    ]);

    expect(getUnitMediaBlocks(blocks).map((b) => b.display_name)).toEqual([
      'Intro Video',
      'Sample PDF File',
      'Media Resource',
    ]);
  });

  it('returns an empty list when blocks are missing', () => {
    expect(getUnitMediaBlocks(undefined)).toEqual([]);
  });
});

describe('CourseMediaDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.getElementById('edx-iframe')?.remove();
  });

  it('renders nothing when the unit has no media blocks', () => {
    const { container } = render(
      <CourseMediaDropdown
        blocks={blocksFixture([block('problem', 'Checkboxes')])}
        currentTab="agent"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lists each media block with its display name and human-readable type', () => {
    render(<CourseMediaDropdown blocks={mediaBlocks} currentTab="agent" />);

    const items = screen.getAllByTestId('course-media-dropdown-item');
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.textContent)).toEqual([
      'Intro VideoVideo',
      'Sample PDF FilePDF',
      'Media ResourceMedia catalog',
    ]);
  });

  describe('on the agent tab', () => {
    it('opens the preview overlay on the block student_view_url', () => {
      render(<CourseMediaDropdown blocks={mediaBlocks} currentTab="agent" />);

      expect(screen.queryByTestId('course-media-preview')).not.toBeInTheDocument();
      fireEvent.click(screen.getAllByTestId('course-media-dropdown-item')[1]);

      const iframe = screen
        .getByTestId('course-media-preview')
        .querySelector('iframe') as HTMLIFrameElement;
      expect(iframe).toHaveAttribute('src', 'https://learn.example.org/xblock/Sample PDF File');
      expect(toastError).not.toHaveBeenCalled();
    });

    it('lays the overlay out as a flex column so the header cannot stretch', () => {
      // Regression guard: DialogContent is a `grid` by default, whose auto rows
      // stretch to fill the fixed height and pad the header to half the dialog.
      render(<CourseMediaDropdown blocks={mediaBlocks} currentTab="agent" />);
      fireEvent.click(screen.getAllByTestId('course-media-dropdown-item')[0]);

      const dialog = screen.getByTestId('course-media-preview');
      expect(dialog).toHaveStyle({ display: 'flex', flexDirection: 'column' });
      expect(dialog.querySelector('iframe')).toHaveStyle({ flex: '1 1 auto' });
    });

    it('keeps the block name available to screen readers but not on screen', () => {
      render(<CourseMediaDropdown blocks={mediaBlocks} currentTab="agent" />);
      fireEvent.click(screen.getAllByTestId('course-media-dropdown-item')[1]);

      const heading = screen.getByRole('heading', { name: 'Sample PDF File' });
      expect(heading.closest('.sr-only')).not.toBeNull();
    });

    it('warns instead of opening an empty overlay when there is no preview url', () => {
      render(
        <CourseMediaDropdown
          blocks={blocksFixture([block('pdf', 'Broken PDF', { student_view_url: undefined })])}
          currentTab="agent"
        />,
      );

      fireEvent.click(screen.getByTestId('course-media-dropdown-item'));

      expect(toastError).toHaveBeenCalledWith('This resource has no preview available');
      expect(screen.queryByTestId('course-media-preview')).not.toBeInTheDocument();
    });
  });

  describe('on the course tab', () => {
    it('posts SCROLL_TO with the block id to the edx iframe on the LMS origin', () => {
      const iframe = attachEdxIframe();
      const postMessage = vi.spyOn(iframe.contentWindow!, 'postMessage');

      render(<CourseMediaDropdown blocks={mediaBlocks} currentTab="course" />);
      fireEvent.click(screen.getAllByTestId('course-media-dropdown-item')[2]);

      expect(postMessage).toHaveBeenCalledWith(
        { type: 'SCROLL_TO', id: 'block@Media Resource' },
        'https://learn.example.org',
      );
      expect(screen.queryByTestId('course-media-preview')).not.toBeInTheDocument();
      expect(toastError).not.toHaveBeenCalled();
    });

    it('warns when the course iframe has not mounted yet', () => {
      render(<CourseMediaDropdown blocks={mediaBlocks} currentTab="course" />);
      fireEvent.click(screen.getAllByTestId('course-media-dropdown-item')[0]);

      expect(toastError).toHaveBeenCalledWith('Course content is still loading');
    });
  });
});

// Flat variant for the mobile course-controls popover; same selection rules
// as the dropdown, but the preview dialog is owned by the caller (the course
// layout) via onAction.
describe('CourseMediaMenuItems', () => {
  const onAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.getElementById('edx-iframe')?.remove();
  });

  it('renders nothing when the unit has no media blocks', () => {
    const { container } = render(
      <CourseMediaMenuItems
        blocks={blocksFixture([block('problem', 'Checkboxes')])}
        currentTab="agent"
        onAction={onAction}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lists each media block with its display name and human-readable type', () => {
    render(<CourseMediaMenuItems blocks={mediaBlocks} currentTab="agent" onAction={onAction} />);

    expect(screen.getByText('Media')).toBeInTheDocument();
    const items = screen.getAllByTestId('course-media-menu-item');
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.textContent)).toEqual([
      'Intro VideoVideo',
      'Sample PDF FilePDF',
      'Media ResourceMedia catalog',
    ]);
  });

  it('on the agent tab, hands the block to onAction for the caller-owned preview', () => {
    render(<CourseMediaMenuItems blocks={mediaBlocks} currentTab="agent" onAction={onAction} />);
    fireEvent.click(screen.getAllByTestId('course-media-menu-item')[1]);

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: 'Sample PDF File' }),
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it('on the agent tab, warns and skips onAction when the block has no preview url', () => {
    render(
      <CourseMediaMenuItems
        blocks={blocksFixture([block('pdf', 'Broken PDF', { student_view_url: undefined })])}
        currentTab="agent"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByTestId('course-media-menu-item'));

    expect(toastError).toHaveBeenCalledWith('This resource has no preview available');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('on the course tab, posts SCROLL_TO and calls onAction with null (no preview)', () => {
    const iframe = attachEdxIframe();
    const postMessage = vi.spyOn(iframe.contentWindow!, 'postMessage');

    render(<CourseMediaMenuItems blocks={mediaBlocks} currentTab="course" onAction={onAction} />);
    fireEvent.click(screen.getAllByTestId('course-media-menu-item')[2]);

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'SCROLL_TO', id: 'block@Media Resource' },
      'https://learn.example.org',
    );
    expect(onAction).toHaveBeenCalledWith(null);
  });

  it('on the course tab, warns and skips onAction when the course iframe has not mounted', () => {
    render(<CourseMediaMenuItems blocks={mediaBlocks} currentTab="course" onAction={onAction} />);
    fireEvent.click(screen.getAllByTestId('course-media-menu-item')[0]);

    expect(toastError).toHaveBeenCalledWith('Course content is still loading');
    expect(onAction).not.toHaveBeenCalled();
  });
});

describe('CourseMediaPreviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no block is set', () => {
    render(<CourseMediaPreviewDialog block={null} onClose={vi.fn()} />);
    expect(screen.queryByTestId('course-media-preview')).not.toBeInTheDocument();
  });

  it('previews the block student_view_url in the flex-column overlay', () => {
    render(<CourseMediaPreviewDialog block={block('pdf', 'Sample PDF File')} onClose={vi.fn()} />);

    const dialog = screen.getByTestId('course-media-preview');
    expect(dialog).toHaveStyle({ display: 'flex', flexDirection: 'column' });
    const iframe = dialog.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).toHaveAttribute('src', 'https://learn.example.org/xblock/Sample PDF File');
  });
});
