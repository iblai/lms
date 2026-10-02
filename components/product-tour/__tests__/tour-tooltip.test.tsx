import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';

import { TourTooltip, TOUR_PROGRESS_TEST_ID, TOUR_TOOLTIP_TEST_ID } from '../tour-tooltip';

const buttonProps = (label: string) => ({
  'aria-label': label,
  'data-action': label.toLowerCase(),
  onClick: vi.fn(),
  role: 'button',
  title: label,
});

function makeProps(overrides: Partial<TooltipRenderProps> = {}): TooltipRenderProps {
  return {
    continuous: true,
    index: 1,
    isLastStep: false,
    size: 4,
    step: {
      id: 'search',
      title: 'Search',
      content: 'Search the catalog.',
      target: 'header form[role="search"]',
    } as unknown as TooltipRenderProps['step'],
    backProps: buttonProps('Back'),
    closeProps: buttonProps('Close tour'),
    primaryProps: buttonProps('Next'),
    skipProps: buttonProps('Skip tour'),
    tooltipProps: { 'aria-modal': true, role: 'alertdialog' },
    controls: {
      close: vi.fn(),
      go: vi.fn(),
      info: vi.fn(),
      next: vi.fn(),
      open: vi.fn(),
      prev: vi.fn(),
      replay: vi.fn(),
      reset: vi.fn(),
      skip: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    },
    ...overrides,
  };
}

describe('TourTooltip', () => {
  it('renders the step title, content, and progress', () => {
    render(<TourTooltip {...makeProps()} />);
    const tooltip = screen.getByTestId(TOUR_TOOLTIP_TEST_ID);
    expect(tooltip).toHaveAttribute('role', 'alertdialog');
    expect(tooltip).toHaveAttribute('data-step-id', 'search');
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Search the catalog.')).toBeInTheDocument();
    expect(screen.getByTestId(TOUR_PROGRESS_TEST_ID)).toHaveTextContent('2 of 4');
  });

  it('renders without a title', () => {
    const props = makeProps();
    props.step = { ...props.step, title: undefined };
    render(<TourTooltip {...props} />);
    expect(screen.queryByText('Search')).not.toBeInTheDocument();
    expect(screen.getByText('Search the catalog.')).toBeInTheDocument();
  });

  it('shows Skip and Next (no Back) on the first step', () => {
    render(<TourTooltip {...makeProps({ index: 0 })} />);
    expect(screen.getByRole('button', { name: 'Skip tour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveTextContent('Next');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('shows Back and Done (no Skip) on the last step', () => {
    const props = makeProps({ index: 3, isLastStep: true, primaryProps: buttonProps('Done') });
    render(<TourTooltip {...props} />);
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toHaveTextContent('Done');
    expect(screen.queryByRole('button', { name: 'Skip tour' })).not.toBeInTheDocument();
  });

  it('wires the joyride button handlers', () => {
    const props = makeProps();
    render(<TourTooltip {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close tour' }));
    expect(props.primaryProps.onClick).toHaveBeenCalledTimes(1);
    expect(props.backProps.onClick).toHaveBeenCalledTimes(1);
    expect(props.skipProps.onClick).toHaveBeenCalledTimes(1);
    expect(props.closeProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('leaves the tour on Escape and ignores other keys', () => {
    const props = makeProps();
    render(<TourTooltip {...props} />);
    const tooltip = screen.getByTestId(TOUR_TOOLTIP_TEST_ID);
    fireEvent.keyDown(tooltip, { key: 'Enter' });
    expect(props.controls.skip).not.toHaveBeenCalled();
    fireEvent.keyDown(tooltip, { key: 'Escape' });
    expect(props.controls.skip).toHaveBeenCalledWith('button_close');
  });
});
