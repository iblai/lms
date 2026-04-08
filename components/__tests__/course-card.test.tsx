import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { CourseCard } from '../course-card';

describe('CourseCard', () => {
  const defaultCourse = {
    id: 1,
    title: 'Test Course',
    image: '/test-image.jpg',
    duration: '2 hours',
    completed: false,
    course_id: 'course-v1:Test+101+2024',
  };

  it('renders without crashing', () => {
    const { container } = render(<CourseCard course={defaultCourse} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the course title', () => {
    render(<CourseCard course={defaultCourse} />);
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });

  it('renders the course link', () => {
    render(<CourseCard course={defaultCourse} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/courses/course-v1:Test+101+2024');
  });

  it('renders the course image', () => {
    render(<CourseCard course={defaultCourse} />);
    const img = screen.getByAltText('Test Course');
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('renders the course badge', () => {
    render(<CourseCard course={defaultCourse} />);
    expect(screen.getByText('course')).toBeInTheDocument();
  });

  it('renders with placeholder when no image', () => {
    const courseNoImage = { ...defaultCourse, image: '' };
    render(<CourseCard course={courseNoImage} />);
    const img = screen.getByAltText('Test Course');
    expect(img).toHaveAttribute('src', '/placeholder.svg');
  });

  it('renders different course titles', () => {
    const course2 = { ...defaultCourse, title: 'Advanced Course', course_id: 'course-v1:Adv+201' };
    render(<CourseCard course={course2} />);
    expect(screen.getByText('Advanced Course')).toBeInTheDocument();
  });

  it('renders a link that wraps the card', () => {
    render(<CourseCard course={defaultCourse} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });
});
