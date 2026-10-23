import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { CourseTopicsResponse } from '@/types/discussions';
import { TopicsView } from '../topics-view';

const topics: CourseTopicsResponse = {
  non_courseware_topics: [
    { id: 'course', name: 'General', children: [], thread_counts: { discussion: 2, question: 1 } },
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
        { id: 'w1b', name: 'Lesson B', children: [], thread_counts: null },
      ],
      thread_counts: null,
    },
    { id: 'w2', name: 'Week 2', children: [], thread_counts: { discussion: 1, question: 0 } },
  ],
};

describe('TopicsView', () => {
  it('lists general topics and each section with its subsections, opening a topic on click', () => {
    const onSelect = vi.fn();
    render(<TopicsView topics={topics} isLoading={false} onSelectTopic={onSelect} />);
    const general = screen.getByRole('region', { name: 'General' });
    expect(within(general).getByTestId('topic-row')).toHaveTextContent(
      '2 discussions · 1 question',
    );
    const week1 = screen.getByRole('region', { name: 'Week 1' });
    expect(within(week1).getAllByTestId('topic-row')).toHaveLength(2);
    const week2 = screen.getByRole('region', { name: 'Week 2' });
    expect(within(week2).getAllByTestId('topic-row')).toHaveLength(1);
    fireEvent.click(within(week1).getByRole('button', { name: /Lesson B/ }));
    expect(onSelect).toHaveBeenCalledWith('w1b');
  });

  it('filters by name across sections and shows the empty state', () => {
    render(<TopicsView topics={topics} isLoading={false} onSelectTopic={vi.fn()} />);
    const search = screen.getByRole('textbox', { name: 'Find a topic' });
    fireEvent.change(search, { target: { value: 'lesson a' } });
    expect(screen.queryByRole('region', { name: 'General' })).not.toBeInTheDocument();
    expect(screen.getAllByTestId('topic-row')).toHaveLength(1);
    fireEvent.change(search, { target: { value: 'week' } });
    expect(screen.getAllByTestId('topic-row')).toHaveLength(3);
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByTestId('topics-empty')).toBeInTheDocument();
  });

  it('shows the loading and error states', () => {
    const { unmount } = render(<TopicsView topics={undefined} isLoading onSelectTopic={vi.fn()} />);
    expect(screen.getByText('Loading topics…')).toBeInTheDocument();
    unmount();
    render(
      <TopicsView
        topics={undefined}
        isLoading={false}
        error={new Error('boom')}
        onSelectTopic={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the topics. boom");
  });
});
