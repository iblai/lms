import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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

const mockSetActiveTab = vi.fn();

const renderAgentTab = (
  activeTab: string = 'course',
  agentMode: 'learning' | 'assessment' = 'learning',
) =>
  render(
    <EdxIframeContext.Provider
      value={{ setActiveTab: mockSetActiveTab, activeTab, agentMode } as any}
    >
      <AgentTab />
    </EdxIframeContext.Provider>,
  );

describe('AgentTab page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the full-width CourseAgentChat', async () => {
    const { findByTestId } = renderAgentTab();
    // CourseAgentChat is lazy-loaded via next/dynamic, so it resolves asynchronously.
    expect(await findByTestId('course-agent-chat')).toBeInTheDocument();
  });

  it('hides EdxIframe and shows CourseAgentChat in learning mode', () => {
    const { getByTestId } = renderAgentTab('agent', 'learning');
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    const chatWrapper = getByTestId('course-agent-chat').parentElement;
    expect(iframeWrapper?.className).toContain('hidden');
    expect(iframeWrapper?.className).not.toContain('min-h-0');
    expect(chatWrapper?.className).toContain('min-h-0');
    expect(chatWrapper?.className).not.toContain('hidden');
  });

  it('shows EdxIframe and hides CourseAgentChat in assessment mode', () => {
    const { getByTestId } = renderAgentTab('agent', 'assessment');
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    const chatWrapper = getByTestId('course-agent-chat').parentElement;
    expect(iframeWrapper?.className).toContain('min-h-0');
    expect(iframeWrapper?.className).not.toContain('hidden');
    expect(chatWrapper?.className).toContain('hidden');
    expect(chatWrapper?.className).not.toContain('min-h-0');
  });

  it('defaults to learning mode when agentMode is undefined', () => {
    const { getByTestId } = render(
      <EdxIframeContext.Provider
        value={{ setActiveTab: mockSetActiveTab, activeTab: 'agent' } as any}
      >
        <AgentTab />
      </EdxIframeContext.Provider>,
    );
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    expect(iframeWrapper?.className).toContain('hidden');
  });

  it('announces agent as the active tab on mount', () => {
    renderAgentTab();
    expect(mockSetActiveTab).toHaveBeenCalledWith('agent');
  });

  it('hides the sidebar mentor chat while mounted, restores on unmount', () => {
    const { unmount } = renderAgentTab();
    expect(mockSetMentorSidebarHidden).toHaveBeenCalledWith(true);
    unmount();
    expect(mockSetMentorSidebarHidden).toHaveBeenLastCalledWith(false);
  });

  it('uses full viewport height on the agent tab, shrinking when activeTab is agent', () => {
    const { container: agentContainer } = renderAgentTab('agent');
    const agentWrapper = agentContainer.firstChild as HTMLElement;
    expect(agentWrapper.className).toContain('h-[calc(100vh-203px)]');

    const { container: courseContainer } = renderAgentTab('course');
    const courseWrapper = courseContainer.firstChild as HTMLElement;
    // When not on the agent tab, the layout reserves less vertical space.
    expect(courseWrapper.className).toContain('h-[calc(100vh-162px)]');
  });
});
