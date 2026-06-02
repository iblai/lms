import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, onError, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ tenant: 'test-tenant' })),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: () => 'https://lms.example.com',
    },
  },
}));

vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random-course-image.jpg'),
  getTenant: vi.fn(() => 'test-tenant'),
}));

import { CourseBox } from '../course-box';

describe('CourseBox', () => {
  const courseWithImage = {
    course_id: 'course-v1:Test+101+2024',
    name: 'Introduction to Testing',
    edx_data: {
      course_image_asset_path: '/asset-v1:Test+101+2024+type@asset+block@course_image.png',
    },
  } as any;

  const courseWithoutImage = {
    course_id: 'course-v1:Test+102+2024',
    name: 'Advanced Testing',
  } as any;

  it('renders without crashing', () => {
    const { container } = render(<CourseBox course={courseWithImage} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the course name', () => {
    render(<CourseBox course={courseWithImage} />);
    expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
  });

  it('renders a link to the course page', () => {
    render(<CourseBox course={courseWithImage} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/platform/test-tenant/courses/course-v1:Test+101+2024');
  });

  it('renders the course badge', () => {
    render(<CourseBox course={courseWithImage} />);
    expect(screen.getByText('course')).toBeInTheDocument();
  });

  it('renders course image from edx_data when available', () => {
    render(<CourseBox course={courseWithImage} />);
    const img = screen.getByAltText('Introduction to Testing');
    expect(img).toHaveAttribute(
      'src',
      'https://lms.example.com/asset-v1:Test+101+2024+type@asset+block@course_image.png',
    );
  });

  it('uses random course image when no edx_data image', () => {
    render(<CourseBox course={courseWithoutImage} />);
    const img = screen.getByAltText('Advanced Testing');
    expect(img).toHaveAttribute('src', '/random-course-image.jpg');
  });

  it('renders the image element', () => {
    render(<CourseBox course={courseWithImage} />);
    expect(screen.getByAltText('Introduction to Testing')).toBeInTheDocument();
  });
});
