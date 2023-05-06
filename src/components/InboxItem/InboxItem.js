import React, { useState } from 'react';
import { Avatar, UserDisplayName } from '../';
import { propTypes } from '../../util/types';
import { intlShape } from '../../util/reactIntl';
import {
  IconVerticalDots,
  Menu,
  MenuContent,
  MenuLabel,
  MenuItem,
  InlineTextButton,
} from '../../components';
import { isToday, isYesterday, timestampToDate } from '../../util/dates';
import moment from 'moment';
import classNames from 'classnames';
import { userDisplayNameAsString, truncateString } from '../../util/data';

import css from './InboxItem.module.css';

const MENU_CONTENT_OFFSET = -12;

const formatPreviewDate = createdAt => {
  if (isToday(createdAt)) {
    return timestampToDate(createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  }

  return moment(createdAt).format('MMM DD');
};

const compareMessages = (a, b) => {
  return a.attributes.createdAt - b.attributes.createdAt;
};

const InboxItem = props => {
  const {
    tx,
    intl,
    currentUser,
    messages,
    isMobile,
    isActive,
    onOpenDeleteConversationModal,
    onPreviewClick,
  } = props;
  const { customer, provider } = tx;

  const txMessages = messages.get(tx.id.uuid);
  const sortedMessages = txMessages?.sort(compareMessages);
  const lastMessage = sortedMessages?.[sortedMessages.length - 1];
  const previewMessage = lastMessage?.attributes?.content ?? null;
  const lastMessageTime = lastMessage?.attributes?.createdAt?.getTime() ?? null;

  const otherUser = currentUser.id?.uuid === provider?.id?.uuid ? customer : provider;
  const otherUserDisplayName = userDisplayNameAsString(otherUser, null);
  const isOtherUserBanned = otherUser?.attributes?.banned;

  const currentUserId = currentUser.id?.uuid;
  const hasUnreadMessages =
    tx.attributes.metadata?.unreadMessageCount &&
    tx.attributes.metadata?.unreadMessageCount[currentUserId] > 0;

  const notificationDot = hasUnreadMessages ? <div className={css.notificationDot} /> : null;

  const title = truncateString(otherUserDisplayName, 10);
  const id = tx.id.uuid;
  const text = truncateString(previewMessage, 40);

  const rootClasses = classNames(
    css.inboxPreview,
    // { [css.deleteOpen]: isDeleteMenuOpen },
    { [css.active]: !isMobile && isActive }
  );

  return (
    <div className={rootClasses} key={id} onClick={() => onPreviewClick(id)}>
      <div className={css.previewHoverLine} />
      <Avatar user={otherUser} className={css.avatar} />
      <div className={css.inboxPreviewContent}>
        <div className={css.inboxPreviewUpper}>
          {notificationDot}
          <div className={css.inboxTitle}>{title}</div>
          <div className={css.inboxDate}>
            {lastMessageTime && formatPreviewDate(lastMessageTime)}
          </div>
        </div>
        <div className={css.inboxPreviewLower}>
          <div className={css.inboxText}>{text}</div>
        </div>
        <div className={css.inboxPreviewAction}>
          <Menu
            className={classNames(css.menu)}
            contentPlacementOffset={MENU_CONTENT_OFFSET}
            contentPosition="left"
            useArrow={false}
          >
            <MenuLabel className={css.menuLabel} isOpenClassName={css.listingMenuIsOpen}>
              <IconVerticalDots
                height={isMobile ? '1.5em' : '0.75em'}
                width={isMobile ? '1.25em' : '1em'}
                className={css.menuIcon}
              />
            </MenuLabel>
            <MenuContent className={css.menuContent}>
              <MenuItem key="delete-conversation" className={css.menuItem}>
                <InlineTextButton
                  className={css.deleteButton}
                  onClick={e => {
                    e.stopPropagation();
                    onOpenDeleteConversationModal(id);
                  }}
                >
                  Delete Conversation
                </InlineTextButton>
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
    </div>
  );
};

InboxItem.propTypes = {
  unitType: propTypes.bookingUnitType.isRequired,
  tx: propTypes.transaction.isRequired,
  intl: intlShape.isRequired,
};

export default InboxItem;
