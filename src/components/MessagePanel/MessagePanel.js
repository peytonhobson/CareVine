import React, { useEffect } from 'react';
import FeedSection from './FeedSection';
import { SendMessageForm } from '../../forms';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { isMobileSafari } from '../../util/userAgent';
import {
  ensureListing,
  ensureTransaction,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { UserMessagePreview } from '../';

import css from './MessagePanel.module.css';
import { useCheckMobileScreen } from '../../util/hooks';
const MessagePanelComponent = props => {
  const {
    intl,
    transaction,
    currentUser,
    fetchMessagesError,
    fetchMessagesInProgress,
    initialMessageFailed,
    messages,
    oldestMessagePageFetched,
    onShowMoreMessages,
    totalMessagePages,
    sendMessageInProgress,
    sendMessageError,
    onSendMessage,
  } = props;

  //   const [isMobSaf, setIsMobSaf] = useState(false);

  //Still need to implement this
  //   useEffect(() => {
  //     setIsMobSaf(isMobileSafari());
  //   }, []);

  const isMobile = useCheckMobileScreen();

  const currentTransaction = ensureTransaction(transaction);

  const oldestMessagePageFetchedValue = oldestMessagePageFetched.get(
    currentTransaction.id && currentTransaction.id.uuid
  );
  const totalMessagePagesValue = totalMessagePages.get(
    currentTransaction.id && currentTransaction.id.uuid
  );

  // May be better to use id as comparator here
  const currentUserDisplayNameString = userDisplayNameAsString(currentUser, '');
  const { customer, provider, listing } = currentTransaction;
  const providerDisplayNameString = userDisplayNameAsString(provider, '');
  //May need to check for edge case in which both display names empty
  const otherUser =
    currentUserDisplayNameString === providerDisplayNameString
      ? customer && customer
      : provider && provider;
  const otherUserDisplayNameString = userDisplayNameAsString(otherUser, '');

  const currentListing = ensureListing(currentTransaction.listing);
  const currentProvider = ensureUser(currentTransaction.provider);
  const currentCustomer = ensureUser(currentTransaction.customer);
  // const isCustomer = transactionRole === CUSTOMER;
  // const isProvider = transactionRole === PROVIDER;

  const listingLoaded = !!currentListing.id;
  const listingDeleted = listingLoaded && currentListing.attributes.deleted;
  const iscustomerLoaded = !!currentCustomer.id;
  const isCustomerBanned = iscustomerLoaded && currentCustomer.attributes.banned;
  const isCustomerDeleted = iscustomerLoaded && currentCustomer.attributes.deleted;
  const isProviderLoaded = !!currentProvider.id;
  const isProviderBanned = isProviderLoaded && currentProvider.attributes.banned;
  const isProviderDeleted = isProviderLoaded && currentProvider.attributes.deleted;

  const showSendMessageForm =
    !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

  const formId = 'MessagePanel.SendMessageFormId';
  const sendMessagePlaceholder = intl.formatMessage(
    { id: 'MessagePanel.sendMessagePlaceholder' },
    { name: otherUserDisplayNameString }
  );
  const sendingMessageNotAllowed = intl.formatMessage({
    id: 'MessagePanel.sendingMessageNotAllowed',
  });

  useEffect(() => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:hide']);
    }

    return () => {
      if (window.$crisp && isMobile) {
        window.$crisp.push(['do', 'chat:show']);
      }
    };
  }, [isMobile]);

  const onMessageSubmit = (values, form) => {
    const message = values.message ? values.message.trim() : null;

    if (!message) {
      return;
    }
    onSendMessage(currentTransaction, message);
    form.reset();
  };

  return (
    <div className={css.root}>
      <FeedSection
        rootClassName={css.feedContainer}
        currentTransaction={currentTransaction}
        currentUser={currentUser}
        fetchMessagesError={fetchMessagesError}
        fetchMessagesInProgress={fetchMessagesInProgress}
        initialMessageFailed={initialMessageFailed}
        messages={messages}
        oldestMessagePageFetched={oldestMessagePageFetchedValue}
        // May need to create actual function here later
        onOpenReviewModal={() => console.log('Review Modal opened')}
        onShowMoreMessages={() => onShowMoreMessages(currentTransaction.id)}
        totalMessagePages={totalMessagePagesValue}
      />
      {showSendMessageForm ? (
        <SendMessageForm
          formId={formId}
          rootClassName={css.sendMessageForm}
          messagePlaceholder={sendMessagePlaceholder}
          inProgress={sendMessageInProgress}
          sendMessageError={sendMessageError}
          onSubmit={onMessageSubmit}
        />
      ) : (
        <div className={css.sendingMessageNotAllowed}>{sendingMessageNotAllowed}</div>
      )}
    </div>
  );
};

const MessagePanel = injectIntl(MessagePanelComponent);

export default MessagePanel;
