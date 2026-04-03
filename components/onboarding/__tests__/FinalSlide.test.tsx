import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

import FinalSlide from '../FinalSlide';

const defaultProps = {
  onNext: vi.fn(),
  onPrev: vi.fn(),
  handleGetStarted: vi.fn(),
};

describe('FinalSlide', () => {
  it('renders without crashing', () => {
    const { container } = render(<FinalSlide {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the heading', () => {
    render(<FinalSlide {...defaultProps} />);
    expect(screen.getByText('Start Boosting Your Skills!')).toBeInTheDocument();
  });

  it('displays the subtitle', () => {
    render(<FinalSlide {...defaultProps} />);
    expect(
      screen.getByText('Check our content selection or manually add more learning items'),
    ).toBeInTheDocument();
  });

  it('renders the rocket animation image', () => {
    render(<FinalSlide {...defaultProps} />);
    const img = screen.getByAlt('Rocket animation');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('hebbkx1anhila5yf'));
  });
});
