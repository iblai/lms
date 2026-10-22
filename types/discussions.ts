/**
 * Shapes of the Open edX discussion REST API (`/api/discussion/v1/`) behind
 * the native Discussions tab (`services/discussions.ts`).
 */

export type ThreadType = 'discussion' | 'question';

export type ThreadOrdering = 'last_activity_at' | 'comment_count' | 'vote_count';

/** Server-side thread views; the other status filters map to flags. */
export type ThreadView = 'unread' | 'unanswered' | 'unresponded';

export interface DiscussionReason {
  code: string;
  label: string;
}

export interface DiscussionConfig {
  id: string;
  is_posting_enabled: boolean;
  blackouts: Array<{ start: string; end: string }>;
  allow_anonymous: boolean;
  allow_anonymous_to_peers: boolean;
  user_roles: string[];
  has_moderation_privileges: boolean;
  is_group_ta: boolean;
  is_user_admin: boolean;
  is_course_staff: boolean;
  is_course_admin: boolean;
  provider: string;
  enable_in_context?: boolean;
  group_at_subsection?: boolean;
  edit_reasons?: DiscussionReason[];
  post_close_reasons?: DiscussionReason[];
  show_discussions?: boolean;
  /** Absent on older releases, where the Learners view is always on. */
  learners_tab_enabled?: boolean;
  reason_codes_enabled?: boolean;
  is_email_verified?: boolean;
}

export interface ThreadCounts {
  discussion: number;
  question: number;
}

export interface DiscussionTopic {
  /** `null` for a courseware section, which only groups its subsections. */
  id: string | null;
  name: string;
  thread_list_url?: string;
  children: DiscussionTopic[];
  thread_counts: ThreadCounts | null;
}

export interface CourseTopicsResponse {
  courseware_topics: DiscussionTopic[];
  non_courseware_topics: DiscussionTopic[];
}

export interface DiscussionUserProfile {
  profile?: {
    image?: {
      has_image?: boolean;
      image_url_full?: string;
      image_url_large?: string;
      image_url_medium?: string;
      image_url_small?: string;
    };
  };
}

/** Keyed by username; present when `requested_fields=profile_image` was asked for. */
export type DiscussionUsers = Record<string, DiscussionUserProfile>;

export interface DiscussionPagination {
  count: number;
  num_pages: number;
  next: string | null;
  previous: string | null;
}

export interface DiscussionEdit {
  reason?: string | null;
  reason_code?: string | null;
  editor_username?: string;
  created_at?: string;
}

export interface DiscussionThread {
  id: string;
  course_id: string;
  topic_id: string;
  /** `null` when the post is anonymous to this viewer. */
  author: string | null;
  /** "Staff", "Moderator", "Community TA", … or `null` for learners. */
  author_label: string | null;
  created_at: string;
  updated_at: string;
  type: ThreadType;
  title: string;
  raw_body: string;
  rendered_body: string;
  preview_body?: string;
  abuse_flagged: boolean;
  abuse_flagged_count?: number | null;
  voted: boolean;
  vote_count: number;
  /** Fields this viewer may PATCH (title, raw_body, pinned, closed, …). */
  editable_fields: string[];
  can_delete?: boolean;
  anonymous?: boolean;
  anonymous_to_peers?: boolean;
  pinned: boolean;
  closed: boolean;
  close_reason?: string | null;
  close_reason_code?: string | null;
  closed_by?: string | null;
  closed_by_label?: string | null;
  following: boolean;
  comment_count: number;
  unread_comment_count: number;
  response_count?: number;
  read: boolean;
  has_endorsed: boolean;
  last_edit?: DiscussionEdit | null;
  edit_by_label?: string | null;
  group_id?: number | null;
  group_name?: string | null;
  users?: DiscussionUsers;
}

export interface DiscussionComment {
  id: string;
  thread_id: string;
  parent_id: string | null;
  author: string | null;
  author_label: string | null;
  created_at: string;
  updated_at: string;
  raw_body: string;
  rendered_body: string;
  endorsed: boolean;
  endorsed_by?: string | null;
  endorsed_by_label?: string | null;
  endorsed_at?: string | null;
  abuse_flagged: boolean;
  abuse_flagged_any_user?: boolean | null;
  voted: boolean;
  vote_count: number;
  editable_fields: string[];
  can_delete?: boolean;
  anonymous?: boolean;
  anonymous_to_peers?: boolean;
  /** Replies nested under this response, when the API inlines them. */
  children?: DiscussionComment[];
  child_count: number;
  last_edit?: DiscussionEdit | null;
  edit_by_label?: string | null;
  users?: DiscussionUsers;
}

export interface ThreadsPage {
  results: DiscussionThread[];
  pagination: DiscussionPagination;
  text_search_rewrite?: string | null;
  users?: DiscussionUsers;
}

export interface CommentsPage {
  results: DiscussionComment[];
  pagination: DiscussionPagination;
  users?: DiscussionUsers;
}

export interface ThreadsQuery {
  courseId: string;
  page?: number;
  pageSize?: number;
  topicId?: string;
  textSearch?: string;
  threadType?: ThreadType;
  orderBy?: ThreadOrdering;
  view?: ThreadView;
  following?: boolean;
  author?: string;
  flagged?: boolean;
  countFlagged?: boolean;
}

export interface NewThread {
  courseId: string;
  topicId: string;
  type: ThreadType;
  title: string;
  rawBody: string;
  following?: boolean;
  anonymous?: boolean;
  anonymousToPeers?: boolean;
}

/** Everything a thread PATCH may carry; only the given keys are sent. */
export interface ThreadPatch {
  topic_id?: string;
  type?: ThreadType;
  title?: string;
  raw_body?: string;
  following?: boolean;
  voted?: boolean;
  abuse_flagged?: boolean;
  read?: boolean;
  pinned?: boolean;
  closed?: boolean;
  edit_reason_code?: string;
  close_reason_code?: string;
}

export interface CommentPatch {
  raw_body?: string;
  voted?: boolean;
  abuse_flagged?: boolean;
  endorsed?: boolean;
  edit_reason_code?: string;
}

export type LearnersOrdering = 'activity' | 'recency' | 'flagged';

export interface LearnerActivity {
  username: string;
  threads: number;
  responses: number;
  replies: number;
  active_flags?: number | null;
  inactive_flags?: number | null;
}

export interface LearnersPage {
  results: LearnerActivity[];
  pagination: DiscussionPagination;
}
