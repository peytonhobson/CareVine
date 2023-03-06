import React, { useState } from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  GradientButton,
} from '../../components';
import { TopbarContainer } from '..';
import config from '../../config';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { connect } from 'react-redux';
import { FeedbackForm } from '../../forms';
import { feedbackEmail } from './FeedbackPage.duck';

import { compose } from 'redux';

import css from './FeedbackPage.module.css';

const FeedbackPageComponent = props => {
  const {
    intl,
    scrollingDisabled,
    currentUserListing,
    currentUserListingFetched,
    currentUser,
    onSendFeedbackEmail,
    sendFeedbackEmailInProgress,
    sendFeedbackEmailError,
    sendFeedbackEmailSuccess,
  } = props;

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const siteTitle = config.siteTitle;
  const schemaTitle = intl.formatMessage({ id: 'LandingPage.schemaTitle' }, { siteTitle });
  const schemaDescription = intl.formatMessage({ id: 'LandingPage.schemaDescription' });

  const handleSubmit = values => {
    onSendFeedbackEmail(values);
  };

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      description={schemaDescription}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: schemaDescription,
        name: schemaTitle,
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <h1 className={css.mainTitle}>Feedback</h1>
          {!showFeedbackForm ? (
            <>
              <div className={css.descriptionContainer}>
                <p>Welcome to CareVine's feedback page!</p>
                <p>
                  Whether you're a family member who has used our platform to find a caregiver for a
                  loved one or a caregiver who has provided services to a family, we want to hear
                  about your experience.
                </p>
                <p>
                  If you have encountered any issues or problems while using our platform, please
                  let us know so that we can address them promptly. We also welcome any suggestions
                  for new features or improvements that you would like to see added to the platform.
                </p>
                <p>
                  Thank you for taking the time to share your feedback with us. We value your input
                  and are committed to making our platform the best it can be for all our users.
                </p>
              </div>
              <div className={css.continueButtonContainer}>
                <GradientButton onClick={() => setShowFeedbackForm(true)}>Continue</GradientButton>
              </div>
            </>
          ) : (
            <div className={css.feedbackFormContainer}>
              <FeedbackForm
                onSubmit={handleSubmit}
                className={css.feedbackFormRoot}
                sendFeedbackEmailInProgress={sendFeedbackEmailInProgress}
                sendFeedbackEmailError={sendFeedbackEmailError}
                sendFeedbackEmailSuccess={sendFeedbackEmailSuccess}
              />
            </div>
          )}
        </LayoutWrapperMain>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing, currentUserListingFetched } = state.user;
  const {
    sendFeedbackEmailInProgress,
    sendFeedbackEmailError,
    sendFeedbackEmailSuccess,
  } = state.FeedbackPage;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    sendFeedbackEmailInProgress,
    sendFeedbackEmailError,
    sendFeedbackEmailSuccess,
  };
};

const mapDispatchToProps = dispatch => ({
  onSendFeedbackEmail: feedback => dispatch(feedbackEmail(feedback)),
});

const FeedbackPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(FeedbackPageComponent);

export default FeedbackPage;
