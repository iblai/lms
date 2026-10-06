import { describe, it, expect, vi, afterEach } from 'vitest';
import { MENTOR_NEW_CHAT_MESSAGE, requestCourseAgentNewChat } from '../course-agent';

const mountAgent = (iframe: unknown) => {
  const agent = document.createElement('agent-ai');
  Object.defineProperty(agent, 'shadowRoot', {
    value: { querySelector: (selector: string) => (selector === 'iframe' ? iframe : null) },
    configurable: true,
  });
  document.body.appendChild(agent);
  return agent;
};

describe('requestCourseAgentNewChat', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('posts MENTOR:NEW_CHAT into the agent iframe', () => {
    const postMessage = vi.fn();
    mountAgent({ contentWindow: { postMessage } });

    requestCourseAgentNewChat();

    expect(postMessage).toHaveBeenCalledWith(MENTOR_NEW_CHAT_MESSAGE, '*');
  });

  it('is a no-op when no agent is mounted or its iframe is not ready', () => {
    expect(() => requestCourseAgentNewChat()).not.toThrow();
    mountAgent(null);
    expect(() => requestCourseAgentNewChat()).not.toThrow();
  });
});
