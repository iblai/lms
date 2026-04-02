'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { getTenant } from '@/utils/helpers';
// @ts-ignore
import { TopBanner, PaywallModal } from '@iblai/iblai-js/web-containers';

export function MonetizationWrapper() {
  const platformKey = getTenant();
  const { displayMonetizationCheckoutModal, accessCheckResponse } = useAppSelector(
    (state) => state.monetization,
  );

  const pricing = accessCheckResponse?.pricing;
  const itemId = accessCheckResponse?.item_id;
  const itemType = accessCheckResponse?.item_type;

  const needsPurchase = displayMonetizationCheckoutModal && !!pricing;

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (displayMonetizationCheckoutModal) {
      setModalOpen(true);
    }
  }, [displayMonetizationCheckoutModal]);

  const handleModalClose = () => {
    setModalOpen(false);
  };

  if (!needsPurchase) return null;

  return (
    <>
      <PaywallModal
        open={modalOpen}
        onClose={handleModalClose}
        pricing={pricing}
        platformKey={platformKey}
        itemId={itemId}
        itemType={itemType}
      />
    </>
  );
}
