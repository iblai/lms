import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoursePreviewMedia, resolveYouTubeId } from '../course-preview-media';

vi.mock('next/image', () => ({
  default: ({ src, alt, className, onError }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="course-image" onError={onError} />
  ),
}));

const baseProps = {
  title: 'Logic Level: Omnibus I',
  imageSrc: 'https://lms.example.com/course.jpg',
  fallbackImageSrc: '/fallback.jpg',
};

describe('resolveYouTubeId', () => {
  it('accepts a bare video id', () => {
    expect(resolveYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(resolveYouTubeId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts the id from YouTube URLs', () => {
    expect(resolveYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(resolveYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns an empty string for empty or invalid values', () => {
    expect(resolveYouTubeId(null)).toBe('');
    expect(resolveYouTubeId(undefined)).toBe('');
    expect(resolveYouTubeId('')).toBe('');
    expect(resolveYouTubeId('not a video')).toBe('');
  });
});

describe('CoursePreviewMedia', () => {
  it('renders only the course image when there is no intro video', () => {
    render(<CoursePreviewMedia {...baseProps} introVideo={null} />);

    expect(screen.getByTestId('course-image')).toHaveAttribute('src', baseProps.imageSrc);
    expect(screen.queryByTestId('course-intro-video-trigger')).not.toBeInTheDocument();
  });

  it('falls back to the provided image when the course image fails', () => {
    render(<CoursePreviewMedia {...baseProps} introVideo="dQw4w9WgXcQ" />);

    const img = screen.getByTestId('course-image');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/fallback.jpg');
  });

  it('shows a play button and opens the YouTube embed on click', () => {
    render(<CoursePreviewMedia {...baseProps} introVideo="dQw4w9WgXcQ" />);

    expect(screen.queryByTestId('course-intro-video-modal')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: `Play introduction video for ${baseProps.title}` }),
    );

    expect(screen.getByTestId('course-intro-video-modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: baseProps.title })).toBeInTheDocument();
    const iframe = screen.getByTitle(`${baseProps.title} introduction video`);
    expect(iframe.getAttribute('src')).toContain(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    );
  });

  it('unmounts the player when the modal is closed', () => {
    render(<CoursePreviewMedia {...baseProps} introVideo="dQw4w9WgXcQ" />);

    fireEvent.click(screen.getByTestId('course-intro-video-trigger'));
    fireEvent.click(screen.getByRole('button', { name: 'Close video' }));

    expect(screen.queryByTestId('course-intro-video-modal')).not.toBeInTheDocument();
  });
});
