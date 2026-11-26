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

  it.each(['<p>&nbsp;</p>', '<p><br></p>', '<section><p> &#160; </p></section>', '<p>\u00a0</p>'])(
    'does not render Course Overview when the HTML overview has no visible content: %s',
    (overview) => {
      renderTab({ description: 'Desc', overview });
      expect(screen.queryByText('Course Overview')).not.toBeInTheDocument();
    },
  );

  it('renders Course Overview when the HTML overview is only an image', () => {
    renderTab({ description: 'Desc', overview: '<p><img src="/banner.png" alt="" /></p>' });
    expect(screen.getByText('Course Overview')).toBeInTheDocument();
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
    renderTab({
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

  it('keeps ordered and unordered lists in the HTML overview and styles their markers', () => {
    const { container } = renderTab({
      description: 'Desc',
      overview:
        '<section class="about"><h2>What you will be able to do</h2><ol><li>First</li><li>Second</li></ol><ul><li>Bullet</li></ul></section>',
    });
    const overviewDiv = container.querySelector('.course-overview-content');
    expect(overviewDiv?.querySelectorAll('ol > li')).toHaveLength(2);
    expect(overviewDiv?.querySelectorAll('ul > li')).toHaveLength(1);
    expect(overviewDiv).toHaveClass('[&_ol]:list-decimal', '[&_ul]:list-disc');
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

  it.each([
    ['missing', {}],
    ['empty', { description: '' }],
    ['whitespace only', { description: '   ' }],
  ])('does not render Course Description when description is %s', (_label, course) => {
    renderTab(course);
    expect(screen.queryByText('Course Description')).not.toBeInTheDocument();
  });

  it('renders no cards when description and overview are both empty', () => {
    const { container } = renderTab({ description: '', overview: '' });
    expect(container.querySelectorAll('h2')).toHaveLength(0);
  });
});
