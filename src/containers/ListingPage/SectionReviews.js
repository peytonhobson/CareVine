import React, { useState } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { InlineTextButton, Modal, Reviews } from '../../components';
import { truncateString } from '../../util/data';

import css from './ListingPage.module.css';

const SectionReviews = props => {
  const { reviews, fetchReviewsError, onManageDisableScrolling, providerDisplayName } = props;

  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);

  const reviewsError = (
    <h2 className={css.errorText}>
      <FormattedMessage id="ListingPage.reviewsError" />
    </h2>
  );

  const previewReview = reviews.length > 0 ? reviews[0] : null;
  const shortenedReviews = previewReview
    ? [
        {
          ...previewReview,
          attributes: {
            ...previewReview.attributes,
            content: truncateString(previewReview.attributes.content, 100),
          },
        },
      ]
    : [];

  return (
    <div className={css.sectionReviews}>
      <h2 className={css.reviewsHeading}>
        <FormattedMessage id="ListingPage.reviewsHeading" values={{ count: reviews.length }} />
        <InlineTextButton
          className={css.seeMoreButton}
          onClick={() => setIsAllReviewsModalOpen(true)}
        >
          See All Reviews
        </InlineTextButton>
      </h2>
      {fetchReviewsError ? reviewsError : null}
      <Reviews reviews={shortenedReviews} />
      <Modal
        id="ListingPage.allReviews"
        isOpen={isAllReviewsModalOpen}
        onClose={() => setIsAllReviewsModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        usePortal
      >
        <p className={css.modalTitle} style={{ textAlign: 'start' }}>
          {providerDisplayName}'s Reviews
        </p>
        <div className={css.allReviews}>
          <Reviews reviews={reviews} />
        </div>
      </Modal>
    </div>
  );
};

export default SectionReviews;
