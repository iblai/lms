import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutTab } from '../about-tab';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  DEFAULT_OVERVIEW_PLACEHOLDER:
    '<section class="about">About This Course Requirements Course Staff Frequently Asked Questions</section>',
}));

const renderTab = (course: any) => render(<AboutTab course={course} />);

describe('AboutTab', () => {
  it('renders the Course Description heading', () => {
    renderTab({ description: 'A test course' });
    expect(screen.getByText('Course Description')).toBeInTheDocument();
  });

  it('renders the course description text', () => {
    renderTab({ description: 'Learn about testing.' });
    expect(screen.getByText('Learn about testing.')).toBeInTheDocument();
  });

  it('does not render Course Overview when overview is undefined', () => {
    renderTab({ description: 'Desc' });
    expect(screen.queryByText('Course Overview')).not.toBeInTheDocument();
  });

  it('does not render Course Overview when overview is empty string', () => {
    renderTab({ description: 'Desc', overview: '' });
    expect(screen.queryByText('Course Overview')).not.toBeInTheDocument();
  });

  it('does not render Course Overview when overview is whitespace only', () => {
    renderTab({ description: 'Desc', overview: '   ' });
    expect(screen.queryByText('Course Overview')).not.toBeInTheDocument();
  });

  it('does not render Course Overview when overview matches the default placeholder', () => {
    renderTab({
      description: 'Desc',
      overview:
        '<section class="about">About This Course Requirements Course Staff Frequently Asked Questions</section>',
    });
    expect(screen.queryByText('Course Overview')).not.toBeInTheDocument();
  });

  it('renders Course Overview when overview is valid plain text', () => {
    renderTab({ description: 'Desc', overview: 'This is a great course overview.' });
    expect(screen.getByText('Course Overview')).toBeInTheDocument();
    expect(screen.getByText('This is a great course overview.')).toBeInTheDocument();
  });

  it('renders plain text overview in a <p> tag (not dangerouslySetInnerHTML)', () => {
    const { container } = renderTab({
      description: 'Desc',
      overview: 'Plain text overview content',
    });
    // The plain text path renders a <p>, not a div with dangerouslySetInnerHTML
    const overviewParagraph = screen.getByText('Plain text overview content');
    expect(overviewParagraph.tagName).toBe('P');
  });

  it('renders HTML overview using dangerouslySetInnerHTML', () => {
    const { container } = renderTab({
      description: 'Desc',
      overview: '<p>HTML overview <strong>bold</strong></p>',
    });
    expect(screen.getByText('Course Overview')).toBeInTheDocument();
    // The HTML content should be rendered inside a div with the course-overview-content class
    const overviewDiv = container.querySelector('.course-overview-content');
    expect(overviewDiv).toBeInTheDocument();
    expect(overviewDiv?.innerHTML).toContain('<strong>bold</strong>');
  });

  it('handles overview with only HTML tags (valid HTML content)', () => {
    const { container } = renderTab({
      description: 'Desc',
      overview: '<div>Some content</div>',
    });
    expect(screen.getByText('Course Overview')).toBeInTheDocument();
    const overviewDiv = container.querySelector('.course-overview-content');
    expect(overviewDiv).toBeInTheDocument();
  });

  it('renders without crashing when course has no properties', () => {
    const { container } = renderTab({});
    expect(container).toBeTruthy();
    expect(screen.getByText('Course Description')).toBeInTheDocument();
  });
});
