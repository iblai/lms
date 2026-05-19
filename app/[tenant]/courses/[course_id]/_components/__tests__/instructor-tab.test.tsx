import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstructorTab } from '../instructor-tab';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      studio: () => 'https://studio.example.com',
    },
  },
}));

const defaultProps = {
  course: {} as any,
  expandedSections: {} as Record<string, boolean>,
  toggleSection: vi.fn(),
};

const renderTab = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<InstructorTab {...defaultProps} {...overrides} />);

describe('InstructorTab', () => {
  it('renders the Instructors heading', () => {
    renderTab();
    expect(screen.getByText('Instructors')).toBeInTheDocument();
  });

  it('shows empty state when course has no instructor_info', () => {
    renderTab({ course: {} });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No instructor info available.')).toBeInTheDocument();
  });

  it('shows empty state when instructors array is empty', () => {
    renderTab({ course: { instructor_info: { instructors: [] } } });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('shows empty state when instructor_info is null', () => {
    renderTab({ course: { instructor_info: null } });
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('renders instructor names', () => {
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Dr. Smith', image: '', title: '', bio: '', organization: '' },
          { name: 'Prof. Jones', image: '', title: '', bio: '', organization: '' },
        ],
      },
    };
    renderTab({ course });
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Prof. Jones')).toBeInTheDocument();
  });

  it('renders "Unknown Instructor" when instructor name is empty', () => {
    const course = {
      instructor_info: {
        instructors: [{ name: '', image: '', title: '', bio: '', organization: '' }],
      },
    };
    renderTab({ course });
    // There will be one in the collapsed header
    expect(screen.getByText('Unknown Instructor')).toBeInTheDocument();
  });

  it('renders instructor image when image is provided', () => {
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Dr. Smith', image: '/img/smith.png', title: '', bio: '', organization: '' },
        ],
      },
    };
    renderTab({ course });
    const img = screen.getByAltText('Dr. Smith');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://studio.example.com/img/smith.png');
  });

  it('renders fallback avatar when instructor has no image', () => {
    const course = {
      instructor_info: {
        instructors: [{ name: 'Dr. Smith', image: '', title: '', bio: '', organization: '' }],
      },
    };
    const { container } = renderTab({ course });
    // Should render the User icon fallback (an SVG)
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(0);
  });

  it('renders instructor title in collapsed header when provided', () => {
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Dr. Smith', image: '', title: 'Professor of CS', bio: '', organization: '' },
        ],
      },
    };
    renderTab({ course });
    expect(screen.getByText('Professor of CS')).toBeInTheDocument();
  });

  it('calls toggleSection when instructor header is clicked', () => {
    const toggleSection = vi.fn();
    const course = {
      instructor_info: {
        instructors: [{ name: 'Dr. Smith', image: '', title: '', bio: '', organization: '' }],
      },
    };
    renderTab({ course, toggleSection });
    fireEvent.click(screen.getByText('Dr. Smith'));
    expect(toggleSection).toHaveBeenCalledWith('instructor-0');
  });

  it('shows expanded content when section is expanded', () => {
    const course = {
      instructor_info: {
        instructors: [
          {
            name: 'Dr. Smith',
            image: '',
            title: 'Professor',
            bio: 'A brilliant researcher.',
            organization: 'MIT',
          },
        ],
      },
    };
    renderTab({
      course,
      expandedSections: { 'instructor-0': true },
    });
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('A brilliant researcher.')).toBeInTheDocument();
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('does not show expanded content when section is collapsed', () => {
    const course = {
      instructor_info: {
        instructors: [
          {
            name: 'Dr. Smith',
            image: '',
            title: 'Professor',
            bio: 'A brilliant researcher.',
            organization: 'MIT',
          },
        ],
      },
    };
    renderTab({ course, expandedSections: {} });
    expect(screen.queryByText('About')).not.toBeInTheDocument();
    expect(screen.queryByText('A brilliant researcher.')).not.toBeInTheDocument();
  });

  it('renders instructor image in expanded view when image is provided', () => {
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Dr. Smith', image: '/img/smith.png', title: '', bio: '', organization: '' },
        ],
      },
    };
    renderTab({ course, expandedSections: { 'instructor-0': true } });
    const imgs = screen.getAllByAltText('Dr. Smith');
    // One in collapsed header, one in expanded view
    expect(imgs.length).toBe(2);
  });

  it('does not show bio section when bio is empty', () => {
    const course = {
      instructor_info: {
        instructors: [{ name: 'Dr. Smith', image: '', title: 'Prof', bio: '', organization: '' }],
      },
    };
    renderTab({ course, expandedSections: { 'instructor-0': true } });
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('does not show organization when organization is empty', () => {
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Dr. Smith', image: '', title: '', bio: 'Bio text', organization: '' },
        ],
      },
    };
    renderTab({ course, expandedSections: { 'instructor-0': true } });
    // Organization section should not be rendered
    expect(screen.queryByText('MIT')).not.toBeInTheDocument();
  });

  it('does not show title in expanded view when title is empty', () => {
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Dr. Smith', image: '', title: '', bio: 'Bio text', organization: '' },
        ],
      },
    };
    renderTab({ course, expandedSections: { 'instructor-0': true } });
    // Only "About" and the bio should appear, no title element with Briefcase icon
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders multiple instructors with correct toggle keys', () => {
    const toggleSection = vi.fn();
    const course = {
      instructor_info: {
        instructors: [
          { name: 'Instructor A', image: '', title: '', bio: '', organization: '' },
          { name: 'Instructor B', image: '', title: '', bio: '', organization: '' },
        ],
      },
    };
    renderTab({ course, toggleSection });
    fireEvent.click(screen.getByText('Instructor B'));
    expect(toggleSection).toHaveBeenCalledWith('instructor-1');
  });
});
