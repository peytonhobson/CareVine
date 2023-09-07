import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import { NamedLink } from '../../../components';

import css from './NotificationTemplates.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: 'var(--borderRadius)',
    transition: 'all 0.2s ease-in 0s !important',
    padding: '3rem',
    [theme.breakpoints.up('md')]: {
      maxWidth: '35rem',
    },
  },
}));

const NotificationNotifyForPayment = props => {
  const { notification } = props;

  const classes = useStyles();

  const { senderName } = notification.metadata;

  return (
    <div className={css.root}>
      <Card className={classes.card}>
        <h1 className={css.title}>
          <span className={css.noWrapText}>{senderName}</span> Wants to Book You!
        </h1>
        <p className={css.message}>
          You haven't completed the payout details portion of your account and are therefore unable
          to be booked. To set up your payout details and be booked by{' '}
          <span className={css.noWrapText}>{senderName}</span>, please click the button below.
        </p>
        <NamedLink name="StripePayoutPage" className={css.linkButton}>
          Setup Payout Details
        </NamedLink>
      </Card>
    </div>
  );
};

export default NotificationNotifyForPayment;
