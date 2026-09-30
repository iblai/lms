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

// Lazy course-artwork lookup — tests set what it resolves to.
const mockCardImage = vi.hoisted(() => ({
  value: { image: '', isPending: false },
  calls: [] as (string | undefined)[],
}));
vi.mock('@/hooks/courses/use-course-card-image', () => ({
  useCourseCardImage: (courseId: string | undefined) => {
    mockCardImage.calls.push(courseId);
    return mockCardImage.value;
  },
}));

describe('DiscoverContentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCardImage.value = { image: '', isPending: false };
    mockCardImage.calls = [];
  });

  describe('lazy course artwork (imageCourseId)', () => {
    const enrolledCard = {
      id: 'course-1',
      title: 'Enrolled Course',
      url: '/courses/course-1',
      image: '',
      imageCourseId: 'course-1',
      contentType: 'course',
    };

    it('looks the image up for the given course', () => {
      render(<DiscoverContentCard content={enrolledCard} />);
      expect(mockCardImage.calls.at(-1)).toBe('course-1');
    });

    it('renders the looked-up image', () => {
      mockCardImage.value = { image: 'https://lms.test/one.png', isPending: false };
      render(<DiscoverContentCard content={enrolledCard} />);
      expect(screen.getByTestId('next-image')).toHaveAttribute('src', 'https://lms.test/one.png');
    });

    it('shows a neutral pending block, not a random placeholder, while it resolves', () => {
      mockCardImage.value = { image: '', isPending: true };
      render(<DiscoverContentCard content={enrolledCard} />);
      expect(screen.getByTestId('card-image-pending')).toBeInTheDocument();
      expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    });

    it('falls back to the placeholder when the course has no artwork', () => {
      render(<DiscoverContentCard content={enrolledCard} />);
      expect(screen.getByTestId('next-image')).toHaveAttribute('src', '/default-course-image.jpg');
    });

    it('skips the lookup when the payload already carries an image', () => {
      render(<DiscoverContentCard content={{ ...enrolledCard, image: '/own.jpg' }} />);
      expect(mockCardImage.calls).toEqual([]);
      expect(screen.getByTestId('next-image')).toHaveAttribute('src', '/own.jpg');
    });
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

  it('navigates to the pathway detail page when pathway content is clicked', () => {
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

    expect(mockPush).toHaveBeenCalledWith('/platform/test-tenant/pathways/pathway-123');
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

  it('prefers a provided onClick override over the default navigation', () => {
    const onClick = vi.fn();
    const content = {
      id: 'resource-1',
      title: 'External Resource',
      url: 'https://example.com/resource',
      image: '/resource.jpg',
      contentType: 'resource',
    };

    render(<DiscoverContentCard content={content} onClick={onClick} />);

    const card = screen.getByText('External Resource').closest('div[class*="block"]');
    fireEvent.click(card!);

    expect(onClick).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
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
