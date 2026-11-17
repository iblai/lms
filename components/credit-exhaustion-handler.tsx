'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setOpenContactAdminModal,
  setOpenPricingModal,
  use402ErrorCheck,
  type CreditExhaustion,
} from '@iblai/iblai-js/web-utils';
import { ContactAdminModal, UpgradePackageModal } from '@iblai/iblai-js/web-containers';
import { config } from '@/lib/config';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { getUserEmail } from '@/utils/helpers';
import type { RootState } from '@/lib/store';

/**
 * The DOM event `<agent-ai>` dispatches for the agent's `credits.exhausted`
 * frame (`CREDIT_EXHAUSTION_EVENT` in `@iblai/agent-ai`; spelled out here so
 * this chunk does not pull the whole web component in for one string).
 */
export const CREDIT_EXHAUSTION_EVENT = 'creditsexhausted';

/**
 * Runs the SDK's credits flows on this page. With `handlecreditexhaustion` set
 * on `<agent-ai>`, a 402 inside the chat no longer opens a modal in the widget:
 * the agent posts a `credits.exhausted` frame, the element re-dispatches it as
 * a DOM event, and this feeds it to the same `handle402Error` the agent would
 * have used. This app's own credits 402s (`providers/index.tsx`) and the
 * sidebar's free-trial gate reach the same slice, so the modals below serve
 * all three: the plan picker, the Billing tab (`?profileTab=billing`, which the
 * sidebar opens) or the contact-your-admin notice, at page size.
 */
export function CreditExhaustionHandler() {
  const dispatch = useDispatch();
  const tenant = useTenantParam();
  const { handle402Error } = use402ErrorCheck();
  const { openPricingModal, openContactAdminModal } = useSelector(
    (state: RootState) => state.subscription,
  );

  useEffect(() => {
    const onCreditsExhausted = (event: Event) => {
      const frame = (event as CustomEvent<CreditExhaustion | undefined>).detail;
      if (!frame || typeof frame !== 'object') return;
      void handle402Error({
        error: frame.error,
        message: frame.message,
        pricing_table: frame.pricing_table,
      });
    };
    document.addEventListener(CREDIT_EXHAUSTION_EVENT, onCreditsExhausted);
    return () => document.removeEventListener(CREDIT_EXHAUSTION_EVENT, onCreditsExhausted);
  }, [handle402Error]);

  const authUrl = config.urls.auth().replace(/\/?$/, '/');

  return (
    <>
      {openPricingModal && (
        <UpgradePackageModal
          open={openPricingModal}
          onClose={() => dispatch(setOpenPricingModal(false))}
          redirectUrl={`${authUrl}login`}
          mainPlatformKey={config.settings.mainPlatformKey()}
          sourcePlatformKey={tenant}
          currentUserEmail={getUserEmail()}
        />
      )}
      {openContactAdminModal && (
        <ContactAdminModal
          isOpen={openContactAdminModal}
          onClose={() => dispatch(setOpenContactAdminModal(false))}
        />
      )}
    </>
  );
}
