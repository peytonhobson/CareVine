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
        <h1 className={css.title}>Listing Closed</h1>
        <p className={css.message}>
          Your CareVine listing has been closed and is no longer visible to other users on the
          platform.
        </p>
      </Card>
    </div>
  );
};

export default NotificationListingRemoved;
