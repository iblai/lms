import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '../toast';

describe('Toast', () => {
  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastTitle>Toast Title</ToastTitle>
          <ToastDescription>Toast Description</ToastDescription>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText('Toast Title')).toBeInTheDocument();
    expect(screen.getByText('Toast Description')).toBeInTheDocument();
  });
});
