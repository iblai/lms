import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/components/edx-iframe/edx-iframe', () => ({
  EdxIframe: () => <div data-testid="edx-iframe">EdxIframe</div>,
}));

vi.mock('@/components/course-agent-chat', () => ({
  CourseAgentChat: () => <div data-testid="course-agent-chat">CourseAgentChat</div>,
}));

const mockSetMentorSidebarHidden = vi.fn();
vi.mock('@/components/chat-button', () => ({
  useChatState: () => ({ setMentorSidebarHidden: mockSetMentorSidebarHidden }),
}));

import AgentTab from '../page';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const mockSetAgentFullscreen = vi.fn();

// `activeTab` is derived from the route by the course-content layout, so this
// page always renders as the agent tab — the harness doesn't model it.
const Harness = ({
  agentMode = 'learning',
  agentFullscreen = false,
}: {
  agentMode?: 'learning' | 'assessment';
  agentFullscreen?: boolean;
}) => (
  <EdxIframeContext.Provider
    value={
      {
        activeTab: 'agent',
        agentMode,
        agentFullscreen,
        setAgentFullscreen: mockSetAgentFullscreen,
      } as any
    }
  >
    <AgentTab />
  </EdxIframeContext.Provider>
);

const renderAgentTab = (
  agentMode: 'learning' | 'assessment' = 'learning',
  agentFullscreen: boolean = false,
) => render(<Harness agentMode={agentMode} agentFullscreen={agentFullscreen} />);

// `className.toContain('hidden')` is ambiguous now that the hidden state uses
// `overflow-hidden`, so assert on exact class tokens instead.
const classes = (el: Element | null | undefined) => Array.from(el?.classList ?? []);

describe('AgentTab page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the full-width CourseAgentChat', async () => {
    const { findByTestId } = renderAgentTab();
    // CourseAgentChat is lazy-loaded via next/dynamic, so it resolves asynchronously.
    expect(await findByTestId('course-agent-chat')).toBeInTheDocument();
  });

  it('hides EdxIframe with visibility, not display, in learning mode', () => {
    const { getByTestId } = renderAgentTab('learning');
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    // `hidden` (display:none) would drop the iframe's rendering box; `invisible`
    // (visibility:hidden) keeps it laid out and painted.
    expect(classes(iframeWrapper)).toContain('invisible');
    expect(classes(iframeWrapper)).not.toContain('hidden');
    expect(iframeWrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the hidden EdxIframe out of the flex flow so the chat keeps full height', () => {
    const { getByTestId } = renderAgentTab('learning');
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    const chatWrapper = getByTestId('course-agent-chat').parentElement;
    // Absolutely positioned: an in-flow `invisible` box would still claim a flex
    // slot and halve the chat's height.
    expect(classes(iframeWrapper)).toEqual(
      expect.arrayContaining(['absolute', 'inset-0', 'pointer-events-none']),
    );
    expect(classes(iframeWrapper)).not.toContain('flex-1');
    expect(classes(chatWrapper)).toEqual(expect.arrayContaining(['min-h-0', 'flex-1']));
    expect(classes(chatWrapper)).not.toContain('hidden');
  });

  it('anchors the out-of-flow EdxIframe to the page container', () => {
    const { container } = renderAgentTab('learning');
    // `absolute inset-0` on the iframe wrapper needs a positioned ancestor,
    // otherwise it escapes to the nearest one further up the tree.
    expect(classes(container.firstChild as HTMLElement)).toContain('relative');
  });

  it('shows EdxIframe in flow and hides CourseAgentChat in assessment mode', () => {
    const { getByTestId } = renderAgentTab('assessment');
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    const chatWrapper = getByTestId('course-agent-chat').parentElement;
    expect(classes(iframeWrapper)).toEqual(expect.arrayContaining(['min-h-0', 'flex-1']));
    expect(classes(iframeWrapper)).not.toContain('invisible');
    expect(classes(iframeWrapper)).not.toContain('absolute');
    expect(iframeWrapper).not.toHaveAttribute('aria-hidden', 'true');
    expect(classes(chatWrapper)).toContain('hidden');
    expect(classes(chatWrapper)).not.toContain('min-h-0');
  });

  it('keeps the same EdxIframe node mounted across mode switches', () => {
    const { getByTestId, rerender } = render(<Harness agentMode="learning" />);
    const iframe = getByTestId('edx-iframe');
    rerender(<Harness agentMode="assessment" />);
    // Same DOM node, not a remount — the iframe must not reload when it is revealed.
    expect(getByTestId('edx-iframe')).toBe(iframe);
    rerender(<Harness agentMode="learning" />);
    expect(getByTestId('edx-iframe')).toBe(iframe);
  });

  it('defaults to learning mode when agentMode is undefined', () => {
    const { getByTestId } = render(
      <EdxIframeContext.Provider value={{ activeTab: 'agent' } as any}>
        <AgentTab />
      </EdxIframeContext.Provider>,
    );
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    expect(classes(iframeWrapper)).toContain('invisible');
    expect(classes(iframeWrapper)).not.toContain('hidden');
  });

  it('hides the sidebar mentor chat while mounted, restores on unmount', () => {
    const { unmount } = renderAgentTab();
    expect(mockSetMentorSidebarHidden).toHaveBeenCalledWith(true);
    unmount();
    expect(mockSetMentorSidebarHidden).toHaveBeenLastCalledWith(false);
  });

  it('uses a single viewport height for the agent tab', () => {
    const { container } = renderAgentTab();
    const wrapper = container.firstChild as HTMLElement;
    // The height no longer depends on a context value that lands a commit late,
    // so there is no shorter transitional height to flash through on mount.
    expect(wrapper.className).toContain('h-[calc(100vh-223px)]');
  });

  it('does not render the fullscreen exit button when not in fullscreen', () => {
    const { queryByTestId } = renderAgentTab('learning', false);
    expect(queryByTestId('agent-fullscreen-exit')).not.toBeInTheDocument();
  });

  it('expands to cover the viewport and shows an exit button in fullscreen', () => {
    const { container, getByTestId } = renderAgentTab('learning', true);
    const wrapper = container.firstChild as HTMLElement;
    // Fullscreen pins the container over the whole viewport instead of the calc heights.
    expect(wrapper.className).toContain('fixed');
    expect(wrapper.className).toContain('inset-0');
    expect(wrapper.className).not.toContain('h-[calc(100vh-223px)]');
    expect(getByTestId('agent-fullscreen-exit')).toBeInTheDocument();
  });

  it('exits fullscreen when the exit button is clicked', () => {
    const { getByTestId } = renderAgentTab('learning', true);
    fireEvent.click(getByTestId('agent-fullscreen-exit'));
    expect(mockSetAgentFullscreen).toHaveBeenCalledWith(false);
  });
});
