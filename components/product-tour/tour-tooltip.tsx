'use client';

import { X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { TooltipRenderProps } from 'react-joyride';

export const TOUR_TOOLTIP_TEST_ID = 'product-tour-tooltip';
export const TOUR_PROGRESS_TEST_ID = 'product-tour-progress';

/**
 * The tour's tooltip, styled like the app's other one-time hints (see the
 * agent-mode hint popover in the course-content layout). The button props
 * come from react-joyride and carry the accessible names from `TOUR_LOCALE`.
 */
export function TourTooltip({
  backProps,
  closeProps,
  controls,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  // Joyride's own ESC handling is off (it would only close the step); make
  // ESC leave the tour, like the close button.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    controls.skip('button_close');
  };

  return (
    <div
      {...tooltipProps}
      onKeyDown={handleKeyDown}
      data-testid={TOUR_TOOLTIP_TEST_ID}
      data-step-id={step.id}
      className="w-[340px] max-w-[calc(100vw-2rem)] rounded-lg bg-white p-4 text-left text-gray-900 shadow-xl ring-1 ring-black/5"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {step.title ? (
            <p className="mb-1 text-sm font-medium text-gray-900">{step.title}</p>
          ) : null}
          <div className="text-sm leading-relaxed text-gray-600">{step.content}</div>
        </div>
        <button
          type="button"
          {...closeProps}
          className="-mt-1 -mr-1 shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500" data-testid={TOUR_PROGRESS_TEST_ID}>
          {index + 1} of {size}
        </span>
        <div className="flex items-center gap-2">
          {!isLastStep && (
            <button
              type="button"
              {...skipProps}
              className="rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              Skip tour
            </button>
          )}
          {index > 0 && (
            <button
              type="button"
              {...backProps}
              className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              Back
            </button>
          )}
          <button
            type="button"
            {...primaryProps}
            className="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:outline-none"
          >
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
