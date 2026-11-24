import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getUserId: vi.fn(() => 42),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'acme',
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      mentor: vi.fn(() => 'https://mentor.example.com'),
      auth: vi.fn(() => 'https://auth.example.com'),
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

vi.mock('@iblai/agent-ai', () => ({}));

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

vi.mock('@/features/mentor', () => ({
  setMentorSpinnerHidden: vi.fn((value: boolean) => ({
    type: 'mentor/setMentorSpinnerHidden',
    payload: value,
  })),
  setMentorAgentReady: vi.fn((value: boolean) => ({
    type: 'mentor/setMentorAgentReady',
    payload: value,
  })),
}));

import { AssessmentMentorChat } from '../assessment-mentor-chat';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import {
  getLoadedEdxUnitId,
  hasEdxIframeLoaded,
  markEdxIframeUnloaded,
  waitForEdxUnitLoaded,
} from '@/hooks/courses/use-edx-iframe-loaded';
import type { MentorXblockOutlineNode } from '@/types/courses';

const UNIT_ID = 'block-v1:org+c+2026+type@vertical+block@unit-1';
const COURSE_ID = 'course-v1:org+c+2026';

const block: MentorXblockOutlineNode = {
  id: 'block-v1:org+c+2026+type@ibl_mentor_xblock+block@m1',
  block_id: 'm1',
  type: 'ibl_mentor_xblock',
  display_name: 'Assessment 1.1.4',
  mentor: 'mentor-uuid-1',
  mentor_domain: 'mentorai.example.org',
  auth_domain: 'auth.example.org',
  is_anonymous: false,
  is_context_aware: true,
  is_advanced: false,
  context_origins: [],
  enable_chat_action_popup: true,
  hide_sidebar: false,
  hide_navbar: true,
  disable_guided_prompts: false,
  assessment_mode: true,
};

const renderChat = (
  overrides: Partial<MentorXblockOutlineNode> = {},
  unitId: string | null = UNIT_ID,
) =>
  render(
    <CourseOutlineContext.Provider value={{ currentUnitID: unitId } as any}>
      <EdxIframeContext.Provider value={{ courseID: COURSE_ID } as any}>
        <AssessmentMentorChat block={{ ...block, ...overrides }} />
      </EdxIframeContext.Provider>
    </CourseOutlineContext.Provider>,
  );

const agentElement = (container: HTMLElement) => container.querySelector('agent-ai') as HTMLElement;

describe('AssessmentMentorChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markEdxIframeUnloaded();
  });

  afterEach(() => {
    markEdxIframeUnloaded();
  });

  it('embeds the mentor at once, without waiting for any course iframe', () => {
    const { container, getByTestId } = renderChat();
    expect(getByTestId('assessment-mentor-chat')).toBeInTheDocument();
    expect(agentElement(container)).toBeInTheDocument();
    expect(hasEdxIframeLoaded()).toBe(false);
  });

  it("gives the element the xblock's own settings, as its edX student view would", () => {
    const { container } = renderChat();
    const el = agentElement(container);
    expect(el.getAttribute('mentorurl')).toBe('https://mentorai.example.org');
    expect(el.getAttribute('authurl')).toBe('https://auth.example.org');
    expect(el.getAttribute('lmsurl')).toBe('https://lms.example.com');
    expect(el.getAttribute('tenant')).toBe('acme');
    expect(el.getAttribute('mentor')).toBe('mentor-uuid-1');
    expect(el.getAttribute('edxuserid')).toBe('42');
    expect(el.getAttribute('edxcourseid')).toBe(COURSE_ID);
    expect(el.getAttribute('edxusageid')).toBe(block.id);
    expect(el.getAttribute('extraparams')).toBe('hide-navbar=true');
    expect(el.getAttribute('theme')).toBe('light');
    expect(el).toHaveAttribute('authrelyonhost');
    expect(el).toHaveAttribute('enablegrading');
    expect(el).toHaveAttribute('iscontextaware');
    expect(el).toHaveAttribute('enablechatactionpopup');
    expect(el).toHaveAttribute('handlecreditexhaustion');
    expect(el).not.toHaveAttribute('isanonymous');
    expect(el).not.toHaveAttribute('isadvanced');
    expect(el).not.toHaveAttribute('enablelessoncompletion');
  });

  it('turns grading off for a mentor xblock that is not in assessment mode', () => {
    const { container } = renderChat({ assessment_mode: false, is_anonymous: true });
    const el = agentElement(container);
    expect(el).not.toHaveAttribute('enablegrading');
    expect(el).toHaveAttribute('isanonymous');
  });

  it("stands in for the course iframe's unit.loaded, so the unit-switch notice fires", () => {
    const onLoaded = vi.fn();
    waitForEdxUnitLoaded(UNIT_ID, onLoaded);
    renderChat();
    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(getLoadedEdxUnitId()).toBe(UNIT_ID);
  });

  it('satisfies a wait that starts after it mounted', () => {
    renderChat();
    const onLoaded = vi.fn();
    waitForEdxUnitLoaded(UNIT_ID, onLoaded);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('does not latch the iframe-loaded state the learning chat is gated on', () => {
    renderChat();
    expect(hasEdxIframeLoaded()).toBe(false);
  });

  it('announces nothing while no unit is selected', () => {
    renderChat({}, null);
    expect(getLoadedEdxUnitId()).toBeNull();
  });

  it('reports the agent ready when its own iframe posts { ready: true }', async () => {
    const { setMentorAgentReady } = await import('@/features/mentor');
    const { container } = renderChat();
    const el = agentElement(container);
    const contentWindow = {} as Window;
    Object.defineProperty(el, 'shadowRoot', {
      value: {
        querySelector: (selector: string) => (selector === 'iframe' ? { contentWindow } : null),
      },
      configurable: true,
    });

    const event = new MessageEvent('message', { data: { ready: true } });
    Object.defineProperty(event, 'source', { value: contentWindow });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(setMentorAgentReady).toHaveBeenCalledWith(true);
  });

  it('reports the mentor spinner gone, so the layout offers New chat', async () => {
    const { setMentorSpinnerHidden } = await import('@/features/mentor');
    const { container } = renderChat();
    const spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.style.display = 'none';
    Object.defineProperty(agentElement(container), 'shadowRoot', {
      value: {
        querySelector: (selector: string) => (selector === '#loading-spinner' ? spinner : null),
      },
      configurable: true,
    });

    await waitFor(() => {
      expect(setMentorSpinnerHidden).toHaveBeenCalledWith(true);
    });
  });

  it('forwards the autoplay toggle into the mentor', () => {
    const { container } = renderChat();
    const postMessage = vi.fn();
    Object.defineProperty(agentElement(container), 'shadowRoot', {
      value: {
        querySelector: (selector: string) =>
          selector === 'iframe' ? { contentWindow: { postMessage } } : null,
      },
      configurable: true,
    });

    window.dispatchEvent(new CustomEvent('mentor:autoplay-changed', { detail: { enabled: true } }));

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'MENTOR:ENABLE_AUTOPLAY_LAST_AI_MESSAGE' },
      '*',
    );
  });
});
