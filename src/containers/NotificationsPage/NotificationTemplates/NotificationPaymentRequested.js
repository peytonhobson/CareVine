import React, { useState, useEffect } from 'react';
import { Button } from '../../../components';
import StripePaymentModal from '../../StripePaymentModal/StripePaymentModal';

import css from './NotificationTemplates.module.css';

const NotificationPaymentRequested = props => {
  const {
    notification,
    onFetchSenderListing,
    sender,
    senderListing,
    fetchSenderListingInProgress,
    fetchSenderListingError,
  } = props;

  const { senderName, channelUrl, listingId } = notification.metadata;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (listingId) {
      onFetchSenderListing(listingId);
    }
  }, [listingId]);

  const payButtonDisabled =
    fetchSenderListingInProgress || fetchSenderListingError || !senderListing || !sender;

  return (
    <div className={css.root}>
      <h1 className={css.title}>Payment Requested</h1>
      <p className={css.message}>
        <span className={css.noWrapText}>{senderName}</span> has requested payment from you. Click
        the button below to pay them.
      </p>

      {fetchSenderListingError ? (
        <p className={css.error}>
          There was an error fetching the listing for payment. Please try refreshing the page.
        </p>
      ) : null}
      <Button
        name="InboxPageWithChannel"
        params={{ channel: channelUrl }}
        className={css.linkButton}
        onClick={() => setIsPaymentModalOpen(true)}
        disabled={payButtonDisabled}
      >
        Pay {senderName}
      </Button>
      <StripePaymentModal
        channelUrl={channelUrl}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        provider={sender}
        providerListing={senderListing}
      />
    </div>
  );
};

export default NotificationPaymentRequested;
