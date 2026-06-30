import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoverContentCard } from '../discover-content-card';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
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

// Mock the pathway detail modal
vi.mock('../pathway-detail-modal', () => ({
  PathwayDetailModal: ({ pathway, onClose }: any) => (
    <div data-testid="pathway-modal">
      Pathway Modal: {pathway?.title}
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
      url: '/test-tenant/courses/course-123',
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
      url: '/test-tenant/courses/course-123',
      image: '/test-course.jpg',
      contentType: 'course',
    };

    render(<DiscoverContentCard content={content} />);

    const card = screen.getByText('Test Course').closest('div[class*="block"]');
    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/courses/course-123');
  });

  it('opens pathway modal when pathway content is clicked', async () => {
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

    // PathwayDetailModal is lazy-loaded via next/dynamic.
    expect(await screen.findByTestId('pathway-modal')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to program page when program content is clicked', () => {
    const content = {
      id: 'program-123',
      title: 'Test Program',
      url: '/test-tenant/programs/program-123',
      image: '/test-program.jpg',
      contentType: 'program',
    };

    render(<DiscoverContentCard content={content} />);

    const card = screen.getByText('Test Program').closest('div[class*="block"]');
    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/programs/program-123');
  });

  it('displays content type badge', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/test-tenant/courses/course-123',
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
      url: '/test-tenant/courses/course-123',
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
      url: '/test-tenant/courses/course-123',
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

  it('handles image error by setting fallback image', () => {
    const content = {
      id: 'course-123',
      title: 'Test Course',
      url: '/test-tenant/courses/course-123',
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
