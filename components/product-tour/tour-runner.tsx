'use client';

import { useCallback } from 'react';
import {
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Locale,
  type Options,
  type Step,
} from 'react-joyride';

import { TourTooltip } from './tour-tooltip';
import type { TourOutcome } from './use-tour-completion';

/** Button names (also the buttons' accessible names). */
export const TOUR_LOCALE: Locale = {
  back: 'Back',
  close: 'Close tour',
  last: 'Done',
  next: 'Next',
  skip: 'Skip tour',
};

export const TOUR_OPTIONS: Partial<Options> = {
  // Tooltips open directly; no beacons to click first.
  skipBeacon: true,
  // Every target is app chrome that is always in view.
  skipScroll: true,
  // The spotlight shows the element; opening it mid-tour would fight the overlay.
  blockTargetInteraction: true,
  // The close button and ESC (handled in TourTooltip) leave the tour; an
  // overlay click does nothing, so a stray click can't lose the user's place.
  closeButtonAction: 'skip',
  overlayClickAction: false,
  dismissKeyAction: false,
  overlayColor: 'rgba(17, 24, 39, 0.55)',
  spotlightPadding: 6,
  spotlightRadius: 8,
  // The shell can still be settling when the tour starts.
  targetWaitTimeout: 3000,
  // Above the sidebar (z-10), navbar (z-40), dialogs and the mentor widget (z-50).
  zIndex: 1000,
  arrowColor: '#ffffff',
  backgroundColor: '#ffffff',
};

export type TourRunnerProps = {
  steps: Step[];
  run: boolean;
  onEnd: (outcome: TourOutcome) => void;
};

/** Thin react-joyride host; loaded on demand so the library stays out of the shared chunk. */
export function TourRunner({ steps, run, onEnd }: TourRunnerProps) {
  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.type !== EVENTS.TOUR_END) return;
      onEnd(data.status === STATUS.FINISHED ? 'finished' : 'skipped');
    },
    [onEnd],
  );

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      tooltipComponent={TourTooltip}
      locale={TOUR_LOCALE}
      options={TOUR_OPTIONS}
      onEvent={handleEvent}
    />
  );
}

export default TourRunner;
