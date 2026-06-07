import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LearningInfoTab } from '../learning-info-tab';
import '@testing-library/jest-dom';

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

import { vi } from 'vitest';

const renderTab = (course: any) => render(<LearningInfoTab course={course} />);

describe('LearningInfoTab', () => {
  it('renders the heading', () => {
    renderTab({});
    expect(screen.getByText("What You'll Learn")).toBeInTheDocument();
  });

  it('shows empty state when learning_info is undefined', () => {
    renderTab({});
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No learning info available.')).toBeInTheDocument();
  });

  it('shows empty state when learning_info is null', () => {
    renderTab({ learning_info: null });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('shows empty state when learning_info is empty array', () => {
    renderTab({ learning_info: [] });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('renders learning info items', () => {
    renderTab({ learning_info: ['Item one', 'Item two', 'Item three'] });
    expect(screen.getByText('Item one')).toBeInTheDocument();
    expect(screen.getByText('Item two')).toBeInTheDocument();
    expect(screen.getByText('Item three')).toBeInTheDocument();
  });

  it('does not show empty state when items are present', () => {
    renderTab({ learning_info: ['Item one'] });
    expect(screen.queryByTestId('empty-box')).not.toBeInTheDocument();
  });

  it('renders the correct number of items', () => {
    const items = ['A', 'B', 'C', 'D'];
    const { container } = renderTab({ learning_info: items });
    // Each item is in a flex container with a CheckCircle icon
    const itemElements = container.querySelectorAll('p');
    expect(itemElements.length).toBe(items.length);
  });

  it('renders without crashing with a single item', () => {
    renderTab({ learning_info: ['Only one item'] });
    expect(screen.getByText('Only one item')).toBeInTheDocument();
  });
});
