'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateThreadMutation, useUpdateThreadMutation } from '@/services/discussions';
import type {
  CourseTopicsResponse,
  DiscussionConfig,
  DiscussionThread,
  ThreadType,
} from '@/types/discussions';
import { topicOptions } from './discussion-utils';

// The theme leaves the checkbox's checked state almost invisible; make it the accent.
const CHECKBOX_CLASSES =
  'border-gray-300 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white';

type Props = {
  courseId: string;
  config: DiscussionConfig | undefined;
  topics: CourseTopicsResponse | undefined;
  onCancel: () => void;
} & (
  | { mode: 'create'; defaultTopicId?: string; onSaved: (thread: DiscussionThread) => void }
  | { mode: 'edit'; thread: DiscussionThread; onSaved: (thread: DiscussionThread) => void }
);

/** The add-a-post form, also used to edit an existing post. */
export function PostForm(props: Props) {
  const { courseId, config, topics, onCancel, mode } = props;
  const existing = mode === 'edit' ? props.thread : undefined;
  const options = useMemo(() => topicOptions(topics), [topics]);
  const groups = useMemo(
    () =>
      options.reduce<Array<{ group: string; options: typeof options }>>((acc, option) => {
        const last = acc[acc.length - 1];
        if (last && last.group === option.group) last.options.push(option);
        else acc.push({ group: option.group, options: [option] });
        return acc;
      }, []),
    [options],
  );
  const [type, setType] = useState<ThreadType>(existing?.type ?? 'discussion');
  const [topicId, setTopicId] = useState(
    existing?.topic_id ??
      (mode === 'create' && props.defaultTopicId ? props.defaultTopicId : (options[0]?.id ?? '')),
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.raw_body ?? '');
  const [following, setFollowing] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [reason, setReason] = useState('');
  const [createThread, { isLoading: creating }] = useCreateThreadMutation();
  const [updateThread, { isLoading: updating }] = useUpdateThreadMutation();

  const resolvedTopic = topicId || options[0]?.id || '';
  const valid = title.trim().length > 0 && body.trim().length > 0 && resolvedTopic.length > 0;
  const busy = creating || updating;
  // Editing someone else's post asks for a reason when the course defines them.
  const editReasons =
    mode === 'edit' && existing?.editable_fields.includes('edit_reason_code')
      ? (config?.edit_reasons ?? [])
      : [];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    try {
      if (mode === 'create') {
        const thread = await createThread({
          courseId,
          topicId: resolvedTopic,
          type,
          title: title.trim(),
          rawBody: body.trim(),
          following,
          anonymous: config?.allow_anonymous ? anonymous : false,
        }).unwrap();
        toast.success('Your post has been published');
        props.onSaved(thread);
      } else {
        const thread = await updateThread({
          threadId: props.thread.id,
          patch: {
            title: title.trim(),
            raw_body: body.trim(),
            ...(props.thread.editable_fields.includes('topic_id')
              ? { topic_id: resolvedTopic }
              : {}),
            ...(props.thread.editable_fields.includes('type') ? { type } : {}),
            ...(reason ? { edit_reason_code: reason } : {}),
          },
        }).unwrap();
        toast.success('Your post has been updated');
        props.onSaved(thread);
      }
    } catch (error) {
      toast.error((error as Error).message || 'The post could not be saved');
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
      data-testid="post-form"
      aria-labelledby="post-form-title"
    >
      <h3 id="post-form-title" className="text-base font-semibold text-gray-900">
        {mode === 'create' ? 'Add a post' : 'Edit post'}
      </h3>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-gray-600">Post type</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Post type">
          {(['discussion', 'question'] as const).map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                type === option
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="post-type"
                value={option}
                checked={type === option}
                onChange={() => setType(option)}
                className="accent-amber-500"
              />
              <span>
                <span className="font-medium">
                  {option === 'discussion' ? 'Discussion' : 'Question'}
                </span>
                <span className="block text-xs text-gray-500">
                  {option === 'discussion'
                    ? 'Share ideas and start a conversation'
                    : 'Ask something and get an answer'}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="post-topic">Topic area</Label>
          <NativeSelect
            id="post-topic"
            className="w-full"
            value={resolvedTopic}
            onChange={(event) => setTopicId(event.target.value)}
            disabled={mode === 'edit' && !props.thread.editable_fields.includes('topic_id')}
            aria-label="Topic area"
          >
            {groups.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="post-title">Post title</Label>
          <Input
            id="post-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your post a title"
            maxLength={200}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="post-body">Post content</Label>
        <Textarea
          id="post-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your post. Markdown is supported."
          rows={6}
          required
        />
      </div>

      {mode === 'create' && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={following}
              onCheckedChange={(checked) => setFollowing(checked === true)}
              aria-label="Follow this post"
              className={CHECKBOX_CLASSES}
            />
            Follow this post
          </label>
          {config?.allow_anonymous && (
            <label className="flex items-center gap-2">
              <Checkbox
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked === true)}
                aria-label="Post anonymously"
                className={CHECKBOX_CLASSES}
              />
              Post anonymously
            </label>
          )}
        </div>
      )}
      {editReasons.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="post-edit-reason">Reason for editing</Label>
          <NativeSelect
            id="post-edit-reason"
            className="w-full sm:w-72"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            <option value="">No reason given</option>
            {editReasons.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-amber-500 text-white hover:bg-amber-600"
          disabled={!valid || busy}
        >
          {busy ? 'Saving…' : mode === 'create' ? 'Submit' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
