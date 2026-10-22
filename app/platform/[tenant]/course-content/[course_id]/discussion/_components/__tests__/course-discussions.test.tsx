import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { DiscussionConfig } from '@/types/discussions';

const nav = vi.hoisted(() => ({ push: vi.fn(), search: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => '/c/discussion',
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick, ...rest }: any) => (
    <a
      href={href}
      className={className}
      onClick={(event: React.MouseEvent) => {
        // jsdom can't navigate; the real Link is a client-side transition.
        event.preventDefault();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));
vi.mock('@/utils/helpers', () => ({ getUserName: () => 'me' }));
const hooks = vi.hoisted(() => ({ config: vi.fn(), topics: vi.fn() }));
vi.mock('@/services/discussions', () => ({
  useGetDiscussionConfigQuery: (...args: any[]) => hooks.config(...args),
  useGetCourseTopicsQuery: (...args: any[]) => hooks.topics(...args),
}));
const captured = vi.hoisted(() => ({
  list: vi.fn(),
  thread: vi.fn(),
  topics: vi.fn(),
  learners: vi.fn(),
  form: vi.fn(),
}));
vi.mock('../posts-list', () => ({
  PostsList: (props: any) => {
    captured.list(props);
    return (
      <div data-testid="posts-list">
        <button type="button" onClick={() => props.onSelect('t9')}>
          select
        </button>
        <button type="button" onClick={props.onAddPost}>
          add
        </button>
        {props.heading && (
          <button type="button" onClick={props.heading.onBack}>
            back
          </button>
        )}
      </div>
    );
  },
}));
vi.mock('../thread-view', () => ({
  ThreadView: (props: any) => {
    captured.thread(props);
    return (
      <div data-testid="thread-view">
        <button type="button" onClick={props.onBack}>
          thread-back
        </button>
        <button type="button" onClick={props.onDeleted}>
          thread-deleted
        </button>
        <button type="button" onClick={() => props.onTopicClick('w1')}>
          thread-topic
        </button>
      </div>
    );
  },
}));
vi.mock('../topics-view', () => ({
  TopicsView: (props: any) => {
    captured.topics(props);
    return (
      <button type="button" data-testid="topics-view" onClick={() => props.onSelectTopic('w1')}>
        topics
      </button>
    );
  },
}));
vi.mock('../learners-view', () => ({
  LearnersView: (props: any) => {
    captured.learners(props);
    return (
      <button
        type="button"
        data-testid="learners-view"
        onClick={() => props.onSelectLearner('ada')}
      >
        learners
      </button>
    );
  },
}));
vi.mock('../post-form', () => ({
  PostForm: (props: any) => {
    captured.form(props);
    return (
      <div data-testid="post-form">
        <button type="button" onClick={() => props.onSaved({ id: 'new' })}>
          saved
        </button>
        <button type="button" onClick={props.onCancel}>
          cancel
        </button>
      </div>
    );
  },
}));

import { CourseDiscussions } from '../course-discussions';

const config = (overrides: Partial<DiscussionConfig> = {}) =>
  ({ is_posting_enabled: true, has_moderation_privileges: true, ...overrides }) as DiscussionConfig;
const topics = {
  non_courseware_topics: [{ id: 'course', name: 'General', children: [], thread_counts: null }],
  courseware_topics: [
    {
      id: null,
      name: 'Week 1',
      children: [{ id: 'w1', name: 'Lesson 1', children: [], thread_counts: null }],
      thread_counts: null,
    },
  ],
};

const renderPage = () => render(<CourseDiscussions courseId="c" />);
const navLink = (name: string) => screen.getByRole('link', { name });

describe('CourseDiscussions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.search = '';
    hooks.config.mockReturnValue({ data: config(), isLoading: false });
    hooks.topics.mockReturnValue({ data: topics, isLoading: false });
  });

  it('shows the four views and the posts list by default', () => {
    renderPage();
    expect(hooks.config).toHaveBeenCalledWith({ courseId: 'c' });
    ['All posts', 'My posts', 'Topics', 'Learners'].forEach((name) =>
      expect(navLink(name)).toBeInTheDocument(),
    );
    expect(navLink('All posts')).toHaveAttribute('aria-current', 'page');
    expect(navLink('My posts')).toHaveAttribute('href', '/c/discussion?view=my-posts');
    expect(captured.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        courseId: 'c',
        topicId: undefined,
        author: undefined,
        heading: undefined,
        canModerate: true,
        postingEnabled: true,
      }),
    );
    expect(screen.queryByTestId('thread-view')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'select' }));
    expect(nav.push).toHaveBeenCalledWith('/c/discussion?thread=t9');
  });

  it('hides learners when the course turns them off, and explains unavailable discussions', () => {
    hooks.config.mockReturnValue({
      data: config({ learners_tab_enabled: false }),
      isLoading: false,
    });
    const { unmount } = renderPage();
    expect(screen.queryByRole('link', { name: 'Learners' })).not.toBeInTheDocument();
    unmount();
    hooks.config.mockReturnValue({ data: undefined, isLoading: false, error: new Error('403') });
    const errored = renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Discussions aren't available for this course. 403",
    );
    errored.unmount();
    hooks.config.mockReturnValue({ data: config({ show_discussions: false }), isLoading: false });
    renderPage();
    expect(screen.getByText('Discussions are turned off for this course.')).toBeInTheDocument();
  });

  it('narrows my posts to the signed-in user', () => {
    nav.search = 'view=my-posts';
    renderPage();
    expect(navLink('My posts')).toHaveAttribute('aria-current', 'page');
    expect(captured.list).toHaveBeenLastCalledWith(expect.objectContaining({ author: 'me' }));
  });

  it('shows a topic’s posts with a heading that goes back to the topics', () => {
    nav.search = 'view=topics&topic=w1';
    renderPage();
    expect(screen.queryByTestId('topics-view')).not.toBeInTheDocument();
    const props = captured.list.mock.calls.at(-1)![0];
    expect(props.topicId).toBe('w1');
    expect(props.heading.title).toBe('Lesson 1');
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(nav.push).toHaveBeenCalledWith('/c/discussion?view=topics');
  });

  it('falls back to a generic topic title and goes back to all posts from a posts-view topic', () => {
    nav.search = 'topic=unknown';
    renderPage();
    expect(captured.list.mock.calls.at(-1)![0].heading.title).toBe('Topic');
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(nav.push).toHaveBeenCalledWith('/c/discussion');
  });

  it('renders the topics and learners views and navigates from them', () => {
    nav.search = 'view=topics';
    const { unmount } = renderPage();
    fireEvent.click(screen.getByTestId('topics-view'));
    expect(nav.push).toHaveBeenCalledWith('/c/discussion?view=topics&topic=w1');
    unmount();
    nav.search = 'view=learners';
    renderPage();
    expect(captured.learners).toHaveBeenLastCalledWith(
      expect.objectContaining({ canModerate: true }),
    );
    fireEvent.click(screen.getByTestId('learners-view'));
    expect(nav.push).toHaveBeenCalledWith('/c/discussion?view=learners&learner=ada');
  });

  it('shows a learner’s posts with a heading that goes back to the learners', () => {
    nav.search = 'view=learners&learner=ada';
    renderPage();
    const props = captured.list.mock.calls.at(-1)![0];
    expect(props.author).toBe('ada');
    expect(props.heading).toMatchObject({ title: 'Posts by learner', subtitle: 'ada' });
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(nav.push).toHaveBeenCalledWith('/c/discussion?view=learners');
  });

  it('opens a thread beside the list and navigates from it', () => {
    nav.search = 'thread=t1&topic=course';
    renderPage();
    expect(captured.thread).toHaveBeenLastCalledWith(
      expect.objectContaining({ threadId: 't1', courseId: 'c' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'thread-back' }));
    expect(nav.push).toHaveBeenLastCalledWith('/c/discussion?topic=course');
    fireEvent.click(screen.getByRole('button', { name: 'thread-deleted' }));
    expect(nav.push).toHaveBeenLastCalledWith('/c/discussion?topic=course');
    fireEvent.click(screen.getByRole('button', { name: 'thread-topic' }));
    expect(nav.push).toHaveBeenLastCalledWith('/c/discussion?topic=w1');
  });

  it('composes a post from any view and opens it once saved', () => {
    nav.search = 'view=learners&learner=ada';
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('post-form')).toBeInTheDocument();
    expect(screen.queryByTestId('posts-list')).not.toBeInTheDocument();
    expect(navLink('Learners')).not.toHaveAttribute('aria-current');
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(screen.queryByTestId('post-form')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    fireEvent.click(screen.getByRole('button', { name: 'saved' }));
    expect(nav.push).toHaveBeenLastCalledWith('/c/discussion?thread=new');
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    fireEvent.click(navLink('All posts'));
    expect(screen.queryByTestId('post-form')).not.toBeInTheDocument();
  });

  it('keeps the topic when a post is composed inside it', () => {
    nav.search = 'view=topics&topic=w1';
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(captured.form).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultTopicId: 'w1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'saved' }));
    expect(nav.push).toHaveBeenLastCalledWith('/c/discussion?view=topics&topic=w1&thread=new');
  });
});
