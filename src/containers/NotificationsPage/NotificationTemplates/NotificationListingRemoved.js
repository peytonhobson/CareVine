import React from 'react';

import { NamedLink } from '../../../components';
import { makeStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';

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

const NotificationListingRemoved = props => {
  const { notification } = props;

  const classes = useStyles();

  return (
    <div className={css.root}>
      <Card className={classes.card}>
        <h1 className={css.title}>Listing Removed</h1>
        <p className={css.message}>
          Your CareVine listing has been removed and is no longer active. If this happened because
          your subscription was canceled, you can reactivate your subscription by clicking on the{' '}
          <strong>Reactivate</strong> button below.
        </p>
        <NamedLink name="SubscriptionsPage" className={css.linkButton}>
          Reactivate
        </NamedLink>
      </Card>
    </div>
  );
};

export default NotificationListingRemoved;
