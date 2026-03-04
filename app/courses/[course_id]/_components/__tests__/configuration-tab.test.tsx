import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the child components
vi.mock('../credentials-card', () => ({
  CredentialsCard: ({ courseId, expandedSections, toggleSection }: any) => (
    <div
      data-testid="credentials-card"
      data-course-id={courseId}
      data-expanded={JSON.stringify(expandedSections)}
    >
      Credentials Card
      <button onClick={() => toggleSection('credentials')}>Toggle Credentials</button>
    </div>
  ),
}));

vi.mock('../advanced-settings-card', () => ({
  AdvancedSettingsCard: ({ courseId, expandedSections, toggleSection }: any) => (
    <div
      data-testid="advanced-settings-card"
      data-course-id={courseId}
      data-expanded={JSON.stringify(expandedSections)}
    >
      Advanced Settings Card
      <button onClick={() => toggleSection('advancedSettings')}>Toggle Advanced</button>
    </div>
  ),
}));

import { ConfigurationTab } from '../configuration-tab';

describe('ConfigurationTab', () => {
  const defaultProps = {
    courseId: 'course-v1:test+course+2024',
    expandedSections: { credentials: false, advancedSettings: false },
    toggleSection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the configuration tab container', () => {
    render(<ConfigurationTab {...defaultProps} />);

    expect(screen.getByTestId('configuration-tab')).toBeInTheDocument();
  });

  it('renders CredentialsCard with correct props', () => {
    render(<ConfigurationTab {...defaultProps} />);

    const credentialsCard = screen.getByTestId('credentials-card');
    expect(credentialsCard).toBeInTheDocument();
    expect(credentialsCard).toHaveAttribute('data-course-id', 'course-v1:test+course+2024');
  });

  it('renders AdvancedSettingsCard with correct props', () => {
    render(<ConfigurationTab {...defaultProps} />);

    const advancedCard = screen.getByTestId('advanced-settings-card');
    expect(advancedCard).toBeInTheDocument();
    expect(advancedCard).toHaveAttribute('data-course-id', 'course-v1:test+course+2024');
  });

  it('passes expandedSections to child components', () => {
    const expandedSections = { credentials: true, advancedSettings: false };
    render(<ConfigurationTab {...defaultProps} expandedSections={expandedSections} />);

    const credentialsCard = screen.getByTestId('credentials-card');
    expect(credentialsCard).toHaveAttribute('data-expanded', JSON.stringify(expandedSections));
  });

  it('passes toggleSection function to child components', () => {
    render(<ConfigurationTab {...defaultProps} />);

    // Click toggle button in credentials card
    screen.getByText('Toggle Credentials').click();
    expect(defaultProps.toggleSection).toHaveBeenCalledWith('credentials');

    // Click toggle button in advanced settings card
    screen.getByText('Toggle Advanced').click();
    expect(defaultProps.toggleSection).toHaveBeenCalledWith('advancedSettings');
  });

  it('has correct container styling', () => {
    render(<ConfigurationTab {...defaultProps} />);

    const container = screen.getByTestId('configuration-tab');
    expect(container).toHaveClass('space-y-6');
  });
});
