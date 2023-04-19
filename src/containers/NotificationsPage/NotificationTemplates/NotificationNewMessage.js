import React from 'react';

import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const NotificationNewMessage = props => {
  const { notification } = props;

  const { senderName, conversationId } = notification.metadata;

  return (
    <div className={css.root}>
      <h1 className={css.title}>
        New Message from <span className={css.noWrapText}>{senderName}</span>
      </h1>
      <p className={css.message}>
        You have a new message from <span className={css.noWrapText}>{senderName}</span>. To view
        this message, click the button below.
      </p>
      <NamedLink name="InboxPageWithId" params={{ id: conversationId }} className={css.linkButton}>
        View Message
      </NamedLink>
    </div>
  );
};

export default NotificationNewMessage;
