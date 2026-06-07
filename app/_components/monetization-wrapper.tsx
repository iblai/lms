'use client';

import { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useTenantParam } from '@/hooks/use-tenant-param';
// @ts-ignore
import { TopBanner, PaywallModal } from '@iblai/iblai-js/web-containers';
// @ts-ignore
import { setDisplayMonetizationCheckoutModal } from '@iblai/iblai-js/web-utils';
import { MONETIZATION_CLOSE_PAYLOAD } from '@/constants/global';
import { useRouter } from 'next/navigation';

export function MonetizationWrapper() {
  const router = useRouter();
  const platformKey = useTenantParam();
  const dispatch = useAppDispatch();
  const { displayMonetizationCheckoutModal, accessCheckResponse, paywallClosable, onClosePayload } =
    useAppSelector((state) => state.monetization);

  // Cache the last valid accessCheckResponse so it survives
  // the Redux clear triggered by setDisplayMonetizationCheckoutModal(false)
  const cachedResponseRef = useRef(accessCheckResponse);
  if (accessCheckResponse) {
    cachedResponseRef.current = accessCheckResponse;
  }

  const response = accessCheckResponse || cachedResponseRef.current;
  const pricing = response?.pricing;
  const itemId = response?.item_id;
  const itemType = response?.item_type;

  const handleModalClose = () => {
    if (onClosePayload === MONETIZATION_CLOSE_PAYLOAD.redirect_402) {
      router.push(`/platform/${platformKey}/error/402`);
    }
    dispatch(setDisplayMonetizationCheckoutModal(false));
  };

  if (!displayMonetizationCheckoutModal || !pricing) return null;

  return (
    <PaywallModal
      open={displayMonetizationCheckoutModal}
      onClose={handleModalClose}
      pricing={pricing}
      platformKey={platformKey}
      itemId={itemId}
      itemType={itemType}
      closable={paywallClosable}
      buttonClassName="bg-amber-500 text-white hover:bg-amber-600"
    />
  );
}
