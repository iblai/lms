'use client';

import { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { CourseTopicsResponse, DiscussionTopic } from '@/types/discussions';
import { countsLabel } from './discussion-utils';

const matches = (topic: DiscussionTopic, filter: string) =>
  !filter || topic.name.toLowerCase().includes(filter);

const TopicButton = ({
  topic,
  onSelect,
  indent,
}: {
  topic: DiscussionTopic;
  onSelect: (topicId: string) => void;
  indent?: boolean;
}) => (
  <li>
    <button
      type="button"
      onClick={() => topic.id && onSelect(topic.id)}
      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-inset ${indent ? 'pl-7' : ''}`}
      data-testid="topic-row"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-900">{topic.name}</span>
        <span className="block text-xs text-gray-500">{countsLabel(topic.thread_counts)}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </button>
  </li>
);

/** Course-wide topics, then each section's subsections, each opening its posts. */
export function TopicsView({
  topics,
  isLoading,
  error,
  onSelectTopic,
}: {
  topics: CourseTopicsResponse | undefined;
  isLoading: boolean;
  error?: unknown;
  onSelectTopic: (topicId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filter = search.trim().toLowerCase();
  const general = (topics?.non_courseware_topics ?? []).filter((topic) => matches(topic, filter));
  const sections = (topics?.courseware_topics ?? [])
    .map((section) => ({
      ...section,
      children: section.children.filter(
        (child) => matches(child, filter) || matches(section, filter),
      ),
    }))
    .filter((section) => (section.id && matches(section, filter)) || section.children.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="topics-view">
      <div className="border-b border-gray-200 px-3 py-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a topic"
            aria-label="Find a topic"
            className="h-9 pl-8"
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <p
            role="alert"
            className="m-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            Couldn&apos;t load the topics. {(error as Error).message}
          </p>
        ) : isLoading ? (
          <p className="px-3 py-8 text-center text-sm text-gray-500">Loading topics…</p>
        ) : general.length === 0 && sections.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-gray-500" data-testid="topics-empty">
            No topics match.
          </p>
        ) : (
          <>
            {general.length > 0 && (
              <section aria-labelledby="topics-general">
                <h3
                  id="topics-general"
                  className="bg-gray-50 px-3 py-1.5 text-xs font-medium tracking-wide text-gray-500 uppercase"
                >
                  General
                </h3>
                <ul className="divide-y divide-gray-100">
                  {general.map((topic) => (
                    <TopicButton
                      key={topic.id ?? topic.name}
                      topic={topic}
                      onSelect={onSelectTopic}
                    />
                  ))}
                </ul>
              </section>
            )}
            {sections.map((section) => (
              <section key={section.id ?? section.name} aria-label={section.name}>
                <h3 className="bg-gray-50 px-3 py-1.5 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {section.name}
                </h3>
                <ul className="divide-y divide-gray-100">
                  {section.id && <TopicButton topic={section} onSelect={onSelectTopic} />}
                  {section.children.map((child) => (
                    <TopicButton
                      key={child.id ?? child.name}
                      topic={child}
                      onSelect={onSelectTopic}
                      indent
                    />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
