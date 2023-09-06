import React, { useEffect, useState } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { InlineTextButton, Modal, Reviews, PrimaryButton, ReviewModal } from '../../components';
import { truncateString } from '../../util/data';
import { submitReview, fetchReviews } from './SectionReviews.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { manageDisableScrolling } from '../../ducks/UI.duck';

import css from './SectionReviews.module.css';

const SectionReviews = props => {
  const {
    fetchReviewsError,
    reviews,
    submitReviewInProgress,
    submitReviewError,
    reviewSubmitted,
    onManageDisableScrolling,
    providerDisplayName,
    listingId,
    onSubmitReview,
    onFetchReviews,
    currentUser,
  } = props;

  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleReviewSubmit = values => {
    const { reviewRating, reviewContent } = values;
    onSubmitReview(reviewRating, reviewContent, listingId);
  };

  useEffect(() => {
    if (listingId) {
      onFetchReviews(listingId);
    }
  }, [listingId]);

  const reviewsError = (
    <h2 className={css.errorText}>
      <FormattedMessage id="ListingPage.reviewsError" />
    </h2>
  );

  const reviewCount = reviews?.length || 0;
  const pendingReviews = currentUser?.attributes.profile.metadata.pendingReviews || [];
  const canWriteReview = pendingReviews.includes(listingId);

  const previewReview = reviewCount ? reviews[0] : null;
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

  return reviewCount ? (
    <div className={css.sectionReviews}>
      <h2 className={css.reviewsHeading}>
        <FormattedMessage id="ListingPage.reviewsHeading" values={{ count: reviews?.length }} />
        <InlineTextButton
          className={css.seeMoreButton}
          onClick={() => setIsAllReviewsModalOpen(true)}
        >
          See All Reviews
        </InlineTextButton>
      </h2>
      {fetchReviewsError ? reviewsError : null}
      <Reviews reviews={shortenedReviews} />
      {canWriteReview ? (
        <PrimaryButton className={css.writeReviewButton} onClick={() => setIsReviewModalOpen(true)}>
          Write a Review
        </PrimaryButton>
      ) : null}
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
      <ReviewModal
        id={`ReviewBookingModal`}
        isOpen={isReviewModalOpen}
        onCloseModal={() => setIsReviewModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        onSubmitReview={handleReviewSubmit}
        revieweeName={providerDisplayName}
        reviewSent={reviewSubmitted}
        sendReviewInProgress={submitReviewInProgress}
        sendReviewError={submitReviewError}
      />
    </div>
  ) : null;
};

const mapStateToProps = state => {
  const {
    fetchReviewsError,
    fetchReviewsInProgress,
    reviews,
    submitReviewInProgress,
    submitReviewError,
    reviewSubmitted,
  } = state.SectionReviews;

  const { currentUser } = state.user;

  return {
    fetchReviewsError,
    fetchReviewsInProgress,
    reviews,
    submitReviewInProgress,
    submitReviewError,
    reviewSubmitted,
    currentUser,
  };
};

const mapDispatchToProps = {
  onSubmitReview: submitReview,
  onFetchReviews: fetchReviews,
  onManageDisableScrolling: manageDisableScrolling,
};

export default compose(connect(mapStateToProps, mapDispatchToProps))(SectionReviews);
