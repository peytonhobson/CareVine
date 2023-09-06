import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import { NamedLink } from '../../../components';
import classNames from 'classnames';

import css from './NotificationTemplates.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: 'var(--borderRadius)',
    transition: 'all 0.2s ease-in 0s !important',
    padding: '3rem',
    minWidth: 0,
    overflow: 'visible',
    [theme.breakpoints.up('md')]: {
      maxWidth: '35rem',
    },
  },
}));

const NotificationNewMessage = props => {
  const { notification } = props;

  const classes = useStyles();

  const { senderName, conversationId, previewMessage } = notification.metadata;

  return (
    <div className={css.root}>
      <Card className={classes.card}>
        <h1 className={css.title}>
          New Message from <span className={css.noWrapText}>{senderName}</span>
        </h1>
        <p className={classNames(css.message, '!text-secondary', '!mb-8')}>"{previewMessage}"</p>
        <p className={css.message}>
          To view this message and respond to {senderName}, click the button below.
        </p>
        <NamedLink
          name="InboxPageWithId"
          params={{ id: conversationId }}
          className={css.linkButton}
        >
          View Message
        </NamedLink>
      </Card>
    </div>
  );
};

export default NotificationNewMessage;
