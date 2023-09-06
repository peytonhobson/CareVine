import React from 'react';
import { createSlug } from '../../../util/urlHelpers';

import { makeStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import { NamedLink } from '../../../components';
import { userDisplayNameAsString } from '../../../util/data';

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

const NotificationListingOpened = props => {
  const { currentUser, listing } = props;

  const classes = useStyles();

  return (
    <div className={css.root}>
      <Card className={classes.card}>
        <h1 className={css.title}>Success!</h1>
        <p className={css.message}>
          Your profile listing has been posted on the marketplace and is now viewable by others.
        </p>
        <NamedLink
          className={css.linkButton}
          name="ListingPage"
          params={{
            slug: createSlug(userDisplayNameAsString(currentUser)),
            id: listing?.id.uuid ?? 'string',
          }}
        >
          <span>View Listing</span>
        </NamedLink>
      </Card>
    </div>
  );
};

export default NotificationListingOpened;
