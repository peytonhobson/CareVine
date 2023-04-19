import React, { useState } from 'react';
import { NamedLink, Avatar, UserDisplayName } from '../';
import { propTypes } from '../../util/types';
import { oneOf } from 'prop-types';
import { intlShape } from '../../util/reactIntl';
import { txIsRequested } from '../../util/transaction';
import { createSlug, stringify } from '../../util/urlHelpers';
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

  if (isYesterday(createdAt)) {
    return (
      'yesterday at ' +
      timestampToDate(createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    );
  }

  return moment(createdAt).format('MMM DD');
};

const truncateString = function(fullStr, strLen) {
  if (!strLen) strLen = 40;
  if (fullStr === null || fullStr === undefined) return '';
  if (fullStr.length <= strLen) return fullStr;
  var separator = '...';
  var sepLen = separator.length;
  var charsToShow = strLen - sepLen;
  var frontChars = Math.ceil(charsToShow / 2);
  var backChars = Math.floor(charsToShow / 2);
  return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
};

const InboxItem = props => {
  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);

  const {
    tx,
    intl,
    currentUser,
    previewMessage,
    lastMessageTime,
    isMobile,
    isActive,
    onOpenDeleteConversationModal,
    onPreviewClick,
  } = props;
  const { customer, provider } = tx;

  const otherUser = currentUser.id.uuid === provider?.id?.uuid ? customer : provider;
  const otherUserDisplayName = <UserDisplayName user={otherUser} intl={intl} />;
  const isOtherUserBanned = otherUser?.attributes?.banned;

  const notificationDot = false ? <div className={css.notificationDot} /> : null;

  const title = otherUserDisplayName;
  const id = tx.id.uuid;
  const text = truncateString(previewMessage, 40);

  const activeClass = isActive ? css.active : null;
  const deleteOpenClass = isDeleteMenuOpen ? css.deleteOpen : null;

  return (
    <div
      className={classNames(css.inboxPreview, deleteOpenClass, activeClass)}
      key={id}
      onClick={() => onPreviewClick(id)}
    >
      <div className={css.previewHoverLine} />
      <Avatar user={otherUser} className={css.avatar} />
      <div className={css.inboxPreviewContent}>
        <div className={css.inboxPreviewUpper}>
          {notificationDot}
          <div className={css.inboxTitle}>{title}</div>
          {/* TODO: Change this to last message time */}
          <div className={css.inboxDate}>{formatPreviewDate(tx.attributes.lastTransitionedAt)}</div>
        </div>
        <div className={css.inboxPreviewLower}>
          <div className={css.inboxText}>{text}</div>
        </div>
        <div className={css.inboxPreviewAction}>
          <Menu
            className={classNames(css.menu, { [css.cardIsOpen]: !isDeleteMenuOpen })}
            contentPlacementOffset={MENU_CONTENT_OFFSET}
            contentPosition="left"
            useArrow={false}
            onToggleActive={() => setIsDeleteMenuOpen(prev => !prev)}
            isOpen={isDeleteMenuOpen}
          >
            <MenuLabel className={css.menuLabel} isOpenClassName={css.listingMenuIsOpen}>
              <IconVerticalDots
                height={isMobile ? '1.5em' : '0.75em'}
                width={isMobile ? '1.75em' : '1em'}
                className={css.menuIcon}
              />
            </MenuLabel>
            <MenuContent rootClassName={css.menuContent}>
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
