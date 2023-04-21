import React from 'react';
import { IconEnquiry, IconSpinner, InboxItem } from '../../components';
import { cutTextToPreview } from '../../util/data';
import { formatDate } from '../../util/dates';

import css from './InboxPage.module.css';

const SideNav = props => {
  const {
    conversations,
    currentConversation,
    messages,
    fetchConversationsInProgress,
    isMobile,
    ...rest
  } = props;

  return (
    <div className={css.sidenavRoot}>
      {conversations?.length > 0 ? (
        conversations?.map(tx => {
          return (
            <InboxItem
              key={tx.id.uuid}
              tx={tx}
              messages={messages}
              isActive={currentConversation?.id?.uuid === tx.id.uuid}
              isMobile={isMobile}
              {...rest}
            />
          );
        })
      ) : (
        <div className={css.noConversationsContainer}>
          {fetchConversationsInProgress ? (
            <IconSpinner className={css.sideNavSpinner} />
          ) : (
            <div className={css.noConversations}>
              <IconEnquiry
                className={css.inquiry}
                strokeClass={css.inquiryStroke}
                height={isMobile ? '7em' : '5em'}
                width={isMobile ? '7em' : '5em'}
              />
              <h2 className={css.noConversationsText}>No Conversations</h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SideNav;
