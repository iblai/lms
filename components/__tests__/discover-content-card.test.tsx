import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoverContentCard } from '../discover-content-card';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" />
  ),
}));

// Mock helper functions
vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/default-course-image.jpg'),
}));

// Mock the pathway and program detail modals
vi.mock('../pathway-detail-modal', () => ({
  PathwayDetailModal: ({ pathway, onClose }: any) => (
    <div data-testid="pathway-modal">
      Pathway Modal: {pathway?.title}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../program-detail-modal', () => ({
  ProgramDetailModal: ({ program, onClose }: any) => (
    <div data-testid="program-modal">
      Program Modal: {program?.title || program?.name}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('DiscoverContentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders content card with title and image', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/courses/course-123',
      image: '/test-course.jpg',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('course')).toBeInTheDocument();
  });

  it('navigates to course page when course content is clicked', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/courses/course-123',
      image: '/test-course.jpg',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    const card = screen.getByText('Test Course').closest('div[class*="block"]');
    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith('/courses/course-123');
  });

  it('opens pathway modal when pathway content is clicked', () => {
    const content = {
      id: 'pathway-123',
      title: 'Test Pathway',
      url: '/pathways/pathway-123',
      image: '/test-pathway.jpg',
      contentType: 'pathway',
    };

    render(<DiscoverContentCard content={content} />);

    const card = screen.getByText('Test Pathway').closest('div[class*="block"]');
    fireEvent.click(card!);

    expect(screen.getByTestId('pathway-modal')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens program modal when program content is clicked', () => {
    const content = {
      id: 'program-123',
      title: 'Test Program',
      url: '/programs/program-123',
      image: '/test-program.jpg',
      contentType: 'program',
      data: { description: 'Test description' },
    };

    render(<DiscoverContentCard content={content} />);

    const card = screen.getByText('Test Program').closest('div[class*="block"]');
    fireEvent.click(card!);

    expect(screen.getByTestId('program-modal')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays content type badge', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/courses/course-123',
      image: '/test-course.jpg',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    expect(screen.getByText('course')).toBeInTheDocument();
  });

  it('uses fallback image when no image provided', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/courses/course-123',
      image: '',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', '/default-course-image.jpg');
  });

  it('uses provided image when available', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/courses/course-123',
      image: '/custom-image.jpg',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', '/custom-image.jpg');
  });

  it('closes pathway modal when close is triggered', () => {
    const content = {
      id: 'pathway-123',
      title: 'Test Pathway',
      url: '/pathways/pathway-123',
      image: '/test-pathway.jpg',
      contentType: 'pathway',
    };

    render(<DiscoverContentCard content={content} />);

    // Open modal
    const card = screen.getByText('Test Pathway').closest('div[class*="block"]');
    fireEvent.click(card!);
    expect(screen.getByTestId('pathway-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('pathway-modal')).not.toBeInTheDocument();
  });

  it('closes program modal when close is triggered', () => {
    const content = {
      id: 'program-123',
      title: 'Test Program',
      url: '/programs/program-123',
      image: '/test-program.jpg',
      contentType: 'program',
    };

    render(<DiscoverContentCard content={content} />);

    // Open modal
    const card = screen.getByText('Test Program').closest('div[class*="block"]');
    fireEvent.click(card!);
    expect(screen.getByTestId('program-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('program-modal')).not.toBeInTheDocument();
  });

  it('handles image error by setting fallback image', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/courses/course-123',
      image: '/broken-image.jpg',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    const image = screen.getByTestId('next-image');

    // Simulate image error
    fireEvent.error(image);

    // After error, the src should be set to the fallback image
    expect(image).toHaveAttribute('src', '/default-course-image.jpg');
  });
});
