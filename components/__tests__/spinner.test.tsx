import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Spinner } from '../spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies the default classes', () => {
    const { container } = render(<Spinner />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'h-full', 'w-full', 'items-center', 'justify-center');
  });

  it('merges a custom className', () => {
    const { container } = render(<Spinner className="custom-class h-20 w-20" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class', 'h-20', 'w-20');
  });

  it('renders the animated loader icon', () => {
    const { container } = render(<Spinner />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('animate-spin');
  });
});
