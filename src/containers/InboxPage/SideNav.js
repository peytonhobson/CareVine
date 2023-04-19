import React from 'react';
import { IconBell, IconSpinner, InboxItem } from '../../components';
import { cutTextToPreview } from '../../util/data';
import { formatDate } from '../../util/dates';

import css from './InboxPage.module.css';

const SideNav = props => {
  const {
    conversations,
    currentTransaction,
    messages,
    fetchConversationsInProgress,
    isMobile,
    ...rest
  } = props;

  return (
    <div className={css.sidenavRoot}>
      {!fetchConversationsInProgress || conversations.length > 0 ? (
        conversations.map(tx => {
          const txMessages = messages.get(tx.id.uuid);
          const previewMessageLong =
            (txMessages && txMessages.length > 0 && txMessages[0].attributes.content) || '';
          const previewMessage = cutTextToPreview(previewMessageLong, 40);
          return (
            <InboxItem
              key={tx.id.uuid}
              tx={tx}
              previewMessage={previewMessage}
              isActive={currentTransaction?.id?.uuid === tx.id.uuid}
              {...rest}
            />
          );
        })
      ) : (
        <div className={css.noNotificationsContainer}>
          {fetchConversationsInProgress ? (
            <IconSpinner className={css.sideNavSpinner} />
          ) : (
            <div className={css.noNotifications}>
              <IconBell
                className={css.bell}
                height={isMobile ? '7em' : '5em'}
                width={isMobile ? '7em' : '5em'}
              />
              <span className={css.noNotificationsText}>No Notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SideNav;
