import { describe, it, expect } from 'vitest';
import type { CourseTopicsResponse, DiscussionConfig } from '@/types/discussions';
import {
  avatarOf,
  canModerate,
  countsLabel,
  locationQuery,
  parseLocation,
  relativeTime,
  statusQuery,
  topicNameOf,
  topicOptions,
} from '../discussion-utils';

describe('location in the query string', () => {
  it('parses the view and ids, defaulting to all posts', () => {
    expect(parseLocation(null)).toEqual({ view: 'posts' });
    expect(parseLocation(new URLSearchParams('view=bogus&topic=&thread=t1'))).toEqual({
      view: 'posts',
      thread: 't1',
    });
    expect(parseLocation(new URLSearchParams('view=learners&learner=ada&topic=course'))).toEqual({
      view: 'learners',
      learner: 'ada',
      topic: 'course',
    });
  });

  it('serialises back, leaving the default view out', () => {
    expect(locationQuery({ view: 'posts' })).toBe('');
    expect(locationQuery({ view: 'my-posts', thread: 't1' })).toBe('?view=my-posts&thread=t1');
    expect(locationQuery({ view: 'topics', topic: 'a b', learner: 'ada' })).toBe(
      '?view=topics&topic=a+b&learner=ada',
    );
  });
});

describe('statusQuery', () => {
  it('maps each status filter onto the API', () => {
    expect(statusQuery('all')).toEqual({});
    expect(statusQuery('unread')).toEqual({ view: 'unread' });
    expect(statusQuery('unanswered')).toEqual({ view: 'unanswered' });
    expect(statusQuery('unresponded')).toEqual({ view: 'unresponded' });
    expect(statusQuery('following')).toEqual({ following: true });
    expect(statusQuery('reported')).toEqual({ flagged: true });
  });
});

describe('relativeTime', () => {
  it('describes a time relative to now and copes with bad input', () => {
    const now = new Date('2026-06-10T12:00:00Z');
    expect(relativeTime('2026-06-10T11:00:00Z', now)).toBe('1 hour ago');
    expect(relativeTime('2026-06-12T12:00:00Z', now)).toBe('in 2 days');
    expect(relativeTime('garbage', now)).toBe('');
    expect(relativeTime(null, now)).toBe('');
  });
});

describe('canModerate', () => {
  const config = (overrides: Partial<DiscussionConfig>): DiscussionConfig =>
    ({
      has_moderation_privileges: false,
      is_group_ta: false,
      is_user_admin: false,
      is_course_admin: false,
      is_course_staff: false,
      ...overrides,
    }) as DiscussionConfig;

  it('is true for any staff-like flag and false otherwise', () => {
    expect(canModerate(undefined)).toBe(false);
    expect(canModerate(config({}))).toBe(false);
    expect(canModerate(config({ has_moderation_privileges: true }))).toBe(true);
    expect(canModerate(config({ is_group_ta: true }))).toBe(true);
    expect(canModerate(config({ is_user_admin: true }))).toBe(true);
    expect(canModerate(config({ is_course_admin: true }))).toBe(true);
    expect(canModerate(config({ is_course_staff: true }))).toBe(true);
  });
});

describe('topics', () => {
  const topics: CourseTopicsResponse = {
    non_courseware_topics: [
      {
        id: 'course',
        name: 'General',
        children: [],
        thread_counts: { discussion: 2, question: 1 },
      },
      {
        id: null,
        name: 'Grouped',
        children: [{ id: 'g1', name: 'Inside group', children: [], thread_counts: null }],
        thread_counts: null,
      },
    ],
    courseware_topics: [
      {
        id: null,
        name: 'Week 1',
        children: [
          {
            id: 'w1a',
            name: 'Lesson A',
            children: [],
            thread_counts: { discussion: 0, question: 0 },
          },
          { id: null, name: 'No id', children: [], thread_counts: null },
        ],
        thread_counts: null,
      },
      {
        id: 'w2',
        name: 'Week 2 topic',
        children: [],
        thread_counts: { discussion: 1, question: 1 },
      },
    ],
  };

  it('flattens postable topics under their groups', () => {
    expect(topicOptions(topics).map((option) => [option.id, option.group])).toEqual([
      ['course', 'General'],
      ['g1', 'Grouped'],
      ['w1a', 'Week 1'],
      ['w2', 'Course'],
    ]);
    expect(topicOptions(undefined)).toEqual([]);
    expect(topicOptions({} as CourseTopicsResponse)).toEqual([]);
  });

  it('looks names up and labels counts', () => {
    expect(topicNameOf(topics, 'w1a')).toBe('Lesson A');
    expect(topicNameOf(topics, 'nope')).toBeUndefined();
    expect(countsLabel({ discussion: 2, question: 1 })).toBe('2 discussions · 1 question');
    expect(countsLabel({ discussion: 1, question: 0 })).toBe('1 discussion · 0 questions');
    expect(countsLabel(null)).toBe('0 discussions · 0 questions');
  });
});

describe('avatarOf', () => {
  it('reads the small profile image when it is there', () => {
    const users = { ada: { profile: { image: { image_url_small: 'https://img/ada.png' } } } };
    expect(avatarOf(users, 'ada')).toBe('https://img/ada.png');
    expect(avatarOf(users, 'bob')).toBeNull();
    expect(avatarOf(users, null)).toBeNull();
    expect(avatarOf(undefined, 'ada')).toBeNull();
  });
});
