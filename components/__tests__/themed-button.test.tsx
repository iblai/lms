import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) =>
    args
      .flat()
      .filter((v) => typeof v === 'string' && v.length > 0)
      .join(' '),
}));

import { ThemedButton } from '../themed-button';

describe('ThemedButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ThemedButton>Click me</ThemedButton>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders children text', () => {
    render(<ThemedButton>Click me</ThemedButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<ThemedButton>Click</ThemedButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(<ThemedButton onClick={onClick}>Click</ThemedButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies primary variant classes by default', () => {
    render(<ThemedButton>Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('from-[var(--button-primary-gradient-from)]');
  });

  it('applies secondary variant classes', () => {
    render(<ThemedButton variant="secondary">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('from-[var(--button-secondary-gradient-from)]');
  });

  it('applies accent variant classes', () => {
    render(<ThemedButton variant="accent">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('from-[var(--button-accent-gradient-from)]');
  });

  it('applies outline variant classes', () => {
    render(<ThemedButton variant="outline">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-[var(--border)]');
  });

  it('applies ghost variant classes', () => {
    render(<ThemedButton variant="ghost">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg-[var(--background-dark)]');
  });

  it('applies sm size classes', () => {
    render(<ThemedButton size="sm">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-3');
    expect(button.className).toContain('py-1.5');
  });

  it('applies md size classes by default', () => {
    render(<ThemedButton>Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-4');
    expect(button.className).toContain('py-2');
  });

  it('applies lg size classes', () => {
    render(<ThemedButton size="lg">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-6');
    expect(button.className).toContain('py-3');
  });

  it('applies custom className', () => {
    render(<ThemedButton className="custom-class">Click</ThemedButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('passes through HTML button props', () => {
    render(
      <ThemedButton disabled type="submit">
        Click
      </ThemedButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
  });
});
