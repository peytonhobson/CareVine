import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { ActivityFeed } from '..';

import css from './MessagePanel.module.css';

// Functional component as a helper to build ActivityFeed section
const FeedSection = props => {
  const {
    className,
    rootClassName,
    currentTransaction,
    currentUser,
    fetchMessagesError,
    fetchMessagesInProgress,
    initialMessageFailed,
    messages,
    oldestMessagePageFetched,
    onShowMoreMessages,
    onOpenReviewModal,
    totalMessagePages,
  } = props;

  const [showMessageFailedError, setShowMessageFailedError] = useState(false);

  useEffect(() => {
    if (fetchMessagesError) {
      setShowMessageFailedError(true);
    }
  }, [fetchMessagesError]);

  const txTransitions = currentTransaction.attributes.transitions
    ? currentTransaction.attributes.transitions
    : [];
  const hasOlderMessages = totalMessagePages > oldestMessagePageFetched;

  const showFeed =
    (messages && messages.length > 0) ||
    txTransitions.length > 0 ||
    initialMessageFailed ||
    fetchMessagesError;

  const classes = classNames(rootClassName || css.feedContainer, className);

  return showFeed ? (
    <div className={classes}>
      {/* <h3 className={css.feedHeading}>
        <FormattedMessage id="TransactionPanel.activityHeading" />
      </h3> */}
      {initialMessageFailed ? (
        <p className={css.messageError}>
          <FormattedMessage id="TransactionPanel.initialMessageFailed" />
        </p>
      ) : null}
      {showMessageFailedError ? (
        <p className={css.messageError}>
          <FormattedMessage id="TransactionPanel.messageLoadingFailed" />
        </p>
      ) : null}
      <ActivityFeed
        className={css.feed}
        messages={messages}
        transaction={currentTransaction}
        currentUser={currentUser}
        hasOlderMessages={hasOlderMessages}
        onOpenReviewModal={onOpenReviewModal}
        onShowOlderMessages={onShowMoreMessages}
        fetchMessagesInProgress={fetchMessagesInProgress}
      />
    </div>
  ) : null;
};

export default FeedSection;
