import React from 'react';

import classNames from 'classnames';

import css from './BookingContainer.module.css';

const BookingContainer = props => {
  const { className, rootClassName, children, listing, currentUserListing, currentUser } = props;
  const classes = classNames(rootClassName || css.root, className);
  return <div className={classes}>{children}</div>;
};

export default BookingContainer;
