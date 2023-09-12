import React, { useMemo } from 'react';
import { IconEnquiry, IconSpinner, InboxItem } from '../../components';

import css from './InboxPage.module.css';

const findLatestMessage = (txId, messages) => {
  const latestMessage = messages.get(txId)?.reduce((acc, message) => {
    if (message.attributes.createdAt > acc.attributes.createdAt) {
      return message;
    }
    return acc;
  }, messages.get(txId)?.[0]);
  return latestMessage;
};

const sortConversations = messages => (a, b) => {
  const aLastMessageTime = findLatestMessage(a.id.uuid, messages)?.attributes?.createdAt;
  const bLastMessageTime = findLatestMessage(b.id.uuid, messages)?.attributes?.createdAt;

  return aLastMessageTime > bLastMessageTime ? -1 : 1;
};

const SideNav = props => {
  const {
    conversations,
    currentConversation,
    messages,
    fetchConversationsInProgress,
    isMobile,
    ...rest
  } = props;

  const sortedConversations = useMemo(() => conversations.sort(sortConversations(messages)), [
    conversations,
    messages,
  ]);

  return (
    <div className={css.sidenavRoot}>
      {sortedConversations?.length > 0 ? (
        sortedConversations?.map(tx => {
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
