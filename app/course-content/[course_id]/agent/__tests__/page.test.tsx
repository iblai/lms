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

const renderAgentTab = (activeTab: string = 'course') =>
  render(
    <EdxIframeContext.Provider value={{ setActiveTab: mockSetActiveTab, activeTab } as any}>
      <AgentTab />
    </EdxIframeContext.Provider>,
  );

describe('AgentTab page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the full-width CourseAgentChat', () => {
    const { getByTestId } = renderAgentTab();
    expect(getByTestId('course-agent-chat')).toBeInTheDocument();
  });

  it('keeps EdxIframe mounted but hidden via display:none', () => {
    const { getByTestId } = renderAgentTab();
    const iframeWrapper = getByTestId('edx-iframe').parentElement;
    expect(iframeWrapper).toHaveStyle({ display: 'none' });
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
    expect(agentWrapper.className).toContain('h-[calc(100vh-100px-62px-42px)]');

    const { container: courseContainer } = renderAgentTab('course');
    const courseWrapper = courseContainer.firstChild as HTMLElement;
    // When not on agent tab, the extra 42px is omitted from the calc.
    expect(courseWrapper.className).toContain('h-[calc(100vh-100px-62px)]');
  });
});
