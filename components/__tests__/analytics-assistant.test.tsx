import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

import { AnalyticsAssistant } from '../analytics-assistant';

describe('AnalyticsAssistant', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalyticsAssistant />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders ACI Analytics title', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByText('ACI Analytics')).toBeInTheDocument();
  });

  it('renders the ACI Analytics logo', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByAltText('ACI Analytics')).toBeInTheDocument();
  });

  it('renders the question prompt text', () => {
    render(<AnalyticsAssistant />);
    expect(
      screen.getByText('Ask questions to clarify material and stay on track'),
    ).toBeInTheDocument();
  });

  it('renders the analyze text', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByText('Get a better understanding and analyze')).toBeInTheDocument();
  });

  it('renders the forecast text', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByText('Forecast the future and improve performance')).toBeInTheDocument();
  });

  it('renders the reports text', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByText('Build meaningful reports for your audiences')).toBeInTheDocument();
  });

  it('renders the textarea input', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByPlaceholderText('Ask a question or prompt')).toBeInTheDocument();
  });

  it('updates textarea value when typing', () => {
    render(<AnalyticsAssistant />);
    const textarea = screen.getByPlaceholderText('Ask a question or prompt');
    fireEvent.change(textarea, { target: { value: 'How many users?' } });
    expect(textarea).toHaveValue('How many users?');
  });

  it('renders the question mark indicator', () => {
    render(<AnalyticsAssistant />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<AnalyticsAssistant />);
    const buttons = screen.getAllByRole('button');
    // There should be at least the clock, X, and arrow-up buttons
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});
