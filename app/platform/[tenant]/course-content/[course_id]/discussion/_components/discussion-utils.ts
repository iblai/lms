import { formatDistanceStrict } from 'date-fns';
import type {
  CourseTopicsResponse,
  DiscussionConfig,
  DiscussionUsers,
  ThreadCounts,
  ThreadType,
  ThreadView,
} from '@/types/discussions';

export type DiscussionView = 'posts' | 'my-posts' | 'topics' | 'learners';
export type PostStatusFilter =
  | 'all'
  | 'unread'
  | 'following'
  | 'reported'
  | 'unanswered'
  | 'unresponded';
export type PostTypeFilter = 'all' | ThreadType;

/** Where the tab is, kept in the query string so posts can be linked to. */
export interface DiscussionLocation {
  view: DiscussionView;
  topic?: string;
  thread?: string;
  learner?: string;
}

export const parseLocation = (params: URLSearchParams | null): DiscussionLocation => {
  const view = params?.get('view');
  return {
    view: view === 'my-posts' || view === 'topics' || view === 'learners' ? view : 'posts',
    topic: params?.get('topic') || undefined,
    thread: params?.get('thread') || undefined,
    learner: params?.get('learner') || undefined,
  };
};

export const locationQuery = (location: DiscussionLocation) => {
  const params = new URLSearchParams();
  if (location.view !== 'posts') params.set('view', location.view);
  if (location.topic) params.set('topic', location.topic);
  if (location.learner) params.set('learner', location.learner);
  if (location.thread) params.set('thread', location.thread);
  const query = params.toString();
  return query ? `?${query}` : '';
};

/** How each status filter reaches the threads API. */
export const statusQuery = (
  status: PostStatusFilter,
): { view?: ThreadView; following?: boolean; flagged?: boolean } => {
  switch (status) {
    case 'unread':
    case 'unanswered':
    case 'unresponded':
      return { view: status };
    case 'following':
      return { following: true };
    case 'reported':
      return { flagged: true };
    default:
      return {};
  }
};

export const relativeTime = (iso: string | null | undefined, now = new Date()) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceStrict(date, now, { addSuffix: true });
};

/** Staff-like roles that unlock the reported-posts filter and learner flags. */
export const canModerate = (config: DiscussionConfig | undefined) =>
  !!config &&
  (config.has_moderation_privileges ||
    config.is_group_ta ||
    config.is_user_admin ||
    config.is_course_admin ||
    config.is_course_staff);

export interface TopicOption {
  id: string;
  name: string;
  /** Section name for courseware topics, "General" for course-wide ones. */
  group: string;
  counts: ThreadCounts | null;
}

/** Every postable topic, course-wide ones first, each under its section. */
export const topicOptions = (topics: CourseTopicsResponse | undefined): TopicOption[] => {
  if (!topics) return [];
  const flatten = (list: CourseTopicsResponse['courseware_topics'], group: string) =>
    list.flatMap((topic) =>
      topic.id
        ? [{ id: topic.id, name: topic.name, group, counts: topic.thread_counts }]
        : topic.children.flatMap((child) =>
            child.id
              ? [{ id: child.id, name: child.name, group: topic.name, counts: child.thread_counts }]
              : [],
          ),
    );
  return [
    ...flatten(topics.non_courseware_topics ?? [], 'General'),
    ...flatten(topics.courseware_topics ?? [], 'Course'),
  ];
};

export const topicNameOf = (
  topics: CourseTopicsResponse | undefined,
  topicId: string | undefined,
) => topicOptions(topics).find((topic) => topic.id === topicId)?.name;

export const countsLabel = (counts: ThreadCounts | null | undefined) => {
  const discussions = counts?.discussion ?? 0;
  const questions = counts?.question ?? 0;
  return `${discussions} discussion${discussions === 1 ? '' : 's'} · ${questions} question${questions === 1 ? '' : 's'}`;
};

export const avatarOf = (users: DiscussionUsers | undefined, username: string | null | undefined) =>
  (username && users?.[username]?.profile?.image?.image_url_small) || null;
