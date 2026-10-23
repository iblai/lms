import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { CourseTopicsResponse, DiscussionConfig, DiscussionThread } from '@/types/discussions';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mutations = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));
vi.mock('@/services/discussions', () => ({
  useCreateThreadMutation: () => [mutations.create, { isLoading: false }],
  useUpdateThreadMutation: () => [mutations.update, { isLoading: false }],
}));

import { toast } from 'sonner';
import { PostForm } from '../post-form';

const topics: CourseTopicsResponse = {
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
const config = {
  allow_anonymous: true,
  edit_reasons: [{ code: 'typo', label: 'Fix a typo' }],
} as DiscussionConfig;
const thread = {
  id: 't1',
  type: 'question',
  topic_id: 'w1',
  title: 'Old title',
  raw_body: 'Old body',
  editable_fields: ['title', 'raw_body', 'topic_id', 'type', 'edit_reason_code'],
} as DiscussionThread;

describe('PostForm (create)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a new post with the chosen type, topic and options', async () => {
    const onSaved = vi.fn();
    mutations.create.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'new' }) });
    render(
      <PostForm
        mode="create"
        courseId="c"
        config={config}
        topics={topics}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Add a post' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: /Question/ }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Topic area' }), {
      target: { value: 'w1' },
    });
    fireEvent.change(screen.getByLabelText('Post title'), { target: { value: '  Hello  ' } });
    fireEvent.change(screen.getByLabelText('Post content'), { target: { value: 'Body text ' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Follow this post' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Post anonymously' }));
    expect(submit).toBeEnabled();
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(mutations.create).toHaveBeenCalledWith({
      courseId: 'c',
      topicId: 'w1',
      type: 'question',
      title: 'Hello',
      rawBody: 'Body text',
      following: false,
      anonymous: true,
    });
    expect(toast.success).toHaveBeenCalledWith('Your post has been published');
    expect(onSaved).toHaveBeenCalledWith({ id: 'new' });
  });

  it('defaults to the first topic (or the one given) and ignores anonymity when it is off', async () => {
    mutations.create.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'new' }) });
    const { unmount } = render(
      <PostForm
        mode="create"
        courseId="c"
        config={{ allow_anonymous: false } as DiscussionConfig}
        topics={topics}
        defaultTopicId="w1"
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Topic area' })).toHaveValue('w1');
    expect(screen.queryByRole('checkbox', { name: 'Post anonymously' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Post title'), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText('Post content'), { target: { value: 'B' } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId('post-form'));
    });
    expect(mutations.create).toHaveBeenCalledWith(
      expect.objectContaining({ topicId: 'w1', following: true, anonymous: false }),
    );
    unmount();

    render(
      <PostForm
        mode="create"
        courseId="c"
        config={undefined}
        topics={topics}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Topic area' })).toHaveValue('course');
  });

  it('reports a failed submission and ignores submits while invalid', async () => {
    mutations.create.mockReturnValue({ unwrap: () => Promise.reject(new Error('nope')) });
    const onCancel = vi.fn();
    render(
      <PostForm
        mode="create"
        courseId="c"
        config={config}
        topics={topics}
        onCancel={onCancel}
        onSaved={vi.fn()}
      />,
    );
    await act(async () => {
      fireEvent.submit(screen.getByTestId('post-form'));
    });
    expect(mutations.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Post title'), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText('Post content'), { target: { value: 'B' } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId('post-form'));
    });
    expect(toast.error).toHaveBeenCalledWith('nope');
    mutations.create.mockReturnValue({ unwrap: () => Promise.reject({}) });
    await act(async () => {
      fireEvent.submit(screen.getByTestId('post-form'));
    });
    expect(toast.error).toHaveBeenCalledWith('The post could not be saved');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('copes with a course that has no topics yet', () => {
    render(
      <PostForm
        mode="create"
        courseId="c"
        config={config}
        topics={undefined}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Post title'), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText('Post content'), { target: { value: 'B' } });
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});

describe('PostForm (edit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills the post and patches the editable fields with a reason', async () => {
    const onSaved = vi.fn();
    mutations.update.mockReturnValue({ unwrap: () => Promise.resolve({ id: 't1' }) });
    render(
      <PostForm
        mode="edit"
        courseId="c"
        config={config}
        topics={topics}
        thread={thread}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();
    expect(screen.getByLabelText('Post title')).toHaveValue('Old title');
    expect(screen.getByLabelText('Post content')).toHaveValue('Old body');
    expect(screen.getByRole('radio', { name: /Question/ })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Follow this post' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Post title'), { target: { value: 'New title' } });
    fireEvent.change(screen.getByLabelText('Reason for editing'), { target: { value: 'typo' } });
    fireEvent.click(screen.getByRole('radio', { name: /Discussion/ }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Topic area' }), {
      target: { value: 'course' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    expect(mutations.update).toHaveBeenCalledWith({
      threadId: 't1',
      patch: {
        title: 'New title',
        raw_body: 'Old body',
        topic_id: 'course',
        type: 'discussion',
        edit_reason_code: 'typo',
      },
    });
    expect(toast.success).toHaveBeenCalledWith('Your post has been updated');
    expect(onSaved).toHaveBeenCalledWith({ id: 't1' });
  });

  it('leaves locked fields out of the patch and asks no reason when none apply', async () => {
    mutations.update.mockReturnValue({ unwrap: () => Promise.resolve({ id: 't1' }) });
    render(
      <PostForm
        mode="edit"
        courseId="c"
        config={config}
        topics={topics}
        thread={{ ...thread, editable_fields: ['title', 'raw_body'] }}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Topic area' })).toBeDisabled();
    expect(screen.queryByLabelText('Reason for editing')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    expect(mutations.update).toHaveBeenCalledWith({
      threadId: 't1',
      patch: { title: 'Old title', raw_body: 'Old body' },
    });
  });
});
