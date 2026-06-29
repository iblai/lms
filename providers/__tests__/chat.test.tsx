import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';

// chat-button pulls in the agent-ai web component as a side-effect import; stub it.
vi.mock('@iblai/agent-ai', () => ({}));
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetMentorsQuery: () => [vi.fn(), { isLoading: false, isFetching: false }],
}));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => ({ getEmbeddedMentorToUse: vi.fn(), metadataLoaded: true }),
}));

import { ChatProvider } from '@/providers/chat';
import { useChatState } from '@/components/chat-button';

let latest: ReturnType<typeof useChatState>;
let bump: () => void;

function Consumer() {
  latest = useChatState();
  return null;
}

function Harness() {
  const [, setN] = useState(0);
  bump = () => setN((n) => n + 1);
  return (
    <ChatProvider>
      <Consumer />
    </ChatProvider>
  );
}

describe('ChatProvider', () => {
  it('exposes the chat state and setters to consumers', () => {
    render(<Harness />);
    expect(latest.isOpen).toBe(false);
    expect(latest.courseMentor).toBeNull();
    expect(latest.mentorSidebarHidden).toBe(false);
    expect(typeof latest.setIsOpen).toBe('function');
    expect(typeof latest.setCourseMentor).toBe('function');
    expect(typeof latest.setMentorSidebarHidden).toBe('function');
  });

  it('keeps a stable context value reference across re-renders when state is unchanged', () => {
    render(<Harness />);
    const value = latest;
    act(() => bump());
    // useMemo means the provider hands consumers the same object when nothing changed,
    // so consumers that only read chat state are not forced to re-render.
    expect(latest).toBe(value);
  });

  it('produces a new value that reflects the change when a setter is called', () => {
    render(<Harness />);
    const before = latest;

    act(() => before.setIsOpen(true));
    expect(latest).not.toBe(before);
    expect(latest.isOpen).toBe(true);

    const afterOpen = latest;
    act(() => afterOpen.setCourseMentor('mentor-1'));
    expect(latest).not.toBe(afterOpen);
    expect(latest.courseMentor).toBe('mentor-1');
    // unchanged fields are carried through
    expect(latest.isOpen).toBe(true);
  });
});
