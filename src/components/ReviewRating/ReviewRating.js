import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { IconReviewStar } from '../../components';
import { REVIEW_RATINGS } from '../../util/types';

// TODO: Allow partial stars
const ReviewRating = props => {
  const { className, rootClassName, reviewStarClassName, rating } = props;
  const classes = classNames(rootClassName, className);

  const stars = REVIEW_RATINGS;
  return (
    <span className={classes}>
      {stars.map(star => (
        <IconReviewStar
          key={`star-${star}`}
          className={reviewStarClassName}
          isFilled={star <= rating}
        />
      ))}
    </span>
  );
};

export default ReviewRating;
