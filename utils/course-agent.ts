/**
 * Messages the course agent (`<agent-ai>` web component, which hosts the
 * mentor in an iframe inside its shadow root) understands from the host page.
 */
export const MENTOR_NEW_CHAT_MESSAGE = { type: 'MENTOR:NEW_CHAT' } as const;

const getCourseAgentWindow = (): Window | null =>
  document.querySelector('agent-ai')?.shadowRoot?.querySelector('iframe')?.contentWindow ?? null;

/** Asks the embedded course agent to start a fresh conversation. */
export const requestCourseAgentNewChat = () => {
  getCourseAgentWindow()?.postMessage(MENTOR_NEW_CHAT_MESSAGE, '*');
};
