import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

import { DefaultEmptyBox } from '../default-empty-box';

describe('DefaultEmptyBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<DefaultEmptyBox />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders default message', () => {
    render(<DefaultEmptyBox />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<DefaultEmptyBox message="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders default image', () => {
    render(<DefaultEmptyBox />);
    const img = screen.getByAltText('No data available');
    expect(img).toHaveAttribute('src', '/images/empty-data-icon.svg');
  });

  it('renders custom image', () => {
    render(<DefaultEmptyBox image="/custom-empty.svg" />);
    const img = screen.getByAltText('No data available');
    expect(img).toHaveAttribute('src', '/custom-empty.svg');
  });

  it('renders with custom image size', () => {
    render(<DefaultEmptyBox imageSize={60} />);
    const img = screen.getByAltText('No data available');
    expect(img).toHaveAttribute('width', '60');
    expect(img).toHaveAttribute('height', '60');
  });

  it('renders with border by default', () => {
    const { container } = render(<DefaultEmptyBox />);
    expect(container.firstChild).toHaveClass('border-gray-200');
  });

  it('renders without border when bordered is false', () => {
    const { container } = render(<DefaultEmptyBox bordered={false} />);
    expect(container.firstChild).toHaveClass('border-none');
  });

  it('applies custom className', () => {
    const { container } = render(<DefaultEmptyBox className="w-full" />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('renders with default imageSize of 40', () => {
    render(<DefaultEmptyBox />);
    const img = screen.getByAltText('No data available');
    expect(img).toHaveAttribute('width', '40');
    expect(img).toHaveAttribute('height', '40');
  });

  it('uses message as alt text for image', () => {
    render(<DefaultEmptyBox message="Empty state" />);
    expect(screen.getByAltText('Empty state')).toBeInTheDocument();
  });

  it('renders p element with the message', () => {
    render(<DefaultEmptyBox message="Test message" />);
    const paragraph = screen.getByText('Test message');
    expect(paragraph.tagName).toBe('P');
  });

  it('has centered content', () => {
    const { container } = render(<DefaultEmptyBox />);
    const innerDiv = container.querySelector('.flex.flex-col.items-center.justify-center');
    expect(innerDiv).toBeInTheDocument();
  });
});
