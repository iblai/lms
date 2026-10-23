'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FolderTree, MessagesSquare, UserRound, Users, type LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { getUserName } from '@/utils/helpers';
import { useGetCourseTopicsQuery, useGetDiscussionConfigQuery } from '@/services/discussions';
import {
  type DiscussionLocation,
  type DiscussionView,
  canModerate,
  locationQuery,
  parseLocation,
  topicNameOf,
} from './discussion-utils';
import { LearnersView } from './learners-view';
import { PostForm } from './post-form';
import { PostsList } from './posts-list';
import { ThreadView } from './thread-view';
import { TopicsView } from './topics-view';

const VIEWS: Array<{ key: DiscussionView; label: string; icon: ComponentType<LucideProps> }> = [
  { key: 'posts', label: 'All posts', icon: MessagesSquare },
  { key: 'my-posts', label: 'My posts', icon: UserRound },
  { key: 'topics', label: 'Topics', icon: FolderTree },
  { key: 'learners', label: 'Learners', icon: Users },
];

export function CourseDiscussions({ courseId }: { courseId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = parseLocation(searchParams);
  const navigate = (next: DiscussionLocation) => router.push(`${pathname}${locationQuery(next)}`);

  const {
    data: config,
    isLoading: configLoading,
    error: configError,
  } = useGetDiscussionConfigQuery({
    courseId,
  });
  const {
    data: topics,
    isLoading: topicsLoading,
    error: topicsError,
  } = useGetCourseTopicsQuery({
    courseId,
  });
  const [composing, setComposing] = useState(false);

  const me = getUserName() ?? undefined;
  const moderator = canModerate(config);
  const postingEnabled = config?.is_posting_enabled !== false;
  const learnersEnabled = config?.learners_tab_enabled !== false;
  const views = VIEWS.filter((view) => view.key !== 'learners' || learnersEnabled);

  if (configError) {
    return (
      <div className="px-3 py-4 md:px-4" data-testid="course-discussions">
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Discussions aren&apos;t available for this course. {(configError as Error).message}
        </p>
      </div>
    );
  }
  if (config && config.show_discussions === false) {
    return (
      <div className="px-3 py-4 md:px-4" data-testid="course-discussions">
        <p className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          Discussions are turned off for this course.
        </p>
      </div>
    );
  }

  const author = location.view === 'my-posts' ? me : location.learner;
  const heading =
    location.view === 'learners' && location.learner
      ? {
          title: 'Posts by learner',
          subtitle: location.learner,
          onBack: () => navigate({ view: 'learners' }),
        }
      : location.topic
        ? {
            title: topicNameOf(topics, location.topic) ?? 'Topic',
            subtitle: 'Posts in this topic',
            onBack: () => navigate({ view: location.view === 'topics' ? 'topics' : 'posts' }),
          }
        : undefined;
  const showsPosts =
    composing ||
    !(
      (location.view === 'topics' && !location.topic) ||
      (location.view === 'learners' && !location.learner)
    );

  let content: React.ReactNode;
  if (composing) {
    content = (
      <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        <div className="mx-auto max-w-3xl">
          <PostForm
            mode="create"
            courseId={courseId}
            config={config}
            topics={topics}
            defaultTopicId={location.topic}
            onCancel={() => setComposing(false)}
            onSaved={(thread) => {
              setComposing(false);
              navigate({
                ...location,
                view: location.view === 'learners' ? 'posts' : location.view,
                learner: undefined,
                thread: thread.id,
              });
            }}
          />
        </div>
      </div>
    );
  } else if (!showsPosts && location.view === 'topics') {
    content = (
      <TopicsView
        topics={topics}
        isLoading={topicsLoading}
        error={topicsError}
        onSelectTopic={(topicId) => navigate({ view: 'topics', topic: topicId })}
      />
    );
  } else if (!showsPosts) {
    content = (
      <LearnersView
        courseId={courseId}
        canModerate={moderator}
        onSelectLearner={(username) => navigate({ view: 'learners', learner: username })}
      />
    );
  } else {
    content = (
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            'flex min-h-0 flex-col',
            location.thread
              ? 'hidden md:flex md:w-80 md:border-r md:border-gray-200 lg:w-96'
              : 'flex-1',
          )}
        >
          <PostsList
            courseId={courseId}
            topicId={location.topic}
            author={author}
            heading={heading}
            selectedThreadId={location.thread}
            onSelect={(threadId) => navigate({ ...location, thread: threadId })}
            canModerate={moderator}
            postingEnabled={postingEnabled}
            onAddPost={() => setComposing(true)}
          />
        </div>
        {location.thread && (
          <div className="flex min-h-0 flex-1 flex-col">
            <ThreadView
              courseId={courseId}
              threadId={location.thread}
              config={config}
              topics={topics}
              onBack={() => navigate({ ...location, thread: undefined })}
              onDeleted={() => navigate({ ...location, thread: undefined })}
              onTopicClick={(topicId) => navigate({ view: 'posts', topic: topicId })}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row"
      data-testid="course-discussions"
      aria-busy={configLoading}
    >
      <nav
        aria-label="Discussion views"
        data-testid="discussion-nav"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-200 px-3 py-2 md:w-44 md:flex-col md:border-r md:border-b-0 md:py-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {views.map((view) => {
          const active = location.view === view.key && !composing;
          const Icon = view.icon;
          return (
            <Link
              key={view.key}
              href={`${pathname}${locationQuery({ view: view.key })}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => setComposing(false)}
              className={cn(
                'flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none',
                active
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', active ? 'text-amber-600' : 'text-gray-400')}
                aria-hidden
              />
              {view.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{content}</div>
    </div>
  );
}
